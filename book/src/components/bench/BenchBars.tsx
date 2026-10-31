// Horizontal bars: nanoseconds per element for each layout, from a committed
// benchmark results file. One question per chart; colour only highlights the
// layout under discussion; every bar is directly labelled; a table view
// follows for screen readers and exact values.
import results from '../../data/bench/baseline-node-2026-10-31.json';

type Row = { suite: string; layout: string; n: number; medianNsPerElement: number; p95NsPerElement: number };

const LABEL: Record<string, string> = {
  aos: 'array of objects',
  'aos-class': 'class, TS fields',
  'aos-ctor': 'class, ctor fields',
  'aos-packed': 'packed Float64Array',
  soa: 'struct of arrays',
  aosoa8: 'AoSoA, blocks of 8',
};

export default function BenchBars({ suite, n, highlight = ['soa'], layouts, title, caption }: {
  suite: string; n: number; highlight?: string[]; layouts?: string[]; title: string; caption?: string;
}) {
  const rows = (results.rows as Row[]).filter((r) => r.suite === suite && r.n === n && (!layouts || layouts.includes(r.layout)));
  if (rows.length === 0) throw new Error(`BenchBars: no rows for ${suite} n=${n}`);
  const base = rows.find((r) => r.layout === 'aos')?.medianNsPerElement;
  const max = Math.max(...rows.map((r) => r.medianNsPerElement));
  const W = 400;
  const labelW = 132;
  const barMax = W - labelW - 92;
  const rowH = 30;
  const H = rows.length * rowH + 30;
  const env = results.env;
  return (
    <figure className="figure not-prose" data-bench={suite}>
      <div className="fig-card">
        <div className="mb-1 font-sans text-[0.95rem] font-semibold">{title}</div>
        <div className="mb-2 font-sans text-xs text-muted">
          Median ns per element, n = {n.toLocaleString('en-US')} (shorter is faster)
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} className="viz" role="img" aria-label={`${title}. ${rows.map((r) => `${LABEL[r.layout]}: ${r.medianNsPerElement.toFixed(2)} ns`).join('; ')}`}>
          {rows.map((r, i) => {
            const y = i * rowH + 4;
            const w = Math.max(3, (r.medianNsPerElement / max) * barMax);
            const hot = highlight.includes(r.layout);
            const x = base ? base / r.medianNsPerElement : 1;
            return (
              <g key={r.layout} className="group">
                <title>{`${LABEL[r.layout]}: median ${r.medianNsPerElement.toFixed(2)} ns, p95 ${r.p95NsPerElement.toFixed(2)} ns per element`}</title>
                <rect x={0} y={y - 2} width={W} height={rowH} fill="transparent" />
                <text x={labelW - 8} y={y + 12} textAnchor="end" fontSize={12} fill="rgb(var(--ink))" fontWeight={hot ? 700 : 400}>{LABEL[r.layout]}</text>
                <rect x={labelW} y={y + 2} width={w} height={20} rx={4} fill={hot ? 'rgb(var(--brand))' : 'rgb(var(--muted) / 0.45)'} />
                <text x={labelW + w + 6} y={y + 12} fontSize={12} className="mono" fill="rgb(var(--ink))">
                  {r.medianNsPerElement.toFixed(1)}
                  {base && r.layout !== 'aos' ? <tspan fill="rgb(var(--muted))">{`  ${x >= 1 ? x.toFixed(1) + '× faster' : (1 / x).toFixed(1) + '× slower'}`}</tspan> : null}
                </text>
              </g>
            );
          })}
          <line x1={labelW} x2={labelW} y1={0} y2={H - 26} stroke="rgb(var(--line))" />
        </svg>
        <details className="mt-2 font-sans text-xs">
          <summary className="cursor-pointer text-muted">Table view</summary>
          <table className="mt-2 w-full text-left">
            <thead><tr><th className="py-1">layout</th><th className="text-right">median ns</th><th className="text-right">p95 ns</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.layout}><td className="py-0.5">{LABEL[r.layout]}</td><td className="text-right font-mono">{r.medianNsPerElement.toFixed(2)}</td><td className="text-right font-mono">{r.p95NsPerElement.toFixed(2)}</td></tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-muted">Measured with the repo’s harness (engine/ts/packages/bench) on Node {env.nodeVersion}, V8 {env.v8Version}, {env.cpu}. One fresh process per case. {env.note}</p>
        </details>
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
