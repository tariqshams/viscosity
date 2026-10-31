// The scanner turns source text into tokens (book chapters 27–29).
import { KEYWORDS, type Token, type TokenType } from './token.ts';
import type { Reporter } from './errors.ts';

const isDigit = (c: string) => c >= '0' && c <= '9';
const isAlpha = (c: string) => (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_';

export function scan(source: string, reporter: Reporter): Token[] {
  const tokens: Token[] = [];
  let start = 0;
  let current = 0;
  let line = 1;

  const atEnd = () => current >= source.length;
  const advance = () => source[current++];
  const peek = () => (atEnd() ? '\0' : source[current]);
  const peekNext = () => (current + 1 >= source.length ? '\0' : source[current + 1]);
  const match = (expected: string) => {
    if (atEnd() || source[current] !== expected) return false;
    current++;
    return true;
  };
  const add = (type: TokenType, literal: string | number | null = null) => {
    tokens.push({ type, lexeme: source.slice(start, current), literal, line });
  };

  while (!atEnd()) {
    start = current;
    const c = advance();
    switch (c) {
      case '(': case ')': case '{': case '}': case ',': case '.':
      case '-': case '+': case ';': case '*':
        add(c);
        break;
      case '!': add(match('=') ? '!=' : '!'); break;
      case '=': add(match('=') ? '==' : '='); break;
      case '<': add(match('=') ? '<=' : '<'); break;
      case '>': add(match('=') ? '>=' : '>'); break;
      case '/':
        if (match('/')) {
          while (peek() !== '\n' && !atEnd()) advance(); // a comment
        } else {
          add('/');
        }
        break;
      case ' ': case '\r': case '\t':
        break;
      case '\n':
        line++;
        break;
      case '"': {
        while (peek() !== '"' && !atEnd()) {
          if (peek() === '\n') line++;
          advance();
        }
        if (atEnd()) {
          reporter.error(line, '', 'Unterminated string.');
          break;
        }
        advance(); // the closing "
        add('string', source.slice(start + 1, current - 1));
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
          reporter.error(line, '', 'Unexpected character.');
        }
    }
  }
  tokens.push({ type: 'eof', lexeme: '', literal: null, line });
  return tokens;
}
