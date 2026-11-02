// New references for chapter 233 (Register allocation by graph colouring)
// and its staged second half (233-b, coalescing). Network note:
// dl.acm.org and doi.org were unreachable from this session.
export default [
  {
    id: 'briggs1994',
    authors: ['Preston Briggs', 'Keith D. Cooper', 'Linda Torczon'],
    title: 'Improvements to Graph Coloring Register Allocation',
    venue: 'ACM Transactions on Programming Languages and Systems 16(3), pp. 428–455',
    year: 1994,
    doi: '10.1145/177492.177575',
    url: 'https://doi.org/10.1145/177492.177575',
    accessed: '2026-11-02',
    checkedAgainst: 'Search records only (the ACM pages were unreachable): several bibliographic records and the Crossref record for doi 10.1145/177492.177575 as indexed (TOPLAS volume 16, issue 3, May 1994, first page 428, pages 428–455); a full-text copy indexed at a Saarland University course page; the abstract as indexed: two improvements to Chaitin-style graph colouring allocators, optimistic colouring (“a stronger heuristic for finding a k-coloring of the interference graph”) and an extension of Chaitin’s treatment of rematerialisation, evaluated on FORTRAN programs. The same work is cited by GCC’s graph-colouring allocator (gcc/ra.c, GCC 3.3/3.4).',
    shaped: 'Chapters 233, 233-b and 234: optimistic colouring (push a blocked node anyway and see whether select finds a colour), conservative coalescing by the Briggs test, and rematerialisation.',
  },
  {
    id: 'georgeappel1996',
    authors: ['Lal George', 'Andrew W. Appel'],
    title: 'Iterated Register Coalescing',
    venue: 'ACM Transactions on Programming Languages and Systems 18(3), pp. 300–324',
    year: 1996,
    doi: '10.1145/229542.229546',
    url: 'https://doi.org/10.1145/229542.229546',
    accessed: '2026-11-02',
    checkedAgainst: 'Search records only (the ACM pages were unreachable): Princeton’s technical report page TR-498-95 (“This technical report has been published as Iterated Register Coalescing, Lal George and Andrew W. Appel, ACM Transactions on Programming Languages and Systems 18(3) 300-324, May 1996”), Princeton’s research portal (collaborate.princeton.edu), course copies at cs.purdue.edu (hosking/352/project/george.pdf), and the Crossref reference list of “Optimistic register coalescing” (10.1145/1011508.1011512), which cites 10.1145/229542.229546 for this paper. An earlier version appeared at POPL 1996. Content used: coalescing interleaved with simplification, conservative tests (the Briggs test, and the test now called George’s: every neighbour of one node either already interferes with the other or has insignificant degree), and freezing a move when neither simplify nor coalesce can proceed.',
    shaped: 'Chapter 233-b: conservative coalescing, the George test, and iterated coalescing.',
  },
];
