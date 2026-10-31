import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const CODE = `if (isDigit(c)) {
  while (isDigit(peek())) advance();
  if (peek() === '.' &&
      isDigit(peekNext())) {
    advance(); // the '.'
    while (isDigit(peek())) advance();
  }
  add('number', Number(lexeme()));
} else if (isAlpha(c)) {
  while (isAlphaNum(peek())) advance();
  add(KEYWORDS.get(lexeme())
      ?? 'identifier');
}`;

const SRC = 'let n = 4.25;';

/** A token found so far: its type, and its literal value if it has one. */
type Tk = { type: string; lexeme: string; literal?: string };
type S = {
  line: number | null;
  start: number;
  current: number;
  tokens: Tk[];
  lookup?: { word: string; hit: string | null };
  peeks?: [number, number];
  note: string;
};

const LET: Tk = { type: 'let', lexeme: 'let' };
const N: Tk = { type: 'identifier', lexeme: 'n' };
const EQ: Tk = { type: '=', lexeme: '=' };
const NUM: Tk = { type: 'number', lexeme: '4.25', literal: '4.25' };
const SEMI: Tk = { type: ';', lexeme: ';' };

const STATES: S[] = [
  { line: null, start: 0, current: 0, tokens: [], note: 'A new token begins. start and current both point at “l”. The scanner has not decided yet what kind of token this is.' },
  { line: 8, start: 0, current: 1, tokens: [], note: 'advance() takes “l”. It is not a digit, a quote or a symbol, but isAlpha says it is a letter, so this token is a word.' },
  { line: 9, start: 0, current: 3, tokens: [], note: 'Keep taking letters, digits and underscores. “e” and “t” go in. peek() shows a space, so the word ends. The lexeme is “let”.' },
  { line: 10, start: 0, current: 3, tokens: [LET], lookup: { word: 'let', hit: 'let' }, note: 'Only now does the scanner ask the table: is “let” a keyword? Yes. The token type is let, not identifier.' },
  { line: 10, start: 4, current: 5, tokens: [LET, N], lookup: { word: 'n', hit: null }, note: 'The space is skipped. “n” is a word too, one letter long. The table has no entry for “n”, so ?? falls back to identifier.' },
  { line: null, start: 6, current: 7, tokens: [LET, N, EQ], note: 'Another space, then “=”. The next character is a space, not a second “=”, so this is the single-character token =.' },
  { line: 1, start: 8, current: 9, tokens: [LET, N, EQ], note: '“4” is a digit, so this token is a number. The loop takes digits while there are any: only “4” here.' },
  { line: 2, start: 8, current: 9, tokens: [LET, N, EQ], peeks: [9, 10], note: 'peek() is “.”. That might start a fraction, or it might be something else. peekNext() looks one further: “2”, a digit. So the dot belongs to the number.' },
  { line: 5, start: 8, current: 12, tokens: [LET, N, EQ], note: 'advance() takes the dot, then the loop takes “2” and “5”. peek() is “;”, so the number ends. The lexeme is “4.25”.' },
  { line: 7, start: 8, current: 12, tokens: [LET, N, EQ, NUM], note: 'Number("4.25") turns the text into the JavaScript number 4.25. It is stored in the token’s literal field, next to the lexeme.' },
  { line: null, start: 12, current: 13, tokens: [LET, N, EQ, NUM, SEMI], note: '“;” is a single-character token, and the source is used up. Thirteen characters became five tokens (plus eof at the end).' },
];

const CW = 29;
const X0 = 12;

export default function WordSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Scanning words and numbers" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={196} title="The characters of let n = 4.25; with start and current markers, the keyword table lookup, and the tokens found so far">
        {[...SRC].map((c, k) => {
          const x = X0 + k * CW;
          const inTok = k >= st.start && k < st.current;
          const peeked = st.peeks && (k === st.peeks[0] || k === st.peeks[1]);
          return (
            <g key={k}>
              <Box x={x} y={8} w={26} h={32} fill={inTok ? tok('brand', 0.16) : peeked ? tok('warn', 0.16) : tok('panel')} stroke={inTok ? tok('brand') : peeked ? tok('warn') : tok('ink', 0.35)}>
                <T x={x + 13} y={24} size={15} mono anchor="middle">{c === ' ' ? '·' : c}</T>
              </Box>
              <T x={x + 13} y={50} size={9} mono anchor="middle" fill={tok('muted')}>{k}</T>
            </g>
          );
        })}
        <T x={X0 + st.start * CW + (st.start > 9 ? 26 : 2)} y={64} size={11} mono anchor={st.start > 9 ? 'end' : 'start'} fill={tok('brand')}>start={st.start}</T>
        <T x={Math.min(396, X0 + st.current * CW + (st.current > 9 ? 13 : 2))} y={78} size={11} mono anchor={st.current > 9 ? 'end' : 'start'} fill={tok('ink')} weight={700}>{st.current > 9 ? `current=${st.current} ↑` : `↑ current=${st.current}`}</T>
        {st.peeks && <T x={X0 + st.peeks[0] * CW + 2} y={92} size={11} mono fill={tok('warn')}>peek · peekNext</T>}

        <T x={12} y={110} size={11} weight={700} fill={tok('muted')}>KEYWORDS.get(…)</T>
        {st.lookup ? (
          <T x={120} y={110} size={13} mono>
            '{st.lookup.word}' → <tspan fill={st.lookup.hit ? tok('brand') : tok('accent')} fontWeight={700}>{st.lookup.hit ? `'${st.lookup.hit}'` : 'undefined'}</tspan>
          </T>
        ) : (
          <T x={120} y={110} size={12} fill={tok('muted')}>not asked</T>
        )}

        <T x={12} y={132} size={11} weight={700} fill={tok('muted')}>TOKENS</T>
        {st.tokens.map((t, k) => {
          const x = 12 + k * 77;
          return (
            <Box key={k} x={x} y={142} w={73} h={46} fill={tok('panel')} stroke={tok('ink', 0.45)}>
              <T x={x + 6} y={156} size={10.5} mono weight={700} fill={t.type === 'identifier' ? tok('accent') : t.type === 'number' ? tok('f3') : tok('brand')}>{t.type}</T>
              <T x={x + 6} y={172} size={11} mono>'{t.lexeme}'</T>
              {t.literal && <T x={x + 6} y={184} size={9.5} mono fill={tok('muted')}>literal {t.literal}</T>}
            </Box>
          );
        })}
      </Svg>
    </StepFrame>
  );
}
