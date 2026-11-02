export default {
  id: 'V', track: 'A', days: '41–46', title: 'Inside real JavaScript engines',
  blurb: 'V8’s tiers, shapes and inline caches, elements kinds, speculation and deoptimization, garbage collection, other engines, and the columnar-array research.',
  chapters: [
    { n: 164, title: 'The V8 pipeline', introduces: {
      tiering: 'running code in faster tiers as it gets hot',
      'jit-compiler': 'compiling while the program runs',
    } },
    { n: 165, title: 'Ignition and the tiers above it', introduces: {
      ignition: 'V8’s bytecode interpreter',
      'optimizing-tiers': 'Sparkplug, Maglev and TurboFan',
    } },
    { n: 166, title: 'Parsing JavaScript for real', introduces: {
      'lazy-parsing': 'pre-parsing function bodies until they are called',
    } },
    { n: 167, title: 'Bytecode caches', introduces: {
      'bytecode-cache': 'reusing compiled bytecode',
    } },
    { n: 168, title: 'Shapes in depth', introduces: {
      shape: 'a hidden class describing an object’s layout',
      'transition-tree': 'the tree of shapes created as properties are added',
    } },
    { n: 169, title: 'Slack tracking and dictionary mode', introduces: {
      'dictionary-mode': 'objects that fall back to a hash table',
    } },
    { n: 170, title: 'Inline caches', introduces: {
      'inline-cache': 'remembering the shape seen at a property access',
      monomorphic: 'one shape seen',
    } },
    { n: 171, title: 'Polymorphic and megamorphic sites', introduces: {
      polymorphic: 'a few shapes seen',
      megamorphic: 'too many shapes: slow path',
    } },
    { n: 172, title: 'Elements kinds', introduces: {
      'elements-kind': 'how V8 stores an array’s elements: SMI, DOUBLE or ELEMENTS',
    } },
    { n: 173, title: 'Holey arrays', introduces: {
      'holey-array': 'arrays with missing slots',
    } },
    { n: 174, title: 'Speculation and deoptimization', introduces: {
      'type-feedback': 'the types observed while running',
      speculation: 'optimizing for what was seen so far',
    } },
    { n: 175, title: 'Deoptimization', introduces: {
      deoptimization: 'bailing back to the interpreter when a guess fails',
    } },
    { n: 176, title: 'Escape analysis in V8', introduces: { 'allocation-sinking': 'removing allocations that never escape', 'scalar-replacement': 'replacing an object with its fields as local values' } },
    { n: 177, title: 'V8’s garbage collector', introduces: {
      scavenger: 'the young-generation copying collector',
    } },
    { n: 178, title: 'Mark-compact and the write barrier', introduces: {
      'mark-compact': 'old-generation collection with compaction',
      'write-barrier': 'bookkeeping when old objects point at young ones',
    } },
    { n: 179, title: 'JavaScriptCore and SpiderMonkey', introduces: { 'engine-diversity': 'why the same code is fast in one engine and slower in another' } },
    { n: 180, title: 'GraalJS and Truffle', introduces: {
      'self-optimizing-ast': 'AST nodes that rewrite themselves',
    } },
    { n: 181, title: 'Partial evaluation: compiling by specializing an interpreter', introduces: {
      'partial-evaluation': 'specializing an interpreter for one program',
    } },
    { n: 182, title: 'Columnar arrays at run time: the research', introduces: { 'columnar-storage': 'storing a field’s values together, like SoA', 'run-time-transformation': 'changing layout while the program runs' } },
    { n: 183, title: 'Watching the engine work', introduces: {
      'engine-tracing': 'flags like --trace-opt and --trace-deopt',
    } },
    { n: 184, title: 'Looking inside objects with natives syntax', introduces: {
      'natives-syntax': '%DebugPrint and friends',
    } },
  ],
};
