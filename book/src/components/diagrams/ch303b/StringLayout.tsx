// Chapter 303-b: String versus &str in memory. A String is (ptr, len,
// cap) and owns a heap buffer it can grow; a &str is (ptr, len) and
// borrows bytes that live somewhere else: inside a String's buffer, or in
// the program's own read-only data, where string literals are kept.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const TXT = 'let x = 10;';

export default function StringLayout() {
  const hx = 150;
  const cw = 20;
  return (
    <Svg w={400} h={236} title="A String owns a growable heap buffer; a &str borrows bytes from a String or from the program itself">
      <T x={8} y={14} size={11} weight={700} fill={tok('muted')}>STACK</T>
      <T x={hx} y={14} size={11} weight={700} fill={tok('muted')}>WHERE THE BYTES LIVE</T>

      <T x={8} y={40} size={12} mono weight={700}>s: String</T>
      <Box x={8} y={48} w={120} h={26} fill={tok('accent', 0.12)} stroke={tok('accent')}>
        <T x={68} y={61} size={11} mono anchor="middle">ptr len=11 cap=11</T>
      </Box>
      <T x={hx} y={36} size={11} fill={tok('muted')}>heap buffer, owned by s</T>
      {TXT.split('').map((c, k) => (
        <Box key={k} x={hx + k * cw} y={44} w={cw - 2} h={24} r={2} fill={k >= 4 && k < 5 ? tok('safe', 0.25) : tok('accent', 0.1)} stroke={k >= 4 && k < 5 ? tok('safe') : tok('accent')}>
          <T x={hx + k * cw + 9} y={56} size={12} mono anchor="middle">{c === ' ' ? '·' : c}</T>
        </Box>
      ))}
      <Arrow x1={128} y1={61} x2={hx - 2} y2={56} color={tok('accent')} />

      <T x={8} y={106} size={12} mono weight={700}>name: &amp;str</T>
      <Box x={8} y={114} w={120} h={26} fill={tok('safe', 0.12)} stroke={tok('safe')}>
        <T x={68} y={127} size={11} mono anchor="middle">ptr len=1</T>
      </Box>
      <Arrow x1={128} y1={127} x2={hx + 4 * cw + 9} y2={70} color={tok('safe')} />
      <T x={hx + 110} y={104} size={11} fill={tok('muted')}>&amp;s[4..5]: borrows</T>
      <T x={hx + 110} y={118} size={11} fill={tok('muted')}>one byte of s</T>

      <T x={8} y={172} size={12} mono weight={700}>lit: &amp;str</T>
      <Box x={8} y={180} w={120} h={26} fill={tok('brand', 0.12)} stroke={tok('brand')}>
        <T x={68} y={193} size={11} mono anchor="middle">ptr len=5</T>
      </Box>
      <T x={hx} y={168} size={11} fill={tok('muted')}>read-only data inside the program</T>
      {'print'.split('').map((c, k) => (
        <Box key={k} x={hx + k * cw} y={180} w={cw - 2} h={24} r={2} fill={tok('brand', 0.1)} stroke={tok('brand')}>
          <T x={hx + k * cw + 9} y={192} size={12} mono anchor="middle">{c}</T>
        </Box>
      ))}
      <Arrow x1={128} y1={193} x2={hx - 2} y2={192} color={tok('brand')} />
      <T x={8} y={228} size={11} fill={tok('muted')}>Only s can grow or free its bytes; the two &amp;str values just point.</T>
    </Svg>
  );
}
