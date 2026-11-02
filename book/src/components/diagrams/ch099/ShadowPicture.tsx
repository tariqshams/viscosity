import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

/** Two environments, a shadowed name, and two lookups walking the chain. */
export default function ShadowPicture() {
  return (
    <Svg w={400} h={230} title="A block's environment with its own a, whose parent is the globals with another a and a b. Looking up a stops in the block, hiding the global a; looking up b misses in the block and walks to the globals.">
      <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>GLOBALS (no parent)</T>
      <Box x={8} y={22} w={230} h={56} fill={tok('panel')} stroke={tok('ink', 0.4)}>
        <T x={22} y={40} size={13} mono opacity={0.5}>a = "global"</T>
        <T x={130} y={40} size={11} fill={tok('muted')}>(hidden)</T>
        <T x={22} y={62} size={13} mono weight={700} fill={tok('safe')}>b = 2</T>
      </Box>
      <T x={8} y={118} size={11} weight={700} fill={tok('brand')}>BLOCK (current)</T>
      <Box x={8} y={128} w={230} h={40} fill={tok('brand', 0.12)} stroke={tok('brand')}>
        <T x={22} y={148} size={13} mono weight={700} fill={tok('safe')}>a = "inner"</T>
      </Box>
      <Arrow x1={60} y1={126} x2={60} y2={82} color={tok('ink', 0.55)} />
      <T x={68} y={102} size={11} fill={tok('muted')}>parent</T>

      <T x={256} y={150} size={12} mono>look up a</T>
      <Arrow x1={254} y1={150} x2={150} y2={150} color={tok('safe')} />
      <T x={256} y={168} size={11} fill={tok('safe')}>found here: stop</T>

      <T x={256} y={196} size={12} mono>look up b</T>
      <Arrow x1={300} y1={186} x2={240} y2={160} color={tok('warn')} dash />
      <Arrow x1={244} y1={136} x2={244} y2={66} color={tok('warn')} bend={-0.4} />
      <T x={264} y={98} size={11} fill={tok('warn')}>not here,</T>
      <T x={264} y={112} size={11} fill={tok('warn')}>try the parent</T>
      <T x={256} y={214} size={11} fill={tok('safe')}>found in the globals</T>
    </Svg>
  );
}
