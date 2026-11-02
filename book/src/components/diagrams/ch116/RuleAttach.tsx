// One production with its semantic rule: the parent's val is computed
// from the vals of two of its children.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

export default function RuleAttach() {
  return (
    <Svg w={400} h={176} title="The rule E → E₁ + T drawn as a parent with three children; arrows run from E₁.val and T.val up to E.val, labelled with the rule E.val = E₁.val + T.val">
      <T x={200} y={14} size={13} mono anchor="middle" weight={700}>E → E₁ + T     E.val = E₁.val + T.val</T>
      <Box x={150} y={34} w={100} h={30} r={14} fill={tok('brand', 0.12)} stroke={tok('brand')}>
        <T x={200} y={50} size={13} mono anchor="middle" weight={700}>E  val = 9</T>
      </Box>
      <line x1={200} y1={64} x2={70} y2={118} stroke={tok('ink', 0.4)} strokeWidth={1.3} />
      <line x1={200} y1={64} x2={200} y2={118} stroke={tok('ink', 0.4)} strokeWidth={1.3} />
      <line x1={200} y1={64} x2={330} y2={118} stroke={tok('ink', 0.4)} strokeWidth={1.3} />
      <Box x={18} y={118} w={104} h={30} r={14} fill={tok('brand', 0.12)} stroke={tok('brand')}>
        <T x={70} y={134} size={13} mono anchor="middle" weight={700}>E₁  val = 4</T>
      </Box>
      <Box x={184} y={118} w={32} h={30} r={3}>
        <T x={200} y={134} size={13} mono anchor="middle">+</T>
      </Box>
      <Box x={278} y={118} w={104} h={30} r={14} fill={tok('brand', 0.12)} stroke={tok('brand')}>
        <T x={330} y={134} size={13} mono anchor="middle" weight={700}>T  val = 5</T>
      </Box>
      <Arrow x1={96} y1={116} x2={160} y2={68} color={tok('accent')} bend={0.3} />
      <Arrow x1={304} y1={116} x2={240} y2={68} color={tok('accent')} bend={-0.3} />
      <T x={200} y={166} size={11} anchor="middle" fill={tok('muted')}>values flow up: the parent is computed from its children</T>
    </Svg>
  );
}
