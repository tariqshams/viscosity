// node scripts/check_benchmarks.mjs [tree|vm]: run each benchmark once and
// check its output against its own `# expect:` comments, with timings.
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const dir = join(here, '..', '..', 'corpus', 'benchmark');
const { check } = await import('../test/corpus.ts');
const engines = process.argv[2] ? [process.argv[2]] : ['vm', 'tree'];
let failed = 0;
for (const engine of engines) {
  const runner = engine === 'vm' ? (await import('../src/vm/index.ts')).runVm : (await import('../src/drip.ts')).run;
  for (const f of readdirSync(dir).filter((f) => f.endsWith('.drip')).sort()) {
    const src = readFileSync(join(dir, f), 'utf8');
    const t0 = performance.now();
    const r = runner(src);
    const ms = Math.round(performance.now() - t0);
    const fails = check(src, r);
    if (fails.length) failed++;
    console.log(`${engine.padEnd(5)} ${f.padEnd(20)} ${String(ms).padStart(7)} ms  ${fails.length ? 'FAILED ' + fails.join('; ') : 'ok'}`);
  }
}
process.exit(failed ? 1 : 0);
