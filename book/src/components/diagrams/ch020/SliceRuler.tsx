import { Box, Svg, T, tok } from '../../viz/svg';

const S = 'let x = 42;';
const A = 8;
const B = 10;

/** slice(start, end) cuts between characters, at numbered fences. */
export default function SliceRuler() {
  const W = 33;
  const x0 = 18;
  return (
    <Svg w={400} h={150} title="The string 'let x = 42;' as eleven boxes. Numbered fences sit between the characters, from 0 before the first to 11 after the last. slice(8, 10) cuts at fences 8 and 10 and copies the two characters between them, '42'.">
      <T x={x0} y={12} size={11} weight={700} fill={tok('muted')}>THE CHARACTERS (index above each)</T>
      {[...S].map((c, k) => {
        const x = x0 + k * W;
        const inside = k >= A && k < B;
        return (
          <g key={k}>
            <T x={x + W / 2} y={30} size={11} mono anchor="middle" fill={tok('muted')}>{k}</T>
            <Box x={x} y={40} w={W} h={34} r={0} fill={inside ? tok('brand', 0.18) : tok('panel')} stroke={tok('ink', 0.4)}>
              <T x={x + W / 2} y={57} size={16} mono anchor="middle">{c === ' ' ? '␣' : c}</T>
            </Box>
          </g>
        );
      })}
      {Array.from({ length: S.length + 1 }, (_, k) => {
        const x = x0 + k * W;
        const cut = k === A || k === B;
        return (
          <g key={k}>
            <line x1={x} y1={cut ? 34 : 74} x2={x} y2={86} stroke={cut ? tok('danger') : tok('ink', 0.5)} strokeWidth={cut ? 3 : 1.5} />
            <T x={x} y={98} size={11} mono anchor="middle" weight={cut ? 700 : 400} fill={cut ? tok('danger') : tok('muted')}>{k}</T>
          </g>
        );
      })}
      <T x={x0} y={116} size={11} fill={tok('muted')}>fences between characters: 0 to {S.length}</T>
      <T x={200} y={138} size={14} mono weight={700} anchor="middle" fill={tok('brand')}>s.slice({A}, {B}) → '42'</T>
    </Svg>
  );
}
