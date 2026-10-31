/** @type {import('tailwindcss').Config} */
const c = (v) => `rgb(var(--${v}) / <alpha-value>)`;
export default {
  darkMode: 'class',
  content: ['./src/**/*.{astro,ts,tsx,js,jsx,md,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: c('ink'), paper: c('paper'), panel: c('panel'), muted: c('muted'), line: c('line'),
        brand: c('brand'), accent: c('accent'), danger: c('danger'), safe: c('safe'), warn: c('warn'),
        // Field colours: the SAME field always gets the SAME colour in every diagram.
        f1: c('f1'), f2: c('f2'), f3: c('f3'), f4: c('f4'), f5: c('f5'), f6: c('f6'),
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        display: ['var(--font-display)', 'Georgia', 'serif'],
      },
      maxWidth: { reading: '42rem' },
    },
  },
  plugins: [],
};
