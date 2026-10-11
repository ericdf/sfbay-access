# SFBA Bay Access Action Center — Implementation Specification

**Status:** Independent prototype for SFBA evaluation (not an official SFBA publication)  
**Implementation handoff:** Claude Code  
**Hosting:** GitHub Pages  
**Source document:** *San Francisco Boardsailing Association, The State of Recreational Access to the San Francisco Bay: 2026* (October 2026; supplied PDF)  
**Version:** 1.1 — October 11, 2026

## 1. Objective

Build a polished, mobile-first, **cross-recreation coalition** advocacy website that converts the SFBA report's findings into **specific, time-sensitive actions** that individuals can take. A visitor should be able to identify a relevant campaign, understand the requested policy outcome, and prepare a **personalized** public comment in a few minutes.

The intended audience includes open-water swimmers, windsurfers, kitesurfers, wingfoilers, kayakers, stand-up paddlers, rowers, sailors, anglers, beachgoers, and other shoreline users. Do not assume all users have the same access needs or agree on every policy proposal. The common cause is meaningful, safe, equitable access to the Bay.

The site is an **independently authored demonstration** submitted to SFBA for review. It must not impersonate SFBA or imply the organization has approved the site, campaign language, or public-comment recommendations.

### Success criteria

- The homepage makes the most important current actions obvious without requiring a visitor to read the report.
- The site welcomes swimmers and other non-board-sport users explicitly, and campaigns explain the distinct effects on relevant user groups without inventing impacts.
- Each active campaign names the decision-maker, requested outcome, deadline/status, supporting report pages, and an actionable submission route.
- A visitor can use **ChatGPT or Claude** to help draft a personal email/comment, without a paid AI subscription, site-owned API key, or user account on the Action Center. Free chatbot access may still require login and is subject to provider limits.
- Visitors can alternatively copy talking points and write without AI.
- Campaigns can be created, edited, retired, and reordered by modifying straightforward Markdown/front matter or YAML files.
- Site builds and deploys automatically to GitHub Pages and can be transferred to an SFBA-controlled repository later.

## 2. Scope

### MVP

1. Homepage: short purpose statement, urgent campaigns, report link, independent-prototype disclaimer.
2. Campaign detail pages: issue, impact, precise asks, supporting citations, decision-maker, verified action route, status, deadline, and last verification date.
3. **Personalize a comment** flow: ask which activities the visitor participates in (optional, multiple selections) and one or two optional questions about the visitor's experience; offer **Open in ChatGPT**, **Open in Claude**, **Copy AI prompt**, and **Write without AI**.
4. Source/report page explaining the report's role and linking to the original PDF; cite report page numbers on campaign pages.
5. About/maintenance page describing editorial ownership, how to report inaccuracies, and how the prototype might be adopted.
6. Lightweight documentation and automated validation for campaign content.

### Not in MVP

- User accounts, mailing lists, payment processing, petition signatures, visitor analytics, tracking pixels, AI API calls, backend, or automatic sending of email.
- Scraping government meeting calendars to infer dates.
- Presenting unverified dates or contact details as authoritative.
- A large searchable archive or CMS.

## 3. Editorial principles

- **Coalition first, not a single-sport identity.** Use inclusive names, headlines, navigation, and examples. The SFBA report is the starting evidence base, not a claim that SFBA speaks for swimmers or other organizations. Do not imply coalition endorsements without permission.
- **Shared goals, different needs.** Preserve differences between swimmers (safe entry/exit, water quality, beach continuity), paddlers/rowers (launch and landing), board sports (rigging and loading), and other users. Include a concern only when supported by the report or another identified source; otherwise frame it as a question for the visitor.
- **Action first, report second.** A campaign card answers: *What is at risk? What can I do? By when?*
- **Facts vs. advocacy.** Attribute factual findings and recommendations to the SFBA report; clearly label the site's suggested wording and editorial summaries.
- **Individual voices.** AI assists visitors in expressing their own experiences; it must not invent experiences, residence, affiliations, or technical expertise.
- **Accurate deadlines.** All dates and agency contacts must be verified against primary sources before a campaign becomes `active`.
- **No false authority.** Display “Independent prototype based on SFBA's 2026 report — not endorsed or operated by SFBA” prominently in the header or near the hero and in the footer. Do not use SFBA logos without permission.
- **Accessible without AI.** Every campaign includes clear talking points and a non-AI route.

