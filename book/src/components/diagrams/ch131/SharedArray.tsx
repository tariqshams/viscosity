// Why a mutable Dog[] must not be an Animal[]: two names for one array,
// and a Cat pushed through the wider one.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

export default function SharedArray() {
  return (
    <Svg w={400} h={170} title="Two variables, dogs of type Dog array and animals of type Animal array, both point to the same array. The array holds rex, a dog, and tom, a cat pushed in through animals. Reading dogs[1].bark finds no bark method.">
      <Box x={14} y={20} w={150} h={30}>
        <T x={24} y={35} size={12} mono>dogs: Dog[]</T>
      </Box>
      <Box x={14} y={110} w={150} h={30}>
        <T x={24} y={125} size={12} mono>animals: Animal[]</T>
      </Box>
      <Arrow x1={164} y1={35} x2={218} y2={66} />
      <Arrow x1={164} y1={125} x2={218} y2={94} />
      <Box x={222} y={56} w={172} h={48} stroke={tok('brand')}>
        <Box x={228} y={64} w={78} h={32} fill={tok('safe', 0.14)} stroke={tok('safe')}>
          <T x={267} y={80} size={12} mono anchor="middle">rex (dog)</T>
        </Box>
        <Box x={310} y={64} w={78} h={32} fill={tok('danger', 0.14)} stroke={tok('danger')}>
          <T x={349} y={80} size={12} mono anchor="middle">tom (cat)</T>
        </Box>
      </Box>
      <T x={308} y={122} size={11} anchor="middle" fill={tok('danger')}>pushed in through animals</T>
      <T x={200} y={156} size={11} anchor="middle" fill={tok('muted')}>dogs[1].bark() → TypeError: not a function</T>
    </Svg>
  );
}
