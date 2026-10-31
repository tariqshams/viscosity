#!/usr/bin/env node
// Generates the TS↔Rust parity fixtures.
//
// For every corpus program (engine/ts/packages/frontend-js/test/corpus/*.js)
// and every end-to-end benchmark (engine/ts/packages/bench/e2e/*.js), run the
// TypeScript reference compiler and write
//
//   tests/expected/<name>.js            the compiled JavaScript
//   tests/expected/<name>.explain.txt   the `viscosity explain` text
//
// plus a `<name>.assume.*` variant compiled with `bounds: 'assume'`, which
// exercises the unchecked emit paths. Corpus files whose header reads
// `// viscosity(opt-in): ...` are compiled in opt-in mode, exactly as the TS
// differential test does. The Rust parity test (tests/parity.rs) recompiles
// each source and compares byte for byte.
//
// Usage (Node >= 22.18, which strips TypeScript types natively):
//   node scripts/gen_expected.mjs
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const rust = join(here, '..');
const ts = join(rust, '..', 'ts', 'packages');
const { compile } = await import(join(ts, 'core', 'src', 'index.ts'));
const { jsPlugin } = await import(join(ts, 'frontend-js', 'src', 'index.ts'));

const sources = [
  { dir: join(ts, 'frontend-js', 'test', 'corpus'), prefix: 'corpus_' },
  { dir: join(ts, 'bench', 'e2e'), prefix: 'e2e_' },
  // Extra programs written for the port: features the corpus barely
  // touches (closures, switch, labels, destructuring, classes, exports,
  // directives, non-ASCII source, annotations, upper-bound sizes).
  { dir: join(rust, 'tests', 'extra'), prefix: 'extra_' },
];
const out = join(rust, 'tests', 'expected');
mkdirSync(out, { recursive: true });

let n = 0;
for (const { dir, prefix } of sources) {
  for (const f of readdirSync(dir).filter((f) => f.endsWith('.js')).sort()) {
    const src = readFileSync(join(dir, f), 'utf8');
    const optIn = /\/\/ viscosity\(opt-in\):/.test(src);
    const base = prefix + f.replace(/\.js$/, '');
    for (const [suffix, extra] of [['', {}], ['.assume', { bounds: 'assume' }]]) {
      const r = compile(src, jsPlugin(), { ...(optIn ? { mode: 'opt-in' } : {}), ...extra });
      writeFileSync(join(out, `${base}${suffix}.js`), r.code);
      writeFileSync(join(out, `${base}${suffix}.explain.txt`), r.explain);
      n++;
    }
  }
}
console.log(`wrote ${n} fixture pairs to ${out}`);
