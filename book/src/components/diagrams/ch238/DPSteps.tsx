// Chapter 238: optimal tiling by dynamic programming on ADD(SHL(i, 3), 8),
// with made-up cycle costs (sh3add = 3, everything else 1). Label every node
// bottom-up with its cheapest cover, then read the choices top-down.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

type Node = { id: string; label: string; x: number; y: number };
const NODES: Node[] = [
  { id: 'add', label: 'ADD', x: 200, y: 24 },
  { id: 'shl', label: 'SHL', x: 120, y: 84 },
  { id: 'k8', label: '8', x: 284, y: 84 },
  { id: 'i', label: 'i', x: 76, y: 144 },
  { id: 'k3', label: '3', x: 164, y: 144 },
];
const EDGES: [string, string][] = [['add', 'shl'], ['add', 'k8'], ['shl', 'i'], ['shl', 'k3']];
const at = (id: string) => NODES.find((n) => n.id === id)!;

type S = { labels: Record<string, string>; hot: string[]; win: string[]; lines: string[]; note: string };
const STATES: S[] = [
  { labels: {}, hot: [], win: [], lines: ['costs: li, add, addi, slli = 1', '       sh3add = 3 (made up)'], note: 'The tree for i × 8 + 8, after the multiply became a shift. Suppose, on some small core, sh3add took 3 cycles and every other instruction 1. We work from the leaves up, writing the cheapest cost of each subtree on its node.' },
  { labels: { i: '0', k3: '1', k8: '1' }, hot: ['i', 'k3', 'k8'], win: [], lines: ['i: already in a register: 0', '3, 8: li: 1 each'], note: 'The leaves first. i is already in a register, so it costs nothing. A constant on its own could be loaded with li, cost 1 (whether we ever need that is decided higher up).' },
  { labels: { i: '0', k3: '1', k8: '1', shl: '1' }, hot: ['shl'], win: ['shl', 'k3'], lines: ['SHL: slli = 1 + best(i)', '         = 1 + 0 = 1'], note: 'SHL(i, 3) matches one tile, slli, which swallows the 3 and leaves i, cost 0. So the best cover of this subtree costs 1, and we write that down once, for good.' },
  { labels: { i: '0', k3: '1', k8: '1', shl: '1', add: '?' }, hot: ['add'], win: [], lines: ['add:    1 + best(SHL) + best(8) = 3', 'addi:   1 + best(SHL)           = 2', 'sh3add: 3 + best(i) + best(8)   = 4'], note: 'Three tiles match at the root. Each costs its own instruction plus the stored best costs of the subtrees at its leaves. Nothing below is worked out again: we only look the numbers up.' },
  { labels: { i: '0', k3: '1', k8: '1', shl: '1', add: '2' }, hot: ['add'], win: ['add', 'k8'], lines: ['root: addi wins, cost 2'], note: 'addi is cheapest, so the root is labelled 2, choice addi. Maximal munch would have taken sh3add, the biggest tile, and paid 4 (sh3add plus an li for the 8).' },
  { labels: { i: '0', k3: '1', k8: '1', shl: '1', add: '2' }, hot: [], win: ['add', 'k8', 'shl', 'k3'], lines: ['slli v1, i, 3', 'addi v2, v1, 8'], note: 'Second pass, top-down: the root chose addi, whose leaf is SHL, which chose slli. Writing children first gives two instructions, cost 2: the cheapest cover there is.' },
];

export default function DPSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Cheapest cover, bottom-up" steps={s} note={st.note}>
      <Svg w={400} h={236} title="The tree ADD(SHL(i,3),8), each node labelled with the cost of its cheapest cover.">
        {EDGES.map(([a, b]) => {
          const p = at(a); const q = at(b);
          return <Arrow key={a + b} x1={p.x} y1={p.y + 11} x2={q.x} y2={q.y - 11} color={tok('ink', 0.45)} width={1.5} />;
        })}
        {NODES.map((n) => {
          const hot = st.hot.includes(n.id);
          const win = st.win.includes(n.id);
          const lab = st.labels[n.id];
          return (
            <g key={n.id}>
              <Box x={n.x - 24} y={n.y - 11} w={48} h={22} fill={win ? tok('safe', 0.2) : tok('panel')} stroke={hot ? tok('warn') : win ? tok('safe') : tok('line')}>
                <T x={n.x} y={n.y + 1} size={12} mono anchor="middle" weight={700}>{n.label}</T>
              </Box>
              {lab && <T x={n.x + 30} y={n.y + 1} size={12} mono weight={700} fill={tok('brand')}>{lab}</T>}
            </g>
          );
        })}
        {st.lines.map((l, k) => (
          <T key={k} x={8} y={182 + k * 17} size={12} mono>{l}</T>
        ))}
      </Svg>
    </StepFrame>
  );
}
