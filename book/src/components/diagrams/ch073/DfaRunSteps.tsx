// Running the number DFA on "12.5" and on "4.", one character at a time.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';
import { Fsm } from './Fsm';
import { NUM_EDGES, NUM_STATES, NumTable } from './NumberDfa';

type S = { input: string; pos: number; q: string; edge?: string; col?: 1 | 2; verdict?: boolean; note: string };
const STATES: S[] = [
  { input: '12.5', pos: 0, q: 'S', note: 'The machine starts in S, the start state, before reading anything. Its whole memory is this one circle.' },
  { input: '12.5', pos: 1, q: 'I', edge: 'S>I:digit', col: 1, note: 'Read “1”, a digit. Row S, column digit, says go to I. One character read, never to be looked at again.' },
  { input: '12.5', pos: 2, q: 'I', edge: 'I>I:digit', col: 1, note: 'Read “2”. Row I, column digit, says stay in I: the loop. Any number of digits keeps us here.' },
  { input: '12.5', pos: 3, q: 'D', edge: 'I>D:.', col: 2, note: 'Read “.”. Row I, column dot, says go to D: a dot has been seen and no fraction digit yet.' },
  { input: '12.5', pos: 4, q: 'F', edge: 'D>F:digit', col: 1, note: 'Read “5”. Row D, column digit, says go to F, the fraction.' },
  { input: '12.5', pos: 4, q: 'F', verdict: true, note: 'The input is used up. F has a double ring: it is an accepting state, so “12.5” is a number.' },
  { input: '4.', pos: 0, q: 'S', note: 'A second run, on “4.”. Back to the start state.' },
  { input: '4.', pos: 1, q: 'I', edge: 'S>I:digit', col: 1, note: 'Read “4”: S to I.' },
  { input: '4.', pos: 2, q: 'D', edge: 'I>D:.', col: 2, note: 'Read “.”: I to D.' },
  { input: '4.', pos: 2, q: 'D', verdict: false, note: 'The input ends in D, which is not accepting (one ring). So “4.” is rejected, exactly as Drip’s scanner refuses a dot with no digit after it.' },
];

export default function DfaRunSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="A DFA reading one character at a time" steps={s} note={st.note}>
      <Svg w={400} h={262} title="The number DFA with the current state lit, the input with a cursor, and the table row being used">
        {[...st.input].map((c, k) => (
          <Box key={k} x={20 + k * 30} y={6} w={26} h={28} fill={k < st.pos ? tok('ink', 0.06) : tok('panel')} stroke={k === st.pos - 1 && st.edge ? tok('brand') : tok('ink', 0.35)}>
            <T x={33 + k * 30} y={21} size={14} mono anchor="middle" fill={k < st.pos ? tok('muted') : undefined}>{c}</T>
          </Box>
        ))}
        <T x={26 + st.input.length * 30} y={21} size={11} fill={tok('muted')}>{st.pos < st.input.length ? `next: “${st.input[st.pos]}”` : 'end of input'}</T>
        {st.verdict !== undefined && (
          <T x={392} y={21} size={13} anchor="end" weight={700} fill={st.verdict ? tok('safe') : tok('danger')}>{st.verdict ? 'accept' : 'reject'}</T>
        )}
        <g transform="translate(0,40)">
          <Fsm states={NUM_STATES} edges={NUM_EDGES} start="S" on={[st.q]} hot={st.edge ? [st.edge] : []} />
        </g>
        <NumTable y={160} hot={st.edge ? st.edge.split('>')[0] : st.q} col={st.col} />
      </Svg>
    </StepFrame>
  );
}
