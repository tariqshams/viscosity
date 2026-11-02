// New references for chapter 296. Checked 2026-11-02. Only GitHub raw was
// reachable from this session, so the two papers were checked through web
// search; their full texts were not read, and the chapter relies on them
// only for what the listings and Go's and V8's own descriptions of them
// say. The chapter also relies on v8-trash-talk (re-read raw: the
// definitions of parallel, incremental and concurrent), v8-concurrent-
// marking (re-read raw: V8 switched to incremental marking in 2011; the
// marking step size matches the allocation rate; “V8 implements the
// notification using a Dijkstra-style write-barrier”; “This is also known
// as the strong tri-color invariant”; the source-colour check was removed
// to avoid a memory fence, and “The original write barrier proposed by
// Dijkstra et al. also does not check the object color”) and
// hotspot-card-table (G1's SATB pre-barrier). Evidence produced in this
// session: Go 1.24.7 with GODEBUG=gctrace=1 on a loop making 30 million
// small structs and keeping one in a hundred (“gc 118 @1.007s 8%:
// 0.021+6.7+0.065 ms clock, … 13->14->8 MB, 15 MB goal, … 4 P”), and
// Node v22.23.4 with --trace-gc (the Mark-Compact line with “finalize
// incremental marking via stack guard”).
export default [
  {
    id: 'dijkstra1978',
    authors: ['Edsger W. Dijkstra', 'Leslie Lamport', 'A. J. Martin', 'C. S. Scholten', 'E. F. M. Steffens'],
    title: 'On-the-fly Garbage Collection: An Exercise in Cooperation',
    venue: 'Communications of the ACM 21(11), pp. 966–975',
    year: 1978,
    doi: null,
    url: 'https://www.cs.utexas.edu/~EWD/transcriptions/EWD06xx/EWD630.html',
    accessed: '2026-11-02',
    checkedAgainst: 'Web search on 2026-11-02: Microsoft Research’s listing of Lamport’s papers gives CACM 21(11):966–975 (1978) and calls it the first concurrent garbage collection algorithm; Dijkstra’s EWD520 and EWD630 transcriptions at cs.utexas.edu give the authors and the abstract (collection work done by a separate processor alongside the computation, with weak exclusion and synchronisation). Go’s runtime/mgc.go (go1.24.7, read raw) cites it the same way: “Edsger W. Dijkstra, Leslie Lamport, A. J. Martin, C. S. Scholten, and E. F. M. Steffens. 1978. On-the-fly garbage collection: an exercise in cooperation. Commun. ACM 21, 11 (November 1978), 966-975.” No DOI could be confirmed, so none is given; the URL is Dijkstra’s own EWD630 transcription, found by the search but not opened from this session.',
    shaped: 'Chapter 296: the first concurrent collector and the insertion (Dijkstra) barrier.',
  },
  {
    id: 'yuasa1990',
    authors: ['Taiichi Yuasa'],
    title: 'Real-time garbage collection on general-purpose machines',
    venue: 'Journal of Systems and Software 11(3), pp. 181–198',
    year: 1990,
    doi: null,
    url: 'https://dblp.org/pid/30/3398.html',
    accessed: '2026-11-02',
    checkedAgainst: 'Web search on 2026-11-02: DBLP (pid 30/3398) and the Kent GC bibliography give J. Syst. Softw. 11(3):181–198, March 1990. Kyoto University’s repository holds Yuasa’s 1987 doctoral thesis of the same English title. No DOI could be confirmed, so none is given; the article’s text was not read. What the chapter says of the barrier, that it shades the value being overwritten, is checked against Go’s runtime/mbarrier.go (go1.24.7, read raw): “a Yuasa-style deletion barrier—which shades the object whose reference is being overwritten”.',
    shaped: 'Chapter 296: the deletion (Yuasa) barrier behind snapshot-at-the-beginning marking.',
  },
  {
    id: 'go-runtime-gc',
    authors: ['The Go Authors'],
    title: 'Go runtime: the garbage collector (runtime/mgc.go, mbarrier.go, extern.go, malloc.go, mfinal.go, mcleanup.go, sizeclasses.go; weak/pointer.go)',
    venue: 'github.com/golang/go, tag go1.24.7',
    year: 2025,
    doi: null,
    url: 'https://github.com/golang/go/blob/go1.24.7/src/runtime/mgc.go',
    accessed: '2026-11-02',
    checkedAgainst: 'Read raw from raw.githubusercontent.com/golang/go/go1.24.7 on 2026-11-02. mgc.go: “a concurrent mark and sweep that uses a write barrier. It is non-generational and non-compacting. Allocation is done using size segregated per P allocation areas”; heritage from Dijkstra et al. 1978; the cycle (STW sweep termination, concurrent mark with “assists performed as part of allocation”, “Newly allocated objects are immediately marked black”, STW mark termination, concurrent sweep); GOGC=100 means the next GC at twice the in-use heap. mbarrier.go: the hybrid barrier pseudocode (shade(*slot); if current stack is grey: shade(ptr); *slot = ptr) and why the barriers are not conditional on the slot’s colour (memory ordering). extern.go: the gctrace line format and that its three clock times are STW sweep termination, concurrent mark and scan, and STW mark termination. malloc.go: small sizes up to 32 kB are “rounded to one of about 70 size classes, each of which has its own free set of objects of exactly that size”, managed “using a free bitmap”; mcache per P. sizeclasses.go: class 3 is 24 bytes per object. mfinal.go: SetFinalizer makes obj reachable again; a cycle including a finalizer “is not guaranteed to be garbage collected”; new code should use AddCleanup. mcleanup.go: AddCleanup runs cleanup(arg) some time after ptr is unreachable, “not always guaranteed to run”. weak/pointer.go: weak.Pointer, whose Value may return nil once the object is unreachable.',
    shaped: 'Chapters 296 and 297: Go’s concurrent mark-sweep, hybrid barrier and gctrace output; its size-class allocator; its finalizers, cleanups and weak pointers.',
  },
];
