import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const CODE = `class Particle {
  constructor(x, vx) {
    this.x = x;
    this.vx = vx;
  }
}
const p = new Particle(3, 1);
const q = new Particle(8, -2);`;

type Obj = { x?: number; vx?: number };
type S = { line: number; o1?: Obj; o2?: Obj; thisAt?: 1 | 2; p?: boolean; q?: boolean; shape?: boolean; note: string };

const STATES: S[] = [
  { line: 0, note: 'The class is a blueprint. Defining it creates no particles yet.' },
  { line: 6, o1: {}, note: 'new Particle(3, 1) starts by making a brand-new, empty object.' },
  { line: 1, o1: {}, thisAt: 1, note: 'Then it runs the constructor with x = 3 and vx = 1. Inside, this means the new object.' },
  { line: 2, o1: { x: 3 }, thisAt: 1, note: 'this.x = x adds a property x to the new object.' },
  { line: 3, o1: { x: 3, vx: 1 }, thisAt: 1, note: 'this.vx = vx adds vx. The constructor is finished.' },
  { line: 6, o1: { x: 3, vx: 1 }, p: true, note: 'new hands back the filled-in object, and p holds an arrow to it. p is an instance of Particle.' },
  { line: 7, o1: { x: 3, vx: 1 }, o2: { x: 8, vx: -2 }, p: true, q: true, shape: true, note: 'A second new makes a second, separate object. Same constructor, so the same properties in the same order: x, then vx. Engines notice that.' },
];

const C: Record<'x' | 'vx', string> = { x: 'f1', vx: 'f3' };

export default function NewSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="What new does" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={170} title="Variables p and q, the this arrow during construction, and the new objects">
        <T x={6} y={12} size={11} weight={700} fill={tok('muted')}>NAMES</T>
        <T x={200} y={12} size={11} weight={700} fill={tok('muted')}>NEW OBJECTS</T>
        {st.thisAt && (
          <>
            <Box x={6} y={30} w={60} h={32} fill={tok('brand', 0.15)} stroke={tok('brand')}>
              <T x={18} y={46} size={15} mono weight={700} fill={tok('brand')}>this</T>
            </Box>
            <Arrow x1={66} y1={46} x2={196} y2={52} color={tok('brand')} />
          </>
        )}
        {st.p && (
          <>
            <Var y={46} name="p" />
            <Arrow x1={50} y1={46} x2={196} y2={52} />
          </>
        )}
        {st.q && (
          <>
            <Var y={122} name="q" />
            <Arrow x1={50} y1={122} x2={196} y2={124} />
          </>
        )}
        {st.o1 && <ObjBox y={22} o={st.o1} />}
        {st.o2 && <ObjBox y={96} o={st.o2} />}
        {st.shape && <T x={392} y={162} size={12} anchor="end" weight={700} fill={tok('accent')}>both: x then vx → one shared shape</T>}
      </Svg>
    </StepFrame>
  );
}

function Var({ y, name }: { y: number; name: string }) {
  return (
    <Box x={6} y={y - 16} w={46} h={32} stroke={tok('ink', 0.5)}>
      <T x={18} y={y} size={15} mono weight={700}>{name}</T>
      <circle cx={42} cy={y} r={4} fill={tok('ink', 0.8)} />
    </Box>
  );
}

function ObjBox({ y, o }: { y: number; o: Obj }) {
  const keys = (['x', 'vx'] as const).filter((k) => o[k] !== undefined);
  return (
    <Box x={198} y={y} w={194} h={60} r={8} fill={tok('panel')} stroke={tok('ink', 0.5)}>
      <T x={208} y={y + 14} size={11} weight={700} fill={tok('muted')}>Particle</T>
      {keys.length === 0 && <T x={208} y={y + 38} size={15} mono fill={tok('muted')}>{'{ }'} empty</T>}
      {keys.map((k, i) => (
        <g key={k}>
          <rect x={208 + i * 90} y={y + 26} width={82} height={24} rx={3} fill={tok(C[k], 0.85)} />
          <T x={216 + i * 90} y={y + 38.5} size={13} mono weight={700} fill={tok('panel')}>{k}: {o[k]}</T>
        </g>
      ))}
    </Box>
  );
}
