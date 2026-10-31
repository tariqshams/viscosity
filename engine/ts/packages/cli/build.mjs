// Bundles the CLI into one file for npm (dist/viscosity.mjs), with acorn,
// acorn-walk and sucrase inlined, so the package has no runtime
// dependencies and runs on any Node >= 18 (no TypeScript stripping needed).
import { build } from 'esbuild';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
await build({
  entryPoints: [join(here, 'src/cli.ts')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node18',
  outfile: join(here, 'dist/viscosity.mjs'),
  banner: { js: '// Viscosity CLI (c) Tariq Shams, MIT. Bundled by packages/cli/build.mjs. Includes acorn and acorn-walk (MIT, Marijn Haverbeke and contributors) and sucrase (MIT, Alan Pierce and contributors).' },
  logLevel: 'info',
});
