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
// Python programs (engine/ts/packages/frontend-python/test/corpus/*.py, the
// benchmark engine/ts/packages/bench/e2e-py/particles.py and
// tests/extra/*.py) are compiled with `pythonAuto: true`, as the TS Python
// differential test does, unless their header reads
// `# viscosity(no-auto):` (then annotations decide, as with the CLI's
// defaults). They are written as `<name>[.assume].py` plus the explain text.
//
// A handful of programs with refusals also get `<name>.frames.txt`: the
// explain text with code frames (`viscosity explain --frames`), compiled
// with the default options. The list is FRAMES below; the Rust parity test
// checks every `.frames.txt` it finds.
//
// For each profile in tests/profiles/<name>.json (a `viscosity profile`
// file: `{ "ps": { "maxLength": 10 } }`), program <name> is also compiled
// with that profile (`explain --profile`), with the default options, into
// `<name>.profile.js` (or `.py`) and `<name>.profile.explain.txt`.
//
// Usage (Node >= 22.18, which strips TypeScript types natively):
//   node scripts/gen_expected.mjs
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const rust = join(here, '..');
const ts = join(rust, '..', 'ts', 'packages');
const { compile, explain } = await import(join(ts, 'core', 'src', 'index.ts'));
const { jsPlugin } = await import(join(ts, 'frontend-js', 'src', 'index.ts'));
const { pythonPlugin } = await import(join(ts, 'frontend-python', 'src', 'index.ts'));

const sources = [
  { dir: join(ts, 'frontend-js', 'test', 'corpus'), prefix: 'corpus_' },
  { dir: join(ts, 'bench', 'e2e'), prefix: 'e2e_' },
  // Extra programs written for the port: features the corpus barely
  // touches (closures, switch, labels, destructuring, classes, exports,
  // directives, non-ASCII source, annotations, upper-bound sizes).
  { dir: join(rust, 'tests', 'extra'), prefix: 'extra_' },
];
const out = join(rust, 'tests', 'expected');
const FRAMES = new Set([
  'corpus_aliasing_identity', 'corpus_escapes_log', 'corpus_reassigned', 'corpus_shape_mismatch',
  'corpus_string_index', 'corpus_throw_from_loop', 'extra_destructure', 'extra_frames_columns',
  'extra_many_bailouts', 'extra_operand_uses', 'extra_phi_lines', 'extra_unicode_offsets',
  'pycorpus_escapes_print', 'pycorpus_len_of_element',
]);
let frames = 0;
const writeFrames = (base, r) => {
  if (!FRAMES.has(base)) return;
  writeFileSync(join(out, `${base}.frames.txt`), explain(r.plan, { frames: r.analysis.module.source }));
  FRAMES.delete(base);
  frames++;
};
mkdirSync(out, { recursive: true });
const profileDir = join(rust, 'tests', 'profiles');
const profiles = new Map(readdirSync(profileDir).filter((f) => f.endsWith('.json')).map((f) => [f.replace(/\.json$/, ''), JSON.parse(readFileSync(join(profileDir, f), 'utf8'))]));
let profiled = 0;
const writeProfiled = (base, ext, compileWith) => {
  const profile = profiles.get(base);
  if (!profile) return;
  const r = compileWith({ profile });
  writeFileSync(join(out, `${base}.profile.${ext}`), r.code);
  writeFileSync(join(out, `${base}.profile.explain.txt`), r.explain);
  profiles.delete(base);
  profiled++;
};

let n = 0;
for (const { dir, prefix } of sources) {
  for (const f of readdirSync(dir).filter((f) => f.endsWith('.js')).sort()) {
    const src = readFileSync(join(dir, f), 'utf8');
    const optIn = /\/\/ viscosity\(opt-in\):/.test(src);
    const base = prefix + f.replace(/\.js$/, '');
    for (const [suffix, extra] of [['', {}], ['.assume', { bounds: 'assume' }]]) {
      const r = compile(src, jsPlugin(), { ...(optIn ? { mode: 'opt-in' } : {}), ...extra });
      if (!suffix) writeFrames(base, r);
      if (!suffix) writeProfiled(base, 'js', (more) => compile(src, jsPlugin(), { ...(optIn ? { mode: 'opt-in' } : {}), ...more }));
      writeFileSync(join(out, `${base}${suffix}.js`), r.code);
      writeFileSync(join(out, `${base}${suffix}.explain.txt`), r.explain);
      n++;
    }
  }
}
const pySources = [
  { dir: join(ts, 'frontend-python', 'test', 'corpus'), prefix: 'pycorpus_', only: null },
  { dir: join(ts, 'bench', 'e2e-py'), prefix: 'pye2e_', only: ['particles.py'] },
  { dir: join(rust, 'tests', 'extra'), prefix: 'pyextra_', only: null },
];
for (const { dir, prefix, only } of pySources) {
  for (const f of readdirSync(dir).filter((f) => f.endsWith('.py') && (!only || only.includes(f))).sort()) {
    const src = readFileSync(join(dir, f), 'utf8');
    const pythonAuto = !/# viscosity\(no-auto\):/.test(src);
    const base = prefix + f.replace(/\.py$/, '');
    for (const [suffix, extra] of [['', {}], ['.assume', { bounds: 'assume' }]]) {
      const r = compile(src, pythonPlugin(), { pythonAuto, ...extra });
      if (!suffix) writeFrames(base, r);
      if (!suffix) writeProfiled(base, 'py', (more) => compile(src, pythonPlugin(), { pythonAuto, ...more }));
      writeFileSync(join(out, `${base}${suffix}.py`), r.code);
      writeFileSync(join(out, `${base}${suffix}.explain.txt`), r.explain);
      n++;
    }
  }
}
if (FRAMES.size) throw new Error(`FRAMES names unknown programs: ${[...FRAMES].join(', ')}`);
if (profiles.size) throw new Error(`tests/profiles names unknown programs: ${[...profiles.keys()].join(', ')}`);
console.log(`wrote ${n} fixture pairs, ${frames} code-frame fixtures and ${profiled} profiled fixture pairs to ${out}`);
