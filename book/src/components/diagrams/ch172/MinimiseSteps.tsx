// DFA minimisation by splitting groups, on the if-or-name DFA from the
// subset construction: first for the language alone, then for a scanner,
// where the keyword and the name must stay apart.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const ROWS: [string, string, string, string, string][] = [
  ['A', 'B', 'C', 'C', 'start'],
  ['B', 'C', 'D', 'C', 'name'],
  ['C', 'C', 'C', 'C', 'name'],
  ['D', 'C', 'C', 'C', 'if / name'],
];
const COLOURS = ['f1', 'f3', 'f5', 'f2'];

type S = { title: string; groups: string[][]; check?: string; split?: string; note: string };
const STATES: S[] = [
  { title: 'Goal: the language', groups: [['A', 'B', 'C', 'D']], note: 'The DFA from the subset construction. Two states are equivalent if, from them, every possible rest of the input gets the same verdict. We look for groups of equivalent states, starting coarse and splitting.' },
  { title: 'Goal: the language', groups: [['A'], ['B', 'C', 'D']], note: 'First split: accepting states can never be equivalent to non-accepting ones (the empty rest of input tells them apart). So: {A} and {B, C, D}.' },
  { title: 'Goal: the language', groups: [['A'], ['B', 'C', 'D']], check: 'BCD', note: 'Check {B, C, D}, character by character. On i, f and x, each of B, C and D goes to C or D, which are both in the same group. Nothing tells them apart.' },
  { title: 'Goal: the language', groups: [['A'], ['B', 'C', 'D']], note: 'No group split, so we are done: two states, “start” and “inside a name”. That is right for the language, since if is also spelled like a name; but a scanner would lose the keyword.' },
  { title: 'Goal: a scanner', groups: [['A'], ['B', 'C'], ['D']], note: 'For a scanner, accepting states that report different tokens must never merge. So start with three groups: not accepting {A}, name {B, C}, keyword if {D}.' },
  { title: 'Goal: a scanner', groups: [['A'], ['B', 'C'], ['D']], check: 'BC', split: 'f', note: 'Check {B, C}: on f, B goes to D (the keyword group) but C goes to C (the name group). Different groups, so B and C must be split.' },
  { title: 'Goal: a scanner', groups: [['A'], ['B'], ['C'], ['D']], note: 'Every group now has one state, so nothing can split further: this DFA was already as small as a scanner for these two rules can be.' },
];

export default function MinimiseSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const g = (q: string) => st.groups.findIndex((x) => x.includes(q));
  const xs = [36, 110, 170, 230, 330];
  return (
    <StepFrame title="Minimising by splitting groups" steps={s} note={st.note}>
      <Svg w={400} h={200} title="The DFA's table, with each state coloured by its current group">
        <T x={8} y={14} size={12} weight={700} fill={tok('brand')}>{st.title}</T>
        {['state', 'i', 'f', 'x', 'accepts'].map((h, k) => (
          <T key={h} x={xs[k]} y={38} size={11} weight={700} anchor="middle" fill={tok('muted')}>{h}</T>
        ))}
        {ROWS.map((row, k) => {
          const y = 62 + k * 28;
          const checking = st.check?.includes(row[0]);
          return (
            <g key={row[0]}>
              {checking && <rect x={4} y={y - 12} width={392} height={24} rx={3} fill={tok('brand', 0.08)} />}
              {row.slice(0, 4).map((c, j) => (
                <Box key={j} x={xs[j] - 15} y={y - 10} w={30} h={20} r={4}
                  fill={tok(COLOURS[g(c)], 0.22)} stroke={j === 2 && checking && st.split === 'f' ? tok('brand') : tok(COLOURS[g(c)])}>
                  <T x={xs[j]} y={y + 1} size={12} mono anchor="middle" weight={j === 0 ? 700 : 400}>{c}</T>
                </Box>
              ))}
              <T x={xs[4]} y={y} size={11} anchor="middle" fill={tok('muted')}>{st.title.includes('scanner') || row[4] === 'start' ? row[4] : 'yes'}</T>
            </g>
          );
        })}
        <T x={8} y={186} size={11} fill={tok('muted')}>{`groups: ${st.groups.map((x) => '{' + x.join(', ') + '}').join('  ')}`}</T>
      </Svg>
    </StepFrame>
  );
}
