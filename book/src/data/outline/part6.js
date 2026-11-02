export default {
  id: 'VI', track: 'A', days: '47–57', title: 'The compiler middle-end',
  blurb: 'Intermediate representations, control-flow graphs, dominators, SSA, dataflow analysis, classic optimizations, alias and escape analysis, and pass managers.',
  chapters: [
    { n: 185, title: 'What an IR is for', introduces: { ir: 'intermediate representation: the compiler’s working form of a program', lowering: 'translating to a lower-level form' } },
    { n: 186, title: 'Three-address code', introduces: { 'three-address-code': 'instructions like t1 = a + b', temporary: 'a compiler-made variable' } },
    { n: 187, title: 'Basic blocks and control-flow graphs', introduces: {
      'basic-block': 'straight-line code with one entry and one exit',
    } },
    { n: 188, title: 'Control-flow graphs', introduces: {
      cfg: 'control-flow graph: blocks joined by edges',
    } },
    { n: 189, title: 'Dominators', introduces: {
      dominator: 'a block every path to another block must pass through',
    } },
    { n: 190, title: 'The dominator tree', introduces: {
      'dominator-tree': 'the tree of immediate dominators',
    } },
    { n: 191, title: 'SSA form', introduces: {
      ssa: 'static single assignment: each variable assigned once',
    } },
    { n: 192, title: 'Phi nodes', introduces: {
      'phi-node': 'choosing a value by which edge was taken',
    } },
    { n: 193, title: 'Building SSA', introduces: {
      'ssa-construction': 'placing phi nodes at iterated dominance frontiers, then renaming (Cytron et al.)',
    } },
    { n: 194, title: 'SSA on the fly', introduces: {
      'on-the-fly-ssa': 'building SSA while lowering, asking predecessors for values (Braun et al.)',

    } },
    { n: 195, title: 'Dataflow analysis', introduces: {
      dataflow: 'computing facts that flow along CFG edges',
      lattice: 'an ordering of facts used to merge them',
    } },
    { n: 196, title: 'Fixpoints and worklists', introduces: {
      fixpoint: 'iterating until nothing changes',
      worklist: 'the queue of blocks still to process',
    } },
    { n: 197, title: 'The classic dataflow problems', introduces: {
      'reaching-definitions': 'which assignments may reach a point',
      'gen-kill': 'describing a block by what it creates and destroys',
    } },
    { n: 198, title: 'Available and very busy expressions', introduces: {
      'available-expressions': 'which computations are already done on every path',
      'very-busy-expressions': 'which computations every path will do next',
    } },
    { n: 199, title: 'Lattices and monotone frameworks', introduces: {
      'monotone-framework': 'dataflow as monotone functions on a lattice',
    } },
    { n: 200, title: 'Abstract interpretation and widening', introduces: {
      'abstract-interpretation': 'running a program on abstract values to learn facts',
      'abstract-domain': 'the set of abstract values and how they combine',
      widening: 'jumping ahead so a loop analysis finishes',
    } },
    { n: 201, title: 'Constant folding and propagation', introduces: {
      'constant-folding': 'computing constant expressions at compile time',
    } },
    { n: 202, title: 'Sparse conditional constant propagation', introduces: {
      'constant-propagation': 'replacing variables known to be constant',
    } },
    { n: 203, title: 'Dead code elimination', introduces: {
      dce: 'removing code whose results are never used',
    } },
    { n: 204, title: 'Liveness', introduces: {
      liveness: 'whether a value may still be used later',
    } },
    { n: 205, title: 'Value numbering and common subexpressions', introduces: {
      'value-numbering': 'giving equal computations the same number',
      cse: 'reusing a value instead of recomputing it',
    } },
    { n: 206, title: 'Global value numbering', introduces: {
      gvn: 'value numbering across a whole function',
    } },
    { n: 207, title: 'Partial redundancy elimination', introduces: {
      pre: 'removing computations that are redundant on some paths',
      'anticipable-expressions': 'computations that will certainly happen later',
      'critical-edge': 'an edge whose source has many successors and target many predecessors',
    } },
    { n: 208, title: 'Lazy code motion', introduces: {
      'lazy-code-motion': 'placing computations as late as is still safe',
    } },
    { n: 209, title: 'Inlining', introduces: {
      inlining: 'replacing a call with the callee’s body',
    } },
    { n: 210, title: 'The call graph', introduces: {
      'call-graph': 'which functions call which',
    } },
    { n: 211, title: 'Loops', introduces: {
      'natural-loop': 'a loop found from a back edge in the CFG',
    } },
    { n: 212, title: 'Induction variables and loop invariants', introduces: {
      'induction-variable': 'a variable that steps regularly, like i',
      'loop-invariant': 'a value that doesn’t change inside a loop',
    } },
    { n: 213, title: 'Loop-invariant code motion', introduces: {
      licm: 'hoisting loop-invariant work out of the loop',
      'loop-preheader': 'a block added just before a loop',
    } },
    { n: 214, title: 'Strength reduction and induction variable elimination', introduces: {
      'strength-reduction': 'replacing a multiply by a running add',
      'induction-variable-elimination': 'removing counters that others can replace',
    } },
    { n: 215, title: 'Loop unrolling and vectorisation', introduces: {
      'loop-unrolling': 'doing several iterations per trip',
      'auto-vectorization': 'the compiler writing SIMD for you',
    } },
    { n: 216, title: 'Dependence analysis, interchange and fusion', introduces: {
      'dependence-analysis': 'which iterations depend on which',
      'loop-interchange-fusion': 'swapping nested loops and merging adjacent ones',
    } },
    { n: 217, title: 'Locality, tiling and the polyhedral model', introduces: {
      'loop-tiling': 'cutting loops into cache-sized blocks',
    } },
    { n: 218, title: 'The polyhedral model', introduces: {
      'affine-access': 'array indices that are linear in the loop counters',
      'polyhedral-model': 'loop nests as points in a shape, transformed with matrices',
    } },
    { n: 219, title: 'Alias analysis', introduces: { 'alias-analysis': 'deciding which references may point at the same object', 'points-to': 'the set of objects a reference may point at' } },
    { n: 220, title: 'Interprocedural analysis', introduces: {
      'interprocedural-analysis': 'analysis across function boundaries',
      'context-sensitivity': 'analysing a function separately for each kind of caller',
      'function-summary': 'what a function does, recorded once and reused',
      'datalog-analysis': 'program analyses written as logic rules',
    } },
    { n: 221, title: 'Escape analysis', introduces: { 'escape-analysis': 'deciding whether a reference can leave a region of code', 'escape-sites': 'the places a value can escape: stores, calls, returns' } },
    { n: 222, title: 'Type and shape inference', introduces: { 'type-inference': 'deducing types without annotations', 'shape-inference': 'deducing object shapes statically' } },
    { n: 223, title: 'Sea of nodes and other IR designs', introduces: {
      'sea-of-nodes': 'an IR where only data and control dependencies order instructions',
      'graph-ir': 'IRs as graphs instead of lists',
      'mlir-dialects': 'many small IRs, lowered step by step',
    } },
    { n: 224, title: 'Pass managers', introduces: { 'compiler-pass': 'one analysis or transformation over the IR', 'pass-manager': 'the scheduler that runs passes and caches analyses', 'analysis-invalidation': 'throwing away cached facts after a change' } },
    { n: 225, title: 'Testing compilers', introduces: { 'differential-testing': 'comparing two implementations on many inputs', fuzzing: 'generating random programs to find bugs', 'round-trip-testing': 'parse → print → parse gives the same tree' } },
  ],
};
