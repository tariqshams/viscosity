// The resolver: a static pass that works out, for every variable use, how many
// environments up its declaration lives (book chapter 42). It also enforces
// Drip's static rules: no redeclaring a local, no reading a local in its own
// initialiser, `return` only in functions, `break` and `continue` only in
// loops, `self` and `super` only in methods.
//
// It runs only on a program that parsed without errors, and it reports its
// errors in source order, as the bytecode compiler does in its single pass.
import type { Expr, FunctionDecl, Stmt } from './ast.ts';
import type { Token } from './token.ts';
import type { Reporter } from './errors.ts';

type FunctionType = 'none' | 'function' | 'method' | 'initializer';
type ClassType = 'none' | 'class' | 'subclass';

/** For each local variable expression, its distance in environments. */
export type Locals = Map<Expr, number>;

export function resolve(statements: Stmt[], reporter: Reporter): Locals {
  const locals: Locals = new Map();
  // Each scope maps a name to whether its declaration is complete.
  const scopes: Map<string, boolean>[] = [];
  let currentFunction: FunctionType = 'none';
  let currentClass: ClassType = 'none';
  let loopDepth = 0;

  const report = (token: Token, message: string) => reporter.error(token.line, message);
  const begin = () => scopes.push(new Map());
  const end = () => scopes.pop();
  const declare = (name: Token) => {
    const scope = scopes[scopes.length - 1];
    if (!scope) return; // a global
    if (scope.has(name.lexeme)) report(name, `'${name.lexeme}' is already declared in this scope`);
    scope.set(name.lexeme, false);
  };
  const define = (name: Token) => {
    const scope = scopes[scopes.length - 1];
    if (scope) scope.set(name.lexeme, true);
  };
  /** Find the nearest declaration of `name`; not found means a global. */
  const resolveLocal = (expr: Expr, name: Token) => {
    for (let i = scopes.length - 1; i >= 0; i--) {
      const done = scopes[i].get(name.lexeme);
      if (done !== undefined) {
        if (!done) report(name, `cannot read '${name.lexeme}' in its own initialiser`);
        locals.set(expr, scopes.length - 1 - i);
        return;
      }
    }
  };

  function fn(f: FunctionDecl, type: FunctionType) {
    const enclosing = currentFunction;
    const enclosingLoops = loopDepth;
    currentFunction = type;
    loopDepth = 0;
    begin();
    for (const p of f.params) {
      declare(p);
      define(p);
    }
    stmts(f.body);
    end();
    currentFunction = enclosing;
    loopDepth = enclosingLoops;
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
      case 'fn':
        declare(s.fn.name);
        define(s.fn.name);
        fn(s.fn, 'function');
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
        loop(s.body);
        return;
      case 'for':
        expr(s.start);
        if (s.end) expr(s.end);
        begin(); // the loop variable's own scope, fresh each time round
        declare(s.name);
        define(s.name);
        loop(s.body);
        end();
        return;
      case 'break':
      case 'continue':
        if (loopDepth === 0) report(s.keyword, `'${s.kind}' outside a loop`);
        return;
      case 'return':
        if (currentFunction === 'none') report(s.keyword, '\'return\' outside a function');
        if (s.value) {
          if (currentFunction === 'initializer') report(s.keyword, '\'init\' cannot return a value');
          expr(s.value);
        }
        return;
      case 'class': {
        const enclosingClass = currentClass;
        currentClass = 'class';
        declare(s.name);
        define(s.name);
        if (s.superclass) {
          expr(s.superclass);
          if (s.superclass.name.lexeme === s.name.lexeme) report(s.superclass.name, 'a class cannot extend itself');
          currentClass = 'subclass';
          begin();
          scopes[scopes.length - 1].set('super', true);
        }
        begin();
        scopes[scopes.length - 1].set('self', true);
        for (const m of s.methods) fn(m, m.name.type === 'init' ? 'initializer' : 'method');
        end();
        if (s.superclass) end();
        currentClass = enclosingClass;
        return;
      }
    }
  }

  /** A loop body: a block, inside a loop. */
  function loop(body: Stmt[]) {
    loopDepth++;
    begin();
    stmts(body);
    end();
    loopDepth--;
  }

  function expr(e: Expr): void {
    switch (e.kind) {
      case 'variable':
        resolveLocal(e, e.name);
        return;
      case 'assign':
        resolveLocal(e, e.name);
        expr(e.value);
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
      case 'list':
        for (const x of e.elements) expr(x);
        return;
      case 'call':
        expr(e.callee);
        for (const a of e.args) expr(a);
        return;
      case 'get':
        expr(e.object);
        return;
      case 'set':
        expr(e.object);
        expr(e.value);
        return;
      case 'index':
        expr(e.object);
        expr(e.index);
        return;
      case 'indexSet':
        expr(e.object);
        expr(e.index);
        expr(e.value);
        return;
      case 'new':
        resolveLocal(e, e.className);
        for (const a of e.args) expr(a);
        return;
      case 'function':
        fn(e.fn, 'function');
        return;
      case 'self':
        if (currentClass === 'none') {
          report(e.keyword, 'cannot use \'self\' outside a method');
          return;
        }
        resolveLocal(e, e.keyword);
        return;
      case 'super':
        if (currentClass === 'none') report(e.keyword, 'cannot use \'super\' outside a method');
        else if (currentClass !== 'subclass') report(e.keyword, 'cannot use \'super\' in a class that does not extend another');
        else resolveLocal(e, e.keyword);
        return;
    }
  }

  stmts(statements);
  return locals;
}
