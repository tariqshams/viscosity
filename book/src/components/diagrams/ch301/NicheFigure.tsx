import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 301: two niches. A bool uses only the byte values 0 and 1, so
// Option<bool> stores None as 2 (as rustc 1.97 did when the chapter was
// written); a reference is never null, so Option<&u8> stores None as the
// all-zero address.
export default function NicheFigure() {
  const vals: [string, string, 'used' | 'niche' | 'free'][] = [
    ['0', 'false', 'used'], ['1', 'true', 'used'], ['2', 'None', 'niche'], ['3…255', 'unused', 'free'],
  ];
  const color = (k: string) => (k === 'used' ? tok('f1', 0.25) : k === 'niche' ? tok('brand', 0.2) : 'transparent');
  return (
    <Svg w={400} h={196} title="The 256 values of a byte: 0 and 1 are false and true, 2 is None, the rest unused. Below, a pointer: zero is None, any other address is Some.">
      <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>Option&lt;bool&gt;: ONE BYTE</T>
      {vals.map(([v, m, k], i) => (
        <g key={v}>
          <Box x={8 + i * 96} y={24} w={90} h={44} fill={color(k)} stroke={k === 'free' ? tok('line') : tok('ink', 0.45)} dash={k === 'free'}>
            <T x={53 + i * 96} y={38} size={13} mono anchor="middle">{v}</T>
            <T x={53 + i * 96} y={56} size={12} anchor="middle" fill={k === 'niche' ? tok('brand') : tok('ink')}>{m}</T>
          </Box>
        </g>
      ))}
      <T x={8} y={98} size={11} weight={700} fill={tok('muted')}>Option&lt;&amp;u8&gt;: ONE 8-BYTE ADDRESS</T>
      <Box x={8} y={110} w={120} h={44} fill={tok('brand', 0.2)} stroke={tok('ink', 0.45)}>
        <T x={68} y={124} size={13} mono anchor="middle">0</T>
        <T x={68} y={142} size={12} anchor="middle" fill={tok('brand')}>None</T>
      </Box>
      <Box x={136} y={110} w={256} h={44} fill={tok('f1', 0.25)} stroke={tok('ink', 0.45)}>
        <T x={264} y={124} size={13} mono anchor="middle">any other address</T>
        <T x={264} y={142} size={12} anchor="middle">Some(that reference)</T>
      </Box>
      <T x={200} y={180} size={11} anchor="middle" fill={tok('muted')}>no tag byte: None hides in a value the type never uses</T>
    </Svg>
  );
}
