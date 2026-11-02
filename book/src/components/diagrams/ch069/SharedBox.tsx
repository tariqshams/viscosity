// Chapter 69 (second half): two closures made in the same call share one
// captured environment, so a change made through one is seen by the other.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

export default function SharedBox() {
  return (
    <Svg w={400} h={190} title="The global box holds a list of two function values, get and set. Both functions' closure fields point at the same environment, the one made by the call makeBox, which holds v, get and set. set changed v to new, so get reads new.">
      <Box x={6} y={8} w={180} h={34} stroke={tok('ink', 0.4)}>
        <T x={16} y={25} size={12.5} mono>box = [get, set]</T>
      </Box>
      <Box x={6} y={66} w={86} h={34} fill={tok('brand', 0.08)} stroke={tok('brand')}>
        <T x={16} y={83} size={12.5} mono>get</T>
      </Box>
      <Box x={100} y={66} w={86} h={34} fill={tok('brand', 0.08)} stroke={tok('brand')}>
        <T x={110} y={83} size={12.5} mono>set</T>
      </Box>
      <Arrow x1={50} y1={42} x2={50} y2={64} />
      <Arrow x1={140} y1={42} x2={140} y2={64} />
      <Box x={6} y={128} w={180} h={54} fill={tok('safe', 0.1)} stroke={tok('safe')}>
        <T x={16} y={142} size={11} weight={700} fill={tok('safe')}>makeBox call env (kept)</T>
        <T x={16} y={162} size={12.5} mono>v = "new"</T>
      </Box>
      <Arrow x1={50} y1={100} x2={80} y2={126} color={tok('brand')} />
      <Arrow x1={140} y1={100} x2={112} y2={126} color={tok('brand')} />
      <T x={206} y={30} size={12} fill={tok('muted')}>Both closures point</T>
      <T x={206} y={48} size={12} fill={tok('muted')}>at ONE environment.</T>
      <T x={206} y={84} size={12} fill={tok('muted')}>set wrote v there;</T>
      <T x={206} y={102} size={12} fill={tok('muted')}>get reads it there.</T>
      <T x={206} y={150} size={12} fill={tok('muted')}>It lives as long as</T>
      <T x={206} y={168} size={12} fill={tok('muted')}>either function does.</T>
    </Svg>
  );
}
