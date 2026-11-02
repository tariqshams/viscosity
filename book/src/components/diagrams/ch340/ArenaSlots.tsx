// Chapter 340: the shape of drip-rs's Arena<T> (book/companion/rust/src/
// object.rs): `slots: Vec<Option<T>>` and `free: Vec<u32>`. A collection
// has freed slot 1 (remove(1, reuse = true) took the object out and
// pushed 1 onto the free list), so the next insert pops 1 and returns
// Gc(1) instead of growing the Vec. Values hold handles: slot numbers.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const SLOTS = ['Some(script)', 'None', 'Some(add)', 'Some(g)'];

export default function ArenaSlots() {
  const x = (k: number) => 8 + k * 96;
  return (
    <Svg w={400} h={210} title="An arena: a Vec of optional slots, and a free list naming the empty one">
      <T x={8} y={12} size={12} mono weight={700}>closures: Arena&lt;ObjClosure&gt;</T>
      <T x={8} y={32} size={11} mono fill={tok('muted')}>slots: Vec&lt;Option&lt;ObjClosure&gt;&gt;</T>
      {SLOTS.map((s, k) => {
        const empty = s === 'None';
        return (
          <g key={k}>
            <Box x={x(k)} y={42} w={90} h={34} r={3} dash={empty}
              fill={empty ? tok('panel') : tok('brand', 0.12)} stroke={empty ? tok('line') : tok('brand')}>
              <T x={x(k) + 45} y={59} size={12} mono anchor="middle" fill={empty ? tok('muted') : tok('ink')}>{s}</T>
            </Box>
            <T x={x(k) + 45} y={88} size={11} mono anchor="middle" fill={tok('muted')}>slot {k}</T>
          </g>
        );
      })}
      <T x={8} y={114} size={11} mono fill={tok('muted')}>free: Vec&lt;u32&gt;</T>
      <Box x={8} y={124} w={50} h={28} r={3} fill={tok('warn', 0.14)} stroke={tok('warn')}>
        <T x={33} y={138} size={12} mono anchor="middle">1</T>
      </Box>
      <Arrow x1={58} y1={130} x2={x(1) + 40} y2={78} color={tok('warn')} bend={-0.3} />
      <T x={78} y={152} size={11} fill={tok('muted')}>insert pops 1 and returns Gc(1)</T>
      <Box x={230} y={124} w={162} h={28} r={3} fill={tok('accent', 0.12)} stroke={tok('accent')}>
        <T x={238} y={138} size={12} mono>Value::Closure(Gc 2)</T>
      </Box>
      <Arrow x1={300} y1={124} x2={x(2) + 50} y2={78} color={tok('accent')} />
      <T x={8} y={186} size={11} fill={tok('muted')}>A value on the stack holds a slot number, never the object.</T>
    </Svg>
  );
}
