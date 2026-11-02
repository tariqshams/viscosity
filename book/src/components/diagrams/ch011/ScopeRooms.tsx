import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

/** Scopes as nested rooms: code inside a room can see out, never in. */
export default function ScopeRooms() {
  return (
    <Svg w={400} h={236} title="Three nested scopes. The whole program holds rate and price. Inside it, the function price holds n. Inside that, an if block holds extra. Code in an inner room can see the names of every room around it, but not the other way round.">
      <Box x={6} y={6} w={388} h={224} r={10} fill={tok('accent', 0.06)} stroke={tok('accent')}>
        <T x={18} y={24} size={11} weight={700} fill={tok('accent')}>THE PROGRAM</T>
        <T x={18} y={44} size={13} mono>const rate = 2;</T>
        <Box x={18} y={58} w={364} h={160} r={8} fill={tok('brand', 0.07)} stroke={tok('brand')}>
          <T x={30} y={76} size={11} weight={700} fill={tok('brand')}>INSIDE function price(n)</T>
          <T x={30} y={96} size={13} mono>n</T>
          <Box x={30} y={110} w={200} h={96} r={6} fill={tok('safe', 0.08)} stroke={tok('safe')}>
            <T x={42} y={128} size={11} weight={700} fill={tok('safe')}>INSIDE if (n &gt; 9) {'{ }'}</T>
            <T x={42} y={150} size={13} mono>const extra = 1;</T>
            <T x={42} y={176} size={12} fill={tok('muted')}>sees extra, n, rate</T>
          </Box>
          <Arrow x1={232} y1={150} x2={300} y2={100} color={tok('safe')} />
          <T x={248} y={170} size={12} fill={tok('muted')}>looks outward:</T>
          <T x={248} y={188} size={12} fill={tok('muted')}>sees n, rate</T>
          <T x={248} y={204} size={12} weight={700} fill={tok('danger')}>never extra</T>
        </Box>
      </Box>
    </Svg>
  );
}
