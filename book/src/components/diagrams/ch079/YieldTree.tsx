import { Svg, T, tok } from '../../viz/svg';
import { type PT, drawTree, layout } from './ptree';

// print (1 + 2) + 3 ;  with NUMBER leaves shown by their lexemes.
const n = (id: string, v: string): PT => ({ id: 'i' + id, label: 'item', kids: [{ id, label: v, term: true }] });
const TREE: PT = {
  id: 's', label: 'stmt', kids: [
    { id: 'p', label: 'print', term: true },
    { id: 'e', label: 'expr', kids: [
      { id: 'e2', label: 'expr', kids: [
        { id: 'g', label: 'item', kids: [
          { id: 'lp', label: '(', term: true },
          { id: 'e3', label: 'expr', kids: [
            { id: 'e4', label: 'expr', kids: [n('one', '1')] },
            { id: 'pl1', label: '+', term: true },
            n('two', '2'),
          ] },
          { id: 'rp', label: ')', term: true },
        ] },
      ] },
      { id: 'pl2', label: '+', term: true },
      n('three', '3'),
    ] },
    { id: 'sc', label: ';', term: true },
  ],
};

const PLACED = layout(TREE, 8, 392, 16, 31);
const BASE = 274;

export default function YieldTree() {
  const leaves = [...PLACED.values()].filter((p) => !p.node.kids);
  return (
    <Svg w={400} h={292} title="The parse tree of print (1 + 2) + 3 ; with dashed lines dropping from each leaf to a row at the bottom, where the leaves read left to right spell the sentence.">
      {leaves.map((p) => (
        <line key={p.node.id} x1={p.x} y1={p.y + 11} x2={p.x} y2={BASE - 10} stroke={tok('ink', 0.3)} strokeDasharray="3 3" />
      ))}
      {drawTree(PLACED)}
      <rect x={4} y={BASE - 10} width={392} height={20} rx={4} fill={tok('safe', 0.12)} stroke={tok('safe')} />
      {leaves.map((p) => (
        <T key={'y' + p.node.id} x={p.x} y={BASE + 1} size={13} mono anchor="middle" weight={700}>{p.node.label}</T>
      ))}
    </Svg>
  );
}
