// Chapter 120: end-to-end speed-ups of whole programs compiled by Viscosity,
// read from the committed results (src/data/bench/e2e-node-2026-10-31.json,
// a copy of engine/ts/packages/bench/results/e2e-node-2026-10-31.json).
// No number is typed by hand.
import results from '../../../data/bench/e2e-node-2026-10-31.json';

type Row = { program: string; layouts: string; originalMs: number; viscosityMs: number; speedup: number };

export default function E2EBars({ caption }: { caption?: string }) {
  const rows = [...(results.rows as Row[])].sort((a, b) => b.speedup - a.speedup);
  const env = results.env;
  const W = 400;
  const labelW = 82;
  const barMax = W - labelW - 60;
  const rowH = 30;
  const max = Math.max(...rows.map((r) => r.speedup));
  const H = rows.length * rowH + 8;
  const x1 = labelW + barMax / max;
  return (
    <figure className="figure not-prose" data-bench="e2e">
      <div className="fig-card">
        <div className="mb-1 font-sans text-[0.95rem] font-semibold">Whole programs: original vs Viscosity</div>
        <div className="mb-2 font-sans text-xs text-muted">Speed-up of each program’s timed section (longer is better; the line marks 1×)</div>
        <svg viewBox={`0 0 ${W} ${H}`} className="viz" role="img" aria-label={`End-to-end speed-ups: ${rows.map((r) => `${r.program} ${r.speedup}×`).join('; ')}`}>
          {rows.map((r, i) => {
            const y = i * rowH + 4;
            const w = Math.max(3, (r.speedup / max) * barMax);
            return (
              <g key={r.program}>
                <title>{`${r.program}: ${r.originalMs} ms → ${r.viscosityMs} ms (${r.layouts})`}</title>
                <text x={labelW - 8} y={y + 12} textAnchor="end" fontSize={12} fill="rgb(var(--ink))">{r.program}</text>
                <rect x={labelW} y={y + 2} width={w} height={20} rx={4} fill="rgb(var(--brand))" opacity={r.speedup >= 2 ? 1 : 0.55} />
                <text x={labelW + w + 6} y={y + 12} fontSize={12} className="mono" fill="rgb(var(--ink))">{r.speedup}×</text>
              </g>
            );
          })}
          <line x1={x1} x2={x1} y1={0} y2={H - 4} stroke="rgb(var(--ink) / 0.5)" strokeDasharray="4 3" />
        </svg>
        <details className="mt-2 font-sans text-xs">
          <summary className="cursor-pointer text-muted">Table view</summary>
          <table className="mt-2 w-full text-left">
            <thead><tr><th className="py-1">program</th><th>layout</th><th className="text-right">original ms</th><th className="text-right">Viscosity ms</th><th className="text-right">speed-up</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.program}><td className="py-0.5">{r.program}</td><td className="font-mono">{r.layouts}</td><td className="text-right font-mono">{r.originalMs}</td><td className="text-right font-mono">{r.viscosityMs}</td><td className="text-right font-mono">{r.speedup}×</td></tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-muted">From engine/ts/packages/bench/results/e2e-node-2026-10-31.json: Node {env.node}, V8 {env.v8}, {env.cpu}. {env.note}</p>
        </details>
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
