// The tree-walking interpreter (book chapters 35–44): evaluate each node of
// the syntax tree directly.
import type { Expr, FunctionDecl, Stmt } from './ast.ts';
import type { Token } from './token.ts';
import { RuntimeError } from './errors.ts';
import type { Locals } from './resolver.ts';
import {
  DripClass, DripFunction, DripInstance, Environment, NativeFunction,
  isCallable, isTruthy, stringify, type CallContext, type Value,
} from './runtime.ts';

/** Thrown to unwind out of a function body on `return` (chapter 40). */
class ReturnSignal {
  readonly value: Value;
  constructor(value: Value) {
    this.value = value;
  }
}

export class Interpreter implements CallContext {
  readonly globals = new Environment();
  private env = this.globals;
  private locals: Locals = new Map();
  private readonly out: (line: string) => void;

  constructor(out: (line: string) => void) {
    this.out = out;
    this.globals.define('clock', new NativeFunction(0, () => performance.now() / 1000));
  }

  /** Runs a resolved program. Throws RuntimeError on failure. */
  interpret(statements: Stmt[], locals: Locals): void {
    for (const [k, v] of locals) this.locals.set(k, v);
    for (const s of statements) this.execute(s);
  }

  executeFunctionBody(decl: FunctionDecl, env: Environment): Value {
    try {
      this.executeBlock(decl.body, env);
    } catch (e) {
      if (e instanceof ReturnSignal) return e.value;
      throw e;
    }
    return null;
  }

  private executeBlock(statements: Stmt[], env: Environment): void {
    const previous = this.env;
    try {
      this.env = env;
      for (const s of statements) this.execute(s);
    } finally {
      this.env = previous;
    }
  }

  private execute(s: Stmt): void {
    switch (s.kind) {
      case 'expression':
        this.evaluate(s.expression);
        return;
      case 'print':
        this.out(stringify(this.evaluate(s.expression)));
        return;
      case 'let':
        this.env.define(s.name.lexeme, s.initializer ? this.evaluate(s.initializer) : null);
        return;
      case 'block':
        this.executeBlock(s.statements, new Environment(this.env));
        return;
      case 'if':
        if (isTruthy(this.evaluate(s.condition))) this.execute(s.then);
        else if (s.else) this.execute(s.else);
        return;
      case 'while':
        while (isTruthy(this.evaluate(s.condition))) this.execute(s.body);
        return;
      case 'function':
        this.env.define(s.name.lexeme, new DripFunction(s, this.env, false));
        return;
      case 'return':
        throw new ReturnSignal(s.value ? this.evaluate(s.value) : null);
      case 'class': {
        let superclass: DripClass | null = null;
        if (s.superclass) {
          const sc = this.evaluate(s.superclass);
          if (!(sc instanceof DripClass)) throw new RuntimeError(s.superclass.name, 'Superclass must be a class.');
          superclass = sc;
        }
        this.env.define(s.name.lexeme, null);
        if (superclass) {
          this.env = new Environment(this.env);
          this.env.define('super', superclass);
        }
        const methods = new Map<string, DripFunction>();
        for (const m of s.methods) methods.set(m.name.lexeme, new DripFunction(m, this.env, m.name.lexeme === 'init'));
        const klass = new DripClass(s.name.lexeme, superclass, methods);
        if (superclass) this.env = this.env.enclosing!;
        this.env.assign(s.name, klass);
        return;
      }
    }
  }

  private lookUp(name: Token, e: Expr): Value {
    const d = this.locals.get(e);
    return d === undefined ? this.globals.get(name) : this.env.getAt(d, name.lexeme);
  }

  private evaluate(e: Expr): Value {
    switch (e.kind) {
      case 'literal':
        return e.value;
      case 'grouping':
        return this.evaluate(e.expression);
      case 'unary': {
        const right = this.evaluate(e.right);
        if (e.operator.type === '!') return !isTruthy(right);
        return -num(e.operator, right);
      }
      case 'binary': {
        const l = this.evaluate(e.left);
        const r = this.evaluate(e.right);
        const op = e.operator;
        switch (op.type) {
          case '==': return l === r;
          case '!=': return l !== r;
          case '+':
            if (typeof l === 'number' && typeof r === 'number') return l + r;
            if (typeof l === 'string' && typeof r === 'string') return l + r;
            throw new RuntimeError(op, 'Operands must be two numbers or two strings.');
          case '-': nums(op, l, r); return (l as number) - (r as number);
          case '*': nums(op, l, r); return (l as number) * (r as number);
          case '/': nums(op, l, r); return (l as number) / (r as number);
          case '<': nums(op, l, r); return (l as number) < (r as number);
          case '<=': nums(op, l, r); return (l as number) <= (r as number);
          case '>': nums(op, l, r); return (l as number) > (r as number);
          case '>=': nums(op, l, r); return (l as number) >= (r as number);
        }
        throw new RuntimeError(op, 'Unknown operator.');
      }
      case 'logical': {
        const left = this.evaluate(e.left);
        if (e.operator.type === 'or') return isTruthy(left) ? left : this.evaluate(e.right);
        return isTruthy(left) ? this.evaluate(e.right) : left;
      }
      case 'variable':
        return this.lookUp(e.name, e);
      case 'assign': {
        const value = this.evaluate(e.value);
        const d = this.locals.get(e);
        if (d === undefined) this.globals.assign(e.name, value);
        else this.env.assignAt(d, e.name, value);
        return value;
      }
      case 'call': {
        const callee = this.evaluate(e.callee);
        const args = e.args.map((a) => this.evaluate(a));
        if (!isCallable(callee)) throw new RuntimeError(e.paren, 'Can only call functions and classes.');
        if (args.length !== callee.arity()) {
          throw new RuntimeError(e.paren, `Expected ${callee.arity()} arguments but got ${args.length}.`);
        }
        return callee.call(this, args);
      }
      case 'get': {
        const obj = this.evaluate(e.object);
        if (obj instanceof DripInstance) return obj.get(e.name);
        throw new RuntimeError(e.name, 'Only instances have properties.');
      }
      case 'set': {
        const obj = this.evaluate(e.object);
        if (!(obj instanceof DripInstance)) throw new RuntimeError(e.name, 'Only instances have fields.');
        const value = this.evaluate(e.value);
        obj.set(e.name, value);
        return value;
      }
      case 'this':
        return this.lookUp(e.keyword, e);
      case 'super': {
        const d = this.locals.get(e)!;
        const superclass = this.env.getAt(d, 'super') as DripClass;
        const instance = this.env.getAt(d - 1, 'this') as DripInstance;
        const method = superclass.findMethod(e.method.lexeme);
        if (!method) throw new RuntimeError(e.method, `Undefined property '${e.method.lexeme}'.`);
        return method.bind(instance);
      }
    }
  }
}

function num(op: Token, v: Value): number {
  if (typeof v === 'number') return v;
  throw new RuntimeError(op, 'Operand must be a number.');
}

function nums(op: Token, l: Value, r: Value): void {
  if (typeof l !== 'number' || typeof r !== 'number') throw new RuntimeError(op, 'Operands must be numbers.');
}

export { stringify };
