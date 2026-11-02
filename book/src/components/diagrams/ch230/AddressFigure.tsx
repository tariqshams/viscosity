// Where ps[2].vx lives in the two layouts the book is about.
// AoS: base + i*16 + 8 (clang: slli a1, a1, 4; add; ld a0, 8(a0)).
// SoA: vxs + i*8      (clang: slli a1, a1, 3; add; ld a0, 0(a0)).
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

export default function AddressFigure() {
  const aos = ['x0', 'vx0', 'x1', 'vx1', 'x2', 'vx2'];
  const col = (n: string) => (n.startsWith('vx') ? 'f3' : 'f1');
  return (
    <Svg w={400} h={232} title="In an array of structs, ps[2].vx is at base plus 2 times 16 plus 8, which is base plus 40. In a struct of arrays, vxs[2] is at vxs plus 2 times 8, which is vxs plus 16.">
      <T x={8} y={14} size={11} weight={700} fill={tok('muted')}>ARRAY OF STRUCTS: ps[i] is 16 bytes</T>
      {aos.map((n, k) => (
        <g key={n}>
          <Box x={8 + k * 64} y={24} w={60} h={28} fill={tok(col(n), n === 'vx2' ? 0.5 : 0.15)} stroke={tok(col(n))}>
            <T x={38 + k * 64} y={38} size={12} mono anchor="middle">{n}</T>
          </Box>
          <T x={38 + k * 64} y={64} size={11} mono anchor="middle" fill={tok('muted')}>+{k * 8}</T>
        </g>
      ))}
      <Arrow x1={358} y1={92} x2={358} y2={70} color={tok('accent')} />
      <T x={8} y={100} size={12} mono>ps[2].vx = base + 2×16 + 8 = base + 40</T>

      <T x={8} y={130} size={11} weight={700} fill={tok('muted')}>STRUCT OF ARRAYS: one column per field</T>
      {['x0', 'x1', 'x2'].map((n, k) => (
        <Box key={n} x={40 + k * 64} y={140} w={60} h={24} fill={tok('f1', 0.15)} stroke={tok('f1')}>
          <T x={70 + k * 64} y={152} size={12} mono anchor="middle">{n}</T>
        </Box>
      ))}
      <T x={8} y={152} size={11} mono fill={tok('muted')}>xs</T>
      {['vx0', 'vx1', 'vx2'].map((n, k) => (
        <g key={n}>
          <Box x={40 + k * 64} y={170} w={60} h={24} fill={tok('f3', n === 'vx2' ? 0.5 : 0.15)} stroke={tok('f3')}>
            <T x={70 + k * 64} y={182} size={12} mono anchor="middle">{n}</T>
          </Box>
          <T x={70 + k * 64} y={204} size={11} mono anchor="middle" fill={tok('muted')}>+{k * 8}</T>
        </g>
      ))}
      <T x={8} y={182} size={11} mono fill={tok('muted')}>vxs</T>
      <T x={8} y={224} size={12} mono>vxs[2] = vxs + 2×8 = vxs + 16</T>
    </Svg>
  );
}
