// Chapter 365-b (Padding and repr): laying out struct { a: u8, b: f64, c: u8 } byte by byte.
// The repr(C) steps follow the algorithm in the Rust Reference ("Type
// layout", #[repr(C)] structs). The offsets were measured with
// std::mem::offset_of! on rustc 1.97.0, x86-64 Linux: repr(C) gives
// a@0 b@8 c@16, size 24; the default representation gives b@0 a@8 c@9,
// size 16. The default order is the compiler's choice, not a promise.
import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const CODE = `#[repr(C)]
struct C3 {
    a: u8,
    b: f64,
    c: u8,
}`;

type Cell = 'a' | 'b' | 'c' | 'pad' | 'tail' | null;
type S = { line: number | null; cells: Cell[]; size?: number; repr: 'C' | 'Rust'; note: string };

const row = (spec: [Cell, number][]): Cell[] => spec.flatMap(([c, n]) => Array(n).fill(c));

const STATES: S[] = [
  { line: 2, repr: 'C', cells: row([['a', 1]]), note: 'repr(C) lays fields out in the order you wrote them. a is a u8: size 1, alignment 1, so it goes at offset 0.' },
  { line: 3, repr: 'C', cells: row([['a', 1], ['pad', 7]]), note: 'b is an f64, which must start at a multiple of 8. The next free offset is 1, so 7 bytes of padding go in first. Nothing is stored in them.' },
  { line: 3, repr: 'C', cells: row([['a', 1], ['pad', 7], ['b', 8]]), note: 'b takes offsets 8 to 15.' },
  { line: 4, repr: 'C', cells: row([['a', 1], ['pad', 7], ['b', 8], ['c', 1]]), note: 'c is another u8, alignment 1: offset 16. That is 17 bytes so far.' },
  { line: 5, repr: 'C', size: 24, cells: row([['a', 1], ['pad', 7], ['b', 8], ['c', 1], ['tail', 7]]), note: 'The struct’s alignment is its largest field’s, 8, and its size must be a multiple of that, so 7 more bytes go on the end: 24. In a [C3; 2], the second element’s b then lands on a multiple of 8 again. 14 of the 24 bytes are padding.' },
  { line: null, repr: 'Rust', size: 16, cells: row([['b', 8], ['a', 1], ['c', 1], ['tail', 6]]), note: 'Without #[repr(C)], rustc 1.97 put b first, then a and c, and padded to 16. Same fields, two thirds the size. The Reference promises nothing about this order; it could change.' },
];

const COL: Record<'a' | 'b' | 'c', string> = { a: 'brand', b: 'accent', c: 'safe' };

export default function PadSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const cw = 40;
  const x0 = 40;
  return (
    <StepFrame title="Padding, one byte at a time" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={170} title="A grid of 24 bytes, 8 per row, showing where each field and each padding byte goes">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>
          {st.repr === 'C' ? 'repr(C): declaration order' : 'default repr: compiler’s order'}
        </T>
        {st.size && <T x={392} y={12} size={12} weight={700} anchor="end" fill={tok('brand')}>size {st.size}</T>}
        {[0, 1, 2].map((r) => (
          <T key={r} x={32} y={42 + r * 40} size={11} mono anchor="end" fill={tok('muted')}>{r * 8}</T>
        ))}
        {Array.from({ length: 24 }, (_, i) => {
          const c = st.cells[i] ?? null;
          const x = x0 + (i % 8) * cw;
          const y = 26 + Math.floor(i / 8) * 40;
          const isField = c === 'a' || c === 'b' || c === 'c';
          const fill = isField ? tok(COL[c], 0.25) : c ? tok('muted', 0.12) : 'transparent';
          const stroke = isField ? tok(COL[c]) : c ? tok('muted', 0.6) : tok('line', 0.5);
          const label = isField ? c : c === 'pad' || c === 'tail' ? '·' : '';
          return (
            <Box key={i} x={x + 1} y={y} w={cw - 2} h={32} r={2} fill={fill} stroke={stroke} dash={!isField}>
              <T x={x + cw / 2} y={y + 16} size={13} mono anchor="middle" fill={isField ? tok('ink') : tok('muted')}>{label}</T>
            </Box>
          );
        })}
        <T x={40} y={156} size={11} fill={tok('muted')}>
          · = padding ({st.cells.filter((c) => c === 'pad' || c === 'tail').length} bytes)
        </T>
      </Svg>
    </StepFrame>
  );
}
