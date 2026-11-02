// Chapter 196 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.
// Merged from old chapters 128, 128, 128.

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
  'it-trait': {
    q: 'What is the one required method of `Iterator`, and what does it return?',
    a: '`fn next(&mut self) -> Option<Self::Item>`: `Some(item)`, or `None` when it is finished.',
  },
  'it-next-mut': {
    q: 'Why does `next` take `&mut self`, so that `let it = v.iter(); it.next();` fails without `mut`?',
    a: 'Handing out an item moves the iterator on to the next one, which changes the iterator.',
  },
  'it-for': {
    q: 'What do `for x in &v`, `for x in &mut v` and `for x in v` give you?',
    a: '`&T` (like `v.iter()`), `&mut T` (like `v.iter_mut()`), and owned `T`, which moves `v` into the loop.',
  },
  'it-for-move': {
    q: 'What does a `for` loop call on the value you give it, before calling `next`?',
    a: '`IntoIterator::into_iter`. For a `Vec` by value that takes ownership, which is why `v` is unusable after `for x in v`.',
  },
  'it-lazy': {
    q: 'What does `xs.iter().map(f)` do on its own, with nothing after it?',
    a: 'Nothing: it builds a `Map` struct and never calls `f`. Adapters are lazy; a consumer like `sum` or `collect` has to pull (rustc warns otherwise).',
  },
  'it-js': {
    q: 'How many intermediate arrays does `xs.iter().filter(f).map(g).sum()` build? And `xs.filter(f).map(g).reduce(h, 0)` in JavaScript?',
    a: 'Rust: none; each item goes through every stage in turn. JavaScript: two, one from `filter` and one from `map`.',
  },
  'it-collect': {
    q: 'How do you turn an iterator chain back into a `Vec`?',
    a: 'Finish it with `.collect()`, and say the type you want, e.g. `let ys: Vec<f64> = ... .collect();`.',
  },
  'it-zip': {
    q: 'What does `a.iter().zip(&b)` yield?',
    a: 'Pairs `(&a[i], &b[i])`, walking both side by side and stopping at the end of the shorter one.',
  },
  'std-drop': {
    q: 'When does `Drop::drop` run, and how do you drop a value early?',
    a: 'Rust calls it when the value’s owner goes out of scope (you may not call it yourself: E0040). To drop early, pass the value to `std::mem::drop`, as `drop(x)`.',
  },
  'assoc-what': {
    q: 'In `trait Iterator { type Item; ... }`, what is `Item`?',
    a: 'An associated type: a blank that each implementation fills in once, e.g. `type Item = u32;`.',
  },
  'assoc-why': {
    q: 'Why is `Iterator` written with an associated type instead of `trait Iterator<T>`?',
    a: 'With a generic parameter a type could implement it many times (`Iterator<u32>`, `Iterator<String>`) and every `next` call would need annotating; an associated type allows one impl, so the item type follows from the type.',
  },
  'assoc-bound': {
    q: 'How do you write “any iterator that yields `u32`s” as a bound?',
    a: '`I: Iterator<Item = u32>`.',
  },
  'std-display': {
    q: 'What does implementing `Display` for a type give you?',
    a: 'Printing with `{}` (in `println!`, `format!`) and a `to_string()` method.',
  },
  'std-default': {
    q: 'What does `..Default::default()` do at the end of a struct literal?',
    a: 'Fills every field you did not write with the value from the type’s `Default` impl.',
  },
  'std-from': {
    q: 'You implement `From<String> for CliError`. Name two things you get.',
    a: '`CliError::from(s)` and `s.into()` (std implements `Into` for every `From`), and `?` converting a `String` error into a `CliError`.',
  },
  'std-iter': {
    q: 'What must a type implement for `for x in value` to work?',
    a: '`IntoIterator` (which every `Iterator` implements); the `for` loop calls `into_iter` and then `next` until `None`.',
  },
  'std-free': {
    q: 'Which standard trait does a TypeScript object effectively have for free, that a Rust type does not?',
    a: 'A way to print itself: every JS object has `toString` and `console.log` shows its fields; a Rust type needs `Display` or `Debug`.',
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
  'lazy-trace': {
    lang: 'rust',
    title: 'Who runs when?',
    code: `fn main() {
    let xs = [1, 2, 3, 4];
    let it = xs
        .iter()
        .filter(|x| {
            println!("filter {x}");
            *x % 2 == 0
        })
        .map(|x| {
            println!("  map {x}");
            x * 10
        });
    println!("nothing yet");
    let total: i32 = it.sum();
    println!("total {total}");
}`,
  },
  'std-traits': {
    lang: 'rust',
    title: 'One type, five standard traits',
    code: `use std::fmt;

// Debug and Clone written by derive
// (the next chapter); the rest by hand.
#[derive(Debug, Clone)]
struct Span {
    lo: usize,
    hi: usize,
}

impl fmt::Display for Span {
    fn fmt(
        &self,
        f: &mut fmt::Formatter,
    ) -> fmt::Result {
        let (a, b) = (self.lo, self.hi);
        write!(f, "{a}..{b}")
    }
}

impl Default for Span {
    fn default() -> Self {
        Span { lo: 0, hi: 0 }
    }
}

impl From<(usize, usize)> for Span {
    fn from(p: (usize, usize)) -> Self {
        Span { lo: p.0, hi: p.1 }
    }
}

// Spans of the words in a string.
struct Words<'a> {
    src: &'a [u8],
    at: usize,
}

impl Iterator for Words<'_> {
    type Item = Span;
    fn next(&mut self) -> Option<Span> {
        let s = self.src;
        while self.at < s.len()
            && s[self.at] == b' '
        {
            self.at += 1;
        }
        if self.at == s.len() {
            return None;
        }
        let lo = self.at;
        while self.at < s.len()
            && s[self.at] != b' '
        {
            self.at += 1;
        }
        Some((lo, self.at).into())
    }
}

fn main() {
    let src = "let x = 42";
    let ws = Words {
        src: src.as_bytes(),
        at: 0,
    };
    for sp in ws {
        let w = &src[sp.lo..sp.hi];
        println!("{sp} {w}"); // Display
    }
    let d = Span::default();
    let e = d.clone(); // Clone
    println!("{e:?}"); // Debug
}`,
  },
};

