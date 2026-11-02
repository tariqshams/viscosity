// The tree-walking interpreter (book chapters 35–44): evaluate each node of
// the syntax tree directly.
import type { Expr, FunctionDecl, Stmt } from './ast.ts';
import type { Token } from './token.ts';
import { RuntimeError } from './errors.ts';
import type { Locals } from './resolver.ts';
import {
  DripClass, DripFunction, DripInstance, DripList, Environment, NativeFunction,
  describe, isEqual, isTruthy, stringify, type Value,
} from './runtime.ts';

/** The deepest calls may nest; the bytecode VMs have the same limit. */
export const FRAMES_MAX = 256;

/** How a statement finished: normally, or by break, continue or return. */
const NORMAL = 0;
const BREAK = 1;
const CONTINUE = 2;
const RETURN = 3;
type Completion = typeof NORMAL | typeof BREAK | typeof CONTINUE | typeof RETURN;

/** One active call, for stack traces. `line` is the line it is running. */
export interface Frame {
  place: string;
  line: number;
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

export class Interpreter {
  readonly globals = new Environment();
  /** The active calls, outermost (the script) first. Not unwound by errors,
   *  so after a runtime error it still holds the stack at the failure. */
  readonly frames: Frame[] = [{ place: 'script', line: 0 }];
  private env = this.globals;
  private locals: Locals = new Map();
  private returnValue: Value = null;
  private readonly out: (line: string) => void;
  private readonly start = performance.now();

  constructor(out: (line: string) => void) {
    this.out = out;
    const native = (name: string, arity: number, fn: (args: Value[], at: Token) => Value) =>
      this.globals.define(name, new NativeFunction(name, arity, fn));
    native('clock', 0, () => (performance.now() - this.start) / 1000);
    native('len', 1, ([x], at) => {
      if (x instanceof DripList) return x.items.length;
      if (typeof x === 'string') return [...x].length;
      throw new RuntimeError(at, `len() needs a list or a string, not ${describe(x)}`);
    });
    native('push', 2, ([xs, v], at) => {
      if (!(xs instanceof DripList)) throw new RuntimeError(at, `push() needs a list, not ${describe(xs)}`);
      xs.items.push(v);
      return null;
    });
    native('pop', 1, ([xs], at) => {
      if (!(xs instanceof DripList)) throw new RuntimeError(at, `pop() needs a list, not ${describe(xs)}`);
      if (xs.items.length === 0) throw new RuntimeError(at, 'cannot pop from an empty list');
      return xs.items.pop()!;
    });
    native('str', 1, ([x]) => stringify(x));
  }

  /** Runs a resolved program. Throws RuntimeError on failure. */
  interpret(statements: Stmt[], locals: Locals): void {
    for (const [k, v] of locals) this.locals.set(k, v);
    for (const s of statements) this.execute(s);
  }

  private executeBlock(statements: Stmt[], env: Environment): Completion {
    const previous = this.env;
    this.env = env;
    try {
      for (const s of statements) {
        const c = this.execute(s);
        if (c !== NORMAL) return c;
      }
      return NORMAL;
    } finally {
      this.env = previous;
    }
  }

  private execute(s: Stmt): Completion {
    switch (s.kind) {
      case 'expression':
        this.evaluate(s.expression);
        return NORMAL;
      case 'print':
        this.out(stringify(this.evaluate(s.expression)));
        return NORMAL;
      case 'let':
        this.env.define(s.name.lexeme, s.initializer ? this.evaluate(s.initializer) : null);
        return NORMAL;
      case 'block':
        return this.executeBlock(s.statements, new Environment(this.env));
      case 'if':
        if (isTruthy(this.evaluate(s.condition))) return this.execute(s.then);
        if (s.else) return this.execute(s.else);
        return NORMAL;
      case 'while':
        while (isTruthy(this.evaluate(s.condition))) {
          const c = this.executeBlock(s.body, new Environment(this.env));
          if (c === BREAK) break;
          if (c === RETURN) return c;
        }
        return NORMAL;
      case 'for':
        return this.forLoop(s);
      case 'break':
        return BREAK;
      case 'continue':
        return CONTINUE;
      case 'fn':
        this.env.define(s.fn.name.lexeme, new DripFunction(s.fn, this.env, false));
        return NORMAL;
      case 'return':
        this.returnValue = s.value ? this.evaluate(s.value) : null;
        return RETURN;
      case 'class': {
        let superclass: DripClass | null = null;
        if (s.superclass) {
          const sc = this.evaluate(s.superclass);
          if (!(sc instanceof DripClass)) {
            throw new RuntimeError(s.superclass.name, `a class can only extend a class, not ${describe(sc)}`);
          }
          superclass = sc;
        }
        let env = this.env;
        if (superclass) {
          env = new Environment(env);
          env.define('super', superclass);
        }
        const methods = new Map<string, DripFunction>();
        for (const m of s.methods) methods.set(m.name.lexeme, new DripFunction(m, env, m.name.type === 'init'));
        this.env.define(s.name.lexeme, new DripClass(s.name.lexeme, superclass, methods));
        return NORMAL;
      }
    }
  }

