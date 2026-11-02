// Chapter 211-b (staged split of 189): a diamond CFG beside its dominator
// tree. b0 dominates everything; b1 and b2 are siblings, so neither may
// reuse the other's values.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const node = (x: number, y: number, label: string, sub: string, hot = false) => (
  <Box x={x - 34} y={y - 18} w={68} h={36} fill={hot ? tok('brand', 0.12) : tok('panel')} stroke={hot ? tok('brand') : tok('line')}>
    <T x={x} y={y - 6} size={12} weight={700} anchor="middle">{label}</T>
    <T x={x} y={y + 9} size={10.5} mono anchor="middle" fill={tok('muted')}>{sub}</T>
  </Box>
);

export default function WhoDominates() {
  return (
    <Svg w={400} h={232} title="Left: a diamond control-flow graph b0 to b1 and b2, both to b3. Right: its dominator tree, with b0 as the parent of b1, b2 and b3.">
      <T x={100} y={12} size={11} weight={700} anchor="middle" fill={tok('muted')}>CFG</T>
      <Arrow x1={85} y1={58} x2={52} y2={92} />
      <Arrow x1={115} y1={58} x2={148} y2={92} />
      <Arrow x1={52} y1={128} x2={85} y2={170} />
      <Arrow x1={148} y1={128} x2={115} y2={170} />
      {node(100, 40, 'b0', 'a * b', true)}
      {node(40, 110, 'b1', 'a + b')}
      {node(160, 110, 'b2', 'a + b')}
      {node(100, 188, 'b3', 'b * a ?')}
      <line x1={200} y1={20} x2={200} y2={220} stroke={tok('line')} strokeWidth={1.5} />
      <T x={300} y={12} size={11} weight={700} anchor="middle" fill={tok('muted')}>DOMINATOR TREE</T>
      <line x1={300} y1={58} x2={236} y2={112} stroke={tok('ink', 0.5)} strokeWidth={1.5} />
      <line x1={300} y1={58} x2={300} y2={112} stroke={tok('ink', 0.5)} strokeWidth={1.5} />
      <line x1={300} y1={58} x2={364} y2={112} stroke={tok('ink', 0.5)} strokeWidth={1.5} />
      {node(300, 40, 'b0', 'a * b', true)}
      {node(236, 130, 'b1', 'a + b')}
      {node(300, 130, 'b2', 'a + b')}
      {node(364, 130, 'b3', 'b * a ?')}
      <T x={300} y={180} size={11.5} anchor="middle" fill={tok('safe')}>b3’s ancestor b0 computed a * b: reuse</T>
      <T x={300} y={198} size={11.5} anchor="middle" fill={tok('danger')}>b1 and b2 are siblings: no reuse</T>
    </Svg>
  );
}
