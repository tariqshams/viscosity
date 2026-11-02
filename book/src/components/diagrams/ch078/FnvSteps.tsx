import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// FNV-1a of "vx", one operation at a time. Every number here was computed
// with the companion's hashString (vm/object.ts): the final hash of "vx"
// is 1296684707 (0x4d49d6a3), and 1296684707 & 7 is 3.
const CODE = `let h = 2166136261;
for (let i = 0; i < s.length; i++) {
  h ^= s.charCodeAt(i);
  h = Math.imul(h, 16777619);
}
return h >>> 0;`;

type S = { line: number | null; hex: string; dec: string; ch?: number; slot?: boolean; note: string };

const STATES: S[] = [
  { line: 0, hex: '811c9dc5', dec: '2166136261', note: 'Every hash starts from the same number, the offset basis. Nothing about "vx" has been looked at yet.' },
  { line: 2, hex: '811c9db3', dec: '2166136243', ch: 0, note: 'The first character, v, has code 118 (0x76). XOR flips the bits of h wherever 118 has a 1 bit, so only the last byte changes: c5 becomes b3.' },
  { line: 3, hex: 'f30c40c9', dec: '4077666505', ch: 0, note: 'Multiply by the FNV prime and keep only the low 32 bits. Now the change made by v has spread into every part of the number, not only the last byte.' },
  { line: 2, hex: 'f30c40b1', dec: '4077666481', ch: 1, note: 'The second character, x, has code 120 (0x78). XOR it in: again only the last byte moves, c9 becomes b1.' },
  { line: 3, hex: '4d49d6a3', dec: '1296684707', ch: 1, note: 'Multiply again and keep 32 bits. That was the last character, so this is the hash.' },
  { line: 5, hex: '4d49d6a3', dec: '1296684707', note: '>>> 0 reads the 32 bits as a number that is never negative. hash("vx") is 1296684707, every time, on every computer.' },
  { line: null, hex: '4d49d6a3', dec: '1296684707', slot: true, note: 'A table with 8 slots keeps only the last 3 bits: 0x…a3 ends in binary 011, so hash & 7 is 3, and "vx" belongs in slot 3.' },
];

export default function FnvSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title='Hashing "vx" with FNV-1a' steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={150} title="The two characters of vx, and the hash h after each step, in hexadecimal and in decimal">
        <T x={8} y={14} size={11} weight={700} fill={tok('muted')}>THE KEY</T>
        {['v', 'x'].map((c, k) => (
          <Box key={c} x={8 + k * 52} y={24} w={46} h={40} fill={st.ch === k ? tok('brand', 0.18) : tok('panel')} stroke={st.ch === k ? tok('brand') : tok('line')}>
            <T x={31 + k * 52} y={38} size={15} mono anchor="middle" weight={700}>{c}</T>
            <T x={31 + k * 52} y={55} size={11} mono anchor="middle" fill={tok('muted')}>{c === 'v' ? 118 : 120}</T>
          </Box>
        ))}
        <T x={130} y={14} size={11} weight={700} fill={tok('muted')}>h (32 bits)</T>
        <Box x={130} y={24} w={262} h={40} fill={tok('panel')} stroke={tok('ink', 0.5)}>
          <T x={142} y={38} size={15} mono weight={700}>0x{st.hex}</T>
          <T x={142} y={55} size={12} mono fill={tok('muted')}>{st.dec}</T>
        </Box>
        {st.slot ? (
          <g>
            <T x={8} y={88} size={12} mono>…1010 0011  (0xa3, the last byte)</T>
            <T x={8} y={108} size={12} mono>&amp;  0000 0111  (7)</T>
            <T x={8} y={130} size={14} mono weight={700} fill={tok('brand')}>=  0000 0011  → slot 3</T>
          </g>
        ) : (
          <T x={8} y={98} size={12} fill={tok('muted')}>XOR mixes a character in; the multiply spreads it out.</T>
        )}
      </Svg>
    </StepFrame>
  );
}
