// Runs the Drip corpus (book/companion/corpus). Each program says what it
// should do in comments:
//
//   # expect: <line>                       a line of output, in order
//   # expect runtime error: <message>      the program stops with this error;
//                                          the innermost `at` line must name
//                                          the line this comment is on
//   # expect trace: at line N in <place>   pin the stack trace too, in order
//   # expect compile error: line N: <msg>  compile errors, the exact list in order
//
// The same checker, ported to Rust, lives in rust/tests/common/mod.rs.
import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

export interface Outcome { stdout: string[]; stderr: string[]; exitCode: number }

export const CORPUS = join(import.meta.dirname, '..', '..', 'corpus');

export function listTests(dir = CORPUS): string[] {
  const out: string[] = [];
  for (const f of readdirSync(dir).sort()) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) out.push(...listTests(p));
    else if (f.endsWith('.drip')) out.push(relative(CORPUS, p).split('\\').join('/'));
  }
  return out;
}

/** The benchmarks are long-running: they have their own runner (npm run bench). */
export const isBenchmark = (test: string) => test.startsWith('benchmark/');

export interface Expectations {
  output: string[];
  compileErrors: string[];
  runtimeError: { message: string; line: number } | null;
  trace: string[];
  exitCode: number;
}

export function parseExpectations(source: string): Expectations {
  const e: Expectations = { output: [], compileErrors: [], runtimeError: null, trace: [], exitCode: 0 };
  const lines = source.split('\n');
  for (let n = 1; n <= lines.length; n++) {
    const line = lines[n - 1].replace(/\r$/, '');
    let m: RegExpMatchArray | null;
    if ((m = line.match(/# expect: ?(.*)$/))) e.output.push(m[1]);
    else if ((m = line.match(/# expect runtime error: (.+)$/))) {
      e.runtimeError = { message: m[1], line: n };
      e.exitCode = 70;
    } else if ((m = line.match(/# expect trace: (.+)$/))) e.trace.push(m[1]);
    else if ((m = line.match(/# expect compile error: (.+)$/))) {
      e.compileErrors.push(m[1]);
      e.exitCode = 65;
    }
  }
  return e;
}

/** Check one program's outcome. Returns a list of failures (empty = pass). */
export function check(source: string, o: Outcome): string[] {
  const want = parseExpectations(source);
  const fails: string[] = [];
  if (o.exitCode !== want.exitCode) fails.push(`expected exit code ${want.exitCode}, got ${o.exitCode}`);
  if (want.exitCode === 65) {
    const got = o.stderr.join('\n');
    const expected = want.compileErrors.join('\n');
    if (got !== expected) fails.push(`compile errors:\nexpected:\n${expected}\ngot:\n${got}`);
  } else if (want.runtimeError) {
    const { message, line } = want.runtimeError;
    if (o.stderr[0] !== `runtime error: ${message}`) {
      fails.push(`expected "runtime error: ${message}", got ${JSON.stringify(o.stderr[0])}`);
    }
    if (want.trace.length) {
      const got = o.stderr.slice(1).join('\n');
      const expected = want.trace.map((t) => `  ${t}`).join('\n');
      if (got !== expected) fails.push(`stack trace:\nexpected:\n${expected}\ngot:\n${got}`);
    } else if (!(o.stderr[1] ?? '').startsWith(`  at line ${line} in `)) {
      fails.push(`expected the error at line ${line}, got ${JSON.stringify(o.stderr.slice(1).join(' | '))}`);
    }
  } else if (o.stderr.length) {
    fails.push(`unexpected stderr: ${o.stderr.join(' | ')}`);
  }
  // stdout is compared line by line, as a terminal would split it.
  const stdout = o.stdout.flatMap((l) => l.split('\n'));
  const n = Math.max(stdout.length, want.output.length);
  for (let i = 0; i < n; i++) {
    if (stdout[i] !== want.output[i]) {
      fails.push(`output line ${i + 1}: expected ${JSON.stringify(want.output[i])}, got ${JSON.stringify(stdout[i])}`);
      break;
    }
  }
  return fails;
}
