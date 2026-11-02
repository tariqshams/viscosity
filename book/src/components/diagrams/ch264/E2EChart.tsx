// Speed-up of each end-to-end program on Node (V8) and Bun (JavaScriptCore),
// straight from the committed benchmark matrix
// (engine/ts/packages/bench/results/matrix-2026-10-31.json, section (a)).
// Bars start at 0, a dashed line marks 1× (no change), every bar is labelled,
// and a table view gives the exact best and median times.
import results from '../../../../../engine/ts/packages/bench/results/matrix-2026-10-31.json';

type Times = { best: number; median: number };
type Side = { originalMs: Times; viscosityMs: Times; speedupBest: number; speedupMedian: number };
type Row = { program: string; layouts: string; node: Side; bun: Side };

const NAME: Record<string, string> = { particles: 'particles', ledger: 'ledger', heat: 'heat', boids: 'boids', nbody: 'n-body' };

export default function E2EChart() {
  const rows = [...(results.e2e.rows as Row[])].sort((a, b) => b.node.speedupBest - a.node.speedupBest);
  const meta = results.meta;
  const W = 400;
  const labelW = 66;
  const right = 52;
  const max = 5;
  const sx = (v: number) => labelW + (v / max) * (W - labelW - right);
  const rowH = 46;
  const H = rows.length * rowH + 40;
  const bar = (v: number, y: number, color: string, label: string) => (
    <g>
      <rect x={labelW} y={y} width={Math.max(2, sx(v) - labelW)} height={15} rx={3} fill={color} />
      <text x={sx(v) + 5} y={y + 8} dominantBaseline="middle" fontSize={11} className="mono" fill="rgb(var(--ink))">{`${v}×`}<tspan fill="rgb(var(--muted))">{` ${label}`}</tspan></text>
    </g>
  );
  return (
    <div className="fig-card font-sans" data-e2e-chart>
      <div className="mb-1 text-[0.95rem] font-semibold">Whole programs: original vs Viscosity</div>
      <div className="mb-2 text-xs text-muted">Speed-up of each program’s timed section, best of 9 fresh processes (longer is faster); the dashed line marks 1×, no change</div>
      <svg viewBox={`0 0 ${W} ${H}`} className="viz" role="img" aria-label={rows.map((r) => `${NAME[r.program]}: Node ${r.node.speedupBest}×, Bun ${r.bun.speedupBest}×`).join('; ')}>
        {rows.map((r, i) => {
          const y = i * rowH + 4;
          return (
            <g key={r.program}>
              <title>{`${NAME[r.program]}: Node ${r.node.originalMs.best} → ${r.node.viscosityMs.best} ms, Bun ${r.bun.originalMs.best} → ${r.bun.viscosityMs.best} ms`}</title>
              <text x={labelW - 8} y={y + 18} textAnchor="end" dominantBaseline="middle" fontSize={12} fill="rgb(var(--ink))">{NAME[r.program]}</text>
              {bar(r.node.speedupBest, y + 2, 'rgb(var(--brand))', 'Node')}
              {bar(r.bun.speedupBest, y + 20, 'rgb(var(--accent) / 0.75)', 'Bun')}
            </g>
          );
        })}
        <line x1={sx(1)} x2={sx(1)} y1={0} y2={H - 30} stroke="rgb(var(--ink) / 0.6)" strokeDasharray="3 3" />
        <text x={sx(1)} y={H - 18} textAnchor="middle" fontSize={11} fill="rgb(var(--muted))">1×</text>
        <line x1={labelW} x2={labelW} y1={0} y2={H - 30} stroke="rgb(var(--line))" />
      </svg>
      <details className="mt-2 text-xs">
        <summary className="cursor-pointer text-muted">Table view</summary>
        <table className="mt-2 w-full text-left">
          <thead><tr><th className="py-1">program</th><th className="text-right">Node ms (best)</th><th className="text-right">Node</th><th className="text-right">Bun ms (best)</th><th className="text-right">Bun</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.program}>
                <td className="py-0.5">{NAME[r.program]}</td>
                <td className="text-right font-mono">{`${r.node.originalMs.best}→${r.node.viscosityMs.best}`}</td>
                <td className="text-right font-mono">{`${r.node.speedupBest}× (${r.node.speedupMedian}×)`}</td>
                <td className="text-right font-mono">{`${r.bun.originalMs.best}→${r.bun.viscosityMs.best}`}</td>
                <td className="text-right font-mono">{`${r.bun.speedupBest}× (${r.bun.speedupMedian}×)`}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-muted">From engine/ts/packages/bench/results/matrix-2026-10-31.json: Node {meta.versions.node} (V8 {meta.versions.v8}), Bun {meta.versions.bun}, {meta.machine.cpu}. Best of {meta.settings.e2eRuns} fresh-process runs per version, original and compiled interleaved; medians in brackets. {meta.noise}</p>
      </details>
    </div>
  );
}
