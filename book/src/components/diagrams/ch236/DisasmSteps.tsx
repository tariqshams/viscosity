// Chapter 236: drip-rs's disassembler (book/companion/rust/src/debug.rs)
// decoding the chunk for `print 1.5 + 2;` / `print "hi";`. The bytes,
// lines, constants and output text are the real ones: drip-rs
// --disassemble printed exactly these lines, and the TypeScript
// disassembleChunk printed the same bytes (compared with md5sum).
import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const CODE = [0, 0, 0, 1, 18, 24, 0, 2, 24, 1, 33];
const LINES = [1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2];
const CONSTS = ['1.5', '2', '"hi"'];

type S = { at: number; len: number; op: string; arm: string; k?: number; out: string[]; note: string };

const OUT = [
  "0000    1 OP_CONSTANT         0 '1.5'",
  "0002    | OP_CONSTANT         1 '2'",
  '0004    | OP_ADD',
  '0005    | OP_PRINT',
  "0006    2 OP_CONSTANT         2 'hi'",
  '0008    | OP_PRINT',
  '0009    | OP_NIL',
  '0010    | OP_RETURN',
];

const STATES: S[] = [
  { at: 0, len: 2, op: 'Constant', arm: 'constant arm: 2 bytes', k: 0, out: OUT.slice(0, 1), note: 'offset 0: OpCode::from_byte(0) is Some(Constant). Its arm reads the operand byte code[1] = 0, and prints constants[0] through the heap: \'1.5\'. Line 1 differs from the line before (there is none), so the number is printed. Next offset: 2.' },
  { at: 2, len: 2, op: 'Constant', arm: 'constant arm: 2 bytes', k: 1, out: OUT.slice(0, 2), note: 'offset 2: another Constant, operand 1, value 2. lines[2] equals lines[1], so the line column shows |. The format is {offset:04} {line:>4}, then {name:<16} {index:>4}: padStart and padEnd, spelled as format specs.' },
  { at: 4, len: 1, op: 'Add', arm: 'default arm: 1 byte', out: OUT.slice(0, 3), note: 'offset 4: byte 18 decodes to Add. It has no operands, so the _ arm prints just the name, and the next instruction is at 5.' },
  { at: 5, len: 1, op: 'Print', arm: 'default arm: 1 byte', out: OUT.slice(0, 4), note: 'offset 5: byte 24 is Print. Each opcode’s name comes from its Debug name: Print becomes OP_PRINT, GetLocal would become OP_GET_LOCAL.' },
  { at: 6, len: 2, op: 'Constant', arm: 'constant arm: 2 bytes', k: 2, out: OUT.slice(0, 5), note: 'offset 6: line 2 starts, so 2 is printed. The constant is a string, so in drip-rs it is a handle into the heap: that is why disassemble_instruction takes &Heap, and the TypeScript one doesn’t need to.' },
  { at: 8, len: 3, op: 'Print, Nil, Return', arm: '1 byte each', out: OUT, note: 'Print, then the Nil and Return every script ends with. Eleven bytes, eight instructions: the offsets jump because instructions have different lengths, and only decoding the opcode says how long each one is.' },
];

export default function DisasmSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const cw = 32;
  const x0 = 20;
  return (
    <StepFrame title="Decoding a chunk, one instruction at a time" steps={s} note={st.note}>
      <Svg w={400} h={300} title="The chunk's code and lines arrays, the current instruction highlighted, and the disassembly so far">
        <T x={4} y={22} size={9} mono fill={tok('muted')}>code</T>
        <T x={4} y={52} size={9} mono fill={tok('muted')}>line</T>
        {CODE.map((b, i) => {
          const on = i >= st.at && i < st.at + st.len;
          const isOp = i === st.at;
          return (
            <g key={i}>
              <Box x={x0 + 14 + i * cw} y={10} w={cw - 4} h={24} r={3} fill={on ? tok(isOp ? 'brand' : 'accent', 0.22) : tok('panel')} stroke={on ? tok(isOp ? 'brand' : 'accent') : tok('line')}>
                <T x={x0 + 14 + i * cw + (cw - 4) / 2} y={22} size={11} mono anchor="middle">{b}</T>
              </Box>
              <T x={x0 + 14 + i * cw + (cw - 4) / 2} y={52} size={10} mono anchor="middle" fill={tok('muted')}>{LINES[i]}</T>
            </g>
          );
        })}
        <T x={4} y={78} size={10} mono>constants:</T>
        {CONSTS.map((c, k) => (
          <Box key={k} x={84 + k * 56} y={66} w={50} h={22} r={3} fill={st.k === k ? tok('accent', 0.22) : tok('panel')} stroke={st.k === k ? tok('accent') : tok('line')}>
            <T x={109 + k * 56} y={77} size={10} mono anchor="middle">{k}: {c}</T>
          </Box>
        ))}
        <T x={4} y={106} size={10} mono fill={tok('brand')}>from_byte → {st.op} · {st.arm}</T>
        <Box x={4} y={118} w={392} h={176} r={4} fill={tok('panel')}>
          <T x={12} y={132} size={10} mono fill={tok('muted')}>== &lt;script&gt; ==</T>
          {st.out.map((l, j) => (
            <T key={j} x={12} y={150 + j * 18} size={10} mono fill={j === st.out.length - 1 ? tok('ink') : tok('ink', 0.6)}>
              {l.replace(/ /g, ' ')}
            </T>
          ))}
        </Box>
      </Svg>
    </StepFrame>
  );
}
