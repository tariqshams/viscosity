// The term λx. (λy. x y) z as a tree. Each variable leaf is joined by a
// dashed arrow to the λ that binds it; z has no λ above it naming z, so
// it is free.
import { Arrow, Svg, T, tok } from '../../viz/svg';
import { type N, drawTree, layout } from './atree';

const leaf = (id: string, label: string): N => ({ id, label, term: true });
const TREE: N = {
  id: 'lx', label: 'λx', kids: [
    { id: 'a1', label: 'apply', kids: [
      { id: 'ly', label: 'λy', kids: [
        { id: 'a2', label: 'apply', kids: [leaf('x', 'x'), leaf('y', 'y')] },
      ] },
      leaf('z', 'z'),
    ] },
  ],
};
const P = layout(TREE, 30, 330, 22, 44);
const at = (id: string) => P.get(id)!;

export default function TermTree() {
  const lx = at('lx'), ly = at('ly'), x = at('x'), y = at('y'), z = at('z');
  return (
    <Svg w={400} h={252} title="The tree of λx. (λy. x y) z. Dashed arrows run from the leaf x to the λx at the root and from the leaf y to the λy; the leaf z has no binder and is marked free.">
      {drawTree(P)}
      <Arrow x1={x.x - 12} y1={x.y} x2={lx.x - 16} y2={lx.y + 4} color={tok('safe')} bend={-0.5} dash />
      <Arrow x1={y.x + 12} y1={y.y} x2={ly.x + 16} y2={ly.y + 2} color={tok('accent')} bend={0.5} dash />
      <circle cx={z.x} cy={z.y} r={16} fill="none" stroke={tok('danger')} strokeWidth={1.8} />
      <T x={z.x} y={z.y + 28} size={11} anchor="middle" weight={700} fill={tok('danger')}>free</T>
      <T x={x.x} y={x.y + 24} size={11} anchor="middle" weight={700} fill={tok('safe')}>bound by λx</T>
      <T x={y.x + 6} y={y.y + 24} size={11} anchor="middle" weight={700} fill={tok('accent')}>bound by λy</T>
      <T x={392} y={244} size={11} anchor="end" fill={tok('muted')}>apply: the left part applied to the right part</T>
    </Svg>
  );
}
