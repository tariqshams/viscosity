import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// The Python subset and its parser: parsePython (frontend-python/src/parser.ts)
// reading the real token stream for
//   for p in ps:
//       if p.x > 9:
//           p.x = 0
//   print(ps)
// Tokens checked with tokenize(); the tree is the parser's real output
// (Module > For > If > Assign, then Expr).
const TOKS = ['for', 'p', 'in', 'ps', ':', 'NL', 'IND', 'if', 'p.x', '>', '9', ':', 'NL', 'IND', 'p.x', '=', '0', 'NL', 'DED', 'DED', 'print(ps)', 'NL', 'EOF'];
const SPECIAL = new Set(['NL', 'IND', 'DED', 'EOF']);

type S = { from: number; to: number; calls: string[]; tree: string[]; bad?: boolean; note: string };

const STATES: S[] = [
  { from: 0, to: 3, calls: ['module'], tree: ['For p in ps'], note: 'statement() sees the keyword for. It reads a name (p), expects the keyword in, then parses an expression (ps). Now it needs the loop body, so it calls block().' },
  { from: 4, to: 6, calls: ['module', 'block (for)'], tree: ['For p in ps'], note: 'block() eats the colon. The next token is NEWLINE, so this is not a one-line body like "if x: y = 1". It skips the NEWLINE and insists on an INDENT, which is there: the body has begun.' },
  { from: 7, to: 11, calls: ['module', 'block (for)'], tree: ['For p in ps', '  If p.x > 9'], note: 'Inside the body, statement() sees if. The test p.x > 9 is an expression, parsed with binding powers. Then block() is called again, one level deeper.' },
  { from: 12, to: 13, calls: ['module', 'block (for)', 'block (if)'], tree: ['For p in ps', '  If p.x > 9'], note: 'Colon, NEWLINE, INDENT again. Two block() calls are now open, one inside the other, exactly as two { would be in JavaScript.' },
  { from: 14, to: 17, calls: ['module', 'block (for)', 'block (if)'], tree: ['For p in ps', '  If p.x > 9', '    Assign p.x = 0'], note: 'An ordinary line: p.x = 0 becomes an Assign, and its NEWLINE is consumed. The loop in block() looks at the next token to decide whether to go on.' },
  { from: 18, to: 18, calls: ['module', 'block (for)'], tree: ['For p in ps', '  If p.x > 9', '    Assign p.x = 0'], note: 'A DEDENT. The inner block() stops, skips that one DEDENT and returns its list of statements: the if body is closed.' },
  { from: 19, to: 19, calls: ['module'], tree: ['For p in ps', '  If p.x > 9', '    Assign p.x = 0'], note: 'Another DEDENT, so the for body closes too. Two DEDENTs, two block() calls returned: the tokenizer and the parser agree on the shape.' },
  { from: 20, to: 22, calls: ['module'], tree: ['For p in ps', '  If p.x > 9', '    Assign p.x = 0', 'Expr print(ps)'], note: 'Back at the top level, print(ps) is an expression statement. Then EOF: the Module holds two statements, the for and the call.' },
  { from: 4, to: 6, calls: ['module', 'block (for)'], tree: ['For p in ps'], bad: true, note: 'What if the body were not indented? After the colon and NEWLINE, block() finds no INDENT and stops with "expected an indented block at line 2". The whole file is then left as it was.' },
];

export default function BlockSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const PER = 8;
  return (
    <StepFrame title="Parsing blocks from INDENT and DEDENT" steps={s} note={st.note}>
      <Svg w={400} h={268} title="The token stream in three rows with the tokens being read highlighted, the stack of open block() calls, and the syntax tree built so far">
        <T x={4} y={10} size={11} weight={700} fill={tok('muted')}>TOKENS (NL = NEWLINE, IND/DED = INDENT/DEDENT)</T>
        {TOKS.map((t, k) => {
          const x = 4 + (k % PER) * 49;
          const y = 20 + Math.floor(k / PER) * 30;
          const on = k >= st.from && k <= st.to;
          const fill = on ? (st.bad ? tok('f6', 0.25) : tok('brand', 0.2)) : SPECIAL.has(t) ? tok('f4', 0.12) : 'transparent';
          const stroke = on ? (st.bad ? tok('f6') : tok('brand')) : SPECIAL.has(t) ? tok('f4') : tok('line');
          const w = t === 'print(ps)' ? 94 : 45;
          const xx = k > 20 ? x + 49 : x;
          return (
            <Box key={k} x={xx} y={y} w={w} h={24} r={4} fill={fill} stroke={stroke}>
              <T x={xx + w / 2} y={y + 12} size={11} mono anchor="middle" weight={SPECIAL.has(t) ? 700 : undefined}>{t}</T>
            </Box>
          );
        })}
        <T x={4} y={118} size={11} weight={700} fill={tok('muted')}>OPEN CALLS</T>
        {st.calls.map((c, k) => (
          <Box key={k} x={4} y={228 - k * 32} w={130} h={26} fill={k === st.calls.length - 1 ? tok('accent', 0.15) : tok('panel')} stroke={k === st.calls.length - 1 ? tok('accent') : tok('line')}>
            <T x={12} y={241 - k * 32} size={12} mono>{c}</T>
          </Box>
        ))}
        <T x={150} y={118} size={11} weight={700} fill={tok('muted')}>TREE SO FAR</T>
        <Box x={150} y={128} w={246} h={130} fill={tok('panel')}>
          <T x={160} y={144} size={12} mono weight={700}>Module</T>
          {st.tree.map((l, k) => (
            <T key={k} x={172 + (l.length - l.trimStart().length) * 7} y={166 + k * 22} size={12} mono>{l.trim()}</T>
          ))}
          {st.bad && <T x={160} y={244} size={12} weight={700} fill={tok('f6')}>expected an indented block</T>}
        </Box>
      </Svg>
    </StepFrame>
  );
}
