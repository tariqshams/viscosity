// Chapter 154-b: how much faster the VM ran each benchmark program than the
// tree-walker, read from the committed results file
// companion/ts/results/drip-bench-2026-11-02.json (and .md beside it).
// A bar right of the 1× line means the VM was faster; left means slower.
import results from '../../../../companion/ts/results/drip-bench-2026-11-02.json';
import { Svg, T, tok } from '../../viz/svg';

type Row = { program: string; tree: number; vm: number | null; speedup: number | null };

export default function CallBench() {
  const rows = (results.rows as Row[]).filter((r) => r.speedup !== null).sort((a, b) => (b.speedup as number) - (a.speedup as number));
  const W = 400;
  const labelW = 104;
  const top = 30;
  const rowH = 20;
  const H = top + rows.length * rowH + 30;
  const lo = 0.5;
  const hi = 1.5;
  const x = (v: number) => labelW + ((v - lo) / (hi - lo)) * (W - labelW - 44);
  return (
    <Svg w={W} h={H} title={`VM speed relative to the tree-walker, per program: ${rows.map((r) => `${r.program} ${r.speedup}×`).join(', ')}.`}>
      <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>VM SPEED-UP OVER THE TREE-WALKER</T>
      <line x1={x(1)} x2={x(1)} y1={top - 8} y2={top + rows.length * rowH} stroke={tok('ink', 0.5)} strokeDasharray="4 3" />
      <T x={x(1)} y={top + rows.length * rowH + 12} size={11} mono anchor="middle" fill={tok('muted')}>1× (same)</T>
      {rows.map((r, i) => {
        const y = top + i * rowH;
        const s = r.speedup as number;
        const faster = s >= 1;
        const x0 = Math.min(x(1), x(s));
        const w = Math.max(2, Math.abs(x(s) - x(1)));
        return (
          <g key={r.program}>
            <T x={labelW - 8} y={y + 7} size={11} mono anchor="end">{r.program}</T>
            <rect x={x0} y={y} width={w} height={14} rx={3} fill={faster ? tok('brand') : tok('accent')} />
            <T x={faster ? x(s) + 4 : x(s) - 4} y={y + 7} size={11} mono anchor={faster ? 'start' : 'end'} fill={tok('muted')}>{`${s}×`}</T>
          </g>
        );
      })}
      <T x={8} y={H - 6} size={11} fill={tok('muted')}>{`Best of ${results.env.runs}, compile time included. ${results.env.date.slice(0, 10)}.`}</T>
    </Svg>
  );
}
