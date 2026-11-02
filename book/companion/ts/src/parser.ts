// The parser turns tokens into a syntax tree (book chapters 30–34).
// Statements use recursive descent: one function per grammar rule.
// Expressions use Pratt parsing: each token has a prefix rule, an infix
// rule and a precedence.
//
// Error recovery. When the parser meets something it did not expect, it
// reports it and enters "panic mode": further errors are not reported
// until the current declaration ends, and then it skips ahead to a likely
// statement boundary (synchronize). It never throws: a failed `consume`
// reports and carries on, building a tree that will never run. The
// bytecode compiler (src/vm/compiler.ts) parses with exactly the same
// functions in exactly the same order, so both report the same errors.
import type { Expr, FunctionDecl, Stmt } from './ast.ts';
import { describeToken, type Token, type TokenType } from './token.ts';
import type { Reporter } from './errors.ts';

export const Prec = {
  NONE: 0, ASSIGNMENT: 1, OR: 2, AND: 3, EQUALITY: 4, COMPARISON: 5,
  TERM: 6, FACTOR: 7, UNARY: 8, CALL: 9, PRIMARY: 10,
} as const;

/** How tightly each infix operator binds. Tokens not listed bind not at all. */
export const INFIX_PREC: Partial<Record<TokenType, number>> = {
  '(': Prec.CALL, '[': Prec.CALL, '.': Prec.CALL,
  '*': Prec.FACTOR, '/': Prec.FACTOR, '%': Prec.FACTOR,
  '+': Prec.TERM, '-': Prec.TERM,
  '<': Prec.COMPARISON, '<=': Prec.COMPARISON, '>': Prec.COMPARISON, '>=': Prec.COMPARISON,
  '==': Prec.EQUALITY, '!=': Prec.EQUALITY,
  '&&': Prec.AND, '||': Prec.OR,
};

/** The tokens a statement can start with: where synchronize stops. */
export const STATEMENT_STARTS: ReadonlySet<TokenType> = new Set<TokenType>([
  'class', 'fn', 'let', 'for', 'if', 'while', 'print', 'return', 'break', 'continue',
]);

const ASSIGN_OPS: TokenType[] = ['=', '+=', '-='];

type FnDecl = FunctionDecl & { name: Token };

