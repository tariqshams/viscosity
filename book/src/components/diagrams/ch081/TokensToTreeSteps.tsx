import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// The flat tokens of print -2 * (3 + 4); and the tree they become,
// built by hand from the inside out. Each token ends up as a node's
// kind, an operator, a literal's value, part of a grouping, or nothing.
const TOKENS = ['print', '-', '2', '*', '(', '3', '+', '4', ')', ';'];
const FATE = ['kind', 'op', 'value', 'op', 'group', 'value', 'op', 'value', 'group', 'gone'];

type Id = 'print' | 'mul' | 'neg' | 'two' | 'grp' | 'add' | 'three' | 'four';
const NODES: Record<Id, { x: number; y: number; label: string; stmt?: boolean }> = {
  print: { x: 200, y: 76, label: "print", stmt: true },
  mul: { x: 200, y: 126, label: 'binary *' },
  neg: { x: 104, y: 176, label: 'unary -' },
  grp: { x: 296, y: 176, label: 'grouping' },
  two: { x: 104, y: 226, label: 'literal 2' },
  add: { x: 296, y: 226, label: 'binary +' },
  three: { x: 240, y: 276, label: 'literal 3' },
  four: { x: 352, y: 276, label: 'literal 4' },
};
const EDGES: [Id, Id][] = [['print', 'mul'], ['mul', 'neg'], ['mul', 'grp'], ['neg', 'two'], ['grp', 'add'], ['add', 'three'], ['add', 'four']];

type S = { used: number[]; nodes: Id[]; note: string };
const STATES: S[] = [
  { used: [], nodes: [], note: 'The scanner’s ten tokens for print -2 * (3 + 4); in a flat row. We will build the syntax tree by hand, from the innermost pieces outwards, and watch what becomes of each token.' },
  { used: [2], nodes: ['two'], note: 'The number token 2 becomes a literal node. The node keeps the token’s value, 2; it is a leaf, with no children.' },
  { used: [1, 2], nodes: ['two', 'neg'], note: 'The minus in front of it becomes a unary node whose one child is that literal. The token - is kept as the node’s operator.' },
  { used: [1, 2, 5, 7], nodes: ['two', 'neg', 'three', 'four'], note: 'Inside the brackets, 3 and 4 become two more literal leaves.' },
  { used: [1, 2, 5, 6, 7], nodes: ['two', 'neg', 'three', 'four', 'add'], note: 'The + joins them: a binary node with a left child (3), an operator (+) and a right child (4).' },
  { used: [1, 2, 4, 5, 6, 7, 8], nodes: ['two', 'neg', 'three', 'four', 'add', 'grp'], note: 'The two bracket tokens become one grouping node around the sum. The brackets themselves are not stored: the node is enough to say they were there.' },
  { used: [1, 2, 3, 4, 5, 6, 7, 8], nodes: ['two', 'neg', 'three', 'four', 'add', 'grp', 'mul'], note: 'The * joins the two halves: its left child is the unary minus, its right child the grouping. Deeper nodes happen first, so the sum is worked out before the product.' },
  { used: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], nodes: ['two', 'neg', 'three', 'four', 'add', 'grp', 'mul', 'print'], note: 'print becomes the kind of a statement node holding the whole expression. The ; has no node at all: it only marked where the statement ended, and the tree’s shape now says that.' },
];

const NW = 88;
const NH = 28;

export default function TokensToTreeSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const has = (id: Id) => st.nodes.includes(id);
  return (
    <StepFrame title="From a row of tokens to a tree" steps={s} note={st.note}>
      <Svg w={400} h={300} title="The ten tokens of print -2 * (3 + 4); above, and below, the syntax tree built from them so far">
        {TOKENS.map((t, k) => {
          const x = 6 + k * 39;
          const used = st.used.includes(k);
          return (
            <g key={k}>
              <Box x={x} y={4} w={35} h={26} fill={used ? tok('ink', 0.06) : tok('panel')} stroke={used ? tok('ink', 0.2) : tok('ink', 0.5)}>
                <T x={x + 17.5} y={17.5} size={t.length > 2 ? 11 : 14} mono anchor="middle" opacity={used ? 0.5 : 1}>{t}</T>
              </Box>
              {used && (
                <T x={x + 17.5} y={42} size={11} anchor="middle" fill={FATE[k] === 'gone' ? tok('danger') : tok('brand')} weight={700}>{FATE[k]}</T>
              )}
            </g>
          );
        })}
        {EDGES.map(([a, b]) => has(a) && has(b) && (
          <line key={a + b} x1={NODES[a].x} y1={NODES[a].y + NH / 2} x2={NODES[b].x} y2={NODES[b].y - NH / 2} stroke={tok('ink', 0.45)} strokeWidth={1.4} />
        ))}
        {(Object.keys(NODES) as Id[]).map((id) => {
          if (!has(id)) return null;
          const n = NODES[id];
          return (
            <Box key={id} x={n.x - NW / 2} y={n.y - NH / 2} w={NW} h={NH} r={n.stmt ? 4 : 14} fill={n.stmt ? tok('warn', 0.14) : tok('brand', 0.12)} stroke={n.stmt ? tok('warn') : tok('brand')}>
              <T x={n.x} y={n.y + 1} size={12} mono anchor="middle">{n.label}</T>
            </Box>
          );
        })}
        {st.nodes.length === 0 && <T x={200} y={170} size={12} anchor="middle" fill={tok('muted')}>no tree yet</T>}
      </Svg>
    </StepFrame>
  );
}
