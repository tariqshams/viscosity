import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// Two scoped threads increment one Mutex<i32>. Who holds the guard, who
// waits, and the value inside, step by step.

const CODE = `s.spawn(|| {
    let mut g = total.lock().unwrap();
    *g += 1;
}); // g dropped here: unlocked`;

type Th = 'idle' | 'waiting' | 'holding' | 'done';
type S = { line: number | null; a: Th; b: Th; v: number; note: string };

const STATES: S[] = [
  { line: null, a: 'idle', b: 'idle', v: 0, note: 'total is a Mutex<i32> holding 0. Two scoped threads, A and B, will each run the code above. Nobody holds the lock.' },
  { line: 1, a: 'holding', b: 'idle', v: 0, note: 'A calls lock first. The mutex is free, so A gets the guard g at once. Only code holding a guard can reach the number.' },
  { line: 1, a: 'holding', b: 'waiting', v: 0, note: 'B calls lock too, but A holds the guard, so B’s lock does not return: B waits (the operating system can run something else meanwhile).' },
  { line: 2, a: 'holding', b: 'waiting', v: 1, note: 'A writes through its guard: *g += 1. Nobody else can see the number half-updated, because nobody else can reach it.' },
  { line: 3, a: 'done', b: 'holding', v: 1, note: 'A’s closure ends, g is dropped, and dropping the guard unlocks the mutex. B’s lock now returns with B’s own guard, and B sees A’s 1.' },
  { line: 2, a: 'done', b: 'holding', v: 2, note: 'B adds its 1. Two increments, two turns, no lost update: the race of chapter 293 cannot happen.' },
  { line: 3, a: 'done', b: 'done', v: 2, note: 'B’s guard is dropped too. After the scope, total.into_inner() takes the 2 back out of the mutex.' },
];

const COLOR: Record<Th, string> = { idle: 'muted', waiting: 'warn', holding: 'safe', done: 'muted' };
const LABEL: Record<Th, string> = { idle: 'not started', waiting: 'waiting in lock()', holding: 'holds the guard', done: 'finished' };

export default function LockSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const holder = st.a === 'holding' ? 'A' : st.b === 'holding' ? 'B' : null;
  const lane = (name: string, th: Th, y: number) => (
    <g>
      <Box x={8} y={y} w={150} h={34} r={4} fill={tok(COLOR[th], 0.12)} stroke={tok(COLOR[th])}>
        <T x={20} y={y + 17} size={13} weight={700}>{name}</T>
        <T x={44} y={y + 17} size={11} fill={tok('muted')}>{LABEL[th]}</T>
      </Box>
    </g>
  );
  return (
    <StepFrame title="Two threads take turns with one lock" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={120} title="Two threads, the mutex, and who holds its guard">
        {lane('A', st.a, 10)}
        {lane('B', st.b, 66)}
        <Box x={230} y={22} w={162} h={66} r={6} fill={holder ? tok('safe', 0.08) : tok('panel')} stroke={holder ? tok('safe') : tok('line')}>
          <T x={311} y={38} size={11} mono anchor="middle" fill={tok('muted')}>Mutex&lt;i32&gt;</T>
          <T x={311} y={60} size={20} mono weight={700} anchor="middle">{st.v}</T>
          <T x={311} y={80} size={11} anchor="middle" fill={tok(holder ? 'safe' : 'muted')}>{holder ? `locked by ${holder}` : 'unlocked'}</T>
        </Box>
        {holder && (
          <line x1={160} y1={holder === 'A' ? 27 : 83} x2={228} y2={55} stroke={tok('safe')} strokeWidth={2.5} />
        )}
        {st.b === 'waiting' && (
          <line x1={160} y1={83} x2={228} y2={70} stroke={tok('warn')} strokeWidth={2} strokeDasharray="4 4" />
        )}
      </Svg>
    </StepFrame>
  );
}
