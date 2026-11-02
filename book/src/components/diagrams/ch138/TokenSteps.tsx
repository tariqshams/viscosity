// Chapter 138: what a drip-rs Token is. Scanning `let x = 1.5;` with the
// real scanner (book/companion/rust/src/scanner.rs) gives six tokens;
// their Debug output was printed with rustc 1.97. Each token's lexeme is
// a &str: a pointer to a byte of the source plus a length, drawn as a
// bracket under the source bytes. size_of::<Token>() is 32 and
// size_of::<TokenKind>() is 1, measured on x86-64 with rustc 1.97; the
// order of the fields in memory is the compiler's choice, so the size
// panel lists parts, not positions.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const SRC = 'let x = 1.5;';
const TOKS = [
  { kind: 'Let', from: 0, to: 3 },
  { kind: 'Identifier', from: 4, to: 5 },
  { kind: 'Equal', from: 6, to: 7 },
  { kind: 'Number', from: 8, to: 11 },
  { kind: 'Semicolon', from: 11, to: 12 },
  { kind: 'Eof', from: 12, to: 12 },
];

type S = { k: number; sizes?: boolean; note: string };

const STATES: S[] = [
  { k: 0, note: 'The scanner reads the source and hands out one Token at a time. The first is Let: its kind is TokenKind::Let, and its lexeme is a &str covering bytes 0 to 3 of the source. No text is copied.' },
  { k: 1, note: 'x is an Identifier. The kind is a plain enum value; the name itself lives only in the source, and the lexeme points at it.' },
  { k: 3, note: 'Number covers 1.5, bytes 8 to 11. The token doesn’t hold the double 1.5: the kind says “number”, and the compiler parses the lexeme later.' },
  { k: 5, note: 'Eof is an empty slice at the very end: from 12 to 12. Every token, even this one, has a kind, a lexeme and a line.' },
  { k: 5, sizes: true, note: 'size_of::<TokenKind>() is 1 byte: its 54 possible values fit easily. A Token is 32: a 16-byte &str (pointer and length), an 8-byte line, the 1-byte kind, and padding to keep it aligned. The compiler chooses the order.' },
];

export default function TokenSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const cw = 28;
  const x0 = 32;
  const t = TOKS[st.k];
  return (
    <StepFrame title="Tokens borrow the source" steps={s} note={st.note}>
      <Svg w={400} h={250} title="The source bytes of let x = 1.5; with the current token's lexeme bracketed">
        <T x={8} y={14} size={11} weight={700} fill={tok('muted')}>source: &amp;str</T>
        {[...SRC].map((c, i) => {
          const inTok = i >= t.from && i < t.to;
          return (
            <g key={i}>
              <Box x={x0 + i * cw} y={26} w={cw - 2} h={28} r={2} fill={inTok ? tok('brand', 0.22) : tok('panel')} stroke={inTok ? tok('brand') : tok('line')}>
                <T x={x0 + i * cw + (cw - 2) / 2} y={40} size={13} mono anchor="middle">{c === ' ' ? '␠' : c}</T>
              </Box>
              <T x={x0 + i * cw + (cw - 2) / 2} y={64} size={11} mono anchor="middle" fill={tok('muted')}>{i}</T>
            </g>
          );
        })}
        <T x={x0 + 12 * cw + 2} y={64} size={11} mono fill={tok('muted')}>12</T>
        {/* bracket under the lexeme */}
        <path
          d={`M${x0 + t.from * cw},74 L${x0 + t.from * cw},80 L${x0 + t.to * cw - (t.to > t.from ? 2 : 0)},80 L${x0 + t.to * cw - (t.to > t.from ? 2 : 0)},74`}
          fill="none" stroke={tok('brand')} strokeWidth={2}
        />
        <Box x={60} y={96} w={280} h={72} r={4} stroke={tok('brand')}>
          <T x={74} y={112} size={11} mono>Token {'{'}</T>
          <T x={90} y={128} size={11} mono>kind: <tspan fill={tok('accent')}>TokenKind::{t.kind}</tspan>,</T>
          <T x={90} y={144} size={11} mono>lexeme: "{SRC.slice(t.from, t.to)}"  (bytes {t.from}..{t.to}),</T>
          <T x={90} y={158} size={11} mono>line: 1 {'}'}</T>
        </Box>
        {st.sizes && (
          <g>
            <Box x={20} y={184} w={160} h={22} r={3} fill={tok('f2', 0.2)} stroke={tok('f2')}>
              <T x={100} y={195} size={11} mono anchor="middle">lexeme: &amp;str · 16 B</T>
            </Box>
            <Box x={184} y={184} w={84} h={22} r={3} fill={tok('f3', 0.2)} stroke={tok('f3')}>
              <T x={226} y={195} size={11} mono anchor="middle">line · 8 B</T>
            </Box>
            <Box x={272} y={184} w={40} h={22} r={3} fill={tok('f1', 0.25)} stroke={tok('f1')}>
              <T x={292} y={195} size={11} mono anchor="middle">kind</T>
            </Box>
            <Box x={316} y={184} w={64} h={22} r={3} dash>
              <T x={348} y={195} size={11} mono anchor="middle">pad · 7</T>
            </Box>
            <T x={200} y={226} size={11} anchor="middle">size_of::&lt;Token&gt;() = 32 · size_of::&lt;TokenKind&gt;() = 1</T>
          </g>
        )}
      </Svg>
    </StepFrame>
  );
}