export const exercises = {
  counters: {
    lang: 'rust',
    title: 'A counter, and calling n times',
    prompt: 'Two small jobs. `make_counter` returns a closure that gives 1, 2, 3, … on successive calls, like *Closures: functions that remember*’s `makeCounter`; each counter must have its own count. `call_n(n, f)` calls the closure `f` exactly `n` times. Choose the bound on `f` so the tests can pass closures that change their captures.',
    starter: `fn make_counter()
    -> impl FnMut() -> u32 {
    || todo!()
}

fn call_n(n: usize,
    mut f: impl FnMut()) {
    todo!()
}`,
    solution: `fn make_counter()
    -> impl FnMut() -> u32 {
    let mut n = 0;
    move || {
        n += 1;
        n
    }
}

fn call_n(n: usize,
    mut f: impl FnMut()) {
    for _ in 0..n {
        f();
    }
}`,
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

fn call_n(n: usize,
    mut f: impl FnMut()) {
    for _ in 0..n {
        f();
    }
}`,
        why: 'Without `move` the closure borrows `n`, a local of `make_counter` that is dropped when it returns: E0373, and rustc suggests `move`.',
      },
      {
        code: `fn make_counter()
    -> impl FnMut() -> u32 {
    let mut n = 0;
    move || {
        n += 1;
        n
    }
}

fn call_n(n: usize,
    f: impl Fn()) {
    for _ in 0..n {
        f();
    }
}`,
        why: 'An `Fn` bound only accepts closures that read their captures, so the tests’ closures, which change `hits` or a counter, are rejected. Use `FnMut`.',
      },
      {
        code: `fn make_counter()
    -> impl FnMut() -> u32 {
    let mut n = 0;
    move || {
        n += 1;
        n
    }
}

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
  aliveCounter: {
    lang: 'rust',
    title: 'A struct-of-arrays query',
    prompt: '`alive_xs` gets two columns of the same length, positions `xs` and health `hp`, and returns the `x` of every particle whose health is above zero, in order. Use `zip`, `filter`, `map` and `collect`; no index loop.',
    starter: `fn alive_xs(xs: &[f64], hp: &[f64])
    -> Vec<f64> {
    todo!()
}`,
    solution: `fn alive_xs(xs: &[f64], hp: &[f64])
    -> Vec<f64> {
    xs.iter()
        .zip(hp)
        .filter(|(_, h)| **h > 0.0)
        .map(|(x, _)| *x)
        .collect()
}`,
    tests: `#[test]
fn keeps_only_the_living() {
    let xs = [1.0, 2.0, 3.0, 4.0];
    let hp = [5.0, 0.0, 1.0, -2.0];
    assert_eq!(alive_xs(&xs, &hp), vec![1.0, 3.0]);
}

#[test]
fn empty_and_all_dead() {
    assert_eq!(alive_xs(&[], &[]), Vec::<f64>::new());
    assert_eq!(alive_xs(&[9.0], &[0.0]), Vec::<f64>::new());
}

#[test]
fn all_alive_keeps_order() {
    let xs = [3.0, 1.0, 2.0];
    let hp = [1.0, 1.0, 1.0];
    assert_eq!(alive_xs(&xs, &hp), vec![3.0, 1.0, 2.0]);
}`,
    hints: [
      'Think of the two columns as one list of pairs. `xs.iter().zip(hp)` gives `(&x, &h)` for each particle.',
      'Keep the pairs whose health is positive with `filter`, then keep only the position with `.map(|(x, _)| *x)`, then `.collect()` into the `Vec<f64>` the return type asks for.',
      'In a `filter` closure each item is borrowed once more, so in the pattern `|(_, h)|` the `h` is a `&&f64`: compare `**h > 0.0`.',
    ],
    walkthrough: `**How to think about it.** This is a query over a struct of arrays (the layout this whole book is about): particle *i* is \`xs[i]\` and \`hp[i]\`, two separate columns. In JavaScript you might loop with an index; with iterators you describe the pipeline instead: pair the columns up, keep the living, keep just the position, gather the answers. Nothing runs until \`collect\` pulls, and no list of pairs is ever stored.

**The solution, line by line.**

- \`xs.iter()\` makes an iterator over \`&f64\`, borrowing the first column.
- \`.zip(hp)\` pairs it with the second column, so each item is a tuple \`(&f64, &f64)\`: the position and health of one particle. (\`zip\` accepts \`hp\` directly, because a slice reference can be turned into an iterator.)
- \`.filter(|(_, h)| **h > 0.0)\` keeps a pair only if its health is above zero. \`filter\` hands its closure a *reference to the item*, so the pattern \`(_, h)\` binds \`h\` as a \`&&f64\`; two stars get back to the number. \`_\` ignores the position here.
- \`.map(|(x, _)| *x)\` turns each surviving pair into just its position. \`map\` hands over the item itself, so here \`x\` is a \`&f64\` and one star gives the \`f64\`.
- \`.collect()\` pulls every item through the chain and builds a \`Vec<f64>\`; Rust knows which collection to build from the function's return type.

**Common wrong attempts.**

- \`>= 0.0\` keeps particles whose health is exactly zero, and the first test has one: "above zero" is \`> 0.0\`.
- \`*h > 0.0\` with one star: \`h\` is \`&&f64\`, so \`*h\` is still a reference and the comparison with \`0.0\` does not type-check.
- Forgetting \`.collect()\`: the function would return a \`Map<...>\` iterator instead of a \`Vec\`, which is E0308, with rustc's help line suggesting \`.collect()\`.`,
    wrong: [
      {
        code: `fn alive_xs(xs: &[f64], hp: &[f64])
    -> Vec<f64> {
    xs.iter()
        .zip(hp)
        .filter(|(_, h)| **h >= 0.0)
        .map(|(x, _)| *x)
        .collect()
}`,
        why: '`>=` keeps particles whose health is exactly zero. “Above zero” is `> 0.0`.',
      },
    ],
  },
  wordsIter: {
    lang: 'rust',
    optional: true,
    title: 'Make the word splitter an Iterator',
    prompt: '*Lifetime annotations*’ `Words` had its own `next_word`. Implement the standard `Iterator` trait for it instead, so it works with `for`, `collect`, `count` and every adapter. `next` returns the next space-separated word, borrowed from the source, or `None`.',
    starter: `struct Words<'src> {
    src: &'src str,
    pos: usize,
}

impl<'src> Words<'src> {
    fn new(src: &'src str) -> Self {
        Words { src, pos: 0 }
    }
}

impl<'src> Iterator for Words<'src> {
    type Item = &'src str;

    fn next(&mut self)
        -> Option<&'src str> {
        todo!()
    }
}`,
    solution: `struct Words<'src> {
    src: &'src str,
    pos: usize,
}

impl<'src> Words<'src> {
    fn new(src: &'src str) -> Self {
        Words { src, pos: 0 }
    }
}

impl<'src> Iterator for Words<'src> {
    type Item = &'src str;

    fn next(&mut self)
        -> Option<&'src str> {
        let b = self.src.as_bytes();
        while self.pos < b.len()
            && b[self.pos] == b' '
        {
            self.pos += 1;
        }
        let at = self.pos;
        while self.pos < b.len()
            && b[self.pos] != b' '
        {
            self.pos += 1;
        }
        if at == self.pos {
            return None;
        }
        Some(&self.src[at..self.pos])
    }
}`,
    tests: `#[test]
fn collects_all_words() {
    let ws: Vec<&str> = Words::new(" let x  = 1 ").collect();
    assert_eq!(ws, ["let", "x", "=", "1"]);
}

#[test]
fn works_with_adapters() {
    let n = Words::new("a bb ccc").filter(|w| w.len() > 1).count();
    assert_eq!(n, 2);
    let two: Vec<&str> = Words::new("p q r").take(2).collect();
    assert_eq!(two, ["p", "q"]);
}

#[test]
fn works_in_a_for_loop() {
    let mut total = 0;
    for w in Words::new("ab cde") {
        total += w.len();
    }
    assert_eq!(total, 5);
}`,
    hints: [
      'The body is the same scan as the `next_word` of *Lifetime annotations*: skip spaces, remember the start, advance to a space or the end.',
      'Return `None` when no character was read, and `Some(&self.src[at..self.pos])` otherwise.',
    ],
    walkthrough: `**How to think about it.** The \`Iterator\` trait asks for exactly one thing, \`next\`; once you write it, \`collect\`, \`filter\`, \`count\`, \`take\` and \`for\` all work, because each of them just calls \`next\` until \`None\`. So the job is: say what an item is, and write the scan that produces the next one.

**The solution, line by line.**

- \`impl<'src> Iterator for Words<'src> {\` implements the standard trait for our splitter; \`'src\` is the lifetime of the borrowed source, declared for this \`impl\`.
- \`type Item = &'src str;\` says each item is a word borrowed from the *source*, not from the splitter, so \`collect\` can keep them all after the splitter moves on.
- \`fn next(&mut self) -> Option<&'src str> {\` must match the trait's \`fn next(&mut self) -> Option<Self::Item>\`; since \`Item\` is \`&'src str\`, this is the same type written out.
- \`let b = self.src.as_bytes();\` looks at the text as bytes, to compare with \`b' '\`.
- The first \`while\` skips any run of spaces, so leading spaces and double spaces do not produce empty words.
- \`let at = self.pos;\` remembers where the word starts; the second \`while\` walks to the next space or the end.
- \`if at == self.pos { return None; }\`: nothing was read, so the text is used up. Returning \`None\` is also a promise: \`for\` stops at the first \`None\`.
- \`Some(&self.src[at..self.pos])\` hands out a slice of the original text.

The tests show laziness at work: \`take(2)\` stops asking after two words, so \`r\` is never scanned.

**Common wrong attempts.**

- Not skipping runs of spaces (checking only for the end, then reading up to one space): a leading space or two spaces in a row yield empty words \`""\`, which \`collect\` happily keeps.
- Returning \`Some("")\` at the end instead of \`None\`: \`for\` would never stop, because only \`None\` ends a loop.
- Writing \`type Item = &str;\` without \`'src\`: rustc refuses, because \`Item\` is "declared without lifetime parameters, so using a borrowed type for them requires that lifetime to come from the implemented type", which here means \`'src\` from \`Words<'src>\`.`,
    wrong: [
      {
        code: `struct Words<'src> {
    src: &'src str,
    pos: usize,
}

impl<'src> Words<'src> {
    fn new(src: &'src str) -> Self {
        Words { src, pos: 0 }
    }
}

impl<'src> Iterator for Words<'src> {
    type Item = &'src str;

    fn next(&mut self)
        -> Option<&'src str> {
        let b = self.src.as_bytes();
        if self.pos >= b.len() {
            return None;
        }
        let at = self.pos;
        while self.pos < b.len()
            && b[self.pos] != b' '
        {
            self.pos += 1;
        }
        let w = &self.src[at..self.pos];
        self.pos += 1;
        Some(w)
    }
}`,
        why: 'It never skips runs of spaces, so a leading space or two spaces in a row yield empty words `""`.',
      },
    ],
  },
  countdown: {
    lang: 'rust',
    title: 'A countdown that is an iterator',
    prompt: 'Make `Countdown` fit in with the standard traits. `Countdown::from(3)` (and `3.into()`) should make a countdown starting at 3, using `From<u32>`. As an `Iterator` with `Item = u32`, it yields `3, 2, 1` and then `None`. And with `Display` it prints as `T-` followed by the number it would yield next, so `Countdown::from(5)` prints `T-5` (and an exhausted one prints `T-0`). Add `use std::fmt;` at the top.',
    starter: `struct Countdown {
    n: u32,
}
`,
    solution: `use std::fmt;

struct Countdown {
    n: u32,
}

impl From<u32> for Countdown {
    fn from(n: u32) -> Self {
        Countdown { n }
    }
}

impl Iterator for Countdown {
    type Item = u32;
    fn next(&mut self) -> Option<u32> {
        if self.n == 0 {
            return None;
        }
        let v = self.n;
        self.n -= 1;
        Some(v)
    }
}

impl fmt::Display for Countdown {
    fn fmt(
        &self,
        f: &mut fmt::Formatter,
    ) -> fmt::Result {
        write!(f, "T-{}", self.n)
    }
}`,
    tests: `#[test]
fn counts_down_to_one() {
    let v: Vec<u32> =
        Countdown::from(3).collect();
    assert_eq!(v, vec![3, 2, 1]);
}
#[test]
fn into_works_too() {
    let c: Countdown = 4.into();
    assert_eq!(c.sum::<u32>(), 10);
}
#[test]
fn zero_yields_nothing() {
    assert_eq!(Countdown::from(0).next(), None);
}
#[test]
fn prints_with_display() {
    let mut c = Countdown::from(5);
    assert_eq!(c.to_string(), "T-5");
    c.next();
    assert_eq!(format!("{c}"), "T-4");
}`,
    hints: [
      'There are three separate `impl` blocks to write, one per trait: `From<u32>`, `Iterator` and `fmt::Display`. `into` comes free with `From`.',
      '`Iterator` needs the associated type, `type Item = u32;`, and `fn next(&mut self) -> Option<u32>`: return `None` when `n` is 0; otherwise remember `n`, subtract one, and return `Some` of the remembered value.',
      '`Display` has one method: `fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result { write!(f, "T-{}", self.n) }`.',
    ],
    walkthrough: `**How to think about it.** Each requirement in the prompt names a standard trait, and each trait is its own \`impl\` block with a short, fixed shape, so take them one at a time. Write down each trait's signature before its body: \`From<u32>\` has \`fn from(n: u32) -> Self\`; \`Iterator\` has the associated type \`Item\` and \`fn next(&mut self) -> Option<Self::Item>\`; \`Display\` has \`fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result\`. Once the signatures are right, the bodies are a line or three each.

**The solution, line by line.**

- \`use std::fmt;\` brings the \`fmt\` module into scope, so \`fmt::Display\`, \`fmt::Formatter\` and \`fmt::Result\` can be named briefly.
- \`impl From<u32> for Countdown { fn from(n: u32) -> Self { Countdown { n } } }\` builds a countdown from a number (\`Countdown { n }\` is field shorthand for \`Countdown { n: n }\`). Because \`std\` has a blanket \`impl<T, U: From<T>> Into<U> for T\`, this one impl also makes \`4.into()\` work wherever a \`Countdown\` is expected, which is the second test.
- \`impl Iterator for Countdown {\` opens the iterator impl, and \`type Item = u32;\` fills the blank: this iterator yields \`u32\`s. Leave this line out and rustc reports E0046, "missing: \`Item\`".
- \`fn next(&mut self) -> Option<u32> {\` takes \`&mut self\` because it changes the countdown. Writing \`Option<u32>\` is the same as \`Option<Self::Item>\` here.
- \`if self.n == 0 { return None; }\` ends the iteration: once \`next\` returns \`None\`, \`collect\`, \`sum\` and \`for\` all stop.
- \`let v = self.n; self.n -= 1; Some(v)\` hands out the current number and moves on, so a countdown from 3 yields 3, then 2, then 1, then \`None\`.
- \`impl fmt::Display for Countdown {\` and its \`fmt\` method use \`write!\`, which works like \`format!\` but writes into the formatter \`f\` and returns the \`fmt::Result\` the method needs. \`to_string()\` comes free with \`Display\`, which is what the last test calls.

**Common wrong attempts.**

- \`impl Iterator<u32> for Countdown\`: rustc says E0107, "trait takes 0 generic arguments but 1 generic argument was supplied". The item type is an associated type, not a parameter.
- Returning \`Some(self.n)\` *after* subtracting: the countdown then yields 2, 1, 0 and the first test fails.
- Implementing \`Into<Countdown> for u32\` instead of \`From\`: it can be made to compile, but then \`Countdown::from(3)\` does not exist. Implement \`From\` and get \`Into\` for free.`,
    wrong: [
      {
        code: `use std::fmt;

struct Countdown {
    n: u32,
}

impl From<u32> for Countdown {
    fn from(n: u32) -> Self {
        Countdown { n }
    }
}

impl Iterator for Countdown {
    type Item = u32;
    fn next(&mut self) -> Option<u32> {
        if self.n == 0 {
            return None;
        }
        self.n -= 1;
        Some(self.n)
    }
}

impl fmt::Display for Countdown {
    fn fmt(
        &self,
        f: &mut fmt::Formatter,
    ) -> fmt::Result {
        write!(f, "T-{}", self.n)
    }
}`,
        why: 'It subtracts before handing out the number, so a countdown from 3 yields 2, 1, 0 instead of 3, 2, 1.',
      },
      {
        code: `use std::fmt;

struct Countdown {
    n: u32,
}

impl From<u32> for Countdown {
    fn from(n: u32) -> Self {
        Countdown { n }
    }
}

impl Iterator for Countdown {
    fn next(&mut self) -> Option<u32> {
        if self.n == 0 {
            return None;
        }
        let v = self.n;
        self.n -= 1;
        Some(v)
    }
}`,
        why: 'The associated type `Item` is missing (E0046), and there is no `Display`, so nothing compiles.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'How does a Rust closure capture `count` when its body does `count += 1`?',
    options: [
      {
        t: 'It copies the value of `count` when the closure is made',
        why: 'Then `count` outside would never change; without `move`, the closure takes a mutable borrow.',
      },
      {
        t: 'By a mutable borrow, unless `move` makes it move `count` in',
        correct: true,
        why: 'Captures are as weak as the body allows; `move` forces ownership.',
      },
      {
        t: 'It keeps the whole function’s variables alive on the heap',
        why: 'That is the JavaScript picture. A Rust closure holds just the captures it uses.',
      },
      {
        t: 'Closures can’t change captured variables',
        why: 'They can; such a closure is `FnMut`.',
      },
    ],
  },
  {
    q: 'A function returns `|| { count += 1; count }`, where `count` is its own local. What happens?',
    options: [
      {
        t: 'It works like JavaScript’s makeCounter',
        why: 'Rust doesn’t keep `count` alive for a borrowing closure.',
      },
      {
        t: 'E0373: the closure may outlive `count`; add `move`',
        correct: true,
        why: 'With `move`, `count` lives inside the closure, like a closed upvalue.',
      },
      {
        t: 'It compiles, but crashes when the closure is called',
        why: 'It never compiles.',
      },
    ],
  },
  {
    q: 'Which closure is only `FnOnce`?',
    options: [
      {
        t: '`|p| p.alive`',
        why: 'It only reads, so it is `Fn`.',
      },
      {
        t: '`|| { n += 1; n }`',
        why: 'It changes `n` but can be called again: `FnMut`.',
      },
      {
        t: '`|a, b| a + b`',
        why: 'It captures nothing: `Fn`.',
      },
      {
        t: '`move || name`, where `name` is a `String`',
        correct: true,
        why: 'Calling it moves `name` out, so it can’t be called twice.',
      },
    ],
  },
  {
    q: 'A function parameter is `f: impl Fn()`. What happens if you pass `|| hits += 1`?',
    options: [
      {
        t: 'It compiles; `Fn` accepts any closure',
        why: 'That is `FnOnce`, the widest bound. `Fn` is the narrowest.',
      },
      {
        t: 'A compile error: the closure changes `hits`, so it is only `FnMut`',
        correct: true,
        why: 'rustc says it cannot assign to a captured variable in a `Fn` closure, and suggests `FnMut`.',
      },
      {
        t: 'It runs, but `hits` is not changed',
        why: 'Rust never silently ignores a write; it refuses to compile.',
      },
    ],
  },
  {
    q: '`let mut count = 0; let mut tick = move || { count += 1; count }; tick(); tick();` What is the outer `count` afterwards?',
    options: [
      {
        t: '0, because the closure changed its own copy',
        correct: true,
        why: '`move` copied the `i32` into the closure, and only that copy changed.',
      },
      {
        t: '2, because the closure changed it twice',
        why: 'That would be true without `move`, when the closure borrows `count`.',
      },
      {
        t: 'It does not compile, because `count` was moved',
        why: 'An `i32` is `Copy`, so moving it copies it and the outer one stays usable.',
      },
    ],
  },
  {
    q: '`let v = vec![1, 2]; for x in v { } println!("{:?}", v);` What happens?',
    options: [
      {
        t: 'It prints `[1, 2]`',
        why: '`for x in v` calls `v.into_iter()`, which moves `v`.',
      },
      {
        t: 'It prints `[]`',
        why: 'Rust doesn’t empty and keep `v`; it is gone.',
      },
      {
        t: 'A compile error: `v` was moved into the loop',
        correct: true,
        why: 'E0382. Loop over `&v` to borrow it instead.',
      },
    ],
  },
  {
    q: 'In the lazy-trace example, what is printed first?',
    options: [
      {
        t: '`nothing yet`',
        correct: true,
        why: 'Building the chain runs no closures; only `sum` starts pulling.',
      },
      {
        t: '`filter 1`, `filter 2`, `filter 3`, `filter 4`',
        why: 'That is JavaScript’s order. Rust interleaves filter and map per element.',
      },
      {
        t: '`total 60`',
        why: 'The sum is printed last, after every element has been pulled.',
      },
    ],
  },
  {
    q: 'Which Rust adapter matches JavaScript’s `xs.some(f)`?',
    options: [
      {
        t: '`.find(f)`',
        why: '`find` returns the item (an `Option`), not a boolean.',
      },
      {
        t: '`.all(f)`',
        why: 'That is `every`.',
      },
      {
        t: '`.any(f)`',
        correct: true,
        why: 'It returns `true` as soon as one item passes, and stops pulling.',
      },
      {
        t: '`.filter(f)`',
        why: 'That keeps matching items, lazily.',
      },
    ],
  },
  {
    q: 'What is `xs.iter().filter(f).map(g)`, before anything consumes it?',
    options: [
      {
        t: 'A `Vec` of the mapped values',
        why: 'Nothing has been computed yet; you would need `.collect()`.',
      },
      {
        t: 'A `Map` struct holding a `Filter` struct holding the slice iterator',
        correct: true,
        why: 'Adapters only wrap; a consumer calls `next` and pulls items through.',
      },
      {
        t: 'A JavaScript-style array',
        why: 'Rust’s adapters build no arrays.',
      },
    ],
  },
  {
    q: 'How does a `for` loop know when to stop?',
    options: [
      {
        t: 'It counts up to the collection’s length',
        why: 'Iterators need not have a length; `for` does not ask for one.',
      },
      {
        t: 'It catches a special exception at the end',
        why: 'That is how Python ends a loop, not Rust.',
      },
      {
        t: 'The iterator’s `next` returns `None`',
        correct: true,
        why: 'The loop is `match it.next()`: `Some(p)` runs the body, `None` breaks.',
      },
      {
        t: 'It stops when the body returns `false`',
        why: 'The body’s value is ignored; only `break` or `None` ends it.',
      },
    ],
  },
  {
    q: 'Which declaration makes `Item` an associated type?',
    options: [
      {
        t: '`trait Iterator<Item> { fn next(&mut self) -> Option<Item>; }`',
        why: 'That is a generic parameter, chosen by each use, not each impl.',
      },
      {
        t: '`trait Iterator { type Item; fn next(&mut self) -> Option<Self::Item>; }`',
        correct: true,
        why: '`type Item;` inside the trait declares the blank; each impl sets it.',
      },
      {
        t: '`trait Iterator { const Item: u32; }`',
        why: 'That is an associated constant, a value, not a type.',
      },
    ],
  },
  {
    q: 'Why can a type have only one `Item` for `Iterator`?',
    options: [
      {
        t: 'Because a type can implement a given trait at most once, and that one impl sets `Item`.',
        correct: true,
        why: 'So `<C as Iterator>::Item` has exactly one answer.',
      },
      {
        t: 'Because `Item` must always be `u32`.',
        why: 'Each impl picks its own `Item`.',
      },
      {
        t: 'Because associated types are erased at run time.',
        why: 'Erasure has nothing to do with it; the rule is one impl per type and trait.',
      },
    ],
  },
  {
    q: 'You write `println!("{p}")` for a struct `Pt` that implements only `Debug`. What happens?',
    options: [
      {
        t: 'It prints the fields, as `console.log` would.',
        why: '`{}` needs `Display`, not `Debug`.',
      },
      {
        t: 'It prints `[object Object]`.',
        why: 'That is JavaScript’s default `toString`; Rust has no default.',
      },
      {
        t: 'A compile error: E0277, `Pt` doesn’t implement `std::fmt::Display`.',
        correct: true,
        why: 'rustc even suggests `{:?}`, which would use the `Debug` impl.',
      },
    ],
  },
  {
    q: 'Viscosity’s CLI has `impl From<String> for CliError`. What does that let `?` do?',
    options: [
      {
        t: 'Ignore the error and continue.',
        why: '`?` still returns early on an error.',
      },
      {
        t: 'Return early with a `String` error converted into a `CliError` by `From::from`.',
        correct: true,
        why: '`?` calls `From::from` on the error before returning it.',
      },
      {
        t: 'Print the error with `Display`.',
        why: '`?` converts and returns; printing is up to the caller.',
      },
    ],
  },
  {
    q: 'What does `I: Iterator<Item = u32>` say about `I`?',
    options: [
      {
        t: '`I` iterates and its associated type `Item` is `u32`.',
        correct: true,
        why: 'It pins the associated type in the bound.',
      },
      {
        t: '`I` holds exactly one `u32`.',
        why: 'It can yield any number of them.',
      },
      {
        t: '`I` implements `Iterator` many times, once for `u32`.',
        why: 'A type implements `Iterator` at most once.',
      },
    ],
  },
];
