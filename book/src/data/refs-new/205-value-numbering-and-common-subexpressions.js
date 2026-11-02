// New references for chapter 205 (Value numbering and common
// subexpressions). Checked 2026-11-02 against the file itself on
// raw.githubusercontent.com.
export default [
  {
    id: 'gcc-tree-ssa-sccvn',
    authors: ['The GCC developers (Free Software Foundation)'],
    title: 'tree-ssa-sccvn.cc: SCC value numbering (GCC source code)',
    venue: 'GCC, official source repository (GitHub mirror gcc-mirror/gcc), gcc/tree-ssa-sccvn.cc',
    year: null,
    doi: null,
    url: 'https://github.com/gcc-mirror/gcc/blob/master/gcc/tree-ssa-sccvn.cc',
    accessed: '2026-11-02',
    checkedAgainst: 'https://raw.githubusercontent.com/gcc-mirror/gcc/master/gcc/tree-ssa-sccvn.cc, read 2026-11-02: the comment above the algorithm says it is based on the SCC algorithm of Keith Cooper and L. Taylor Simpson (“SCC-Based Value numbering”), that in straight-line code it is equivalent to a regular hash based value numbering performed in reverse postorder, and that for code with cycles it iterates (either whole RPO walks, or only the SCCs of the SSA graph, with a separate optimistic hashtable). Also gcc/tree-ssa-pre.cc, whose header says FRE, PRE and code hoisting all piggy-back on the GVN in tree-ssa-sccvn.cc.',
    shaped: 'Chapters 205 and its staged second half: hash-based value numbering in a production compiler, and optimistic iteration around loops.',
  },
];
