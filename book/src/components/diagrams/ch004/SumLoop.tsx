import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const CODE = `const a = [4, 8, 15];
let total = 0;
for (let i = 0; i < a.length; i++) {
  total = total + a[i];
}
console.log(total);`;

type S = { line: number; i: number | null; total: number | null; note: string; done?: boolean };
const A = [4, 8, 15];
const STATES: S[] = [
  { line: 0, i: null, total: null, note: 'The array a has 3 slots: indexes 0, 1 and 2. Its length is 3.' },
  { line: 1, i: null, total: 0, note: 'total starts at 0. It will collect the running sum.' },
  { line: 2, i: 0, total: 0, note: 'The loop starts with i = 0. Is 0 < a.length (3)? Yes, so the body runs.' },
  { line: 3, i: 0, total: 4, note: 'a[0] is 4, so total becomes 0 + 4 = 4.' },
  { line: 2, i: 1, total: 4, note: 'i++ makes i = 1. Is 1 < 3? Yes.' },
  { line: 3, i: 1, total: 12, note: 'a[1] is 8, so total becomes 4 + 8 = 12.' },
  { line: 2, i: 2, total: 12, note: 'i = 2. Is 2 < 3? Yes. This is the last slot.' },
  { line: 3, i: 2, total: 27, note: 'a[2] is 15, so total becomes 12 + 15 = 27.' },
  { line: 2, i: 3, total: 27, note: 'i = 3. Is 3 < 3? No, so the loop stops. Notice i never reaches a slot that doesn’t exist.' },
  { line: 5, i: null, total: 27, done: true, note: 'console.log(total) prints 27. Every slot was visited exactly once, in order.' },
];

export default function SumLoop() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Visiting every slot with a for loop" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={130} title="The array, the index i pointing at the current slot, and the running total">
        {A.map((v, k) => {
          const x = 40 + k * 100;
          const on = st.i === k;
          return (
            <g key={k}>
              <Box x={x} y={10} w={84} h={46} fill={on ? tok('brand', 0.18) : tok('panel')} stroke={on ? tok('brand') : tok('ink', 0.4)}>
                <T x={x + 42} y={33} size={20} mono anchor="middle">{v}</T>
              </Box>
              <T x={x + 42} y={70} size={12} mono anchor="middle" fill={tok('muted')}>{k}</T>
            </g>
          );
        })}
        {st.i !== null && (
          <g>
            <T x={st.i < 3 ? 82 + st.i * 100 : 352} y={92} size={14} mono weight={700} anchor="middle" fill={st.i < 3 ? tok('brand') : tok('danger')}>
              ↑ i = {st.i}{st.i >= 3 ? ' (stop)' : ''}
            </T>
          </g>
        )}
        <T x={40} y={118} size={14} mono>total = {st.total === null ? '…' : st.total}</T>
      </Svg>
    </StepFrame>
  );
}
