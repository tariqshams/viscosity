import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Ahead-of-time compiling against just-in-time compiling, as two
// timelines. The JIT row follows the --trace-opt run in 'The V8
// pipeline' (Node v22.23.4): the program starts in Ignition at once, and
// TurboFan compiles add concurrently, on another thread, while it runs.
export default function AotVsJit() {
  return (
    <Svg w={400} h={200} title="Two timelines. Ahead of time: a long compile-everything block, then the program runs fast from the start. Just in time: the program starts at once in the interpreter; a second, background row shows TurboFan compiling the hot function; once it is done the main row switches to fast code.">
      <T x={8} y={14} size={12} weight={700}>ahead of time (Drip's compiler, tsc, Viscosity)</T>
      <Box x={8} y={26} w={150} h={28} fill={tok('warn', 0.15)} stroke={tok('warn')}>
        <T x={83} y={40} size={11} anchor="middle">compile everything</T>
      </Box>
      <Box x={160} y={26} w={232} h={28} fill={tok('safe', 0.15)} stroke={tok('safe')}>
        <T x={276} y={40} size={11} anchor="middle">run</T>
      </Box>

      <T x={8} y={84} size={12} weight={700}>just in time (V8)</T>
      <Box x={8} y={96} w={170} h={28} fill={tok('panel')} stroke={tok('line')}>
        <T x={93} y={110} size={11} anchor="middle">run in the interpreter</T>
      </Box>
      <Box x={180} y={96} w={212} h={28} fill={tok('safe', 0.15)} stroke={tok('safe')}>
        <T x={286} y={110} size={11} anchor="middle">run hot add as machine code</T>
      </Box>
      <Box x={70} y={146} w={108} h={26} fill={tok('warn', 0.15)} stroke={tok('warn')} dash>
        <T x={124} y={159} size={11} anchor="middle">compile add</T>
      </Box>
      <T x={8} y={159} size={11} fill={tok('muted')}>other</T>
      <T x={8} y={172} size={11} fill={tok('muted')}>thread</T>
      <Arrow x1={70} y1={126} x2={78} y2={144} color={tok('muted')} />
      <T x={30} y={136} size={11} fill={tok('muted')}>hot!</T>
      <Arrow x1={178} y1={146} x2={186} y2={128} color={tok('safe')} />
      <T x={196} y={140} size={11} fill={tok('muted')}>ready: switch</T>
      <Arrow x1={8} y1={190} x2={392} y2={190} color={tok('muted')} width={1.5} />
      <T x={392} y={180} size={11} anchor="end" fill={tok('muted')}>time</T>
    </Svg>
  );
}
