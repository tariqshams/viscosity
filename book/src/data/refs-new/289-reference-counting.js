// New references for chapter 289. Checked 2026-11-02. The chapter also
// relies on rust-std-rc (whose module docs were re-read at tag 1.97.0 in
// this session: “Rc uses non-atomic reference counting”, the compile-time
// check that Rc is not sent between threads, and struct RcInner { strong,
// weak, value }). The listings are real output: Python 3.13.18
// (sys.getrefcount printed 2, 3, 2; a __del__ message appeared as soon as
// the last reference was dropped; sys.getsizeof(object()) is 16), rustc
// 1.97.0 (Rc::strong_count printed 1, 2, 1) and clang 18.1.3 -O2 with
// libstdc++ (lock incl and lock xaddl around a shared_ptr copy).
export default [
  {
    id: 'collins1960',
    authors: ['George E. Collins'],
    title: 'A Method for Overlapping and Erasure of Lists',
    venue: 'Communications of the ACM 3(12), pp. 655–657',
    year: 1960,
    doi: '10.1145/367487.367501',
    url: 'https://doi.org/10.1145/367487.367501',
    accessed: '2026-11-02',
    checkedAgainst: 'Not opened (the ACM pages and doi.org are unreachable from this session, and the full text is paywalled). Web search on 2026-11-02 (the CACM December 1960 issue listing at cacm.acm.org, and a Harvard CS252 reading summary) gives the author, title, CACM 3(12) 655–657, December 1960, and DOI 10.1145/367487.367501, and describes it as the origin of reference counting (counts of references recording how lists overlap); the bibliography of golang-design/under-the-hood (read raw from GitHub) gives the same details and calls it “the earliest proposal of reference-counting collection”. Only these facts are relied on.',
    shaped: 'Chapter 289: where reference counting comes from.',
  },
  {
    id: 'cpython-object-h',
    authors: ['The Python Software Foundation (CPython developers)'],
    title: 'CPython 3.13 source: Include/object.h (struct _object)',
    venue: 'python/cpython, Include/object.h (branch 3.13)',
    year: null,
    doi: null,
    url: 'https://github.com/python/cpython/blob/3.13/Include/object.h',
    accessed: '2026-11-02',
    checkedAgainst: 'Include/object.h read raw from github.com/python/cpython (branch 3.13) on 2026-11-02: in the default build (#ifndef Py_GIL_DISABLED) struct _object holds a union with Py_ssize_t ob_refcnt, then PyTypeObject *ob_type; the free-threaded build instead has ob_tid, ob_ref_local (“local reference count”) and ob_ref_shared (“shared (atomic) reference count”). Python 3.13.18 reports sys.getsizeof(object()) as 16 on x86-64.',
    shaped: 'Chapter 289: where CPython keeps the count.',
  },
  {
    id: 'python-sys-getrefcount',
    authors: ['The Python Software Foundation'],
    title: 'The Python Standard Library: sys.getrefcount (and the C API’s Py_INCREF and Py_DECREF)',
    venue: 'python/cpython, Doc/library/sys.rst and Doc/c-api/refcounting.rst (branch 3.13)',
    year: null,
    doi: null,
    url: 'https://docs.python.org/3.13/library/sys.html#sys.getrefcount',
    accessed: '2026-11-02',
    checkedAgainst: 'Read raw from github.com/python/cpython (branch 3.13) on 2026-11-02. sys.rst: getrefcount “Return the reference count of the object. The count returned is generally one higher than you might expect, because it includes the (temporary) reference as an argument to getrefcount()”, and some objects are immortal. refcounting.rst: Py_INCREF “Indicate taking a new strong reference to object o”, Py_DECREF “Release a strong reference to object o”.',
    shaped: 'Chapter 289: reading CPython’s counts.',
  },
  {
    id: 'swift-arc',
    authors: ['Apple Inc. and the Swift project authors'],
    title: 'The Swift Programming Language: Automatic Reference Counting',
    venue: 'swiftlang/swift-book, TSPL.docc/LanguageGuide/AutomaticReferenceCounting.md',
    year: null,
    doi: null,
    url: 'https://docs.swift.org/swift-book/documentation/the-swift-programming-language/automaticreferencecounting/',
    accessed: '2026-11-02',
    checkedAgainst: 'AutomaticReferenceCounting.md read raw from github.com/swiftlang/swift-book (main) on 2026-11-02: “Swift uses Automatic Reference Counting (ARC) to track and manage your app’s memory usage”; “ARC automatically frees up the memory used by class instances when those instances are no longer needed”; “Reference counting applies only to instances of classes”; ARC with Objective-C is “very similar”; and the sections on strong reference cycles and weak references (“A weak reference is a reference that doesn’t keep a strong hold on the instance it refers to … ARC automatically sets a weak reference to nil when the instance that it refers to is deallocated”).',
    shaped: 'Chapters 289 and 289b: Swift’s ARC, cycles and weak references.',
  },
];
