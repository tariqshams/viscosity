// New references for chapter 203 (Dead code elimination). Checked
// 2026-11-02 against the file itself on raw.githubusercontent.com.
export default [
  {
    id: 'gcc-tree-ssa-dce',
    authors: ['The GCC developers (Free Software Foundation)'],
    title: 'tree-ssa-dce.cc: dead code elimination (GCC source code)',
    venue: 'GCC, official source repository (GitHub mirror gcc-mirror/gcc), gcc/tree-ssa-dce.cc',
    year: null,
    doi: null,
    url: 'https://github.com/gcc-mirror/gcc/blob/master/gcc/tree-ssa-dce.cc',
    accessed: '2026-11-02',
    checkedAgainst: 'https://raw.githubusercontent.com/gcc-mirror/gcc/master/gcc/tree-ssa-dce.cc, read 2026-11-02: the header comment defines dead statements as those with no impact on the program’s output and describes three phases: marking as necessary the statements known to be necessary (most function calls, writing a value to memory), propagating necessity to the statements that give values to their operands, and removing the dead statements.',
    shaped: 'Chapter 203: mark-and-sweep DCE as a production compiler implements it.',
  },
];
