import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// One production rule, read aloud one symbol at a time.
type Sym = { text: string; kind: 'head' | 'arrow' | 'term' | 'nt'; label: string };

const RULE: Sym[] = [
  { text: 'printStmt', kind: 'head', label: 'head' },
  { text: '→', kind: 'arrow', label: 'is made of' },
  { text: '"print"', kind: 'term', label: 'terminal' },
  { text: 'expression', kind: 'nt', label: 'nonterminal' },
  { text: '";"', kind: 'term', label: 'terminal' },
];

const NOTES = [
  'One production rule from Drip’s grammar. We will read it one symbol at a time, left to right, the way you would read it aloud.',
  'Left of the arrow is the head: the name this rule defines. A name with rules of its own is a nonterminal; it is drawn round and dashed here, because it is a blank still to be filled in.',
  'Read the arrow as “is made of” (or “can be made of”, when the name has several rules).',
  '"print" is in quotes, so it is a terminal: it means exactly the keyword token print, and nothing else.',
  'expression has no quotes: it is a nonterminal, a blank. What may fill it is decided by expression’s own rules, written elsewhere in the grammar (one is shown below).',
  '";" is another terminal: exactly one semicolon token.',
  'All together: “a printStmt is made of the keyword print, then an expression, then a semicolon.” The tokens of print 1 + 2; fit: each terminal matches one token, and the blank expression covers 1 + 2.',
];

const STATES = NOTES.map((note, k) => ({ note, upto: k }));

const chipW = (s: string) => Math.max(26, s.length * 7.6 + 12);

export default function ReadRuleSteps() {
  const s = useSteps(STATES);
  const upto = s.state.upto;
  let x = 10;
  const placed = RULE.map((sym) => {
    const w = chipW(sym.text);
    const p = { ...sym, x, w };
    x += w + 8;
    return p;
  });
  const exprChip = placed[3];
  return (
    <StepFrame title="Reading a rule aloud" steps={s} note={s.state.note}>
      <Svg w={400} h={190} title={'The rule printStmt → "print" expression ";" with each symbol labelled as head, arrow, terminal or nonterminal'}>
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>ONE PRODUCTION RULE</T>
        {placed.map((p, k) => {
          const seen = upto >= k + 1 || upto === 0 || upto === 6;
          const now = upto === k + 1;
          const nt = p.kind === 'head' || p.kind === 'nt';
          const isArrow = p.kind === 'arrow';
          return (
            <g key={k} opacity={seen ? 1 : 0.35}>
              {isArrow ? (
                <T x={p.x + p.w / 2} y={44} size={18} anchor="middle" weight={700}>{p.text}</T>
              ) : (
                <Box x={p.x} y={30} w={p.w} h={28} r={nt ? 14 : 4} dash={nt} fill={nt ? tok('brand', now ? 0.25 : 0.12) : now ? tok('ink', 0.1) : tok('panel')} stroke={now ? tok('brand') : nt ? tok('brand', 0.8) : tok('ink', 0.5)}>
                  <T x={p.x + p.w / 2} y={45} size={12.5} mono anchor="middle" weight={nt ? 700 : 400} fill={nt ? tok('brand') : tok('ink')}>{p.text}</T>
                </Box>
              )}
              {(upto > k || upto === 6) && upto !== 0 && (
                <T x={p.x + p.w / 2} y={72} size={11} anchor="middle" fill={now ? tok('brand') : tok('muted')} weight={now ? 700 : 400}>{p.label}</T>
              )}
            </g>
          );
        })}

        {upto >= 4 && upto < 6 && (
          <g>
            <T x={8} y={104} size={11} weight={700} fill={tok('muted')}>ELSEWHERE IN THE GRAMMAR</T>
            <Box x={8} y={114} w={384} h={30} fill={tok('brand', 0.06)} stroke={tok('brand', 0.5)}>
              <T x={18} y={129.5} size={12.5} mono>expression → … (its own rules)</T>
            </Box>
            <line x1={exprChip.x + exprChip.w / 2} y1={80} x2={60} y2={112} stroke={tok('brand', 0.6)} strokeWidth={1.4} strokeDasharray="4 3" />
          </g>
        )}

        {upto === 6 && (
          <g>
            <T x={8} y={104} size={11} weight={700} fill={tok('muted')}>TOKENS THAT FIT THE RULE</T>
            {[
              { t: 'print', under: 2 },
              { t: '1 + 2', under: 3 },
              { t: ';', under: 4 },
            ].map((tk, k) => {
              const p = placed[tk.under];
              const w = Math.max(30, tk.t.length * 8.4 + 14);
              const cx = p.x + p.w / 2;
              return (
                <g key={k}>
                  <line x1={cx} y1={80} x2={cx} y2={118} stroke={tok('ink', 0.35)} strokeWidth={1.2} strokeDasharray="3 3" />
                  <Box x={cx - w / 2} y={120} w={w} h={28} fill={tok('safe', 0.1)} stroke={tok('safe')}>
                    <T x={cx} y={135} size={14} mono anchor="middle">{tk.t}</T>
                  </Box>
                </g>
              );
            })}
            <T x={8} y={172} size={11.5} fill={tok('muted')}>each terminal matches one token; the blank covers several</T>
          </g>
        )}
      </Svg>
    </StepFrame>
  );
}
