// New references for chapter 194 (unification) and its staged second
// half (inferring types, the occurs check). Network note: only web search
// was reachable for this paper (dl.acm.org and doi.org were not fetched),
// so checkedAgainst says exactly what was read.
export default [
  {
    id: 'robinson1965',
    authors: ['J. A. Robinson'],
    title: 'A Machine-Oriented Logic Based on the Resolution Principle',
    venue: 'Journal of the ACM, vol. 12, no. 1, pp. 23–41',
    year: 1965,
    doi: '10.1145/321250.321253',
    url: 'https://doi.org/10.1145/321250.321253',
    accessed: '2026-11-02',
    checkedAgainst: 'Web search results only: the MIT JACM author index (projects.csail.mit.edu/jacm/Authors/robinsonja.html) lists “A machine-oriented logic based on the resolution principle. Journal of the ACM, 12(1):23-41, January 1965”; the Wikipedia article on J. A. Robinson gives the same citation with doi 10.1145/321250.321253; a Cambridge Journal of Symbolic Logic review listing gives vol. 12 (1965), pp. 23–41; rare-book and course notes describe it as introducing unification as the basic operation of the resolution principle; course notes on Robinson’s algorithm (for example the Roma Tre and Shibaura Institute slides found by search) describe its step that fails when the variable of a disagreement pair occurs in the other term, the occurs check. The paper itself was not read.',
    shaped: 'Chapter 194 and its second half: unification as an algorithm (finding a substitution that makes two terms equal), and the occurs check.',
  },
];
