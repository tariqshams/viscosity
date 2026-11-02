// The bytecode virtual machine (the book's chapters “A machine with a stack” and “Globals by name” to “Measuring and speeding up the VM”).
import { Op } from './chunk.ts';
import { compile } from './compiler.ts';
import { Heap } from './heap.ts';
import { Table } from './table.ts';
import {
  describe, formatValue, isFalsey, isObj, isString, valuesEqual,
  type NativeFn, type ObjClass, type ObjClosure, type ObjFunction, type ObjList, type ObjString,
  type ObjUpvalue, type Value,
} from './object.ts';
import { formatNumber } from '../runtime.ts';

/** The deepest calls may nest; the tree-walker has the same limit. */
export const FRAMES_MAX = 256;
const STACK_MAX = FRAMES_MAX * 256;

interface CallFrame {
  closure: ObjClosure;
  /** instruction pointer: index of the next byte to run */
  ip: number;
  /** index in the stack of this frame's slot 0 */
  slots: number;
}

export interface VmResult {
  stdout: string[];
  stderr: string[];
  exitCode: 0 | 65 | 70;
}

class VmRuntimeError extends Error {}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
/** How arity errors name a function: `area()`, or `anonymous fn`. */
const label = (fn: ObjFunction) => (fn.name ? `${fn.name.chars}()` : 'anonymous fn');
/** How stack traces name a function: `fn area`, `anonymous fn`, `script`. */
const place = (fn: ObjFunction) => (fn.name ? `fn ${fn.name.chars}` : fn.isScript ? 'script' : 'anonymous fn');

export class VM {
  readonly heap = new Heap();
  readonly stack: Value[] = new Array(STACK_MAX).fill(null);
  sp = 0;
  frames: CallFrame[] = [];
  globals = new Table();
  openUpvalues: ObjUpvalue | null = null;
  initString: ObjString;
  instructionsExecuted = 0;
  private out: string[] = [];
  private err: string[] = [];
  private readonly start = performance.now();

  constructor(opts: { stressGC?: boolean; debugGC?: boolean } = {}) {
    this.heap.stress = !!opts.stressGC;
    this.heap.poisonFreed = !!(opts.stressGC || opts.debugGC);
    this.heap.vm = this;
    this.initString = this.heap.copyString('init');
    this.defineNative('clock', 0, () => (performance.now() - this.start) / 1000);
    this.defineNative('len', 1, ([x], fail) => {
      if (isObj(x) && x.type === 'list') return x.items.length;
      if (isString(x)) return [...x.chars].length;
      return fail(`len() needs a list or a string, not ${describe(x)}`);
    });
    this.defineNative('push', 2, ([xs, v], fail) => {
      if (!isObj(xs) || xs.type !== 'list') return fail(`push() needs a list, not ${describe(xs)}`);
      xs.items.push(v);
      return null;
    });
    this.defineNative('pop', 1, ([xs], fail) => {
      if (!isObj(xs) || xs.type !== 'list') return fail(`pop() needs a list, not ${describe(xs)}`);
      if (xs.items.length === 0) return fail('cannot pop from an empty list');
      return xs.items.pop()!;
    });
    this.defineNative('str', 1, ([x]) => this.heap.copyString(formatValue(x)));
  }

  markRoots(mark: (v: Value) => void): void {
    for (let i = 0; i < this.sp; i++) mark(this.stack[i]);
    for (const f of this.frames) mark(f.closure);
    for (let u = this.openUpvalues; u; u = u.nextOpen) mark(u);
    this.globals.forEach((k, v) => {
      mark(k);
      mark(v);
    });
    mark(this.initString);
  }

  private defineNative(name: string, arity: number, fn: NativeFn) {
    // Keep both on the stack so a collection mid-way can't free them.
    this.push(this.heap.copyString(name));
    this.push(this.heap.newNative(name, arity, fn));
    this.globals.set(this.stack[this.sp - 2] as ObjString, this.stack[this.sp - 1]);
    this.pop();
    this.pop();
  }

  push(v: Value) { this.stack[this.sp++] = v; }
  pop(): Value { return this.stack[--this.sp]; }
  peek(distance: number): Value { return this.stack[this.sp - 1 - distance]; }

