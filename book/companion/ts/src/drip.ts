// Run a Drip program: scan → parse → resolve → interpret.
// Exit codes follow the Crafting Interpreters tests: 65 for a static
// (compile) error, 70 for a runtime error.
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
  const stderr: string[] = [];
  const reporter = makeReporter((l) => stderr.push(l));
  const tokens = scan(source, reporter);
  const program = parse(tokens, reporter);
  if (reporter.hadError) return { stdout, stderr, exitCode: 65 };
  const locals = resolve(program, reporter);
  if (reporter.hadError) return { stdout, stderr, exitCode: 65 };
  const interp = new Interpreter((l) => stdout.push(l));
  try {
    interp.interpret(program, locals);
  } catch (e) {
    if (e instanceof RuntimeError) {
      stderr.push(e.message, `[line ${e.token.line}]`);
      return { stdout, stderr, exitCode: 70 };
    }
    if (e instanceof RangeError) {
      stderr.push('Stack overflow.', '[line 0]');
      return { stdout, stderr, exitCode: 70 };
    }
    throw e;
  }
  return { stdout, stderr, exitCode: 0 };
}
