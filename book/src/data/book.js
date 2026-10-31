// The book's identity and the full 50-day curriculum (Track A in
// TypeScript, then Track B in Rust). Chapters that are written come from
// the content collection; planned ones are listed here so the contents
// page shows the whole journey.

export const BOOK = {
  title: 'Viscosity',
  subtitle: 'From a Little JavaScript to Engines and Compilers',
  author: 'Tariq Shams',
  edition: 'Early edition',
  description:
    'An interactive book by Tariq Shams. It takes you from knowing if and for loops to building interpreters, virtual machines and Viscosity, a compiler that changes how data is laid out in memory. Everything runs in your browser.',
};

export const PARTS = [
  { id: 'I', track: 'A', days: '1–4', title: 'JavaScript for engine builders',
    blurb: 'Functions, arrays, objects, references, closures, classes, modules, TypeScript, testing, and the raw bytes behind typed arrays.',
    planned: [
      'Functions: naming a piece of work', 'Arrays: a row of numbered boxes',
      'Objects: things with named parts', 'References: two names, one object',
      'Functions as values', 'Closures: functions that remember',
      'Classes and constructors', 'Map and Set', 'Recursion',
      'Modules: import and export', 'Errors and exceptions',
      'TypeScript I: types as labels', 'TypeScript II: interfaces, unions, generics',
      'Testing your code', 'Iterators and generators',
      'Bits, bytes and typed arrays',
    ] },
  { id: 'II', track: 'A', days: '5–6', title: 'How machines run code',
    blurb: 'Memory, CPU caches and cache lines, prefetching, SIMD, how numbers are stored, AoS vs SoA, and how to benchmark honestly.' },
  { id: 'III', track: 'A', days: '7–11', title: 'A tree-walking interpreter',
    blurb: 'Build Drip, a small language: grammars, scanning, recursive descent and Pratt parsing, evaluation, environments, closures, classes.' },
  { id: 'IV', track: 'A', days: '12–15', title: 'A bytecode virtual machine',
    blurb: 'Compile Drip to bytecode and run it on a stack VM. Hash tables, string interning, and a garbage collector.' },
  { id: 'V', track: 'A', days: '16–18', title: 'Inside real JavaScript engines',
    blurb: 'V8’s pipeline, shapes and inline caches, elements kinds, deoptimization, and how other engines differ.' },
  { id: 'VI', track: 'A', days: '19–22', title: 'The compiler middle-end',
    blurb: 'IR design, control-flow graphs, SSA, dataflow analysis, escape and alias analysis, pass managers.' },
  { id: 'VII', track: 'A', days: '23–28', title: 'Building Viscosity',
    blurb: 'The plugin architecture, VIR, shape inference, the layout cost model, SoA and AoSoA code generation, profile-guided optimization, differential testing.' },
  { id: 'VIII', track: 'A', days: '29–30', title: 'Beyond JavaScript',
    blurb: 'A Python front-end plugin, the research frontier, and shipping.' },
  { id: 'IX', track: 'B', days: '31–36', title: 'Rust for TypeScript developers',
    blurb: 'Ownership and borrowing drawn as pictures, enums and match, traits, lifetimes, testing, and memory layout.' },
  { id: 'X', track: 'B', days: '37–42', title: 'Drip in Rust',
    blurb: 'Rebuild the bytecode VM in Rust, with arenas and a garbage collector, and benchmark it against the TypeScript one.' },
  { id: 'XI', track: 'B', days: '43–49', title: 'Viscosity in Rust',
    blurb: 'Port the engine: VIR with typed indices, trait-based plugins, the oxc front-end, WebAssembly, and differential tests against the TypeScript engine.' },
  { id: 'XII', track: 'B', days: '50', title: 'Shipping',
    blurb: 'Command-line interface, release builds, the TypeScript vs Rust benchmark matrix, and the capstone.' },
];

export const CHAPTERS_PER_DAY = 4;
