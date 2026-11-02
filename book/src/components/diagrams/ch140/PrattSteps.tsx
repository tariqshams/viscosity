// Chapter 140: drip-rs's Pratt parser compiling `-1 + 2 * 3`. Each step
// shows the row of the table being consulted (prefix_rule or
// infix_precedence in book/companion/rust/src/compiler.rs), the chain of
// calls in progress with the precedence each was given, and the bytecode
// emitted so far. The final bytes match `drip-rs --disassemble` for
// `print -1 + 2 * 3;`: const '1', neg, const '2', const '3', mul, add
// (the TypeScript VM prints the same listing).
import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const TOKENS = ['-', '1', '+', '2', '*', '3', ';'];
const ROWS = [
  { tok: '-', prefix: 'Unary', prec: '6 TERM' },
  { tok: '+', prefix: 'None', prec: '6 TERM' },
  { tok: '*', prefix: 'None', prec: '7 FACTOR' },
  { tok: 'number', prefix: 'Number', prec: '0 NONE' },
  { tok: ';', prefix: 'None', prec: '0 NONE' },
];

type Col = 'prefix' | 'prec';
type S = { cur: number; row: number | null; col?: Col; calls: string[]; out: string[]; note: string };

const STATES: S[] = [
  { cur: 0, row: null, calls: ['parse_precedence(1)'], out: [], note: 'expression() calls parse_precedence with PREC_ASSIGNMENT, which is 1: the loosest level an expression is ever parsed at. The next token is -.' },
  { cur: 1, row: 0, col: 'prefix', calls: ['parse_precedence(1)', 'prefix(Unary)'], out: [], note: 'advance() makes - the previous token, and prefix_rule(Minus) is Some(Prefix::Unary). continue_expression(1, Unary) runs the Unary arm of prefix, with the same &mut self.' },
  { cur: 2, row: 3, col: 'prefix', calls: ['parse_precedence(1)', 'prefix(Unary)', 'parse_precedence(8)', 'prefix(Number)'], out: ["const '1'"], note: 'The Unary arm parses its operand at PREC_UNARY, 8. The token 1 is a number, so prefix(Number) puts 1 in the constant pool and emits const.' },
  { cur: 2, row: 1, col: 'prec', calls: ['parse_precedence(1)', 'prefix(Unary)'], out: ["const '1'", 'neg'], note: 'The loop at 8 looks at the next token, +, whose precedence is 6. 8 <= 6 is false, so the loop stops and the Unary arm emits neg. -1 is finished, without the + 2.' },
  { cur: 3, row: 1, col: 'prec', calls: ['parse_precedence(1)', 'infix(+)'], out: ["const '1'", 'neg'], note: 'Back in the outer loop: 1 <= 6 is true, so it advances past + and calls infix. -1 is already on the stack as the left operand.' },
  { cur: 4, row: 3, col: 'prefix', calls: ['parse_precedence(1)', 'infix(+)', 'parse_precedence(7)'], out: ["const '1'", 'neg', "const '2'"], note: 'The default arm of infix parses the right operand at infix_precedence(Plus) + 1, which is 7: only operators tighter than + may join it. 2 is a number.' },
  { cur: 6, row: 2, col: 'prec', calls: ['parse_precedence(1)', 'infix(+)', 'parse_precedence(7)', 'infix(*)', 'parse_precedence(8)'], out: ["const '1'", 'neg', "const '2'", "const '3'"], note: 'The next token is *, precedence 7, and 7 <= 7 is true, so * joins the right operand of +. Its own right operand is parsed at 7 + 1 = 8: the 3.' },
  { cur: 6, row: 4, col: 'prec', calls: ['parse_precedence(1)', 'infix(+)'], out: ["const '1'", 'neg', "const '2'", "const '3'", 'mul'], note: 'The next token is ;, whose precedence is 0. Both inner loops stop (8 <= 0 and 7 <= 0 are false), and infix(*) emits mul.' },
  { cur: 6, row: 4, col: 'prec', calls: ['parse_precedence(1)'], out: ["const '1'", 'neg', "const '2'", "const '3'", 'mul', 'add'], note: 'infix(+) emits add, and the outer loop stops too (1 <= 0 is false). The bytecode is (-1) + (2 * 3): every grouping came from the table.' },
];

export default function PrattSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const cols = [
    { k: 'tok', x: 10, w: 90, head: 'token' },
    { k: 'prefix', x: 104, w: 120, head: 'prefix_rule' },
    { k: 'prec', x: 228, w: 160, head: 'infix_precedence' },
  ] as const;
  return (
    <StepFrame title="The table drives the parse" steps={s} note={st.note}>
      <Svg w={400} h={350} title="Tokens, rows of the parse-rule table, the calls in progress and the emitted bytecode">
        {TOKENS.map((t, k) => (
          <Box key={k} x={10 + k * 38} y={4} w={34} h={26} r={3}
            fill={k === st.cur ? tok('brand', 0.18) : tok('panel')} stroke={k === st.cur ? tok('brand') : tok('line')}>
            <T x={27 + k * 38} y={17} size={14} mono anchor="middle">{t}</T>
          </Box>
        ))}
        {cols.map((c) => (
          <T key={c.k} x={c.x + 4} y={46} size={11} weight={700} fill={tok('muted')}>{c.head}</T>
        ))}
        {ROWS.map((r, k) => {
          const y = 54 + k * 24;
          const on = st.row === k;
          return (
            <g key={r.tok}>
              {cols.map((c) => {
                const hit = on && (c.k === st.col || c.k === 'tok');
                return (
                  <Box key={c.k} x={c.x} y={y} w={c.w} h={21} r={2}
                    fill={hit ? tok('accent', 0.18) : on ? tok('accent', 0.06) : tok('panel')}
                    stroke={hit ? tok('accent') : tok('line')}>
                    <T x={c.x + 6} y={y + 11} size={12} mono fill={tok('ink')}>{r[c.k]}</T>
                  </Box>
                );
              })}
            </g>
          );
        })}
        <T x={10} y={188} size={11} weight={700} fill={tok('muted')}>CALLS IN PROGRESS (innermost last)</T>
        {st.calls.map((c, k) => (
          <T key={k} x={14 + k * 10} y={205 + k * 16} size={12} mono fill={k === st.calls.length - 1 ? tok('brand') : tok('ink')}>{c}</T>
        ))}
        <T x={10} y={292} size={11} weight={700} fill={tok('muted')}>EMITTED</T>
        {st.out.map((o, k) => (
          <Box key={k} x={10 + (k % 3) * 128} y={302 + Math.floor(k / 3) * 24} w={124} h={21} r={3} fill={tok('safe', 0.12)} stroke={tok('safe')}>
            <T x={18 + (k % 3) * 128} y={313 + Math.floor(k / 3) * 24} size={12} mono>{o}</T>
          </Box>
        ))}
      </Svg>
    </StepFrame>
  );
}
