// Chapter 327: the two shapes of free memory. Above, one free run with
// top and limit (bump allocation). Below, the same 12 free words as holes
// of 3, 5 and 4 words linked into a free list; a 7-word request fails.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const W = 13;
const X = (a: number) => 14 + a * W;
const USED_TOP = [[0, 4], [4, 3], [7, 5], [12, 4]];
const ROW2: { at: number; n: number; free: boolean }[] = [
  { at: 0, n: 2, free: false }, { at: 2, n: 3, free: true }, { at: 5, n: 4, free: false }, { at: 9, n: 5, free: true },
  { at: 14, n: 3, free: false }, { at: 17, n: 4, free: true }, { at: 21, n: 7, free: false },
];

export default function BumpVsList() {
  return (
    <Svg w={400} h={226} title="Above: used objects then one free run from top to limit. Below: free holes of 3, 5 and 4 words between used objects, linked into a free list; a request for 7 words cannot be met.">
      <T x={8} y={14} size={11} weight={700} fill={tok('muted')}>AFTER COPYING OR COMPACTING</T>
      {USED_TOP.map(([a, n], k) => (
        <Box key={k} x={X(a) + 1} y={24} w={n * W - 2} h={26} r={2} fill={tok('safe', 0.3)} stroke={tok('safe')} />
      ))}
      <Box x={X(16) + 1} y={24} w={12 * W - 2} h={26} r={2} fill="transparent" stroke={tok('ink', 0.5)} dash>
        <T x={X(22)} y={37} size={11} anchor="middle" fill={tok('muted')}>free: 12 words</T>
      </Box>
      <line x1={X(16)} x2={X(16)} y1={20} y2={64} stroke={tok('brand')} strokeWidth={2} />
      <T x={X(16) + 3} y={70} size={11} weight={700} fill={tok('brand')}>top</T>
      <line x1={X(28)} x2={X(28)} y1={20} y2={64} stroke={tok('brand')} strokeWidth={2} />
      <T x={X(28) - 3} y={70} size={11} weight={700} anchor="end" fill={tok('brand')}>limit</T>
      <T x={8} y={98} size={11} weight={700} fill={tok('muted')}>AFTER SWEEPING</T>
      {ROW2.map((b, k) => (
        <Box key={k} x={X(b.at) + 1} y={108} w={b.n * W - 2} h={26} r={2}
          fill={b.free ? 'transparent' : tok('safe', 0.3)} stroke={b.free ? tok('ink', 0.5) : tok('safe')} dash={b.free}>
          {b.free && <T x={X(b.at) + (b.n * W) / 2} y={121} size={11} anchor="middle">{b.n}</T>}
        </Box>
      ))}
      <T x={8} y={160} size={11} mono fill={tok('brand')}>head</T>
      <Arrow x1={40} y1={156} x2={X(3)} y2={136} color={tok('brand')} />
      <Arrow x1={X(4)} y1={138} x2={X(11)} y2={138} color={tok('brand')} bend={0.4} />
      <Arrow x1={X(13)} y1={138} x2={X(19)} y2={138} color={tok('brand')} bend={0.4} />
      <T x={8} y={196} size={12}>12 words free, but alloc(7) fails:</T>
      <T x={8} y={214} size={12}>no hole is big enough (fragmentation).</T>
    </Svg>
  );
}
