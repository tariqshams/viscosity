// New references for chapter 326 (Data parallelism with rayon). Checked
// 2026-11-02 by reading the raw files from github.com/rayon-rs/rayon
// (main; rayon 1.12.0, rayon-core 1.13.0) and
// github.com/crossbeam-rs/crossbeam (master). The rayon code in the chapter
// was compiled and run on this machine as a cargo project depending on
// rayon 1.12.0 (rustc 1.97.0); its two error messages are real output.
export default [
  {
    id: 'rayon-readme',
    authors: ['Josh Stone', 'Niko Matsakis', 'and the rayon contributors'],
    title: 'Rayon: a data parallelism library for Rust (README)',
    venue: 'github.com/rayon-rs/rayon',
    year: null,
    doi: null,
    url: 'https://github.com/rayon-rs/rayon',
    accessed: '2026-11-02',
    checkedAgainst: 'Read raw from raw.githubusercontent.com/rayon-rs/rayon/main/README.md on 2026-11-02: “Rayon is a data-parallelism library for Rust”; “usually, you just change your foo.iter() call into foo.par_iter()”, with the sum_of_squares example; parallel iterators decide how to divide data into tasks and dynamically adapt; join and scope create parallel tasks by hand; “Rayon’s APIs all guarantee data-race freedom”; parallel iterators are for the most part guaranteed to produce the same results as their sequential counterparts, but side effects may occur in a different order; added with rayon = "1.12" and use rayon::prelude::*; requires rustc 1.85 or later; when building to WebAssembly it falls back to sequential iteration unless set up with an adapter such as wasm-bindgen-rayon. Cargo.toml on main: version 1.12.0, description “Simple work-stealing parallelism for Rust”.',
    shaped: 'Chapter 326: what rayon is, par_iter, its data-race guarantee, ordering, and WebAssembly.',
  },
  {
    id: 'rayon-faq',
    authors: ['Niko Matsakis', 'and the rayon contributors'],
    title: 'Rayon FAQ',
    venue: 'github.com/rayon-rs/rayon (FAQ.md)',
    year: null,
    doi: null,
    url: 'https://github.com/rayon-rs/rayon/blob/main/FAQ.md',
    accessed: '2026-11-02',
    checkedAgainst: 'Read raw from raw.githubusercontent.com/rayon-rs/rayon/main/FAQ.md on 2026-11-02: by default rayon uses as many threads as there are CPUs available (logical cores), changeable with RAYON_NUM_THREADS or ThreadPoolBuilder::build_global; rayon balances work with work stealing: a pool of worker threads; join(a, b) from a worker W places b in W’s work queue and executes a; other threads may take b (“stealing”); when a is done W checks whether b was stolen and if not runs it; a worker that runs out of jobs looks through other threads’ queues to steal; the technique was first introduced by the Cilk project at MIT in the late nineties; types such as Rc, Cell and RefCell cannot be combined with rayon, and Rc can typically be replaced by Arc.',
    shaped: 'Chapter 326: the description of work stealing in join, thread count, and its Cilk origin.',
  },
  {
    id: 'rayon-core-source',
    authors: ['Josh Stone', 'Niko Matsakis', 'and the rayon contributors'],
    title: 'rayon and rayon-core source: ParallelIterator, join and the thread registry',
    venue: 'github.com/rayon-rs/rayon (src/iter/mod.rs, rayon-core/src/join/mod.rs, rayon-core/src/registry.rs)',
    year: null,
    doi: null,
    url: 'https://github.com/rayon-rs/rayon/tree/main/rayon-core/src',
    accessed: '2026-11-02',
    checkedAgainst: 'Read raw on 2026-11-02 from the main branch: src/iter/mod.rs declares pub trait ParallelIterator: Sized + Send { type Item: Send; ... }, with for_each requiring OP: Fn(Self::Item) + Sync + Send and map requiring F: Fn(Self::Item) -> R + Sync + Send, R: Send; rayon-core/src/join/mod.rs: join “Takes two closures and potentially runs them in parallel”, uses a fixed pool of worker threads, runs closure A on the current thread while advertising B, and if B was stolen looks for other work while waiting; its example is a quick_sort that partitions, splits with split_at_mut and joins the two halves; rayon-core/src/registry.rs builds one crossbeam_deque Worker per thread, Worker::new_lifo() unless breadth_first is set (then new_fifo()), and a thread steals only when its local deque is empty, trying the other threads starting from a random index.',
    shaped: 'Chapter 326: the Send/Sync bounds behind rayon’s guarantee, join, and the LIFO deques with random victims.',
  },
  {
    id: 'crossbeam-deque-docs',
    authors: ['The Crossbeam Project Developers'],
    title: 'crossbeam-deque: concurrent work-stealing deques',
    venue: 'github.com/crossbeam-rs/crossbeam (crossbeam-deque/src/lib.rs); docs at docs.rs/crossbeam-deque',
    year: null,
    doi: null,
    url: 'https://docs.rs/crossbeam-deque',
    accessed: '2026-11-02',
    checkedAgainst: 'Read raw from raw.githubusercontent.com/crossbeam-rs/crossbeam/master/crossbeam-deque/src/lib.rs on 2026-11-02: “Concurrent work-stealing deques”, most commonly used in work-stealing schedulers where each thread has its own FIFO or LIFO worker queue, there is a global FIFO injector, and stealers reference other workers’ queues; Worker::new_fifo pushes and pops at opposite ends, Worker::new_lifo at the same end; each Worker is owned by a single thread and supports only push and pop; a Stealer can only steal, and “Tasks are stolen from the end opposite to where they get pushed”; an idle thread first pops locally, then steals from the injector, then from other threads.',
    shaped: 'Chapter 326: the deque operations behind work stealing (owner at one end, thieves at the other).',
  },
];
