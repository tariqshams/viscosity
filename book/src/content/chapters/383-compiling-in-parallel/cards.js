// Chapter 383 cards. Keys are stable ids: never rename them.

const HEAD = `use std::sync::atomic::{
    AtomicUsize, Ordering,
};
use std::sync::Mutex;
use std::thread;

`;

const SIG = `fn par_map<T: Send>(
    n: usize,
    jobs: usize,
    f: impl Fn(usize) -> T + Sync,
) -> Vec<T> {
`;

const SOL = `use std::sync::atomic::{
    AtomicUsize, Ordering,
};
use std::sync::Mutex;
use std::thread;

// f(0), ..., f(n - 1) on up to \`jobs\`
// threads, which take the next index
// from a shared counter. The results
// come back in index order.
fn par_map<T: Send>(
    n: usize,
    jobs: usize,
    f: impl Fn(usize) -> T + Sync,
) -> Vec<T> {
    let jobs = jobs.clamp(1, n.max(1));
    let next = AtomicUsize::new(0);
    let empty = (0..n).map(|_| None);
    let slots: Mutex<Vec<Option<T>>> =
        Mutex::new(empty.collect());
    thread::scope(|s| {
        for _ in 0..jobs {
            s.spawn(|| loop {
                let k = next.fetch_add(
                    1,
                    Ordering::Relaxed,
                );
                if k >= n {
                    break;
                }
                let r = f(k);
                let mut v = slots.lock()
                    .unwrap();
                v[k] = Some(r);
            });
        }
    });
    let v = slots.into_inner().unwrap();
    v.into_iter()
        .map(|r| r.unwrap())
        .collect()
}`;

export const prompts = {
  'dp-independent': {
    q: 'Why can the Rust CLI compile `a.js` and `b.js` at the same time?',
    a: 'They are independent: Viscosity’s analyses never look from one file into another, so compiling one needs nothing from the other.',
  },
  'dp-what-thread': {
    q: 'What is a thread?',
    a: 'A separate line of execution inside one program, with its own place in the code and its own stack, sharing the program’s other memory; threads can run on different cores at once.',
  },
  'dp-scope': {
    q: 'Why may the closures passed to `s.spawn` inside `thread::scope` borrow local variables?',
    a: 'The scope joins every thread it started before it returns, so no thread can outlive what it borrowed. Plain `thread::spawn` needs `\'static` data instead.',
  },
  'dp-shares': {
    q: 'Six files take 4, 4, 1, 1, 1 and 1 units on three threads. Why do fixed shares (two files each) finish later than a shared counter?',
    a: 'Fixed shares give one thread both slow files (8 units) while the others sit idle; with a counter, an idle thread takes the next file, and all finish by 4.',
  },
  'dp-fetch-add': {
    q: 'What does `next.fetch_add(1, Ordering::Relaxed)` return, and why can two threads never get the same value?',
    a: 'The value before the addition. Reading and adding happen as one indivisible (atomic) step.',
  },
  'dp-relaxed': {
    q: 'Why is `Ordering::Relaxed` enough for the CLI’s counter?',
    a: 'The counter only hands out numbers; no other data is passed through it. Results go through the mutex, and are read only after the scope has joined every thread.',
  },
  'dp-order': {
    q: 'Why does `explain a.js b.js c.js` print in the same order for every `--jobs`?',
    a: 'Each result goes into its own slot, `slots[k]`, and the main thread reads the slots in index order after all threads finish.',
  },
  'dp-send-sync': {
    q: 'In `for_each_parallel<T: Send>(..., f: impl Fn(usize) -> T + Sync)`, what do `Send` and `Sync` promise?',
    a: '`T: Send`: a result may be moved from the thread that made it to another. `Sync`: `f` may be called from several threads at once.',
  },
};

