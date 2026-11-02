// Chapter 379 cards. Keys are stable ids: never rename them.

export const prompts = {
  'spawn-static': {
    q: 'Why can’t a closure passed to `thread::spawn` borrow a local variable?',
    a: 'The thread may outlive the function that owns the variable, so the closure must be `\'static`: it has to own what it uses (`move`).',
  },
  'spawn-join': {
    q: 'What does `handle.join()` return?',
    a: 'A `Result`: `Ok` with the closure’s return value once the thread finishes, or `Err` if the thread panicked.',
  },
  'scope-borrow': {
    q: 'Why may threads started with `s.spawn` inside `thread::scope` borrow local data?',
    a: '`scope` joins every one of its threads before it returns, so none can outlive the data they borrow.',
  },
  'send-what': {
    q: 'What does it mean for a type to be `Send`?',
    a: 'Its values may be moved to another thread.',
  },
  'sync-what': {
    q: 'What does it mean for a type `T` to be `Sync`?',
    a: '`&T` may be sent to another thread, so several threads may share a `T` by reference at once.',
  },
  'rc-not-send': {
    q: 'Why is `Rc<T>` not `Send`?',
    a: 'Its reference count is updated with plain, non-atomic arithmetic, so two threads cloning or dropping at once could corrupt it. `Arc` uses atomics.',
  },
  'race-closed': {
    q: 'Why can’t two threads in safe Rust both write the same `u32`?',
    a: 'Writing needs `&mut`, which is exclusive (E0499), or a shared type with interior mutability, which must be `Sync`, i.e. synchronised (a `Mutex` or an atomic).',
  },
  'auto-trait': {
    q: 'You define `struct P { x: f64, name: String }`. Is it `Send`, and who decided?',
    a: 'Yes: `Send` is an auto trait, and the compiler implements it because every field is `Send`.',
  },
};

export const examples = {
  'scoped-sum': {
    lang: 'rust',
    title: 'Summing in parts, on scoped threads',
    code: `use std::thread;
use std::thread::available_parallelism;

fn main() {
    let xs: Vec<u64> =
        (1..=1000).collect();
    let n = available_parallelism()
        .map_or(1, |n| n.get());
    println!("this machine: {n}");

    let parts = 4;
    let size = xs.len().div_ceil(parts);
    let sums: Vec<u64> =
        thread::scope(|s| {
            let hs: Vec<_> = xs
                .chunks(size)
                // c: part of xs
                .map(|c| {
                    s.spawn(move || {
                        c.iter().sum()
                    })
                })
                .collect();
            hs.into_iter()
                .map(|h| {
                    h.join().unwrap()
                })
                .collect()
        });
    println!("parts: {sums:?}");
    let total: u64 = sums.iter().sum();
    println!("total: {total}");
}`,
  },
};

const SIG = 'fn counts(ts: &[&str]) -> Vec<usize> {';

