// A hash table with open addressing and linear probing (book chapter 51).
// Keys are interned strings, so keys compare by identity.
//
// Storage is a struct of arrays: one array of keys and one of values,
// rather than an array of {key, value} entry objects. In a VM written in
// JavaScript that saves an allocation per slot, which made object-heavy
// programs measurably faster (book chapter 60).
import type { ObjString, Value } from './object.ts';

const MAX_LOAD = 0.75;
// A deleted slot is a "tombstone": no key, value TOMBSTONE. It keeps probe
// sequences unbroken so later keys can still be found.
const TOMBSTONE = true;

export class Table {
  count = 0; // live entries + tombstones
  keys: (ObjString | null)[] = [];
  values: Value[] = [];

  /** Index of the key's slot, or of the slot where it should go. */
  private static find(keys: (ObjString | null)[], values: Value[], key: ObjString): number {
    const mask = keys.length - 1;
    let index = key.hash & mask;
    let tombstone = -1;
    for (;;) {
      const k = keys[index];
      if (k === null) {
        if (values[index] === null) return tombstone !== -1 ? tombstone : index;
        if (tombstone === -1) tombstone = index;
      } else if (k === key) {
        return index;
      }
      index = (index + 1) & mask;
    }
  }

  private grow(capacity: number) {
    const keys: (ObjString | null)[] = new Array(capacity).fill(null);
    const values: Value[] = new Array(capacity).fill(null);
    this.count = 0;
    for (let i = 0; i < this.keys.length; i++) {
      const k = this.keys[i];
      if (k === null) continue;
      const d = Table.find(keys, values, k);
      keys[d] = k;
      values[d] = this.values[i];
      this.count++;
    }
    this.keys = keys;
    this.values = values;
  }

  get(key: ObjString): Value | undefined {
    if (this.count === 0) return undefined;
    const i = Table.find(this.keys, this.values, key);
    return this.keys[i] === null ? undefined : this.values[i];
  }

  /** Returns true if the key was new. */
  set(key: ObjString, value: Value): boolean {
    if (this.count + 1 > this.keys.length * MAX_LOAD) {
      this.grow(this.keys.length < 8 ? 8 : this.keys.length * 2);
    }
    const i = Table.find(this.keys, this.values, key);
    const isNew = this.keys[i] === null;
    if (isNew && this.values[i] === null) this.count++;
    this.keys[i] = key;
    this.values[i] = value;
    return isNew;
  }

  delete(key: ObjString): boolean {
    if (this.count === 0) return false;
    const i = Table.find(this.keys, this.values, key);
    if (this.keys[i] === null) return false;
    this.keys[i] = null;
    this.values[i] = TOMBSTONE;
    return true;
  }

  addAll(from: Table): void {
    for (let i = 0; i < from.keys.length; i++) {
      const k = from.keys[i];
      if (k !== null) this.set(k, from.values[i]);
    }
  }

  /** Look a string up by its characters: the heart of interning. */
  findString(chars: string, hash: number): ObjString | null {
    if (this.count === 0) return null;
    const mask = this.keys.length - 1;
    let index = hash & mask;
    for (;;) {
      const k = this.keys[index];
      if (k === null) {
        if (this.values[index] === null) return null;
      } else if (k.hash === hash && k.chars === chars) {
        return k;
      }
      index = (index + 1) & mask;
    }
  }

  /** Drop entries whose key was not marked (the string table is weak). */
  removeWhite(): void {
    for (let i = 0; i < this.keys.length; i++) {
      const k = this.keys[i];
      if (k !== null && !k.isMarked) {
        this.keys[i] = null;
        this.values[i] = TOMBSTONE;
      }
    }
  }

  /** Visit every live key and value (used by the garbage collector). */
  forEach(fn: (key: ObjString, value: Value) => void): void {
    for (let i = 0; i < this.keys.length; i++) {
      const k = this.keys[i];
      if (k !== null) fn(k, this.values[i]);
    }
  }
}
