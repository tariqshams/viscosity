// New references for the staged chapter 201-b (Sparse conditional constant
// propagation), a split of chapter 201. Checked 2026-11-02; this session could
// reach only github.com and raw.githubusercontent.com directly (doi.org,
// dl.acm.org and university hosts were blocked), so the paper details were
// checked against search results and against the GCC source that cites it.
export default [
  {
    id: 'wegmanzadeck1991',
    authors: ['Mark N. Wegman', 'F. Kenneth Zadeck'],
    title: 'Constant Propagation with Conditional Branches',
    venue: 'ACM Transactions on Programming Languages and Systems (TOPLAS), vol. 13, no. 2, April 1991, pp. 181–210',
    year: 1991,
    doi: null,
    url: 'https://people.cs.umass.edu/~emery/classes/cmpsci710-spring2003/p181-wegman.pdf',
    accessed: '2026-11-02',
    checkedAgainst: 'Search results (ACM record and university-hosted copies titled p181-wegman.pdf) giving TOPLAS 13(2), April 1991, pp. 181–210, with a preliminary version at POPL 1985; and the reference list in GCC’s gcc/tree-ssa-ccp.cc (raw.githubusercontent.com/gcc-mirror/gcc/master), which cites “Constant propagation with conditional branches, Wegman and Zadeck, ACM TOPLAS 13(2):181-210”. No DOI is given because none could be confirmed (doi.org and dl.acm.org were blocked, and a search for the commonly quoted DOI found no record); the URL is a course copy of the ACM paper (p181) that appeared in the search results, and the paper text itself could not be opened from this session.',
    shaped: 'Chapter 201-b: sparse conditional constant propagation, optimistic about both values and executable edges.',
  },
  {
    id: 'gcc-tree-ssa-ccp',
    authors: ['The GCC developers (Free Software Foundation)'],
    title: 'tree-ssa-ccp.cc: conditional constant propagation (GCC source code)',
    venue: 'GCC, official source repository (GitHub mirror gcc-mirror/gcc), gcc/tree-ssa-ccp.cc',
    year: null,
    doi: null,
    url: 'https://github.com/gcc-mirror/gcc/blob/master/gcc/tree-ssa-ccp.cc',
    accessed: '2026-11-02',
    checkedAgainst: 'https://raw.githubusercontent.com/gcc-mirror/gcc/master/gcc/tree-ssa-ccp.cc, read 2026-11-02: the header comment describes a four-level lattice (UNINITIALIZED, UNDEFINED, CONSTANT, VARYING), marking only the edges a constant predicate allows, ignoring PHI arguments that flow in through non-executable edges, and lists Wegman and Zadeck, TOPLAS 13(2):181-210, as a reference.',
    shaped: 'Chapter 201-b: how a production compiler implements SCCP.',
  },
];
