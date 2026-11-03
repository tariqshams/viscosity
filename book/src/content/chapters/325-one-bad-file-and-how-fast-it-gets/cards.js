// Chapter 325 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'dp-fail': {
    q: 'One of several files given to Viscosity’s Rust CLI has a syntax error. What does the CLI do with it and with the others?',
    a: 'It reports `viscosity: bad.js: ...` on stderr, still compiles and prints every other file in order, and exits with status 1.',
  },
  'dp-panic': {
    q: 'Why does Viscosity’s Rust CLI wrap the compiler in `catch_unwind` for each file?',
    a: 'A panic is a compiler bug; with many files it should cost only the file that triggered it, not the whole run.',
  },
  'dp-panic-hook': {
    q: 'A Rust program catches a panic with `catch_unwind`. With the default panic hook, has the panic message already been printed, and where?',
    a: 'Yes, to stderr: the panic hook runs when the panic starts, before unwinding reaches `catch_unwind`, which returns only an `Err` with the payload.',
  },
  'dp-unwind-only': {
    q: 'Which panics can `catch_unwind` not catch?',
    a: 'Panics that do not unwind: a program built to abort on panic ends at once. It catches only unwinding panics.',
  },
  'dp-disk': {
    q: 'A parallel build writes one output file per input to a disk that creates files one at a time. Why do more threads barely speed it up?',
    a: 'File creation is a serial part that costs the same whatever the thread count, so threads can shrink only the rest (Amdahl’s law); on one VM it was about 65 ms of an 85 ms run.',
  },
  'dp-explain': {
    q: 'A parallel command prints all of its output from the main thread, in order, after the workers finish, and the output is about as large as the input. Why does it scale worse than one that writes little?',
    a: 'The printing is a serial part that threads cannot shrink, and here it is large, so it caps the speed-up.',
  },
  'dp-amdahl': {
    q: 'What does Amdahl’s law say limits the speed-up from more threads?',
    a: 'The serial share s: N threads give at most 1 / (s + (1 − s) / N), and never more than 1 / s however many threads there are.',
  },
  'dp-available': {
    q: 'Why can `available_parallelism()` overcount on a shared cloud VM?',
    a: 'It does not account for current system load, and its documentation says it may overcount in a VM with CPU usage limits.',
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
  serialPart: {
    lang: 'rust',
    title: 'How much of the run stays serial?',
    prompt: 'Write two functions. `serial(t1, tn, n)` estimates the serial part of a run from its time on one thread (`t1`) and on `n` threads (`tn`), assuming the rest shrinks exactly `n` times: solve `tn = s + (t1 - s) / n` for `s`. `limit(t1, s)` is the best speed-up any number of threads could give, `t1 / s`. The tests use the measured times from the chapter.',
    starter: `fn serial(
    t1: f64,
    tn: f64,
    n: f64,
) -> f64 {
    todo!()
}

fn limit(t1: f64, s: f64) -> f64 {
    todo!()
}`,
    solution: `// Amdahl's law, turned round. A run
// takes t1 on one thread and tn on n
// threads. If the parallel part shrinks
// n times and the serial part not at
// all, this is the serial part.
fn serial(
    t1: f64,
    tn: f64,
    n: f64,
) -> f64 {
    (n * tn - t1) / (n - 1.0)
}

// The best speed-up any number of
// threads could give: when the shared
// part shrinks to nothing, only the
// serial part s is left.
fn limit(t1: f64, s: f64) -> f64 {
    t1 / s
}`,
    tests: `fn close(a: f64, b: f64) -> bool {
    (a - b).abs() < 0.01
}

#[test]
fn tmpfs_has_a_small_serial_part() {
    let s = serial(40.0, 13.5, 4.0);
    assert!(close(s, 4.667), "{s}");
}

#[test]
fn disk_has_a_large_serial_part() {
    let s = serial(105.3, 85.1, 4.0);
    assert!(close(s, 78.367), "{s}");
}

#[test]
fn perfect_scaling_means_no_serial_part() {
    assert!(close(serial(40.0, 10.0, 4.0), 0.0));
}

#[test]
fn no_gain_means_all_serial() {
    assert!(close(serial(40.0, 40.0, 4.0), 40.0));
}

#[test]
fn the_limits_from_the_chapter() {
    let a = limit(40.0, serial(40.0, 13.5, 4.0));
    assert!(close(a, 8.571), "{a}");
    let b = limit(105.3, serial(105.3, 85.1, 4.0));
    assert!(close(b, 1.344), "{b}");
}
`,
    hints: [
      'Write down the model first: with n threads, the time is the serial part s plus the rest of the one-thread time, (t1 - s), shared n ways.',
      'Multiply both sides of `tn = s + (t1 - s) / n` by n: `n * tn = n * s + t1 - s`. Now gather the s terms on one side.',
      '`n * tn - t1 = s * (n - 1)`, so `s = (n * tn - t1) / (n - 1.0)`. For the limit, divide the one-thread time by the part that can never shrink.',
    ],
    walkthrough: `**How to think about it.** Amdahl's law is a model with one unknown. A run has a part that threads can share and a part that they cannot. On one thread it takes \`t1\`, all of it. On \`n\` threads the serial part \`s\` still takes \`s\`, and the rest, \`t1 - s\`, is shared out, so it takes \`(t1 - s) / n\`. You measured \`t1\` and \`tn\`; the only unknown is \`s\`, so solve for it. Check the answer against cases you can do in your head: if four threads take exactly a quarter of the time, nothing was serial; if they take exactly as long as one, everything was.

**The solution, line by line.**

- \`fn serial(t1: f64, tn: f64, n: f64) -> f64 {\` takes the two times and the thread count as floating-point numbers (milliseconds in the tests, but any unit works, as long as both times use it).
- \`(n * tn - t1) / (n - 1.0)\` is the model solved for \`s\`: from \`tn = s + (t1 - s) / n\`, multiply by \`n\` to get \`n * tn = n * s + t1 - s\`, move \`t1\` across to get \`n * tn - t1 = s * (n - 1)\`, and divide by \`n - 1\`. For tmpfs that is \`(54.0 - 40.0) / 3.0\`, about 4.67 ms; for the disk, \`(340.4 - 105.3) / 3.0\`, about 78.37 ms.
- \`fn limit(t1: f64, s: f64) -> f64 { t1 / s }\` is the speed-up when the shared part has shrunk to nothing and only \`s\` is left: about 8.57 for tmpfs, and about 1.34 for the disk, which is why more threads could never help much there.

**Common wrong attempts.**

- **Subtracting the wrong way round.** \`(t1 - n * tn) / (n - 1.0)\` gives the right size with the wrong sign: a serial part of minus 4.67 ms.
- **Forgetting to divide by \`n - 1\`.** \`n * tn - t1\` is three times the serial part for four threads, because each of the three "extra" threads repeated it.
- **Turning the limit upside down.** \`s / t1\` is the serial *share* (0.117 for tmpfs), not the speed-up; the limit is its reciprocal.`,
    wrong: [
      {
        code: `// Amdahl's law, turned round. A run
// takes t1 on one thread and tn on n
// threads. If the parallel part shrinks
// n times and the serial part not at
// all, this is the serial part.
fn serial(
    t1: f64,
    tn: f64,
    n: f64,
) -> f64 {
    (t1 - n * tn) / (n - 1.0)
}

// The best speed-up any number of
// threads could give: when the shared
// part shrinks to nothing, only the
// serial part s is left.
fn limit(t1: f64, s: f64) -> f64 {
    t1 / s
}`,
        why: 'The sign is reversed: tmpfs comes out at minus 4.67 ms.',
      },
      {
        code: `// Amdahl's law, turned round. A run
// takes t1 on one thread and tn on n
// threads. If the parallel part shrinks
// n times and the serial part not at
// all, this is the serial part.
fn serial(
    t1: f64,
    tn: f64,
    n: f64,
) -> f64 {
    n * tn - t1
}

// The best speed-up any number of
// threads could give: when the shared
// part shrinks to nothing, only the
// serial part s is left.
fn limit(t1: f64, s: f64) -> f64 {
    t1 / s
}`,
        why: 'Without dividing by n - 1 the serial part is three times too big for four threads (14 ms for tmpfs).',
      },
      {
        code: `// Amdahl's law, turned round. A run
// takes t1 on one thread and tn on n
// threads. If the parallel part shrinks
// n times and the serial part not at
// all, this is the serial part.
fn serial(
    t1: f64,
    tn: f64,
    n: f64,
) -> f64 {
    (n * tn - t1) / (n - 1.0)
}

// The best speed-up any number of
// threads could give: when the shared
// part shrinks to nothing, only the
// serial part s is left.
fn limit(t1: f64, s: f64) -> f64 {
    s / t1
}`,
        why: 'That is the serial share, not the speed-up: 0.117 instead of 8.57 for tmpfs.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'A bug makes the compiler panic on one file out of 396. What does Viscosity’s Rust CLI do?',
    options: [
      {
        t: 'Aborts the whole run',
        why: '`catch_unwind` around the compiler catches the unwinding panic.',
      },
      {
        t: 'Reports that file as “internal error: the compiler panicked (see above)”, compiles the others, and exits with 1',
        correct: true,
        why: 'The panic message itself was printed just before, by the panic hook.',
      },
      {
        t: 'Silently skips the file',
        why: 'It is reported, and the exit status is 1.',
      },
    ],
  },
  {
    q: 'A 4-thread build of 396 files takes 85 ms, about 65 ms of it spent creating output files one at a time on a virtual disk. Which change would help most?',
    options: [
      {
        t: 'More threads',
        why: 'The 65 ms of file creation does not shrink with threads; at most the other 20 ms can.',
      },
      {
        t: 'Using `Ordering::SeqCst` for the counter',
        why: 'A stronger ordering would only make the counter very slightly slower.',
      },
      {
        t: 'Faster file creation (a faster disk, or tmpfs)',
        correct: true,
        why: 'File creation is the serial part; on a memory-backed folder (tmpfs) the same build was 2.95 times faster with 4 threads than one.',
      },
    ],
  },
  {
    q: 'A run takes 100 ms on one thread, and 20 ms of it cannot be shared. What is the most any number of threads can give?',
    options: [
      {
        t: '5 times',
        correct: true,
        why: 'The run can never be shorter than the 20 ms serial part: 100 / 20.',
      },
      {
        t: '4 times on four threads, and as much as you like with more',
        why: 'The serial part does not shrink, so the speed-up is capped at 100 / 20.',
      },
      {
        t: '1.25 times',
        why: 'That is 100 / 80, the shared part; the cap is set by the serial part.',
      },
    ],
  },
  {
    q: 'Viscosity’s `explain` and `build` (to a memory-backed folder) compile the same files on the same threads, yet `explain` scaled worse. Why?',
    options: [
      {
        t: 'Explaining is more work than building',
        why: 'Compiling is the same work for both.',
      },
      {
        t: 'It uses only one thread',
        why: 'It hands out files through the same parallel helper.',
      },
      {
        t: 'All of its text is printed by the main thread after the workers finish, and its output is as large as its input',
        correct: true,
        why: 'A serial part that threads cannot shrink.',
      },
    ],
  },
  {
    q: 'Why does a shared counter soften the problem that `available_parallelism()` may overcount on a busy VM?',
    options: [
      {
        t: 'It lowers the number of threads to match the load',
        why: 'It does not change the number of threads.',
      },
      {
        t: 'A thread that gets little CPU takes fewer files, so the others pick up its share',
        correct: true,
        why: 'Work is handed out one file at a time, to whoever is free.',
      },
      {
        t: 'It makes the threads run one after another',
        why: 'They still run at the same time; only the hand-out is shared.',
      },
    ],
  },
];
