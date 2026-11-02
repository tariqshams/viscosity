// Chapter 120: the run-time columnar transformation (Makor et al. 2022;
// Kloibhofer et al. 2023, as far as their abstracts and the GraalVM
// publication list describe it) next to Viscosity's ahead-of-time pipeline
// (engine/ts/packages/core: analysis.ts bail-outs, plan.ts, emit).
import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

type Side = { title: string; lines: string[]; hot?: boolean };
type S = { left: Side; right: Side; note: string };

const STATES: S[] = [
  {
    left: { title: 'program starts', lines: ['ps holds objects', 'engine profiles it'] },
    right: { title: 'before it runs', lines: ['compiler reads source', 'finds ps and its uses'] },
    note: 'The same program goes in on both sides: an array of objects. On the left, a modified JavaScript engine (GraalJS) watches it run. On the right, Viscosity reads the source before anything runs.',
  },
  {
    left: { title: 'is it worth it?', lines: ['is ps large, uniform', 'and used a lot?'], hot: true },
    right: { title: 'is it safe?', lines: ['can every use be', 'rewritten? else bail out'], hot: true },
    note: 'The question each side asks first is different. The engine sees real sizes and real values, so it asks whether converting will pay off. Viscosity sees only code, so it first asks whether it can prove the rewrite is safe.',
  },
  {
    left: { title: 'convert, mid-run', lines: ['objects → columns', 'cost paid now, amortized'], hot: true },
    right: { title: 'emit new source', lines: ['Float64Array columns', 'cost paid at build time'], hot: true },
    note: 'The engine changes the storage while the program runs, and has to earn back that cost on later accesses. Viscosity writes a new program whose arrays are columns from the very first push.',
  },
  {
    left: { title: 'duplicate loops', lines: ['if columnar: fast copy', 'else: original loop'], hot: true },
    right: { title: 'one loop', lines: ['already columnar', 'nothing to check'] },
    note: 'Compiled code can’t assume the array is columnar, so the 2023 paper duplicates the loop: a check picks a copy optimized for columns, and the original loop stays as the slow path. Viscosity’s loop has only one layout to handle.',
  },
  {
    left: { title: 'a surprise', lines: ['a guard fails:', 'deoptimize, adapt'], hot: true },
    right: { title: 'no surprises', lines: ['it was seen in source:', 'array left as objects'], hot: true },
    note: 'On the left, speculation means a wrong guess costs a deoptimization, never a wrong answer. On the right, anything that could break the layout was found at build time, and that array simply wasn’t transformed: no guards, but also no second chance.',
  },
];

function Panel({ x, side, label }: { x: number; side: Side; label: string }) {
  return (
    <g>
      <T x={x + 95} y={14} size={11} weight={700} anchor="middle" fill={tok('muted')}>{label}</T>
      <Box x={x} y={28} w={190} h={104} stroke={side.hot ? tok('brand') : tok('line')}>
        <T x={x + 95} y={50} size={13} weight={700} anchor="middle">{side.title}</T>
        {side.lines.map((l, i) => (
          <T key={i} x={x + 95} y={80 + i * 22} size={12} anchor="middle">{l}</T>
        ))}
      </Box>
    </g>
  );
}

export default function TwoWaySteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Columns at run time, or ahead of time" steps={s} note={st.note}>
      <Svg w={400} h={140} title={`Run time: ${st.left.title}. Ahead of time: ${st.right.title}.`}>
        <Panel x={4} side={st.left} label="AT RUN TIME (GraalJS research)" />
        <Panel x={206} side={st.right} label="AHEAD OF TIME (Viscosity)" />
      </Svg>
    </StepFrame>
  );
}
