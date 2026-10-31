// Runtime values and environments (book chapters 35–43).
import type { FunctionDecl } from './ast.ts';
import type { Token } from './token.ts';
import { RuntimeError } from './errors.ts';

export type Value = null | boolean | number | string | DripCallable | DripInstance;

export interface DripCallable {
  readonly callable: true;
  arity(): number;
  call(interp: CallContext, args: Value[]): Value;
  toString(): string;
}

/** What a callable needs from the interpreter. */
export interface CallContext {
  executeFunctionBody(decl: FunctionDecl, env: Environment): Value;
}

/** A table of names to values, with a link to the enclosing table (chapter 37). */
export class Environment {
  readonly values = new Map<string, Value>();
  readonly enclosing: Environment | null;
  constructor(enclosing: Environment | null = null) {
    this.enclosing = enclosing;
  }
  define(name: string, value: Value): void {
    this.values.set(name, value);
  }
  get(name: Token): Value {
    if (this.values.has(name.lexeme)) return this.values.get(name.lexeme)!;
    if (this.enclosing) return this.enclosing.get(name);
    throw new RuntimeError(name, `Undefined variable '${name.lexeme}'.`);
  }
  assign(name: Token, value: Value): void {
    if (this.values.has(name.lexeme)) {
      this.values.set(name.lexeme, value);
      return;
    }
    if (this.enclosing) {
      this.enclosing.assign(name, value);
      return;
    }
    throw new RuntimeError(name, `Undefined variable '${name.lexeme}'.`);
  }
  ancestor(distance: number): Environment {
    let env: Environment = this;
    for (let i = 0; i < distance; i++) env = env.enclosing!;
    return env;
  }
  getAt(distance: number, name: string): Value {
    return this.ancestor(distance).values.get(name) as Value;
  }
  assignAt(distance: number, name: Token, value: Value): void {
    this.ancestor(distance).values.set(name.lexeme, value);
  }
}

export class DripFunction implements DripCallable {
  readonly callable = true;
  readonly decl: FunctionDecl;
  readonly closure: Environment;
  readonly isInitializer: boolean;
  constructor(decl: FunctionDecl, closure: Environment, isInitializer: boolean) {
    this.decl = decl;
    this.closure = closure;
    this.isInitializer = isInitializer;
  }
  bind(instance: DripInstance): DripFunction {
    const env = new Environment(this.closure);
    env.define('this', instance);
    return new DripFunction(this.decl, env, this.isInitializer);
  }
  arity(): number {
    return this.decl.params.length;
  }
  call(interp: CallContext, args: Value[]): Value {
    const env = new Environment(this.closure);
    this.decl.params.forEach((p, i) => env.define(p.lexeme, args[i]));
    const result = interp.executeFunctionBody(this.decl, env);
    if (this.isInitializer) return this.closure.getAt(0, 'this');
    return result;
  }
  toString(): string {
    return `<fn ${this.decl.name.lexeme}>`;
  }
}

export class NativeFunction implements DripCallable {
  readonly callable = true;
  private readonly n: number;
  private readonly fn: (args: Value[]) => Value;
  constructor(n: number, fn: (args: Value[]) => Value) {
    this.n = n;
    this.fn = fn;
  }
  arity(): number {
    return this.n;
  }
  call(_: CallContext, args: Value[]): Value {
    return this.fn(args);
  }
  toString(): string {
    return '<native fn>';
  }
}

export class DripClass implements DripCallable {
  readonly callable = true;
  readonly name: string;
  readonly superclass: DripClass | null;
  readonly methods: Map<string, DripFunction>;
  constructor(name: string, superclass: DripClass | null, methods: Map<string, DripFunction>) {
    this.name = name;
    this.superclass = superclass;
    this.methods = methods;
  }
  findMethod(name: string): DripFunction | undefined {
    return this.methods.get(name) ?? this.superclass?.findMethod(name);
  }
  arity(): number {
    return this.findMethod('init')?.arity() ?? 0;
  }
  call(interp: CallContext, args: Value[]): Value {
    const instance = new DripInstance(this);
    this.findMethod('init')?.bind(instance).call(interp, args);
    return instance;
  }
  toString(): string {
    return this.name;
  }
}

export class DripInstance {
  readonly klass: DripClass;
  readonly fields = new Map<string, Value>();
  constructor(klass: DripClass) {
    this.klass = klass;
  }
  get(name: Token): Value {
    if (this.fields.has(name.lexeme)) return this.fields.get(name.lexeme)!;
    const method = this.klass.findMethod(name.lexeme);
    if (method) return method.bind(this);
    throw new RuntimeError(name, `Undefined property '${name.lexeme}'.`);
  }
  set(name: Token, value: Value): void {
    this.fields.set(name.lexeme, value);
  }
  toString(): string {
    return `${this.klass.name} instance`;
  }
}

export const isCallable = (v: Value): v is DripCallable =>
  typeof v === 'object' && v !== null && 'callable' in v;

/** nil and false are falsey; everything else is truthy (chapter 35). */
export const isTruthy = (v: Value): boolean => v !== null && v !== false;

/** How print shows a value. Integers print without a decimal point. */
export function stringify(v: Value): string {
  if (v === null) return 'nil';
  if (typeof v === 'number') {
    if (Object.is(v, -0)) return '-0';
    return String(v);
  }
  return String(v);
}
