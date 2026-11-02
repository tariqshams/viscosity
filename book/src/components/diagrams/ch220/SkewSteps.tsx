// Chapter 219-b: three schedules for the nest a[i][j] = a[i-1][j+1]
// (distance (1, -1)): the original order, interchange (illegal) and
// skewing (legal, and afterwards tileable). Points are drawn at their
// schedule times.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Svg, T, tok } from '../../viz/svg';

const N = 4;
type Sched = 'id' | 'swap' | 'skew';
type S = { sched: Sched; tiles?: boolean; note: string };

const STATES: S[] = [
  { sched: 'id', note: 'The original schedule θ(i, j) = (i, j): each point drawn at its time, rows run top to bottom, left to right inside a row. Every arrow (writer to reader) points to a later row, so the order is legal.' },
  { sched: 'swap', note: 'Interchange, θ(i, j) = (j, i): now columns of the old grid become rows. The arrows point up, to earlier rows: each reader would run before its writer. M · (1, −1) = (−1, 1), which starts negative: illegal.' },
  { sched: 'skew', note: 'Skewing, θ(i, j) = (i, i + j): each row shifts right by its own number. Every arrow now points straight down: M · (1, −1) = (1, 0). Legal.' },
  { sched: 'skew', tiles: true, note: 'The skewed distance (1, 0) has no negative entry, so the skewed loops are fully permutable, and the (now slanted) nest can be cut into 2 × 2 tiles of time: the tiling that the original order did not allow.' },
];

const X0 = 50;
const Y0 = 40;
const D = 44;

function place(s: Sched, i: number, j: number): [number, number] {
  if (s === 'id') return [j, i];
  if (s === 'swap') return [i, j];
  return [i + j, i];
}

export default function SkewSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const pts: [number, number][] = [];
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) pts.push([i, j]);
  const xy = (i: number, j: number) => {
    const [c, r] = place(st.sched, i, j);
    return [X0 + c * D, Y0 + r * D] as const;
  };
  const deps: [number, number][] = [];
  for (let i = 1; i < N; i++) for (let j = 0; j < N - 1; j++) deps.push([i, j]);
  const bad = st.sched === 'swap';
  return (
    <StepFrame title="Three schedules for one nest" steps={s} note={st.note}>
      <Svg w={400} h={230} title="Iteration points placed at their scheduled times, with dependence arrows">
        <T x={8} y={14} size={11} weight={700} fill={tok('muted')}>
          {st.sched === 'id' ? 'θ(i, j) = (i, j)' : st.sched === 'swap' ? 'θ(i, j) = (j, i)' : 'θ(i, j) = (i, i + j)'}
        </T>
        <T x={392} y={14} size={11} anchor="end" fill={tok('muted')}>time runs down the rows, then across</T>
        {st.tiles && [0, 2].map((r) => [0, 2, 4, 6].map((c) => (
          <rect key={`${r},${c}`} x={X0 + c * D - 18} y={Y0 + r * D - 18} width={2 * D - 8} height={2 * D - 8} rx={8}
            fill={tok('safe', 0.08)} stroke={tok('safe')} strokeWidth={1} strokeDasharray="4 3" />
        )))}
        {deps.map(([i, j]) => {
          const [x1, y1] = xy(i - 1, j + 1);
          const [x2, y2] = xy(i, j);
          const dx = x2 - x1;
          const dy = y2 - y1;
          const len = Math.hypot(dx, dy);
          const ux = dx / len;
          const uy = dy / len;
          return <Arrow key={`${i},${j}`} x1={x1 + ux * 11} y1={y1 + uy * 11} x2={x2 - ux * 11} y2={y2 - uy * 11}
            color={bad ? tok('danger') : tok('brand')} width={1.6} />;
        })}
        {pts.map(([i, j]) => {
          const [x, y] = xy(i, j);
          return (
            <g key={`${i},${j}`}>
              <circle cx={x} cy={y} r={10} fill={tok('panel')} stroke={tok('ink', 0.5)} strokeWidth={1.4} />
              <T x={x} y={y} size={11} mono anchor="middle">{`${i}${j}`}</T>
            </g>
          );
        })}
        <T x={8} y={222} size={11} fill={tok('muted')}>each dot is labelled with its i and j</T>
      </Svg>
    </StepFrame>
  );
}
