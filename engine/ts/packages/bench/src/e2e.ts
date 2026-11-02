// End-to-end benchmark (the book's chapter “Benchmarking Viscosity end to end”): compile whole programs with
// Viscosity and compare them with the originals. Each version runs in a fresh
// Node process (several times), the programs time their own hot section, and
// the checksums must match exactly.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import os from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compile } from '../../core/src/index.ts';
import { jsPlugin } from '../../frontend-js/src/index.ts';

const here = dirname(fileURLToPath(import.meta.url));
const dir = join(here, '..', 'e2e');
const runs = Number(process.env.RUNS ?? 5);
const tmp = mkdtempSync(join(tmpdir(), 'vsc-e2e-'));
const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];

const rows: Record<string, unknown>[] = [];
for (const f of readdirSync(dir).filter((f) => f.endsWith('.js')).sort()) {
  const src = readFileSync(join(dir, f), 'utf8');
  const r = compile(src, jsPlugin());
  const orig = join(tmp, f);
  const comp = join(tmp, f.replace('.js', '.vsc.js'));
  writeFileSync(orig, src);
  writeFileSync(comp, r.code);
  const time = (file: string) => {
    const ms: number[] = [];
    let check = '';
    for (let i = 0; i < runs; i++) {
      const out = JSON.parse(execFileSync(process.execPath, [file], { encoding: 'utf8' }).trim().split('\n').pop()!);
      ms.push(out.ms);
      check = out.check;
    }
    return { ms: median(ms), check };
  };
  const a = time(orig);
  const b = time(comp);
  if (a.check !== b.check) throw new Error(`${f}: checksum mismatch ${a.check} vs ${b.check}`);
  const row = {
    program: f.replace('.js', ''),
    layouts: r.plan.collections.map((c) => `${c.collection.name}=${c.layout}`).join(' '),
    originalMs: Math.round(a.ms), viscosityMs: Math.round(b.ms), speedup: +(a.ms / b.ms).toFixed(2),
  };
  rows.push(row);
  console.log(`${row.program.padEnd(10)} ${row.layouts.padEnd(14)} ${String(row.originalMs).padStart(6)} ms → ${String(row.viscosityMs).padStart(6)} ms  ${row.speedup}×`);
}
const env = { node: process.version, v8: process.versions.v8, cpu: os.cpus()[0]?.model, date: new Date().toISOString(), runs, note: 'Median of N fresh-process runs of each program’s own timed section. Shared cloud VM.' };
const out = join(here, '..', 'results');
mkdirSync(out, { recursive: true });
const stamp = env.date.slice(0, 10);
writeFileSync(join(out, `e2e-node-${stamp}.json`), JSON.stringify({ env, rows }, null, 2) + '\n');
let md = `# End-to-end: original vs Viscosity (Node ${env.node}, V8 ${env.v8})\n\n${env.cpu}, ${env.date}. ${env.note}\n\n| program | layout chosen | original (ms) | Viscosity (ms) | speed-up |\n|---|---|---:|---:|---:|\n`;
for (const r of rows) md += `| ${r.program} | ${r.layouts} | ${r.originalMs} | ${r.viscosityMs} | ${r.speedup}× |\n`;
writeFileSync(join(out, `e2e-node-${stamp}.md`), md);
