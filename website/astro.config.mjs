import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// viscosity.dev: how to USE Viscosity. How it WORKS is the book, served from
// the same site at /book/ (see ../scripts/build_site.sh).

// Always dark: runs before paint, so there is no flash of a light theme.
const forceDark = `document.documentElement.dataset.theme='dark';try{localStorage.setItem('starlight-theme','dark')}catch(e){}`;

export default defineConfig({
  site: 'https://viscosity.dev',
  // The landing page imports the committed benchmark matrix from ../engine.
  vite: { server: { fs: { allow: ['..'] } } },
  integrations: [
    starlight({
      title: 'Viscosity',
      description: 'The first automatic, ahead-of-time Array of Structures to Structures of Arrays compiler, starting with JavaScript and TypeScript. By Tariq Shams.',
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/tariqshams/viscosity' }],
      customCss: ['./src/styles/theme.css'],
      components: {
        ThemeSelect: './src/components/ThemeSelect.astro',
        Hero: './src/components/Hero.astro',
      },
      sidebar: [
        { label: 'Start here', items: ['start/introduction', 'start/install', 'start/quick-start'] },
        { label: 'Guides', items: ['guides/how-it-decides', 'guides/explain', 'guides/annotations', 'guides/bounds', 'guides/profiling', 'guides/typescript', 'guides/python', 'guides/limitations'] },
        { label: 'Reference', items: ['reference/cli', 'reference/options', 'reference/errors', 'reference/plugin-api', 'reference/layouts'] },
        { label: 'Project', items: ['project/benchmarks', 'project/contributing', 'project/credits', { label: 'The book (how it works)', link: '/book/' }] },
      ],
      head: [
        { tag: 'script', content: forceDark },
        { tag: 'meta', attrs: { name: 'author', content: 'Tariq Shams' } },
        { tag: 'meta', attrs: { name: 'color-scheme', content: 'dark' } },
        { tag: 'meta', attrs: { name: 'theme-color', content: '#000000' } },
      ],
      credits: false,
    }),
  ],
});
