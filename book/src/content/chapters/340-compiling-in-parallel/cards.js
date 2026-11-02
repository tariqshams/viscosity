// Chapter 340 cards. Keys are stable ids: never rename them.

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
  'dp-scope': {
    q: 'Why may a thread started with `thread::scope` borrow the caller’s local variables?',
    a: 'The scope joins every thread it started before it returns, so no thread can outlive what it borrowed.',
  },
  'dp-send-sync': {
    q: 'In `for_each_parallel<T: Send>(…, f: impl Fn(usize) -> T + Sync)`, what do `Send` and `Sync` promise?',
    a: '`T: Send`: a result may be moved to another thread. `Sync`: `f` may be called from several threads at once through a shared reference.',
  },
  'dp-one-job': {
    q: 'What does `for_each_parallel` do when `jobs` is 1, or when there is only one file?',
    a: '`jobs` is clamped to between 1 and n; with 1 it just runs `(0..n).map(f)` on the calling thread, starting no threads at all.',
  },
  'dp-fetch-add': {
    q: 'What does `next.fetch_add(1, Ordering::Relaxed)` return, and why can two threads never get the same index?',
    a: 'The value before the addition. Reading and adding happen as one indivisible atomic step.',
  },
  'dp-relaxed': {
    q: 'Why is `Ordering::Relaxed` enough for the work counter?',
    a: 'The counter only hands out numbers. The results travel through the Mutex, and main reads them after the scope has joined every thread.',
  },
  'dp-order': {
    q: 'Threads finish in any order. Why is the CLI’s output still the same for every `--jobs`?',
    a: 'Each result goes into slot k of a vector, and the main thread prints the slots in input order after all threads finish.',
  },
  'dp-dynamic': {
    q: 'Why take files from a shared counter instead of giving each thread a fixed quarter of the list?',
    a: 'A thread that finishes early just takes the next file, so one slow file (or a slow quarter) doesn’t leave the other cores idle.',
  },
  'dp-fail': {
    q: 'One of 396 files has a syntax error. What happens to the others and to the exit status?',
    a: 'They all compile and print. The failing file is reported as `viscosity: <file>: <error>`, and the status is 1.',
  },
  'dp-panic': {
    q: 'How does a panic in the compiler cost only one file?',
    a: '`compile_file` wraps the compiler in `catch_unwind`, which turns the unwinding panic into an `Err` (“internal error: the compiler panicked (see above)”).',
  },
  'dp-disk': {
    q: 'Why was `build` 2.95× faster with 4 threads to tmpfs but only 1.24× to the VM’s disk?',
    a: 'Creating 396 files on the virtual disk took about 65 ms whatever the thread count, because the disk serialized it. Threads only shrink the compiling.',
  },
  'dp-explain': {
    q: 'Why did `explain` gain only about 2× with 4 threads?',
    a: 'Its whole output is printed by the main thread, in order, after the workers finish, and that part doesn’t get faster.',
  },
};

