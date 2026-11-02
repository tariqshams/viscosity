// New references for the second half of chapter 95 (staged as
// 220-b-function-summaries-and-datalog). Doop's rules, Soufflé's README and
// Go's escape analysis were read raw from GitHub; the paper only through
// search records.
export default [
  {
    id: 'bravenboer2009',
    authors: ['Martin Bravenboer', 'Yannis Smaragdakis'],
    title: 'Strictly Declarative Specification of Sophisticated Points-to Analyses',
    venue: 'Proceedings of the 24th ACM SIGPLAN Conference on Object-Oriented Programming Systems, Languages and Applications (OOPSLA ’09), ACM, pp. 243–262',
    year: 2009,
    doi: '10.1145/1640089.1640108',
    url: 'https://doi.org/10.1145/1640089.1640108',
    accessed: '2026-11-02',
    checkedAgainst: 'Search records only: course copies (courses.cs.washington.edu p243-bravenboer.pdf, inst.eecs.berkeley.edu doop.pdf), the OOPSLA 2009 research-program page, and a BibTeX entry giving pages 243–262 and doi 10.1145/1640089.1640108; summaries of the paper: Doop, a points-to analysis framework for Java specified fully in Datalog, the first declarative specification of a context-sensitive points-to analysis with on-the-fly call-graph computation, and much faster than the BDD-based Paddle at equal precision on DaCapo. The PDF could not be fetched, so nothing is quoted from it.',
    shaped: 'Chapter 95b: points-to analysis and call-graph construction written as Datalog rules, with context sensitivity, in Doop.',
  },
  {
    id: 'doop-micro',
    authors: ['The Doop authors (PLAST lab)'],
    title: 'Doop: souffle-logic/analyses/micro/analysis.dl and docs/datalog-101-legacy.md',
    venue: 'Doop source repository (github.com/plast-lab/doop-mirror), master branch',
    year: null,
    doi: null,
    url: 'https://github.com/plast-lab/doop-mirror/blob/master/souffle-logic/analyses/micro/analysis.dl',
    accessed: '2026-11-02',
    checkedAgainst: 'https://raw.githubusercontent.com/plast-lab/doop-mirror/master/souffle-logic/analyses/micro/analysis.dl (master at commit 33a0cee3d5a0, read 2026-11-02): the rules “VarPointsTo(?heap, ?var) :- AssignHeapAllocation(?heap, ?var, ?inMethod), Reachable(?inMethod).”, “VarPointsTo(?heap, ?to) :- Assign(?from, ?to), VarPointsTo(?heap, ?from).”, the instance-field load and store rules, and “Reachable(?tomethod), CallGraphEdge(?invocation, ?tomethod) :- …”; and .../docs/datalog-101-legacy.md (“rules … infer new information from facts already known to be true. This continues until no new information can be extracted (fixed-point computation)”; the Edge/Path toy example). README.md: “Doop - Framework for Java Pointer and Taint Analysis”.',
    shaped: 'Chapter 95b: real Datalog rules for points-to sets, field loads and stores, and the call graph, quoted from Doop.',
  },
  {
    id: 'souffle-readme',
    authors: ['The Soufflé developers'],
    title: 'Soufflé: README.md',
    venue: 'Soufflé source repository (github.com/souffle-lang/souffle), master branch',
    year: null,
    doi: null,
    url: 'https://github.com/souffle-lang/souffle',
    accessed: '2026-11-02',
    checkedAgainst: 'https://raw.githubusercontent.com/souffle-lang/souffle/master/README.md (master at commit 2adf8c07210f, read 2026-11-02): “The Soufflé language is similar to Datalog (but has terms known as records), and is frequently used as a domain-specific language for analysis problems”; “Efficient translation to parallel C++ of Datalog programs”.',
    shaped: 'Chapter 95b: Soufflé as the Datalog engine that runs analyses such as Doop’s, by compiling the rules to parallel C++.',
  },
  {
    id: 'go-escape',
    authors: ['The Go Authors'],
    title: 'src/cmd/compile/internal/escape/escape.go (the Go compiler’s escape analysis)',
    venue: 'Go source repository (github.com/golang/go), master branch',
    year: null,
    doi: null,
    url: 'https://github.com/golang/go/blob/master/src/cmd/compile/internal/escape/escape.go',
    accessed: '2026-11-02',
    checkedAgainst: 'https://raw.githubusercontent.com/golang/go/master/src/cmd/compile/internal/escape/escape.go (master at commit babb75be8cd5, read 2026-11-02), header comment: it decides which variables “can be allocated on the stack”; the two invariants (“pointers to stack objects cannot be stored in the heap”, “pointers to a stack object cannot outlive that object”); a graph of “locations” with assignment edges weighted by dereferences; and “we also record data-flow from each function’s parameters to the heap and to its result parameters. This information is summarized as “parameter tags”, which are used at static call sites”. The -gcflags=-m messages (“moved to heap: p”, “p does not escape”) were produced by running go1.24.7 linux/amd64 in this session.',
    shaped: 'Chapters 95b and 221: a production compiler’s per-function escape summaries (parameter tags), and escape analysis deciding stack or heap.',
  },
];
