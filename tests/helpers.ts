import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import type { CampaignData } from '../src/lib/campaign-validation';
import type { PromptCampaign } from '../src/lib/prompt';

export const CAMPAIGN_DIR = join(import.meta.dirname, '..', 'src', 'content', 'campaigns');

export function loadCampaignFiles(): { id: string; data: CampaignData }[] {
  return readdirSync(CAMPAIGN_DIR)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const text = readFileSync(join(CAMPAIGN_DIR, f), 'utf8');
      const match = text.match(/^---\n([\s\S]*?)\n---/);
      if (!match) throw new Error(`${f} has no front matter`);
      const data = parse(match[1]) as CampaignData;
      return { id: f.replace(/\.md$/, ''), data: { activity_impacts: [], ...data } };
    });
}

export const sampleCampaign: PromptCampaign = {
  title: 'Protect access to Example Beach',
  place: 'Example Beach',
  agency: 'Example Regional Park District',
  route: 'No verified submission route yet.',
  email: null,
  subjectPrefix: null,
  asks: ['Keep a usable beach and a defined route into the water.', 'Fund sand nourishment before spring.'],
  reportTitle: 'The State of Recreational Access to the San Francisco Bay: 2026',
  reportPages: 'pp. 11–13 (printed page numbers)',
  reportUrl: 'https://sfba.org/images/2026/SFBA_State_of_Access_2026_1.pdf',
  impacts: [
    { activities: ['swimming'], text: 'Swimmers make up a large share of visits.', pages: 'SFBA report, p. 8' },
    { activities: ['windsurfing', 'kitesurfing'], text: 'Rigging space has shrunk.', pages: 'SFBA report, p. 12' },
  ],
};
