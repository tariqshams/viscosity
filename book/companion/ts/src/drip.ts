// Run a Drip program: scan → parse → resolve → interpret.
// Exit codes: 65 for a compile error, 70 for a runtime error.
import { makeReporter, RuntimeError } from './errors.ts';
import { scan } from './scanner.ts';
import { parse } from './parser.ts';
import { resolve } from './resolver.ts';
import { Interpreter } from './interpreter.ts';

export interface RunResult {
  stdout: string[];
  stderr: string[];
  exitCode: 0 | 65 | 70;
}

export function run(source: string): RunResult {
  const stdout: string[] = [];
  const reporter = makeReporter();
  const program = parse(scan(source), reporter);
  if (reporter.errors.length) return { stdout, stderr: reporter.errors, exitCode: 65 };
  const locals = resolve(program, reporter);
  if (reporter.errors.length) return { stdout, stderr: reporter.errors, exitCode: 65 };
  const interp = new Interpreter((l) => stdout.push(l));
  try {
    interp.interpret(program, locals);
  } catch (e) {
    let error: RuntimeError;
    if (e instanceof RuntimeError) error = e;
    else if (e instanceof RangeError) {
      // JavaScript's own stack ran out before Drip's limit: still an overflow.
      const top = interp.frames[interp.frames.length - 1];
      error = new RuntimeError(top.line, 'stack overflow');
    } else throw e;
    const stderr = [`runtime error: ${error.message}`];
    const frames = interp.frames;
    for (let i = frames.length - 1; i >= 0; i--) {
      const line = i === frames.length - 1 ? error.line : frames[i].line;
      stderr.push(`  at line ${line} in ${frames[i].place}`);
    }
    return { stdout, stderr, exitCode: 70 };
  }
  return { stdout, stderr: [], exitCode: 0 };
}
