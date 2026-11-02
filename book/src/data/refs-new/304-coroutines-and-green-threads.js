// New references for chapter 304. Checked 2026-11-02. The chapter also
// relies on python-expressions (re-read raw from python/cpython 3.13,
// Doc/reference/expressions.rst: generators are “quite similar to
// coroutines ... The only difference is that a generator function cannot
// control where the execution should continue after it yields; the control
// is always transferred to the generator's caller”). Evidence produced in
// this session: Node 22.23.4 (the SyntaxError quoted), Python 3.13.18
// (list(gen()) printed [2]), Go 1.24.7 (100,000 goroutines:
// runtime.NumGoroutine() 100001, MemStats.StackInuse / 100000 = 2051) and
// OpenJDK 21.0.12 (100,000 virtual threads sleeping 1 s each, about 2.0 s
// wall time on 4 cores). Lua was not available, so the Lua example’s
// results are taken from the manual’s description of resume and yield.
export default [
  {
    id: 'conway1963',
    authors: ['Melvin E. Conway'],
    title: 'Design of a Separable Transition-Diagram Compiler',
    venue: 'Communications of the ACM 6(7), pp. 396–408',
    year: 1963,
    doi: '10.1145/366663.366704',
    url: 'https://doi.org/10.1145/366663.366704',
    accessed: '2026-11-02',
    checkedAgainst: 'Web search on 2026-11-02 (Wikipedia’s Melvin Conway article and several course notes citing it): Communications of the ACM 6(7):396–408, 1963, doi:10.1145/366663.366704, credited as the first published explanation of coroutines, proposing a compiler organised as a set of coroutines. The ACM page could not be opened from this session, so only these facts are relied on.',
    shaped: 'Chapter 304: the origin of the coroutine.',
  },
  {
    id: 'moura2009',
    authors: ['Ana Lúcia de Moura', 'Roberto Ierusalimschy'],
    title: 'Revisiting Coroutines',
    venue: 'ACM Transactions on Programming Languages and Systems 31(2), Article 6',
    year: 2009,
    doi: '10.1145/1462166.1462167',
    url: 'https://doi.org/10.1145/1462166.1462167',
    accessed: '2026-11-02',
    checkedAgainst: 'Web search on 2026-11-02 (lua.org/papers.html, the Tufts course archive copy, dcreager.net’s paper notes): TOPLAS 31(2), Article 6, February 2009, 31 pages, DOI 10.1145/1462166.1462167. The paper proposes a classification of coroutines and defines full asymmetric coroutines. The ACM page could not be opened from this session.',
    shaped: 'Chapter 304: the terms asymmetric and full (stackful) coroutine.',
  },
  {
    id: 'lua-manual-coroutines',
    authors: ['Roberto Ierusalimschy', 'Luiz Henrique de Figueiredo', 'Waldemar Celes'],
    title: 'Lua 5.4 Reference Manual, §2.6 Coroutines',
    venue: 'lua.org; source manual/manual.of in github.com/lua/lua (branch v5.4)',
    year: 2020,
    doi: null,
    url: 'https://www.lua.org/manual/5.4/manual.html#2.6',
    accessed: '2026-11-02',
    checkedAgainst: 'Section @sect2{coroutine} read raw from raw.githubusercontent.com/lua/lua/v5.4/manual/manual.of on 2026-11-02: “A coroutine in Lua represents an independent thread of execution”; coroutine.resume returns true plus the values passed to yield, and the coroutine yields “even if the yield happens inside nested function calls (that is, not in the main function, but in a function directly or indirectly called by the main function)”. www.lua.org itself was not reachable from this session.',
    shaped: 'Chapter 304: Lua coroutines as stackful, asymmetric coroutines.',
  },
  {
    id: 'go-spec-go-stmt',
    authors: ['The Go Authors'],
    title: 'The Go Programming Language Specification: Go statements',
    venue: 'go.dev/ref/spec; source doc/go_spec.html in github.com/golang/go',
    year: null,
    doi: null,
    url: 'https://go.dev/ref/spec#Go_statements',
    accessed: '2026-11-02',
    checkedAgainst: 'doc/go_spec.html read raw from github.com/golang/go at tag go1.24.7 on 2026-11-02: “A "go" statement starts the execution of a function call as an independent concurrent thread of control, or goroutine, within the same address space.”',
    shaped: 'Chapter 304: goroutines as green threads.',
  },
  {
    id: 'go-runtime-stack',
    authors: ['The Go Authors'],
    title: 'Go runtime source: src/runtime/stack.go (go1.24.7)',
    venue: 'github.com/golang/go',
    year: 2025,
    doi: null,
    url: 'https://github.com/golang/go/blob/go1.24.7/src/runtime/stack.go',
    accessed: '2026-11-02',
    checkedAgainst: 'Read raw from raw.githubusercontent.com/golang/go/go1.24.7/src/runtime/stack.go on 2026-11-02: “stackMin = 2048”; newstack is “Called from runtime·morestack when more stack is needed. Allocate larger stack and relocate to new stack. Stack growth is multiplicative, for constant amortized cost.” with newsize := oldsize * 2, and copystack “Copies gp’s stack to a new stack of a different size.”',
    shaped: 'Chapter 304: goroutine stacks start at 2 KB and grow by copying.',
  },
  {
    id: 'openjdk-virtualthread',
    authors: ['Oracle and the OpenJDK contributors'],
    title: 'OpenJDK source: java/lang/VirtualThread.java (jdk-21+35)',
    venue: 'github.com/openjdk/jdk',
    year: 2023,
    doi: null,
    url: 'https://github.com/openjdk/jdk/blob/jdk-21%2B35/src/java.base/share/classes/java/lang/VirtualThread.java',
    accessed: '2026-11-02',
    checkedAgainst: 'Read raw from raw.githubusercontent.com/openjdk/jdk/jdk-21%2B35/src/java.base/share/classes/java/lang/VirtualThread.java on 2026-11-02: the class comment “A thread that is scheduled by the Java virtual machine rather than the operating system”; fields for a jdk.internal.vm.Continuation and the carrier thread (“carrier thread when mounted”); a DEFAULT_SCHEDULER that is a ForkJoinPool; and yieldContinuation(), which unmounts and calls Continuation.yield(VTHREAD_SCOPE), then mounts again. JEP 444 (openjdk.org) could not be reached from this session.',
    shaped: 'Chapter 304: Java virtual threads as green threads built on continuations.',
  },
];
