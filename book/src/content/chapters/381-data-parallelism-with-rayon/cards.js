// Chapter 381 cards. Keys are stable ids: never rename them.

export const prompts = {
  'rayon-what': {
    q: 'What is the usual one-word change that makes an iterator chain run in parallel with rayon?',
    a: '`iter()` becomes `par_iter()` (with `use rayon::prelude::*;`).',
  },
  'rayon-order': {
    q: 'Does `files.par_iter().map(f).collect::<Vec<_>>()` keep the results in the order of `files`?',
    a: 'Yes: it gives the same result as the sequential chain. Only side effects such as printing may happen in another order.',
  },
  'rayon-fn': {
    q: 'Why does `xs.par_iter().for_each(|x| total += x)` not compile?',
    a: 'rayon calls the closure from many threads at once, so it must be `Fn` (+ `Sync`), and an `Fn` closure cannot mutate what it captures (E0596). Use `.sum()`.',
  },
  'rayon-crate': {
    q: 'Is rayon part of Rust’s standard library?',
    a: 'No, it is a crate from crates.io (`rayon = "1.12"` in Cargo.toml); `std` offers threads and scopes but no parallel iterators.',
  },
  'steal-join': {
    q: 'What does a rayon worker do when it calls `join(a, b)`?',
    a: 'Pushes `b` onto its own deque (so idle workers may steal it), runs `a`, then runs `b` itself unless it was stolen.',
  },
  'steal-end': {
    q: 'From which end of another worker’s deque does a thief take a task, and why does that help?',
    a: 'The opposite end from where the owner works: the oldest task, which in divide-and-conquer work is the biggest piece.',
  },
  'steal-why': {
    q: 'Why do equal chunks per thread balance work badly, and stealing well?',
    a: 'Equal numbers of items can be very unequal amounts of work; with stealing, a worker that runs out takes work from a busy one.',
  },
  'steal-span': {
    q: 'With P workers, total work T₁ and span T∞, what lower bound holds for the running time?',
    a: '`T_P ≥ max(T₁ / P, T∞)`.',
  },
};

export const examples = {
  uneven: {
    lang: 'rust',
    title: 'Equal halves versus taking turns',
    code: `use std::sync::atomic::AtomicUsize;
use std::sync::atomic::Ordering;
use std::sync::Mutex;
use std::thread;
use std::time::Duration;

// One big job and seven small ones.
const COST: [u64; 8] =
    [8, 1, 1, 1, 1, 1, 1, 1];

fn work(k: usize) {
    let ms = COST[k] * 20;
    let d = Duration::from_millis(ms);
    thread::sleep(d);
}

fn main() {
    // Halves: thread t gets 4 jobs.
    let mut load = [0, 0];
    for t in 0..2 {
        for k in 4 * t..4 * t + 4 {
            load[t] += COST[k];
        }
    }
    println!("halves:  {load:?}");

    // Counter: next job when free.
    let next = AtomicUsize::new(0);
    let took = Mutex::new(Vec::new());
    thread::scope(|s| {
        for t in 0..2 {
            let next = &next;
            let took = &took;
            s.spawn(move || loop {
                let k = next.fetch_add(
                    1,
                    Ordering::Relaxed,
                );
                if k >= COST.len() {
                    break;
                }
                work(k);
                let mut g = took
                    .lock()
                    .unwrap();
                g.push((t, k));
            });
        }
    });
    let mut load = [0, 0];
    let v = took.into_inner().unwrap();
    for (t, k) in v {
        load[t] += COST[k];
    }
    println!("counter: {load:?}");
}`,
  },
};

const SIG = `fn par_sum(xs: &[u64], cut: usize)
    -> u64 {`;

