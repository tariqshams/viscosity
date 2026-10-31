// Heap objects and values (book chapters 49–50, 56–59).
// A Value is a JavaScript primitive for nil, booleans and numbers, or an
// Obj: our own heap object, which the VM allocates and garbage-collects.
import type { Chunk } from './chunk.ts';
import type { Table } from './table.ts';

export type Value = null | boolean | number | Obj;

interface ObjHeader {
  /** set during the mark phase of garbage collection */
  isMarked: boolean;
  /** every allocated object is on one linked list, so sweep can find them */
  next: Obj | null;
}

export interface ObjString extends ObjHeader { type: 'string'; chars: string; hash: number }
export interface ObjFunction extends ObjHeader {
  type: 'function'; arity: number; upvalueCount: number; chunk: Chunk; name: ObjString | null;
}
export interface ObjNative extends ObjHeader { type: 'native'; arity: number; fn: (args: Value[]) => Value }
export interface ObjUpvalue extends ObjHeader {
  type: 'upvalue';
  /** while open: the stack slot it refers to; -1 once closed */
  slot: number;
  closed: Value;
  nextOpen: ObjUpvalue | null;
}
export interface ObjClosure extends ObjHeader { type: 'closure'; fn: ObjFunction; upvalues: (ObjUpvalue | null)[] }
export interface ObjClass extends ObjHeader { type: 'class'; name: ObjString; methods: Table }
export interface ObjInstance extends ObjHeader { type: 'instance'; klass: ObjClass; fields: Table }
export interface ObjBoundMethod extends ObjHeader { type: 'bound'; receiver: Value; method: ObjClosure }

export type Obj =
  | ObjString | ObjFunction | ObjNative | ObjUpvalue | ObjClosure
  | ObjClass | ObjInstance | ObjBoundMethod;

export const isObj = (v: Value): v is Obj => typeof v === 'object' && v !== null;
export const isString = (v: Value): v is ObjString => isObj(v) && v.type === 'string';

/** FNV-1a: a simple, decent hash for strings (chapter 51). */
export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function formatNumber(n: number): string {
  return Object.is(n, -0) ? '-0' : String(n);
}

export function formatValue(v: Value): string {
  if (v === null) return 'nil';
  if (typeof v === 'boolean') return String(v);
  if (typeof v === 'number') return formatNumber(v);
  switch (v.type) {
    case 'string': return v.chars;
    case 'function': return v.name ? `<fn ${v.name.chars}>` : '<script>';
    case 'native': return '<native fn>';
    case 'closure': return formatValue(v.fn);
    case 'upvalue': return 'upvalue';
    case 'class': return v.name.chars;
    case 'instance': return `${v.klass.name.chars} instance`;
    case 'bound': return formatValue(v.method.fn);
  }
}

/** Strings are interned, so equal strings are the same object (chapter 52). */
export const valuesEqual = (a: Value, b: Value): boolean => a === b;

export const isFalsey = (v: Value): boolean => v === null || v === false;
