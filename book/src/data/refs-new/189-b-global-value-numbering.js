// New references for the staged chapter 205-b (Global value numbering), a
// split of chapter 205. Checked 2026-11-02. This session could not reach
// doi.org, dl.acm.org, dblp.org or publishers' sites directly, so details
// were checked against search results (listed per entry) and, where noted,
// against GCC's source, which cites the same works.
export default [
  {
    id: 'coopertorczon2011',
    authors: ['Keith D. Cooper', 'Linda Torczon'],
    title: 'Engineering a Compiler (2nd edition)',
    venue: 'Morgan Kaufmann (Elsevier), ISBN 978-0-12-088478-0',
    year: 2011,
    doi: null,
    url: 'https://shop.elsevier.com/books/engineering-a-compiler/cooper/978-0-12-088478-0',
    accessed: '2026-11-02',
    checkedAgainst: 'Search results for the Elsevier shop and Elsevier educate pages of the 2nd edition, whose table of contents lists 8.4.1 Local Value Numbering and 8.5.1 Superlocal Value Numbering (chapter 8, Introduction to Optimization) and 10.5.2 Dominator-based Value Numbering (chapter 10, Scalar Optimizations, under 10.5 Redundancy Elimination). Only the table of contents was seen, not the text.',
    shaped: 'Chapter 205-b: value numbering built up from local, to superlocal, to dominator-based.',
  },
  {
    id: 'alpern1988',
    authors: ['Bowen Alpern', 'Mark N. Wegman', 'F. Kenneth Zadeck'],
    title: 'Detecting Equality of Variables in Programs',
    venue: 'Proceedings of the 15th ACM SIGPLAN-SIGACT Symposium on Principles of Programming Languages (POPL ’88), San Diego, pp. 1–11',
    year: 1988,
    doi: '10.1145/73560.73561',
    url: 'https://research.ibm.com/publications/detecting-equality-of-variables-in-programs',
    accessed: '2026-11-02',
    checkedAgainst: 'Search results: the IBM Research publication page with this title; a BibTeX entry giving Alpern, Wegman and Zadeck, POPL ’88, pp. 1–11, doi 10.1145/73560.73561, San Diego; and Rüthing, Knoop and Steffen (SAS 1999, course copy), which says it extends the work of Alpern, Wegman and Zadeck and calls that approach less precise but almost linear in time. (dblp’s POPL 1988 listing wrongly attributes the paper to Ferrante and Mager.) The paper text was not opened.',
    shaped: 'Chapter 205-b: optimistic, partition-based value numbering that finds equalities around loops which hashing misses.',
  },
  {
    id: 'click1995',
    authors: ['Cliff Click'],
    title: 'Global Code Motion / Global Value Numbering',
    venue: 'Proceedings of the ACM SIGPLAN 1995 Conference on Programming Language Design and Implementation (PLDI ’95), pp. 246–257; ACM SIGPLAN Notices 30(6)',
    year: 1995,
    doi: '10.1145/207110.207154',
    url: 'https://courses.cs.washington.edu/courses/cse501/04wi/papers/click-pldi95.pdf',
    accessed: '2026-11-02',
    checkedAgainst: 'Search results: dblp’s PLDI 1995 listing (pp. 246–257, in the same session as Knoop, Rüthing and Steffen’s “The Power of Assignment Motion”); a crossmark link for 10.1145/207110.207154 on the paper’s first page; the abstract (“We present a straightforward near-linear-time algorithm for performing Global Code Motion (GCM). GCM allows us to use a simple hash-based technique for Global Value Numbering (GVN)”). Also the reference list in GCC’s gcc/gcse.cc (raw.githubusercontent.com/gcc-mirror/gcc/master): “Global code motion / global value numbering, C. Click, ACM SIGPLAN Notices Vol. 30, Num. 6, Jun. 1995, ’95 Conference on PLDI”.',
    shaped: 'Chapter 205-b: hash-based GVN combined with global code motion.',
  },
];
