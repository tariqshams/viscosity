// (λx. z) Ω under two strategies: normal order reduces the outer redex
// and finishes at once; call by value tries to finish the argument first,
// and Ω reduces to itself for ever.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

export default function StrategyFork() {
  return (
    <Svg w={400} h={232} title="(λx. z) Ω at the top. Left branch, normal order: one step to z, a normal form. Right branch, call by value: Ω steps to Ω, and a loop arrow shows it never finishes.">
      <T x={200} y={14} size={11} anchor="middle" fill={tok('muted')}>Ω is (λx. x x) (λx. x x), which reduces to itself</T>
      <Box x={120} y={26} w={160} h={30} fill={tok('brand', 0.1)} stroke={tok('brand')}>
        <T x={200} y={42} size={15} mono anchor="middle" weight={700}>(λx. z) Ω</T>
      </Box>
      <Arrow x1={170} y1={58} x2={90} y2={128} color={tok('safe')} />
      <Arrow x1={230} y1={58} x2={310} y2={128} color={tok('danger')} />
      <T x={60} y={82} size={12} weight={700} fill={tok('safe')}>normal order</T>
      <T x={48} y={98} size={11} fill={tok('muted')}>outer redex first</T>
      <T x={282} y={82} size={12} weight={700} fill={tok('danger')}>call by value</T>
      <T x={286} y={98} size={11} fill={tok('muted')}>argument first</T>
      <Box x={50} y={130} w={80} h={30} fill={tok('safe', 0.12)} stroke={tok('safe')}>
        <T x={90} y={146} size={15} mono anchor="middle" weight={700}>z</T>
      </Box>
      <T x={90} y={176} size={11} anchor="middle" fill={tok('safe')}>a normal form, in one step</T>
      <Box x={250} y={130} w={120} h={30} fill={tok('danger', 0.1)} stroke={tok('danger')}>
        <T x={310} y={146} size={15} mono anchor="middle" weight={700}>(λx. z) Ω</T>
      </Box>
      <path d="M370,138 C398,120 398,170 370,152" fill="none" stroke={tok('danger')} strokeWidth={2} />
      <polygon points="370,152 379,149 376,158" fill={tok('danger')} />
      <T x={310} y={176} size={11} anchor="middle" fill={tok('danger')}>Ω → Ω → Ω → … for ever</T>
      <T x={200} y={210} size={11} anchor="middle" fill={tok('muted')}>same term, same rule; only the choice of redex differs</T>
    </Svg>
  );
}
