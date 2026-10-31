// The parser turns tokens into a syntax tree (book chapters 30–34).
// Statements use recursive descent: one function per grammar rule.
// Expressions use Pratt parsing: each operator has a binding power.
import type { Expr, FunctionDecl, Stmt } from './ast.ts';
import type { Token, TokenType } from './token.ts';
import { tokenError, type Reporter } from './errors.ts';

class ParseError extends Error {}

// Binding powers, weakest first. Higher numbers bind tighter.
const BP: Partial<Record<TokenType, number>> = {
  or: 1,
  and: 2,
  '==': 3, '!=': 3,
  '<': 4, '<=': 4, '>': 4, '>=': 4,
  '+': 5, '-': 5,
  '*': 6, '/': 6,
  '(': 8, '.': 8,
};
const UNARY_BP = 7;

export function parse(tokens: Token[], reporter: Reporter): Stmt[] {
  let current = 0;

  const peek = () => tokens[current];
  const previous = () => tokens[current - 1];
  const atEnd = () => peek().type === 'eof';
  const check = (t: TokenType) => !atEnd() && peek().type === t;
  const advance = () => {
    if (!atEnd()) current++;
    return previous();
  };
  const match = (...types: TokenType[]) => {
    for (const t of types) {
      if (check(t)) {
        advance();
        return true;
      }
    }
    return false;
  };
  const error = (token: Token, message: string) => {
    tokenError(reporter, token, message);
    return new ParseError(message);
  };
  const consume = (t: TokenType, message: string) => {
    if (check(t)) return advance();
    throw error(peek(), message);
  };

  // After an error, skip to a likely statement boundary (panic mode).
  const synchronize = () => {
    advance();
    while (!atEnd()) {
      if (previous().type === ';') return;
      switch (peek().type) {
        case 'class': case 'fn': case 'let': case 'for': case 'if':
        case 'while': case 'print': case 'return':
          return;
      }
      advance();
    }
  };

  // ---- declarations and statements -------------------------------------

  function declaration(): Stmt | null {
    try {
      if (match('class')) return classDeclaration();
      if (match('fn')) return fn('function');
      if (match('let')) return letDeclaration();
      return statement();
    } catch (e) {
      if (e instanceof ParseError) {
        synchronize();
        return null;
      }
      throw e;
    }
  }

  function classDeclaration(): Stmt {
    const name = consume('identifier', 'Expect class name.');
    let superclass: (Expr & { kind: 'variable' }) | null = null;
    if (match('<')) {
      consume('identifier', 'Expect superclass name.');
      superclass = { kind: 'variable', name: previous() };
    }
    consume('{', 'Expect \'{\' before class body.');
    const methods: FunctionDecl[] = [];
    while (!check('}') && !atEnd()) methods.push(fn('method'));
    consume('}', 'Expect \'}\' after class body.');
    return { kind: 'class', name, superclass, methods };
  }

  function fn(kind: 'function' | 'method'): FunctionDecl {
    const name = consume('identifier', `Expect ${kind} name.`);
    consume('(', `Expect '(' after ${kind} name.`);
    const params: Token[] = [];
    if (!check(')')) {
      do {
        if (params.length >= 255) error(peek(), 'Can\'t have more than 255 parameters.');
        params.push(consume('identifier', 'Expect parameter name.'));
      } while (match(','));
    }
    consume(')', 'Expect \')\' after parameters.');
    consume('{', `Expect '{' before ${kind} body.`);
    return { kind: 'function', name, params, body: block() };
  }

  function letDeclaration(): Stmt {
    const name = consume('identifier', 'Expect variable name.');
    const initializer = match('=') ? expression() : null;
    consume(';', 'Expect \';\' after variable declaration.');
    return { kind: 'let', name, initializer };
  }

  function statement(): Stmt {
    if (match('for')) return forStatement();
    if (match('if')) return ifStatement();
    if (match('print')) {
      const value = expression();
      consume(';', 'Expect \';\' after value.');
      return { kind: 'print', expression: value };
    }
    if (match('return')) {
      const keyword = previous();
      const value = check(';') ? null : expression();
      consume(';', 'Expect \';\' after return value.');
      return { kind: 'return', keyword, value };
    }
    if (match('while')) {
      consume('(', 'Expect \'(\' after \'while\'.');
      const condition = expression();
      consume(')', 'Expect \')\' after condition.');
      return { kind: 'while', condition, body: statement() };
    }
    if (match('{')) return { kind: 'block', statements: block() };
    const expr = expression();
    consume(';', 'Expect \';\' after expression.');
    return { kind: 'expression', expression: expr };
  }

  // for (init; cond; incr) body  is desugared into a while loop (chapter 38).
  function forStatement(): Stmt {
    consume('(', 'Expect \'(\' after \'for\'.');
    let initializer: Stmt | null;
    if (match(';')) initializer = null;
    else if (match('let')) initializer = letDeclaration();
    else {
      const e = expression();
      consume(';', 'Expect \';\' after expression.');
      initializer = { kind: 'expression', expression: e };
    }
    const condition: Expr = check(';') ? { kind: 'literal', value: true } : expression();
    consume(';', 'Expect \';\' after loop condition.');
    const increment = check(')') ? null : expression();
    consume(')', 'Expect \')\' after for clauses.');
    let body = statement();
    if (increment) body = { kind: 'block', statements: [body, { kind: 'expression', expression: increment }] };
    body = { kind: 'while', condition, body };
    if (initializer) body = { kind: 'block', statements: [initializer, body] };
    return body;
  }

  function ifStatement(): Stmt {
    consume('(', 'Expect \'(\' after \'if\'.');
    const condition = expression();
    consume(')', 'Expect \')\' after if condition.');
    const then = statement();
    const otherwise = match('else') ? statement() : null;
    return { kind: 'if', condition, then, else: otherwise };
  }

  function block(): Stmt[] {
    const statements: Stmt[] = [];
    while (!check('}') && !atEnd()) {
      const d = declaration();
      if (d) statements.push(d);
    }
    consume('}', 'Expect \'}\' after block.');
    return statements;
  }

  // ---- expressions --------------------------------------------------------

  function expression(): Expr {
    return assignment();
  }

  // Assignment is right-associative and its target must be a variable or a
  // property, which we only know after parsing the left side.
  function assignment(): Expr {
    const expr = pratt(0);
    if (match('=')) {
      const equals = previous();
      const value = assignment();
      if (expr.kind === 'variable') return { kind: 'assign', name: expr.name, value };
      if (expr.kind === 'get') return { kind: 'set', object: expr.object, name: expr.name, value };
      error(equals, 'Invalid assignment target.');
    }
    return expr;
  }

  // The Pratt loop: parse a prefix, then keep absorbing infix operators that
  // bind more tightly than `minBp` (chapter 33).
  function pratt(minBp: number): Expr {
    let left = prefix();
    for (;;) {
      const bp = BP[peek().type];
      if (bp === undefined || bp <= minBp) break;
      const op = advance();
      left = infix(left, op, bp);
    }
    return left;
  }

  function prefix(): Expr {
    if (match('!', '-')) {
      const operator = previous();
      return { kind: 'unary', operator, right: pratt(UNARY_BP) };
    }
    return primary();
  }

  function infix(left: Expr, op: Token, bp: number): Expr {
    switch (op.type) {
      case '(': {
        const args: Expr[] = [];
        if (!check(')')) {
          do {
            if (args.length >= 255) error(peek(), 'Can\'t have more than 255 arguments.');
            args.push(expression());
          } while (match(','));
        }
        const paren = consume(')', 'Expect \')\' after arguments.');
        return { kind: 'call', callee: left, paren, args };
      }
      case '.': {
        const name = consume('identifier', 'Expect property name after \'.\'.');
        return { kind: 'get', object: left, name };
      }
      case 'and':
      case 'or':
        return { kind: 'logical', left, operator: op, right: pratt(bp) };
      default:
        // Left-associative: the right side may only contain tighter operators.
        return { kind: 'binary', left, operator: op, right: pratt(bp) };
    }
  }

  function primary(): Expr {
    if (match('false')) return { kind: 'literal', value: false };
    if (match('true')) return { kind: 'literal', value: true };
    if (match('nil')) return { kind: 'literal', value: null };
    if (match('number', 'string')) return { kind: 'literal', value: previous().literal };
    if (match('super')) {
      const keyword = previous();
      consume('.', 'Expect \'.\' after \'super\'.');
      const method = consume('identifier', 'Expect superclass method name.');
      return { kind: 'super', keyword, method };
    }
    if (match('this')) return { kind: 'this', keyword: previous() };
    if (match('identifier')) return { kind: 'variable', name: previous() };
    if (match('(')) {
      const expression_ = expression();
      consume(')', 'Expect \')\' after expression.');
      return { kind: 'grouping', expression: expression_ };
    }
    throw error(peek(), 'Expect expression.');
  }

  const statements: Stmt[] = [];
  while (!atEnd()) {
    const d = declaration();
    if (d) statements.push(d);
  }
  return statements;
}

/** Parse a single expression (used by chapter 31–33 demos and tests). */
export function parseExpression(tokens: Token[], reporter: Reporter): Expr | null {
  const stmts = parse([...tokens.slice(0, -1), { ...tokens[tokens.length - 1], type: ';', lexeme: ';' }, tokens[tokens.length - 1]], reporter);
  const s = stmts[0];
  return s && s.kind === 'expression' ? s.expression : null;
}
