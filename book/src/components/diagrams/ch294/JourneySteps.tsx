import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';
import { PARTS } from '../../../data/outline/index.js';

// Chapter 294: Track A, part by part. The part titles, chapter ranges and
// days come from the outline (src/data/outline), so they follow any
// renumbering; only "what you built" and "where it lives" are written here.
type OutlinePart = { id: string; track: string; days: string; title: string; chapters: { n: number }[] };
const ALL = PARTS as OutlinePart[];
const range = (p: OutlinePart) => `${p.chapters[0].n}–${p.chapters[p.chapters.length - 1].n}`;

const BUILT: Record<string, { built: [string, string]; path: string; note: string }> = {
  I: { built: ['functions, closures, classes, modules,', 'TypeScript, tests, typed arrays, JSON'], path: 'the exercises in every chapter', note: 'The JavaScript and TypeScript every later part leans on. Closures came back as Drip’s closures, classes as Drip’s classes, typed arrays as SoA columns, tests as differential tests, and a JSON scanner and parser as a first small front end.' },
  II: { built: ['memory, caches, SIMD, number layouts,', 'AoS vs SoA measured, honest benchmarks'], path: 'engine/ts/packages/bench', note: 'The machine underneath: one long array of bytes, caches that reward walking it in order, and the benchmark suite that measured AoS against SoA. Every later speed claim goes back to committed files.' },
  III: { built: ['Drip: scanner, parsers, tree-walker;', 'automata, LL and LR, types, inference'], path: 'book/companion/ts/src', note: 'Your first language, and the full theory of front ends: regular languages and automata, grammars, recursive descent, Pratt, LL and LR parsing, semantics, and type systems up to Hindley–Milner, around a tree-walking interpreter for Drip.' },
  IV: { built: ['bytecode compiler, stack VM, tables,', 'frames, upvalues, mark-sweep GC'], path: 'book/companion/ts/src/vm', note: 'The same language compiled to bytecode and run on a stack VM with its own hash tables and garbage collector: same output, a different machine, and an honest measurement of what it gained.' },
  V: { built: ['V8’s tiers, shapes, inline caches,', 'deopt, GC, other engines, the research'], path: 'reading, tracing and benchmarks', note: 'How production engines do it: tiers, hidden classes, inline caches, speculation and deoptimization, garbage collection, and the research that turned arrays into columns at run time.' },
  VI: { built: ['IRs, CFGs, dominators, SSA, dataflow,', 'classic optimizations, alias, escape'], path: 'the exercises; then VIR', note: 'The compiler’s middle: IRs, control-flow graphs, SSA, dataflow and abstract interpretation, the classic optimizations, alias and escape analysis, and pass managers. Every analysis in Viscosity is built from this toolkit.' },
  VII: { built: ['RISC-V, calling conventions, selection,', 'register allocation, linking, a JIT'], path: 'runnable code in the chapters', note: 'Everything between an IR and a running binary: RISC-V assembly, calling conventions, instruction selection, register allocation, scheduling, linking, a tiny JIT, and Drip compiled to RISC-V end to end.' },
  VIII: { built: ['VIR, analyses, cost model, SoA and', 'AoSoA codegen, PGO, explain, tests'], path: 'engine/ts/packages/{core,frontend-js,cli}', note: 'Viscosity itself: parse, lower to VIR, find collections, prove safety, decide with a cost model, generate columns, explain every decision, measure, and test it all differentially.' },
  IX: { built: ['a Python front end on the same IR,', 'WebAssembly, open problems, shipping'], path: 'engine/ts/packages/frontend-python', note: 'The payoff of the plugin design, a second language on the same IR; then the edges: WebAssembly, the open problems, and shipping 0.0.1 to npm and crates.io.' },
};

const BUILT_PARTS = ALL.filter((p) => p.id in BUILT);
const AHEAD = ALL.filter((p) => !(p.id in BUILT));
const partX = AHEAD.find((p) => p.track === 'A');
const trackB = AHEAD.filter((p) => p.track === 'B');
const trackBRange = trackB.length ? `${trackB[0].chapters[0].n}–${trackB[trackB.length - 1].chapters.at(-1)!.n}` : '';

const STATES = [
  { i: -1, note: `Track A, part by part: ${BUILT_PARTS.length} parts, chapters ${BUILT_PARTS[0].chapters[0].n} to ${BUILT_PARTS.at(-1)!.chapters.at(-1)!.n}. Step through them: each one built something you can still find, and each one is used by the parts after it.` },
  ...BUILT_PARTS.map((p, i) => ({ i, note: `Part ${p.id}: ${BUILT[p.id].note}` })),
  { i: BUILT_PARTS.length, note: `Ahead: Part ${partX?.id ?? 'X'}, ${partX?.title ?? ''} (chapters ${partX ? range(partX) : ''}), and Track B, chapters ${trackBRange}, which rebuilds Drip and Viscosity in Rust.` },
];

export default function JourneySteps() {
  const s = useSteps(STATES);
  const hi = s.state.i;
  const p = hi >= 0 && hi < BUILT_PARTS.length ? BUILT_PARTS[hi] : null;
  const ahead = hi === BUILT_PARTS.length;
  return (
    <StepFrame title="Track A, part by part" steps={s} note={s.state.note}>
      <Svg w={400} h={316} title="Boxes for the parts of Track A with their chapter ranges from the outline, then a box for Part X and one for Track B, with the highlighted part's title, what you built in it and where it lives">
        {BUILT_PARTS.map((q, k) => {
          const x = 4 + (k % 3) * 132;
          const y = 4 + Math.floor(k / 3) * 46;
          const on = k === hi;
          const done = hi >= 0 && k < hi;
          return (
            <Box key={q.id} x={x} y={y} w={128} h={40} r={6}
              fill={on ? tok('brand', 0.18) : done ? tok('safe', 0.12) : tok('panel')}
              stroke={on ? tok('brand') : done ? tok('safe') : tok('line')}>
              <T x={x + 10} y={y + 20} size={13} weight={700}>Part {q.id}</T>
              <T x={x + 120} y={y + 20} size={11} anchor="end" fill={tok('muted')}>{range(q)}</T>
            </Box>
          );
        })}
        {[partX ? `Part ${partX.id} · ${range(partX)}` : '', `Track B · ${trackBRange}`].map((label, k) => (
          <Box key={k} x={4 + k * 198} y={146} w={194} h={30} r={6} dash fill={ahead ? tok('accent', 0.15) : 'transparent'} stroke={ahead ? tok('accent') : tok('line')}>
            <T x={4 + k * 198 + 97} y={161} size={12} anchor="middle" weight={ahead ? 700 : undefined}>{label}</T>
          </Box>
        ))}
        <Box x={4} y={186} w={392} h={126} fill={tok('panel')} stroke={p ? tok('brand') : tok('line')} dash={!p}>
          <T x={14} y={204} size={13} weight={700}>{p ? p.title : ahead ? 'What comes next' : 'Track A'}</T>
          <T x={14} y={224} size={11} weight={700} fill={tok('muted')}>{p ? `CHAPTERS ${range(p)} · DAYS ${p.days}` : 'WHAT YOU BUILT'}</T>
          {(p ? BUILT[p.id].built : ahead ? ['language features: objects, generics,', 'closures, async, GC; then Rust'] : ['step through to see each part', '']).map((l, j) => (
            <T key={j} x={14} y={244 + j * 17} size={12}>{l}</T>
          ))}
          <T x={14} y={296} size={11} mono fill={tok('muted')}>{p ? BUILT[p.id].path : ''}</T>
        </Box>
      </Svg>
    </StepFrame>
  );
}
