import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { ACTIVITY_IDS } from './lib/activities';
import { STATUSES, SUBMISSION_TYPES, validateCampaign, type CampaignData } from './lib/campaign-validation';

const dateish = z.union([z.string(), z.date()]).nullable().optional();
const nullableString = z.string().nullable().optional();

const campaigns = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/campaigns' }),
  schema: z
    .object({
      title: z.string().min(5),
      summary: z.string().min(10),
      status: z.enum(STATUSES),
      priority: z.number().int().min(1),
      issue_area: z.string(),
      agency: z.string(),
      other_decision_makers: z.array(z.string()).default([]),
      decision_type: z.string(),
      verified_deadline: dateish,
      last_verified: dateish,
      verification_source_url: nullableString,
      reported_milestone: nullableString,
      submission: z.object({
        type: z.enum(SUBMISSION_TYPES),
        url: nullableString,
        email: z.string().email().nullable().optional(),
        instructions: nullableString,
      }),
      asks: z.array(z.string().min(5)),
      relevant_activities: z.array(z.enum(ACTIVITY_IDS)).default([]),
      activity_impacts: z
        .array(
          z.object({
            activities: z.array(z.enum(ACTIVITY_IDS)).min(1),
            text: z.string(),
            report_pages: z.array(z.number().int()).min(1),
          }),
        )
        .default([]),
      share_text: nullableString,
      source: z.object({
        report_pages: z.array(z.number().int()),
        additional_links: z.array(z.object({ label: z.string(), url: z.string().url() })).default([]),
      }),
    })
    .superRefine((data, ctx) => {
      for (const message of validateCampaign(data as CampaignData)) {
        ctx.addIssue({ code: 'custom', message });
      }
    }),
});

export const collections = { campaigns };
