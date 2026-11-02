// Chapter 210 cards. Keys are stable ids: never rename them.

const ALIVE = `fn alive_xs(xs: &[f64], hp: &[f64])
    -> Vec<f64> {
    xs.iter()
        .zip(hp)
        .filter(|(_, h)| **h > 0.0)
        .map(|(x, _)| *x)
        .collect()
}`;

const COUNTER = `fn make_counter()
    -> impl FnMut() -> u32 {
    let mut n = 0;
    move || {
        n += 1;
        n
    }
}`;

const WORDS = `struct Words<'src> {
    src: &'src str,
    pos: usize,
}

impl<'src> Words<'src> {
    fn new(src: &'src str) -> Self {
        Words { src, pos: 0 }
    }
}
`;

const wordsIter = (body) => `${WORDS}
impl<'src> Iterator for Words<'src> {
    type Item = &'src str;

    fn next(&mut self)
        -> Option<&'src str> {
${body}
    }
}`;

export const prompts = {
  'clo-syntax': {
    q: 'Write a Rust closure that takes `a` and `b` and returns their sum.',
    a: '`|a, b| a + b` (types can be added: `|a: f64, b: f64| -> f64 { a + b }`).',
  },
  'clo-mut': {
    q: 'Why must `let tick = || { count += 1; count };` be `let mut tick` to be called?',
    a: 'The closure holds a mutable borrow of `count`, so calling it changes it; Rust asks for `mut` on the binding (E0596 otherwise).',
  },
  'clo-move': {
    q: 'Why does a closure returned from `make_counter` need `move`?',
    a: 'Without it the closure borrows `count`, which dies when the function returns (E0373). `move` puts `count` inside the closure.',
  },
  'fn-traits': {
    q: 'What is the difference between `Fn`, `FnMut` and `FnOnce`?',
    a: '`Fn` only reads its captures; `FnMut` may change them; `FnOnce` may move them out, so it can be called only once.',
  },
  'fn-once': {
    q: 'Why can `let take = move || name;` (with `name: String`) be called only once?',
    a: 'The call moves `name` out of the closure. After that there is nothing left to return, so it is only `FnOnce` (E0382 on a second call).',
  },
  'fn-bound': {
    q: 'drip-rs’s `retain_keys` takes `impl FnMut(StrRef) -> bool`. Why `FnMut` and not `FnOnce`?',
    a: 'It calls the closure once per key, so it must be callable many times. `FnMut` also lets the closure update its own state.',
  },
  'it-trait': {
    q: 'What is the one required method of `Iterator`, and what does it return?',
    a: '`fn next(&mut self) -> Option<Self::Item>`: `Some(item)`, or `None` when it is finished.',
  },
  'it-for': {
    q: 'What do `for x in &v`, `for x in &mut v` and `for x in v` give you?',
    a: '`&T` (like `v.iter()`), `&mut T` (like `v.iter_mut()`), and owned `T`, which moves `v` into the loop.',
  },
  'it-lazy': {
    q: 'What does `xs.iter().map(f)` do on its own, with nothing after it?',
    a: 'Nothing: it builds a `Map` iterator and never calls `f`. Adapters are lazy; a consumer like `sum` or `collect` has to pull.',
  },
  'it-js': {
    q: 'How many intermediate arrays does `xs.iter().filter(f).map(g).sum()` build? And `xs.filter(f).map(g).reduce(h, 0)` in JavaScript?',
    a: 'Rust: none; each element goes through every stage in turn. JavaScript: two, one from `filter` and one from `map`.',
  },
};

export const examples = {
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
};

