// New references for chapter 221 (Interprocedural analysis).
// Network note: only web search and raw.githubusercontent.com could be
// reached; publisher pages and PDFs on university sites could not be fetched.
export default [
  {
    id: 'sharirpnueli1981',
    authors: ['Micha Sharir', 'Amir Pnueli'],
    title: 'Two Approaches to Interprocedural Data Flow Analysis',
    venue: 'In S. S. Muchnick and N. D. Jones (eds.), Program Flow Analysis: Theory and Applications, chapter 6, pp. 189–233, Prentice-Hall',
    year: 1981,
    doi: null,
    url: 'https://www.cmi.ac.in/~madhavan/courses/program-analysis-2011/papers/sharir-pnueli-interproc-analysis-1981.pdf',
    accessed: '2026-11-02',
    checkedAgainst: 'Search records only: a reference list giving “In S.S. Muchnick and N.D. Jones, editors, Program Flow Analysis: Theory and Applications, chapter 6, pages 189–233, Prentice-Hall, 1981”; a Northwestern course reading (EECS 396) with the same book, editors and year; a course copy of the earlier NYU technical report (September 1978) of the same title at cmi.ac.in; and course slides (cmi.ac.in, interproc-analysis-2) presenting its two approaches, the call-string approach and the functional approach. The PDF could not be fetched, so nothing is quoted from it.',
    shaped: 'Chapters 221 and 221b: the call-string approach to context sensitivity, and the functional approach (summaries of procedures) to interprocedural analysis.',
  },
  {
    id: 'milanova2005',
    authors: ['Ana Milanova', 'Atanas Rountev', 'Barbara G. Ryder'],
    title: 'Parameterized Object Sensitivity for Points-to Analysis for Java',
    venue: 'ACM Transactions on Software Engineering and Methodology (TOSEM), January 2005',
    year: 2005,
    doi: '10.1145/1044834.1044835',
    url: 'https://doi.org/10.1145/1044834.1044835',
    accessed: '2026-11-02',
    checkedAgainst: 'Search records only: an AcaWiki entry and an Academia.edu listing give the authors, TOSEM (2005/01) and doi 10.1145/1044834.1044835; their abstract summary: object sensitivity analyses a method separately for each object on which it is invoked, with a parameterisation that trades cost for precision, compared against a context-insensitive analysis on 23 Java programs. An earlier conference version appeared at ISSTA 2002. Volume and pages could not be confirmed and are left out.',
    shaped: 'Chapter 221: object sensitivity, which tells a method’s calls apart by the receiver object rather than by the call site.',
  },
  {
    id: 'whaleylam2004',
    authors: ['John Whaley', 'Monica S. Lam'],
    title: 'Cloning-Based Context-Sensitive Pointer Alias Analysis Using Binary Decision Diagrams',
    venue: 'Proceedings of the ACM SIGPLAN 2004 Conference on Programming Language Design and Implementation (PLDI ’04), Washington, DC, ACM, pp. 131–144',
    year: 2004,
    doi: null,
    url: 'https://cs.ubc.ca/wiki/core/pub/SPL/BDDBDDB/pldi04.pdf',
    accessed: '2026-11-02',
    checkedAgainst: 'Search records only: a reference giving PLDI 2004, pages 131–144; John Whaley’s CV (suif.stanford.edu/~jwhaley) listing it with a Best Paper Award; copies at cs.ubc.ca and umich.edu; the search summary of its content: a clone of each method for every context, so that a context-insensitive analysis of the expanded program is context-sensitive, made feasible with binary decision diagrams, and the bddbddb system that translates Datalog programs into BDD implementations. The DOI could not be confirmed and is left out; the URL is the cs.ubc.ca copy that search returned.',
    shaped: 'Chapters 221 and 221b: context sensitivity by cloning, and pointer analysis written in Datalog and solved with BDDs.',
  },
];
