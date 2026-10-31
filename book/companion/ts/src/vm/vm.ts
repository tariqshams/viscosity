// The bytecode virtual machine (book chapters 47, 53–60).
import { OP } from './chunk.ts';
import { compile } from './compiler.ts';
import { Heap } from './heap.ts';
import { Table } from './table.ts';
import {
  formatValue, isFalsey, isObj, isString, valuesEqual,
  type ObjClass, type ObjClosure, type ObjString, type ObjUpvalue, type Value,
} from './object.ts';

const FRAMES_MAX = 64;
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

  constructor(opts: { stressGC?: boolean } = {}) {
    this.heap.stress = !!opts.stressGC;
    this.heap.vm = this;
    this.initString = this.heap.copyString('init');
    this.defineNative('clock', 0, () => performance.now() / 1000);
  }

  markRoots(mark: (v: Value) => void): void {
    for (let i = 0; i < this.sp; i++) mark(this.stack[i]);
    for (const f of this.frames) mark(f.closure);
    for (let u = this.openUpvalues; u; u = u.nextOpen) mark(u);
    for (const e of this.globals.entries) {
      if (e.key) {
        mark(e.key);
        mark(e.value);
      }
    }
    mark(this.initString);
  }

  private defineNative(name: string, arity: number, fn: (args: Value[]) => Value) {
    // Keep both on the stack so a collection mid-way can't free them.
    this.push(this.heap.copyString(name));
    this.push(this.heap.newNative(arity, fn));
    this.globals.set(this.stack[0] as ObjString, this.stack[1]);
    this.pop();
    this.pop();
  }

  push(v: Value) { this.stack[this.sp++] = v; }
  pop(): Value { return this.stack[--this.sp]; }
  peek(distance: number): Value { return this.stack[this.sp - 1 - distance]; }

  private runtimeError(message: string): never {
    this.err.push(message);
    for (let i = this.frames.length - 1; i >= 0; i--) {
      const f = this.frames[i];
      const fn = f.closure.fn;
      const line = fn.chunk.lines[f.ip - 1];
      this.err.push(`[line ${line}] in ${fn.name ? fn.name.chars + '()' : 'script'}`);
    }
    throw new VmRuntimeError(message);
  }

  private call(closure: ObjClosure, argCount: number): void {
    if (argCount !== closure.fn.arity) this.runtimeError(`Expected ${closure.fn.arity} arguments but got ${argCount}.`);
    if (this.frames.length === FRAMES_MAX) this.runtimeError('Stack overflow.');
    this.frames.push({ closure, ip: 0, slots: this.sp - argCount - 1 });
  }

  private callValue(callee: Value, argCount: number): void {
    if (isObj(callee)) {
      switch (callee.type) {
        case 'bound':
          this.stack[this.sp - argCount - 1] = callee.receiver;
          return this.call(callee.method, argCount);
        case 'class': {
          this.stack[this.sp - argCount - 1] = this.heap.newInstance(callee);
          const init = callee.methods.get(this.initString);
          if (init !== undefined) return this.call(init as ObjClosure, argCount);
          if (argCount !== 0) this.runtimeError(`Expected 0 arguments but got ${argCount}.`);
          return;
        }
        case 'closure':
          return this.call(callee, argCount);
        case 'native': {
          if (argCount !== callee.arity) this.runtimeError(`Expected ${callee.arity} arguments but got ${argCount}.`);
          const result = callee.fn(this.stack.slice(this.sp - argCount, this.sp));
          this.sp -= argCount + 1;
          this.push(result);
          return;
        }
      }
    }
    this.runtimeError('Can only call functions and classes.');
  }

  private invokeFromClass(klass: ObjClass, name: ObjString, argCount: number): void {
    const method = klass.methods.get(name);
    if (method === undefined) this.runtimeError(`Undefined property '${name.chars}'.`);
    this.call(method as ObjClosure, argCount);
  }

  private invoke(name: ObjString, argCount: number): void {
    const receiver = this.peek(argCount);
    if (!isObj(receiver) || receiver.type !== 'instance') this.runtimeError('Only instances have methods.');
    const field = receiver.fields.get(name);
    if (field !== undefined) {
      this.stack[this.sp - argCount - 1] = field;
      return this.callValue(field, argCount);
    }
    this.invokeFromClass(receiver.klass, name, argCount);
  }

  private bindMethod(klass: ObjClass, name: ObjString): void {
    const method = klass.methods.get(name);
    if (method === undefined) this.runtimeError(`Undefined property '${name.chars}'.`);
    const bound = this.heap.newBoundMethod(this.peek(0), method as ObjClosure);
    this.pop();
    this.push(bound);
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

  private readUpvalue(u: ObjUpvalue): Value {
    return u.slot === -1 ? u.closed : this.stack[u.slot];
  }

  private run(): void {
    let frame = this.frames[this.frames.length - 1];
    let code = frame.closure.fn.chunk.code;
    let constants = frame.closure.fn.chunk.constants;
    const readByte = () => code[frame.ip++];
    const readShort = () => {
      frame.ip += 2;
      return (code[frame.ip - 2] << 8) | code[frame.ip - 1];
    };
    const readConstant = () => constants[readByte()];
    const readString = () => readConstant() as ObjString;
    const reload = () => {
      frame = this.frames[this.frames.length - 1];
      code = frame.closure.fn.chunk.code;
      constants = frame.closure.fn.chunk.constants;
    };
    const numbers = () => {
      if (typeof this.peek(0) !== 'number' || typeof this.peek(1) !== 'number') {
        this.runtimeError('Operands must be numbers.');
      }
    };

    for (;;) {
      this.instructionsExecuted++;
      const instruction = readByte();
      switch (instruction) {
        case OP.CONSTANT: this.push(readConstant()); break;
        case OP.NIL: this.push(null); break;
        case OP.TRUE: this.push(true); break;
        case OP.FALSE: this.push(false); break;
        case OP.POP: this.pop(); break;
        case OP.GET_LOCAL: this.push(this.stack[frame.slots + readByte()]); break;
        case OP.SET_LOCAL: this.stack[frame.slots + readByte()] = this.peek(0); break;
        case OP.GET_GLOBAL: {
          const name = readString();
          const v = this.globals.get(name);
          if (v === undefined) this.runtimeError(`Undefined variable '${name.chars}'.`);
          this.push(v);
          break;
        }
        case OP.DEFINE_GLOBAL:
          this.globals.set(readString(), this.peek(0));
          this.pop();
          break;
        case OP.SET_GLOBAL: {
          const name = readString();
          if (this.globals.set(name, this.peek(0))) {
            this.globals.delete(name);
            this.runtimeError(`Undefined variable '${name.chars}'.`);
          }
          break;
        }
        case OP.GET_UPVALUE: this.push(this.readUpvalue(frame.closure.upvalues[readByte()]!)); break;
        case OP.SET_UPVALUE: {
          const u = frame.closure.upvalues[readByte()]!;
          if (u.slot === -1) u.closed = this.peek(0);
          else this.stack[u.slot] = this.peek(0);
          break;
        }
        case OP.GET_PROPERTY: {
          const inst = this.peek(0);
          if (!isObj(inst) || inst.type !== 'instance') this.runtimeError('Only instances have properties.');
          const name = readString();
          const v = inst.fields.get(name);
          if (v !== undefined) {
            this.pop();
            this.push(v);
          } else {
            this.bindMethod(inst.klass, name);
          }
          break;
        }
        case OP.SET_PROPERTY: {
          const inst = this.peek(1);
          if (!isObj(inst) || inst.type !== 'instance') this.runtimeError('Only instances have fields.');
          inst.fields.set(readString(), this.peek(0));
          const v = this.pop();
          this.pop();
          this.push(v);
          break;
        }
        case OP.GET_SUPER: {
          const name = readString();
          const superclass = this.pop() as ObjClass;
          this.bindMethod(superclass, name);
          break;
        }
        case OP.EQUAL: {
          const b = this.pop();
          const a = this.pop();
          this.push(valuesEqual(a, b));
          break;
        }
        case OP.GREATER: { numbers(); const b = this.pop() as number; const a = this.pop() as number; this.push(a > b); break; }
        case OP.LESS: { numbers(); const b = this.pop() as number; const a = this.pop() as number; this.push(a < b); break; }
        case OP.ADD: {
          const b = this.peek(0);
          const a = this.peek(1);
          if (isString(a) && isString(b)) {
            const s = this.heap.copyString(a.chars + b.chars); // a and b stay on the stack: safe from GC
            this.pop();
            this.pop();
            this.push(s);
          } else if (typeof a === 'number' && typeof b === 'number') {
            this.sp -= 2;
            this.push(a + b);
          } else {
            this.runtimeError('Operands must be two numbers or two strings.');
          }
          break;
        }
        case OP.SUBTRACT: { numbers(); const b = this.pop() as number; const a = this.pop() as number; this.push(a - b); break; }
        case OP.MULTIPLY: { numbers(); const b = this.pop() as number; const a = this.pop() as number; this.push(a * b); break; }
        case OP.DIVIDE: { numbers(); const b = this.pop() as number; const a = this.pop() as number; this.push(a / b); break; }
        case OP.NOT: this.push(isFalsey(this.pop())); break;
        case OP.NEGATE:
          if (typeof this.peek(0) !== 'number') this.runtimeError('Operand must be a number.');
          this.push(-(this.pop() as number));
          break;
        case OP.PRINT: this.out.push(formatValue(this.pop())); break;
        case OP.JUMP: { const off = readShort(); frame.ip += off; break; }
        case OP.JUMP_IF_FALSE: { const off = readShort(); if (isFalsey(this.peek(0))) frame.ip += off; break; }
        case OP.LOOP: { const off = readShort(); frame.ip -= off; break; }
        case OP.CALL: {
          const argCount = readByte();
          this.callValue(this.peek(argCount), argCount);
          reload();
          break;
        }
        case OP.INVOKE: {
          const name = readString();
          const argCount = readByte();
          this.invoke(name, argCount);
          reload();
          break;
        }
        case OP.SUPER_INVOKE: {
          const name = readString();
          const argCount = readByte();
          const superclass = this.pop() as ObjClass;
          this.invokeFromClass(superclass, name, argCount);
          reload();
          break;
        }
        case OP.CLOSURE: {
          const fn = readConstant() as ObjClosure['fn'];
          const closure = this.heap.newClosure(fn);
          this.push(closure);
          for (let i = 0; i < closure.upvalues.length; i++) {
            const isLocal = readByte();
            const index = readByte();
            closure.upvalues[i] = isLocal ? this.captureUpvalue(frame.slots + index) : frame.closure.upvalues[index];
          }
          break;
        }
        case OP.CLOSE_UPVALUE:
          this.closeUpvalues(this.sp - 1);
          this.pop();
          break;
        case OP.RETURN: {
          const result = this.pop();
          this.closeUpvalues(frame.slots);
          this.frames.pop();
          if (this.frames.length === 0) {
            this.pop();
            return;
          }
          this.sp = frame.slots;
          this.push(result);
          reload();
          break;
        }
        case OP.CLASS: this.push(this.heap.newClass(readString())); break;
        case OP.INHERIT: {
          const superclass = this.peek(1);
          if (!isObj(superclass) || superclass.type !== 'class') this.runtimeError('Superclass must be a class.');
          (this.peek(0) as ObjClass).methods.addAll(superclass.methods);
          this.pop();
          break;
        }
        case OP.METHOD: {
          const name = readString();
          const method = this.peek(0);
          (this.peek(1) as ObjClass).methods.set(name, method);
          this.pop();
          break;
        }
        default:
          throw new Error(`unknown opcode ${instruction}`);
      }
    }
  }

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
