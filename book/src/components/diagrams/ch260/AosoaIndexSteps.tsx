import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// AoSoA index arithmetic for three fields (x, y, vx) in blocks of 8: the
// formula Viscosity's emitter writes, worked through for element 10, field y.
const CODE = `// fields x, y, vx (F = 3), B = 8
// slot of field k of element i:
  (i >> 3) * 24   // block start
+ k * 8           // field in block
+ (i & 7)         // lane`;

const FIELDS = ['x', 'y', 'vx'];
const COL = ['f1', 'f2', 'f3'];
const B = 8;
const SW = 16;
const X0 = 8;

type S = { line: number | null; block?: number; field?: number; lane?: number; slot?: number; also?: number[]; calc: string; note: string };

const STATES: S[] = [
  { line: null, calc: 'element i lives in block i >> 3', note: 'One Float64Array, cut into blocks of 8 elements. Inside a block it is SoA: 8 x values, then 8 y, then 8 vx. Elements 0 to 7 are in block 0, 8 to 15 in block 1.' },
  { line: 2, block: 1, calc: '10 >> 3 = 1', note: 'Where is y of element 10? First the block: 10 >> 3 shifts away the low 3 bits, which is the same as Math.floor(10 / 8) = 1, but cheaper.' },
  { line: 2, block: 1, calc: '1 * 24 = 24', note: 'Each block holds F × B = 3 × 8 = 24 slots, so block 1 starts at slot 24.' },
  { line: 3, block: 1, field: 1, calc: '24 + 1 * 8 = 32', note: 'Inside the block, field k starts at k × 8. y is field 1, so its 8 values start at slot 32.' },
  { line: 4, block: 1, field: 1, lane: 2, slot: 34, calc: '32 + (10 & 7) = 34', note: 'Last, the lane: 10 & 7 keeps the low 3 bits, which is 10 % 8 = 2. So y of element 10 is slot 34.' },
  { line: 4, block: 1, field: 1, slot: 34, also: [32, 33, 35, 36, 37, 38, 39], calc: 'elements 8..15: slots 32..39', note: 'Neighbouring elements’ y values are neighbours in memory: 8 doubles, exactly one 64-byte cache line. A loop over i streams through them as it would through a SoA column, yet all of one element’s fields stay inside one block of 24 slots.' },
  { line: null, calc: 'B = 6: i / 6 and i % 6', note: 'This is why B must be a power of two. With 6 there are no bits to read off: the block and lane need a real division and a remainder. So the planner keeps a collection annotated aosoa(6) as objects, with the reason “the block size must be a power of two (2, 4, 8, 16, ...)”.' },
];

export default function AosoaIndexSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Finding a field in AoSoA" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={210} title="Two AoSoA blocks of 24 slots each, with the slot for field y of element 10 highlighted">
        {[0, 1].map((b) => {
          const y = 22 + b * 74;
          const on = st.block === b;
          return (
            <g key={b}>
              <T x={X0} y={y - 10} size={11} mono fill={on ? tok('brand') : tok('muted')} weight={on ? 700 : undefined}>
                block {b}: elements {b * 8}–{b * 8 + 7}, slots {b * 24}–{b * 24 + 23}
              </T>
              {on && <rect x={X0 - 4} y={y - 3} width={3 * B * SW + 6} height={32} rx={4} fill="none" stroke={tok('brand')} strokeWidth={1.5} />}
              {FIELDS.map((f, k) => Array.from({ length: B }, (_, l) => {
                const slot = b * 24 + k * 8 + l;
                const x = X0 + (k * B + l) * SW;
                const hit = st.slot === slot;
                const also = st.also?.includes(slot);
                const fieldOn = on && st.field === k;
                const a = hit ? 1 : also ? 0.75 : fieldOn ? 0.5 : st.field !== undefined && on ? 0.15 : 0.35;
                return (
                  <g key={`${k}-${l}`}>
                    <rect x={x} y={y} width={SW - 2} height={26} rx={2} fill={tok(COL[k], a)} stroke={hit ? tok('ink') : 'none'} strokeWidth={2} />
                    {l === 0 && <T x={x + 1} y={y + 37} size={11} mono fill={tok('muted')}>{f}</T>}
                    {hit && <T x={x + (SW - 2) / 2} y={y + 13} size={11} mono anchor="middle" fill={tok('paper')} weight={700}>{slot}</T>}
                  </g>
                );
              }))}
            </g>
          );
        })}
        <Box x={8} y={166} w={384} h={36} fill={tok('panel')}>
          <T x={200} y={184} size={13} mono anchor="middle" weight={700}>{st.calc}</T>
        </Box>
      </Svg>
    </StepFrame>
  );
}
