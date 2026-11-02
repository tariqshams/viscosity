import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const FRAMES = ['top-level code', 'forever(0)', 'forever(1)', 'forever(2)', '…', 'forever(n)'];

/** A call stack that never stops growing, up to the engine's limit. */
export default function OverflowPicture() {
  const H = 24;
  const base = 222;
  return (
    <Svg w={400} h={232} title="A call stack with frames for forever(0), forever(1), forever(2) and so on piled on top of each other until they reach a dashed line marking the stack's limit, where the engine stops with a RangeError.">
      <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>THE CALL STACK, WITH NO BASE CASE</T>
      <line x1={8} y1={52} x2={250} y2={52} stroke={tok('danger')} strokeWidth={2} strokeDasharray="6 4" />
      <T x={8} y={42} size={11} weight={700} fill={tok('danger')}>the stack's limit</T>
      {FRAMES.map((f, k) => {
        const y = base - (k + 1) * (H + 4);
        const top = k === FRAMES.length - 1;
        const gap = f === '…';
        return gap ? (
          <T key={k} x={128} y={y + H / 2} size={16} anchor="middle" fill={tok('muted')}>⋮</T>
        ) : (
          <Box key={k} x={8} y={y} w={240} h={H} fill={top ? tok('danger', 0.14) : tok('panel')} stroke={top ? tok('danger') : tok('ink', 0.4)}>
            <T x={20} y={y + H / 2} size={12} mono weight={k === 0 ? 400 : 700} fill={k === 0 ? tok('muted') : undefined}>{f}</T>
            {k > 0 && <T x={238} y={y + H / 2} size={11} mono anchor="end" fill={top ? tok('danger') : tok('muted')}>{top ? 'no room' : 'waiting'}</T>}
          </Box>
        );
      })}
      <Arrow x1={268} y1={200} x2={268} y2={70} color={tok('ink', 0.5)} />
      <T x={280} y={130} size={11} fill={tok('muted')}>every call</T>
      <T x={280} y={145} size={11} fill={tok('muted')}>pushes a frame;</T>
      <T x={280} y={160} size={11} fill={tok('muted')}>none ever pops</T>
      <T x={392} y={30} size={11} mono weight={700} anchor="end" fill={tok('danger')}>RangeError: Maximum call</T>
      <T x={392} y={44} size={11} mono weight={700} anchor="end" fill={tok('danger')}>stack size exceeded</T>
    </Svg>
  );
}
