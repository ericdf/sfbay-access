/**
 * Site-wide settings. Editors normally only touch this file when the project
 * is adopted, the report URL changes, or chatbot behavior has been re-tested.
 */

export const siteConfig = {
  name: 'Bay Access Action Center',
  tagline: 'Keep the Bay accessible to everyone.',

  /** Shown in the header and footer on every page. Do not remove before SFBA approval. */
  disclaimer:
    "Independent prototype based on SFBA's 2026 report — not endorsed or operated by SFBA",

  /**
   * Prototype mode:
   * - adds `noindex` so search engines don't list the unapproved site
   * - shows draft campaigns (clearly labeled) so reviewers can see them
   * - lets reviewers try the comment composer on unverified campaigns in a
   *   labeled "practice" mode that tells visitors not to submit anything
   * Set PROTOTYPE_MODE=false at build time (or change the default) on adoption.
   */
  prototypeMode: process.env.PROTOTYPE_MODE !== 'false',

  /** Where people report inaccuracies. */
  correctionsUrl: 'https://github.com/ericdf/sfbay-access/issues/new',
  repoUrl: 'https://github.com/ericdf/sfbay-access',
  /** Base for "Edit on GitHub" links; GitHub forks and opens a pull request for the visitor. */
  editBaseUrl: 'https://github.com/ericdf/sfbay-access/edit/main/',

  report: {
    title: 'The State of Recreational Access to the San Francisco Bay: 2026',
    publisher: 'San Francisco Boardsailing Association (SFBA)',
    date: 'October 2026',
    /** Public, SFBA-hosted copy of the report. Permission to link/quote is an open item. */
    url: 'https://sfba.org/images/2026/SFBA_State_of_Access_2026_1.pdf' as string | null,
    /**
     * Campaign files cite the page numbers printed in the report's footer.
     * The PDF's first page is an unnumbered cover, so PDF page = printed page + 1.
     * Verified against the October 2026 PDF (34 PDF pages, printed pages 1–33).
     */
    pdfPageOffset: 1,
  },

  chatbots: {
    /**
     * ChatGPT `?q=` prefill is not a documented public contract. Leave this false
     * until it has been tested on desktop and mobile, signed in and signed out
     * (see README → "Verifying chatbot behavior"). The prompt is always copied
     * to the clipboard either way.
     */
    chatgptPrefill: false,
    chatgptUrl: 'https://chatgpt.com/',
    /** Claude has no verified prefill parameter: copy, then open. */
    claudeUrl: 'https://claude.ai/new',
    /** Gemini has no verified prefill parameter either: copy, then open. */
    geminiUrl: 'https://gemini.google.com/app',
    /** Deep links longer than this fall back to copy-and-open. */
    maxPrefillUrlLength: 6000,
  },
} as const;

export type SiteConfig = typeof siteConfig;
