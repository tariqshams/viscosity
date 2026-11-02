// Chapter 329: when the work happens. The same tiny program goes down two
// roads: TypeScript (types erased, then parsed, interpreted and JIT-compiled
// by V8 while it runs) and Rust (checked and compiled to machine code by
// rustc before it ever runs). The reader steps along both at once.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

type Stage = 'off' | 'on' | 'done';
type S = { ts: Stage[]; rs: Stage[]; clock: 'before' | 'run'; note: string };

const TS = ['hello.ts', 'strip types', 'hello.js', 'V8: parse, JIT, GC'];
const RS = ['main.rs', 'rustc: check', 'rustc: compile', 'CPU: runs binary'];

const STATES: S[] = [
  { ts: ['on', 'off', 'off', 'off'], rs: ['on', 'off', 'off', 'off'], clock: 'before', note: 'Two versions of the same program. On top, TypeScript; below, Rust. Nothing has run yet. Watch WHEN each road does its work.' },
  { ts: ['done', 'on', 'off', 'off'], rs: ['done', 'on', 'off', 'off'], clock: 'before', note: 'Both roads check types first. TypeScript then throws its types away (type erasure). Rust keeps going: rustc also checks the ownership rules of the chapter Ownership. Any error stops the build here.' },
  { ts: ['done', 'done', 'on', 'off'], rs: ['done', 'done', 'on', 'off'], clock: 'before', note: 'TypeScript hands plain JavaScript text to the engine. rustc turns the whole program into machine code for your CPU, and writes it to a file of its own (an executable, called a binary).' },
  { ts: ['done', 'done', 'done', 'on'], rs: ['done', 'done', 'done', 'on'], clock: 'run', note: 'Now the program runs. V8 still has a lot to do while it runs: parse the text, interpret bytecode, watch for hot code to JIT-compile, and collect garbage. The Rust binary just runs: the compiling happened earlier.' },
  { ts: ['done', 'done', 'done', 'done'], rs: ['done', 'done', 'done', 'done'], clock: 'run', note: 'The trade: Rust makes you wait for the compiler, and makes you satisfy it, before anything runs. In return, the running program carries no parser, no JIT and no garbage collector.' },
];

const fill = (s: Stage) => (s === 'on' ? tok('brand', 0.18) : s === 'done' ? tok('safe', 0.1) : tok('panel'));
const stroke = (s: Stage) => (s === 'on' ? tok('brand') : s === 'done' ? tok('safe') : tok('line'));

export default function BuildSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const xs = [6, 104, 202, 300];
  const row = (labels: string[], stages: Stage[], y: number) => labels.map((l, k) => (
    <g key={l}>
      <Box x={xs[k]} y={y} w={94} h={40} fill={fill(stages[k])} stroke={stroke(stages[k])} opacity={stages[k] === 'off' ? 0.45 : 1}>
        {l.split(': ').map((part, j, all) => (
          <T key={j} x={xs[k] + 47} y={y + 20 + (j - (all.length - 1) / 2) * 13} size={11} anchor="middle" mono={k === 0 || k === 2} weight={stages[k] === 'on' ? 700 : 400}>{part}</T>
        ))}
      </Box>
      {k < 3 && <Arrow x1={xs[k] + 94} y1={y + 20} x2={xs[k + 1] - 1} y2={y + 20} width={1.5} color={tok('ink', stages[k + 1] === 'off' ? 0.25 : 0.7)} />}
    </g>
  ));
  return (
    <StepFrame title="When does the work happen?" steps={s} note={st.note}>
      <Svg w={400} h={190} title="Two pipelines: TypeScript on V8, and Rust with rustc">
        <T x={6} y={10} size={11} weight={700} fill={tok('accent')}>TYPESCRIPT + NODE</T>
        {row(TS, st.ts, 20)}
        <T x={6} y={88} size={11} weight={700} fill={tok('brand')}>RUST</T>
        {row(RS, st.rs, 98)}
        <line x1={296} y1={6} x2={296} y2={150} stroke={tok('muted', 0.6)} strokeDasharray="4 4" />
        <T x={150} y={166} size={11} anchor="middle" fill={tok('muted')} weight={st.clock === 'before' ? 700 : 400}>before the program runs</T>
        <T x={348} y={166} size={11} anchor="middle" fill={tok('muted')} weight={st.clock === 'run' ? 700 : 400}>while it runs</T>
        <T x={200} y={183} size={11} anchor="middle" fill={tok('muted')}>green: done · amber: happening now</T>
      </Svg>
    </StepFrame>
  );
}
