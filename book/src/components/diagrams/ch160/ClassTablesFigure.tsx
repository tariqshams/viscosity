// Chapter 160: a class and an instance in the companion VM. ObjClass is a
// name and a method table; ObjInstance is a pointer to its class, a field
// table and the order the fields were first set (object.ts).
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

function Row({ x, y, k, v }: { x: number; y: number; k: string; v: string }) {
  return (
    <>
      <Box x={x} y={y} w={56} h={22} r={2} fill={tok('panel')} stroke={tok('line')}>
        <T x={x + 6} y={y + 11} size={11} mono>{k}</T>
      </Box>
      <Box x={x + 58} y={y} w={84} h={22} r={2} fill={tok('panel')} stroke={tok('line')}>
        <T x={x + 64} y={y + 11} size={11} mono>{v}</T>
      </Box>
    </>
  );
}

export default function ClassTablesFigure() {
  return (
    <Svg w={400} h={200} title="An instance on the left points to its class on the right. The instance has a field table holding x: 3 and a field order list; the class has a method table holding init and get.">
      <Box x={4} y={8} w={176} h={150} fill={tok('brand', 0.06)} stroke={tok('brand')}>
        <T x={14} y={24} size={12} weight={700}>instance</T>
        <T x={14} y={46} size={11} mono>klass</T>
        <T x={14} y={70} size={11} mono fill={tok('muted')}>fields (a Table)</T>
        <Row x={14} y={80} k="x" v="3" />
        <T x={14} y={124} size={11} mono fill={tok('muted')}>fieldOrder</T>
        <T x={14} y={142} size={11} mono>[x]</T>
      </Box>
      <Box x={216} y={8} w={180} h={130} fill={tok('accent', 0.06)} stroke={tok('accent')}>
        <T x={226} y={24} size={12} weight={700}>class</T>
        <T x={226} y={46} size={11} mono>name: "P"</T>
        <T x={226} y={70} size={11} mono fill={tok('muted')}>methods (a Table)</T>
        <Row x={226} y={80} k="init" v="<closure>" />
        <Row x={226} y={104} k="get" v="<closure>" />
      </Box>
      <Arrow x1={60} y1={46} x2={214} y2={40} color={tok('ink', 0.6)} />
      <T x={8} y={182} size={11} fill={tok('muted')}>fields are looked up first, then the class’s methods</T>
    </Svg>
  );
}