export const examples = {
  'shares-vs-counter': {
    lang: 'rust',
    title: 'Fixed shares or one counter',
    code: `use std::sync::atomic::{
    AtomicUsize, Ordering::Relaxed,
};
use std::thread::{scope, sleep};
use std::time::{Duration, Instant};

// Made-up compile times of six files,
// in milliseconds: two slow, four fast.
const MS: [u64; 6] =
    [40, 40, 10, 10, 10, 10];

fn compile(k: usize) {
    let ms = MS[k];
    sleep(Duration::from_millis(ms));
}

// Take the next file until none left.
fn worker(c: &AtomicUsize) {
    loop {
        let k = c.fetch_add(1, Relaxed);
        if k >= MS.len() {
            return;
        }
        compile(k);
    }
}

fn main() {
    // Fixed shares: thread t gets
    // files 2t and 2t + 1.
    let t = Instant::now();
    scope(|s| {
        for th in 0..3 {
            s.spawn(move || {
                compile(2 * th);
                compile(2 * th + 1);
            });
        }
    });
    let a = t.elapsed().as_millis();
    println!("fixed shares: {a} ms");

    // One shared counter.
    let next = AtomicUsize::new(0);
    let t = Instant::now();
    scope(|s| {
        for _ in 0..3 {
            s.spawn(|| worker(&next));
        }
    });
    let b = t.elapsed().as_millis();
    println!("shared counter: {b} ms");
}
`,
  },
};

