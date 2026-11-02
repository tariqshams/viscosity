// Chapter 138: drip-rs's scanner walking the bytes of `s="é";é`. The byte
// values are UTF-8 (é is 0xC3 0xA9 = 195 169). The tokens and their
// ranges follow book/companion/rust/src/scanner.rs: a string scans
// byte by byte to the closing quote; an unexpected lead byte becomes one
// Error token, and the loop over continuation bytes (top bits 10) moves
// `current` past the rest of the character, so the lexeme is the whole
// é. Checked by running the real scanner on this input with rustc 1.97.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const BYTES = [
  { b: 115, c: 's' }, { b: 61, c: '=' }, { b: 34, c: '"' },
  { b: 195, c: 'é₁' }, { b: 169, c: 'é₂' }, { b: 34, c: '"' },
  { b: 59, c: ';' }, { b: 195, c: 'é₁' }, { b: 169, c: 'é₂' },
];

type S = { start: number; cur: number; tok?: string; bits?: number[]; err?: boolean; note: string };

const STATES: S[] = [
  { start: 0, cur: 0, note: 'Nine bytes, not seven characters: é is two bytes in UTF-8, 195 then 169. The scanner keeps two indices into bytes: start (where this token began) and current (the next byte to read).' },
  { start: 0, cur: 1, tok: 'Identifier "s"', note: 'advance() returns byte 115, b\'s\'. It is ASCII and alphabetic, so identifier() reads on while bytes are letters or digits. Byte 61 isn’t, so the token is source[0..1].' },
  { start: 1, cur: 2, tok: 'Equal "="', note: 'Byte 61 is b\'=\'. peek() sees 34, not another =, so this is Equal, not EqualEqual.' },
  { start: 2, cur: 6, tok: 'String "\\"é\\""', bits: [3, 4], note: 'Byte 34 opens a string. The loop only asks “is this b\'"\'?” and “is this b\'\\n\'?”. 195 and 169 are both ≥ 128, so neither can ever equal an ASCII byte. The closing quote is at 5, and the token is source[2..6], ending on a character boundary.' },
  { start: 6, cur: 7, tok: 'Semicolon ";"', note: 'Byte 59 is b\';\'. Every token so far started and ended on ASCII bytes, so every slice of source was at a character boundary.' },
  { start: 7, cur: 8, bits: [7], err: true, note: 'Byte 195 matches no arm, so it falls to _. Its bits are 110 00011: the lead byte of a 2-byte character. current is now 8, in the MIDDLE of é.' },
  { start: 7, cur: 9, tok: 'Error(UnexpectedCharacter) "é"', bits: [8], err: true, note: 'Before making the token, the _ arm skips continuation bytes: 169 is 10 101001, top bits 10, so current moves to 9. The lexeme source[7..9] is the whole é, so the message can name it, and the next token starts on a boundary.' },
  { start: 9, cur: 9, tok: 'Eof ""', note: 'At the end: an empty lexeme source[9..9]. Without the skip, the scanner would have sliced source[7..8], the middle of é, and the program would have panicked.' },
];

const bin = (n: number) => n.toString(2).padStart(8, '0');

export default function ByteSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const cw = 40;
  const x0 = 20;
  return (
    <StepFrame title="Scanning bytes, not characters" steps={s} note={st.note}>
      <Svg w={400} h={236} title="Nine source bytes with start and current markers and the token being made">
        {BYTES.map((b, i) => {
          const inTok = i >= st.start && i < st.cur;
          const hi = st.bits?.includes(i);
          const col = st.err && hi ? 'danger' : 'brand';
          return (
            <g key={i}>
              <T x={x0 + i * cw + 18} y={12} size={11} mono anchor="middle" fill={tok('muted')}>{i}</T>
              <Box x={x0 + i * cw} y={22} w={cw - 4} h={30} r={3} fill={inTok ? tok(col, 0.2) : tok('panel')} stroke={hi ? tok(col) : inTok ? tok(col) : tok('line')}>
                <T x={x0 + i * cw + 18} y={37} size={12} mono anchor="middle">{b.b}</T>
              </Box>
              <T x={x0 + i * cw + 18} y={64} size={11} mono anchor="middle" fill={b.b >= 128 ? tok('f4') : tok('ink')}>{b.c}</T>
              {hi && (<>
                <T x={x0 + i * cw + 18} y={80} size={11} mono anchor="middle" fill={tok(col)}>{bin(b.b).slice(0, 4)}</T>
                <T x={x0 + i * cw + 18} y={93} size={11} mono anchor="middle" fill={tok(col)}>{bin(b.b).slice(4)}</T>
              </>)}
            </g>
          );
        })}
        {/* start and current markers (between boxes) */}
        <T x={x0 + st.start * cw - 2} y={110} size={11} mono anchor="middle" fill={tok('accent')}>▲</T>
        <T x={x0 + st.start * cw - 2} y={124} size={11} mono anchor="middle" fill={tok('accent')}>start</T>
        <T x={x0 + st.cur * cw - 2} y={140} size={11} mono anchor="middle" fill={tok('brand')}>▲</T>
        <T x={x0 + st.cur * cw - 2} y={154} size={11} mono anchor="middle" fill={tok('brand')}>current</T>
        {st.tok && (
          <Box x={20} y={170} w={360} h={30} r={4} stroke={st.err ? tok('danger') : tok('brand')}>
            <T x={32} y={185} size={12} mono>token: {st.tok}</T>
          </Box>
        )}
        <T x={200} y={222} size={11} anchor="middle" fill={tok('muted')}>coloured labels: bytes of é (both ≥ 128)</T>
      </Svg>
    </StepFrame>
  );
}
