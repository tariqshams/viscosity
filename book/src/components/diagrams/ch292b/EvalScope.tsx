import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 292-b: where V8 keeps the local x, in a function without eval
// (a register, resolved before the program runs) and in one with a
// direct eval (a heap context slot that eval's code can also reach).
export default function EvalScope() {
  return (
    <Svg w={400} h={210} title="Left: function plain keeps x in register r0 and adds with AddSmi. Right: function withEval creates a function context on the heap, stores x in context slot 6, and calls eval, which can reach the same slot">
      <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>plain(s)</T>
      <Box x={8} y={22} w={180} h={110} fill={tok('safe', 0.08)} stroke={tok('safe')}>
        <T x={18} y={40} size={11} mono>LdaSmi [1]</T>
        <T x={18} y={58} size={11} mono>Star0         ; x in r0</T>
        <T x={18} y={76} size={11} mono>AddSmi [1]</T>
        <T x={18} y={94} size={11} mono>Return</T>
        <Box x={18} y={104} w={60} h={22} fill={tok('safe', 0.2)} stroke={tok('safe')}>
          <T x={48} y={115} size={11} mono anchor="middle">r0: x</T>
        </Box>
      </Box>
      <T x={208} y={12} size={11} weight={700} fill={tok('muted')}>withEval(s)</T>
      <Box x={208} y={22} w={184} h={110} fill={tok('warn', 0.08)} stroke={tok('warn')}>
        <T x={216} y={40} size={11} mono>CreateFunctionContext</T>
        <T x={216} y={58} size={11} mono>StaCurrentContextSlot [6]</T>
        <T x={216} y={76} size={11} mono>CallRuntime [Resolve</T>
        <T x={216} y={92} size={11} mono>  PossiblyDirectEval]</T>
        <T x={216} y={112} size={11} mono>LdaCurrentContextSlot [6]</T>
      </Box>
      <T x={8} y={152} size={11} weight={700} fill={tok('muted')}>WHERE x LIVES</T>
      <T x={8} y={170} size={11}>a register: the compiler knows every use</T>
      <Box x={208} y={142} w={184} h={34} fill={tok('warn', 0.15)} stroke={tok('warn')}>
        <T x={300} y={159} size={11} mono anchor="middle">heap context: slot 6 = x</T>
      </Box>
      <T x={208} y={192} size={11}>eval's code can reach it too</T>
      <T x={8} y={204} size={11} fill={tok('muted')}>Node 22 --print-bytecode, trimmed.</T>
    </Svg>
  );
}
