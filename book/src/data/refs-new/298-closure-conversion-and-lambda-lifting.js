// New references for chapter 268. Checked 2026-11-02. Chapter 268 also
// relies on rustref-closure-types (references.js), whose source
// (rust-lang/reference src/types/closure.md, “A closure type is
// approximately equivalent to a struct which contains the captured
// values”) was re-read raw from GitHub in this session, and on
// cpython-dis and mdn-closures. The listings are real output, trimmed to
// 44 columns: Python 3.13.18 (dis.dis), Node 22.23.4 (--print-bytecode),
// clang 18.1.3 (-O0 -S -emit-llvm) and rustc 1.97.0 (std::mem::size_of_val
// printed “0 8 16 8” for the four closures named in the chapter).
export default [
  {
    id: 'johnsson1985',
    authors: ['Thomas Johnsson'],
    title: 'Lambda Lifting: Transforming Programs to Recursive Equations',
    venue: 'Functional Programming Languages and Computer Architecture (FPCA 1985), Lecture Notes in Computer Science 201, Springer, pp. 190–203',
    year: 1985,
    doi: '10.1007/3-540-15975-4_37',
    url: 'https://doi.org/10.1007/3-540-15975-4_37',
    accessed: '2026-11-02',
    checkedAgainst: 'Web search results on 2026-11-02 (the Springer chapter page via springerprofessional.de, and BRICS research reports RS-03-26 and RS-04-12 citing it): Thomas Johnsson, in J.-P. Jouannaud (ed.), Functional Programming Languages and Computer Architecture, LNCS 201, pp. 190–203, Nancy, France, September 1985, DOI 10.1007/3-540-15975-4_37 (chapter 37 of the volume). Lambda lifting is described there as transforming a functional program with local function definitions, possibly with free variables, into a program consisting only of global function definitions. Neither the paper nor the publisher’s page could be opened from this session (their hosts are not reachable), so only these bibliographic facts and that description are relied on.',
    shaped: 'Chapter 268: the name and idea of lambda lifting.',
  },
  {
    id: 'cxx-closure-type',
    authors: ['ISO/IEC JTC1/SC22/WG21 (the C++ standards committee)'],
    title: 'Working Draft, Programming Languages: C++, [expr.prim.lambda.closure] Closure types',
    venue: 'cplusplus/draft, source/expressions.tex',
    year: null,
    doi: null,
    url: 'https://github.com/cplusplus/draft/blob/main/source/expressions.tex',
    accessed: '2026-11-02',
    checkedAgainst: 'source/expressions.tex read raw from github.com/cplusplus/draft (main) on 2026-11-02, section [expr.prim.lambda.closure]: “The type of a lambda-expression (which is also the type of the closure object) is a unique, unnamed non-union class type, called the closure type”. clang 18.1.3 output matched: [n](int x){...} became %class.anon = type { i32 }, with operator() taking a pointer to it.',
    shaped: 'Chapter 268: a C++ lambda is a class whose fields are its captures.',
  },
];
