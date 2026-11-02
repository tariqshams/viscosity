import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const CODE = `function pratt(minBp) {
  let left = prefix();
  for (;;) {
    const bp = BP[peek().type];
    if (!bp || bp <= minBp) break;
    const op = advance();
    left = infix(left, op, bp);
  }
  return left;
}
// infix: { left, op, right: pratt(bp) }`;

const TOKS = ['1', '+', '2', '*', '3', '-', '4', 'end'];
const TBP: (number | null)[] = [null, 5, null, 6, null, 5, null, null];

type Id = 'n1' | 'n2' | 'n3' | 'n4' | 'mul' | 'add' | 'sub';
const NODES: Record<Id, { x: number; y: number; label: string; kids?: Id[] }> = {
  sub: { x: 250, y: 22, label: '-', kids: ['add', 'n4'] },
  add: { x: 160, y: 66, label: '+', kids: ['n1', 'mul'] },
  n4: { x: 330, y: 66, label: '4' },
  n1: { x: 100, y: 110, label: '1' },
  mul: { x: 220, y: 110, label: '*', kids: ['n2', 'n3'] },
  n2: { x: 180, y: 154, label: '2' },
  n3: { x: 260, y: 154, label: '3' },
};

type Fr = { minBp: number; left: string | null };
type Check = { t: string; bp: number | null; minBp: number; take: boolean };
type S = { line: number; cur: number; frames: Fr[]; check?: Check; nodes: Id[]; note: string };

const A = (left: string | null): Fr => ({ minBp: 0, left });
const B = (left: string | null): Fr => ({ minBp: 5, left });
const C = (left: string | null): Fr => ({ minBp: 6, left });

const STATES: S[] = [
  { line: 0, cur: 0, frames: [A(null)], nodes: [], note: 'The parser calls pratt(0). A minBp of 0 means “no operator is too weak for me”: this call will take every operator it meets.' },
  { line: 1, cur: 1, frames: [A('1')], nodes: ['n1'], note: 'prefix() reads the number 1. That is the left operand so far.' },
  { line: 4, cur: 1, frames: [A('1')], check: { t: '+', bp: 5, minBp: 0, take: true }, nodes: ['n1'], note: 'Peek at the next token: +. Its binding power 5 is bigger than minBp 0, so this loop takes it.' },
  { line: 6, cur: 2, frames: [A('1'), B(null)], nodes: ['n1'], note: 'advance() eats the +. To build its node, infix needs a right operand, so it calls pratt(5). That call will only take operators stronger than +.' },
  { line: 1, cur: 3, frames: [A('1'), B('2')], nodes: ['n1', 'n2'], note: 'Inside pratt(5), prefix() reads 2. Now the question is: does 2 belong to the + or to whatever comes next?' },
  { line: 4, cur: 3, frames: [A('1'), B('2')], check: { t: '*', bp: 6, minBp: 5, take: true }, nodes: ['n1', 'n2'], note: 'Next is *, with binding power 6. 6 > 5: the * pulls harder than the +, so the 2 goes to the *.' },
  { line: 6, cur: 4, frames: [A('1'), B('2'), C(null)], nodes: ['n1', 'n2'], note: 'Eat the *, and call pratt(6) for its right operand. The stack of calls now remembers three unfinished jobs.' },
  { line: 1, cur: 5, frames: [A('1'), B('2'), C('3')], nodes: ['n1', 'n2', 'n3'], note: 'prefix() reads 3.' },
  { line: 4, cur: 5, frames: [A('1'), B('2'), C('3')], check: { t: '-', bp: 5, minBp: 6, take: false }, nodes: ['n1', 'n2', 'n3'], note: 'Next is -, binding power 5. That is not bigger than 6, so pratt(6) stops and returns just 3. It does not eat the -: it leaves it for a caller.' },
  { line: 6, cur: 5, frames: [A('1'), B('(* 2 3)')], nodes: ['n1', 'n2', 'n3', 'mul'], note: 'Back in pratt(5), infix gets its right side and builds the node (* 2 3). That whole subtree is now its left.' },
  { line: 4, cur: 5, frames: [A('1'), B('(* 2 3)')], check: { t: '-', bp: 5, minBp: 5, take: false }, nodes: ['n1', 'n2', 'n3', 'mul'], note: 'pratt(5) peeks at the same -. 5 <= 5: equal is not enough. Return (* 2 3). This “equal stops” rule is what groups 1 + 2 - … to the left.' },
  { line: 6, cur: 5, frames: [A('(+ 1 (* 2 3))')], nodes: ['n1', 'n2', 'n3', 'mul', 'add'], note: 'Back at the top, infix builds (+ 1 (* 2 3)). The + finally has both operands.' },
  { line: 4, cur: 5, frames: [A('(+ 1 (* 2 3))')], check: { t: '-', bp: 5, minBp: 0, take: true }, nodes: ['n1', 'n2', 'n3', 'mul', 'add'], note: 'The top loop peeks at the - for the third time. 5 > 0, so this loop takes it. The whole tree so far becomes the left operand of -.' },
  { line: 6, cur: 6, frames: [A('(+ 1 (* 2 3))'), B(null)], nodes: ['n1', 'n2', 'n3', 'mul', 'add'], note: 'Eat the -, and call pratt(5) for its right side.' },
  { line: 1, cur: 7, frames: [A('(+ 1 (* 2 3))'), B('4')], nodes: ['n1', 'n2', 'n3', 'mul', 'add', 'n4'], note: 'prefix() reads 4.' },
  { line: 4, cur: 7, frames: [A('(+ 1 (* 2 3))'), B('4')], check: { t: 'end', bp: null, minBp: 5, take: false }, nodes: ['n1', 'n2', 'n3', 'mul', 'add', 'n4'], note: 'The next token is the end of the input. It is not an operator, so it has no binding power. Return 4.' },
  { line: 6, cur: 7, frames: [A('(- (+ 1 (* 2 3)) 4)')], nodes: ['n1', 'n2', 'n3', 'mul', 'add', 'n4', 'sub'], note: 'The top loop builds (- (+ 1 (* 2 3)) 4).' },
  { line: 8, cur: 7, frames: [A('(- (+ 1 (* 2 3)) 4)')], check: { t: 'end', bp: null, minBp: 0, take: false }, nodes: ['n1', 'n2', 'n3', 'mul', 'add', 'n4', 'sub'], note: 'End of input again: break and return the finished tree. Every comparison was “is the next operator stronger than mine?”. Evaluated, it is 1 + 6 - 4 = 3.' },
];

