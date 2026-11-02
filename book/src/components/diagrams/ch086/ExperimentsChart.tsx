// Chapter 86: what each change to the VM is worth, measured for this
// chapter. Each row compares two versions of the companion VM (or the two
// engines) on one program: the two were run alternately, 9 times each, every
// run in a fresh process, and the ratio is slower best time ÷ faster best
// time. The numbers are in vm-experiments-2026-11-02.json, next to this file;
// the variants were copies of companion/ts/src with one change each.
import data from './vm-experiments-2026-11-02.json';
import { tok } from '../../viz/svg';

type Row = { change: string; program: string; fastLabel: string; slowLabel: string; fast: number; slow: number; fastMedian: number; slowMedian: number };

const LABEL: Record<string, string> = {
  poisoning: 'poisoning off',
  invoke: 'invoke',
  'inc.local': 'inc.local',
  'map-fields': 'fields in a Map',
  counter: 'no counter',
  engines: 'tree-walker vs VM',
};

export default function ExperimentsChart() {
  const rows = (data.rows as Row[]).filter((r) => r.change !== 'engines');
  const W = 400;
  const labelW = 168;
  const rowH = 30;
  const H = rows.length * rowH + 24;
  const max = 2.2;
  const x = (v: number) => labelW + ((v - 1) / (max - 1)) * (W - labelW - 44);
  const env = data.env;
  return (
    <figure className="figure not-prose" data-bench="drip-vm-experiments">
      <div className="fig-card">
        <div className="mb-1 font-sans text-[0.95rem] font-semibold">What each change is worth</div>
        <div className="mb-2 font-sans text-xs text-muted">Time without the change ÷ time with it, best of 9 runs each</div>
        <svg viewBox={`0 0 ${W} ${H}`} className="viz" role="img" aria-label={rows.map((r) => `${LABEL[r.change]} on ${r.program}: ${(r.slow / r.fast).toFixed(2)}×`).join('; ')}>
          <rect x={x(1)} y={0} width={x(1.1) - x(1)} height={H - 18} fill={tok('muted', 0.15)} />
          <text x={x(1.05)} y={H - 4} textAnchor="middle" fontSize={10} fill={tok('muted')}>noise</text>
          <text x={x(2)} y={H - 4} textAnchor="middle" fontSize={11} fill={tok('muted')}>2×</text>
          {rows.map((r, i) => {
            const y = 2 + i * rowH;
            const ratio = r.slow / r.fast;
            return (
              <g key={r.change + r.program}>
                <title>{`${r.fastLabel}: ${r.fast} ms (median ${r.fastMedian}); ${r.slowLabel}: ${r.slow} ms (median ${r.slowMedian})`}</title>
                <text x={labelW - 6} y={y + 9} textAnchor="end" fontSize={11.5} fill={tok('ink')} dominantBaseline="middle">{LABEL[r.change]}</text>
                <text x={labelW - 6} y={y + 21} textAnchor="end" fontSize={9.5} fill={tok('muted')} dominantBaseline="middle">{r.program}</text>
                <rect x={x(1)} y={y + 6} width={Math.max(2, x(ratio) - x(1))} height={14} rx={3} fill={ratio >= 1.1 ? tok('brand') : tok('muted', 0.6)} />
                <text x={x(ratio) + 4} y={y + 13} fontSize={11} className="mono" fill={tok('ink')} dominantBaseline="middle">{ratio.toFixed(2)}×</text>
              </g>
            );
          })}
        </svg>
        <details className="mt-2 font-sans text-xs">
          <summary className="cursor-pointer text-muted">Where these numbers come from</summary>
          <p className="mt-2 text-muted">
            Runs done for this chapter: copies of the companion VM with one change each (poisoning forced on with the debugGC option; a
            compiler that never emits invoke; a for loop that steps its counter with five instructions instead of inc.local; instance fields
            in a JavaScript Map; no instruction counter). Node {env.node}, V8 {env.v8}, {env.cpu}, {env.date.slice(0, 10)}. {env.note}
          </p>
        </details>
      </div>
      <figcaption>Turning poisoning off and using invoke clearly pay; inc.local and a Map for fields help a little; the instruction counter costs nothing measurable.</figcaption>
    </figure>
  );
}
