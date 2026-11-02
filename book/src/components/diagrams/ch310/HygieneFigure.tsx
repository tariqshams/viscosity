import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 310: macro_rules! hygiene. Local variables in a transcriber
// are resolved at the definition site (Rust Reference, "Macros By
// Example", Hygiene), so twice!(t + 1) with the caller's t = 5 gives
// (5 + 1) * 2 = 12, as rustc 1.97.0 printed.
export default function HygieneFigure() {
  return (
    <Svg w={400} h={196} title="The caller's t and the macro's t are two different variables that happen to share a spelling">
      <Box x={8} y={8} w={184} h={92} fill={tok('f1', 0.1)} stroke={tok('f1')}>
        <T x={18} y={26} size={11} weight={700} fill={tok('f1')}>your code</T>
        <T x={18} y={50} size={12} mono>let t = 5;</T>
        <T x={18} y={74} size={12} mono>twice!(t + 1)</T>
      </Box>
      <Box x={208} y={8} w={184} h={92} fill={tok('f2', 0.1)} stroke={tok('f2')}>
        <T x={218} y={26} size={11} weight={700} fill={tok('f2')}>the macro</T>
        <T x={218} y={50} size={12} mono>let t = 2;</T>
        <T x={218} y={74} size={12} mono>$e * t</T>
      </Box>
      <Box x={8} y={120} w={384} h={66} fill={tok('panel')} stroke={tok('line')}>
        <T x={18} y={138} size={11} fill={tok('muted')}>expansion (colour = which t)</T>
        <T x={18} y={164} size={13} mono fill={tok('f2')}>let t = 2;</T>
        <T x={120} y={164} size={13} mono fill={tok('f1')}>(t + 1)</T>
        <T x={186} y={164} size={13} mono> * </T>
        <T x={214} y={164} size={13} mono fill={tok('f2')}>t</T>
        <T x={384} y={164} size={13} mono anchor="end" weight={700}>= 12</T>
      </Box>
      <Arrow x1={100} y1={100} x2={150} y2={150} color={tok('f1')} />
      <Arrow x1={300} y1={100} x2={220} y2={150} color={tok('f2')} />
    </Svg>
  );
}
