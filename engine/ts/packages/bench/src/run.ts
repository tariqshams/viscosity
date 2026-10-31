// Orchestrates the baseline benchmark matrix and writes results/*.json and
// a markdown summary. Usage: node packages/bench/src/run.ts [--quick]
//   [--suite update-xy] [--sizes 1000,1000000]
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LAYOUTS, SUITES } from './suites.ts';

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const flag = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const quick = args.includes('--quick');
const sizes = (flag('--sizes') ?? '1000,100000,1000000').split(',').map(Number);
const suites = flag('--suite') ? [flag('--suite')!] : [...SUITES];

const rows: Record<string, unknown>[] = [];
for (const suite of suites) {
  for (const n of sizes) {
    for (const layout of LAYOUTS) {
      const out = execFileSync(
        process.execPath,
        [join(here, 'case.ts'), suite, layout, String(n), quick ? 'quick' : ''],
        { encoding: 'utf8' },
      );
      const row = JSON.parse(out);
      rows.push(row);
      console.log(
        `${suite.padEnd(14)} n=${String(n).padStart(8)} ${layout.padEnd(11)} ` +
          `${row.medianNsPerElement.toFixed(3).padStart(8)} ns/elem ` +
          `(p95 ${row.p95NsPerElement.toFixed(3)})`,
      );
    }
  }
}

const env = {
  engine: 'node',
  nodeVersion: process.version,
  v8Version: process.versions.v8,
  platform: `${os.platform()} ${os.release()}`,
  cpu: os.cpus()[0]?.model ?? 'unknown',
  cores: os.cpus().length,
  date: new Date().toISOString(),
  quick,
  note: 'Shared cloud VM: expect noise. Compare ratios, not absolute times.',
};

const resultsDir = join(here, '..', 'results');
mkdirSync(resultsDir, { recursive: true });
const stamp = env.date.slice(0, 10);
const file = join(resultsDir, `baseline-node-${stamp}${quick ? '-quick' : ''}.json`);
writeFileSync(file, JSON.stringify({ env, rows }, null, 2) + '\n');

// Markdown summary: speed of each layout relative to plain `aos`.
let md = `# Baseline results (${env.engine} ${env.nodeVersion}, V8 ${env.v8Version})\n\n`;
md += `${env.cpu}, ${env.cores} cores, ${env.date}. ${env.note}\n\n`;
md += 'Median ns per element (lower is better); `×` = speed-up vs `aos`.\n\n';
for (const suite of suites) {
  md += `## ${suite}\n\n| n | ${LAYOUTS.join(' | ')} |\n|---|${LAYOUTS.map(() => '---:').join('|')}|\n`;
  for (const n of sizes) {
    const get = (l: string) =>
      rows.find((r) => r.suite === suite && r.n === n && r.layout === l) as
        | { medianNsPerElement: number }
        | undefined;
    const base = get('aos')!.medianNsPerElement;
    const cells = LAYOUTS.map((l) => {
      const v = get(l)!.medianNsPerElement;
      return `${v.toFixed(2)} (${(base / v).toFixed(1)}×)`;
    });
    md += `| ${n.toLocaleString('en-US')} | ${cells.join(' | ')} |\n`;
  }
  md += '\n';
}
writeFileSync(file.replace(/\.json$/, '.md'), md);
console.log(`\nwrote ${file}`);
