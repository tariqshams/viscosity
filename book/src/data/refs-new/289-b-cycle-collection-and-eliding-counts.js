// New references for chapter 283b (staged split of chapter 283). Checked
// 2026-11-02. The chapter also relies on rust-std-rc (“A cycle between Rc
// pointers will never be deallocated. For this reason, Weak is used to
// break cycles”, re-read at tag 1.97.0) and swift-arc. The listings are
// real output: Python 3.13.18 (two objects in a cycle freed only by
// gc.collect(), which returned 2), rustc 1.97.0 (-O and -C opt-level=0
// assembly for peek; the Weak tree type compiled and ran) and clang
// 18.1.3 -O2 with libstdc++.
export default [
  {
    id: 'bacon2001',
    authors: ['David F. Bacon', 'V. T. Rajan'],
    title: 'Concurrent Cycle Collection in Reference Counted Systems',
    venue: 'ECOOP 2001: Object-Oriented Programming, Lecture Notes in Computer Science 2072, Springer',
    year: 2001,
    doi: '10.1007/3-540-45337-7_12',
    url: 'https://doi.org/10.1007/3-540-45337-7_12',
    accessed: '2026-11-02',
    checkedAgainst: 'Not opened (Springer and doi.org are unreachable from this session). The header comment of xpcom/base/nsCycleCollector.cpp in mozilla-firefox/firefox, read raw from GitHub on 2026-11-02, cites it as “Concurrent Cycle Collection in Reference Counted Systems, Bacon & Rajan (2001), ECOOP 2001 / Springer LNCS vol 2072”; web search (the Unpaywall record of the Springer chapter) gives DOI 10.1007/3-540-45337-7_12. The trial-deletion steps in the chapter are described as Firefox’s source implements them (purple candidates, gray, black, white), not from the paper’s text.',
    shaped: 'Chapter 283b: trial deletion, the synchronous cycle collector.',
  },
  {
    id: 'firefox-cycle-collector',
    authors: ['Mozilla contributors'],
    title: 'Firefox source: xpcom/base/nsCycleCollector.cpp',
    venue: 'mozilla-firefox/firefox on GitHub',
    year: null,
    doi: null,
    url: 'https://github.com/mozilla-firefox/firefox/blob/main/xpcom/base/nsCycleCollector.cpp',
    accessed: '2026-11-02',
    checkedAgainst: 'Read raw from GitHub on 2026-11-02. Header comment: “This file implements a garbage-cycle collector based on the paper Concurrent Cycle Collection in Reference Counted Systems, Bacon & Rajan (2001)”; black nodes “are definitely live”, white nodes “are definitely garbage cycles”, grey nodes “are being scanned”, purple nodes “are candidates for being scanned”; objects must report turning purple “when their refcount transitions from N+1 -> N, for nonzero N”. ScanWhiteNodes tests pi->mInternalRefs == pi->mRefCount || pi->IsGrayJS().',
    shaped: 'Chapter 283b: a cycle collector in a real browser.',
  },
  {
    id: 'python-gc',
    authors: ['The Python Software Foundation'],
    title: 'The Python Standard Library: gc (Garbage Collector interface)',
    venue: 'python/cpython, Doc/library/gc.rst (branch 3.13)',
    year: null,
    doi: null,
    url: 'https://docs.python.org/3.13/library/gc.html',
    accessed: '2026-11-02',
    checkedAgainst: 'Doc/library/gc.rst read raw from github.com/python/cpython (branch 3.13) on 2026-11-02: “Since the collector supplements the reference counting already used in Python, you can disable the collector if you are sure your program does not create reference cycles.” Python 3.13.18 freed a two-object cycle only on gc.collect(), which returned 2.',
    shaped: 'Chapter 283b: CPython’s cycle collector alongside its counts.',
  },
  {
    id: 'lean-explicit-rc',
    authors: ['Lean FRO (Henrik Böving and the Lean developers)'],
    title: 'Lean 4 compiler: ExplicitRC.lean and InferBorrow.lean (after Ullrich and de Moura, “Counting Immutable Beans”, IFL 2019)',
    venue: 'leanprover/lean4, src/Lean/Compiler/LCNF/',
    year: null,
    doi: null,
    url: 'https://github.com/leanprover/lean4/tree/master/src/Lean/Compiler/LCNF',
    accessed: '2026-11-02',
    checkedAgainst: 'ExplicitRC.lean and InferBorrow.lean read raw from github.com/leanprover/lean4 (HEAD) on 2026-11-02. ExplicitRC: “This pass inserts explicit reference counting instructions … based on the ‘Immutable Beans Counting’ paper”; it performs “a liveness analysis, inserting decrements at the first position where values need not be alive anymore”, and “inserts increments whenever values are used in an ‘owned’ fashion (e.g. passed as an owned parameter) and continue being used later on”. InferBorrow: “When a parameter is marked as borrowed, the caller can be sure that the function will not decrement the reference count of the parameter.” The paper itself (Sebastian Ullrich and Leonardo de Moura, “Counting Immutable Beans: Reference Counting Optimized for Purely Functional Programming”, IFL 2019, arXiv 1908.05647) is named by ResetReuse.lean and by leanprover/reference-manual Manual/Papers.lean; it was not opened.',
    shaped: 'Chapter 283b: borrowed parameters and liveness-based count insertion.',
  },
  {
    id: 'swift-arc-optimization',
    authors: ['The Swift project authors'],
    title: 'ARC Optimization for Swift',
    venue: 'swiftlang/swift, docs/SIL/ARCOptimization.md',
    year: null,
    doi: null,
    url: 'https://github.com/swiftlang/swift/blob/main/docs/SIL/ARCOptimization.md',
    accessed: '2026-11-02',
    checkedAgainst: 'Read raw from github.com/swiftlang/swift (main) on 2026-11-02: lists the reference counting instructions (strong_retain, strong_release, …), and its section ARC Loop Hoisting “describes the ARCLoopHoisting algorithm that hoists retains and releases out of loops”; the section ARC Sequence Optimization is marked TODO, so nothing is cited from it.',
    shaped: 'Chapter 283b: Swift’s compiler removes and moves retains and releases.',
  },
];
