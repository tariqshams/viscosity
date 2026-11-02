import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Three value representations for the same Drip number, 3.5:
// 1. boxed: the stack slot holds a reference to a { tag, as } object,
// 2. the companion VM: the slot holds the JavaScript number itself, and the
//    engine underneath keeps its type,
// 3. the companion's Rust VM: an enum, a tag and a payload side by side.

export default function ThreeLayouts() {
  const rowY = [30, 112, 186];
  return (
    <Svg w={400} h={256} title="Three ways to store the number 3.5: boxed behind a reference, as a plain JavaScript number, and as a Rust enum with a tag next to the payload.">
      <T x={10} y={12} size={11} weight={700} fill={tok('muted')}>STACK SLOT</T>
      <T x={200} y={12} size={11} weight={700} fill={tok('muted')}>ELSEWHERE</T>

      {/* 1. boxed */}
      <T x={10} y={rowY[0] + 6} size={12} weight={700}>1. boxed</T>
      <Box x={10} y={rowY[0] + 16} w={110} h={34} r={4} stroke={tok('ink', 0.5)}>
        <T x={65} y={rowY[0] + 33} size={13} mono anchor="middle">reference</T>
      </Box>
      <Arrow x1={120} y1={rowY[0] + 33} x2={198} y2={rowY[0] + 33} />
      <Box x={200} y={rowY[0] + 10} w={190} h={46} r={6} fill={tok('brand', 0.1)} stroke={tok('brand')}>
        <T x={210} y={rowY[0] + 24} size={11} fill={tok('muted')}>a new object per value</T>
        <T x={210} y={rowY[0] + 42} size={13} mono>{"{ tag: 'num', as: 3.5 }"}</T>
      </Box>

      {/* 2. JS primitive */}
      <T x={10} y={rowY[1] - 4} size={12} weight={700}>2. the companion VM (TypeScript)</T>
      <Box x={10} y={rowY[1] + 6} w={110} h={34} r={4} fill={tok('accent', 0.15)} stroke={tok('accent')}>
        <T x={65} y={rowY[1] + 23} size={14} mono anchor="middle">3.5</T>
      </Box>
      <T x={132} y={rowY[1] + 16} size={11} fill={tok('muted')}>no tag written by the VM:</T>
      <T x={132} y={rowY[1] + 31} size={11} fill={tok('muted')}>typeof asks the engine, which keeps one</T>

      {/* 3. Rust enum */}
      <T x={10} y={rowY[2] - 4} size={12} weight={700}>3. the companion VM in Rust</T>
      <Box x={10} y={rowY[2] + 6} w={56} h={34} r={4} fill={tok('accent', 0.2)} stroke={tok('accent')}>
        <T x={38} y={rowY[2] + 23} size={12} mono weight={700} anchor="middle">Number</T>
      </Box>
      <Box x={68} y={rowY[2] + 6} w={52} h={34} r={4} stroke={tok('ink', 0.5)}>
        <T x={94} y={rowY[2] + 23} size={14} mono anchor="middle">3.5</T>
      </Box>
      <T x={132} y={rowY[2] + 16} size={11} fill={tok('muted')}>an enum: the tag and the payload</T>
      <T x={132} y={rowY[2] + 31} size={11} fill={tok('muted')}>sit side by side in the slot</T>
      <T x={10} y={248} size={11} fill={tok('muted')}>Same value, three layouts: that choice is the value representation.</T>
    </Svg>
  );
}
