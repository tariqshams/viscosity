// Bundles the engine for the browser into the book (book/src/vendor), so the
// book can run the real compiler and still build on its own.
import { build } from 'esbuild';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
await build({
  entryPoints: [join(here, 'entry.ts')],
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: 'es2022',
  minify: true,
  outfile: join(here, '../../../../book/src/vendor/viscosity.js'),
  banner: { js: '// Viscosity engine (c) Tariq Shams, MIT. Bundled from engine/ts by packages/playground/build.mjs. Includes acorn (MIT) and sucrase (MIT).' },
  logLevel: 'info',
});
