import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

/** Differential testing: one input, two implementations, compare. */
export default function DiffFlow() {
  return (
    <Svg w={400} h={232} title="A loop. A random input such as [-4, -2] goes to both max and maxSlow. max says 0, maxSlow says -2. The results are compared: if they agree, make another input; if they disagree, report the input.">
      <Box x={130} y={6} w={140} h={36} r={8} fill={tok('brand', 0.1)} stroke={tok('brand')}>
        <T x={200} y={19} size={12} weight={700} anchor="middle">random input</T>
        <T x={200} y={33} size={11} mono anchor="middle" fill={tok('muted')}>[-4, -2]</T>
      </Box>
      <Arrow x1={170} y1={42} x2={90} y2={76} width={1.5} />
      <Arrow x1={230} y1={42} x2={310} y2={76} width={1.5} />
      <Box x={20} y={78} w={140} h={40} r={8}>
        <T x={90} y={92} size={12} mono weight={700} anchor="middle">max (fast)</T>
        <T x={90} y={108} size={12} mono anchor="middle" fill={tok('danger')}>→ 0</T>
      </Box>
      <Box x={240} y={78} w={140} h={40} r={8}>
        <T x={310} y={92} size={12} mono weight={700} anchor="middle">maxSlow (simple)</T>
        <T x={310} y={108} size={12} mono anchor="middle" fill={tok('safe')}>→ -2</T>
      </Box>
      <Arrow x1={90} y1={118} x2={176} y2={148} width={1.5} />
      <Arrow x1={310} y1={118} x2={224} y2={148} width={1.5} />
      <Box x={140} y={150} w={120} h={30} r={15} fill={tok('accent', 0.12)} stroke={tok('accent')}>
        <T x={200} y={165.5} size={12} mono weight={700} anchor="middle">a === b ?</T>
      </Box>
      <Arrow x1={140} y1={165} x2={62} y2={165} width={1.5} />
      <T x={6} y={190} size={11} weight={700} fill={tok('safe')}>agree: make</T>
      <T x={6} y={204} size={11} weight={700} fill={tok('safe')}>another input ↺</T>
      <Arrow x1={260} y1={165} x2={330} y2={165} width={1.5} />
      <T x={394} y={190} size={11} weight={700} anchor="end" fill={tok('danger')}>disagree: report</T>
      <T x={394} y={204} size={11} weight={700} anchor="end" fill={tok('danger')}>the input [-4, -2]</T>
      <T x={200} y={226} size={11} anchor="middle" fill={tok('muted')}>no expected answers needed, so the inputs can be endless</T>
    </Svg>
  );
}
