export default {
  id: 'IX', section: 'core', days: '26–30', title: 'Core 8: Viscosity in Rust, and shipping it',
  blurb: 'The Viscosity port: the workspace, VIR and the plugin trait, oxc and lowering, emitting, the analyses and cost model, SoA and AoSoA codegen, explain and diagnostics, profiles, WebAssembly and npm, differential tests, a CLI, CI and release, the final benchmarks, and the capstone.',
  chapters: [
    { n: 148, title: 'The Rust workspace', introduces: {
      'viscosity-rs': 'the Rust implementation of Viscosity',
    } },
    { n: 149, title: 'VIR and the plugin trait in Rust', introduces: {
      'ir-arena': 'IR nodes stored in arenas with typed ids',
      'plugin-trait': 'LanguagePlugin as a Rust trait',
    } },
    { n: 150, title: 'Parsing with oxc and lowering to VIR', introduces: {
      oxc: 'a fast JavaScript toolchain written in Rust',
      'visitor-pattern': 'walking a tree with a visitor',
    } },
    { n: 151, title: 'Emitting JavaScript from Rust, and round trips', introduces: {
      'rust-codegen': 'writing output with fmt::Write',
      'cross-implementation-tests': 'running TS and Rust engines on the same inputs',
    } },
    { n: 152, title: 'Dominators, SSA and dataflow in Rust', introduces: {
      'rust-ssa': 'SSA construction over arena IR',
      'generic-dataflow': 'a dataflow solver generic over the lattice',
    } },
    { n: 153, title: 'Collections and shapes in Rust', introduces: {
      'rust-collections-pass': 'the collection pass in Rust',
      'rust-shape-pass': 'the shape pass in Rust',
    } },
    { n: 154, title: 'Escape and alias analysis in Rust', introduces: {
      'rust-escape-pass': 'the escape and alias passes in Rust',
    } },
    { n: 155, title: 'Access patterns and bounds proofs in Rust', introduces: {
      'rust-access-pass': 'the access-pattern pass in Rust',
    } },
    { n: 156, title: 'The cost model and thresholds in Rust', introduces: {
      'rust-cost-model': 'the cost model in Rust',
    } },
    { n: 157, title: 'SoA code generation in Rust', introduces: {
      'rust-soa-codegen': 'SoA emission in Rust',
    } },
    { n: 158, title: 'AoSoA, block sizes and typed columns in Rust', introduces: {
      'rust-aosoa': 'AoSoA and splitting in Rust',
    } },
    { n: 159, title: 'explain, code frames and diagnostics in Rust', introduces: {
      'rust-explain': 'the optimization report in Rust',
      diagnostic: 'a compiler message pointing at source code',
    } },
    { n: 160, title: 'Profiles in Rust: writing and reading them', introduces: {
      'rust-pgo': 'profile loading and use in Rust',
    } },
    { n: 161, title: 'WebAssembly: the target, and the engine compiled to it', introduces: {
      webassembly: 'a portable low-level binary format',
      'linear-memory': 'WebAssembly’s single flat memory',
      'wasm-bindgen': 'generating JS bindings for Rust WebAssembly',
      'wasm-pack': 'building npm packages from Rust',
    } },
    { n: 162, title: 'Packages, versions and the npm package', introduces: {
      'npm-package': 'publishing a library to npm',
      'semantic-versioning': 'major.minor.patch versions',
      'native-vs-wasm': 'shipping WebAssembly vs native binaries',
    } },
    { n: 163, title: 'TypeScript against Rust: differential tests, fuzzing and shrinking', introduces: {
      'engine-parity': 'two engines making identical decisions',
      'coverage-guided-fuzzing': 'fuzzing that explores new code paths',
    } },
    { n: 164, title: 'A command-line interface', introduces: {
      cli: 'a program driven from the terminal',
      'argument-parsing': 'turning command-line flags into options',
    } },
    { n: 165, title: 'Keeping it healthy: CI, gates and releases', introduces: {
      'continuous-integration': 'running every check on every change',
      'release-process': 'versioning, changelogs and publishing',
    } },
    { n: 166, title: 'The final benchmark matrix, and how fast the compiler is', introduces: {
      'compile-time-performance': 'the compiler’s own speed',
      'benchmark-matrix': 'every layout × engine × implementation',
    } },
    { n: 167, title: 'Capstone: the whole machine', introduces: {
      capstone: 'putting it all together',
      mastery: 'being able to build it again yourself',
    } },
  ],
};
