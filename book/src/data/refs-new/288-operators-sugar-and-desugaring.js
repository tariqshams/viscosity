// New references for chapter 288. Checked 2026-11-02. The chapter also
// relies on python-datamodel (whose "Emulating numeric types" section,
// with __add__, __radd__ and NotImplemented, was re-read raw from
// python/cpython 3.13 Doc/reference/datamodel.rst in this session),
// cpython-dis and itanium-cxx-abi (operator codes pl and eq, and the
// substitution S_). The listings are real output, trimmed to 44 columns:
// clang 18.1.3 (-c, -O0 -S, -O1 -S) with nm/c++filt 2.42, rustc 1.97.0
// (--emit=mir), Python 3.13.18 (dis, and the TypeError quoted) and
// javac/javap 21.0.12.
export default [
  {
    id: 'cxx-over-oper',
    authors: ['ISO/IEC JTC1/SC22/WG21 (the C++ standards committee)'],
    title: 'Working Draft, Programming Languages: C++, [over.match.oper] Operators in expressions',
    venue: 'cplusplus/draft, source/overloading.tex',
    year: null,
    doi: null,
    url: 'https://github.com/cplusplus/draft/blob/main/source/overloading.tex',
    accessed: '2026-11-02',
    checkedAgainst: 'source/overloading.tex read raw from github.com/cplusplus/draft (main) on 2026-11-02: “If either operand has a type that is a class or an enumeration, a user-defined operator function can be declared that implements this operator … In this case, overload resolution is used to determine which operator function or built-in operator is to be invoked to implement the operator. Therefore, the operator notation is first transformed to the equivalent function-call notation”. clang 18.1.3 named operator+(V, V) _Zpl1VS_ and called it from p + q at -O0.',
    shaped: 'Chapter 288: a C++ operator is a function chosen by overload resolution.',
  },
  {
    id: 'rust-std-ops-add',
    authors: ['The Rust Project Developers'],
    title: 'Trait core::ops::Add (std::ops::Add), Rust standard library documentation',
    venue: 'rust-lang/rust, library/core/src/ops/arith.rs (tag 1.97.0)',
    year: null,
    doi: null,
    url: 'https://doc.rust-lang.org/std/ops/trait.Add.html',
    accessed: '2026-11-02',
    checkedAgainst: 'library/core/src/ops/arith.rs at tag 1.97.0, read raw from github.com/rust-lang/rust on 2026-11-02: the trait’s documentation begins “The addition operator +”, and notes that Rhs is Self by default but need not be. rustc 1.97.0 --emit=mir turned (p + q).x into _3 = <V as Add>::add(copy _1, copy _2).',
    shaped: 'Chapter 288: Rust’s + is a call of the Add trait’s method.',
  },
];