  /** `for x in a..b` and `for x in list`: a fresh `x` each time round. */
  private forLoop(s: Stmt & { kind: 'for' }): Completion {
    const start = this.evaluate(s.start);
    let next: () => Value | undefined;
    if (s.end) {
      const end = this.evaluate(s.end);
      if (typeof start !== 'number') throw new RuntimeError(s.keyword, `a range must start with a number, not ${describe(start)}`);
      if (typeof end !== 'number') throw new RuntimeError(s.keyword, `a range must end with a number, not ${describe(end)}`);
      let i = start;
      next = () => (i < end ? i++ : undefined);
    } else {
      if (!(start instanceof DripList)) throw new RuntimeError(s.keyword, `cannot loop over ${describe(start)}`);
      let i = 0;
      // The length is read each time round, so pushing extends the loop.
      next = () => (i < start.items.length ? start.items[i++] : undefined);
    }
    for (let v = next(); v !== undefined; v = next()) {
      const loopEnv = new Environment(this.env);
      loopEnv.define(s.name.lexeme, v);
      const c = this.executeBlock(s.body, new Environment(loopEnv));
      if (c === BREAK) break;
      if (c === RETURN) return c;
    }
    return NORMAL;
  }

  private lookUp(name: Token, e: Expr): Value {
    const d = this.locals.get(e);
    if (d !== undefined) return this.env.getAt(d, name.lexeme);
    const v = this.globals.values.get(name.lexeme);
    if (v === undefined) throw new RuntimeError(name, `undefined variable '${name.lexeme}'`);
    return v;
  }

  private assign(name: Token, e: Expr, value: Value): void {
    const d = this.locals.get(e);
    if (d !== undefined) this.env.assignAt(d, name.lexeme, value);
    else if (this.globals.values.has(name.lexeme)) this.globals.values.set(name.lexeme, value);
    else throw new RuntimeError(name, `undefined variable '${name.lexeme}'`);
  }

  /** `old op value` for `=`, `+=` and `-=`. */
  private combine(op: Token, old: () => Value, value: Value): Value {
    if (op.type === '=') return value;
    return this.arithmetic(op.type === '+=' ? '+' : '-', op, old(), value);
  }

