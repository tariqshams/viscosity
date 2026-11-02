import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

/** A function is an object: several names (and an array slot) can hold arrows to the same one. */
export default function FnArrows() {
  return (
    <Svg w={400} h={176} title="The names double and twice, and slot 0 of the array ops, all hold arrows to one function object in memory.">
      <T x={10} y={12} size={11} weight={700} fill={tok('muted')}>NAMES</T>
      <T x={220} y={12} size={11} weight={700} fill={tok('muted')}>IN MEMORY</T>
      {[
        { name: 'double', y: 40 },
        { name: 'twice', y: 90 },
        { name: 'ops[0]', y: 140 },
      ].map((v) => (
        <g key={v.name}>
          <Box x={10} y={v.y - 16} w={84} h={32} stroke={tok('ink', 0.5)}>
            <T x={20} y={v.y} size={14} mono weight={700}>{v.name}</T>
            <circle cx={84} cy={v.y} r={4} fill={tok('ink', 0.8)} />
          </Box>
          <Arrow x1={88} y1={v.y} x2={214} y2={v.y < 90 ? 74 : v.y > 90 ? 106 : 90} bend={v.y === 90 ? 0 : v.y < 90 ? -0.2 : 0.2} />
        </g>
      ))}
      <Box x={216} y={52} w={176} h={76} r={8} fill={tok('brand', 0.1)} stroke={tok('brand')}>
        <T x={228} y={70} size={11} weight={700} fill={tok('brand')}>A FUNCTION OBJECT</T>
        <T x={228} y={92} size={13} mono>(n) {'{'}</T>
        <T x={240} y={110} size={13} mono>return n * 2;</T>
        <T x={366} y={110} size={13} mono>{'}'}</T>
      </Box>
    </Svg>
  );
}
