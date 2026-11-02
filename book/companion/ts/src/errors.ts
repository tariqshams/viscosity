// Error reporting shared by the parser, resolver and interpreter.
//
// Compile errors print as `line 3: expected '}' to close the block, found
// end of file`; runtime errors as `runtime error: <message>` followed by one
// `  at line N in <place>` line per active call, innermost first. The exact
// wording is pinned by the corpus (book/companion/corpus).
import type { Token } from './token.ts';

/** Collects compile errors, in the order they are found. */
export interface Reporter {
  error(line: number, message: string): void;
  readonly errors: string[];
}

export function makeReporter(): Reporter {
  const errors: string[] = [];
  return {
    errors,
    error(line, message) {
      errors.push(`line ${line}: ${message}`);
    },
  };
}

/** An error while running. `line` is where in the source it happened. Exit 70. */
export class RuntimeError extends Error {
  readonly line: number;
  constructor(token: Token | number, message: string) {
    super(message);
    this.line = typeof token === 'number' ? token : token.line;
  }
}
