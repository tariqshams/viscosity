import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import { REDIRECTS } from './src/data/redirects.js';

// The book is MDX chapters (src/content/chapters/NNN-slug/index.mdx) with
// React islands for the interactive parts: review prompts, quizzes, the code
// runner and the diagrams that animate.
export default defineConfig({
  // Served at https://viscosity.dev/book/, beside the docs site at /.
  // Internal links go through href() in src/lib/url.ts.
  site: 'https://viscosity.dev',
  base: '/book',
  integrations: [react(), mdx()],
  // Chapters that moved when new ones were inserted (scripts/renumber.mjs).
  // Static redirect pages, so they work on any host.
  // Astro adds the base to each source, but not to the destination.
  redirects: Object.fromEntries(Object.entries(REDIRECTS).map(([from, to]) => [from, `/book${to}`])),
  build: { format: 'directory' },
  trailingSlash: 'ignore',
  markdown: {
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      defaultColor: false,
      wrap: false,
    },
  },
  vite: { worker: { format: 'es' } },
});
