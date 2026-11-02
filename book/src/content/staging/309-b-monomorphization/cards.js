// Chapter 309-b cards. Keys are stable ids: never rename them.

const LAYOUT = `trait Layout {
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
`;

export const prompts = {
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
    a: 'It can only reach `Aos::slot`, and that is known before the program runs, so no guard or deoptimization is needed.',
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
  'mono-play': {
    lang: 'rust',
    title: 'A generic and a dyn version',
    code: `${LAYOUT}
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
  totalGeneric: {
    lang: 'rust',
    title: 'Sum a field, generic over the layout',
    prompt:
      'Using the `Layout` trait and its two impls from the chapter *Traits* (given), write `total(l, buf, n, f)`: the sum of field `f` over elements `0..n`, reading through `l.slot`. It must be **generic** over the layout type `L`, not use `dyn`. The starter’s signature is missing something: the body won’t compile until you add the right trait bound.',
    starter: `${LAYOUT}
fn total<L>(l: &L, buf: &[f64],
    n: usize, f: usize) -> f64 {
    todo!()
}`,
    solution: `${LAYOUT}
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
        code: `${LAYOUT}
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
        code: `${LAYOUT}
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
    q: '`fn total<L: Layout>` is called with an `&Aos` and an `&Soa`. What is in the compiled program?',
    options: [
      { t: 'One `total`, which looks up `slot` in a vtable', why: 'That is `total_dyn`. A generic function is copied per type.' },
      { t: 'Two copies, `total::<Aos>` and `total::<Soa>`, each calling its own `slot` directly', correct: true, why: 'Monomorphization; `nm -C` lists both.' },
      { t: 'One `total` that checks the type of `l` with an `if`', why: 'No run-time check is needed: each copy knows its type.' },
    ],
  },
  {
    q: 'What does monomorphization cost?',
    options: [
      { t: 'An indirect call on every method call', why: 'That is the cost of `dyn`. Monomorphized calls are direct.' },
      { t: 'Nothing at all', why: 'Every copy must be compiled and stored.' },
      { t: 'Compile time and binary size, one copy per type used', correct: true, why: 'The rustc development guide says exactly that.' },
    ],
  },
  {
    q: 'Which job wants `dyn Trait` rather than a generic parameter?',
    options: [
      { t: 'A list of garbage-collector roots of several different types', correct: true, why: 'One slice must hold many types, which only trait objects allow; drip-rs does exactly this.' },
      { t: 'A hot loop summing a field of one known layout', why: 'A generic copy for that layout calls `slot` directly and may inline it.' },
      { t: 'Finding the largest element of a slice of numbers', why: 'One element type per call: a generic `T: PartialOrd` is the natural fit.' },
    ],
  },
  {
    q: 'How does V8’s monomorphic inline cache compare with a call inside a monomorphized Rust copy?',
    options: [
      { t: 'They are identical in every way', why: 'V8 learns the shape at run time and keeps a check; Rust knows the target before running.' },
      { t: 'V8 discovers the single shape by watching and keeps a guard; the Rust call is known at compile time and needs none', correct: true, why: 'Monomorphic by construction.' },
      { t: 'Rust also deoptimizes when a new type arrives', why: 'A new type gets a new copy at compile time; nothing deoptimizes.' },
    ],
  },
  {
    q: 'How does the Rust Viscosity CLI pick a plugin for a file?',
    options: [
      { t: 'It keeps a `Vec<&dyn LanguagePlugin>` and asks each one', why: '`dyn LanguagePlugin` is E0191 as the trait stands: its associated type must be named.' },
      { t: 'It has only a JavaScript plugin', why: 'It also has `PyPlugin`; `nm` lists `compile::<PyPlugin>`.' },
      { t: 'An `if` on the extension calls `compile(&src, &PyPlugin, ..)` or `compile(&src, &JsPlugin, ..)`, two monomorphized copies', correct: true, why: 'Chosen at run time, but each branch calls its own static copy.' },
    ],
  },
];
