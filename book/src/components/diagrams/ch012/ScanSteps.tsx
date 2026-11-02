import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const CODE = `const s = '42+7';
const parts = [];
let i = 0;
while (i < s.length) {
  const start = i;
  if (isDigit(s.charCodeAt(i))) {
    while (isDigit(s.charCodeAt(i))) i++;
  } else {
    i++;
  }
  parts.push(s.slice(start, i));
}`;

type S = { line: number; i: number; start: number | null; parts: string[]; note: string };

const STATES: S[] = [
  { line: 2, i: 0, start: null, parts: [], note: 'We read the string one character at a time. i is our finger: the index of the next character to look at.' },
  { line: 5, i: 0, start: 0, parts: [], note: 'Remember where this piece starts (start = 0). s.charCodeAt(0) is 52, the code for “4”. Codes 48 to 57 are the digits, so this is a digit.' },
  { line: 6, i: 1, start: 0, parts: [], note: 'Keep moving while we see digits. Index 1 is “2”, code 50: still a digit, so i moves on to 2.' },
  { line: 6, i: 2, start: 0, parts: [], note: 'Index 2 is “+”, code 43. That is not between 48 and 57, so the digit run stops here, with i = 2.' },
  { line: 10, i: 2, start: 0, parts: ['42'], note: 's.slice(0, 2) copies indexes 0 and 1, stopping just BEFORE 2. The piece is “42”.' },
  { line: 8, i: 3, start: 2, parts: ['42'], note: 'Next piece starts at 2. “+” is not a digit, so it is a piece on its own: move i one step.' },
  { line: 10, i: 3, start: 2, parts: ['42', '+'], note: 's.slice(2, 3) is “+”.' },
  { line: 6, i: 4, start: 3, parts: ['42', '+'], note: '“7” is a digit (code 55). The run moves i to 4, which is s.length: past the end. charCodeAt(4) is NaN, which is not a digit, so the run stops.' },
  { line: 10, i: 4, start: 3, parts: ['42', '+', '7'], note: 's.slice(3, 4) is “7”. Now i < s.length is false and the loop ends. One string has become three pieces. This is what a scanner does.' },
];

const SRC = '42+7';

export default function ScanSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Cutting a string into pieces" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={150} title="The characters of '42+7' with their codes, the finger i, and the pieces found so far">
        {[...SRC].map((c, k) => {
          const x = 20 + k * 70;
          const inPiece = st.start !== null && k >= st.start && k < st.i;
          return (
            <g key={k}>
              <Box x={x} y={10} w={60} h={40} fill={inPiece ? tok('brand', 0.16) : tok('panel')} stroke={inPiece ? tok('brand') : tok('ink', 0.4)}>
                <T x={x + 30} y={30} size={18} mono anchor="middle">{c}</T>
              </Box>
              <T x={x + 30} y={62} size={11} mono anchor="middle" fill={tok('muted')}>{k} · {c.charCodeAt(0)}</T>
            </g>
          );
        })}
        <T x={300} y={62} size={11} mono anchor="middle" fill={tok('muted')}>4 · end</T>
        <T x={20 + st.i * 70 + 30} y={82} size={13} mono weight={700} anchor="middle" fill={st.i >= SRC.length ? tok('danger') : tok('brand')}>↑ i = {st.i}</T>
        {st.start !== null && <T x={20 + st.start * 70 + 2} y={100} size={11} mono fill={tok('muted')}>start = {st.start}</T>}
        <T x={20} y={128} size={13} mono>parts: [ {st.parts.map((p) => `'${p}'`).join(', ')} ]</T>
      </Svg>
    </StepFrame>
  );
}
