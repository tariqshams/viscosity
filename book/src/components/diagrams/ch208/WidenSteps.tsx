// "Abstract interpretation and widening": the interval of i at the loop
// header of   i = 0; while (i < n) { xs[i] = 0; i = i + 1; }
// Top lane: plain iteration, a new upper bound every round, for ever.
// Bottom lane: with widening, the growing bound jumps to +∞ and settles.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const X0 = 40;
const DX = 40; // pixels per unit
const xOf = (v: number) => X0 + v * DX;
const INF = 99;

type Lane = { lo: number; hi: number } | null;
type St = { top: Lane; bot: Lane; focus: 'top' | 'bot' | 'both'; round: string; note: string };

const STATES: St[] = [
  { top: { lo: 0, hi: 0 }, bot: { lo: 0, hi: 0 }, focus: 'both', round: 'round 1', note: 'Round 1. Only the entry edge has a value so far: i = 0, the interval [0, 0]. The loop body then computes i + 1, giving [1, 1] on the back edge.' },
  { top: { lo: 0, hi: 1 }, bot: null, focus: 'top', round: 'round 2', note: 'Without widening: at the header, join the entry’s [0, 0] with the back edge’s [1, 1]: [0, 1]. The body now sends back [1, 2].' },
  { top: { lo: 0, hi: 2 }, bot: null, focus: 'top', round: 'round 3', note: 'Round 3: [0, 0] joined with [1, 2] is [0, 2]. Again a new upper bound.' },
  { top: { lo: 0, hi: 3 }, bot: null, focus: 'top', round: 'round 4', note: 'Round 4: [0, 3], and round 5 will give [0, 4]. Intervals form a lattice of INFINITE height, so this never stops: every round climbs one step.' },
  { top: { lo: 0, hi: 3 }, bot: { lo: 0, hi: INF }, focus: 'bot', round: 'round 2', note: 'With widening, back to round 2: the old fact was [0, 0], the new one [0, 1]. The lower bound held, so keep 0; the upper bound GREW, so jump it to +∞. The header gets [0, +∞].' },
  { top: { lo: 0, hi: 3 }, bot: { lo: 0, hi: INF }, focus: 'bot', round: 'round 3', note: 'Round 3: the body sends back [1, +∞]; joined with [0, 0] that is [0, +∞], the same as before. A fixpoint, after three rounds.' },
  { top: { lo: 0, hi: 3 }, bot: { lo: 0, hi: INF }, focus: 'bot', round: 'answer', note: 'The answer is SOUND: every value i really takes (0, 1, 2, …) lies inside [0, +∞]. It is enough to prove xs[i] never uses a negative index. Using the test i < n as well would tighten it (narrowing).' },
];

function Bar({ lane, y, on, label }: { lane: Lane; y: number; on: boolean; label: string }) {
  const c = on ? tok('brand') : tok('ink', 0.35);
  return (
    <g>
      <T x={8} y={y - 26} size={11} weight={700} fill={on ? tok('brand') : tok('muted')}>{label}</T>
      {lane && (
        lane.hi === INF ? (
          <g>
            <Box x={xOf(lane.lo) - 4} y={y - 9} w={xOf(7.2) - xOf(lane.lo) + 4} h={18} fill={on ? tok('brand', 0.22) : tok('panel')} stroke={c} />
            <Arrow x1={xOf(7.2)} y1={y} x2={392} y2={y} color={c} />
            <T x={392} y={y + 24} size={12} anchor="end" weight={700} fill={c}>+∞</T>
          </g>
        ) : (
          <Box x={xOf(lane.lo) - 4} y={y - 9} w={xOf(lane.hi) - xOf(lane.lo) + 8} h={18} fill={on ? tok('brand', 0.22) : tok('panel')} stroke={c} />
        )
      )}
      {lane && (
        <T x={200} y={y - 26} size={12} mono weight={700} fill={on ? tok('ink') : tok('muted')}>
          {`[${lane.lo}, ${lane.hi === INF ? '+∞' : lane.hi}]`}
        </T>
      )}
    </g>
  );
}

export default function WidenSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const ticks = [0, 1, 2, 3, 4, 5, 6, 7];
  return (
    <StepFrame title="Intervals for a loop counter, with and without widening" steps={s} note={st.note}>
      <div className="mb-1 text-xs font-semibold text-muted">{st.round}</div>
      <Svg w={400} h={236} title="Two number lines from 0 to 7 showing the interval for i at the loop header. Without widening it grows by one each round, for ever; with widening it becomes 0 to plus infinity and stops.">
        <Bar lane={st.top} y={62} on={st.focus !== 'bot'} label="WITHOUT WIDENING" />
        <Bar lane={st.bot} y={160} on={st.focus !== 'top'} label="WITH WIDENING" />
        {[62, 160].map((y) => (
          <g key={y}>
            <line x1={xOf(0) - 10} y1={y + 12} x2={xOf(7.4)} y2={y + 12} stroke={tok('line')} strokeWidth={1.2} />
            {ticks.map((t) => (
              <g key={t}>
                <line x1={xOf(t)} y1={y + 9} x2={xOf(t)} y2={y + 15} stroke={tok('muted')} strokeWidth={1} />
                <T x={xOf(t)} y={y + 24} size={11} anchor="middle" fill={tok('muted')}>{String(t)}</T>
              </g>
            ))}
          </g>
        ))}
      </Svg>
    </StepFrame>
  );
}
