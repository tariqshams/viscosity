import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// The interpreter frame of sum(xs), from the header of its
// --print-bytecode listing (Node v22.23.4, V8 12.4): "Parameter count 2"
// (the receiver and xs), "Register count 3", "Frame size 24" (3 x 8
// bytes). That the frame keeps the bytecode array and the current offset,
// and that Sparkplug code uses the same layout, is from the V8 team's
// Sparkplug post (2021). Fixed slots are drawn as one group, without
// claiming their exact order.
const ROWS = [
  { label: 'this (the receiver)', group: 'args', h: 24 },
  { label: 'a0: xs', group: 'args', h: 24 },
  { label: 'return address, caller’s frame', group: 'fixed', h: 24 },
  { label: 'fixed slots: bytecode array,', group: 'fixed', h: 36, label2: 'current bytecode offset, …' },
  { label: 'r0: s', group: 'regs', h: 24 },
  { label: 'r1: i', group: 'regs', h: 24 },
  { label: 'r2: spare copy', group: 'regs', h: 24 },
];

export default function FrameFigure() {
  let y = 26;
  const placed = ROWS.map((r) => { const at = y; y += r.h + 4; return { ...r, y: at }; });
  return (
    <Svg w={400} h={260} title="A stack frame drawn as a column of slots. At the top, in grey, the two parameters: the receiver this and a0, xs. Below, in grey, the return address and the caller's frame, then the fixed slots that hold the bytecode array and the current bytecode offset. At the bottom, in orange, the three registers r0, r1 and r2, 24 bytes. A blue line on the right says that Ignition and Sparkplug both use this same layout.">
      <T x={20} y={14} size={11} weight={700} fill={tok('muted')}>THE FRAME OF sum(xs)</T>
      {placed.map((r) => {
        const reg = r.group === 'regs';
        return (
          <Box key={r.label} x={20} y={r.y} w={240} h={r.h} r={3} fill={reg ? tok('brand', 0.14) : tok('panel')} stroke={reg ? tok('brand') : tok('line')}>
            <T x={30} y={r.y + 12} size={11} mono fill={tok('ink')}>{r.label}</T>
            {r.label2 && <T x={30} y={r.y + 26} size={11} mono fill={tok('ink')}>{r.label2}</T>}
          </Box>
        );
      })}
      <T x={270} y={52} size={11} fill={tok('muted')}>Parameter count 2</T>
      <T x={270} y={200} size={11} fill={tok('brand')}>Register count 3</T>
      <T x={270} y={214} size={11} fill={tok('brand')}>Frame size 24</T>
      <Arrow x1={386} y1={30} x2={386} y2={236} color={tok('accent')} />
      <T x={270} y={120} size={11} weight={700} fill={tok('accent')}>Ignition and</T>
      <T x={270} y={134} size={11} weight={700} fill={tok('accent')}>Sparkplug use</T>
      <T x={270} y={148} size={11} weight={700} fill={tok('accent')}>the same layout</T>
      <T x={20} y={254} size={11} fill={tok('muted')}>registers are stack slots, 8 bytes each</T>
    </Svg>
  );
}
