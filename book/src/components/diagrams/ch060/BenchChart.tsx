// Chapter 60: how much faster the bytecode VM is than the tree-walker on
// each benchmark program. The numbers are read from the committed results
// file companion/ts/results/drip-bench-2026-10-31.json (also as .md next
// to it), produced by the companion's benchmark harness. One question:
// "how many times faster is the VM?" One series, every bar labelled, a
// line at 1x, and a table with the raw milliseconds.
import results from '../../../../companion/ts/results/drip-bench-2026-10-31.json';

type Row = { program: string; tree: number; vm: number | null; speedup: number | null; vmError?: string };

const FIXED_TIME = 'zoo_batch'; // runs for 10 s of clock time, then stops

export default function BenchChart() {
  const rows = results.rows as Row[];
  const timed = rows
    .filter((r) => r.speedup !== null && r.program !== FIXED_TIME)
    .sort((a, b) => (b.speedup ?? 0) - (a.speedup ?? 0));
  const others = rows.filter((r) => r.speedup === null || r.program === FIXED_TIME);
  const W = 400;
  const labelW = 112;
  const best = Math.max(...timed.map((r) => r.speedup as number));
  const max = Math.ceil(best);
  const barMax = W - labelW - 56;
  const x = (v: number) => labelW + (v / max) * barMax;
  const rowH = 26;
  const top = 6;
  const H = top + timed.length * rowH + 22 + others.length * 18 + 8;
  const env = results.env;
  return (
    <figure className="figure not-prose" data-bench="drip">
      <div className="fig-card">
        <div className="mb-1 font-sans text-[0.95rem] font-semibold">How many times faster is the bytecode VM?</div>
        <div className="mb-2 font-sans text-xs text-muted">Tree-walker time ÷ VM time, same machine (longer is a bigger win for the VM)</div>
        <svg viewBox={`0 0 ${W} ${H}`} className="viz" role="img" aria-label={`VM speed-up over the tree-walker. ${timed.map((r) => `${r.program}: ${r.speedup} times`).join('; ')}. string_equality: the VM failed. zoo_batch runs for a fixed time, so it has no speed-up.`}>
          {timed.map((r, i) => {
            const y = top + i * rowH;
            const v = r.speedup as number;
            return (
              <g key={r.program}>
                <title>{`${r.program}: tree-walker ${r.tree} ms, VM ${r.vm} ms, ${v}×`}</title>
                <rect x={0} y={y - 2} width={W} height={rowH} fill="transparent" />
                <text x={labelW - 8} y={y + 11} textAnchor="end" fontSize={12} className="mono" fill="rgb(var(--ink))">{r.program}</text>
                <rect x={labelW} y={y + 2} width={Math.max(3, x(v) - labelW)} height={18} rx={4} fill={v >= 1 ? 'rgb(var(--brand))' : 'rgb(var(--muted) / 0.55)'} />
                <text x={Math.max(x(v), x(1)) + 6} y={y + 11} fontSize={12} className="mono" fill="rgb(var(--ink))">{`${v}×`}</text>
              </g>
            );
          })}
          <line x1={x(1)} x2={x(1)} y1={0} y2={top + timed.length * rowH} stroke="rgb(var(--ink) / 0.6)" strokeDasharray="3 3" />
          <text x={x(1) + 4} y={top + timed.length * rowH + 10} fontSize={10} fill="rgb(var(--muted))">1× = same speed</text>
          {others.map((r, i) => (
            <text key={r.program} x={4} y={top + timed.length * rowH + 30 + i * 18} fontSize={11} fill="rgb(var(--muted))">
              <tspan className="mono" fill="rgb(var(--ink))">{r.program}</tspan>
              {r.program === FIXED_TIME ? ': runs for a fixed 10 s, so no speed-up' : ': no bar, the VM failed to compile it'}
            </text>
          ))}
        </svg>
        <details className="mt-2 font-sans text-xs">
          <summary className="cursor-pointer text-muted">Table view</summary>
          <table className="mt-2 w-full text-left">
            <thead><tr><th className="py-1">program</th><th className="text-right">tree-walker ms</th><th className="text-right">VM ms</th><th className="text-right">speed-up</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.program}>
                  <td className="py-0.5 font-mono">{r.program}</td>
                  <td className="text-right font-mono">{r.tree}</td>
                  <td className="text-right font-mono">{r.vm ?? '—'}</td>
                  <td className="text-right font-mono">{r.speedup === null ? 'VM error' : `${r.speedup}×`}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-muted">From companion/ts/results/drip-bench-2026-10-31 (.md and .json): Node {env.node}, V8 {env.v8}, {env.cpu}, {env.date.slice(0, 10)}. {env.note} Runs recorded per program: {env.runs}.</p>
        </details>
      </div>
      <figcaption>{`The VM wins on most programs, by up to ${best}×, but not on all of them.`}</figcaption>
    </figure>
  );
}