## 4. Recommended technical architecture

Use **Astro** (static output) with TypeScript, content collections, and minimal client-side JavaScript. This is a recommendation, not a hard dependency; Claude Code may choose another small static generator if it can meet the same acceptance criteria. Prefer no React/Vue runtime.

- GitHub Pages deployment through GitHub Actions on push to `main`.
- Base URL configurable for `username.github.io/repository/` now and custom domain later. All internal paths and assets must work under a non-root base path.
- Campaigns stored in typed content files (e.g., `src/content/campaigns/*.md`), validated at build time.
- All user input stays in browser memory. No local storage unless explicitly justified; no server transmission by this site.
- Generate static HTML for campaign pages; use small JS only for prompt assembly, clipboard, and navigation.
- No external dependencies for fonts or icons unless necessary.
- SEO: descriptive titles, meta descriptions, canonical URLs, sitemap, social previews; add `noindex` to the unapproved prototype if desired and document how to remove it upon adoption.

### Suggested repository layout

```text
/
  README.md
  package.json
  astro.config.mjs
  .github/workflows/deploy.yml
  public/
    favicon.svg
  src/
    content/campaigns/
      berkeley-marina.md
      crown-beach.md
      golden-gate-fields.md
    components/
      CampaignCard.astro
      ActionComposer.astro
      SourceLink.astro
    layouts/BaseLayout.astro
    pages/
      index.astro
      campaigns/[slug].astro
      report.astro
      about.astro
    lib/
      prompt.ts
      campaign-validation.ts
  tests/
    prompt.test.ts
    campaigns.test.ts
```

## 5. Campaign content model

Prefer Markdown body for context and typed front matter for actionable metadata. Suggested fields:

```yaml
id: berkeley-marina
slug: berkeley-marina
title: Protect recreational access at Berkeley Marina
summary: Ask regulators to protect access and scrutinize proposed parking fees.
status: draft  # draft | active | closed | monitoring
priority: 1
issue_area: Berkeley Marina
agency: San Francisco Bay Conservation and Development Commission
decision_type: Permit review
verified_deadline: null  # ISO date or timestamp, only when verified
last_verified: null
verification_source_url: null
submission:
  type: none  # email | webform | meeting | none
  url: null
  email: null
  instructions: "Pending verification of current comment procedure"
asks:
  - Oppose authorization of paid recreational parking.
  - Review parking fees and ferry parking together, including cumulative effects.
  - Require credible recreational-use data and no net loss of recreational parking.
relevant_activities: [swimming, windsurfing, paddling, walking] # editorial tags; verify relevance
activity_impacts: {} # optional, source-supported per-activity impacts; never invent
source:
  report_title: The State of Recreational Access to the San Francisco Bay: 2026
  report_pages: [7, 8, 31] # verify against actual PDF pagination
  report_url: null # insert approved, stable public report URL
  additional_links: []
```

**Validation rules:** An `active` campaign must have at least one specific ask, an agency, an actionable and verified submission method, `last_verified`, and a primary-source verification link. If there is a deadline, it must be verified; do not fabricate one to fill the field. Missing dates display “Deadline not confirmed,” not “urgent” or an invented countdown. `closed` campaigns must not display action buttons inviting expired submissions. `draft` campaigns may appear in a preview environment but must not solicit public comments.

## 6. Initial campaign seeds

Populate these from the report, but **treat them as draft content until independently verified**. Report page numbers below are starting references; check PDF page labels during implementation.

### A. Berkeley Marina — top priority

**Report-derived asks:** Discourage BCDC from approving paid parking; evaluate parking and ferry proposals together; require reliable use data, a fully costed in-marina ferry alternative, fiscal accounting, and no net loss of recreational parking. The report also proposes that any parking-fee approval be a time-limited trial with independent monitoring and a sunset.

**Agency to verify:** BCDC for relevant permit proceedings; other decision-makers may apply to ferry funding or city policy. Do not imply a single agency controls all requests.

**Report:** Berkeley Marina section and 2026–27 priorities (report p. 31).

### B. Crown Beach, Alameda

**Report-derived asks:** Ensure storm-protection work preserves usable beach and water access, including for swimmers and other beach users where supported by evidence; secure permanent access ramps and sand nourishment rather than allowing emergency rock placement to become the permanent access solution. The report urges action before April; verify the year, project schedule, decision points, and agencies before publishing any deadline.

