// A pushdown automaton checking brackets: each ( is pushed, each ) pops
// one, and the input is accepted when only the bottom marker is left.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

type S = { input: string; pos: number; stack: string; rule?: string; verdict?: boolean; note: string };

const STEPS: S[] = [
  { input: '(()())', pos: 0, stack: 'Z', note: 'One state, q, and a stack holding only Z, the bottom marker. The machine reads one character at a time, and each move looks at the character and at the top of the stack, never deeper.' },
  { input: '(()())', pos: 1, stack: 'Z(', rule: 'read (, top Z: push (', note: 'Read “(”: push it. The stack now remembers one bracket still open.' },
  { input: '(()())', pos: 2, stack: 'Z((', rule: 'read (, top (: push (', note: 'Another “(”: push again. Two open. A finite automaton would need a separate state for every depth; the stack grows instead.' },
  { input: '(()())', pos: 3, stack: 'Z(', rule: 'read ), top (: pop', note: 'Read “)”: the top is a “(”, so pop it. The inner pair is matched.' },
  { input: '(()())', pos: 4, stack: 'Z((', rule: 'read (, top (: push (', note: 'Read “(”: push. Two open again.' },
  { input: '(()())', pos: 5, stack: 'Z(', rule: 'read ), top (: pop', note: 'Read “)”: pop.' },
  { input: '(()())', pos: 6, stack: 'Z', rule: 'read ), top (: pop', note: 'Read “)”: pop. Only Z is left.' },
  { input: '(()())', pos: 6, stack: 'Z', verdict: true, note: 'The input is used up and the stack holds only the bottom marker: every bracket was closed, so the string is accepted.' },
  { input: '())', pos: 0, stack: 'Z', note: 'A second run, on “())”.' },
  { input: '())', pos: 2, stack: 'Z', rule: 'read (, then read ): push, pop', note: 'The first pair pushes and pops; the stack is back to Z.' },
  { input: '())', pos: 2, stack: 'Z', verdict: false, note: 'Now “)” arrives with Z on top. There is no move for a “)” over the bottom marker (nothing is open), so the machine is stuck and rejects.' },
];

export default function PdaSteps() {
  const s = useSteps(STEPS);
  const st = s.state;
  const cell = 30;
  return (
    <StepFrame title="A pushdown automaton matching brackets" steps={s} note={st.note}>
      <Svg w={400} h={230} title="The input string with a cursor on the left, the move being made in the middle, and the stack drawn as a column of boxes on the right, bottom marker Z at the bottom">
        <T x={20} y={16} size={11} fill={tok('muted')}>input</T>
        {[...st.input].map((c, k) => (
          <Box key={k} x={20 + k * cell} y={26} w={cell - 4} h={28} fill={k < st.pos ? tok('ink', 0.06) : tok('panel')} stroke={k === st.pos - 1 && st.rule ? tok('brand') : tok('ink', 0.35)}>
            <T x={33 + k * cell} y={41} size={14} mono anchor="middle" fill={k < st.pos ? tok('muted') : undefined}>{c}</T>
          </Box>
        ))}
        <T x={20} y={84} size={11} fill={tok('muted')}>move</T>
        <T x={20} y={104} size={13} mono fill={st.rule ? tok('brand') : tok('muted')}>{st.rule ?? '(none yet)'}</T>
        {st.verdict !== undefined && (
          <T x={20} y={140} size={14} weight={700} fill={st.verdict ? tok('safe') : tok('danger')}>{st.verdict ? 'accept' : 'reject: no move'}</T>
        )}
        <T x={330} y={16} size={11} anchor="middle" fill={tok('muted')}>stack</T>
        <line x1={296} y1={216} x2={364} y2={216} stroke={tok('ink', 0.5)} strokeWidth={1.5} />
        {[...st.stack].map((c, k) => {
          const top = k === st.stack.length - 1;
          return (
            <Box key={k} x={306} y={186 - k * 32} w={48} h={28} fill={top ? tok('brand', 0.18) : tok('panel')} stroke={top ? tok('brand') : tok('ink', 0.35)}>
              <T x={330} y={201 - k * 32} size={14} mono anchor="middle">{c}</T>
            </Box>
          );
        })}
        <T x={300} y={201 - (st.stack.length - 1) * 32} size={11} anchor="end" fill={tok('muted')}>top</T>
      </Svg>
    </StepFrame>
  );
}
