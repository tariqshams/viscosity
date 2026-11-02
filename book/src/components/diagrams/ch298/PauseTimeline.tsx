// Chapter 298: the same marking work done three ways, after the
// definitions in V8's "Trash talk" post: stop-the-world, incremental
// (slices on the program's thread) and concurrent (helper threads, with
// short pauses at the start and end). Lengths are a picture, not a
// measurement.
import { Box, Svg, T, tok } from '../../viz/svg';

type Seg = { x: number; w: number; kind: 'run' | 'gc' };

const ROWS: { label: string; main: Seg[]; helper?: Seg[] }[] = [
  { label: 'stop-the-world', main: [{ x: 0, w: 90, kind: 'run' }, { x: 90, w: 120, kind: 'gc' }, { x: 210, w: 90, kind: 'run' }] },
  { label: 'incremental', main: [
    { x: 0, w: 60, kind: 'run' }, { x: 60, w: 24, kind: 'gc' }, { x: 84, w: 36, kind: 'run' }, { x: 120, w: 24, kind: 'gc' },
    { x: 144, w: 36, kind: 'run' }, { x: 180, w: 24, kind: 'gc' }, { x: 204, w: 36, kind: 'run' }, { x: 240, w: 24, kind: 'gc' }, { x: 264, w: 36, kind: 'run' },
  ] },
  { label: 'concurrent', main: [{ x: 0, w: 60, kind: 'run' }, { x: 60, w: 6, kind: 'gc' }, { x: 66, w: 144, kind: 'run' }, { x: 210, w: 6, kind: 'gc' }, { x: 216, w: 84, kind: 'run' }],
    helper: [{ x: 66, w: 144, kind: 'gc' }] },
];

export default function PauseTimeline() {
  const bar = (y: number, s: Seg, k: number) => (
    <Box key={k} x={90 + s.x} y={y} w={s.w} h={18} r={2}
      fill={s.kind === 'gc' ? tok('warn', 0.45) : tok('safe', 0.3)} stroke={s.kind === 'gc' ? tok('warn') : tok('safe')} />
  );
  return (
    <Svg w={400} h={232} title="Three timelines. Stop-the-world: one long collection pause. Incremental: four short slices between the program's work. Concurrent: the program runs almost all the time, with a helper thread marking beside it and two very short pauses.">
      {ROWS.map((r, i) => {
        const y = 24 + i * 62;
        return (
          <g key={r.label}>
            <T x={8} y={y + 9} size={12} weight={700}>{r.label}</T>
            <T x={8} y={y + 25} size={11} fill={tok('muted')}>program thread</T>
            {r.main.map((s, k) => bar(y, s, k))}
            {r.helper && <T x={8} y={y + 40} size={11} fill={tok('muted')}>helper thread</T>}
            {r.helper && r.helper.map((s, k) => bar(y + 28, s, k))}
          </g>
        );
      })}
      <Box x={90} y={208} w={16} h={12} r={2} fill={tok('safe', 0.3)} stroke={tok('safe')} />
      <T x={112} y={214} size={11}>program runs</T>
      <Box x={210} y={208} w={16} h={12} r={2} fill={tok('warn', 0.45)} stroke={tok('warn')} />
      <T x={232} y={214} size={11}>collector works</T>
    </Svg>
  );
}
