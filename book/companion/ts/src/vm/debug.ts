// A disassembler: prints bytecode as readable text (book chapter 46).
import { OP, OP_NAMES, type Chunk } from './chunk.ts';
import { formatValue, type ObjFunction } from './object.ts';

export function disassembleChunk(chunk: Chunk, name: string): string[] {
  const lines = [`== ${name} ==`];
  for (let offset = 0; offset < chunk.code.length; ) {
    const [text, next] = disassembleInstruction(chunk, offset);
    lines.push(text);
    offset = next;
  }
  return lines;
}

export function disassembleInstruction(chunk: Chunk, offset: number): [string, number] {
  const pad = (n: number, w: number) => String(n).padStart(w, '0');
  const line = offset > 0 && chunk.lines[offset] === chunk.lines[offset - 1] ? '   |' : String(chunk.lines[offset]).padStart(4);
  const prefix = `${pad(offset, 4)} ${line} `;
  const op = chunk.code[offset];
  const name = OP_NAMES[op] ?? `Unknown opcode ${op}`;
  const constant = () => {
    const c = chunk.code[offset + 1];
    return [`${prefix}${name.padEnd(16)} ${String(c).padStart(4)} '${formatValue(chunk.constants[c])}'`, offset + 2] as [string, number];
  };
  const byte = () => [`${prefix}${name.padEnd(16)} ${String(chunk.code[offset + 1]).padStart(4)}`, offset + 2] as [string, number];
  const jump = (sign: number) => {
    const j = (chunk.code[offset + 1] << 8) | chunk.code[offset + 2];
    return [`${prefix}${name.padEnd(16)} ${String(offset).padStart(4)} -> ${offset + 3 + sign * j}`, offset + 3] as [string, number];
  };
  const invoke = () => {
    const c = chunk.code[offset + 1];
    const args = chunk.code[offset + 2];
    return [`${prefix}${name.padEnd(16)} (${args} args) ${String(c).padStart(4)} '${formatValue(chunk.constants[c])}'`, offset + 3] as [string, number];
  };
  switch (op) {
    case OP.CONSTANT: case OP.GET_GLOBAL: case OP.DEFINE_GLOBAL: case OP.SET_GLOBAL:
    case OP.GET_PROPERTY: case OP.SET_PROPERTY: case OP.GET_SUPER: case OP.CLASS: case OP.METHOD:
      return constant();
    case OP.GET_LOCAL: case OP.SET_LOCAL: case OP.GET_UPVALUE: case OP.SET_UPVALUE: case OP.CALL:
      return byte();
    case OP.JUMP: case OP.JUMP_IF_FALSE: return jump(1);
    case OP.LOOP: return jump(-1);
    case OP.INVOKE: case OP.SUPER_INVOKE: return invoke();
    case OP.CLOSURE: {
      let o = offset + 1;
      const c = chunk.code[o++];
      const fn = chunk.constants[c] as ObjFunction;
      const out = [`${prefix}${name.padEnd(16)} ${String(c).padStart(4)} ${formatValue(fn)}`];
      for (let i = 0; i < fn.upvalueCount; i++) {
        const isLocal = chunk.code[o++];
        const index = chunk.code[o++];
        out.push(`${pad(o - 2, 4)}    |                     ${isLocal ? 'local' : 'upvalue'} ${index}`);
      }
      return [out.join('\n'), o];
    }
    default:
      return [`${prefix}${name}`, offset + 1];
  }
}
