import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const CODE = `function printExpr(e) {
  switch (e.kind) {
    case 'literal':
      return String(e.value);
    case 'grouping':
      return '(group ' +
        printExpr(e.expression) + ')';
    case 'unary':
      return '(' + e.operator.lexeme +
        ' ' + printExpr(e.right) + ')';
    case 'binary':
      return '(' + e.operator.lexeme +
        ' ' + printExpr(e.left) +
        ' ' + printExpr(e.right) + ')';
  }
}`;

type Id = 'mul' | 'neg' | 'two' | 'grp' | 'add' | 'three' | 'four';
const NODES: { id: Id; x: number; y: number; kind: string; extra: string; out: string }[] = [
  { id: 'mul', x: 200, y: 22, kind: 'binary', extra: '*', out: '(* (- 2) (group (+ 3 4)))' },
  { id: 'neg', x: 92, y: 78, kind: 'unary', extra: '-', out: '(- 2)' },
  { id: 'grp', x: 290, y: 78, kind: 'grouping', extra: '', out: '(group (+ 3 4))' },
  { id: 'two', x: 92, y: 142, kind: 'literal', extra: '2', out: '2' },
  { id: 'add', x: 290, y: 142, kind: 'binary', extra: '+', out: '(+ 3 4)' },
  { id: 'three', x: 236, y: 206, kind: 'literal', extra: '3', out: '3' },
  { id: 'four', x: 344, y: 206, kind: 'literal', extra: '4', out: '4' },
];
const EDGES: [Id, Id][] = [['mul', 'neg'], ['mul', 'grp'], ['neg', 'two'], ['grp', 'add'], ['add', 'three'], ['add', 'four']];

type S = { line: number; active: Id | null; waiting: Id[]; done: Id[]; note: string };

const STATES: S[] = [
  { line: 0, active: null, waiting: [], done: [], note: 'The tree of -2 * (3 + 4). printExpr will turn it back into text, one node at a time.' },
  { line: 12, active: 'mul', waiting: [], done: [], note: 'Start at the root, a binary node for *. To build its string it first needs the strings of its two children, so it calls printExpr on the left one.' },
  { line: 9, active: 'neg', waiting: ['mul'], done: [], note: 'The left child is a unary minus. It needs the string of its own child first. The * call waits, unfinished: it is still on the call stack.' },
  { line: 3, active: 'two', waiting: ['mul', 'neg'], done: ['two'], note: 'A literal is the base case: no children, so String(2) is returned straight away.' },
  { line: 9, active: 'neg', waiting: ['mul'], done: ['two', 'neg'], note: 'Back in the unary call, which glues its operator onto its child’s string: “(- 2)”.' },
  { line: 6, active: 'grp', waiting: ['mul'], done: ['two', 'neg'], note: 'Back at the root, which now calls printExpr on its right child, a grouping node: the brackets in the source.' },
  { line: 12, active: 'add', waiting: ['mul', 'grp'], done: ['two', 'neg'], note: 'Inside the grouping is another binary node, for +. Three calls are now waiting on the stack: *, group and +.' },
  { line: 3, active: 'three', waiting: ['mul', 'grp', 'add'], done: ['two', 'neg', 'three'], note: 'Its left child is the literal 3.' },
  { line: 3, active: 'four', waiting: ['mul', 'grp', 'add'], done: ['two', 'neg', 'three', 'four'], note: 'Its right child is the literal 4.' },
  { line: 13, active: 'add', waiting: ['mul', 'grp'], done: ['two', 'neg', 'three', 'four', 'add'], note: 'Both strings are back, so + returns “(+ 3 4)”: the operator first, then its operands.' },
  { line: 6, active: 'grp', waiting: ['mul'], done: ['two', 'neg', 'three', 'four', 'add', 'grp'], note: 'The grouping wraps it: “(group (+ 3 4))”.' },
  { line: 13, active: 'mul', waiting: [], done: ['two', 'neg', 'three', 'four', 'add', 'grp', 'mul'], note: 'Finally the root has both of its children’s strings. Every node was visited once, children before parents. Each pair of brackets in the output is one node of the tree.' },
];

const W = 92;
const H = 30;

export default function PrintSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const by = Object.fromEntries(NODES.map((n) => [n.id, n]));
  return (
    <StepFrame title="Printing a tree" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={272} title="The tree of -2 * (3 + 4). Each node is marked as waiting, active or done, with the string it returned.">
        {EDGES.map(([a, b]) => (
          <line key={a + b} x1={by[a].x} y1={by[a].y + H / 2} x2={by[b].x} y2={by[b].y - H / 2} stroke={tok('ink', 0.4)} strokeWidth={1.4} />
        ))}
        {NODES.map((n) => {
          const active = st.active === n.id;
          const waiting = st.waiting.includes(n.id);
          const done = st.done.includes(n.id);
          const stroke = active ? tok('brand') : waiting ? tok('brand', 0.7) : done ? tok('safe') : tok('ink', 0.4);
          const fill = active ? tok('brand', 0.18) : done ? tok('safe', 0.1) : tok('panel');
          return (
            <g key={n.id}>
              <Box x={n.x - W / 2} y={n.y - H / 2} w={W} h={H} r={7} fill={fill} stroke={stroke} dash={waiting}>
                <T x={n.x} y={n.y + 1} size={12} mono anchor="middle" weight={active ? 700 : 400}>
                  {n.kind}{n.extra ? ` ${n.extra}` : ''}
                </T>
              </Box>
              {done && n.id !== 'mul' && (
                <g>
                  <rect x={n.x - (n.out.length + 4) * 3.5} y={n.y + H / 2 + 3} width={(n.out.length + 4) * 7} height={14} rx={3} fill={tok('paper')} />
                  <T x={n.x} y={n.y + H / 2 + 10} size={11} mono anchor="middle" fill={tok('safe')} weight={700}>→ '{n.out}'</T>
                </g>
              )}
            </g>
          );
        })}
        <T x={8} y={246} size={11} weight={700} fill={tok('muted')}>RESULT</T>
        <T x={8} y={262} size={13} mono fill={st.done.includes('mul') ? tok('safe') : tok('muted')} weight={700}>
          {st.done.includes('mul') ? `'${by.mul.out}'` : '…not yet'}
        </T>
        <T x={392} y={246} size={11} anchor="end" fill={tok('muted')}>calls on the stack: {st.waiting.length + (st.active ? 1 : 0)}</T>
      </Svg>
    </StepFrame>
  );
}
