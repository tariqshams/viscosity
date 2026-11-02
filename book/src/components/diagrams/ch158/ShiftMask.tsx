import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 158: why a power-of-two block size turns i / B and i % B into a
// shift and a mask. Element 13 with blocks of 4: its binary digits 1101
// split into 11 (the block, 13 >> 2 = 3) and 01 (the lane, 13 & 3 = 1).
// Field y (k = 1) of the {x, y, vx} records then sits at
// 3 * 12 + 1 * 4 + 1 = 41, the expression emit.rs writes:
// ((i) >> 2) * 12 + 4 + ((i) & 3).
const BITS = ['1', '1', '0', '1'];

export default function ShiftMask() {
  const bw = 40;
  const x0 = 120;
  return (
    <Svg w={400} h={240} title="Element 13 in binary, split into a block number by a shift and a lane by a mask">
      <T x={8} y={20} size={12} weight={700}>i = 13 =</T>
      {BITS.map((b, k) => (
        <Box key={k} x={x0 + k * bw} y={4} w={bw - 4} h={32} fill={k < 2 ? tok('brand', 0.15) : tok('f2', 0.2)} stroke={k < 2 ? tok('brand') : tok('f2')}>
          <T x={x0 + k * bw + (bw - 4) / 2} y={20} size={16} mono anchor="middle" weight={700}>{b}</T>
        </Box>
      ))}
      <line x1={x0 + 2 * bw - 2} y1={0} x2={x0 + 2 * bw - 2} y2={44} stroke={tok('danger')} strokeWidth={2} strokeDasharray="4 3" />
      <T x={x0 + bw - 2} y={56} size={11} anchor="middle" fill={tok('brand')}>block bits</T>
      <T x={x0 + 3 * bw - 2} y={56} size={11} anchor="middle" fill={tok('f2')}>lane bits</T>
      <T x={8} y={86} size={12} mono>13 &gt;&gt; 2 = 0b11 = 3</T>
      <T x={210} y={86} size={11} fill={tok('muted')}>block (13 / 4, rounded down)</T>
      <T x={8} y={108} size={12} mono>13 &amp; 3 = 0b01 = 1</T>
      <T x={210} y={108} size={11} fill={tok('muted')}>lane (13 % 4)</T>
      <Box x={4} y={124} w={392} h={44} fill={tok('safe', 0.1)} stroke={tok('safe')}>
        <T x={12} y={138} size={11} fill={tok('muted')}>field y (k = 1) of element 13:</T>
        <T x={12} y={156} size={12} mono>3 × 12 + 1 × 4 + 1 = 41</T>
      </Box>
      <Box x={4} y={180} w={392} h={52} fill={tok('warn', 0.1)} stroke={tok('warn')}>
        <T x={12} y={196} size={11} fill={tok('muted')}>blocks of 6: no line between the bits works</T>
        <T x={12} y={216} size={12} mono>13 / 6 → 2 rest 1: a real division</T>
      </Box>
    </Svg>
  );
}
