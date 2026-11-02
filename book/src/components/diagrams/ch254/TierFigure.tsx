// What the chapter's jit() wrapper does on every call: the guard, the
// counter, the compile, and the two paths. Matches the code in the
// chapter's runnable example exactly.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

export default function TierFigure() {
  return (
    <Svg w={400} h={300} title="Each call is checked by a guard; numbers go to the compiled WebAssembly once it exists, everything else to the interpreter; the third good call triggers the compile">
      <Box x={130} y={6} w={140} h={30} fill={tok('panel')}>
        <T x={200} y={21} size={13} mono anchor="middle">f(args)</T>
      </Box>
      <Arrow x1={200} y1={36} x2={200} y2={58} />
      <Box x={70} y={60} w={260} h={44} fill={tok('warn', 0.18)} stroke={tok('warn')}>
        <T x={200} y={75} size={12} anchor="middle" weight={700}>guard</T>
        <T x={200} y={92} size={11} anchor="middle">right count, and every one a number?</T>
      </Box>
      <Arrow x1={110} y1={104} x2={70} y2={140} />
      <T x={56} y={124} size={11} fill={tok('muted')}>no</T>
      <Arrow x1={290} y1={104} x2={320} y2={140} />
      <T x={318} y={120} size={11} fill={tok('muted')}>yes</T>
      <Box x={8} y={142} w={150} h={58} fill={tok('f1', 0.16)} stroke={tok('f1')}>
        <T x={83} y={160} size={12} anchor="middle" weight={700}>interpreter</T>
        <T x={83} y={178} size={11} anchor="middle">slow, handles</T>
        <T x={83} y={192} size={11} anchor="middle">every case and error</T>
      </Box>
      <Box x={222} y={142} w={170} h={58} fill={tok('panel')}>
        <T x={307} y={160} size={12} anchor="middle" weight={700}>compiled yet?</T>
        <T x={307} y={178} size={11} anchor="middle">if not, count the call;</T>
        <T x={307} y={192} size={11} anchor="middle">at 3, try to compile</T>
      </Box>
      <Arrow x1={240} y1={200} x2={158} y2={186} />
      <T x={170} y={212} size={11} fill={tok('muted')}>not yet,</T>
      <T x={170} y={226} size={11} fill={tok('muted')}>or refused</T>
      <Arrow x1={307} y1={200} x2={307} y2={238} />
      <Box x={222} y={240} w={170} h={52} fill={tok('f2', 0.16)} stroke={tok('f2')}>
        <T x={307} y={258} size={12} anchor="middle" weight={700}>WebAssembly</T>
        <T x={307} y={276} size={11} anchor="middle">compiled by the engine</T>
      </Box>
    </Svg>
  );
}
