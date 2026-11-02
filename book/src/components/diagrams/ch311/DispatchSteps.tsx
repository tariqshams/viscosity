import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 311: how Python 3.13 runs a + b for objects (the data model's
// rule): try type(a).__add__(a, b); if that is missing or returns
// NotImplemented, try type(b).__radd__(b, a); if that fails too, raise
// TypeError. The three runs are real: V(1) + V(2), 5 + V(1), V(1) + 'a'.
type K = 'idle' | 'on' | 'no' | 'yes';
type S = { expr: string; add: K; radd: K; err: K; res?: string; note: string };

const STATES: S[] = [
  { expr: 'V(1) + V(2)', add: 'idle', radd: 'idle', err: 'idle', note: 'The bytecode for a + b is one instruction, BINARY_OP (+). What it does is decided at run time, by the types of the two values.' },
  { expr: 'V(1) + V(2)', add: 'yes', radd: 'idle', err: 'idle', res: 'V(3)', note: 'First, the left operand’s type: V has __add__, which accepts another V and returns V(3). Done.' },
  { expr: '5 + V(1)', add: 'no', radd: 'idle', err: 'idle', note: 'Now 5 + V(1). int’s __add__ does not know what a V is, so it returns the special value NotImplemented: "not me, ask the other side".' },
  { expr: '5 + V(1)', add: 'no', radd: 'yes', err: 'idle', res: 'V(6)', note: 'So Python tries the right operand’s reflected method, V.__radd__(V(1), 5), which handles a number on its left: V(6).' },
  { expr: "V(1) + 'a'", add: 'no', radd: 'idle', err: 'idle', note: 'V(1) + \'a\': this time V.__add__ checks its argument, finds a string, and returns NotImplemented.' },
  { expr: "V(1) + 'a'", add: 'no', radd: 'no', err: 'yes', note: 'str has no __radd__ that accepts a V, so both sides declined: TypeError: unsupported operand type(s) for +: \'V\' and \'str\'.' },
];

export default function DispatchSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const col = (k: K) => (k === 'yes' ? 'f3' : k === 'no' ? 'f6' : 'line');
  const box = (y: number, k: K, title: string, sub: string) => (
    <Box x={110} y={y} w={280} h={40} fill={k === 'idle' ? tok('panel') : tok(col(k), 0.14)} stroke={tok(col(k))}>
      <T x={122} y={y + 14} size={12} mono>{title}</T>
      <T x={122} y={y + 30} size={11} fill={tok('muted')}>{sub}</T>
    </Box>
  );
  const tag = (y: number, k: K) => k === 'idle' ? null : (
    <T x={98} y={y + 20} size={12} anchor="end" weight={700} fill={tok(col(k))}>{k === 'yes' ? 'used' : 'declined'}</T>
  );
  return (
    <StepFrame title="Python’s rule for a + b" steps={s} note={st.note}>
      <Svg w={400} h={210} title="The three places Python looks for a + b: the left type's __add__, the right type's __radd__, then a TypeError">
        <T x={10} y={16} size={13} mono weight={700}>{st.expr}</T>
        {st.res && <T x={390} y={16} size={13} mono anchor="end" fill={tok('f3')}>{`= ${st.res}`}</T>}
        {box(34, st.add, 'type(a).__add__(a, b)', 'the left operand first')}
        {tag(34, st.add)}
        <Arrow x1={250} y1={76} x2={250} y2={96} />
        {box(98, st.radd, 'type(b).__radd__(b, a)', 'if that was NotImplemented')}
        {tag(98, st.radd)}
        <Arrow x1={250} y1={140} x2={250} y2={160} />
        {box(162, st.err === 'yes' ? 'no' : 'idle', 'raise TypeError', 'if both declined')}
      </Svg>
    </StepFrame>
  );
}