export default function PrattSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const newest = st.nodes[st.nodes.length - 1];
  const FH = 26;
  const TY = 186;
  return (
    <StepFrame title="The Pratt loop on 1 + 2 * 3 - 4" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={376} title="Parsing 1 + 2 * 3 - 4 with the Pratt loop: the tokens, the stack of pratt calls with their minBp, the binding-power comparison, and the tree as it forms.">
        {TOKS.map((t, k) => {
          const x = 16 + k * 46;
          const done = k < st.cur;
          const peek = st.check && k === st.cur;
          return (
            <g key={k} opacity={done ? 0.4 : 1}>
              <Box x={x} y={4} w={40} h={28} fill={peek ? tok('brand', 0.16) : tok('panel')} stroke={peek ? tok('brand') : tok('ink', 0.4)}>
                <T x={x + 20} y={18} size={t === 'end' ? 11 : 15} mono anchor="middle" weight={peek ? 700 : 400}>{t}</T>
              </Box>
              {TBP[k] !== null && <T x={x + 20} y={42} size={10.5} mono anchor="middle" fill={tok('accent')}>bp {TBP[k]}</T>}
            </g>
          );
        })}
        {st.cur < TOKS.length && <T x={16 + st.cur * 46 + 20} y={54} size={10} anchor="middle" fill={tok('muted')}>next</T>}

        <T x={8} y={68} size={11} weight={700} fill={tok('muted')}>CALLS OF pratt (newest at the bottom)</T>
        {st.frames.map((f, k) => {
          const y = 78 + k * (FH + 4);
          const active = k === st.frames.length - 1;
          return (
            <Box key={k} x={8 + k * 10} y={y} w={384 - k * 10} h={FH} fill={active ? tok('brand', 0.12) : 'transparent'} stroke={active ? tok('brand') : tok('ink', 0.35)}>
              <T x={16 + k * 10} y={y + FH / 2} size={12} mono weight={active ? 700 : 400}>pratt(minBp {f.minBp})</T>
              <T x={384} y={y + FH / 2} size={12} mono anchor="end" fill={f.left ? tok('ink') : tok('muted')}>left = {f.left ?? '…'}</T>
            </Box>
          );
        })}

        {st.check && (
          <Box x={8} y={TY - 20} w={384} h={26} fill={st.check.take ? tok('safe', 0.12) : tok('danger', 0.1)} stroke={st.check.take ? tok('safe') : tok('danger')}>
            <T x={200} y={TY - 7} size={12.5} mono anchor="middle" weight={700}>
              {st.check.bp === null
                ? `peek end: no bp → return`
                : st.check.take
                  ? `peek '${st.check.t}': bp ${st.check.bp} > ${st.check.minBp} → take it`
                  : `peek '${st.check.t}': bp ${st.check.bp} ≤ ${st.check.minBp} → return`}
            </T>
          </Box>
        )}

        <g transform={`translate(0, ${TY + 14})`}>
          <T x={8} y={4} size={11} weight={700} fill={tok('muted')}>THE TREE SO FAR</T>
          {(Object.keys(NODES) as Id[]).map((id) => {
            const n = NODES[id];
            if (!st.nodes.includes(id) || !n.kids) return null;
            return n.kids.map((c) => (
              <line key={`${id}-${c}`} x1={n.x} y1={n.y} x2={NODES[c].x} y2={NODES[c].y} stroke={tok('ink', 0.5)} strokeWidth={1.5} />
            ));
          })}
          {(Object.keys(NODES) as Id[]).map((id) => {
            const n = NODES[id];
            const on = st.nodes.includes(id);
            const op = !!n.kids;
            const isNew = id === newest;
            return (
              <g key={id} opacity={on ? 1 : 0.12}>
                <circle cx={n.x} cy={n.y} r={15} fill={tok('paper')} />
                <circle cx={n.x} cy={n.y} r={15} fill={isNew ? tok('brand', 0.22) : op ? tok('brand', 0.08) : tok('panel')} stroke={isNew ? tok('brand') : on ? tok('ink', 0.6) : tok('ink', 0.4)} strokeWidth={isNew ? 2.5 : 1.5} strokeDasharray={on ? undefined : '4 3'} />
                <T x={n.x} y={n.y + 1} size={15} mono anchor="middle" weight={op ? 700 : 400} fill={op ? tok('brand') : tok('ink')}>{n.label}</T>
              </g>
            );
          })}
        </g>
      </Svg>
    </StepFrame>
  );
}
