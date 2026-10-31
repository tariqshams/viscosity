// A hash table with open addressing and linear probing (book chapter 51).
// Keys are interned strings, so keys compare by identity.
import type { ObjString, Value } from './object.ts';

const MAX_LOAD = 0.75;

interface Entry { key: ObjString | null; value: Value }
// A deleted entry is a "tombstone": key null, value true. It keeps probe
// sequences unbroken so later keys can still be found.
const TOMBSTONE = true;

export class Table {
  count = 0; // live entries + tombstones
  entries: Entry[] = [];

  private static find(entries: Entry[], key: ObjString): Entry {
    const capacity = entries.length;
    let index = key.hash & (capacity - 1);
    let tombstone: Entry | null = null;
    for (;;) {
      const e = entries[index];
      if (e.key === null) {
        if (e.value === null) return tombstone ?? e; // truly empty
        if (!tombstone) tombstone = e;
      } else if (e.key === key) {
        return e;
      }
      index = (index + 1) & (capacity - 1);
    }
  }

  private grow(capacity: number) {
    const entries: Entry[] = Array.from({ length: capacity }, () => ({ key: null, value: null }));
    this.count = 0;
    for (const e of this.entries) {
      if (e.key === null) continue;
      const dest = Table.find(entries, e.key);
      dest.key = e.key;
      dest.value = e.value;
      this.count++;
    }
    this.entries = entries;
  }

  get(key: ObjString): Value | undefined {
    if (this.count === 0) return undefined;
    const e = Table.find(this.entries, key);
    return e.key === null ? undefined : e.value;
  }

  /** Returns true if the key was new. */
  set(key: ObjString, value: Value): boolean {
    if (this.count + 1 > this.entries.length * MAX_LOAD) {
      this.grow(this.entries.length < 8 ? 8 : this.entries.length * 2);
    }
    const e = Table.find(this.entries, key);
    const isNew = e.key === null;
    if (isNew && e.value === null) this.count++;
    e.key = key;
    e.value = value;
    return isNew;
  }

  delete(key: ObjString): boolean {
    if (this.count === 0) return false;
    const e = Table.find(this.entries, key);
    if (e.key === null) return false;
    e.key = null;
    e.value = TOMBSTONE;
    return true;
  }

  addAll(from: Table): void {
    for (const e of from.entries) if (e.key !== null) this.set(e.key, e.value);
  }

  /** Look a string up by its characters: the heart of interning. */
  findString(chars: string, hash: number): ObjString | null {
    if (this.count === 0) return null;
    const capacity = this.entries.length;
    let index = hash & (capacity - 1);
    for (;;) {
      const e = this.entries[index];
      if (e.key === null) {
        if (e.value === null) return null;
      } else if (e.key.hash === hash && e.key.chars === chars) {
        return e.key;
      }
      index = (index + 1) & (capacity - 1);
    }
  }

  /** Drop entries whose key was not marked (the string table is weak). */
  removeWhite(): void {
    for (const e of this.entries) {
      if (e.key !== null && !e.key.isMarked) {
        e.key = null;
        e.value = TOMBSTONE;
      }
    }
  }
}
