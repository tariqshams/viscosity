export default {
  id: 'XI', track: 'B', days: '83–98', title: 'Rust for TypeScript developers',
  blurb: 'Ownership and borrowing drawn as pictures, structs, enums and match, traits and generics, lifetimes, testing, smart pointers, arenas, memory layout and WebAssembly.',
  chapters: [
    { n: 329, title: 'Why Rust? Hello, cargo', introduces: {
      rust: 'a fast, memory-safe systems language',
    } },
    { n: 330, title: 'Cargo, crates and packages', introduces: {
      cargo: 'Rust’s build tool and package manager',
      crate: 'a Rust package or compilation unit',
    } },
    { n: 331, title: 'Variables, types and mutability', introduces: {
      'let-mut': 'immutable by default, mut to allow change',
    } },
    { n: 332, title: 'Numbers, characters and booleans', introduces: {
      'scalar-types': 'i32, u8, f64, bool, char, usize',
    } },
    { n: 333, title: 'Functions and expressions', introduces: {
      'rust-functions': 'fn with typed parameters and return',
    } },
    { n: 334, title: 'Blocks, if and the tail expression', introduces: {
      'expression-oriented': 'blocks and if produce values',
    } },
    { n: 335, title: 'Ownership', introduces: {
      ownership: 'every value has exactly one owner',
      drop: 'freeing a value when its owner goes away',
    } },
    { n: 336, title: 'Moves, copies and clones', introduces: {
      move: 'transferring ownership',
    } },
    { n: 337, title: 'Borrowing', introduces: {
      borrow: 'a reference that doesn’t take ownership',
    } },
    { n: 338, title: 'The borrowing rules', introduces: {
      'shared-vs-mutable': 'many &T or one &mut T, never both',
      'borrow-checker': 'the compiler pass enforcing borrowing rules',
    } },
    { n: 339, title: 'Slices and strings', introduces: {
      slice: 'a view into part of a collection',
    } },
    { n: 340, title: 'String and &str', introduces: {
      'string-vs-str': 'owned String vs borrowed &str',
    } },
    { n: 341, title: 'Structs and impl', introduces: {
      struct: 'a named record type',
    } },
    { n: 342, title: 'Methods: impl and self', introduces: {
      impl: 'attaching methods to a type',
      'self-receiver': '&self, &mut self and self',
    } },
    { n: 343, title: 'Enums and match', introduces: {
      enum: 'a type that is one of several variants',
      match: 'exhaustive pattern matching',
    } },
    { n: 344, title: 'Patterns: the shapes match can see', introduces: {
      pattern: 'a shape a value is matched against',
    } },
    { n: 345, title: 'Option and Result', introduces: {
      option: 'Some(value) or None',
    } },
    { n: 346, title: 'Result and the ? operator', introduces: {
      result: 'Ok(value) or Err(error)',
      'question-mark': 'the ? operator for propagating errors',
    } },
    { n: 347, title: 'Vec and HashMap', introduces: {
      vec: 'Rust’s growable array',
    } },
    { n: 348, title: 'HashMap: Rust’s hash table', introduces: {
      hashmap: 'Rust’s hash table',
    } },
    { n: 349, title: 'Traits', introduces: {
      trait: 'a set of methods types can implement',
    } },
    { n: 350, title: 'Trait objects and dyn', introduces: {
      'trait-object': 'dyn Trait for dynamic dispatch',
    } },
    { n: 351, title: 'Generics and trait bounds', introduces: {
      'rust-generics': 'type parameters in Rust',
      'trait-bound': 'T: Trait constraints',
    } },
    { n: 352, title: 'One copy per type: monomorphization', introduces: {
      monomorphization: 'generating a copy per concrete type',
    } },
    { n: 353, title: 'Lifetimes', introduces: {
      lifetime: 'how long a reference is valid',
    } },
    { n: 354, title: 'Lifetime annotations', introduces: {
      'lifetime-annotation': '\'a: naming lifetimes',
    } },
    { n: 355, title: 'Iterators and closures in Rust', introduces: {
      'rust-closure': 'closures and the Fn traits',
    } },
    { n: 356, title: 'Iterators in Rust', introduces: {
      'rust-iterator': 'the Iterator trait and adapters',
    } },
    { n: 357, title: 'Modules, crates and visibility', introduces: {
      'rust-module': 'mod and use',
    } },
    { n: 358, title: 'Privacy, pub and workspaces', introduces: {
      visibility: 'pub and privacy',
      workspace: 'several crates built together',
    } },
    { n: 359, title: 'Testing in Rust', introduces: {
      'cargo-test': '#[test] functions and cargo test',
    } },
    { n: 360, title: 'Assertions and test suites', introduces: {
      'assert-macros': 'assert!, assert_eq!',
    } },
    { n: 361, title: 'Box, Rc and RefCell', introduces: {
      box: 'a heap allocation with one owner',
      rc: 'shared ownership by reference counting',
    } },
    { n: 362, title: 'RefCell and reference cycles', introduces: {
      refcell: 'borrow checking at run time',
    } },
    { n: 363, title: 'Arenas and typed indices', introduces: {
      arena: 'one big Vec holding many objects',
    } },
    { n: 364, title: 'Typed indices', introduces: {
      'typed-index': 'a newtype index like NodeId(u32)',
    } },
    { n: 365, title: 'Memory layout in Rust', introduces: {
      'size-of': 'std::mem::size_of',
      alignment: 'addresses a type must start at',
    } },
    { n: 366, title: 'Padding and repr', introduces: {
      padding: 'unused bytes added for alignment',
      repr: '#[repr(C)] and friends',
    } },
    { n: 367, title: 'Struct of arrays in Rust by hand', introduces: { 'rust-soa': 'SoA layouts with Vec<f64> columns' } },
    { n: 368, title: 'Unsafe Rust', introduces: {
      unsafe: 'code where you uphold the rules the compiler cannot check',
    } },
    { n: 369, title: 'Raw pointers', introduces: {
      'raw-pointer': '*const T and *mut T',
    } },
    { n: 370, title: 'Measuring Rust performance', introduces: {
      'release-build': 'compiling with optimizations',
      'black-box': 'preventing the optimizer from deleting benchmark work',
    } },
    { n: 371, title: 'Benchmarking with criterion', introduces: {
      criterion: 'statistical benchmarking for Rust',
    } },
    { n: 372, title: 'Rust and WebAssembly', introduces: { 'wasm-bindgen': 'generating JS bindings for Rust WebAssembly' } },
    { n: 373, title: 'Error handling at scale', introduces: {
      'error-enum': 'one enum describing every error a crate can return',
    } },
    { n: 374, title: 'From and the question mark', introduces: {
      'from-trait': 'converting between error types',
    } },
    { n: 375, title: 'Patterns in depth', introduces: {
      'binding-modes': 'by value, by ref and by ref mut in patterns',
      'match-guard': 'an if on a match arm',
      'pattern-syntax': 'ranges, @ bindings, nested and slice patterns',
    } },
    { n: 376, title: 'Trait objects and dispatch', introduces: {
      'dyn-dispatch-cost': 'what a vtable call costs compared with a generic',
      'object-safety': 'which traits can be trait objects',
    } },
    { n: 377, title: 'Associated types and the standard traits', introduces: {
      'associated-type': 'a type a trait implementation chooses',
      'std-traits': 'Display, Debug, Default, Clone, From, Iterator and friends',
    } },
    { n: 378, title: 'Operator traits and derive', introduces: {
      'operator-traits': 'Add, Index and the other operator traits',
      derive: '#[derive] writing standard impls for you',
    } },
    { n: 379, title: 'Threads, Send and Sync', introduces: {
      'rust-thread': 'std::thread::spawn and scoped threads',
      'send-sync': 'the marker traits that make data races compile errors',
    } },
    { n: 380, title: 'Sharing and sending between threads', introduces: {
      'arc-mutex': 'shared ownership across threads, with locking',
      channel: 'sending values between threads',
    } },
    { n: 381, title: 'Data parallelism with rayon', introduces: {
      rayon: 'a crate that parallelises iterators',
      'work-stealing': 'idle threads taking work from busy ones',
    } },
    { n: 382, title: 'Async Rust', introduces: {
      future: 'a value that can be polled until it is ready',
      'async-rust': 'async fn and .await in Rust',
    } },
    { n: 383, title: 'Executors: who calls poll', introduces: {
      executor: 'the runtime that polls futures (Tokio)',
    } },
    { n: 384, title: 'Macros: declarative and procedural', introduces: {
      'macro-rules': 'pattern-matching macros',
    } },
    { n: 385, title: 'Procedural macros and token streams', introduces: {
      'proc-macro': 'a Rust function that writes Rust code',
      'token-stream': 'what a procedural macro reads and writes',
    } },
    { n: 386, title: 'FFI and unsafe boundaries', introduces: {
      ffi: 'calling C from Rust and Rust from C',
      'extern-c': 'the C calling convention in Rust',
    } },
    { n: 387, title: 'Safety invariants and safe wrappers', introduces: {
      'safety-invariant': 'what unsafe code must promise to its callers',
    } },
    { n: 388, title: 'Designing Rust APIs and the Cargo workflow', introduces: {
      'api-design': 'the Rust API guidelines in practice',
      'cargo-features': 'optional parts of a crate',
    } },
    { n: 389, title: 'Docs, doc tests and clippy', introduces: {
      rustdoc: 'documentation and doc tests',
      clippy: 'the Rust linter',
    } },
    { n: 390, title: 'Checkpoint: a concurrent file indexer in Rust', introduces: {
      'checkpoint-rust': 'a whole Rust program, written without the book’s scaffolding',
    } },
  ],
};
