import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 306: encoding U+1F44D (thumbs up) in UTF-8, one step at a time.
const GROUPS = ['000', '011111', '010001', '001101'];
const MARKS = ['11110', '10', '10', '10'];
const HEX = ['F0', '9F', '91', '8D'];
const COLS = ['f1', 'f2', 'f3', 'f4'];

type S = { bits: boolean; split: boolean; marks: boolean; hex: boolean; note: string };

const STATES: S[] = [
  { bits: false, split: false, marks: false, hex: false, note: 'The character 👍 is code point U+1F44D, the number 128,077. UTF-8 has to store that number as a row of bytes.' },
  { bits: true, split: false, marks: false, hex: false, note: 'Written in binary it needs 17 bits, more than the 16 that three bytes of UTF-8 can carry, so it takes the four-byte form, which has room for 21 bits. Pad it to 21 bits with zeros on the left.' },
  { bits: true, split: true, marks: false, hex: false, note: 'Cut the 21 bits into groups of 3, 6, 6 and 6, from the left. Each group will go into one byte.' },
  { bits: true, split: true, marks: true, hex: false, note: 'Put a marker in front of each group. 11110 says "the first of four bytes"; 10 says "a continuation byte". A reader can always tell where a character starts.' },
  { bits: true, split: true, marks: true, hex: true, note: 'Read each byte in hexadecimal: F0 9F 91 8D, the four bytes Node printed for 👍. In UTF-16 the same character is two 16-bit units instead, D83D DC4D.' },
];

export default function Utf8Steps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Encoding 👍 in UTF-8" steps={s} note={st.note}>
      <Svg w={400} h={176} title="The code point U+1F44D written in binary, cut into groups, given marker bits, and read as four bytes">
        <T x={8} y={14} size={13} mono>U+1F44D = 128077</T>
        {st.bits && !st.split && <T x={8} y={46} size={13} mono>0 0001 1111 0100 0100 1101</T>}
        {st.split && GROUPS.map((g, k) => (
          <g key={k}>
            <Box x={8 + k * 98} y={36} w={92} h={24} fill={tok(COLS[k], 0.12)} stroke={tok(COLS[k])}>
              <T x={54 + k * 98} y={48} size={12} mono anchor="middle">{g}</T>
            </Box>
            {st.marks && (
              <Box x={8 + k * 98} y={78} w={92} h={24} fill={tok('panel')} stroke={tok(COLS[k])}>
                <T x={54 + k * 98} y={90} size={11} mono anchor="middle">
                  <tspan fill={tok('muted')}>{MARKS[k]}</tspan>{g}
                </T>
              </Box>
            )}
            {st.hex && <T x={54 + k * 98} y={124} size={15} mono weight={700} anchor="middle">{HEX[k]}</T>}
          </g>
        ))}
        {st.marks && <T x={8} y={150} size={11} fill={tok('muted')}>grey bits: markers; coloured bits: the code point</T>}
        {st.hex && <T x={8} y={166} size={11} fill={tok('muted')}>4 bytes in UTF-8; 2 units (4 bytes) in UTF-16</T>}
      </Svg>
    </StepFrame>
  );
}
