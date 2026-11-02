import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 369b: non_neg_int in engine/rust/crates/core/src/analysis.rs,
// asked whether the start of j in
//   for (let i = 0; i < ps.length; i++)
//     for (let j = i + 1; j < ps.length; j++)
// is a non-negative integer. The SSA values are drawn as the builder makes
// them: i is a phi of 0 and i + 1, and j starts at another i + 1. `seen` is
// shared by the whole query, so the second visit of i answers true.
type N = { id: string; x: number; y: number; label: string };
const NODES: N[] = [
  { id: 's', x: 200, y: 22, label: 'i + 1 (j’s start)' },
  { id: 'phi', x: 110, y: 96, label: 'i = φ(0, i + 1)' },
  { id: 'one', x: 310, y: 96, label: '1' },
  { id: 'zero', x: 50, y: 170, label: '0' },
  { id: 'step', x: 190, y: 170, label: 'i + 1 (i’s step)' },
  { id: 'one2', x: 300, y: 236, label: '1' },
];
const at = (id: string) => NODES.find((n) => n.id === id)!;
const EDGES: [string, string, boolean?][] = [
  ['s', 'phi'], ['s', 'one'], ['phi', 'zero'], ['phi', 'step'], ['step', 'phi', true], ['step', 'one2'],
];

type Mark = 'now' | 'ok' | 'assumed';
type S = { marks: Record<string, Mark>; seen: string[]; note: string };

const STATES: S[] = [
  { marks: {}, seen: [], note: 'The question: is j’s start, the value i + 1, a non-negative integer? seen starts empty, and the same set is passed down the whole query.' },
  { marks: { s: 'now' }, seen: ['i + 1'], note: 'seen.insert succeeds, so this is a first visit. It is a + node, so both operands must be non-negative integers: first i, then 1.' },
  { marks: { s: 'now', phi: 'now' }, seen: ['i + 1', 'i'], note: 'i is a phi: every operand must pass. Its operands are 0 (the start) and i + 1 (the value from the latch).' },
  { marks: { s: 'now', phi: 'now', zero: 'ok' }, seen: ['i + 1', 'i', '0'], note: '0 is finite, whole (0.trunc() == 0) and at least 0. Yes.' },
  { marks: { s: 'now', phi: 'now', zero: 'ok', step: 'now' }, seen: ['i + 1', 'i', '0', 'i + 1 (step)'], note: 'The step i + 1 is another + node. Its first operand is i again, which is where the cycle closes.' },
  { marks: { s: 'now', phi: 'assumed', zero: 'ok', step: 'now' }, seen: ['i + 1', 'i', '0', 'i + 1 (step)'], note: 'seen.insert(i) returns false: i is already in the set. The function answers true at once, an assumption that the rest of the cycle must earn.' },
  { marks: { s: 'now', phi: 'ok', zero: 'ok', step: 'ok', one2: 'ok' }, seen: ['i + 1', 'i', '0', 'i + 1 (step)', '1'], note: 'The step’s 1 passes, so the step passes, so the phi passes: its two operands are 0 and a sum of non-negative integers.' },
  { marks: { s: 'ok', phi: 'ok', zero: 'ok', step: 'ok', one2: 'ok', one: 'ok' }, seen: ['i + 1', 'i', '0', 'i + 1 (step)', '1', '1 (j’s)'], note: 'Finally j’s own 1 passes, so j’s start is a non-negative integer, and j counts from it in steps of +1. Without seen the walk would go round i forever; with false as the answer, i + 1 could never pass.' },
];

export default function SeenSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const fill = (m?: Mark) => (m === 'ok' ? tok('safe', 0.15) : m === 'assumed' ? tok('warn', 0.18) : m === 'now' ? tok('brand', 0.15) : tok('panel'));
  const stroke = (m?: Mark) => (m === 'ok' ? tok('safe') : m === 'assumed' ? tok('warn') : m === 'now' ? tok('brand') : tok('line'));
  return (
    <StepFrame title="non_neg_int and the seen set" steps={s} note={st.note}>
      <Svg w={400} h={310} title="The SSA values reached from j’s start, with the cycle through the phi of i">
        {EDGES.map(([a, b, back]) => {
          const p = at(a);
          const q = at(b);
          return back
            ? <Arrow key={a + b} x1={p.x - 40} y1={p.y - 12} x2={q.x + 30} y2={q.y + 12} bend={-0.6} dash color={tok('warn')} />
            : <Arrow key={a + b} x1={p.x} y1={p.y + 12} x2={q.x} y2={q.y - 13} />;
        })}
        {NODES.map((n) => {
          const w = Math.max(36, n.label.length * 7 + 14);
          return (
            <Box key={n.id} x={n.x - w / 2} y={n.y - 12} w={w} h={24} fill={fill(st.marks[n.id])} stroke={stroke(st.marks[n.id])}>
              <T x={n.x} y={n.y} size={11} mono anchor="middle">{n.label}</T>
            </Box>
          );
        })}
        <T x={8} y={270} size={11} weight={700} fill={tok('muted')}>seen</T>
        <T x={8} y={290} size={11} mono>{`{ ${st.seen.join(', ')} }`}</T>
      </Svg>
    </StepFrame>
  );
}
