import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Which of Drip's rules mention which: an arrow from A to B means
// "B appears in a body of A". The two loops are what let statements nest.
type N = { id: string; x: number; y: number };

const NODES: N[] = [
  { id: 'program', x: 62, y: 24 },
  { id: 'declaration', x: 230, y: 24 },
  { id: 'letDecl', x: 62, y: 96 },
  { id: 'fnDecl', x: 190, y: 96 },
  { id: 'statement', x: 322, y: 96 },
  { id: 'block', x: 150, y: 170 },
  { id: 'printStmt', x: 252, y: 170 },
  { id: 'ifStmt', x: 350, y: 170 },
  { id: 'expression', x: 230, y: 244 },
];

const H = 26;
const w = (id: string) => id.length * 7.4 + 18;
const by = Object.fromEntries(NODES.map((n) => [n.id, n]));

// [from, to, loop?]
const EDGES: [string, string, boolean?][] = [
  ['declaration', 'letDecl'],
  ['declaration', 'fnDecl'],
  ['declaration', 'statement'],
  ['fnDecl', 'block'],
  ['statement', 'block'],
  ['statement', 'printStmt'],
  ['statement', 'ifStmt'],
  ['letDecl', 'expression'],
  ['printStmt', 'expression'],
  ['ifStmt', 'expression'],
];

function down(a: string, b: string, color: string) {
  const p = by[a];
  const c = by[b];
  return <Arrow key={a + b} x1={p.x} y1={p.y + H / 2} x2={c.x} y2={c.y - H / 2 - 1} color={color} width={1.5} />;
}

export default function DripGrammarMap() {
  const ink = tok('ink', 0.45);
  const loop = tok('brand');
  return (
    <Svg w={400} h={282} title="A map of Drip's statement rules. program uses declaration; declaration uses letDecl, fnDecl and statement; statement uses block, printStmt and ifStmt; block uses declaration again, and ifStmt uses statement again; letDecl, printStmt and ifStmt use expression.">
      {/* program → declaration, sideways */}
      <Arrow x1={62 + w('program') / 2} y1={24} x2={230 - w('declaration') / 2 - 2} y2={24} color={ink} width={1.5} />
      <T x={130} y={14} size={11} mono fill={tok('muted')}>*</T>
      {EDGES.map(([a, b]) => down(a, b, ink))}
      {/* the loops */}
      <Arrow x1={150 - 30} y1={170 - H / 2} x2={230 - 50} y2={24 + H / 2 + 1} color={loop} width={2} bend={-0.9} dash />
      <T x={8} y={200} size={11} mono fill={loop}>{'block → "{" declaration* "}"'}</T>
      <Arrow x1={350 + 30} y1={170 - H / 2} x2={322 + 40} y2={96 + H / 2 + 1} color={loop} width={2} bend={0.9} dash />
      <T x={8} y={216} size={11} mono fill={loop}>{'ifStmt → … "else" statement'}</T>
      {NODES.map((n) => {
        const ww = w(n.id);
        const isExpr = n.id === 'expression';
        return (
          <Box key={n.id} x={n.x - ww / 2} y={n.y - H / 2} w={ww} h={H} r={13} dash fill={isExpr ? tok('panel') : tok('brand', 0.1)} stroke={isExpr ? tok('ink', 0.5) : tok('brand', 0.8)}>
            <T x={n.x} y={n.y + 1} size={12} mono anchor="middle" weight={700} fill={isExpr ? tok('ink') : tok('brand')}>{n.id}</T>
          </Box>
        );
      })}
      <T x={230} y={274} size={11} anchor="middle" fill={tok('muted')}>(its own rules come later)</T>
    </Svg>
  );
}
