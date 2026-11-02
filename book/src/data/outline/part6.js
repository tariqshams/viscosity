export default {
  id: 'VI', track: 'A', days: '39–46', title: 'The compiler middle-end',
  blurb: 'Intermediate representations, control-flow graphs, dominators, SSA, dataflow analysis, classic optimizations, alias and escape analysis, and pass managers.',
  chapters: [
    { n: 155, title: 'What an IR is for', introduces: { ir: 'intermediate representation: the compiler’s working form of a program', lowering: 'translating to a lower-level form' } },
    { n: 156, title: 'Three-address code', introduces: { 'three-address-code': 'instructions like t1 = a + b', temporary: 'a compiler-made variable' } },
    { n: 157, title: 'Basic blocks and control-flow graphs', introduces: {
      'basic-block': 'straight-line code with one entry and one exit',
    } },
    { n: 158, title: 'Control-flow graphs', introduces: {
      cfg: 'control-flow graph: blocks joined by edges',
    } },
    { n: 159, title: 'Dominators', introduces: {
      dominator: 'a block every path to another block must pass through',
    } },
    { n: 160, title: 'The dominator tree', introduces: {
      'dominator-tree': 'the tree of immediate dominators',
    } },
    { n: 161, title: 'SSA form', introduces: {
      ssa: 'static single assignment: each variable assigned once',
    } },
    { n: 162, title: 'Phi nodes', introduces: {
      'phi-node': 'choosing a value by which edge was taken',
    } },
    { n: 163, title: 'Building SSA', introduces: {
      'ssa-construction': 'placing phi nodes at iterated dominance frontiers, then renaming (Cytron et al.)',
    } },
    { n: 164, title: 'SSA on the fly', introduces: {
      'on-the-fly-ssa': 'building SSA while lowering, asking predecessors for values (Braun et al.)',

    } },
    { n: 165, title: 'Dataflow analysis', introduces: { dataflow: 'computing facts that flow along CFG edges', lattice: 'an ordering of facts used to merge them', fixpoint: 'iterating until nothing changes', worklist: 'the queue of blocks still to process' } },
    { n: 166, title: 'The classic dataflow problems', introduces: {
      'reaching-definitions': 'which assignments may reach a point',
      'available-expressions': 'which computations are already done on every path',
      'very-busy-expressions': 'which computations every path will do next',
      'gen-kill': 'describing a block by what it creates and destroys',
    } },
    { n: 167, title: 'Lattices and abstract interpretation', introduces: {
      'abstract-interpretation': 'running a program on abstract values to learn facts',
      'abstract-domain': 'the set of abstract values and how they combine',
      'monotone-framework': 'dataflow as monotone functions on a lattice',
      widening: 'jumping ahead so a loop analysis finishes',
    } },
    { n: 168, title: 'Constant folding and propagation', introduces: { 'constant-folding': 'computing constant expressions at compile time', 'constant-propagation': 'replacing variables known to be constant' } },
    { n: 169, title: 'Dead code elimination', introduces: { dce: 'removing code whose results are never used', liveness: 'whether a value may still be used later' } },
    { n: 170, title: 'Value numbering and common subexpressions', introduces: {
      'value-numbering': 'giving equal computations the same number',
      cse: 'reusing a value instead of recomputing it',
      gvn: 'value numbering across a whole function',
    } },
    { n: 171, title: 'Partial redundancy elimination', introduces: {
      pre: 'removing computations that are redundant on some paths',
      'anticipable-expressions': 'computations that will certainly happen later',
      'lazy-code-motion': 'placing computations as late as is still safe',
      'critical-edge': 'an edge whose source has many successors and target many predecessors',
    } },
    { n: 172, title: 'Inlining', introduces: { inlining: 'replacing a call with the callee’s body', 'call-graph': 'which functions call which' } },
    { n: 173, title: 'Loops', introduces: { 'natural-loop': 'a loop found from a back edge in the CFG', 'loop-invariant': 'a value that doesn’t change inside a loop', 'induction-variable': 'a variable that steps regularly, like i' } },
    { n: 174, title: 'Loop-invariant code motion and strength reduction', introduces: {
      licm: 'hoisting loop-invariant work out of the loop',
      'strength-reduction': 'replacing a multiply by a running add',
      'induction-variable-elimination': 'removing counters that others can replace',
      'loop-preheader': 'a block added just before a loop',
    } },
    { n: 175, title: 'Loop transformations and vectorisation', introduces: {
      'dependence-analysis': 'which iterations depend on which',
      'loop-unrolling': 'doing several iterations per trip',
      'loop-interchange-fusion': 'swapping nested loops and merging adjacent ones',
      'auto-vectorization': 'the compiler writing SIMD for you',
    } },
    { n: 176, title: 'Locality, tiling and the polyhedral model', introduces: {
      'loop-tiling': 'cutting loops into cache-sized blocks',
      'polyhedral-model': 'loop nests as points in a shape, transformed with matrices',
      'affine-access': 'array indices that are linear in the loop counters',
    } },
    { n: 177, title: 'Alias analysis', introduces: { 'alias-analysis': 'deciding which references may point at the same object', 'points-to': 'the set of objects a reference may point at' } },
    { n: 178, title: 'Interprocedural analysis', introduces: {
      'interprocedural-analysis': 'analysis across function boundaries',
      'context-sensitivity': 'analysing a function separately for each kind of caller',
      'function-summary': 'what a function does, recorded once and reused',
      'datalog-analysis': 'program analyses written as logic rules',
    } },
    { n: 179, title: 'Escape analysis', introduces: { 'escape-analysis': 'deciding whether a reference can leave a region of code', 'escape-sites': 'the places a value can escape: stores, calls, returns' } },
    { n: 180, title: 'Type and shape inference', introduces: { 'type-inference': 'deducing types without annotations', 'shape-inference': 'deducing object shapes statically' } },
    { n: 181, title: 'Sea of nodes and other IR designs', introduces: {
      'sea-of-nodes': 'an IR where only data and control dependencies order instructions',
      'graph-ir': 'IRs as graphs instead of lists',
      'mlir-dialects': 'many small IRs, lowered step by step',
    } },
    { n: 182, title: 'Pass managers', introduces: { 'compiler-pass': 'one analysis or transformation over the IR', 'pass-manager': 'the scheduler that runs passes and caches analyses', 'analysis-invalidation': 'throwing away cached facts after a change' } },
    { n: 183, title: 'Testing compilers', introduces: { 'differential-testing': 'comparing two implementations on many inputs', fuzzing: 'generating random programs to find bugs', 'round-trip-testing': 'parse → print → parse gives the same tree' } },
  ],
};
