// Chapter 379-b cards. Keys are stable ids: never rename them.

export const prompts = {
  'mutex-guard': {
    q: 'What does `m.lock()` give you, once it stops waiting?',
    a: 'A `Result` holding a `MutexGuard`, which dereferences to the data inside the mutex (`Err` only if the mutex is poisoned).',
  },
  'mutex-unlock': {
    q: 'How is a Rust `Mutex` unlocked?',
    a: 'By dropping the guard, usually when it goes out of scope; there is no separate `unlock` call to forget.',
  },
  'arc-why': {
    q: 'Spawned threads need to share a `Mutex`. Why `Arc<Mutex<T>>` and not `Rc<Mutex<T>>`?',
    a: '`Rc`’s count is not atomic, so `Rc` is not `Send` and cannot move into a thread; `Arc` counts atomically and is `Send` and `Sync`.',
  },
  'lock-short': {
    q: 'Why does Viscosity’s parallel build lock its result slots only after compiling a file?',
    a: 'While one thread holds the guard every other thread waits; holding it during slow work would make the threads run one at a time.',
  },
  'chan-move': {
    q: 'After `tx.send(s)`, why can’t the sending thread use `s`?',
    a: '`send` takes `s` by value: ownership moved into the channel (E0382 if you try).',
  },
  'chan-drop': {
    q: 'Why does `for x in rx` sometimes never end?',
    a: 'It ends only when every `Sender` has been dropped; a forgotten original `tx` keeps the channel open.',
  },
  'chan-mpsc': {
    q: 'What does “mpsc” stand for, and how do you get several producers?',
    a: 'Multi-producer, single-consumer. Clone the `Sender` once per producing thread.',
  },
  'chan-vs-lock': {
    q: 'When is a channel a better fit than a shared `Mutex`?',
    a: 'When threads only hand results on: each value has one owner at a time, so nothing is shared and nothing needs locking.',
  },
};

export const examples = {
  'channel-build': {
    lang: 'rust',
    title: 'Workers send, one collector receives',
    code: `use std::sync::mpsc;
use std::thread;

fn main() {
    let (tx, rx) = mpsc::channel();
    let fs = ["a.js", "b.js", "c.py"];
    for k in 0..fs.len() {
        let f = fs[k];
        let tx = tx.clone();
        thread::spawn(move || {
            // pretend to compile file k
            let out = format!("{f} ok");
            tx.send((k, out)).unwrap();
        });
    }
    // Drop the original, or the loop
    // below would wait for it forever.
    drop(tx);

    let n = fs.len();
    let mut slots = vec![None; n];
    for (k, out) in rx {
        println!("arrived: {k}");
        slots[k] = Some(out);
    }
    for s in slots {
        println!("{}", s.unwrap());
    }
}`,
  },
};

const HEAD = `use std::sync::Mutex;
use std::thread;

fn split(t: &str) -> Vec<String> {
    t.split_whitespace()
        .map(String::from)
        .collect()
}`;

const SIG = 'fn gather(ts: &[&str]) -> Vec<String> {';

const BODY = (cell, lock) => `${SIG}
    let all = ${cell}::new(Vec::new());
    thread::scope(|s| {
        for t in ts {
            let all = &all;
            s.spawn(move || {
                let ws = split(t);
                let mut g =
                    all.${lock};
                g.extend(ws);
            });
        }
    });
    let mut v =
        all.into_inner()${cell === 'Mutex' ? '.unwrap()' : ''};
    v.sort();
    v
}`;