  private arithmetic(op: string, at: Token, l: Value, r: Value): Value {
    if (op === '+') {
      if (typeof l === 'number' && typeof r === 'number') return l + r;
      if (typeof l === 'string' && typeof r === 'string') return l + r;
      throw new RuntimeError(at, `cannot add ${describe(l)} and ${describe(r)}`);
    }
    if (typeof l !== 'number' || typeof r !== 'number') {
      const verb = op === '<' || op === '<=' || op === '>' || op === '>=' ? 'compare' : 'use \'' + op + '\' on';
      const tail = verb === 'compare' ? ` with '${op}'` : '';
      throw new RuntimeError(at, `cannot ${verb} ${describe(l)} and ${describe(r)}${tail}`);
    }
    switch (op) {
      case '-': return l - r;
      case '*': return l * r;
      case '/': return l / r;
      case '%': return l % r;
      case '<': return l < r;
      case '<=': return l <= r;
      case '>': return l > r;
      case '>=': return l >= r;
    }
    throw new Error(`unknown operator ${op}`);
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
        if (typeof right !== 'number') throw new RuntimeError(e.operator, `cannot negate ${describe(right)}`);
        return -right;
      }
      case 'binary': {
        const l = this.evaluate(e.left);
        const r = this.evaluate(e.right);
        const op = e.operator;
        if (op.type === '==') return isEqual(l, r);
        if (op.type === '!=') return !isEqual(l, r);
        return this.arithmetic(op.type, op, l, r);
      }
      case 'logical': {
        const left = this.evaluate(e.left);
        if (e.operator.type === '||') return isTruthy(left) ? left : this.evaluate(e.right);
        return isTruthy(left) ? this.evaluate(e.right) : left;
      }
      case 'variable':
        return this.lookUp(e.name, e);
      case 'assign': {
        let value: Value;
        if (e.op.type === '=') value = this.evaluate(e.value);
        else {
          const old = this.lookUp(e.name, e);
          value = this.combine(e.op, () => old, this.evaluate(e.value));
        }
        this.assign(e.name, e, value);
        return value;
      }
      case 'list':
        return new DripList(e.elements.map((x) => this.evaluate(x)));
      case 'index': {
        const xs = this.evaluate(e.object);
        const i = this.evaluate(e.index);
        return checkIndex(xs, i, e.bracket).items[i as number];
      }
      case 'indexSet': {
        const xs = this.evaluate(e.object);
        const i = this.evaluate(e.index);
        let value: Value;
        if (e.op.type === '=') value = this.evaluate(e.value);
        else {
          const old = checkIndex(xs, i, e.bracket).items[i as number];
          value = this.combine(e.op, () => old, this.evaluate(e.value));
        }
        checkIndex(xs, i, e.bracket).items[i as number] = value;
        return value;
      }
      case 'call':
        return this.call(e);
      case 'new': {
        const klass = this.lookUp(e.className, e);
        const args = e.args.map((a) => this.evaluate(a));
        if (!(klass instanceof DripClass)) throw new RuntimeError(e.keyword, `'new' needs a class, not ${describe(klass)}`);
        const instance = new DripInstance(klass);
        const init = klass.findMethod('init');
        if (init) this.callFunction(init.bind(instance), args, e.keyword);
        else if (args.length !== 0) {
          throw new RuntimeError(e.keyword, `${klass.name} has no init, so it takes no arguments, but got ${args.length}`);
        }
        return instance;
      }
      case 'function':
        return new DripFunction(e.fn, this.env, false);
      case 'get': {
        const obj = this.evaluate(e.object);
        return this.property(obj, e.name);
      }
      case 'set': {
        const obj = this.evaluate(e.object);
        let value: Value;
        if (e.op.type === '=') {
          value = this.evaluate(e.value);
        } else {
          const old = this.property(obj, e.name);
          value = this.combine(e.op, () => old, this.evaluate(e.value));
        }
        if (!(obj instanceof DripInstance)) throw new RuntimeError(e.name, `cannot set '${e.name.lexeme}' on ${describe(obj)}`);
        obj.fields.set(e.name.lexeme, value);
        return value;
      }
      case 'self':
        return this.lookUp(e.keyword, e);
      case 'super':
        return this.superMethod(e);
    }
  }

  private property(obj: Value, name: Token): Value {
    if (obj instanceof DripInstance) return obj.get(name);
    throw new RuntimeError(name, `cannot read '${name.lexeme}' of ${describe(obj)}`);
  }

  private superMethod(e: Expr & { kind: 'super' }): DripFunction {
    const d = this.locals.get(e)!;
    const superclass = this.env.getAt(d, 'super') as DripClass;
    const instance = this.env.getAt(d - 1, 'self') as DripInstance;
    const method = superclass.findMethod(e.method.lexeme);
    if (!method) throw new RuntimeError(e.method, `${superclass.name} has no method '${e.method.lexeme}'`);
    return method.bind(instance);
  }

  private call(e: Expr & { kind: 'call' }): Value {
    // A method call `o.m(args)` (or `super.m(args)`) evaluates the receiver,
    // then the arguments, and only then looks the method up: the order the
    // bytecode VM's `invoke` instruction uses.
    let callee: Value;
    let args: Value[];
    if (e.callee.kind === 'get') {
      const obj = this.evaluate(e.callee.object);
      args = e.args.map((a) => this.evaluate(a));
      callee = this.property(obj, e.callee.name);
    } else if (e.callee.kind === 'super') {
      args = e.args.map((a) => this.evaluate(a));
      callee = this.superMethod(e.callee);
    } else {
      callee = this.evaluate(e.callee);
      args = e.args.map((a) => this.evaluate(a));
    }
    if (callee instanceof DripFunction) return this.callFunction(callee, args, e.paren);
    if (callee instanceof NativeFunction) {
      if (args.length !== callee.arity) {
        throw new RuntimeError(e.paren, `${callee.name}() takes ${plural(callee.arity, 'argument')} but got ${args.length}`);
      }
      return callee.fn(args, e.paren);
    }
    if (callee instanceof DripClass) throw new RuntimeError(e.paren, `cannot call a class: use 'new ${callee.name}(...)'`);
    throw new RuntimeError(e.paren, `cannot call ${describe(callee)}`);
  }

  private callFunction(f: DripFunction, args: Value[], at: Token): Value {
    if (args.length !== f.arity) throw new RuntimeError(at, `${f.label} takes ${plural(f.arity, 'argument')} but got ${args.length}`);
    if (this.frames.length === FRAMES_MAX) throw new RuntimeError(at, 'stack overflow');
    this.frames[this.frames.length - 1].line = at.line;
    this.frames.push({ place: f.decl.name ? `fn ${f.decl.name.lexeme}` : 'anonymous fn', line: 0 });
    const env = new Environment(f.closure);
    const params = f.decl.params;
    for (let i = 0; i < params.length; i++) env.define(params[i].lexeme, args[i]);
    const c = this.executeBlock(f.decl.body, env);
    this.frames.pop();
    if (f.isInitializer) return f.closure.getAt(0, 'self');
    if (c === RETURN) {
      const v = this.returnValue;
      this.returnValue = null;
      return v;
    }
    return null;
  }
}

function checkIndex(xs: Value, i: Value, at: Token): DripList {
  if (!(xs instanceof DripList)) throw new RuntimeError(at, `cannot index ${describe(xs)}`);
  if (typeof i !== 'number') throw new RuntimeError(at, `a list index must be a number, not ${describe(i)}`);
  if (!Number.isInteger(i)) throw new RuntimeError(at, `index ${stringify(i)} is not a whole number`);
  if (i < 0 || i >= xs.items.length) {
    throw new RuntimeError(at, `index ${stringify(i)} is out of range for a list of length ${xs.items.length}`);
  }
  return xs;
}

export type { FunctionDecl };
