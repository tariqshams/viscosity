// The pigeonhole argument on a small DFA: reading a³b³ makes a state come
// back, and the loop between the two visits can be taken any number of
// times, which lets in strings with unequal counts.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';
import { Fsm, type Ed, type St } from '../ch169/Fsm';

const STATES: St[] = [
  { id: 'A', x: 70, y: 78 },
  { id: 'X', x: 200, y: 78 },
  { id: 'B', x: 330, y: 78, accept: true },
];
const EDGES: Ed[] = [
  { from: 'A', to: 'X', label: 'a' },
  { from: 'X', to: 'X', label: 'a', loop: 'up' },
  { from: 'X', to: 'B', label: 'b' },
  { from: 'B', to: 'B', label: 'b', loop: 'up' },
];

type Part = 'x' | 'y' | 'z' | undefined;
type S = { input: string; pos: number; q: string; edge?: string; parts?: Part[]; verdict?: boolean; note: string };

const W = 'aaabbb';
const SPLIT: Part[] = ['x', 'y', 'z', 'z', 'z', 'z'];
const PUMP2 = 'aaaabbb';
const PUMP2_PARTS: Part[] = ['x', 'y', 'y', 'z', 'z', 'z', 'z'];
const PUMP0 = 'aabbb';
const PUMP0_PARTS: Part[] = ['x', 'z', 'z', 'z', 'z'];

const STEPS: S[] = [
  { input: W, pos: 0, q: 'A', note: 'A DFA with p = 3 states that accepts every aⁿbⁿ (and, as we will see, more). Feed it a³b³, a string of the language longer than the number of states. It starts in A.' },
  { input: W, pos: 1, q: 'X', edge: 'A>X:a', note: 'The first a: A to X. Two states visited so far, A and X.' },
  { input: W, pos: 2, q: 'X', edge: 'X>X:a', note: 'The second a: X to X. X has come back. Reading p characters visits p + 1 states, so among the first p, some state must come back; here it happens at once.' },
  { input: W, pos: 2, q: 'X', parts: SPLIT, note: 'Cut the input at the two visits to X: x = “a” (up to the first visit), y = “a” (the loop that led from X back to X), z = “abbb” (the rest). y is not empty, and it lies inside the first p characters, so it is made only of a’s.' },
  { input: W, pos: 6, q: 'B', parts: SPLIT, verdict: true, note: 'The whole of x y z = a³b³ ends in B, an accepting state, as it should.' },
  { input: PUMP2, pos: 7, q: 'B', parts: PUMP2_PARTS, verdict: true, note: 'Now take the loop twice: x y y z = a⁴b³. After x y the machine is in X, another y brings it back to X, and z then runs exactly as before, to B. Accepted, yet four a’s and three b’s is not in aⁿbⁿ.' },
  { input: PUMP0, pos: 5, q: 'B', parts: PUMP0_PARTS, verdict: true, note: 'Or leave the loop out: x z = a²b³, also accepted. The machine cannot tell how often it went round the loop; it only knows it is in X.' },
  { input: W, pos: 6, q: 'B', note: 'Nothing here depended on this machine. Any DFA with p states, fed aᵖbᵖ, repeats a state among the a’s, and the loop between the repeats adds or removes a’s alone. So every DFA that accepts all of aⁿbⁿ also accepts a string with unequal counts: the language is not regular.' },
];

export default function PumpSteps() {
  const s = useSteps(STEPS);
  const st = s.state;
  const cell = 30;
  const x0 = (400 - st.input.length * cell) / 2;
  return (
    <StepFrame title="Why a³b³ makes a small DFA repeat itself" steps={s} note={st.note}>
      <Svg w={400} h={210} title="A three-state DFA, A then X then B, with loops on X reading a and on B reading b; below it the input string, cut into the parts x, y and z when the repeated state is found">
        <Fsm states={STATES} edges={EDGES} start="A" on={[st.q]} hot={st.edge ? [st.edge] : []} />
        {[...st.input].map((c, k) => {
          const part = st.parts?.[k];
          const fill = part === 'y' ? tok('brand', 0.22) : part ? tok('ink', 0.06) : k < st.pos ? tok('ink', 0.06) : tok('panel');
          const stroke = part === 'y' ? tok('brand') : tok('ink', 0.35);
          return (
            <g key={k}>
              <Box x={x0 + k * cell} y={130} w={cell - 4} h={28} fill={fill} stroke={stroke}>
                <T x={x0 + k * cell + (cell - 4) / 2} y={145} size={14} mono anchor="middle">{c}</T>
              </Box>
              {part && (part !== st.parts?.[k - 1]) && (
                <T x={x0 + k * cell + 2} y={172} size={12} mono weight={700} fill={part === 'y' ? tok('brand') : tok('muted')}>{part}</T>
              )}
            </g>
          );
        })}
        {st.verdict !== undefined && (
          <T x={200} y={196} size={13} anchor="middle" weight={700} fill={st.verdict ? tok('safe') : tok('danger')}>{st.verdict ? 'accepted' : 'rejected'}</T>
        )}
      </Svg>
    </StepFrame>
  );
}
