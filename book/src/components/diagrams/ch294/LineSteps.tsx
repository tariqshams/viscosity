// Chapter 294: which bytes of each 64-byte cache line a loop uses, for
// Vec<Particle> (48-byte structs back to back; size measured with
// size_of on rustc 1.97) and for a struct of Vec<f64> columns. Three
// lines of 8 f64 slots are drawn. Field colours are the book's permanent
// ones: x f1, y f2, vx f3, vy f4, mass f5, health f6.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

type F = 'x' | 'y' | 'vx' | 'vy' | 'mass' | 'health';
const FC: Record<F, string> = { x: 'f1', y: 'f2', vx: 'f3', vy: 'f4', mass: 'f5', health: 'f6' };
const SHORT: Record<F, string> = { x: 'x', y: 'y', vx: 'vx', vy: 'vy', mass: 'm', health: 'h' };
const ORDER: F[] = ['x', 'y', 'vx', 'vy', 'mass', 'health'];

// 24 slots of 8 bytes: particles 0..3 in AoS order.
const AOS = Array.from({ length: 24 }, (_, i) => ({ f: ORDER[i % 6], p: Math.floor(i / 6) }));
// Three SoA lines, one per column shown.
const soa = (cols: F[]) => cols.flatMap((f) => Array.from({ length: 8 }, (_, p) => ({ f, p })));

type S = { layout: 'aos' | 'soa'; cols?: F[]; use: F[]; title: string; useful?: string; note: string };

const STATES: S[] = [
  { layout: 'aos', use: [], title: 'Vec<Particle>', note: 'A Vec<Particle> stores 48-byte particles back to back, with no headers and no pointers: already flatter than a JavaScript array of objects. But a 64-byte line holds one and a third particles, so lines and particles don’t line up.' },
  { layout: 'aos', use: ['x', 'y', 'vx', 'vy'], title: 'Vec<Particle>, update-xy', useful: '32 of every 48 bytes', note: 'x += vx * dt; y += vy * dt reads four fields. The CPU still fetches whole lines, so mass and health ride along in every line and are never used: a third of the traffic is wasted.' },
  { layout: 'aos', use: ['mass'], title: 'Vec<Particle>, sum of mass', useful: '8 of every 48 bytes', note: 'Summing mass is worse: one field in six. Five sixths of every line fetched is thrown away.' },
  { layout: 'soa', cols: ['x', 'vx', 'mass'], use: ['x', 'vx'], title: 'Particles { x: Vec<f64>, … }', useful: 'every byte fetched', note: 'With one Vec<f64> per field, each line holds eight values of one field. The x loop streams through the x and vx lines (and y, vy, not drawn); the mass and health lines are never fetched at all.' },
  { layout: 'soa', cols: ['x', 'vx', 'mass'], use: ['mass'], title: 'Particles, sum of mass', useful: 'every byte fetched', note: 'Summing mass reads one column: eight useful masses per line. This is where the measured gap was largest. With only 1,000 particles, though, every line is already in cache, and the two layouts measured the same.' },
];

export default function LineSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const cells = st.layout === 'aos' ? AOS : soa(st.cols ?? []);
  const cw = 40;
  const x0 = 64;
  return (
    <StepFrame title="Bytes used per cache line" steps={s} note={st.note}>
      <Svg w={400} h={178} title="Three 64-byte cache lines, each eight f64 slots, coloured by field and dimmed where the loop doesn't use them">
        <T x={8} y={12} size={11} weight={700} fill={tok('brand')}>{st.title}</T>
        {[0, 1, 2].map((r) => (
          <T key={r} x={56} y={44 + r * 42} size={10} anchor="end" fill={tok('muted')}>line {r + 1}</T>
        ))}
        {cells.map((c, i) => {
          const x = x0 + (i % 8) * cw;
          const y = 28 + Math.floor(i / 8) * 42;
          const on = st.use.length === 0 || st.use.includes(c.f);
          return (
            <Box key={i} x={x + 1} y={y} w={cw - 2} h={32} r={2} fill={tok(FC[c.f], on ? 0.3 : 0.06)} stroke={on ? tok(FC[c.f]) : tok('line')} dash={!on}>
              <T x={x + cw / 2} y={y + 16} size={11} mono anchor="middle" fill={on ? tok('ink') : tok('muted')}>
                {SHORT[c.f]}{c.p}
              </T>
            </Box>
          );
        })}
        {st.layout === 'aos' && [6, 12, 18].map((k) => {
          const x = x0 + (k % 8) * cw;
          const y = 28 + Math.floor(k / 8) * 42;
          return <line key={k} x1={x} y1={y - 3} x2={x} y2={y + 35} stroke={tok('ink', 0.6)} strokeWidth={2} />;
        })}
        {st.useful && <T x={8} y={166} size={11} weight={700} fill={tok('ink')}>useful: {st.useful}</T>}
        {st.layout === 'aos' && <T x={392} y={166} size={10} anchor="end" fill={tok('muted')}>| = particle boundary</T>}
      </Svg>
    </StepFrame>
  );
}
