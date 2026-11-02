// Chapter 401: a drip-rs string value (book/companion/rust/src/object.rs).
// Value::String holds a StrRef: the Gc<ObjString> handle plus the
// string's FNV-1a hash, which for "add" is 0x3b391274 (hash_string, the
// same function the unit test checks for "a"). The ObjString in the
// strings arena keeps the hash too, beside its Box<str> text. A table
// probes from hash & mask using the StrRef alone; only interning reads
// the characters. Slot 6 is where "add" lands in the run of chapter 399.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

export default function StrRefShape() {
  return (
    <Svg w={400} h={226} title="A string value carries its handle and its hash; the heap object keeps the text">
      <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>A Value (16 bytes)</T>
      <Box x={8} y={22} w={384} h={44} r={4} fill={tok('accent', 0.08)} stroke={tok('accent')}>
        <T x={16} y={44} size={12} mono>String(</T>
        <Box x={82} y={30} w={140} h={28} r={3} fill={tok('brand', 0.12)} stroke={tok('brand')}>
          <T x={90} y={44} size={12} mono>handle: Gc 6</T>
        </Box>
        <Box x={228} y={30} w={150} h={28} r={3} fill={tok('safe', 0.12)} stroke={tok('safe')}>
          <T x={236} y={44} size={12} mono>hash: 0x3b391274</T>
        </Box>
      </Box>
      <T x={8} y={92} size={11} weight={700} fill={tok('muted')}>strings arena, slot 6</T>
      <Box x={8} y={102} w={260} h={44} r={4} fill={tok('brand', 0.08)} stroke={tok('brand')}>
        <T x={16} y={118} size={12} mono>ObjString {'{'}</T>
        <T x={24} y={136} size={12} mono>chars: "add", hash: 0x3b391274 {'}'}</T>
      </Box>
      <Arrow x1={150} y1={58} x2={120} y2={100} color={tok('brand')} />
      <T x={8} y={170} size={11} weight={700} fill={tok('muted')}>Any Table, e.g. globals</T>
      <Box x={8} y={180} w={384} h={34} r={4} fill={tok('panel')} stroke={tok('line')}>
        <T x={16} y={197} size={12} mono>start at hash &amp; mask, compare handles</T>
      </Box>
      <Arrow x1={330} y1={58} x2={330} y2={178} color={tok('safe')} />
      <T x={340} y={120} size={11} fill={tok('safe')}>no heap</T>
      <T x={340} y={134} size={11} fill={tok('safe')}>needed</T>
    </Svg>
  );
}
