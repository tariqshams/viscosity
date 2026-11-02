// Chapter 231-b: sequentialising the parallel copy (a, b, c, d) := (b, c, a, a).
// Arrows go from a source register to the register it is copied into.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const POS: Record<string, [number, number]> = { a: [150, 40], b: [270, 40], c: [210, 140], d: [40, 140], t: [330, 140] };
type Move = [string, string]; // [dst, src]
type S = { moves: Move[]; vals: Record<string, string>; out: string[]; hot: string | null; note: string };
const START = { a: '1', b: '2', c: '3', d: '4', t: '–' };
const STATES: S[] = [
  { moves: [['a', 'b'], ['b', 'c'], ['c', 'a'], ['d', 'a']], vals: START, out: [], hot: null, note: 'The parallel copy (a, b, c, d) := (b, c, a, a): afterwards a should hold 2, b 3, c 1 and d 1. Each arrow is one pending copy, from its source to its destination.' },
  { moves: [['a', 'b'], ['b', 'c'], ['c', 'a']], vals: { ...START, d: '1' }, out: ['d = a'], hot: 'd', note: 'Look for a copy whose destination no pending copy still reads. Nobody reads d, so d = a is safe to do now: overwriting d destroys nothing anyone needs.' },
  { moves: [['a', 'b'], ['b', 'c'], ['c', 't']], vals: { ...START, d: '1', t: '1' }, out: ['d = a', 't = a'], hot: 't', note: 'Now every destination is still read by someone: a, b and c form a cycle. Break it by saving one value in a spare register, t = a, and let the copy that wanted a read t instead.' },
  { moves: [['b', 'c'], ['c', 't']], vals: { a: '2', b: '2', c: '3', d: '1', t: '1' }, out: ['d = a', 't = a', 'a = b'], hot: 'a', note: 'Nobody reads a any more, so a = b is safe: a becomes 2.' },
  { moves: [['c', 't']], vals: { a: '2', b: '3', c: '3', d: '1', t: '1' }, out: ['d = a', 't = a', 'a = b', 'b = c'], hot: 'b', note: 'Then b = c: b becomes 3. The cycle has unrolled into a chain.' },
  { moves: [], vals: { a: '2', b: '3', c: '1', d: '1', t: '1' }, out: ['d = a', 't = a', 'a = b', 'b = c', 'c = t'], hot: 'c', note: 'Last, c = t: c gets the old a, 1. Five copies, one more than the parallel copy had, because one cycle needed one save. a = 2, b = 3, c = 1, d = 1, as asked.' },
];

export default function SequenceSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="A parallel copy, one copy at a time" steps={s} note={st.note}>
      <Svg w={400} h={270} title="Registers a, b, c, d and the spare t, with the pending copies as arrows, and the copies written so far.">
        {st.moves.map(([d, src]) => {
          const [x1, y1] = POS[src]; const [x2, y2] = POS[d];
          const dx = x2 - x1; const dy = y2 - y1; const L = Math.hypot(dx, dy);
          return <Arrow key={d + src} x1={x1 + (dx / L) * 30} y1={y1 + (dy / L) * 22} x2={x2 - (dx / L) * 30} y2={y2 - (dy / L) * 22} bend={0.25} color={tok('accent')} />;
        })}
        {Object.entries(POS).map(([r, [x, y]]) => (
          <Box key={r} x={x - 28} y={y - 18} w={56} h={36} fill={st.hot === r ? tok('safe', 0.2) : tok('panel')} stroke={st.hot === r ? tok('safe') : r === 't' ? tok('line') : tok('ink', 0.5)} dash={r === 't'}>
            <T x={x - 20} y={y} size={12} mono weight={700} fill={tok('muted')}>{r}</T>
            <T x={x + 8} y={y + 1} size={15} mono anchor="middle">{st.vals[r]}</T>
          </Box>
        ))}
        <T x={8} y={196} size={11} weight={700} fill={tok('muted')}>COPIES WRITTEN</T>
        <T x={8} y={216} size={12.5} mono>{st.out.slice(0, 3).join('; ') || '(none yet)'}</T>
        <T x={8} y={236} size={12.5} mono>{st.out.slice(3).join('; ')}</T>
      </Svg>
    </StepFrame>
  );
}
