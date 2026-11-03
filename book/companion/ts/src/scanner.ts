// The scanner turns source text into tokens (the book's chapters “Tokens and a scanner” to “Lookahead, numbers, strings and names”).
//
// It never reports an error itself. A character it can't use, a string
// with no closing quote or an unknown escape becomes an 'error' token whose
// lexeme is the message; the parser reports it when it reaches it. That
// way errors come out in source order, exactly as the bytecode compiler,
// which scans on demand, reports them.
import { KEYWORDS, type Token, type TokenType } from './token.ts';

export const isDigit = (c: string) => c >= '0' && c <= '9';
export const isAlpha = (c: string) => (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_';

/** The characters a backslash may introduce in a string, and what they mean. */
export const ESCAPES: Readonly<Record<string, string>> = { n: '\n', t: '\t', '"': '"', '\\': '\\' };

export function scan(source: string): Token[] {
  const tokens: Token[] = [];
  let start = 0;
  let current = 0;
  let line = 1;
  // The line of the last thing that wasn't whitespace: where "end of file"
  // is reported, rather than on the empty line after a final newline.
  let lastLine = 1;

  const atEnd = () => current >= source.length;
  const advance = () => source[current++];
  const peek = () => (atEnd() ? '\0' : source[current]);
  const peekNext = () => (current + 1 >= source.length ? '\0' : source[current + 1]);
  const match = (expected: string) => {
    if (atEnd() || source[current] !== expected) return false;
    current++;
    return true;
  };
  const add = (type: TokenType, literal: string | number | null = null, at = line) => {
    tokens.push({ type, lexeme: source.slice(start, current), literal, line: at });
  };
  const error = (message: string, at = line) => {
    tokens.push({ type: 'error', lexeme: message, literal: null, line: at });
  };

  while (!atEnd()) {
    start = current;
    const c = advance();
    if (c !== ' ' && c !== '\r' && c !== '\t' && c !== '\n') lastLine = line;
    switch (c) {
      case '(': case ')': case '{': case '}': case '[': case ']':
      case ',': case ';': case '*': case '/': case '%':
        add(c);
        break;
      case '.': add(match('.') ? '..' : '.'); break;
      case '+': add(match('=') ? '+=' : '+'); break;
      case '-': add(match('=') ? '-=' : '-'); break;
      case '!': add(match('=') ? '!=' : '!'); break;
      case '=': add(match('=') ? '==' : '='); break;
      case '<': add(match('=') ? '<=' : '<'); break;
      case '>': add(match('=') ? '>=' : '>'); break;
      case '&':
        if (match('&')) add('&&');
        else error(`unexpected character '&'`);
        break;
      case '|':
        if (match('|')) add('||');
        else error(`unexpected character '|'`);
        break;
      case '#':
        while (peek() !== '\n' && !atEnd()) advance(); // a comment, to the end of the line
        break;
      case ' ': case '\r': case '\t':
        break;
      case '\n':
        line++;
        break;
      case '"': {
        const startLine = line;
        let value = '';
        let badEscape: { text: string; line: number } | null = null;
        while (peek() !== '"' && !atEnd()) {
          const ch = advance();
          if (ch === '\n') line++;
          if (ch === '\\' && !atEnd()) {
            const e = advance();
            if (e === '\n') line++;
            if (e in ESCAPES) value += ESCAPES[e];
            else badEscape ??= { text: e, line };
          } else {
            value += ch;
          }
        }
        lastLine = line;
        if (atEnd()) {
          error('unterminated string', startLine);
          break;
        }
        advance(); // the closing "
        if (badEscape) error(`unknown escape '\\${badEscape.text}' in a string`, badEscape.line);
        else add('string', value, startLine);
        break;
      }
      default:
        if (isDigit(c)) {
          while (isDigit(peek())) advance();
          if (peek() === '.' && isDigit(peekNext())) {
            advance();
            while (isDigit(peek())) advance();
          }
          add('number', Number(source.slice(start, current)));
        } else if (isAlpha(c)) {
          while (isAlpha(peek()) || isDigit(peek())) advance();
          add(KEYWORDS.get(source.slice(start, current)) ?? 'identifier');
        } else {
          // Name the whole character, even one outside the BMP.
          const ch = String.fromCodePoint(source.codePointAt(start)!);
          current = start + ch.length;
          error(`unexpected character '${ch}'`);
        }
    }
  }
  tokens.push({ type: 'eof', lexeme: '', literal: null, line: lastLine });
  return tokens;
}
