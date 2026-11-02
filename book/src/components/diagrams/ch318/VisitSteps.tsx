import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 318: a visitor walking f(a, () => b). The default methods walk
// every child in source order; Mentions (adapted from
// engine/rust/crates/frontend-js/src/lower.rs) overrides two of them:
// it records each name, and flips `inner` while inside a function.
const CODE = `impl Visit for Mentions {
    fn visit_name(&mut self, n: &str) {
        self.found.push((n.into(), self.inner));
    }
    fn visit_arrow(&mut self, b: &Expr) {
        let saved = self.inner;
        self.inner = true;
        self.visit_expr(b);
        self.inner = saved;
    }
}`;

type Id = 'call' | 'f' | 'a' | 'arrow' | 'b' | null;
type S = { line: number | null; at: Id; inner: boolean; found: string[]; note: string };

const STATES: S[] = [
  { line: null, at: 'call', inner: false, found: [], note: 'visit_expr(call). Mentions doesn’t override visit_expr, so the trait’s default runs: walk_expr matches on the node and visits its children in source order.' },
  { line: 2, at: 'f', inner: false, found: ['f · outer'], note: 'The callee f is a name. visit_name is overridden: record f, with inner = false.' },
  { line: 2, at: 'a', inner: false, found: ['f · outer', 'a · outer'], note: 'Next child: the argument a. Same method, same flag.' },
  { line: 6, at: 'arrow', inner: true, found: ['f · outer', 'a · outer'], note: 'An arrow function. visit_arrow is overridden too: save the old flag, set inner = true, then walk the body with the ordinary visit_expr.' },
  { line: 2, at: 'b', inner: true, found: ['f · outer', 'a · outer', 'b · inner'], note: 'b sits inside the arrow, so it is recorded as inner. Lowering reads such variables as captured bindings, not as SSA values.' },
  { line: 8, at: 'call', inner: false, found: ['f · outer', 'a · outer', 'b · inner'], note: 'Leaving the arrow restores the saved flag. Without this line, every name after the arrow would wrongly count as inner.' },
  { line: null, at: null, inner: false, found: ['f · outer', 'a · outer', 'b · inner'], note: 'Two small overrides, and the trait walked the rest. The real Mentions overrides four of the more than 250 visit methods in oxc’s Visit trait, and the defaults walk everything else.' },
];

const NODES: { id: Exclude<Id, null>; label: string; x: number; y: number; w: number }[] = [
  { id: 'call', label: 'Call', x: 120, y: 10, w: 70 },
  { id: 'f', label: 'Name f', x: 20, y: 80, w: 70 },
  { id: 'a', label: 'Name a', x: 110, y: 80, w: 70 },
  { id: 'arrow', label: 'Arrow', x: 200, y: 80, w: 70 },
  { id: 'b', label: 'Name b', x: 200, y: 150, w: 70 },
];
const EDGES: [Id, Id][] = [['call', 'f'], ['call', 'a'], ['call', 'arrow'], ['arrow', 'b']];

export default function VisitSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const pos = (id: Id) => NODES.find((n) => n.id === id)!;
  return (
    <StepFrame title="A visitor walks f(a, () => b)" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={200} title="The tree of f(a, () => b), the node being visited, and what Mentions has found">
        {EDGES.map(([p, c]) => {
          const a = pos(p);
          const b = pos(c);
          return <Arrow key={`${p}-${c}`} x1={a.x + a.w / 2} y1={a.y + 28} x2={b.x + b.w / 2} y2={b.y - 2} color={tok('ink', 0.35)} width={1.5} />;
        })}
        {NODES.map((n) => {
          const on = st.at === n.id;
          const fn = n.id === 'arrow' || n.id === 'b';
          return (
            <Box key={n.id} x={n.x} y={n.y} w={n.w} h={28} r={4} fill={on ? tok('brand', 0.2) : fn ? tok('f3', 0.1) : tok('panel')} stroke={on ? tok('brand') : tok('line')}>
              <T x={n.x + n.w / 2} y={n.y + 14} size={11} mono anchor="middle">{n.label}</T>
            </Box>
          );
        })}
        <T x={290} y={18} size={11} weight={700} fill={tok('brand')}>inner</T>
        <Box x={290} y={28} w={90} h={26} r={3} fill={st.inner ? tok('f3', 0.2) : tok('panel')} stroke={st.inner ? tok('f3') : tok('line')}>
          <T x={335} y={41} size={11} mono anchor="middle">{st.inner ? 'true' : 'false'}</T>
        </Box>
        <T x={290} y={80} size={11} weight={700} fill={tok('brand')}>found</T>
        {st.found.map((f, k) => (
          <T key={f} x={290} y={98 + k * 18} size={11} mono fill={f.endsWith('inner') ? tok('f3') : tok('ink')}>{f}</T>
        ))}
      </Svg>
    </StepFrame>
  );
}
