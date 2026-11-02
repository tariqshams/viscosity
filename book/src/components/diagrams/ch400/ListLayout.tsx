// Chapter 400: how a drip-rs list sits in memory (book/companion/rust/
// src/object.rs and value.rs). Two Values on the stack, xs and ys, hold
// the same Gc<ObjList>; the lists arena's slot holds the Vec<Value>
// header (pointer, capacity, length: 24 bytes, measured with size_of on
// rustc 1.97); its elements are 16-byte Values in a separate block, and
// a string element is a StrRef handle into the strings arena.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

export default function ListLayout() {
  return (
    <Svg w={400} h={236} title="Two handles to one list: the arena slot holds the Vec header; the elements live in a block of their own">
      <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>STACK</T>
      <Box x={8} y={22} w={118} h={28} r={3} fill={tok('accent', 0.14)} stroke={tok('accent')}>
        <T x={16} y={36} size={12} mono>xs: List(Gc 0)</T>
      </Box>
      <Box x={8} y={58} w={118} h={28} r={3} fill={tok('accent', 0.14)} stroke={tok('accent')}>
        <T x={16} y={72} size={12} mono>ys: List(Gc 0)</T>
      </Box>
      <T x={180} y={12} size={11} weight={700} fill={tok('muted')}>lists arena, slot 0</T>
      <Box x={180} y={22} w={212} h={64} r={4} fill={tok('brand', 0.1)} stroke={tok('brand')}>
        <T x={188} y={38} size={12} mono weight={700}>ObjList {'{'} items: Vec {'}'}</T>
        <T x={188} y={58} size={12} mono>ptr · cap 4 · len 3</T>
        <T x={188} y={76} size={11} fill={tok('muted')}>24 bytes</T>
      </Box>
      <Arrow x1={126} y1={36} x2={178} y2={44} color={tok('accent')} />
      <Arrow x1={126} y1={72} x2={178} y2={60} color={tok('accent')} />
      <T x={8} y={124} size={11} weight={700} fill={tok('muted')}>the Vec’s own block: 16 bytes per Value</T>
      {['Number(7)', 'Number(20)', 'String("a")', 'spare'].map((v, k) => (
        <Box key={k} x={8 + k * 96} y={134} w={92} h={30} r={3} dash={v === 'spare'}
          fill={v === 'spare' ? tok('panel') : tok('safe', 0.12)} stroke={v === 'spare' ? tok('line') : tok('safe')}>
          <T x={54 + k * 96} y={149} size={12} mono anchor="middle" fill={v === 'spare' ? tok('muted') : tok('ink')}>{v}</T>
        </Box>
      ))}
      <Arrow x1={230} y1={86} x2={60} y2={132} color={tok('brand')} bend={-0.2} />
      <Box x={196} y={192} w={196} h={30} r={3} fill={tok('panel')} stroke={tok('line')}>
        <T x={204} y={207} size={12} mono>strings arena: "a"</T>
      </Box>
      <Arrow x1={246} y1={164} x2={270} y2={190} color={tok('ink', 0.6)} />
      <T x={8} y={207} size={11} fill={tok('muted')}>spare: capacity not yet used</T>
    </Svg>
  );
}
