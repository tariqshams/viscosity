// Chapter 213: loop-invariant code motion on the inner x loop of a grid
// walk (real Viscosity IR for c[y * W + x] = 0): find the invariant
// instructions, check they are safe, and move them into the preheader b2.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const PRE = ['%26 = const 1'];
const LOOP = [
  '%27 = phi %26, %39',
  '%28 = const 4',
  '%29 = binop < %27, %28',
  '%32 = binop * %23, %21',
  '%33 = binop + %32, %27',
  '%35 = const 0',
  '%36 = index.set %20, %33, %35',
  '%37 = unop + %27',
  '%38 = const 1',
  '%39 = binop + %37, %38',
];
const INV = [1, 3, 5, 7 + 1];

type S = { found: boolean; safe: boolean; moved: number; note: string };

const STATES: S[] = [
  { found: false, safe: false, moved: 0, note: 'The inner x loop of for (y...) for (x...) c[y * W + x] = 0. Its preheader is b2, which runs once per trip of the outer y loop. Every line in the lower box runs on every trip of the x loop.' },
  { found: true, safe: false, moved: 0, note: 'Step 1: find the invariants (last chapter’s sweep). The constants %28, %35 and %38, and %32 = y * W, whose operands %23 (y) and %21 (W) come from outside this loop.' },
  { found: true, safe: true, moved: 0, note: 'Step 2: check each is safe to run early. Constants cannot fail. y * W cannot fail either, once chapter 195’s analysis has shown y and W are numbers (on an object, * could call its valueOf, an effect). None reads memory.' },
  { found: true, safe: true, moved: 2, note: 'Step 3: move them to the end of the preheader, in the order found. %28 and %32 go first...' },
  { found: true, safe: true, moved: 4, note: '...then %35 and %38. Each operand is already computed above the line that uses it.' },
  { found: true, safe: true, moved: 4, note: 'The loop now runs six instructions per trip instead of ten; the four hoisted ones run once per y. The store %36 stays: it has an effect, and its index %33 changes every trip.' },
];

export default function LicmSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const moved = INV.slice(0, st.moved);
  const pre = [...PRE, ...moved.map((k) => LOOP[k])];
  const loop = LOOP.map((l, k) => ({ l, k })).filter(({ k }) => !moved.includes(k));
  const top = 8;
  const preH = 26 + pre.length * 20;
  const loopY = top + preH + 18;
  return (
    <StepFrame title="Hoisting into the preheader" steps={s} note={st.note}>
      <Svg w={400} h={306} title="The preheader block and the loop body, with invariant instructions moving from the loop into the preheader">
        <Box x={2} y={top} w={396} h={preH} r={6} fill={tok('accent', 0.08)} stroke={tok('accent')}>
          <T x={10} y={top + 13} size={11} weight={700} fill={tok('accent')}>b2: PREHEADER (once per y)</T>
          {pre.map((l, k) => (
            <T key={l} x={14} y={top + 34 + k * 20} size={12} mono
              fill={k > 0 ? tok('safe') : undefined} weight={k > 0 ? 700 : undefined}>{l}</T>
          ))}
        </Box>
        <Box x={2} y={loopY} w={396} h={26 + loop.length * 20} r={6} fill={tok('brand', 0.06)} stroke={tok('brand')}>
          <T x={10} y={loopY + 13} size={11} weight={700} fill={tok('brand')}>x LOOP: b5, b6, b7 (every trip)</T>
          {loop.map(({ l, k }, r) => {
            const inv = st.found && INV.includes(k);
            return (
              <g key={l}>
                <T x={14} y={loopY + 34 + r * 20} size={12} mono weight={inv ? 700 : undefined}
                  fill={inv ? tok('safe') : undefined}>{l}</T>
                {inv && <T x={390} y={loopY + 34 + r * 20} size={11} anchor="end" fill={tok('safe')}>{st.safe ? 'invariant, safe' : 'invariant'}</T>}
              </g>
            );
          })}
        </Box>
      </Svg>
    </StepFrame>
  );
}