**Agencies to verify:** East Bay Regional Park District and other permitting/project authorities.

**Report:** Crown Beach section and p. 31.

### C. Golden Gate Fields / Racetrack

**Report-derived asks:** During park planning, map launch/landing zones, rigging and loading areas, and nearby long-duration parking; maintain interim access to Racetrack/Fleming Point; measure regional recreational use; seek SFBA participation in EBRPD planning.

**Agency to verify:** East Bay Regional Park District; identify actual comment and planning opportunities.

**Report:** Golden Gate Fields section (approximately pp. 9–10).

### Later campaigns

Richmond shoreline adaptation, Treasure Island access, regional sand nourishment, recreation standards in subregional shoreline adaptation plans, and improved measurement of demand. Do not launch all of these without a concrete current action.

**Important:** Dates in the October 2026 report, including October meetings or votes, may already be outdated when the site goes live. Never turn the report's historical calendar into an automatically current action list.

## 7. Visitor experience

### Homepage

- Headline: **Keep the Bay accessible to everyone.**
- One-paragraph explanation that decisions about parking, beaches, shoreline engineering, water access, and new parks affect swimmers, paddlers, board-sport participants, anglers, and other shoreline users differently. Avoid implying SFBA formally represents those groups.
- Primary section: **Take action now**, sorted by verified upcoming deadline then editorial priority. Each card shows title, concise stakes, specific ask, status, and “See how to help.”
- Secondary section: **What SFBA's report found**, with link to full report and the report's overarching priorities.
- Disclaimer that the site is an independent prototype.

### Campaign page

Order content for action rather than narrative:

1. Title and status, verified deadline if available.
2. **What we're asking for**: 2–4 specific bullets.
3. **Who can act**: agency/decision-maker, with source-verified contact or submission link.
4. **Make your voice heard**: personalized AI drafting or manual route.
5. **Why it matters**: short context, explicitly sourced.
6. **Read the evidence**: report citation/link and current primary-source links.
7. **Last checked** date and correction/reporting link.

## 8. Personalized comment composer — ChatGPT and Claude

This is a core feature. The Action Center **does not generate emails using an API**. It creates a complete, self-contained prompt from campaign data and optional user answers, then helps the visitor use a chatbot they choose.

### Input fields

- “How do you use this part of the Bay?” Optional multi-select: open-water swimming, windsurfing, kitesurfing, wingfoiling, kayaking, SUP, rowing, sailing, fishing, beach visits/walking, other; include an optional free-text field. Do not force users to identify with one sport.
- “How does this decision affect your access?” Optional textarea; encourage concrete details such as safe entry/exit, water quality, beach width, parking, unloading, launch space, and access for different abilities, without presuming any impact applies.
- “What would you like the decision-makers to understand?” Optional textarea.
- No required personal identifiers. Do not ask for a home address, phone number, or email address.
- Explain that anything entered into a third-party chatbot is subject to that provider's privacy practices.

### Buttons

1. **Continue in ChatGPT** — launch ChatGPT with the prompt prefilled **only if the URL scheme is tested and functioning**. Candidate: `https://chatgpt.com/?q=<encoded prompt>`. This is not a guaranteed public integration contract; verify behavior in desktop and mobile browsers, signed-in and signed-out flows. If not reliable, copy prompt and open `https://chatgpt.com/` with clear “Paste your copied prompt” instructions.
2. **Continue in Claude** — use a tested, documented Claude deep-link/prefill mechanism **only if one is available and verified**. Do **not** assume Claude accepts ChatGPT's `?q=` parameter. Default safe behavior: copy prompt to clipboard and open `https://claude.ai/`, with visible paste instructions. If clipboard permission fails, display a selectable prompt text area and a manual copy control.
3. **Copy prompt** — copies full prompt without opening a chatbot.
4. **Write without AI** — show agency contact information, talking points, and a simple editable outline; optionally open a `mailto:` link only for verified email recipients, with a short subject and no fabricated personal statements. If the agency requires a web form, link to that form instead.

**Avoid oversized deep links:** Browsers and providers may impose URL-length limits. Prefer clipboard transfer when the prompt is long; implement a configurable maximum URL length and fallback. A copy-first experience for both providers is acceptable if more reliable than deep links.

### Prompt construction requirements

Compose the prompt from campaign title, verified decision-maker, specific asks, source attribution, and the visitor's own optional answers. Never include hidden personal data or analytics identifiers. Sanitize/encode any values used in URLs; do not inject user input into `innerHTML`.

