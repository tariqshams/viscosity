import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 141: one program through Viscosity's real pipeline
// (packages/core/src/index.ts: plugin.lower → analyze → plan → plugin.emit).
// Every snippet below is real output of the engine for this program,
// trimmed to fit (VIR from printFunc, the verdict from `viscosity explain`,
// the last lines from `viscosity build`).
const CODE = `const ps = [];
for (let i = 0; i < 1000; i++)
  ps.push({ x: i, vx: 1 });
for (let i = 0; i < ps.length; i++)
  ps[i].x += ps[i].vx;
console.log(ps[3].x);`;

type Stage = 'src' | 'lower' | 'vir' | 'analyze' | 'plan' | 'emit';
const STAGES: { id: Stage; label: string; who: string }[] = [
  { id: 'src', label: 'source', who: 'your file' },
  { id: 'lower', label: 'lower', who: 'plugin' },
  { id: 'vir', label: 'VIR', who: 'core' },
  { id: 'analyze', label: 'analyze', who: 'core' },
  { id: 'plan', label: 'plan', who: 'core' },
  { id: 'emit', label: 'emit', who: 'plugin' },
];

type S = { stage: Stage; line: number | null; out: string[]; note: string };

const STATES: S[] = [
  {
    stage: 'src', line: null, out: ['an ordinary array of objects'],
    note: 'The input is plain JavaScript text. Nothing in it mentions Viscosity. The pipeline’s job is to decide whether ps may be stored differently, and if so, to write a new file.',
  },
  {
    stage: 'lower', line: 2, out: ['acorn → ESTree tree', '→ VIR, one Func per function'],
    note: 'The JavaScript plugin parses the text into a syntax tree and lowers it. This is the only step, apart from emit, that knows any JavaScript syntax.',
  },
  {
    stage: 'vir', line: 2, out: ['%8 = record {x, vx} %3, %7', '%9 = push %6, %8'],
    note: 'In VIR, the object literal is a record.new with named fields, and ps.push is a push instruction. The core never sees curly braces or method calls, only these.',
  },
  {
    stage: 'analyze', line: 4, out: ['collection ps {x, vx}', 'x, vx: always numbers', 'loop at line 4 touches vx, x', 'no element escapes'],
    note: 'The analyses run on VIR: which bindings hold same-shaped records, which fields are numbers, which loops touch which fields, and whether anything could notice a new layout.',
  },
  {
    stage: 'plan', line: null, out: ['ps → struct of arrays', 'about 1000 elements'],
    note: 'The planner turns the facts into a decision per collection, and records why. Those reasons are what viscosity explain prints.',
  },
  {
    stage: 'emit', line: 4, out: ['ps.push(i, 1);', 'ps.x[i] += ps.vx[i];'],
    note: 'Back in the plugin. Emit edits the original text, range by range, using the plan. Everything it doesn’t need to change is copied through exactly. The result is a new JavaScript file.',
  },
];

export default function PipelineSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const at = STAGES.findIndex((g) => g.id === st.stage);
  return (
    <StepFrame title="One program through the pipeline" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={230} title="The six stages of the Viscosity pipeline, with the current stage highlighted">
        {STAGES.map((g, k) => {
          const x = 4 + k * 66;
          const on = k === at;
          const done = k < at;
          const plug = g.who === 'plugin';
          const c = plug ? 'f3' : 'brand';
          return (
            <g key={g.id}>
              <Box x={x} y={22} w={60} h={40} fill={on ? tok(c, 0.18) : 'transparent'} stroke={on || done ? tok(c) : tok('line')} dash={!on && !done}>
                <T x={x + 30} y={42} size={11} weight={on ? 700 : 400} anchor="middle">{g.label}</T>
              </Box>
              <T x={x + 30} y={10} size={9} anchor="middle" fill={tok(plug ? 'f3' : 'muted')}>{g.who}</T>
              {k < STAGES.length - 1 && <Arrow x1={x + 60} y1={42} x2={x + 66} y2={42} width={1.5} />}
            </g>
          );
        })}
        <Box x={4} y={80} w={392} h={140} fill={tok('panel')} stroke={tok('line')}>
          {st.out.map((l, k) => (
            <T key={k} x={16} y={102 + k * 26} size={12} mono>{l}</T>
          ))}
        </Box>
      </Svg>
    </StepFrame>
  );
}
