import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';
import { type PT, drawTree, layout } from './ptree';

// 1 - 2 - 3  under  E → E "-" T | T,  T → NUMBER
const n = (id: string, v: string): PT => ({ id, label: 'T', kids: [{ id: id + 'n', label: v, term: true }] });
const TREE: PT = {
  id: 'r', label: 'E', kids: [
    { id: 'a', label: 'E', kids: [
      { id: 'b', label: 'E', kids: [n('t1', '1')] },
      { id: 'm1', label: '-', term: true },
      n('t2', '2'),
    ] },
    { id: 'm2', label: '-', term: true },
    n('t3', '3'),
  ],
};
const PLACED = layout(TREE, 30, 370, 120, 34);

type S = { stack: string[]; input: string[]; act: string; shown: string[]; note: string };
const IN = ['1', '-', '2', '-', '3', '$'];
const STATES: S[] = [
  { stack: [], input: IN, act: 'start', shown: [], note: 'The stack is empty and the whole input is waiting. Nothing has been built: bottom-up parsing starts from the tokens, not from the start symbol.' },
  { stack: ['1'], input: IN.slice(1), act: 'shift', shown: ['t1n'], note: 'Shift: move the next token, 1, from the input onto the stack. It becomes a leaf of the tree.' },
  { stack: ['T'], input: IN.slice(1), act: 'reduce T → NUMBER', shown: ['t1n', 't1'], note: 'The top of the stack, a NUMBER, is the whole body of T → NUMBER. Reduce: replace it with the head, T. A new node grows above the leaf.' },
  { stack: ['E'], input: IN.slice(1), act: 'reduce E → T', shown: ['t1n', 't1', 'b'], note: 'T on its own is the body of E → T: reduce again. The first number is now a finished E.' },
  { stack: ['E', '-'], input: IN.slice(2), act: 'shift', shown: ['t1n', 't1', 'b', 'm1'], note: 'No rule body ends here yet that we want, so shift the -.' },
  { stack: ['E', '-', '2'], input: IN.slice(3), act: 'shift', shown: ['t1n', 't1', 'b', 'm1', 't2n'], note: 'Shift the 2.' },
  { stack: ['E', '-', 'T'], input: IN.slice(3), act: 'reduce T → NUMBER', shown: ['t1n', 't1', 'b', 'm1', 't2n', 't2'], note: 'Reduce the 2 to a T.' },
  { stack: ['E'], input: IN.slice(3), act: 'reduce E → E - T', shown: ['t1n', 't1', 'b', 'm1', 't2n', 't2', 'a'], note: 'The top three symbols, E - T, are the whole body of E → E "-" T: reduce them to one E. This is the left-recursive rule, used with no trouble at all, and it has grouped 1 - 2 first.' },
  { stack: ['E', '-'], input: IN.slice(4), act: 'shift', shown: ['t1n', 't1', 'b', 'm1', 't2n', 't2', 'a', 'm2'], note: 'Shift the second -.' },
  { stack: ['E', '-', '3'], input: IN.slice(5), act: 'shift', shown: ['t1n', 't1', 'b', 'm1', 't2n', 't2', 'a', 'm2', 't3n'], note: 'Shift the 3.' },
  { stack: ['E', '-', 'T'], input: IN.slice(5), act: 'reduce T → NUMBER', shown: ['t1n', 't1', 'b', 'm1', 't2n', 't2', 'a', 'm2', 't3n', 't3'], note: 'Reduce the 3 to a T.' },
  { stack: ['E'], input: IN.slice(5), act: 'reduce E → E - T', shown: ['t1n', 't1', 'b', 'm1', 't2n', 't2', 'a', 'm2', 't3n', 't3', 'r'], note: 'Reduce E - T to E once more. The root is built last.' },
  { stack: ['E'], input: ['$'], act: 'accept', shown: ['t1n', 't1', 'b', 'm1', 't2n', 't2', 'a', 'm2', 't3n', 't3', 'r'], note: 'The stack holds just the start symbol and the input is used up: accept. The tree reads (1 - 2) - 3, leaning left, as subtraction should.' },
];

function Chips({ xs, y, hiFirst }: { xs: string[]; y: number; hiFirst?: boolean }) {
  let x = 8;
  return (
    <g>
      {xs.map((s, i) => {
        const w = Math.max(24, s.length * 7.6 + 12);
        const nt = s === 'E' || s === 'T';
        const el = (
          <Box key={i} x={x} y={y} w={w} h={24} r={nt ? 11 : 3} fill={hiFirst && i === 0 ? tok('brand', 0.22) : nt ? tok('brand', 0.08) : tok('panel')} stroke={nt ? tok('brand', 0.6) : tok('ink', 0.4)}>
            <T x={x + w / 2} y={y + 12.5} size={12} mono anchor="middle" weight={nt ? 700 : 400}>{s}</T>
          </Box>
        );
        x += w + 4;
        return el;
      })}
    </g>
  );
}

export default function ShiftReduceSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Shift and reduce: 1 - 2 - 3" steps={s} note={st.note}>
      <Svg w={400} h={268} title="The stack (bottom at the left), the remaining input, the action just taken, and the parse tree growing from its leaves upwards.">
        <T x={8} y={10} size={11} weight={700} fill={tok('muted')}>STACK (top at the right)</T>
        <Chips xs={st.stack.length ? st.stack : []} y={18} />
        {!st.stack.length && <T x={12} y={30} size={12} fill={tok('muted')}>empty</T>}
        <T x={210} y={10} size={11} weight={700} fill={tok('muted')}>INPUT</T>
        <g transform="translate(202,0)"><Chips xs={st.input} y={18} hiFirst /></g>
        <T x={8} y={60} size={11} weight={700} fill={tok('muted')}>ACTION</T>
        <T x={66} y={60} size={13} mono weight={700} fill={tok('brand')}>{st.act}</T>
        {drawTree(PLACED, new Set(st.shown))}
      </Svg>
    </StepFrame>
  );
}
