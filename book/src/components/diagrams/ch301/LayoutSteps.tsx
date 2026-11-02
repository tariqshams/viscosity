import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 301: laying out Sh = Dot | Sq(u32) | Re(u32, u32) as a C-style
// tagged union (a one-byte tag, then a union of the variants), and the
// bytes of three values. Numbers are stored little-endian, as on x86-64
// and RISC-V.
type Kind = 'tag' | 'pad' | 'a' | 'b';
type Part = [number, number, Kind, string];
type S = { parts: Part[]; label: string; note: string };

const STATES: S[] = [
  { parts: [[0, 1, 'tag', 'tag']], label: 'the tag', note: 'The tag says which variant this is: 0 for Dot, 1 for Sq, 2 for Re. Three variants fit easily in one byte, so the tag is byte 0.' },
  { parts: [[0, 1, 'tag', 'tag'], [1, 4, 'pad', 'padding'], [4, 8, 'a', 'side']], label: 'Sq’s payload', note: 'Sq holds one u32 (4 bytes). A u32 must start at an address divisible by 4 (its alignment), so bytes 1 to 3 are left empty as padding, and the side goes in bytes 4 to 7.' },
  { parts: [[0, 1, 'tag', 'tag'], [1, 4, 'pad', 'padding'], [4, 8, 'a', 'side or w'], [8, 12, 'b', 'h']], label: 'Re’s payload', note: 'Re holds two u32s, w and h, in bytes 4 to 11. The payloads overlap: Sq’s side and Re’s w share bytes 4 to 7. That is the union. The whole value is as big as the biggest case: 12 bytes.' },
  { parts: [[0, 1, 'tag', '1'], [1, 4, 'pad', ''], [4, 8, 'a', '05 00 00 00'], [8, 12, 'b', 'not used']], label: 'Sq(5)', note: 'Sq(5): tag 1, then 5 as a little-endian u32 (05 00 00 00). Bytes 8 to 11 belong to no field of Sq: whatever was there before stays, and nothing reads it.' },
  { parts: [[0, 1, 'tag', '2'], [1, 4, 'pad', ''], [4, 8, 'a', '02 00 00 00'], [8, 12, 'b', '03 00 00 00']], label: 'Re(2, 3)', note: 'Re(2, 3): tag 2, w = 2 in bytes 4 to 7, h = 3 in bytes 8 to 11. Code reading a Sh reads byte 0 first, and only then knows what the other bytes mean.' },
  { parts: [[0, 1, 'tag', '0'], [1, 4, 'pad', ''], [4, 12, 'a', 'not used']], label: 'Dot', note: 'Dot has no fields, yet it still takes all 12 bytes, so that an array of Sh can find element i at byte i × 12. Only the tag means anything.' },
];

const fill = (k: Kind) => (k === 'tag' ? tok('brand', 0.2) : k === 'a' ? tok('f1', 0.25) : k === 'b' ? tok('f2', 0.25) : tok('line', 0.4));

export default function LayoutSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const kindAt = (i: number) => st.parts.find(([a, b]) => i >= a && i < b)?.[2];
  return (
    <StepFrame title="A tagged union, byte by byte" steps={s} note={st.note}>
      <Svg w={400} h={112} title="Twelve bytes: a tag byte, three bytes of padding and an eight-byte payload shared by the variants">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>Sh IN MEMORY: {st.label}</T>
        {Array.from({ length: 12 }, (_, i) => {
          const k = kindAt(i);
          return (
            <g key={i}>
              <Box x={8 + i * 32} y={24} w={30} h={30} r={3} fill={k ? fill(k) : 'transparent'} stroke={k ? tok('ink', 0.45) : tok('line')} dash={!k} />
              <T x={23 + i * 32} y={66} size={11} mono anchor="middle" fill={tok('muted')}>{i}</T>
            </g>
          );
        })}
        {st.parts.map(([a, b, , text]) => (
          b - a === 1
            ? <T key={a} x={23 + a * 32} y={39} size={12} mono anchor="middle">{text === 'tag' ? 't' : text}</T>
            : <T key={a} x={8 + a * 32 + (b - a) * 16} y={88} size={11} mono anchor="middle">{text}</T>
        ))}
      </Svg>
    </StepFrame>
  );
}
