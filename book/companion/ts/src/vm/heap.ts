// The VM's heap: every object is allocated here, and a mark-and-sweep
// garbage collector frees the ones nothing can reach (book chapter 58).
//
// JavaScript has its own garbage collector, so "freeing" here means
// unlinking the object from the heap and poisoning it: any later use of a
// freed object throws. That turns the classic GC bug (forgetting a root) into
// an immediate, loud failure, especially in stress mode, which collects on
// every allocation.
import { Chunk } from './chunk.ts';
import { Table } from './table.ts';
import {
  hashString, isObj,
  type Obj, type ObjBoundMethod, type ObjClass, type ObjClosure, type ObjFunction,
  type ObjInstance, type ObjNative, type ObjString, type ObjUpvalue, type Value,
} from './object.ts';

// Rough object sizes in bytes, used to decide when to collect.
const SIZE: Record<Obj['type'], number> = {
  string: 32, function: 64, native: 32, upvalue: 32, closure: 32, class: 48, instance: 48, bound: 32,
};
const GC_HEAP_GROW_FACTOR = 2;

export interface RootSource {
  markRoots(mark: (v: Value) => void): void;
}

export class Heap {
  objects: Obj | null = null;
  strings = new Table();
  bytesAllocated = 0;
  nextGC = 1024 * 1024;
  stress = false;
  collections = 0;
  freed = 0;
  /** functions under construction by the compiler */
  compilerRoots: ObjFunction[] = [];
  /** the VM registers itself here so its stack, frames and globals are roots */
  vm: RootSource | null = null;
  private gray: Obj[] = [];
  private extraRoots: Value[] = [];

  /** Keep a value alive while it is not yet reachable from anywhere else. */
  push(v: Value) { this.extraRoots.push(v); }
  pop() { this.extraRoots.pop(); }

  private allocate<T extends Obj>(o: T): T {
    this.bytesAllocated += SIZE[o.type];
    if (this.stress || this.bytesAllocated > this.nextGC) this.collect();
    o.next = this.objects;
    this.objects = o;
    return o;
  }

  copyString(chars: string): ObjString {
    const hash = hashString(chars);
    const interned = this.strings.findString(chars, hash);
    if (interned) return interned;
    const s = this.allocate<ObjString>({ type: 'string', chars, hash, isMarked: false, next: null });
    this.push(s);
    this.strings.set(s, null);
    this.pop();
    return s;
  }
  newFunction(): ObjFunction {
    return this.allocate<ObjFunction>({ type: 'function', arity: 0, upvalueCount: 0, chunk: new Chunk(), name: null, isMarked: false, next: null });
  }
  newNative(arity: number, fn: (args: Value[]) => Value): ObjNative {
    return this.allocate<ObjNative>({ type: 'native', arity, fn, isMarked: false, next: null });
  }
  newClosure(fn: ObjFunction): ObjClosure {
    return this.allocate<ObjClosure>({ type: 'closure', fn, upvalues: new Array(fn.upvalueCount).fill(null), isMarked: false, next: null });
  }
  newUpvalue(slot: number): ObjUpvalue {
    return this.allocate<ObjUpvalue>({ type: 'upvalue', slot, closed: null, nextOpen: null, isMarked: false, next: null });
  }
  newClass(name: ObjString): ObjClass {
    return this.allocate<ObjClass>({ type: 'class', name, methods: new Table(), isMarked: false, next: null });
  }
  newInstance(klass: ObjClass): ObjInstance {
    return this.allocate<ObjInstance>({ type: 'instance', klass, fields: new Table(), isMarked: false, next: null });
  }
  newBoundMethod(receiver: Value, method: ObjClosure): ObjBoundMethod {
    return this.allocate<ObjBoundMethod>({ type: 'bound', receiver, method, isMarked: false, next: null });
  }

  // ---- the collector --------------------------------------------------------

  private markValue = (v: Value) => { if (isObj(v)) this.markObject(v); };

  private markObject(o: Obj | null) {
    if (!o || o.isMarked) return;
    o.isMarked = true;
    this.gray.push(o); // grey: reached, but its references not yet traced
  }

  private markTable(t: Table) {
    for (const e of t.entries) {
      if (e.key) {
        this.markObject(e.key);
        this.markValue(e.value);
      }
    }
  }

  private blacken(o: Obj) {
    switch (o.type) {
      case 'string': case 'native': return;
      case 'upvalue': this.markValue(o.closed); return;
      case 'function':
        this.markObject(o.name);
        for (const c of o.chunk.constants) this.markValue(c);
        return;
      case 'closure':
        this.markObject(o.fn);
        for (const u of o.upvalues) this.markObject(u);
        return;
      case 'class':
        this.markObject(o.name);
        this.markTable(o.methods);
        return;
      case 'instance':
        this.markObject(o.klass);
        this.markTable(o.fields);
        return;
      case 'bound':
        this.markValue(o.receiver);
        this.markObject(o.method);
        return;
    }
  }

  collect(): void {
    this.collections++;
    // 1. Mark the roots.
    this.vm?.markRoots(this.markValue);
    for (const f of this.compilerRoots) this.markObject(f);
    for (const v of this.extraRoots) this.markValue(v);
    // 2. Trace: turn grey objects black until none are left.
    while (this.gray.length) this.blacken(this.gray.pop()!);
    // 3. The string table holds strings weakly.
    this.strings.removeWhite();
    // 4. Sweep: unlink and poison everything left white.
    let prev: Obj | null = null;
    let o = this.objects;
    while (o) {
      if (o.isMarked) {
        o.isMarked = false;
        prev = o;
        o = o.next;
      } else {
        const dead = o;
        o = o.next;
        if (prev) prev.next = o;
        else this.objects = o;
        this.bytesAllocated -= SIZE[dead.type];
        this.freed++;
        poison(dead);
      }
    }
    this.nextGC = Math.max(1024 * 1024, this.bytesAllocated * GC_HEAP_GROW_FACTOR);
  }

  liveObjects(): number {
    let n = 0;
    for (let o = this.objects; o; o = o.next) n++;
    return n;
  }
}

/** Make any later use of a freed object fail loudly. */
function poison(o: Obj) {
  const type = o.type;
  for (const k of Object.keys(o)) delete (o as unknown as Record<string, unknown>)[k];
  Object.defineProperty(o, 'type', {
    get() { throw new Error(`use after free: a ${type} object was collected while still in use`); },
  });
}