export function parse(tokens: Token[], reporter: Reporter): Stmt[] {
  let index = 0;
  let current: Token = tokens[0];
  let previous: Token = current;
  let panicMode = false;
  /** How many blocks (and class bodies) we are inside. */
  let blockDepth = 0;

  // ---- errors -------------------------------------------------------------
  function errorAt(token: Token, message: string) {
    if (panicMode) return; // one error per declaration: the rest are likely echoes
    panicMode = true;
    reporter.error(token.line, message);
  }
  const error = (message: string) => errorAt(previous, message);
  // A missing `;` belongs at the end of the line before, so report it there.
  const expected = (what: string, at = current) => errorAt(at, `expected ${what}, found ${describeToken(current)}`);

  // ---- tokens -------------------------------------------------------------
  function advance() {
    previous = current;
    for (;;) {
      current = tokens[Math.min(++index, tokens.length - 1)];
      if (current.type !== 'error') break;
      errorAt(current, current.lexeme);
    }
  }
  const check = (t: TokenType) => current.type === t;
  function match(t: TokenType) {
    if (!check(t)) return false;
    advance();
    return true;
  }
  const matchAny = (ts: TokenType[]) => ts.some((t) => match(t));
  function consume(t: TokenType, what: string) {
    if (check(t)) advance();
    else expected(what, t === ';' ? previous : current);
  }

  // ---- declarations and statements --------------------------------------
  // Skip to the start of the next statement: just after a `;`, at a keyword
  // that starts a statement, or at the `}` that closes the block we are in.
  // Braces opened while skipping are skipped whole.
  function synchronize() {
    panicMode = false;
    let depth = 0;
    while (current.type !== 'eof') {
      if (depth === 0) {
        if (previous.type === ';') return;
        if (STATEMENT_STARTS.has(current.type)) return;
        if (current.type === '}' && blockDepth > 0) return;
      }
      if (current.type === '{') depth++;
      else if (current.type === '}' && depth > 0) depth--;
      advance();
    }
  }

  function declaration(): Stmt {
    let s: Stmt;
    if (match('class')) s = classDeclaration();
    else if (match('fn')) s = check('(') ? expressionStatementFrom(fnExpression) : fnDeclaration();
    else if (match('let')) s = letDeclaration();
    else s = statement();
    if (panicMode) synchronize();
    return s;
  }

  function classDeclaration(): Stmt {
    consume('identifier', 'a class name after \'class\'');
    const name = previous;
    let superclass: (Expr & { kind: 'variable' }) | null = null;
    if (match('extends')) {
      consume('identifier', 'a class name after \'extends\'');
      superclass = { kind: 'variable', name: previous };
    }
    const methods: FnDecl[] = [];
    if (!check('{')) {
      expected('\'{\' before the class body');
      return { kind: 'class', name, superclass, methods };
    }
    advance();
    blockDepth++;
    while (!check('}') && !check('eof')) methods.push(method());
    blockDepth--;
    consume('}', '\'}\' to close the class body');
    return { kind: 'class', name, superclass, methods };
  }

  function method(): FnDecl {
    if (!match('init') && !match('identifier')) {
      // Skip the token, so the class body loop always moves on.
      expected('a method name');
      advance();
      return { name: previous, params: [], body: [] };
    }
    const name = previous;
    return { ...fnRest('\'(\' after the method name'), name };
  }

  function fnDeclaration(): Stmt {
    consume('identifier', 'a function name after \'fn\'');
    const name = previous;
    return { kind: 'fn', fn: { ...fnRest('\'(\' after the function name'), name } };
  }

  /** Parameters and body; the name (if any) is already parsed. */
  function fnRest(parenMessage: string): FunctionDecl {
    consume('(', parenMessage);
    const params: Token[] = [];
    if (!check(')')) {
      do {
        if (params.length === 255) errorAt(current, 'a function cannot have more than 255 parameters');
        consume('identifier', 'a parameter name');
        params.push(previous);
      } while (match(','));
    }
    consume(')', '\')\' after the parameters');
    return { name: null, params, body: bracedBlock('\'{\' before the function body') };
  }

  function letDeclaration(): Stmt {
    consume('identifier', 'a variable name after \'let\'');
    const name = previous;
    const initializer = match('=') ? expression() : null;
    consume(';', '\';\' after the variable declaration');
    return { kind: 'let', name, initializer };
  }

  function statement(): Stmt {
    if (match('print')) {
      const value = expression();
      consume(';', '\';\' after the value');
      return { kind: 'print', expression: value };
    }
    if (match('for')) return forStatement();
    if (match('if')) return ifStatement();
    if (match('return')) return returnStatement();
    if (match('while')) return whileStatement();
    if (match('break') || match('continue')) {
      const keyword = previous;
      consume(';', `';' after '${keyword.lexeme}'`);
      return { kind: keyword.type as 'break' | 'continue', keyword };
    }
    if (match('{')) return { kind: 'block', statements: block() };
    return expressionStatementFrom(null);
  }

  /** `prefix` is set when the statement's first token is already consumed. */
  function expressionStatementFrom(prefix: ((canAssign: boolean) => Expr) | null): Stmt {
    const e = prefix ? continueExpression(Prec.ASSIGNMENT, prefix) : expression();
    consume(';', '\';\' after the expression');
    return { kind: 'expression', expression: e };
  }

  function returnStatement(): Stmt {
    const keyword = previous;
    if (match(';')) return { kind: 'return', keyword, value: null };
    const value = expression();
    consume(';', '\';\' after the return value');
    return { kind: 'return', keyword, value };
  }

  /** `{` declaration* `}`. If the `{` is missing, report it and parse no body
   *  at all: what follows is more likely the next statement than a body. */
  function bracedBlock(what: string): Stmt[] {
    if (!check('{')) {
      expected(what);
      return [];
    }
    advance();
    return block();
  }
  const bracedBody = (what: string): Stmt => ({ kind: 'block', statements: bracedBlock(what) });

  function ifStatement(): Stmt {
    const condition = expression();
    const then = bracedBody('\'{\' after the condition');
    let otherwise: Stmt | null = null;
    if (match('else')) {
      otherwise = match('if') ? ifStatement() : bracedBody('\'{\' or \'if\' after \'else\'');
    }
    return { kind: 'if', condition, then, else: otherwise };
  }

  function whileStatement(): Stmt {
    const condition = expression();
    return { kind: 'while', condition, body: bracedBlock('\'{\' after the condition') };
  }

  function forStatement(): Stmt {
    const keyword = previous;
    if (check('(')) {
      // `for (init; cond; step)` from other languages: report it once,
      // skip the parenthesised header and check the body.
      expected('a loop variable name after \'for\'');
      skipParentheses();
      const body = bracedBlock('\'{\' before the loop body');
      return { kind: 'for', keyword, name: keyword, start: { kind: 'literal', value: null }, end: null, body };
    }
    consume('identifier', 'a loop variable name after \'for\'');
    const name = previous;
    consume('in', '\'in\' after the loop variable');
    const start = expression();
    const end = match('..') ? expression() : null;
    return { kind: 'for', keyword, name, start, end, body: bracedBlock('\'{\' before the loop body') };
  }

  /** The declarations of a block, after its `{`, and the closing `}`. */
  /** Skip a balanced `( ... )` group, starting at its `(`. */
  function skipParentheses() {
    let depth = 0;
    do {
      if (check('(')) depth++;
      else if (check(')')) depth--;
      advance();
    } while (depth > 0 && !check('eof'));
  }

  function block(): Stmt[] {
    const statements: Stmt[] = [];
    blockDepth++;
    while (!check('}') && !check('eof')) statements.push(declaration());
    blockDepth--;
    consume('}', '\'}\' to close the block');
    return statements;
  }

  // ---- expressions (Pratt) ----------------------------------------------
  function expression(): Expr {
    return parsePrecedence(Prec.ASSIGNMENT);
  }

  function parsePrecedence(prec: number): Expr {
    advance();
    const prefix = prefixRule(previous.type);
    if (!prefix) {
      errorAt(previous, `expected an expression, found ${describeToken(previous)}`);
      return { kind: 'literal', value: null };
    }
    return continueExpression(prec, prefix);
  }

  /** Run a prefix rule for the token just consumed, then absorb infix operators. */
  function continueExpression(prec: number, prefix: (canAssign: boolean) => Expr): Expr {
    const canAssign = prec <= Prec.ASSIGNMENT;
    let left = prefix(canAssign);
    while (prec <= (INFIX_PREC[current.type] ?? Prec.NONE)) {
      advance();
      left = infix(left, previous, canAssign);
    }
    if (canAssign && matchAny(ASSIGN_OPS)) error('cannot assign to this expression');
    return left;
  }

  function prefixRule(t: TokenType): ((canAssign: boolean) => Expr) | null {
    switch (t) {
      case '(': return grouping;
      case '[': return list;
      case '-': case '!': return unary;
      case 'number': case 'string': return () => ({ kind: 'literal', value: previous.literal });
      case 'true': return () => ({ kind: 'literal', value: true });
      case 'false': return () => ({ kind: 'literal', value: false });
      case 'none': return () => ({ kind: 'literal', value: null });
      case 'identifier': return variable;
      case 'self': return () => ({ kind: 'self', keyword: previous });
      case 'super': return superExpression;
      case 'new': return newExpression;
      case 'fn': return fnExpression;
      default: return null;
    }
  }

  function infix(left: Expr, op: Token, canAssign: boolean): Expr {
    switch (op.type) {
      case '(': return { kind: 'call', callee: left, paren: op, args: argumentList() };
      case '.': return dot(left, canAssign);
      case '[': return indexExpression(left, op, canAssign);
      case '&&': case '||':
        return { kind: 'logical', left, operator: op, right: parsePrecedence(INFIX_PREC[op.type]!) };
      default:
        // Left-associative: the right side may only hold tighter operators.
        return { kind: 'binary', left, operator: op, right: parsePrecedence(INFIX_PREC[op.type]! + 1) };
    }
  }

  function grouping(): Expr {
    const e = expression();
    consume(')', '\')\' after the expression');
    return { kind: 'grouping', expression: e };
  }

  function list(): Expr {
    const elements: Expr[] = [];
    if (!check(']')) {
      do {
        elements.push(expression());
        if (elements.length === 256) error('a list cannot have more than 255 elements');
      } while (match(','));
    }
    consume(']', '\']\' after the list elements');
    return { kind: 'list', elements };
  }

  function unary(): Expr {
    const operator = previous;
    return { kind: 'unary', operator, right: parsePrecedence(Prec.UNARY) };
  }

  function variable(canAssign: boolean): Expr {
    const name = previous;
    if (canAssign && matchAny(ASSIGN_OPS)) {
      const op = previous;
      return { kind: 'assign', name, op, value: expression() };
    }
    return { kind: 'variable', name };
  }

  function dot(object: Expr, canAssign: boolean): Expr {
    consume('identifier', 'a property name after \'.\'');
    const name = previous;
    if (canAssign && matchAny(ASSIGN_OPS)) {
      const op = previous;
      return { kind: 'set', object, name, op, value: expression() };
    }
    if (match('(')) {
      const paren = previous;
      return { kind: 'call', callee: { kind: 'get', object, name }, paren, args: argumentList() };
    }
    return { kind: 'get', object, name };
  }

  function indexExpression(object: Expr, bracket: Token, canAssign: boolean): Expr {
    const index = expression();
    consume(']', '\']\' after the index');
    if (canAssign && matchAny(ASSIGN_OPS)) {
      const op = previous;
      return { kind: 'indexSet', object, bracket, index, op, value: expression() };
    }
    return { kind: 'index', object, bracket, index };
  }

  function superExpression(): Expr {
    const keyword = previous;
    consume('.', '\'.\' after \'super\'');
    if (!match('init')) consume('identifier', 'a method name after \'super.\'');
    const method = previous;
    const e: Expr = { kind: 'super', keyword, method };
    if (match('(')) {
      const paren = previous;
      return { kind: 'call', callee: e, paren, args: argumentList() };
    }
    return e;
  }

  function newExpression(): Expr {
    const keyword = previous;
    consume('identifier', 'a class name after \'new\'');
    const className = previous;
    consume('(', '\'(\' after the class name');
    return { kind: 'new', keyword, className, args: argumentList() };
  }

  function fnExpression(): Expr {
    return { kind: 'function', fn: fnRest('\'(\' after \'fn\'') };
  }

  function argumentList(): Expr[] {
    const args: Expr[] = [];
    if (!check(')')) {
      do {
        args.push(expression());
        if (args.length === 256) error('a call cannot have more than 255 arguments');
      } while (match(','));
    }
    consume(')', '\')\' after the arguments');
    return args;
  }

  // ---- the program --------------------------------------------------------
  // `current` starts as a dummy so the first advance() reports an error token.
  current = { type: 'eof', lexeme: '', literal: null, line: 1 };
  index = -1;
  advance();
  const statements: Stmt[] = [];
  while (!match('eof')) statements.push(declaration());
  return statements;
}
