// How the RISC-V integer calling convention (psABI) passes three kinds of
// argument on RV64: a long in one register, a 16-byte struct in a register
// pair, and a 24-byte struct by reference (clang 18 -O2, rv64im: callq
// stores the struct at 0(sp) and passes `mv a0, sp`).
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

export default function ArgsFigure() {
  return (
    <Svg w={400} h={232} title="A long goes in a0; a two-field struct goes in a0 and a1; a three-field struct is copied to memory and its address goes in a0">
      <T x={8} y={14} size={11} weight={700} fill={tok('muted')}>ARGUMENT</T>
      <T x={236} y={14} size={11} weight={700} fill={tok('muted')}>WHERE IT GOES</T>

      <Box x={8} y={26} w={180} h={34} fill={tok('f1', 0.18)} stroke={tok('f1')}>
        <T x={18} y={43} size={12} mono>long x  (8 bytes)</T>
      </Box>
      <Arrow x1={190} y1={43} x2={232} y2={43} />
      <Box x={236} y={26} w={60} h={34} fill={tok('paper')} stroke={tok('ink', 0.5)}>
        <T x={266} y={43} size={13} mono anchor="middle">a0</T>
      </Box>

      <Box x={8} y={78} w={180} h={34} fill={tok('f2', 0.18)} stroke={tok('f2')}>
        <T x={18} y={95} size={12} mono>{'{ x, vx }  (16 bytes)'}</T>
      </Box>
      <Arrow x1={190} y1={95} x2={232} y2={95} />
      <Box x={236} y={78} w={60} h={34} fill={tok('paper')} stroke={tok('ink', 0.5)}>
        <T x={266} y={95} size={13} mono anchor="middle">a0: x</T>
      </Box>
      <Box x={300} y={78} w={70} h={34} fill={tok('paper')} stroke={tok('ink', 0.5)}>
        <T x={335} y={95} size={13} mono anchor="middle">a1: vx</T>
      </Box>

      <Box x={8} y={130} w={180} h={34} fill={tok('f3', 0.18)} stroke={tok('f3')}>
        <T x={18} y={147} size={12} mono>{'{ a, b, c }  (24 bytes)'}</T>
      </Box>
      <Arrow x1={190} y1={147} x2={232} y2={147} />
      <Box x={236} y={130} w={60} h={34} fill={tok('paper')} stroke={tok('ink', 0.5)}>
        <T x={266} y={147} size={12} mono anchor="middle">a0: &amp;q</T>
      </Box>
      <Arrow x1={266} y1={166} x2={266} y2={186} color={tok('accent')} />
      {['a', 'b', 'c'].map((f, k) => (
        <Box key={f} x={200 + k * 64} y={190} w={60} h={28} fill={tok('f3', 0.12)} stroke={tok('f3')}>
          <T x={230 + k * 64} y={204} size={12} mono anchor="middle">{f}</T>
        </Box>
      ))}
      <T x={8} y={204} size={11} fill={tok('muted')}>a copy in the caller’s</T>
      <T x={8} y={219} size={11} fill={tok('muted')}>frame; a0 holds its address</T>
      <T x={392} y={228} size={11} anchor="end" fill={tok('muted')}>at 0(sp), 8(sp), 16(sp)</T>
    </Svg>
  );
}
