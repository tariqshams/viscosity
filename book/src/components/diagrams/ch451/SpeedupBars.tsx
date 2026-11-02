import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 450b: speed-up of 4 threads over 1 for 396 files, from
// engine/rust/results/parallel-build-2026-10-31.md (best of 11 runs on a
// shared 4-vCPU VM). The dashed line is the ideal, 4x.
const ROWS: { label: string; x: number; note: string }[] = [
  { label: 'build → tmpfs', x: 2.95, note: '40.0 → 13.5 ms' },
  { label: 'build → disk', x: 1.24, note: '105.3 → 85.1 ms' },
  { label: 'explain', x: 1.9, note: '34.6 → 18.1 ms' },
];
const PX = 60; // per 1x

export default function SpeedupBars() {
  const X = 110;
  return (
    <Svg w={400} h={176} title="Speed-up of four threads over one: 2.95 to tmpfs, 1.24 to disk, 1.9 for explain">
      {ROWS.map((r, k) => {
        const y = 14 + k * 44;
        return (
          <g key={r.label}>
            <T x={10} y={y + 12} size={12}>{r.label}</T>
            <Box x={X} y={y} w={r.x * PX} h={24} r={2} fill={tok('brand', 0.3)} stroke={tok('brand')} />
            <T x={X + r.x * PX + 6} y={y + 12} size={12} mono>{r.x}×</T>
            <T x={X} y={y + 34} size={11} mono fill={tok('muted')}>{r.note}</T>
          </g>
        );
      })}
      <line x1={X + 4 * PX} y1={8} x2={X + 4 * PX} y2={142} stroke={tok('ink', 0.5)} strokeDasharray="4 3" />
      <T x={X + 4 * PX} y={160} size={12} anchor="middle" fill={tok('muted')}>4× ideal</T>
      <line x1={X + PX} y1={8} x2={X + PX} y2={142} stroke={tok('ink', 0.25)} />
      <T x={X + PX} y={160} size={12} anchor="middle" fill={tok('muted')}>1×</T>
    </Svg>
  );
}
