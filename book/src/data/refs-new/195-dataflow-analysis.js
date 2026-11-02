// New references for chapter 195 (Dataflow analysis), also cited by the
// chapters that follow it (the classic dataflow problems, lattices and
// abstract interpretation, and their split second halves).
// Network note: in this session only web search was reachable; doi.org,
// dl.acm.org, link.springer.com, dblp.org and the authors' pages could not
// be fetched. Each checkedAgainst says exactly what was read.
export default [
  {
    id: 'kildall1973',
    authors: ['Gary A. Kildall'],
    title: 'A Unified Approach to Global Program Optimization',
    venue: 'Proceedings of the 1st Annual ACM SIGACT-SIGPLAN Symposium on Principles of Programming Languages (POPL 1973), ACM, pp. 194–206',
    year: 1973,
    doi: '10.1145/512927.512945',
    url: 'https://doi.org/10.1145/512927.512945',
    accessed: '2026-11-02',
    checkedAgainst: 'Search records: the DBLP table of contents for POPL 1973 (mirrored at vldb.org/dblp/db/conf/popl/popl73.html) lists “Gary A. Kildall: A Unified Approach to Global Program Optimization. 194–206”; a Wikipedia-derived reference list gives the same venue, page 194 and doi:10.1145/512927.512945; course notes (Washington CSE 501, Northwestern EECS 396, IIT BHU) describe its content: one iterative algorithm for global analysis, with a function per control-graph node and a meet that merges information arriving from different nodes, applied to constant propagation, common subexpression elimination and redundant register loads. The ACM page itself could not be fetched.',
    shaped: 'Chapters 195–199: where the dataflow framework (facts, a transfer function per node, a meet at joins, iteration to a fixpoint) comes from.',
  },
  {
    id: 'kamullman1977',
    authors: ['John B. Kam', 'Jeffrey D. Ullman'],
    title: 'Monotone Data Flow Analysis Frameworks',
    venue: 'Acta Informatica 7(3), Springer, pp. 305–317',
    year: 1977,
    doi: '10.1007/BF00290339',
    url: 'https://doi.org/10.1007/BF00290339',
    accessed: '2026-11-02',
    checkedAgainst: 'Search records for DOI 10.1007/BF00290339 (unpaywall.org entry; citations giving Acta Informatica 7, 305–317, 1977; one reference list gives 305–318, so the end page is uncertain) and summaries of the paper: it generalises Kildall’s lattice approach to frameworks whose functions are monotone rather than distributive, notes that many practical problems are monotone but not distributive, and shows that no algorithm can compute the meet-over-all-paths solution for every monotone framework, while the iterative algorithm still gives a safe approximation. The Mathematics Genealogy Project confirms Kam’s 1976 Princeton thesis of the same title, advised by Ullman. The Springer page itself could not be fetched.',
    shaped: 'The lattices chapter: monotone frameworks, why iteration is safe, and the gap between the meet over all paths and the iterative answer.',
  },
  {
    id: 'cousot1977',
    authors: ['Patrick Cousot', 'Radhia Cousot'],
    title: 'Abstract Interpretation: A Unified Lattice Model for Static Analysis of Programs by Construction or Approximation of Fixpoints',
    venue: 'Conference Record of the 4th ACM SIGACT-SIGPLAN Symposium on Principles of Programming Languages (POPL 1977), Los Angeles, ACM, pp. 238–252',
    year: 1977,
    doi: '10.1145/512950.512973',
    url: 'https://doi.org/10.1145/512950.512973',
    accessed: '2026-11-02',
    checkedAgainst: 'Search records: a DBLP-derived BibSonomy entry (POPL 1977, pp. 238–252, editors Graham, Harrison and Sethi, doi 10.1145/512950.512973); Patrick Cousot’s own publication list (di.ens.fr and cs.nyu.edu, POPL77 page) for the title and venue; the Wikipedia article on widening, which credits this paper with introducing widening while defining abstract interpretation, and a 2015 slide deck by Cousot that cites it for widening and narrowing on intervals. The abstract (abstract program properties modelled by a complete semilattice, with fixpoints constructed or approximated) was read in search results. The paper’s PDF could not be fetched, so no sentence of it is quoted.',
    shaped: 'The abstract interpretation chapters: running a program on abstract values, abstract domains, soundness, and widening for loops.',
  },
];
