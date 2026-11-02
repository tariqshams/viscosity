// New references for chapter 75 (From regular expressions to fast scanners).
// Network note: only web search was reachable from this session, not the
// ACM Digital Library itself; checkedAgainst says what was read.
export default [
  {
    id: 'thompson1968',
    authors: ['Ken Thompson'],
    title: 'Programming Techniques: Regular expression search algorithm',
    venue: 'Communications of the ACM, vol. 11, no. 6, pp. 419–422',
    year: 1968,
    doi: '10.1145/363347.363387',
    url: 'https://doi.org/10.1145/363347.363387',
    accessed: '2026-11-02',
    checkedAgainst: 'Search records for DOI 10.1145/363347.363387: the CACM archive page (cacm.acm.org/magazines/1968/6/12736) and Nelson Beebe’s bibliography at netlib.org/tex/bib/plan9.html, giving CACM 11(6), June 1968, pp. 419–422. Abstract as quoted there: the method compiles a regular expression into IBM 7094 machine code; the object program then accepts the text to be searched as input and produces a signal every time an embedded string in the text matches the given regular expression.',
    shaped: 'Chapter 75: Thompson’s construction, and the history of compiling patterns into code.',
  },
];
