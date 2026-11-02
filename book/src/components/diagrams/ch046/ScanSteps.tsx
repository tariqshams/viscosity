import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const SRC = '{"x": -1.5}';

type S = { i: number; span?: [number, number]; toks: string[]; note: string };

const STATES: S[] = [
  { i: 0, toks: [], note: 'The finger i starts at 0. There is no space to skip, so the scanner looks at src[0].' },
  { i: 1, span: [0, 1], toks: ["{ at 0"], note: "src[0] is {, one of the six punctuation characters: push the token { kind: '{', at: 0 } and move on by one." },
  { i: 4, span: [1, 4], toks: ["{ at 0", 'str "x" at 1'], note: 'src[1] is a quote, so scanString takes over: it reads x, stops at the closing quote at index 3, and returns the value "x" with end 4.' },
  { i: 5, span: [4, 5], toks: ["{ at 0", 'str "x" at 1', ': at 4'], note: 'A colon: one more punctuation token.' },
  { i: 6, span: [5, 6], toks: ["{ at 0", 'str "x" at 1', ': at 4'], note: 'skipSpace moves the finger past the space at index 5. Spaces never become tokens: they only separate them.' },
  { i: 10, span: [6, 10], toks: ["{ at 0", 'str "x" at 1', ': at 4', 'num -1.5 at 6'], note: 'A minus sign starts a number, so scanNumber reads -, 1, . and 5, stops at }, and returns the value -1.5 (worked out by Number) with end 10.' },
  { i: 11, span: [10, 11], toks: ["{ at 0", 'str "x" at 1', ': at 4', 'num -1.5 at 6', '} at 10'], note: 'The closing brace is the last character.' },
  { i: 11, toks: ["{ at 0", 'str "x" at 1', ': at 4', 'num -1.5 at 6', '} at 10', 'end at 11'], note: 'i equals the length, so the loop stops, and an end token marks where the text ran out. Eleven characters became six tokens, each knowing where it started.' },
];

export default function ScanSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title={`Scanning ${SRC}`} steps={s} note={st.note}>
      <Svg w={400} h={196} title={`The text ${SRC} as numbered characters, with the scanner's finger at index ${st.i}, and the tokens found so far: ${st.toks.join(', ') || 'none'}`}>
        {[...SRC].map((c, k) => {
          const x = 14 + k * 32;
          const on = st.span && k >= st.span[0] && k < st.span[1];
          return (
            <g key={k}>
              <Box x={x} y={10} w={30} h={30} fill={on ? tok('brand', 0.16) : tok('panel')} stroke={on ? tok('brand') : tok('line')}>
                <T x={x + 15} y={25.5} size={15} mono anchor="middle">{c === ' ' ? '␣' : c}</T>
              </Box>
              <T x={x + 15} y={50} size={11} mono anchor="middle" fill={tok('muted')}>{k}</T>
            </g>
          );
        })}
        <T x={Math.min(14 + st.i * 32 + 15, 362)} y={68} size={13} weight={700} anchor="middle" fill={tok('brand')}>▲ i = {st.i}</T>
        <T x={6} y={92} size={11} weight={700} fill={tok('muted')}>TOKENS</T>
        {st.toks.length === 0 && <T x={6} y={116} size={12} fill={tok('muted')}>(none yet)</T>}
        {st.toks.map((t, k) => {
          const x = 6 + (k % 3) * 131;
          const y = 104 + Math.floor(k / 3) * 40;
          return (
            <Box key={k} x={x} y={y} w={125} h={30} r={15} fill={tok('safe', 0.1)} stroke={tok('safe')}>
              <T x={x + 62} y={y + 15.5} size={12} mono anchor="middle">{t}</T>
            </Box>
          );
        })}
      </Svg>
    </StepFrame>
  );
}
