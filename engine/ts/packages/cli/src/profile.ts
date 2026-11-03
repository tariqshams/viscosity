// Profile-guided optimization (the book's chapter “Telling Viscosity more: annotations and profiles”): run the ORIGINAL program
// with light instrumentation that records how big each candidate collection
// really gets, then feed those numbers to the cost model.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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

/** Runs the instrumented program. If it fails (an uncaught exception, a
 *  non-zero exit), that is an error: a partial run's sizes could mislead the
 *  planner. The temporary directory is removed in every case. */
export function profile(file: string, plugin: LanguagePlugin): Profile {
  let source: string;
  try {
    source = readFileSync(file, 'utf8');
  } catch (e) {
    throw new Error(`cannot read ${file}: ${(e as Error).message}`);
  }
  const dir = mkdtempSync(join(tmpdir(), 'vsc-prof-'));
  try {
    const inst = join(dir, 'instrumented.cjs');
    const out = join(dir, 'profile.json');
    writeFileSync(inst, instrument(source, plugin));
    try {
      execFileSync(process.execPath, [inst], { stdio: ['ignore', 'ignore', 'inherit'], env: { ...process.env, VSC_PROFILE_OUT: out } });
    } catch (e) {
      const { status } = e as { status?: number | null };
      throw new Error(`the profiled program failed (${typeof status === 'number' ? `exit code ${status}` : 'killed by a signal'})`);
    }
    return JSON.parse(readFileSync(out, 'utf8'));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** Reads a `--profile` file: a JSON object mapping collection names to
 *  objects whose `maxLength` is a non-negative finite number (other keys are
 *  ignored). Anything else is an error, worded as in the Rust CLI. */
export function readProfile(path: string): Profile {
  let text: string;
  try {
    text = readFileSync(path, 'utf8');
  } catch {
    throw new Error(`cannot read the profile ${path}`);
  }
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`the profile ${path} is not valid JSON`);
  }
  const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
  if (!isObject(json)) throw new Error('the profile must be a JSON object: { "name": { "maxLength": n }, ... }');
  for (const [name, entry] of Object.entries(json)) {
    const n = isObject(entry) ? entry.maxLength : undefined;
    if (typeof n !== 'number' || !Number.isFinite(n) || n < 0) {
      throw new Error(`the profile entry ${JSON.stringify(name)} must be an object whose maxLength is a non-negative number`);
    }
  }
  return json as Profile;
}
