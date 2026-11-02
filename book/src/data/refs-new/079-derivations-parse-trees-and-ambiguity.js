// New references for chapter 61 (Derivations, parse trees and ambiguity)
// and its staged second half (ambiguity and the Chomsky hierarchy).
// Network note: in this session only web search and raw.githubusercontent.com
// were reachable, not the publishers' pages; each checkedAgainst says what
// was read.
export default [
  {
    id: 'ecma262-if',
    authors: ['Ecma International, TC39'],
    title: 'ECMAScript Language Specification (ECMA-262), “The if Statement”',
    venue: 'Ecma International; living draft at tc39.es/ecma262',
    year: null,
    doi: null,
    url: 'https://tc39.es/ecma262/#sec-if-statement',
    accessed: '2026-11-02',
    checkedAgainst: 'https://raw.githubusercontent.com/tc39/ecma262/main/spec.html (the source the draft is built from, main branch, fetched 2026-11-02), emu-clause id="sec-if-statement": the IfStatement productions, the second ending in [lookahead ≠ else], and the note “The lookahead-restriction [lookahead ≠ else] resolves the classic “dangling else” problem in the usual way. That is, when the choice of associated if is otherwise ambiguous, the else is associated with the nearest (innermost) of the candidate ifs”.',
    shaped: 'The ambiguity chapter: the dangling else, and how JavaScript resolves it.',
  },
  {
    id: 'chomsky1959',
    authors: ['Noam Chomsky'],
    title: 'On Certain Formal Properties of Grammars',
    venue: 'Information and Control, vol. 2, no. 2, pp. 137–167',
    year: 1959,
    doi: '10.1016/S0019-9958(59)90362-6',
    url: 'https://doi.org/10.1016/S0019-9958(59)90362-6',
    accessed: '2026-11-02',
    checkedAgainst: 'Search records: the University of Arizona research portal entry (DOI 10.1016/S0019-9958(59)90362-6; Information and Control 2(2):137–167, June 1959; abstract: a sequence of restrictions on grammars, from Turing machines down to finite-state sources, each giving a smaller class of languages), the MIT Information and Control author index for Chomsky (2(2):137–167, June 1959), and the Journal of Symbolic Logic review listing the same pages.',
    shaped: 'The ambiguity chapter: the hierarchy of grammar types (the Chomsky hierarchy).',
  },
];
