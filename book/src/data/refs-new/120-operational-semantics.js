// New references for chapter 120 (operational semantics) and its staged
// second half (big-step semantics). Network note: only web search was
// reachable from this session (doi.org, sciencedirect.com and
// link.springer.com did not resolve), so checkedAgainst says exactly what
// was read.
export default [
  {
    id: 'plotkin1981',
    authors: ['Gordon D. Plotkin'],
    title: 'A Structural Approach to Operational Semantics',
    venue: 'Technical report DAIMI FN-19, Computer Science Department, Aarhus University, 1981; revised reprint in the Journal of Logic and Algebraic Programming, vols. 60–61, pp. 17–139, 2004',
    year: 1981,
    doi: null,
    url: 'https://dblp.uni-trier.de/db/journals/jlp/jlp60.html',
    accessed: '2026-11-02',
    checkedAgainst: 'Web search results: several bibliographies give Technical Report DAIMI FN-19, Aarhus University, 1981 (September 1981); the DBLP listing for the Journal of Logic and Algebraic Programming volumes 60–61 (2004) gives Plotkin, A structural approach to operational semantics, pp. 17–139, with his companion historical note, The origins of structural operational semantics, pp. 3–15; a 2023 survey (arXiv 2309.07304) describes the journal paper as the report reprinted in slightly revised form and credits it with popularising rule-based, syntax-directed operational semantics written with transition relations (small steps). The journal DOI could not be confirmed from this session, so none is given.',
    shaped: 'Chapter 120 and its second half: structural operational semantics, rules that follow the syntax, and the small-step transition relation.',
  },
  {
    id: 'kahn1987',
    authors: ['Gilles Kahn'],
    title: 'Natural Semantics',
    venue: 'STACS 87, Lecture Notes in Computer Science, vol. 247, Springer, pp. 22–39',
    year: 1987,
    doi: '10.1007/BFb0039592',
    url: 'https://link.springer.com/chapter/10.1007/BFb0039592',
    accessed: '2026-11-02',
    checkedAgainst: 'Web search results: the Springer record (Kahn, G. (1987). Natural semantics. In Brandenburg, Vidal-Naquet and Wirsing (eds.), STACS 87, LNCS 247, https://doi.org/10.1007/BFb0039592) and the DBLP listing for STACS 87, Gilles Kahn: Natural Semantics, pp. 22–39 (4th Annual Symposium on Theoretical Aspects of Computer Science, Passau, February 1987).',
    shaped: 'The second half of chapter 120: the name natural semantics for big-step operational semantics.',
  },
];
