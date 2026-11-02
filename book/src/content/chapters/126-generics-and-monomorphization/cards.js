// Chapter 194 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.
// Merged from old chapters 126, 126.

export const prompts = {
  'gen-what': {
    q: 'What does the `<T>` in `fn first<T>(xs: &[T]) -> Option<&T>` declare?',
    a: 'A type parameter: `first` works for slices of any element type `T`, filled in at each call.',
  },
  'gen-infer': {
    q: 'In `first(&[1, 2])`, who decides that `T` is `i32`?',
    a: 'The compiler, from the argument’s type; you rarely write the type at the call.',
  },
  'gen-impl': {
    q: 'How do you read `impl<T> Pair<T> { ... }`?',
    a: '“For every type `T`, these are methods of `Pair<T>`.”',
  },
  'gen-gc': {
    q: 'drip-rs’s `Gc<T>` is only a `u32` at run time. What does the `T` buy?',
    a: 'Type safety: a `Gc<ObjClosure>` can’t be mixed up with a handle to another kind of object.',
  },
  'bound-what': {
    q: 'What does the bound in `fn top<T: PartialOrd>` allow, and what does it demand?',
    a: 'The body may compare `T`s with `<` and `>`; every caller must pass a type that implements `PartialOrd`.',
  },
  'bound-why': {
    q: 'Why does `x > best` fail to compile in `fn top<T>` with no bound?',
    a: 'The body must work for every `T`, and not every type can be compared (E0369).',
  },
  'bound-where': {
    q: 'How do you ask for two traits, and where do long bounds go?',
    a: 'Join them with `+` (`T: PartialOrd + Copy`), and move long ones into a `where` clause after the signature.',
  },
  'bound-impl': {
    q: 'What does `fn show(p: &impl Plugin)` mean?',
    a: 'The same as `fn show<P: Plugin>(p: &P)`: any type that implements `Plugin`.',
  },
  'mono-what': {
    q: 'What is monomorphization?',
    a: 'Compiling a generic item into a separate ordinary copy for each concrete type it is used with.',
  },
  'mono-per-type': {
    q: 'A generic function is called a thousand times with `i32` and once with `f64`. How many copies are made?',
    a: 'Two: one per type used, not one per call.',
  },
  'mono-evidence': {
    q: 'What did `nm -C` list for a program calling `total` with an `Aos` and a `Soa`?',
    a: 'Two functions, `total::<Aos>` and `total::<Soa>`, but only one `total_dyn`.',
  },
  'mono-cost': {
    q: 'What does monomorphization cost, and what does it buy?',
    a: 'Compile time and binary size; in return, direct calls the compiler can inline.',
  },
  'mono-option': {
    q: 'Your program uses `Some(5)` and `Some(5.0)`. What does the compiler make of `Option<T>`?',
    a: 'Two concrete types, as if you had written an `Option_i32` and an `Option_f64`.',
  },
  'mono-ic': {
    q: 'Why is the call `l.slot(i, f)` inside `total::<Aos>` like a monomorphic inline cache, only better?',
    a: 'It can only reach `Aos::slot`, and that is known before the program runs, so no guard or deoptimisation is needed.',
  },
  'gen-vs-dyn': {
    q: 'When should you use `dyn Trait` instead of a generic parameter?',
    a: 'When one collection must hold several types, or the type is chosen while the program runs.',
  },
  'engine-generic': {
    q: 'Why can’t the Rust Viscosity keep its plugins in a `Vec<&dyn LanguagePlugin>`?',
    a: 'The trait has an associated type, `Extra`, which a trait object must name: E0191.',
  },
};

