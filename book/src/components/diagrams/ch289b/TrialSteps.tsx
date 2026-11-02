import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 289b: trial deletion, the synchronous cycle collection of Bacon
// and Rajan (2001). A and B form a garbage cycle; C and D form a cycle
// that the variable v still reaches. Counts are trial copies.
type C = 'black' | 'purple' | 'gray' | 'white' | 'freed';
type S = { col: Record<string, C>; rc: Record<string, number>; note: string };

const POS: Record<string, [number, number]> = { A: [70, 60], B: [70, 150], C: [270, 60], D: [270, 150] };
const COLOUR: Record<C, string> = { black: 'ink', purple: 'f4', gray: 'muted', white: 'line', freed: 'line' };

const STATES: S[] = [
  { col: { A: 'purple', B: 'black', C: 'purple', D: 'black' }, rc: { A: 1, B: 1, C: 2, D: 1 }, note: 'Two cycles. Nothing points at A or B from outside, yet each has count 1, so counting alone never frees them. A and C were decremented to a non-zero count earlier, so they were remembered as candidates (purple).' },
  { col: { A: 'gray', B: 'gray', C: 'purple', D: 'black' }, rc: { A: 0, B: 0, C: 2, D: 1 }, note: 'Mark gray from A: walk everything A reaches and subtract one for each reference met on the way, as if those internal references were deleted. A → B takes B to 0, B → A takes A to 0.' },
  { col: { A: 'gray', B: 'gray', C: 'gray', D: 'gray' }, rc: { A: 0, B: 0, C: 1, D: 0 }, note: 'Mark gray from C the same way: D drops to 0, and C to 1. That remaining 1 is a reference from outside the walked objects: the variable v.' },
  { col: { A: 'white', B: 'white', C: 'gray', D: 'gray' }, rc: { A: 0, B: 0, C: 1, D: 0 }, note: 'Scan: a gray object whose trial count is 0 is held only by the objects just walked. A and B are white: probable garbage.' },
  { col: { A: 'white', B: 'white', C: 'black', D: 'black' }, rc: { A: 0, B: 0, C: 2, D: 1 }, note: 'C still has a count above 0, so it is alive; scan black restores the counts of everything it reaches (D goes back to 1, C to 2) and colours them black, alive.' },
  { col: { A: 'freed', B: 'freed', C: 'black', D: 'black' }, rc: { A: 0, B: 0, C: 2, D: 1 }, note: 'Collect white: A and B are freed. The live cycle C ↔ D is untouched, with its true counts back in place.' },
];

const EDGES: [string, string, number][] = [['A', 'B', 0.6], ['B', 'A', 0.6], ['C', 'D', 0.6], ['D', 'C', 0.6]];

export default function TrialSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Trial deletion finds a garbage cycle" steps={s} note={st.note}>
      <Svg w={400} h={208} title="Objects A and B in a cycle with no outside reference, and objects C and D in a cycle reached from the variable v, coloured as the cycle collector works">
        {EDGES.map(([a, b, bend]) => {
          const [x1, y1] = POS[a];
          const [x2, y2] = POS[b];
          const dy = y2 > y1 ? 1 : -1;
          return <Arrow key={a + b} x1={x1 + (dy > 0 ? -14 : 14)} y1={y1 + dy * 22} x2={x2 + (dy > 0 ? -14 : 14)} y2={y2 - dy * 22} bend={bend} />;
        })}
        <Box x={344} y={46} w={44} h={28} fill={tok('panel')}>
          <T x={366} y={60} size={12} mono anchor="middle">v</T>
        </Box>
        <Arrow x1={344} y1={60} x2={306} y2={60} />
        {Object.entries(POS).map(([n, [x, y]]) => {
          const c = st.col[n];
          return (
            <g key={n}>
              <Box x={x - 36} y={y - 20} w={72} h={40} dash={c === 'freed'} fill={c === 'freed' ? 'transparent' : tok(COLOUR[c], 0.15)} stroke={tok(COLOUR[c])}>
                <T x={x} y={y - 6} size={13} mono weight={700} anchor="middle">{c === 'freed' ? '' : n}</T>
                <T x={x} y={y + 10} size={11} mono anchor="middle">{c === 'freed' ? 'freed' : `rc ${st.rc[n]}`}</T>
              </Box>
              <T x={x} y={y + 32} size={11} anchor="middle" fill={tok('muted')}>{c === 'freed' ? '' : c}</T>
            </g>
          );
        })}
        <T x={6} y={200} size={11} fill={tok('muted')}>Counts shown are the collector’s trial copies.</T>
      </Svg>
    </StepFrame>
  );
}
