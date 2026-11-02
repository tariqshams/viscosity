// Chapter 207: a critical edge (b2 has two successors, b3 two predecessors)
// and the same graph after splitting it with a new, empty block b5.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const node = (x: number, y: number, label: string, fill = tok('panel'), stroke = tok('line')) => (
  <Box x={x - 28} y={y - 14} w={56} h={28} fill={fill} stroke={stroke}>
    <T x={x} y={y} size={12} weight={700} anchor="middle">{label}</T>
  </Box>
);

export default function CriticalEdge() {
  return (
    <Svg w={400} h={232} title="Left: b1 and b2 both lead to b3, and b2 also leads to b4; the edge b2 to b3 is highlighted as critical. Right: the same graph with a new block b5 on that edge, holding the inserted a + b.">
      <T x={100} y={12} size={11} weight={700} anchor="middle" fill={tok('muted')}>BEFORE</T>
      {node(50, 50, 'b1')}
      {node(150, 50, 'b2')}
      {node(70, 170, 'b3')}
      {node(170, 170, 'b4')}
      <Arrow x1={50} y1={64} x2={64} y2={154} />
      <Arrow x1={140} y1={64} x2={80} y2={154} color={tok('danger')} width={3} />
      <Arrow x1={158} y1={64} x2={168} y2={154} />
      <T x={120} y={110} size={11} fill={tok('danger')} weight={700}>critical</T>
      <T x={100} y={206} size={11} anchor="middle" fill={tok('muted')}>end of b2? also runs on the way to b4</T>
      <T x={100} y={222} size={11} anchor="middle" fill={tok('muted')}>start of b3? also runs after b1</T>
      <line x1={204} y1={20} x2={204} y2={226} stroke={tok('line')} strokeWidth={1.5} />
      <T x={302} y={12} size={11} weight={700} anchor="middle" fill={tok('muted')}>AFTER SPLITTING</T>
      {node(250, 40, 'b1')}
      {node(350, 40, 'b2')}
      <Box x={290} y={88} w={76} h={36} fill={tok('safe', 0.12)} stroke={tok('safe')}>
        <T x={328} y={99} size={12} weight={700} anchor="middle">b5</T>
        <T x={328} y={114} size={10.5} mono anchor="middle" fill={tok('safe')}>a + b</T>
      </Box>
      {node(270, 170, 'b3')}
      {node(370, 170, 'b4')}
      <Arrow x1={250} y1={54} x2={264} y2={154} />
      <Arrow x1={344} y1={54} x2={332} y2={86} color={tok('safe')} />
      <Arrow x1={316} y1={124} x2={282} y2={154} color={tok('safe')} />
      <Arrow x1={360} y1={54} x2={368} y2={154} />
      <T x={302} y={214} size={11} anchor="middle" fill={tok('safe')}>b5 runs only on that edge</T>
    </Svg>
  );
}
