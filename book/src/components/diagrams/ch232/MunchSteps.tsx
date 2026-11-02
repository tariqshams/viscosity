// Chapter 232: maximal munch on the tree for a[i + 1], one decision at a
// time. Tiles are chosen top-down; instructions come out bottom-up.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

type Node = { id: string; label: string; x: number; y: number };
const NODES: Node[] = [
  { id: 'ld', label: 'LOAD', x: 200, y: 20 },
  { id: 'add1', label: 'ADD', x: 200, y: 66 },
  { id: 'add2', label: 'ADD', x: 130, y: 112 },
  { id: 'k8', label: '8', x: 270, y: 112 },
  { id: 'a0', label: 'a0', x: 72, y: 158 },
  { id: 'shl', label: 'SHL', x: 188, y: 158 },
  { id: 'a1', label: 'a1', x: 150, y: 204 },
  { id: 'k3', label: '3', x: 226, y: 204 },
];
const EDGES: [string, string][] = [
  ['ld', 'add1'], ['add1', 'add2'], ['add1', 'k8'], ['add2', 'a0'],
  ['add2', 'shl'], ['shl', 'a1'], ['shl', 'k3'],
];
const at = (id: string) => NODES.find((n) => n.id === id)!;

type Tile = { nodes: string[]; ins: string; colour: string };
const T1: Tile = { nodes: ['ld', 'add1', 'k8'], ins: 'ld c(x)', colour: 'brand' };
const T2: Tile = { nodes: ['add2'], ins: 'add', colour: 'accent' };
const T3: Tile = { nodes: ['shl', 'k3'], ins: 'slli', colour: 'safe' };

type S = { tiles: Tile[]; focus: string | null; out: string[]; note: string };
const STATES: S[] = [
  { tiles: [], focus: null, out: [], note: 'The tree for a[i + 1]: load from a0 + (a1 << 3) + 8, where a0 holds the address of a[0] and a1 holds i. Nothing is chosen yet. Maximal munch starts at the root.' },
  { tiles: [], focus: 'ld', out: [], note: 'At the root, two tiles match: ld 0(x) covers only the LOAD, while ld c(x) covers the LOAD, the ADD under it and the constant 8, which fits in 12 bits. Munch takes the bigger one.' },
  { tiles: [T1], focus: 'add2', out: [], note: 'The tile is placed (orange). Its leaf x is the subtree ADD(a0, SHL ...), still uncovered, so we munch it next. Its right child is not a constant, so addi does not fit: plain add it is.' },
  { tiles: [T1, T2], focus: 'shl', out: [], note: 'The add tile (blue) leaves two subtrees. a0 is already in a register, so it needs no instruction. SHL(a1, 3) matches slli, which swallows the constant 3 too.' },
  { tiles: [T1, T2, T3], focus: null, out: ['slli v1, a1, 3'], note: 'Every node is covered by exactly one tile. Now the instructions come out, children before parents, because an instruction can only run once its operands exist: slli first.' },
  { tiles: [T1, T2, T3], focus: null, out: ['slli v1, a1, 3', 'add  v2, a0, v1'], note: 'Then the add, which uses v1, the result of the slli.' },
  { tiles: [T1, T2, T3], focus: null, out: ['slli v1, a1, 3', 'add  v2, a0, v1', 'ld   v3, 8(v2)'], note: 'Last the load, with the 8 folded into it. Three tiles, three instructions: exactly what clang -O2 writes for a[i + 1] on RV64IM.' },
];

export default function MunchSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const tileOf = (id: string) => st.tiles.find((t) => t.nodes.includes(id));
  return (
    <StepFrame title="Maximal munch on a[i + 1]" steps={s} note={st.note}>
      <Svg w={400} h={300} title="The tree for a[i+1], with tiles placed one at a time, and the instructions emitted so far.">
        {EDGES.map(([a, b]) => {
          const p = at(a); const q = at(b);
          return <Arrow key={a + b} x1={p.x} y1={p.y + 11} x2={q.x} y2={q.y - 11} color={tok('ink', 0.45)} width={1.5} />;
        })}
        {NODES.map((n) => {
          const t = tileOf(n.id);
          const hot = st.focus === n.id;
          return (
            <Box key={n.id} x={n.x - 24} y={n.y - 11} w={48} h={22} fill={t ? tok(t.colour, 0.2) : tok('panel')} stroke={hot ? tok('warn') : t ? tok(t.colour) : tok('line')}>
              <T x={n.x} y={n.y + 1} size={12} mono anchor="middle" weight={700}>{n.label}</T>
            </Box>
          );
        })}
        {st.tiles.map((t) => {
          const r = at(t.nodes[0]);
          return <T key={t.ins} x={r.x + 30} y={r.y + 1} size={12} mono fill={tok(t.colour)} weight={700}>{t.ins}</T>;
        })}
        <T x={8} y={232} size={11} weight={700} fill={tok('muted')}>EMITTED</T>
        {st.out.map((l, k) => (
          <T key={k} x={8} y={250 + k * 16} size={12.5} mono>{l}</T>
        ))}
        {st.out.length === 0 && <T x={8} y={250} size={12} fill={tok('muted')}>(nothing yet)</T>}
      </Svg>
    </StepFrame>
  );
}
