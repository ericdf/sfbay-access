# Contributing

Pull requests are welcome, especially from people who use the shoreline: corrections, new sources, first-hand evidence and new campaigns.

## Quick fixes (no git needed)

Every campaign page has a **Fix it on GitHub** link. It opens the campaign's Markdown file in GitHub's editor. Make your change, click **Commit changes**, and GitHub forks the repository and opens a pull request for you.

## What reviewers check

- **Sources for every fact.** Dates, contacts and comment procedures need a link to the agency's own page, agenda or notice (`verification_source_url`). Report findings need printed page numbers (`report_pages`).
- **A route people can use today.** A campaign goes live only with a verified way to reach the decision-maker now. See "Every campaign asks for action now" in [CLAUDE.md](CLAUDE.md).
- **No invented impacts.** Add an `activity_impacts` entry only when a source documents it. First-hand accounts belong in comments to agencies, not in campaign facts.
- **No endorsements without permission.** Don't name a club or organization as a supporter unless it has agreed.
- **Plain writing.** Follow the writing rules in [CLAUDE.md](CLAUDE.md).

## Larger changes

See [README.md](README.md) for local setup, the campaign fields and the validation rules. Run `npm test` and `npm run test:build` before opening the pull request; CI runs both.
