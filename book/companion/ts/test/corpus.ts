// Runs the Drip corpus the same way the Crafting Interpreters test runner
// (tool/bin/test.dart, MIT) does: expected stdout, expected compile errors
// (with line numbers), expected runtime error + line, and exit code.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

export interface Outcome { stdout: string[]; stderr: string[]; exitCode: number }

export const CORPUS = join(import.meta.dirname, '..', '..', 'corpus');

export function listTests(dir = CORPUS): string[] {
  const out: string[] = [];
  for (const f of readdirSync(dir).sort()) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) out.push(...listTests(p));
    else if (f.endsWith('.drip')) out.push(relative(CORPUS, p));
  }
  return out;
}

/** Skip lists, by path prefix: the tree-walker mirrors jlox, the VM clox. */
export const SKIP = {
  tree: [
    'scanning', 'expressions', // early-chapter tests, not whole programs
    'limit/loop_too_large', 'limit/no_reuse_constants', 'limit/too_many_constants',
    'limit/too_many_locals', 'limit/too_many_upvalues', 'limit/stack_overflow',
    'benchmark',
  ],
  vm: ['scanning', 'expressions', 'benchmark'],
};

export function shouldSkip(test: string, suite: keyof typeof SKIP): boolean {
  return SKIP[suite].some((p) => test === p + '.drip' || test.startsWith(p + '/'));
}

/** Check one test's outcome. Returns a list of failure messages (empty = pass). */
export function check(test: string, source: string, o: Outcome, language: 'java' | 'c'): string[] {
  const fails: string[] = [];
  const expectedOut: string[] = [];
  const expectedErrors = new Set<string>();
  let runtimeError: string | null = null;
  let runtimeLine = 0;
  let exit = 0;
  const lines = source.split('\n');
  for (let n = 1; n <= lines.length; n++) {
    const line = lines[n - 1];
    if (/\/\/ nontest/.test(line)) return [];
    let m = line.match(/\/\/ expect: ?(.*)/);
    if (m) { expectedOut.push(m[1]); continue; }
    m = line.match(/\/\/ (Error.*)/);
    if (m) { expectedErrors.add(`[line ${n}] ${m[1]}`); exit = 65; continue; }
    m = line.match(/\/\/ \[((java|c) )?line (\d+)\] (Error.*)/);
    if (m) {
      if (!m[2] || m[2] === language) { expectedErrors.add(`[line ${m[3]}] ${m[4]}`); exit = 65; }
      continue;
    }
    m = line.match(/\/\/ expect runtime error: (.+)/);
    if (m) { runtimeError = m[1]; runtimeLine = n; exit = 70; }
  }

  if (runtimeError) {
    if (o.stderr.length < 2) fails.push(`expected runtime error "${runtimeError}" and got none`);
    else {
      if (o.stderr[0] !== runtimeError) fails.push(`expected runtime error "${runtimeError}", got "${o.stderr[0]}"`);
      const lm = o.stderr.slice(1).join('\n').match(/\[line (\d+)\]/);
      if (!lm || Number(lm[1]) !== runtimeLine) fails.push(`expected runtime error on line ${runtimeLine}, got ${o.stderr.slice(1).join(' | ')}`);
    }
  } else {
    const found = new Set<string>();
    for (const l of o.stderr) {
      const m = l.match(/\[.*line (\d+)\] (Error.+)/);
      if (m) {
        const e = `[line ${m[1]}] ${m[2]}`;
        if (expectedErrors.has(e)) found.add(e);
        else fails.push(`unexpected error: ${l}`);
      } else if (l !== '') fails.push(`unexpected output on stderr: ${l}`);
    }
    for (const e of expectedErrors) if (!found.has(e)) fails.push(`missing expected error: ${e}`);
  }
  if (o.exitCode !== exit) fails.push(`expected exit code ${exit}, got ${o.exitCode}`);
  // stdout is compared line by line, like a terminal would split it.
  const stdout = o.stdout.flatMap((l) => l.split('\n'));
  const n = Math.max(stdout.length, expectedOut.length);
  for (let i = 0; i < n; i++) {
    if (stdout[i] !== expectedOut[i]) {
      fails.push(`output line ${i + 1}: expected ${JSON.stringify(expectedOut[i])}, got ${JSON.stringify(stdout[i])}`);
      break;
    }
  }
  void test;
  return fails;
}
