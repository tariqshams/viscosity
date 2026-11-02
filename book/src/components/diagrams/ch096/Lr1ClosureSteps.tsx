// LR(1) closure, step by step, for the assignment grammar: every item
// carries a lookahead, and a new item's lookahead is FIRST of whatever
// follows the nonterminal (or the old lookahead, if nothing does).
import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

type It = [string, string];
type S = { items: It[]; fresh: number; from?: number; rule: string; state?: string; note: string };
const ALL: It[] = [
  ['S → · P', '$'],
  ['P → · L = R', '$'], ['P → · R', '$'],
  ['L → · * R', '='], ['L → · id', '='],
  ['R → · L', '$'],
  ['L → · * R', '$'], ['L → · id', '$'],
];
const STATES: S[] = [
  { items: ALL.slice(0, 1), fresh: 1, rule: 'start item: S → · P, lookahead $', note: 'An LR(1) item is an LR(0) item plus one token, its lookahead: the token that must come next when this rule is finished. The start item’s lookahead is $, the end of the input.' },
  { items: ALL.slice(0, 3), fresh: 1, from: 0, rule: 'after P: nothing, so use $', note: 'The dot is before P, and nothing follows P in that item, so what comes after a P is whatever came after S: $. Both P rules join with lookahead $.' },
  { items: ALL.slice(0, 5), fresh: 3, from: 1, rule: 'after L: = R, so FIRST(= R $), which is { = }', note: 'In P → · L = R the dot is before L, and after L comes “= R”. So an L made here is always followed by =: both L rules join with lookahead =.' },
  { items: ALL.slice(0, 6), fresh: 5, from: 2, rule: 'after R: nothing, so use $', note: 'In P → · R nothing follows R, so the R rule gets the item’s own lookahead, $.' },
  { items: ALL.slice(0, 8), fresh: 6, from: 5, rule: 'after L: nothing, so use $', note: 'In R → · L nothing follows L, so the L rules join again, this time with lookahead $. Same rules, different lookahead: in LR(1) they are different items.' },
  { items: [['P → L · = R', '$'], ['R → L ·', '$']], fresh: 0, state: 'goto on L: state 2', rule: 'shift on =, reduce R → L on $', note: 'Now goto on L. The two items keep their lookaheads: shift on =, reduce R → L only on $. The cell that SLR filled twice now has one action. The conflict is gone.' },
];

export default function Lr1ClosureSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="LR(1) closure carries lookaheads" steps={s} note={st.note}>
      <Svg w={400} h={210} title="The items of LR(1) state 0 of the assignment grammar, each with its lookahead">
        <Box x={4} y={4} w={250} h={22 + Math.max(st.items.length, 2) * 20} stroke={st.state ? tok('safe') : tok('line')}>
          <T x={12} y={16} size={12} weight={700} fill={tok('muted')}>{st.state ?? 'state 0'}</T>
          <T x={236} y={16} size={11} anchor="end" fill={tok('muted')}>lookahead</T>
          {st.items.map(([it, la], k) => {
            const fresh = !st.state && k >= st.fresh;
            const src = k === st.from;
            return (
              <g key={k}>
                {src && <rect x={8} y={26 + k * 20} width={242} height={18} rx={3} fill={tok('accent', 0.16)} />}
                <T x={14} y={36 + k * 20} size={12} mono fill={fresh ? tok('brand') : undefined} weight={fresh ? 700 : 400}>{it}</T>
                <T x={226} y={36 + k * 20} size={12} mono anchor="middle" weight={700} fill={fresh ? tok('brand') : tok('accent')}>{la}</T>
              </g>
            );
          })}
        </Box>
        <Box x={262} y={4} w={134} h={92} fill={tok('ink', 0.04)}>
          <T x={270} y={20} size={11} weight={700} fill={tok('muted')}>rule used</T>
          {st.rule.split(', ').map((l, k) => (
            <T key={k} x={270} y={42 + k * 18} size={11}>{l}</T>
          ))}
        </Box>
        <T x={270} y={118} size={11} fill={tok('muted')}>blue row: the item</T>
        <T x={270} y={133} size={11} fill={tok('muted')}>being closed</T>
        <T x={270} y={152} size={11} fill={tok('brand')}>orange: items it adds</T>
      </Svg>
    </StepFrame>
  );
}
