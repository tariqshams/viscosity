// Chapter 120: Track A's two headline measurements, read from the
// committed results. No number is typed by hand.
//   Drip: src/data/bench/drip-bench-2026-10-31.json
//     (copy of companion/ts/results/drip-bench-2026-10-31.json)
//   Viscosity: src/data/bench/e2e-node-2026-10-31.json
//     (copy of engine/ts/packages/bench/results/e2e-node-2026-10-31.json)
import drip from '../../../data/bench/drip-bench-2026-10-31.json';
import e2e from '../../../data/bench/e2e-node-2026-10-31.json';

type Bar = { label: string; value: number; title: string };

const FIXED_TIME = 'zoo_batch'; // runs for a fixed 10 s, so it has no speed-up

const dripRows = (drip.rows as { program: string; tree: number; vm: number | null; speedup: number | null }[]);
const dripBars: Bar[] = dripRows
  .filter((r) => r.speedup !== null && r.program !== FIXED_TIME)
  .map((r) => ({ label: r.program, value: r.speedup as number, title: `${r.program}: tree-walker ${r.tree} ms, VM ${r.vm} ms` }))
  .sort((a, b) => b.value - a.value);
const dripFailed = dripRows.filter((r) => r.speedup === null).map((r) => r.program);

const e2eBars: Bar[] = (e2e.rows as { program: string; layouts: string; originalMs: number; viscosityMs: number; speedup: number }[])
  .map((r) => ({ label: r.program, value: r.speedup, title: `${r.program}: ${r.originalMs} ms → ${r.viscosityMs} ms (${r.layouts})` }))
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
        <svg viewBox={`0 0 ${W} ${H}`} className="viz" role="img" aria-label={`Drip VM over tree-walker: ${dripBars.map((b) => `${b.label} ${b.value}×`).join('; ')}. Viscosity over original: ${e2eBars.map((b) => `${b.label} ${b.value}×`).join('; ')}.`}>
          <Group bars={dripBars} y0={0} head="DRIP: BYTECODE VM vs TREE-WALKER" color="rgb(var(--accent))" />
          <Group bars={e2eBars} y0={y2} head="VISCOSITY: COMPILED vs ORIGINAL PROGRAM" color="rgb(var(--brand))" />
        </svg>
        <details className="mt-2 font-sans text-xs">
          <summary className="cursor-pointer text-muted">Where these numbers come from</summary>
          <p className="mt-2 text-muted">
            Drip: companion/ts/results/drip-bench-2026-10-31.json, Node {drip.env.node}, {drip.env.cpu}. {drip.env.note} Not shown: {FIXED_TIME} (runs for a fixed time) and {dripFailed.join(', ')} (the VM failed to compile it).
          </p>
          <p className="mt-2 text-muted">
            Viscosity: engine/ts/packages/bench/results/e2e-node-2026-10-31.json, Node {e2e.env.node}, V8 {e2e.env.v8}, {e2e.env.cpu}. {e2e.env.note}
          </p>
        </details>
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
