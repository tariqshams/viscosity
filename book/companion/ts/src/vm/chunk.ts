// Bytecode chunks (book chapters 45–46).
import type { Value } from './object.ts';

export const OP = {
  CONSTANT: 0, NIL: 1, TRUE: 2, FALSE: 3, POP: 4,
  GET_LOCAL: 5, SET_LOCAL: 6, GET_GLOBAL: 7, DEFINE_GLOBAL: 8, SET_GLOBAL: 9,
  GET_UPVALUE: 10, SET_UPVALUE: 11, GET_PROPERTY: 12, SET_PROPERTY: 13, GET_SUPER: 14,
  EQUAL: 15, GREATER: 16, LESS: 17, ADD: 18, SUBTRACT: 19, MULTIPLY: 20, DIVIDE: 21,
  NOT: 22, NEGATE: 23, PRINT: 24, JUMP: 25, JUMP_IF_FALSE: 26, LOOP: 27,
  CALL: 28, INVOKE: 29, SUPER_INVOKE: 30, CLOSURE: 31, CLOSE_UPVALUE: 32, RETURN: 33,
  CLASS: 34, INHERIT: 35, METHOD: 36,
} as const;

export const OP_NAMES: string[] = [];
for (const [k, v] of Object.entries(OP)) OP_NAMES[v] = `OP_${k}`;

export class Chunk {
  code: number[] = [];
  lines: number[] = [];
  constants: Value[] = [];

  write(byte: number, line: number): void {
    this.code.push(byte);
    this.lines.push(line);
  }

  addConstant(v: Value): number {
    this.constants.push(v);
    return this.constants.length - 1;
  }
}
