import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

type S = { src: string; start: number; cur: number; look?: number; toks: string[]; lookup?: string; note: string };

const STATES: S[] = [
  { src: '!===', start: 0, cur: 0, toks: [], note: 'Four characters: !===. They could be cut many ways: ! and ===, or != and ==, or four single tokens. The scanner needs a rule.' },
  { src: '!===', start: 0, cur: 1, look: 1, toks: [], note: 'advance() reads “!”. It could be the whole token, or the start of !=. match(\'=\') looks at index 1.' },
  { src: '!===', start: 0, cur: 2, toks: ['!='], note: 'Index 1 is “=”, so match takes it: the token is !=, two characters, the longest token that fits. The rule is maximal munch: always take the biggest bite.' },
  { src: '!===', start: 2, cur: 3, look: 3, toks: ['!='], note: 'A new round starts at index 2. advance() reads “=”, and match(\'=\') looks at index 3.' },
  { src: '!===', start: 2, cur: 4, toks: ['!=', '=='], note: 'Another “=”, so the token is ==. The result is != then ==. There is no === token in Drip, so the scanner never even considers one.' },
  { src: 'fortune', start: 0, cur: 1, toks: [], note: 'Now a word, from one of Drip’s test programs: fortune. advance() reads “f”, a letter, so this token is a word.' },
  { src: 'fortune', start: 0, cur: 3, toks: [], note: 'The first three letters spell for, which is a Drip keyword. A scanner that stopped here would make the keyword for and leave tune behind.' },
  { src: 'fortune', start: 0, cur: 7, toks: [], note: 'Maximal munch says keep going while the next character is a letter or digit. The word only ends at the end of the source: seven letters.' },
  { src: 'fortune', start: 0, cur: 7, toks: ['identifier'], lookup: 'fortune', note: 'Only now is the whole word looked up. fortune is not a keyword, so it is one identifier token. The biggest bite gave the right answer.' },
];

const CW = 40;
const X0 = 20;

export default function MunchSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Always the biggest bite" steps={s} note={st.note}>
      <Svg w={400} h={168} title="The characters being scanned, with the token so far highlighted, the character match is looking at, and the tokens made.">
        {[...st.src].map((c, k) => {
          const x = X0 + k * CW;
          const inTok = k >= st.start && k < st.cur;
          const look = st.look === k;
          return (
            <g key={`${st.src}${k}`}>
              <Box x={x} y={10} w={CW - 4} h={38} r={4} fill={inTok ? tok('brand', 0.2) : look ? tok('warn', 0.18) : tok('panel')} stroke={inTok ? tok('brand') : look ? tok('warn') : tok('ink', 0.35)} dash={look}>
                <T x={x + (CW - 4) / 2} y={29} size={18} mono anchor="middle">{c}</T>
              </Box>
              <T x={x + (CW - 4) / 2} y={60} size={11} mono anchor="middle" fill={look ? tok('warn') : tok('muted')}>{look ? 'look' : k}</T>
            </g>
          );
        })}
        <T x={10} y={88} size={12} mono>
          token so far: <tspan fontWeight={700} fill={tok('brand')}>'{st.src.slice(st.start, st.cur)}'</tspan>
        </T>
        {st.lookup && <T x={10} y={108} size={12} mono>KEYWORDS.get('{st.lookup}') → <tspan fill={tok('accent')} fontWeight={700}>undefined</tspan></T>}
        <T x={10} y={132} size={11} weight={700} fill={tok('muted')}>TOKENS</T>
        {st.toks.map((t, j) => (
          <Box key={j} x={80 + j * 100} y={120} w={92} h={26} r={6} fill={tok('accent', 0.12)} stroke={tok('accent')}>
            <T x={126 + j * 100} y={133} size={13} mono weight={700} anchor="middle">{t}</T>
          </Box>
        ))}
      </Svg>
    </StepFrame>
  );
}
