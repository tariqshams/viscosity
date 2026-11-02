// New references for chapter 122 (what a type system promises), also
// cited by chapters 123-126. Network note: only web search and
// raw.githubusercontent.com were reachable from this session
// (lucacardelli.name, prl.khoury.northeastern.edu and www.dcs.gla.ac.uk
// did not resolve), so checkedAgainst says exactly what was read.
export default [
  {
    id: 'cardelli1997',
    authors: ['Luca Cardelli'],
    title: 'Type Systems',
    venue: 'in the CRC Handbook of Computer Science and Engineering, CRC Press (a chapter; a revised version appears in the 2nd edition, 2004)',
    year: 1997,
    doi: null,
    url: 'http://lucacardelli.name/Papers/TypeSystems.pdf',
    accessed: '2026-11-02',
    checkedAgainst: 'Web search results only (the author’s site did not resolve from this session): Cambridge course reading lists cite “Cardelli, L. (1997). Type Systems. In CRC Handbook of Computer Science and Engineering. CRC Press”; one copy of the PDF is labelled chapter 106 (1997) and the 2nd edition (2004) chapter 99; search excerpts of the text give its distinction between trapped errors (execution stops at once, e.g. division by zero) and untrapped errors (go unnoticed and later cause arbitrary behaviour, e.g. reading past the end of an array without bounds checks), safe programs as those with no untrapped errors, strongly checked versus weakly checked languages, and the typed/untyped by safe/unsafe matrix (ML typed and safe, Lisp untyped and safe, C typed and unsafe, assembler untyped and unsafe). A Scrapbox reading note links the PDF at lucacardelli.name/papers/typesystems.pdf.',
    shaped: 'Chapter 122: replacing “strong” and “weak” typing with two separate questions (when types are checked; trapped versus untrapped errors and safety), and the four-corner grid.',
  },
  {
    id: 'milner1978',
    authors: ['Robin Milner'],
    title: 'A Theory of Type Polymorphism in Programming',
    venue: 'Journal of Computer and System Sciences, vol. 17, no. 3, pp. 348–375',
    year: 1978,
    doi: '10.1016/0022-0000(78)90014-4',
    url: 'https://doi.org/10.1016/0022-0000(78)90014-4',
    accessed: '2026-11-02',
    checkedAgainst: 'Web search results only (no copy of the paper was reachable): several bibliographies and course reading lists give Journal of Computer and System Sciences 17 (1978), pp. 348–375 (received October 1977, revised April 1978); the DOI 10.1016/0022-0000(78)90014-4 is given by one listing (datalearner.com) and matches the journal’s Elsevier prefix, but could not be resolved here. Summaries of the abstract: a formal type discipline for polymorphic procedures in a simple language and a compile-time type-checking algorithm W that enforces it; its Semantic Soundness Theorem is summarised as “well-typed programs cannot go wrong” and its Syntactic Soundness Theorem as “if the algorithm accepts a program then it is well typed”.',
    shaped: 'Chapter 122: the slogan “well-typed programs cannot go wrong” and the idea of soundness; chapter 126: type inference that solves equations between types (Milner’s algorithm W).',
  },
  {
    id: 'ts-design-goals',
    authors: ['The TypeScript team (Microsoft)'],
    title: 'TypeScript Design Goals (TypeScript wiki)',
    venue: 'github.com/microsoft/TypeScript/wiki',
    year: null,
    doi: null,
    url: 'https://github.com/microsoft/TypeScript/wiki/TypeScript-Design-Goals',
    accessed: '2026-11-02',
    checkedAgainst: 'https://raw.githubusercontent.com/wiki/microsoft/TypeScript/TypeScript-Design-Goals.md: under Goals, “Statically identify constructs that are likely to be errors.”; under Non-goals, “Apply a sound or \"provably correct\" type system. Instead, strike a balance between correctness and productivity.” (both quoted from two fetches of the raw wiki page).',
    shaped: 'Chapter 122: TypeScript is unsound on purpose.',
  },
];
