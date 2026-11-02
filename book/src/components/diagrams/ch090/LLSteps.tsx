import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// Table-driven parse of  print 1 + 2 ;  with the adding grammar's LL(1) table.
type S = { stack: string[]; input: string[]; act: string; note: string };
const IN = ['print', 'NUMBER', '+', 'NUMBER', ';', '$'];
const NT = new Set(['stmt', 'expr', 'rest', 'item']);

// stack is written top first
const STATES: S[] = [
  { stack: ['stmt', '$'], input: IN, act: 'start', note: 'The stack starts with the start symbol on top of $, the end marker. The input is the token row, also ending in $.' },
  { stack: ['print', 'expr', ';', '$'], input: IN, act: 'stmt → print expr ;', note: 'A nonterminal, stmt, is on top. Look up the cell [stmt, print]: it says stmt → "print" expr ";". Pop stmt and push the body, so its first symbol is on top.' },
  { stack: ['expr', ';', '$'], input: IN.slice(1), act: 'match print', note: 'A terminal is on top, and it is the same as the next token, print. Pop it and move past the token: matched.' },
  { stack: ['item', 'rest', ';', '$'], input: IN.slice(1), act: 'expr → item rest', note: 'expr on top, NUMBER next. The cell [expr, NUMBER] says expr → item rest.' },
  { stack: ['NUMBER', 'rest', ';', '$'], input: IN.slice(1), act: 'item → NUMBER', note: 'The cell [item, NUMBER] says item → NUMBER.' },
  { stack: ['rest', ';', '$'], input: IN.slice(2), act: 'match NUMBER', note: 'Match the 1.' },
  { stack: ['+', 'item', 'rest', ';', '$'], input: IN.slice(2), act: 'rest → + item rest', note: 'rest on top, + next: the cell [rest, +] says rest → "+" item rest, the rule that takes one more "+ item".' },
  { stack: ['item', 'rest', ';', '$'], input: IN.slice(3), act: 'match +', note: 'Match the +.' },
  { stack: ['NUMBER', 'rest', ';', '$'], input: IN.slice(3), act: 'item → NUMBER', note: 'item → NUMBER again, for the 2.' },
  { stack: ['rest', ';', '$'], input: IN.slice(4), act: 'match NUMBER', note: 'Match the 2.' },
  { stack: [';', '$'], input: IN.slice(4), act: 'rest → ε', note: 'rest on top, ; next. ; is in FOLLOW(rest), so the cell [rest, ;] says rest → ε: pop rest and push nothing.' },
  { stack: ['$'], input: IN.slice(5), act: 'match ;', note: 'Match the ;.' },
  { stack: ['$'], input: IN.slice(5), act: 'accept', note: 'Only $ is left on the stack and in the input: the tokens are accepted. The rules used, in order, are exactly the leftmost derivation of print 1 + 2 ;.' },
];

function Chips({ xs, y, top }: { xs: string[]; y: number; top?: boolean }) {
  let x = 8;
  return (
    <g>
      {xs.map((s, i) => {
        const w = Math.max(24, s.length * 7.6 + 12);
        const nt = NT.has(s);
        const hi = top && i === 0;
        const el = (
          <Box key={i} x={x} y={y} w={w} h={26} r={nt ? 12 : 3} fill={hi ? tok('brand', 0.25) : nt ? tok('brand', 0.08) : tok('panel')} stroke={hi ? tok('brand') : nt ? tok('brand', 0.6) : tok('ink', 0.4)}>
            <T x={x + w / 2} y={y + 13.5} size={12} mono anchor="middle" weight={nt ? 700 : 400}>{s}</T>
          </Box>
        );
        x += w + 4;
        return el;
      })}
    </g>
  );
}

export default function LLSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="A table-driven parse of print 1 + 2 ;" steps={s} note={st.note}>
      <Svg w={400} h={150} title="The parser's stack, with its top at the left, the remaining input, and the action just taken.">
        <T x={8} y={10} size={11} weight={700} fill={tok('muted')}>STACK (top at the left)</T>
        <Chips xs={st.stack} y={20} top />
        <T x={8} y={64} size={11} weight={700} fill={tok('muted')}>INPUT (next token at the left)</T>
        <Chips xs={st.input} y={74} top />
        <T x={8} y={122} size={11} weight={700} fill={tok('muted')}>ACTION</T>
        <T x={70} y={122} size={13} mono weight={700} fill={tok('brand')}>{st.act}</T>
      </Svg>
    </StepFrame>
  );
}
