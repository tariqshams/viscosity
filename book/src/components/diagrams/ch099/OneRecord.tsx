import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 99b: three spellings, one VIR instruction. The VIR lines are
// real printFunc output from the JavaScript and Python plugins.
export default function OneRecord() {
  return (
    <Svg w={400} h={250} title="A JavaScript object literal and a Python dataclass call both lower to the same record instruction; a push and an append both lower to push">
      <T x={8} y={14} size={11} weight={700} fill={tok('f3')}>JAVASCRIPT</T>
      <Box x={8} y={24} w={180} h={34} fill={tok('f3', 0.1)} stroke={tok('f3')}>
        <T x={98} y={41} size={12} mono anchor="middle">{'{ x: 1, vx: 2 }'}</T>
      </Box>
      <T x={212} y={14} size={11} weight={700} fill={tok('f4')}>PYTHON (a dataclass)</T>
      <Box x={212} y={24} w={180} h={34} fill={tok('f4', 0.1)} stroke={tok('f4')}>
        <T x={302} y={41} size={12} mono anchor="middle">P(1.0, 2.0)</T>
      </Box>
      <Arrow x1={98} y1={58} x2={170} y2={92} />
      <Arrow x1={302} y1={58} x2={230} y2={92} />
      <Box x={60} y={92} w={280} h={36} fill={tok('brand', 0.12)} stroke={tok('brand')}>
        <T x={200} y={110} size={12} mono anchor="middle">record {'{x, vx}'} %a, %b</T>
      </Box>

      <Box x={8} y={150} w={180} h={34} fill={tok('f3', 0.1)} stroke={tok('f3')}>
        <T x={98} y={167} size={12} mono anchor="middle">xs.push(o)</T>
      </Box>
      <Box x={212} y={150} w={180} h={34} fill={tok('f4', 0.1)} stroke={tok('f4')}>
        <T x={302} y={167} size={12} mono anchor="middle">xs.append(o)</T>
      </Box>
      <Arrow x1={98} y1={184} x2={170} y2={206} />
      <Arrow x1={302} y1={184} x2={230} y2={206} />
      <Box x={60} y={206} w={280} h={36} fill={tok('brand', 0.12)} stroke={tok('brand')}>
        <T x={200} y={224} size={12} mono anchor="middle">push %xs, %o</T>
      </Box>
    </Svg>
  );
}
