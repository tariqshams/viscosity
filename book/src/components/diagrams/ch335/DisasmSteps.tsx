// Chapter 335: drip-rs's disassembler (book/companion/rust/src/debug.rs)
// decoding the chunk for `print 1.5 + 2;` / `print "hi";`. The bytes,
// lines and constants were dumped from the real compiler (rustc 1.97),
// and the text is exactly what `drip-rs --disassemble` prints; the
// TypeScript disassembleFunction prints the same lines.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const CODE = [0, 0, 0, 0, 0, 1, 20, 33, 0, 0, 2, 33, 1, 49];
const LINES = [1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2];
const CONSTS = ['1.5', '2', '"hi"'];

const OUT = [
  "0000    1 const               0 '1.5'",
  "0003    | const               1 '2'",
  '0006    | add',
  '0007    | print',
  "0008    2 const               2 'hi'",
  '0011    | print',
  '0012    | none',
  '0013    | return',
];

type S = { at: number; len: number; op: string; k?: number; out: number; note: string };

const STATES: S[] = [
  { at: 0, len: 3, op: 'Const · 3 bytes', k: 0, out: 1, note: 'Offset 0: OpCode::from_byte(0) is Some(Const). Its operand is two bytes, 0 and 0, read big-endian: (0 << 8) | 0 = 0. Constant 0 is 1.5. Line 1 differs from the line before (there is none), so the 1 is printed. The next instruction is at 0 + 3.' },
  { at: 3, len: 3, op: 'Const · 3 bytes', k: 1, out: 2, note: 'Offset 3: another Const, operand 0 1, so constant 1, the number 2. lines[3] equals lines[2], so the line column shows |. The layout is {offset:04} {line:>4} {name:<16} {index:>4}: padStart and padEnd, spelled as format specs.' },
  { at: 6, len: 1, op: 'Add · 1 byte', out: 3, note: 'Offset 6: byte 20 decodes to Add. It has no operands, so the catch-all arm prints only the name, and the next instruction is at 7.' },
  { at: 7, len: 1, op: 'Print · 1 byte', out: 4, note: 'Offset 7: byte 33 is Print. Its printed name, print, comes from the variant’s Debug name, lowercased, with a dot before each later capital: JumpUnlessKeep becomes jump.unless.keep.' },
  { at: 8, len: 3, op: 'Const · 3 bytes', k: 2, out: 5, note: 'Offset 8: line 2 starts, so 2 is printed. The constant is a string, which in drip-rs is a handle into the heap: that is why disassemble_instruction takes &Heap, to turn the handle into the text hi.' },
  { at: 11, len: 3, op: 'Print, None, Return', out: 8, note: 'Print, then the none and return every script ends with. Fourteen bytes, eight instructions: instructions have different lengths, and only decoding each opcode tells the disassembler where the next one starts.' },
];

export default function DisasmSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const cw = 25;
  const x0 = 38;
  return (
    <StepFrame title="Decoding a chunk, one instruction at a time" steps={s} note={st.note}>
      <Svg w={400} h={316} title="The chunk's code and lines arrays, the current instruction highlighted, and the disassembly so far">
        <T x={2} y={22} size={11} mono fill={tok('muted')}>code</T>
        <T x={2} y={50} size={11} mono fill={tok('muted')}>line</T>
        {CODE.map((b, i) => {
          const on = i >= st.at && i < st.at + st.len;
          const isOp = i === st.at;
          return (
            <g key={i}>
              <Box x={x0 + i * cw} y={10} w={cw - 3} h={24} r={3} fill={on ? tok(isOp ? 'brand' : 'accent', 0.22) : tok('panel')} stroke={on ? tok(isOp ? 'brand' : 'accent') : tok('line')}>
                <T x={x0 + i * cw + (cw - 3) / 2} y={22} size={11} mono anchor="middle">{b}</T>
              </Box>
              <T x={x0 + i * cw + (cw - 3) / 2} y={50} size={11} mono anchor="middle" fill={tok('muted')}>{LINES[i]}</T>
            </g>
          );
        })}
        <T x={2} y={78} size={11} mono>constants:</T>
        {CONSTS.map((c, k) => (
          <Box key={k} x={84 + k * 64} y={66} w={58} h={24} r={3} fill={st.k === k ? tok('accent', 0.22) : tok('panel')} stroke={st.k === k ? tok('accent') : tok('line')}>
            <T x={113 + k * 64} y={78} size={11} mono anchor="middle">{k}: {c}</T>
          </Box>
        ))}
        <T x={2} y={106} size={11} mono fill={tok('brand')}>from_byte → {st.op}</T>
        <Box x={2} y={118} w={396} h={192} r={4} fill={tok('panel')}>
          <T x={10} y={134} size={11} mono fill={tok('muted')}>== &lt;script&gt; ==</T>
          {OUT.slice(0, st.out).map((l, j) => (
            <T key={j} x={10} y={154 + j * 19} size={11} mono fill={j === st.out - 1 ? tok('ink') : tok('ink', 0.6)}>
              {l.replace(/ /g, ' ')}
            </T>
          ))}
        </Box>
      </Svg>
    </StepFrame>
  );
}
