// Renaming a small if/else program into SSA, one assignment at
// a time, until the join needs a phi to choose between two versions of x.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

type S = {
  /** the lines shown in blocks B0..B3 */
  b: [string[], string[], string[], string[]];
  /** [block, line] being explained */
  hot?: [number, number];
  /** the latest version of x after this step */
  ver: string;
  /** the edge taken at run time, if shown */
  taken?: 'left' | 'right';
  note: string;
};

const ORIG: S['b'] = [
  ['x = a + 1', 'if (x > 5)'],
  ['x = x * 2'],
  ['x = 0'],
  ['y = x + 3'],
];

const STATES: S[] = [
  { b: ORIG, ver: '—', note: 'The program as a CFG. One name, x, is assigned in three places. At the bottom, y = x + 3 could be reading any of them, depending on the path taken.' },
  { b: [['x1 = a0 + 1', 'if (x > 5)'], ORIG[1], ORIG[2], ORIG[3]], hot: [0, 0], ver: 'x1', note: 'Walk the blocks in order. The first assignment to x gets a new name, x1. The a was never assigned here (it is an input), so it gets version 0.' },
  { b: [['x1 = a0 + 1', 'if (x1 > 5)'], ORIG[1], ORIG[2], ORIG[3]], hot: [0, 1], ver: 'x1', note: 'A use takes the latest version on its path. The test reads x1. Nothing ambiguous yet: straight-line code only ever has one latest version.' },
  { b: [['x1 = a0 + 1', 'if (x1 > 5)'], ['x2 = x1 * 2'], ORIG[2], ORIG[3]], hot: [1, 0], ver: 'x2 (left)', note: 'In the left block, read before you write: the right-hand side uses x1, then the assignment makes a brand-new x2. x1 is never overwritten.' },
  { b: [['x1 = a0 + 1', 'if (x1 > 5)'], ['x2 = x1 * 2'], ['x3 = 0'], ORIG[3]], hot: [2, 0], ver: 'x3 (right)', note: 'The right block comes straight from B0, so it starts from x1, not x2. Its assignment makes x3. Now two different versions of x are alive, one on each side.' },
  { b: [['x1 = a0 + 1', 'if (x1 > 5)'], ['x2 = x1 * 2'], ['x3 = 0'], ['x4 = φ(x2, x3)', 'y = x + 3']], hot: [3, 0], ver: 'x4', note: 'The join has two predecessors that disagree: x2 from the left, x3 from the right. So B3 begins with a phi: a new version x4, with one operand per incoming edge.' },
  { b: [['x1 = a0 + 1', 'if (x1 > 5)'], ['x2 = x1 * 2'], ['x3 = 0'], ['x4 = φ(x2, x3)', 'y1 = x4 + 3']], hot: [3, 1], ver: 'x4', note: 'Now y reads exactly one name, x4. Every name is assigned exactly once in the text, and every use points at exactly one definition.' },
  { b: [['x1 = a0 + 1', 'if (x1 > 5)'], ['x2 = x1 * 2'], ['x3 = 0'], ['x4 = φ(x2, x3)', 'y1 = x4 + 3']], hot: [3, 0], ver: 'x4 = x2', taken: 'left', note: 'At run time, say a0 is 9. Then x1 is 10, the test is true, control takes the left edge, and the phi picks its first operand: x4 = x2 = 20, so y1 = 23.' },
];

const LH = 17;
const POS = [
  { x: 100, y: 6, w: 200 },
  { x: 6, y: 92, w: 168 },
  { x: 226, y: 92, w: 168 },
  { x: 100, y: 160, w: 200 },
];
const NAMES = ['B0', 'B1', 'B2', 'B3'];

export default function RenameSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const h = (k: number) => 22 + st.b[k].length * LH;
  const hotEdge = (side: 'left' | 'right') => (st.taken === side ? tok('brand') : tok('ink', st.taken ? 0.25 : 0.7));
  return (
    <StepFrame title="Renaming into SSA" steps={s} note={st.note}>
      <Svg w={400} h={236} title="A control-flow graph of four blocks. B0 at the top branches to B1 on the left and B2 on the right, and both lead to B3 at the bottom. Each step renames one assignment or use into its SSA version.">
        <Arrow x1={150} y1={6 + h(0)} x2={90} y2={90} color={hotEdge('left')} />
        <Arrow x1={250} y1={6 + h(0)} x2={310} y2={90} color={hotEdge('right')} />
        <Arrow x1={90} y1={92 + h(1)} x2={150} y2={158} color={hotEdge('left')} />
        <Arrow x1={310} y1={92 + h(2)} x2={250} y2={158} color={hotEdge('right')} />
        {POS.map((p, k) => (
          <Box key={k} x={p.x} y={p.y} w={p.w} h={h(k)} fill={st.hot?.[0] === k ? tok('brand', 0.08) : tok('panel')} stroke={st.hot?.[0] === k ? tok('brand') : tok('line')}>
            <T x={p.x + 8} y={p.y + 11} size={11} weight={700} fill={tok('muted')}>{NAMES[k]}</T>
            {st.b[k].map((line, j) => (
              <T key={j} x={p.x + 10} y={p.y + 28 + j * LH} size={12.5} mono weight={st.hot?.[0] === k && st.hot[1] === j ? 700 : 400} fill={line.includes('φ') ? tok('accent') : undefined}>
                {line}
              </T>
            ))}
          </Box>
        ))}
        <T x={6} y={226} size={11} weight={700} fill={tok('muted')}>LATEST x</T>
        <T x={70} y={226} size={12.5} mono>{st.ver}</T>
      </Svg>
    </StepFrame>
  );
}
