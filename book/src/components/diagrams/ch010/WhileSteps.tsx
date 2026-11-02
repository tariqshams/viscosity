import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const CODE = `const vs = [3, -1, 8, 12, 5];
let i = 0;
let total = 0;
while (i < vs.length) {
  const v = vs[i];
  i++;
  if (v < 0) continue;
  if (v > 10) break;
  total = total + v;
}`;

const VS = [3, -1, 8, 12, 5];

type S = { line: number; i: number; total: number; cur?: number; tag?: 'added' | 'skipped' | 'stop'; seen: ('added' | 'skipped' | 'stop' | null)[]; note: string };

const STATES: S[] = [
  { line: 2, i: 0, total: 0, seen: [null, null, null, null, null], note: 'Before the loop: i, which slot to look at next, starts at 0, and the running total at 0. A while loop has no counter of its own; these are ours.' },
  { line: 3, i: 0, total: 0, seen: [null, null, null, null, null], note: 'The check comes first, before every pass: is 0 < 5? Yes, so the body runs.' },
  { line: 8, i: 1, total: 3, cur: 0, tag: 'added', seen: ['added', null, null, null, null], note: 'v is 3, and i moves on to 1 straight away. 3 is neither negative nor over 10, so it is added: total is 3.' },
  { line: 6, i: 2, total: 3, cur: 1, tag: 'skipped', seen: ['added', 'skipped', null, null, null], note: 'v is −1, so continue jumps straight back to the check, skipping the rest of the body. −1 is never added.' },
  { line: 8, i: 3, total: 11, cur: 2, tag: 'added', seen: ['added', 'skipped', 'added', null, null], note: 'v is 8: added, and total is 11.' },
  { line: 7, i: 4, total: 11, cur: 3, tag: 'stop', seen: ['added', 'skipped', 'added', 'stop', null], note: 'v is 12, which is over 10, so break leaves the loop at once. There is no next check.' },
  { line: 9, i: 4, total: 11, seen: ['added', 'skipped', 'added', 'stop', null], note: 'After the loop, total is 11. The 5 in the last slot was never even looked at, because break ended the loop first.' },
];

const COL = { added: 'safe', skipped: 'muted', stop: 'danger' } as const;

export default function WhileSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="A while loop with continue and break" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={130} title="The array vs, with each value marked as added, skipped or the one that stopped the loop, and the variables i and total">
        <T x={6} y={12} size={11} weight={700} fill={tok('muted')}>vs</T>
        {VS.map((v, k) => {
          const tag = st.seen[k];
          const on = st.cur === k;
          return (
            <g key={k}>
              <Box x={6 + k * 76} y={22} w={68} h={36} fill={tag ? tok(COL[tag], 0.14) : tok('panel')} stroke={on ? tok('brand') : tag ? tok(COL[tag]) : tok('ink', 0.4)}>
                <T x={40 + k * 76} y={40.5} size={16} mono anchor="middle">{v}</T>
              </Box>
              <T x={40 + k * 76} y={72} size={11} anchor="middle" weight={700} fill={tag ? tok(COL[tag]) : tok('muted')}>
                {tag === 'added' ? 'added' : tag === 'skipped' ? 'continue' : tag === 'stop' ? 'break' : k === st.i && !st.seen.includes('stop') ? 'next' : ''}
              </T>
            </g>
          );
        })}
        <Box x={6} y={90} w={92} h={32} stroke={tok('ink', 0.4)}>
          <T x={16} y={106.5} size={15} mono>i = {st.i}</T>
        </Box>
        <Box x={110} y={90} w={130} h={32} fill={tok('accent', 0.1)} stroke={tok('accent')}>
          <T x={120} y={106.5} size={15} mono>total = <tspan fontWeight={700}>{st.total}</tspan></T>
        </Box>
      </Svg>
    </StepFrame>
  );
}
