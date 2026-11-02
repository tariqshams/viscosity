// Chapter 211-b: finding the loop-invariant instructions of the inner x
// loop of a grid walk (real Viscosity IR), by sweeping until nothing
// changes.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const LINES: { code: string; why: string }[] = [
  { code: '%27 = phi %26, %39', why: 'phi: changes each trip' },
  { code: '%28 = const 4', why: 'no operands' },
  { code: '%29 = binop < %27, %28', why: 'uses %27, the phi' },
  { code: '%32 = binop * %23, %21', why: 'y and W: from outside' },
  { code: '%33 = binop + %32, %27', why: 'uses %27, the phi' },
  { code: '%35 = const 0', why: 'no operands' },
  { code: '%36 = index.set %20, %33, %35', why: 'a write: has an effect' },
  { code: '%38 = const 1', why: 'no operands' },
  { code: '%39 = binop + %37, %38', why: 'uses %37, from the phi' },
];

type Mark = 'inv' | 'no' | null;
type S = { marks: Mark[]; hot?: number[]; note: string };

const N = LINES.length;
const none: Mark[] = Array(N).fill(null);
const inv1: Mark[] = [null, 'inv', null, 'inv', null, 'inv', null, 'inv', null];
const final: Mark[] = ['no', 'inv', 'no', 'inv', 'no', 'inv', 'no', 'inv', 'no'];

const STATES: S[] = [
  { marks: none, note: 'The inner x loop of the grid walk, from Viscosity’s IR (for y, for x: c[y * W + x] = 0). Defined outside this loop: %20 (c), %21 (W) and %23 (y). Which instructions give the same value every trip?' },
  { marks: inv1, hot: [1, 3, 5, 7], note: 'Sweep 1. The three constants have no operands, so they are invariant. %32 = y * W multiplies two values from outside the loop, and * has no effects here: invariant too.' },
  { marks: inv1, hot: [0, 2, 4, 8], note: 'The phi %27 is x itself, so it is never invariant, and %29, %33 and %39 all use it (directly or through %37, the unary + of %27): they change every trip.' },
  { marks: final, hot: [6], note: 'The store %36 writes to memory, an effect, so it is not invariant whatever its operands are (and here %33 changes anyway).' },
  { marks: final, note: 'Sweep 2 adds nothing new, so this is the fixpoint: four invariant instructions. In the outer y loop, %32 would not be invariant, because %23 is that loop’s counter.' },
];

export default function InvariantSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Sweeping for loop invariants" steps={s} note={st.note}>
      <Svg w={400} h={N * 26 + 12} title="The instructions of an inner loop, each marked invariant or not">
        {LINES.map((l, k) => {
          const y = 8 + k * 26;
          const m = st.marks[k];
          const hot = st.hot?.includes(k);
          return (
            <g key={k}>
              <Box x={2} y={y} w={396} h={22} r={4}
                fill={m === 'inv' ? tok('safe', 0.16) : m === 'no' ? tok('danger', 0.08) : 'transparent'}
                stroke={hot ? tok('brand') : tok('line')}>
                <T x={10} y={y + 11.5} size={11.5} mono>{l.code}</T>
                {m && <T x={392} y={y + 11.5} size={11} anchor="end" weight={700}
                  fill={m === 'inv' ? tok('safe') : tok('danger')}>{m === 'inv' ? 'invariant' : 'varies'}</T>}
                {hot && !m && <T x={392} y={y + 11.5} size={11} anchor="end" fill={tok('muted')}>{l.why}</T>}
              </Box>
            </g>
          );
        })}
      </Svg>
    </StepFrame>
  );
}
