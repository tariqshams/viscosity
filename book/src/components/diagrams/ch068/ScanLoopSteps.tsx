import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const CODE = `while (!atEnd()) {
  start = current;
  const c = advance();
  switch (c) {
    case ';': add(';'); break;
    case '<':
      add(match('=') ? '<=' : '<');
      break;
    case ' ': break;
    default:
      if (isDigit(c)) {
        while (isDigit(peek())) advance();
        add('number');
      } else if (isAlpha(c)) {
        while (isAlnum(peek())) advance();
        add('identifier');
      }
  }
}
// then: push the eof token`;

const SRC = 'n <= 12;';

type S = { line: number; start: number; cur: number; peekAt?: number; toks: string[]; note: string };

const STATES: S[] = [
  { line: 0, start: 0, cur: 0, toks: [], note: 'Two pointers into the source, both at 0. current is the next character to read. start marks where the token being built began.' },
  { line: 2, start: 0, cur: 1, toks: [], note: 'start = current (0). Then advance() returns “n” and moves current on to 1. The highlighted box, from start up to current, is the token so far.' },
  { line: 14, start: 0, cur: 1, peekAt: 1, toks: [], note: '“n” is a letter, so this is a name. Keep going while the next character is a letter or digit. peek() looks at index 1: a space. It only looks: current doesn’t move.' },
  { line: 15, start: 0, cur: 1, toks: ['identifier n'], note: 'The name is finished. add() slices from start to current, giving the lexeme “n”, and pushes an identifier token.' },
  { line: 8, start: 1, cur: 2, toks: ['identifier n'], note: 'Next round: start = 1, and advance() reads a space. The space case does nothing at all: no token. Spaces only separate.' },
  { line: 5, start: 2, cur: 3, peekAt: 3, toks: ['identifier n'], note: 'start = 2, advance() reads “<”. That could be the whole token, or the start of “<=”. We can’t tell without looking at index 3.' },
  { line: 6, start: 2, cur: 4, toks: ['identifier n', '<='], note: 'match(\'=\') checks index 3. It is “=”, so match consumes it too (current becomes 4) and returns true. The lexeme is “<=”: one token, the longest that fits.' },
  { line: 8, start: 4, cur: 5, toks: ['identifier n', '<='], note: 'Another space. Skipped.' },
  { line: 11, start: 5, cur: 7, peekAt: 7, toks: ['identifier n', '<='], note: 'advance() reads “1”, a digit. The loop keeps eating digits: peek sees “2”, so advance. Then peek sees “;”, which isn’t a digit, so the loop stops with current at 7.' },
  { line: 12, start: 5, cur: 7, toks: ['identifier n', '<=', 'number 12'], note: 'add(\'number\') slices 5 to 7: the lexeme “12”. (The real code also turns the text into the number 12; numbers get a closer look two chapters on.)' },
  { line: 4, start: 7, cur: 8, toks: ['identifier n', '<=', 'number 12', ';'], note: 'A single-character token: advance() reads “;” and add makes it a token straight away.' },
  { line: 19, start: 8, cur: 8, toks: ['identifier n', '<=', 'number 12', ';', 'eof'], note: 'current is 8, the length of the source, so atEnd() is true and the loop stops. The scanner pushes eof. 8 characters became 5 tokens.' },
];

const CW = 44;
const X0 = 22;

function Pointer({ p, y, label, color }: { p: number; y: number; label: string; color: string }) {
  const x = X0 + p * CW - 2;
  const right = p >= 6;
  return (
    <T x={right ? x + 6 : x - 6} y={y} size={12} mono weight={700} anchor={right ? 'end' : 'start'} fill={color}>
      {right ? `${label} ${p} ▲` : `▲ ${label} ${p}`}
    </T>
  );
}

export default function ScanLoopSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="start and current, scanning n <= 12;" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={190} title="The characters of n <= 12; with the start and current pointers, the characters of the token being built highlighted, and the tokens made so far.">
        {[...SRC].map((c, k) => {
          const x = X0 + k * CW;
          const inTok = k >= st.start && k < st.cur;
          const peeked = st.peekAt === k;
          return (
            <g key={k}>
              <Box x={x} y={10} w={CW - 4} h={40} r={4}
                fill={inTok ? tok('brand', 0.2) : peeked ? tok('warn', 0.18) : tok('panel')}
                stroke={inTok ? tok('brand') : peeked ? tok('warn') : tok('ink', 0.35)} dash={peeked && !inTok}>
                <T x={x + (CW - 4) / 2} y={30} size={18} mono anchor="middle">{c === ' ' ? '·' : c}</T>
              </Box>
              <T x={x + (CW - 4) / 2} y={60} size={11} mono anchor="middle" fill={tok('muted')}>{k}</T>
            </g>
          );
        })}
        <T x={X0 + SRC.length * CW + 6} y={30} size={11} mono fill={tok('muted')}>end</T>
        <Pointer p={st.start} y={80} label="start" color={tok('brand')} />
        <Pointer p={st.cur} y={100} label="current" color={tok('accent')} />
        {st.peekAt !== undefined && <T x={X0 + st.peekAt * CW + (CW - 4) / 2} y={118} size={11} mono anchor="middle" fill={tok('warn')}>peek()</T>}
        <T x={10} y={142} size={11} weight={700} fill={tok('muted')}>TOKENS</T>
        {st.toks.map((t, j) => {
          const x = 10 + j * 77;
          return (
            <Box key={j} x={x} y={150} w={76} h={36} r={6} fill={tok('accent', 0.1)} stroke={tok('accent')}>
              <T x={x + 38} y={161} size={11} mono anchor="middle" fill={tok('muted')}>{t.split(' ')[0]}</T>
              <T x={x + 38} y={177} size={12} mono weight={700} anchor="middle">{t.split(' ')[1] ?? (t === 'eof' ? '·' : t)}</T>
            </Box>
          );
        })}
      </Svg>
    </StepFrame>
  );
}
