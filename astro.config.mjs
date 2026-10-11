// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Deployment target. Defaults suit https://ericdf.github.io/sfbay-access/.
// For a custom domain at the root: SITE_URL=https://example.org BASE_PATH=/
const site = process.env.SITE_URL ?? 'https://ericdf.github.io';
const base = process.env.BASE_PATH ?? '/sfbay-access';

export default defineConfig({
  site,
  base,
  outDir: process.env.OUT_DIR ?? './dist',
  trailingSlash: 'ignore',
  // Astro's compressor drops the space at line breaks before inline tags ("as<em>closed</em>").
  compressHTML: false,
  integrations: [sitemap()],
  build: { format: 'directory' },
});
