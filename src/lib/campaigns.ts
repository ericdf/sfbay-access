/** Server-side helpers for rendering campaigns. */
import { getCollection, type CollectionEntry } from 'astro:content';
import { siteConfig } from './site-config';
import { sortCampaigns, solicitsComments } from './campaign-validation';
import type { PromptCampaign } from './prompt';

export type Campaign = CollectionEntry<'campaigns'>;

/** Campaigns visible on this build. Drafts appear only in prototype mode. */
export async function getVisibleCampaigns(): Promise<Campaign[]> {
  const all = await getCollection('campaigns');
  return sortCampaigns(all.filter((c) => siteConfig.prototypeMode || c.data.status !== 'draft'));
}

/** Join a site path onto the configured base, so links work under /repo/ and at a domain root. */
export function href(path = ''): string {
  const base = import.meta.env.BASE_URL.replace(/\/?$/, '/');
  return base + path.replace(/^\//, '');
}

export function formatPages(pages: number[]): string {
  if (!pages.length) return '';
  const sorted = [...new Set(pages)].sort((a, b) => a - b);
  const ranges: string[] = [];
  let start = sorted[0];
  let prev = sorted[0];
  for (const p of [...sorted.slice(1), Number.NaN]) {
    if (p === prev + 1) {
      prev = p;
      continue;
    }
    ranges.push(start === prev ? `${start}` : `${start}–${prev}`);
    start = prev = p;
  }
  return `${sorted.length > 1 ? 'pp.' : 'p.'} ${ranges.join(', ')}`;
}

/** Link to a printed page of the report (PDF page = printed page + offset). */
export function reportPageUrl(printedPage: number): string | null {
  if (!siteConfig.report.url) return null;
  return `${siteConfig.report.url}#page=${printedPage + siteConfig.report.pdfPageOffset}`;
}

export function formatDate(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  const d = typeof value === 'string' ? new Date(`${value}`.length === 10 ? `${value}T12:00:00` : value) : value;
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'America/Los_Angeles' });
}

export function routeDescription(c: Campaign): string {
  const s = c.data.submission;
  if (!solicitsComments(c.data)) {
    return 'No verified submission route yet. Produce a draft only; I will not submit it until the route is confirmed.';
  }
  switch (s.type) {
    case 'email':
      return `Email to ${s.email}${s.subject ? `, subject line "${s.subject}"` : ''}${s.instructions ? ` (${s.instructions})` : ''}`;
    case 'webform':
      return `The agency's web comment form at ${s.url}${s.instructions ? ` (${s.instructions})` : ''}`;
    case 'meeting':
      return `Public comment at a meeting: ${s.url}${s.instructions ? ` (${s.instructions})` : ''}`;
    default:
      return 'No verified submission route yet.';
  }
}

export function toPromptCampaign(c: Campaign): PromptCampaign {
  const verified = solicitsComments(c.data);
  return {
    title: c.data.title,
    agency: verified ? c.data.agency : `${c.data.agency} (identified from the SFBA report; not yet independently verified)`,
    route: routeDescription(c),
    asks: c.data.asks,
    reportTitle: siteConfig.report.title,
    reportPages: `${formatPages(c.data.source.report_pages)} (printed page numbers)`,
    reportUrl: siteConfig.report.url,
    impacts: c.data.activity_impacts.map((i) => ({
      activities: i.activities,
      text: i.text,
      pages: `SFBA report, ${formatPages(i.report_pages)}`,
    })),
  };
}
