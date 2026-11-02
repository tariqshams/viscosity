// Chapter 86: how much faster the bytecode VM is than the tree-walker, per
// benchmark program, read from the committed results file
// companion/ts/results/drip-bench-2026-11-02.json (best of 3 runs, each in a
// fresh process, compile time included). A bar right of the 1× line means
// the VM was faster; left of it, slower.
import results from '../../../../companion/ts/results/drip-bench-2026-11-02.json';
import { tok } from '../../viz/svg';

type Row = { program: string; tree: number; vm: number; speedup: number };

export default function VmVsTreeChart() {
  const rows = [...(results.rows as Row[])].sort((a, b) => b.speedup - a.speedup);
  const W = 400;
  const labelW = 104;
  const rowH = 22;
  const H = rows.length * rowH + 26;
  const lo = 0.5;
  const hi = 1.4;
  const x = (v: number) => labelW + ((v - lo) / (hi - lo)) * (W - labelW - 46);
  const env = results.env;
  return (
    <figure className="figure not-prose" data-bench="drip-vm-vs-tree">
      <div className="fig-card">
        <div className="mb-1 font-sans text-[0.95rem] font-semibold">The VM’s speed-up over the tree-walker</div>
        <div className="mb-2 font-sans text-xs text-muted">Tree-walker time ÷ VM time, per program (right of 1× = the VM is faster)</div>
        <svg viewBox={`0 0 ${W} ${H}`} className="viz" role="img" aria-label={rows.map((r) => `${r.program}: ${r.speedup}×`).join('; ')}>
          <line x1={x(1)} y1={2} x2={x(1)} y2={H - 18} stroke={tok('ink', 0.5)} strokeWidth={1.5} />
          <text x={x(1)} y={H - 4} textAnchor="middle" fontSize={11} fill={tok('muted')}>1×</text>
          <text x={x(lo)} y={H - 4} textAnchor="start" fontSize={11} fill={tok('muted')}>{lo}×</text>
          <text x={x(hi)} y={H - 4} textAnchor="end" fontSize={11} fill={tok('muted')}>{hi}×</text>
          {rows.map((r, i) => {
            const y = 4 + i * rowH;
            const faster = r.speedup >= 1;
            const a = Math.min(x(1), x(r.speedup));
            const w = Math.max(2, Math.abs(x(r.speedup) - x(1)));
            return (
              <g key={r.program}>
                <title>{`${r.program}: tree-walker ${r.tree} ms, VM ${r.vm} ms`}</title>
                <text x={labelW - 6} y={y + 9} textAnchor="end" fontSize={11.5} fill={tok('ink')} dominantBaseline="middle">{r.program}</text>
                <rect x={a} y={y + 2} width={w} height={14} rx={3} fill={faster ? tok('brand') : tok('warn')} />
                <text x={faster ? a + w + 4 : a - 4} y={y + 9} textAnchor={faster ? 'start' : 'end'} fontSize={11} className="mono" fill={tok('ink')} dominantBaseline="middle">{r.speedup}×</text>
              </g>
            );
          })}
        </svg>
        <details className="mt-2 font-sans text-xs">
          <summary className="cursor-pointer text-muted">Where these numbers come from</summary>
          <p className="mt-2 text-muted">
            companion/ts/results/drip-bench-2026-11-02 (.md and .json): the corpus benchmark programs, each run on both engines; Node {env.node},
            V8 {env.v8}, {env.cpu}, {env.date.slice(0, 10)}. {env.note} Runs per program: {env.runs}.
          </p>
        </details>
      </div>
      <figcaption>On this host the VM is at best 1.3× faster than the tree-walker, and on four programs it is slower.</figcaption>
    </figure>
  );
}