export const examples = {
  'bound-play': {
    lang: 'rust',
    title: 'One generic, three element types',
    code: `fn top<T: PartialOrd>(xs: &[T])
    -> Option<&T> {
    let mut best = xs.get(0)?;
    for x in xs {
        if x > best {
            best = x;
        }
    }
    Some(best)
}

fn swap<A, B>(p: (A, B)) -> (B, A) {
    (p.1, p.0)
}

fn main() {
    println!("{:?}", top(&[3, 9, 4]));
    println!("{:?}", top(&["b", "a"]));
    println!("{:?}", top(&[0.5, 2.0]));
    let e: [i32; 0] = [];
    println!("{:?}", top(&e));
    println!("{:?}", swap((1, "one")));
}`,
  },
  'mono-play': {
    lang: 'rust',
    title: 'A generic and a dyn version',
    code: `trait Layout {
    fn slot(&self, i: usize, f: usize)
        -> usize;
}

struct Aos {
    nf: usize,
}

struct Soa {
    n: usize,
}

impl Layout for Aos {
    fn slot(&self, i: usize, f: usize)
        -> usize {
        i * self.nf + f
    }
}

impl Layout for Soa {
    fn slot(&self, i: usize, f: usize)
        -> usize {
        f * self.n + i
    }
}

fn total<L: Layout>(l: &L, buf: &[f64],
    n: usize, f: usize) -> f64 {
    let mut s = 0.0;
    for i in 0..n {
        s += buf[l.slot(i, f)];
    }
    s
}

fn total_dyn(l: &dyn Layout,
    buf: &[f64], n: usize, f: usize)
    -> f64 {
    let mut s = 0.0;
    for i in 0..n {
        s += buf[l.slot(i, f)];
    }
    s
}

fn main() {
    // x = 1, 2, 3 and vx = 10, 20, 30
    let aos = [1.0, 10.0, 2.0, 20.0,
        3.0, 30.0];
    let soa = [1.0, 2.0, 3.0, 10.0,
        20.0, 30.0];
    let a = Aos { nf: 2 };
    let s = Soa { n: 3 };
    let x = total(&a, &aos, 3, 1);
    let y = total(&s, &soa, 3, 1);
    println!("{x} {y}");
    let x = total_dyn(&a, &aos, 3, 1);
    let y = total_dyn(&s, &soa, 3, 1);
    println!("{x} {y}");
}`,
  },
};

