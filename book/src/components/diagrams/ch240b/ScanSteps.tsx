// Linear scan on sumsq's four live intervals, with only two registers
// (s1, s2) so that something has to spill. Intervals and decisions are the
// real output of the chapter's intervals() and linearScan(..., ['s1', 's2'])
// in Node 22: v0 [0,8], v1 [1,10], v2 [2,8], v3 [3,8];
// v0 -> s1, v1 -> s2 then slot0, v2 -> s2, v3 -> slot1.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

type Home = 's1' | 's2' | 'slot0' | 'slot1' | null;
type S = { homes: Home[]; at: number; note: string };

const IV = [
  { v: 'v0', what: 'n', start: 0, end: 8 },
  { v: 'v1', what: 's', start: 1, end: 10 },
  { v: 'v2', what: 'i', start: 2, end: 8 },
  { v: 'v3', what: 'i*i', start: 3, end: 8 },
];

const STATES: S[] = [
  { homes: [null, null, null, null], at: -1, note: 'Each bar is one virtual register\'s live interval, from the first to the last line of sumsq\'s code that needs it (the loop is lines 3 to 8, so anything used inside it is stretched to cover it all). We pretend only s1 and s2 exist, to see what happens when registers run out.' },
  { homes: ['s1', null, null, null], at: 0, note: 'Intervals are taken in order of their start. v0 (n) starts first, s1 is free, so v0 lives in s1 for its whole life.' },
  { homes: ['s1', 's2', null, null], at: 1, note: 'v1 (s, the running sum) starts at line 1. s2 is free: v1 gets it.' },
  { homes: ['s1', 'slot0', 's2', null], at: 2, note: 'v2 (i) starts at line 2 and no register is free. Of the intervals holding a register, v1 ends last (line 10, after v2\'s line 8), so v1 is spilled to a stack slot and v2 takes its register: keep the values that will free their register soonest.' },
  { homes: ['s1', 'slot0', 's2', 'slot1'], at: 3, note: 'v3 (i * i) starts at line 3. Again nothing is free, and nobody holding a register ends later than v3 does (all end at line 8), so v3 itself goes to a slot.' },
  { homes: ['s1', 'slot0', 's2', 'slot1'], at: 4, note: 'Rewriting: each use of a spilled value is loaded first (ld t0, 0(sp)), and each definition is stored straight after (sd t2, 0(sp)). The loop now does three loads and stores per trip; with all eleven of s1 to s11 available, nothing spills and v0 to v3 get s1 to s4.' },
];

const X0 = 64;
const DX = 29;

export default function ScanSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Linear scan with two registers" steps={s} note={st.note}>
      <Svg w={400} h={210} title="Four live intervals on a line-number axis, each coloured by the register or stack slot it was given">
        {Array.from({ length: 11 }, (_, k) => (
          <T key={k} x={X0 + k * DX} y={10} size={11} mono anchor="middle" fill={k >= 3 && k <= 8 ? tok('ink') : tok('muted')}>{k}</T>
        ))}
        <rect x={X0 + 3 * DX - 10} y={18} width={5 * DX + 20} height={122} fill={tok('warn', 0.08)} stroke={tok('warn', 0.5)} strokeDasharray="4 3" />
        <T x={X0 + 5.5 * DX} y={152} size={11} anchor="middle" fill={tok('muted')}>the loop (lines 3 to 8)</T>
        {IV.map((r, k) => {
          const y = 26 + k * 28;
          const h = st.homes[k];
          const spilled = h?.startsWith('slot');
          const col = h === 's1' ? 'f1' : h === 's2' ? 'f2' : spilled ? 'danger' : 'muted';
          return (
            <g key={r.v}>
              <T x={6} y={y + 10} size={12} mono weight={st.at === k ? 700 : 400}>{r.v}</T>
              <T x={30} y={y + 10} size={11} fill={tok('muted')}>{r.what}</T>
              <Box x={X0 + r.start * DX - 9} y={y} w={(r.end - r.start) * DX + 18} h={20} r={10} fill={tok(col, h ? 0.25 : 0.1)} stroke={tok(col)} dash={spilled}>
                <T x={X0 + r.start * DX + 2} y={y + 10} size={11} mono>{h ?? ''}</T>
              </Box>
            </g>
          );
        })}
        <T x={8} y={176} size={11} weight={700} fill={tok('muted')}>REGISTERS</T>
        {(['s1', 's2'] as const).map((r, k) => {
          const owner = IV.find((_, j) => st.homes[j] === r);
          return (
            <Box key={r} x={90 + k * 110} y={164} w={100} h={26} fill={owner ? tok(r === 's1' ? 'f1' : 'f2', 0.2) : tok('paper')} stroke={tok('line')}>
              <T x={140 + k * 110} y={177} size={12} mono anchor="middle">{`${r}: ${owner ? owner.v : 'free'}`}</T>
            </Box>
          );
        })}
      </Svg>
    </StepFrame>
  );
}
