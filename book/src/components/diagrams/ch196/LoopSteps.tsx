// "Fixpoints and worklists": a worklist solving "definitely assigned" on a
// CFG with a loop. Every OUT starts at the top of the lattice ("all": i, x
// and y), the optimistic guess, and only ever loses variables.
//   b0: i = 0; x = 0    b1: if i < 3    b2: y = i * 2; x = x + y; i = i + 1
//   b3: print x; print y
import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';
import { BackEdge, CfgBlock, CfgEdge, Chip, type Block } from '../ch195/kit';

const B: Block[] = [
  { id: 'b0', x: 150, y: 32, lines: ['i = 0', 'x = 0'] },
  { id: 'b1', x: 150, y: 104, lines: ['if i < 3'] },
  { id: 'b2', x: 262, y: 184, lines: ['y = i * 2', 'x = x + y', 'i = i + 1'] },
  { id: 'b3', x: 80, y: 178, lines: ['print x', 'print y'], w: 96 },
];
const at = (id: string) => B.find((b) => b.id === id)!;
const EDGES: [string, string][] = [['b0', 'b1'], ['b1', 'b2'], ['b1', 'b3']];

type Row = [string, string];
type St = { rows: Record<string, Row>; work: string[]; hot?: string; from?: string[]; changed?: boolean; note: string };
const ALL = 'all';
const R0: Record<string, Row> = { b0: ['{ }', ALL], b1: ['', ALL], b2: ['', ALL], b3: ['', ALL] };
const R1 = { ...R0, b0: ['{ }', '{i, x}'] as Row };
const R2 = { ...R1, b1: ['{i, x}', '{i, x}'] as Row };
const R3 = { ...R2, b2: ['{i, x}', '{i, x, y}'] as Row };
const R4 = { ...R3, b3: ['{i, x}', '{i, x}'] as Row };

const STATES: St[] = [
  { rows: R0, work: ['b0', 'b1', 'b2', 'b3'], note: 'b1’s IN needs OUT[b2], which needs IN[b2], which is OUT[b1]: a circle. So we guess. Every OUT starts at “all” (i, x and y), the top of the lattice, which agrees with anything it is met with. Every block goes on the worklist.' },
  { rows: R1, work: ['b1', 'b2', 'b3'], hot: 'b0', changed: true, note: 'Take b0 off the front. It is the entry, so IN is { }, and it assigns i and x: OUT[b0] = {i, x}. That is lower than the guess, so it CHANGED, and its successor b1 must be looked at (it is already queued).' },
  { rows: R2, work: ['b2', 'b3'], hot: 'b1', from: ['b0', 'b2'], changed: true, note: 'b1 meets its two predecessors: {i, x} from b0, and from b2 the guess “all”, which agrees with anything. {i, x} ∩ all = {i, x}. b1 assigns nothing, so OUT[b1] = {i, x}: changed, so its successors b2 and b3 must be looked at (both still queued).' },
  { rows: R3, work: ['b3'], hot: 'b2', from: ['b1'], note: 'b2: IN = OUT[b1] = {i, x}, and it assigns y, x and i, so OUT[b2] = {i, x, y}, which is exactly the guess “all”. NO change, so nothing is added: the guess we used for the back edge has been confirmed.' },
  { rows: R4, work: [], hot: 'b3', from: ['b1'], changed: true, note: 'b3: IN = OUT[b1] = {i, x}, so OUT[b3] = {i, x}. It changed, but b3 has no successors. The worklist is empty.' },
  { rows: R4, work: [], hot: 'b3', note: 'A fixpoint: running any block’s equation again changes nothing. y is not in IN[b3], because the path b0, b1, b3 (the loop running zero times) never assigns it; TypeScript reports the same error for this loop.' },
];

const TX = [30, 150, 270];
export default function LoopSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const hi = (id: string) => st.hot === id;
  return (
    <StepFrame title="A worklist on a loop" steps={s} note={st.note}>
      <Svg w={400} h={388} title="A loop: b0 sets i and x, b1 tests i < 3, b2 sets y, x and i and jumps back to b1, b3 prints x and y. Below, each block’s IN and OUT sets of definitely assigned variables, and the worklist.">
        {EDGES.map(([a, b]) => {
          const on = hi(b) && st.from?.includes(a);
          return <CfgEdge key={a + b} a={at(a)} b={at(b)} color={on ? tok('brand') : undefined} width={on ? 3 : 2} />;
        })}
        <BackEdge a={at('b2')} b={at('b1')} out={30}
          color={hi('b1') && st.from?.includes('b2') ? tok('brand') : undefined}
          width={hi('b1') && st.from?.includes('b2') ? 3 : 2} />
        {B.map((b) => (
          <CfgBlock key={b.id} b={b}
            fill={hi(b.id) ? tok('brand', 0.18) : st.from?.includes(b.id) ? tok('accent', 0.12) : undefined}
            stroke={hi(b.id) ? tok('brand') : st.from?.includes(b.id) ? tok('accent') : undefined} />
        ))}
        <T x={TX[0]} y={238} size={11} weight={700} fill={tok('muted')}>BLOCK</T>
        <T x={TX[1]} y={238} size={11} weight={700} fill={tok('muted')} anchor="middle">IN</T>
        <T x={TX[2]} y={238} size={11} weight={700} fill={tok('muted')} anchor="middle">OUT</T>
        {B.map((b, k) => {
          const y = 260 + k * 22;
          const [i, o] = st.rows[b.id];
          const h = hi(b.id);
          return (
            <g key={b.id}>
              <T x={TX[0]} y={y} size={12} mono weight={h ? 700 : 400}>{b.id}</T>
              {i && <Chip x={TX[1]} y={y} w={92} text={i} />}
              <Chip x={TX[2]} y={y} w={92} text={o} bold={h && st.changed}
                fill={o === ALL ? tok('accent', 0.1) : h ? tok('brand', 0.14) : undefined}
                stroke={h ? tok('brand') : undefined} />
            </g>
          );
        })}
        <T x={TX[0]} y={360} size={11} weight={700} fill={tok('muted')}>WORKLIST</T>
        {st.work.length === 0 && <T x={104} y={360} size={12} fill={tok('muted')}>(empty)</T>}
        {st.work.map((w, k) => (
          <Box key={w} x={104 + k * 46} y={348} w={40} h={24} fill={tok('accent', 0.12)} stroke={tok('accent')}>
            <T x={124 + k * 46} y={360} size={12} mono anchor="middle">{w}</T>
          </Box>
        ))}
        <T x={392} y={382} size={11} anchor="end" fill={tok('muted')}>“all” = {'{i, x, y}'}, the optimistic guess</T>
      </Svg>
    </StepFrame>
  );
}
