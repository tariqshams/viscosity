import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 233: Track A, part by part: what you built and where it lives in
// the repository. Paths are real (checked 2026-10-31).
type Part = { id: string; ch: string; title: string; built: string[]; path: string };

const PARTS: Part[] = [
  { id: 'I', ch: '1–16', title: 'JavaScript, properly', built: ['functions, closures, classes, modules', 'TypeScript, tests, typed arrays'], path: 'the exercises in every chapter' },
  { id: 'II', ch: '17–24', title: 'The machine underneath', built: ['memory, caches, prefetching, SIMD', 'AoS vs SoA, measured honestly'], path: 'engine/ts/packages/bench' },
  { id: 'III', ch: '25–44', title: 'A tree-walking interpreter', built: ['Drip: scanner, Pratt parser,', 'resolver, closures, classes'], path: 'book/companion/ts/src' },
  { id: 'IV', ch: '45–60', title: 'A bytecode VM', built: ['single-pass compiler, stack VM,', 'upvalues, hash tables, mark-sweep GC'], path: 'book/companion/ts/src/vm' },
  { id: 'V', ch: '61–72', title: 'Real engines', built: ['V8’s tiers, shapes, inline caches,', 'deoptimization, GC; the research'], path: 'reading, tracing and benchmarks' },
  { id: 'VI', ch: '73–88', title: 'Compiler middle ends', built: ['IR, CFGs, dominators, SSA,', 'dataflow, passes, compiler testing'], path: 'the exercises; then VIR' },
  { id: 'VII', ch: '89–112', title: 'Viscosity', built: ['VIR, analyses, cost model, SoA and', 'AoSoA codegen, PGO, explain'], path: 'engine/ts/packages/{core,frontend-js,cli}' },
  { id: 'VIII', ch: '113–120', title: 'Beyond JavaScript', built: ['a Python front-end on the same IR,', 'WebAssembly, open problems, shipping'], path: 'engine/ts/packages/frontend-python' },
];

const NOTES = [
  'Thirty days, eight parts. Step through them: each one built something you can still find in the repository, and each one is used by the parts after it.',
  'Part I: the JavaScript every later part leans on. Closures came back as Drip’s closures, classes as Drip’s classes, typed arrays as SoA columns, tests as differential tests.',
  'Part II: the hardware. One long array of bytes, caches that reward walking it in order, and the benchmark suite that measured AoS against SoA. Every later speed claim goes back to these files.',
  'Part III: your first language. A scanner, a Pratt parser and a resolver feeding a tree-walking interpreter that runs real Drip programs, checked against a shared test corpus.',
  'Part IV: the same language, compiled to bytecode and run on a stack VM with its own heap and garbage collector. Same output, different machine.',
  'Part V: how production engines do it. Tiers, hidden classes, inline caches, speculation and deoptimization, and the research that turned arrays into columns at run time.',
  'Part VI: the compiler’s middle. IRs, control-flow graphs, SSA, dataflow, and passes, the toolkit every analysis in Part VIII is built from.',
  'Part VIII: Viscosity itself. Parse, lower to VIR, find collections, prove safety, decide with a cost model, generate columns, explain, measure, and test it all differentially.',
  'Part IX: the payoff of the plugin design, a second language on the same IR; then the edges, WebAssembly, the open problems, and what shipping takes.',
];

export default function JourneySteps() {
  const s = useSteps(NOTES.map((n, i) => ({ n, i: i - 1 })));
  const hi = s.state.i;
  const p = hi >= 0 ? PARTS[hi] : null;
  return (
    <StepFrame title="Track A, part by part" steps={s} note={s.state.n}>
      <Svg w={400} h={268} title="Eight boxes for Parts I to IX of the book, with the highlighted part's chapters, what you built in it and where it lives in the repository">
        {PARTS.map((q, k) => {
          const x = 4 + (k % 4) * 99;
          const y = 4 + Math.floor(k / 4) * 54;
          const on = k === hi;
          const done = hi >= 0 && k < hi;
          return (
            <Box key={q.id} x={x} y={y} w={94} h={48} r={6}
              fill={on ? tok('brand', 0.18) : done ? tok('safe', 0.12) : tok('panel')}
              stroke={on ? tok('brand') : done ? tok('safe') : tok('line')}>
              <T x={x + 47} y={y + 17} size={13} weight={700} anchor="middle">Part {q.id}</T>
              <T x={x + 47} y={y + 35} size={10} anchor="middle" fill={tok('muted')}>ch. {q.ch}</T>
            </Box>
          );
        })}
        <Box x={4} y={118} w={392} h={146} fill={tok('panel')} stroke={p ? tok('brand') : tok('line')} dash={!p}>
          <T x={14} y={136} size={14} weight={700}>{p ? p.title : 'Days 1 to 30'}</T>
          <T x={14} y={160} size={10} weight={700} fill={tok('muted')}>WHAT YOU BUILT</T>
          {(p ? p.built : ['step through to see each part']).map((l, j) => (
            <T key={j} x={14} y={178 + j * 17} size={12}>{l}</T>
          ))}
          <T x={14} y={226} size={10} weight={700} fill={tok('muted')}>WHERE IT LIVES</T>
          <T x={14} y={245} size={11} mono>{p ? p.path : ''}</T>
        </Box>
      </Svg>
    </StepFrame>
  );
}
