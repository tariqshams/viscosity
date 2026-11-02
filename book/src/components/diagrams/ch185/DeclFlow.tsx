// int a, b, c : the type is computed at T (synthesised), handed across to
// L (inherited), and passed down the list to every name.
import { Arrow, Svg, T, tok } from '../../viz/svg';
import { type N, drawTree, layout } from './atree';

const leaf = (id: string, label: string): N => ({ id, label, term: true });
const TREE: N = {
  id: 'D', label: 'D', kids: [
    { id: 'T', label: 'T', kids: [leaf('int', 'int')] },
    { id: 'L', label: 'L', kids: [
      { id: 'L1', label: 'L₁', kids: [
        { id: 'L2', label: 'L₂', kids: [leaf('a', 'a')] },
        leaf('c1', ','),
        leaf('b', 'b'),
      ] },
      leaf('c2', ','),
      leaf('c', 'c'),
    ] },
  ],
};
const P = layout(TREE, 4, 396, 18, 38);
const at = (id: string) => P.get(id)!;

export default function DeclFlow() {
  const t = at('T'), l = at('L'), l1 = at('L1'), l2 = at('L2');
  const ids = ['a', 'b', 'c'].map(at);
  return (
    <Svg w={400} h={250} title="The tree for int a, b, c. A solid arrow carries T.type across to L.in; dashed arrows carry L.in down to L₁ and L₂; each list node gives the type to its name.">
      {drawTree(P, { T: 'int', L: 'int', L1: 'int', L2: 'int' })}
      <Arrow x1={t.x + 12} y1={t.y - 4} x2={l.x - 14} y2={l.y - 4} color={tok('safe')} bend={-0.25} />
      <Arrow x1={l.x - 8} y1={l.y + 10} x2={l1.x + 8} y2={l1.y - 10} color={tok('accent')} dash />
      <Arrow x1={l1.x - 8} y1={l1.y + 10} x2={l2.x + 8} y2={l2.y - 10} color={tok('accent')} dash />
      {ids.map((p) => (
        <T key={p.node.id} x={p.x} y={p.y + 22} size={11} anchor="middle" fill={tok('brand')} weight={700}>{p.node.id}: int</T>
      ))}
      <T x={8} y={222} size={11} weight={700} fill={tok('safe')}>solid: T.type (synthesised) is handed across to L.in</T>
      <T x={8} y={238} size={11} weight={700} fill={tok('accent')}>dashed: L.in is passed down, L₁.in = L.in (inherited)</T>
    </Svg>
  );
}
