// New references for chapter 286b (staged split of chapter 286). Checked
// 2026-11-02. The chapter also relies on mdn-modules. The listings are
// real output: go 1.24.7 (go list -deps, go build, on small modules made
// for the chapter) and Node 22.23.4 (four .mjs files in a chain, and two
// that import each other), trimmed to 44 columns.
export default [
  {
    id: 'go-list-deps',
    authors: ['The Go Authors'],
    title: 'cmd/go: go list, the -deps flag',
    venue: 'golang/go, src/cmd/go/internal/list/list.go (go1.24.7)',
    year: null,
    doi: null,
    url: 'https://pkg.go.dev/cmd/go#hdr-List_packages_or_modules',
    accessed: '2026-11-02',
    checkedAgainst: 'src/cmd/go/internal/list/list.go at tag go1.24.7, read raw from github.com/golang/go on 2026-11-02 (the source of the help text shown by go help list and on pkg.go.dev): “The -deps flag causes list to iterate over not just the named packages but also all their dependencies. It visits them in a depth-first post-order traversal, so that a package is listed only after all its dependencies.” go 1.24.7 printed app/c, app/a, app/b, app for the chapter’s example, and go build -x compiled app/c before app/a and app/b.',
    shaped: 'Chapter 286b: Go lists and builds packages in a depth-first post-order.',
  },
  {
    id: 'go-spec-imports',
    authors: ['The Go Authors'],
    title: 'The Go Programming Language Specification: Import declarations',
    venue: 'golang/go, doc/go_spec.html',
    year: null,
    doi: null,
    url: 'https://go.dev/ref/spec#Import_declarations',
    accessed: '2026-11-02',
    checkedAgainst: 'doc/go_spec.html read raw from github.com/golang/go (master) on 2026-11-02: “An import declaration declares a dependency relation between the importing and imported package. It is illegal for a package to import itself, directly or indirectly, or to directly import a package without referring to any of its exported identifiers.” go 1.24.7 reported “import cycle not allowed” for the chapter’s two-package cycle.',
    shaped: 'Chapter 286b: Go forbids import cycles.',
  },
  {
    id: 'ecma262-module-evaluation',
    authors: ['Ecma International, TC39'],
    title: 'ECMAScript Language Specification: Cyclic Module Records (Link and Evaluate)',
    venue: 'tc39/ecma262, spec.html (current draft)',
    year: null,
    doi: null,
    url: 'https://tc39.es/ecma262/#sec-cyclic-module-records',
    accessed: '2026-11-02',
    checkedAgainst: 'spec.html read raw from github.com/tc39/ecma262 (main) on 2026-11-02, InnerModuleLinking: “The stack and index parameters, as well as a module’s [[DFSAncestorIndex]] field, keep track of the depth-first search (DFS) traversal. In particular, [[DFSAncestorIndex]] is used to discover strongly connected components (SCCs), such that all modules in an SCC transition to ~linked~ together”; InnerModuleEvaluation “is used by Evaluate to perform the actual evaluation process for module, as well as recursively on all other modules in the dependency graph”. Node 22.23.4 ran a chain main → a → b → c with c’s top level first, and reported “ReferenceError: Cannot access \'a\' before initialization” for the chapter’s cycle.',
    shaped: 'Chapter 286b: how JavaScript orders module evaluation, cycles included.',
  },
];