export const exercises = {
  gather: {
    lang: 'rust',
    title: 'Many threads, one shared list',
    prompt:
      'Write `gather(ts)`: on one scoped thread per text, split the text into words with the given `split`, and add them all to a single shared `Vec<String>` protected by a `Mutex`. When every thread is done, take the vector out of the mutex, sort it, and return it, so `gather(&["b a", "c"])` is `["a", "b", "c"]`.',
    starter: `${HEAD}

${SIG}
    Vec::new()
}`,
    solution: `${HEAD}

${BODY('Mutex', 'lock().unwrap()')}`,
    tests: `#[test]
fn gathers_and_sorts() {
    assert_eq!(gather(&["b a", "c"]), ["a", "b", "c"]);
}
#[test]
fn nothing_in_nothing_out() {
    assert!(gather(&[]).is_empty());
}
#[test]
fn keeps_every_copy() {
    let ts = ["x y", "y", "x x", ""];
    let want = ["x", "x", "x", "y", "y"];
    assert_eq!(gather(&ts), want);
}
#[test]
fn many_threads() {
    let owned: Vec<String> = (0..50)
        .map(|i| format!("w{} z", i % 5))
        .collect();
    let ts: Vec<&str> =
        owned.iter().map(|s| s.as_str()).collect();
    let v = gather(&ts);
    assert_eq!(v.len(), 100);
    assert_eq!(v.iter().filter(|w| *w == "z").count(), 50);
}`,
    hints: [
      'Make the shared vector before the scope: `let all = Mutex::new(Vec::new());`. Scoped threads may share it through `&all`, so no `Arc` is needed.',
      'Inside `thread::scope(|s| { ... })`, loop over `ts` and `s.spawn(move || ...)` one thread per text. Make `let all = &all;` before the spawn, so `move` moves only the reference. In the thread: split, then `all.lock().unwrap()` and `extend` the guard with the words.',
      'After the scope every thread has finished, so `all.into_inner().unwrap()` gives the vector back. Sort it with `v.sort()` and return it: the order in which threads pushed is unpredictable, but the sorted order is not.',
    ],
    walkthrough: `**How to think about it.** Many threads must add to one list, so the list is shared *and* changed: exactly the case a \`Mutex\` exists for. Because the threads come from \`thread::scope\`, they may borrow the mutex, so there is no need for \`Arc\`. Two smaller decisions follow. First, keep the lock short: split the text *before* locking, and hold the guard only for the push. Second, the threads finish in an unpredictable order, so the words land in an unpredictable order; sorting at the end makes the answer the same every time.

**The solution, line by line.**

- \`let all = Mutex::new(Vec::new());\` makes the shared list, wrapped in a mutex. Its element type, \`String\`, is worked out from what is pushed later.
- \`thread::scope(|s| {\` opens the scope; it will not return until every thread spawned on \`s\` is done.
- \`for t in ts {\` visits each text (\`t\` is a \`&&str\`).
- \`let all = &all;\` shadows \`all\` with a reference to the mutex. The \`move\` closure below then moves this *reference* into the thread, not the mutex itself, so every thread can have one. (Without this line, \`move\` would try to move the mutex into the first thread.)
- \`s.spawn(move || { ... });\` starts one thread per text.
- \`let ws = split(t);\` does the real work with no lock held.
- \`let mut g = all.lock().unwrap();\` waits for the lock and takes the guard; \`unwrap\` treats a poisoned mutex (another thread panicked holding it) as a bug.
- \`g.extend(ws);\` appends the words through the guard. At the closing \`}\` of the closure the guard \`g\` is dropped, which unlocks the mutex for the next thread.
- After the scope, \`let mut v = all.into_inner().unwrap();\` consumes the mutex and hands back the vector inside it; nothing else can lock it any more, so this needs no waiting.
- \`v.sort(); v\` puts the words in order and returns them.

**Common wrong attempts.**

- Using a \`RefCell<Vec<String>>\` instead of a \`Mutex\`. It compiles for one thread, but here rustc stops with E0277, "\`RefCell<Vec<String>>\` cannot be shared between threads safely": \`RefCell\` is not \`Sync\`.
- Leaving out \`let all = &all;\`. Then \`move\` moves the mutex itself into the first thread, and the second iteration of the loop finds it gone (E0382, use of moved value).
- Locking first and splitting while holding the guard. It gives the right answer, but every other thread waits for each split to finish, which throws the parallelism away; locks should cover only the shared update.`,
    wrong: [
      {
        code: `use std::cell::RefCell;
${HEAD}

${BODY('RefCell', 'borrow_mut()')}`,
        why: '`RefCell` is not `Sync`, so scoped threads cannot share it through `&`; rustc rejects the code (E0277).',
      },
      {
        code: `${HEAD}

${SIG}
    let all = Mutex::new(Vec::new());
    thread::scope(|s| {
        for t in ts {
            let all = &all;
            s.spawn(move || {
                let mut g =
                    all.lock().unwrap();
                g.push(t.to_string());
            });
        }
    });
    let mut v =
        all.into_inner().unwrap();
    v.sort();
    v
}`,
        why: 'It pushes each whole text, not its words, so `"b a"` stays one string and empty texts become `""` entries.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'What unlocks a `std::sync::Mutex`?',
    options: [
      { t: 'Calling `m.unlock()` when you are done.', why: '`std::sync::Mutex` has no such method in its usual API; the guard does it.' },
      { t: 'Dropping the `MutexGuard` that `lock` returned.', correct: true, why: 'The guard’s `Drop` impl releases the lock, typically at the end of its scope.' },
      { t: 'The end of the thread that locked it.', why: 'The guard is usually dropped long before; only the guard matters.' },
    ],
  },
  {
    q: 'Scoped threads share a `Mutex<Vec<i32>>`. Do they need an `Arc`?',
    options: [
      { t: 'Yes, every shared value across threads needs an `Arc`.', why: 'Only owners need `Arc`; scoped threads may borrow.' },
      { t: 'Yes, because `Mutex` is not `Sync`.', why: '`Mutex<T>` is `Sync` when `T: Send`.' },
      { t: 'No: `Mutex<Vec<i32>>` is `Sync`, and scoped threads may share it through `&`.', correct: true, why: '`Arc` is for spawned threads, which must own what they use.' },
    ],
  },
  {
    q: 'Three threads each hold a clone of `tx`, and the main thread still has the original. What does `for v in rx` do after the three threads finish?',
    options: [
      { t: 'It ends after their last message.', why: 'The original `tx` is still alive, so the channel is not closed.' },
      { t: 'It receives their messages, then waits forever for the original `tx`.', correct: true, why: 'The loop ends only when every sender has been dropped: call `drop(tx)`.' },
      { t: 'It panics.', why: 'An open channel with no messages simply blocks.' },
    ],
  },
  {
    q: 'What happens to a `String` you `send` on a channel?',
    options: [
      { t: 'Ownership moves to whoever receives it; the sender cannot use it any more.', correct: true, why: 'Using it after sending is E0382, “borrow of moved value”.' },
      { t: 'It is deep-copied, like a Node `postMessage`.', why: 'Only the pointer, length and capacity move; the text is not copied.' },
      { t: 'Both threads can read it afterwards.', why: 'It has exactly one owner, and that is now the receiver.' },
    ],
  },
  {
    q: 'In Viscosity’s parallel build, why is the next file number an `AtomicUsize` rather than a `Mutex<usize>`?',
    options: [
      { t: 'Because a `Mutex` cannot hold a number.', why: 'It can hold any `T`.' },
      { t: 'Because atomics are not `Sync`.', why: 'They are `Sync`; that is why threads can share them.' },
      { t: 'Because one shared number needs only an atomic `fetch_add`, which needs no lock or guard.', correct: true, why: 'A lock is for larger shared data, like the vector of result slots.' },
    ],
  },
];
