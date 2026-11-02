import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// psum over 8 numbers (pieces of 2 are summed directly) on two rayon
// workers. Each worker runs one task and keeps a deque: it pushes and
// pops at the top (newest), and a thief takes from the bottom (oldest).

const CODE = `fn psum(xs) {
    if xs.len() <= 2 { return sum(xs) }
    let (a, b) = halves(xs);
    let (x, y) = join(|| psum(a),
                      || psum(b));
    x + y
}`;

type W = { run: string; deque: string[] };
type S = { line: number | null; w: [W, W]; steal?: boolean; note: string };

const STATES: S[] = [
  { line: 0, w: [{ run: 'psum 0..8', deque: [] }, { run: 'idle', deque: [] }], note: 'Worker 1 starts on the whole slice, positions 0..8. Worker 2 has nothing to do, and both deques are empty.' },
  { line: 3, w: [{ run: 'psum 0..4', deque: ['psum 4..8'] }, { run: 'idle', deque: [] }], note: 'join(a, b) pushes b, the right half 4..8, onto worker 1’s own deque, advertising it, and worker 1 carries on with a, the left half 0..4. No thread was started.' },
  { line: 3, w: [{ run: 'psum 0..4', deque: [] }, { run: 'psum 4..8', deque: [] }], steal: true, note: 'Worker 2 is idle, so it looks at other deques and steals from the bottom of worker 1’s: the oldest task, 4..8, which is half of all the work.' },
  { line: 3, w: [{ run: 'sum 0..2', deque: ['psum 2..4'] }, { run: 'sum 4..6', deque: ['psum 6..8'] }], note: 'Both workers split again: each pushes its right quarter and runs its left. The pieces are now 2 long, so these runs are plain sums (the base case).' },
  { line: 1, w: [{ run: 'sum 2..4', deque: [] }, { run: 'sum 6..8', deque: [] }], note: 'Each finishes its piece and pops the top of its own deque, its newest task. Nothing is left to steal, and nobody needed to coordinate.' },
  { line: 5, w: [{ run: '0..4 → x', deque: [] }, { run: '4..8 → y', deque: [] }], note: 'The joins complete inward. Worker 1’s first join finds that b was stolen, so it waits for worker 2’s result y (looking for other work meanwhile) and returns x + y.' },
];

export default function StealSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const col = (w: W, i: number) => {
    const x = 8 + i * 200;
    return (
      <g key={i}>
        <T x={x} y={12} size={11} weight={700} fill={tok('muted')}>WORKER {i + 1}</T>
        <Box x={x} y={20} w={184} h={30} r={4} fill={w.run === 'idle' ? tok('panel') : tok(i === 0 ? 'f1' : 'f2', 0.15)} stroke={w.run === 'idle' ? tok('line') : tok(i === 0 ? 'f1' : 'f2')}>
          <T x={x + 10} y={35} size={12} mono>{w.run === 'idle' ? 'idle' : `runs ${w.run}`}</T>
        </Box>
        <T x={x} y={66} size={11} fill={tok('muted')}>deque (top = newest)</T>
        <Box x={x} y={74} w={184} h={62} r={4} fill={tok('panel')} stroke={tok('line')}>
          {w.deque.length === 0 && <T x={x + 92} y={105} size={11} anchor="middle" fill={tok('muted')}>empty</T>}
          {w.deque.map((d, k) => (
            <Box key={d} x={x + 8} y={80 + k * 26} w={168} h={22} r={2} fill={tok('brand', 0.12)} stroke={tok('brand')}>
              <T x={x + 92} y={91 + k * 26} size={11} mono anchor="middle">{d}</T>
            </Box>
          ))}
        </Box>
      </g>
    );
  };
  return (
    <StepFrame title="Two workers, two deques, one steal" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={160} title="Each worker's running task and its deque of waiting tasks">
        {col(st.w[0], 0)}
        {col(st.w[1], 1)}
        {st.steal && <Arrow x1={192} y1={130} x2={214} y2={46} bend={0.3} color={tok('danger')} />}
        {st.steal && <T x={200} y={152} size={11} anchor="middle" fill={tok('danger')}>stolen from the bottom</T>}
      </Svg>
    </StepFrame>
  );
}
