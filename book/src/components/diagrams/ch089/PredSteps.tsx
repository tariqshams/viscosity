// Building the Collatz CFG the way Viscosity's FunctionBuilder does: each
// time a block gets its terminator, terminate() pushes that block onto the
// preds list of every successor. The order follows the lowering of
//   function g(n) {
//     while (n > 1) { if (n % 2) n = 3 * n + 1; else n = n / 2; }
//     return n;
//   }
import { StepFrame, useSteps } from '../../viz/stepper';
import { Svg, T, tok } from '../../viz/svg';
import { BLOCKS, BlockBox, Edge } from '../ch089/collatz';

type St = { term: number | null; edges: [number, number][]; text: string; note: string };

const ORDER: [number, number[], string][] = [
  [0, [1], 'br b1'],
  [1, [2, 4], 'condbr %3, b2, b4'],
  [2, [5, 6], 'condbr %5, b5, b6'],
  [5, [7], 'br b7'],
  [6, [7], 'br b7'],
  [7, [3], 'br b3'],
  [3, [1], 'br b1'],
  [4, [], 'return %1'],
];

const NOTES = [
  'b0, the entry, ends with br b1. terminate() records the edge by pushing 0 onto b1’s preds.',
  'The loop test ends with condbr: two successors, so b1 is pushed onto the preds of both b2 (the body) and b4 (the exit).',
  'The parity test also has two successors, the two branches b5 and b6.',
  'The odd branch jumps to the join block b7, which now has one predecessor.',
  'The even branch jumps there too. b7 has two predecessors: it is where the two paths meet.',
  'The join jumps to b3, the block that holds whatever runs at the end of each pass of the loop.',
  'b3 jumps back to the loop test: the back edge. b1 now has two predecessors too, the entry and b3, and the graph has a cycle.',
  'b4 returns, so it has no successors and adds nothing. Every block now knows where control can come from.',
];

const STATES: St[] = [
  { term: null, edges: [], text: '', note: 'Lowering made eight blocks. None has a terminator yet, so there are no edges and every preds list is empty.' },
  ...ORDER.map(([b, ss, text], k) => ({
    term: b,
    edges: ORDER.slice(0, k + 1).flatMap(([f, ts]) => ts.map((t) => [f, t] as [number, number])),
    text,
    note: NOTES[k],
  })),
];

export default function PredSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const preds: Record<number, number[]> = {};
  for (const b of BLOCKS) preds[b.id] = [];
  for (const [f, t] of st.edges) preds[t].push(f);
  const row = (ids: number[]) => ids.map((b) => `b${b}: [${preds[b].join(',')}]`).join('  ');
  return (
    <StepFrame title="terminate() fills in the predecessors" steps={s} note={st.note}>
      <Svg w={400} h={420} title="The Collatz CFG being built edge by edge, with each block's list of predecessors underneath.">
        {st.edges.map(([f, t]) => (
          <Edge key={`${f}-${t}`} from={f} to={t} color={f === st.term ? tok('brand') : undefined} width={f === st.term ? 3 : 2} />
        ))}
        {BLOCKS.map((b) => (
          <BlockBox key={b.id} id={b.id}
            fill={b.id === st.term ? tok('brand', 0.22) : undefined}
            stroke={b.id === st.term ? tok('brand') : undefined} />
        ))}
        <T x={8} y={372} size={12} mono fill={tok('brand')}>{st.term === null ? 'no terminators yet' : `b${st.term}: ${st.text}`}</T>
        <T x={8} y={392} size={11} mono>{row([0, 1, 2, 3])}</T>
        <T x={8} y={410} size={11} mono>{row([4, 5, 6, 7])}</T>
      </Svg>
    </StepFrame>
  );
}
