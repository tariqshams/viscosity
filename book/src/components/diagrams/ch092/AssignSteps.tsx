// Chapter 92: one forward pass of "definitely assigned?" over an if/else
// diamond. Each block's IN is the meet (intersection) of its predecessors'
// OUTs, and its OUT adds the variables the block assigns.
//   b0: x = 1; if c     b1: y = 2     b2: x = 3     b3: print x + y
import { StepFrame, useSteps } from '../../viz/stepper';
import { Svg, T, tok } from '../../viz/svg';
import { CfgBlock, CfgEdge, Chip, type Block } from './kit';

const B: Block[] = [
  { id: 'b0', x: 200, y: 30, lines: ['x = 1', 'if c'] },
  { id: 'b1', x: 105, y: 112, lines: ['y = 2'] },
  { id: 'b2', x: 295, y: 112, lines: ['x = 3'] },
  { id: 'b3', x: 200, y: 186, lines: ['print x + y'], w: 120 },
];
const at = (id: string) => B.find((b) => b.id === id)!;
const EDGES: [string, string][] = [['b0', 'b1'], ['b0', 'b2'], ['b1', 'b3'], ['b2', 'b3']];

type Row = [string, string];
type St = { rows: Record<string, Row>; hot?: string; from?: string[]; note: string };
const E: Row = ['', ''];
const R0 = { b0: E, b1: E, b2: E, b3: E };
const R1 = { ...R0, b0: ['{ }', '{x}'] as Row };
const R2 = { ...R1, b1: ['{x}', '{x, y}'] as Row };
const R3 = { ...R2, b2: ['{x}', '{x}'] as Row };
const R4 = { ...R3, b3: ['{x}', '{x}'] as Row };

const STATES: St[] = [
  { rows: R0, note: 'The question at every block: which variables have DEFINITELY been given a value by now, on every path? We will fill in IN (the fact at the start of the block) and OUT (the fact at its end), visiting each block after the blocks that lead into it.' },
  { rows: R1, hot: 'b0', note: 'b0 is the entry. Before the function starts, nothing has been assigned, so IN is the empty set. Its transfer function adds what it assigns: x. OUT[b0] = {x}.' },
  { rows: R2, hot: 'b1', from: ['b0'], note: 'b1 has one predecessor, b0, so its IN is OUT[b0] = {x}. It assigns y, so OUT[b1] = {x, y}.' },
  { rows: R3, hot: 'b2', from: ['b0'], note: 'b2 also starts from OUT[b0] = {x}. It assigns x again, which adds nothing new: OUT[b2] = {x}.' },
  { rows: R4, hot: 'b3', from: ['b1', 'b2'], note: 'b3 is a join. Its IN is the MEET of what arrives: {x, y} ∩ {x} = {x}. Only facts true on BOTH paths survive, so y is missing: on the path through b2, y was never assigned.' },
  { rows: R4, hot: 'b3', note: 'print x + y reads y, and y is not in IN[b3]: this is exactly TypeScript’s complaint, “Variable \'y\' is used before being assigned.” With no loops, one pass in this order was enough.' },
];

const TX = [36, 150, 270];
export default function AssignSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Definitely assigned, block by block" steps={s} note={st.note}>
      <Svg w={400} h={340} title="An if/else diamond of four blocks, with a table of each block’s IN and OUT sets of definitely assigned variables. At the join b3, IN is {x}.">
        {EDGES.map(([a, b]) => {
          const on = st.hot === b && st.from?.includes(a);
          return <CfgEdge key={a + b} a={at(a)} b={at(b)} color={on ? tok('brand') : undefined} width={on ? 3 : 2} />;
        })}
        {B.map((b) => (
          <CfgBlock key={b.id} b={b}
            fill={st.hot === b.id ? tok('brand', 0.18) : st.from?.includes(b.id) ? tok('accent', 0.12) : undefined}
            stroke={st.hot === b.id ? tok('brand') : st.from?.includes(b.id) ? tok('accent') : undefined} />
        ))}
        <T x={TX[0]} y={232} size={11} weight={700} fill={tok('muted')}>BLOCK</T>
        <T x={TX[1]} y={232} size={11} weight={700} fill={tok('muted')} anchor="middle">IN</T>
        <T x={TX[2]} y={232} size={11} weight={700} fill={tok('muted')} anchor="middle">OUT</T>
        {B.map((b, k) => {
          const y = 256 + k * 22;
          const [i, o] = st.rows[b.id];
          const hot = st.hot === b.id;
          return (
            <g key={b.id}>
              <T x={TX[0]} y={y} size={12} mono weight={hot ? 700 : 400}>{b.id}</T>
              {i && <Chip x={TX[1]} y={y} w={84} text={i} fill={hot ? tok('brand', 0.14) : undefined} stroke={hot ? tok('brand') : undefined} />}
              {o && <Chip x={TX[2]} y={y} w={84} text={o} fill={hot ? tok('brand', 0.14) : undefined} stroke={hot ? tok('brand') : undefined} />}
            </g>
          );
        })}
      </Svg>
    </StepFrame>
  );
}
