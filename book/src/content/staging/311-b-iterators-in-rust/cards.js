// Chapter 311-b cards. Keys are stable ids: never rename them.

const ALIVE = `fn alive_xs(xs: &[f64], hp: &[f64])
    -> Vec<f64> {
    xs.iter()
        .zip(hp)
        .filter(|(_, h)| **h > 0.0)
        .map(|(x, _)| *x)
        .collect()
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
    title: 'A struct-of-arrays query',
    prompt:
      '`alive_xs` gets two columns of the same length, positions `xs` and health `hp`, and returns the `x` of every particle whose health is above zero, in order. Use `zip`, `filter`, `map` and `collect`; no index loop.',
    starter: `fn alive_xs(xs: &[f64], hp: &[f64])
    -> Vec<f64> {
    todo!()
}`,
    solution: ALIVE,
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
    prompt:
      '*Lifetime annotations*’ `Words` had its own `next_word`. Implement the standard `Iterator` trait for it instead, so it works with `for`, `collect`, `count` and every adapter. `next` returns the next space-separated word, borrowed from the source, or `None`.',
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
- Writing \`type Item = &str;\` without \`'src\`: a struct-level associated type cannot leave its lifetime out, and rustc asks for a named one (E0106).`,
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
    q: '`let v = vec![1, 2]; for x in v { } println!("{:?}", v);` What happens?',
    options: [
      { t: 'It prints `[1, 2]`', why: '`for x in v` calls `v.into_iter()`, which moves `v`.' },
      { t: 'It prints `[]`', why: 'Rust doesn’t empty and keep `v`; it is gone.' },
      { t: 'A compile error: `v` was moved into the loop', correct: true, why: 'E0382. Loop over `&v` to borrow it instead.' },
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
      { t: '`.any(f)`', correct: true, why: 'It returns `true` as soon as one item passes, and stops pulling.' },
      { t: '`.filter(f)`', why: 'That keeps matching items, lazily.' },
    ],
  },
  {
    q: 'What is `xs.iter().filter(f).map(g)`, before anything consumes it?',
    options: [
      { t: 'A `Vec` of the mapped values', why: 'Nothing has been computed yet; you would need `.collect()`.' },
      { t: 'A `Map` struct holding a `Filter` struct holding the slice iterator', correct: true, why: 'Adapters only wrap; a consumer calls `next` and pulls items through.' },
      { t: 'A JavaScript-style array', why: 'Rust’s adapters build no arrays.' },
    ],
  },
  {
    q: 'How does a `for` loop know when to stop?',
    options: [
      { t: 'It counts up to the collection’s length', why: 'Iterators need not have a length; `for` does not ask for one.' },
      { t: 'It catches a special exception at the end', why: 'That is how Python ends a loop, not Rust.' },
      { t: 'The iterator’s `next` returns `None`', correct: true, why: 'The loop is `match it.next()`: `Some(p)` runs the body, `None` breaks.' },
      { t: 'It stops when the body returns `false`', why: 'The body’s value is ignored; only `break` or `None` ends it.' },
    ],
  },
];