export const exercises = {
  parSum: {
    lang: 'rust',
    title: 'A join of your own',
    prompt:
      'Write `par_sum(xs, cut)` in the style of `rayon::join`, using only `std`. If `xs` has at most `cut` elements (treat a `cut` of 0 as 1), add them up directly. Otherwise split `xs` in half, sum the left half on a new scoped thread and the right half on the current thread (both by calling `par_sum` again), then join and add the two answers.',
    starter: `use std::thread;

${SIG}
    0
}`,
    solution: `use std::thread;

${SIG}
    if xs.len() <= cut.max(1) {
        return xs.iter().sum();
    }
    let mid = xs.len() / 2;
    let (a, b) = xs.split_at(mid);
    thread::scope(|s| {
        let h =
            s.spawn(|| par_sum(a, cut));
        let y = par_sum(b, cut);
        h.join().unwrap() + y
    })
}`,
    tests: `#[test]
fn small_inputs_are_summed_directly() {
    assert_eq!(par_sum(&[], 4), 0);
    assert_eq!(par_sum(&[1, 2, 3], 4), 6);
}
#[test]
fn big_inputs_are_split() {
    let xs: Vec<u64> = (1..=1000).collect();
    assert_eq!(par_sum(&xs, 16), 500500);
    assert_eq!(par_sum(&xs, 999), 500500);
}
#[test]
fn odd_lengths_and_tiny_cutoffs() {
    let xs: Vec<u64> = (1..=63).collect();
    assert_eq!(par_sum(&xs, 1), 2016);
    assert_eq!(par_sum(&xs, 0), 2016);
}`,
    hints: [
      'Write the base case first: if the slice is short (`xs.len() <= cut.max(1)`), return `xs.iter().sum()`. Everything else is “split, recurse twice, add”.',
      '`xs.split_at(xs.len() / 2)` gives two borrowed halves. To run one half on another thread while borrowing, you need `thread::scope(|s| { ... })`.',
      'Inside the scope: `let h = s.spawn(|| par_sum(a, cut));`, then `let y = par_sum(b, cut);` on this thread, and finally `h.join().unwrap() + y` as the scope’s value.',
    ],
    walkthrough: `**How to think about it.** This is divide and conquer, the shape \`rayon::join\` is built for. Every call either does a small piece of work directly or splits its piece in two and asks for both halves, so first decide when to stop splitting (the base case), then how to do the two halves at the same time. "At the same time" means one half on another thread, and since the halves borrow from \`xs\`, that thread must be a *scoped* one.

**The solution, line by line.**

- \`if xs.len() <= cut.max(1) { return xs.iter().sum(); }\` is the base case. \`cut.max(1)\` turns a cut of 0 into 1; without it, a one-element slice would split into an empty half and a one-element half forever and overflow the stack. Summing the empty slice gives \`0\`, which handles \`par_sum(&[], 4)\`.
- \`let mid = xs.len() / 2; let (a, b) = xs.split_at(mid);\` makes two slices that borrow the two halves; nothing is copied. For odd lengths the right half gets the extra element, which is fine.
- \`thread::scope(|s| { ... })\` opens a scope, so threads started inside may borrow \`a\`, and the scope's closure value becomes the function's result.
- \`let h = s.spawn(|| par_sum(a, cut));\` sums the left half on a new thread (which may itself split further and start more threads).
- \`let y = par_sum(b, cut);\` sums the right half on the current thread *while* the new thread works. This order matters: joining first would leave this thread idle.
- \`h.join().unwrap() + y\` waits for the left half and adds the two.

**How this differs from rayon.** Each split here starts a brand-new operating-system thread, so \`par_sum(&xs, 1)\` on 63 numbers starts about 60 threads, most of them for a single addition. rayon's \`join\` starts no thread at all: it pushes the second closure onto the current worker's deque, runs the first, and lets idle workers steal the second. That is why rayon needs no cutoff from you for correctness, and why its overhead per split is far smaller; here, a sensible \`cut\` (thousands of elements) is what keeps the cost of threads below the work.

**Common wrong attempts.**

- Using \`thread::spawn\` instead of \`s.spawn\`: the closure borrows \`a\`, which is not \`'static\`, so it does not compile.
- Forgetting one half, for example returning only \`h.join().unwrap()\`: the answer is too small for every input longer than \`cut\`.
- Writing \`h.join().unwrap() + par_sum(b, cut)\`: it gives the right answer, but the join comes first, so the current thread waits instead of summing its half, and the two halves never overlap.`,
    wrong: [
      {
        code: `use std::thread;

${SIG}
    if xs.len() <= cut.max(1) {
        return xs.iter().sum();
    }
    let mid = xs.len() / 2;
    let (a, b) = xs.split_at(mid);
    let h = thread::spawn(move || {
        par_sum(a, cut)
    });
    h.join().unwrap() + par_sum(b, cut)
}`,
        why: '`thread::spawn` needs a `\'static` closure, but `a` borrows from `xs`, so rustc rejects it (borrowed data escapes the function).',
      },
      {
        code: `use std::thread;

${SIG}
    if xs.len() <= cut.max(1) {
        return xs.iter().sum();
    }
    let mid = xs.len() / 2;
    let (a, b) = xs.split_at(mid);
    thread::scope(|s| {
        let h =
            s.spawn(|| par_sum(a, cut));
        let y = par_sum(b, cut);
        h.join().unwrap()
    })
}`,
        why: 'The right half `y` is computed but never added, so every split loses half of its sum.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'What does rayon guarantee about code that compiles?',
    options: [
      { t: 'That it runs exactly P times faster on P cores.', why: 'Speed depends on the work; rayon promises safety, not a speed-up.' },
      { t: 'That it has no data races, because rayon’s closures and items must be Send and Sync.', correct: true, why: 'Its README promises data-race freedom, and the bounds enforce it.' },
      { t: 'That side effects such as printing happen in the original order.', why: 'Side effects may happen in a different order; only results like `collect` keep it.' },
    ],
  },
  {
    q: 'A rayon worker calls `join(a, b)`. What happens to `b` first?',
    options: [
      { t: 'A new OS thread is started for it.', why: 'rayon uses a fixed pool of threads; `join` starts none.' },
      { t: 'It runs before `a`.', why: 'The calling worker runs `a` first.' },
      { t: 'It is pushed onto the worker’s own deque, where an idle worker may steal it.', correct: true, why: 'If nobody steals it, the same worker runs it after `a`.' },
    ],
  },
  {
    q: 'Why does a thief take the oldest task from another worker’s deque?',
    options: [
      { t: 'In divide-and-conquer work the oldest task is the biggest piece, so one steal moves a lot of work.', correct: true, why: 'And the owner keeps working on its newest, smallest tasks undisturbed.' },
      { t: 'Because the oldest task is always the fastest.', why: 'It is usually the largest, not the fastest.' },
      { t: 'To keep results in order.', why: 'Ordering of results is handled by `collect`, not by which end is stolen from.' },
    ],
  },
  {
    q: 'Viscosity’s build uses a shared atomic counter instead of rayon. When is that the better fit?',
    options: [
      { t: 'For millions of tiny tasks.', why: 'Then every task would hit the same shared counter, and that traffic would cost more than the tasks.' },
      { t: 'Never; rayon is always better.', why: 'For a few dozen coarse jobs the counter balances well and needs no extra dependency.' },
      { t: 'For a few dozen coarse jobs, such as whole files, where one shared counter is cheap and balances the load.', correct: true, why: 'Each file costs far more than one `fetch_add`.' },
    ],
  },
  {
    q: 'Total work is 100 units, the span is 10 units, and you have 20 workers. What is the best possible time?',
    options: [
      { t: '5 units', why: '100 / 20 is 5, but the span of 10 cannot be shortened.' },
      { t: '10 units', correct: true, why: 'max(100 / 20, 10) = 10: the longest chain is the limit here.' },
      { t: '2 units', why: 'No schedule can beat either T₁ / P or T∞.' },
    ],
  },
];
