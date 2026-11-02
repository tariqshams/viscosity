import { Box, Svg, T, tok } from '../../viz/svg';

// The tree of  if x > 1 { print x * 2; }  with statement nodes and
// expression nodes drawn differently.
type N = { id: string; x: number; y: number; label: string; stmt?: boolean };

const NODES: N[] = [
  { id: 'if', x: 200, y: 30, label: "if", stmt: true },
  { id: 'gt', x: 100, y: 92, label: 'binary >' },
  { id: 'bl', x: 300, y: 92, label: 'block', stmt: true },
  { id: 'x1', x: 50, y: 154, label: 'variable x' },
  { id: 'one', x: 150, y: 154, label: 'literal 1' },
  { id: 'pr', x: 300, y: 154, label: 'print', stmt: true },
  { id: 'mul', x: 300, y: 216, label: 'binary *' },
  { id: 'x2', x: 250, y: 278, label: 'variable x' },
  { id: 'two', x: 350, y: 278, label: 'literal 2' },
];
const EDGES: [string, string, string][] = [
  ['if', 'gt', 'condition'], ['if', 'bl', 'then'],
  ['bl', 'pr', ''],
  ['gt', 'x1', ''], ['gt', 'one', ''],
  ['pr', 'mul', 'expression'],
  ['mul', 'x2', ''], ['mul', 'two', ''],
];

const NW = 92;
const NH = 28;

export default function StmtExprTree() {
  const by = Object.fromEntries(NODES.map((n) => [n.id, n]));
  return (
    <Svg w={400} h={334} title="The syntax tree of if x > 1 { print x * 2; } The if node, the block node and the print node are statements. The comparison, the multiplication, the variables and the literals are expressions.">
      {EDGES.map(([a, b, lab]) => {
        const p = by[a];
        const c = by[b];
        return (
          <g key={a + b}>
            <line x1={p.x} y1={p.y + NH / 2} x2={c.x} y2={c.y - NH / 2} stroke={tok('ink', 0.45)} strokeWidth={1.4} />
            {lab && (
              <T x={(p.x + c.x) / 2 + (c.x < p.x ? -8 : c.x > p.x ? 8 : 6)} y={(p.y + c.y) / 2} size={11} mono anchor={c.x < p.x ? 'end' : 'start'} fill={tok('muted')}>{lab}</T>
            )}
          </g>
        );
      })}
      {NODES.map((n) => (
        <Box key={n.id} x={n.x - NW / 2} y={n.y - NH / 2} w={NW} h={NH} r={n.stmt ? 4 : 14} fill={n.stmt ? tok('warn', 0.14) : tok('brand', 0.12)} stroke={n.stmt ? tok('warn') : tok('brand')}>
          <T x={n.x} y={n.y + 1} size={12} mono anchor="middle">{n.label}</T>
        </Box>
      ))}
      <Box x={8} y={310} w={14} h={14} r={3} fill={tok('warn', 0.14)} stroke={tok('warn')} />
      <T x={28} y={317} size={11}>statement: does something</T>
      <Box x={204} y={310} w={14} h={14} r={7} fill={tok('brand', 0.12)} stroke={tok('brand')} />
      <T x={224} y={317} size={11}>expression: has a value</T>
    </Svg>
  );
}
