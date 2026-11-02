// New references for chapter 116 (syntax-directed translation and
// attribute grammars) and its staged second half (inherited attributes).
// Network note: in this session only web search was reachable (doi.org,
// link.springer.com and the authors' pages did not resolve), so
// checkedAgainst says exactly what was read.
export default [
  {
    id: 'knuth1968',
    authors: ['Donald E. Knuth'],
    title: 'Semantics of Context-Free Languages',
    venue: 'Mathematical Systems Theory, vol. 2, no. 2, pp. 127–145 (correction: vol. 5, 1971, pp. 95–96)',
    year: 1968,
    doi: '10.1007/BF01692511',
    url: 'https://link.springer.com/article/10.1007/BF01692511',
    accessed: '2026-11-02',
    checkedAgainst: 'Web search results only (the publisher page did not resolve from this session): Knuth’s own bibliography and a Springer reference list give Mathematical Systems Theory 2 (1968), 127–145; later papers cite it under DOI 10.1007/BF01692511; the abstract as summarised by the search describes attributes attached to the nodes of a derivation tree with functions tied to each production, the split between attributes computed from descendants (synthesized) and from ancestors (inherited), and an algorithm to test the rules for circular definitions; the running example gives the binary numeral 1101.01 the value 13.25; a correction appeared in Mathematical Systems Theory 5 (1971), 95–96.',
    shaped: 'Chapter 116 and its second half: the names and definitions of synthesized and inherited attributes, attribute grammars, the circularity question, and Knuth’s binary-numeral example.',
  },
];
