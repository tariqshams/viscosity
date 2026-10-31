// Bundles the CLI into one file for npm (dist/viscosity.mjs), with acorn,
// acorn-walk and sucrase inlined, so the package has no runtime
// dependencies and runs on any Node >= 18 (no TypeScript stripping needed).
import { build } from 'esbuild';
import { copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
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

// Ship the licences: Viscosity's own, and the full texts of everything the
// bundle inlines (MIT requires the notice to travel with the code).
const req = createRequire(import.meta.url);
copyFileSync(join(here, '../../../../LICENSE'), join(here, 'LICENSE'));
const parts = ['Third-party code bundled into dist/viscosity.mjs\n'];
for (const pkg of ['acorn', 'acorn-walk', 'sucrase']) {
  const dir = dirname(req.resolve(`${pkg}/package.json`));
  const { version, license } = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
  parts.push(`\n==== ${pkg} ${version} (${license}) ====\n\n${readFileSync(join(dir, 'LICENSE'), 'utf8').trim()}\n`);
}
writeFileSync(join(here, 'THIRD_PARTY_LICENSES.txt'), parts.join(''));
