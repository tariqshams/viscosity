// Chapter 220b: evaluating two Datalog rules over a handful of facts, one
// round at a time, until a round derives nothing new.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const FACTS = ['New(a, o1)', 'New(b, o2)', 'Assign(a, c)', 'Assign(b, c)', 'Assign(c, d)'];
const RULES = ['R1: Pts(V, H) :- New(V, H).', 'R2: Pts(T, H) :- Assign(F, T),', '                  Pts(F, H).'];

type S = { round: number; known: string[]; fresh: string[]; rule?: string; note: string };

const STATES: S[] = [
  { round: 0, known: [], fresh: [], note: 'The input is a set of facts, read straight off the program: two allocations (New) and three copies (Assign). The rules say how to derive new facts. No Pts facts exist yet.' },
  { round: 1, known: [], fresh: ['Pts(a, o1)', 'Pts(b, o2)'], rule: 'R1', note: 'Round 1. R1 says: if V = new object H, then V points at H. It matches both New facts and derives two Pts facts. R2 needs a Pts fact to join with, and there were none at the start of the round.' },
  { round: 2, known: ['Pts(a, o1)', 'Pts(b, o2)'], fresh: ['Pts(c, o1)', 'Pts(c, o2)'], rule: 'R2', note: 'Round 2. R2 joins Assign(F, T) with Pts(F, H) on the shared F: Assign(a, c) with Pts(a, o1) gives Pts(c, o1); Assign(b, c) with Pts(b, o2) gives Pts(c, o2).' },
  { round: 3, known: ['Pts(a, o1)', 'Pts(b, o2)', 'Pts(c, o1)', 'Pts(c, o2)'], fresh: ['Pts(d, o1)', 'Pts(d, o2)'], rule: 'R2', note: 'Round 3. Assign(c, d) now has two Pts(c, …) facts to join with, so d gets both objects.' },
  { round: 4, known: ['Pts(a, o1)', 'Pts(b, o2)', 'Pts(c, o1)', 'Pts(c, o2)', 'Pts(d, o1)', 'Pts(d, o2)'], fresh: [], note: 'Round 4 derives only facts we already have, so we stop: the fixpoint. These six facts are exactly the points-to sets Andersen’s analysis would compute, written as rows of a table.' },
];

export default function DatalogSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Rules, rounds and a fixpoint" steps={s} note={st.note}>
      <Svg w={400} h={262} title="Input facts and two rules at the top; below, the Pts facts known so far, with those derived in this round highlighted">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>FACTS</T>
        {FACTS.map((f, k) => (
          <T key={f} x={8 + (k % 2) * 140} y={30 + Math.floor(k / 2) * 18} size={12} mono>{f}</T>
        ))}
        <T x={290} y={12} size={11} weight={700} fill={tok('muted')}>{st.round ? `ROUND ${st.round}` : 'START'}</T>
        {RULES.map((r, k) => (
          <T key={k} x={8} y={96 + k * 16} size={12} mono fill={st.rule && r.startsWith(st.rule) || (st.rule === 'R2' && k === 2) ? tok('brand') : tok('ink')} weight={st.rule && (r.startsWith(st.rule) || (st.rule === 'R2' && k === 2)) ? 700 : undefined}>{r}</T>
        ))}
        <T x={8} y={156} size={11} weight={700} fill={tok('muted')}>Pts FACTS</T>
        {[...st.known, ...st.fresh].map((f, k) => {
          const isNew = st.fresh.includes(f);
          const x = 8 + (k % 3) * 130;
          const y = 168 + Math.floor(k / 3) * 34;
          return (
            <Box key={f} x={x} y={y} w={122} h={28} fill={isNew ? tok('brand', 0.14) : tok('panel')} stroke={isNew ? tok('brand') : tok('line')}>
              <T x={x + 61} y={y + 14} size={12} mono anchor="middle">{f}</T>
            </Box>
          );
        })}
        {st.round === 4 && <T x={200} y={250} size={12} weight={700} anchor="middle" fill={tok('safe')}>nothing new: fixpoint</T>}
      </Svg>
    </StepFrame>
  );
}
