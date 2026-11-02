// Chapter 217: a loop over ten elements, unrolled by four. The main loop
// takes two whole groups; the remainder loop takes the last two elements.
// The counter on the right compares how many loop tests each version runs.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

type S = { done: number; group: number[]; part: 'none' | 'main' | 'rest'; test: string; tests: number; note: string };

const STATES: S[] = [
  { done: 0, group: [], part: 'none', test: 'i < 10', tests: 0, note: 'The plain loop runs its test 11 times for 10 elements (10 times true, once false), and jumps back 10 times. Now the same loop unrolled by 4.' },
  { done: 4, group: [0, 1, 2, 3], part: 'main', test: '0 + 4 <= 10: yes', tests: 1, note: 'Main loop, trip 1: one test, then four copies of the body, for elements 0 to 3. i jumps to 4.' },
  { done: 8, group: [4, 5, 6, 7], part: 'main', test: '4 + 4 <= 10: yes', tests: 2, note: 'Trip 2: elements 4 to 7, again with a single test. i jumps to 8.' },
  { done: 8, group: [], part: 'main', test: '8 + 4 <= 10: no', tests: 3, note: 'Only two elements are left, not a whole group, so the main loop stops. The remainder loop carries on from i = 8.' },
  { done: 9, group: [8], part: 'rest', test: '8 < 10: yes', tests: 4, note: 'Remainder loop: element 8, one at a time, like the plain loop.' },
  { done: 10, group: [9], part: 'rest', test: '9 < 10: yes', tests: 5, note: 'Element 9.' },
  { done: 10, group: [], part: 'rest', test: '10 < 10: no', tests: 6, note: 'Done: the same ten bodies in the same order, with 6 tests instead of 11. With a million elements it would be about a quarter of the tests.' },
];

export default function UnrollSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Ten elements, unrolled by four" steps={s} note={st.note}>
      <Svg w={400} h={150} title="Ten array elements, processed in two groups of four and then two single elements">
        {Array.from({ length: 10 }, (_, k) => {
          const x = 8 + k * 38.4;
          const inGroup = st.group.includes(k);
          const done = k < st.done && !inGroup;
          const col = k < 8 ? 'brand' : 'accent';
          return (
            <g key={k}>
              <Box x={x} y={30} w={34} h={34} r={5}
                fill={inGroup ? tok(col, 0.35) : done ? tok(col, 0.12) : 'transparent'}
                stroke={inGroup ? tok(col) : tok('line')}>
                <T x={x + 17} y={47} size={13} mono anchor="middle">{k}</T>
              </Box>
            </g>
          );
        })}
        <T x={8} y={14} size={11} weight={700} fill={tok('muted')}>ELEMENTS a[0] TO a[9]</T>
        <line x1={8 + 8 * 38.4 - 2} y1={24} x2={8 + 8 * 38.4 - 2} y2={72} stroke={tok('muted')} strokeWidth={1} strokeDasharray="3 3" />
        <T x={160} y={84} size={11} anchor="middle" fill={tok('brand')}>main loop: groups of 4</T>
        <T x={347} y={84} size={11} anchor="middle" fill={tok('accent')}>remainder</T>
        <T x={8} y={112} size={12} mono>{st.part === 'none' ? 'plain loop' : st.part === 'main' ? 'main loop test:' : 'remainder test:'} {st.part === 'none' ? '' : st.test}</T>
        <T x={8} y={136} size={12}>tests run: <tspan className="mono" fontWeight={700}>{st.tests}</tspan>  (plain loop: 11)</T>
      </Svg>
    </StepFrame>
  );
}
