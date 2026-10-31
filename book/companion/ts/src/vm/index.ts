// Drip's bytecode VM: compile to bytecode, then run it.
import { VM, type VmResult } from './vm.ts';
export { VM } from './vm.ts';
export { compile } from './compiler.ts';
export { disassembleChunk } from './debug.ts';
export { Heap } from './heap.ts';

export function runVm(source: string, opts: { stressGC?: boolean; debugGC?: boolean } = {}): VmResult {
  return new VM(opts).interpret(source);
}
