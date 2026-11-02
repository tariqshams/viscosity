// The ISA as a contract: software above it is written against the
// contract; any chip below it that keeps the contract can run that software.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

export default function IsaLayers() {
  const chips = ['a tiny core in', 'a laptop core', 'a big server'];
  const chips2 = ['a smart sensor', '', 'core'];
  return (
    <Svg w={400} h={262} title="Software on top (compilers, operating systems, programs) uses the ISA; below it, three different chips all implement the same ISA">
      <T x={8} y={14} size={11} weight={700} fill={tok('muted')}>SOFTWARE: uses the contract</T>
      {['compiler output', 'operating system', 'your program'].map((t, k) => (
        <Box key={t} x={8 + k * 130} y={24} w={122} h={36} fill={tok('f1', 0.18)} stroke={tok('f1')}>
          <T x={69 + k * 130} y={42} size={12} anchor="middle">{t}</T>
        </Box>
      ))}
      {[0, 1, 2].map((k) => <Arrow key={k} x1={69 + k * 130} y1={62} x2={69 + k * 130} y2={92} />)}
      <Box x={8} y={96} w={384} h={62} fill={tok('brand', 0.14)} stroke={tok('brand')}>
        <T x={200} y={114} size={13} weight={700} anchor="middle" fill={tok('brand')}>THE ISA (here RISC-V RV64IM)</T>
        <T x={200} y={134} size={11.5} anchor="middle">registers x0–x31 and pc · every instruction,</T>
        <T x={200} y={149} size={11.5} anchor="middle">its bit encoding and what it does to them</T>
      </Box>
      {[0, 1, 2].map((k) => <Arrow key={k} x1={69 + k * 130} y1={160} x2={69 + k * 130} y2={176} />)}
      <T x={8} y={186} size={11} weight={700} fill={tok('muted')}>HARDWARE: keeps the contract</T>
      {chips.map((t, k) => (
        <Box key={t} x={8 + k * 130} y={196} w={122} h={44} fill={tok('f2', 0.18)} stroke={tok('f2')}>
          <T x={69 + k * 130} y={chips2[k] ? 211 : 218} size={12} anchor="middle">{t}</T>
          {chips2[k] && <T x={69 + k * 130} y={226} size={12} anchor="middle">{chips2[k]}</T>}
        </Box>
      ))}
      <T x={200} y={254} size={11} anchor="middle" fill={tok('muted')}>one machine code; different makers, sizes and speeds</T>
    </Svg>
  );
}
