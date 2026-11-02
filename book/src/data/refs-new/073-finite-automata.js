// New references for chapter 73 (Finite automata), also cited by the
// staged chapter on nondeterministic automata and by chapter 75.
// Network note: only web search was reachable from this session, not the
// publishers' pages; each checkedAgainst says what was read.
export default [
  {
    id: 'rabinscott1959',
    authors: ['Michael O. Rabin', 'Dana Scott'],
    title: 'Finite Automata and Their Decision Problems',
    venue: 'IBM Journal of Research and Development, vol. 3, no. 2, pp. 114–125',
    year: 1959,
    doi: '10.1147/rd.32.0114',
    url: 'https://doi.org/10.1147/rd.32.0114',
    accessed: '2026-11-02',
    checkedAgainst: 'Search records for DOI 10.1147/rd.32.0114 (IBM J. Res. Dev. 3(2):114–125, April 1959; ResearchGate listing by Dana Scott) and the ACM Turing Award citation for Rabin and Scott (1976), which credits this paper with introducing nondeterministic machines; Rabin’s CACM interview (2010) says the paper proved nondeterministic finite automata equal in power to deterministic ones.',
    shaped: 'Chapter 73: the theory of finite automata. The nondeterministic-automata chapter and chapter 75: NFAs, and the proof that every NFA has an equivalent DFA (the subset construction).',
  },
  {
    id: 'hmu2006',
    authors: ['John E. Hopcroft', 'Rajeev Motwani', 'Jeffrey D. Ullman'],
    title: 'Introduction to Automata Theory, Languages, and Computation (3rd edition)',
    venue: 'Pearson / Addison-Wesley, ISBN 978-0-321-45536-9',
    year: 2006,
    doi: null,
    url: 'https://en.wikipedia.org/wiki/Introduction_to_Automata_Theory,_Languages,_and_Computation',
    accessed: '2026-11-02',
    checkedAgainst: 'Search results for the 3rd edition: ISBN-10 0321455363 / ISBN-13 9780321455369 (Boston: Pearson/Addison Wesley, 2007 printing, xvii + 535 pp.; publisher listing as 3rd edition) and the Wikipedia article on the book. The book’s formal definitions of DFA (five-tuple, extended transition function), NFA with ε-transitions, ε-closure and the dead state are the ones followed in chapters 73 and 75.',
    shaped: 'Chapters 73–75: the formal definitions of DFAs, NFAs and ε-closure, and the notation in the Formal boxes.',
  },
];
