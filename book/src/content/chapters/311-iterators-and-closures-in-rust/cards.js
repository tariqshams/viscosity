// Chapter 311 cards. Keys are stable ids: never rename them.

const COUNTER = `fn make_counter()
    -> impl FnMut() -> u32 {
    let mut n = 0;
    move || {
        n += 1;
        n
    }
}`;

const CALL_N = `fn call_n(n: usize,
    mut f: impl FnMut()) {
    for _ in 0..n {
        f();
    }
}`;

export const prompts = {
  'clo-syntax': {
    q: 'Write a Rust closure that takes `a` and `b` and returns their sum.',
    a: '`|a, b| a + b` (with types: `|a: f64, b: f64| -> f64 { a + b }`).',
  },
  'clo-capture': {
    q: 'A closure uses an outside variable `x`. What are the three ways it can capture `x`, and which does it pick?',
    a: 'Shared borrow, mutable borrow or move. It picks the weakest one its body needs: read → shared, change → mutable, give away → move.',
  },
  'clo-mut': {
    q: 'Why must `let tick = || count += 1;` be `let mut tick` before it can be called?',
    a: 'The closure holds a mutable borrow of `count`, so calling it changes something; Rust asks for `mut` on the binding (E0596 otherwise).',
  },
  'clo-move': {
    q: 'Why does a closure returned from `make_counter` need `move`?',
    a: 'Without it the closure borrows `count`, a local that dies when the function returns (E0373). `move` puts `count` inside the closure.',
  },
  'clo-struct': {
    q: 'What is a Rust closure value, roughly, according to the Rust Reference?',
    a: 'A value of its own unnamed type, roughly a struct holding the captured variables (or borrows of them), plus a call method.',
  },
  'fn-traits': {
    q: 'What is the difference between `Fn`, `FnMut` and `FnOnce`?',
    a: '`Fn` only reads its captures; `FnMut` may change them; `FnOnce` may move them out, so it can be called only once. Each one includes the previous.',
  },
  'fn-once': {
    q: 'Why can `let take = move || name;` (with `name: String`) be called only once?',
    a: 'The call moves `name` out of the closure. After that there is nothing left to return, so it is only `FnOnce` (E0382 on a second call).',
  },
  'fn-bound': {
    q: 'drip-rs’s `retain_keys` takes `impl FnMut(StrRef) -> bool`. Why not `FnOnce`?',
    a: 'It calls the closure once per key, so it must be callable many times. `FnMut` also lets the caller’s closure update its own state.',
  },
};

export const examples = {
  'closure-kinds': {
    lang: 'rust',
    title: 'Three kinds of closure',
    code: `fn twice(f: impl Fn() -> u32) -> u32 {
    f() + f()
}

fn twice_mut(mut f: impl FnMut() -> u32)
    -> u32 {
    f() + f()
}

fn once(f: impl FnOnce() -> String)
    -> String {
    f()
}

fn main() {
    // Only reads limit: Fn.
    let limit = 10;
    println!("{}", twice(|| limit));

    // Changes n: FnMut.
    let mut n = 0;
    let sum = twice_mut(|| {
        n += 1;
        n
    });
    println!("{sum}, n is now {n}");

    // Gives name away: FnOnce.
    let name = String::from("drip");
    println!("{}", once(move || name));
}`,
  },
};