  /** Report a runtime error with a stack trace, innermost call first. */
  private runtimeError = (message: string): never => {
    this.err.push(`runtime error: ${message}`);
    for (let i = this.frames.length - 1; i >= 0; i--) {
      const f = this.frames[i];
      const fn = f.closure.fn;
      this.err.push(`  at line ${fn.chunk.lines[f.ip - 1]} in ${place(fn)}`);
    }
    throw new VmRuntimeError(message);
  };

  private call(closure: ObjClosure, argCount: number): void {
    const fn = closure.fn;
    if (argCount !== fn.arity) this.runtimeError(`${label(fn)} takes ${plural(fn.arity, 'argument')} but got ${argCount}`);
    if (this.frames.length === FRAMES_MAX) this.runtimeError('stack overflow');
    this.frames.push({ closure, ip: 0, slots: this.sp - argCount - 1 });
  }

  private callValue(callee: Value, argCount: number): void {
    if (isObj(callee)) {
      switch (callee.type) {
        case 'closure':
          return this.call(callee, argCount);
        case 'bound':
          this.stack[this.sp - argCount - 1] = callee.receiver;
          return this.call(callee.method, argCount);
        case 'native': {
          if (argCount !== callee.arity) {
            this.runtimeError(`${callee.name}() takes ${plural(callee.arity, 'argument')} but got ${argCount}`);
          }
          // The arguments stay on the stack while the native runs, so a
          // collection it causes can't free them.
          const result = callee.fn(this.stack.slice(this.sp - argCount, this.sp), this.runtimeError);
          this.sp -= argCount + 1;
          this.push(result);
          return;
        }
        case 'class':
          return this.runtimeError(`cannot call a class: use 'new ${callee.name.chars}(...)'`);
      }
    }
    this.runtimeError(`cannot call ${describe(callee)}`);
  }

  private newInstance(argCount: number): void {
    const klass = this.peek(argCount);
    if (!isObj(klass) || klass.type !== 'class') return this.runtimeError(`'new' needs a class, not ${describe(klass)}`);
    this.stack[this.sp - argCount - 1] = this.heap.newInstance(klass);
    const init = klass.methods.get(this.initString);
    if (init !== undefined) return this.call(init as ObjClosure, argCount);
    if (argCount !== 0) {
      this.runtimeError(`${klass.name.chars} has no init, so it takes no arguments, but got ${argCount}`);
    }
  }

  /** `receiver.name(args)`, without making a bound method on the way. */
  private invoke(name: ObjString, argCount: number): void {
    const receiver = this.peek(argCount);
    if (!isObj(receiver) || receiver.type !== 'instance') {
      return this.runtimeError(`cannot read '${name.chars}' of ${describe(receiver)}`);
    }
    // A field holding a function shadows a method of the same name.
    const field = receiver.fields.get(name);
    if (field !== undefined) {
      this.stack[this.sp - argCount - 1] = field;
      return this.callValue(field, argCount);
    }
    const method = receiver.klass.methods.get(name);
    if (method === undefined) return this.runtimeError(`${receiver.klass.name.chars} has no property '${name.chars}'`);
    this.call(method as ObjClosure, argCount);
  }

  private superMethod(superclass: ObjClass, name: ObjString): ObjClosure {
    const method = superclass.methods.get(name);
    if (method === undefined) return this.runtimeError(`${superclass.name.chars} has no method '${name.chars}'`);
    return method as ObjClosure;
  }

  private captureUpvalue(slot: number): ObjUpvalue {
    let prev: ObjUpvalue | null = null;
    let u = this.openUpvalues;
    while (u && u.slot > slot) {
      prev = u;
      u = u.nextOpen;
    }
    if (u && u.slot === slot) return u;
    const created = this.heap.newUpvalue(slot);
    created.nextOpen = u;
    if (prev) prev.nextOpen = created;
    else this.openUpvalues = created;
    return created;
  }

  private closeUpvalues(last: number): void {
    while (this.openUpvalues && this.openUpvalues.slot >= last) {
      const u = this.openUpvalues;
      u.closed = this.stack[u.slot];
      u.slot = -1;
      this.openUpvalues = u.nextOpen;
    }
  }

