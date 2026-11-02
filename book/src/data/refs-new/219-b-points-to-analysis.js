// New references for the second half of chapter 94 (staged as
// 219-b-points-to-analysis): Andersen's and Steensgaard's analyses.
// Network note: only web search and raw.githubusercontent.com could be
// reached; publisher pages and PDFs on university sites could not be fetched.
export default [
  {
    id: 'andersen1994',
    authors: ['Lars Ole Andersen'],
    title: 'Program Analysis and Specialization for the C Programming Language',
    venue: 'PhD thesis, DIKU, University of Copenhagen (DIKU report 94/19), May 1994',
    year: 1994,
    doi: null,
    url: 'https://www.cmi.ac.in/~madhavan/courses/program-analysis-2014/papers/andersen-thesis94.pdf',
    accessed: '2026-11-02',
    checkedAgainst: 'Search records only: a course copy of the thesis at cmi.ac.in (title page: May 1994, DIKU, University of Copenhagen, lars@diku.dk) and its pointer-analysis chapter surfaced in search; later citations (Crossref records of Springer papers on Andersen-style points-to analysis) give “PhD thesis, DIKU, University of Copenhagen, May 1994” and “DIKU Report 94/19”. The PDF could not be fetched, so nothing is quoted from it.',
    shaped: 'Chapter 94b: the inclusion-based (subset-based) points-to analysis: an assignment a = b means pts(a) includes pts(b).',
  },
  {
    id: 'steensgaard1996',
    authors: ['Bjarne Steensgaard'],
    title: 'Points-to Analysis in Almost Linear Time',
    venue: 'Proceedings of the 23rd ACM SIGPLAN-SIGACT Symposium on Principles of Programming Languages (POPL ’96), St. Petersburg Beach, Florida, ACM',
    year: 1996,
    doi: null,
    url: 'https://www.microsoft.com/en-us/research/?p=151061',
    accessed: '2026-11-02',
    checkedAgainst: 'Search records only: the Microsoft Research publication page (also MSR-TR-95-08 of the same title) and course copies (cs.cornell.edu, cs.utexas.edu, washington.edu) summarised in search: an interprocedural, flow-insensitive points-to analysis based on a type system for a storage shape graph, solved by unification with fast union-find in almost linear time, “roughly comparable” in precision to the cubic-time flow-insensitive analysis it compares against. The DOI could not be confirmed and is left out. Also https://raw.githubusercontent.com/llvm/llvm-project/main/llvm/docs/AliasAnalysis.md (“Steensgaard’s algorithm is a unification-based, flow-insensitive, context-insensitive, and field-insensitive alias analysis that is also very scalable (effectively linear time)”).',
    shaped: 'Chapter 94b: the unification-based points-to analysis, union-find, and its trade of precision for speed.',
  },
];
