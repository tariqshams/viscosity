// New references for the second half of chapter 75 (staged split:
// minimal DFAs and scanner generators).
// Network note: only web search was reachable from this session, not the
// project and publisher pages themselves; checkedAgainst says what was read.
export default [
  {
    id: 'hopcroft1971',
    authors: ['John Hopcroft'],
    title: 'An n log n Algorithm for Minimizing States in a Finite Automaton',
    venue: 'In Z. Kohavi and A. Paz (eds.), Theory of Machines and Computations, Academic Press, New York, pp. 189–196',
    year: 1971,
    doi: null,
    url: 'https://hjemmesider.diku.dk/~henglein/bib/publications/hopcroft71.html',
    accessed: '2026-11-02',
    checkedAgainst: 'The DIKU bibliography entry (hjemmesider.diku.dk/~henglein/bib/publications/hopcroft71.html): Hopcroft, “An n log n algorithm for minimizing states in a finite automaton”, Theory of Machines and Computations, eds. Kohavi and Paz, Academic Press 1971, pp. 189–196; and Berstel et al., “Minimization of Automata” (arXiv:1010.5318), which describes it as minimising complete DFAs in worst-case time O(n log n) (O(|A| n log n) with the alphabet size).',
    shaped: 'The scanner-generator chapter: the fast way to minimise a DFA.',
  },
  {
    id: 'lesk1975',
    authors: ['M. E. Lesk', 'E. Schmidt'],
    title: 'Lex: A Lexical Analyzer Generator',
    venue: 'Computing Science Technical Report No. 39, Bell Laboratories, Murray Hill, New Jersey',
    year: 1975,
    doi: null,
    url: 'https://www.cs.utexas.edu/~novak/lexpaper.htm',
    accessed: '2026-11-02',
    checkedAgainst: 'Search results for the paper’s copies at cs.utexas.edu/~novak/lexpaper.htm and the University of Manchester mirror (memo dated July 21, 1975), and the Wikipedia citation (Comp. Sci. Tech. Rep. No. 39, Bell Laboratories). Quoted there: Lex generates programs whose control flow is directed by regular expressions in the input stream; its analysers accept ambiguous specifications and choose the longest match possible at each input point; it is designed to be used with Yacc.',
    shaped: 'The scanner-generator chapter: lex, the first widely used scanner generator, and the longest-match rule.',
  },
  {
    id: 'flex-manual',
    authors: ['Vern Paxson', 'the flex maintainers'],
    title: 'flex: the fast lexical analyzer generator (manual and source)',
    venue: 'The flex project, github.com/westes/flex',
    year: null,
    doi: null,
    url: 'https://github.com/westes/flex',
    accessed: '2026-11-02',
    checkedAgainst: 'Search results for the manual’s “How the Input Is Matched” section, as quoted on the flex-help mailing list (sourceforge.net/p/flex/mailman/message/31576869) and in UC Berkeley CS 164 lexer notes: “If it finds more than one match, it takes the one matching the most text … If it finds two or more matches of the same length, the rule listed first in the flex input file is chosen.” Project home github.com/westes/flex; the Wikipedia article on flex gives its name as the Fast Lexical Analyzer Generator, written by Vern Paxson around 1987 as a free reimplementation of lex.',
    shaped: 'The scanner-generator chapter: the flex rules file, and the two rules for choosing a token (longest match, then first rule).',
  },
  {
    id: 're2c',
    authors: ['The re2c authors'],
    title: 're2c: a lexer generator for C, C++, Go and Rust',
    venue: 're2c.org and github.com/skvadrik/re2c',
    year: null,
    doi: null,
    url: 'https://re2c.org/',
    accessed: '2026-11-02',
    checkedAgainst: 'The project’s own description as packaged by Debian, Ubuntu and PureOS (found by search): re2c generates fast lexers; “Instead of using a traditional table-driven approach, re2c encodes the generated finite state automata directly in the form of conditional jumps and comparisons”, giving programs that are faster and often smaller than table-driven ones; and the Wikipedia article on re2c (compiles regular-expression specifications to deterministic finite automata).',
    shaped: 'The scanner-generator chapter: direct-coded scanners.',
  },
];
