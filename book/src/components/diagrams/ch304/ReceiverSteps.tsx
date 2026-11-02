import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// The three receivers. A method call's `self` is drawn as an arrow from
// the method's frame to the struct: & (reads) in "safe", &mut (writes) in
// "warn". `self` by value moves the struct into the method, so p is
// greyed out afterwards and a later use of it is rejected.

const CODE = `let mut p = Particle::new(3.0, 4.0);
let s = p.speed();
p.step(1.0);
p.step(1.0);
let q = p.stopped();
p.speed(); // ✗ p was moved`;

type F = { x: number; y: number; vx: number; vy: number };
type S = {
  line: number; p: F | null; q?: F; call?: string; recv?: 'ref' | 'mut' | 'own';
  changed?: (keyof F)[]; out?: string; bad?: boolean; note: string;
};

const P0 = { x: 0, y: 0, vx: 3, vy: 4 };
const P1 = { x: 3, y: 4, vx: 3, vy: 4 };
const P2 = { x: 6, y: 8, vx: 3, vy: 4 };
const STOP = { x: 6, y: 8, vx: 0, vy: 0 };

const STATES: S[] = [
  { line: 0, p: P0, call: 'Particle::new(vx, vy)', note: 'new has no self at all. It is an associated function, called on the type with ::, and it builds a Particle at the origin. Like a constructor, but just an ordinary function.' },
  { line: 1, p: P0, call: 'speed(&self)', recv: 'ref', out: 's = 5', note: 'speed takes &self: a shared borrow of p. It reads vx and vy and can’t change anything. p.speed() is short for Particle::speed(&p): Rust adds the & for you.' },
  { line: 2, p: P1, call: 'step(&mut self, dt)', recv: 'mut', changed: ['x', 'y'], note: 'step takes &mut self, so it can write. It moves x and y along by the velocity. This is why p was declared let mut: without it, the call is rejected.' },
  { line: 3, p: P2, call: 'step(&mut self, dt)', recv: 'mut', changed: ['x', 'y'], note: 'Each call borrows p mutably just for that call. When step returns, the borrow is over, and p can be borrowed again.' },
  { line: 4, p: null, q: STOP, call: 'stopped(self)', recv: 'own', changed: ['vx', 'vy'], note: 'stopped takes self by value: the whole Particle moves into the method. It zeroes the velocity and hands the struct back out, and q now owns it.' },
  { line: 5, p: null, q: STOP, bad: true, note: 'p was moved by the call, so using it again is the error from chapter 301: borrow of moved value: `p`. A self method is a one-way door.' },
];

const FIELDS: { k: keyof F; c: string }[] = [
  { k: 'x', c: 'f1' }, { k: 'y', c: 'f2' }, { k: 'vx', c: 'f3' }, { k: 'vy', c: 'f4' },
];

function Struct({ x, y, name, f, faded, changed }: { x: number; y: number; name: string; f: F; faded?: boolean; changed?: (keyof F)[] }) {
  return (
    <g opacity={faded ? 0.3 : 1}>
      <T x={x} y={y - 10} size={12} mono weight={700}>{name}: Particle</T>
      {FIELDS.map(({ k, c }, i) => (
        <Box key={k} x={x + i * 44} y={y} w={42} h={40} r={3}
          fill={changed?.includes(k) ? tok(c, 0.3) : tok(c, 0.1)} stroke={tok(c)}>
          <T x={x + i * 44 + 21} y={y + 12} size={10} mono anchor="middle" fill={tok('muted')}>{k}</T>
          <T x={x + i * 44 + 21} y={y + 28} size={14} mono weight={700} anchor="middle">{f[k]}</T>
        </Box>
      ))}
    </g>
  );
}

export default function ReceiverSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const rc = st.recv === 'mut' ? 'warn' : st.recv === 'own' ? 'brand' : 'safe';
  const label = st.recv === 'mut' ? 'self: &mut Particle' : st.recv === 'own' ? 'self: Particle' : 'self: &Particle';
  return (
    <StepFrame title="&self, &mut self and self" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={200} title="A Particle struct with fields x, y, vx and vy, and an arrow from the method being called to the struct">
        <T x={10} y={14} size={11} weight={700} fill={tok('muted')}>CALLER</T>
        <T x={240} y={14} size={11} weight={700} fill={tok('muted')}>METHOD</T>
        {st.p && <Struct x={10} y={44} name="p" f={st.p} changed={st.changed} />}
        {!st.p && <Struct x={10} y={44} name="p (moved)" f={P2} faded />}
        {st.q && <Struct x={10} y={136} name="q" f={st.q} changed={st.line === 4 ? st.changed : undefined} />}
        {st.call && (
          <Box x={240} y={30} w={150} h={st.recv ? 52 : 30} r={6} fill={tok(st.recv ? rc : 'panel', 0.12)} stroke={st.recv ? tok(rc) : tok('line')}>
            <T x={250} y={45} size={12} mono weight={700}>{st.call}</T>
            {st.recv && <T x={250} y={68} size={11} mono fill={tok('muted')}>{label}</T>}
          </Box>
        )}
        {st.recv && st.recv !== 'own' && (
          <Arrow x1={240} y1={66} x2={188} y2={64} color={tok(rc)} />
        )}
        {st.recv === 'own' && (
          <>
            <Arrow x1={150} y1={86} x2={260} y2={86} color={tok('brand')} bend={0.3} />
            <Arrow x1={300} y1={84} x2={188} y2={150} color={tok('brand')} bend={-0.2} />
            <T x={250} y={118} size={11} fill={tok('muted')}>moves in, comes back out</T>
          </>
        )}
        {st.out && <T x={250} y={108} size={13} mono>{st.out}</T>}
        {st.bad && (
          <Box x={240} y={30} w={150} h={52} r={6} fill={tok('danger', 0.15)} stroke={tok('danger')}>
            <T x={315} y={48} size={12} weight={700} anchor="middle" fill={tok('danger')}>rejected: E0382</T>
            <T x={315} y={66} size={11} anchor="middle" fill={tok('danger')}>borrow of moved value</T>
          </Box>
        )}
      </Svg>
    </StepFrame>
  );
}
