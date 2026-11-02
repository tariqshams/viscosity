import { StepFrame, useSteps } from '../../viz/stepper';
import { Svg, T, tok } from '../../viz/svg';
import { PARTS } from '../../../data/outline/index.js';

// Chapter 167: the whole book, part by part. Every part id, title, chapter
// range and count comes from the outline (src/data/outline), so the map
// follows any renumbering or split; only the one-line "what it gave you"
// below is written here (a part without one shows the outline's blurb).
type OutlinePart = { id: string; track: string; title: string; blurb: string; chapters: { n: number }[] };
const ALL = PARTS as OutlinePart[];
const first = (p: OutlinePart) => p.chapters[0].n;
const last = (p: OutlinePart) => p.chapters[p.chapters.length - 1].n;
const total = ALL.reduce((a, p) => a + p.chapters.length, 0);
const max = Math.max(...ALL.map((p) => p.chapters.length));
const tracks = [...new Set(ALL.map((p) => p.track))];

const GAVE: Record<string, string> = {
  I: 'JavaScript and TypeScript in depth, from a first function to modules, types, tests and the raw bytes under a typed array: the language every later part is written in.',
  II: 'The machine underneath: memory as one long array, caches and cache lines, how engines store numbers and objects, AoS against SoA measured, and how to benchmark without fooling yourself.',
  III: 'Drip’s front end and the whole theory of parsing, meaning and types: grammars, automata, scanning, recursive descent, Pratt, LL and LR, a tree-walking interpreter, scope, closures, classes and type systems.',
  IV: 'Drip compiled to bytecode and run on a stack VM of our own, with its hash tables, interned strings, call frames, upvalues and a garbage collector.',
  V: 'Inside real JavaScript engines: V8’s tiers, shapes and inline caches, elements kinds, speculation and deoptimization, garbage collection, JavaScriptCore and SpiderMonkey, and the columnar-array research.',
  VI: 'The middle end: IRs and control-flow graphs, dominators and SSA, dataflow and abstract interpretation, the classic optimisations, alias and escape analysis, and pass managers.',
  VII: 'A native back end for RISC-V: machine code and assembly, calling conventions, instruction selection, register allocation, scheduling, linking and a tiny JIT.',
  VIII: 'Viscosity, built: plugins and VIR, the JavaScript front end, finding collections, proving safety, the cost model, SoA and AoSoA code, PGO, explain, and differential tests.',
  IX: 'Beyond JavaScript: a Python front end on the same IR, WebAssembly as a target, the research frontier, and shipping version 0.0.1.',
  X: 'How real languages implement their features: objects, traits, generics, exceptions, pattern matching, generators, async, Unicode strings, macros, borrow checking, concurrency and modern collectors.',
  XI: 'Rust in depth, for a TypeScript programmer: ownership and borrowing, enums and match, traits and generics, lifetimes, arenas, memory layout, threads, macros, unsafe code and WebAssembly.',
  XII: 'drip-rs: the Drip VM rebuilt in Rust with typed arena handles and a collector, judged by the same corpus and measured against both TypeScript implementations.',
  XIII: 'Viscosity in Rust: VIR in arenas, the plugin trait, oxc, SSA and a dataflow framework, every analysis and generator, explain, PGO, WebAssembly, fuzzing and byte-for-byte parity.',
  XIV: 'Shipping: a command-line interface, the release process that put every package on its registry, the final benchmark matrix, and this chapter.',
};

const trackLabel = (t: string) => {
  const ps = ALL.filter((p) => p.track === t);
  return `Track ${t}: Parts ${ps[0].id}–${ps[ps.length - 1].id}, chapters ${first(ps[0])}–${last(ps[ps.length - 1])}`;
};

const STATES = [
  { i: -1, note: `The whole book: ${total} chapters in ${ALL.length} parts. ${tracks.map(trackLabel).join('; ')}. Track A builds everything in TypeScript; Track B learns Rust and builds it all again. Step through the parts.` },
  ...ALL.map((p, i) => ({ i, note: `Part ${p.id}, ${p.title} (chapters ${first(p)}–${last(p)}, ${p.chapters.length} chapters): ${GAVE[p.id] ?? p.blurb}` })),
];

export default function BookSteps() {
  const s = useSteps(STATES);
  const hi = s.state.i;
  const rowH = 17;
  const top = 24;
  const X = 52;
  const W = 280;
  return (
    <StepFrame title="The whole book, part by part" steps={s} note={s.state.note}>
      <Svg w={400} h={top + ALL.length * rowH + 22} title="Every part of the book as a bar whose length is its number of chapters, Track A and Track B">
        <rect x={8} y={4} width={10} height={10} rx={2} fill={tok('accent')} />
        <T x={22} y={9} size={11}>Track A (TypeScript)</T>
        <rect x={170} y={4} width={10} height={10} rx={2} fill={tok('brand')} />
        <T x={184} y={9} size={11}>Track B (Rust)</T>
        {ALL.map((p, i) => {
          const y = top + i * rowH;
          const on = hi === -1 || hi === i;
          const c = p.track === 'A' ? 'accent' : 'brand';
          const w = (p.chapters.length / max) * W;
          return (
            <g key={p.id} opacity={on ? 1 : 0.35}>
              <T x={8} y={y + 6} size={11} mono weight={hi === i ? 700 : undefined}>{p.id}</T>
              <rect x={X} y={y} width={w} height={12} rx={2} fill={tok(c, hi === i ? 1 : 0.6)} />
              <T x={X + w + 4} y={y + 6} size={11} mono fill={tok('muted')}>{`${first(p)}–${last(p)}`}</T>
            </g>
          );
        })}
        <T x={8} y={top + ALL.length * rowH + 10} size={11} fill={tok('muted')}>{`bar length: chapters in the part (most: ${max})`}</T>
      </Svg>
    </StepFrame>
  );
}
