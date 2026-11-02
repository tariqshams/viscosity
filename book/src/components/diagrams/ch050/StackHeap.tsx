import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

/** The call stack (left) holds each call's locals; the heap (right) holds
 *  objects. An array of objects is a row of arrows to scattered objects; a
 *  Float64Array's numbers sit side by side in one block. */
export default function StackHeap() {
  const objs = [
    { x: 300, y: 40 },
    { x: 196, y: 120 },
    { x: 316, y: 150 },
  ];
  return (
    <Svg w={400} h={290} title="The call stack holds a frame with variables n, ps and xs. ps points to an array in the heap whose three slots point to three objects in different places. xs points to one contiguous block of three numbers.">
      <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>CALL STACK</T>
      <T x={150} y={12} size={11} weight={700} fill={tok('muted')}>HEAP</T>
      <line x1={140} x2={140} y1={4} y2={286} stroke={tok('line')} strokeDasharray="4 4" />

      <Box x={8} y={26} w={120} h={132} r={6} stroke={tok('ink', 0.5)}>
        <T x={16} y={42} size={12} mono weight={700}>frame: main</T>
        {[['n', '3'], ['ps', ''], ['xs', '']].map(([k, v], i) => (
          <g key={k}>
            <rect x={16} y={56 + i * 32} width={104} height={24} rx={3} fill={tok('paper')} stroke={tok('line')} />
            <T x={24} y={68 + i * 32} size={13} mono weight={700}>{k}</T>
            {v ? <T x={100} y={68 + i * 32} size={13} mono>{v}</T> : <circle cx={108} cy={68 + i * 32} r={4} fill={tok('ink', 0.8)} />}
          </g>
        ))}
      </Box>

      {/* the array of objects: three slots, each an arrow */}
      <T x={152} y={36} size={12} mono weight={700}>ps (array)</T>
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x={152 + i * 30} y={46} width={28} height={24} rx={3} fill={tok('brand', 0.12)} stroke={tok('brand')} />
          <circle cx={166 + i * 30} cy={58} r={3.5} fill={tok('ink', 0.8)} />
        </g>
      ))}
      <Arrow x1={108} y1={100} x2={150} y2={60} />
      {objs.map((o, i) => (
        <g key={i}>
          <Box x={o.x} y={o.y} w={76} h={36} r={5} fill={tok('accent', 0.1)} stroke={tok('accent')}>
            <rect x={o.x + 6} y={o.y + 9} width={14} height={18} rx={2} fill={tok('muted', 0.45)} />
            <rect x={o.x + 24} y={o.y + 9} width={22} height={18} rx={2} fill={tok('f1', 0.85)} />
            <rect x={o.x + 50} y={o.y + 9} width={20} height={18} rx={2} fill={tok('f2', 0.85)} />
          </Box>
        </g>
      ))}
      <Arrow x1={166} y1={66} x2={298} y2={52} bend={0.3} />
      <Arrow x1={196} y1={66} x2={214} y2={118} />
      <Arrow x1={226} y1={66} x2={330} y2={148} bend={-0.2} />

      {/* the typed array: one contiguous block */}
      <Arrow x1={108} y1={132} x2={150} y2={232} bend={0.3} />
      <T x={152} y={216} size={12} mono weight={700}>xs (Float64Array)</T>
      {[0, 1, 2].map((i) => (
        <rect key={i} x={152 + i * 62} y={228} width={60} height={26} rx={2} fill={tok('f1', 0.85)} stroke={tok('ink', 0.4)} />
      ))}
      <T x={245} y={270} size={11} anchor="middle" fill={tok('muted')}>3 numbers × 8 bytes, side by side</T>
    </Svg>
  );
}
