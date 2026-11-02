export default {
  id: 'XII', section: 'deep', days: '10–15', title: 'Deep dive: the middle end in depth',
  blurb: 'Classic SSA construction, monotone frameworks, the classic dataflow problems, liveness and dead code, value numbering, LICM, strength reduction, PRE and lazy code motion, loop transforms, Datalog analyses, type inference, sea of nodes, and pass managers.',
  chapters: [
    { n: 204, title: 'Dominance frontiers and classic SSA construction', introduces: {
      'ssa-construction': 'placing phi nodes at iterated dominance frontiers, then renaming (Cytron et al.)',
    } },
    { n: 205, title: 'The classic dataflow problems', introduces: {
      'gen-kill': 'describing a block by what it creates and destroys',
      'reaching-definitions': 'which assignments may reach a point',
    } },
    { n: 206, title: 'Available and very busy expressions', introduces: {
      'available-expressions': 'which computations are already done on every path',
      'very-busy-expressions': 'which computations every path will do next',
    } },
    { n: 207, title: 'Lattices and monotone frameworks', introduces: {} },
    { n: 208, title: 'Abstract interpretation and widening', introduces: {
      'abstract-interpretation': 'running a program on abstract values to learn facts',
      'abstract-domain': 'the set of abstract values and how they combine',
      widening: 'jumping ahead so a loop analysis finishes',
    } },
    { n: 209, title: 'Dead code elimination', introduces: {
      dce: 'removing code whose results are never used',
    } },
    { n: 210, title: 'Liveness', introduces: {
      liveness: 'whether a value may still be used later',
    } },
    { n: 211, title: 'Value numbering and common subexpressions', introduces: {
      'value-numbering': 'giving equal computations the same number',
      cse: 'reusing a value instead of recomputing it',
    } },
    { n: 212, title: 'Global value numbering', introduces: {
      gvn: 'value numbering across a whole function',
    } },
    { n: 213, title: 'Partial redundancy elimination', introduces: {
      pre: 'removing computations that are redundant on some paths',
      'anticipable-expressions': 'computations that will certainly happen later',
      'critical-edge': 'an edge whose source has many successors and target many predecessors',
    } },
    { n: 214, title: 'Lazy code motion', introduces: {
      'lazy-code-motion': 'placing computations as late as is still safe',
    } },
    { n: 215, title: 'Loop-invariant code motion', introduces: {
      licm: 'hoisting loop-invariant work out of the loop',
      'loop-preheader': 'a block added just before a loop',
    } },
    { n: 216, title: 'Strength reduction and induction variable elimination', introduces: {
      'strength-reduction': 'replacing a multiply by a running add',
      'induction-variable-elimination': 'removing counters that others can replace',
    } },
    { n: 217, title: 'Loop unrolling and vectorisation', introduces: {
      'loop-unrolling': 'doing several iterations per trip',
      'auto-vectorization': 'the compiler writing SIMD for you',
    } },
    { n: 218, title: 'Dependence analysis, interchange and fusion', introduces: {
      'dependence-analysis': 'which iterations depend on which',
      'loop-interchange-fusion': 'swapping nested loops and merging adjacent ones',
    } },
    { n: 219, title: 'Locality and tiling', introduces: {
      'loop-tiling': 'cutting loops into cache-sized blocks',
    } },
    { n: 220, title: 'The polyhedral model', introduces: {
      'affine-access': 'array indices that are linear in the loop counters',
      'polyhedral-model': 'loop nests as points in a shape, transformed with matrices',
    } },
    { n: 221, title: 'Context sensitivity, and analyses in Datalog', introduces: {} },
    { n: 222, title: 'Type and shape inference', introduces: {} },
    { n: 223, title: 'Sea of nodes and other IR designs', introduces: {
      'sea-of-nodes': 'an IR where only data and control dependencies order instructions',
      'graph-ir': 'IRs as graphs instead of lists',
      'mlir-dialects': 'many small IRs, lowered step by step',
    } },
    { n: 224, title: 'Pass managers', introduces: {
      'compiler-pass': 'one analysis or transformation over the IR',
      'pass-manager': 'the scheduler that runs passes and caches analyses',
      'analysis-invalidation': 'throwing away cached facts after a change',
    } },
  ],
};
