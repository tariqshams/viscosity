import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const TOKENS = ['1', '+', '2', '*', '3'];

type Fr = { fn: string; doing: string };
type NodeId = 'one' | 'two' | 'three' | 'mul' | 'add';
type S = { i: number; stack: Fr[]; nodes: NodeId[]; result?: string; note: string };

const STATES: S[] = [
  { i: 0, stack: [{ fn: 'term', doing: 'left = factor()…' }], nodes: [], note: 'Parsing starts at term, the loosest level in this grammar. Its first job is to get a factor. No token has been used yet.' },
  { i: 0, stack: [{ fn: 'term', doing: 'left = factor()…' }, { fn: 'factor', doing: 'left = unary()…' }, { fn: 'unary', doing: 'no ! or -' }, { fn: 'primary', doing: 'a number?' }], nodes: [], note: 'term calls factor, factor calls unary, and unary sees no ! or -, so it calls primary. Four calls deep, and still no token used: each level first asks the one below for an operand.' },
  { i: 1, stack: [{ fn: 'term', doing: 'left = factor()…' }, { fn: 'factor', doing: 'left = unary()…' }, { fn: 'unary', doing: 'no ! or -' }, { fn: 'primary', doing: 'took 1' }], nodes: ['one'], note: 'primary takes the token 1 and makes a literal node. The cursor moves on to +.' },
  { i: 1, stack: [{ fn: 'term', doing: 'left = factor()…' }, { fn: 'factor', doing: 'left=1; no * or /' }], nodes: ['one'], note: 'primary and unary return. factor now has left = 1 and checks for * or /. The next token is +: not its business. So factor returns 1 as it is.' },
  { i: 2, stack: [{ fn: 'term', doing: 'left = 1; took +' }], nodes: ['one'], note: 'Back in term with left = 1. The next token is +, which term does handle. It takes it and needs a right-hand operand.' },
  { i: 3, stack: [{ fn: 'term', doing: '1 + right…' }, { fn: 'factor', doing: 'left = unary()…' }, { fn: 'unary', doing: 'no ! or -' }, { fn: 'primary', doing: 'took 2' }], nodes: ['one', 'two'], note: 'The right operand of + is a whole factor. Down the levels again: primary takes 2.' },
  { i: 4, stack: [{ fn: 'term', doing: '1 + right…' }, { fn: 'factor', doing: 'left = 2; took *' }], nodes: ['one', 'two'], note: 'This time factor finds an operator it owns: *. It takes it. The + is still waiting in term, because a factor has to be finished before term can use it.' },
  { i: 5, stack: [{ fn: 'term', doing: '1 + right…' }, { fn: 'factor', doing: '2 * right…' }, { fn: 'unary', doing: 'no ! or -' }, { fn: 'primary', doing: 'took 3' }], nodes: ['one', 'two', 'three'], note: 'The right operand of * is a unary: down to primary, which takes 3. Every token has now been used.' },
  { i: 5, stack: [{ fn: 'term', doing: '1 + right…' }, { fn: 'factor', doing: 'built *, returns' }], nodes: ['one', 'two', 'three', 'mul'], note: 'factor builds the * node from 2 and 3. No more * or /, so it returns that node: the whole product is term’s right operand.' },
  { i: 5, stack: [{ fn: 'term', doing: 'built +, returns' }], nodes: ['one', 'two', 'three', 'mul', 'add'], note: 'term builds the + node, with 1 on the left and the product on the right. No more + or -, so term returns.' },
  { i: 5, stack: [], nodes: ['one', 'two', 'three', 'mul', 'add'], result: '(+ 1 (* 2 3))', note: 'Done. * ended up deeper than +, so it happens first. Nobody compared priorities: the order of the function calls did it. The tree grew from the leaves up.' },
];

const POS: Record<NodeId, { x: number; y: number; label: string; op?: boolean }> = {
  add: { x: 306, y: 88, label: '+', op: true },
  one: { x: 254, y: 142, label: '1' },
  mul: { x: 344, y: 142, label: '*', op: true },
  two: { x: 310, y: 196, label: '2' },
  three: { x: 374, y: 196, label: '3' },
};
const EDGES: [NodeId, NodeId][] = [['add', 'one'], ['add', 'mul'], ['mul', 'two'], ['mul', 'three']];

const NW = 44;
const NH = 28;
const FH = 30;

export default function DescentSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const has = (n: NodeId) => st.nodes.includes(n);
  return (
    <StepFrame title="Parsing 1 + 2 * 3 by recursive descent" steps={s} note={st.note}>
      <Svg w={400} h={240} title="The tokens with a cursor, the stack of parsing function calls, and the syntax tree built so far">
        {TOKENS.map((t, k) => {
          const x = 8 + k * 46;
          const used = k < st.i;
          return (
            <Box key={k} x={x} y={6} w={40} h={28} fill={used ? tok('ink', 0.06) : tok('panel')} stroke={k === st.i ? tok('brand') : tok('ink', used ? 0.2 : 0.45)}>
              <T x={x + 20} y={21} size={15} mono anchor="middle" opacity={used ? 0.45 : 1}>{t}</T>
            </Box>
          );
        })}
        <Box x={8 + 5 * 46} y={6} w={40} h={28} dash fill="transparent" stroke={st.i === 5 ? tok('brand') : tok('line')}>
          <T x={8 + 5 * 46 + 20} y={21} size={11} mono anchor="middle" fill={tok('muted')}>end</T>
        </Box>
        <T x={8 + Math.min(st.i, 5) * 46 + 20} y={44} size={11} mono anchor="middle" fill={tok('brand')} weight={700}>↑ next</T>

        <T x={8} y={62} size={11} weight={700} fill={tok('muted')}>CALL STACK (newest on top)</T>
        {st.stack.length === 0 && <T x={8} y={210} size={12} fill={tok('muted')}>empty: parsing finished</T>}
        {st.stack.map((f, k) => {
          const y = 196 - k * (FH + 4);
          const top = k === st.stack.length - 1;
          return (
            <Box key={k} x={8} y={y} w={196} h={FH} fill={top ? tok('brand', 0.14) : tok('panel')} stroke={top ? tok('brand') : tok('ink', 0.4)}>
              <T x={16} y={y + FH / 2} size={12.5} mono weight={700}>{f.fn}</T>
              <T x={78} y={y + FH / 2} size={10.5} mono fill={top ? tok('ink') : tok('muted')}>{f.doing}</T>
            </Box>
          );
        })}

        <T x={216} y={62} size={11} weight={700} fill={tok('muted')}>THE TREE SO FAR</T>
        {EDGES.map(([a, b]) => has(a) && has(b) && (
          <line key={a + b} x1={POS[a].x} y1={POS[a].y + NH / 2} x2={POS[b].x} y2={POS[b].y - NH / 2} stroke={tok('ink', 0.45)} strokeWidth={1.4} />
        ))}
        {(Object.keys(POS) as NodeId[]).map((id) => {
          const p = POS[id];
          if (!has(id)) return null;
          return (
            <Box key={id} x={p.x - NW / 2} y={p.y - NH / 2} w={NW} h={NH} r={p.op ? 14 : 5} fill={p.op ? tok('brand', 0.14) : tok('panel')} stroke={p.op ? tok('brand') : tok('ink', 0.45)}>
              <T x={p.x} y={p.y + 1} size={14} mono anchor="middle" weight={p.op ? 700 : 400}>{p.label}</T>
            </Box>
          );
        })}
        {st.result && <T x={306} y={230} size={12} mono anchor="middle" fill={tok('safe')} weight={700}>{st.result}</T>}
      </Svg>
    </StepFrame>
  );
}
