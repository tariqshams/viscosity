// Chapter 84: tri-colour marking spreads from the roots over a small object
// graph, then sweep unlinks the objects left white. Follows Heap.collect in
// companion/ts/src/vm/heap.ts: markRoots, a grey stack, blacken, the weak
// string table, then sweep over the object list.
import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const CODE = `// 1. Mark the roots.
this.vm?.markRoots(this.markValue);
// 2. Trace: turn grey objects black
//    until none are left.
while (this.gray.length)
  this.blacken(this.gray.pop()!);
// 3. The string table holds strings weakly.
this.strings.removeWhite();
// 4. Sweep: unlink and poison everything
//    left white.`;

type Colour = 'white' | 'grey' | 'black' | 'freed';
type Id = 'A' | 'B' | 'C' | 'F' | 'D' | 'E';

const NODES: Record<Id, { x: number; y: number; kind: string }> = {
  A: { x: 150, y: 52, kind: 'instance' },
  B: { x: 262, y: 52, kind: 'list' },
  C: { x: 150, y: 134, kind: 'closure' },
  F: { x: 262, y: 134, kind: 'function' },
  D: { x: 360, y: 52, kind: 'instance' },
  E: { x: 360, y: 134, kind: 'instance' },
};
const EDGES: [Id, Id, number][] = [['A', 'B', 0], ['B', 'C', 0], ['C', 'F', 0], ['D', 'E', 0.5], ['E', 'D', 0.5]];
const ORDER: Id[] = ['E', 'D', 'F', 'C', 'B', 'A']; // newest first, as allocate() links them

type S = { line: number | null; c: Record<Id, Colour>; gray: Id[]; hot?: Id; note: string };

const all = (c: Colour): Record<Id, Colour> => ({ A: c, B: c, C: c, F: c, D: c, E: c });
const STATES: S[] = [
  { line: null, c: all('white'), gray: [], note: 'Before a collection every object is white: isMarked is false. The object list (bottom) links all six, newest first.' },
  { line: 1, c: { ...all('white'), A: 'grey', C: 'grey' }, gray: ['A', 'C'], note: 'Mark the roots. A global refers to the instance A, and a stack slot holds the closure C. Marking sets isMarked and pushes each onto the grey stack: reached, but not yet traced.' },
  { line: 5, c: { ...all('white'), A: 'grey', C: 'black', F: 'grey' }, gray: ['A', 'F'], hot: 'C', note: 'Pop C and blacken it: mark everything C refers to. Its function F turns grey. C is now black: reached and fully traced.' },
  { line: 5, c: { ...all('white'), A: 'grey', C: 'black', F: 'black' }, gray: ['A'], hot: 'F', note: 'Pop F. Blackening a function marks its name and constants. Here they are strings, left out of the picture to keep it small.' },
  { line: 5, c: { ...all('white'), A: 'black', B: 'grey', C: 'black', F: 'black' }, gray: ['B'], hot: 'A', note: 'Pop A. Blackening an instance marks its class and its fields; one field holds the list B, which turns grey.' },
  { line: 5, c: { ...all('white'), A: 'black', B: 'black', C: 'black', F: 'black' }, gray: [], hot: 'B', note: 'Pop B. Blackening a list marks every item in it. One item is C, but C is already marked, so markObject returns at once: nothing is traced twice, and a cycle cannot loop forever.' },
  { line: 7, c: { ...all('white'), A: 'black', B: 'black', C: 'black', F: 'black' }, gray: [], note: 'The grey stack is empty: marking is done. D and E point at each other, but nothing reachable points at them, so they are still white. The string table now drops its white strings.' },
  { line: 8, c: { A: 'white', B: 'white', C: 'white', F: 'white', D: 'freed', E: 'freed' }, gray: [], note: 'Sweep walks the object list. White objects are unlinked (freed); black ones are kept and reset to white, ready for the next collection.' },
];

export default function GcSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  // White, grey and black are the algorithm's names, so they are drawn as
  // those colours in both themes (a freed object keeps the panel colour).
  const fill = (c: Colour) => (c === 'black' ? '#1c1917' : c === 'grey' ? '#a8a29e' : c === 'white' ? '#fafaf9' : tok('panel'));
  const text = (c: Colour) => (c === 'black' ? '#fafaf9' : c === 'freed' ? tok('ink') : '#1c1917');
  const R = 20;
  const live = ORDER.filter((id) => st.c[id] !== 'freed');
  return (
    <StepFrame title="Mark from the roots, then sweep" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={250} title="Roots on the left point into a graph of six objects; a grey stack and the object list are shown below">
        <Box x={4} y={30} w={86} h={120} fill={tok('brand', 0.08)} stroke={tok('brand')}>
          <T x={12} y={44} size={11} weight={700} fill={tok('brand')}>ROOTS</T>
          <T x={12} y={70} size={11} mono>globals</T>
          <T x={12} y={84} size={11} mono>table</T>
          <T x={12} y={114} size={11} mono>stack</T>
          <T x={12} y={128} size={11} mono>slot 1</T>
        </Box>
        <Arrow x1={60} y1={76} x2={NODES.A.x - R - 2} y2={NODES.A.y + 4} color={tok('brand')} />
        <Arrow x1={60} y1={122} x2={NODES.C.x - R - 2} y2={NODES.C.y} color={tok('brand')} />
        {EDGES.map(([a, b, bend]) => {
          const p = NODES[a];
          const q = NODES[b];
          const dx = q.x - p.x;
          const dy = q.y - p.y;
          const d = Math.hypot(dx, dy);
          const dead = st.c[a] === 'freed';
          return (
            <g key={a + b} opacity={dead ? 0.25 : 1}>
              <Arrow x1={p.x + (dx / d) * R} y1={p.y + (dy / d) * R} x2={q.x - (dx / d) * (R + 2)} y2={q.y - (dy / d) * (R + 2)} bend={bend} />
            </g>
          );
        })}
        {(Object.keys(NODES) as Id[]).map((id) => {
          const n = NODES[id];
          const c = st.c[id];
          const freed = c === 'freed';
          return (
            <g key={id} opacity={freed ? 0.25 : 1}>
              <circle cx={n.x} cy={n.y} r={R} fill={fill(c)} stroke={id === st.hot ? tok('accent') : tok('ink', 0.7)} strokeWidth={id === st.hot ? 3 : 1.5} strokeDasharray={freed ? '4 3' : undefined} />
              <T x={n.x} y={n.y} size={14} weight={700} anchor="middle" fill={text(c)}>{id}</T>
              <T x={n.x} y={n.y + R + 10} size={10} anchor="middle" fill={tok('muted')}>{freed ? 'freed' : n.kind}</T>
            </g>
          );
        })}
        <T x={4} y={186} size={12} mono>grey stack: [{st.gray.join(', ')}]</T>
        <T x={4} y={212} size={11} weight={700} fill={tok('muted')}>OBJECT LIST</T>
        <T x={4} y={232} size={12} mono>{['objects', ...live].join(' → ')} → null</T>
      </Svg>
    </StepFrame>
  );
}
