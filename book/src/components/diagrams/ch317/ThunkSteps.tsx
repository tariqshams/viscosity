import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 317: one thunk's life under call-by-need, in the three states
// GHC's runtime describes (rts/Updates.h): a thunk, a black hole while it
// is being evaluated, and, once updated, an indirection to its value.
const CODE = `let t = delay(slow)
let a = t.force()
let b = t.force()
print(a + b)`;

type St = 'none' | 'thunk' | 'hole' | 'ind';
type S = { line: number | null; st: St; runs: number; note: string };

const STATES: S[] = [
  { line: null, st: 'none', runs: 0, note: 'Nothing has been made yet. slow() is the expensive work we would like to do at most once, and only if someone needs it.' },
  { line: 0, st: 'thunk', runs: 0, note: 'delay(slow) builds a thunk on the heap: a pointer to the code to run and the free variables that code needs. No work is done; slow() has run 0 times.' },
  { line: 1, st: 'hole', runs: 0, note: 'The first force enters the thunk and marks it as a black hole, meaning "being worked on". If slow() tried to force this same thunk, it would find the black hole and report a loop instead of running forever. (GHC does this marking eagerly only with a flag; by default it marks thunks later, lazily, as it is cheaper.)' },
  { line: 1, st: 'ind', runs: 1, note: 'slow() returns 21. The thunk is updated: its cell now points to the value instead of to code. That update is the whole difference between call-by-need and call-by-name.' },
  { line: 2, st: 'ind', runs: 1, note: 'The second force finds an indirection and follows it to 21. No work: slow() still ran exactly once.' },
  { line: 3, st: 'ind', runs: 1, note: 'a + b is 42. Every later reader shares the one result, which is safe because the value can never change.' },
];

const LABEL: Record<St, string> = { none: '', thunk: 'THUNK', hole: 'BLACK HOLE', ind: 'UPDATED' };

export default function ThunkSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const c = st.st === 'thunk' ? 'f3' : st.st === 'hole' ? 'warn' : 'safe';
  return (
    <StepFrame title="A thunk is entered, black-holed and updated" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={110} title="The heap cell for t, showing its current state (thunk, black hole or indirection) and how many times slow has run">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>THE HEAP CELL t</T>
        <Box x={8} y={22} w={150} h={64} dash={st.st === 'none'} fill={st.st === 'none' ? 'transparent' : tok(c, 0.12)} stroke={st.st === 'none' ? tok('line') : tok(c)}>
          <T x={83} y={40} size={12} mono anchor="middle" weight={700}>{LABEL[st.st]}</T>
          <T x={83} y={64} size={11} mono anchor="middle">{st.st === 'thunk' ? 'code: slow()' : st.st === 'hole' ? 'being evaluated' : st.st === 'ind' ? 'points to 21' : ''}</T>
        </Box>
        {st.st === 'ind' && (
          <g>
            <Arrow x1={160} y1={54} x2={228} y2={54} color={tok('safe')} />
            <Box x={232} y={38} w={56} h={32} fill={tok('safe', 0.12)} stroke={tok('safe')}>
              <T x={260} y={54} size={14} mono anchor="middle">21</T>
            </Box>
          </g>
        )}
        <T x={308} y={12} size={11} weight={700} fill={tok('muted')}>slow() RAN</T>
        <T x={340} y={54} size={22} mono anchor="middle">{st.runs}</T>
        <T x={8} y={102} size={11} fill={tok('muted')}>The three states of a thunk in GHC's runtime.</T>
      </Svg>
    </StepFrame>
  );
}
