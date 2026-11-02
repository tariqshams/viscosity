import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// The feedback slot for + in add(a, b), read with %DebugPrint(add) after
// each phase in Node v22.23.4 (V8 12.4): BinaryOp:SignedSmall after 20
// integer calls, BinaryOp:Number after add(1.5, 1), BinaryOp:Any after
// add('a', 'b'). No feedback vector exists for the first 8 calls
// (--invocation-count-for-feedback-allocation=8).
const CODE = `for (let i = 0; i < 20; i++)
  add(i, 1);
add(1.5, 1);
add('a', 'b');`;

const LEVELS = ['None', 'SignedSmall', 'Number', 'Any'];
type S = { line: number | null; vec: boolean; level: number; note: string };

const STATES: S[] = [
  { line: null, vec: false, level: 0, note: 'add has not run. It has bytecode (Ldar a1; Add a0, [0]; Return), but no feedback vector yet, so there is nowhere to write anything down.' },
  { line: 0, vec: false, level: 0, note: 'The first eight calls run with no feedback vector at all: in Node 22, V8 only allocates one once a function has been called eight times. Most functions never get that far.' },
  { line: 1, vec: true, level: 1, note: 'From then on, Add writes into slot 0 what it saw. Every call so far added two small integers: BinaryOp:SignedSmall.' },
  { line: 2, vec: true, level: 2, note: 'add(1.5, 1): 1.5 is not a small integer, but it is a number. The slot widens to BinaryOp:Number. It does not forget the integers; Number covers them too.' },
  { line: 3, vec: true, level: 3, note: "add('a', 'b'): strings. The slot widens to BinaryOp:Any, the widest state. Nothing later can narrow it again." },
];

export default function FeedbackSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Feedback for + in add" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={110} title="add's feedback vector, absent at first, then slot 0 for the Add, with a ladder of states None, SignedSmall, Number and Any; the current state is highlighted.">
        <T x={8} y={14} size={11} weight={700} fill={tok('muted')}>{st.vec ? 'FEEDBACK VECTOR OF add, SLOT 0 (the +)' : 'FEEDBACK VECTOR OF add: not allocated yet'}</T>
        {LEVELS.map((l, k) => {
          const on = st.vec && k === st.level;
          const past = st.vec && k < st.level;
          return (
            <Box key={l} x={8 + k * 97} y={30} w={90} h={40} r={5} dash={!st.vec}
              fill={on ? tok('accent', 0.2) : past ? tok('accent', 0.06) : tok('panel')}
              stroke={on ? tok('accent') : tok('line')}>
              <T x={53 + k * 97} y={50} size={12} mono weight={on ? 700 : 400} anchor="middle" fill={on ? tok('ink') : tok('muted')}>{l}</T>
            </Box>
          );
        })}
        <T x={8} y={92} size={11} fill={tok('muted')}>narrow → wide: the state only ever moves right</T>
      </Svg>
    </StepFrame>
  );
}
