import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Svg, T, tok } from '../../viz/svg';

// Memory drawn as 6 rows of 16 byte boxes (addresses 0-95), wrapped like
// lines of text. Each step colours some bytes and says what to notice.
const COLS = 16;
const ROWS = 6;
const X0 = 40;
const CW = 22;
const Y0 = 22;
const RH = 30;

const CODE = `const xs = new Float64Array(3);
xs[2] = 7.5;
const p = { x: 1, y: 2 };
const q = p;`;

type Region = { from: number; to: number; color: string; label: string };
type S = { line: number | null; regions: Region[]; hl?: [number, number]; arrow?: boolean; note: string };

const XS: Region[] = [
  { from: 16, to: 23, color: 'brand', label: 'xs[0]' },
  { from: 24, to: 31, color: 'brand', label: 'xs[1]' },
  { from: 32, to: 39, color: 'brand', label: 'xs[2]' },
];
const OBJ: Region[] = [
  { from: 64, to: 71, color: 'muted', label: 'hidden' },
  { from: 72, to: 79, color: 'f1', label: 'x' },
  { from: 80, to: 87, color: 'f2', label: 'y' },
];
const Q: Region = { from: 48, to: 55, color: 'accent', label: 'q → 64' };

const STATES: S[] = [
  { line: null, regions: [], note: 'This is memory: one long row of bytes, each with a number called its address. It is far too long to draw in one line, so it wraps like text. The left column gives the address of each row’s first byte.' },
  { line: null, regions: [], hl: [37, 37], note: 'One byte, picked out. Its address is 37: row 32, then 5 boxes along. An address is just an index into this giant array.' },
  { line: 0, regions: XS, note: 'A Float64Array of 3 numbers needs 3 × 8 = 24 bytes. Here they sit at addresses 16 to 39, side by side with no gaps: the array is contiguous.' },
  { line: 1, regions: XS, hl: [32, 39], note: 'Where is xs[2]? Start address + index × 8 = 16 + 2 × 8 = 32. One multiply and one add. No searching, whatever the length.' },
  { line: 2, regions: [...XS, ...OBJ], note: 'An object lands somewhere else, here at 64. The engine keeps some hidden bookkeeping with it (chapter 51), then the values of x and y. This is a simplified picture, not V8’s exact layout.' },
  { line: 3, regions: [...XS, ...OBJ, Q], arrow: true, note: 'q = p copies the arrow from chapter 7. In memory, that arrow is just a number: the address 64, stored in 8 bytes. A stored address is a pointer.' },
];

function cell(a: number) {
  return { x: X0 + (a % COLS) * CW, y: Y0 + Math.floor(a / COLS) * RH };
}

export default function MemoryRow() {
  const s = useSteps(STATES);
  const st = s.state;
  const colorOf = (a: number) => st.regions.find((r) => a >= r.from && a <= r.to);
  return (
    <StepFrame title="Memory as numbered bytes" steps={s} note={st.note}>
      {st.line !== null && <CodeTrace code={CODE} line={st.line} />}
      <Svg w={400} h={Y0 + ROWS * RH + 4} title="Memory drawn as rows of 16 numbered byte boxes, with a Float64Array, an object and a pointer placed in it">
        {Array.from({ length: COLS }, (_, c) => (
          <T key={c} x={X0 + c * CW + CW / 2 - 1} y={9} size={9} mono anchor="middle" fill={tok('muted')}>{c}</T>
        ))}
        {Array.from({ length: ROWS }, (_, r) => (
          <T key={r} x={X0 - 6} y={Y0 + r * RH + 10} size={11} mono anchor="end" fill={tok('muted')}>{r * COLS}</T>
        ))}
        {Array.from({ length: COLS * ROWS }, (_, a) => {
          const { x, y } = cell(a);
          const reg = colorOf(a);
          const lit = st.hl && a >= st.hl[0] && a <= st.hl[1];
          return (
            <rect key={a} x={x} y={y} width={CW - 2} height={20} rx={2}
              fill={reg ? tok(reg.color, lit ? 0.9 : 0.35) : lit ? tok('warn', 0.8) : tok('paper')}
              stroke={lit ? tok('ink') : tok('line')} strokeWidth={lit ? 1.6 : 1} />
          );
        })}
        {st.regions.map((r) => {
          const a = cell(r.from);
          const w = (r.to - r.from + 1) * CW - 2;
          return (
            <T key={r.from} x={a.x + w / 2} y={a.y + 10.5} size={11} mono weight={700} anchor="middle">{r.label}</T>
          );
        })}
        {st.arrow && <Arrow x1={cell(55).x + 18} y1={cell(55).y + 10} x2={cell(64).x + 4} y2={cell(64).y + 2} bend={-0.6} color={tok('accent')} />}
      </Svg>
    </StepFrame>
  );
}
