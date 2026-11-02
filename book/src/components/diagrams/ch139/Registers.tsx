// Chapter 139: the "registers" of drip-rs's Vm (book/companion/rust/src/
// vm.rs). While a function runs, its chunk has three owners, all Rc
// clones of one allocation: the ObjFunction in the heap (object.rs,
// `pub chunk: Rc<Chunk>`), the running CallFrame (`chunk: Rc<Chunk>`,
// set in Vm::call) and the Vm's own `chunk` register. `ip` and `slots`
// live in the Vm while the frame runs; the frame's copy of ip is written
// back only when it makes a call (see the CallFrame doc comment).
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

export default function Registers() {
  return (
    <Svg w={400} h={240} title="The Vm's ip, chunk and slots registers beside the running frame, and one chunk shared by three Rc pointers">
      <T x={8} y={14} size={11} weight={700} fill={tok('brand')}>Vm (registers)</T>
      <Box x={8} y={24} w={150} h={84} r={4} fill={tok('brand', 0.08)} stroke={tok('brand')}>
        <T x={18} y={42} size={11} mono>ip: 13</T>
        <T x={18} y={64} size={11} mono>chunk: Rc ●</T>
        <T x={18} y={86} size={11} mono>slots: 0</T>
      </Box>
      <T x={8} y={130} size={11} weight={700} fill={tok('accent')}>frames.last()</T>
      <Box x={8} y={140} w={150} h={84} r={4} fill={tok('accent', 0.08)} stroke={tok('accent')}>
        <T x={18} y={158} size={11} mono>ip: (saved on call)</T>
        <T x={18} y={180} size={11} mono>chunk: Rc ●</T>
        <T x={18} y={202} size={11} mono>slots: 0</T>
      </Box>
      <T x={246} y={14} size={11} weight={700} fill={tok('safe')}>heap.functions[k]</T>
      <Box x={246} y={24} w={146} h={40} r={4} fill={tok('safe', 0.08)} stroke={tok('safe')}>
        <T x={256} y={44} size={11} mono>ObjFunction</T>
        <T x={350} y={44} size={11} mono>Rc ●</T>
      </Box>
      <Box x={230} y={130} w={162} h={64} r={4} fill={tok('panel')} stroke={tok('ink', 0.6)}>
        <T x={240} y={146} size={11} mono weight={700}>Chunk (frozen)</T>
        <T x={240} y={164} size={11} mono>code, lines,</T>
        <T x={240} y={180} size={11} mono>constants</T>
      </Box>
      <Arrow x1={108} y1={64} x2={228} y2={142} color={tok('brand')} width={1.6} />
      <Arrow x1={108} y1={180} x2={228} y2={172} color={tok('accent')} width={1.6} />
      <Arrow x1={372} y1={64} x2={340} y2={128} color={tok('safe')} width={1.6} />
      <T x={230} y={214} size={11} fill={tok('muted')}>three Rc clones, one chunk;</T>
      <T x={230} y={230} size={11} fill={tok('muted')}>reading it borrows no heap</T>
    </Svg>
  );
}
