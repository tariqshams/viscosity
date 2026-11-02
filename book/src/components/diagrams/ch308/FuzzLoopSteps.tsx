import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 308: two fuzzing loops. Top: a coverage-guided fuzzer in the
// style of AFL and libFuzzer (google/AFL docs/technical_details.txt):
// mutate a kept input, run the instrumented target, keep the input only
// if it reached a branch edge no earlier input reached. Bottom: what
// engine/rust/scripts/fuzz.mjs does: a seeded generator writes a valid
// program, both engines compile it, node runs the original and the
// compiled program, and any difference is kept (and reduced with
// --reduce). Nothing flows back from a run into the generator.
type K = 'kept' | 'mut' | 'run' | 'new' | 'seed' | 'gen' | 'cmp' | 'node' | 'diff' | 'red';
type S = { hi: K[]; back?: boolean; note: string };

const STATES: S[] = [
  { hi: ['kept', 'mut'], note: 'A coverage-guided fuzzer starts from a few inputs, often just one. Each round it takes a kept input and changes it a little: flip a bit, insert a byte, copy a piece.' },
  { hi: ['run'], note: 'The target was compiled with instrumentation: at every branch it records which edge (from where to where) ran. AFL keeps one counter per edge in a 64 kB map.' },
  { hi: ['new', 'kept'], back: true, note: 'If the run reached an edge no earlier input reached, the input is kept and will be mutated further. Otherwise it is dropped. Coverage is the only feedback, and it steers the search deeper.' },
  { hi: ['seed', 'gen'], note: 'fuzz.mjs works the other way round. Program k of campaign S gets its own seed, and a generator writes a valid program in the subset Viscosity cares about: records pushed in loops, escapes, out-of-bounds accesses.' },
  { hi: ['cmp', 'node'], note: 'Both engines compile it (Rust through its CLI, 250 files per call), and node runs the original and the compiled program. Those are the oracles; chapter 303 lists them.' },
  { hi: ['diff', 'red'], note: 'A difference is a failure. The program is written to a file, and --reduce deletes lines while the same kind of failure remains. Nothing from a run flows back into the generator: it is blind.' },
];

type B = { x: number; y: number; w: number; label: string };
const BOX: Record<K, B> = {
  kept: { x: 8, y: 34, w: 84, label: 'kept inputs' },
  mut: { x: 108, y: 34, w: 84, label: 'mutate' },
  run: { x: 208, y: 34, w: 88, label: 'run, count' },
  new: { x: 312, y: 34, w: 80, label: 'new edge?' },
  seed: { x: 8, y: 160, w: 84, label: 'seed (S, k)' },
  gen: { x: 108, y: 160, w: 84, label: 'generate' },
  cmp: { x: 208, y: 160, w: 88, label: 'TS + Rust' },
  node: { x: 312, y: 160, w: 80, label: 'node: both' },
  diff: { x: 208, y: 220, w: 88, label: 'differ?' },
  red: { x: 312, y: 220, w: 80, label: '--reduce' },
};
const H = 28;

export default function FuzzLoopSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const on = (k: K) => st.hi.includes(k);
  const box = (k: K) => {
    const b = BOX[k];
    return (
      <Box key={k} x={b.x} y={b.y} w={b.w} h={H} r={4} fill={on(k) ? tok('brand', 0.15) : tok('panel')} stroke={on(k) ? tok('brand') : tok('line')}>
        <T x={b.x + b.w / 2} y={b.y + H / 2} size={10.5} mono anchor="middle">{b.label}</T>
      </Box>
    );
  };
  const grey = tok('ink', 0.4);
  return (
    <StepFrame title="Two ways to fuzz" steps={s} note={st.note}>
      <Svg w={400} h={262} title="A coverage-guided loop with feedback, and Viscosity's generator loop without it">
        <T x={8} y={16} size={11} weight={700} fill={tok('muted')}>coverage-guided (AFL, libFuzzer)</T>
        <T x={8} y={142} size={11} weight={700} fill={tok('muted')}>generation-based (fuzz.mjs)</T>
        <Arrow x1={92} y1={48} x2={106} y2={48} color={grey} width={1.5} />
        <Arrow x1={192} y1={48} x2={206} y2={48} color={grey} width={1.5} />
        <Arrow x1={296} y1={48} x2={310} y2={48} color={grey} width={1.5} />
        <path d="M352,62 L352,96 L50,96 L50,64" fill="none" stroke={st.back ? tok('safe') : grey} strokeWidth={st.back ? 2.5 : 1.5} />
        <polygon points="50,62 46,70 54,70" fill={st.back ? tok('safe') : grey} />
        <T x={200} y={108} size={10} anchor="middle" fill={st.back ? tok('safe') : tok('muted')}>yes: keep it (feedback)</T>
        <Arrow x1={92} y1={174} x2={106} y2={174} color={grey} width={1.5} />
        <Arrow x1={192} y1={174} x2={206} y2={174} color={grey} width={1.5} />
        <Arrow x1={296} y1={174} x2={310} y2={174} color={grey} width={1.5} />
        <Arrow x1={352} y1={188} x2={262} y2={218} color={grey} width={1.5} />
        <Arrow x1={296} y1={234} x2={310} y2={234} color={grey} width={1.5} />
        <T x={150} y={234} size={10} anchor="middle" fill={tok('muted')}>no feedback</T>
        {(Object.keys(BOX) as K[]).map(box)}
      </Svg>
    </StepFrame>
  );
}
