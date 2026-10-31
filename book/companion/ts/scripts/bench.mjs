// Benchmarks the tree-walking interpreter against the bytecode VM on the
// corpus benchmark programs. One fresh process per (program, engine), best
// of N runs. Writes results/drip-bench-<date>.json and .md.
import { execFileSync } from 'node:child_process';
import { readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import os from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const corpus = join(here, '..', '..', 'corpus', 'benchmark');
const runs = Number(process.env.RUNS ?? 3);
const only = process.argv[2];
const programs = readdirSync(corpus).filter((f) => f.endsWith('.drip') && (!only || f.includes(only))).sort();

const timeOne = (engine, file) => {
  const code = `
    import { readFileSync } from 'node:fs';
    const src = readFileSync(${JSON.stringify(file)}, 'utf8');
    const mod = ${engine === 'vm' ? "await import('../src/vm/index.ts')" : "await import('../src/drip.ts')"};
    const t0 = performance.now();
    const r = ${engine === 'vm' ? 'mod.runVm(src)' : 'mod.run(src)'};
    const ms = performance.now() - t0;
    console.log(JSON.stringify({ ms, exit: r.exitCode, err: r.stderr.slice(0, 2) }));`;
  const out = execFileSync(process.execPath, ['--input-type=module', '-e', code], { cwd: here, encoding: 'utf8', timeout: 600000 });
  return JSON.parse(out.trim().split('\n').pop());
};

const rows = [];
for (const p of programs) {
  const file = join(corpus, p);
  const row = { program: p.replace('.drip', '') };
  for (const engine of ['tree', 'vm']) {
    let best = Infinity;
    for (let i = 0; i < runs; i++) {
      const r = timeOne(engine, file);
      if (r.exit !== 0) throw new Error(`${engine} ${p} failed: ${r.err.join(' ')}`);
      best = Math.min(best, r.ms);
    }
    row[engine] = Math.round(best);
  }
  row.speedup = +(row.tree / row.vm).toFixed(2);
  rows.push(row);
  console.log(`${row.program.padEnd(20)} tree ${String(row.tree).padStart(7)} ms   vm ${String(row.vm).padStart(7)} ms   ${row.speedup}×`);
}

const env = { node: process.version, v8: process.versions.v8, cpu: os.cpus()[0]?.model, date: new Date().toISOString(), runs, note: 'Best of N, each in a fresh process. Includes compile time. Shared cloud VM.' };
const dir = join(here, '..', 'results');
mkdirSync(dir, { recursive: true });
const stamp = env.date.slice(0, 10);
writeFileSync(join(dir, `drip-bench-${stamp}.json`), JSON.stringify({ env, rows }, null, 2) + '\n');
let md = `# Drip: tree-walker vs bytecode VM (${env.node}, V8 ${env.v8})\n\n${env.cpu}, ${env.date}. ${env.note}\n\n| program | tree-walker (ms) | VM (ms) | VM speed-up |\n|---|---:|---:|---:|\n`;
for (const r of rows) md += `| ${r.program} | ${r.tree} | ${r.vm} | ${r.speedup}× |\n`;
writeFileSync(join(dir, `drip-bench-${stamp}.md`), md);
