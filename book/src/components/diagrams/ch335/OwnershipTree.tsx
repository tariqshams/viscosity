// Chapter 335: ownership is a tree. A Vec<String> owns a heap buffer of
// String headers, and each String owns its own heap text. The variable is
// the root; dropping it drops everything below it, once.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

export default function OwnershipTree() {
  return (
    <Svg w={400} h={190} title="A Vec of Strings: the variable owns the buffer, the buffer owns the Strings, each String owns its text">
      <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>STACK</T>
      <T x={150} y={12} size={11} weight={700} fill={tok('muted')}>HEAP</T>
      <T x={8} y={44} size={13} mono weight={700}>names</T>
      <Box x={8} y={52} w={124} h={26} fill={tok('panel')} stroke={tok('brand')}>
        <T x={70} y={65} size={11} mono anchor="middle">ptr len=2 cap=2</T>
      </Box>
      <Arrow x1={132} y1={65} x2={150} y2={65} color={tok('brand')} />
      <Box x={152} y={30} w={104} h={80} fill={tok('accent', 0.08)} stroke={tok('accent')}>
        <T x={204} y={42} size={11} anchor="middle" fill={tok('muted')}>Vec buffer</T>
        <Box x={160} y={50} w={88} h={24} fill={tok('panel')} stroke={tok('ink', 0.4)}>
          <T x={204} y={62} size={11} mono anchor="middle">ptr len cap</T>
        </Box>
        <Box x={160} y={80} w={88} h={24} fill={tok('panel')} stroke={tok('ink', 0.4)}>
          <T x={204} y={92} size={11} mono anchor="middle">ptr len cap</T>
        </Box>
      </Box>
      <Arrow x1={248} y1={62} x2={300} y2={44} color={tok('ink', 0.6)} />
      <Arrow x1={248} y1={92} x2={300} y2={98} color={tok('ink', 0.6)} />
      <Box x={302} y={32} w={70} h={26} fill={tok('accent', 0.12)} stroke={tok('accent')}>
        <T x={337} y={45} size={13} mono anchor="middle">"fib"</T>
      </Box>
      <Box x={302} y={86} w={70} h={26} fill={tok('accent', 0.12)} stroke={tok('accent')}>
        <T x={337} y={99} size={13} mono anchor="middle">"vm"</T>
      </Box>
      <T x={8} y={140} size={12} weight={700}>One owner per arrow, so the arrows form a tree.</T>
      <T x={8} y={160} size={11} fill={tok('muted')}>When names is dropped, everything it owns is dropped</T>
      <T x={8} y={176} size={11} fill={tok('muted')}>with it: both texts and the buffer, each exactly once.</T>
    </Svg>
  );
}
