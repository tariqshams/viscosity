// New references for chapter 168 (Regular expressions as a language).
// Also cited by chapters 169 and 171 (and their staged second halves).
// Network note: in this session only web search was reachable, not the
// publishers' pages themselves; each checkedAgainst says what was read.
export default [
  {
    id: 'kleene1956',
    authors: ['Stephen C. Kleene'],
    title: 'Representation of Events in Nerve Nets and Finite Automata',
    venue: 'In C. E. Shannon and J. McCarthy (eds.), Automata Studies (Annals of Mathematics Studies 34), Princeton University Press, pp. 3–42',
    year: 1956,
    doi: '10.1515/9781400882618-002',
    url: 'https://doi.org/10.1515/9781400882618-002',
    accessed: '2026-11-02',
    checkedAgainst: 'Search records for the De Gruyter DOI 10.1515/9781400882618-002, the JSTOR table of contents of Automata Studies (j.ctt1bgzb3s) and the RAND page for the 1951 memorandum RM-704 of the same title: chapter by S. C. Kleene, Automata Studies (AM-34), eds. Shannon and McCarthy, Princeton University Press 1956, pages 3–42; the 1956 chapter introduces regular events/regular expressions and shows they are exactly what finite automata recognise (Kleene’s theorem).',
    shaped: 'Chapter 168: where regular expressions and the Kleene star come from.',
  },
  {
    id: 'mdn-regexp-guide',
    authors: ['MDN contributors'],
    title: 'Regular expressions (JavaScript Guide)',
    venue: 'MDN Web Docs, Mozilla',
    year: null,
    doi: null,
    url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions',
    accessed: '2026-11-02',
    checkedAgainst: 'Search result for the MDN guide page: regular expressions are patterns used with RegExp exec() and test() and String match(), matchAll(), replace(), replaceAll(), search() and split(); the guide covers assertions, character classes, groups and backreferences, and quantifiers. Every regex behaviour quoted in chapter 168 (anchors, classes, +, ?, the backreference example) was also run in Node.',
    shaped: 'Chapter 168: JavaScript regex syntax as shorthand for the three operators. The scanner-generator chapter: the sticky flag in its exercise.',
  },
  {
    id: 'aho2006',
    authors: ['Alfred V. Aho', 'Monica S. Lam', 'Ravi Sethi', 'Jeffrey D. Ullman'],
    title: 'Compilers: Principles, Techniques, and Tools (2nd edition)',
    venue: 'Addison-Wesley (Pearson), ISBN 978-0-321-48681-3',
    year: 2006,
    doi: null,
    url: 'https://www.pearson.com/store/isbn-redirect/9780133002140',
    accessed: '2026-11-02',
    checkedAgainst: 'Search results for ISBN 9780321486813 (library catalogue: Boston, Pearson/Addison Wesley, ©2007; Goodreads: second edition, Addison Wesley, 31 August 2006; authors Aho, Lam, Sethi, Ullman) and Pearson’s own store page for the 2nd edition (ISBN 9780133002140). Chapter 3 of this edition covers lexical analysis: regular expressions, finite automata, the regex-to-NFA construction, the subset construction, DFA state minimisation and the Lex tool.',
    shaped: 'Chapters 168–171: the standard textbook account of regular expressions, finite automata and scanner generators, used to check definitions and the order of the constructions.',
  },
];
