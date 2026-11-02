// Chapter 239: drip-rs's Pratt parser compiling `-1 + 2 * 3`. Each step
// shows the parse-rule row being looked up (Compiler::rule in
// book/companion/rust/src/compiler.rs), the chain of parse calls in
// progress with the minimum precedence each parse_precedence was given,
// and the bytecode emitted so far. The final bytes match the real chunk
// for `print -1 + 2 * 3;`: CONSTANT 0, NEGATE, CONSTANT 1, CONSTANT 2,
// MULTIPLY, ADD (both VMs print the same listing).
import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const TOKENS = ['-', '1', '+', '2', '*', '3', ';'];
const ROWS = [
  { tok: '-', prefix: 'unary', infix: 'binary', prec: 'Term' },
  { tok: '+', prefix: '—', infix: 'binary', prec: 'Term' },
  { tok: '*', prefix: '—', infix: 'binary', prec: 'Factor' },
  { tok: 'Number', prefix: 'number', infix: '—', prec: 'None' },
  { tok: ';', prefix: '—', infix: '—', prec: 'None' },
];

type S = { cur: number; row: number | null; col?: 'prefix' | 'infix' | 'prec'; calls: string[]; out: string[]; note: string };

const STATES: S[] = [
  { cur: 0, row: null, calls: ['parse_precedence(Assignment)'], out: [], note: 'expression() calls parse_precedence with the lowest real precedence, Assignment. The next token is -.' },
  { cur: 1, row: 0, col: 'prefix', calls: ['parse_precedence(Assignment)', 'unary'], out: [], note: 'advance() makes - the previous token. Self::rule(Minus).prefix is Some(Self::unary), a function pointer, so prefix(self, can_assign) calls unary with the same &mut self.' },
  { cur: 2, row: 3, col: 'prefix', calls: ['parse_precedence(Assignment)', 'unary', 'parse_precedence(Unary)', 'number'], out: ["CONST '1'"], note: 'unary parses its operand at Precedence::Unary. The token 1 is a Number, whose prefix rule is number: it emits CONSTANT with the value 1 in the constant pool.' },
  { cur: 2, row: 1, col: 'prec', calls: ['parse_precedence(Assignment)'], out: ["CONST '1'", 'NEGATE'], note: 'Back in parse_precedence(Unary), the loop looks at the next token, +. Its precedence is Term, and Unary <= Term is false (Term is lower), so the loop stops. unary emits NEGATE: -1 is done, without the + 2.' },
  { cur: 3, row: 1, col: 'infix', calls: ['parse_precedence(Assignment)', 'binary (+)'], out: ["CONST '1'", 'NEGATE'], note: 'Now the outer loop: Assignment <= Term is true, so it advances and calls the infix rule of +, which is binary. The left operand, -1, is already on the stack.' },
  { cur: 4, row: 3, col: 'prefix', calls: ['parse_precedence(Assignment)', 'binary (+)', 'parse_precedence(Factor)'], out: ["CONST '1'", 'NEGATE', "CONST '2'"], note: 'binary parses its right operand at Term.next(), which is Factor: only operators that bind tighter than + may join it. 2 is a number.' },
  { cur: 6, row: 2, col: 'prec', calls: ['parse_precedence(Assignment)', 'binary (+)', 'parse_precedence(Factor)', 'binary (*)', 'parse_precedence(Unary)'], out: ["CONST '1'", 'NEGATE', "CONST '2'", "CONST '3'"], note: '* has precedence Factor, and Factor <= Factor is true, so * joins the right operand of +. Its binary parses 3 at Factor.next(), Unary.' },
  { cur: 6, row: 4, col: 'prec', calls: ['parse_precedence(Assignment)', 'binary (+)'], out: ["CONST '1'", 'NEGATE', "CONST '2'", "CONST '3'", 'MULTIPLY'], note: 'The next token is ;, whose precedence is None, lower than everything. Both inner loops stop, and binary (*) emits MULTIPLY.' },
  { cur: 6, row: 4, col: 'prec', calls: ['parse_precedence(Assignment)'], out: ["CONST '1'", 'NEGATE', "CONST '2'", "CONST '3'", 'MULTIPLY', 'ADD'], note: 'binary (+) emits ADD. The outer loop sees ; too, and stops. The bytecode is in postfix order: (-1) + (2 * 3). The table decided every grouping.' },
];

export default function PrattSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const cols = [ { k: 'tok', x: 10, w: 64 }, { k: 'prefix', x: 76, w: 70 }, { k: 'infix', x: 148, w: 70 }, { k: 'prec', x: 220, w: 64 } ] as const;
  return (
    <StepFrame title="The table drives the parse" steps={s} note={st.note}>
      <Svg w={400} h={330} title="Tokens, the parse-rule table, the calls in progress and the emitted bytecode">
        {TOKENS.map((t, k) => (
          <Box key={k} x={10 + k * 38} y={4} w={34} h={26} r={3}
            fill={k === st.cur ? tok('brand', 0.18) : tok('panel')} stroke={k === st.cur ? tok('brand') : tok('line')}>
            <T x={27 + k * 38} y={17} size={14} mono anchor="middle">{t}</T>
          </Box>
        ))}
        {['token', 'prefix', 'infix', 'precedence'].map((h, k) => (
          <T key={h} x={cols[k].x + 4} y={46} size={10} weight={700} fill={tok('muted')}>{h}</T>
        ))}
        {ROWS.map((r, k) => {
          const y = 54 + k * 22;
          const on = st.row === k;
          return (
            <g key={r.tok}>
              {cols.map((c) => {
                const hit = on && (c.k === st.col || c.k === 'tok');
                return (
                  <Box key={c.k} x={c.x} y={y} w={c.w} h={20} r={2}
                    fill={hit ? tok('accent', 0.18) : on ? tok('accent', 0.06) : tok('panel')}
                    stroke={hit ? tok('accent') : tok('line')}>
                    <T x={c.x + 5} y={y + 10} size={11} mono fill={tok('ink')}>{(r as any)[c.k]}</T>
                  </Box>
                );
              })}
            </g>
          );
        })}
        <T x={10} y={178} size={10} weight={700} fill={tok('muted')}>CALLS IN PROGRESS (innermost last)</T>
        {st.calls.map((c, k) => (
          <T key={k} x={14 + k * 10} y={194 + k * 15} size={11} mono fill={k === st.calls.length - 1 ? tok('brand') : tok('ink')}>{c}</T>
        ))}
        <T x={10} y={276} size={10} weight={700} fill={tok('muted')}>EMITTED</T>
        {st.out.map((o, k) => (
          <Box key={k} x={10 + (k % 3) * 128} y={284 + Math.floor(k / 3) * 22} w={124} h={20} r={3} fill={tok('safe', 0.12)} stroke={tok('safe')}>
            <T x={16 + (k % 3) * 128} y={294 + Math.floor(k / 3) * 22} size={11} mono>{o}</T>
          </Box>
        ))}
      </Svg>
    </StepFrame>
  );
}
