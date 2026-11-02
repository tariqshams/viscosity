import { Svg, T, tok } from '../../viz/svg';
import { type PT, drawTree, layout } from './ptree';

// 1 + 2  under  E → E "+" T | T,  T → NUMBER
const TREE: PT = {
  id: 'r', label: 'E', kids: [
    { id: 'e', label: 'E', kids: [{ id: 't1', label: 'T', kids: [{ id: 'n1', label: '1', term: true }] }] },
    { id: 'p', label: '+', term: true },
    { id: 't2', label: 'T', kids: [{ id: 'n2', label: '2', term: true }] },
  ],
};
const TOP = ['r', 'e', 't1', 'n1', 'p', 't2', 'n2'];
const BOTTOM = ['n1', 't1', 'e', 'p', 'n2', 't2', 'r'];
const L = layout(TREE, 10, 190, 50, 42);
const R = layout(TREE, 210, 390, 50, 42);

function Badges({ placed, order, color }: { placed: ReturnType<typeof layout>; order: string[]; color: string }) {
  return (
    <g>
      {order.map((id, k) => {
        const p = placed.get(id)!;
        return (
          <g key={id}>
            <circle cx={p.x + 19} cy={p.y - 11} r={8} fill={color} />
            <T x={p.x + 19} y={p.y - 10.5} size={10} anchor="middle" weight={700} fill={tok('paper')}>{k + 1}</T>
          </g>
        );
      })}
    </g>
  );
}

/** The same tree, with the order its nodes are built: top-down vs bottom-up. */
export default function BuildOrder() {
  return (
    <Svg w={400} h={236} title="The parse tree of 1 + 2 drawn twice. Left, numbered in the order a top-down parser creates nodes: root first, then left to right downwards. Right, the order a bottom-up parser creates them: the leaf 1 first, the root last.">
      <T x={100} y={12} size={11} weight={700} anchor="middle" fill={tok('brand')}>TOP-DOWN: ROOT FIRST</T>
      <T x={300} y={12} size={11} weight={700} anchor="middle" fill={tok('accent')}>BOTTOM-UP: LEAVES FIRST</T>
      <line x1={200} y1={4} x2={200} y2={230} stroke={tok('line')} strokeDasharray="4 4" />
      {drawTree(L)}
      {drawTree(R)}
      <Badges placed={L} order={TOP} color={tok('brand')} />
      <Badges placed={R} order={BOTTOM} color={tok('accent')} />
    </Svg>
  );
}
