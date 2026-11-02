// Chapter 114 (second half): everything the tree-walker does to evaluate
// the expression n - 2 (inside fib), counted. One subtraction is the real
// work; the rest is the interpreter's overhead.
import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Svg, T, tok } from '../../viz/svg';

const TRACE = `evaluate(binary n - 2)
  evaluate(variable n)
    lookUp: locals.get(node)
    getAt(0, "n"): ancestor,
      values.get("n")
  evaluate(literal 2)
  is it == or != ? no
  arithmetic("-", n, 2)
    both numbers? yes
    l - r`;

type C = { calls: number; switches: number; maps: number; checks: number; work: number };
type S = { line: number; c: C; note: string };

const STATES: S[] = [
  { line: 0, c: { calls: 1, switches: 1, maps: 0, checks: 0, work: 0 }, note: 'evaluate is called on the binary node, and switches on its kind to find out what it is. It was a binary node last time too, and will be next time; the interpreter asks anyway.' },
  { line: 1, c: { calls: 2, switches: 2, maps: 0, checks: 0, work: 0 }, note: 'To get the left operand, evaluate calls itself on the variable node n: another call, another switch.' },
  { line: 2, c: { calls: 3, switches: 2, maps: 1, checks: 0, work: 0 }, note: 'lookUp asks the resolver’s table for this node’s distance: a Map lookup, keyed by the node object. The answer is 0.' },
  { line: 3, c: { calls: 5, switches: 2, maps: 2, checks: 0, work: 0 }, note: 'getAt calls ancestor (zero hops this time), then looks "n" up by name in that environment’s Map: a second hash lookup, to read one number.' },
  { line: 5, c: { calls: 6, switches: 3, maps: 2, checks: 0, work: 0 }, note: 'The right operand is the literal 2: one more call and one more switch, to get back a constant that never changes.' },
  { line: 6, c: { calls: 6, switches: 3, maps: 2, checks: 2, work: 0 }, note: 'Back in the binary case, the operator is compared with == and with !=, which are handled separately.' },
  { line: 8, c: { calls: 7, switches: 3, maps: 2, checks: 5, work: 0 }, note: 'arithmetic checks whether the operator is +, then that both values really are numbers, so that "a" - 2 can be reported as an error.' },
  { line: 9, c: { calls: 7, switches: 4, maps: 2, checks: 5, work: 1 }, note: 'Finally a switch on the operator reaches l - r: the one subtraction the program asked for. Everything above it was bookkeeping.' },
];

const ROWS: [keyof C, string][] = [
  ['calls', 'method calls'],
  ['switches', 'switches'],
  ['maps', 'Map lookups'],
  ['checks', 'checks'],
  ['work', 'real work'],
];

export default function OverheadSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="What n - 2 costs the tree-walker" steps={s} note={st.note}>
      <CodeTrace code={TRACE} line={st.line} />
      <Svg w={400} h={128} title="Running totals of what the interpreter has done so far: method calls, switches on a kind or operator, Map lookups, type and operator checks, and the one subtraction that is the real work.">
        {ROWS.map(([k, label], i) => {
          const v = st.c[k];
          const y = 8 + i * 23;
          const real = k === 'work';
          return (
            <g key={k}>
              <T x={6} y={y + 9} size={12} weight={real ? 700 : 400} fill={real ? tok('safe') : undefined}>{label}</T>
              {Array.from({ length: v }, (_, j) => (
                <rect key={j} x={110 + j * 22} y={y} width={18} height={18} rx={3} fill={real ? tok('safe', 0.5) : tok('warn', 0.35)} stroke={real ? tok('safe') : tok('warn')} />
              ))}
              <T x={394} y={y + 9} size={12} mono anchor="end">{v}</T>
            </g>
          );
        })}
      </Svg>
    </StepFrame>
  );
}
