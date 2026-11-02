import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';
import { PRODS, rule, trace } from './lr';

const ROWS = trace(['n', '+', 'n', '*', 'n']);

function say(act: string): string {
  if (act === 'acc') return 'accept';
  if (act[0] === 's') return `shift, go to state ${act.slice(1)}`;
  return `reduce ${rule(Number(act.slice(1)))}`;
}

const NOTES: string[] = ROWS.map((r, i) => {
  const top = r.states[r.states.length - 1];
  const a = r.input[0];
  const base = `State ${top} on top, next token ${a}: ACTION[${top}, ${a}] = ${r.act}.`;
  const extra: Record<number, string> = {
    0: ' The stack holds only the start state, 0. The parser never looks at symbols, only at the state on top and the next token.',
    1: ' Reduce by rule 5: pop one state (the body has one symbol), then look up GOTO from the state now on top, 0, for F.',
    3: ' T is on the stack and + is next. The table says reduce T to E: nothing tighter than + can join this T.',
    4: ' State 1 means "a whole E so far". With + next, shift it.',
    8: ' The crucial moment. The stack is E + T, which is the whole body of E → E + T; but the next token is *, and state 7 says shift. The T is not finished, because * binds tighter, so E + T is not a handle yet.',
    11: ' T * F is on top, and $ is next: this is a handle. Pop three states and go to GOTO[5, T] = 7.',
    12: ' Now E + T is on top and $ is next, and this time state 7 says reduce: E + T is the handle.',
  };
  if (r.act[0] === 'r') {
    const [h, b] = PRODS[Number(r.act.slice(1))];
    return base + (extra[i] ?? ` Pop ${b.length} state${b.length > 1 ? 's' : ''}, push ${h}, then follow GOTO.`);
  }
  if (r.act === 'acc') return base + ' The input is used up and E is complete: accept. Rules 5, 4, 2, 5, 4, 5, 3, 1 were reduced, in that order.';
  return base + (extra[i] ?? ' Shift the token and push the new state.');
});

function Row({ y, label, xs, color }: { y: number; label: string; xs: string[]; color?: string }) {
  let x = 70;
  return (
    <g>
      <T x={8} y={y + 12} size={11} weight={700} fill={tok('muted')}>{label}</T>
      {xs.map((s, i) => {
        const w = 26;
        const el = (
          <Box key={i} x={x} y={y} w={w} h={24} r={3} fill={i === xs.length - 1 && color ? tok('brand', 0.18) : tok('panel')} stroke={tok('ink', 0.35)}>
            <T x={x + w / 2} y={y + 12.5} size={12} mono anchor="middle">{s}</T>
          </Box>
        );
        x += w + 3;
        return el;
      })}
    </g>
  );
}

export default function LRSteps() {
  const s = useSteps(ROWS.map((r, i) => ({ ...r, note: NOTES[i] })));
  const st = s.state;
  return (
    <StepFrame title="The LR driver on n + n * n" steps={s} note={st.note}>
      <Svg w={400} h={136} title="The stack of states, the grammar symbols they stand for, the remaining input, and the action from the table.">
        <Row y={4} label="STATES" xs={st.states.map(String)} color="top" />
        <Row y={34} label="SYMBOLS" xs={['', ...st.syms]} />
        <Row y={64} label="INPUT" xs={st.input} />
        <T x={8} y={112} size={11} weight={700} fill={tok('muted')}>ACTION</T>
        <T x={70} y={112} size={13} mono weight={700} fill={tok('brand')}>{say(st.act)}</T>
      </Svg>
    </StepFrame>
  );
}
