import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Svg, T, tok } from '../../viz/svg';

// Memory as 6 rows of 16 byte boxes (addresses 0-95), as in the chapter
// on memory. Two variables, p and q, each take 8 bytes holding an
// address; the object they point at sits at 64. Positions are made up and
// the object's layout is simplified (a later chapter shows V8's).
const COLS = 16;
const ROWS = 6;
const X0 = 40;
const CW = 22;
const Y0 = 22;
const RH = 30;

const CODE = `const p = { x: 1, y: 2 };
const q = p;
q.x = 5;
console.log(p.x); // 5`;

type Region = { from: number; to: number; color: string; label: string };
type S = { line: number; regions: Region[]; hl?: [number, number]; arrows: ('p' | 'q')[]; sum?: string; note: string };

const obj = (x: number): Region[] => [
  { from: 64, to: 71, color: 'muted', label: 'hidden' },
  { from: 72, to: 79, color: 'f1', label: `x = ${x}` },
  { from: 80, to: 87, color: 'f2', label: 'y = 2' },
];
const P: Region = { from: 16, to: 23, color: 'accent', label: 'p: 64' };
const Q: Region = { from: 32, to: 39, color: 'accent', label: 'q: 64' };

const STATES: S[] = [
  { line: 0, regions: [...obj(1), P], arrows: ['p'], note: 'The object is created somewhere in memory, here at address 64: some hidden bookkeeping the engine keeps, then x, then y. The variable p does not hold the object. It holds the number 64, its address, in 8 bytes of its own.' },
  { line: 1, regions: [...obj(1), P, Q], arrows: ['p', 'q'], note: 'q = p copies what p holds: the number 64. Now two variables hold the same address. That is aliasing, seen from underneath: two arrows, one object.' },
  { line: 2, regions: [...obj(1), P, Q], hl: [32, 39], arrows: ['p', 'q'], sum: 'q.x: read q → 64', note: 'To run q.x = 5, the engine first reads the address stored in q: 64. Following a pointer starts with reading a number out of memory.' },
  { line: 2, regions: [...obj(5), P, Q], hl: [72, 79], arrows: ['p', 'q'], sum: '64 + 8 = 72: write 5', note: 'Then it adds the offset of x inside the object (8 bytes, after the hidden part) and writes 5 at address 72. The object changed; neither p nor q did.' },
  { line: 3, regions: [...obj(5), P, Q], hl: [72, 79], arrows: ['p', 'q'], sum: 'p.x: 64 + 8 = 72 → 5', note: 'p.x reads the address in p, 64, adds the same offset, and finds 5. That is why a change made through q shows up through p.' },
];

function cell(a: number) {
  return { x: X0 + (a % COLS) * CW, y: Y0 + Math.floor(a / COLS) * RH };
}

export default function PointerSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const regionOf = (a: number) => st.regions.find((r) => a >= r.from && a <= r.to);
  const from = { p: 23, q: 39 };
  return (
    <StepFrame title="A pointer is a stored address" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={Y0 + ROWS * RH + 26} title="Memory drawn as rows of numbered bytes. Variables p and q each hold the address 64, where an object with fields x and y is stored.">
        {Array.from({ length: ROWS }, (_, r) => (
          <T key={r} x={X0 - 6} y={Y0 + r * RH + 10} size={11} mono anchor="end" fill={tok('muted')}>{r * COLS}</T>
        ))}
        {Array.from({ length: COLS * ROWS }, (_, a) => {
          const { x, y } = cell(a);
          const reg = regionOf(a);
          const lit = st.hl && a >= st.hl[0] && a <= st.hl[1];
          return (
            <rect key={a} x={x} y={y} width={CW - 2} height={20} rx={2}
              fill={reg ? tok(reg.color, lit ? 0.9 : 0.35) : tok('paper')}
              stroke={lit ? tok('ink') : tok('line')} strokeWidth={lit ? 1.6 : 1} />
          );
        })}
        {st.regions.map((r) => {
          const a = cell(r.from);
          const w = (r.to - r.from + 1) * CW - 2;
          return <T key={r.from} x={a.x + w / 2} y={a.y + 10.5} size={11} mono weight={700} anchor="middle">{r.label}</T>;
        })}
        {st.arrows.map((v) => (
          <Arrow key={v} x1={cell(from[v]).x + 18} y1={cell(from[v]).y + 18} x2={cell(64).x + 6} y2={cell(64).y} bend={v === 'p' ? -0.5 : -0.3} color={tok('accent')} />
        ))}
        {st.sum && <T x={X0} y={Y0 + ROWS * RH + 12} size={13} mono weight={700}>{st.sum}</T>}
      </Svg>
    </StepFrame>
  );
}
