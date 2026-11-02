import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 450: fixed shares against one shared counter, for six files
// with made-up compile times 4, 4, 1, 1, 1, 1 (the chapter's runnable
// example uses the same proportions, 40 and 10 ms, and measured about
// 80 ms against 40 ms). Three threads. Fixed shares give thread 1 both
// slow files; with a counter, an idle thread takes the next file.
type Run = [number, number, number, string]; // thread, start, end, label
const FIXED: Run[] = [
  [0, 0, 4, 'a'], [0, 4, 8, 'b'],
  [1, 0, 1, 'c'], [1, 1, 2, 'd'],
  [2, 0, 1, 'e'], [2, 1, 2, 'f'],
];
const SHARED: Run[] = [
  [0, 0, 4, 'a'],
  [1, 0, 4, 'b'],
  [2, 0, 1, 'c'], [2, 1, 2, 'd'], [2, 2, 3, 'e'], [2, 3, 4, 'f'],
];
const U = 36;
const X0 = 40;

function Lanes({ y, runs, title, end }: { y: number; runs: Run[]; title: string; end: number }) {
  return (
    <g>
      <T x={10} y={y} size={12} weight={700} fill={tok('muted')}>{title}</T>
      {[0, 1, 2].map((th) => (
        <T key={th} x={10} y={y + 24 + th * 26} size={12} mono>{`T${th + 1}`}</T>
      ))}
      {runs.map(([th, a, b, l]) => (
        <Box key={l} x={X0 + a * U} y={y + 13 + th * 26} w={(b - a) * U - 2} h={22} r={3}
          fill={b - a > 1 ? tok('warn', 0.2) : tok('safe', 0.15)} stroke={b - a > 1 ? tok('warn') : tok('safe')}>
          <T x={X0 + a * U + 6} y={y + 24 + th * 26} size={12} mono>{l}</T>
        </Box>
      ))}
      <line x1={X0 + end * U} y1={y + 10} x2={X0 + end * U} y2={y + 92} stroke={tok('danger')} strokeDasharray="3 3" />
      <T x={X0 + end * U + 6} y={y + 90} size={12} fill={tok('danger')}>done at {end}</T>
    </g>
  );
}

export default function SharesFigure() {
  return (
    <Svg w={400} h={236} title="Six files on three threads: fixed shares finish at time 8, a shared counter at time 4">
      <Lanes y={14} runs={FIXED} title="fixed shares: two files each" end={8} />
      <Lanes y={128} runs={SHARED} title="one shared counter" end={4} />
    </Svg>
  );
}
