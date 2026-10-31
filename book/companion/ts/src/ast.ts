// The syntax tree (book chapter 31). Every node is a plain object tagged with
// a `kind`, so TypeScript can narrow on it: a discriminated union
// (book chapter 14).
import type { Token } from './token.ts';

export type Expr =
  | { kind: 'literal'; value: number | string | boolean | null }
  | { kind: 'grouping'; expression: Expr }
  | { kind: 'unary'; operator: Token; right: Expr }
  | { kind: 'binary'; left: Expr; operator: Token; right: Expr }
  | { kind: 'logical'; left: Expr; operator: Token; right: Expr }
  | { kind: 'variable'; name: Token }
  | { kind: 'assign'; name: Token; value: Expr }
  | { kind: 'call'; callee: Expr; paren: Token; args: Expr[] }
  | { kind: 'get'; object: Expr; name: Token }
  | { kind: 'set'; object: Expr; name: Token; value: Expr }
  | { kind: 'this'; keyword: Token }
  | { kind: 'super'; keyword: Token; method: Token };

export interface FunctionDecl {
  kind: 'function';
  name: Token;
  params: Token[];
  body: Stmt[];
}

export type Stmt =
  | { kind: 'expression'; expression: Expr }
  | { kind: 'print'; expression: Expr }
  | { kind: 'let'; name: Token; initializer: Expr | null }
  | { kind: 'block'; statements: Stmt[] }
  | { kind: 'if'; condition: Expr; then: Stmt; else: Stmt | null }
  | { kind: 'while'; condition: Expr; body: Stmt }
  | FunctionDecl
  | { kind: 'return'; keyword: Token; value: Expr | null }
  | { kind: 'class'; name: Token; superclass: (Expr & { kind: 'variable' }) | null; methods: FunctionDecl[] };

/** Print an expression as a fully parenthesized string (chapter 31). */
export function printExpr(e: Expr): string {
  switch (e.kind) {
    case 'literal': return e.value === null ? 'nil' : String(e.value);
    case 'grouping': return `(group ${printExpr(e.expression)})`;
    case 'unary': return `(${e.operator.lexeme} ${printExpr(e.right)})`;
    case 'binary':
    case 'logical': return `(${e.operator.lexeme} ${printExpr(e.left)} ${printExpr(e.right)})`;
    case 'variable': return e.name.lexeme;
    case 'assign': return `(= ${e.name.lexeme} ${printExpr(e.value)})`;
    case 'call': return `(call ${printExpr(e.callee)}${e.args.map((a) => ' ' + printExpr(a)).join('')})`;
    case 'get': return `(. ${printExpr(e.object)} ${e.name.lexeme})`;
    case 'set': return `(= (. ${printExpr(e.object)} ${e.name.lexeme}) ${printExpr(e.value)})`;
    case 'this': return 'this';
    case 'super': return `(super ${e.method.lexeme})`;
  }
}
