import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 272: the generator count(n) lowered by hand into a state
// machine, run for count(2). The record (st, i, n) lives on the heap
// between calls to next(); the call to next() itself is an ordinary
// short-lived frame.
const CODE = `function count(n) {
  let st = 0, i;
  function next() {
    for (;;) switch (st) {
      case 0: i = 0; st = 1; break;
      case 1:
        if (i >= n) {
          st = 3; return over('done');
        }
        st = 2; return more(i);
      case 2: i++; st = 1; break;
      default: return over(undefined);
    }
  }
  return { next };
}`;

type S = { line: number; st: number; i?: number; call: string; out?: string; note: string };

const STATES: S[] = [
  { line: 14, st: 0, call: 'count(2)', note: 'Calling count(2) runs none of the generator’s body. It makes the record (st = 0, i, n = 2), which the closure next keeps alive on the heap, and returns { next }.' },
  { line: 4, st: 1, i: 0, call: 'next() #1', note: 'The first next(): the switch on st jumps to case 0, which sets i = 0 and moves to state 1. break leaves the switch, and for (;;) goes round to switch again.' },
  { line: 9, st: 2, i: 0, call: 'next() #1', out: '{ value: 0, done: false }', note: 'State 1: i < n, so this is the yield. It records where to continue (st = 2) and returns 0. The call to next() is over; the record keeps i and st.' },
  { line: 10, st: 1, i: 1, call: 'next() #2', note: 'The second next() jumps straight to case 2, the code after the yield: i++ and back to the loop test, state 1. Nothing before the yield runs again.' },
  { line: 9, st: 2, i: 1, call: 'next() #2', out: '{ value: 1, done: false }', note: 'State 1 again: 1 < 2, so it yields 1 and saves st = 2.' },
  { line: 10, st: 1, i: 2, call: 'next() #3', note: 'The third next(): case 2 again, i becomes 2, and the loop test comes next.' },
  { line: 7, st: 3, i: 2, call: 'next() #3', out: '{ value: \'done\', done: true }', note: 'Now i >= n: the loop is over, so the generator returns. It moves to state 3, the finished state, and hands back the return value with done: true.' },
  { line: 11, st: 3, i: 2, call: 'next() #4', out: '{ value: undefined, done: true }', note: 'Any later next() lands in default: a finished generator stays finished, exactly like a real one.' },
];

export default function StateSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="A generator lowered to a switch" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={96} title="The generator's record on the heap, and the value the last call returned">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>THE RECORD (on the heap)</T>
        {[['st', st.st], ['i', st.i], ['n', 2]].map(([name, v], k) => (
          <g key={String(name)}>
            <T x={14 + k * 60} y={32} size={12} mono weight={700}>{String(name)}</T>
            <Box x={34 + k * 60} y={20} w={30} h={24} fill={name === 'st' ? tok('brand', 0.15) : tok('panel')} stroke={name === 'st' ? tok('brand') : tok('line')}>
              <T x={49 + k * 60} y={32} size={12} mono anchor="middle">{v === undefined ? '' : String(v)}</T>
            </Box>
          </g>
        ))}
        <T x={392} y={12} size={11} weight={700} anchor="end" fill={tok('muted')}>NOW RUNNING</T>
        <T x={392} y={32} size={12} mono anchor="end">{st.call}</T>
        <T x={8} y={70} size={11} weight={700} fill={tok('muted')}>RETURNED</T>
        <T x={8} y={86} size={12} mono>{st.out ?? '(nothing yet)'}</T>
      </Svg>
    </StepFrame>
  );
}
