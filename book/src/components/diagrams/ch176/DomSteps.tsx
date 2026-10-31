import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 176: Cooper–Harvey–Kennedy dominators, as dominators() in
// engine/rust/crates/core/src/cfg.rs computes them, on a six-block CFG
// shaped like a loop with a throw inside (simplified from a real VIR
// listing). Reverse postorder: 0 1 4 2 5 3 (successors visited in order).
const NAMES = ['entry', 'head', 'body', 'throw', 'exit', 'latch'];
const POS: [number, number][] = [[20, 20], [20, 80], [20, 140], [20, 200], [130, 80], [130, 140]];
const EDGES: [number, number][] = [[0, 1], [1, 2], [1, 4], [2, 3], [2, 5], [5, 1]];
const RPO = [0, 1, 4, 2, 5, 3];

type S = { idom: (number | null)[]; at: number | null; climb?: number[]; back?: boolean; note: string };
const STATES: S[] = [
  { idom: [0, null, null, null, null, null], at: 0, note: 'Number the blocks in reverse postorder: 0 1 4 2 5 3. The entry is its own immediate dominator; every other idom starts as None.' },
  { idom: [0, 0, null, null, null, null], at: 1, note: 'Pass 1, head. Its predecessors are entry and latch, but latch has no idom yet, so it is skipped. The only one left is entry: idom = entry.' },
  { idom: [0, 0, null, null, 1, null], at: 4, note: 'exit has one predecessor, head, which is done: idom = head.' },
  { idom: [0, 0, 1, null, 1, null], at: 2, note: 'body: idom = head, the same way.' },
  { idom: [0, 0, 1, null, 1, 2], at: 5, note: 'latch: idom = body.' },
  { idom: [0, 0, 1, 2, 1, 2], at: 3, note: 'throw: idom = body. Something changed in this pass, so run another.' },
  { idom: [0, 0, 1, 2, 1, 2], at: 1, climb: [5, 2, 1, 0], note: 'Pass 2, head. Now both predecessors have idoms, so intersect(latch, entry): climb from whichever is later in RPO until the two meet. latch → body → head → entry. Still entry.' },
  { idom: [0, 0, 1, 2, 1, 2], at: null, back: true, note: 'Nothing changed in pass 2: done. latch → head is a back edge, because head dominates latch. The natural loop is head, body, latch. throw is not in it: from throw there is no way back.' },
];

export default function DomSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const inLoop = (b: number) => st.back && (b === 1 || b === 2 || b === 5);
  return (
    <StepFrame title="Dominators, two passes" steps={s} note={st.note}>
      <Svg w={400} h={240} title="A six-block CFG and its immediate dominators, filled in pass by pass">
        {EDGES.map(([a, b]) => {
          const [x1, y1] = POS[a];
          const [x2, y2] = POS[b];
          const backEdge = a === 5 && b === 1;
          const [p1, q1, p2, q2] =
            y2 > y1 + 10 ? [x1 + 35, y1 + 24, x2 + 35, y2 - 2]
            : y2 < y1 - 10 ? [x1 + 35, y1, x2 + 45, y2 + 26]
            : [x1 + 70, y1 + 12, x2 - 2, y2 + 12];
          return (
            <Arrow key={`${a}-${b}`} x1={p1} y1={q1} x2={p2} y2={q2} bend={backEdge ? 0.3 : 0}
              color={backEdge && st.back ? tok('f3') : tok('ink', 0.35)} width={backEdge && st.back ? 2.5 : 1.5} />
          );
        })}
        {POS.map(([x, y], b) => {
          const on = st.at === b;
          const climb = st.climb?.includes(b);
          return (
            <Box key={b} x={x} y={y} w={70} h={24} r={4}
              fill={on ? tok('brand', 0.22) : climb ? tok('warn', 0.2) : inLoop(b) ? tok('f3', 0.15) : tok('panel')}
              stroke={on ? tok('brand') : inLoop(b) ? tok('f3') : tok('line')}>
              <T x={x + 35} y={y + 12} size={11} mono anchor="middle">{b} {NAMES[b]}</T>
            </Box>
          );
        })}
        <T x={235} y={20} size={11} weight={700} fill={tok('brand')}>rpo</T>
        <T x={265} y={20} size={11} weight={700} fill={tok('brand')}>block</T>
        <T x={330} y={20} size={11} weight={700} fill={tok('brand')}>idom</T>
        {RPO.map((b, i) => {
          const c = st.at === b ? tok('brand') : tok('ink');
          const d = st.idom[b];
          return (
            <g key={b}>
              <T x={235} y={42 + i * 22} size={11} mono fill={c}>{i}</T>
              <T x={265} y={42 + i * 22} size={11} mono fill={c}>{`${b} ${NAMES[b]}`}</T>
              <T x={330} y={42 + i * 22} size={11} mono fill={d === null ? tok('muted') : c}>{d === null ? 'None' : NAMES[d]}</T>
            </g>
          );
        })}
      </Svg>
    </StepFrame>
  );
}
