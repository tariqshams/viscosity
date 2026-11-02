// The table-driven LR parser running on "n + n": the ACTION/GOTO table
// with the cell being used lit, the stack of states (with the grammar
// symbol each one stands for), and the input still to read.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const COLS = ['n', '+', '(', ')', '$', 'E', 'T'];
const all = (a: string) => ({ n: a, '+': a, '(': a, ')': a, $: a });
const TABLE: Record<string, string>[] = [
  { n: 's3', '(': 's4', E: '1', T: '2' },
  { '+': 's5', $: 'acc' },
  all('r2'),
  all('r3'),
  { n: 's3', '(': 's4', E: '6', T: '2' },
  { n: 's3', '(': 's4', T: '7' },
  { '+': 's5', ')': 's8' },
  all('r1'),
  all('r4'),
];

type S = { st: number[]; sy: string[]; inp: string[]; cell: [number, string]; go?: [number, string]; note: string };
const STATES: S[] = [
  { st: [0], sy: [], inp: ['n', '+', 'n', '$'], cell: [0, 'n'], note: 'The stack starts with state 0 alone, and the input ends with $, the end marker. Look up row 0 (the state on top), column n (the next token): s3, shift and go to state 3.' },
  { st: [0, 3], sy: ['n'], inp: ['+', 'n', '$'], cell: [3, '+'], go: [0, 'T'], note: 'n is shifted and 3 pushed. Row 3, column +: r3, reduce by rule 3, T → n. Pop one state (the body is one symbol long), which uncovers 0; then GOTO row 0, column T says push 2.' },
  { st: [0, 2], sy: ['T'], inp: ['+', 'n', '$'], cell: [2, '+'], go: [0, 'E'], note: 'Row 2, column +: r2, reduce by E → T. Pop one state, uncovering 0 again, and GOTO row 0, column E pushes 1. The + has not been read yet: a reduce never consumes a token.' },
  { st: [0, 1], sy: ['E'], inp: ['+', 'n', '$'], cell: [1, '+'], note: 'Row 1, column +: s5. Now the + is shifted.' },
  { st: [0, 1, 5], sy: ['E', '+'], inp: ['n', '$'], cell: [5, 'n'], note: 'Row 5, column n: s3. Shift the second number.' },
  { st: [0, 1, 5, 3], sy: ['E', '+', 'n'], inp: ['$'], cell: [3, '$'], go: [5, 'T'], note: 'Row 3, column $: reduce T → n. Pop one state, uncovering 5 this time, and GOTO row 5, column T pushes 7. The same reduction lands in a different state, because what is under it differs.' },
  { st: [0, 1, 5, 7], sy: ['E', '+', 'T'], inp: ['$'], cell: [7, '$'], go: [0, 'E'], note: 'Row 7, column $: r1, reduce E → E + T. The body has three symbols, so pop three states, uncovering 0; GOTO row 0, column E pushes 1.' },
  { st: [0, 1], sy: ['E'], inp: ['$'], cell: [1, '$'], note: 'Row 1, column $: acc. The whole input was one E, so the parse succeeds. Seven table lookups, and the parser never looked back down the stack.' },
];

const X0 = 34;
const CW = 50;
const RH = 15;

export default function TableParseSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="An LR parser driven by its table" steps={s} note={st.note}>
      <Svg w={400} h={262} title="The ACTION and GOTO table with the cell in use lit, the stack of states, and the input">
        {COLS.map((c, k) => (
          <T key={c} x={X0 + k * CW + CW / 2} y={8} size={12} mono anchor="middle" weight={700} fill={k >= 5 ? tok('accent') : tok('muted')}>{c}</T>
        ))}
        <line x1={X0 + 5 * CW} y1={0} x2={X0 + 5 * CW} y2={18 + 9 * RH} stroke={tok('line')} strokeWidth={1.5} />
        {TABLE.map((row, r) => (
          <g key={r}>
            <T x={X0 - 8} y={24 + r * RH} size={12} mono anchor="end" weight={r === st.st[st.st.length - 1] ? 700 : 400} fill={r === st.st[st.st.length - 1] ? tok('brand') : tok('muted')}>{r}</T>
            {COLS.map((c, k) => {
              const hot = st.cell[0] === r && st.cell[1] === c;
              const gone = st.go && st.go[0] === r && st.go[1] === c;
              return (
                <g key={c}>
                  {(hot || gone) && <rect x={X0 + k * CW + 3} y={17 + r * RH} width={CW - 6} height={RH - 1} rx={3} fill={hot ? tok('brand', 0.22) : tok('accent', 0.22)} />}
                  <T x={X0 + k * CW + CW / 2} y={24 + r * RH} size={11} mono anchor="middle" weight={hot || gone ? 700 : 400} fill={row[c] ? undefined : tok('muted')}>{row[c] ?? '·'}</T>
                </g>
              );
            })}
          </g>
        ))}
        <T x={4} y={175} size={12} weight={700} fill={tok('muted')}>stack</T>
        {st.st.map((q, k) => (
          <g key={k}>
            <Box x={50 + k * 44} y={164} w={38} h={24} fill={k === st.st.length - 1 ? tok('brand', 0.18) : tok('panel')} stroke={tok('ink', 0.4)}>
              <T x={69 + k * 44} y={177} size={13} mono anchor="middle">{q}</T>
            </Box>
            {k > 0 && <T x={69 + k * 44} y={198} size={12} mono anchor="middle" fill={tok('accent')}>{st.sy[k - 1]}</T>}
          </g>
        ))}
        <T x={4} y={232} size={12} weight={700} fill={tok('muted')}>input</T>
        {st.inp.map((t, k) => (
          <Box key={k} x={50 + k * 34} y={220} w={28} h={24} stroke={k === 0 ? tok('brand') : tok('ink', 0.3)}>
            <T x={64 + k * 34} y={233} size={13} mono anchor="middle">{t}</T>
          </Box>
        ))}
        <T x={396} y={250} size={11} anchor="end" fill={tok('muted')}>lit: the ACTION cell; orange: GOTO</T>
      </Svg>
    </StepFrame>
  );
}
