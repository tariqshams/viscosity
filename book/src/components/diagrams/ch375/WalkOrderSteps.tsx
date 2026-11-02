import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// The chapter The Python plugin in Rust: the preorder walk of engine/rust/crates/frontend-python/src/
// parser.rs (Ast::walk over Ast::children) on a two-line loop. For lists
// target, iter, then the body; Call lists func, the positional args, then
// each keyword's value, as the reference's object keys were created.
type N = { id: string; label: string; x: number; y: number; name?: string; parent?: string };

const NODES: N[] = [
  { id: 'for', label: 'For', x: 200, y: 22 },
  { id: 'p1', label: 'p', x: 60, y: 74, name: 'p', parent: 'for' },
  { id: 'ps', label: 'ps', x: 150, y: 74, name: 'ps', parent: 'for' },
  { id: 'expr', label: 'Expr', x: 300, y: 74, parent: 'for' },
  { id: 'call', label: 'Call', x: 300, y: 124, parent: 'expr' },
  { id: 'f', label: 'f', x: 220, y: 174, name: 'f', parent: 'call' },
  { id: 'attr', label: '.x', x: 300, y: 174, parent: 'call' },
  { id: 'w', label: 'k=w', x: 370, y: 174, name: 'w', parent: 'call' },
  { id: 'p2', label: 'p', x: 300, y: 222, name: 'p', parent: 'attr' },
];
const ORDER = ['for', 'p1', 'ps', 'expr', 'call', 'f', 'attr', 'p2', 'w'];

type S = { upto: number; wrong?: boolean; note: string };
const STATES: S[] = [
  { upto: 0, note: 'The tree for "for p in ps:" with the body "f(p.x, k=w)". The walk starts at the For node, number 1. It is a preorder walk: a node first, then its children, in the order children() lists them.' },
  { upto: 1, note: 'For lists target first, so the loop variable p is visited second. It is a name, so the walk writes p down.' },
  { upto: 2, note: 'Then iter: ps, the list being looped over. A walk that listed iter before target would meet ps first.' },
  { upto: 3, note: 'Then the body, one statement: an Expr node holding the call. Expr has one child.' },
  { upto: 4, note: 'The Call. Its children come in three groups: func, then the positional args, then each keyword argument’s value.' },
  { upto: 5, note: 'func first: the name f.' },
  { upto: 7, note: 'Then the positional argument p.x: an Attribute node, whose only child is the name p (the attribute name x is a string, not a node).' },
  { upto: 8, note: 'Last, the keyword argument k=w. Only its value, w, is a node; the keyword k is a string stored beside it. Names read: p, ps, f, p, w.' },
  { upto: 8, wrong: true, note: 'Now suppose Call listed keyword values before the args. Every node is still visited, but the names come out p, ps, f, w, p. The decisions would match; the order of explain’s lines would not, and parity would fail.' },
];

export default function WalkOrderSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const order = st.wrong ? ['for', 'p1', 'ps', 'expr', 'call', 'f', 'w', 'attr', 'p2'] : ORDER;
  const seen = order.slice(0, st.upto + 1);
  const names = seen.map((id) => NODES.find((n) => n.id === id)!).filter((n) => n.name).map((n) => n.name);
  const byId = (id: string) => NODES.find((n) => n.id === id)!;
  return (
    <StepFrame title="Walking the arena in the reference’s order" steps={s} note={st.note}>
      <Svg w={400} h={276} title="A preorder walk of a Python for loop, numbering each node as it is visited">
        {NODES.filter((n) => n.parent).map((n) => {
          const p = byId(n.parent!);
          return <Arrow key={n.id} x1={p.x} y1={p.y + 12} x2={n.x} y2={n.y - 12} width={1.5} color={tok('ink', 0.35)} />;
        })}
        {NODES.map((n) => {
          const k = seen.indexOf(n.id);
          const on = k >= 0;
          const now = k === seen.length - 1;
          return (
            <g key={n.id}>
              <Box x={n.x - 26} y={n.y - 12} w={52} h={24} r={4}
                fill={now ? tok('brand', 0.2) : on ? tok('f1', 0.12) : tok('panel')}
                stroke={now ? tok('brand') : on ? tok('f1') : tok('line')} />
              <T x={n.x} y={n.y} size={12} mono anchor="middle">{n.label}</T>
              {on && <T x={n.x - 30} y={n.y - 14} size={11} weight={700} anchor="end" fill={tok('brand')}>{k + 1}</T>}
            </g>
          );
        })}
        <T x={8} y={254} size={11} fill={tok('muted')}>names read, in walk order</T>
        <T x={8} y={270} size={13} mono weight={700} fill={st.wrong ? tok('danger') : tok('ink')}>{names.join(', ') || '(none yet)'}</T>
      </Svg>
    </StepFrame>
  );
}
