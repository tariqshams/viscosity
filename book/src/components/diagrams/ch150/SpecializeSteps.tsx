// Chapter 150: one self-specializing + node over a run of calls, modelled
// on GraalJS's JSAddNode / JSAddNormalNode (an int case using
// Math.addExact with rewriteOn = ArithmeticException, a double case, and a
// generic case that converts its operands and replaces the others) and on
// Truffle's Specialization docs (rewriteOn: once thrown, that case is never
// used again by this node). States only move to the right.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

type St = 'uninit' | 'int' | 'double' | 'generic';
const ORDER: St[] = ['uninit', 'int', 'double', 'generic'];
type S = { call: string; result: string; state: St; banned: St[]; check: string; note: string };

const STATES: S[] = [
  { call: '(not run yet)', result: '', state: 'uninit', banned: [], check: 'none yet', note: 'A fresh + node in the tree. It has seen nothing, so it has no fast case yet; the first execution will decide.' },
  { call: 'add(1, 2)', result: '3', state: 'int', banned: [], check: 'both int32? no overflow?', note: 'Both values are small integers, so the node specializes to its int case. From now on it runs a short path: check both are int32, add, check for overflow.' },
  { call: 'add(40, 2)', result: '42', state: 'int', banned: [], check: 'both int32? no overflow?', note: 'Same kind of values: the checks pass and the fast path runs. Nothing changes. This is the common case the specialization is for.' },
  { call: 'add(2147483647, 1)', result: '2147483648', state: 'double', banned: ['int'], check: 'both numbers?', note: 'The sum does not fit in 32 bits, so Math.addExact throws. Because of rewriteOn, this node drops its int case for good, and the double case gives the right answer.' },
  { call: 'add(5, 6)', result: '11', state: 'double', banned: ['int'], check: 'both numbers?', note: 'Integers again, but the node stays double. Going back would let it flip between states for ever, and each flip would throw away any compiled code built on the old one.' },
  { call: "add('a', 1)", result: "'a1'", state: 'generic', banned: ['int', 'double'], check: 'none: full JS +', note: 'A string. No number case applies, so the generic case takes over, converting its operands as JavaScript’s + requires, and it replaces the specific cases. The node is now as slow as a plain interpreter, but always right.' },
];

export default function SpecializeSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const at = ORDER.indexOf(st.state);
  return (
    <StepFrame title="A + node learning from its calls" steps={s} note={st.note}>
      <Svg w={400} h={208} title="The states of one + node: uninit, int, double, generic, with the current state highlighted">
        <T x={6} y={12} size={11} weight={700} fill={tok('muted')}>CALL</T>
        <T x={60} y={12} size={13} mono weight={700}>{st.call}</T>
        {st.result && <T x={394} y={12} size={13} mono anchor="end" fill={tok('safe')}>{'→ ' + st.result}</T>}
        <T x={6} y={44} size={11} weight={700} fill={tok('muted')}>STATE OF THE NODE</T>
        {ORDER.map((name, k) => {
          const x = 6 + k * 98;
          const on = k === at;
          const banned = st.banned.includes(name);
          const passed = k < at;
          const c = on ? 'brand' : banned ? 'danger' : 'line';
          return (
            <g key={name}>
              <Box x={x} y={56} w={90} h={44} fill={on ? tok('brand', 0.18) : 'transparent'} stroke={tok(c)} dash={!on}>
                <T x={x + 45} y={73} size={13} weight={on ? 700 : 400} anchor="middle" opacity={passed && !banned ? 0.5 : 1}>{name}</T>
                <T x={x + 45} y={90} size={11} anchor="middle" fill={banned ? tok('danger') : tok('muted')}>{banned ? 'never again' : on ? 'active' : passed ? 'left behind' : ''}</T>
              </Box>
              {k < 3 && <T x={x + 94} y={78} size={13} anchor="middle" fill={tok('muted')}>›</T>}
            </g>
          );
        })}
        <T x={6} y={126} size={11} weight={700} fill={tok('muted')}>CHECKS ON EACH CALL</T>
        <T x={6} y={146} size={12} mono>{st.check}</T>
        <T x={6} y={176} size={11} weight={700} fill={tok('muted')}>STATES ONLY MOVE RIGHT</T>
        <T x={6} y={196} size={12}>fast and guarded  ›  slower, always right</T>
      </Svg>
    </StepFrame>
  );
}
