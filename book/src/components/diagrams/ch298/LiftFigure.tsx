import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 298: the two ways to remove a free variable, and when each one
// is allowed.
export default function LiftFigure() {
  return (
    <Svg w={400} h={232} title="One nested function go with free variables n and k, rewritten by closure conversion into go(env, i) with a record, or by lambda lifting into go(i, n, k)">
      <Box x={100} y={4} w={200} h={46}>
        <T x={200} y={20} size={12} mono anchor="middle">go(i) uses n and k</T>
        <T x={200} y={38} size={11} anchor="middle" fill={tok('muted')}>(free variables)</T>
      </Box>
      <T x={98} y={68} size={11} anchor="end" fill={tok('muted')}>may escape?</T>
      <T x={302} y={68} size={11} fill={tok('muted')}>only called?</T>
      <Box x={4} y={84} w={190} h={110} fill={tok('brand', 0.08)} stroke={tok('brand')}>
        <T x={14} y={102} size={12} weight={700}>closure conversion</T>
        <T x={14} y={124} size={12} mono>go(env, i)</T>
        <T x={14} y={144} size={12} mono>env = {'{ n, k }'}</T>
        <T x={14} y={166} size={11} fill={tok('muted')}>allocates a record;</T>
        <T x={14} y={182} size={11} fill={tok('muted')}>works everywhere</T>
      </Box>
      <Box x={206} y={84} w={190} h={110} fill={tok('f3', 0.1)} stroke={tok('f3')}>
        <T x={216} y={102} size={12} weight={700}>lambda lifting</T>
        <T x={216} y={124} size={12} mono>go(i, n, k)</T>
        <T x={216} y={144} size={12} mono>at the top level</T>
        <T x={216} y={166} size={11} fill={tok('muted')}>no allocation;</T>
        <T x={216} y={182} size={11} fill={tok('muted')}>callers must know n, k</T>
      </Box>
      <path d="M150,50 L100,84" stroke={tok('ink', 0.5)} fill="none" strokeWidth={1.5} />
      <path d="M250,50 L300,84" stroke={tok('ink', 0.5)} fill="none" strokeWidth={1.5} />
      <T x={200} y={218} size={11} anchor="middle" fill={tok('muted')}>Either way, no function is left with a free variable.</T>
    </Svg>
  );
}
