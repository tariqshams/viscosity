// Runtime values and environments (the book's chapters “Running expressions: a tree that computes” to “Classes, methods and inheritance in Drip”).
import type { FunctionDecl } from './ast.ts';
import type { Token } from './token.ts';
import { RuntimeError } from './errors.ts';

export type Value = null | boolean | number | string | DripList | DripFunction | NativeFunction | DripClass | DripInstance;

/** A table of names to values, with a link to the enclosing table (chapter “Statements, environments and control flow”). */
export class Environment {
  readonly values = new Map<string, Value>();
  readonly enclosing: Environment | null;
  constructor(enclosing: Environment | null = null) {
    this.enclosing = enclosing;
  }
  define(name: string, value: Value): void {
    this.values.set(name, value);
  }
  ancestor(distance: number): Environment {
    let env: Environment = this;
    for (let i = 0; i < distance; i++) env = env.enclosing!;
    return env;
  }
  getAt(distance: number, name: string): Value {
    return this.ancestor(distance).values.get(name) as Value;
  }
  assignAt(distance: number, name: string, value: Value): void {
    this.ancestor(distance).values.set(name, value);
  }
}

export class DripList {
  readonly items: Value[];
  constructor(items: Value[]) {
    this.items = items;
  }
}

export class DripFunction {
  readonly decl: FunctionDecl;
  readonly closure: Environment;
  readonly isInitializer: boolean;
  constructor(decl: FunctionDecl, closure: Environment, isInitializer: boolean) {
    this.decl = decl;
    this.closure = closure;
    this.isInitializer = isInitializer;
  }
  /** The same method, with `self` bound to `instance` (chapter “Classes, methods and inheritance in Drip”). */
  bind(instance: DripInstance): DripFunction {
    const env = new Environment(this.closure);
    env.define('self', instance);
    return new DripFunction(this.decl, env, this.isInitializer);
  }
  get arity(): number {
    return this.decl.params.length;
  }
  /** How errors and stack traces name it: `area()`, or `anonymous fn`. */
  get label(): string {
    return this.decl.name ? `${this.decl.name.lexeme}()` : 'anonymous fn';
  }
}

export class NativeFunction {
  readonly name: string;
  readonly arity: number;
  /** `at` is the call's `(`, for errors */
  readonly fn: (args: Value[], at: Token) => Value;
  constructor(name: string, arity: number, fn: (args: Value[], at: Token) => Value) {
    this.name = name;
    this.arity = arity;
    this.fn = fn;
  }
}

export class DripClass {
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
}

export class DripInstance {
  readonly klass: DripClass;
  /** A Map keeps the order fields were first set in, which is how they print. */
  readonly fields = new Map<string, Value>();
  constructor(klass: DripClass) {
    this.klass = klass;
  }
  get(name: Token): Value {
    const v = this.fields.get(name.lexeme);
    if (v !== undefined) return v;
    const method = this.klass.findMethod(name.lexeme);
    if (method) return method.bind(this);
    throw new RuntimeError(name, `${this.klass.name} has no property '${name.lexeme}'`);
  }
}

/** none and false are false; everything else is true (chapter “Running expressions: a tree that computes”). */
export const isTruthy = (v: Value): boolean => v !== null && v !== false;

/** Drip's `==`: different types are never equal; objects by identity. */
export const isEqual = (a: Value, b: Value): boolean => a === b;

/** A value's type, with its article, as error messages name it. */
export function describe(v: Value): string {
  if (v === null) return 'none';
  switch (typeof v) {
    case 'boolean': return 'a boolean';
    case 'number': return 'a number';
    case 'string': return 'a string';
  }
  if (v instanceof DripList) return 'a list';
  if (v instanceof DripClass) return 'a class';
  if (v instanceof DripInstance) return `${/^[AEIOUaeiou]/.test(v.klass.name) ? 'an' : 'a'} ${v.klass.name} instance`;
  return 'a function';
}

export function formatNumber(n: number): string {
  if (Number.isNaN(n)) return 'nan';
  if (n === Infinity) return 'inf';
  if (n === -Infinity) return '-inf';
  if (Object.is(n, -0)) return '-0';
  return String(n);
}

/** A string as it appears inside a list: quoted, with escapes. */
export function quote(s: string): string {
  return `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\t/g, '\\t')}"`;
}

/** How print and str() show a value. */
export function stringify(v: Value): string {
  return format(v, false, []);
}

function format(v: Value, nested: boolean, open: object[]): string {
  if (v === null) return 'none';
  switch (typeof v) {
    case 'boolean': return String(v);
    case 'number': return formatNumber(v);
    case 'string': return nested ? quote(v) : v;
  }
  if (v instanceof DripList) {
    if (open.includes(v)) return '[...]';
    open.push(v);
    const s = `[${v.items.map((x) => format(x, true, open)).join(', ')}]`;
    open.pop();
    return s;
  }
  if (v instanceof DripInstance) {
    const name = v.klass.name;
    if (open.includes(v)) return `${name} {...}`;
    if (v.fields.size === 0) return `${name} {}`;
    open.push(v);
    const parts: string[] = [];
    for (const [k, x] of v.fields) parts.push(`${k}: ${format(x, true, open)}`);
    open.pop();
    return `${name} { ${parts.join(', ')} }`;
  }
  if (v instanceof DripFunction) return v.decl.name ? `fn ${v.decl.name.lexeme}` : 'fn';
  if (v instanceof NativeFunction) return `native fn ${v.name}`;
  return `class ${v.name}`;
}
