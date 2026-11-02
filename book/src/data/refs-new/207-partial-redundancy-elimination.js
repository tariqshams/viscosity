// New references for chapter 213 (Partial redundancy elimination).
// Checked 2026-11-02. This session could not reach doi.org, dl.acm.org or
// publishers' sites, so the paper was checked against search results and
// against GCC's source, which cites it; the GCC file was read directly.
export default [
  {
    id: 'morelrenvoise1979',
    authors: ['Etienne Morel', 'Claude Renvoise'],
    title: 'Global Optimization by Suppression of Partial Redundancies',
    venue: 'Communications of the ACM, vol. 22, no. 2, February 1979, pp. 96–103',
    year: 1979,
    doi: '10.1145/359060.359069',
    url: 'https://doi.org/10.1145/359060.359069',
    accessed: '2026-11-02',
    checkedAgainst: 'Search results: a bibliography entry “Morel, E., Renvoise, C.: Global optimization by suppression of partial redundancies. Commun. ACM 22(2), 96–103 (1979)” with DOI 10.1145/359060.359069, and the paper’s abstract as quoted in search results (the method achieves several optimizations, such as moving loop-invariant computations out of a loop and deleting redundant computations, at once, by suppressing partial redundancies). Also the reference list in GCC’s gcc/gcse.cc (raw.githubusercontent.com/gcc-mirror/gcc/master): “Global Optimization by Suppression of Partial Redundancies, E. Morel, C. Renvoise, communications of the acm, Vol. 22, Num. 2, Feb. 1979”. The paper text itself was not opened.',
    shaped: 'Chapter 213: partial redundancy elimination, and loop-invariant code motion as a special case of it.',
  },
  {
    id: 'gcc-tree-ssa-pre',
    authors: ['Daniel Berlin', 'Steven Bosscher', 'The GCC developers (Free Software Foundation)'],
    title: 'tree-ssa-pre.cc: full and partial redundancy elimination and code hoisting on SSA GIMPLE (GCC source code)',
    venue: 'GCC, official source repository (GitHub mirror gcc-mirror/gcc), gcc/tree-ssa-pre.cc',
    year: null,
    doi: null,
    url: 'https://github.com/gcc-mirror/gcc/blob/master/gcc/tree-ssa-pre.cc',
    accessed: '2026-11-02',
    checkedAgainst: 'https://raw.githubusercontent.com/gcc-mirror/gcc/master/gcc/tree-ssa-pre.cc, read 2026-11-02: the header comment (contributed by Daniel Berlin and Steven Bosscher) describes computing AVAIL sets (a forward problem), then ANTIC sets of anticipatable expressions (a backward problem iterated to a fixpoint), then inserting an expression that is AVAIL in some but not all predecessors of a block, and ANTIC in all of them, into the predecessors where it is not available, so that it becomes fully redundant; it also says FRE, PRE and code hoisting piggy-back on the GVN in tree-ssa-sccvn.cc.',
    shaped: 'Chapter 213: PRE on SSA in a production compiler.',
  },
];
