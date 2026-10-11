import { describe, expect, it } from 'vitest';
import {
  isExpired,
  solicitsComments,
  sortCampaigns,
  validateCampaign,
  type CampaignData,
} from '../src/lib/campaign-validation';
import { loadCampaignFiles } from './helpers';

const files = loadCampaignFiles();
const berkeley = files.find((f) => f.id === 'berkeley-marina')!.data;

const verifiedRoute: Partial<CampaignData> = {
  status: 'active',
  last_verified: '2026-10-11',
  verification_source_url: 'https://www.bcdc.ca.gov/example-notice',
  submission: { type: 'email', email: 'comments@example.gov', url: null, instructions: null },
};

describe('seeded campaign content', () => {
  it('includes the three seeded campaigns', () => {
    expect(files.map((f) => f.id).sort()).toEqual(['berkeley-marina', 'crown-beach', 'golden-gate-fields']);
  });

  it.each(files.map((f) => [f.id, f.data] as const))('%s: list fields are plain strings', (_id, data) => {
    for (const v of [...data.asks, ...(data.other_decision_makers ?? [])]) expect(typeof v).toBe('string');
  });

  it.each(files.map((f) => [f.id, f.data] as const))('%s passes validation', (_id, data) => {
    expect(validateCampaign(data)).toEqual([]);
  });

  it.each(files.map((f) => [f.id, f.data] as const))('%s: active only with a verified route', (_id, data) => {
    if (data.status === 'active') {
      expect(data.submission.type).not.toBe('none');
      expect(data.last_verified).toBeTruthy();
      expect(data.verification_source_url).toMatch(/^https:/);
    } else {
      expect(solicitsComments(data)).toBe(false);
    }
  });

  it.each([
    ['berkeley-marina', 'publiccomment@bcdc.ca.gov'],
    ['crown-beach', 'clerkoftheboard@ebparks.org'],
    ['golden-gate-fields', 'clerkoftheboard@ebparks.org'],
  ])('%s is open now with a verified email route', (id, email) => {
    const c = files.find((f) => f.id === id)!.data;
    expect(c.status).toBe('active');
    expect(c.submission.email).toBe(email);
    expect(solicitsComments(c)).toBe(true);
  });

  it('golden-gate-fields is active with the EBRPD clerk route', () => {
    const ggf = files.find((f) => f.id === 'golden-gate-fields')!.data;
    expect(ggf.status).toBe('active');
    expect(ggf.submission.email).toBe('clerkoftheboard@ebparks.org');
    expect(ggf.verified_deadline ?? null).toBeNull(); // agenda not yet posted
  });

  it.each(files.map((f) => [f.id, f.data] as const))('%s cites report pages inside the report (1–33)', (_id, data) => {
    for (const p of [...data.source.report_pages, ...(data.activity_impacts ?? []).flatMap((i) => i.report_pages)]) {
      expect(p).toBeGreaterThanOrEqual(1);
      expect(p).toBeLessThanOrEqual(33);
    }
  });
});

describe('validation rules', () => {
  it('rejects an active campaign without a verified submission route', () => {
    const problems = validateCampaign({
      ...berkeley,
      status: 'active',
      submission: { type: 'none' },
      last_verified: null,
      verification_source_url: null,
    });
    expect(problems.join(' ')).toMatch(/verified submission route/);
    expect(problems.join(' ')).toMatch(/last_verified/);
    expect(problems.join(' ')).toMatch(/verification_source_url/);
  });

  it('rejects an active campaign without an agency or asks', () => {
    const problems = validateCampaign({ ...berkeley, ...verifiedRoute, agency: ' ', asks: [] } as CampaignData);
    expect(problems.join(' ')).toMatch(/agency/);
    expect(problems.join(' ')).toMatch(/specific ask/);
  });

  it('can switch a seeded campaign to active purely through content edits once verified', () => {
    const active = { ...berkeley, ...verifiedRoute } as CampaignData;
    expect(validateCampaign(active)).toEqual([]);
    expect(solicitsComments(active)).toBe(true);
  });

  it('requires a source for any verified deadline', () => {
    const problems = validateCampaign({
      ...berkeley,
      verified_deadline: '2026-11-01',
      last_verified: null,
      verification_source_url: null,
    });
    expect(problems.join(' ')).toMatch(/verified_deadline needs/);
  });

  it('requires an email address or URL that matches the submission type', () => {
    expect(validateCampaign({ ...berkeley, submission: { type: 'email', email: null } }).join(' ')).toMatch(/requires submission.email/);
    expect(validateCampaign({ ...berkeley, submission: { type: 'webform', url: null } }).join(' ')).toMatch(/requires submission.url/);
  });

  it('stops soliciting once a verified deadline has passed', () => {
    const active = { ...berkeley, ...verifiedRoute, verified_deadline: '2026-10-01' } as CampaignData;
    const now = new Date('2026-10-11T12:00:00Z');
    expect(isExpired(active, now)).toBe(true);
    expect(solicitsComments(active, now)).toBe(false);
  });

  it('never solicits comments for draft, monitoring or closed campaigns', () => {
    for (const status of ['draft', 'monitoring', 'closed'] as const) {
      expect(solicitsComments({ ...berkeley, ...verifiedRoute, status } as CampaignData)).toBe(false);
    }
  });
});

describe('sortCampaigns', () => {
  const make = (title: string, extra: Partial<CampaignData>) => ({
    data: { ...berkeley, title, priority: 5, verified_deadline: null, ...extra } as CampaignData,
  });
  const now = new Date('2026-10-11T12:00:00Z');

  it('puts active campaigns first, soonest verified deadline first, then priority', () => {
    const items = [
      make('monitor-p1', { status: 'monitoring', priority: 1 }),
      make('active-undated-p2', { ...verifiedRoute, priority: 2 }),
      make('active-late', { ...verifiedRoute, verified_deadline: '2026-12-01' }),
      make('active-soon', { ...verifiedRoute, verified_deadline: '2026-10-20' }),
      make('draft-p1', { status: 'draft', priority: 1 }),
      make('closed', { status: 'closed', priority: 1 }),
    ];
    expect(sortCampaigns(items, now).map((i) => i.data.title)).toEqual([
      'active-soon',
      'active-late',
      'active-undated-p2',
      'monitor-p1',
      'draft-p1',
      'closed',
    ]);
  });

  it('handles undated campaigns by priority without inventing urgency', () => {
    const items = [
      make('b', { status: 'monitoring', priority: 2 }),
      make('a', { status: 'monitoring', priority: 1 }),
      make('c', { status: 'monitoring', priority: 2 }),
    ];
    expect(sortCampaigns(items, now).map((i) => i.data.title)).toEqual(['a', 'b', 'c']);
  });

  it('treats an expired active campaign like a closed one', () => {
    const items = [
      make('expired', { ...verifiedRoute, verified_deadline: '2026-10-01', priority: 1 }),
      make('monitor', { status: 'monitoring', priority: 9 }),
    ];
    expect(sortCampaigns(items, now).map((i) => i.data.title)).toEqual(['monitor', 'expired']);
  });
});
