// "Available and very busy expressions": available expressions on an
// if/else diamond, one pass in order (no loop). A "must" problem: IN is the
// intersection of the predecessors' OUT; OUT = gen ∪ (IN − kill).
//   b0: x = a + b; if c     b1: y = a * b     b2: a = 0; y = a * b
//   b3: z = a + b; w = a * b
import { StepFrame, useSteps } from '../../viz/stepper';
import { Svg, T, tok } from '../../viz/svg';
import { CfgBlock, CfgEdge, Chip, type Block } from '../ch092/kit';

const B: Block[] = [
  { id: 'b0', x: 200, y: 30, lines: ['x = a + b', 'if c'], w: 112 },
  { id: 'b1', x: 100, y: 112, lines: ['y = a * b'], w: 112 },
  { id: 'b2', x: 300, y: 112, lines: ['a = 0', 'y = a * b'], w: 112 },
  { id: 'b3', x: 200, y: 194, lines: ['z = a + b', 'w = a * b'], w: 112 },
];
const at = (id: string) => B.find((b) => b.id === id)!;
const EDGES: [string, string][] = [['b0', 'b1'], ['b0', 'b2'], ['b1', 'b3'], ['b2', 'b3']];

type Row = [string, string];
type St = { rows: Record<string, Row>; hot?: string; from?: string[]; note: string };
const U = 'a+b, a*b';
const R0: Record<string, Row> = { b0: ['', U], b1: ['', U], b2: ['', U], b3: ['', U] };
const R1 = { ...R0, b0: ['∅', 'a+b'] as Row };
const R2 = { ...R1, b1: ['a+b', U] as Row };
const R3 = { ...R2, b2: ['a+b', 'a*b'] as Row };
const R4 = { ...R3, b3: ['a*b', U] as Row };

const STATES: St[] = [
  { rows: R0, note: 'Two expressions appear: a + b and a * b. This is a MUST question (computed on every path, operands unchanged since), so the meet is intersection, and every OUT starts at the top: both expressions.' },
  { rows: R1, hot: 'b0', note: 'b0, the entry: nothing has been computed yet, so IN = ∅. It computes a + b and changes neither a nor b afterwards, so gen = {a+b}, kill = ∅, and OUT = {a+b}.' },
  { rows: R2, hot: 'b1', from: ['b0'], note: 'b1: IN = {a+b}. It computes a * b (gen) and assigns only y, which neither expression uses (kill = ∅). OUT = {a+b, a*b}.' },
  { rows: R3, hot: 'b2', from: ['b0'], note: 'b2: IN = {a+b}. a = 0 kills every expression that uses a, both of them; then y = a * b computes a * b afresh. gen = {a*b}, kill = {a+b, a*b}, so OUT = {a*b} ∪ ({a+b} − kill) = {a*b}.' },
  { rows: R4, hot: 'b3', from: ['b1', 'b2'], note: 'b3 is the join: IN = {a+b, a*b} ∩ {a*b} = {a*b}. a * b is available on both paths (y holds it), but a + b is not: on the path through b2, a has changed since it was computed.' },
  { rows: R4, hot: 'b3', note: 'So w = a * b can reuse y instead of multiplying again, while z = a + b must really be computed. No loop, so one pass in this order is the fixpoint.' },
];

const TX = [30, 156, 290];
export default function AvailSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Available expressions on an if/else" steps={s} note={st.note}>
      <Svg w={400} h={350} title="An if/else diamond whose blocks compute a + b and a * b, with b2 setting a = 0. A table gives each block’s available expressions at its start (IN) and end (OUT); at the join b3 only a * b is available.">
        {EDGES.map(([a, b]) => {
          const on = st.hot === b && st.from?.includes(a);
          return <CfgEdge key={a + b} a={at(a)} b={at(b)} color={on ? tok('brand') : undefined} width={on ? 3 : 2} />;
        })}
        {B.map((b) => (
          <CfgBlock key={b.id} b={b}
            fill={st.hot === b.id ? tok('brand', 0.18) : st.from?.includes(b.id) ? tok('accent', 0.12) : undefined}
            stroke={st.hot === b.id ? tok('brand') : st.from?.includes(b.id) ? tok('accent') : undefined} />
        ))}
        <T x={TX[0]} y={244} size={11} weight={700} fill={tok('muted')}>BLOCK</T>
        <T x={TX[1]} y={244} size={11} weight={700} fill={tok('muted')} anchor="middle">IN</T>
        <T x={TX[2]} y={244} size={11} weight={700} fill={tok('muted')} anchor="middle">OUT</T>
        {B.map((b, k) => {
          const y = 266 + k * 22;
          const [i, o] = st.rows[b.id];
          const hot = st.hot === b.id;
          return (
            <g key={b.id}>
              <T x={TX[0]} y={y} size={12} mono weight={hot ? 700 : 400}>{b.id}</T>
              {i && <Chip x={TX[1]} y={y} w={104} text={i} fill={hot ? tok('brand', 0.14) : undefined} stroke={hot ? tok('brand') : undefined} />}
              <Chip x={TX[2]} y={y} w={104} text={o} fill={hot ? tok('brand', 0.14) : undefined} stroke={hot ? tok('brand') : undefined} />
            </g>
          );
        })}
      </Svg>
    </StepFrame>
  );
}
