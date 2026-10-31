// Speed-up of each end-to-end program, straight from the committed results
// file (engine/ts/packages/bench/results). Bars start at 0, a dashed line
// marks 1× (no change), every bar is labelled, and a table view gives exact values.
import results from '../../../../../engine/ts/packages/bench/results/e2e-node-2026-10-31.json';

type Row = { program: string; layouts: string; originalMs: number; viscosityMs: number; speedup: number };

const NAME: Record<string, string> = {
  particles: 'particles',
  ledger: 'ledger',
  heat: 'heat',
  boids: 'boids',
  nbody: 'n-body',
};

export default function E2EChart() {
  const rows = [...(results.rows as Row[])].sort((a, b) => b.speedup - a.speedup);
  const env = results.env;
  const W = 400;
  const labelW = 70;
  const right = 120;
  const max = Math.ceil(Math.max(...rows.map((r) => r.speedup)));
  const sx = (v: number) => labelW + (v / max) * (W - labelW - right);
  const rowH = 30;
  const H = rows.length * rowH + 28;
  return (
    <div className="fig-card font-sans" data-e2e-chart>
      <div className="mb-1 text-[0.95rem] font-semibold">Whole programs: original vs Viscosity</div>
      <div className="mb-2 text-xs text-muted">Speed-up of the timed section (longer is faster); the line marks 1×, no change</div>
      <svg viewBox={`0 0 ${W} ${H}`} className="viz" role="img" aria-label={rows.map((r) => `${NAME[r.program]}: ${r.speedup}× (${r.originalMs} ms to ${r.viscosityMs} ms)`).join('; ')}>
        {rows.map((r, i) => {
          const y = i * rowH + 4;
          const big = r.speedup >= 2;
          return (
            <g key={r.program}>
              <title>{`${NAME[r.program]}: ${r.originalMs} ms → ${r.viscosityMs} ms, ${r.speedup}×`}</title>
              <text x={labelW - 8} y={y + 12} textAnchor="end" dominantBaseline="middle" fontSize={12} fill="rgb(var(--ink))">{NAME[r.program]}</text>
              <rect x={labelW} y={y + 2} width={Math.max(2, sx(r.speedup) - labelW)} height={20} rx={4} fill={big ? 'rgb(var(--brand))' : 'rgb(var(--muted) / 0.45)'} />
              <text x={sx(r.speedup) + 6} y={y + 12} dominantBaseline="middle" fontSize={12} className="mono" fill="rgb(var(--ink))">
                {`${r.speedup}×`}
                <tspan fill="rgb(var(--muted))">{`  ${r.originalMs}→${r.viscosityMs} ms`}</tspan>
              </text>
            </g>
          );
        })}
        <line x1={sx(1)} x2={sx(1)} y1={0} y2={H - 22} stroke="rgb(var(--ink) / 0.6)" strokeDasharray="3 3" />
        <text x={sx(1)} y={H - 10} textAnchor="middle" fontSize={10} fill="rgb(var(--muted))">1×</text>
        <line x1={labelW} x2={labelW} y1={0} y2={H - 22} stroke="rgb(var(--line))" />
      </svg>
      <details className="mt-2 text-xs">
        <summary className="cursor-pointer text-muted">Table view</summary>
        <table className="mt-2 w-full text-left">
          <thead><tr><th className="py-1">program</th><th>layout</th><th className="text-right">original ms</th><th className="text-right">Viscosity ms</th><th className="text-right">speed-up</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.program}><td className="py-0.5">{NAME[r.program]}</td><td className="font-mono">{r.layouts}</td><td className="text-right font-mono">{r.originalMs}</td><td className="text-right font-mono">{r.viscosityMs}</td><td className="text-right font-mono">{r.speedup}×</td></tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-muted">From engine/ts/packages/bench/results/e2e-node-2026-10-31.json: Node {env.node}, V8 {env.v8}, {env.cpu}. Median of {env.runs} fresh-process runs per version. {env.note}</p>
      </details>
    </div>
  );
}
