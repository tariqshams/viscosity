// An SLR parser on "n + n * n": the stack of states (with their symbols),
// the input, the items of the state on top, and how the next token and
// a FOLLOW set decide between shifting and reducing.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const ITEMS: Record<number, string[]> = {
  0: ['S → · E', 'E → · E + T', 'E → · T', 'T → · T * F', 'T → · F', 'F → · ( E )', 'F → · n'],
  1: ['S → E ·', 'E → E · + T'],
  2: ['E → T ·', 'T → T · * F'],
  3: ['T → F ·'],
  5: ['F → n ·'],
  6: ['E → E + · T', 'T → · T * F', 'T → · F', 'F → · ( E )', 'F → · n'],
  7: ['T → T * · F', 'F → · ( E )', 'F → · n'],
  9: ['E → E + T ·', 'T → T · * F'],
  10: ['T → T * F ·'],
};

type S = { st: number[]; sy: string[]; inp: string[]; act: string; why: string; key?: boolean; note: string };
const STATES: S[] = [
  { st: [0], sy: [], inp: ['n', '+', 'n', '*', 'n', '$'], act: 'shift 5', why: 'an arrow on n', note: 'The SLR table is the LR(0) automaton of the grammar with *: twelve states, the same shifts. Only the reductions change. First, shift the n.' },
  { st: [0, 5], sy: ['n'], inp: ['+', 'n', '*', 'n', '$'], act: 'reduce F → n', why: '+ is in FOLLOW(F) = { + * ) $ }', note: 'State 5 holds F → n ·. SLR reduces only if the next token can follow F; + can, so reduce, and GOTO from state 0 on F gives 3.' },
  { st: [0, 3], sy: ['F'], inp: ['+', 'n', '*', 'n', '$'], act: 'reduce T → F', why: '+ is in FOLLOW(T) = { + * ) $ }', note: 'Same story one level up: reduce F to T, and GOTO(0, T) gives state 2.' },
  { st: [0, 2], sy: ['T'], inp: ['+', 'n', '*', 'n', '$'], act: 'reduce E → T', why: '+ is in FOLLOW(E) = { + ) $ }', key: true, note: 'State 2: the LR(0) conflict state. Its shift is on *, its reduction on FOLLOW(E). The next token is +, which is in FOLLOW(E) and is not *, so there is exactly one answer: reduce.' },
  { st: [0, 1], sy: ['E'], inp: ['+', 'n', '*', 'n', '$'], act: 'shift 6', why: 'an arrow on +', note: 'State 1 has an arrow on +. (Its complete item S → E · only accepts under $.)' },
  { st: [0, 1, 6], sy: ['E', '+'], inp: ['n', '*', 'n', '$'], act: 'shift 5', why: 'an arrow on n', note: 'Shift the second number.' },
  { st: [0, 1, 6, 5], sy: ['E', '+', 'n'], inp: ['*', 'n', '$'], act: 'reduce F → n', why: '* is in FOLLOW(F)', note: 'Reduce n to F (the next token, *, can follow F), then GOTO(6, F) gives 3.' },
  { st: [0, 1, 6, 3], sy: ['E', '+', 'F'], inp: ['*', 'n', '$'], act: 'reduce T → F', why: '* is in FOLLOW(T)', note: 'Reduce F to T; GOTO(6, T) gives state 9.' },
  { st: [0, 1, 6, 9], sy: ['E', '+', 'T'], inp: ['*', 'n', '$'], act: 'shift 7', why: '* is not in FOLLOW(E) = { + ) $ }', key: true, note: 'The moment that matters. E + T is on the stack, a complete body; but the next token is *, which can never follow an E, so SLR does not reduce. It shifts, and n * n will be grouped first, exactly as precedence demands.' },
  { st: [0, 1, 6, 9, 7], sy: ['E', '+', 'T', '*'], inp: ['n', '$'], act: 'shift 5', why: 'an arrow on n', note: 'Shift the third number.' },
  { st: [0, 1, 6, 9, 7, 5], sy: ['E', '+', 'T', '*', 'n'], inp: ['$'], act: 'reduce F → n', why: '$ is in FOLLOW(F)', note: 'Reduce n to F; GOTO(7, F) gives 10.' },
  { st: [0, 1, 6, 9, 7, 10], sy: ['E', '+', 'T', '*', 'F'], inp: ['$'], act: 'reduce T → T * F', why: '$ is in FOLLOW(T)', note: 'Pop three states, uncovering 6, and GOTO(6, T) gives 9 again: T * F has become one T.' },
  { st: [0, 1, 6, 9], sy: ['E', '+', 'T'], inp: ['$'], act: 'reduce E → E + T', why: '$ is in FOLLOW(E)', key: true, note: 'Back in state 9, but now the next token is $, which can follow an E: reduce E + T. Same state, different lookahead, different action.' },
  { st: [0, 1], sy: ['E'], inp: ['$'], act: 'accept', why: 'S → E · under $', note: 'Accept. The tree is n + (n * n), with no conflict anywhere along the way.' },
];

export default function SlrParseSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const top = st.st[st.st.length - 1];
  const items = ITEMS[top] ?? [];
  return (
    <StepFrame title="SLR: one token decides" steps={s} note={st.note}>
      <Svg w={400} h={236} title="The stack, the input, the items of the state on top, and the action chosen with the reason">
        <T x={4} y={14} size={12} weight={700} fill={tok('muted')}>stack</T>
        {st.st.map((q, k) => (
          <g key={k}>
            <Box x={48 + k * 44} y={3} w={38} h={22} fill={k === st.st.length - 1 ? tok('brand', 0.18) : tok('panel')} stroke={tok('ink', 0.4)}>
              <T x={67 + k * 44} y={15} size={12} mono anchor="middle">{q}</T>
            </Box>
            {k > 0 && <T x={67 + k * 44} y={35} size={12} mono anchor="middle" fill={tok('accent')}>{st.sy[k - 1]}</T>}
          </g>
        ))}
        <T x={4} y={58} size={12} weight={700} fill={tok('muted')}>input</T>
        {st.inp.map((t, k) => (
          <Box key={k} x={48 + k * 30} y={47} w={25} h={22} stroke={k === 0 ? tok('brand') : tok('ink', 0.3)}>
            <T x={60.5 + k * 30} y={59} size={12} mono anchor="middle">{t}</T>
          </Box>
        ))}
        <Box x={4} y={78} w={186} h={152}>
          <T x={12} y={91} size={12} weight={700} fill={tok('muted')}>{`state ${top}`}</T>
          {items.map((it, k) => {
            const done = it.endsWith('·');
            return <T key={k} x={14} y={110 + k * 17} size={12} mono weight={done ? 700 : 400} fill={done ? tok('brand') : undefined}>{it}</T>;
          })}
        </Box>
        <Box x={200} y={78} w={196} h={152} stroke={st.key ? tok('accent') : tok('line')} fill={st.key ? tok('accent', 0.08) : tok('panel')}>
          <T x={210} y={96} size={12} fill={tok('muted')}>{`next token: ${st.inp[0]}`}</T>
          <T x={210} y={122} size={13} weight={700}>{st.act}</T>
          <T x={210} y={146} size={11} fill={tok('muted')}>because</T>
          {(st.why.includes(' = ') ? [st.why.slice(0, st.why.indexOf(' = ')), st.why.slice(st.why.indexOf(' = ') + 1)] : [st.why]).map((l, k) => (
            <T key={k} x={210} y={164 + k * 16} size={12} mono>{l}</T>
          ))}
        </Box>
      </Svg>
    </StepFrame>
  );
}
