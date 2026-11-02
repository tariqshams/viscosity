// Chapter 237 cards. Keys are stable ids: never rename them.

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

const ARGMAX_HEAD = `fn argmax<T: PartialOrd>(xs: &[T])
    -> Option<usize> {`;

export const prompts = {
  'gen-what': {
    q: 'What does the `<T>` in `fn first<T>(xs: &[T]) -> Option<&T>` declare?',
    a: 'A type parameter: `first` works for slices of any element type `T`, filled in at each call.',
  },
  'gen-impl': {
    q: 'How do you read `impl<T> Column<T> { ... }`?',
    a: '“For every type `T`, these are methods of `Column<T>`.”',
  },
  'gen-gc': {
    q: 'drip-rs’s `Gc<T>` is just a `u32` index. What does the `T` add?',
    a: 'Type safety: a `Gc<ObjClosure>` can only fetch an `ObjClosure`, so it can’t be mixed up with a handle to a class.',
  },
  'bound-what': {
    q: 'What does the bound in `fn top<T: PartialOrd>` allow and require?',
    a: 'It lets the body compare `T`s with `>`, and requires every caller to use a type that implements `PartialOrd`.',
  },
  'bound-why': {
    q: 'Why does `x > best` fail to compile in `fn top<T>` with no bound?',
    a: 'Nothing says an arbitrary `T` can be compared, so `>` isn’t available (E0369). The bound is the promise that it can.',
  },
  'bound-where': {
    q: 'Why does the engine’s SSA builder say `where K: Clone + Eq + Hash`?',
    a: 'It keeps variables in `HashMap`s keyed by `K`, and hash map keys must be comparable (`Eq`) and hashable (`Hash`).',
  },
  'mono-what': {
    q: 'What is **monomorphization**?',
    a: 'Compiling generic code by generating a separate copy for each set of concrete types it is used with.',
  },
  'mono-evidence': {
    q: 'A program calls `total` with `&Aos` and with `&Soa`. What does `nm -C` show in the binary?',
    a: 'Two functions, `total::<Aos>` and `total::<Soa>` (with v0 symbol mangling, which keeps type parameters in names).',
  },
  'mono-ic': {
    q: 'In what sense is a call inside a monomorphized copy like a monomorphic inline cache?',
    a: 'It can only reach one implementation. V8 discovers monomorphic sites at run time and guards them; Rust knows at compile time, so needs no check.',
  },
  'gen-vs-dyn': {
    q: 'When would you choose `&dyn Trait` over a generic parameter?',
    a: 'When one list must hold values of different types, or the type is decided at run time. Generics suit hot code over one known type.',
  },
  'engine-generic': {
    q: 'Why can’t the engine’s `LanguagePlugin` be used as `dyn LanguagePlugin` as written?',
    a: 'It has an associated type, `Extra`, which a trait object must name (E0191). So `compile` is generic over `P: LanguagePlugin`.',
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

struct Column<T> {
    data: Vec<T>,
}

impl<T> Column<T> {
    fn get(&self, i: usize)
        -> Option<&T> {
        self.data.get(i)
    }
}

fn main() {
    println!("{:?}", top(&[3, 9, 4]));
    println!("{:?}", top(&[0.5, -1.0]));
    println!("{:?}", top(&["vx", "x"]));
    let e: [i32; 0] = [];
    println!("{:?}", top(&e));
    let c = Column { data: vec![1.5] };
    println!("{:?}", c.get(0));
    // Try: remove ": PartialOrd" above.
}`,
  },
};

export const exercises = {
  totalGeneric: {
    lang: 'rust',
    title: 'Sum a field, generic over the layout',
    prompt:
      'Using last chapter’s `Layout` trait (given), write `total(l, buf, n, f)`: the sum of field `f` over elements `0..n`, reading through `l.slot`. It must be **generic** over the layout type `L`, not use `dyn`. The starter’s signature is missing something: the body won’t compile until you add the right trait bound.',
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
    walkthrough: `The body is a plain loop, the same one you would write for a single layout. The interesting part is the signature.

- **Without a bound** \`l.slot(i, f)\` doesn’t compile: for an arbitrary \`L\` the compiler can’t assume a \`slot\` method exists. It even suggests the fix.
- **\`L: Layout\`** promises that every \`L\` callers use implements the trait, so the body may call \`slot\`.
- **Monomorphization.** The tests call \`total\` with \`&Aos\` and \`&Soa\`, so the test binary contains \`total::<Aos>\` and \`total::<Soa>\`. In each copy, \`l.slot\` is a direct call to one known function: no vtable, and the compiler may inline the arithmetic into the loop.

Compare \`read\` in chapter 236, which took \`&dyn Layout\`: one copy, and a vtable load for each element. Same trait, other kind of dispatch.`,
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
  argmax: {
    lang: 'rust',
    optional: true,
    title: 'Where is the biggest?',
    prompt:
      'Write `argmax(xs)`: the index of the largest element, or `None` for an empty slice. If several elements tie for largest, return the **first**. It must work for any `T: PartialOrd`: numbers, floats and strings.',
    starter: `${ARGMAX_HEAD}
    todo!()
}`,
    solution: `${ARGMAX_HEAD}
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
    assert_eq!(argmax(&["vx", "x", "mass"]), Some(1));
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
      'Return early for an empty slice: `xs.get(0)?;` does it in one line.',
      'Keep the index of the best so far, starting at 0, and compare `xs[i] > xs[best]` for the rest.',
      'Use `>`, not `>=`, so a later equal element doesn’t replace the first.',
    ],
    walkthrough: `\`PartialOrd\` is the bound that gives you \`>\`, so the body can compare two \`T\`s without knowing what they are. The compiler makes one copy of \`argmax\` for \`i32\`, one for \`f64\` and one for \`&str\`, each with its own comparison built in.

\`xs.get(0)?;\` throws its value away: it is there only for the early \`None\`. Comparing with \`>\` keeps the first of several equal maxima, which the tie test checks.`,
    wrong: [
      {
        code: `${ARGMAX_HEAD}
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
    ],
  },
};

export const quiz = [
  {
    q: 'What does the compiled program contain for `fn first<T>` called with `&[i32]` and with `&[&str]`?',
    options: [
      { t: 'One function that works on any type, as in JavaScript after type erasure', why: 'That is TypeScript’s model. Rust doesn’t erase type parameters.' },
      { t: 'Nothing: generic functions are always inlined away', why: 'Inlining is up to the optimizer; monomorphization makes the copies either way.' },
      { t: 'Two copies, one with `T = i32` and one with `T = &str`', correct: true, why: 'Monomorphization: one ordinary function per set of concrete types used.' },
    ],
  },
  {
    q: 'Why doesn’t `fn top<T>(xs: &[T])` compile when its body uses `x > best`?',
    options: [
      { t: 'Generic functions can’t contain loops', why: 'They can contain anything.' },
      { t: 'Nothing promises that `T` can be compared; the bound `T: PartialOrd` would (E0369)', correct: true, why: 'A generic body may only use what its bounds guarantee.' },
      { t: '`>` only works on `i32` in Rust', why: '`>` works on any type that implements `PartialOrd`, including `f64` and `&str`.' },
      { t: 'You must write `top::<i32>` instead', why: 'Spelling the type out at the call doesn’t change what the body may assume.' },
    ],
  },
  {
    q: 'Which signature means the same as `fn show(p: &impl Plugin)`?',
    options: [
      { t: '`fn show(p: &dyn Plugin)`', why: 'That takes a trait object: one copy of `show`, with dynamic dispatch.' },
      { t: '`fn show<P>(p: &P)`', why: 'Without a bound the body couldn’t call `Plugin` methods.' },
      { t: '`fn show(p: &Plugin)`', why: 'A bare trait name isn’t a type in edition 2021; trait objects need `dyn`.' },
      { t: '`fn show<P: Plugin>(p: &P)`', correct: true, why: '`impl Trait` in an argument is short for a generic parameter with that bound.' },
    ],
  },
  {
    q: 'Inside `total::<Aos>`, how is `l.slot(i, f)` called?',
    options: [
      { t: 'Through a vtable, like `&dyn Layout`', why: 'There is no vtable here: `l` is an `&Aos`.' },
      { t: 'Directly: it can only be `Aos::slot`, so the compiler may inline it', correct: true, why: 'Static dispatch. The call site is monomorphic by construction.' },
      { t: 'By looking `slot` up by name at run time', why: 'Rust never looks methods up by name at run time.' },
    ],
  },
  {
    q: 'How does a call in a monomorphized copy compare with a monomorphic inline cache in V8?',
    options: [
      { t: 'They are the same mechanism', why: 'One is decided by the Rust compiler ahead of time, the other observed by V8 at run time.' },
      { t: 'V8’s is faster because it watched the program run', why: 'This chapter measured nothing, and makes no speed claim.' },
      { t: 'Both reach one known target, but V8 learns it at run time and must keep a shape check, while Rust knows it at compile time and needs none', correct: true, why: 'Maglev emits a check plus a fixed load; the Rust copy simply calls one function.' },
      { t: 'Rust generics are megamorphic', why: 'Each copy sees exactly one type.' },
    ],
  },
  {
    q: 'Why is the engine’s `compile` written `fn compile<P: LanguagePlugin>(...)` and not with `&dyn LanguagePlugin`?',
    options: [
      { t: 'The trait has an associated type, `Extra`, which `dyn LanguagePlugin` would have to name (E0191)', correct: true, why: 'Plugins with different private data can’t share one trait-object type as the trait stands.' },
      { t: '`dyn` is not allowed in library crates', why: 'It is allowed anywhere; drip-rs’s collector uses `&[&dyn Trace]`.' },
      { t: 'Generics compile faster', why: 'More copies means more code to compile, if anything.' },
    ],
  },
];
