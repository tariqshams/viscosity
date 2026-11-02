// A GLR parser on "n + n + n" with the ambiguous grammar E → E + E | n:
// at the conflict the stack splits, both copies run in lockstep, and
// where they reach the same state on the same input they merge.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

type Stack = { name: string; st: number[]; sy: string[]; act: string; dead?: boolean };
type S = { inp: string[]; stacks: Stack[]; split?: boolean; merged?: boolean; note: string };
const STATES: S[] = [
  { inp: ['n', '+', 'n', '+', 'n', '$'], stacks: [{ name: '', st: [0], sy: [], act: 'shift' }], note: 'The grammar E → E + E | n is ambiguous, so its LR table has a conflict: in state 4 (E + E complete, E · + E waiting), a + can be shifted or E + E reduced. A plain LR parser would have to refuse. GLR starts like any LR parser.' },
  { inp: ['+', 'n', '+', 'n', '$'], stacks: [{ name: '', st: [0, 1], sy: ['E'], act: 'shift +' }], note: 'n is shifted and reduced to E: state 1. One stack, no doubts yet.' },
  { inp: ['+', 'n', '$'], stacks: [{ name: '', st: [0, 1, 3, 4], sy: ['E', '+', 'E'], act: 'shift or reduce?' }], note: 'After + n, and n reduced to E, the stack is E + E in state 4, and the next token is +. The table cell holds two actions.' },
  { inp: ['+', 'n', '$'], split: true, stacks: [{ name: 'A', st: [0, 1], sy: ['E'], act: 'reduced E + E' }, { name: 'B', st: [0, 1, 3, 4], sy: ['E', '+', 'E'], act: 'will shift +' }], note: 'GLR does both. Copy A reduces E + E to E (grouping the first sum); copy B keeps E + E and will shift the + (grouping the second sum).' },
  { inp: ['n', '$'], stacks: [{ name: 'A', st: [0, 1, 3], sy: ['E', '+'], act: 'shift n' }, { name: 'B', st: [0, 1, 3, 4, 3], sy: ['E', '+', 'E', '+'], act: 'shift n' }], note: 'The copies move in lockstep: both shift the same + before either reads further.' },
  { inp: ['$'], stacks: [{ name: 'A', st: [0, 1, 3, 4], sy: ['E', '+', 'E'], act: 'reduce' }, { name: 'B', st: [0, 1, 3, 4, 3, 4], sy: ['E', '+', 'E', '+', 'E'], act: 'reduce, reduce' }], note: 'Both shift n and reduce it to E. Now $ is next, and $ allows only reductions.' },
  { inp: ['$'], merged: true, stacks: [{ name: 'A+B', st: [0, 1], sy: ['E'], act: 'accept' }], note: 'A reduces once and B twice, and both arrive at state 1 with $ next: the same situation, so they merge into one stack, which accepts. Two trees, (n + n) + n and n + (n + n), meet here; a real GLR parser keeps both, and Bison then needs a %dprec or %merge rule to choose.' },
];

export default function GlrSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="GLR: split at a conflict, merge when equal" steps={s} note={st.note}>
      <Svg w={400} h={190} title="The input still to read, and each copy of the parser stack with its next action">
        <T x={4} y={14} size={12} weight={700} fill={tok('muted')}>input</T>
        {st.inp.map((t, k) => (
          <Box key={k} x={48 + k * 30} y={3} w={25} h={22} stroke={k === 0 ? tok('brand') : tok('ink', 0.3)}>
            <T x={60.5 + k * 30} y={15} size={12} mono anchor="middle">{t}</T>
          </Box>
        ))}
        {st.stacks.map((sk, r) => {
          const y = 44 + r * 70;
          const col = sk.name ? (r === 0 ? tok('brand') : tok('accent')) : tok('ink', 0.4);
          return (
            <g key={r}>
              {sk.name && <T x={4} y={y + 12} size={13} weight={700} fill={col}>{sk.name}</T>}
              {sk.st.map((q, k) => (
                <g key={k}>
                  <Box x={44 + k * 40} y={y} w={34} h={24} fill={k === sk.st.length - 1 ? tok('brand', 0.15) : tok('panel')} stroke={col}>
                    <T x={61 + k * 40} y={y + 12} size={12} mono anchor="middle">{q}</T>
                  </Box>
                  {k > 0 && <T x={61 + k * 40} y={y + 34} size={12} mono anchor="middle" fill={tok('accent')}>{sk.sy[k - 1]}</T>}
                </g>
              ))}
              <T x={396} y={y + 12} size={12} anchor="end" weight={700} fill={col}>{sk.act}</T>
            </g>
          );
        })}
        {st.merged && <T x={200} y={160} size={12} anchor="middle" fill={tok('muted')}>one stack again, carrying two possible trees</T>}
      </Svg>
    </StepFrame>
  );
}
