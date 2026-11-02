// Chapter 131: finding leaders in linear three-address code, cutting it
// into basic blocks, and joining the blocks into a control-flow graph.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const CODE = [
  't1 = n > 1',
  'ifnot t1 goto 9',
  't2 = n % 2',
  'ifnot t2 goto 7',
  't3 = 3 * n',
  'n = t3 + 1',
  'goto 0',
  'n = n / 2',
  'goto 0',
  'return n',
];
const BLOCK_OF = [0, 0, 1, 1, 2, 2, 2, 3, 3, 4];
const BCOL = ['f1', 'f2', 'f3', 'f4', 'f5'];

// CFG on the right
const NODES = [
  { x: 300, y: 30 }, { x: 300, y: 95 }, { x: 240, y: 160 }, { x: 360, y: 160 }, { x: 372, y: 30 },
];
// [x1, y1, x2, y2, bend, back?]
const EDGES: [number, number, number, number, number, boolean][] = [
  [300, 43, 300, 82, 0, false],
  [322, 30, 350, 30, 0, false],
  [292, 108, 248, 147, 0, false],
  [308, 108, 352, 147, 0, false],
  [225, 147, 278, 30, -1, true],
  [375, 147, 322, 34, 1, true],
];

type S = { first?: boolean; targets?: boolean; after?: boolean; cut?: boolean; edges?: number; back?: boolean; hot?: number[]; note: string };

const STATES: S[] = [
  { note: 'The Collatz loop as flat three-address code, with numbered lines and jumps. ifnot t goto k jumps to line k when t is false. Where can control arrive from? Hard to say by reading top to bottom.' },
  { first: true, hot: [0], note: 'Rule 1: the first instruction is a leader. Leaders are the instructions that start a basic block.' },
  { first: true, targets: true, hot: [9, 7, 0], note: 'Rule 2: every jump target is a leader. Lines 1, 3, 6 and 8 jump to 9, 7, 0 and 0. Control can arrive at those lines from somewhere other than the line above.' },
  { first: true, targets: true, after: true, hot: [2, 4, 7, 9], note: 'Rule 3: every instruction right after a jump is a leader. A jump may leave, so the next line is a fresh start. The leaders are 0, 2, 4, 7 and 9.' },
  { first: true, targets: true, after: true, cut: true, note: 'Cut before each leader. Each block runs from a leader up to the next one: B0 is lines 0–1, B1 lines 2–3, B2 lines 4–6, B3 lines 7–8, B4 line 9. Once a block starts, all of it runs.' },
  { cut: true, edges: 4, note: 'Now the edges. A block’s last instruction says where control can go next: B0 either falls through to B1 or jumps to B4; B1 falls through to B2 or jumps to B3.' },
  { cut: true, edges: 6, back: true, note: 'B2 and B3 both end with goto 0, so they have edges back to B0. Those two edges are the loop. In the flat list a loop was a jump backwards; in the graph it is a cycle you can see.' },
];

export default function LeaderSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const isLeader = (k: number) =>
    (st.first && k === 0) || (st.targets && [9, 7, 0].includes(k)) || (st.after && [2, 4, 7, 9].includes(k));
  return (
    <StepFrame title="From a flat list to a graph" steps={s} note={st.note}>
      <Svg w={400} h={236} title="Ten lines of code with jumps, cut at leaders 0, 2, 4, 7 and 9 into five basic blocks, which become a graph: B0 to B1 and B4, B1 to B2 and B3, B2 and B3 back to B0.">
        {CODE.map((l, k) => {
          const y = 14 + k * 22;
          const b = BLOCK_OF[k];
          const hot = st.hot?.includes(k);
          return (
            <g key={k}>
              {st.cut && <rect x={22} y={y - 10} width={170} height={21} fill={tok(BCOL[b], 0.16)} />}
              {hot && <rect x={22} y={y - 10} width={170} height={21} fill={tok('brand', 0.25)} />}
              <T x={16} y={y} size={10} mono anchor="end" fill={tok('muted')}>{k}</T>
              <T x={28} y={y} size={11.5} mono>{l}</T>
              {isLeader(k) && !st.cut && <T x={196} y={y} size={10} weight={700} fill={tok('brand')}>◀ leader</T>}
              {st.cut && k > 0 && BLOCK_OF[k] !== BLOCK_OF[k - 1] && <line x1={4} x2={196} y1={y - 11} y2={y - 11} stroke={tok('ink', 0.7)} strokeWidth={2} />}
              {st.cut && (k === 0 || BLOCK_OF[k] !== BLOCK_OF[k - 1]) && <T x={186} y={y} size={10} weight={700} anchor="end" fill={tok(BCOL[b])}>{`B${b}`}</T>}
            </g>
          );
        })}
        {st.edges !== undefined && (
          <g>
            {EDGES.slice(0, st.edges).map(([x1, y1, x2, y2, bend, back], k) => (
              <Arrow key={k} x1={x1} y1={y1} x2={x2} y2={y2} bend={bend} color={back && st.back ? tok('brand') : undefined} />
            ))}
            {NODES.map((n, k) => (
              <Box key={k} x={n.x - 22} y={n.y - 13} w={44} h={26} r={4} fill={tok(BCOL[k], 0.2)} stroke={tok(BCOL[k])}>
                <T x={n.x} y={n.y} size={12} weight={700} anchor="middle">{`B${k}`}</T>
              </Box>
            ))}
          </g>
        )}
      </Svg>
    </StepFrame>
  );
}
