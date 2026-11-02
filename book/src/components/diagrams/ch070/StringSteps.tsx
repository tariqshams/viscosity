import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const CODE = `case '"': {
  while (peek() !== '"' && !atEnd()) {
    if (peek() === '\\n') line++;
    advance();
  }
  if (atEnd()) {
    error(line, 'Unterminated string.');
    break;
  }
  advance(); // the closing "
  add('string',
    source.slice(start + 1, current - 1));
  break;
}`;

type S = { src: string; line: number | null; start: number; cur: number; ln: number; value?: boolean; error?: boolean; note: string };

const A = '"hi⏎yo";';
const B = '"hi';

const STATES: S[] = [
  { src: A, line: 0, start: 0, cur: 1, ln: 1, note: 'The main loop read a quote mark, so this token is a string. start is on the opening quote; current has moved past it. The line counter says 1.' },
  { src: A, line: 3, start: 0, cur: 3, ln: 1, note: 'The loop takes characters while the next one is not a closing quote: “h”, then “i”. Nothing is checked about them; anything can go inside a Drip string.' },
  { src: A, line: 2, start: 0, cur: 4, ln: 2, note: 'The next character is a newline. Drip strings may span lines, so the loop takes it too, but first it adds 1 to line. Without that, every later token would get the wrong line.' },
  { src: A, line: 1, start: 0, cur: 6, ln: 2, note: '“y” and “o” go in. Now peek() is a quote mark, so the loop stops, with current on the closing quote.' },
  { src: A, line: 9, start: 0, cur: 7, ln: 2, note: 'advance() takes the closing quote. Between start and current is the lexeme: all seven characters, both quote marks included.' },
  { src: A, line: 10, start: 0, cur: 7, ln: 2, value: true, note: 'The value is a narrower slice, from start + 1 to current − 1: the five characters between the quotes. The token is recorded on line 2, the line the string ends on.' },
  { src: B, line: 6, start: 0, cur: 3, ln: 1, error: true, note: 'A different source: "hi with no closing quote. The loop runs into the end of the source instead. atEnd() is true, so the scanner reports Unterminated string. and makes no token.' },
];

const CW = 34;
const X0 = 20;

export default function StringSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Scanning a string" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={150} title="The characters of the string being scanned, with start and current, the line counter, and the lexeme and value slices.">
        {[...st.src].map((c, k) => {
          const x = X0 + k * CW;
          const inTok = k >= st.start && k < st.cur;
          const inVal = st.value && k > st.start && k < st.cur - 1;
          return (
            <g key={`${st.src}${k}`}>
              <Box x={x} y={10} w={CW - 4} h={34} r={4} fill={inVal ? tok('accent', 0.22) : inTok ? tok('brand', 0.16) : tok('panel')} stroke={inVal ? tok('accent') : inTok ? tok('brand') : tok('ink', 0.35)}>
                <T x={x + (CW - 4) / 2} y={27} size={16} mono anchor="middle" fill={c === '⏎' ? tok('muted') : undefined}>{c}</T>
              </Box>
              <T x={x + (CW - 4) / 2} y={56} size={11} mono anchor="middle" fill={tok('muted')}>{k}</T>
            </g>
          );
        })}
        <T x={X0 + st.cur * CW - 2} y={74} size={12} mono weight={700} fill={tok('accent')}>▲ current = {st.cur}</T>
        <T x={300} y={27} size={13} mono weight={700}>line = {st.ln}</T>
        {st.value && (
          <g>
            <T x={10} y={100} size={12} mono>lexeme  <tspan fontWeight={700} fill={tok('brand')}>"hi⏎yo"</tspan>  slice(0, 7)</T>
            <T x={10} y={120} size={12} mono>value   <tspan fontWeight={700} fill={tok('accent')}>hi⏎yo</tspan>    slice(1, 6)</T>
          </g>
        )}
        {st.error && <T x={10} y={104} size={13} mono weight={700} fill={tok('danger')}>[line 1] Error: Unterminated string.</T>}
      </Svg>
    </StepFrame>
  );
}
