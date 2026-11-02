import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 314: Cargo feature unification. The Cargo book ("Feature
// unification"): when a dependency is used by several packages, Cargo
// builds it once with the union of all features enabled on it.
export default function FeatureUnion() {
  return (
    <Svg w={400} h={220} title="Crate a asks for temps with kelvin, crate b asks for temps with default features; temps is built once with fahrenheit and kelvin">
      <Box x={8} y={8} w={180} h={60} fill={tok('f1', 0.12)} stroke={tok('f1')}>
        <T x={18} y={28} size={12} weight={700}>crate a</T>
        <T x={18} y={48} size={11} mono>features = ["kelvin"]</T>
      </Box>
      <Box x={212} y={8} w={180} h={60} fill={tok('f3', 0.12)} stroke={tok('f3')}>
        <T x={222} y={28} size={12} weight={700}>crate b</T>
        <T x={222} y={48} size={11} mono>default features</T>
      </Box>
      <Arrow x1={98} y1={68} x2={170} y2={120} />
      <Arrow x1={302} y1={68} x2={230} y2={120} />
      <Box x={90} y={122} w={220} h={86} fill={tok('safe', 0.1)} stroke={tok('safe')}>
        <T x={200} y={142} size={12} weight={700} anchor="middle">temps, built once</T>
        <T x={200} y={164} size={11} mono anchor="middle" fill={tok('f3')}>fahrenheit (default, from b)</T>
        <T x={200} y={182} size={11} mono anchor="middle" fill={tok('f1')}>kelvin (from a)</T>
        <T x={200} y={199} size={11} anchor="middle" fill={tok('muted')}>a and b both see both</T>
      </Box>
    </Svg>
  );
}
