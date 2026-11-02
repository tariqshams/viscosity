import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const BEFORE = `for (let i = 0; i < 3; i = i + 1)
  print i;`;

const AFTER = `{
  let i = 0;
  while (i < 3) {
    print i;
    i = i + 1;
  }
}`;

/** A tree node: where it sits, what it says, and what kind of piece it is. */
type N = { id: string; label: string; x: number; y: number; w: number; part?: boolean };
const NODES: Record<string, N> = {
  init: { id: 'init', label: 'let i = 0;', x: 70, y: 96, w: 96, part: true },
  cond: { id: 'cond', label: 'i < 3', x: 196, y: 156, w: 66, part: true },
  body: { id: 'body', label: 'print i;', x: 262, y: 216, w: 76, part: true },
  incr: { id: 'incr', label: 'i = i + 1;', x: 350, y: 216, w: 88, part: true },
  inner: { id: 'inner', label: 'block', x: 306, y: 156, w: 60 },
  loop: { id: 'loop', label: 'while', x: 252, y: 96, w: 60 },
  outer: { id: 'outer', label: 'block', x: 160, y: 36, w: 60 },
};
const EDGES: [string, string][] = [
  ['inner', 'body'], ['inner', 'incr'],
  ['loop', 'cond'], ['loop', 'inner'],
  ['outer', 'init'], ['outer', 'loop'],
];

type S = { code: string; show: string[]; fresh: string[]; note: string };

const parts = ['init', 'cond', 'body', 'incr'];
const STATES: S[] = [
  { code: BEFORE, show: parts, fresh: parts, note: 'The parser has read the four parts of the for loop: an initializer, a condition, an increment and a body. The AST has no "for" node kind to put them in.' },
  { code: BEFORE, show: [...parts, 'inner'], fresh: ['inner'], note: 'Step 1: the body and the increment become one block, body first. Running this block once is exactly one trip round the loop.' },
  { code: BEFORE, show: [...parts, 'inner', 'loop'], fresh: ['loop'], note: 'Step 2: wrap that block in a while node with the condition. "Check i < 3, then do one trip" repeated: that is the loop.' },
  { code: BEFORE, show: [...parts, 'inner', 'loop', 'outer'], fresh: ['outer'], note: 'Step 3: put the initializer and the while into an outer block. The initializer runs once, first, and the block keeps i local to the loop.' },
  { code: AFTER, show: [...parts, 'inner', 'loop', 'outer'], fresh: [], note: 'Done. This tree is exactly what you would get by parsing the code above, written by hand. The interpreter only ever sees block and while.' },
];

export default function DesugarSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const shown = new Set(st.show);
  const H = 28;
  return (
    <StepFrame title="Turning a for loop into a while loop" steps={s} note={st.note}>
      <CodeTrace code={st.code} line={null} />
      <Svg w={400} h={240} title="The syntax tree the parser builds for a for loop: blocks and a while node around the four parts">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>THE TREE THE PARSER RETURNS</T>
        {EDGES.filter(([a, b]) => shown.has(a) && shown.has(b)).map(([a, b]) => (
          <line key={a + b} x1={NODES[a].x} y1={NODES[a].y + H / 2} x2={NODES[b].x} y2={NODES[b].y - H / 2} stroke={tok('ink', 0.45)} strokeWidth={1.5} />
        ))}
        {st.show.map((id) => {
          const n = NODES[id];
          const fresh = st.fresh.includes(id);
          return (
            <Box key={id} x={n.x - n.w / 2} y={n.y - H / 2} w={n.w} h={H}
              fill={fresh ? tok('brand', 0.16) : n.part ? tok('panel') : tok('accent', 0.1)}
              stroke={fresh ? tok('brand') : n.part ? tok('ink', 0.4) : tok('accent')}>
              <T x={n.x} y={n.y} size={12} mono anchor="middle" weight={n.part ? 400 : 700}>{n.label}</T>
            </Box>
          );
        })}
      </Svg>
    </StepFrame>
  );
}
