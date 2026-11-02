// Chapter 128: an optimistic worklist analysis on a tiny SSA loop. Facts
// start at "number" (the top of a two-point lattice) and only move down,
// and every change puts the value's users back on the worklist.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const ROWS: [string, string][] = [
  ['v1', '0'],
  ['v2', 'φ(v1, v6)'],
  ['v3', 'v2 + 1'],
  ['v4', '"!"'],
  ['v5', 'φ(v3, v4)'],
  ['v6', 'v5 + 1'],
];

/** N = number, M = maybe-not, one letter per row */
type S = { f: string; hot?: number; work: string[]; changed?: boolean; note: string };

const STATES: S[] = [
  { f: 'NNNMNN', work: ['v2', 'v3', 'v5', 'v6'], note: 'Constants get their fact straight away: 0 is a number, "!" is not. Everything else starts OPTIMISTIC, at "number", and every non-constant goes on the worklist.' },
  { f: 'NNNMNN', hot: 1, work: ['v3', 'v5', 'v6'], note: 'Take v2 off the front. A phi is a number only if all its operands are. v1 and v6 are both "number" right now, so v2 stays "number". No change, nothing to add.' },
  { f: 'NNNMNN', hot: 2, work: ['v5', 'v6'], note: 'v3 = v2 + 1: both sides are numbers, so the sum is too. No change.' },
  { f: 'NNNMMN', hot: 4, changed: true, work: ['v6'], note: 'v5 = φ(v3, v4): v4 is a string, so v5 might not be a number. Its fact moves DOWN the lattice. v5 changed, so its users must be looked at again: v6 is already queued.' },
  { f: 'NNNMMM', hot: 5, changed: true, work: ['v2'], note: 'v6 = v5 + 1: one side may not be a number, so neither may the sum ("!" + 1 is "!1"). v6 changed: its user, the loop phi v2, goes back on the worklist.' },
  { f: 'NMNMMM', hot: 1, changed: true, work: ['v3'], note: 'v2 = φ(v1, v6) again. This time v6 says "maybe-not", so the doubt has travelled round the loop’s back edge into the header. Queue v2’s user, v3.' },
  { f: 'NMMMMM', hot: 2, changed: true, work: ['v5'], note: 'v3 = v2 + 1 is now maybe-not too. Queue v5.' },
  { f: 'NMMMMM', hot: 4, work: [], note: 'v5 is already at the bottom of the lattice. Nothing changes, nothing is added, and the worklist is empty.' },
  { f: 'NMMMMM', work: [], note: 'A fixpoint: running any value’s rule again would give the same fact. Each fact moved down at most once, which is why this always ends. Only v1 is provably a number.' },
];

const RH = 24;
const Y0 = 26;

export default function WorklistSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="A worklist reaching a fixpoint" steps={s} note={st.note}>
      <Svg w={400} h={252} title="Six SSA values in a loop, each with its current fact, number or maybe-not. On the right, the two-point lattice. At the bottom, the worklist.">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>VALUE</T>
        <T x={196} y={12} size={11} weight={700} fill={tok('muted')}>FACT</T>
        {ROWS.map(([id, def], k) => {
          const y = Y0 + k * (RH + 4);
          const n = st.f[k] === 'N';
          const hot = st.hot === k;
          return (
            <g key={id}>
              <Box x={6} y={y} w={176} h={RH} fill={hot ? tok('brand', 0.12) : tok('panel')} stroke={hot ? tok('brand') : tok('line')}>
                <T x={14} y={y + RH / 2} size={12.5} mono weight={700}>{id}</T>
                <T x={44} y={y + RH / 2} size={12.5} mono>{`= ${def}`}</T>
              </Box>
              <Box x={192} y={y} w={92} h={RH} fill={n ? tok('safe', 0.14) : tok('danger', 0.12)} stroke={hot && st.changed ? tok('brand') : n ? tok('safe') : tok('danger')}>
                <T x={238} y={y + RH / 2} size={12} anchor="middle" weight={hot && st.changed ? 700 : 400}>{n ? 'number' : 'maybe-not'}</T>
              </Box>
            </g>
          );
        })}
        <T x={346} y={12} size={11} weight={700} anchor="middle" fill={tok('muted')}>LATTICE</T>
        <Box x={302} y={40} w={88} h={26} fill={tok('safe', 0.14)} stroke={tok('safe')}>
          <T x={346} y={53} size={12} anchor="middle">number</T>
        </Box>
        <Arrow x1={346} y1={68} x2={346} y2={110} />
        <Box x={302} y={112} w={88} h={26} fill={tok('danger', 0.12)} stroke={tok('danger')}>
          <T x={346} y={125} size={12} anchor="middle">maybe-not</T>
        </Box>
        <T x={346} y={154} size={10.5} anchor="middle" fill={tok('muted')}>facts only</T>
        <T x={346} y={167} size={10.5} anchor="middle" fill={tok('muted')}>move down</T>
        <T x={8} y={210} size={11} weight={700} fill={tok('muted')}>WORKLIST</T>
        {st.work.length === 0 && <T x={84} y={210} size={12} fill={tok('muted')}>(empty)</T>}
        {st.work.map((w, k) => (
          <Box key={k} x={84 + k * 48} y={198} w={42} h={24} fill={tok('accent', 0.12)} stroke={tok('accent')}>
            <T x={105 + k * 48} y={210} size={12} mono anchor="middle">{w}</T>
          </Box>
        ))}
        <T x={8} y={240} size={11} fill={tok('muted')}>front of the queue is on the left</T>
      </Svg>
    </StepFrame>
  );
}
