// New references for the staged chapter 213-b (Lazy code motion), a split
// of chapter 213. Checked 2026-11-02. doi.org, dl.acm.org and dblp.org were
// unreachable from this session, so the paper was checked against search
// results and against GCC's source, which cites it; GCC's files were read
// directly on raw.githubusercontent.com.
export default [
  {
    id: 'knoop1992',
    authors: ['Jens Knoop', 'Oliver Rüthing', 'Bernhard Steffen'],
    title: 'Lazy Code Motion',
    venue: 'Proceedings of the ACM SIGPLAN ’92 Conference on Programming Language Design and Implementation (PLDI), pp. 224–234; ACM SIGPLAN Notices 27(7), July 1992',
    year: 1992,
    doi: null,
    url: 'https://dblp.org/db/conf/pldi/pldi92.html',
    accessed: '2026-11-02',
    checkedAgainst: 'Search results: dblp’s PLDI 1992 listing (pp. 224–234, proceedings published as SIGPLAN Notices 27(7)), a Springer Professional record of the paper, and a retrospective version in the “20 Years of PLDI” selection. Two different DOIs appear in secondary sources (10.1145/143095.143136 and 10.1145/143103.143136), so no DOI is given. Also the reference list in GCC’s gcc/gcse.cc: “Lazy Code Motion, J. Knoop, O. Ruthing, B. Steffen, ACM SIGPLAN Notices Vol. 27, Num. 7, Jul. 1992, ’92 Conference on PLDI”. The paper text was not opened.',
    shaped: 'Chapter 213-b: placing partial-redundancy insertions as late as possible (earliest, then postponed, then latest).',
  },
  {
    id: 'gcc-lcm',
    authors: ['The GCC developers (Free Software Foundation)'],
    title: 'lcm.cc and gcse.cc: lazy code motion and global common subexpression elimination (GCC source code)',
    venue: 'GCC, official source repository (GitHub mirror gcc-mirror/gcc), gcc/lcm.cc and gcc/gcse.cc',
    year: null,
    doi: null,
    url: 'https://github.com/gcc-mirror/gcc/blob/master/gcc/lcm.cc',
    accessed: '2026-11-02',
    checkedAgainst: 'https://raw.githubusercontent.com/gcc-mirror/gcc/master/gcc/lcm.cc and .../gcc/gcse.cc, read 2026-11-02. lcm.cc: “Generic partial redundancy elimination with lazy code motion support”; its users include traditional PRE, placement of register saves and restores, and load/store motion; its inputs are basic-block information and bitmaps of local properties (computed, transparent and anticipatable expressions); its output is a bitmap of redundant computations and one of optimal placement points. gcse.cc lists Morel and Renvoise (CACM 22(2), 1979) and Knoop, Rüthing and Steffen (“Lazy Code Motion”, PLDI 1992) among its references, and says its PRE is based on the Morel–Renvoise paper, Fred Chow’s thesis, and lazy code motion as described in Muchnick’s Advanced Compiler Design and Implementation.',
    shaped: 'Chapter 213-b: lazy code motion in a production compiler.',
  },
];
