// Profile-guided optimization (book chapter 109): run the ORIGINAL program
// with light instrumentation that records how big each candidate collection
// really gets, then feed those numbers to the cost model.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { analyze } from '../../core/src/index.ts';
import type { LanguagePlugin } from '../../core/src/plugin.ts';

export type Profile = Record<string, { maxLength: number }>;

export function instrument(source: string, plugin: LanguagePlugin): string {
  const lowered = plugin.lower(source);
  const a = analyze(lowered.module);
  const js = (lowered as unknown as { js: string }).js ?? source;
  const edits = a.collections
    .map((c) => ({ start: c.init.src!.start, end: c.init.src!.end, name: c.name }))
    .sort((x, y) => y.start - x.start);
  let out = js;
  for (const e of edits) {
    out = out.slice(0, e.start) + `__vsc_track(${JSON.stringify(e.name)}, ${out.slice(e.start, e.end)})` + out.slice(e.end);
  }
  const prelude = `
const __vsc_seen = [];
function __vsc_track(name, arr) { __vsc_seen.push([name, arr]); return arr; }
process.on('exit', () => {
  const p = {};
  for (const [n, a] of __vsc_seen) p[n] = { maxLength: Math.max(p[n]?.maxLength ?? 0, a.length) };
  require('node:fs').writeFileSync(process.env.VSC_PROFILE_OUT, JSON.stringify(p, null, 2));
});
`;
  return prelude + out;
}

export function profile(file: string, plugin: LanguagePlugin): Profile {
  const dir = mkdtempSync(join(tmpdir(), 'vsc-prof-'));
  const inst = join(dir, 'instrumented.cjs');
  const out = join(dir, 'profile.json');
  writeFileSync(inst, instrument(readFileSync(file, 'utf8'), plugin));
  execFileSync(process.execPath, [inst], { stdio: ['ignore', 'ignore', 'inherit'], env: { ...process.env, VSC_PROFILE_OUT: out } });
  return JSON.parse(readFileSync(out, 'utf8'));
}
