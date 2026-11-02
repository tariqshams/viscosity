// Chapter 139: why drip-rs's Value holds handles rather than owning its
// objects. Left: the real design (book/companion/rust/src/value.rs): a
// global and a stack slot both hold Value::String(StrRef), a copy of the
// same handle into the heap's strings arena, so copying a Value copies
// 16 bytes and the text exists once. Right: a hypothetical
// Value::String(String), which would make each copy own its own text,
// so every push would clone it (and the enum could not be Copy: rustc
// 1.97 reports E0204 for that derive). Slot number 3 is illustrative.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

export default function HandlesShare() {
  return (
    <Svg w={400} h={232} title="Two Values sharing one heap string by handle, beside two Values each owning a copy">
      <T x={8} y={14} size={11} weight={700} fill={tok('safe')}>drip-rs: Value holds a handle</T>
      <Box x={8} y={28} w={150} h={26} r={3} fill={tok('accent', 0.12)} stroke={tok('accent')}>
        <T x={16} y={41} size={11} mono>global: String(#3)</T>
      </Box>
      <Box x={8} y={66} w={150} h={26} r={3} fill={tok('accent', 0.12)} stroke={tok('accent')}>
        <T x={16} y={79} size={11} mono>stack: String(#3)</T>
      </Box>
      <Box x={36} y={130} w={110} h={30} r={3} fill={tok('brand', 0.12)} stroke={tok('brand')}>
        <T x={91} y={145} size={11} mono anchor="middle">#3: "hello"</T>
      </Box>
      <T x={36} y={174} size={11} fill={tok('muted')}>strings arena</T>
      <Arrow x1={150} y1={54} x2={130} y2={128} color={tok('accent')} width={1.6} />
      <Arrow x1={80} y1={92} x2={84} y2={128} color={tok('accent')} width={1.6} />
      <T x={8} y={200} size={11} fill={tok('ink')}>copy = 16 bytes, text once</T>

      <T x={212} y={14} size={11} weight={700} fill={tok('danger')}>if Value owned a String</T>
      <Box x={212} y={28} w={180} h={26} r={3} fill={tok('panel')} stroke={tok('line')}>
        <T x={220} y={41} size={11} mono>global: String("hello")</T>
      </Box>
      <Box x={212} y={66} w={180} h={26} r={3} fill={tok('panel')} stroke={tok('line')}>
        <T x={220} y={79} size={11} mono>stack: String("hello")</T>
      </Box>
      <Box x={212} y={110} w={84} h={26} r={3} fill={tok('danger', 0.1)} stroke={tok('danger')}>
        <T x={254} y={123} size={11} mono anchor="middle">"hello"</T>
      </Box>
      <Box x={306} y={110} w={84} h={26} r={3} fill={tok('danger', 0.1)} stroke={tok('danger')}>
        <T x={348} y={123} size={11} mono anchor="middle">"hello"</T>
      </Box>
      <T x={212} y={160} size={11} fill={tok('ink')}>every push clones the text,</T>
      <T x={212} y={178} size={11} fill={tok('ink')}>and derive(Copy) fails:</T>
      <T x={212} y={200} size={11} mono fill={tok('danger')}>error[E0204]</T>
    </Svg>
  );
}
