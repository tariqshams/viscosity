export default {
  id: 'V', track: 'A', days: '22–25', title: 'Inside real JavaScript engines',
  blurb: 'V8’s tiers, shapes and inline caches, elements kinds, speculation and deoptimization, garbage collection, other engines, and the columnar-array research.',
  chapters: [
    { n: 88, title: 'The V8 pipeline', introduces: { tiering: 'running code in faster tiers as it gets hot', 'jit-compiler': 'compiling while the program runs', ignition: 'V8’s bytecode interpreter', 'optimizing-tiers': 'Sparkplug, Maglev and TurboFan' } },
    { n: 89, title: 'Parsing JavaScript for real', introduces: { 'lazy-parsing': 'pre-parsing function bodies until they are called', 'bytecode-cache': 'reusing compiled bytecode' } },
    { n: 90, title: 'Shapes in depth', introduces: { shape: 'a hidden class describing an object’s layout', 'transition-tree': 'the tree of shapes created as properties are added', 'dictionary-mode': 'objects that fall back to a hash table' } },
    { n: 91, title: 'Inline caches', introduces: { 'inline-cache': 'remembering the shape seen at a property access', monomorphic: 'one shape seen', polymorphic: 'a few shapes seen', megamorphic: 'too many shapes: slow path' } },
    { n: 92, title: 'Elements kinds', introduces: { 'elements-kind': 'how V8 stores an array’s elements: SMI, DOUBLE or ELEMENTS', 'holey-array': 'arrays with missing slots' } },
    { n: 93, title: 'Speculation and deoptimization', introduces: { 'type-feedback': 'the types observed while running', speculation: 'optimizing for what was seen so far', deoptimization: 'bailing back to the interpreter when a guess fails' } },
    { n: 94, title: 'Escape analysis in V8', introduces: { 'allocation-sinking': 'removing allocations that never escape', 'scalar-replacement': 'replacing an object with its fields as local values' } },
    { n: 95, title: 'V8’s garbage collector', introduces: { scavenger: 'the young-generation copying collector', 'mark-compact': 'old-generation collection with compaction', 'write-barrier': 'bookkeeping when old objects point at young ones' } },
    { n: 96, title: 'JavaScriptCore and SpiderMonkey', introduces: { 'engine-diversity': 'why the same code is fast in one engine and slower in another' } },
    { n: 97, title: 'GraalJS and Truffle', introduces: { 'partial-evaluation': 'specializing an interpreter for one program', 'self-optimizing-ast': 'AST nodes that rewrite themselves' } },
    { n: 98, title: 'Columnar arrays at run time: the research', introduces: { 'columnar-storage': 'storing a field’s values together, like SoA', 'run-time-transformation': 'changing layout while the program runs' } },
    { n: 99, title: 'Watching the engine work', introduces: { 'engine-tracing': 'flags like --trace-opt and --trace-deopt', 'natives-syntax': '%DebugPrint and friends' } },
  ],
};
