import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const BUGGY = `function max(xs) {
  let best = 0;
  for (const x of xs) {
    if (x > best) best = x;
  }
  return best;
}`;
const FIXED = BUGGY.replace('let best = 0;', 'let best = -Infinity;');

const TESTS = [
  { input: '[3, 7, 2]', want: '7', got: ['7', '7'] },
  { input: '[7]', want: '7', got: ['7', '7'] },
  { input: '[5, 5]', want: '5', got: ['5', '5'] },
  { input: '[-4, -2]', want: '-2', got: ['0', '-2'] },
  { input: '[]', want: '-Infinity', got: ['0', '-Infinity'] },
];

type S = { ran: number; fixed: boolean; line: number | null; note: string };

const STATES: S[] = [
  { ran: 0, fixed: false, line: null, note: 'Here is max with a bug hiding in it. Below are five tests: an input, and the answer we expect. None has run yet.' },
  { ran: 1, fixed: false, line: null, note: 'The ordinary case: [3, 7, 2] gives 7. Pass. This is the input everyone tries first.' },
  { ran: 2, fixed: false, line: null, note: 'One element: [7] gives 7. Pass.' },
  { ran: 3, fixed: false, line: null, note: 'Duplicates: [5, 5] gives 5. Pass. Three green ticks, and many people would stop testing here.' },
  { ran: 4, fixed: false, line: 1, note: 'All negative: [-4, -2] should give -2, but max says 0. best starts at 0, which is bigger than every value, so it never changes. An edge case found the bug.' },
  { ran: 5, fixed: false, line: 1, note: 'Empty: what is the max of nothing? Writing the test forces you to decide. We pick -Infinity, which is what Math.max() gives. max says 0: a second failure, same cause.' },
  { ran: 5, fixed: true, line: 1, note: 'The fix: start best at -Infinity, which every number beats. Run all five tests again, old ones included: all pass. Keeping old tests is what stops the bug coming back.' },
];

export default function EdgeSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Hunting a bug with edge cases" steps={s} note={st.note}>
      <CodeTrace code={st.fixed ? FIXED : BUGGY} line={st.line} />
      <Svg w={400} h={212} title="A table of five tests for max: the input, the expected answer, what max returned, and pass or fail">
        <T x={8} y={14} size={11} weight={700} fill={tok('muted')}>INPUT</T>
        <T x={150} y={14} size={11} weight={700} fill={tok('muted')}>EXPECT</T>
        <T x={250} y={14} size={11} weight={700} fill={tok('muted')}>GOT</T>
        {TESTS.map((t, k) => {
          const done = k < st.ran;
          const got = t.got[st.fixed ? 1 : 0];
          const ok = got === t.want;
          const y = 26 + k * 37;
          const stroke = !done ? tok('line') : ok ? tok('safe') : tok('danger');
          return (
            <Box key={k} x={4} y={y} w={392} h={31} fill={!done ? 'transparent' : ok ? tok('safe', 0.08) : tok('danger', 0.08)} stroke={stroke} dash={!done}>
              <T x={12} y={y + 16} size={14} mono>{t.input}</T>
              <T x={150} y={y + 16} size={14} mono>{t.want}</T>
              <T x={250} y={y + 16} size={14} mono weight={done && !ok ? 700 : 400} fill={done && !ok ? tok('danger') : undefined}>{done ? got : '…'}</T>
              <T x={384} y={y + 16} size={16} anchor="end" weight={700} fill={!done ? tok('muted') : ok ? tok('safe') : tok('danger')}>{!done ? '' : ok ? '✓' : '✗'}</T>
            </Box>
          );
        })}
      </Svg>
    </StepFrame>
  );
}
