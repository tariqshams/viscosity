// New references for chapter 231 (Leaving SSA) and its staged second half
// (231-b, parallel copies and the swap problem). Network note: in this
// session doi.org, the publishers' pages and the authors' pages could not
// be reached; GitHub could. Each checkedAgainst says exactly what was read.
export default [
  {
    id: 'briggs1998',
    authors: ['Preston Briggs', 'Keith D. Cooper', 'Timothy J. Harvey', 'L. Taylor Simpson'],
    title: 'Practical Improvements to the Construction and Destruction of Static Single Assignment Form',
    venue: 'Software: Practice and Experience 28(8), pp. 859–881',
    year: 1998,
    doi: null,
    url: 'https://web.eecs.umich.edu/~mahlke/courses/583f23/reading/briggs_spe_98.pdf',
    accessed: '2026-11-02',
    checkedAgainst: 'Search records only (the Wiley page and doi.org were unreachable, and no DOI could be confirmed, so none is given): the BibTeX entry briggs98practical (authors Preston Briggs, Keith D. Cooper, Timothy J. Harvey and L. Taylor Simpson; Software: Practice and Experience 28(8), July 1998, pages 859–881); the University of Michigan EECS 583 course-reading copy (the url above, indexed with the key words “lost-copy problem” and “swap problem”); the abstract as indexed: three improvements, two to the SSA construction of Cytron et al. (including semi-pruned SSA) and a third, on translating SSA back to executable code, “needed to ensure correctness in the face of aggressive SSA-based program transformations”.',
    shaped: 'Chapters 231 and 231-b: the lost-copy problem and the swap problem, and why naive phi removal is wrong after optimisation.',
  },
  {
    id: 'boissinot2009',
    authors: ['Benoit Boissinot', 'Alain Darte', 'Fabrice Rastello', 'Benoît Dupont de Dinechin', 'Christophe Guillon'],
    title: 'Revisiting Out-of-SSA Translation for Correctness, Code Quality, and Efficiency',
    venue: 'International Symposium on Code Generation and Optimization (CGO 2009), IEEE, pp. 114–125',
    year: 2009,
    doi: null,
    url: 'https://inria.hal.science/inria-00349925',
    accessed: '2026-11-02',
    checkedAgainst: 'Search records only (HAL, IEEE and doi.org pages were unreachable): the HAL preprint inria-00349925 (versions 2 and 3, as indexed at hal-univ-tlse3.archives-ouvertes.fr) with the five authors above; the Glasgow SSA bibliography BibTeX entry (CGO 2009, pages 114–125). The abstract as indexed: a coalescing-based out-of-SSA method that keeps correctness and copy optimisation separate, “provably correct and simpler to implement”, producing fewer copies, and, on SPEC CINT2000, about twice as fast and ten times less memory-hungry than Sreedhar et al.’s Method III, which makes it suitable for just-in-time compilers. Mesa’s NIR out-of-SSA pass (nir_from_ssa.c) is described in its own commit as based on this paper.',
    shaped: 'Chapter 231: the modern recipe, first insert copies so the result is correct, then coalesce them away.',
  },
  {
    id: 'regalloc2',
    authors: ['Chris Fallin', 'Mozilla SpiderMonkey Developers'],
    title: 'regalloc2: another register allocator (README, design overview GENERAL.md, ION.md, FASTALLOC.md, src/moves.rs)',
    venue: 'github.com/bytecodealliance/regalloc2',
    year: 2026,
    doi: null,
    url: 'https://github.com/bytecodealliance/regalloc2',
    accessed: '2026-11-02',
    checkedAgainst: 'A git clone of github.com/bytecodealliance/regalloc2 at commit 4a233442f781dd7b84d5ea40504d3be07263b3e3 (6 October 2026). README.md: it “started life as, and is about 50% still, a port of IonMonkey’s backtracking register allocator to Rust”. doc/GENERAL.md: it “takes an SSA IR as input”, with block parameters “equivalent to phi-nodes”, because phis “are all defined in parallel, and ... their uses occur on the edge of a particular predecessor”; its output includes inserted moves. doc/ION.md: livein/liveout bitsets per block computed by “a standard backward iterative dataflow analysis”, exact rather than over-approximate; live ranges grouped into bundles with a spill weight; a priority queue of bundles; for each bundle, allocate, or “evict some other bundle(s) ... or ... split the bundle”, evicting only a bundle of strictly lower weight; a parallel-move resolver. doc/FASTALLOC.md: Fastalloc, “made specifically for fast compile times”, based on reverse linear scan. src/moves.rs: ParallelMoves, “alloc-to-alloc moves that must happen in parallel -- i.e., all reads of sources semantically happen before all writes of destinations”, resolved into sequential moves, “possibly using a scratch register if one is necessary”. Cargo.toml (version 0.15.2) lists the authors as Chris Fallin and the Mozilla SpiderMonkey Developers, and describes the crate as a “Backtracking register allocator inspired from IonMonkey”.',
    shaped: 'Chapters 231, 231-b, 232 and 234-b: block parameters instead of phis, the parallel-move resolver, exact liveness, and a production allocator (Ion) built on priorities, eviction and splitting.',
  },
];
