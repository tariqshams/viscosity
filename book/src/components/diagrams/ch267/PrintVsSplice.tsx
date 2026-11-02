// Chapter 267: why Viscosity's round trip can compare bytes. A printer
// rebuilds the text from the tree, so whatever the tree does not keep
// (comments, blank lines, quote style, optional semicolons) comes out
// differently; a splicing emitter with no edits hands back the input.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const IN = ["let s = 'hi'; // greet", '', 'console.log(s)'];
const PRINTED = ['let s = "hi";', 'console.log(s);'];

export default function PrintVsSplice() {
  return (
    <Svg w={400} h={262} title="One input, two round trips. A printer rebuilds the text from the tree and loses the comment, the blank line and the quote style; a splicing emitter with an empty edit list returns the input unchanged.">
      <Box x={92} y={6} w={216} h={70} stroke={tok('ink', 0.5)}>
        <T x={100} y={18} size={11} weight={700} fill={tok('muted')}>INPUT</T>
        {IN.map((l, k) => (
          <T key={k} x={100} y={36 + k * 15} size={11} mono>{l}</T>
        ))}
      </Box>
      <Arrow x1={140} y1={78} x2={100} y2={120} />
      <Arrow x1={260} y1={78} x2={300} y2={120} />
      <T x={70} y={96} size={11} anchor="middle" fill={tok('muted')}>parse, print</T>
      <T x={334} y={96} size={11} anchor="middle" fill={tok('muted')}>parse, splice</T>

      <Box x={6} y={122} w={188} h={78} stroke={tok('danger')}>
        <T x={14} y={134} size={11} weight={700} fill={tok('danger')}>A PRINTER</T>
        {PRINTED.map((l, k) => (
          <T key={k} x={14} y={154 + k * 15} size={11} mono>{l}</T>
        ))}
        <T x={14} y={190} size={11} fill={tok('muted')}>comment, blank line gone</T>
      </Box>
      <Box x={206} y={122} w={188} h={78} stroke={tok('safe')}>
        <T x={214} y={134} size={11} weight={700} fill={tok('safe')}>VISCOSITY (NO EDITS)</T>
        {IN.map((l, k) => (
          <T key={k} x={214} y={154 + k * 15} size={11} mono>{l}</T>
        ))}
      </Box>
      <T x={100} y={222} size={11} anchor="middle" weight={700} fill={tok('danger')}>same tree,</T>
      <T x={100} y={238} size={11} anchor="middle" weight={700} fill={tok('danger')}>different bytes</T>
      <T x={300} y={222} size={11} anchor="middle" weight={700} fill={tok('safe')}>same bytes:</T>
      <T x={300} y={238} size={11} anchor="middle" weight={700} fill={tok('safe')}>compile(s) === s</T>
    </Svg>
  );
}
