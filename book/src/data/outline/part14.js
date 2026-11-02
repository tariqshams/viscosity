export default {
  id: 'XIV', section: 'deep', days: '22–25', title: 'Deep dive: inside real JavaScript engines',
  blurb: 'Ignition and the tiers above it, hidden classes and slack tracking, feedback vectors, deoptimisation in depth, JavaScriptCore and SpiderMonkey, other VMs, and a lab with the engine flags.',
  chapters: [
    { n: 254, title: 'Ignition and the tiers above it', introduces: {} },
    { n: 255, title: 'Parsing JavaScript for real', introduces: {
      'lazy-parsing': 'pre-parsing function bodies until they are called',
    } },
    { n: 256, title: 'Bytecode caches', introduces: {
      'bytecode-cache': 'reusing compiled bytecode',
    } },
    { n: 257, title: 'Slack tracking and dictionary mode', introduces: {
      'dictionary-mode': 'objects that fall back to a hash table',
    } },
    { n: 258, title: 'Stub caches and feedback vectors', introduces: {
      'holey-array': 'arrays with missing slots',
    } },
    { n: 259, title: 'Escape analysis in V8', introduces: {} },
    { n: 260, title: 'JavaScriptCore and SpiderMonkey', introduces: {
      'engine-diversity': 'why the same code is fast in one engine and slower in another',
    } },
    { n: 261, title: 'GraalJS and Truffle', introduces: {
      'self-optimizing-ast': 'AST nodes that rewrite themselves',
    } },
    { n: 262, title: 'Partial evaluation: compiling by specializing an interpreter', introduces: {
      'partial-evaluation': 'specializing an interpreter for one program',
    } },
    { n: 263, title: 'Columnar arrays at run time: the research', introduces: {
      'columnar-storage': 'storing a field’s values together, like SoA',
      'run-time-transformation': 'changing layout while the program runs',
    } },
    { n: 264, title: 'Watching the engine work', introduces: {
      'natives-syntax': '%DebugPrint and friends',
    } },
  ],
};
