import { Box, Svg, T, tok } from '../../viz/svg';

// Eight jobs (one costs 8 units, the rest 1) on two threads, as a timeline:
// equal halves of the list versus taking the next job when free. Static.

const COST = [8, 1, 1, 1, 1, 1, 1, 1];
const U = 20; // px per unit

function Lane({ y, jobs, label, color }: { y: number; jobs: number[]; label: string; color: string }) {
  let x = 84;
  const total = jobs.reduce((a, k) => a + COST[k], 0);
  return (
    <g>
      <T x={8} y={y + 11} size={11}>{label}</T>
      {jobs.map((k) => {
        const w = COST[k] * U;
        const bx = x;
        x += w;
        return (
          <Box key={k} x={bx} y={y} w={w} h={22} r={2} fill={tok(color, 0.18)} stroke={tok(color)}>
            <T x={bx + w / 2} y={y + 11} size={11} mono anchor="middle">{k}</T>
          </Box>
        );
      })}
      <T x={x + 6} y={y + 11} size={11} mono weight={700}>{total}</T>
    </g>
  );
}

export default function ChunkVsSteal() {
  return (
    <Svg w={400} h={176} title="Timelines of two threads: equal halves leave one idle; taking the next job keeps both busy">
      <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>EQUAL HALVES OF THE LIST</T>
      <Lane y={22} jobs={[0, 1, 2, 3]} label="thread 1" color="f1" />
      <Lane y={48} jobs={[4, 5, 6, 7]} label="thread 2" color="f2" />
      <T x={8} y={92} size={11} weight={700} fill={tok('muted')}>NEXT JOB WHEN FREE</T>
      <Lane y={102} jobs={[0]} label="thread 1" color="f1" />
      <Lane y={128} jobs={[1, 2, 3, 4, 5, 6, 7]} label="thread 2" color="f2" />
      <T x={8} y={168} size={11} fill={tok('muted')}>boxes are jobs (number = position); width = cost</T>
    </Svg>
  );
}
