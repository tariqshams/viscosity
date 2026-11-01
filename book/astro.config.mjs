import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';

// The book is MDX chapters (src/content/chapters/NNN-slug/index.mdx) with
// React islands for the interactive parts: review prompts, quizzes, the code
// runner and the diagrams that animate.
export default defineConfig({
  // Served at https://viscosity.dev/book/, beside the docs site at /.
  // Internal links go through href() in src/lib/url.ts.
  site: 'https://viscosity.dev',
  base: '/book',
  integrations: [react(), mdx()],
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
