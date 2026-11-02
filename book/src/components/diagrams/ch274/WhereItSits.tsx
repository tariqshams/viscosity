import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Where an annotation sits among the planner's rules, in the order plan()
// in engine/ts/packages/core/src/plan.ts checks them: safety first (an
// annotation cannot reach past it), then the annotation, then the rules it
// skips (opt-in, Python, and the three cost rules).
export default function WhereItSits() {
  const band = (y: number, h: number, title: string, sub: string, color: string, fill: string) => (
    <Box x={8} y={y} w={262} h={h} stroke={color} fill={fill}>
      <T x={20} y={y + 17} size={13} weight={700}>{title}</T>
      <T x={20} y={y + 36} size={11} fill={tok('muted')}>{sub}</T>
    </Box>
  );
  return (
    <Svg w={400} h={232} title="Safety on top, the annotation below it, and the cost rules below that, which the annotation skips">
      {band(8, 50, '1. Safety (bailouts)', 'unsafe: … keeps the objects', tok('danger'), tok('danger', 0.1))}
      {band(74, 50, '2. @viscosity annotation', 'aos, soa or aosoa(N), as told', tok('brand'), tok('brand', 0.14))}
      {band(140, 84, '3. Opt-in, Python, cost rules', 'numeric? loop? at least 64?', tok('ink', 0.45), 'transparent')}
      <T x={20} y={210} size={11} fill={tok('muted')}>(the planner’s guesses)</T>
      <Arrow x1={300} y1={92} x2={300} y2={50} color={tok('danger')} dash />
      <T x={306} y={66} size={11} fill={tok('danger')}>cannot</T>
      <T x={306} y={80} size={11} fill={tok('danger')}>overrule</T>
      <Arrow x1={300} y1={112} x2={300} y2={176} color={tok('brand')} />
      <T x={306} y={140} size={11} fill={tok('brand')}>skips all</T>
      <T x={306} y={154} size={11} fill={tok('brand')}>of these</T>
    </Svg>
  );
}
