// Chapter 299: the layout of a ZGC coloured pointer (zpointer) in
// OpenJDK 21, from the comment in src/hotspot/share/gc/z/zAddress.hpp:
// address bits, then two low-order metadata bytes laid out as
// RRRRMMmmFFrr0000 (remapped, marked old, marked young, finalizable,
// remembered, reserved).
import { Box, Svg, T, tok } from '../../viz/svg';

const META = [
  { b: 'RRRR', n: 'remapped', c: 'f1', use: 'load' },
  { b: 'MM', n: 'marked old', c: 'f2', use: 'mark' },
  { b: 'mm', n: 'marked young', c: 'f3', use: 'mark' },
  { b: 'FF', n: 'finalizable', c: 'f4', use: 'mark' },
  { b: 'rr', n: 'remembered', c: 'f5', use: 'store' },
  { b: '0000', n: 'reserved', c: 'line', use: '' },
];

export default function ColouredPointer() {
  let x = 128;
  const cells = META.map((m) => {
    const w = m.b.length * 16;
    const cell = { ...m, x, w };
    x += w;
    return cell;
  });
  return (
    <Svg w={400} h={200} title="A ZGC pointer: address bits on the left, then sixteen metadata bits: four remapped bits, two marked-old, two marked-young, two finalizable, two remembered and four reserved.">
      <T x={8} y={14} size={11} weight={700} fill={tok('muted')}>ONE 64-BIT ZGC POINTER (OpenJDK 21)</T>
      <Box x={8} y={30} w={118} h={34} r={3} fill={tok('panel')} stroke={tok('ink', 0.5)}>
        <T x={67} y={47} size={12} mono anchor="middle">aaa…aaa</T>
      </Box>
      <T x={67} y={78} size={11} anchor="middle" fill={tok('muted')}>address</T>
      {cells.map((c) => (
        <g key={c.n}>
          <Box x={c.x} y={30} w={c.w - 2} h={34} r={3} fill={tok(c.c, 0.25)} stroke={tok(c.c)}>
            <T x={c.x + (c.w - 2) / 2} y={47} size={12} mono anchor="middle">{c.b}</T>
          </Box>
        </g>
      ))}
      {cells.map((c, k) => (
        <g key={c.n + 'l'}>
          <line x1={c.x + c.w / 2} x2={c.x + c.w / 2} y1={66} y2={k === 5 ? 84 + k * 16 : 92 + k * 16} stroke={tok(c.c)} strokeWidth={1.5} />
          <T x={k === 5 ? 396 : c.x + c.w / 2 + 4} y={92 + k * 16} size={11} anchor={k === 5 ? 'end' : 'start'}>{c.n}</T>
        </g>
      ))}
      <T x={8} y={110} size={11} fill={tok('muted')}>The load barrier</T>
      <T x={8} y={124} size={11} fill={tok('muted')}>tests the bits for</T>
      <T x={8} y={138} size={11} fill={tok('muted')}>this phase, then</T>
      <T x={8} y={152} size={11} fill={tok('muted')}>shifts them away.</T>
      <T x={8} y={190} size={11} fill={tok('muted')}>two low bytes of metadata: RRRRMMmmFFrr0000</T>
    </Svg>
  );
}
