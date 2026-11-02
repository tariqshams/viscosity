import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const LINES = ['let speed = 10.5;', 'print "fast"; // hi'];

type Tok = { type: string; lexeme: string; literal: string; line: number };
type S = { hl: [number, number, number] | null; tok?: Tok; done: number; note: string };

// [line index, from column, to column (exclusive)]
const STATES: S[] = [
  { hl: null, done: 0, note: 'Two lines of Drip: 37 characters, counting the newline between them. We want the tokens: the pieces the parser will care about.' },
  { hl: [0, 0, 3], done: 1, tok: { type: 'let', lexeme: 'let', literal: 'null', line: 1 }, note: 'The first token covers the characters “let”. They spell a keyword, so its type is let. The exact characters are its lexeme.' },
  { hl: [0, 4, 9], done: 2, tok: { type: 'identifier', lexeme: 'speed', literal: 'null', line: 1 }, note: 'The space was skipped: it separates tokens but isn’t one. “speed” is a name the programmer chose, so its type is identifier.' },
  { hl: [0, 10, 11], done: 3, tok: { type: '=', lexeme: '=', literal: 'null', line: 1 }, note: 'A single = is its own token type. For punctuation, Drip uses the symbol itself as the type’s name.' },
  { hl: [0, 12, 16], done: 4, tok: { type: 'number', lexeme: '10.5', literal: '10.5', line: 1 }, note: 'Four characters, one token. The lexeme is the string "10.5". The literal is the actual number 10.5, ready for the interpreter to use.' },
  { hl: [0, 16, 17], done: 5, tok: { type: ';', lexeme: ';', literal: 'null', line: 1 }, note: 'The semicolon ends the statement. Next comes a newline: not a token, but the scanner counts it, so the line number becomes 2.' },
  { hl: [1, 0, 5], done: 6, tok: { type: 'print', lexeme: 'print', literal: 'null', line: 2 }, note: 'print is a keyword too, recorded on line 2. The line number is how an error message will later say where it happened.' },
  { hl: [1, 6, 12], done: 7, tok: { type: 'string', lexeme: '"fast"', literal: 'fast', line: 2 }, note: 'For a string, the lexeme includes the quote marks: 6 characters. The literal is the text inside them, fast, without the quotes.' },
  { hl: [1, 12, 13], done: 8, tok: { type: ';', lexeme: ';', literal: 'null', line: 2 }, note: 'Another semicolon. Then “// hi” is a comment: the scanner skips it, so no token is made for it at all.' },
  { hl: null, done: 9, tok: { type: 'eof', lexeme: '', literal: 'null', line: 2 }, note: 'At the end, the scanner adds an eof token with an empty lexeme. 37 characters have become 9 tokens, and that list is all the parser will see.' },
];

const CW = 20;

export default function TokenSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Cutting two lines into tokens" steps={s} note={st.note}>
      <Svg w={400} h={266} title="The characters of two Drip lines, with the current token's characters highlighted, and a card showing the token's type, lexeme, literal and line.">
        {LINES.map((ln, li) => (
          <g key={li}>
            <T x={6} y={22 + li * 40} size={11} mono fill={tok('muted')}>{li + 1}</T>
            {[...ln].map((c, k) => {
              const on = st.hl && st.hl[0] === li && k >= st.hl[1] && k < st.hl[2];
              const comment = li === 1 && k >= 14;
              return (
                <Box key={k} x={20 + k * CW} y={8 + li * 40} w={CW - 2} h={28} r={3}
                  fill={on ? tok('brand', 0.22) : tok('panel')}
                  stroke={on ? tok('brand') : tok('ink', comment ? 0.15 : 0.3)}>
                  <T x={20 + k * CW + (CW - 2) / 2} y={22 + li * 40} size={14} mono anchor="middle" fill={comment ? tok('muted') : undefined}>{c === ' ' ? '·' : c}</T>
                </Box>
              );
            })}
          </g>
        ))}
        {st.tok && (
          <Box x={20} y={98} w={250} h={106} r={8} fill={tok('accent', 0.08)} stroke={tok('accent')}>
            <T x={34} y={116} size={11} weight={700} fill={tok('accent')}>TOKEN {st.done}</T>
            {([['type', `'${st.tok.type}'`], ['lexeme', `'${st.tok.lexeme}'`], ['literal', st.tok.literal], ['line', String(st.tok.line)]] as const).map(([k, v], j) => (
              <T key={k} x={34} y={138 + j * 18} size={13} mono>
                <tspan fill={tok('muted')}>{k.padEnd(8, ' ')}</tspan>
                <tspan fontWeight={700}>{v}</tspan>
              </T>
            ))}
          </Box>
        )}
        <T x={284} y={110} size={11} weight={700} fill={tok('muted')}>SO FAR</T>
        {STATES.slice(1, st.done + 1).map((x, j) => (
          <T key={j} x={284} y={128 + j * 14} size={11} mono fill={j === st.done - 1 ? tok('ink') : tok('muted')}>{x.tok!.type}</T>
        ))}
        <T x={20} y={254} size={12} fill={tok('muted')}>{st.done} of 9 tokens · spaces and the comment make none</T>
      </Svg>
    </StepFrame>
  );
}
