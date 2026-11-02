// Chapter 170: sparse conditional constant propagation on a diamond. Values
// start at ⊤ ("no information"), blocks start unreachable, and a branch on a
// constant only makes one edge executable, so the phi ignores the other.
import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const CODE = `let x = 1;
let y;
if (x > 0) { y = 2; } else { y = 3; }
let z = y * 10;`;

const LINES: [string, string][][] = [
  [['%0 = const 1', '%0'], ['%2 = const 0', '%2'], ['%3 = > %0, %2', '%3']],
  [['%4 = const 2', '%4']],
  [['%5 = const 3', '%5']],
  [['%6 = φ(%4, %5)', '%6'], ['%7 = const 10', '%7'], ['%8 = * %6, %7', '%8']],
];

type S = {
  line: number;
  /** lattice value per SSA id: '' means ⊤ (no information yet) */
  v: Record<string, string>;
  /** which blocks are executable */
  live: boolean[];
  /** which edges are executable: b0→b1, b0→b2, b1→b3, b2→b3 */
  edges: boolean[];
  hot?: number;
  note: string;
};

const NONE = [false, false, false, false];
const STATES: S[] = [
  { line: -1, v: {}, live: NONE, edges: NONE, note: 'SCCP starts doubly optimistic. Every value is ⊤, "no information yet", and every block is assumed unreachable until some executable edge leads to it.' },
  { line: 0, v: { '%0': '1', '%2': '0' }, live: [true, false, false, false], edges: NONE, hot: 0, note: 'The entry block is reachable. Its constants get their values: %0 is 1, %2 is 0. (These are the real VIR ids; the const undefined for let y, %1, is left out.)' },
  { line: 2, v: { '%0': '1', '%2': '0', '%3': 'true' }, live: [true, false, false, false], edges: NONE, hot: 0, note: 'Both operands of %3 are constants, so fold it: 1 > 0 is true. This is constant folding, fed by constant propagation.' },
  { line: 2, v: { '%0': '1', '%2': '0', '%3': 'true' }, live: [true, false, false, false], edges: [true, false, false, false], hot: 0, note: 'The branch condition is the constant true, so only the edge to b1 becomes executable. The edge to b2 is never marked, and b2 stays unreachable.' },
  { line: 2, v: { '%0': '1', '%2': '0', '%3': 'true', '%4': '2' }, live: [true, true, false, false], edges: [true, false, true, false], hot: 1, note: 'b1 runs: %4 is 2, and its edge to b3 becomes executable. Nobody ever looks inside b2, so %5 stays ⊤.' },
  { line: 3, v: { '%0': '1', '%2': '0', '%3': 'true', '%4': '2', '%6': '2' }, live: [true, true, false, true], edges: [true, false, true, false], hot: 3, note: 'The phi merges only operands whose edges are executable. The b2 edge isn’t, so %6 = merge(2) = 2. A plain propagation, without edges, would merge 2 with 3 and give up: "varies".' },
  { line: 3, v: { '%0': '1', '%2': '0', '%3': 'true', '%4': '2', '%6': '2', '%7': '10', '%8': '20' }, live: [true, true, false, true], edges: [true, false, true, false], hot: 3, note: 'Fold again: %8 = 2 × 10 = 20. Nothing is left to process. z is the constant 20, the branch always goes to b1, and b2 is dead code for the next chapter to delete.' },
];

const POS = [
  { x: 92, y: 4, w: 216 },
  { x: 6, y: 100, w: 176 },
  { x: 218, y: 100, w: 176 },
  { x: 92, y: 160, w: 216 },
];
const LH = 16;

export default function SccpSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const h = (k: number) => 20 + LINES[k].length * LH;
  const ec = (k: number) => (st.edges[k] ? tok('brand') : tok('ink', 0.25));
  return (
    <StepFrame title="Constants flowing through a CFG" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={248} title="A diamond-shaped CFG. b0 branches to b1 and b2, which join at b3. Each instruction shows its lattice value. Unreachable blocks are faded and executable edges are highlighted.">
        <Arrow x1={150} y1={4 + h(0)} x2={100} y2={98} color={ec(0)} dash={!st.edges[0]} />
        <Arrow x1={250} y1={4 + h(0)} x2={300} y2={98} color={ec(1)} dash={!st.edges[1]} />
        <Arrow x1={100} y1={100 + h(1)} x2={150} y2={158} color={ec(2)} dash={!st.edges[2]} />
        <Arrow x1={300} y1={100 + h(2)} x2={250} y2={158} color={ec(3)} dash={!st.edges[3]} />
        {POS.map((p, k) => (
          <Box key={k} x={p.x} y={p.y} w={p.w} h={h(k)} opacity={st.live[k] ? 1 : 0.45} dash={!st.live[k]} fill={st.hot === k ? tok('brand', 0.08) : tok('panel')} stroke={st.hot === k ? tok('brand') : tok('line')}>
            <T x={p.x + 8} y={p.y + 10} size={10} weight={700} fill={tok('muted')}>{`b${k}${st.live[k] ? '' : ' · unreachable'}`}</T>
            {LINES[k].map(([text, id], j) => {
              const val = st.v[id];
              return (
                <g key={j}>
                  <T x={p.x + 8} y={p.y + 25 + j * LH} size={11.5} mono fill={text.includes('φ') ? tok('accent') : undefined}>{text}</T>
                  <T x={p.x + p.w - 8} y={p.y + 25 + j * LH} size={11.5} mono anchor="end" weight={700} fill={val ? tok('safe') : tok('muted')}>{val ?? '⊤'}</T>
                </g>
              );
            })}
          </Box>
        ))}
        <T x={6} y={240} size={11} fill={tok('muted')}>⊤ = no information yet · solid edge = executable</T>
      </Svg>
    </StepFrame>
  );
}
