// Two shapes for sumsq's while loop, run with n = 3: our top-tested loop
// (bge at the top, j at the bottom) and clang 18 -O2's rotated loop
// (blez once as a guard, bne at the bottom). Counts branches executed.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

type S = { i: string; top: string[]; rot: string[]; note: string };

const STATES: S[] = [
  { i: 'start', top: [], rot: [], note: 'Both loops compute the same sum for n = 3. We count the branch and jump instructions each one executes, because every one is work, and a taken branch can disturb the pipeline (chapter 55).' },
  { i: 'entry', top: ['bge'], rot: ['blez'], note: 'Before the first trip, each shape tests once: the top-tested loop asks "i ≥ n?" at its head; the rotated one asks "n ≤ 0?" in a guard placed before the loop.' },
  { i: 'i = 0', top: ['bge', 'j'], rot: ['blez', 'bne'], note: 'Trip 1. The top-tested body ends with j back to the head, where bge tests again. The rotated body ends with bne, which tests and jumps back in one instruction.' },
  { i: 'i = 1', top: ['bge', 'j', 'bge', 'j'], rot: ['blez', 'bne', 'bne'], note: 'Trip 2: two more for the top-tested loop (the test at the head and the j), one more for the rotated loop.' },
  { i: 'i = 2', top: ['bge', 'j', 'bge', 'j', 'bge', 'j', 'bge'], rot: ['blez', 'bne', 'bne', 'bne'], note: 'Trip 3, and the exit. Top-tested: 2n + 1 = 7 branches. Rotated: n + 1 = 4. The rotated shape costs one extra copy of the test, in exchange for one branch per trip instead of two.' },
];

function Row({ y, label, list, color }: { y: number; label: string; list: string[]; color: string }) {
  return (
    <g>
      <T x={8} y={y} size={12} weight={700}>{label}</T>
      {list.map((b, k) => (
        <Box key={k} x={8 + k * 46} y={y + 10} w={42} h={26} fill={tok(color, 0.22)} stroke={tok(color)}>
          <T x={29 + k * 46} y={y + 23} size={11.5} mono anchor="middle">{b}</T>
        </Box>
      ))}
      <T x={392} y={y} size={13} mono anchor="end" weight={700}>{list.length}</T>
    </g>
  );
}

export default function LoopShapeSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Counting branches in two loop shapes" steps={s} note={st.note}>
      <Svg w={400} h={150} title="Branches executed so far by the top-tested loop and by the rotated loop">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>{`n = 3 · now: ${st.i}`}</T>
        <Row y={36} label="top-tested (ours)" list={st.top} color="f1" />
        <Row y={96} label="rotated (clang -O2)" list={st.rot} color="f2" />
      </Svg>
    </StepFrame>
  );
}