export const exercises = {
  wordCounts: {
    lang: 'rust',
    title: 'Count words, one thread per text',
    prompt:
      'Write `counts(ts)`, which returns the number of words in each text (use `split_whitespace().count()`), in the same order as the texts in `ts`. Count each text on its own scoped thread: inside `thread::scope`, spawn one thread per text, collect the handles, and only then join them all.',
    starter: `use std::thread;

${SIG}
    Vec::new()
}`,
    solution: `use std::thread;

${SIG}
    thread::scope(|s| {
        let hs: Vec<_> = ts
            .iter()
            .map(|t| {
                s.spawn(move || {
                    t.split_whitespace()
                        .count()
                })
            })
            .collect();
        hs.into_iter()
            .map(|h| h.join().unwrap())
            .collect()
    })
}`,
    tests: `#[test]
fn counts_each_text_in_order() {
    let t = ["a b", "", "x y  z"];
    assert_eq!(counts(&t), vec![2, 0, 3]);
}
#[test]
fn no_texts_no_counts() {
    assert_eq!(counts(&[]), Vec::<usize>::new());
}
#[test]
fn many_texts_keep_their_order() {
    let owned: Vec<String> = (0..20)
        .map(|i| "w ".repeat(i))
        .collect();
    let t: Vec<&str> =
        owned.iter().map(|s| s.as_str()).collect();
    let want: Vec<usize> = (0..20).collect();
    assert_eq!(counts(&t), want);
}`,
    hints: [
      'Everything happens inside `thread::scope(|s| { ... })`, whose closure’s value is what `scope` returns. Scoped threads may borrow the texts, so no copying is needed.',
      'First build a `Vec` of handles: `ts.iter().map(|t| s.spawn(move || ...)).collect()`. `move` moves only the `&&str` into each closure. Collecting forces every thread to start before any is joined.',
      'Then turn handles into counts, in order: `hs.into_iter().map(|h| h.join().unwrap()).collect()`. Each thread’s body is `t.split_whitespace().count()`.',
    ],
    walkthrough: `**How to think about it.** Each text is independent, so the work splits naturally into one job per text, and the answer must come back in input order. Two decisions follow. First, which kind of thread: the texts are borrowed (\`&[&str]\`), and \`thread::spawn\` cannot borrow, so this is a job for \`thread::scope\`, whose threads may borrow because the scope joins them all before returning. Second, how to keep the order: if you keep the handles in a \`Vec\` in spawn order and join them in that order, the results are in input order no matter which thread happens to finish first.

**The solution, line by line.**

- \`use std::thread;\` brings in the module that has \`scope\`.
- \`thread::scope(|s| { ... })\` runs the closure with a \`Scope\` called \`s\`. Whatever the closure returns, \`scope\` returns, after waiting for every thread spawned on \`s\`; that value is the function's result (no semicolon after it).
- \`let hs: Vec<_> = ts.iter().map(|t| { s.spawn(move || { t.split_whitespace().count() }) }).collect();\` walks the texts (\`t\` is a \`&&str\`) and spawns one scoped thread per text. \`move\` moves the reference \`t\` into the closure; the text itself stays borrowed, which is allowed in a scope. \`collect\` matters: iterators are lazy (the chapter on iterators showed why), and collecting into a \`Vec\` is what actually runs the \`map\`, starting *all* the threads before any join.
- \`hs.into_iter().map(|h| h.join().unwrap()).collect()\` then waits for each handle in turn and takes its count. \`unwrap\` turns a panicked thread into a panic here, which is fine for this exercise. The \`Vec<usize>\` type comes from the function's return type.

**Common wrong attempts.**

- Using \`thread::spawn\` instead of \`s.spawn\`. The closure would borrow from \`ts\`, which is not \`'static\`, and rustc rejects it (E0521, "borrowed data escapes outside of function"). Making it compile would mean copying every text into a \`String\` first.
- Writing it as one chain, \`ts.iter().map(|t| s.spawn(...)).map(|h| h.join().unwrap()).collect()\`. It passes every test, but it is not parallel at all: because iterators are lazy, each item goes through *both* \`map\`s before the next item starts, so each thread is joined before the next one is spawned. Collecting the handles first is what lets the threads run at the same time.
- Returning results in the order threads finish (for example by pushing into a shared list from inside each thread). The counts would come back shuffled, and the order test would fail at random.`,
    wrong: [
      {
        code: `use std::thread;

${SIG}
    let hs: Vec<_> = ts
        .iter()
        .map(|t| {
            thread::spawn(move || {
                t.split_whitespace()
                    .count()
            })
        })
        .collect();
    hs.into_iter()
        .map(|h| h.join().unwrap())
        .collect()
}`,
        why: '`thread::spawn` needs a `\'static` closure, but each `t` borrows from `ts`, so rustc rejects it (E0521, borrowed data escapes).',
      },
      {
        code: `use std::thread;

${SIG}
    thread::scope(|s| {
        let hs: Vec<_> = ts
            .iter()
            .map(|t| {
                s.spawn(move || {
                    t.split(' ').count()
                })
            })
            .collect();
        hs.into_iter()
            .map(|h| h.join().unwrap())
            .collect()
    })
}`,
        why: '`split(\' \')` is not a word count: `""` gives 1 and `"x y  z"` gives 4, because empty pieces between spaces are counted.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'rustc says “closure may outlive the current function, but it borrows `v`”. What is the usual fix with `thread::spawn`?',
    options: [
      { t: 'Add `move` so the closure owns `v`.', correct: true, why: 'That is rustc’s own help text; the thread then owns its data and may outlive the function.' },
      { t: 'Call `join` sooner.', why: 'rustc does not reason about when you join a spawned thread; the closure must still be `\'static`.' },
      { t: 'Mark `v` as `mut`.', why: 'Mutability has nothing to do with how long the borrow lasts.' },
    ],
  },
  {
    q: 'What does `thread::scope` guarantee that `thread::spawn` does not?',
    options: [
      { t: 'That its threads run in the order they were spawned.', why: 'Scoped threads run concurrently, in any order.' },
      { t: 'That its threads never panic.', why: 'They can panic; `join` returns `Err`, and an unjoined panicked thread makes `scope` panic.' },
      { t: 'That every thread it spawned has finished before it returns, so they may borrow local data.', correct: true, why: 'That is exactly what lets scoped closures be non-`\'static`.' },
    ],
  },
  {
    q: 'Which of these is `Send` but NOT `Sync`?',
    options: [
      { t: '`RefCell<i32>`', correct: true, why: 'It can be moved to another thread, but its borrow flag is not thread-safe, so it cannot be shared by `&`.' },
      { t: '`Rc<i32>`', why: '`Rc` is neither: its count is not atomic.' },
      { t: '`Arc<i32>`', why: '`Arc<i32>` is both.' },
      { t: '`i32`', why: '`i32` is both.' },
    ],
  },
  {
    q: 'Why does Viscosity’s `for_each_parallel` require `f: impl Fn(usize) -> T + Sync`?',
    options: [
      { t: 'Because `Sync` makes `f` run faster.', why: 'Marker traits change no code; they only allow or forbid uses.' },
      { t: 'Because every worker thread calls the same `f` through a shared reference, which requires `&F: Send`, i.e. `F: Sync`.', correct: true, why: 'That is the definition of `Sync`.' },
      { t: 'Because each thread gets its own copy of `f`.', why: 'Then `f` would need to be `Clone` (or `Send`), not `Sync`.' },
    ],
  },
  {
    q: 'Compared with a Node `Worker`, what do Rust scoped threads do with the data you give them?',
    options: [
      { t: 'They clone it with the structured clone algorithm.', why: 'That is what Node does with `workerData` and messages.' },
      { t: 'They serialise it to JSON.', why: 'No serialising happens between Rust threads.' },
      { t: 'They borrow the very same memory, and the borrow checker proves nobody writes it meanwhile.', correct: true, why: 'Threads share one address space; the type system rules out the race.' },
    ],
  },
];
