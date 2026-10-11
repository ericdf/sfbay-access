# Bay Access Action Center

**Independent prototype based on SFBA's 2026 report — not endorsed or operated by SFBA.**

A static, mobile-first site that turns findings from the San Francisco Boardsailing Association's report *The State of Recreational Access to the San Francisco Bay: 2026* into specific actions for anyone who uses the Bay: swimmers, paddlers, rowers, sailors, board sports, anglers and beach visitors. Visitors can draft a personal public comment with ChatGPT or Claude using their own account, or write one without AI. The site has no backend, no API keys, no accounts and no tracking.

- Live preview: <https://ericdf.github.io/sfbay-access/>
- Spec: [`docs/SFBA_Action_Center_Implementation_Spec.md`](docs/SFBA_Action_Center_Implementation_Spec.md)
- Report (SFBA-hosted): <https://sfba.org/images/2026/SFBA_State_of_Access_2026_1.pdf>

## Setup

Requires Node 22.12 or newer.

```sh
npm install
npm run dev        # http://localhost:4321/sfbay-access/
npm test           # unit tests (prompt, validation, sorting, composer DOM safety)
npm run test:build # builds under /sfbay-access/ and at a domain root, checks every internal link
npm run build      # production build in dist/
```

## Editing campaigns

Each campaign is one Markdown file in `src/content/campaigns/`. The front matter holds the actionable facts. The body holds the "Why it matters" summary.

| Field | Notes |
| --- | --- |
| `status` | `draft` (unverified; only shown in prototype mode, never collects comments), `monitoring` (being watched; no confirmed opportunity), `active` (verified and open), `closed` (ended; no action buttons). |
| `priority` | 1 = most important. Used to order campaigns that have no verified deadline. |
| `agency`, `other_decision_makers` | The primary decision-maker, plus anyone else involved. |
| `asks` | 1–6 specific requests. The first one appears on the homepage card. |
| `verified_deadline` | ISO date (`2026-11-15`). Only set it once confirmed in an official notice. Requires `last_verified` and `verification_source_url`. |
| `reported_milestone` | What the report said about timing. Shown clearly labeled as unverified report context, never as a deadline. |
| `submission` | `type: email \| webform \| meeting \| none`, plus `email` or `url` and `instructions`. |
| `relevant_activities` | Editorial tags. Activities with no documented impact get a "first-hand accounts welcome" note. |
| `activity_impacts` | Report-supported effects on particular activities, each with `report_pages`. **Never invent these.** Only impacts for activities the visitor selects are added to their prompt. |
| `source.report_pages` | The page numbers **printed in the report's footer** (PDF page = printed page + 1). |
| `source.additional_links` | Primary sources: agency notices, staff reports, agendas. |

**To retire a campaign**, set `status: closed` or delete the file. **To reorder**, change `priority`.

The build runs these rules (in `src/lib/campaign-validation.ts`) and fails if a campaign breaks them:

- Every campaign needs an agency, at least one ask and at least one report page.
- An `active` campaign needs a submission route (not `none`), `last_verified` and `verification_source_url`.
- A `verified_deadline` needs `last_verified` and `verification_source_url`.
- Once an active campaign's deadline passes, it's treated as closed automatically: no composer, no submission link.

### Making a campaign active (example)

After confirming, for example, BCDC's hearing notice for the Berkeley paid-parking permit:

```yaml
status: active
verified_deadline: 2026-11-20        # from the notice
last_verified: 2026-10-15            # the day you checked
verification_source_url: https://www.bcdc.ca.gov/…   # the notice itself
submission:
  type: email                        # or webform / meeting
  email: publiccomment@bcdc.ca.gov   # exactly as the notice gives it
  instructions: Reference the permit application number in the subject line.
```

Push to `main`. The campaign moves to **Take action now**, the composer leaves practice mode, and the prompt includes the verified route.

## Site settings

`src/lib/site-config.ts` contains:

- `prototypeMode` (or the `PROTOTYPE_MODE` env var): adds `noindex`, shows draft campaigns and lets reviewers try the composer in a clearly labeled practice mode on unverified campaigns. **Set `PROTOTYPE_MODE: 'false'` in `.github/workflows/deploy.yml` on adoption.** That removes `noindex`, hides drafts and limits the composer to verified `active` campaigns.
- `report.url` and `report.pdfPageOffset`.
- `chatbots`: hand-off behavior (see below).
- `correctionsUrl`: where "Report a correction" links go (currently GitHub Issues on this repo).

## Deployment (GitHub Pages)

`.github/workflows/deploy.yml` runs tests, then builds and deploys on every push to `main`.

One-time setup on GitHub: **Settings → Pages → Build and deployment → Source: "GitHub Actions"**.

### Custom domain later

