import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 268: what the hidden counter from counting() in
// frontend-python/src/lower.ts does, pass by pass, for
//   for i in range(3): print(i); i += 5
// Python prints 0, 1, 2 (checked with python3); the JavaScript loop with
// the same body prints only 0.
const CODE = `for i in range(3):
    print(i)
    i += 5`;

type S = { line: number | null; counter: number | null; i: number | null; out: string; hi?: 'counter' | 'i'; note: string };

const STATES: S[] = [
  { line: 0, counter: 0, i: null, out: '', hi: 'counter', note: 'Before the loop, range(3) is evaluated once: the hidden counter starts at 0 and the bound is 3. The counter is a variable of its own, named after the loop’s position, so no Python name can touch it.' },
  { line: 1, counter: 0, i: 0, out: '0', hi: 'i', note: 'The header tests the counter: 0 < 3, so the body runs. First the counter is copied into i, then print(i) shows 0.' },
  { line: 2, counter: 0, i: 5, out: '0', hi: 'i', note: 'i += 5 changes i to 5. The counter is not affected: it is a different variable.' },
  { line: 0, counter: 1, i: 5, out: '0', hi: 'counter', note: 'At the end of the pass the counter goes up by one, to 1. Nothing reads i here.' },
  { line: 1, counter: 1, i: 1, out: '0 1', hi: 'i', note: '1 < 3, so another pass: i is overwritten with 1, whatever the body left in it, and print shows 1.' },
  { line: 2, counter: 2, i: 7, out: '0 1 2', hi: 'counter', note: 'The third pass prints 2 and sets i to 7; then the counter becomes 3.' },
  { line: null, counter: 3, i: 7, out: '0 1 2', note: '3 < 3 is false, so the loop ends. Python printed 0, 1 and 2, and the compiled program must do the same. Because the counter only ever counts up by one from 0 to 3, the bounds proofs can reason about it cleanly.' },
  { line: null, counter: null, i: 6, out: '0', hi: 'i', note: 'The JavaScript loop with the same body has no hidden counter: i is the loop variable, so i += 5 and then i++ make it 6, the test 6 < 3 fails, and only 0 is printed. Lowering both the same way would be a semantic bug.' },
];

export default function CounterSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const cell = (x: number, label: string, v: number | null, on: boolean) => (
    <g>
      <T x={x} y={14} size={11} weight={700} fill={tok('muted')}>{label}</T>
      <Box x={x} y={24} w={110} h={40} fill={on ? tok('brand', 0.18) : tok('panel')} stroke={on ? tok('brand') : tok('line')} dash={v === null}>
        <T x={x + 55} y={44} size={18} mono anchor="middle" weight={700}>{v === null ? '–' : v}</T>
      </Box>
    </g>
  );
  return (
    <StepFrame title="The hidden counter, pass by pass" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={124} title="The hidden counter, the loop variable i, the bound 3, and what has been printed so far">
        {cell(6, st.counter === null ? 'NO COUNTER (JS)' : 'HIDDEN COUNTER', st.counter, st.hi === 'counter')}
        {cell(140, 'i (THE NAME)', st.i, st.hi === 'i')}
        <T x={274} y={14} size={11} weight={700} fill={tok('muted')}>BOUND</T>
        <Box x={274} y={24} w={120} h={40} fill={tok('panel')}>
          <T x={334} y={44} size={18} mono anchor="middle">3</T>
        </Box>
        <T x={6} y={88} size={11} weight={700} fill={tok('muted')}>PRINTED</T>
        <Box x={6} y={98} w={388} h={24} fill={tok('accent', 0.1)} stroke={tok('accent')}>
          <T x={16} y={110} size={13} mono>{st.out}</T>
        </Box>
      </Svg>
    </StepFrame>
  );
}
