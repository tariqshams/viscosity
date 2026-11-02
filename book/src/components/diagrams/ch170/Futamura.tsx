// Chapter 169b: the first Futamura projection, as Truffle's documentation
// (truffle/docs/PartialEvaluation.md) states it: partially evaluating an
// interpreter with respect to a guest program gives code specialized to
// that program, which takes only the program's input. Running it gives
// the same output as interpreting the program on that input.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

export default function Futamura() {
  return (
    <Svg w={400} h={250} title="An interpreter and a known program go into the partial evaluator; out comes a residual program that takes only the input and gives the same output the interpreter would.">
      <T x={6} y={12} size={11} weight={700} fill={tok('muted')}>KNOWN NOW (STATIC)</T>
      <Box x={6} y={22} w={120} h={40} fill={tok('f2', 0.12)} stroke={tok('f2')}>
        <T x={66} y={42} size={12} weight={700} anchor="middle">interpreter</T>
      </Box>
      <Box x={140} y={22} w={120} h={40} fill={tok('f2', 0.12)} stroke={tok('f2')}>
        <T x={200} y={36} size={12} weight={700} anchor="middle">program</T>
        <T x={200} y={52} size={11} mono anchor="middle">args[1]+args[2]</T>
      </Box>
      <Arrow x1={66} y1={64} x2={150} y2={92} />
      <Arrow x1={200} y1={64} x2={170} y2={92} />
      <Box x={90} y={94} w={160} h={36} fill={tok('brand', 0.15)} stroke={tok('brand')}>
        <T x={170} y={112} size={12} weight={700} anchor="middle">partial evaluator</T>
      </Box>
      <Arrow x1={170} y1={132} x2={170} y2={156} />
      <Box x={90} y={158} w={160} h={36} fill={tok('safe', 0.12)} stroke={tok('safe')}>
        <T x={170} y={176} size={12} weight={700} anchor="middle">residual program</T>
      </Box>
      <T x={300} y={140} size={11} weight={700} fill={tok('muted')}>KNOWN LATER</T>
      <T x={300} y={154} size={11} weight={700} fill={tok('muted')}>(DYNAMIC)</T>
      <Box x={300} y={162} w={90} h={28} fill={tok('f3', 0.12)} stroke={tok('f3')}>
        <T x={345} y={176} size={12} mono anchor="middle">input</T>
      </Box>
      <Arrow x1={298} y1={176} x2={252} y2={176} />
      <Arrow x1={170} y1={196} x2={170} y2={216} />
      <Box x={120} y={218} w={100} h={28} fill={tok('panel')} stroke={tok('ink', 0.6)}>
        <T x={170} y={232} size={12} mono anchor="middle">output</T>
      </Box>
      <T x={6} y={210} size={11} fill={tok('muted')}>same output as</T>
      <T x={6} y={226} size={11} mono fill={tok('muted')}>interpret(</T>
      <T x={6} y={242} size={11} mono fill={tok('muted')}> program, input)</T>
    </Svg>
  );
}