export const exercises = {
  argmax: {
    lang: 'rust',
    title: 'Where is the biggest?',
    prompt: 'Write `argmax(xs)`: the **index** of the largest element, or `None` for an empty slice. If several elements tie for largest, return the first. It must work for any `T: PartialOrd`: whole numbers, floats and strings. (A profiler does exactly this to find the hottest loop.)',
    starter: `fn argmax<T: PartialOrd>(xs: &[T])
    -> Option<usize> {
    todo!()
}`,
    solution: `fn argmax<T: PartialOrd>(xs: &[T])
    -> Option<usize> {
    let mut best = 0;
    xs.get(0)?;
    for i in 1..xs.len() {
        if xs[i] > xs[best] {
            best = i;
        }
    }
    Some(best)
}`,
    tests: `#[test]
fn integers() {
    assert_eq!(argmax(&[3, 9, 4]), Some(1));
}
#[test]
fn floats_and_strings() {
    assert_eq!(argmax(&[0.5, -1.0]), Some(0));
    let fs = ["vx", "x", "mass"];
    assert_eq!(argmax(&fs), Some(1));
}
#[test]
fn empty_is_none() {
    let e: [i32; 0] = [];
    assert_eq!(argmax(&e), None);
}
#[test]
fn ties_give_the_first() {
    assert_eq!(argmax(&[2, 7, 7, 1]), Some(1));
}`,
    hints: [
      'Keep the *index* of the best element so far, starting at 0, and compare each later element with `xs[best]`.',
      'An empty slice has no index to return. `xs.get(0)?;` returns `None` early in one line (its value is thrown away).',
      'Loop `for i in 1..xs.len()` and use `>`, not `>=`, so that a later equal element does not replace the first.',
    ],
    walkthrough: `**How to think about it.** Do it by hand for \`[2, 7, 7, 1]\`: remember "the best so far is at index 0 (a 2)"; at index 1 a 7 beats it, so remember 1; at index 2 another 7 does not *beat* it, so keep 1; at index 3 a 1 does not either. The answer is 1. You compare elements but return a position, and the only thing the function needs to know about \`T\` is that two of them can be compared, which is exactly what the bound \`T: PartialOrd\` promises.

**The solution, line by line.**

- \`fn argmax<T: PartialOrd>(xs: &[T]) -> Option<usize> {\` takes a borrowed slice of any comparable type, and returns maybe an index.
- \`let mut best = 0;\` assumes, for now, that the first element is the largest.
- \`xs.get(0)?;\` is there only for its early return: on an empty slice \`get(0)\` is \`None\`, and \`?\` returns \`None\` from \`argmax\` (the chapter *Result and the ? operator*). On a non-empty slice the value is thrown away.
- \`for i in 1..xs.len() {\` visits every other index; \`1..n\` counts from 1 up to \`n - 1\`.
- \`if xs[i] > xs[best] { best = i; }\` uses \`>\`, which the bound allows, and moves \`best\` only for a strictly larger element, so ties keep the first.
- \`Some(best)\` wraps the answer.

The compiler checks this body once, against the bound, and then accepts \`argmax\` on \`i32\`, \`f64\` and \`&str\` slices. (How it then compiles those three uses is the next chapter.)

**Common wrong attempts.**

- \`>=\` instead of \`>\`: each later tie replaces the earlier one, so \`[2, 7, 7, 1]\` gives 2.
- Leaving out the bound (\`fn argmax<T>\`) is E0369: \`>\` cannot be applied to \`T\`.
- \`let mut best = xs[0];\` tries to take the *value* out of the slice, which for a generic \`T\` is E0508 (cannot move out of a non-copy slice); and even for numbers it loses the index you were asked for, and panics on an empty slice.`,
    wrong: [
      {
        code: `fn argmax<T: PartialOrd>(xs: &[T])
    -> Option<usize> {
    let mut best = 0;
    xs.get(0)?;
    for i in 1..xs.len() {
        if xs[i] >= xs[best] {
            best = i;
        }
    }
    Some(best)
}`,
        why: 'With `>=`, each later tie replaces the earlier one, so `[2, 7, 7, 1]` gives 2 instead of 1.',
      },
      {
        code: `fn argmax<T: PartialOrd>(xs: &[T])
    -> Option<usize> {
    let mut best = 0;
    for i in 1..xs.len() {
        if xs[i] > xs[best] {
            best = i;
        }
    }
    Some(best)
}`,
        why: 'For an empty slice this returns `Some(0)`, an index that does not exist, instead of `None`.',
      },
    ],
  },
  totalGeneric: {
    lang: 'rust',
    title: 'Sum a field, generic over the layout',
    prompt: 'Using the `Layout` trait and its two impls from the chapter *Traits* (given), write `total(l, buf, n, f)`: the sum of field `f` over elements `0..n`, reading through `l.slot`. It must be **generic** over the layout type `L`, not use `dyn`. The starter’s signature is missing something: the body won’t compile until you add the right trait bound.',
    starter: `trait Layout {
    fn slot(&self, i: usize, f: usize)
        -> usize;
}

struct Aos {
    nf: usize,
}

struct Soa {
    n: usize,
}

impl Layout for Aos {
    fn slot(&self, i: usize, f: usize)
        -> usize {
        i * self.nf + f
    }
}

impl Layout for Soa {
    fn slot(&self, i: usize, f: usize)
        -> usize {
        f * self.n + i
    }
}

fn total<L>(l: &L, buf: &[f64],
    n: usize, f: usize) -> f64 {
    todo!()
}`,
    solution: `trait Layout {
    fn slot(&self, i: usize, f: usize)
        -> usize;
}

struct Aos {
    nf: usize,
}

struct Soa {
    n: usize,
}

impl Layout for Aos {
    fn slot(&self, i: usize, f: usize)
        -> usize {
        i * self.nf + f
    }
}

impl Layout for Soa {
    fn slot(&self, i: usize, f: usize)
        -> usize {
        f * self.n + i
    }
}

fn total<L: Layout>(l: &L, buf: &[f64],
    n: usize, f: usize) -> f64 {
    let mut s = 0.0;
    for i in 0..n {
        s += buf[l.slot(i, f)];
    }
    s
}`,
    tests: `// x = 1, 2, 3 and vx = 10, 20, 30
const AOS: [f64; 6] = [1.0, 10.0, 2.0, 20.0, 3.0, 30.0];
const SOA: [f64; 6] = [1.0, 2.0, 3.0, 10.0, 20.0, 30.0];

#[test]
fn sums_x_in_aos() {
    assert_eq!(total(&Aos { nf: 2 }, &AOS, 3, 0), 6.0);
}

#[test]
fn sums_vx_in_soa() {
    assert_eq!(total(&Soa { n: 3 }, &SOA, 3, 1), 60.0);
}

#[test]
fn both_layouts_give_the_same_answer() {
    for f in 0..2 {
        assert_eq!(total(&Aos { nf: 2 }, &AOS, 3, f),
            total(&Soa { n: 3 }, &SOA, 3, f));
    }
}

#[test]
fn only_the_first_n() {
    assert_eq!(total(&Aos { nf: 2 }, &AOS, 2, 1), 30.0);
    assert_eq!(total(&Soa { n: 3 }, &SOA, 0, 0), 0.0);
}`,
    hints: [
      'Write the loop first: `let mut s = 0.0;`, then for each `i` in `0..n` add `buf[l.slot(i, f)]`.',
      'The compiler now complains that `L` has no method `slot`. What does `L` have to implement?',
      'Change the signature to `fn total<L: Layout>(...)`.',
    ],
    walkthrough: `**How to think about it.** Write the loop as if there were only one layout: start a sum at 0, and for each element \`i\` from 0 to \`n - 1\`, add the value of field \`f\`. The only question is *where* that value lives in \`buf\`, and the layout answers it with \`l.slot(i, f)\`. The interesting part is the signature: \`L\` is a type parameter, and a generic body may only use what its bounds promise.

**The solution, line by line.**

- \`fn total<L: Layout>(l: &L, buf: &[f64], n: usize, f: usize) -> f64 {\`: the bound \`L: Layout\` promises that every \`L\` callers use implements \`Layout\`, so the body may call \`slot\`. Without it, \`l.slot(i, f)\` is E0599, "no method named \`slot\` found for reference \`&L\`", and the help says exactly which bound to add.
- \`let mut s = 0.0;\` starts the sum (an \`f64\`, worked out from the literal).
- \`for i in 0..n {\` visits elements 0 to \`n - 1\`.
- \`s += buf[l.slot(i, f)];\` asks the layout for the index and adds the value there.
- \`s\` is returned.

**What the compiler makes of it.** The tests call \`total\` with \`&Aos\` and \`&Soa\`, so the test binary contains \`total::<Aos>\` and \`total::<Soa>\`. In each copy, \`l.slot\` is a direct call to one known function, and the compiler may inline its arithmetic into the loop. Compare \`read\` in *Trait objects and dyn*, which took \`&dyn Layout\`: one copy, and a vtable load on each call. Same trait, other kind of dispatch.

**Common wrong attempts.**

- Leaving the bound off does not compile (E0599, above).
- Hard-coding the AoS formula (\`buf[i * 2 + f]\`) compiles, because the bound only *allows* calling \`slot\`; it does not force you to. The SoA tests then fail: the whole point is to ask the layout.
- Taking \`l: &dyn Layout\` passes the tests too, but it is the other kind of function; the exercise asks for the generic one.`,
    wrong: [
      {
        code: `trait Layout {
    fn slot(&self, i: usize, f: usize)
        -> usize;
}

struct Aos {
    nf: usize,
}

struct Soa {
    n: usize,
}

impl Layout for Aos {
    fn slot(&self, i: usize, f: usize)
        -> usize {
        i * self.nf + f
    }
}

impl Layout for Soa {
    fn slot(&self, i: usize, f: usize)
        -> usize {
        f * self.n + i
    }
}

fn total<L>(l: &L, buf: &[f64],
    n: usize, f: usize) -> f64 {
    let mut s = 0.0;
    for i in 0..n {
        s += buf[l.slot(i, f)];
    }
    s
}`,
        why: 'This doesn’t compile: E0599, “no method named `slot` found for reference `&L`”. A generic body may only use what its bounds promise.',
      },
      {
        code: `trait Layout {
    fn slot(&self, i: usize, f: usize)
        -> usize;
}

struct Aos {
    nf: usize,
}

struct Soa {
    n: usize,
}

impl Layout for Aos {
    fn slot(&self, i: usize, f: usize)
        -> usize {
        i * self.nf + f
    }
}

impl Layout for Soa {
    fn slot(&self, i: usize, f: usize)
        -> usize {
        f * self.n + i
    }
}

fn total<L: Layout>(l: &L, buf: &[f64],
    n: usize, f: usize) -> f64 {
    let mut s = 0.0;
    for i in 0..n {
        s += buf[i * 2 + f];
    }
    s
}`,
        why: 'It compiles, but it hard-codes the AoS formula instead of asking the layout. The SoA tests fail.',
      },
    ],
  },
};

