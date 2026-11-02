// Chapter 243: conservative coalescing of sumsq's four copies with k = 4,
// using the Briggs test at each step. Dashed lines are copies still present.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Svg, T, tok } from '../../viz/svg';

const BASE: Record<string, [number, number]> = {
  n: [200, 118], s0: [62, 36], i0: [62, 118], s1: [200, 28], i1: [338, 118],
  t: [290, 48], s2: [290, 198], i2: [110, 198],
};
const EDGES = 'i0-n i0-s0 i0-s1 i1-n i1-s1 i1-s2 i1-t i2-n i2-s1 i2-s2 n-s0 n-s1 n-s2 n-t s1-t'.split(' ').map((e) => e.split('-'));
const COPIES = [['s0', 's1'], ['i0', 'i1'], ['s1', 's2'], ['i1', 'i2']];

type S = { alias: Record<string, string>; hot: string | null; note: string };
const STATES: S[] = [
  { alias: {}, hot: null, note: 'sumsq’s graph with its four copies dashed. Each copy joins two values that do not interfere, so they could share a register. Coalescing merges such a pair into one node, and the copy between them disappears. With k = 4, we ask the Briggs test first, each time.' },
  { alias: { s0: 's1' }, hot: 's1', note: 's0 + s1. The merged node’s neighbours would be n (degree 6 after merging), i1 (4), t (3), i0 (2) and i2 (3). Only n and i1 have 4 or more: 2 significant neighbours, fewer than 4, so the merge is safe. Merged; the copy mv s1, s0 is gone.' },
  { alias: { s0: 's1', i0: 'i1' }, hot: 'i1', note: 'i0 + i1. Neighbours: n (5), the merged s (4), s2 (3), t (3). Two significant, fewer than 4: merge.' },
  { alias: { s0: 's1', i0: 'i1', s2: 's1' }, hot: 's1', note: 's + s2. Neighbours: n (4), i (3), i2 (2), t (3). Only n is significant: merge.' },
  { alias: { s0: 's1', i0: 'i1', s2: 's1', i2: 'i1' }, hot: 'i1', note: 'i + i2. Neighbours: n, s and t, each now with degree 3: none significant. Merge.' },
  { alias: { s0: 's1', i0: 'i1', s2: 's1', i2: 'i1' }, hot: null, note: 'Four nodes, all joined: n, s, i and t, which colour with exactly four registers. All four copies have gone, deliberately this time: the loop body is mul, add, addi, j, as in LLVM’s output.' },
];

export default function CoalesceSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const a = (v: string) => st.alias[v] ?? v;
  const nodes = Object.keys(BASE).filter((v) => a(v) === v);
  const label = (v: string) => {
    const members = Object.keys(BASE).filter((w) => a(w) === v);
    if (members.length === 1) return v;
    return members[0][0];
  };
  const seen = new Set<string>();
  const edges = EDGES.map(([p, q]) => [a(p), a(q)]).filter(([p, q]) => {
    const k = [p, q].sort().join('-');
    if (seen.has(k)) return false;
    seen.add(k); return true;
  });
  const copies = COPIES.filter(([p, q]) => a(p) !== a(q));
  return (
    <StepFrame title="Coalescing sumsq, conservatively" steps={s} note={st.note}>
      <Svg w={400} h={226} title="sumsq's interference graph as copy pairs are merged one by one.">
        {copies.map(([p, q]) => {
          const [x1, y1] = BASE[a(p)]; const [x2, y2] = BASE[a(q)];
          return <line key={p + q} x1={x1} y1={y1} x2={x2} y2={y2} stroke={tok('safe')} strokeWidth={2} strokeDasharray="5 4" />;
        })}
        {edges.map(([p, q]) => {
          const [x1, y1] = BASE[p]; const [x2, y2] = BASE[q];
          return <line key={p + q} x1={x1} y1={y1} x2={x2} y2={y2} stroke={tok('ink', 0.55)} strokeWidth={1.5} />;
        })}
        {nodes.map((v) => {
          const [x, y] = BASE[v];
          const hot = st.hot === v;
          const lab = label(v);
          return (
            <g key={v}>
              <circle cx={x} cy={y} r={18} fill={hot ? tok('brand', 0.25) : tok('panel')} stroke={hot ? tok('brand') : tok('ink', 0.6)} strokeWidth={hot ? 2.5 : 1.5} />
              <T x={x} y={y + 1} size={13} mono anchor="middle" weight={700}>{lab}</T>
            </g>
          );
        })}
        <T x={396} y={220} size={11} anchor="end" fill={tok('muted')}>{`copies left: ${copies.length}`}</T>
      </Svg>
    </StepFrame>
  );
}
