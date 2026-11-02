// Chapter 95: why context-insensitive analysis is imprecise. Two call
// sites enter id and two returns leave it; an analysis that merges id's
// facts also follows the impossible path "in at s2, out at s1".
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

export default function PathsPic() {
  return (
    <Svg w={400} h={230} title="Caller on the left with call sites s1 and s2 and the variables a and b they assign; id on the right. Real paths go in and out at the same site; the red dashed path goes in at s2 and out to a, which no run can do.">
      <T x={90} y={14} size={11} weight={700} anchor="middle" fill={tok('muted')}>CALLER</T>
      <T x={320} y={14} size={11} weight={700} anchor="middle" fill={tok('muted')}>CALLEE</T>
      <Box x={20} y={30} w={140} h={30}><T x={90} y={45} size={12} mono anchor="middle">s1: id(o1)</T></Box>
      <Box x={20} y={80} w={140} h={30}><T x={90} y={95} size={12} mono anchor="middle">a = result</T></Box>
      <Box x={20} y={130} w={140} h={30}><T x={90} y={145} size={12} mono anchor="middle">s2: id(o2)</T></Box>
      <Box x={20} y={180} w={140} h={30}><T x={90} y={195} size={12} mono anchor="middle">b = result</T></Box>
      <Box x={260} y={90} w={120} h={50} fill={tok('brand', 0.1)} stroke={tok('brand')}>
        <T x={320} y={108} size={12} mono anchor="middle">id(p)</T>
        <T x={320} y={126} size={12} mono anchor="middle">return p</T>
      </Box>
      <Arrow x1={160} y1={42} x2={258} y2={98} color={tok('safe')} />
      <Arrow x1={258} y1={110} x2={162} y2={92} color={tok('safe')} />
      <Arrow x1={160} y1={146} x2={258} y2={128} color={tok('safe')} />
      <Arrow x1={258} y1={136} x2={162} y2={192} color={tok('safe')} />
      <Arrow x1={170} y1={154} x2={166} y2={100} color={tok('danger')} dash bend={0.8} />
      <T x={268} y={172} size={11} fill={tok('danger')}>in at s2,</T>
      <T x={268} y={186} size={11} fill={tok('danger')}>out at a: impossible</T>
      <T x={300} y={44} size={11} anchor="middle" fill={tok('safe')}>green: real paths</T>
    </Svg>
  );
}
