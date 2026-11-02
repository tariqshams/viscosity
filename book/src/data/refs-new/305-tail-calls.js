// New references for chapter 275. Checked 2026-11-02. The chapter also
// relies on ecma262 (spec.html re-read raw from github.com/tc39/ecma262 on
// 2026-11-02: IsInTailPosition returns false for non-strict code;
// HasCallInTailPosition covers both arms of ?: and only the right side of
// ||, && and ??; PrepareForTailCall says “A tail position call must either
// release any transient internal resources associated with the currently
// executing function execution context before invoking the target
// function or reuse those resources”), riscv-asm-manual (src/asm-manual.adoc
// re-read raw: “tail offset” expands to “auipc x6, offset[31:12]” and
// “jalr x0, offset[11:0](x6)”, “Tail call far-away subroutine”) and
// mdn-too-much-recursion. Evidence produced in this session: clang 18.1.3
// --target=riscv64-unknown-elf -O0 / -O1 -S (listings trimmed), Node
// 22.23.4 (“RangeError: Maximum call stack size exceeded” for sum(1e5, 0)
// in strict mode), Python 3.13.18 (RecursionError; sys.getrecursionlimit()
// printed 1000), and the Drip companion (book/companion/ts, “runtime
// error: stack overflow” for sum(300, 0); the trampoline printed 500500 on
// the tree-walker and the VM).
export default [
  {
    id: 'steele1977',
    authors: ['Guy Lewis Steele Jr.'],
    title: 'Debunking the “Expensive Procedure Call” Myth, or, Procedure Call Implementations Considered Harmful, or, Lambda: The Ultimate GOTO',
    venue: 'MIT AI Memo 443; also Proceedings of the ACM National Conference (ACM ’77), Seattle',
    year: 1977,
    doi: null,
    url: 'https://research.scheme.org/lambda-papers/',
    accessed: '2026-11-02',
    checkedAgainst: 'Web search on 2026-11-02 (MIT DSpace handle 1721.1/5753 record, research.scheme.org/lambda-papers, the Internet Archive copy of AIM-443): AI Memo 443, October 1977, by Guy Lewis Steele Jr., with the three titles above, an annotated version of a paper for ACM ’77 in Seattle; its thesis is that the folklore that procedure calls are expensive “is largely a result of poorly designed language implementations”. The full text could not be opened from this session, so nothing beyond this is relied on.',
    shaped: 'Chapter 275: the argument that calls, including tail calls, need not be expensive.',
  },
  {
    id: 'clang-musttail',
    authors: ['The Clang Team'],
    title: 'Clang Attributes Reference: musttail',
    venue: 'clang.llvm.org; source clang/include/clang/Basic/AttrDocs.td in llvm/llvm-project',
    year: null,
    doi: null,
    url: 'https://clang.llvm.org/docs/AttributeReference.html#musttail',
    accessed: '2026-11-02',
    checkedAgainst: 'MustTailDocs read raw from raw.githubusercontent.com/llvm/llvm-project/main/clang/include/clang/Basic/AttrDocs.td on 2026-11-02: “If a return statement is marked musttail, this indicates that the compiler must generate a tail call for the program to be correct, even when optimizations are disabled. This guarantees that the call will not cause unbounded stack growth if it is part of a recursive cycle in the call graph.” clang.llvm.org itself was not reachable from this session.',
    shaped: 'Chapter 275: guaranteed tail calls in C and C++ with clang.',
  },
  {
    id: 'ganz1999',
    authors: ['Steven E. Ganz', 'Daniel P. Friedman', 'Mitchell Wand'],
    title: 'Trampolined Style',
    venue: 'Proceedings of the Fourth ACM SIGPLAN International Conference on Functional Programming (ICFP ’99), Paris; ACM SIGPLAN Notices 34(9)',
    year: 1999,
    doi: null,
    url: 'https://dl.acm.org/doi/proceedings/10.1145/317636',
    accessed: '2026-11-02',
    checkedAgainst: 'Web search on 2026-11-02 (the ICFP ’99 programme listing, a PLDI paper list linking dl.acm.org, and a library record): “Trampolined Style” by Steven E. Ganz, Daniel P. Friedman and Mitchell Wand, ICFP ’99, September 1999, published in ACM SIGPLAN Notices 34(9). The abstract describes trampolining as scheduling computations in a single loop. The paper’s own DOI could not be confirmed, so the URL is the proceedings’ prefix and no DOI is given.',
    shaped: 'Chapter 275: the trampoline.',
  },
];
