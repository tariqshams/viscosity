// The syntax tree (the book's chapter “Syntax trees and a tree printer”). Every node is a plain object tagged with
// a `kind`, so TypeScript can narrow on it: a discriminated union
// (the book's chapter “TypeScript II: unions and narrowing”).
import type { Token } from './token.ts';

/** `=`, `+=` or `-=`: how an assignment combines the old and new values. */
export type AssignOp = Token;

export type Expr =
  | { kind: 'literal'; value: number | string | boolean | null }
  | { kind: 'grouping'; expression: Expr }
  | { kind: 'unary'; operator: Token; right: Expr }
  | { kind: 'binary'; left: Expr; operator: Token; right: Expr }
  | { kind: 'logical'; left: Expr; operator: Token; right: Expr }
  | { kind: 'variable'; name: Token }
  | { kind: 'assign'; name: Token; op: AssignOp; value: Expr }
  /** `paren` is the `(`: its line is the call's line in errors and traces */
  | { kind: 'call'; callee: Expr; paren: Token; args: Expr[] }
  | { kind: 'get'; object: Expr; name: Token }
  | { kind: 'set'; object: Expr; name: Token; op: AssignOp; value: Expr }
  | { kind: 'index'; object: Expr; bracket: Token; index: Expr }
  | { kind: 'indexSet'; object: Expr; bracket: Token; index: Expr; op: AssignOp; value: Expr }
  | { kind: 'list'; elements: Expr[] }
  | { kind: 'new'; keyword: Token; className: Token; args: Expr[] }
  | { kind: 'function'; fn: FunctionDecl }
  | { kind: 'self'; keyword: Token }
  | { kind: 'super'; keyword: Token; method: Token };

export interface FunctionDecl {
  /** null for an anonymous function */
  name: Token | null;
  params: Token[];
  body: Stmt[];
}

export type Stmt =
  | { kind: 'expression'; expression: Expr }
  | { kind: 'print'; expression: Expr }
  | { kind: 'let'; name: Token; initializer: Expr | null }
  | { kind: 'block'; statements: Stmt[] }
  | { kind: 'if'; condition: Expr; then: Stmt; else: Stmt | null }
  | { kind: 'while'; condition: Expr; body: Stmt[] }
  /** `for name in start..end` (end set) or `for name in start` (a list) */
  | { kind: 'for'; keyword: Token; name: Token; start: Expr; end: Expr | null; body: Stmt[] }
  | { kind: 'break'; keyword: Token }
  | { kind: 'continue'; keyword: Token }
  | { kind: 'fn'; fn: FunctionDecl & { name: Token } }
  | { kind: 'return'; keyword: Token; value: Expr | null }
  | { kind: 'class'; name: Token; superclass: (Expr & { kind: 'variable' }) | null; methods: (FunctionDecl & { name: Token })[] };

/** Print an expression as a fully parenthesized string (chapter “Syntax trees and a tree printer”). */
export function printExpr(e: Expr): string {
  switch (e.kind) {
    case 'literal':
      return e.value === null ? 'none' : typeof e.value === 'string' ? JSON.stringify(e.value) : String(e.value);
    case 'grouping': return `(group ${printExpr(e.expression)})`;
    case 'unary': return `(${e.operator.lexeme} ${printExpr(e.right)})`;
    case 'binary':
    case 'logical': return `(${e.operator.lexeme} ${printExpr(e.left)} ${printExpr(e.right)})`;
    case 'variable': return e.name.lexeme;
    case 'assign': return `(${e.op.lexeme} ${e.name.lexeme} ${printExpr(e.value)})`;
    case 'call': return `(call ${printExpr(e.callee)}${e.args.map((a) => ' ' + printExpr(a)).join('')})`;
    case 'get': return `(. ${printExpr(e.object)} ${e.name.lexeme})`;
    case 'set': return `(${e.op.lexeme} (. ${printExpr(e.object)} ${e.name.lexeme}) ${printExpr(e.value)})`;
    case 'index': return `([] ${printExpr(e.object)} ${printExpr(e.index)})`;
    case 'indexSet': return `(${e.op.lexeme} ([] ${printExpr(e.object)} ${printExpr(e.index)}) ${printExpr(e.value)})`;
    case 'list': return `(list${e.elements.map((a) => ' ' + printExpr(a)).join('')})`;
    case 'new': return `(new ${e.className.lexeme}${e.args.map((a) => ' ' + printExpr(a)).join('')})`;
    case 'function': return `(fn ${e.fn.params.map((p) => p.lexeme).join(' ')})`;
    case 'self': return 'self';
    case 'super': return `(super ${e.method.lexeme})`;
  }
}
