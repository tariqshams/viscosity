import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const CODE = `function count(node) {
  let total = 1;
  for (const c of node.children) {
    total = total + count(c);
  }
  return total;
}
count(docs);`;

type Name = 'docs' | 'a.txt' | 'pics' | 'cat.png';
type F = { name: Name; total: number; doing: string };
type S = { line: number; frames: F[]; done: Name[]; out?: number; note: string };

const NODES: { name: Name; x: number; y: number }[] = [
  { name: 'docs', x: 100, y: 30 },
  { name: 'a.txt', x: 46, y: 88 },
  { name: 'pics', x: 154, y: 88 },
  { name: 'cat.png', x: 154, y: 146 },
];
const EDGES: [number, number][] = [[0, 1], [0, 2], [2, 3]];

const STATES: S[] = [
  { line: 7, frames: [], done: [], note: 'The tree has four nodes: docs holds a.txt and pics, and pics holds cat.png. We ask count for the whole tree, starting at the root.' },
  { line: 1, frames: [{ name: 'docs', total: 1, doing: 'total = 1' }], done: [], note: 'A frame for docs. total starts at 1, to count docs itself. Now the loop visits its children, one at a time.' },
  { line: 1, frames: [{ name: 'docs', total: 1, doing: 'waiting' }, { name: 'a.txt', total: 1, doing: 'total = 1' }], done: [], note: 'First child: a.txt. count(a.txt) gets its own frame with its own total, and docs waits.' },
  { line: 5, frames: [{ name: 'docs', total: 1, doing: 'waiting' }, { name: 'a.txt', total: 1, doing: 'return 1' }], done: [], note: 'a.txt has no children, so its loop runs zero times and it returns 1. A leaf is the base case, hidden inside the loop.' },
  { line: 1, frames: [{ name: 'docs', total: 2, doing: 'waiting' }, { name: 'pics', total: 1, doing: 'total = 1' }], done: ['a.txt'], note: 'Back in docs: total = 1 + 1 = 2. Next child: pics, which gets a new frame.' },
  { line: 1, frames: [{ name: 'docs', total: 2, doing: 'waiting' }, { name: 'pics', total: 1, doing: 'waiting' }, { name: 'cat.png', total: 1, doing: 'total = 1' }], done: ['a.txt'], note: 'pics has a child too, so the stack grows again: a third frame, for cat.png. The stack is as deep as the tree.' },
  { line: 5, frames: [{ name: 'docs', total: 2, doing: 'waiting' }, { name: 'pics', total: 2, doing: 'return 2' }], done: ['a.txt', 'cat.png'], note: 'cat.png is a leaf and returns 1. pics adds it: 1 + 1 = 2, and with no more children, returns 2.' },
  { line: 5, frames: [{ name: 'docs', total: 4, doing: 'return 4' }], done: ['a.txt', 'cat.png', 'pics'], note: 'docs adds what pics returned: 2 + 2 = 4. Its loop is finished, so it returns 4.' },
  { line: 7, frames: [], done: ['a.txt', 'cat.png', 'pics', 'docs'], out: 4, note: 'count(docs) is 4: every node counted once. The same few lines would count a tree of any size and any depth.' },
];

export default function CountSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const top = st.frames[st.frames.length - 1]?.name;
  return (
    <StepFrame title="Counting the nodes of a tree" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={190} title="The tree docs, a.txt, pics and cat.png on the left, with the node being counted highlighted, and the call stack of count frames on the right">
        <T x={6} y={10} size={11} weight={700} fill={tok('muted')}>THE TREE</T>
        {EDGES.map(([a, b]) => (
          <line key={`${a}-${b}`} x1={NODES[a].x} y1={NODES[a].y + 13} x2={NODES[b].x} y2={NODES[b].y - 13} stroke={tok('ink', 0.45)} strokeWidth={2} />
        ))}
        {NODES.map((n) => {
          const hot = n.name === top;
          const done = st.done.includes(n.name);
          return (
            <Box key={n.name} x={n.x - 38} y={n.y - 13} w={76} h={26} fill={hot ? tok('brand', 0.18) : done ? tok('safe', 0.12) : tok('panel')} stroke={hot ? tok('brand') : done ? tok('safe') : tok('ink', 0.45)}>
              <T x={n.x} y={n.y} size={12} mono weight={700} anchor="middle">{n.name}</T>
            </Box>
          );
        })}
        <T x={214} y={10} size={11} weight={700} fill={tok('muted')}>THE CALL STACK</T>
        {st.frames.length === 0 && <T x={214} y={170} size={12} fill={tok('muted')}>{st.out === undefined ? 'no count call yet' : 'all frames popped'}</T>}
        {st.frames.map((f, k) => {
          const y = 158 - k * 32;
          const isTop = k === st.frames.length - 1;
          return (
            <Box key={k} x={214} y={y} w={180} h={26} fill={isTop ? tok('brand', 0.14) : tok('panel')} stroke={isTop ? tok('brand') : tok('ink', 0.4)}>
              <T x={222} y={y + 13} size={12} mono weight={700}>{f.name}</T>
              <T x={386} y={y + 13} size={11} mono anchor="end" fill={isTop ? tok('ink') : tok('muted')}>{f.doing}</T>
            </Box>
          );
        })}
        {st.out !== undefined && <T x={214} y={40} size={13} mono weight={700} fill={tok('brand')}>count(docs) → {st.out}</T>}
      </Svg>
    </StepFrame>
  );
}