**Required prompt template:**

```text
You are helping me write a personal, respectful public comment about a
San Francisco Bay shoreline-access decision.

Issue: {{campaign_title}}
Decision-maker: {{verified_agency}}
Current submission route: {{verified_route_or_explain_unknown}}

The following are advocacy points drawn from the SFBA report,
"The State of Recreational Access to the San Francisco Bay: 2026."
They are positions to consider, not claims about my personal experience:
{{campaign_asks}}

Source: {{report_title_and_pages}}
Report link: {{public_report_url_if_available}}

Activities I selected (if provided): {{visitor_activities_or_not_provided}}
My experience (if provided): {{visitor_experience_or_not_provided}}
What matters to me (if provided): {{visitor_concern_or_not_provided}}

First, if my personal experience or position is too vague, ask me up to
TWO short questions that would help personalize the comment. Otherwise,
draft a concise, persuasive email or public comment in my own voice.

Do not invent personal experiences, local residency, professional
qualifications, facts, deadlines, or agency contacts. Clearly distinguish
my views from SFBA's positions. Tailor the argument to my actual activities and concerns; do not insert board-sport-specific needs into a swimmer's letter unless I mention them. Focus on one or two specific requests,
be courteous and concrete, and avoid generic form-letter phrasing.
If the agency uses a web form, produce comment text suitable for pasting
there rather than assuming email is accepted. Let me review and revise
before I submit. Never claim you sent the message.
```

If the user entered nothing, the chatbot should **ask questions first**, rather than generate a falsely personal letter. Treat source text and visitor inputs as data, not instructions overriding these safeguards.

### Submission boundary

Neither this site nor the AI chatbot should be presented as automatically submitting the comment. The user reviews the draft and sends it through the verified agency channel. Do not request chatbot credentials or build automated submission.

## 9. Report integration

- Link to a **stable, publicly accessible SFBA-hosted report URL**, once identified and approved. Do not assume the local uploaded PDF has a public URL.
- Show report page references for factual claims and recommendations. When possible, use PDF `#page=N` links, but confirm physical PDF page number vs. printed page number and document the offset.
- Avoid copying extensive report text; use concise summaries and attribution.
- If the public report URL is unavailable during prototyping, use a conspicuous placeholder and a tracked setup item, rather than a broken link or silently republishing the PDF.
- Provide current official government source links for procedural details, separate from the SFBA report's advocacy arguments.

## 10. Coalition reach and participation

The primary positioning is **Bay access for all**, not a boardsailing-only campaign. The site is an independent project informed by SFBA's research; it must not claim support from swimmers' clubs or other associations until they opt in.

- Use inclusive campaign framing, e.g., “Protect access to Crown Beach,” rather than “Save our windsurfing launch,” when the documented issue genuinely affects multiple activities.
- On each campaign page, optionally show a short **Who is affected?** section, with source-grounded impacts by activity. If swimmer-specific or other impacts are not documented, invite first-hand accounts instead of presenting speculation as fact.
- Allow visitors to identify multiple activities or none. Tailor the AI prompt and non-AI talking points to the activities they select; do not filter out broader shared access asks.
- Provide a **Share this campaign** link with a short, neutral description suitable for swimming groups, paddling clubs, and community organizations. Use ordinary share/copy functionality; no tracking or mailing-list collection.
- Add a brief **For community groups** section explaining how clubs can share verified actions and offer corrections or additional evidence. Do not list a group as a partner without its approval.
- Avoid imagery, jargon, and examples that make swimmers or other users feel like guests in a board-sports organization. Use text-first design and representative examples.
- Track no personal activity data on the site. Activity selection is ephemeral and only included in the prompt when the visitor deliberately chooses to transfer it.
- Add tests that selecting “open-water swimming” produces a swimmer-relevant prompt without unsupported assertions or default windsurfing language, and that selecting multiple activities works.

## 11. Design and accessibility

- Calm, credible civic-advocacy visual style; legible type, high contrast, restrained color, ample spacing.
- Mobile-first; responsive at 320px width and larger.
- Semantic headings, keyboard navigation, visible focus states, form labels, status messages announced to assistive technology, and accessible button names.
- Meet WCAG 2.2 AA where practicable; no content conveyed solely by color.
- Respect reduced-motion preferences.
- Avoid decorative imagery unless licensed and useful; the site should work well as a text-forward experience.
- Distinguish **verified open**, **monitoring**, **closed**, and **draft** campaign states using plain language, not just colored badges.

