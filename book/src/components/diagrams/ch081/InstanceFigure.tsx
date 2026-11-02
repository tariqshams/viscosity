// Chapter 81: an instance holds its own fields; its class holds the
// methods every instance shares. get looks at fields first.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

export default function InstanceFigure() {
  return (
    <Svg w={400} h={176} title="Two Cake instances, each with its own fields map, both pointing at one Cake class that holds the methods map. A property read checks the fields first, then the class's methods.">
      <Box x={6} y={8} w={180} h={54}>
        <T x={14} y={22} size={11} weight={700} fill={tok('muted')}>Cake instance</T>
        <T x={14} y={44} size={13} mono>flavour = "lemon"</T>
      </Box>
      <Box x={214} y={8} w={180} h={54}>
        <T x={222} y={22} size={11} weight={700} fill={tok('muted')}>Cake instance</T>
        <T x={222} y={44} size={13} mono>flavour = "plum"</T>
      </Box>
      <Box x={100} y={110} w={200} h={54} fill={tok('brand', 0.08)} stroke={tok('brand')}>
        <T x={110} y={124} size={11} weight={700} fill={tok('brand')}>class Cake</T>
        <T x={110} y={146} size={13} mono>init, taste</T>
      </Box>
      <Arrow x1={96} y1={62} x2={150} y2={108} />
      <Arrow x1={304} y1={62} x2={250} y2={108} />
      <T x={6} y={86} size={11} fill={tok('muted')}>1. fields: own data</T>
      <T x={290} y={86} size={11} fill={tok('muted')}>2. then methods</T>
    </Svg>
  );
}
