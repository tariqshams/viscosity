// The tree of (λx. x + 1 : number → number) 2, with the expected type
// flowing down (check, ⇐) and found types flowing up (synthesise, ⇒).
import { Box, Svg, T, tok } from '../../viz/svg';

type N = { x: number; y: number; w: number; t: string; m: string; check: boolean };
const NODES: N[] = [
  { x: 200, y: 22, w: 120, t: 'apply', m: '⇒ number', check: false },
  { x: 110, y: 82, w: 170, t: '( : number → number)', m: '⇒ number → number', check: false },
  { x: 320, y: 82, w: 80, t: '2', m: '⇐ number', check: true },
  { x: 110, y: 142, w: 150, t: 'λx', m: '⇐ number → number', check: true },
  { x: 110, y: 202, w: 120, t: 'x + 1', m: '⇐ number', check: true },
];
const EDGES: [number, number][] = [[0, 1], [0, 2], [1, 3], [3, 4]];

export default function ModeTree() {
  return (
    <Svg w={400} h={256} title="The tree: an application at the root, with the annotated lambda and the argument 2 below it. The root and the annotation synthesise their types; the argument, the lambda and its body x + 1 are checked against types passed down to them.">
      {EDGES.map(([a, b], k) => (
        <line key={k} x1={NODES[a].x} y1={NODES[a].y + 18} x2={NODES[b].x} y2={NODES[b].y - 18} stroke={tok('line')} strokeWidth={1.5} />
      ))}
      {NODES.map((n, k) => (
        <Box key={k} x={n.x - n.w / 2} y={n.y - 18} w={n.w} h={36} stroke={n.check ? tok('accent') : tok('brand')}>
          <T x={n.x} y={n.y - 7} size={12} mono anchor="middle">{n.t}</T>
          <T x={n.x} y={n.y + 9} size={11} mono anchor="middle" weight={700} fill={n.check ? tok('accent') : tok('brand')}>{n.m}</T>
        </Box>
      ))}
      <T x={250} y={168} size={11} fill={tok('accent')}>⇐ type given from above</T>
      <T x={250} y={186} size={11} fill={tok('brand')}>⇒ type found, sent up</T>
      <T x={200} y={244} size={11} anchor="middle" fill={tok('muted')}>one annotation, on the λ; everything else is local</T>
    </Svg>
  );
}