export const exercises = {
  parMap: {
    lang: 'rust',
    title: 'A parallel map with ordered results',
    prompt:
      'Write `par_map(n, jobs, f)`: compute `f(0)`, …, `f(n - 1)` on up to `jobs` threads (never fewer than 1, never more than `n`), and return the results in index order. As in the CLI, each thread should repeatedly take the next index from one shared `AtomicUsize` until it runs out, and store each result in its own slot.',
    starter: HEAD + SIG + `    todo!()
}`,
    solution: SOL,
    tests: `use std::collections::HashSet;
use std::time::Duration;

#[test]
fn results_are_in_index_order() {
    // index 0 sleeps longest, so it
    // finishes last
    let r = par_map(8, 4, |k| {
        let ms = (8 - k) as u64 * 3;
        thread::sleep(Duration::from_millis(ms));
        k * k
    });
    assert_eq!(r, [0, 1, 4, 9, 16, 25, 36, 49]);
}

#[test]
fn every_index_runs_exactly_once() {
    let runs: Vec<AtomicUsize> =
        (0..50).map(|_| AtomicUsize::new(0)).collect();
    par_map(50, 4, |k| {
        runs[k].fetch_add(1, Ordering::Relaxed)
    });
    for (k, r) in runs.iter().enumerate() {
        assert_eq!(r.load(Ordering::Relaxed), 1, "{k}");
    }
}

#[test]
fn several_threads_do_the_work() {
    let ids = Mutex::new(HashSet::new());
    par_map(8, 4, |_| {
        thread::sleep(Duration::from_millis(10));
        ids.lock().unwrap().insert(thread::current().id());
    });
    assert!(ids.lock().unwrap().len() >= 2);
}

#[test]
fn more_jobs_than_work() {
    assert_eq!(par_map(3, 16, |k| k + 1), [1, 2, 3]);
    let none: Vec<usize> = par_map(0, 4, |k| k);
    assert!(none.is_empty());
}
`,
    hints: [
      'Inside `thread::scope(|s| { ... })`, call `s.spawn(|| loop { ... })` `jobs` times. The closures may borrow `next`, `slots` and `f`.',
      'In the loop: `let k = next.fetch_add(1, Ordering::Relaxed); if k >= n { break; }`.',
      'Make the slots with `Mutex::new((0..n).map(|_| None).collect())`, store with `slots.lock().unwrap()[k] = Some(f(k))`, and after the scope unwrap each slot.',
    ],
    walkthrough: `**How to think about it.** You are writing \`for_each_parallel\` from \`engine/rust/crates/cli/src/main.rs\` again, from its parts. Three questions decide the shape. How do threads get work? From one shared counter, so a thread that finishes early takes more. Where do results go? Each into its own numbered slot, so the order of the answer depends only on the index, never on timing. How can threads use \`next\`, \`slots\` and \`f\`, which live on this function's stack? Through \`thread::scope\`, which waits for every thread before it returns, so borrowing is safe.

**The solution, line by line.**

- \`let jobs = jobs.clamp(1, n.max(1));\` keeps the thread count between 1 and the number of pieces: no point starting 16 threads for 3 pieces, and at least one thread even if someone passes 0. (\`n.max(1)\` keeps the upper limit at least 1 when \`n\` is 0, since \`clamp\` panics if the lower limit is above the upper one.)
- \`let next = AtomicUsize::new(0);\` is the ticket machine.
- \`let empty = (0..n).map(|_| None);\` makes \`n\` empty slots (\`vec![None; n]\` would need \`T: Clone\`, which we do not have).
- \`let slots: Mutex<Vec<Option<T>>> = Mutex::new(empty.collect());\` puts them behind a lock.
- \`thread::scope(|s| { for _ in 0..jobs { s.spawn(|| loop { ... }); } });\` starts the threads, and does not return until all of them have finished.
- \`let k = next.fetch_add(1, Ordering::Relaxed);\` takes a ticket: it returns the old value and adds one in a single step, so no two threads get the same \`k\`.
- \`if k >= n { break; }\` stops a thread once the tickets run past the last piece. Every thread draws one number too many on its way out, which is harmless.
- \`let r = f(k);\` does the work *before* taking the lock, so threads only wait for each other during the tiny store.
- \`let mut v = slots.lock().unwrap(); v[k] = Some(r);\` stores the result in its own slot.
- \`let v = slots.into_inner().unwrap();\` takes the vector out of the mutex once every thread is done, and \`v.into_iter().map(|r| r.unwrap()).collect()\` turns each \`Some(r)\` into \`r\`, in index order.

**Common wrong attempts.**

- **No threads at all.** \`(0..n).map(f).collect()\` gives the right answer on one thread. That is what the CLI does for \`--jobs 1\`, but here \`several_threads_do_the_work\` sees only one thread id.
- **\`k > n\` instead of \`k >= n\`.** The thread that draws \`n\` calls \`f(n)\`, one past the last piece.
- **Every thread does every index.** A \`for k in 0..n\` loop in each thread runs each \`f(k)\` \`jobs\` times; the counter is what hands each index out once.
- **Pushing results as they finish.** \`out.lock().unwrap().push(r)\` puts results in finishing order, which changes from run to run; \`results_are_in_index_order\` makes index 0 the slowest to catch exactly that.`,
    wrong: [
      {
        code: `use std::sync::atomic::{
    AtomicUsize, Ordering,
};
use std::sync::Mutex;
use std::thread;

fn par_map<T: Send>(
    n: usize,
    jobs: usize,
    f: impl Fn(usize) -> T + Sync,
) -> Vec<T> {
    (0..n).map(f).collect()
}`,
        why: 'The results are right, but it never starts a thread: `several_threads_do_the_work` sees one thread id. That is what the CLI does for `--jobs 1`, not in general.',
      },
      {
        code: SOL.replace('if k >= n {', 'if k > n {'),
        why: 'The thread that draws `n` calls `f(n)`, one past the end, before it stops.',
      },
      {
        code: `use std::sync::atomic::{
    AtomicUsize, Ordering,
};
use std::sync::Mutex;
use std::thread;

fn par_map<T: Send>(
    n: usize,
    jobs: usize,
    f: impl Fn(usize) -> T + Sync,
) -> Vec<T> {
    let jobs = jobs.clamp(1, n.max(1));
    let empty = (0..n).map(|_| None);
    let slots: Mutex<Vec<Option<T>>> =
        Mutex::new(empty.collect());
    thread::scope(|s| {
        for _ in 0..jobs {
            s.spawn(|| {
                for k in 0..n {
                    let r = f(k);
                    let mut v = slots
                        .lock()
                        .unwrap();
                    v[k] = Some(r);
                }
            });
        }
    });
    let v = slots.into_inner().unwrap();
    v.into_iter()
        .map(|r| r.unwrap())
        .collect()
}`,
        why: 'Every thread computes every index, so each `f(k)` runs `jobs` times. The shared counter is what hands each index out once.',
      },
      {
        code: `use std::sync::atomic::{
    AtomicUsize, Ordering,
};
use std::sync::Mutex;
use std::thread;

fn par_map<T: Send>(
    n: usize,
    jobs: usize,
    f: impl Fn(usize) -> T + Sync,
) -> Vec<T> {
    let jobs = jobs.clamp(1, n.max(1));
    let next = AtomicUsize::new(0);
    let out = Mutex::new(Vec::new());
    thread::scope(|s| {
        for _ in 0..jobs {
            s.spawn(|| loop {
                let k = next.fetch_add(
                    1,
                    Ordering::Relaxed,
                );
                if k >= n {
                    break;
                }
                let r = f(k);
                let mut v = out.lock()
                    .unwrap();
                v.push(r);
            });
        }
    });
    out.into_inner().unwrap()
}`,
        why: 'Pushing in the order threads finish makes the order depend on timing. Store each result in its own slot instead.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Four threads share one `AtomicUsize` counter at 7. Two of them call `fetch_add(1)` at the same moment. What do they get?',
    options: [
      { t: 'Both get 7', why: 'That is what a plain read followed by a write could do; the atomic step cannot.' },
      { t: 'Both get 8', why: '`fetch_add` returns the value before the addition.' },
      { t: 'One gets 7 and the other 8, in some order', correct: true, why: 'Each call returns the previous value and adds one in a single, indivisible step.' },
    ],
  },
  {
    q: 'Why is `viscosity explain a.js b.js c.js` printed in the same order for every `--jobs`?',
    options: [
      { t: 'Each result is stored in its own slot, and the main thread prints the slots in input order after the threads finish', correct: true, why: 'Output order depends only on the input.' },
      { t: 'The threads are started in order and finish in order', why: 'They finish in any order; a slow file finishes late.' },
      { t: 'A Mutex makes the threads take turns', why: 'The Mutex guards the slots; it does not order the compiling.' },
    ],
  },
  {
    q: 'Why can the closures passed to `s.spawn` borrow `next` and `slots`?',
    options: [
      { t: 'Because `next` and `slots` are `static`', why: 'They are local variables of the function.' },
      { t: 'Because atomics and mutexes are `Copy`', why: 'They are not, and every thread uses the same one.' },
      { t: 'Because `thread::scope` joins every thread before it returns, so no thread outlives them', correct: true, why: 'Plain `thread::spawn` would need `\'static` data.' },
    ],
  },
  {
    q: 'Files take very different times to compile. Which way of handing them to threads finishes soonest, in general?',
    options: [
      { t: 'Give each thread an equal number of files in advance', why: 'One thread can end up with all the slow ones while the others wait.' },
      { t: 'Let each thread take the next file from a shared counter when it is free', correct: true, why: 'Idle threads keep taking work, so no thread sits idle while files remain.' },
      { t: 'Start one thread per file', why: 'Hundreds of threads on four cores only add overhead; the counter already keeps every core busy.' },
    ],
  },
  {
    q: 'In `for_each_parallel`, why is `f(k)` called before `slots.lock()`, not while holding the lock?',
    options: [
      { t: 'So that other threads can compile while this one does; only the short store needs the lock', correct: true, why: 'Holding the lock while compiling would let only one thread work at a time.' },
      { t: 'Because `f` cannot be called while a lock is held', why: 'It could; it would only make the threads wait for each other.' },
      { t: 'Because the lock poisons itself after one use', why: 'A mutex is poisoned only when a thread panics while holding it.' },
    ],
  },
];
