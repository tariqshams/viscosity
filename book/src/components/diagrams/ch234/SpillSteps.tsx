// Chapter 234: sumsq with only three registers (a0, a1, a2). The graph of
// n, s, i, t is stuck; spill costs pick n; spill code splits n into two tiny
// values; the new graph colours with three.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Svg, T, tok } from '../../viz/svg';

const G1: Record<string, [number, number]> = { n: [60, 40], s: [180, 40], i: [180, 150], t: [60, 150] };
const E1 = [['n', 's'], ['n', 'i'], ['n', 't'], ['s', 'i'], ['s', 't'], ['i', 't']];
const G2: Record<string, [number, number]> = { n1: [40, 40], n2: [130, 40], s: [60, 150], i: [200, 150], t: [200, 40] };
const E2 = [['s', 'i'], ['s', 't'], ['i', 't'], ['n2', 's'], ['n2', 'i']];
const REG: Record<string, string> = { s: 'a1', i: 'a2', t: 'a0', n2: 'a0', n1: 'a0' };
const FILL: Record<string, string> = { a0: 'f1', a1: 'f2', a2: 'f3' };

type S = { g: 1 | 2; coloured: boolean; hot: string | null; lines: string[]; note: string };
const STATES: S[] = [
  { g: 1, coloured: false, hot: null, lines: ['k = 3: a0, a1, a2', 'every degree is 3: stuck'], note: 'After coalescing, sumsq has four values, n, s, i and t, all interfering. With three registers, simplify is stuck at once, and even optimism cannot help: four values alive at once need four registers. One must live in memory.' },
  { g: 1, coloured: false, hot: 'n', lines: ['        cost  ÷ degree', 'n        11      3.7', 's        22      7.3', 'i        41     13.7', 't   too short to help'], note: 'Which one? Count the loads and stores spilling would add, each weighted by 10 for being inside the loop, and divide by the degree, the number of values it is in the way of. n is cheapest: one store on entry and one load per trip. Spilling t would not help: it lives for one instruction anyway.' },
  { g: 2, coloured: false, hot: null, lines: ['mv   n1, a0', 'sd   n1, 8(sp)', 'loop: ld n2, 8(sp)', '      bge i, n2, done'], note: 'Spill n: store it to the stack slot 8(sp) right after it arrives, and load it into a fresh name just before the one instruction that reads it. n is gone; in its place are two values, n1 and n2, each alive for a single instruction.' },
  { g: 2, coloured: false, hot: 'n2', lines: ['n2 is live only from its', 'ld to the bge: it touches', 's and i, but never t'], note: 'Rebuild the graph. n1 interferes with nothing (nothing else is alive yet), and n2 only with s and i. Now no value has three neighbours that all need different registers.' },
  { g: 2, coloured: true, hot: null, lines: ['s → a1, i → a2', 't, n1, n2 → a0'], note: 'Simplify and select now succeed with three registers. t, n1 and n2 share a0, because they are never alive at the same moment: the price of the third register is one load per trip round the loop.' },
];

export default function SpillSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const pos = st.g === 1 ? G1 : G2;
  const edges = st.g === 1 ? E1 : E2;
  return (
    <StepFrame title="Spilling one value to fit in three registers" steps={s} note={st.note}>
      <Svg w={400} h={196} title="The interference graph before and after spilling n, with spill costs and the rewritten code.">
        {edges.map(([p, q]) => <line key={p + q} x1={pos[p][0]} y1={pos[p][1]} x2={pos[q][0]} y2={pos[q][1]} stroke={tok('ink', 0.55)} strokeWidth={1.5} />)}
        {Object.entries(pos).map(([v, [x, y]]) => {
          const r = st.coloured ? REG[v] : null;
          const hot = st.hot === v;
          return (
            <g key={v}>
              <circle cx={x} cy={y} r={18} fill={r ? tok(FILL[r], 0.35) : hot ? tok('warn', 0.25) : tok('panel')} stroke={r ? tok(FILL[r]) : hot ? tok('warn') : tok('ink', 0.6)} strokeWidth={hot || r ? 2.5 : 1.5} />
              <T x={x} y={y + 1} size={13} mono anchor="middle" weight={700}>{v}</T>
              {r && <T x={x} y={y + 30} size={11.5} mono anchor="middle" weight={700}>{r}</T>}
            </g>
          );
        })}
        {st.lines.map((l, k) => <T key={k} x={238} y={30 + k * 20} size={11.5} mono>{l}</T>)}
      </Svg>
    </StepFrame>
  );
}
