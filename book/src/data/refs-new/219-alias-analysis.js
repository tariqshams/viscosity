// New references for chapter 94 (Alias analysis).
// Network note: in this session only web search and raw.githubusercontent.com
// (plus git over https) could be reached; doi.org, dl.acm.org and the
// authors' pages could not be fetched. Each checkedAgainst says exactly what
// was read.
export default [
  {
    id: 'diwan1998',
    authors: ['Amer Diwan', 'Kathryn S. McKinley', 'J. Eliot B. Moss'],
    title: 'Type-Based Alias Analysis',
    venue: 'Proceedings of the ACM SIGPLAN 1998 Conference on Programming Language Design and Implementation (PLDI ’98), Montreal, ACM, pp. 106–117',
    year: 1998,
    doi: '10.1145/277650.277670',
    url: 'https://doi.org/10.1145/277650.277670',
    accessed: '2026-11-02',
    checkedAgainst: 'Search records only: the Wikipedia article on alias analysis and a reference.org mirror give the authors, PLDI ’98 (Montreal), pages 106–117 and doi:10.1145/277650.277670; Eliot Moss’s publication page hosts the PDF (people.cs.umass.edu/~moss/papers/pldi-1998-tbaa.pdf); the search summary and Cornell CS 6120 course blog posts describe its content (alias analyses that use the program’s declared types, evaluated on Modula-3 programs). The paper itself could not be fetched, so nothing is quoted from it.',
    shaped: 'Chapter 94: type-based alias analysis, the idea that two references whose types cannot describe the same object cannot alias.',
  },
  {
    id: 'llvm-langref-tbaa',
    authors: ['The LLVM Project'],
    title: 'LLVM Language Reference Manual: “tbaa” Metadata',
    venue: 'LLVM documentation',
    year: null,
    doi: null,
    url: 'https://llvm.org/docs/LangRef.html#tbaa-metadata',
    accessed: '2026-11-02',
    checkedAgainst: 'https://raw.githubusercontent.com/llvm/llvm-project/main/llvm/docs/LangRef.md (main at commit 23313c8d4ff8, read 2026-11-02): “LLVM IR does not associate types with memory … Consequently, type-based alias analysis, aka TBAA, aka -fstrict-aliasing, is not applicable to general unadorned LLVM IR”; the “tbaa Metadata” section: metadata “describe[s] a type system of a higher level language. This can be used to implement C/C++ strict type aliasing rules”, and TBAA nodes with different roots get MayAlias.',
    shaped: 'Chapter 94: how a real compiler carries the source language’s types down to the IR so that type-based alias analysis can use them.',
  },
];
