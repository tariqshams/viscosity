export default {
  id: 'XVII', section: 'deep', days: '34–38', title: 'Deep dive: Rust beyond the core',
  blurb: 'Advanced patterns, the standard traits in depth, operator traits, threads, Send and Sync, rayon, async and Tokio, macros, FFI, API design and cargo features, and a concurrent indexer.',
  chapters: [
    { n: 302, title: 'Patterns in depth', introduces: {
      'binding-modes': 'by value, by ref and by ref mut in patterns',
      'match-guard': 'an if on a match arm',
      'pattern-syntax': 'ranges, @ bindings, nested and slice patterns',
    } },
    { n: 303, title: 'Trait objects and dispatch', introduces: {
      'dyn-dispatch-cost': 'what a vtable call costs compared with a generic',
      'object-safety': 'which traits can be trait objects',
    } },
    { n: 304, title: 'Operator traits, Drop and derive', introduces: {
      'drop-trait': 'the Drop trait: code that runs when a value is dropped, and std::mem::drop',
      'operator-trait': 'std::ops traits such as Add and Index, which give operators their meaning',
    } },
    { n: 305, title: 'Threads, Send and Sync', introduces: {
      'rust-thread': 'std::thread::spawn and scoped threads',
      'send-sync': 'the marker traits that make data races compile errors',
    } },
    { n: 306, title: 'Sharing and sending between threads', introduces: {
      'arc-mutex': 'shared ownership across threads, with locking',
      channel: 'sending values between threads',
    } },
    { n: 307, title: 'Data parallelism with rayon', introduces: {
      'data-parallelism': 'splitting work across CPU cores',
      rayon: 'a crate that parallelises iterators',
      'work-stealing': 'idle threads taking work from busy ones',
    } },
    { n: 308, title: 'Async Rust', introduces: {
      future: 'a value that can be polled until it is ready',
      'async-rust': 'async fn and .await in Rust',
    } },
    { n: 309, title: 'Executors: who calls poll', introduces: {
      executor: 'the runtime that polls futures (Tokio)',
    } },
    { n: 310, title: 'Macros: declarative and procedural', introduces: {
      'macro-rules': 'pattern-matching macros',
    } },
    { n: 311, title: 'Procedural macros and token streams', introduces: {
      'proc-macro': 'a Rust function that writes Rust code',
      'token-stream': 'what a procedural macro reads and writes',
    } },
    { n: 312, title: 'FFI and unsafe boundaries', introduces: {
      ffi: 'calling C from Rust and Rust from C',
      'extern-c': 'the C calling convention in Rust',
    } },
    { n: 313, title: 'Safety invariants and safe wrappers', introduces: {
      'safety-invariant': 'what unsafe code must promise to its callers',
    } },
    { n: 314, title: 'Designing Rust APIs and the Cargo workflow', introduces: {
      'api-design': 'the Rust API guidelines in practice',
      'cargo-features': 'optional parts of a crate',
    } },
    { n: 315, title: 'Docs, doc tests and clippy', introduces: {
      rustdoc: 'documentation and doc tests',
      clippy: 'the Rust linter',
    } },
    { n: 316, title: 'Checkpoint: a concurrent file indexer in Rust', introduces: {
      'checkpoint-rust': 'a whole Rust program, written without the book’s scaffolding',
    } },
  ],
};
