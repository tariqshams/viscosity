import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const CODE = `case '"': {
  const startLine = line;
  let value = '';
  while (peek() !== '"' && !atEnd()) {
    const ch = advance();
    if (ch === '\\n') line++;
    if (ch === '\\\\' && !atEnd()) {
      value += ESCAPES[advance()];
    } else {
      value += ch;
    }
  }
  if (atEnd()) {
    error('unterminated string', startLine);
    break;
  }
  advance(); // the closing "
  add('string', value, startLine);
  break;
}`;

type S = { src: string; line: number | null; start: number; cur: number; ln: number; val?: string; done?: boolean; error?: boolean; note: string };

const A = '"a\\"⏎b";';
const B = '"hi';

const STATES: S[] = [
  { src: A, line: 1, start: 0, cur: 1, ln: 1, val: '', note: 'The main loop read a quote mark, so this token is a string. startLine remembers line 1, where it begins, and value starts empty: the scanner builds the value one character at a time.' },
  { src: A, line: 9, start: 0, cur: 2, ln: 1, val: 'a', note: 'advance() takes “a”. It is not a backslash, so it goes straight into value.' },
  { src: A, line: 7, start: 0, cur: 4, ln: 1, val: 'a"', note: 'advance() takes a backslash: an escape. The loop takes the next character at once, the quote mark, and ESCAPES turns \\" into a plain " in value. Because it was taken here, the loop’s test never sees it, so it does not end the string.' },
  { src: A, line: 5, start: 0, cur: 5, ln: 2, val: 'a"⏎', note: 'A newline. Drip strings may span lines, so it goes into value too, but first line goes up by 1. Without that, every later token would get the wrong line.' },
  { src: A, line: 9, start: 0, cur: 6, ln: 2, val: 'a"⏎b', note: '“b” goes in. Now peek() is a quote mark, so the loop stops, with current on the closing quote.' },
  { src: A, line: 16, start: 0, cur: 7, ln: 2, val: 'a"⏎b', note: 'advance() takes the closing quote. Between start and current is the lexeme: all seven characters, both quote marks and the backslash included.' },
  { src: A, line: 17, start: 0, cur: 7, ln: 2, val: 'a"⏎b', done: true, note: 'The token is made: its lexeme is the seven characters of source, its value the four characters built along the way. It is recorded on startLine, line 1, where the string began.' },
  { src: B, line: 13, start: 0, cur: 3, ln: 1, error: true, note: 'A different source: "hi with no closing quote. The loop runs into the end of the source instead. atEnd() is true, so the scanner makes an error token, unterminated string, on the line where the string began, and no string token.' },
];

const CW = 34;
const X0 = 20;

export default function StringSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Scanning a string" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={150} title="The characters of the string being scanned, with current, the line counter, the value built so far, and the lexeme.">
        {[...st.src].map((c, k) => {
          const x = X0 + k * CW;
          const inTok = k >= st.start && k < st.cur;
          return (
            <g key={`${st.src}${k}`}>
              <Box x={x} y={10} w={CW - 4} h={34} r={4} fill={inTok ? tok('brand', 0.16) : tok('panel')} stroke={inTok ? tok('brand') : tok('ink', 0.35)}>
                <T x={x + (CW - 4) / 2} y={27} size={16} mono anchor="middle" fill={c === '⏎' ? tok('muted') : undefined}>{c}</T>
              </Box>
              <T x={x + (CW - 4) / 2} y={56} size={11} mono anchor="middle" fill={tok('muted')}>{k}</T>
            </g>
          );
        })}
        <T x={X0 + st.cur * CW - 2} y={74} size={12} mono weight={700} fill={tok('accent')}>▲ current = {st.cur}</T>
        <T x={300} y={27} size={13} mono weight={700}>line = {st.ln}</T>
        {st.val !== undefined && (
          <T x={10} y={100} size={12} mono>value   <tspan fontWeight={700} fill={tok('accent')}>{st.val === '' ? "''" : st.val}</tspan>{st.done ? '    4 chars' : '  (so far)'}</T>
        )}
        {st.done && <T x={10} y={120} size={12} mono>lexeme  <tspan fontWeight={700} fill={tok('brand')}>"a\"⏎b"</tspan>  slice(0, 7)</T>}
        {st.error && <T x={10} y={104} size={13} mono weight={700} fill={tok('danger')}>line 1: unterminated string</T>}
      </Svg>
    </StepFrame>
  );
}
