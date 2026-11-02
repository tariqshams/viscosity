export default {
  id: 'VII', section: 'core', days: '18–23', title: 'Core 6: Rust for TypeScript engineers',
  blurb: 'Cargo, the basics, ownership and borrowing, strings and slices, structs and enums, Option and Result, collections, traits and generics, lifetimes, closures and iterators, modules, errors, testing, smart pointers, arenas, layout, unsafe, and SoA in Rust.',
  chapters: [
    { n: 116, title: 'Why Rust, and cargo', introduces: {
      rust: 'a fast, memory-safe systems language',
      cargo: 'Rust’s build tool and package manager',
      crate: 'a Rust package or compilation unit',
    } },
    { n: 117, title: 'Rust basics: variables, numbers, functions and blocks', introduces: {
      'let-mut': 'immutable by default, mut to allow change',
      'scalar-types': 'i32, u8, f64, bool, char, usize',
      'rust-functions': 'fn with typed parameters and return',
      'expression-oriented': 'blocks and if produce values',
    } },
    { n: 118, title: 'Ownership: moves, copies and clones', introduces: {
      ownership: 'every value has exactly one owner',
      drop: 'freeing a value when its owner goes away',
      move: 'transferring ownership',
    } },
    { n: 119, title: 'Borrowing and the borrowing rules', introduces: {
      borrow: 'a reference that doesn’t take ownership',
      'shared-vs-mutable': 'many &T or one &mut T, never both',
      'borrow-checker': 'the compiler pass enforcing borrowing rules',
    } },
    { n: 120, title: 'Slices, String and &str', introduces: {
      slice: 'a view into part of a collection',
      'string-vs-str': 'owned String vs borrowed &str',
    } },
    { n: 121, title: 'Structs, impl and methods', introduces: {
      struct: 'a named record type',
      impl: 'attaching methods to a type',
      'self-receiver': '&self, &mut self and self',
    } },
    { n: 122, title: 'Enums, match and patterns', introduces: {
      enum: 'a type that is one of several variants',
      match: 'exhaustive pattern matching',
      pattern: 'a shape a value is matched against',
    } },
    { n: 123, title: 'Option, Result and the ? operator', introduces: {
      option: 'Some(value) or None',
      result: 'Ok(value) or Err(error)',
      'question-mark': 'the ? operator for propagating errors',
    } },
    { n: 124, title: 'Vec and HashMap', introduces: {
      vec: 'Rust’s growable array',
      hashmap: 'Rust’s hash table',
    } },
    { n: 125, title: 'Traits, trait objects and derive', introduces: {
      trait: 'a set of methods types can implement',
      'trait-object': 'dyn Trait for dynamic dispatch',
      'operator-traits': 'Add, Index and the other operator traits',
      derive: '#[derive] writing standard impls for you',
    } },
    { n: 126, title: 'Generics and monomorphization', introduces: {
      'rust-generics': 'type parameters in Rust',
      'trait-bound': 'T: Trait constraints',
      monomorphization: 'generating a copy per concrete type',
    } },
    { n: 127, title: 'Lifetimes', introduces: {
      lifetime: 'how long a reference is valid',
      'lifetime-annotation': '\'a: naming lifetimes',
    } },
    { n: 128, title: 'Closures, iterators and associated types', introduces: {
      'rust-closure': 'closures and the Fn traits',
      'rust-iterator': 'the Iterator trait and adapters',
      'associated-type': 'a type a trait implementation chooses',
      'std-traits': 'Display, Debug, Default, Clone, From, Iterator and friends',
    } },
    { n: 129, title: 'Modules, visibility and workspaces', introduces: {
      'rust-module': 'mod and use',
      visibility: 'pub and privacy',
      workspace: 'several crates built together',
    } },
    { n: 130, title: 'Errors at scale', introduces: {
      'error-enum': 'one enum describing every error a crate can return',
      'from-trait': 'converting between error types',
    } },
    { n: 131, title: 'Testing in Rust', introduces: {
      'cargo-test': '#[test] functions and cargo test',
      'assert-macros': 'assert!, assert_eq!',
    } },
    { n: 132, title: 'Box, Rc and RefCell', introduces: {
      box: 'a heap allocation with one owner',
      rc: 'shared ownership by reference counting',
      refcell: 'borrow checking at run time',
    } },
    { n: 133, title: 'Arenas and typed indices', introduces: {
      arena: 'one big Vec holding many objects',
      'typed-index': 'a newtype index like NodeId(u32)',
    } },
    { n: 134, title: 'Memory layout in Rust', introduces: {
      'size-of': 'std::mem::size_of',
      alignment: 'addresses a type must start at',
      padding: 'unused bytes added for alignment',
      repr: '#[repr(C)] and friends',
    } },
    { n: 135, title: 'unsafe and raw pointers', introduces: {
      unsafe: 'code where you uphold the rules the compiler cannot check',
      'raw-pointer': '*const T and *mut T',
    } },
    { n: 136, title: 'Struct of arrays in Rust, measured', introduces: {
      'rust-soa': 'SoA layouts with Vec<f64> columns',
      'release-build': 'compiling with optimizations',
      'black-box': 'preventing the optimizer from deleting benchmark work',
      criterion: 'statistical benchmarking for Rust',
    } },
  ],
};