export const exercises = {
  aliveCounter: {
    lang: 'rust',
    title: 'Columns and a counter',
    prompt:
      'Two small jobs. `alive_xs` gets two columns of the same length, positions `xs` and health `hp`, and returns the `x` of every particle whose health is above zero, in order: use `zip`, `filter`, `map` and `collect`, no index loop. `make_counter` returns a closure that gives 1, 2, 3, … on successive calls, like chapter 6’s `makeCounter`.',
    starter: `fn alive_xs(xs: &[f64], hp: &[f64])
    -> Vec<f64> {
    todo!()
}

fn make_counter()
    -> impl FnMut() -> u32 {
    || todo!()
}`,
    solution: `${ALIVE}

${COUNTER}`,
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
}`,
    hints: [
      '`xs.iter().zip(hp)` gives pairs `(&x, &h)`. In a `filter` closure each item is borrowed once more, so `h` is a `&&f64`: compare `**h > 0.0`.',
      'After the filter, `.map(|(x, _)| *x)` keeps just the position, and `.collect()` builds the `Vec<f64>` the return type asks for.',
      'For the counter, make `let mut n = 0;` and return `move || { n += 1; n }`. Without `move` the closure would borrow a local that dies.',
    ],
    walkthrough: `**\`alive_xs\`** is a struct-of-arrays query: two columns walked side by side. \`zip\` pairs element *i* of each, \`filter\` keeps pairs whose health is positive, \`map\` drops the health, and \`collect\` gathers what is left. Because the chain is lazy, nothing runs until \`collect\` pulls, and no list of pairs is ever stored.

The \`**h\` trips everyone once. \`zip\` yields \`(&f64, &f64)\`, and \`filter\` hands its closure a *reference to the item*, so the pattern \`(_, h)\` binds \`h: &&f64\`. Two stars get back to the number.

**\`make_counter\`** is chapter 6 in Rust. The closure changes \`n\`, so it is \`FnMut\`, which is what the return type says. \`move\` puts \`n\` inside the closure value, so each call to \`make_counter\` makes a closure with its own \`n\`: the second test checks that \`a\` and \`b\` don’t share one. In JavaScript the engine kept \`count\` alive for you; here the closure owns it.`,
    wrong: [
      {
        code: `${ALIVE}

fn make_counter()
    -> impl FnMut() -> u32 {
    let mut n = 0;
    || {
        n += 1;
        n
    }
}`,
        why: 'Without `move` the closure borrows `n`, a local of `make_counter` that is dropped when it returns. Rust refuses with E0373 and suggests `move`.',
      },
      {
        code: `fn alive_xs(xs: &[f64], hp: &[f64])
    -> Vec<f64> {
    xs.iter()
        .zip(hp)
        .filter(|(_, h)| **h >= 0.0)
        .map(|(x, _)| *x)
        .collect()
}

${COUNTER}`,
        why: '`>=` keeps particles whose health is exactly zero. “Above zero” is `> 0.0`.',
      },
    ],
  },
  wordsIter: {
    lang: 'rust',
    optional: true,
    title: 'Make the word splitter an Iterator',
    prompt:
      'Chapter 209’s `Words` had its own `next_word`. Implement the standard `Iterator` trait for it instead, so it works with `for`, `collect`, `count` and every adapter. `next` returns the next space-separated word, borrowed from the source, or `None`.',
    starter: wordsIter('        todo!()'),
    solution: wordsIter(`        let b = self.src.as_bytes();
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
        Some(&self.src[at..self.pos])`),
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
      'The body is the same scan as chapter 209’s `next_word`: skip spaces, remember the start, advance to a space or the end.',
      'Return `None` when no character was read, and `Some(&self.src[at..self.pos])` otherwise.',
    ],
    walkthrough: `Once \`next\` exists, the trait’s other methods come for free: \`collect\`, \`filter\`, \`count\`, \`take\` and \`for\` all just call \`next\` until \`None\`. That is the whole contract.

\`type Item = &'src str\` is chapter 209 again: the words borrow the source, not the splitter, so \`collect\` can keep them all. \`take(2)\` shows laziness: it stops asking after two words, and \`r\` is never scanned.

The body is the scan from chapter 209, with one change of contract. There, \`next_word\` was your own method; here \`next\` must match the trait’s signature exactly, \`fn next(&mut self) -> Option<Self::Item>\`. Writing \`Option<&'src str>\` is the same type, because \`Item\` is \`&'src str\`. Returning \`None\` is also a promise to callers: \`for\` stops at the first \`None\`, so a buggy \`next\` that returned \`Some("")\` at the end would loop forever instead of ending. The wrong attempt below fails for a related reason: it yields empty words for runs of spaces, which \`collect\` happily keeps.`,
    wrong: [
      {
        code: wordsIter(`        let b = self.src.as_bytes();
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
        Some(w)`),
        why: 'It never skips runs of spaces, so a leading space or two spaces in a row yield empty words `""`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'How does a Rust closure capture `count` when its body does `count += 1`?',
    options: [
      { t: 'It copies the value of `count` when the closure is made', why: 'Then `count` outside would never change; the closure takes a mutable borrow.' },
      { t: 'By a mutable borrow, unless `move` makes it move `count` in', correct: true, why: 'Captures borrow only as strongly as the body needs; `move` forces ownership.' },
      { t: 'It keeps the whole function’s variables alive on the heap', why: 'That is the JavaScript picture. A Rust closure holds just the captures it uses.' },
      { t: 'Closures can’t change captured variables', why: 'They can; such a closure is `FnMut`.' },
    ],
  },
  {
    q: 'A function returns `|| { count += 1; count }`, where `count` is its own local. What happens?',
    options: [
      { t: 'It works like JavaScript’s makeCounter', why: 'Rust doesn’t keep `count` alive for a borrowing closure.' },
      { t: 'It compiles, but crashes when the closure is called', why: 'It never compiles.' },
      { t: 'E0373: the closure may outlive `count`; add `move`', correct: true, why: 'With `move`, `count` lives inside the closure, like a closed upvalue.' },
    ],
  },
  {
    q: 'Which closure is only `FnOnce`?',
    options: [
      { t: '`|p| p.alive`', why: 'It only reads, so it is `Fn`.' },
      { t: '`|| { n += 1; n }`', why: 'It changes `n` but can be called again: `FnMut`.' },
      { t: '`move || name`, where `name` is a `String`', correct: true, why: 'Calling it moves `name` out, so it can’t be called twice.' },
      { t: '`|a, b| a + b`', why: 'It captures nothing: `Fn`.' },
    ],
  },
  {
    q: '`let v = vec![1, 2]; for x in v { } println!("{:?}", v);` What happens?',
    options: [
      { t: 'It prints `[1, 2]`', why: '`for x in v` calls `v.into_iter()`, which moves `v`.' },
      { t: 'A compile error: `v` was moved into the loop', correct: true, why: 'Loop over `&v` to borrow it instead.' },
      { t: 'It prints `[]`', why: 'Rust doesn’t empty and keep `v`; it is gone.' },
    ],
  },
  {
    q: 'In the lazy-trace example, what is printed first?',
    options: [
      { t: '`nothing yet`', correct: true, why: 'Building the chain runs no closures; only `sum` starts pulling.' },
      { t: '`filter 1`, `filter 2`, `filter 3`, `filter 4`', why: 'That is JavaScript’s order. Rust interleaves filter and map per element.' },
      { t: '`total 60`', why: 'The sum is printed last, after every element has been pulled.' },
    ],
  },
  {
    q: 'Which Rust adapter matches JavaScript’s `xs.some(f)`?',
    options: [
      { t: '`.find(f)`', why: '`find` returns the item (an `Option`), not a boolean.' },
      { t: '`.all(f)`', why: 'That is `every`.' },
      { t: '`.filter(f)`', why: 'That keeps matching items, lazily.' },
      { t: '`.any(f)`', correct: true, why: 'It returns `true` as soon as one item passes, and stops pulling.' },
    ],
  },
];
