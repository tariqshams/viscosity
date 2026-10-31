import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const CODE = `class Particle {
  // constructor as before
  move() {
    this.x = this.x + this.vx;
  }
}
const p = new Particle(0, 2);
const q = new Particle(10, -1);
p.move();
q.move();`;

type S = { line: number; px: number; qx: number; who?: 'p' | 'q'; note: string };

const STATES: S[] = [
  { line: 7, px: 0, qx: 10, note: 'Two instances, each with its own x and vx. The method move is not copied into them: it is stored once, with the class, and both share it.' },
  { line: 8, px: 0, qx: 10, who: 'p', note: 'p.move(): the object before the dot is p, so for this call, this means p.' },
  { line: 3, px: 2, qx: 10, who: 'p', note: 'this.x = this.x + this.vx runs on p: 0 + 2 = 2. q is untouched.' },
  { line: 9, px: 2, qx: 10, who: 'q', note: 'q.move() runs the very same method. This time the object before the dot is q, so this means q.' },
  { line: 3, px: 2, qx: 9, who: 'q', note: 'The same line now changes q: 10 + (-1) = 9. One method, two objects: this is decided by each call, not by where move is written.' },
];

export default function ThisSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="this is whatever is before the dot" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={180} title="One shared move method above two particle objects, with this pointing at the object the method was called on">
        <Box x={120} y={8} w={160} h={44} r={8} fill={tok('accent', 0.1)} stroke={tok('accent')}>
          <T x={200} y={22} size={11} weight={700} anchor="middle" fill={tok('accent')}>SHARED BY ALL PARTICLES</T>
          <T x={200} y={40} size={14} mono anchor="middle">move()</T>
        </Box>
        <Arrow x1={90} y1={104} x2={150} y2={54} dash color={tok('accent', 0.6)} />
        <Arrow x1={310} y1={104} x2={250} y2={54} dash color={tok('accent', 0.6)} />
        <Inst x={10} name="p" xv={st.px} vx={2} hot={st.who === 'p'} />
        <Inst x={220} name="q" xv={st.qx} vx={-1} hot={st.who === 'q'} />
      </Svg>
    </StepFrame>
  );
}

function Inst({ x, name, xv, vx, hot }: { x: number; name: string; xv: number; vx: number; hot: boolean }) {
  return (
    <g>
      <Box x={x} y={104} w={170} h={58} r={8} fill={hot ? tok('brand', 0.12) : tok('panel')} stroke={hot ? tok('brand') : tok('ink', 0.5)}>
        <T x={x + 10} y={118} size={12} mono weight={700}>{name}</T>
        {hot && <T x={x + 160} y={118} size={12} mono weight={700} anchor="end" fill={tok('brand')}>this = {name}</T>}
        <rect x={x + 10} y={130} width={72} height={24} rx={3} fill={tok('f1', 0.85)} />
        <T x={x + 16} y={142.5} size={13} mono weight={700} fill={tok('panel')}>x: {xv}</T>
        <rect x={x + 88} y={130} width={72} height={24} rx={3} fill={tok('f3', 0.85)} />
        <T x={x + 94} y={142.5} size={13} mono weight={700} fill={tok('panel')}>vx: {vx}</T>
      </Box>
    </g>
  );
}
