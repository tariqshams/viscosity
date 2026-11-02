// New references for the staged chapter 93-b (The call graph), a split of
// chapter 93. Checked 2026-11-02 against the file itself on
// raw.githubusercontent.com.
export default [
  {
    id: 'gcc-ipa-inline',
    authors: ['The GCC developers (Free Software Foundation)'],
    title: 'ipa-inline.cc: inlining decision heuristics (GCC source code)',
    venue: 'GCC, official source repository (GitHub mirror gcc-mirror/gcc), gcc/ipa-inline.cc',
    year: null,
    doi: null,
    url: 'https://github.com/gcc-mirror/gcc/blob/master/gcc/ipa-inline.cc',
    accessed: '2026-11-02',
    checkedAgainst: 'https://raw.githubusercontent.com/gcc-mirror/gcc/master/gcc/ipa-inline.cc, read 2026-11-02: the header comment “Inlining decision heuristics” describes pass_early_inlining, run in topological order (reverse postorder) on the callgraph so that callees have already been optimized, allowing growth by EARLY_INLINING_INSNS when the callee is a leaf; and pass_ipa_inline, which inlines small functions greedily in order of “badness” while inline limits allow, uses a special recursive inliner for recursive calls (“with results similar to loop unrolling”), removes unreachable functions, and inlines functions called once and not exported from the unit.',
    shaped: 'Chapter 93-b: the inlining heuristics of a production compiler, and why inliners work over the call graph from the leaves up.',
  },
];
