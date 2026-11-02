// Chapter 197: the TypeScript VM (Part IV) next to drip-rs, the Rust port
// built in Part XII, on the corpus benchmark programs. Every number is read
// from the committed results file
// companion/rust/results/drip-rs-bench-2026-10-31.json (and .md beside it);
// nothing is typed in by hand. Two series on one axis, direct labels, and
// a table view.
import results from '../../../../companion/rust/results/drip-rs-bench-2026-10-31.json';

type Row = { program: string; rust: number | null; tsVm: number | null; speedupVsTsVm: number | null };

const FIXED_TIME = 'zoo_batch';
const sec = (ms: number) => `${(ms / 1000).toFixed(1)} s`;

export default function DripRsBench() {
  const rows = results.rows as Row[];
  const timed = rows
    .filter((r) => r.rust !== null && r.tsVm !== null && r.program !== FIXED_TIME)
    .sort((a, b) => (b.tsVm as number) - (a.tsVm as number));
  const others = rows.filter((r) => !timed.includes(r));
  const W = 400;
  const labelW = 104;
  const max = Math.max(...timed.map((r) => r.tsVm as number));
  const barMax = W - labelW - 70;
  const len = (ms: number) => Math.max(2, (ms / max) * barMax);
  const rowH = 34;
  const top = 26;
  const H = top + timed.length * rowH + 8 + others.length * 18 + 6;
  const env = results.env;
  const ratios = timed.map((r) => r.speedupVsTsVm as number);
  const lo = Math.min(...ratios);
  const hi = Math.max(...ratios);
  return (
    <figure className="figure not-prose" data-bench="drip-rs-vs-ts-vm">
      <div className="fig-card">
        <div className="mb-1 font-sans text-[0.95rem] font-semibold">The same VM, two languages</div>
        <div className="mb-2 font-sans text-xs text-muted">Seconds per benchmark program, compile time included (shorter is faster)</div>
        <svg viewBox={`0 0 ${W} ${H}`} className="viz" role="img" aria-label={`Seconds per program. ${timed.map((r) => `${r.program}: TypeScript VM ${sec(r.tsVm as number)}, drip-rs ${sec(r.rust as number)}`).join('; ')}. zoo_batch runs for a fixed time; string_equality failed to compile on both VMs.`}>
          <rect x={labelW} y={4} width={10} height={10} rx={2} fill="rgb(var(--accent))" />
          <text x={labelW + 14} y={13} fontSize={11} fill="rgb(var(--ink))">TypeScript VM</text>
          <rect x={labelW + 110} y={4} width={10} height={10} rx={2} fill="rgb(var(--brand))" />
          <text x={labelW + 124} y={13} fontSize={11} fill="rgb(var(--ink))">drip-rs (Rust)</text>
          {timed.map((r, i) => {
            const y = top + i * rowH;
            const ts = r.tsVm as number;
            const rs = r.rust as number;
            return (
              <g key={r.program}>
                <title>{`${r.program}: TypeScript VM ${ts} ms, drip-rs ${rs} ms (${r.speedupVsTsVm}×)`}</title>
                <rect x={0} y={y - 2} width={W} height={rowH} fill="transparent" />
                <text x={labelW - 8} y={y + 14} textAnchor="end" fontSize={12} className="mono" fill="rgb(var(--ink))">{r.program}</text>
                <rect x={labelW} y={y} width={len(ts)} height={12} rx={3} fill="rgb(var(--accent))" />
                <text x={labelW + len(ts) + 4} y={y + 10} fontSize={10} className="mono" fill="rgb(var(--muted))">{sec(ts)}</text>
                <rect x={labelW} y={y + 14} width={len(rs)} height={12} rx={3} fill="rgb(var(--brand))" />
                <text x={labelW + len(rs) + 4} y={y + 24} fontSize={10} className="mono" fill="rgb(var(--ink))">{`${sec(rs)} · ${r.speedupVsTsVm}×`}</text>
              </g>
            );
          })}
          {others.map((r, i) => (
            <text key={r.program} x={4} y={top + timed.length * rowH + 14 + i * 18} fontSize={11} fill="rgb(var(--muted))">
              <tspan className="mono" fill="rgb(var(--ink))">{r.program}</tspan>
              {r.program === FIXED_TIME ? ': stops after 10 s of clock time, so no time to compare' : ': both VMs refuse it (too many constants)'}
            </text>
          ))}
        </svg>
        <details className="mt-2 font-sans text-xs">
          <summary className="cursor-pointer text-muted">Table view</summary>
          <table className="mt-2 w-full text-left">
            <thead><tr><th className="py-1">program</th><th className="text-right">TS VM ms</th><th className="text-right">drip-rs ms</th><th className="text-right">ratio</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.program}>
                  <td className="py-0.5 font-mono">{r.program}</td>
                  <td className="text-right font-mono">{r.tsVm ?? 'error'}</td>
                  <td className="text-right font-mono">{r.rust ?? 'error'}</td>
                  <td className="text-right font-mono">{r.speedupVsTsVm ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-muted">From companion/rust/results/drip-rs-bench-2026-10-31 (.md and .json): {env.rustc}; TypeScript on Node {env.tsEnv.node}; {env.cpu}; {env.date.slice(0, 10)}. drip-rs: best of {env.runs} runs, each a fresh process, release build. TypeScript VM: {env.tsEnv.runs} run per program, from chapter 60’s results file. Same shared cloud VM, so expect noise.</p>
        </details>
      </div>
      <figcaption>{`On every program that could be timed, the Rust port ran between ${lo}× and ${hi}× as fast as the TypeScript VM, in this one run.`}</figcaption>
    </figure>
  );
}
