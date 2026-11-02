// New references for chapter 266. Checked 2026-11-02. Chapter 266 also
// relies on hotspot-klassvtable (refs-new/295-objects-vtables-and-dynamic-dispatch.js)
// and rust-reference-trait-object (references.js), whose source
// (rust-lang/reference src/types/trait-object.md) was re-read raw from
// GitHub in this session. The listings are real output: rustc 1.97.0
// (-O --crate-type=lib --emit=asm, x86-64; symbols demangled with nm -C),
// Go 1.24.7 (GOARCH=riscv64 go build -gcflags=-S, and go tool nm), and
// javac/javap 21.0.12, trimmed to 44 columns.
export default [
  {
    id: 'wadler1989',
    authors: ['Philip Wadler', 'Stephen Blott'],
    title: 'How to Make ad-hoc Polymorphism Less ad hoc',
    venue: 'Conference Record of the 16th Annual ACM Symposium on Principles of Programming Languages (POPL ’89), pp. 60–76',
    year: 1989,
    doi: '10.1145/75277.75283',
    url: 'https://doi.org/10.1145/75277.75283',
    accessed: '2026-11-02',
    checkedAgainst: 'The dblp-derived record conf/popl/WadlerB89 in github.com/slebok/bibsleigh (corpus/PLT/1989/POPL-1989/POPL-1989-WadlerB.json, read raw): authors, title, POPL 1989, ACM Press, pp. 60–76, doi 10.1145/75277.75283. Search results (course notes and the authors’ preprint) describe the paper as introducing type classes to extend Hindley/Milner with overloading, translated into dictionary passing. The paper text itself could not be opened from this session.',
    shaped: 'Chapter 266: type classes and the translation of overloaded calls into dictionary passing.',
  },
  {
    id: 'go-runtime-iface',
    authors: ['The Go Authors'],
    title: 'Go runtime: interface values and itabs (runtime/runtime2.go, runtime/iface.go, internal/abi/iface.go)',
    venue: 'golang/go, tag go1.24.7',
    year: null,
    doi: null,
    url: 'https://github.com/golang/go/blob/go1.24.7/src/runtime/iface.go',
    accessed: '2026-11-02',
    checkedAgainst: 'Read raw at tag go1.24.7 (internal/abi/iface.go and runtime/iface.go; runtime2.go from the matching local Go 1.24.7 install): type iface struct { tab *itab; data unsafe.Pointer }; ITab { Inter *InterfaceType; Type *Type; Hash uint32; Fun [1]uintptr // variable sized }; getitab first looks the (interface, type) pair up in the global itabTable (“Implemented using quadratic probing”) and, if missing, makes a new entry and adds it; “compiler statically generates itab’s for all interface/type pairs used in switches”. Observed with Go 1.24.7: go:itab.main.Sq,main.Shape in the binary, with relocations at +0 (interface type), +8 (concrete type) and +24 (the Area method), and a call compiled as MOV 24(X10), X5; MOV X11, X10; JALR X1, X5.',
    shaped: 'Chapter 266: Go interface values as fat pointers, itabs, and how they are found.',
  },
];
