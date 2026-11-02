import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// What Viscosity does with an element, by how it is used: field reads and
// writes only (the element variable becomes an index, the only "handle"
// Viscosity has), or a use that needs a real object, which keeps the whole
// collection as objects. The reasons on the right are real
// `viscosity explain` output for one-line versions of each program.
const ESCAPES = [
  { code: 'keep.push(ps[i])', why: 'used by push' },
  { code: 'keep[0] === ps[0]', why: 'compared with "==="' },
  { code: 'f(ps[i])', why: 'passed to a function call' },
  { code: 'console.log(ps[3])', why: 'passed to a method call' },
];

export default function EscapeOrNot() {
  return (
    <Svg w={400} h={262} title="Field uses only: the element becomes an index. Any escape: the collection stays an array of objects.">
      <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>ONLY FIELDS ARE USED</T>
      <Box x={6} y={22} w={388} h={58} fill={tok('safe', 0.1)} stroke={tok('safe')}>
        <T x={16} y={40} size={12} mono>const p = ps[i]; p.x += p.vx;</T>
        <T x={16} y={64} size={12} mono fill={tok('safe')}>→ const p = i; ps.x[p] += ps.vx[p];</T>
      </Box>
      <T x={8} y={98} size={11} weight={700} fill={tok('muted')}>THE ELEMENT ITSELF IS NEEDED (IT ESCAPES)</T>
      {ESCAPES.map((e, k) => {
        const y = 110 + k * 36;
        return (
          <g key={k}>
            <Box x={6} y={y} w={176} h={28} fill={tok('danger', 0.08)} stroke={tok('danger')}>
              <T x={14} y={y + 14} size={12} mono>{e.code}</T>
            </Box>
            <Arrow x1={186} y1={y + 14} x2={208} y2={y + 14} color={tok('danger')} width={1.5} />
            <T x={214} y={y + 14} size={11} fill={tok('danger')}>{e.why}</T>
          </g>
        );
      })}
      <T x={200} y={254} size={11} anchor="middle" fill={tok('muted')}>each one: “unsafe: …”, kept as array of objects</T>
    </Svg>
  );
}
