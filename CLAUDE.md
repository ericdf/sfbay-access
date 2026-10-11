# CLAUDE.md

Bay Access Action Center: Astro static site, deployed to GitHub Pages from `main`. The spec is `docs/SFBA_Action_Center_Implementation_Spec.md`. Setup and editing are covered in `README.md`.

## Commands

- `npm test`: unit tests
- `npm run test:build`: builds under `/sfbay-access/` and at `/`, then checks links
- `npm run build`: production build

Run both test commands before committing.

## Facts and verification

- Never invent deadlines, agency contacts, report URLs or endorsements. A campaign becomes `active` only after its submission route has been checked against an official source. Record `last_verified` and `verification_source_url` when you do.
- Report page numbers are the printed footer numbers (PDF page = printed + 1). The local copy is `reference/SFBA_State_of_Access_2026_1.pdf`, with extracted text in `reference/report.txt`. Both are git-ignored.
- `activity_impacts` must come from the report or another named source. If a group's impact isn't documented, leave it out.

## Writing: no AI giveaways

This applies to site copy, campaign files, README, commit messages and replies to the user.

**Cut throat-clearing.** Start with the point. Don't open with restatements, preambles or announcements ("Great question", "Let's dive in", "Here's the thing", "It's worth noting that", "In today's…"). Don't end with summaries of what you just said, offers of more help, or "I hope this helps".

**Banned words and phrases:** delve, crucial, vital, pivotal, robust, seamless, leverage (as a verb), empower, foster, navigate (figuratively), landscape (figuratively), realm, tapestry, testament, embark, journey (figuratively), unlock, elevate, streamline, game-changer, cutting-edge, ever-evolving, at the end of the day, in conclusion, it's important to note, plays a key role, a wide range of, exactly what, truly, incredibly, simply, rest assured.

**Banned constructions:**
- "Not X, but Y" / "It's not just X, it's Y" contrast framing.
- Reflexive groups of three ("clear, concise, and compelling"). Use the number of items the content actually has.
- Em dashes as the default connector. Use a period, comma, colon or parentheses. The spec-mandated disclaimer is the only em dash allowed in site copy.
- Rhetorical questions as transitions ("So what does this mean?").
- Hedge stacks ("may potentially", "could possibly").
- Bold-labeled bullet lists where plain sentences would do.
- Emoji in copy or commits.

**Do instead:** use short declarative sentences, concrete nouns, numbers with sources, and active voice. Name who decides what, and by when. Write the way a careful local reporter would.

**Check before finishing:** grep the changed text for the banned list (`rg -n -i "delve|crucial|robust|seamless|leverage|foster|navigate|landscape|exactly what|—" src README.md`) and rewrite any hits.
