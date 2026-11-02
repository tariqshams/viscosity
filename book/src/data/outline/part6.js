export default {
  id: 'VI', section: 'core', days: '13–17', title: 'Core 5: building Viscosity',
  blurb: 'Viscosity in TypeScript: its architecture and IR, parsing and lowering JavaScript, emitting code, finding collections and proving rewrites safe, the cost model, SoA and AoSoA code generation, explain, and benchmarks end to end.',
  chapters: [
    { n: 98, title: 'The architecture of Viscosity and its plugin API', introduces: {
      'viscosity-pipeline': 'front-end → VIR → analyses → layout plan → emit',
      'source-to-source': 'a compiler whose output is source code',
      'language-plugin': 'the interface a language front-end implements',
      'layout-strategy': 'a pluggable way of storing a collection',
    } },
    { n: 99, title: 'VIR: records, collections and opaque values', introduces: {
      vir: 'Viscosity’s language-neutral SSA IR',
      'record-collection-nodes': 'VIR’s first-class Record, Collection and FieldAccess',
    } },
    { n: 100, title: 'Parsing real JavaScript', introduces: {
      estree: 'the standard JavaScript AST format',
      'parser-adapter': 'wrapping a third-party parser behind the plugin API',
    } },
    { n: 101, title: 'Lowering JavaScript to VIR', introduces: {
      'ast-to-ir': 'translating syntax trees into IR',
    } },
    { n: 102, title: 'Emitting JavaScript, and round-trip testing', introduces: {
      codegen: 'turning IR back into output text',
      'pretty-printing': 'emitting readable, formatted code',
      'identity-transform': 'a compile that must change nothing',
    } },
    { n: 103, title: 'Finding collections, and inferring shapes', introduces: {
      'collection-discovery': 'finding arrays of same-shaped records',
      'type-inference': 'deducing types without annotations',
      'shape-inference': 'deducing object shapes statically',
    } },
    { n: 104, title: 'Record shapes', introduces: {
      'record-shape': 'the fields and types of a collection’s elements',
      'shape-stability': 'whether a shape can change after creation',
    } },
    { n: 105, title: 'Access patterns', introduces: {
      'access-pattern': 'which fields a loop reads and writes, and how',
      'hot-loop': 'a loop where most time is spent',
    } },
    { n: 106, title: 'Proving it safe', introduces: {
      'safety-analysis': 'proving no code can observe the layout change',
    } },
    { n: 107, title: 'What Viscosity refuses to touch', introduces: {
      bailout: 'leaving a collection unchanged because safety cannot be proved',
    } },
    { n: 108, title: 'The cost model', introduces: {
      'cost-model': 'estimating whether a layout change pays off',
    } },
    { n: 109, title: 'Telling Viscosity more: annotations and profiles', introduces: {
      annotation: 'a comment that gives the compiler extra instructions',
      pgo: 'using measurements from real runs to guide compilation',
      instrumentation: 'code added to record what a program does',
    } },
    { n: 110, title: 'Generating SoA storage', introduces: {
      'column-storage': 'one typed array per field',
      'soa-container': 'the generated object holding the columns',
    } },
    { n: 111, title: 'Rewriting field accesses and growing collections', introduces: {
      'access-rewriting': 'turning a[i].x into a.x[i]',
      capacity: 'allocated slots vs used slots',
      'amortized-growth': 'doubling so push is cheap on average',
    } },
    { n: 112, title: 'Identity and materialization', introduces: {
      handle: 'a small object that stands for one element of a collection',
      'identity-preservation': 'keeping === and aliasing correct after a layout change',
    } },
    { n: 113, title: 'AoSoA and hot/cold splitting', introduces: {
      'block-size': 'how many elements an AoSoA block holds',
      'field-affinity': 'which fields are used together',
    } },
    { n: 114, title: 'viscosity explain', introduces: {
      'optimization-report': 'explaining every decision the compiler made',
    } },
    { n: 115, title: 'End to end: benchmarks and differential testing at scale', introduces: {
      'end-to-end-benchmark': 'measuring whole programs, not single loops',
      'test-corpus': 'a large collection of programs used for testing',
    } },
  ],
};
