import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 300: compiling a three-arm match on a pair of Options into a
// decision tree, one column test at a time. The rows are the chapter's
// example; "spec" is specialisation (keep the rows that fit, open up the
// constructor).
type Node = { x: number; y: number; label: string; kind: 'test' | 'leaf' };
type S = { rows: string[]; hi?: number[]; title: string; nodes: number; note: string };

const NODES: Node[] = [
  { x: 200, y: 122, label: 'test a', kind: 'test' },
  { x: 110, y: 168, label: 'test b', kind: 'test' },
  { x: 300, y: 168, label: 'arm 2', kind: 'leaf' },
  { x: 60, y: 214, label: 'arm 1', kind: 'leaf' },
  { x: 160, y: 214, label: 'arm 3', kind: 'leaf' },
];
const EDGES: [number, number, string][] = [
  [0, 1, 'Some'], [0, 2, 'None'], [1, 3, 'Some'], [1, 4, 'None'],
];

const ALL = ['1: (Some(x), Some(y))', '2: (None, _)', '3: (_, None)'];
const STATES: S[] = [
  { rows: ALL, title: 'the match, as rows', nodes: 0, note: 'Three arms, read as rows of patterns over the two columns a and b. Trying them one by one would test a up to three times. We will build a tree that tests each column once.' },
  { rows: ALL, hi: [0, 1], title: 'pick column a', nodes: 1, note: 'Row 1 does not start with _, so a has to be tested. Its type, Option, has two constructors, Some and None, so the test has two branches.' },
  { rows: ['1: (x, Some(y))', '3: (_, None)'], title: 'spec(rows, Some)', nodes: 2, note: 'For the Some branch, keep the rows that can match a Some: row 1 (its pattern is Some) and row 3 (its _ matches anything). Row 2 needs None, so it is dropped here.' },
  { rows: ['1: (x, Some(y))', '3: (_, None)'], hi: [0, 1], title: 'test b', nodes: 4, note: 'The value inside the Some is matched by a variable in both rows, so nothing tests it. Column b is next: Some leads to arm 1, None to arm 3.' },
  { rows: ['2: (_)', '3: (None)'], title: 'spec(rows, None)', nodes: 5, note: 'For the None branch, rows 2 and 3 survive. Row 2 is now all wildcards, so it wins at once: arm 2. Row 3 is never tested here, since the first matching arm always wins.' },
  { rows: [], title: 'the finished tree', nodes: 5, note: 'Done. Every path tests a once and b at most once, and every leaf names an arm, so no value falls through: the match is exhaustive.' },
];

export default function MatchSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Compiling a match into a decision tree" steps={s} note={st.note}>
      <Svg w={400} h={236} title="A matrix of pattern rows above, and the decision tree being built from it below">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>ROWS: {st.title}</T>
        {st.rows.length === 0 && <T x={8} y={40} size={12} fill={tok('muted')}>(nothing left to compile)</T>}
        {st.rows.map((r, k) => (
          <Box key={k} x={8} y={22 + k * 26} w={230} h={22} fill={st.hi?.includes(k) ? tok('brand', 0.15) : tok('panel')} stroke={st.hi?.includes(k) ? tok('brand') : tok('line')}>
            <T x={16} y={33 + k * 26} size={12} mono>{r}</T>
          </Box>
        ))}
        {EDGES.filter(([, b]) => b < st.nodes).map(([a, b, lab]) => (
          <g key={`${a}-${b}`}>
            <Arrow x1={NODES[a].x} y1={NODES[a].y + 12} x2={NODES[b].x} y2={NODES[b].y - 12} color={tok('ink', 0.5)} />
            <T x={(NODES[a].x + NODES[b].x) / 2 + (NODES[b].x < NODES[a].x ? -8 : 8)} y={(NODES[a].y + NODES[b].y) / 2} size={11} mono anchor={NODES[b].x < NODES[a].x ? 'end' : 'start'} fill={tok('muted')}>{lab}</T>
          </g>
        ))}
        {NODES.slice(0, st.nodes).map((n, k) => (
          <Box key={k} x={n.x - 38} y={n.y - 12} w={76} h={24} fill={n.kind === 'leaf' ? tok('safe', 0.15) : tok('brand', 0.12)} stroke={n.kind === 'leaf' ? tok('safe') : tok('brand')}>
            <T x={n.x} y={n.y} size={12} mono anchor="middle">{n.label}</T>
          </Box>
        ))}
      </Svg>
    </StepFrame>
  );
}
