// Chapter 404: the TypeScript VM's run() holds a live reference to the
// running frame (`let frame = this.frames[...]`, then `reload()` after
// every call), while drip-rs copies the running frame's ip, chunk and
// slots into fields of the Vm (book/companion/rust/src/vm.rs, struct Vm
// and Vm::call / Vm::pop_frame) and writes ip back only on a call.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

function Frames({ x, y, top }: { x: number; y: number; top: string }) {
  return (
    <g>
      <T x={x} y={y - 10} size={11} mono weight={700} fill={tok('muted')}>frames</T>
      <Box x={x} y={y} w={170} h={30} r={4}>
        <T x={x + 8} y={y + 15} size={11} mono>script · ip 17</T>
      </Box>
      <Box x={x} y={y + 36} w={170} h={30} r={4} fill={tok('brand', 0.1)} stroke={tok('brand')}>
        <T x={x + 8} y={y + 51} size={11} mono>{top}</T>
      </Box>
    </g>
  );
}

export default function HoldOrCopy() {
  return (
    <Svg w={400} h={250} title="TypeScript holds a reference to the running frame; drip-rs copies its state into the VM's own fields">
      <T x={8} y={14} size={12} weight={700}>TypeScript: hold the frame</T>
      <Box x={8} y={34} w={96} h={30} r={4} fill={tok('panel')} stroke={tok('accent')}>
        <T x={16} y={49} size={11} mono>let frame</T>
      </Box>
      <Frames x={200} y={34} top="add · ip 6" />
      <Arrow x1={104} y1={49} x2={198} y2={85} color={tok('accent')} />
      <T x={8} y={98} size={11} fill={tok('muted')}>frame.ip++ writes the frame itself;</T>
      <T x={8} y={112} size={11} fill={tok('muted')}>reload() re-points it after a call</T>

      <T x={8} y={142} size={12} weight={700}>drip-rs: copy the state out</T>
      <Box x={8} y={158} w={130} h={66} r={4} fill={tok('panel')} stroke={tok('accent')}>
        <T x={16} y={172} size={11} mono>Vm.ip: 6</T>
        <T x={16} y={190} size={11} mono>Vm.chunk: add</T>
        <T x={16} y={208} size={11} mono>Vm.slots: 1</T>
      </Box>
      <Frames x={200} y={162} top="add · ip 0 (stale)" />
      <Arrow x1={140} y1={176} x2={198} y2={176} color={tok('safe')} dash />
      <T x={144} y={166} size={11} fill={tok('safe')}>call: save ip</T>
      <Arrow x1={198} y1={214} x2={140} y2={214} color={tok('brand')} />
      <T x={146} y={240} size={11} fill={tok('brand')}>call, pop_frame: load</T>
    </Svg>
  );
}
