// Tokens: the "words" of a Drip program (book chapter 27).

export type TokenType =
  // single-character tokens
  | '(' | ')' | '{' | '}' | ',' | '.' | '-' | '+' | ';' | '/' | '*'
  // one or two character tokens
  | '!' | '!=' | '=' | '==' | '>' | '>=' | '<' | '<='
  // literals
  | 'identifier' | 'string' | 'number'
  // keywords
  | 'and' | 'class' | 'else' | 'false' | 'fn' | 'for' | 'if' | 'nil' | 'or'
  | 'print' | 'return' | 'super' | 'this' | 'true' | 'let' | 'while'
  | 'eof';

export interface Token {
  type: TokenType;
  /** the exact source text of the token */
  lexeme: string;
  /** the value of a string or number literal */
  literal: string | number | null;
  line: number;
}

export const KEYWORDS: ReadonlyMap<string, TokenType> = new Map<string, TokenType>([
  ['and', 'and'], ['class', 'class'], ['else', 'else'], ['false', 'false'],
  ['fn', 'fn'], ['for', 'for'], ['if', 'if'], ['nil', 'nil'], ['or', 'or'],
  ['print', 'print'], ['return', 'return'], ['super', 'super'], ['this', 'this'],
  ['true', 'true'], ['let', 'let'], ['while', 'while'],
]);
