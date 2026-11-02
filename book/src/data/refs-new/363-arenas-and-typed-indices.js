// New references for chapter 133 (arenas) and its staged second half
// (315-b, "Typed indices"). oxc_allocator was read from the crate source
// that engine/rust builds against (version 0.156.0, in the local cargo
// registry). Every rustc message, size and output in the chapters is real
// output of rustc 1.97.0 on this machine (64-bit Linux).
export default [
  {
    id: 'oxc-allocator',
    authors: ['The Oxc project contributors'],
    title: 'oxc_allocator 0.156.0: crate documentation (src/lib.rs, src/allocator.rs)',
    venue: 'crates.io / docs.rs',
    year: null,
    doi: null,
    url: 'https://docs.rs/oxc_allocator/0.156.0/oxc_allocator/',
    accessed: '2026-11-02',
    checkedAgainst: 'Read in the crate source oxc_allocator-0.156.0 (the version pinned in engine/rust/Cargo.toml) on 2026-11-02: the crate doc says “Oxc uses a bump-based memory arena for faster AST allocations”, and Allocator is documented as “A bump-allocated memory arena” that grows by adding chunks, each at least double the size of the last, without moving existing data, so references into earlier chunks stay valid.',
    shaped: 'Chapter 133: oxc’s AST allocator as a second, production example of an arena.',
  },
  {
    id: 'rust-std-phantomdata',
    authors: ['The Rust Project Developers'],
    title: 'Rust standard library: std::marker::PhantomData',
    venue: 'The Rust standard library (rust-lang/rust, library/core/src/marker.rs)',
    year: null,
    doi: null,
    url: 'https://doc.rust-lang.org/std/marker/struct.PhantomData.html',
    accessed: '2026-11-02',
    checkedAgainst: 'Read raw from raw.githubusercontent.com/rust-lang/rust/main/library/core/src/marker.rs on 2026-11-02: PhantomData<T> is a zero-sized type used to mark things that “act like” they own a T; adding a PhantomData<T> field tells the compiler the type acts as though it stores a value of type T, even though it doesn’t; unused type parameters are an error (reproduced with rustc 1.97.0 as E0392, “type parameter `T` is never used”, whose help suggests a marker such as PhantomData).',
    shaped: 'Chapter 133-b: why drip-rs’s Gc<T> carries a PhantomData field.',
  },
];
