// Chapter 377 cards. Keys are stable ids: never rename them.

export const prompts = {
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

const STRUCT = `struct Countdown {
    n: u32,
}`;

export const exercises = {
  countdown: {
    lang: 'rust',
    title: 'A countdown that is an iterator',
    prompt:
      'Make `Countdown` fit in with the standard traits. `Countdown::from(3)` (and `3.into()`) should make a countdown starting at 3, using `From<u32>`. As an `Iterator` with `Item = u32`, it yields `3, 2, 1` and then `None`. And with `Display` it prints as `T-` followed by the number it would yield next, so `Countdown::from(5)` prints `T-5` (and an exhausted one prints `T-0`). Add `use std::fmt;` at the top.',
    starter: `${STRUCT}
`,
    solution: `use std::fmt;

${STRUCT}

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

${STRUCT}

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

${STRUCT}

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
    q: 'Which declaration makes `Item` an associated type?',
    options: [
      { t: '`trait Iterator<Item> { fn next(&mut self) -> Option<Item>; }`', why: 'That is a generic parameter, chosen by each use, not each impl.' },
      { t: '`trait Iterator { type Item; fn next(&mut self) -> Option<Self::Item>; }`', correct: true, why: '`type Item;` inside the trait declares the blank; each impl sets it.' },
      { t: '`trait Iterator { const Item: u32; }`', why: 'That is an associated constant, a value, not a type.' },
    ],
  },
  {
    q: 'Why can a type have only one `Item` for `Iterator`?',
    options: [
      { t: 'Because a type can implement a given trait at most once, and that one impl sets `Item`.', correct: true, why: 'So `<C as Iterator>::Item` has exactly one answer.' },
      { t: 'Because `Item` must always be `u32`.', why: 'Each impl picks its own `Item`.' },
      { t: 'Because associated types are erased at run time.', why: 'Erasure has nothing to do with it; the rule is one impl per type and trait.' },
    ],
  },
  {
    q: 'You write `println!("{p}")` for a struct `Pt` that implements only `Debug`. What happens?',
    options: [
      { t: 'It prints the fields, as `console.log` would.', why: '`{}` needs `Display`, not `Debug`.' },
      { t: 'It prints `[object Object]`.', why: 'That is JavaScript’s default `toString`; Rust has no default.' },
      { t: 'A compile error: E0277, `Pt` doesn’t implement `std::fmt::Display`.', correct: true, why: 'rustc even suggests `{:?}`, which would use the `Debug` impl.' },
    ],
  },
  {
    q: 'Viscosity’s CLI has `impl From<String> for CliError`. What does that let `?` do?',
    options: [
      { t: 'Ignore the error and continue.', why: '`?` still returns early on an error.' },
      { t: 'Return early with a `String` error converted into a `CliError` by `From::from`.', correct: true, why: '`?` calls `From::from` on the error before returning it.' },
      { t: 'Print the error with `Display`.', why: '`?` converts and returns; printing is up to the caller.' },
    ],
  },
  {
    q: 'What does `I: Iterator<Item = u32>` say about `I`?',
    options: [
      { t: '`I` iterates and its associated type `Item` is `u32`.', correct: true, why: 'It pins the associated type in the bound.' },
      { t: '`I` holds exactly one `u32`.', why: 'It can yield any number of them.' },
      { t: '`I` implements `Iterator` many times, once for `u32`.', why: 'A type implements `Iterator` at most once.' },
    ],
  },
];
