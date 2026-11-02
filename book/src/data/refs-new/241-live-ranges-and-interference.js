// New references for chapter 241 (Live ranges and interference), also
// cited by chapters 242 and 244. Network note: dl.acm.org and doi.org were
// unreachable from this session; checkedAgainst says exactly what was read.
export default [
  {
    id: 'chaitin1982',
    authors: ['Gregory J. Chaitin'],
    title: 'Register Allocation & Spilling via Graph Coloring',
    venue: 'Proceedings of the SIGPLAN ’82 Symposium on Compiler Construction (SIGPLAN Notices 17(6)), ACM, pp. 98–105',
    year: 1982,
    doi: '10.1145/872726.806984',
    url: 'https://doi.org/10.1145/872726.806984',
    accessed: '2026-11-02',
    checkedAgainst: 'Search records only (the ACM pages were unreachable): US patent 4,571,678 (USPTO full text), which cites “Register Allocation and Spilling Via Graph Coloring”, Proceedings SIGPLAN 82, Symposium on Compiler Construction, SIGPLAN Notices, 1982, pp. 98–105; bibliography entries giving SIGPLAN Notices 17(6), June 1982, pages 98–105 (one gives 98–101); Wikipedia’s article on Chaitin’s algorithm, which gives the DOI 10.1145/872726.806984; IBM Research’s publication page for the paper; and Chaitin’s 2004 retrospective reprint in SIGPLAN Notices 39(4), pp. 66–74 (doi 10.1145/989393.989403). The content used (an interference graph built from liveness, colouring by repeatedly removing nodes of degree less than the number of registers, and choosing a spill by the ratio of spill cost to degree) is the well-documented content of this paper, summarised the same way in the University of Michigan EECS 583 reading list and the Wikipedia article.',
    shaped: 'Chapters 241, 242 and 244: the interference graph, simplify and select, and spill cost divided by degree.',
  },
];
