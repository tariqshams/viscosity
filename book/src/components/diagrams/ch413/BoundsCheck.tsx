// Chapter 413: what `code[ip]` does in safe Rust, next to what
// `get_unchecked(ip)` does. The checked path compares the index with
// the length and panics if it is out of range (the Index impl for
// slices); get_unchecked skips the comparison, and an out-of-range
// index is undefined behaviour (std docs for slice::get_unchecked).
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

export default function BoundsCheck() {
  return (
    <Svg w={400} h={250} title="A checked index compares and may panic; get_unchecked loads with no comparison">
      <T x={100} y={12} size={12} weight={700} anchor="middle">code[ip]  (safe)</T>
      <T x={300} y={12} size={12} weight={700} anchor="middle">get_unchecked(ip)</T>

      <Box x={30} y={26} w={140} h={30} r={5} fill={tok('accent', 0.12)} stroke={tok('accent')}>
        <T x={100} y={41} size={12} mono anchor="middle">ip &lt; code.len()?</T>
      </Box>
      <Arrow x1={100} y1={56} x2={100} y2={96} color={tok('safe')} />
      <T x={106} y={78} size={11} fill={tok('safe')}>yes, always</T>
      <Arrow x1={170} y1={41} x2={186} y2={150} color={tok('danger')} bend={-0.3} />
      <T x={148} y={112} size={11} fill={tok('danger')}>no</T>
      <Box x={30} y={98} w={140} h={30} r={5} fill={tok('safe', 0.12)} stroke={tok('safe')}>
        <T x={100} y={113} size={12} mono anchor="middle">load the byte</T>
      </Box>
      <Box x={110} y={152} w={110} h={30} r={5} fill={tok('danger', 0.12)} stroke={tok('danger')}>
        <T x={165} y={167} size={12} mono anchor="middle">panic</T>
      </Box>

      <Box x={230} y={26} w={140} h={30} r={5} fill={tok('panel')} stroke={tok('line')} dash>
        <T x={300} y={41} size={11} anchor="middle" fill={tok('muted')}>no comparison</T>
      </Box>
      <Arrow x1={300} y1={56} x2={300} y2={96} color={tok('warn')} />
      <Box x={230} y={98} w={140} h={30} r={5} fill={tok('warn', 0.14)} stroke={tok('warn')}>
        <T x={300} y={113} size={12} mono anchor="middle">load the byte</T>
      </Box>
      <T x={300} y={148} size={11} anchor="middle" fill={tok('danger')}>if ip ≥ len:</T>
      <T x={300} y={164} size={11} anchor="middle" fill={tok('danger')}>undefined behaviour</T>

      <T x={4} y={206} size={11} fill={tok('muted')}>A compare and a branch: a couple of instructions, and the</T>
      <T x={4} y={222} size={11} fill={tok('muted')}>CPU guesses the branch right every time, since the panic</T>
      <T x={4} y={238} size={11} fill={tok('muted')}>never happens in a correct VM. So removing it saves little.</T>
    </Svg>
  );
}
