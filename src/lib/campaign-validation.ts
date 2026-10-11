/**
 * Editorial rules for campaign content. These run at build time (via the
 * content collection schema) and in the test suite, so a campaign that breaks
 * them fails the build instead of going live.
 */

export const STATUSES = ['draft', 'monitoring', 'active', 'closed'] as const;
export type CampaignStatus = (typeof STATUSES)[number];

export const SUBMISSION_TYPES = ['email', 'webform', 'meeting', 'none'] as const;
export type SubmissionType = (typeof SUBMISSION_TYPES)[number];

export interface Submission {
  type: SubmissionType;
  url?: string | null;
  email?: string | null;
  instructions?: string | null;
  subject_prefix?: string | null;
}

export interface ActivityImpact {
  activities: string[];
  text: string;
  report_pages: number[];
}

export interface CampaignData {
  title: string;
  summary: string;
  status: CampaignStatus;
  priority: number;
  place?: string;
  issue_area: string;
  agency: string;
  other_decision_makers?: string[];
  decision_type: string;
  verified_deadline?: string | Date | null;
  last_verified?: string | Date | null;
  verification_source_url?: string | null;
  reported_milestone?: string | null;
  timing_note?: string | null;
  submission: Submission;
  asks: string[];
  relevant_activities?: string[];
  activity_impacts?: ActivityImpact[];
  source: {
    report_pages: number[];
    additional_links?: { label: string; url: string }[];
  };
}

const isBlank = (v: unknown) => v === null || v === undefined || String(v).trim() === '';

/** Returns a list of human-readable problems; empty means the campaign is valid. */
export function validateCampaign(c: CampaignData): string[] {
  const problems: string[] = [];

  if (!c.asks || c.asks.filter((a) => a.trim()).length === 0) {
    problems.push('Every campaign needs at least one specific ask.');
  }
  if (c.asks && c.asks.length > 6) {
    problems.push('Keep asks focused: no more than 6.');
  }
  if (isBlank(c.agency)) problems.push('Every campaign needs an agency/decision-maker.');

  if (c.submission.type === 'email' && isBlank(c.submission.email)) {
    problems.push('submission.type "email" requires submission.email.');
  }
  if ((c.submission.type === 'webform' || c.submission.type === 'meeting') && isBlank(c.submission.url)) {
    problems.push(`submission.type "${c.submission.type}" requires submission.url.`);
  }

  if (!isBlank(c.verified_deadline)) {
    if (Number.isNaN(new Date(c.verified_deadline as string).getTime())) {
      problems.push('verified_deadline must be an ISO date.');
    }
    if (isBlank(c.verification_source_url) || isBlank(c.last_verified)) {
      problems.push('A verified_deadline needs last_verified and verification_source_url.');
    }
  }

  if (c.status === 'active') {
    if (c.submission.type === 'none') {
      problems.push('An active campaign needs a verified submission route (email, webform or meeting).');
    }
    if (isBlank(c.last_verified)) problems.push('An active campaign needs last_verified.');
    if (isBlank(c.verification_source_url)) {
      problems.push('An active campaign needs verification_source_url (a primary source).');
    }
  }

  if (!c.source.report_pages || c.source.report_pages.length === 0) {
    problems.push('Cite at least one report page in source.report_pages.');
  }

  return problems;
}

/** Whether a campaign may invite visitors to submit comments right now. */
export function solicitsComments(c: Pick<CampaignData, 'status' | 'verified_deadline'>, now = new Date()): boolean {
  if (c.status !== 'active') return false;
  if (c.verified_deadline && new Date(c.verified_deadline).getTime() < now.getTime()) return false;
  return true;
}

/** True when an active campaign's verified deadline has passed (treat like closed). */
export function isExpired(c: Pick<CampaignData, 'status' | 'verified_deadline'>, now = new Date()): boolean {
  return c.status === 'active' && !!c.verified_deadline && new Date(c.verified_deadline).getTime() < now.getTime();
}

const STATUS_RANK: Record<CampaignStatus, number> = { active: 0, monitoring: 1, draft: 2, closed: 3 };

/**
 * Sort for "Take action now": open, verified campaigns first, soonest verified
 * deadline first; undated campaigns follow, ordered by editorial priority.
 * Never invents urgency for campaigns without a verified deadline.
 */
export function sortCampaigns<T extends { data: CampaignData }>(items: T[], now = new Date()): T[] {
  const rank = (c: CampaignData) => (isExpired(c, now) ? STATUS_RANK.closed : STATUS_RANK[c.status]);
  const deadline = (c: CampaignData) =>
    c.status === 'active' && c.verified_deadline && !isExpired(c, now)
      ? new Date(c.verified_deadline).getTime()
      : Number.POSITIVE_INFINITY;
  return [...items].sort((a, b) => {
    const ra = rank(a.data);
    const rb = rank(b.data);
    if (ra !== rb) return ra - rb;
    const da = deadline(a.data);
    const db = deadline(b.data);
    if (da !== db) return da - db;
    if (a.data.priority !== b.data.priority) return a.data.priority - b.data.priority;
    return a.data.title.localeCompare(b.data.title);
  });
}

export const STATUS_LABELS: Record<CampaignStatus, { short: string; long: string }> = {
  active: {
    short: 'Open for comment',
    long: 'Open for comment. Write now: the decision-maker and how to reach them are below.',
  },
  monitoring: {
    short: 'Monitoring',
    long: 'Monitoring. No comment opportunity has been confirmed yet. Details below are not yet verified.',
  },
  draft: {
    short: 'Draft (not verified)',
    long: 'Draft. Details have not been verified. This page is not collecting public comments.',
  },
  closed: {
    short: 'Closed',
    long: 'Closed. This comment opportunity has ended. Please do not submit comments through the old process.',
  },
};
