// Error reporting shared by the scanner, parser, resolver and interpreter.
// The message formats match the Crafting Interpreters test suite (MIT),
// so Drip can be checked against it.
import type { Token } from './token.ts';

export interface Reporter {
  /** a compile-time (static) error: exit code 65 */
  error(line: number, where: string, message: string): void;
  hadError: boolean;
}

export function makeReporter(write: (line: string) => void): Reporter {
  const r: Reporter = {
    hadError: false,
    error(line, where, message) {
      write(`[line ${line}] Error${where}: ${message}`);
      r.hadError = true;
    },
  };
  return r;
}

export function tokenError(reporter: Reporter, token: Token, message: string): void {
  if (token.type === 'eof') reporter.error(token.line, ' at end', message);
  else reporter.error(token.line, ` at '${token.lexeme}'`, message);
}

/** An error while running: reported as the message, then "[line N]". Exit 70. */
export class RuntimeError extends Error {
  token: Token;
  constructor(token: Token, message: string) {
    super(message);
    this.token = token;
  }
}
