// New references for chapter 277. Checked 2026-11-02. The chapter also
// relies on itanium-cxx-abi (added for chapter 265), whose mangling
// section was re-read raw from github.com/itanium-cxx-abi/cxx-abi (main,
// abi.html, section 5.1 "External Names (a.k.a. Mangling)"): the rules
// <mangled-name> ::= _Z <encoding>, <encoding> ::= <function name>
// <bare-function-type>, <nested-name> ::= N [...] <prefix>
// <unqualified-name> E, <source-name> ::= <positive length number>
// <identifier>, and the builtin types v, b, c, i, l, d; and on elf-gabi
// and mdn-modules. All listings are real output, trimmed to 44 columns:
// clang 18.1.3 with GNU nm/c++filt 2.42 and GNU ld (x86-64 Linux),
// rustc 1.97.0 (--emit=obj, nm), go 1.24.7 (go tool nm) and javac/javap
// 21.0.12.
export default [
  {
    id: 'rustc-symbol-mangling',
    authors: ['The Rust Project Developers'],
    title: 'The rustc book: Symbol Mangling (and the v0 Symbol Format)',
    venue: 'rust-lang/rust, src/doc/rustc/src/symbol-mangling/index.md and v0.md',
    year: null,
    doi: null,
    url: 'https://doc.rust-lang.org/rustc/symbol-mangling/index.html',
    accessed: '2026-11-02',
    checkedAgainst: 'index.md and v0.md read raw from github.com/rust-lang/rust (main) on 2026-11-02: “Symbol name mangling is used by rustc to encode a unique name for symbols that are used during code generation. The encoded names are used by the linker to associate the name with the thing it refers to”; “The method for mangling the names can be controlled with the -C symbol-mangling-version option”; #[no_mangle] disables it per item; v0.md: “The v0 mangling format was introduced in RFC 2603” and is “not presented as a stable ABI for Rust”. rustc 1.97.0 itself wrote v0 symbols (_RNvCs…_4demo3add) with no option given.',
    shaped: 'Chapter 277: how Rust mangles names.',
  },
];
