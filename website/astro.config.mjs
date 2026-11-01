import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// viscosity.dev: how to USE Viscosity. How it WORKS is the book.
export default defineConfig({
  site: 'https://viscosity.dev',
  integrations: [
    starlight({
      title: 'Viscosity',
      description: 'An automatic data-layout optimizer for JavaScript, TypeScript and Python, by Tariq Shams.',
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/tariqshams/viscosity' }],
      customCss: ['./src/styles/theme.css'],
      sidebar: [
        { label: 'Start here', items: ['start/introduction', 'start/install', 'start/quick-start'] },
        { label: 'Guides', items: ['guides/how-it-decides', 'guides/explain', 'guides/annotations', 'guides/bounds', 'guides/profiling', 'guides/typescript', 'guides/python', 'guides/limitations'] },
        { label: 'Reference', items: ['reference/cli', 'reference/options', 'reference/errors', 'reference/plugin-api', 'reference/layouts'] },
        { label: 'Project', items: ['project/benchmarks', 'project/contributing', 'project/credits', { label: 'The book (how it works)', link: 'https://viscosity-book.vercel.app' }] },
      ],
      head: [{ tag: 'meta', attrs: { name: 'author', content: 'Tariq Shams' } }],
      credits: false,
    }),
  ],
});
