import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 349: the AoSoA index arithmetic engine/rust emits for
// `// @viscosity aosoa(4)` on records {x, y, vx} (F = 3, B = 4): one
// Float64Array `data`, blocks of F * B = 12 slots, field-major inside a
// block. slot(i, k) = (i >> 2) * 12 + k * 4 + (i & 3). The push and the
// rewritten reads are copied from the release CLI's output for that
// program (rustc 1.97). Ten elements pushed; cap is a whole number of
// blocks (12), so the data array has 36 slots.
const F = ['x', 'y', 'vx'];
const FC = ['f1', 'f2', 'f3'];
const B = 4;
const N = 10;
const ROWS = 3;

type S = { i: number | null; k: number | null; formula?: string; rows?: number; note: string };

const STATES: S[] = [
  { i: null, k: null, note: 'One Float64Array holds everything. It is cut into blocks of 4 elements. Inside a block come the 4 x values, then the 4 y values, then the 4 vx values: 12 slots per block.' },
  { i: 0, k: 0, formula: '(0 >> 2) * 12 + 0 + (0 & 3) = 0', note: 'Element 0, field x (k = 0): block 0, lane 0, slot 0. The generated push writes this.data[b + 0] with b = (n >> 2) * 12 + (n & 3).' },
  { i: 5, k: 1, formula: '(5 >> 2) * 12 + 4 + (5 & 3) = 17', note: 'Element 5, field y (k = 1, offset 1 * 4): block 5 >> 2 = 1, lane 5 & 3 = 1. 12 + 4 + 1 = 17.' },
  { i: 10, k: 2, formula: '(10 >> 2) * 12 + 8 + (10 & 3) = 34', note: 'Element 10 would be the eleventh: block 2, lane 2, field vx at offset 8. The shift and the mask stand in for / 4 and % 4, which is why B must be a power of two.' },
  { i: 9, k: 0, formula: '(9 >> 2) * 12 + 0 + (9 & 3) = 25', note: 'A loop over field x touches slots 0–3, 12–15, 24–25: four neighbours at a time, then a jump of 12. Plain SoA would read x as one unbroken run.' },
  { i: null, k: null, rows: 6, note: 'grow() doubles cap and copies the old array to the front of a new one (d.set(this.data)). Slots depend only on i and k, never on cap, so every element stays where it was.' },
];

export default function AosoaSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const rows = st.rows ?? ROWS;
  const cw = 28;
  const ch = rows > 3 ? 20 : 30;
  const top = 30;
  const target = st.i !== null && st.k !== null ? (st.i >> 2) * 12 + st.k * B + (st.i & 3) : -1;
  return (
    <StepFrame title="Where does field k of element i live?" steps={s} note={st.note}>
      <Svg w={400} h={top + 6 * 20 + 70} title="An AoSoA data array with blocks of four elements and three fields">
        {F.map((f, k) => (
          <T key={f} x={10 + k * B * cw + k * 4 + (B * cw) / 2} y={14} size={11} anchor="middle" weight={700} fill={tok(FC[k])}>{f}</T>
        ))}
        {Array.from({ length: rows }, (_, r) => (
          <g key={r}>
            {Array.from({ length: 12 }, (_, c) => {
              const slot = r * 12 + c;
              const k = Math.floor(c / B);
              const i = r * B + (c % B);
              const filled = i < N;
              const on = slot === target;
              return (
                <Box key={c} x={10 + c * cw + k * 4} y={top + r * ch} w={cw - 2} h={ch - 4} r={2}
                  fill={on ? tok(FC[k], 0.55) : filled ? tok(FC[k], 0.15) : tok('panel')}
                  stroke={on ? tok('ink') : tok(FC[k], 0.6)} dash={!filled}>
                  <T x={10 + c * cw + k * 4 + (cw - 2) / 2} y={top + r * ch + (ch - 4) / 2} size={rows > 3 ? 8.5 : 10} mono anchor="middle" fill={filled ? undefined : tok('muted')}>
                    {filled ? `${fieldName(k)}${i}` : rows > 3 && r >= ROWS ? '' : slot}
                  </T>
                </Box>
              );
            })}
            <T x={396} y={top + r * ch + (ch - 4) / 2} size={9} anchor="end" fill={tok('muted')}>{rows > 3 ? '' : `block ${r}`}</T>
          </g>
        ))}
        {st.formula && (
          <T x={200} y={top + 6 * 20 + 40} size={13} mono anchor="middle">{st.formula}</T>
        )}
        {rows > 3 && (
          <T x={200} y={top + 6 * 20 + 40} size={12} anchor="middle" fill={tok('muted')}>cap 12 → 24: three new, empty blocks after the old ones</T>
        )}
      </Svg>
    </StepFrame>
  );
}

function fieldName(k: number) {
  return F[k];
}