export const exercises = {
  counters: {
    lang: 'rust',
    title: 'A counter, and calling n times',
    prompt:
      'Two small jobs. `make_counter` returns a closure that gives 1, 2, 3, … on successive calls, like *Closures: functions that remember*’s `makeCounter`; each counter must have its own count. `call_n(n, f)` calls the closure `f` exactly `n` times. Choose the bound on `f` so the tests can pass closures that change their captures.',
    starter: `fn make_counter()
    -> impl FnMut() -> u32 {
    || todo!()
}

fn call_n(n: usize,
    mut f: impl FnMut()) {
    todo!()
}`,
    solution: `${COUNTER}

${CALL_N}`,
    tests: `#[test]
fn a_counter_counts() {
    let mut c = make_counter();
    assert_eq!(c(), 1);
    assert_eq!(c(), 2);
    assert_eq!(c(), 3);
}

#[test]
fn counters_are_independent() {
    let mut a = make_counter();
    let mut b = make_counter();
    a();
    a();
    assert_eq!(b(), 1);
    assert_eq!(a(), 3);
}

#[test]
fn call_n_calls_n_times() {
    let mut hits = Vec::new();
    call_n(3, || hits.push("hit"));
    assert_eq!(hits.len(), 3);
}

#[test]
fn call_n_zero_times() {
    let mut hits = 0;
    call_n(0, || hits += 1);
    assert_eq!(hits, 0);
}

#[test]
fn call_n_drives_a_counter() {
    let mut c = make_counter();
    call_n(4, || {
        c();
    });
    assert_eq!(c(), 5);
}`,
    hints: [
      'For the counter, the closure needs a number of its own that survives between calls. Where can it live, if `make_counter` returns before the first call?',
      'Make `let mut n = 0;` inside `make_counter` and return `move || { n += 1; n }`. Without `move` the closure would borrow a local that is about to die.',
      'For `call_n`, loop `for _ in 0..n { f(); }`. The closures in the tests change `hits` or call a counter, so `f` must be `FnMut`, and the parameter needs `mut f` to be called.',
    ],
    walkthrough: `**How to think about it.** A counter has to remember a number between calls. In TypeScript you would keep it in a variable of the outer function and let the engine keep that variable alive. In Rust nothing keeps a local alive after its function returns, so the number has to travel *inside* the closure value: that is what \`move\` does.

For \`call_n\`, the question is "which Fn trait?". Look at what the tests pass: \`|| hits.push("hit")\` changes \`hits\`, and \`|| { c(); }\` calls a counter, which changes it. Both change their captures, so they are \`FnMut\`, and \`Fn\` would reject them. \`FnOnce\` would be too weak in the other direction: we call \`f\` many times.

**The solution, line by line.**

- \`fn make_counter() -> impl FnMut() -> u32 {\`: the return type says "some closure you may call repeatedly, which may change its own state, returning a \`u32\`". Its real type has no name, hence \`impl\`.
- \`let mut n = 0;\` is the count, a local of \`make_counter\` for now.
- \`move || {\` makes the closure and moves \`n\` into it. An integer is \`Copy\`, so this copies \`n\` into the closure's own storage; from now on the closure has its own \`n\`.
- \`n += 1;\` and \`n\` change the closure's \`n\` and return the new value: 1, then 2, then 3. Each call to \`make_counter\` makes a new closure with a new \`n\`, which is why \`a\` and \`b\` in the second test do not share.
- \`fn call_n(n: usize,
    mut f: impl FnMut()) {\`: \`f\` is any closure taking nothing and returning nothing that may change its captures; \`mut f\` because calling an \`FnMut\` needs mutable access to it.
- \`for _ in 0..n { f(); }\` calls it \`n\` times. \`0..n\` runs from 0 up to but not including \`n\`, so \`n = 0\` calls it never, and \`_\` says we do not need the loop number.

**Common wrong attempts.**

- Leaving out \`move\`: rustc stops with E0373, "closure may outlive the current function, but it borrows \`n\`", and its help line suggests \`move\`.
- Bounding \`f\` by \`impl Fn()\`: the tests no longer compile, because their closures change \`hits\`; rustc reports "cannot assign to \`hits\`, as it is a captured variable in a \`Fn\` closure" and suggests \`FnMut\`.
- Looping \`0..=n\`: that calls \`f\` one extra time, since \`..=\` includes the end.`,
    wrong: [
      {
        code: `fn make_counter()
    -> impl FnMut() -> u32 {
    let mut n = 0;
    || {
        n += 1;
        n
    }
}

${CALL_N}`,
        why: 'Without `move` the closure borrows `n`, a local of `make_counter` that is dropped when it returns: E0373, and rustc suggests `move`.',
      },
      {
        code: `${COUNTER}

fn call_n(n: usize,
    f: impl Fn()) {
    for _ in 0..n {
        f();
    }
}`,
        why: 'An `Fn` bound only accepts closures that read their captures, so the tests’ closures, which change `hits` or a counter, are rejected. Use `FnMut`.',
      },
      {
        code: `${COUNTER}

fn call_n(n: usize,
    mut f: impl FnMut()) {
    for _ in 0..=n {
        f();
    }
}`,
        why: '`0..=n` includes `n`, so `f` is called `n + 1` times.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'How does a Rust closure capture `count` when its body does `count += 1`?',
    options: [
      { t: 'It copies the value of `count` when the closure is made', why: 'Then `count` outside would never change; without `move`, the closure takes a mutable borrow.' },
      { t: 'By a mutable borrow, unless `move` makes it move `count` in', correct: true, why: 'Captures are as weak as the body allows; `move` forces ownership.' },
      { t: 'It keeps the whole function’s variables alive on the heap', why: 'That is the JavaScript picture. A Rust closure holds just the captures it uses.' },
      { t: 'Closures can’t change captured variables', why: 'They can; such a closure is `FnMut`.' },
    ],
  },
  {
    q: 'A function returns `|| { count += 1; count }`, where `count` is its own local. What happens?',
    options: [
      { t: 'It works like JavaScript’s makeCounter', why: 'Rust doesn’t keep `count` alive for a borrowing closure.' },
      { t: 'E0373: the closure may outlive `count`; add `move`', correct: true, why: 'With `move`, `count` lives inside the closure, like a closed upvalue.' },
      { t: 'It compiles, but crashes when the closure is called', why: 'It never compiles.' },
    ],
  },
  {
    q: 'Which closure is only `FnOnce`?',
    options: [
      { t: '`|p| p.alive`', why: 'It only reads, so it is `Fn`.' },
      { t: '`|| { n += 1; n }`', why: 'It changes `n` but can be called again: `FnMut`.' },
      { t: '`|a, b| a + b`', why: 'It captures nothing: `Fn`.' },
      { t: '`move || name`, where `name` is a `String`', correct: true, why: 'Calling it moves `name` out, so it can’t be called twice.' },
    ],
  },
  {
    q: 'A function parameter is `f: impl Fn()`. What happens if you pass `|| hits += 1`?',
    options: [
      { t: 'It compiles; `Fn` accepts any closure', why: 'That is `FnOnce`, the widest bound. `Fn` is the narrowest.' },
      { t: 'A compile error: the closure changes `hits`, so it is only `FnMut`', correct: true, why: 'rustc says it cannot assign to a captured variable in a `Fn` closure, and suggests `FnMut`.' },
      { t: 'It runs, but `hits` is not changed', why: 'Rust never silently ignores a write; it refuses to compile.' },
    ],
  },
  {
    q: '`let mut count = 0; let mut tick = move || { count += 1; count }; tick(); tick();` What is the outer `count` afterwards?',
    options: [
      { t: '0, because the closure changed its own copy', correct: true, why: '`move` copied the `i32` into the closure, and only that copy changed.' },
      { t: '2, because the closure changed it twice', why: 'That would be true without `move`, when the closure borrows `count`.' },
      { t: 'It does not compile, because `count` was moved', why: 'An `i32` is `Copy`, so moving it copies it and the outer one stays usable.' },
    ],
  },
];
