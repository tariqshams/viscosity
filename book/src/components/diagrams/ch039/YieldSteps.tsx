import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const CODE = `function* count() {
  console.log('start');
  yield 1;
  console.log('middle');
  yield 2;
}
const g = count();
g.next();
g.next();
g.next();`;

// paused: the line the generator is stopped at (null = not started or finished).
type S = { line: number; paused: number | null; state: string; result?: string; out: string[]; note: string };

const STATES: S[] = [
  { line: 6, paused: null, state: 'not started', out: [], note: 'Calling count() runs none of its body: nothing is printed. It only makes a generator object, g, paused before the first line.' },
  { line: 7, paused: 2, state: 'paused at yield 1', result: '{ value: 1, done: false }', out: ['start'], note: 'The first next() runs the body from the top: it prints start, then reaches yield 1. The generator stops right there and hands 1 out.' },
  { line: 8, paused: 4, state: 'paused at yield 2', result: '{ value: 2, done: false }', out: ['start', 'middle'], note: 'The second next() carries on from just after yield 1, with every local variable as it was: it prints middle and pauses again at yield 2.' },
  { line: 9, paused: null, state: 'finished', result: '{ value: undefined, done: true }', out: ['start', 'middle'], note: 'The third next() runs off the end of the body, so the generator is finished: done is true. Every later next() gives the same answer.' },
];

export default function YieldSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="A generator, paused and resumed" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.paused ?? st.line} />
      <Svg w={400} h={128} title="The generator's state, the last result of next(), and what has been printed">
        <T x={8} y={14} size={11} weight={700} fill={tok('muted')}>THE GENERATOR g</T>
        <Box x={4} y={24} w={190} h={30} fill={tok('brand', 0.1)} stroke={tok('brand')}>
          <T x={14} y={39.5} size={12} mono>{st.state}</T>
        </Box>
        <T x={212} y={14} size={11} weight={700} fill={tok('muted')}>PRINTED SO FAR</T>
        {st.out.length === 0 && <T x={212} y={39.5} size={12} fill={tok('muted')}>nothing</T>}
        {st.out.map((o, i) => (
          <T key={o} x={212 + i * 70} y={39.5} size={14} mono>{o}</T>
        ))}
        <T x={8} y={76} size={11} weight={700} fill={tok('muted')}>LAST RESULT OF next()</T>
        <Box x={4} y={86} w={290} h={30} dash={!st.result} fill={st.result ? tok('accent', 0.1) : 'transparent'} stroke={st.result ? tok('accent') : tok('line')}>
          <T x={14} y={101.5} size={12} mono fill={st.result ? tok('ink') : tok('muted')}>{st.result ?? 'no call yet'}</T>
        </Box>
      </Svg>
    </StepFrame>
  );
}
