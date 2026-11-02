// Chapter 276: a bound method made and called in drip-rs, for
//   let t = c.taste;   // line 7 of the Cake program
//   t();               // line 8
// The opcodes are the real `drip-rs --disassemble` listing of chapter
// 161's Cake program (GET_GLOBAL 12 'c', GET_PROPERTY 13 'taste',
// DEFINE_GLOBAL 11 't', GET_GLOBAL 14 't', CALL 0). The steps follow
// Vm::bind_method and the BoundMethod arm of Vm::call_value in src/vm.rs:
// look the method up, allocate while the receiver is still on the stack,
// then pop and push; on the call, copy both fields out and overwrite the
// callee's slot with the receiver.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

type Cell = { v: string; kind?: 'bound' | 'inst' | 'fn' };
type S = {
  op: string;
  stack: Cell[];
  hot?: number;
  bound: boolean;
  boundHot?: boolean;
  frame?: boolean;
  root?: boolean;
  note: string;
};

const SCRIPT: Cell = { v: '<script>', kind: 'fn' };
const C: Cell = { v: 'c: Cake instance', kind: 'inst' };
const B: Cell = { v: 'BoundMethod(0)', kind: 'bound' };

const STATES: S[] = [
  {
    op: "GET_GLOBAL 'c'",
    stack: [SCRIPT, C],
    hot: 1,
    bound: false,
    note: 'let t = c.taste; starts by pushing c. Slot 0 is the script’s own closure. No call has happened yet.',
  },
  {
    op: "GET_PROPERTY 'taste'",
    stack: [SCRIPT, C],
    hot: 1,
    bound: false,
    note: 'c has no field called taste, so the arm calls bind_method(class, name). It looks taste up in the class’s methods table and gets a Value::Closure back.',
  },
  {
    op: 'bind_method: alloc',
    stack: [SCRIPT, C],
    hot: 1,
    bound: true,
    boundHot: true,
    root: true,
    note: 'The bound method is allocated in its arena while c is still on the stack. If this allocation starts a collection, the stack is a root, so c survives. Only then does the VM pop c.',
  },
  {
    op: 'bind_method: pop, push',
    stack: [SCRIPT, B],
    hot: 1,
    bound: true,
    note: 'c is replaced by Value::BoundMethod, a 4-byte handle into the bound_methods arena. The receiver lives on inside the object.',
  },
  {
    op: "DEFINE_GLOBAL 't', GET_GLOBAL 't'",
    stack: [SCRIPT, B],
    hot: 1,
    bound: true,
    note: 't keeps the handle in the globals table. Line 8, t(), pushes it back. The bound method is now the callee, with no arguments above it.',
  },
  {
    op: 'CALL 0: copy the fields',
    stack: [SCRIPT, B],
    hot: 1,
    bound: true,
    boundHot: true,
    note: 'call_value matches Value::BoundMethod and destructures self.heap[bound]. Both fields are Copy, so this copies them out; the object stays where it is.',
  },
  {
    op: 'CALL 0: set_peek(0, receiver)',
    stack: [SCRIPT, C],
    hot: 1,
    bound: true,
    note: 'The callee’s slot, argc places below the top, is overwritten with the receiver. That slot is about to become slot 0 of the new frame.',
  },
  {
    op: 'call(method, 0)',
    stack: [SCRIPT, C],
    hot: 1,
    bound: true,
    frame: true,
    note: 'call pushes taste’s frame with slots = 1. Inside taste, GET_LOCAL 0 is this, and it is c. That is all a bound method does: it puts the right this in slot 0.',
  },
];

function fillFor(c: Cell, hot: boolean) {
  if (hot) return tok('brand', 0.16);
  if (c.kind === 'bound') return tok('accent', 0.14);
  return tok('panel');
}

export default function BoundSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Making and calling a bound method" steps={s} note={st.note}>
      <Svg w={400} h={236} title="The value stack beside the bound-method arena, while t = c.taste and t() run">
        <T x={8} y={12} size={12} mono weight={700}>{st.op}</T>
        <T x={8} y={36} size={10} mono weight={700} fill={tok('muted')}>stack</T>
        {st.stack.map((c, i) => {
          const y = 46 + i * 34;
          const hot = st.hot === i;
          return (
            <Box key={i} x={8} y={y} w={176} h={28} r={3} fill={fillFor(c, hot)} stroke={hot ? tok('brand') : tok('line')}>
              <T x={16} y={y + 14} size={10} mono fill={tok('muted')}>{i}</T>
              <T x={32} y={y + 14} size={11} mono weight={700} fill={tok('ink')}>{c.v}</T>
            </Box>
          );
        })}
        {st.root && (
          <T x={8} y={124} size={9} fill={tok('safe')}>the stack is a root: c is safe</T>
        )}
        {st.frame && (
          <g>
            <Box x={8} y={140} w={176} h={50} r={4} fill={tok('safe', 0.1)} stroke={tok('safe')}>
              <T x={16} y={154} size={10} mono weight={700} fill={tok('safe')}>frame: taste</T>
              <T x={16} y={172} size={10} mono fill={tok('ink')}>slots = 1 (slot 0 = this)</T>
            </Box>
            <Arrow x1={96} y1={140} x2={96} y2={110} color={tok('safe')} />
          </g>
        )}
        <T x={212} y={36} size={10} mono weight={700} fill={tok('muted')}>heap.bound_methods</T>
        <Box x={212} y={46} w={180} h={86} r={4} fill={tok('panel')} stroke={st.boundHot ? tok('accent') : tok('line')} dash={!st.bound}>
          {st.bound ? (
            <g>
              <T x={222} y={62} size={10} mono fill={tok('muted')}>slot 0: ObjBoundMethod</T>
              <T x={222} y={84} size={11} mono fill={tok('ink')}>receiver: c</T>
              <T x={222} y={106} size={11} mono fill={tok('ink')}>method: Gc(taste)</T>
            </g>
          ) : (
            <T x={302} y={89} size={10} anchor="middle" fill={tok('muted')}>empty</T>
          )}
        </Box>
        {st.bound && st.stack[1].kind === 'bound' && (
          <Arrow x1={184} y1={94} x2={212} y2={90} color={tok('accent')} />
        )}
        <T x={212} y={150} size={10} mono weight={700} fill={tok('muted')}>class Cake: methods</T>
        <Box x={212} y={160} w={180} h={50} r={4} fill={tok('panel')} stroke={tok('line')}>
          <T x={222} y={176} size={11} mono fill={tok('ink')}>init → Closure</T>
          <T x={222} y={196} size={11} mono fill={tok('ink')}>taste → Closure</T>
        </Box>
        <T x={8} y={226} size={9} fill={tok('muted')}>A Value is a tag plus a handle; the objects live in arenas.</T>
      </Svg>
    </StepFrame>
  );
}
