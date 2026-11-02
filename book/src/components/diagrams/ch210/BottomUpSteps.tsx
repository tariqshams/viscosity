// Chapter 209-b (staged split of 191): bottom-up inlining with a toy size
// budget (inline a callee only if its size is at most 8). Leaves are
// decided first, so a function is as small or as big as it will get by the
// time its callers look at it.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const POS: Record<string, [number, number]> = { main: [200, 30], step: [200, 100], move: [110, 180], clamp: [290, 180] };
const EDGES: [string, string][] = [['main', 'step'], ['step', 'move'], ['step', 'clamp'], ['move', 'clamp']];

type S = { size: Record<string, number>; hot: string | null; inlined: string[]; kept: string[]; note: string };
const STATES: S[] = [
  { size: { main: 5, step: 10, move: 6, clamp: 4 }, hot: null, inlined: [], kept: [], note: 'Four functions with their sizes (in instructions, say). The rule for this toy: inline a call if the callee’s size is at most 8. The order: leaves first, so visit clamp, move, step, main.' },
  { size: { main: 5, step: 10, move: 6, clamp: 4 }, hot: 'clamp', inlined: [], kept: [], note: 'clamp calls nothing. It is finished as it is: size 4.' },
  { size: { main: 5, step: 10, move: 9, clamp: 4 }, hot: 'move', inlined: ['move>clamp'], kept: [], note: 'move calls clamp, size 4 ≤ 8: inline it. move grows to 6 + 4 − 1 = 9 (the body comes in, the call goes away).' },
  { size: { main: 5, step: 13, move: 9, clamp: 4 }, hot: 'step', inlined: ['move>clamp', 'step>clamp'], kept: ['step>move'], note: 'step calls move, which is now 9: over budget, so that call stays. It also calls clamp, size 4: inline it. step is now 13.' },
  { size: { main: 5, step: 13, move: 9, clamp: 4 }, hot: 'main', inlined: ['move>clamp', 'step>clamp'], kept: ['step>move', 'main>step'], note: 'main calls step, size 13: keep the call. Had we gone top-down, main would have judged step by its old size, 10, before step had taken in clamp; a top-down inliner decides with sizes that are about to change.' },
  { size: { main: 5, step: 13, move: 9, clamp: 4 }, hot: null, inlined: ['move>clamp', 'step>clamp'], kept: ['step>move', 'main>step'], note: 'Done. clamp is now called from nowhere, so its original can be deleted. A recursive pair like even and odd would be a cycle, with no leaf to start from; inliners treat it separately, inlining at most a few levels.' },
];

export default function BottomUpSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Inlining from the leaves up" steps={s} note={st.note}>
      <Svg w={400} h={220} title="The call graph main, step, move, clamp, with sizes. Inlined calls are shown green, kept calls grey.">
        {EDGES.map(([a, b], k) => {
          const key = `${a}>${b}`;
          const [x1, y1] = POS[a];
          const [x2, y2] = POS[b];
          const done = st.inlined.includes(key);
          const kept = st.kept.includes(key);
          return <Arrow key={k} x1={x1} y1={y1 + 16} x2={x2 + (x1 - x2) * 0.1} y2={y2 - 18} color={done ? tok('safe') : kept ? tok('ink', 0.45) : tok('ink', 0.7)} dash={done} width={done ? 2.5 : 2} />;
        })}
        {Object.entries(POS).map(([id, [x, y]]) => (
          <Box key={id} x={x - 44} y={y - 16} w={88} h={32} fill={st.hot === id ? tok('brand', 0.1) : tok('panel')} stroke={st.hot === id ? tok('brand') : tok('line')}>
            <T x={x} y={y - 5} size={12} mono weight={700} anchor="middle">{id}</T>
            <T x={x} y={y + 9} size={11} anchor="middle" fill={tok('muted')}>{`size ${st.size[id]}`}</T>
          </Box>
        ))}
        <T x={6} y={212} size={11} fill={tok('muted')}>green dashed = inlined · grey = call kept · budget: size ≤ 8</T>
      </Svg>
    </StepFrame>
  );
}
