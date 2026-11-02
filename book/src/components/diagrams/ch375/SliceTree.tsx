import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// The decision tree rustc 1.97 builds for the chapter's shape() match
// (read off its MIR, -O): the length is read once and branched on, and
// only the >= 2 branch compares elements (the guard f == l).

type Node = 'root' | 'empty' | 'one' | 'guard' | 'ring' | 'then';
type S = { input: string; path: Node[]; out?: string; note: string };

const STATES: S[] = [
  { input: '', path: [], note: 'The four arms [], [x], [f, .., l] if f == l and [f, rest @ ..] become one tree. MIR reads the slice length once (PtrMetadata) and switches on it before looking at any element.' },
  { input: '[]', path: ['root', 'empty'], out: '"empty"', note: 'Length 0: the first switch sends it straight to the [] arm. No element is read, which is just as well, since there are none.' },
  { input: '[7]', path: ['root', 'one'], out: '"one 7"', note: 'Length 1: the second switch picks the [x] arm. x is bound to a reference to element 0.' },
  { input: '[3, 1, 3]', path: ['root', 'guard', 'ring'], out: '"ring 3"', note: 'Length 3 is at least 2, so f and l are bound to elements 0 and len-1 and the guard runs: 3 == 3, so the ring arm wins.' },
  { input: '[1, 2, 3]', path: ['root', 'guard', 'then'], out: '"1 then 2"', note: 'Same branch, but the guard says 1 != 3, so matching falls through to [f, rest @ ..]. No length test is repeated: the tree already knows the length is at least 2.' },
];

const POS: Record<Node, { x: number; y: number; w: number; label: string }> = {
  root: { x: 140, y: 30, w: 120, label: 'len(xs) ?' },
  empty: { x: 8, y: 100, w: 82, label: '"empty"' },
  one: { x: 100, y: 100, w: 82, label: '"one x"' },
  guard: { x: 214, y: 100, w: 178, label: 'xs[0] == xs[len-1] ?' },
  ring: { x: 200, y: 168, w: 90, label: '"ring f"' },
  then: { x: 300, y: 168, w: 92, label: '"f then k"' },
};

const EDGES: [Node, Node, string][] = [
  ['root', 'empty', '0'], ['root', 'one', '1'], ['root', 'guard', '≥ 2'],
  ['guard', 'ring', 'yes'], ['guard', 'then', 'no'],
];

export default function SliceTree() {
  const s = useSteps(STATES);
  const st = s.state;
  const on = (n: Node) => st.path.includes(n);
  const H = 28;
  return (
    <StepFrame title="A slice match as a decision tree" steps={s} note={st.note}>
      <Svg w={400} h={210} title="Decision tree: test the length, then for two or more elements compare the first and last">
        {st.input && <T x={8} y={14} size={12} mono weight={700}>xs = {st.input}</T>}
        {st.out && <T x={392} y={14} size={12} mono weight={700} anchor="end" fill={tok('safe')}>{st.out}</T>}
        {EDGES.map(([a, b, lab]) => {
          const p = POS[a], q = POS[b];
          const x1 = p.x + p.w / 2, y1 = p.y + H, x2 = q.x + q.w / 2, y2 = q.y;
          const hot = on(a) && on(b);
          return (
            <g key={a + b}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={hot ? tok('brand') : tok('line')} strokeWidth={hot ? 3 : 1.5} />
              <T x={(x1 + x2) / 2 + 6} y={(y1 + y2) / 2} size={11} mono fill={hot ? tok('brand') : tok('muted')}>{lab}</T>
            </g>
          );
        })}
        {(Object.keys(POS) as Node[]).map((n) => {
          const p = POS[n];
          const leaf = n !== 'root' && n !== 'guard';
          return (
            <Box key={n} x={p.x} y={p.y} w={p.w} h={H} r={leaf ? 3 : 8}
              fill={on(n) ? tok('brand', 0.16) : tok('panel')} stroke={on(n) ? tok('brand') : tok('line')}>
              <T x={p.x + p.w / 2} y={p.y + H / 2} size={leaf ? 12 : 11} mono anchor="middle" weight={on(n) ? 700 : 400}>{p.label}</T>
            </Box>
          );
        })}
      </Svg>
    </StepFrame>
  );
}
