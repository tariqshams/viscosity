// Chapter 215-b: the iteration space of
//   for i in 0..3, for j in 0..3: a[i][j] = a[i-1][j+1] + 1
// with its dependences (distance (1, -1), direction (<, >)), and why the
// two loops may not be interchanged.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Svg, T, tok } from '../../viz/svg';

const N = 4;
const X0 = 120;
const Y0 = 50;
const D = 62;
const px = (j: number) => X0 + j * D;
const py = (i: number) => Y0 + i * D;

type Mode = 'order' | 'one' | 'all' | 'carried' | 'swap';
type S = { mode: Mode; note: string };

const STATES: S[] = [
  { mode: 'order', note: 'Each dot is one iteration (i, j): i picks the row, j the column. The original loops visit them row by row, left to right, as numbered.' },
  { mode: 'one', note: 'Iteration (2, 1) reads a[1][2]. Which iteration wrote that element? (1, 2), one row up and one column to the right, which ran earlier (it is number 6; (2, 1) is number 9).' },
  { mode: 'all', note: 'Every iteration with i ≥ 1 and j ≤ 2 has such a dependence. Each arrow goes from writer to reader: distance (2 − 1, 1 − 2) = (1, −1), direction (<, >).' },
  { mode: 'carried', note: 'The first entry that is not = is the i entry, so the i loop carries every dependence. Within one row there are no arrows: the trips of the j loop are independent, and could run as SIMD lanes.' },
  { mode: 'swap', note: 'Swap the loops (j outside) and the order becomes column by column: (2, 1) would now run before (1, 2), reading a[1][2] before it is written. Swapped, (<, >) becomes (>, <): interchange is illegal here.' },
];

export default function DepSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const swap = st.mode === 'swap';
  const order = (i: number, j: number) => (swap ? j * N + i : i * N + j);
  const arrows: [number, number][] = [];
  for (let i = 1; i < N; i++) for (let j = 0; j < N - 1; j++) arrows.push([i, j]);
  const shown = st.mode === 'one' ? arrows.filter(([i, j]) => i === 2 && j === 1) : st.mode === 'order' ? [] : arrows;
  return (
    <StepFrame title="Dependences in an iteration space" steps={s} note={st.note}>
      <Svg w={400} h={280} title="A 4 by 4 grid of iterations with dependence arrows pointing down and to the left">
        <T x={X0 + 1.5 * D} y={14} size={12} weight={700} anchor="middle" fill={tok('muted')}>j →</T>
        <T x={60} y={Y0 + 1.5 * D} size={12} weight={700} anchor="middle" fill={tok('muted')}>i ↓</T>
        {[0, 1, 2, 3].map((j) => <T key={'j' + j} x={px(j)} y={30} size={11} mono anchor="middle" fill={tok('muted')}>{j}</T>)}
        {[0, 1, 2, 3].map((i) => <T key={'i' + i} x={84} y={py(i)} size={11} mono anchor="middle" fill={tok('muted')}>{i}</T>)}
        {st.mode === 'carried' && [0, 1, 2, 3].map((i) => (
          <rect key={'row' + i} x={px(0) - 22} y={py(i) - 16} width={3 * D + 44} height={32} rx={14}
            fill={tok('safe', 0.1)} stroke={tok('safe')} strokeWidth={1} />
        ))}
        {shown.map(([i, j]) => {
          const bad = swap && order(i, j) < order(i - 1, j + 1);
          return (
            <Arrow key={`${i},${j}`} x1={px(j + 1) - 9} y1={py(i - 1) + 9} x2={px(j) + 9} y2={py(i) - 9}
              color={bad ? tok('danger') : tok('brand')} width={st.mode === 'one' ? 2.6 : 1.6} />
          );
        })}
        {Array.from({ length: N * N }, (_, k) => {
          const i = Math.floor(k / N);
          const j = k % N;
          const hot = st.mode === 'one' && ((i === 2 && j === 1) || (i === 1 && j === 2));
          return (
            <g key={k}>
              <circle cx={px(j)} cy={py(i)} r={12} fill={hot ? tok('brand', 0.3) : tok('panel')} stroke={hot ? tok('brand') : tok('ink', 0.5)} strokeWidth={1.5} />
              <T x={px(j)} y={py(i)} size={11} mono anchor="middle">{order(i, j) + 1}</T>
            </g>
          );
        })}
        <T x={8} y={272} size={11} fill={tok('muted')}>
          {swap ? 'numbers: order with j outside (red: reader before writer)' : 'numbers: the order the loops run them'}
        </T>
      </Svg>
    </StepFrame>
  );
}
