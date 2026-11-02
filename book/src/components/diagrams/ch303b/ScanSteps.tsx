// Chapter 303-b: the Rust Drip scanner cutting tokens out of its source.
// Two indices, start and current, walk the bytes; each finished token's
// lexeme is &source[start..current], a (pointer, length) into the source
// String, so scanning allocates nothing (companion/rust/src/scanner.rs).
import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const SRC = 'let x = 10;';
type Tok = { kind: string; lo: number; hi: number };
type S = { start: number; current: number; toks: Tok[]; note: string };

const LET: Tok = { kind: 'Let', lo: 0, hi: 3 };
const X: Tok = { kind: 'Identifier', lo: 4, hi: 5 };
const EQ: Tok = { kind: 'Equal', lo: 6, hi: 7 };
const NUM: Tok = { kind: 'Number', lo: 8, hi: 10 };
const SEMI: Tok = { kind: 'Semicolon', lo: 10, hi: 11 };

const STATES: S[] = [
  { start: 0, current: 0, toks: [], note: 'The source is one String, owned by whoever called the scanner. The scanner holds a &str of it, and two indices: start (where this token began) and current (the next byte to read).' },
  { start: 0, current: 3, toks: [LET], note: 'current walks over l, e, t and stops at the space. The token’s lexeme is &source[start..current], &source[0..3]: "let". It is a pointer and a length into the source, not a copy.' },
  { start: 4, current: 5, toks: [LET, X], note: 'Spaces are skipped, start jumps to 4, and x is an identifier: &source[4..5].' },
  { start: 6, current: 7, toks: [LET, X, EQ], note: '= is one byte: &source[6..7].' },
  { start: 8, current: 10, toks: [LET, X, EQ, NUM], note: '10 is two digit bytes: &source[8..10]. The number’s value is worked out later; the lexeme only says where its text is.' },
  { start: 10, current: 11, toks: [LET, X, EQ, NUM, SEMI], note: 'And ; is &source[10..11]. Five tokens, and not one new string was made. That is why the source must stay put (and unchanged) while the tokens are alive: they all borrow it.' },
];

export default function ScanSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const x0 = 24;
  const cw = 32;
  return (
    <StepFrame title="Cutting lexemes out of the source" steps={s} note={st.note}>
      <Svg w={400} h={226} title="The source bytes, the start and current indices, and the tokens made so far">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>source: String (11 bytes)</T>
        {SRC.split('').map((c, k) => {
          const inTok = k >= st.start && k < st.current;
          return (
            <g key={k}>
              <Box x={x0 + k * cw} y={22} w={cw - 3} h={30} r={3} fill={inTok ? tok('safe', 0.22) : tok('panel')} stroke={inTok ? tok('safe') : tok('line')}>
                <T x={x0 + k * cw + 14} y={37} size={14} mono anchor="middle">{c === ' ' ? '·' : c}</T>
              </Box>
              <T x={x0 + k * cw + 14} y={62} size={11} mono anchor="middle" fill={tok('muted')}>{k}</T>
            </g>
          );
        })}
        <T x={x0 + st.start * cw} y={80} size={11} mono weight={700} fill={tok('brand')}>▲start</T>
        <T x={st.current > 8 ? x0 + st.current * cw + 6 : x0 + st.current * cw - 2} y={96} size={11} mono weight={700} anchor={st.current > 8 ? 'end' : 'start'} fill={tok('accent')}>{st.current > 8 ? 'current▲' : '▲current'}</T>
        <T x={8} y={118} size={11} weight={700} fill={tok('muted')}>TOKENS (each lexeme borrows the source)</T>
        {st.toks.map((t, k) => (
          <g key={t.kind}>
            <T x={12} y={136 + k * 18} size={12} mono>{t.kind}</T>
            <T x={130} y={136 + k * 18} size={12} mono fill={tok('safe')}>&amp;source[{t.lo}..{t.hi}]</T>
            <T x={290} y={136 + k * 18} size={12} mono>"{SRC.slice(t.lo, t.hi)}"</T>
          </g>
        ))}
      </Svg>
    </StepFrame>
  );
}
