// Chapter 60: what turning GC poisoning into a debug-only safety net did to
// the `instantiation` benchmark. The "after" VM time and the tree-walker
// time are read from the committed results file
// companion/ts/results/drip-bench-2026-10-31.json. The "before" time is not
// in any results file: it is recorded in the message of commit bd4b1ba
// ("drip: SoA hash table, debug-only GC poisoning, benchmark results"),
// which says instantiation went from 19.4 s to 3.6 s. It is shown as that
// rounded figure and labelled with its source.
import results from '../../../../companion/ts/results/drip-bench-2026-10-31.json';

type Row = { program: string; tree: number; vm: number | null };

const BEFORE_MS = 19400; // commit bd4b1ba message: "19.4 s"

export default function PoisonChart() {
  const row = (results.rows as Row[]).find((r) => r.program === 'instantiation')!;
  const bars = [
    { label: 'VM, poisoning always on', ms: BEFORE_MS, src: 'commit bd4b1ba', tone: 'rgb(var(--muted) / 0.55)' },
    { label: 'VM, poisoning debug-only', ms: row.vm as number, src: 'results file', tone: 'rgb(var(--brand))' },
    { label: 'tree-walker, for scale', ms: row.tree, src: 'results file', tone: 'rgb(var(--ink) / 0.35)' },
  ];
  const W = 400;
  const labelW = 150;
  const max = BEFORE_MS;
  const barMax = W - labelW - 64;
  const x = (v: number) => (v / max) * barMax;
  const rowH = 34;
  const H = bars.length * rowH + 8;
  const env = results.env;
  const s = (ms: number) => `${(ms / 1000).toFixed(1)} s`;
  return (
    <figure className="figure not-prose" data-bench="drip-poison">
      <div className="fig-card">
        <div className="mb-1 font-sans text-[0.95rem] font-semibold">The instantiation benchmark, before and after</div>
        <div className="mb-2 font-sans text-xs text-muted">Whole-run time in seconds (shorter is faster)</div>
        <svg viewBox={`0 0 ${W} ${H}`} className="viz" role="img" aria-label={bars.map((b) => `${b.label}: ${s(b.ms)} (${b.src})`).join('; ')}>
          {bars.map((b, i) => {
            const y = 4 + i * rowH;
            return (
              <g key={b.label}>
                <title>{`${b.label}: ${b.ms} ms, from the ${b.src}`}</title>
                <text x={labelW - 8} y={y + 10} textAnchor="end" fontSize={11.5} fill="rgb(var(--ink))">{b.label}</text>
                <text x={labelW - 8} y={y + 24} textAnchor="end" fontSize={9.5} fill="rgb(var(--muted))">{b.src}</text>
                <rect x={labelW} y={y + 4} width={Math.max(3, x(b.ms))} height={20} rx={4} fill={b.tone} />
                <text x={labelW + x(b.ms) + 6} y={y + 15} fontSize={12} className="mono" fill="rgb(var(--ink))" dominantBaseline="middle">{s(b.ms)}</text>
              </g>
            );
          })}
        </svg>
        <details className="mt-2 font-sans text-xs">
          <summary className="cursor-pointer text-muted">Where these numbers come from</summary>
          <p className="mt-2 text-muted">
            “Poisoning always on”: the message of commit bd4b1ba in this book’s repository, which records the instantiation benchmark going
            from 19.4 s to 3.6 s once poisoning became debug-only. The other two bars: companion/ts/results/drip-bench-2026-10-31 (.md and
            .json), {row.vm} ms for the VM and {row.tree} ms for the tree-walker; Node {env.node}, V8 {env.v8}, {env.cpu},
            {' '}{env.date.slice(0, 10)}. {env.note} Runs recorded per program: {env.runs}.
          </p>
        </details>
      </div>
      <figcaption>A debugging aid was costing most of the run. Even after the fix, this allocation-heavy program is still slower on the VM than on the tree-walker.</figcaption>
    </figure>
  );
}
