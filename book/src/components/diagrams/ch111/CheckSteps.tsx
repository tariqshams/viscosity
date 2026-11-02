// Chapter 110 (second half): the resolver checking Drip's static rules on a
// program with three mistakes. It keeps going after each one, so it reports
// all three, in source order, and the program never starts.
import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const CODE = `print "first";
{
  let a = 1;
  let a = 2;
}
fn f() {
  break;
}
return 3;`;

type S = { line: number; fn: string; loops: number; scope: string; errors: string[]; out?: string; note: string };

const E1 = "line 4: 'a' is already declared in this scope";
const E2 = "line 7: 'break' outside a loop";
const E3 = "line 9: 'return' outside a function";

const STATES: S[] = [
  { line: 0, fn: 'none', loops: 0, scope: '(top level)', errors: [], note: 'The parser found no syntax errors, so the resolver walks the tree. print "first" is checked, not run: nothing is printed yet.' },
  { line: 2, fn: 'none', loops: 0, scope: 'block: a', errors: [], note: 'A block begins a scope. let a declares a in it.' },
  { line: 3, fn: 'none', loops: 0, scope: 'block: a', errors: [E1], note: 'A second let a in the same scope. declare finds a already there and reports it, then carries on walking.' },
  { line: 5, fn: 'function', loops: 0, scope: 'f’s body', errors: [E1], note: 'fn f: the resolver walks the body with currentFunction set to function, and the loop count set to 0.' },
  { line: 6, fn: 'function', loops: 0, scope: 'f’s body', errors: [E1, E2], note: 'break with the loop count at 0: there is no loop to leave. Reported, and the walk goes on.' },
  { line: 8, fn: 'none', loops: 0, scope: '(top level)', errors: [E1, E2, E3], note: 'Back at the top level, currentFunction is none again, so return has no call to return from. A third error.' },
  { line: 8, fn: 'none', loops: 0, scope: '(top level)', errors: [E1, E2, E3], out: 'nothing: exit code 65', note: 'The walk is done. There were errors, so drip.ts prints all three and stops with exit code 65. The interpreter never starts, so "first" is never printed.' },
];

export default function CheckSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Checking the static rules" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={182} title="What the resolver is tracking (the current function kind, the loop count and the current scope) and the list of errors it has reported so far, in order.">
        <Box x={6} y={6} w={388} h={58} stroke={tok('ink', 0.4)}>
          <T x={16} y={22} size={12} mono>{`currentFunction: ${st.fn}`}</T>
          <T x={16} y={40} size={12} mono>{`loops: ${st.loops}`}</T>
          <T x={16} y={57} size={12} mono>{`scope: ${st.scope}`}</T>
        </Box>
        <T x={6} y={82} size={11} weight={700} fill={tok('muted')}>ERRORS REPORTED, IN ORDER</T>
        {st.errors.length === 0 && <T x={6} y={102} size={12} fill={tok('muted')}>(none yet)</T>}
        {st.errors.map((e, j) => (
          <T key={e} x={6} y={102 + j * 20} size={11} mono fill={tok('danger')}>{e}</T>
        ))}
        {st.out && <T x={6} y={172} size={12} weight={700}>{`printed by the program: ${st.out}`}</T>}
      </Svg>
    </StepFrame>
  );
}
