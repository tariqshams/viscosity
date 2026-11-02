import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 430: the rungs of plan_one in engine/rust/crates/core/src/plan.rs,
// in order, and where six small programs leave the ladder. Every reason is
// the real first reason line of `viscosity explain` (rustc 1.97 release
// build) for this chapter's programs r1, r4, l1 (--mode opt-in), r2, r3
// and l1 (default options), wrapped by hand.
const RUNGS = [
  'any bailouts?',
  'annotated?',
  'opt-in mode?',
  'Python, no --python-auto?',
  'no numeric field?',
  'no loop touches a field?',
  'size below min_size?',
];

type S = { stop: number; prog: string; verdict: string; reason: string[]; soa?: boolean; note: string };

const STATES: S[] = [
  { stop: -1, prog: '', verdict: '', reason: [], note: 'plan_one asks these questions in this order, for one collection at a time. The first one that says yes ends the call with return keep(...), and its reason goes into explain.' },
  { stop: 0, prog: 'r1.js: keep.push(ps[i])', verdict: 'kept', reason: ['unsafe: line 6: an element', 'is used by push'], note: 'Safety comes first. ps has two bailouts (an element escapes, and the array is passed to console.log), so it gets two reasons, one per bailout, and nothing below is looked at.' },
  { stop: 1, prog: 'r4.js: // @viscosity aos', verdict: 'kept', reason: ['annotated @viscosity aos', 'at line 1'], note: 'A safe collection with an annotation follows the annotation and returns here. An aos annotation keeps it; soa or aosoa(N) would transform it, without asking any of the cost questions below.' },
  { stop: 2, prog: 'l1.js --mode opt-in', verdict: 'kept', reason: ['opt-in mode: not annotated'], note: 'In opt-in mode, only annotated collections are touched, so an unannotated one stops here, however good it looks.' },
  { stop: 4, prog: 'r2.js: { name: "p" + i }', verdict: 'kept', reason: ['no field is provably numeric,', 'so there are no typed', 'columns to gain'], note: 'The first cost rung. A record of strings would get only plain-array columns, so the planner says no. (The Python rung above it only fires for .py files.)' },
  { stop: 5, prog: 'r3.js: one read, no loop', verdict: 'kept', reason: ['no loop reads or writes its', 'fields, so a new layout', 'cannot pay off'], note: 'ps[3].x outside any loop: its table has depth 0. Without a loop of depth at least 1 touching a field, nothing would get faster.' },
  { stop: 7, prog: 'l1.js (defaults)', verdict: 'struct of arrays', reason: ['loop at line 4 in <module>()', 'touches 1 of 1 fields (x)'], soa: true, note: 'At most 100 elements is not below 64, so no rung fires and plan_one reaches its last expression: a CollectionPlan with Layout::Soa, whose reasons come from describe(). The size rung is the next chapter’s.' },
];

export default function LadderSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Down the ladder" steps={s} note={st.note}>
      <Svg w={400} h={300} title="The rungs of plan_one, and where one program leaves the ladder">
        {RUNGS.map((r, k) => {
          const hit = st.stop === k;
          const passed = st.stop > k;
          return (
            <Box key={r} x={4} y={6 + k * 34} w={196} h={28} fill={hit ? tok('warn', 0.18) : passed ? tok('safe', 0.08) : tok('panel')} stroke={hit ? tok('warn') : passed ? tok('safe') : tok('line')}>
              <T x={12} y={20 + k * 34} size={11}>{`${k + 1}. ${r}`}</T>
              <T x={192} y={20 + k * 34} size={11} anchor="end" weight={700} fill={hit ? tok('warn') : passed ? tok('safe') : tok('muted')}>{hit ? 'yes' : passed ? 'no' : ''}</T>
            </Box>
          );
        })}
        <Box x={4} y={6 + 7 * 34} w={196} h={28} fill={st.soa ? tok('safe', 0.18) : tok('panel')} stroke={st.soa ? tok('safe') : tok('line')}>
          <T x={102} y={20 + 7 * 34} size={11} anchor="middle" weight={700}>→ Layout::Soa</T>
        </Box>
        {st.prog && (
          <g>
            <T x={210} y={20} size={11} weight={700} fill={tok('muted')}>PROGRAM</T>
            <T x={210} y={38} size={11} mono>{st.prog.split(': ')[0]}</T>
            {st.prog.includes(': ') && <T x={210} y={54} size={11} mono>{st.prog.split(': ')[1]}</T>}
            <T x={210} y={84} size={11} weight={700} fill={tok('muted')}>VERDICT</T>
            <T x={210} y={102} size={12} weight={700} fill={st.soa ? tok('safe') : tok('warn')}>{st.verdict}</T>
            <T x={210} y={132} size={11} weight={700} fill={tok('muted')}>FIRST REASON</T>
          </g>
        )}
        {st.reason.map((l, k) => (
          <T key={k} x={210} y={150 + k * 16} size={11}>{l}</T>
        ))}
      </Svg>
    </StepFrame>
  );
}
