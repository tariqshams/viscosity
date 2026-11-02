import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

/** Node with where() and show(); Num and Add below it, each with its own show(). */
export default function OverrideTree() {
  return (
    <Svg w={400} h={232} title="Node at the top holds where() and a default show(). Num and Add extend Node and each define their own show(), which overrides Node's. For a Num n, n.show() finds Num's show, and n.where() finds Node's where.">
      <Box x={110} y={8} w={180} h={64} r={8} stroke={tok('ink', 0.6)}>
        <T x={200} y={24} size={13} mono weight={700} anchor="middle">class Node</T>
        <T x={124} y={44} size={12} mono>where()</T>
        <T x={124} y={60} size={12} mono fill={tok('muted')}>show() → '?'</T>
      </Box>
      <line x1={170} y1={72} x2={90} y2={110} stroke={tok('ink', 0.35)} strokeWidth={1.5} />
      <line x1={230} y1={72} x2={310} y2={110} stroke={tok('ink', 0.35)} strokeWidth={1.5} />
      <T x={120} y={88} size={11} anchor="end" fill={tok('muted')}>extends</T>
      {[{ x: 4, name: 'Num', body: "show() → '42'" }, { x: 222, name: 'Add', body: "show() → '(2 + 3)'" }].map((c) => (
        <Box key={c.name} x={c.x} y={110} w={174} h={48} r={8} stroke={tok('brand')} fill={tok('brand', 0.08)}>
          <T x={c.x + 87} y={126} size={13} mono weight={700} anchor="middle">class {c.name}</T>
          <T x={c.x + 12} y={146} size={12} mono weight={700} fill={tok('brand')}>{c.body}</T>
        </Box>
      ))}
      <Box x={4} y={186} w={120} h={36} r={6} stroke={tok('ink', 0.5)}>
        <T x={64} y={204.5} size={13} mono weight={700} anchor="middle">n = a Num</T>
      </Box>
      <Arrow x1={60} y1={186} x2={60} y2={160} color={tok('brand')} />
      <T x={70} y={174} size={11} mono fill={tok('brand')}>n.show()</T>
      <Arrow x1={126} y1={200} x2={190} y2={74} bend={1.5} dash color={tok('ink', 0.6)} />
      <T x={146} y={210} size={11} mono fill={tok('muted')}>n.where(): Num has none,</T>
      <T x={146} y={224} size={11} mono fill={tok('muted')}>so Node’s is used</T>
    </Svg>
  );
}