  private checkIndex(xs: Value, i: Value): ObjList {
    if (!isObj(xs) || xs.type !== 'list') return this.runtimeError(`cannot index ${describe(xs)}`);
    if (typeof i !== 'number') return this.runtimeError(`a list index must be a number, not ${describe(i)}`);
    if (!Number.isInteger(i)) return this.runtimeError(`index ${formatNumber(i)} is not a whole number`);
    if (i < 0 || i >= xs.items.length) {
      return this.runtimeError(`index ${formatNumber(i)} is out of range for a list of length ${xs.items.length}`);
    }
    return xs;
  }

  /** Check the two numbers an arithmetic or comparison instruction needs. */
  private numbers(op: string): void {
    const a = this.peek(1);
    const b = this.peek(0);
    if (typeof a === 'number' && typeof b === 'number') return;
    if (op === '<' || op === '<=' || op === '>' || op === '>=') {
      this.runtimeError(`cannot compare ${describe(a)} and ${describe(b)} with '${op}'`);
    }
    this.runtimeError(`cannot use '${op}' on ${describe(a)} and ${describe(b)}`);
  }

  private run(): void {
    let frame = this.frames[this.frames.length - 1];
    let code = frame.closure.fn.chunk.code;
    let constants = frame.closure.fn.chunk.constants;
    const stack = this.stack;
    const readByte = () => code[frame.ip++];
    const readShort = () => {
      frame.ip += 2;
      return (code[frame.ip - 2] << 8) | code[frame.ip - 1];
    };
    const readConstant = () => constants[readShort()];
    const readString = () => readConstant() as ObjString;
    const reload = () => {
      frame = this.frames[this.frames.length - 1];
      code = frame.closure.fn.chunk.code;
      constants = frame.closure.fn.chunk.constants;
    };

    for (;;) {
      this.instructionsExecuted++;
      const instruction = code[frame.ip++];
      switch (instruction) {
        case Op.Const: this.push(readConstant()); break;
        case Op.None: this.push(null); break;
        case Op.True: this.push(true); break;
        case Op.False: this.push(false); break;
        case Op.Pop: this.sp--; break;
        case Op.Dup: this.push(this.peek(0)); break;
        case Op.Dup2: {
          const a = this.peek(1);
          const b = this.peek(0);
          this.push(a);
          this.push(b);
          break;
        }
        case Op.List: {
          const n = readByte();
          // The elements stay on the stack while the list is allocated.
          const list = this.heap.newList(stack.slice(this.sp - n, this.sp));
          this.sp -= n;
          this.push(list);
          break;
        }
        case Op.LoadLocal: this.push(stack[frame.slots + readByte()]); break;
        case Op.StoreLocal: stack[frame.slots + readByte()] = this.peek(0); break;
        case Op.LoadGlobal: {
          const name = readString();
          const v = this.globals.get(name);
          if (v === undefined) this.runtimeError(`undefined variable '${name.chars}'`);
          this.push(v!);
          break;
        }
        case Op.DefineGlobal:
          this.globals.set(readString(), this.peek(0));
          this.sp--;
          break;
        case Op.StoreGlobal: {
          const name = readString();
          if (this.globals.set(name, this.peek(0))) {
            // Assigning never creates a global: undo and complain.
            this.globals.delete(name);
            this.runtimeError(`undefined variable '${name.chars}'`);
          }
          break;
        }
        case Op.LoadUpvalue: {
          const u = frame.closure.upvalues[readByte()]!;
          this.push(u.slot === -1 ? u.closed : stack[u.slot]);
          break;
        }
        case Op.StoreUpvalue: {
          const u = frame.closure.upvalues[readByte()]!;
          if (u.slot === -1) u.closed = this.peek(0);
          else stack[u.slot] = this.peek(0);
          break;
        }
        case Op.GetProp: {
          const name = readString();
          const inst = this.peek(0);
          if (!isObj(inst) || inst.type !== 'instance') this.runtimeError(`cannot read '${name.chars}' of ${describe(inst)}`);
          const instance = inst as Extract<Value, { type: 'instance' }>;
          const v = instance.fields.get(name);
          if (v !== undefined) {
            stack[this.sp - 1] = v;
            break;
          }
          const method = instance.klass.methods.get(name);
          if (method === undefined) this.runtimeError(`${instance.klass.name.chars} has no property '${name.chars}'`);
          stack[this.sp - 1] = this.heap.newBoundMethod(instance, method as ObjClosure);
          break;
        }
        case Op.SetProp: {
          const name = readString();
          const inst = this.peek(1);
          if (!isObj(inst) || inst.type !== 'instance') this.runtimeError(`cannot set '${name.chars}' on ${describe(inst)}`);
          const instance = inst as Extract<Value, { type: 'instance' }>;
          if (instance.fields.set(name, this.peek(0))) instance.fieldOrder.push(name);
          const v = this.pop();
          stack[this.sp - 1] = v;
          break;
        }
        case Op.GetSuper: {
          const name = readString();
          const superclass = this.pop() as ObjClass;
          const method = this.superMethod(superclass, name);
          stack[this.sp - 1] = this.heap.newBoundMethod(this.peek(0), method);
          break;
        }
        case Op.IndexGet: {
          const i = this.pop();
          const xs = this.checkIndex(this.peek(0), i);
          stack[this.sp - 1] = xs.items[i as number];
          break;
        }
        case Op.IndexSet: {
          const v = this.pop();
          const i = this.pop();
          const xs = this.checkIndex(this.peek(0), i);
          xs.items[i as number] = v;
          stack[this.sp - 1] = v;
          break;
        }
        case Op.Add: {
          const b = this.peek(0);
          const a = this.peek(1);
          if (typeof a === 'number' && typeof b === 'number') {
            this.sp--;
            stack[this.sp - 1] = a + b;
          } else if (isString(a) && isString(b)) {
            const s = this.heap.copyString(a.chars + b.chars); // a and b stay on the stack: safe from GC
            this.sp--;
            stack[this.sp - 1] = s;
          } else {
            this.runtimeError(`cannot add ${describe(a)} and ${describe(b)}`);
          }
          break;
        }
        case Op.Sub: { this.numbers('-'); const b = this.pop() as number; stack[this.sp - 1] = (stack[this.sp - 1] as number) - b; break; }
        case Op.Mul: { this.numbers('*'); const b = this.pop() as number; stack[this.sp - 1] = (stack[this.sp - 1] as number) * b; break; }
        case Op.Div: { this.numbers('/'); const b = this.pop() as number; stack[this.sp - 1] = (stack[this.sp - 1] as number) / b; break; }
        case Op.Rem: { this.numbers('%'); const b = this.pop() as number; stack[this.sp - 1] = (stack[this.sp - 1] as number) % b; break; }
        case Op.Eq: { const b = this.pop(); stack[this.sp - 1] = valuesEqual(stack[this.sp - 1], b); break; }
        case Op.Ne: { const b = this.pop(); stack[this.sp - 1] = !valuesEqual(stack[this.sp - 1], b); break; }
        case Op.Lt: { this.numbers('<'); const b = this.pop() as number; stack[this.sp - 1] = (stack[this.sp - 1] as number) < b; break; }
        case Op.Le: { this.numbers('<='); const b = this.pop() as number; stack[this.sp - 1] = (stack[this.sp - 1] as number) <= b; break; }
        case Op.Gt: { this.numbers('>'); const b = this.pop() as number; stack[this.sp - 1] = (stack[this.sp - 1] as number) > b; break; }
        case Op.Ge: { this.numbers('>='); const b = this.pop() as number; stack[this.sp - 1] = (stack[this.sp - 1] as number) >= b; break; }
        case Op.Not: stack[this.sp - 1] = isFalsey(stack[this.sp - 1]); break;
        case Op.Neg: {
          const v = this.peek(0);
          if (typeof v !== 'number') this.runtimeError(`cannot negate ${describe(v)}`);
          stack[this.sp - 1] = -(v as number);
          break;
        }
        case Op.Print: this.out.push(formatValue(this.pop())); break;
        case Op.Jump: { const off = readShort(); frame.ip += off; break; }
        case Op.JumpUnless: { const off = readShort(); if (isFalsey(this.pop())) frame.ip += off; break; }
        case Op.JumpUnlessKeep: { const off = readShort(); if (isFalsey(this.peek(0))) frame.ip += off; break; }
        case Op.JumpIfKeep: { const off = readShort(); if (!isFalsey(this.peek(0))) frame.ip += off; break; }
        case Op.Loop: { const off = readShort(); frame.ip -= off; break; }
        case Op.IterRange: {
          const start = this.peek(1);
          const end = this.peek(0);
          if (typeof start !== 'number') this.runtimeError(`a range must start with a number, not ${describe(start)}`);
          if (typeof end !== 'number') this.runtimeError(`a range must end with a number, not ${describe(end)}`);
          break;
        }
        case Op.IterList: {
          const xs = this.peek(0);
          if (!isObj(xs) || xs.type !== 'list') this.runtimeError(`cannot loop over ${describe(xs)}`);
          break;
        }
        case Op.ListLen: stack[this.sp - 1] = (stack[this.sp - 1] as ObjList).items.length; break;
        case Op.IncLocal: {
          const slot = frame.slots + readByte();
          stack[slot] = (stack[slot] as number) + 1;
          break;
        }
        case Op.Call: {
          const argCount = readByte();
          this.callValue(this.peek(argCount), argCount);
          reload();
          break;
        }
        case Op.Invoke: {
          const name = readString();
          const argCount = readByte();
          this.invoke(name, argCount);
          reload();
          break;
        }
        case Op.InvokeSuper: {
          const name = readString();
          const argCount = readByte();
          const superclass = this.pop() as ObjClass;
          this.call(this.superMethod(superclass, name), argCount);
          reload();
          break;
        }
        case Op.New: {
          this.newInstance(readByte());
          reload();
          break;
        }
        case Op.Closure: {
          const fn = readConstant() as ObjFunction;
          const closure = this.heap.newClosure(fn);
          this.push(closure);
          for (let i = 0; i < closure.upvalues.length; i++) {
            const isLocal = readByte();
            const index = readByte();
            closure.upvalues[i] = isLocal ? this.captureUpvalue(frame.slots + index) : frame.closure.upvalues[index];
          }
          break;
        }
        case Op.CloseUpvalue:
          this.closeUpvalues(this.sp - 1);
          this.sp--;
          break;
        case Op.Return: {
          const result = this.pop();
          this.closeUpvalues(frame.slots);
          this.frames.pop();
          if (this.frames.length === 0) {
            this.sp = 0;
            return;
          }
          this.sp = frame.slots;
          this.push(result);
          reload();
          break;
        }
        case Op.Class: this.push(this.heap.newClass(readString())); break;
        case Op.Inherit: {
          const superclass = this.peek(1);
          if (!isObj(superclass) || superclass.type !== 'class') {
            this.runtimeError(`a class can only extend a class, not ${describe(superclass)}`);
          }
          // Copy-down inheritance: the methods are copied once, now.
          (this.peek(0) as ObjClass).methods.addAll((superclass as ObjClass).methods);
          this.sp--;
          break;
        }
        case Op.Method: {
          const name = readString();
          (this.peek(1) as ObjClass).methods.set(name, this.peek(0));
          this.sp--;
          break;
        }
        default:
          throw new Error(`unknown opcode ${instruction}`);
      }
    }
  }

  /** Compile and run a program. Globals persist from one call to the next. */
  interpret(source: string): VmResult {
    this.out = [];
    this.err = [];
    const fn = compile(source, this.heap, this.err);
    if (!fn) return { stdout: this.out, stderr: this.err, exitCode: 65 };
    this.push(fn);
    const closure = this.heap.newClosure(fn);
    this.pop();
    this.push(closure);
    this.call(closure, 0);
    try {
      this.run();
    } catch (e) {
      if (e instanceof VmRuntimeError) {
        this.sp = 0;
        this.frames = [];
        this.openUpvalues = null;
        return { stdout: this.out, stderr: this.err, exitCode: 70 };
      }
      throw e;
    }
    return { stdout: this.out, stderr: this.err, exitCode: 0 };
  }
}
