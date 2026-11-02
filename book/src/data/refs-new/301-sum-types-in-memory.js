// New references for chapter 301 (Sum types in memory).
// Checked 2026-11-02 by reading the raw source files named in each
// checkedAgainst from GitHub (raw.githubusercontent.com) in the writing
// session. The sizes the chapter quotes were printed in the same session by
// programs compiled with rustc 1.97.0 (std::mem::size_of and align_of, and
// RUSTC_BOOTSTRAP=1 rustc -Zprint-type-sizes) and clang 18.1.3 (sizeof and
// offsetof), on x86-64 Linux.
export default [
  {
    id: 'rust-reference-type-layout',
    authors: ['The Rust Project Developers'],
    title: 'Type layout (The Rust Reference)',
    venue: 'The Rust Reference, src/type-layout.md',
    year: null,
    doi: null,
    url: 'https://doc.rust-lang.org/reference/type-layout.html',
    accessed: '2026-11-02',
    checkedAgainst: 'src/type-layout.md read raw from github.com/rust-lang/reference (master, commit 3989fe91f1a6) on 2026-11-02. The Rust (default) representation: “The only data layout guarantees made by this representation are those required for soundness. These are: 1. The offset of a field is divisible by that field’s alignment. 2. The alignment of the type is at least the maximum alignment of its fields”, and struct fields may be ordered differently from the declaration. repr(C) enums with fields: “a repr(C) struct with two fields, also called a ‘tagged union’ in C: a repr(C) version of the enum with all fields removed (‘the tag’) [and] a repr(C) union of repr(C) structs for the fields of each variant that had them (‘the payload’)”. repr(C, u8): “This modifies the repr(C) by changing the representation of the discriminant enum to the chosen primitive instead. So, if you chose the u8 representation, then the discriminant enum would have a size and alignment of 1 byte.” rustc 1.97.0 gave sizes 12, 16, 4, 6 and 24 for the repr(C, u8) enums used in the chapter and its exercise.',
    shaped: 'Chapter 301: the C-style tag-plus-union layout (repr(C, u8)), and how little Rust’s default layout promises.',
  },
  {
    id: 'rust-option-representation',
    authors: ['The Rust Project Developers'],
    title: 'Module std::option, section “Representation”',
    venue: 'Rust standard library documentation (library/core/src/option.rs)',
    year: null,
    doi: null,
    url: 'https://doc.rust-lang.org/std/option/index.html#representation',
    accessed: '2026-11-02',
    checkedAgainst: 'library/core/src/option.rs read raw from github.com/rust-lang/rust (main, commit 4c46afa63688) on 2026-11-02: “Rust guarantees to optimize the following types T such that Option<T> has the same size, alignment, and function call ABI as T”, listing Box<U>, &U, &mut U, fn and extern "C" fn, num::NonZero*, ptr::NonNull<U> and #[repr(transparent)] structs around them; for these, transmuting an all-zero value produces None. rustc 1.97.0 printed size_of: &u8 8, Option<&u8> 8, Option<Box<u8>> 8, u32 4, Option<u32> 8, Option<NonZeroU32> 4, bool 1, Option<bool> 1, char 4, Option<char> 4; transmuting None::<bool> to u8 gave 2 (an implementation choice, not a guarantee).',
    shaped: 'Chapter 301: which Option types are guaranteed to be free, and the measured sizes of the others.',
  },
  {
    id: 'ocaml-manual-intf-c',
    authors: ['Xavier Leroy', 'Damien Doligez', 'Alain Frisch', 'Jacques Garrigue', 'Didier Rémy', 'Jérôme Vouillon', 'and the OCaml contributors'],
    title: 'Interfacing C with OCaml (The OCaml system, user’s manual, chapter “Interfacing C with OCaml”)',
    venue: 'OCaml manual, manual/src/cmds/intf-c.etex',
    year: null,
    doi: null,
    url: 'https://ocaml.org/manual/latest/intfc.html',
    accessed: '2026-11-02',
    checkedAgainst: 'manual/src/cmds/intf-c.etex read raw from github.com/ocaml/ocaml (trunk, commit a76fb1de949d) on 2026-11-02, section “Concrete data types”: “Constructed terms are represented either by unboxed integers (for constant constructors) or by blocks whose tag encode the constructor (for non-constant constructors). The constant constructors and the non-constant constructors for a given concrete type are numbered separately, starting from 0 … A constant constructor is represented by the unboxed integer equal to its constructor number. A non-constant constructor declared with n arguments is represented by a block of size n, tagged with the constructor number”, with the example type t = A | B of string | C | D of bool | E of t * t. Section “Kind tests”: Is_long(v) is true if v is an immediate integer; Is_block(v) is true if v is a pointer to a block.',
    shaped: 'Chapter 301: OCaml’s layout of variants, immediate integers for constant constructors and tagged heap blocks for the others.',
  },
];
