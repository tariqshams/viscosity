// Chapter 231: the lost-copy problem. The copy for the loop phi is put at
// the end of b1 (naive) or on the split back edge; both are run side by
// side until the loop exits.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const NAIVE = ['b1: x3 = x2 + 1', '    x2 = x3', '    if x3 < 3: b1', 'b2: return x2'];
const SPLIT = ['b1: x3 = x2 + 1', '    if x3 < 3: b5', 'b2: return x2', 'b5: x2 = x3; j b1'];

type Side = { line: number | null; x2: number | string; x3: number | string; out?: string };
type S = { a: Side; b: Side; note: string };
const STATES: S[] = [
  { a: { line: null, x2: 1, x3: '' }, b: { line: null, x2: 1, x3: '' }, note: 'Both versions start the same: the copy for the entry edge, x2 = x1 = 1, sits at the end of b0. On the left, the back-edge copy x2 = x3 was put at the end of b1; on the right, the edge b1 → b1 was split, and the copy lives in a new block b5.' },
  { a: { line: 0, x2: 1, x3: 2 }, b: { line: 0, x2: 1, x3: 2 }, note: 'First trip round the loop: x3 = x2 + 1 = 2, on both sides.' },
  { a: { line: 1, x2: 2, x3: 2 }, b: { line: 1, x2: 1, x3: 2 }, note: 'Left: the copy runs now, before the test, so x2 becomes 2. Right: the test comes first; 2 < 3, so control heads for b5.' },
  { a: { line: 2, x2: 2, x3: 2 }, b: { line: 3, x2: 2, x3: 2 }, note: 'Left: 2 < 3, round again. Right: b5 does the copy x2 = 2 and jumps back. So far both agree.' },
  { a: { line: 0, x2: 2, x3: 3 }, b: { line: 0, x2: 2, x3: 3 }, note: 'Second trip: x3 = x2 + 1 = 3 on both sides.' },
  { a: { line: 1, x2: 3, x3: 3 }, b: { line: 1, x2: 2, x3: 3 }, note: 'Left: the copy runs again, x2 = 3, although this time we are about to leave the loop. Right: 3 < 3 is false, so we leave straight away and b5 never runs.' },
  { a: { line: 3, x2: 3, x3: 3, out: '3' }, b: { line: 2, x2: 2, x3: 3, out: '2' }, note: 'Left returns 3: the value x2 had during the last trip, which the program asked for, was lost when the copy overwrote it. Right returns 2, the correct answer. That is the lost-copy problem.' },
];

function Panel({ x, title, code, side, ok }: { x: number; title: string; code: string[]; side: Side; ok: boolean }) {
  return (
    <g>
      <T x={x} y={12} size={11} weight={700} fill={tok('muted')}>{title}</T>
      {code.map((l, k) => (
        <g key={k}>
          {side.line === k && <rect x={x - 4} y={22 + k * 20} width={190} height={20} fill={tok('brand', 0.15)} />}
          <T x={x} y={32 + k * 20} size={12} mono>{l}</T>
        </g>
      ))}
      <Box x={x} y={112} w={84} h={30}><T x={x + 42} y={128} size={13} mono anchor="middle">x2 = {side.x2}</T></Box>
      <Box x={x + 96} y={112} w={84} h={30}><T x={x + 138} y={128} size={13} mono anchor="middle">x3 = {side.x3}</T></Box>
      {side.out && <T x={x} y={164} size={13} weight={700} fill={ok ? tok('safe') : tok('danger')}>returns {side.out} {ok ? '(right)' : '(wrong)'}</T>}
    </g>
  );
}

export default function LostCopySteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="The lost copy" steps={s} note={st.note}>
      <Svg w={400} h={176} title="Two out-of-SSA translations of the same loop, run side by side: the copy in b1, and the copy on a split edge.">
        <Panel x={8} title="COPY AT END OF b1" code={NAIVE} side={st.a} ok={false} />
        <Panel x={208} title="EDGE SPLIT: COPY IN b5" code={SPLIT} side={st.b} ok={true} />
      </Svg>
    </StepFrame>
  );
}
