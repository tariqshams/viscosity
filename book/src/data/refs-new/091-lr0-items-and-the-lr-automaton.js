// New references for chapter 91 (LR(0) items and the LR automaton) and its
// staged second half (the LR parse table and conflicts).
// Network note: only web search and raw.githubusercontent.com were
// reachable from this session, not publishers' or DOI pages; each
// checkedAgainst says exactly what was read.
export default [
  {
    id: 'knuth1965',
    authors: ['Donald E. Knuth'],
    title: 'On the translation of languages from left to right',
    venue: 'Information and Control, vol. 8, no. 6, pp. 607–639',
    year: 1965,
    doi: '10.1016/S0019-9958(65)90426-2',
    url: 'https://doi.org/10.1016/S0019-9958(65)90426-2',
    accessed: '2026-11-02',
    checkedAgainst: 'Search records for DOI 10.1016/S0019-9958(65)90426-2 (Crossref entry “D.E. Knuth: On the translation of languages from left to right”, Information and Control 8, 607–639, 1965), a scanned copy of the paper on a York University course archive (1-s2.0-s0019995865904262-main.pdf), and Knuth’s own page for Selected Papers on Computer Languages (cs.stanford.edu/~knuth/cl.html), which reprints it. The paper defines LR(k) grammars, those that can be parsed by one left-to-right scan with k symbols of lookahead.',
    shaped: 'Chapters 91–93: where LR parsing comes from; the idea of a parser state that records how much of each rule has been seen, and the name LR(k).',
  },
];
