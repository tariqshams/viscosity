// The frame the chapter's compiler builds for main (which calls sumsq and
// print, and keeps two values in s1 and s2): 32 bytes, ra at 24(sp), s1 at
// 16(sp), s2 at 8(sp), and 8 bytes of padding so that sp stays a multiple
// of 16 (the psABI: sp is 128-bit aligned on procedure entry).
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const SLOTS: [string, string, string][] = [
  ['24(sp)', 'saved ra', 'f3'],
  ['16(sp)', 'saved s1', 'f1'],
  ['8(sp)', 'saved s2', 'f2'],
  ['0(sp)', '(padding)', 'muted'],
];

export default function FrameFigure() {
  return (
    <Svg w={400} h={236} title="main's 32-byte stack frame: the saved return address, the saved s1 and s2, and eight bytes of padding">
      <T x={150} y={12} size={11} fill={tok('muted')}>higher addresses (the caller's frame)</T>
      <T x={8} y={36} size={12} mono>old sp</T>
      <Arrow x1={60} y1={36} x2={148} y2={36} />
      {SLOTS.map(([off, what, c], k) => {
        const y = 36 + k * 40;
        return (
          <g key={off}>
            <Box x={150} y={y} w={160} h={40} r={0} fill={tok(c, c === 'muted' ? 0.06 : 0.18)} stroke={tok('line')} dash={c === 'muted'}>
              <T x={230} y={y + 20} size={12} anchor="middle">{what}</T>
            </Box>
            <T x={318} y={y + 20} size={12} mono>{off}</T>
          </g>
        );
      })}
      <T x={8} y={196} size={12} mono>new sp</T>
      <Arrow x1={60} y1={196} x2={148} y2={196} />
      <T x={8} y={222} size={11} fill={tok('muted')}>addi sp, sp, -32 builds it; addi sp, sp, 32 removes it</T>
    </Svg>
  );
}
