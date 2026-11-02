// node scripts/compare_with_ts.mjs [mangled-count]
//
// Runs drip-rs (target/release/drip-rs, built first) and the TypeScript VM
// on every corpus program, benchmarks included, and checks that stdout,
// stderr and the exit code are identical, byte for byte. Then it does the
// same for `mangled-count` (default 2000) corpus programs with a token
// dropped, replaced or inserted, which mostly exercises compile errors;
// a mangled program that runs for more than two seconds is skipped.
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const crate = join(here, '..');
const ts = join(crate, '..', 'ts');
execFileSync('cargo', ['build', '--release', '--quiet'], { cwd: crate, stdio: 'inherit' });
const bin = join(crate, 'target', 'release', 'drip-rs');
const { listTests, CORPUS } = await import(join(ts, 'test', 'corpus.ts'));
const { runVm } = await import(join(ts, 'src', 'vm', 'index.ts'));

const tsText = (src) => {
  const r = runVm(src);
  const lines = (ls) => ls.map((l) => l + '\n').join('');
  return { stdout: lines(r.stdout), stderr: lines(r.stderr), code: r.exitCode };
};
const rsText = (file, timeout) => {
  const r = spawnSync(bin, [file], { encoding: 'utf8', timeout });
  if (r.error) return null; // timed out
  return { stdout: r.stdout, stderr: r.stderr, code: r.status };
};
// Programs that read the clock print different numbers in every run.
const usesClock = (src) => /clock\(\)/.test(src) && !/print clock\(\) [<>]/.test(src);

let compared = 0;
let differ = 0;
for (const t of listTests()) {
  const file = join(CORPUS, t);
  const src = readFileSync(file, 'utf8');
  if (usesClock(src)) continue;
  const a = tsText(src);
  const b = rsText(file, 600000);
  compared++;
  if (JSON.stringify(a) !== JSON.stringify(b)) {
    differ++;
    console.log(`DIFFERENT: ${t}\n  ts: ${JSON.stringify(a)}\n  rs: ${JSON.stringify(b)}`);
  }
}
console.log(`corpus: ${compared} programs compared, ${differ} differ`);

const count = Number(process.argv[2] ?? 2000);
let seed = 4242;
const rand = (n) => {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed % n;
};
const tests = listTests().filter((t) => !t.startsWith('benchmark/'));
const pieces = ['(', ')', '{', '}', '[', ']', ';', ',', '.', '..', '=', '+=', '!', 'fn', 'let', 'if', 'else', 'for',
  'in', 'while', 'class', 'extends', 'new', 'self', 'super', 'return', 'break', 'continue', 'print', 'x', '1', '"s"'];
const dir = mkdtempSync(join(tmpdir(), 'drip-compare-'));
let mangledDiffer = 0;
let skipped = 0;
for (let i = 0; i < count; i++) {
  const words = readFileSync(join(CORPUS, tests[rand(tests.length)]), 'utf8').split(/(\s+)/);
  const k = rand(words.length);
  const op = rand(3);
  if (op === 0) words[k] = '';
  else if (op === 1) words[k] = pieces[rand(pieces.length)];
  else words.splice(k, 0, ' ' + pieces[rand(pieces.length)] + ' ');
  const src = words.join('');
  if (usesClock(src)) continue;
  const file = join(dir, 'p.drip');
  writeFileSync(file, src);
  const b = rsText(file, 2000);
  if (!b) {
    skipped++;
    continue;
  }
  const a = tsText(src);
  if (JSON.stringify(a) !== JSON.stringify(b)) {
    mangledDiffer++;
    if (mangledDiffer <= 5) console.log(`DIFFERENT (mangled):\n${src}\n  ts: ${JSON.stringify(a)}\n  rs: ${JSON.stringify(b)}`);
  }
}
rmSync(dir, { recursive: true });
console.log(`mangled: ${count} programs, ${skipped} skipped (slow), ${mangledDiffer} differ`);
process.exit(differ || mangledDiffer ? 1 : 0);
