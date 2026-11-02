import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// The planner's decision ladder, in the order plan() in
// engine/ts/packages/core/src/plan.ts checks its rules. The first rung that
// matches decides; a collection that passes every rung becomes SoA. The
// reason strings are the real `viscosity explain` text.
const RUNGS = [
  { q: 'Unsafe? (any bailout)', out: 'aos' },
  { q: 'Annotated with @viscosity?', out: 'as told' },
  { q: 'Opt-in mode, not annotated?', out: 'aos' },
  { q: 'Python, no --python-auto?', out: 'aos' },
  { q: 'No field provably numeric?', out: 'aos' },
  { q: 'No loop touches a field?', out: 'aos' },
  { q: 'Fewer than minSize (64)?', out: 'aos' },
];

// cur: rung being explained (-1 none, 7 = the soa exit); passed: rungs a
// walked collection has already passed; stop: the rung it stops at.
type S = { cur: number; passed: number; stop: number | null; note: string };

const STATES: S[] = [
  { cur: -1, passed: 0, stop: null, note: 'Every collection that discovery found walks down this ladder. Each rung asks one question. The first “yes” decides the layout and records a reason; a collection that answers “no” to every rung becomes struct of arrays.' },
  { cur: 0, passed: 0, stop: null, note: 'Safety comes first, and nothing overrides it. If the safety analysis left any bailout, the collection stays an array of objects: “unsafe: the array is passed to a method call at line 5”.' },
  { cur: 1, passed: 0, stop: null, note: 'Next, the programmer’s word. A // @viscosity comment above the declaration picks the layout directly: aos keeps it, soa or aosoa(N) transforms it, and the rungs below are skipped (chapter 156).' },
  { cur: 2, passed: 0, stop: null, note: 'With --mode opt-in, only annotated collections are touched. Anything that got this far without an annotation is kept: “opt-in mode: not annotated”.' },
  { cur: 3, passed: 0, stop: null, note: 'Python collections are kept unless you pass --python-auto, because in CPython the columns measured slower per element. The same ladder serves both languages; only this verdict differs.' },
  { cur: 4, passed: 0, stop: null, note: 'Now the cost model proper. If no field is provably a number, there would be no Float64Array columns at all: “no field is provably numeric, so there are no typed columns to gain”.' },
  { cur: 5, passed: 0, stop: null, note: 'If no loop reads or writes a field, nothing runs often enough to win back the cost of the change: “no loop reads or writes its fields, so a new layout cannot pay off”.' },
  { cur: 6, passed: 0, stop: null, note: 'Finally, size. A measured size from profiling wins over the static estimate. Under 64 elements (the default --min-size) the collection is kept. An unknown size passes this rung.' },
  { cur: 7, passed: 0, stop: null, note: 'Every answer was “no”: the plan is soa. The reasons are a description of the collection: the loops, which columns are typed, the size, and how many accesses were proven in bounds.' },
  { cur: -1, passed: 6, stop: 6, note: 'Walk small_auto.js down the ladder: two points, {x, y}, summed in a loop. Safe, not annotated, numeric, used in a loop… and then “about 2 elements: below the 64-element threshold”. Kept.' },
];

export default function PlanLadder() {
  const s = useSteps(STATES);
  const st = s.state;
  const top = 8;
  const H = 36;
  const color = (k: number) => {
    if (st.stop === k) return tok('danger');
    if (k < st.passed) return tok('safe');
    if (st.cur === k) return tok('brand');
    return tok('ink', 0.45);
  };
  const fill = (k: number) => (st.stop === k ? tok('danger', 0.12) : st.cur === k ? tok('brand', 0.14) : 'transparent');
  const soaOn = st.cur === 7;
  return (
    <StepFrame title="The planner’s decision ladder" steps={s} note={st.note}>
      <Svg w={400} h={top + RUNGS.length * H + 46} title="Seven questions in order; the first yes keeps the collection (or applies its annotation); all no gives struct of arrays">
        {RUNGS.map((r, k) => {
          const y = top + k * H;
          return (
            <g key={k}>
              <Box x={6} y={y} w={262} h={28} fill={fill(k)} stroke={color(k)}>
                <T x={16} y={y + 14} size={11} weight={700} fill={tok('muted')}>{k + 1}</T>
                <T x={32} y={y + 14} size={12}>{r.q}</T>
              </Box>
              {k < st.passed && <T x={258} y={y + 14} size={11} anchor="end" fill={tok('safe')}>no</T>}
              <Arrow x1={268} y1={y + 14} x2={318} y2={y + 14} color={k < st.passed ? tok('ink', 0.3) : color(k)} width={st.cur === k || st.stop === k ? 2.5 : 1.5} />
              <T x={290} y={y + 6} size={9} anchor="middle" fill={tok('muted')}>yes</T>
              <Box x={320} y={y + 2} w={74} h={24} stroke={k < st.passed ? tok('ink', 0.3) : color(k)} fill={fill(k)}>
                <T x={357} y={y + 14} size={11} mono anchor="middle">{r.out}</T>
              </Box>
              {k < RUNGS.length - 1 && <Arrow x1={60} y1={y + 28} x2={60} y2={y + H} color={tok('ink', 0.4)} width={1.5} />}
              {k < RUNGS.length - 1 && <T x={68} y={y + 32} size={9} fill={tok('muted')}>no</T>}
            </g>
          );
        })}
        <Arrow x1={60} y1={top + RUNGS.length * H - 8} x2={60} y2={top + RUNGS.length * H + 10} color={soaOn ? tok('brand') : tok('ink', 0.4)} width={1.5} />
        <Box x={20} y={top + RUNGS.length * H + 10} w={250} h={30} fill={soaOn ? tok('brand', 0.14) : 'transparent'} stroke={soaOn ? tok('brand') : tok('ink', 0.45)}>
          <T x={145} y={top + RUNGS.length * H + 25} size={12} mono anchor="middle" weight={700}>soa: struct of arrays</T>
        </Box>
      </Svg>
    </StepFrame>
  );
}
