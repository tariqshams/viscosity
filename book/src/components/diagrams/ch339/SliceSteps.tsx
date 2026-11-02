import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// A slice is a window: a pointer to its first element plus a length. The
// cells it covers are highlighted; nothing is copied. The last steps use
// a line of Drip source, the way the Rust scanner cuts out lexemes.

const ARR = ['10', '20', '30', '40', '50', '60'];
const SRC = ['l', 'e', 't', ' ', 'x', ' ', '=', ' ', '1', '0', ';'];

type S = {
  owner: string; cells: string[]; range: [number, number] | null;
  expr: string; type: string; result?: string; note: string;
};

const STATES: S[] = [
  { owner: 'a: [i32; 6]', cells: ARR, range: null, expr: 'let a = [10, 20, 30, 40, 50, 60];', type: '', note: 'An array of six i32s, side by side in memory. It owns its numbers. The small grey numbers are the indices.' },
  { owner: 'a: [i32; 6]', cells: ARR, range: [1, 4], expr: 'let mid = &a[1..4];', type: '&[i32]', result: '20 30 40', note: '&a[1..4] is a view of elements 1, 2 and 3. The end index is not included. The slice holds only two things: where it starts and how many elements it covers.' },
  { owner: 'a: [i32; 6]', cells: ARR, range: [0, 2], expr: 'let head = &a[..2];', type: '&[i32]', result: '10 20', note: 'Leave out the start and the range begins at 0. Still no copying: the pointer is the array’s own first element.' },
  { owner: 'a: [i32; 6]', cells: ARR, range: [3, 6], expr: 'let tail = &a[3..];', type: '&[i32]', result: '40 50 60', note: 'Leave out the end and it runs to the end. &a[..] would be the whole array as a slice.' },
  { owner: 's: String', cells: SRC, range: null, expr: 'let s = String::from("let x = 10;");', type: '', note: 'Now some Drip source, held in a String. Each box is one byte of UTF-8 text. These are all ASCII, so one byte is one character.' },
  { owner: 's: String', cells: SRC, range: [4, 5], expr: 'let name = &s[4..5];', type: '&str', result: '"x"', note: 'A string slice works the same way. The identifier x is the byte range 4..5. Its type is &str: a borrowed view of some text.' },
  { owner: 's: String', cells: SRC, range: [8, 10], expr: 'let num = &s[8..10];', type: '&str', result: '"10"', note: 'The number token is bytes 8..10. This is exactly how the Rust scanner builds a token’s lexeme: &source[start..current]. No new string is made.' },
];

export default function SliceSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const n = st.cells.length;
  const cw = Math.min(56, 380 / n);
  const x0 = (400 - cw * n) / 2;
  const cy = 70;
  const [lo, hi] = st.range ?? [0, 0];
  return (
    <StepFrame title="A slice is a window, not a copy" steps={s} note={st.note}>
      <Svg w={400} h={200} title="An array or string as a row of cells, with a slice drawn as a pointer and a length covering some of the cells">
        <T x={10} y={14} size={13} mono weight={700}>{st.expr}</T>
        <T x={x0} y={42} size={11} weight={700} fill={tok('muted')}>OWNER  {st.owner}</T>
        {st.cells.map((c, k) => {
          const inside = st.range && k >= lo && k < hi;
          return (
            <g key={k}>
              <Box x={x0 + k * cw} y={cy - 16} w={cw} h={32} r={2}
                fill={inside ? tok('safe', 0.2) : tok('panel')}
                stroke={inside ? tok('safe') : tok('line')}>
                <T x={x0 + k * cw + cw / 2} y={cy} size={14} mono anchor="middle">{c === ' ' ? '·' : c}</T>
              </Box>
              <T x={x0 + k * cw + cw / 2} y={cy + 26} size={11} mono anchor="middle" fill={tok('muted')}>{k}</T>
            </g>
          );
        })}
        {st.range && (
          <g>
            <rect x={x0 + lo * cw} y={cy - 20} width={(hi - lo) * cw} height={40} rx={4} fill="none" stroke={tok('safe')} strokeWidth={2.5} />
            <Box x={110} y={130} w={180} h={40} r={6} fill={tok('safe', 0.12)} stroke={tok('safe')}>
              <T x={122} y={141} size={11} fill={tok('muted')}>slice: {st.type}</T>
              <T x={122} y={159} size={13} mono>ptr → [{lo}]   len = {hi - lo}</T>
            </Box>
            <Arrow x1={150} y1={130} x2={x0 + lo * cw + cw / 2} y2={cy + 34} color={tok('safe')} />
            <T x={200} y={188} size={12} mono anchor="middle" fill={tok('muted')}>sees: {st.result}</T>
          </g>
        )}
      </Svg>
    </StepFrame>
  );
}
