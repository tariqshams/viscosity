// An on-demand scanner for the bytecode compiler (book chapter 48): instead
// of producing a list of tokens up front, it hands the compiler one token at
// a time. Errors come back as 'error' tokens whose lexeme is the message.
import { KEYWORDS, type TokenType } from '../token.ts';

export type VmTokenType = TokenType | 'error';
export interface VmToken {
  type: VmTokenType;
  lexeme: string;
  line: number;
}

const isDigit = (c: string) => c >= '0' && c <= '9';
const isAlpha = (c: string) => (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_';

export class Scanner {
  private start = 0;
  private current = 0;
  private line = 1;
  private readonly source: string;
  constructor(source: string) {
    this.source = source;
  }

  private atEnd() { return this.current >= this.source.length; }
  private advance() { return this.source[this.current++]; }
  private peek() { return this.atEnd() ? '\0' : this.source[this.current]; }
  private peekNext() { return this.current + 1 >= this.source.length ? '\0' : this.source[this.current + 1]; }
  private match(c: string) {
    if (this.atEnd() || this.source[this.current] !== c) return false;
    this.current++;
    return true;
  }
  private make(type: VmTokenType): VmToken {
    return { type, lexeme: this.source.slice(this.start, this.current), line: this.line };
  }
  private error(message: string): VmToken {
    return { type: 'error', lexeme: message, line: this.line };
  }

  private skipWhitespace() {
    for (;;) {
      const c = this.peek();
      if (c === ' ' || c === '\r' || c === '\t') this.advance();
      else if (c === '\n') { this.line++; this.advance(); }
      else if (c === '/' && this.peekNext() === '/') {
        while (this.peek() !== '\n' && !this.atEnd()) this.advance();
      } else return;
    }
  }

  scanToken(): VmToken {
    this.skipWhitespace();
    this.start = this.current;
    if (this.atEnd()) return this.make('eof');
    const c = this.advance();
    if (isAlpha(c)) {
      while (isAlpha(this.peek()) || isDigit(this.peek())) this.advance();
      return this.make(KEYWORDS.get(this.source.slice(this.start, this.current)) ?? 'identifier');
    }
    if (isDigit(c)) {
      while (isDigit(this.peek())) this.advance();
      if (this.peek() === '.' && isDigit(this.peekNext())) {
        this.advance();
        while (isDigit(this.peek())) this.advance();
      }
      return this.make('number');
    }
    switch (c) {
      case '(': case ')': case '{': case '}': case ';': case ',': case '.':
      case '-': case '+': case '/': case '*':
        return this.make(c);
      case '!': return this.make(this.match('=') ? '!=' : '!');
      case '=': return this.make(this.match('=') ? '==' : '=');
      case '<': return this.make(this.match('=') ? '<=' : '<');
      case '>': return this.make(this.match('=') ? '>=' : '>');
      case '"': {
        while (this.peek() !== '"' && !this.atEnd()) {
          if (this.peek() === '\n') this.line++;
          this.advance();
        }
        if (this.atEnd()) return this.error('Unterminated string.');
        this.advance();
        return this.make('string');
      }
    }
    return this.error('Unexpected character.');
  }
}
