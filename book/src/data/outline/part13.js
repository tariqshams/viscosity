export default {
  id: 'XIII', track: 'B', days: '104–114', title: 'Viscosity in Rust',
  blurb: 'Port the engine: VIR with typed indices, trait-based plugins, the oxc front-end, analyses, code generation, WebAssembly, and differential tests against the TypeScript engine.',
  chapters: [
    { n: 416, title: 'The Rust workspace', introduces: { 'viscosity-rs': 'the Rust implementation of Viscosity' } },
    { n: 417, title: 'VIR in Rust', introduces: { 'ir-arena': 'IR nodes stored in arenas with typed ids' } },
    { n: 418, title: 'The plugin trait', introduces: { 'plugin-trait': 'LanguagePlugin as a Rust trait' } },
    { n: 419, title: 'Parsing with oxc', introduces: { oxc: 'a fast JavaScript toolchain written in Rust' } },
    { n: 420, title: 'Lowering oxc’s AST to VIR', introduces: { 'visitor-pattern': 'walking a tree with a visitor' } },
    { n: 421, title: 'Emitting JavaScript from Rust', introduces: { 'rust-codegen': 'writing output with fmt::Write' } },
    { n: 422, title: 'Round-trip tests across engines', introduces: { 'cross-implementation-tests': 'running TS and Rust engines on the same inputs' } },
    { n: 423, title: 'Dominators and SSA in Rust', introduces: { 'rust-ssa': 'SSA construction over arena IR' } },
    { n: 424, title: 'A generic dataflow framework', introduces: { 'generic-dataflow': 'a dataflow solver generic over the lattice' } },
    { n: 425, title: 'Collection discovery in Rust', introduces: { 'rust-collections-pass': 'the collection pass in Rust' } },
    { n: 426, title: 'Shape inference in Rust', introduces: { 'rust-shape-pass': 'the shape pass in Rust' } },
    { n: 427, title: 'Escape and alias analysis in Rust', introduces: { 'rust-escape-pass': 'the escape and alias passes in Rust' } },
    { n: 428, title: 'Access patterns in Rust', introduces: {
      'rust-access-pass': 'the access-pattern pass in Rust',
    } },
    { n: 429, title: 'Proving an index in bounds in Rust', introduces: {

    } },
    { n: 430, title: 'The cost model in Rust', introduces: {
      'rust-cost-model': 'the cost model in Rust',
    } },
    { n: 431, title: 'Sizes and thresholds in Rust', introduces: {

    } },
    { n: 432, title: 'SoA code generation in Rust', introduces: {
      'rust-soa-codegen': 'SoA emission in Rust',
    } },
    { n: 433, title: 'The order of a field write in Rust', introduces: {

    } },
    { n: 434, title: 'AoSoA in Rust', introduces: {
      'rust-aosoa': 'AoSoA and splitting in Rust',
    } },
    { n: 435, title: 'Block sizes and typed columns in Rust', introduces: {

    } },
    { n: 436, title: 'explain in Rust', introduces: {
      'rust-explain': 'the optimization report in Rust',
    } },
    { n: 437, title: 'Code frames in Rust', introduces: {

    } },
    { n: 438, title: 'PGO in Rust', introduces: {
      'rust-pgo': 'profile loading and use in Rust',
    } },
    { n: 439, title: 'Reading a profile in Rust', introduces: {

    } },
    { n: 440, title: 'The Python plugin in Rust', introduces: { 'rust-python-plugin': 'the Python front-end in Rust' } },
    { n: 441, title: 'TypeScript vs Rust: differential tests', introduces: { 'engine-parity': 'two engines making identical decisions' } },
    { n: 442, title: 'Compiling the engine to WebAssembly', introduces: { 'wasm-pack': 'building npm packages from Rust' } },
    { n: 443, title: 'The npm package', introduces: { 'native-vs-wasm': 'shipping WebAssembly vs native binaries' } },
    { n: 444, title: 'The browser playground', introduces: { playground: 'the compiler running in a web page' } },
    { n: 445, title: 'How fast is the compiler?', introduces: { 'compile-time-performance': 'the compiler’s own speed' } },
    { n: 446, title: 'Fuzzing the Rust engine', introduces: {
      'coverage-guided-fuzzing': 'fuzzing that explores new code paths',
    } },
    { n: 447, title: 'Shrinking a failing program', introduces: {

    } },
    { n: 448, title: 'Diagnostics', introduces: {
      diagnostic: 'a compiler message pointing at source code',
    } },
    { n: 449, title: 'Lines and columns', introduces: {

    } },
    { n: 450, title: 'Compiling in parallel', introduces: {
      'data-parallelism': 'splitting work across CPU cores',
    } },
    { n: 451, title: 'One bad file, and how fast it gets', introduces: {

    } },
    { n: 452, title: 'Keeping it healthy', introduces: {
      'continuous-integration': 'running every check on every change',
    } },
    { n: 453, title: 'The gates: what each check protects', introduces: {

    } },
  ],
};
