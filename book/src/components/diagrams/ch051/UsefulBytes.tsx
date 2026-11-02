import { Svg, T, tok } from '../../viz/svg';

// Bytes fetched to sum the masses of 8 particles, in three layouts (the
// toy layouts of the line-counting diagram: one object per 64-byte line,
// plus one line of pointers). The coloured part of each bar is the 64
// bytes of masses actually used; the rest is carried for nothing.
const ROWS = [
  { name: 'Float64Array', sub: 'stride 8', bytes: 64 },
  { name: 'packed buffer', sub: 'stride 48', bytes: 384 },
  { name: 'objects (toy)', sub: 'stride 64+', bytes: 576 },
];

export default function UsefulBytes() {
  const x0 = 112;
  const scale = 230 / 576;
  return (
    <Svg w={400} h={170} title="Bytes fetched to sum eight masses: 64 for a Float64Array, 384 for a packed buffer and 576 for objects, of which only 64 are used each time">
      {ROWS.map((r, i) => {
        const y = 14 + i * 44;
        const w = r.bytes * scale;
        return (
          <g key={r.name}>
            <T x={x0 - 8} y={y + 8} size={12} weight={700} anchor="end">{r.name}</T>
            <T x={x0 - 8} y={y + 23} size={11} anchor="end" fill={tok('muted')}>{r.sub}</T>
            <rect x={x0} y={y} width={w} height={22} rx={3} fill={tok('muted', 0.25)} stroke={tok('line')} />
            <rect x={x0} y={y} width={64 * scale} height={22} rx={3} fill={tok('f5', 0.9)} />
            <T x={x0 + w + 6} y={y + 11} size={12} mono>{r.bytes} B</T>
          </g>
        );
      })}
      <rect x={x0} y={150} width={12} height={12} rx={2} fill={tok('f5', 0.9)} />
      <T x={x0 + 18} y={156} size={11}>used (64 B of masses)</T>
      <rect x={x0 + 170} y={150} width={12} height={12} rx={2} fill={tok('muted', 0.25)} stroke={tok('line')} />
      <T x={x0 + 188} y={156} size={11}>fetched, unused</T>
    </Svg>
  );
}
