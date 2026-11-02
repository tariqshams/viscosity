import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 245b: the hand-written parser (packages/frontend-js/src/
// mini-parser.ts) parsing `x = 1 - 2 * 3`. The calls are the real ones:
// statement → expression → assignment → conditional → binary(minBp), with
// binding powers from its BIN table ('-': 10, '*': 11). The final tree is
// what both acorn and the mini parser produce (checked by running them).
const TOKS = ['x', '=', '1', '-', '2', '*', '3'];

type S = { at: number; stack: string[]; tree: string[]; note: string };

const STATES: S[] = [
  { at: 0, stack: ['statement()'], tree: [], note: 'statement() looks at the first token. x isn’t a keyword like let, if or for, so this must be an expression statement. Recursive descent: one function per kind of statement.' },
  { at: 1, stack: ['statement()', 'assignment()', 'binary(0)'], tree: ['Identifier x'], note: 'expression() calls assignment(), which first parses its left side with binary(0) (by way of conditional()). That reaches primary() and returns Identifier x. The next token, =, has no binding power in BIN, so binary stops.' },
  { at: 1, stack: ['statement()', 'assignment()'], tree: ['Identifier x', '  ='], note: 'Back in assignment(): = is an assignment operator, so x is the target (it must be an Identifier or MemberExpression). The right side is parsed by calling assignment() again, which makes = right-associative.' },
  { at: 3, stack: ['assignment()', 'binary(0)'], tree: ['Literal 1', '  - (bp 10 > 0)'], note: 'The right side starts in binary(0). It reads Literal 1. Then - has binding power 10, more than 0, so it is taken, and binary parses its right side by calling binary(10).' },
  { at: 5, stack: ['binary(0)', 'binary(10)'], tree: ['Literal 2', '  * (bp 11 > 10)'], note: 'binary(10) reads Literal 2. Next is *, with binding power 11. 11 > 10, so * binds tighter: it is taken here, inside the right side of -.' },
  { at: 7, stack: ['binary(0)', 'binary(10)', 'binary(11)'], tree: ['Literal 3', '  (end: stop)'], note: 'binary(11) reads Literal 3 and meets the end of input: no operator, so it returns 3. binary(10) builds 2 * 3, and finds nothing more.' },
  { at: 7, stack: ['statement()'], tree: ['ExpressionStatement', '  AssignmentExpression =', '    Identifier x', '    BinaryExpression -', '      Literal 1', '      BinaryExpression *', '        Literal 2', '        Literal 3'], note: 'Everything returns. The result is an ESTree tree, the same shape acorn builds for this line: 1 - (2 * 3), assigned to x. A missing semicolon at the end of input is fine (automatic semicolon insertion).' },
];

export default function MiniParseSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Recursive descent meets Pratt" steps={s} note={st.note}>
      <Svg w={400} h={300} title="Tokens, the call stack of the parser, and the tree being built">
        {TOKS.map((t, k) => {
          const done = k < st.at;
          const cur = k === st.at;
          return (
            <Box key={k} x={8 + k * 55} y={6} w={48} h={30} fill={cur ? tok('brand', 0.18) : 'transparent'} stroke={cur ? tok('brand') : done ? tok('muted') : tok('line')} dash={!done && !cur}>
              <T x={32 + k * 55} y={21} size={14} mono anchor="middle" opacity={done ? 0.5 : 1}>{t}</T>
            </Box>
          );
        })}
        <T x={8} y={56} size={11} weight={700} fill={tok('muted')}>CALLS</T>
        {st.stack.map((c, k) => (
          <Box key={k} x={8 + k * 10} y={66 + k * 30} w={150} h={26} fill={k === st.stack.length - 1 ? tok('f3', 0.15) : 'transparent'} stroke={k === st.stack.length - 1 ? tok('f3') : tok('line')}>
            <T x={16 + k * 10} y={79 + k * 30} size={11} mono>{c}</T>
          </Box>
        ))}
        <T x={180} y={56} size={11} weight={700} fill={tok('muted')}>TREE / DECISION</T>
        {st.tree.map((l, k) => (
          <T key={k} x={180} y={76 + k * 26} size={11} mono>{l}</T>
        ))}
      </Svg>
    </StepFrame>
  );
}
