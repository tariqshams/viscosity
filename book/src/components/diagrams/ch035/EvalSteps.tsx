import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Svg, T, tok } from '../../viz/svg';

const CODE = `function evaluate(e) {
  switch (e.kind) {
    case 'literal':
      return e.value;
    case 'binary': {
      const l = evaluate(e.left);
      const r = evaluate(e.right);
      return apply(e.operator, l, r);
    }
  }
}`;

type Id = 'n1' | 'n2' | 'n3' | 'n4' | 'mul' | 'add' | 'sub';
const NODES: Record<Id, { x: number; y: number; label: string; kids?: Id[] }> = {
  sub: { x: 240, y: 30, label: '-', kids: ['add', 'n4'] },
  add: { x: 150, y: 92, label: '+', kids: ['n1', 'mul'] },
  n4: { x: 330, y: 92, label: '4' },
  n1: { x: 80, y: 154, label: '1' },
  mul: { x: 220, y: 154, label: '*', kids: ['n2', 'n3'] },
  n2: { x: 170, y: 216, label: '2' },
  n3: { x: 270, y: 216, label: '3' },
};

type S = { line: number; active: Id; waiting: Id[]; vals: Partial<Record<Id, number>>; note: string };

const STATES: S[] = [
  { line: 4, active: 'sub', waiting: [], vals: {}, note: 'evaluate() starts at the root, a binary - node. It cannot subtract yet: it needs the values of both children first.' },
  { line: 5, active: 'add', waiting: ['sub'], vals: {}, note: 'So it calls evaluate on the left child, the + node. The - node waits, its call paused on the call stack.' },
  { line: 3, active: 'n1', waiting: ['sub', 'add'], vals: { n1: 1 }, note: 'The + node evaluates its left child: a literal. A literal is the easy case: its value is stored right in the node. Return 1.' },
  { line: 6, active: 'mul', waiting: ['sub', 'add'], vals: { n1: 1 }, note: 'Now the + node needs its right child, the * node. Three calls are waiting on each other.' },
  { line: 3, active: 'n2', waiting: ['sub', 'add', 'mul'], vals: { n1: 1, n2: 2 }, note: 'The * node’s left child is the literal 2.' },
  { line: 3, active: 'n3', waiting: ['sub', 'add', 'mul'], vals: { n1: 1, n2: 2, n3: 3 }, note: 'Its right child is the literal 3.' },
  { line: 7, active: 'mul', waiting: ['sub', 'add'], vals: { n1: 1, n2: 2, n3: 3, mul: 6 }, note: 'Both operands are known, so apply the operator: 2 * 3 = 6. The * node returns 6 to its caller, the + node.' },
  { line: 7, active: 'add', waiting: ['sub'], vals: { n1: 1, n2: 2, n3: 3, mul: 6, add: 7 }, note: '1 + 6 = 7. The + node returns 7.' },
  { line: 3, active: 'n4', waiting: ['sub'], vals: { n1: 1, n2: 2, n3: 3, mul: 6, add: 7, n4: 4 }, note: 'Back in the - node, the left value is 7. Its right child is the literal 4.' },
  { line: 7, active: 'sub', waiting: [], vals: { n1: 1, n2: 2, n3: 3, mul: 6, add: 7, n4: 4, sub: 3 }, note: '7 - 4 = 3. The whole tree is worth 3. Values flowed upward: every node was finished only after all its children.' },
];

export default function EvalSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const ids = Object.keys(NODES) as Id[];
  return (
    <StepFrame title="Evaluating the tree for 1 + 2 * 3 - 4" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={250} title="The tree for 1 + 2 * 3 - 4 being evaluated. Each node is evaluated after its children, and its value is written beside it.">
        {ids.map((id) => {
          const n = NODES[id];
          return (n.kids ?? []).map((c) => (
            <line key={`${id}-${c}`} x1={n.x} y1={n.y} x2={NODES[c].x} y2={NODES[c].y} stroke={tok('ink', 0.45)} strokeWidth={1.5} />
          ));
        })}
        {ids.map((id) => {
          const n = NODES[id];
          const active = id === st.active;
          const waiting = st.waiting.includes(id);
          const v = st.vals[id];
          const op = !!n.kids;
          return (
            <g key={id}>
              <circle cx={n.x} cy={n.y} r={17} fill={tok('paper')} />
              <circle cx={n.x} cy={n.y} r={17}
                fill={active ? tok('brand', 0.25) : v !== undefined ? tok('safe', 0.12) : waiting ? tok('accent', 0.12) : tok('panel')}
                stroke={active ? tok('brand') : v !== undefined ? tok('safe') : waiting ? tok('accent') : tok('ink', 0.45)}
                strokeWidth={active ? 2.5 : 1.5} strokeDasharray={waiting && !active ? '4 3' : undefined} />
              <T x={n.x} y={n.y + 1} size={16} mono anchor="middle" weight={op ? 700 : 400} fill={op ? tok('brand') : tok('ink')}>{n.label}</T>
              {v !== undefined && (
                <g>
                  <rect x={n.x + 19} y={n.y - 26} width={30} height={18} rx={9} fill={tok('safe', 0.2)} stroke={tok('safe')} strokeWidth={1} />
                  <T x={n.x + 34} y={n.y - 17} size={12} mono anchor="middle" weight={700}>{v}</T>
                </g>
              )}
              {waiting && !active && <T x={n.x - 22} y={n.y} size={10} anchor="end" fill={tok('accent')}>waiting</T>}
            </g>
          );
        })}
        <T x={8} y={242} size={11} fill={tok('muted')}>thick ring: being evaluated · dashed: waiting · badge: its value</T>
      </Svg>
    </StepFrame>
  );
}
