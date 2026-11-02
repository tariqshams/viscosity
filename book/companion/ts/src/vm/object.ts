// Heap objects and values (the book's chapters “Tagging values at run time” to “Objects that live on the heap” and “Frames: calling and returning in the VM” to “Objects and method calls in the VM”).
// A Value is a JavaScript primitive for none, booleans and numbers, or an
// Obj: our own heap object, which the VM allocates and garbage-collects.
import type { Chunk } from './chunk.ts';
import type { Table } from './table.ts';
import { formatNumber, quote } from '../runtime.ts';

export type Value = null | boolean | number | Obj;

interface ObjHeader {
  /** set during the mark phase of garbage collection */
  isMarked: boolean;
  /** every allocated object is on one linked list, so sweep can find them */
  next: Obj | null;
}

export interface ObjString extends ObjHeader { type: 'string'; chars: string; hash: number }
export interface ObjList extends ObjHeader { type: 'list'; items: Value[] }
export interface ObjFunction extends ObjHeader {
  type: 'function';
  arity: number;
  upvalueCount: number;
  chunk: Chunk;
  /** null for the script and for anonymous functions */
  name: ObjString | null;
  isScript: boolean;
}
/** A native function: it may report an error through `fail`, which throws. */
export type NativeFn = (args: Value[], fail: (message: string) => never) => Value;
export interface ObjNative extends ObjHeader { type: 'native'; name: string; arity: number; fn: NativeFn }
export interface ObjUpvalue extends ObjHeader {
  type: 'upvalue';
  /** while open: the stack slot it refers to; -1 once closed */
  slot: number;
  closed: Value;
  nextOpen: ObjUpvalue | null;
}
export interface ObjClosure extends ObjHeader { type: 'closure'; fn: ObjFunction; upvalues: (ObjUpvalue | null)[] }
export interface ObjClass extends ObjHeader { type: 'class'; name: ObjString; methods: Table }
export interface ObjInstance extends ObjHeader {
  type: 'instance';
  klass: ObjClass;
  fields: Table;
  /** field names in the order they were first set: how an instance prints */
  fieldOrder: ObjString[];
}
export interface ObjBoundMethod extends ObjHeader { type: 'bound'; receiver: Value; method: ObjClosure }

export type Obj =
  | ObjString | ObjList | ObjFunction | ObjNative | ObjUpvalue | ObjClosure
  | ObjClass | ObjInstance | ObjBoundMethod;

export const isObj = (v: Value): v is Obj => typeof v === 'object' && v !== null;
export const isString = (v: Value): v is ObjString => isObj(v) && v.type === 'string';

/** FNV-1a: a simple, decent hash for strings (chapter “Finding things fast: hash tables”). */
export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** How print and str() show a value: the same as the tree-walker. */
export function formatValue(v: Value): string {
  return format(v, false, []);
}

function format(v: Value, nested: boolean, open: Obj[]): string {
  if (v === null) return 'none';
  if (typeof v === 'boolean') return String(v);
  if (typeof v === 'number') return formatNumber(v);
  switch (v.type) {
    case 'string': return nested ? quote(v.chars) : v.chars;
    case 'list': {
      if (open.includes(v)) return '[...]';
      open.push(v);
      const s = `[${v.items.map((x) => format(x, true, open)).join(', ')}]`;
      open.pop();
      return s;
    }
    case 'instance': {
      const name = v.klass.name.chars;
      if (open.includes(v)) return `${name} {...}`;
      if (v.fieldOrder.length === 0) return `${name} {}`;
      open.push(v);
      const parts = v.fieldOrder.map((k) => `${k.chars}: ${format(v.fields.get(k)!, true, open)}`);
      open.pop();
      return `${name} { ${parts.join(', ')} }`;
    }
    case 'function': return v.name ? `fn ${v.name.chars}` : v.isScript ? 'script' : 'fn';
    case 'native': return `native fn ${v.name}`;
    case 'closure': return format(v.fn, nested, open);
    case 'bound': return format(v.method.fn, nested, open);
    case 'upvalue': return 'upvalue';
    case 'class': return `class ${v.name.chars}`;
  }
}

/** A value's type, with its article, as error messages name it. */
export function describe(v: Value): string {
  if (v === null) return 'none';
  if (typeof v === 'boolean') return 'a boolean';
  if (typeof v === 'number') return 'a number';
  switch (v.type) {
    case 'string': return 'a string';
    case 'list': return 'a list';
    case 'class': return 'a class';
    case 'instance': {
      const name = v.klass.name.chars;
      return `${/^[AEIOUaeiou]/.test(name) ? 'an' : 'a'} ${name} instance`;
    }
    default: return 'a function';
  }
}

/** Drip's `==`. Strings are interned, so equal strings are the same object
 *  (chapter “String interning”) and identity is enough for every type. */
export const valuesEqual = (a: Value, b: Value): boolean => a === b;

export const isFalsey = (v: Value): boolean => v === null || v === false;
