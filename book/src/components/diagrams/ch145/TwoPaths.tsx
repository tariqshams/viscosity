// Chapter 145: the two ways drip-rs reaches a method. `c.taste()` compiles
// to one `invoke` (Vm::invoke: fields, then the class's methods, then a
// direct call, no allocation); `let t = c.taste;` compiles to `get.prop`,
// which allocates an ObjBoundMethod, and `t()` to `call`, whose
// BoundMethod arm puts the receiver in slot 0 (book/companion/rust/src/
// vm.rs). Opcodes are from `drip-rs --disassemble` of the Cake program.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

function Step({ x, y, w, text, sub, tone }: { x: number; y: number; w: number; text: string; sub?: string; tone: string }) {
  return (
    <Box x={x} y={y} w={w} h={sub ? 42 : 28} r={4} fill={tok(tone, 0.1)} stroke={tok(tone)}>
      <T x={x + 8} y={y + 14} size={11} mono>{text}</T>
      {sub && <T x={x + 8} y={y + 31} size={11} fill={tok('muted')}>{sub}</T>}
    </Box>
  );
}

export default function TwoPaths() {
  return (
    <Svg w={400} h={236} title="c.taste() is one invoke with no allocation; c.taste on its own makes a bound method, which a later call unpacks into slot 0">
      <T x={8} y={14} size={12} weight={700}>c.taste()</T>
      <Step x={8} y={24} w={150} text="invoke 'taste' (0)" tone="safe" />
      <Arrow x1={158} y1={38} x2={196} y2={38} color={tok('safe')} />
      <Step x={198} y={24} w={194} text="call(taste, 0)" sub="c is already in slot 0" tone="safe" />
      <T x={8} y={86} size={11} fill={tok('muted')}>no bound method, no allocation</T>

      <T x={8} y={118} size={12} weight={700}>let t = c.taste;   then   t()</T>
      <Step x={8} y={128} w={150} text="get.prop 'taste'" sub="alloc a bound method" tone="accent" />
      <Arrow x1={158} y1={149} x2={196} y2={149} color={tok('accent')} />
      <Step x={198} y={128} w={194} text="{ receiver: c," sub="method: taste }" tone="accent" />
      <Arrow x1={295} y1={170} x2={295} y2={188} color={tok('accent')} />
      <Step x={8} y={190} w={150} text="call 0" tone="brand" />
      <Arrow x1={158} y1={204} x2={196} y2={204} color={tok('brand')} />
      <Step x={198} y={190} w={194} text="slot 0 = c; call(taste, 0)" tone="brand" />
    </Svg>
  );
}