export const quiz = [
  {
    q: '`fn top<T>(xs: &[T]) -> Option<&T>` compares with `x > best`. What does rustc say?',
    options: [
      {
        t: 'Nothing: it compiles for any `T`',
        why: 'That is TypeScript’s behaviour. Rust only lets the body use what every possible `T` can do.',
      },
      {
        t: 'E0369: `>` cannot be applied to `&T`, with help suggesting a `PartialOrd` bound',
        correct: true,
        why: 'Add `T: PartialOrd` and the body may compare.',
      },
      {
        t: 'It compiles, but panics for types that can’t be compared',
        why: 'Rust checks this before the program runs.',
      },
    ],
  },
  {
    q: 'With `fn top<T: PartialOrd>`, which call is rejected?',
    options: [
      {
        t: '`top(&[3, 9, 4])`',
        why: '`i32` implements `PartialOrd`.',
      },
      {
        t: '`top(&["b", "a"])`',
        why: '`&str` implements `PartialOrd`: strings compare like dictionary words.',
      },
      {
        t: '`top(&ps)` where `ps` is an array of a struct with no derives',
        correct: true,
        why: 'E0277: can’t compare `P` with `P`; `#[derive(PartialOrd)]` would fix it.',
      },
    ],
  },
  {
    q: 'Which signature means the same as `fn show(p: &impl Plugin)`?',
    options: [
      {
        t: '`fn show<P: Plugin>(p: &P)`',
        correct: true,
        why: '`impl Trait` in a parameter is short for an anonymous type parameter with that bound.',
      },
      {
        t: '`fn show(p: &dyn Plugin)`',
        why: 'That takes a trait object, a fat pointer with a vtable, which the last chapter described.',
      },
      {
        t: '`fn show(p: &Plugin)`',
        why: 'A trait is not a type on its own (E0782).',
      },
    ],
  },
  {
    q: 'What does `impl<T> Pair<T> { fn first(&self) -> &T { &self.a } }` give you?',
    options: [
      {
        t: 'A `first` method only for `Pair<i32>`',
        why: '`impl<T>` makes it for every `T`.',
      },
      {
        t: 'A `first` method on `Pair<T>` for every type `T`',
        correct: true,
        why: '“For every `T`, here are methods of `Pair<T>`.”',
      },
      {
        t: 'A trait called `Pair`',
        why: 'It is an ordinary impl block with a type parameter.',
      },
    ],
  },
  {
    q: 'How do Rust trait bounds differ from TypeScript’s `T extends ...` constraints?',
    options: [
      {
        t: 'They are the same thing with a different keyword',
        why: 'TypeScript constraints describe a shape; Rust bounds name traits a type has implemented.',
      },
      {
        t: 'TypeScript has no way to constrain a type parameter',
        why: 'It does, with `extends`.',
      },
      {
        t: 'A Rust bound names traits, and the body may use nothing else; TypeScript constrains a shape, and even lets `>` through on a bare `T`',
        correct: true,
        why: 'Which is why the TypeScript `top` type-checks without any constraint.',
      },
    ],
  },
  {
    q: '`fn total<L: Layout>` is called with an `&Aos` and an `&Soa`. What is in the compiled program?',
    options: [
      {
        t: 'One `total`, which looks up `slot` in a vtable',
        why: 'That is `total_dyn`. A generic function is copied per type.',
      },
      {
        t: 'Two copies, `total::<Aos>` and `total::<Soa>`, each calling its own `slot` directly',
        correct: true,
        why: 'Monomorphization; `nm -C` lists both.',
      },
      {
        t: 'One `total` that checks the type of `l` with an `if`',
        why: 'No run-time check is needed: each copy knows its type.',
      },
    ],
  },
  {
    q: 'What does monomorphization cost?',
    options: [
      {
        t: 'An indirect call on every method call',
        why: 'That is the cost of `dyn`. Monomorphized calls are direct.',
      },
      {
        t: 'Nothing at all',
        why: 'Every copy must be compiled and stored.',
      },
      {
        t: 'Compile time and binary size, one copy per type used',
        correct: true,
        why: 'The rustc development guide says exactly that.',
      },
    ],
  },
  {
    q: 'Which job wants `dyn Trait` rather than a generic parameter?',
    options: [
      {
        t: 'A list of garbage-collector roots of several different types',
        correct: true,
        why: 'One slice must hold many types, which only trait objects allow; drip-rs does exactly this.',
      },
      {
        t: 'A hot loop summing a field of one known layout',
        why: 'A generic copy for that layout calls `slot` directly and may inline it.',
      },
      {
        t: 'Finding the largest element of a slice of numbers',
        why: 'One element type per call: a generic `T: PartialOrd` is the natural fit.',
      },
    ],
  },
  {
    q: 'How does V8’s monomorphic inline cache compare with a call inside a monomorphized Rust copy?',
    options: [
      {
        t: 'They are identical in every way',
        why: 'V8 learns the shape at run time and keeps a check; Rust knows the target before running.',
      },
      {
        t: 'V8 discovers the single shape by watching and keeps a guard; the Rust call is known at compile time and needs none',
        correct: true,
        why: 'Monomorphic by construction.',
      },
      {
        t: 'Rust also deoptimises when a new type arrives',
        why: 'A new type gets a new copy at compile time; nothing deoptimises.',
      },
    ],
  },
  {
    q: 'How does the Rust Viscosity CLI pick a plugin for a file?',
    options: [
      {
        t: 'It keeps a `Vec<&dyn LanguagePlugin>` and asks each one',
        why: '`dyn LanguagePlugin` is E0191 as the trait stands: its associated type must be named.',
      },
      {
        t: 'It has only a JavaScript plugin',
        why: 'It also has `PyPlugin`; `nm` lists `compile::<PyPlugin>`.',
      },
      {
        t: 'An `if` on the extension calls `compile(&src, &PyPlugin, ..)` or `compile(&src, &JsPlugin, ..)`, two monomorphized copies',
        correct: true,
        why: 'Chosen at run time, but each branch calls its own static copy.',
      },
    ],
  },
];
