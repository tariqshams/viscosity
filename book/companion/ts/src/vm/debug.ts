// A disassembler: prints bytecode as readable text (the book's chapter “Bytecode as data”).
//
//   0004    2 load.global       2 'add'
//   offset line  instruction    operands
import { Op, OP_NAMES, type Chunk } from './chunk.ts';
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

/** A function's chunk, then the chunks of the functions in its constants. */
export function disassembleFunction(fn: ObjFunction): string[] {
  const lines = disassembleChunk(fn.chunk, fn.name ? fn.name.chars : fn.isScript ? '<script>' : '<fn>');
  for (const c of fn.chunk.constants) {
    if (c !== null && typeof c === 'object' && c.type === 'function') lines.push(...disassembleFunction(c));
  }
  return lines;
}

export function disassembleInstruction(chunk: Chunk, offset: number): [string, number] {
  const code = chunk.code;
  const line = offset > 0 && chunk.lines[offset] === chunk.lines[offset - 1] ? '   |' : String(chunk.lines[offset]).padStart(4);
  const prefix = `${String(offset).padStart(4, '0')} ${line} `;
  const op = code[offset];
  const name = (OP_NAMES[op] ?? `unknown opcode ${op}`).padEnd(16);
  const short = (at: number) => (code[at] << 8) | code[at + 1];
  const constant = (k: number) => `${String(k).padStart(4)} '${formatValue(chunk.constants[k])}'`;
  switch (op) {
    case Op.Const: case Op.LoadGlobal: case Op.DefineGlobal: case Op.StoreGlobal:
    case Op.GetProp: case Op.SetProp: case Op.GetSuper: case Op.Class: case Op.Method:
      return [`${prefix}${name} ${constant(short(offset + 1))}`, offset + 3];
    case Op.LoadLocal: case Op.StoreLocal: case Op.LoadUpvalue: case Op.StoreUpvalue:
    case Op.Call: case Op.New: case Op.List: case Op.IncLocal:
      return [`${prefix}${name} ${String(code[offset + 1]).padStart(4)}`, offset + 2];
    case Op.Jump: case Op.JumpUnless: case Op.JumpUnlessKeep: case Op.JumpIfKeep:
      return [`${prefix}${name} ${String(offset).padStart(4)} -> ${offset + 3 + short(offset + 1)}`, offset + 3];
    case Op.Loop:
      return [`${prefix}${name} ${String(offset).padStart(4)} -> ${offset + 3 - short(offset + 1)}`, offset + 3];
    case Op.Invoke: case Op.InvokeSuper:
      return [`${prefix}${name} ${constant(short(offset + 1))} (${code[offset + 3]} args)`, offset + 4];
    case Op.Closure: {
      const k = short(offset + 1);
      const fn = chunk.constants[k] as ObjFunction;
      const out = [`${prefix}${name} ${String(k).padStart(4)} ${formatValue(fn)}`];
      let o = offset + 3;
      for (let i = 0; i < fn.upvalueCount; i++) {
        const isLocal = code[o];
        const index = code[o + 1];
        out.push(`${String(o).padStart(4, '0')}    |   ${isLocal ? 'local' : 'upvalue'} ${index}`);
        o += 2;
      }
      return [out.join('\n'), o];
    }
    default:
      return [`${prefix}${name.trimEnd()}`, offset + 1];
  }
}
