// Chapter 123: lowering (a + b) * (a - c) to three-address code, children
// first. The listing is the real VIR for
//   function h(a, b, c) { return (a + b) * (a - c); }
import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const ALL = [
  'func h(%0, %1, %2):',
  '  b0:',
  '    %0 = param',
  '    %1 = param',
  '    %2 = param',
  '    %3 = binop + %0, %1',
  '    %4 = binop - %0, %2',
  '    %5 = binop * %3, %4',
  '    return %5',
];

type Id = 'mul' | 'add' | 'sub' | 'a1' | 'b' | 'a2' | 'c';
const NODES: { id: Id; x: number; y: number; label: string; name: string }[] = [
  { id: 'mul', x: 200, y: 22, label: '*', name: '%5' },
  { id: 'add', x: 110, y: 82, label: '+', name: '%3' },
  { id: 'sub', x: 290, y: 82, label: '-', name: '%4' },
  { id: 'a1', x: 65, y: 142, label: 'a', name: '%0' },
  { id: 'b', x: 155, y: 142, label: 'b', name: '%1' },
  { id: 'a2', x: 245, y: 142, label: 'a', name: '%0' },
  { id: 'c', x: 335, y: 142, label: 'c', name: '%2' },
];
const EDGES: [Id, Id][] = [['mul', 'add'], ['mul', 'sub'], ['add', 'a1'], ['add', 'b'], ['sub', 'a2'], ['sub', 'c']];

type S = { named: Id[]; hot: Id[]; lines: number; line: number | null; note: string };

const STATES: S[] = [
  { named: [], hot: [], lines: 5, line: null, note: 'Before the body is lowered, the three parameters already have names: a is %0, b is %1, c is %2. Every value in VIR is a numbered temporary like these.' },
  { named: ['a1'], hot: ['mul', 'add', 'a1'], lines: 5, line: null, note: 'expr(*) can’t emit anything yet: it needs names for both operands. So it calls expr(+), which calls expr(a). A variable emits nothing; it returns the name it already has, %0.' },
  { named: ['a1', 'b', 'add'], hot: ['add'], lines: 6, line: 5, note: 'expr(b) returns %1. Now + has both operands, so it emits one instruction and gets the next free name: %3 = binop + %0, %1. Two operands, one result: three addresses.' },
  { named: ['a1', 'b', 'add', 'a2', 'c', 'sub'], hot: ['sub'], lines: 7, line: 6, note: 'Back in *, the right side: expr(-) gets %0 and %2 and emits %4. Notice a is used twice and still has one name, %0. Nothing is loaded again.' },
  { named: ['a1', 'b', 'add', 'a2', 'c', 'sub', 'mul'], hot: ['mul'], lines: 8, line: 7, note: 'Both halves are named, so * emits %5 = binop * %3, %4. Every inner node of the tree became one instruction, children before parents.' },
  { named: ['a1', 'b', 'add', 'a2', 'c', 'sub', 'mul'], hot: [], lines: 9, line: 8, note: 'The return statement just names the value to return. Three instructions for three operators. Drip’s stack code for the same expression would need seven: four loads, then three operators.' },
];

export default function TacSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const at = (id: Id) => NODES.find((n) => n.id === id)!;
  return (
    <StepFrame title="Naming every intermediate value" steps={s} note={st.note}>
      <Svg w={400} h={182} title="The tree of (a + b) * (a - c). As lowering visits it, children first, each node gets a name: a is %0, b is %1, c is %2, the sum %3, the difference %4, the product %5.">
        {EDGES.map(([p, c]) => {
          const P = at(p), C = at(c);
          return <line key={p + c} x1={P.x} y1={P.y + 13} x2={C.x} y2={C.y - 13} stroke={tok('line')} strokeWidth={1.5} />;
        })}
        {NODES.map((n) => {
          const hot = st.hot.includes(n.id);
          const named = st.named.includes(n.id);
          return (
            <g key={n.id}>
              <Box x={n.x - 18} y={n.y - 13} w={36} h={26} r={13} fill={hot ? tok('brand', 0.22) : tok('panel')} stroke={hot ? tok('brand') : tok('line')}>
                <T x={n.x} y={n.y} size={14} mono anchor="middle">{n.label}</T>
              </Box>
              {named && <T x={n.x + 22} y={n.y - 12} size={12} mono weight={700} fill={tok('accent')}>{n.name}</T>}
            </g>
          );
        })}
      </Svg>
      <CodeTrace code={ALL.slice(0, st.lines).join('\n')} line={st.line} />
    </StepFrame>
  );
}
