import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 283: reference counts changing as a program runs. Every new
// reference adds one, every reference that goes away subtracts one, and
// an object whose count reaches zero is freed at once, which may free the
// objects it points to.
const CODE = `let a = new Node('A');
let b = a;
a.next = new Node('B');
b = null;
a = null;`;

type O = { rc: number; freed?: boolean };
type S = { line: number; a: boolean; b: boolean; A?: O; B?: O; edge: boolean; note: string };

const STATES: S[] = [
  { line: 0, a: true, b: false, A: { rc: 1 }, edge: false, note: 'A new object A is made and stored in a: one reference, so its count is 1.' },
  { line: 1, a: true, b: true, A: { rc: 2 }, edge: false, note: 'b = a copies the reference. Nothing new is made, but A now has two references, so its count goes up to 2.' },
  { line: 2, a: true, b: true, A: { rc: 2 }, B: { rc: 1 }, edge: true, note: 'B is made and stored in A’s field next. References from other objects count too: B’s count is 1.' },
  { line: 3, a: true, b: false, A: { rc: 1 }, B: { rc: 1 }, edge: true, note: 'b = null drops one reference to A: 2 becomes 1. A is still in use (through a), so nothing is freed.' },
  { line: 4, a: false, b: false, A: { rc: 0, freed: true }, B: { rc: 1 }, edge: true, note: 'a = null drops the last reference to A. Its count reaches 0, so A is freed now, not at some later collection.' },
  { line: 4, a: false, b: false, A: { rc: 0, freed: true }, B: { rc: 0, freed: true }, edge: false, note: 'Freeing A drops the references A held, including next: B’s count reaches 0 and B is freed too. One assignment can free a whole structure.' },
];

export default function CountSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const obj = (x: number, name: string, o?: O) => (
    <Box x={x} y={30} w={110} h={56} dash={!o || o.freed} opacity={o?.freed ? 0.55 : 1}
      fill={!o ? 'transparent' : o.freed ? tok('f6', 0.1) : tok('f3', 0.14)} stroke={!o ? tok('line') : o.freed ? tok('f6') : tok('f3')}>
      <T x={x + 10} y={48} size={12} mono weight={700}>{o ? name : ''}</T>
      <T x={x + 10} y={70} size={12} mono>{o ? (o.freed ? 'freed' : `count = ${o.rc}`) : ''}</T>
    </Box>
  );
  const v = (y: number, name: string, on: boolean) => (
    <Box x={6} y={y} w={70} h={28} fill={tok('panel')}>
      <T x={16} y={y + 14} size={12} mono>{`${name} = ${on ? '●' : 'null'}`}</T>
    </Box>
  );
  return (
    <StepFrame title="Counting references" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={104} title="The variables a and b, and the objects A and B with their reference counts">
        <T x={6} y={12} size={11} weight={700} fill={tok('muted')}>VARIABLES</T>
        {v(28, 'a', st.a)}
        {v(64, 'b', st.b)}
        <T x={140} y={12} size={11} weight={700} fill={tok('muted')}>HEAP</T>
        {obj(140, 'A', st.A)}
        {obj(284, 'B', st.B)}
        {st.a && <Arrow x1={76} y1={42} x2={138} y2={50} />}
        {st.b && <Arrow x1={76} y1={78} x2={138} y2={70} />}
        {st.edge && <Arrow x1={250} y1={58} x2={282} y2={58} />}
        {st.edge && <T x={254} y={50} size={11} mono fill={tok('muted')}>next</T>}
      </Svg>
    </StepFrame>
  );
}
