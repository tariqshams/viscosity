import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Svg, T, tok } from '../../viz/svg';

// A toy model: each particle object is drawn as filling one 64-byte line
// (a hidden header plus six 8-byte fields). Real engine layouts differ;
// chapter 31 looks at V8's. The pointer array and the Float64Array are
// drawn as 8 slots of 8 bytes per line.
const CODE_AOS = `s += ps[i].mass;    // objects`;
const CODE_SOA = `s += mass[i];       // Float64Array`;

const FCOL = ['muted', 'f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'paper'];

type S = { i: number; note: string };
const STATES: S[] = [
  { i: -1, note: 'Memory moves in whole blocks of 64 bytes, called cache lines. Top: eight particle objects, pretending each one fills one line. Bottom: the same eight masses in a Float64Array, 8 bytes each, so all eight fit in one line.' },
  { i: 0, note: 'i = 0. The objects need two lines: one holding the pointers in ps, and one holding particle 0. The Float64Array needs one line, and that one line brings in all eight masses.' },
  { i: 1, note: 'i = 1. Particle 1 is another object, so another line must be fetched, though only 8 of its 64 bytes are wanted. On the bottom, mass[1] is already in the line we fetched: a hit.' },
  { i: 2, note: 'i = 2. Same again: one new line for the objects, nothing new for the Float64Array.' },
  { i: 7, note: 'After i = 7: the objects fetched 9 lines (576 bytes) to use 64 bytes of masses. The Float64Array fetched 1 line, and used every byte of it.' },
];

const X0 = 16;
const LW = 46;

export default function LineSteps() {
  const s = useSteps(STATES);
  const { i } = s.state;
  const aosLines = i < 0 ? 0 : i + 2;
  const soaLines = i < 0 ? 0 : 1;
  const cells = (x: number, y: number, cols: string[], hot: number[], fetched: boolean) => (
    <g>
      <rect x={x} y={y} width={LW - 4} height={26} rx={3} fill={fetched ? tok('brand', 0.15) : tok('paper')} stroke={fetched ? tok('brand') : tok('line')} strokeWidth={fetched ? 2 : 1} />
      {cols.map((c, k) => (
        <rect key={k} x={x + 2 + k * 4.75} y={y + 4} width={4} height={18} rx={1}
          fill={c === 'paper' ? 'none' : tok(c, hot.includes(k) ? 0.95 : 0.4)} />
      ))}
    </g>
  );
  return (
    <StepFrame title="Counting cache lines" steps={s} note={s.state.note}>
      <CodeTrace code={`${CODE_AOS}\n${CODE_SOA}`} line={null} />
      <Svg w={400} h={196} title="Cache lines fetched when summing mass: eight particle objects versus one Float64Array of masses">
        <T x={X0} y={10} size={11} weight={700} fill={tok('muted')}>ARRAY OF OBJECTS</T>
        <T x={X0} y={30} size={11} mono fill={tok('muted')}>ps</T>
        {cells(X0 + 24, 18, Array(8).fill('ink'), i >= 0 ? Array.from({ length: Math.min(i + 1, 8) }, (_, k) => k) : [], i >= 0)}
        <T x={X0 + 74} y={30} size={10} fill={tok('muted')}>8 pointers in one line</T>
        {Array.from({ length: 8 }, (_, k) => (
          <g key={k}>
            {cells(X0 + k * LW, 52, FCOL, k <= i ? [5] : [], k <= i)}
            <T x={X0 + k * LW + 21} y={88} size={10} mono anchor="middle" fill={tok('muted')}>ps[{k}]</T>
          </g>
        ))}
        <T x={X0} y={110} size={11} weight={700} fill={tok('muted')}>FLOAT64ARRAY OF MASSES</T>
        {cells(X0, 122, Array(8).fill('f5'), i >= 0 ? Array.from({ length: Math.min(i + 1, 8) }, (_, k) => k) : [], i >= 0)}
        {cells(X0 + LW, 122, Array(8).fill('f5'), [], false)}
        <T x={X0 + 2 * LW + 4} y={135} size={10} fill={tok('muted')}>mass[0..7] in one line; mass[8..15] in the next</T>
        <rect x={X0} y={160} width={368} height={30} rx={5} fill={tok('panel')} stroke={tok('line')} />
        <T x={X0 + 10} y={175} size={13} weight={700}>lines fetched:</T>
        <T x={X0 + 120} y={175} size={13} mono>objects <tspan fontWeight={700} fill={tok('danger')}>{aosLines}</tspan></T>
        <T x={X0 + 240} y={175} size={13} mono>array <tspan fontWeight={700} fill={tok('safe')}>{soaLines}</tspan></T>
      </Svg>
    </StepFrame>
  );
}
