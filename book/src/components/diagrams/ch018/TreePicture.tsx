import { Box, Svg, T, tok } from '../../viz/svg';

type N = { label: string; x: number; y: number; leaf?: boolean };

const NODES: N[] = [
  { label: "mul", x: 200, y: 30 },
  { label: "add", x: 110, y: 100 },
  { label: "4", x: 290, y: 100, leaf: true },
  { label: "2", x: 60, y: 170, leaf: true },
  { label: "3", x: 160, y: 170, leaf: true },
];
const EDGES: [number, number][] = [[0, 1], [0, 2], [1, 3], [1, 4]];

/** The expression (2 + 3) * 4 as a tree of nodes. */
export default function TreePicture() {
  return (
    <Svg w={400} h={200} title="A tree for (2 + 3) * 4. The root is a mul node. Its left child is an add node with leaves 2 and 3; its right child is the leaf 4.">
      {EDGES.map(([a, b]) => (
        <line key={`${a}-${b}`} x1={NODES[a].x} y1={NODES[a].y + 16} x2={NODES[b].x} y2={NODES[b].y - 16} stroke={tok('ink', 0.5)} strokeWidth={2} />
      ))}
      {NODES.map((n) => (
        <Box key={n.label} x={n.x - 34} y={n.y - 16} w={68} h={32} r={n.leaf ? 16 : 6} fill={n.leaf ? tok('accent', 0.12) : tok('brand', 0.12)} stroke={n.leaf ? tok('accent') : tok('brand')}>
          <T x={n.x} y={n.y} size={14} mono weight={700} anchor="middle">{n.label}</T>
        </Box>
      ))}
      <T x={250} y={30} size={11} fill={tok('muted')}>← root</T>
      <T x={330} y={150} size={11} anchor="middle" fill={tok('muted')}>leaves: no children</T>
      <T x={330} y={166} size={11} anchor="middle" fill={tok('muted')}>(the base case)</T>
    </Svg>
  );
}
