import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 283: what a stackless and a stackful coroutine save when they
// pause three calls deep.
export default function TwoKinds() {
  const objs = ['main*', 'walk*', 'visit*'];
  const frames = ['main', 'walk', 'visit'];
  return (
    <Svg w={400} h={226} title="Left: a stackless coroutine needs one saved state object per level, linked by yield-star or await. Right: a stackful coroutine keeps every frame on its own stack and saves one stack pointer.">
      <T x={98} y={12} size={12} weight={700} anchor="middle">stackless</T>
      <T x={300} y={12} size={12} weight={700} anchor="middle">stackful</T>
      {objs.map((o, k) => (
        <g key={o}>
          <Box x={28} y={28 + k * 54} w={140} h={36} fill={tok('f2', 0.1)} stroke={tok('f2')}>
            <T x={98} y={41 + k * 54} size={12} mono anchor="middle">{o}</T>
            <T x={98} y={56 + k * 54} size={11} anchor="middle" fill={tok('muted')}>state + locals</T>
          </Box>
          {k < 2 && <Arrow x1={98} y1={64 + k * 54} x2={98} y2={82 + k * 54} color={tok('f2')} />}
        </g>
      ))}
      <Box x={230} y={28} w={140} h={144} fill="transparent" stroke={tok('f3')} />
      {frames.map((f, k) => (
        <Box key={f} x={240} y={136 - k * 40} w={120} h={30} fill={tok('panel')} stroke={tok('ink', 0.4)}>
          <T x={300} y={151 - k * 40} size={12} mono anchor="middle">{f}</T>
        </Box>
      ))}
      <T x={300} y={186} size={11} anchor="middle" fill={tok('muted')}>its own stack;</T>
      <T x={300} y={200} size={11} anchor="middle" fill={tok('muted')}>pausing saves one sp</T>
      <T x={98} y={200} size={11} anchor="middle" fill={tok('muted')}>every level is marked</T>
      <T x={98} y={214} size={11} anchor="middle" fill={tok('muted')}>(yield* or await)</T>
    </Svg>
  );
}
