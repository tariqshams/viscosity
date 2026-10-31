// The resolver: a static pass that works out, for every variable use, how many
// environments up its declaration lives (book chapter 42). It also reports
// misuse of return, this and super.
import type { Expr, FunctionDecl, Stmt } from './ast.ts';
import type { Token } from './token.ts';
import { tokenError, type Reporter } from './errors.ts';

type FunctionType = 'none' | 'function' | 'method' | 'initializer';
type ClassType = 'none' | 'class' | 'subclass';

/** For each local variable expression, its distance in environments. */
export type Locals = Map<Expr, number>;

export function resolve(statements: Stmt[], reporter: Reporter): Locals {
  const locals: Locals = new Map();
  const scopes: Map<string, boolean>[] = [];
  let currentFunction: FunctionType = 'none';
  let currentClass: ClassType = 'none';

  const begin = () => scopes.push(new Map());
  const end = () => scopes.pop();
  const declare = (name: Token) => {
    const scope = scopes[scopes.length - 1];
    if (!scope) return;
    if (scope.has(name.lexeme)) tokenError(reporter, name, 'Already a variable with this name in this scope.');
    scope.set(name.lexeme, false);
  };
  const define = (name: Token) => {
    const scope = scopes[scopes.length - 1];
    if (scope) scope.set(name.lexeme, true);
  };
  const resolveLocal = (expr: Expr, name: Token) => {
    for (let i = scopes.length - 1; i >= 0; i--) {
      if (scopes[i].has(name.lexeme)) {
        locals.set(expr, scopes.length - 1 - i);
        return;
      }
    }
    // Not found: assume it is a global.
  };

  function fn(f: FunctionDecl, type: FunctionType) {
    const enclosing = currentFunction;
    currentFunction = type;
    begin();
    for (const p of f.params) {
      declare(p);
      define(p);
    }
    stmts(f.body);
    end();
    currentFunction = enclosing;
  }

  function stmts(list: Stmt[]) {
    for (const s of list) stmt(s);
  }

  function stmt(s: Stmt): void {
    switch (s.kind) {
      case 'block':
        begin();
        stmts(s.statements);
        end();
        return;
      case 'let':
        declare(s.name);
        if (s.initializer) expr(s.initializer);
        define(s.name);
        return;
      case 'function':
        declare(s.name);
        define(s.name);
        fn(s, 'function');
        return;
      case 'expression':
      case 'print':
        expr(s.expression);
        return;
      case 'if':
        expr(s.condition);
        stmt(s.then);
        if (s.else) stmt(s.else);
        return;
      case 'while':
        expr(s.condition);
        stmt(s.body);
        return;
      case 'return':
        if (currentFunction === 'none') tokenError(reporter, s.keyword, 'Can\'t return from top-level code.');
        if (s.value) {
          if (currentFunction === 'initializer') tokenError(reporter, s.keyword, 'Can\'t return a value from an initializer.');
          expr(s.value);
        }
        return;
      case 'class': {
        const enclosingClass = currentClass;
        currentClass = 'class';
        declare(s.name);
        define(s.name);
        if (s.superclass) {
          if (s.superclass.name.lexeme === s.name.lexeme) {
            tokenError(reporter, s.superclass.name, 'A class can\'t inherit from itself.');
          }
          currentClass = 'subclass';
          expr(s.superclass);
          begin();
          scopes[scopes.length - 1].set('super', true);
        }
        begin();
        scopes[scopes.length - 1].set('this', true);
        for (const m of s.methods) fn(m, m.name.lexeme === 'init' ? 'initializer' : 'method');
        end();
        if (s.superclass) end();
        currentClass = enclosingClass;
        return;
      }
    }
  }

  function expr(e: Expr): void {
    switch (e.kind) {
      case 'variable': {
        const scope = scopes[scopes.length - 1];
        if (scope && scope.get(e.name.lexeme) === false) {
          tokenError(reporter, e.name, 'Can\'t read local variable in its own initializer.');
        }
        resolveLocal(e, e.name);
        return;
      }
      case 'assign':
        expr(e.value);
        resolveLocal(e, e.name);
        return;
      case 'binary':
      case 'logical':
        expr(e.left);
        expr(e.right);
        return;
      case 'unary':
        expr(e.right);
        return;
      case 'grouping':
        expr(e.expression);
        return;
      case 'literal':
        return;
      case 'call':
        expr(e.callee);
        for (const a of e.args) expr(a);
        return;
      case 'get':
        expr(e.object);
        return;
      case 'set':
        expr(e.value);
        expr(e.object);
        return;
      case 'this':
        if (currentClass === 'none') {
          tokenError(reporter, e.keyword, 'Can\'t use \'this\' outside of a class.');
          return;
        }
        resolveLocal(e, e.keyword);
        return;
      case 'super':
        if (currentClass === 'none') tokenError(reporter, e.keyword, 'Can\'t use \'super\' outside of a class.');
        else if (currentClass !== 'subclass') tokenError(reporter, e.keyword, 'Can\'t use \'super\' in a class with no superclass.');
        resolveLocal(e, e.keyword);
        return;
    }
  }

  stmts(statements);
  return locals;
}