## 12. Privacy, security, and reliability

- No visitor accounts, backend, tracking, cookies, or site-side storage of personal experiences in MVP.
- Never transmit visitor text to SFBA or the site operator. Only send it to ChatGPT/Claude if the visitor explicitly chooses to paste or open it there.
- Warn visitors before sending their text to third-party AI services.
- Use safe DOM APIs (`textContent`, element creation) and `encodeURIComponent` for URLs; no unsafe HTML interpolation.
- External links use appropriate `rel` attributes when opened in new tabs.
- Provide robust clipboard fallback for browsers that deny clipboard access.
- Do not use unsupported chatbot URL parameters without testing.
- Avoid stale calls to action: closed/expired campaigns must not invite submission to obsolete processes. Prefer a visible `monitoring` state when deadlines cannot be confirmed.

## 13. Testing and acceptance criteria

### Automated tests

- Content schema rejects active campaigns lacking verified agency/submission information.
- Campaign sorting handles undated campaigns and does not invent urgency.
- Prompt generation includes the correct campaign-specific asks, report attribution, optional activity selections, and optional visitor answers.
- Prompt generation with empty visitor fields explicitly requests personalization questions.
- URL encoding handles punctuation, Unicode, line breaks, and long text.
- Claude fallback always makes the prompt available for copying and never relies on an unverified prefill parameter.
- No user-entered text is inserted as executable HTML.
- Site builds with repository subpath and custom-domain/base-path configuration.

### Manual checks

- Desktop Safari, Chrome, Firefox; mobile Safari and Chrome.
- Test ChatGPT and Claude links logged in and logged out; record actual behavior and use fallback where necessary.
- Test clipboard allowed/denied, popup blocked, and JavaScript disabled (manual talking points must remain available).
- Keyboard-only and screen-reader spot checks.
- Every live action link leads to the correct agency and currently applicable proceeding.
- Verify all report links and PDF page anchors.

### Definition of done

- Public GitHub Pages preview URL works.
- Three seeded campaign pages render, with **draft/monitoring status until verified**.
- At least one campaign can be switched to active entirely through content edits after its action route is verified.
- Both ChatGPT and Claude paths work through tested deep links or reliable copy/open fallback.
- Visitors can complete the manual path without AI.
- README documents setup, editing, deployment, adoption/transfer, verification, and known limitations.
- No secrets or paid API keys required.

## 14. Implementation sequence for Claude Code

1. Scaffold Astro, static GitHub Pages deployment, base-path handling, and site shell.
2. Implement typed campaign content, validation, and the three seeded draft campaigns.
3. Build homepage, campaign pages, report page, and about/disclaimer.
4. Build the comment composer and shared prompt generator, including ChatGPT/Claude clipboard and deep-link fallbacks.
5. Add accessibility and automated tests.
6. Verify provider behavior in browsers where feasible; clearly document anything that requires manual verification.
7. Run production build and tests, inspect mobile/desktop rendering, and publish a working preview.
8. Produce a concise handoff with preview URL, editing instructions, unresolved factual verifications, and the steps SFBA would take to adopt the project.

## 15. Open items before public launch

- Locate and confirm SFBA's canonical public URL for the 2026 report and permission to link/quote.
- Confirm whether SFBA has any brand or attribution requirements; do not use logo prematurely.
- Verify current agency proceedings, comment channels, meeting dates, and deadlines for each campaign.
- Confirm which of the report's priorities SFBA would actually endorse as current campaign asks.
- Decide whether SFBA would prefer a repository transfer, an external link from sfba.org, or a custom subdomain.
- Verify actual ChatGPT and Claude browser behavior; keep clipboard/manual fallback regardless.

## 16. Instruction to Claude Code

**Build the MVP described above as a working, maintainable GitHub Pages site.** Do not stop at a design mockup or a prose plan. Make reasonable implementation decisions without requesting clarification for nonessential details. Do not invent live deadlines, official contacts, report URLs, or SFBA endorsement. Leave unresolved campaigns in draft/monitoring status and surface verification tasks in the README. Run the build and tests and report their results. Prioritize inclusive coalition reach (especially swimmers alongside board-sport users), a usable action workflow, reliable ChatGPT **and Claude** handoff, and easy editorial maintenance over feature breadth.
