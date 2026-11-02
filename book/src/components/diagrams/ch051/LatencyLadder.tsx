import { Svg, T, tok } from '../../viz/svg';

// Rough 2021 commodity-hardware latencies from Slotin, "Algorithms for
// Modern Hardware" (Memory Hierarchy). Registers are effectively free.
// Bars use a log scale, so each step right is a multiple, not an addition.
const LEVELS = [
  { name: 'registers', where: 'in your hand', ns: null as number | null, size: 'a handful of values' },
  { name: 'L1 cache', where: 'desk drawer', ns: 2, size: '~10 KB' },
  { name: 'L2 cache', where: 'office shelf', ns: 5, size: '~100 KB' },
  { name: 'L3 cache', where: 'storeroom', ns: 20, size: '~1 MB per core' },
  { name: 'main memory', where: 'warehouse', ns: 100, size: 'gigabytes' },
];

export default function LatencyLadder() {
  const x0 = 120;
  const span = 220;
  const log = (v: number) => Math.log10(v);
  const lo = log(0.5);
  const hi = log(100);
  const w = (ns: number) => ((log(ns) - lo) / (hi - lo)) * span;
  return (
    <Svg w={400} h={272} title="Latency ladder: registers, L1, L2, L3 and main memory. Each level is bigger and slower than the one above. Rough figures: L1 about 2 ns, L2 about 5, L3 about 20, main memory about 100 nanoseconds.">
      {LEVELS.map((l, i) => {
        const y = 14 + i * 48;
        const bw = l.ns === null ? 4 : w(l.ns);
        return (
          <g key={l.name}>
            <T x={x0 - 8} y={y + 8} size={13} weight={700} anchor="end">{l.name}</T>
            <T x={x0 - 8} y={y + 24} size={11} anchor="end" fill={tok('muted')}>{l.where}</T>
            <rect x={x0} y={y} width={bw} height={18} rx={3} fill={i === 4 ? tok('danger', 0.8) : tok('brand', 0.35 + i * 0.15)} />
            <T x={x0 + bw + 6} y={y + 9} size={12} mono>{l.ns === null ? '≈ free' : `≈ ${l.ns} ns`}</T>
            <T x={x0} y={y + 30} size={11} fill={tok('muted')}>holds {l.size}</T>
          </g>
        );
      })}
      <T x={x0} y={264} size={11} fill={tok('muted')}>log scale: each step right is a multiple</T>
    </Svg>
  );
}
