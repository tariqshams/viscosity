import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 285: one problem ("is it a number?" on a four-value loop), two
// strategies. The worklist steps are the trace of the chapter's design
// solver (a stack, so pop takes the last entry, shown on the right); the
// rounds steps are Viscosity's strategy from numeric_inference in
// engine/rust/crates/core/src/analysis.rs: every value in id order, in
// place, until a round changes nothing.
const ROWS: [string, string][] = [
  ['%0', '0'],
  ['%1', 'phi %0, %3'],
  ['%2', '"!"'],
  ['%3', '%1 + %2'],
];

type S = { mode: 'worklist' | 'rounds'; f: string; hot?: number; changed?: boolean; work: string[]; runs: number; note: string };

const STATES: S[] = [
  { mode: 'worklist', f: 'NNNN', work: ['%3', '%2', '%1', '%0'], runs: 0, note: 'The design solver: every fact starts at top (“number”) and every node is on the stack. pop() takes the right-hand end, so %0 comes first.' },
  { mode: 'worklist', f: 'NNNN', hot: 0, work: ['%3', '%2', '%1'], runs: 1, note: 'Pop %0. A constant 0 is a number: no change, nobody to wake.' },
  { mode: 'worklist', f: 'NNNN', hot: 1, work: ['%3', '%2'], runs: 2, note: 'Pop %1, the loop phi. Both operands still say “number” (%3 is optimistic), so it stays “number”. Too early, as it turns out.' },
  { mode: 'worklist', f: 'NNMN', hot: 2, changed: true, work: ['%3'], runs: 3, note: 'Pop %2: a string. Its fact drops. Its user %3 is already queued, so nothing is pushed.' },
  { mode: 'worklist', f: 'NNMM', hot: 3, changed: true, work: ['%1'], runs: 4, note: 'Pop %3 = %1 + %2. One side may not be a number, so the sum may not be. It changed: push its user, the phi %1.' },
  { mode: 'worklist', f: 'NMMM', hot: 1, changed: true, work: ['%3'], runs: 5, note: 'Pop %1 again. Now %3 says “maybe-not”: the doubt has come round the back edge. Push %3, which reads %1.' },
  { mode: 'worklist', f: 'NMMM', hot: 3, work: [], runs: 6, note: 'Pop %3: already at the bottom, no change. The stack is empty: a fixpoint, after 6 transfers.' },
  { mode: 'rounds', f: 'NNMM', work: [], runs: 4, note: 'Viscosity’s way: round 1 runs every rule in id order, updating in place. %1 sees the old %3 (“number”); %2 and %3 drop.' },
  { mode: 'rounds', f: 'NMMM', changed: true, work: [], runs: 8, note: 'Round 2: %1 now sees %3 = maybe-not and drops. Something changed, so another round is needed.' },
  { mode: 'rounds', f: 'NMMM', work: [], runs: 12, note: 'Round 3 changes nothing: converged, after 12 transfers. Same facts as the worklist. Out of rounds before a quiet one, the real loop would fail closed instead.' },
];

const RH = 26;
const Y0 = 34;

export default function SolverSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="One problem, two strategies" steps={s} note={st.note}>
      <Svg w={400} h={230} title="Four SSA values with their facts, the worklist stack, and a count of transfer functions run">
        <T x={8} y={14} size={11} weight={700} fill={tok('muted')}>VALUE</T>
        <T x={204} y={14} size={11} weight={700} fill={tok('muted')}>FACT</T>
        <T x={392} y={14} size={11} weight={700} anchor="end" fill={tok('brand')}>
          {st.mode === 'worklist' ? 'design: worklist' : 'Viscosity: rounds'}
        </T>
        {ROWS.map(([id, def], k) => {
          const y = Y0 + k * (RH + 6);
          const n = st.f[k] === 'N';
          const hot = st.hot === k;
          return (
            <g key={id}>
              <Box x={6} y={y} w={184} h={RH} fill={hot ? tok('brand', 0.12) : tok('panel')} stroke={hot ? tok('brand') : tok('line')}>
                <T x={14} y={y + RH / 2} size={12.5} mono weight={700}>{id}</T>
                <T x={46} y={y + RH / 2} size={12.5} mono>{`= ${def}`}</T>
              </Box>
              <Box x={200} y={y} w={96} h={RH} fill={n ? tok('safe', 0.14) : tok('danger', 0.12)} stroke={hot && st.changed ? tok('brand') : n ? tok('safe') : tok('danger')}>
                <T x={248} y={y + RH / 2} size={12} anchor="middle" weight={hot && st.changed ? 700 : 400}>{n ? 'number' : 'maybe-not'}</T>
              </Box>
            </g>
          );
        })}
        <T x={348} y={52} size={11} weight={700} anchor="middle" fill={tok('muted')}>TRANSFERS</T>
        <T x={348} y={82} size={26} weight={700} anchor="middle" mono fill={tok('accent')}>{st.runs}</T>
        <T x={8} y={186} size={11} weight={700} fill={tok('muted')}>STACK</T>
        {st.mode === 'rounds' && <T x={64} y={186} size={12} fill={tok('muted')}>(none: every value, every round)</T>}
        {st.mode === 'worklist' && st.work.length === 0 && <T x={64} y={186} size={12} fill={tok('muted')}>(empty)</T>}
        {st.work.map((w, k) => (
          <Box key={k} x={64 + k * 46} y={174} w={40} h={24} fill={tok('accent', 0.12)} stroke={tok('accent')}>
            <T x={84 + k * 46} y={186} size={12} mono anchor="middle">{w}</T>
          </Box>
        ))}
        <T x={8} y={216} size={11} fill={tok('muted')}>pop() takes the right-hand end</T>
      </Svg>
    </StepFrame>
  );
}
