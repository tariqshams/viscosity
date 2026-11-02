import { Svg, T, tok } from '../../viz/svg';

// Bytes that reach the cache per particle, for two loops over six float64
// fields (8 bytes each), in packed AoS and in SoA. This is arithmetic from
// the layouts, not a measurement: packed AoS always brings in all 48 bytes
// of a record, because whole cache lines arrive; SoA brings in only the
// columns the loop reads.
const ROWS = [
  { loop: 'update-xy (4 of 6 fields)', layout: 'packed AoS', used: 32, loaded: 48 },
  { loop: '', layout: 'SoA', used: 32, loaded: 32 },
  { loop: 'sum one field (1 of 6)', layout: 'packed AoS', used: 8, loaded: 48 },
  { loop: '', layout: 'SoA', used: 8, loaded: 8 },
];

export default function UsefulBytes() {
  const X0 = 96;
  const scale = 4.8;
  return (
    <Svg w={400} h={242} title="Bytes loaded per particle. update-xy: packed AoS loads 48 bytes and uses 32; SoA loads 32 and uses all 32. Summing one field: packed AoS loads 48 and uses 8; SoA loads 8 and uses 8.">
      <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>BYTES REACHING THE CACHE, PER PARTICLE</T>
      {ROWS.map((r, k) => {
        const y = 40 + k * 44 + (k >= 2 ? 14 : 0);
        return (
          <g key={k}>
            {r.loop && <T x={8} y={y - 6} size={12} weight={700}>{r.loop}</T>}
            <T x={X0 - 8} y={y + 12} size={12} anchor="end">{r.layout}</T>
            <rect x={X0} y={y + 2} width={r.loaded * scale} height={20} rx={3} fill={tok('muted', 0.25)} />
            <rect x={X0} y={y + 2} width={r.used * scale} height={20} rx={3} fill={tok('brand', 0.85)} />
            <T x={X0 + r.loaded * scale + 6} y={y + 12} size={12} mono>{r.used} of {r.loaded}</T>
          </g>
        );
      })}
      <rect x={8} y={220} width={12} height={12} rx={2} fill={tok('brand', 0.85)} />
      <T x={24} y={226.5} size={11} fill={tok('muted')}>used by the loop</T>
      <rect x={140} y={220} width={12} height={12} rx={2} fill={tok('muted', 0.25)} />
      <T x={156} y={226.5} size={11} fill={tok('muted')}>loaded anyway, never read</T>
    </Svg>
  );
}
