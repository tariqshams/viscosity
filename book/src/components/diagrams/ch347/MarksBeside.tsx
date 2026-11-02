// Chapter 347: where drip-rs keeps its mark bits. The TypeScript heap
// puts an isMarked flag in every object's header
// (companion/ts/src/vm/object.ts); drip-rs keeps them in a Marks value
// beside the heap, one Vec<bool> per arena plus the gray stack
// (companion/rust/src/gc.rs, struct Marks and Heap::collect), so blacken
// can read the heap through &self while it writes the bits through
// &mut Marks.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const ARENAS = ['strings', 'lists', 'closures', '…six more'];

export default function MarksBeside() {
  return (
    <Svg w={400} h={226} title="drip-rs's heap holds the arenas; the mark bits live in a separate Marks value, taken out of the heap during a collection">
      <T x={8} y={14} size={12} weight={700}>Heap (read through &amp;self)</T>
      <Box x={8} y={24} w={176} h={150} r={5} fill={tok('panel')} stroke={tok('brand')}>
        {ARENAS.map((a, k) => (
          <g key={a}>
            <T x={18} y={44 + k * 34} size={11} mono>{a}</T>
            {a.startsWith('…') ? null : [0, 1, 2].map((i) => (
              <Box key={i} x={98 + i * 26} y={34 + k * 34} w={22} h={20} r={2} fill={tok('brand', 0.1)} stroke={tok('brand')} />
            ))}
          </g>
        ))}
      </Box>

      <T x={216} y={14} size={12} weight={700}>Marks (&amp;mut)</T>
      <Box x={216} y={24} w={176} h={150} r={5} fill={tok('panel')} stroke={tok('safe')}>
        {ARENAS.map((a, k) => (
          <g key={a}>
            <T x={226} y={44 + k * 34} size={11} mono>{a.startsWith('…') ? '… and gray' : a}</T>
            {a.startsWith('…') ? null : [0, 1, 2].map((i) => (
              <Box key={i} x={306 + i * 26} y={34 + k * 34} w={22} h={20} r={2} fill={i === 1 ? tok('paper') : tok('safe', 0.25)} stroke={tok('safe')}>
                <T x={317 + i * 26} y={44 + k * 34} size={11} mono anchor="middle">{i === 1 ? '0' : '1'}</T>
              </Box>
            ))}
          </g>
        ))}
      </Box>
      <Arrow x1={184} y1={70} x2={214} y2={70} color={tok('safe')} />
      <T x={8} y={194} size={11} fill={tok('muted')}>blacken reads objects in the heap and marks what they</T>
      <T x={8} y={210} size={11} fill={tok('muted')}>refer to in the bitmap: two values, so no borrow clash</T>
    </Svg>
  );
}
