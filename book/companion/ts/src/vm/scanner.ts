// An on-demand scanner for the bytecode compiler (book chapter 48): instead
// of producing a list of tokens up front, it hands the compiler one token at
// a time. Errors come back as 'error' tokens whose lexeme is the message.
// It produces exactly the tokens of the tree-walker's scanner (a test
// checks this on the whole corpus).
import { KEYWORDS, type TokenType } from '../token.ts';
import { ESCAPES, isAlpha, isDigit } from '../scanner.ts';

export interface VmToken {
  type: TokenType;
  lexeme: string;
  line: number;
  /** a string literal's characters, escapes decoded */
  value?: string;
}

export class Scanner {
  private start = 0;
  private current = 0;
  private line = 1;
  /** the line of the last non-blank character: where end of file is reported */
  private lastLine = 1;
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
  private make(type: TokenType, line = this.line): VmToken {
    return { type, lexeme: this.source.slice(this.start, this.current), line };
  }
  private error(message: string, line = this.line): VmToken {
    return { type: 'error', lexeme: message, line };
  }

  private skipWhitespace() {
    for (;;) {
      const c = this.peek();
      if (c === ' ' || c === '\r' || c === '\t') this.advance();
      else if (c === '\n') {
        this.line++;
        this.advance();
      } else if (c === '#') {
        this.lastLine = this.line;
        while (this.peek() !== '\n' && !this.atEnd()) this.advance();
      } else return;
    }
  }

  scanToken(): VmToken {
    this.skipWhitespace();
    this.start = this.current;
    if (this.atEnd()) return this.make('eof', this.lastLine);
    this.lastLine = this.line;
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
      case '(': case ')': case '{': case '}': case '[': case ']':
      case ',': case ';': case '*': case '/': case '%':
        return this.make(c);
      case '.': return this.make(this.match('.') ? '..' : '.');
      case '+': return this.make(this.match('=') ? '+=' : '+');
      case '-': return this.make(this.match('=') ? '-=' : '-');
      case '!': return this.make(this.match('=') ? '!=' : '!');
      case '=': return this.make(this.match('=') ? '==' : '=');
      case '<': return this.make(this.match('=') ? '<=' : '<');
      case '>': return this.make(this.match('=') ? '>=' : '>');
      case '&': return this.match('&') ? this.make('&&') : this.error('unexpected character \'&\'');
      case '|': return this.match('|') ? this.make('||') : this.error('unexpected character \'|\'');
      case '"': return this.string();
    }
    // Name the whole character, even one outside the BMP.
    const ch = String.fromCodePoint(this.source.codePointAt(this.start)!);
    this.current = this.start + ch.length;
    return this.error(`unexpected character '${ch}'`);
  }

  private string(): VmToken {
    const startLine = this.line;
    let value = '';
    let badEscape: { text: string; line: number } | null = null;
    while (this.peek() !== '"' && !this.atEnd()) {
      const ch = this.advance();
      if (ch === '\n') this.line++;
      if (ch === '\\' && !this.atEnd()) {
        const e = this.advance();
        if (e === '\n') this.line++;
        if (e in ESCAPES) value += ESCAPES[e];
        else badEscape ??= { text: e, line: this.line };
      } else {
        value += ch;
      }
    }
    this.lastLine = this.line;
    if (this.atEnd()) return this.error('unterminated string', startLine);
    this.advance(); // the closing "
    if (badEscape) return this.error(`unknown escape '\\${badEscape.text}' in a string`, badEscape.line);
    const token = this.make('string', startLine);
    token.value = value;
    return token;
  }
}