export const examples = {
  'panic-costs-one': {
    lang: 'rust',
    title: 'A counter, slots, and one panic',
    code: `use std::panic::catch_unwind;
use std::sync::atomic::{
    AtomicUsize, Ordering,
};
use std::sync::Mutex;
use std::thread;

type Res = Result<usize, String>;

// Stands in for the real compiler
fn compile(file: &str) -> Res {
    match file {
        "bad.js" => {
            Err("SyntaxError".into())
        }
        "bug.js" => panic!("a bug"),
        _ => Ok(file.len() * 10),
    }
}

// A panic costs only its own file
fn guarded(file: &str) -> Res {
    catch_unwind(|| compile(file))
        .unwrap_or_else(|_| {
            Err("panicked".into())
        })
}

fn main() {
    let files = [
        "a.js", "bad.js", "bug.js",
        "b.js", "longer.js",
    ];
    let n = files.len();
    let next = AtomicUsize::new(0);
    let empty = (0..n).map(|_| None);
    let slots: Mutex<Vec<Option<Res>>> =
        Mutex::new(empty.collect());
    thread::scope(|s| {
        for _ in 0..2 {
            s.spawn(|| loop {
                let k = next.fetch_add(
                    1,
                    Ordering::Relaxed,
                );
                if k >= n {
                    break;
                }
                let r = guarded(
                    files[k]);
                let mut v = slots.lock()
                    .unwrap();
                v[k] = Some(r);
            });
        }
    });
    let v = slots.into_inner().unwrap();
    let mut code = 0;
    for (f, r) in files.iter().zip(v) {
        match r.unwrap() {
            Ok(n) => {
                println!("{f}: {n}")
            }
            Err(e) => {
                println!("{f}: {e}");
                code = 1;
            }
        }
    }
    println!("exit status: {code}");
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
    walkthrough: `This is \`for_each_parallel\` from \`engine/rust/crates/cli/src/main.rs\`, which \`build\` and \`explain\` use for several files.

- **Why a scope.** \`thread::scope\` joins every thread before it returns, so the closures may borrow \`next\`, \`slots\` and \`f\` from the function’s stack. With \`thread::spawn\` they would have to own everything (\`'static\`), which would mean \`Arc\`s around all three.
- **Why \`>=\`.** The counter goes past \`n\`: every thread draws one number too many and stops. With \`>\`, the thread that draws \`n\` calls \`f(n)\`, one past the end.
- **Why slots, not \`push\`.** Pushing in finishing order makes the output depend on timing. A slot per index makes it depend only on the input. \`results_are_in_index_order\` makes index 0 the slowest to show the difference.
- **Why one counter.** Without it, each thread would have to be given its own indices up front, and a thread that got the slow files would finish last while the others sat idle. Giving each thread all of \`0..n\` is worse: every \`f(k)\` runs \`jobs\` times.
- **Why \`clamp(1, n.max(1))\`.** No point starting 16 threads for 3 files, and at least one thread must run even if someone passes 0.`,
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
      { t: 'Both get 7', why: 'That is what a plain load-then-store could do; the atomic step can’t.' },
      { t: 'One gets 7 and the other 8, in some order', correct: true, why: 'Each call returns the previous value and adds one indivisibly.' },
      { t: 'Both get 8', why: '`fetch_add` returns the value before the addition.' },
    ],
  },
  {
    q: 'Why is `viscosity explain a.js b.js c.js` printed in the same order for every `--jobs`?',
    options: [
      { t: 'The threads are started in order and finish in order', why: 'They finish in any order; a slow file finishes late.' },
      { t: 'Each result is stored in its own slot, and the main thread prints the slots in input order after the threads finish', correct: true, why: 'Output order depends only on the input.' },
      { t: 'A Mutex makes the threads take turns', why: 'The Mutex guards the slots; it doesn’t order the compiling.' },
    ],
  },
  {
    q: 'With 396 files on the measured VM, which change would most improve `build` to disk?',
    options: [
      { t: 'More threads', why: '4 threads already gave only 1.24×: about 65 ms went to creating files, whatever the thread count.' },
      { t: 'Faster file creation (a faster disk, or tmpfs)', correct: true, why: 'To tmpfs the same build was 2.95× faster with 4 threads.' },
      { t: 'Using Ordering::SeqCst for the counter', why: 'A stronger ordering would only make the counter slower, very slightly.' },
    ],
  },
  {
    q: 'A bug makes the compiler panic on one file out of 396. What does the Rust CLI do?',
    options: [
      { t: 'Aborts the whole run', why: '`catch_unwind` around the compiler catches the unwinding panic.' },
      { t: 'Silently skips the file', why: 'It is reported, and the status is 1.' },
      { t: 'Reports that file as “internal error: the compiler panicked (see above)”, compiles the others, and exits with 1', correct: true, why: 'The panic message itself was printed just before by the panic hook.' },
    ],
  },
  {
    q: 'Why can the closures passed to `s.spawn` borrow `next` and `slots`?',
    options: [
      { t: 'Because `next` and `slots` are `static`', why: 'They are locals of the function.' },
      { t: 'Because `thread::scope` joins every thread before it returns, so no thread outlives them', correct: true, why: 'Plain `thread::spawn` would require `\'static` data.' },
      { t: 'Because atomics and mutexes are `Copy`', why: 'They aren’t, and each thread uses the same one.' },
    ],
  },
  {
    q: 'Why did `explain` scale worse than `build` to tmpfs?',
    options: [
      { t: 'Explaining is more work than building', why: 'Not the reason given: compiling is the same.' },
      { t: 'All of its text is printed by the main thread after the workers finish, and its output is as large as its input', correct: true, why: 'A serial part that threads can’t shrink.' },
      { t: 'It uses only one thread', why: 'It uses the same `for_each_parallel`.' },
      { t: 'Its numbers were measured on a different machine', why: 'Same VM, same batch, same session.' },
    ],
  },
];
