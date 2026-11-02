import { Box, Svg, T, tok } from '../../viz/svg';

type N = { id: string; x: number; y: number; label: string; nt?: boolean; ast?: boolean };

// The parse tree of print 1 + 2; under chapter 40's grammar.
const PT: N[] = [
  { id: 'stmt', x: 200, y: 26, label: 'stmt', nt: true },
  { id: 'print', x: 70, y: 74, label: '"print"' },
  { id: 'e1', x: 200, y: 74, label: 'expr', nt: true },
  { id: 'semi', x: 330, y: 74, label: '";"' },
  { id: 'e2', x: 130, y: 122, label: 'expr', nt: true },
  { id: 'plus', x: 200, y: 122, label: '"+"' },
  { id: 'i2', x: 270, y: 122, label: 'item', nt: true },
  { id: 'i1', x: 130, y: 170, label: 'item', nt: true },
  { id: 'n2', x: 270, y: 170, label: 'NUMBER 2' },
  { id: 'n1', x: 130, y: 218, label: 'NUMBER 1' },
];
const PE: [string, string][] = [['stmt', 'print'], ['stmt', 'e1'], ['stmt', 'semi'], ['e1', 'e2'], ['e1', 'plus'], ['e1', 'i2'], ['e2', 'i1'], ['i1', 'n1'], ['i2', 'n2']];

// The AST of the same statement, as the companion parser builds it.
const AT: N[] = [
  { id: 'p', x: 200, y: 290, label: "kind: 'print'", ast: true },
  { id: 'b', x: 200, y: 340, label: "'binary'  op +", ast: true },
  { id: 'l1', x: 110, y: 392, label: "'literal' 1", ast: true },
  { id: 'l2', x: 290, y: 392, label: "'literal' 2", ast: true },
];
const AE: [string, string, string][] = [['p', 'b', 'expression'], ['b', 'l1', 'left'], ['b', 'l2', 'right']];

const w = (n: N) => Math.max(44, n.label.length * 7.4 + 14);
const H = 26;

function Nodes({ ns, es, labels }: { ns: N[]; es: [string, string, string?][]; labels?: boolean }) {
  const by = Object.fromEntries(ns.map((n) => [n.id, n]));
  return (
    <g>
      {es.map(([a, b, lab]) => {
        const p = by[a];
        const c = by[b];
        return (
          <g key={a + b}>
            <line x1={p.x} y1={p.y + H / 2} x2={c.x} y2={c.y - H / 2} stroke={tok('ink', 0.45)} strokeWidth={1.4} />
            {labels && lab && <T x={(p.x + c.x) / 2 + (c.x < p.x ? -10 : c.x > p.x ? 10 : 6)} y={(p.y + c.y) / 2} size={10} mono anchor={c.x < p.x ? 'end' : 'start'} fill={tok('muted')}>{lab}</T>}
          </g>
        );
      })}
      {ns.map((n) => {
        const ww = w(n);
        return (
          <Box key={n.id} x={n.x - ww / 2} y={n.y - H / 2} w={ww} h={H} r={n.nt ? 13 : 5} fill={n.ast ? tok('brand', 0.12) : n.nt ? tok('panel') : tok('paper')} stroke={n.ast ? tok('brand') : n.nt ? tok('ink', 0.5) : tok('ink', 0.3)} dash={n.nt}>
            <T x={n.x} y={n.y + 1} size={12} mono anchor="middle" fill={n.nt ? tok('muted') : tok('ink')}>{n.label}</T>
          </Box>
        );
      })}
    </g>
  );
}

/** The parse tree and the AST of print 1 + 2; one above the other. */
export default function ParseVsAst() {
  return (
    <Svg w={400} h={414} title="Above: the parse tree of print 1 + 2; with a node for every rule used, ten nodes in all. Below: the abstract syntax tree of the same statement, with four nodes: a print node holding a binary plus node, whose left and right children are the literals 1 and 2.">
      <T x={6} y={8} size={11} weight={700} fill={tok('muted')}>PARSE TREE (every rule, every token)</T>
      <Nodes ns={PT} es={PE} />
      <line x1={6} y1={246} x2={394} y2={246} stroke={tok('line')} strokeDasharray="4 4" />
      <T x={6} y={262} size={11} weight={700} fill={tok('brand')}>ABSTRACT SYNTAX TREE (only what matters)</T>
      <Nodes ns={AT} es={AE} labels />
    </Svg>
  );
}
