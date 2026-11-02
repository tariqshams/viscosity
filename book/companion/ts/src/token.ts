// Tokens: the "words" of a Drip program (the book's chapter “Tokens and lexemes”).

export type TokenType =
  // punctuation
  | '(' | ')' | '{' | '}' | '[' | ']' | ',' | '.' | '..' | ';'
  // operators
  | '+' | '-' | '*' | '/' | '%' | '!' | '!=' | '=' | '==' | '<' | '<=' | '>' | '>='
  | '&&' | '||' | '+=' | '-='
  // literals
  | 'identifier' | 'string' | 'number'
  // keywords
  | 'break' | 'class' | 'continue' | 'else' | 'extends' | 'false' | 'fn' | 'for'
  | 'if' | 'in' | 'init' | 'let' | 'new' | 'none' | 'print' | 'return' | 'self'
  | 'super' | 'true' | 'while'
  // a scanning error: the lexeme is the message
  | 'error'
  | 'eof';

export interface Token {
  type: TokenType;
  /** the exact source text of the token (for an error token, the message) */
  lexeme: string;
  /** the value of a string or number literal */
  literal: string | number | null;
  /** the line the token starts on */
  line: number;
}

export const KEYWORDS: ReadonlyMap<string, TokenType> = new Map<string, TokenType>(
  ([
    'break', 'class', 'continue', 'else', 'extends', 'false', 'fn', 'for', 'if', 'in',
    'init', 'let', 'new', 'none', 'print', 'return', 'self', 'super', 'true', 'while',
  ] as const).map((k) => [k, k]),
);

/** How an error message names the token it found: `'}'`, `a string`, `end of file`. */
export function describeToken(t: { type: TokenType; lexeme: string }): string {
  if (t.type === 'eof') return 'end of file';
  if (t.type === 'string') return 'a string';
  return `'${t.lexeme}'`;
}
