// Chapter 74: tree-walker time next to VM time for each benchmark program,
// read from the committed results file
// companion/ts/results/drip-bench-2026-10-31.json (also .md beside it).
// Chapter 62 showed the ratio; this shows the seconds, so the reader sees
// where time was actually saved, and where it wasn't. Two series, one
// axis, a legend plus direct labels, and a table view.
import results from '../../../../companion/ts/results/drip-bench-2026-10-31.json';

type Row = { program: string; tree: number; vm: number | null; speedup: number | null; vmError?: string };

const FIXED_TIME = 'zoo_batch';
const sec = (ms: number) => `${(ms / 1000).toFixed(1)} s`;

export default function BenchPairs() {
  const rows = results.rows as Row[];
  const timed = rows.filter((r) => r.vm !== null && r.program !== FIXED_TIME).sort((a, b) => b.tree - a.tree);
  const others = rows.filter((r) => r.vm === null || r.program === FIXED_TIME);
  const W = 400;
  const labelW = 104;
  const max = Math.max(...timed.map((r) => Math.max(r.tree, r.vm as number)));
  const barMax = W - labelW - 50;
  const len = (ms: number) => Math.max(2, (ms / max) * barMax);
  const rowH = 34;
  const top = 26;
  const H = top + timed.length * rowH + 8 + others.length * 18 + 6;
  const env = results.env;
  const slower = timed.filter((r) => (r.vm as number) > r.tree).map((r) => r.program);
  return (
    <figure className="figure not-prose" data-bench="drip-seconds">
      <div className="fig-card">
        <div className="mb-1 font-sans text-[0.95rem] font-semibold">Where did the time go?</div>
        <div className="mb-2 font-sans text-xs text-muted">Seconds per benchmark program, including compiling (shorter is faster)</div>
        <svg viewBox={`0 0 ${W} ${H}`} className="viz" role="img" aria-label={`Seconds per program. ${timed.map((r) => `${r.program}: tree-walker ${sec(r.tree)}, VM ${sec(r.vm as number)}`).join('; ')}. zoo_batch runs for a fixed time; string_equality did not compile on the VM.`}>
          <rect x={labelW} y={4} width={10} height={10} rx={2} fill="rgb(var(--muted) / 0.55)" />
          <text x={labelW + 14} y={13} fontSize={11} fill="rgb(var(--ink))">tree-walker</text>
          <rect x={labelW + 92} y={4} width={10} height={10} rx={2} fill="rgb(var(--brand))" />
          <text x={labelW + 106} y={13} fontSize={11} fill="rgb(var(--ink))">bytecode VM</text>
          {timed.map((r, i) => {
            const y = top + i * rowH;
            const vm = r.vm as number;
            return (
              <g key={r.program}>
                <title>{`${r.program}: tree-walker ${r.tree} ms, VM ${vm} ms`}</title>
                <rect x={0} y={y - 2} width={W} height={rowH} fill="transparent" />
                <text x={labelW - 8} y={y + 14} textAnchor="end" fontSize={12} className="mono" fill="rgb(var(--ink))">{r.program}</text>
                <rect x={labelW} y={y} width={len(r.tree)} height={12} rx={3} fill="rgb(var(--muted) / 0.55)" />
                <text x={labelW + len(r.tree) + 4} y={y + 10} fontSize={10} className="mono" fill="rgb(var(--muted))">{sec(r.tree)}</text>
                <rect x={labelW} y={y + 14} width={len(vm)} height={12} rx={3} fill="rgb(var(--brand))" />
                <text x={labelW + len(vm) + 4} y={y + 24} fontSize={10} className="mono" fill="rgb(var(--ink))">{sec(vm)}</text>
              </g>
            );
          })}
          {others.map((r, i) => (
            <text key={r.program} x={4} y={top + timed.length * rowH + 14 + i * 18} fontSize={11} fill="rgb(var(--muted))">
              <tspan className="mono" fill="rgb(var(--ink))">{r.program}</tspan>
              {r.program === FIXED_TIME ? ': stops after 10 s of clock time, so no comparison' : ': VM refused to compile it (too many constants)'}
            </text>
          ))}
        </svg>
        <details className="mt-2 font-sans text-xs">
          <summary className="cursor-pointer text-muted">Table view</summary>
          <table className="mt-2 w-full text-left">
            <thead><tr><th className="py-1">program</th><th className="text-right">tree-walker ms</th><th className="text-right">VM ms</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.program}>
                  <td className="py-0.5 font-mono">{r.program}</td>
                  <td className="text-right font-mono">{r.tree}</td>
                  <td className="text-right font-mono">{r.vm ?? r.vmError ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-muted">From companion/ts/results/drip-bench-2026-10-31 (.md and .json): Node {env.node}, V8 {env.v8}, {env.cpu}, {env.date.slice(0, 10)}. {env.note} Runs recorded per program: {env.runs}.</p>
        </details>
      </div>
      <figcaption>{`Big savings on the slow, call-heavy programs; ${slower.join(' and ')} got slower.`}</figcaption>
    </figure>
  );
}
