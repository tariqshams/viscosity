import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// A struct value from birth to move: built with every field, one field
// changed through a mut binding, then moved whole into a new owner, after
// which the old name is unusable.

const CODE = `let mut p = Particle {
    x: 0.0, y: 0.0, vx: 3.0, vy: 4.0,
};
p.x += p.vx;
let q = p;
println!("{}", p.x); // ✗`;

type F = { x: number; y: number; vx: number; vy: number };
type S = { line: number; p: F | null; moved?: boolean; q?: F; hot?: (keyof F)[]; bad?: boolean; note: string };

const P0 = { x: 0, y: 0, vx: 3, vy: 4 };
const P1 = { x: 3, y: 0, vx: 3, vy: 4 };

const STATES: S[] = [
  { line: -1, p: null, note: 'Nothing exists yet. The struct definition (above this code) is only the shape: four f64 fields called x, y, vx and vy.' },
  { line: 0, p: P0, hot: ['x', 'y', 'vx', 'vy'], note: 'The struct expression fills in every field at once. Leave one out and rustc stops with E0063, missing field. p is one value of 32 bytes: four f64s side by side.' },
  { line: 3, p: P1, hot: ['x'], note: 'p.x += p.vx reads one field and writes another, with a dot, as in TypeScript. The write is allowed only because p was declared let mut; the mut covers the whole struct.' },
  { line: 4, p: P1, moved: true, q: P1, hot: ['x', 'y', 'vx', 'vy'], note: 'let q = p moves the whole struct to its new owner, q, exactly as a String moves. Nothing is shared: there is one particle, and now q owns it.' },
  { line: 5, p: P1, moved: true, q: P1, bad: true, note: 'Reading p.x now is the error from the chapter Ownership: E0382, borrow of moved value: `p`. The help even suggests implementing Clone, which the chapter Traits explains.' },
];

const FIELDS: { k: keyof F; c: string }[] = [
  { k: 'x', c: 'f1' }, { k: 'y', c: 'f2' }, { k: 'vx', c: 'f3' }, { k: 'vy', c: 'f4' },
];

function Struct({ x, y, name, f, faded, hot }: { x: number; y: number; name: string; f: F | null; faded?: boolean; hot?: (keyof F)[] }) {
  return (
    <g opacity={faded ? 0.3 : 1}>
      <T x={x} y={y - 11} size={12} mono weight={700}>{name}</T>
      {FIELDS.map(({ k, c }, i) => (
        <Box key={k} x={x + i * 46} y={y} w={44} h={40} r={3}
          fill={f ? tok(c, hot?.includes(k) ? 0.32 : 0.1) : 'transparent'} stroke={f ? tok(c) : tok('line')} dash={!f}>
          <T x={x + i * 46 + 22} y={y + 12} size={11} mono anchor="middle" fill={tok('muted')}>{k}</T>
          <T x={x + i * 46 + 22} y={y + 28} size={14} mono weight={700} anchor="middle">{f ? f[k].toFixed(1) : ''}</T>
        </Box>
      ))}
    </g>
  );
}

export default function FieldSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Build it, change it, move it" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line < 0 ? null : st.line} />
      <Svg w={400} h={170} title="The struct p drawn as four field boxes, and q, its new owner after the move">
        <Struct x={10} y={34} name={st.moved ? 'p (moved out)' : 'p: Particle'} f={st.p} faded={st.moved} hot={st.moved ? undefined : st.hot} />
        {st.q && <Struct x={10} y={116} name="q: Particle" f={st.q} hot={st.line === 4 ? st.hot : undefined} />}
        {st.q && st.line === 4 && <Arrow x1={200} y1={78} x2={200} y2={112} color={tok('brand')} />}
        {st.bad && (
          <Box x={216} y={112} w={178} h={46} r={6} fill={tok('danger', 0.15)} stroke={tok('danger')}>
            <T x={305} y={128} size={12} weight={700} anchor="middle" fill={tok('danger')}>rejected: E0382</T>
            <T x={305} y={146} size={11} anchor="middle" fill={tok('danger')}>borrow of moved value</T>
          </Box>
        )}
      </Svg>
    </StepFrame>
  );
}
