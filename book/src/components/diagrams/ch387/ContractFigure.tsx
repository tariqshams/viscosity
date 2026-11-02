import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 386b: the promises around one unsafe block, after the
// Rustonomicon ("How Safe and Unsafe Interact": unsafe declares and
// discharges contracts) and the Unsafe Code Guidelines glossary
// (safety invariants must hold whenever unknown safe code can look).
export default function ContractFigure() {
  return (
    <Svg w={400} h={228} title="new and push keep Ascii's invariant; the invariant meets the contract of from_utf8_unchecked inside as_str">
      <Box x={8} y={8} w={184} h={66} fill={tok('safe', 0.1)} stroke={tok('safe')}>
        <T x={18} y={26} size={12} weight={700}>new, push</T>
        <T x={18} y={46} size={11}>check every byte &lt; 128</T>
        <T x={18} y={62} size={11} fill={tok('muted')}>establish / keep</T>
      </Box>
      <Box x={208} y={8} w={184} h={66} fill={tok('f2', 0.12)} stroke={tok('f2')}>
        <T x={218} y={26} size={12} weight={700}>invariant of Ascii</T>
        <T x={218} y={46} size={11}>all bytes &lt; 128</T>
        <T x={218} y={62} size={11} fill={tok('muted')}>true for every value</T>
      </Box>
      <Arrow x1={192} y1={41} x2={208} y2={41} />
      <Arrow x1={300} y1={74} x2={300} y2={106} />
      <Box x={108} y={108} w={284} h={66} fill={tok('warn', 0.12)} stroke={tok('warn')}>
        <T x={118} y={126} size={12} weight={700}>as_str: unsafe block</T>
        <T x={118} y={146} size={11} mono>from_utf8_unchecked(&amp;self.0)</T>
        <T x={118} y={162} size={11} fill={tok('muted')}>contract: bytes are UTF-8 ✓</T>
      </Box>
      <Box x={8} y={186} w={384} h={34} r={4} fill={tok('panel')} stroke={tok('line')} dash>
        <T x={18} y={203} size={11}>private field: no other code can make or change an Ascii</T>
      </Box>
    </Svg>
  );
}
