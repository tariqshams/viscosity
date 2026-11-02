// Chapter 405: the open upvalues, kept two ways. The TypeScript VM links
// them through `nextOpen`, highest stack slot first, starting from
// `openUpvalues` (companion/ts/src/vm/vm.ts, captureUpvalue). drip-rs
// keeps their handles in a Vec sorted by slot, lowest first, so the end
// of the Vec matches the top of the stack (companion/rust/src/vm.rs,
// capture_upvalue and close_upvalues). Slots 2, 5 and 7 are an example.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const SLOTS = [2, 5, 7];

export default function OpenList() {
  return (
    <Svg w={400} h={214} title="TypeScript links the open upvalues highest slot first; drip-rs keeps them in a Vec, lowest slot first, so both find the top of the stack at once">
      <T x={8} y={14} size={12} weight={700}>TypeScript: a linked list</T>
      <Box x={8} y={28} w={96} h={28} r={4} fill={tok('panel')} stroke={tok('accent')}>
        <T x={56} y={42} size={11} mono anchor="middle">openUpvalues</T>
      </Box>
      {[...SLOTS].reverse().map((s, k) => {
        const x = 130 + k * 92;
        return (
          <g key={s}>
            <Box x={x} y={28} w={70} h={28} r={4} fill={tok('brand', 0.1)} stroke={tok('brand')}>
              <T x={x + 35} y={42} size={11} mono anchor="middle">slot {s}</T>
            </Box>
            <Arrow x1={k === 0 ? 104 : x - 22} y1={42} x2={x} y2={42} color={tok('muted')} />
          </g>
        );
      })}
      <T x={8} y={74} size={11} fill={tok('muted')}>each object’s nextOpen points at the next one down</T>

      <T x={8} y={108} size={12} weight={700}>drip-rs: a sorted Vec of handles</T>
      {SLOTS.map((s, k) => {
        const x = 8 + k * 74;
        return (
          <g key={s}>
            <Box x={x} y={122} w={70} h={28} r={4} fill={tok('brand', 0.1)} stroke={tok('brand')}>
              <T x={x + 35} y={136} size={11} mono anchor="middle">slot {s}</T>
            </Box>
            <T x={x + 35} y={162} size={11} mono anchor="middle" fill={tok('muted')}>[{k}]</T>
          </g>
        );
      })}
      <Arrow x1={300} y1={136} x2={232} y2={136} color={tok('accent')} />
      <T x={306} y={130} size={11} fill={tok('accent')}>.last()</T>
      <T x={306} y={146} size={11} fill={tok('accent')}>.pop()</T>
      <T x={8} y={186} size={11} fill={tok('muted')}>capture searches from the end; close pops from the end;</T>
      <T x={8} y={202} size={11} fill={tok('muted')}>both stop at the first slot below the one they want</T>
    </Svg>
  );
}