1. In the workflow, set `SITE_URL: https://your.domain` and `BASE_PATH: /`.
2. Add a `public/CNAME` file containing the domain.
3. Add the domain under Settings → Pages and set up DNS as GitHub describes.

## Comment composer: how the AI hand-off works

The site never calls an AI API. It builds a self-contained prompt (`src/lib/prompt.ts`) from the campaign and the visitor's optional answers. The prompt uses the spec's required template, plus a line telling the chatbot to treat the inputs as data.

- **Continue in Claude**: copies the prompt and opens `https://claude.ai/new` in a new tab, then shows paste instructions. Claude has no verified prefill parameter, so the site doesn't use one.
- **Continue in ChatGPT**: same copy-and-open behavior by default. `chatbots.chatgptPrefill` turns on `https://chatgpt.com/?q=<prompt>` for prompts under `maxPrefillUrlLength`. It's **off** until manually tested (below). The prompt is copied to the clipboard either way.
- **Copy prompt**: copies without opening anything.
- If the clipboard is blocked, the full prompt opens in a selectable text box with instructions.
- **Write without AI**: talking points, report findings by activity, the verified route (or "not yet verified"), and an editable outline. It's rendered as static HTML, so it works without JavaScript. A `mailto:` link appears only for verified email routes.

Buttons are ordinary links (`target="_blank" rel="noopener noreferrer"`), so popup blockers don't interfere.

### Verifying chatbot behavior (manual)

Automated tests confirmed this in headless Chromium: clicking "Continue in Claude" opens `claude.ai/new`, the prompt is on the clipboard and the status message is announced. These checks still need a person, in desktop Safari/Chrome/Firefox and mobile Safari/Chrome:

| Check | Result |
| --- | --- |
| Claude: copy, open and paste, signed in | ☐ |
| Claude: signed out (login page, then paste after login) | ☐ |
| ChatGPT: copy, open and paste, signed in / signed out | ☐ |
| ChatGPT `?q=` prefill (temporarily set `chatgptPrefill: true`), signed in / signed out, desktop / mobile | ☐ |
| Clipboard denied (Firefox with permissions off; iOS) shows the manual copy box | ☐ |
| JavaScript disabled: talking points and outline still visible | ☐ |
| Keyboard-only run through the composer; VoiceOver/NVDA spot check | ☐ |

Only set `chatgptPrefill: true` if prefill works consistently, including signed out and on mobile.

## Unresolved verification items

No campaign is `active`. Every date and contact below comes from the report (sources consulted September 30, 2026) and has **not** been checked against primary sources.

- **Berkeley Marina** (`monitoring`): BCDC paid-parking hearing date and comment procedure ("anticipated … in the coming months"). Also the City of Berkeley ferry Final EIR/council schedule and MTC's decision on the $25M request.
- **Crown Beach** (`monitoring`): how the public can take part in EBRPD–City of Alameda winter storm planning, and any decision dates. Confirm which year "before April" refers to (presumably 2027).
- **Golden Gate Fields** (`draft`): the EBRPD board vote on the purchase agreement, reported for **October 20, 2026**. Check the agenda and how to comment *now*, since this may be the most time-sensitive item. Also the 2027–29 planning process.
- **Report pages**: verified against the October 2026 PDF (offset +1). Re-check if SFBA publishes a revised PDF.
- **Report link**: SFBA-hosted. Permission to link and quote still needs confirming with SFBA.
- **Agency links**: currently agency homepages, labeled "not a verified comment route." Replace them with specific notices when verifying.

## Adoption by SFBA

1. SFBA reviews the campaign wording and confirms which asks it endorses as current.
2. Transfer the repository (Settings → Transfer) to an SFBA-controlled account, or fork it. Update `repoUrl`/`correctionsUrl` in `site-config.ts`.
3. Decide on hosting: GitHub Pages under SFBA's account, a link from sfba.org, or a custom subdomain (see above).
4. Update the disclaimer text, the About page and any brand/attribution requirements. Don't add the SFBA logo without permission.
5. Set `PROTOTYPE_MODE: 'false'`.

## Known limitations

- Chatbot prefill/deep-link behavior can't be fully verified automatically. Copy-and-paste is the default.
- Free ChatGPT/Claude use may require signing in and is subject to provider limits.
- Social preview cards are text-only (no image).
- The local `reference/` folder (a cached copy of the report PDF and extracted text, used for page verification) is git-ignored and not republished.

## Project layout

```
src/content/campaigns/   campaign Markdown files
src/content.config.ts    content schema (wraps validation rules)
src/lib/                 prompt builder, validation/sorting, composer browser code, site config
src/components/          CampaignCard, ActionComposer, ManualRoute, SourceLink, ShareCampaign, StatusBadge
src/pages/               home, campaigns/[slug], report, about, 404
tests/                   vitest suites
scripts/check-build.mjs  base-path build and link checks
```
