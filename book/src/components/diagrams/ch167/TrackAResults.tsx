// Chapter 167: Track A's two headline measurements, read from the
// committed results. No number is typed by hand.
//   Drip (the redesigned language): book/companion/ts/results/drip-bench-2026-11-02.json
//   Viscosity: engine/ts/packages/bench/results/matrix-2026-10-31.json,
//     section (a), Node, best of 9 fresh processes (measured after the
//     check-mode fix; the older e2e-node file predates it).
import drip from '../../../../companion/ts/results/drip-bench-2026-11-02.json';
import matrix from '../../../../../engine/ts/packages/bench/results/matrix-2026-10-31.json';

type Bar = { label: string; value: number; title: string };

const dripRows = drip.rows as { program: string; tree: number; vm: number | null; speedup: number | null }[];
const dripBars: Bar[] = dripRows
  .filter((r) => r.speedup !== null)
  .map((r) => ({ label: r.program, value: r.speedup as number, title: `${r.program}: tree-walker ${r.tree} ms, VM ${r.vm} ms` }))
  .sort((a, b) => b.value - a.value);

type E2ERow = { program: string; layouts: string; node: { originalMs: { best: number }; viscosityMs: { best: number }; speedupBest: number } };
const e2eBars: Bar[] = (matrix.e2e.rows as unknown as E2ERow[])
  .map((r) => ({ label: r.program, value: r.node.speedupBest, title: `${r.program}: ${r.node.originalMs.best} ms → ${r.node.viscosityMs.best} ms on Node (${r.layouts})` }))
  .sort((a, b) => b.value - a.value);

const W = 400;
const LABEL = 104;
const ROW = 22;
const max = Math.max(...dripBars.map((b) => b.value), ...e2eBars.map((b) => b.value));
const scale = (W - LABEL - 52) / max;

function Group({ bars, y0, head, color }: { bars: Bar[]; y0: number; head: string; color: string }) {
  const one = LABEL + scale;
  return (
    <g>
      <text x={4} y={y0 + 10} fontSize={11} fontWeight={700} fill="rgb(var(--muted))">{head}</text>
      {bars.map((b, i) => {
        const y = y0 + 20 + i * ROW;
        const w = Math.max(3, b.value * scale);
        return (
          <g key={b.label}>
            <title>{b.title}</title>
            <text x={LABEL - 6} y={y + 11} fontSize={11} textAnchor="end" fill="rgb(var(--ink))">{b.label}</text>
            <rect x={LABEL} y={y + 2} width={w} height={16} rx={3} fill={color} opacity={b.value >= 1 ? 1 : 0.5} />
            <text x={LABEL + w + 5} y={y + 11} fontSize={11} className="mono" fill="rgb(var(--ink))">{b.value}×</text>
          </g>
        );
      })}
      <line x1={one} x2={one} y1={y0 + 18} y2={y0 + 20 + bars.length * ROW} stroke="rgb(var(--ink) / 0.5)" strokeDasharray="4 3" />
    </g>
  );
}

export default function TrackAResults({ caption }: { caption?: string }) {
  const y2 = 20 + dripBars.length * ROW + 18;
  const H = y2 + 20 + e2eBars.length * ROW + 6;
  return (
    <figure className="figure not-prose" data-bench="track-a">
      <div className="fig-card">
        <div className="mb-1 font-sans text-[0.95rem] font-semibold">Track A, measured</div>
        <div className="mb-2 font-sans text-xs text-muted">Speed-ups, longer is better; the dashed lines mark 1× (no change)</div>
        <svg viewBox={`0 0 ${W} ${H}`} className="viz" role="img" aria-label={`Drip VM over tree-walker: ${dripBars.map((b) => `${b.label} ${b.value}×`).join('; ')}. Viscosity over original, on Node: ${e2eBars.map((b) => `${b.label} ${b.value}×`).join('; ')}.`}>
          <Group bars={dripBars} y0={0} head="DRIP: BYTECODE VM vs TREE-WALKER" color="rgb(var(--accent))" />
          <Group bars={e2eBars} y0={y2} head="VISCOSITY: COMPILED vs ORIGINAL (NODE)" color="rgb(var(--brand))" />
        </svg>
        <details className="mt-2 font-sans text-xs">
          <summary className="cursor-pointer text-muted">Where these numbers come from</summary>
          <p className="mt-2 text-muted">
            Drip: book/companion/ts/results/drip-bench-2026-11-02.json, Node {drip.env.node}, {drip.env.cpu}. {drip.env.note}
          </p>
          <p className="mt-2 text-muted">
            Viscosity: engine/ts/packages/bench/results/matrix-2026-10-31.json, section (a), Node {matrix.meta.versions.node}, best of {matrix.meta.settings.e2eRuns} fresh processes each. {matrix.meta.noise}
          </p>
        </details>
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
