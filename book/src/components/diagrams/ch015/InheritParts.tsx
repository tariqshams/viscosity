import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

/** Where each part of a Num comes from: Node's constructor and method, and Num's own extra. */
export default function InheritParts() {
  return (
    <Svg w={400} h={214} title="Left: class Node, whose constructor stores line and which has the method where(); below it class Num extends Node, whose constructor calls super(line) and stores value. Right: one Num object, n, with line: 3 set by Node's constructor and value: 42 set by Num's, and n.where() available from Node.">
      <Box x={4} y={8} w={170} h={70} r={8} stroke={tok('ink', 0.6)}>
        <T x={89} y={24} size={13} mono weight={700} anchor="middle">class Node</T>
        <T x={14} y={46} size={11.5} mono fill={tok('f1')} weight={700}>sets this.line</T>
        <T x={14} y={64} size={11.5} mono>where()</T>
      </Box>
      <line x1={89} y1={78} x2={89} y2={108} stroke={tok('ink', 0.35)} strokeWidth={1.5} />
      <T x={96} y={93} size={11} fill={tok('muted')}>extends</T>
      <Box x={4} y={108} w={170} h={70} r={8} stroke={tok('brand')} fill={tok('brand', 0.08)}>
        <T x={89} y={124} size={13} mono weight={700} anchor="middle">class Num</T>
        <T x={14} y={146} size={11.5} mono>super(line), then</T>
        <T x={14} y={164} size={11.5} mono fill={tok('f3')} weight={700}>sets this.value</T>
      </Box>
      <T x={224} y={18} size={11} weight={700} fill={tok('muted')}>ONE OBJECT: n</T>
      <Box x={220} y={28} w={176} h={92} r={8} stroke={tok('ink', 0.5)}>
        <rect x={232} y={40} width={152} height={28} rx={3} fill={tok('f1', 0.85)} />
        <T x={242} y={54.5} size={13} mono weight={700} fill={tok('panel')}>line: 3</T>
        <rect x={232} y={80} width={152} height={28} rx={3} fill={tok('f3', 0.85)} />
        <T x={242} y={94.5} size={13} mono weight={700} fill={tok('panel')}>value: 42</T>
      </Box>
      <Arrow x1={176} y1={46} x2={228} y2={54} color={tok('f1')} width={1.5} />
      <Arrow x1={176} y1={164} x2={228} y2={98} color={tok('f3')} width={1.5} />
      <T x={224} y={140} size={12} mono>n.where()</T>
      <T x={224} y={158} size={11} fill={tok('muted')}>not stored in n: it is</T>
      <T x={224} y={174} size={11} fill={tok('muted')}>Node’s method, shared</T>
      <T x={224} y={196} size={11} fill={tok('brand')}>n instanceof Num, and Node</T>
    </Svg>
  );
}
