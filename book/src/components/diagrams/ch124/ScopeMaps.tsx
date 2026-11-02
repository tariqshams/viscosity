// Checking `if true { let t = 1; } print t;`: the block is checked in a
// copy of Γ, which gains t; the outer Γ never does, so `print t` fails.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

export default function ScopeMaps() {
  return (
    <Svg w={400} h={210} title="On the left, the program: line 1, if true, open brace, let t = 1, close brace; line 2, print t. On the right, the outer Γ is empty; the block's copy of Γ holds t : number and is thrown away at the closing brace; at line 2 the outer Γ has no t, so the checker reports undefined variable t.">
      <T x={10} y={24} size={12} mono>if true {'{'}</T>
      <T x={26} y={50} size={12} mono>let t = 1;</T>
      <T x={10} y={76} size={12} mono>{'}'}</T>
      <T x={10} y={150} size={12} mono>print t;</T>
      <Box x={170} y={8} w={222} h={34} stroke={tok('ink', 0.5)}>
        <T x={180} y={25} size={12} fill={tok('muted')}>outer Γ:</T>
        <T x={250} y={25} size={12} mono>(empty)</T>
      </Box>
      <Box x={196} y={52} w={196} h={46} dash stroke={tok('brand')} fill={tok('brand', 0.08)}>
        <T x={206} y={66} size={11} fill={tok('brand')}>the block’s copy of Γ</T>
        <T x={206} y={86} size={12} mono>t : number</T>
      </Box>
      <Arrow x1={110} y1={50} x2={192} y2={84} color={tok('brand')} />
      <T x={294} y={116} size={11} anchor="middle" fill={tok('muted')}>thrown away at the closing brace</T>
      <Box x={170} y={132} w={222} h={34} stroke={tok('danger')} fill={tok('danger', 0.08)}>
        <T x={180} y={149} size={12} fill={tok('muted')}>outer Γ:</T>
        <T x={250} y={149} size={12} mono>(still empty)</T>
      </Box>
      <Arrow x1={80} y1={150} x2={166} y2={150} color={tok('danger')} />
      <T x={200} y={192} size={12} anchor="middle" weight={700} fill={tok('danger')}>line 2: undefined variable 't'</T>
    </Svg>
  );
}
