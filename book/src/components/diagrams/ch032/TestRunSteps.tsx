import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const CODE = `function test(name, fn) {
  try {
    fn();
    console.log('pass: ' + name);
  } catch (e) {
    console.log('FAIL: ' + name);
  }
}

test('double 3', () => {
  expectBe(double(3), 6);
});
test('double 0', () => {
  expectBe(double(0), 1);
});`;

type S = { line: number; out: string[]; thrown?: string; note: string };

const STATES: S[] = [
  { line: 9, out: [], note: 'The first test is called with a name and an arrow function. The arrow function is not run yet: it is handed to test, like any callback.' },
  { line: 2, out: [], note: 'Inside test, the try block calls fn(), which runs the arrow function: expectBe(double(3), 6).' },
  { line: 10, out: [], note: 'double(3) is 6, and 6 is the value we wanted, so expectBe returns quietly. Nothing was thrown.' },
  { line: 3, out: ['pass: double 3'], note: 'fn() finished without throwing, so the next line in the try block runs and prints pass.' },
  { line: 12, out: ['pass: double 3'], note: 'The second test. This time the expected value is wrong on purpose: double(0) is 0, but the test says 1.' },
  { line: 13, out: ['pass: double 3'], thrown: 'Error: expected 1, got 0', note: 'expectBe sees 0 !== 1 and throws an Error. The throw leaves expectBe, leaves the arrow function, and arrives back in test.' },
  { line: 5, out: ['pass: double 3', 'FAIL: double 0'], note: 'The pass line is skipped; the catch block runs and prints FAIL. One test failing does not stop the others: each has its own try.' },
];

export default function TestRunSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="What a test runner does" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={96} title="What has been thrown, and what has been printed so far">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>THROWN</T>
        <Box x={8} y={22} w={384} h={24} dash={!st.thrown} fill={st.thrown ? tok('danger', 0.12) : 'transparent'} stroke={st.thrown ? tok('danger') : tok('line')}>
          <T x={18} y={34.5} size={12} mono fill={st.thrown ? tok('danger') : tok('muted')}>{st.thrown ?? 'nothing'}</T>
        </Box>
        <T x={8} y={60} size={11} weight={700} fill={tok('muted')}>PRINTED</T>
        {st.out.map((o, k) => (
          <T key={k} x={80 + k * 150} y={60} size={12} mono weight={700} fill={o.startsWith('FAIL') ? tok('danger') : tok('safe')}>{o}</T>
        ))}
        {!st.out.length && <T x={80} y={60} size={12} mono fill={tok('muted')}>nothing yet</T>}
      </Svg>
    </StepFrame>
  );
}
