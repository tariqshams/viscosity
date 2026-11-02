// Chapter 376 cards. Keys are stable ids: never rename them.

export const prompts = {
  'dyn-loads': {
    q: 'What does a call through `&dyn Shape` do before it jumps?',
    a: 'Loads the vtable pointer from the fat pointer, then loads the method’s address from a fixed slot in the vtable; then it makes an indirect call.',
  },
  'dyn-inline': {
    q: 'Why could rustc vectorise `total::<Sq>` but not `total_dyn`?',
    a: 'In the generic copy it knew the body of `area` and inlined it; through `dyn` the body is unknown until run time, so it can only call it, one element at a time.',
  },
  'dyn-enum': {
    q: 'When is an `enum` a better choice than `dyn Trait` for a set of types?',
    a: 'When you know every type in advance: the values sit side by side without boxes and the `match` can be inlined.',
  },
  'dyn-hoist': {
    q: 'How do you keep `dyn` but take its cost out of a hot loop?',
    a: 'Make the dyn call once per collection (a trait method that runs the whole loop inside), not once per element.',
  },
  'compat-clone': {
    q: 'Why can’t you write `Box<dyn Clone>`?',
    a: '`Clone` requires `Self: Sized` (its `clone` returns `Self`), so no vtable can be built for it (E0038).',
  },
  'compat-generic': {
    q: 'Why does a generic method like `fn put<T>(&self, x: T)` make a trait not dyn compatible?',
    a: 'A vtable has one slot per method, but a generic method would need a separate compiled copy for every `T`.',
  },
  'compat-fix': {
    q: 'What does adding `where Self: Sized` to one method of a trait do?',
    a: 'It leaves that method out of the vtable: concrete types can still call it, `dyn Trait` cannot, and the trait becomes usable as `dyn`.',
  },
  'compat-trace': {
    q: 'Why can drip-rs’s collector take its roots as `&[&dyn Trace]`?',
    a: '`Trace` has one method, `trace(&self, ...)`, with no generics and no `Self` outside the receiver, so it is dyn compatible.',
  },
};

export const examples = {
  'dyn-vs-enum': {
    lang: 'rust',
    title: 'dyn, an enum, and their sizes',
    code: `use std::mem::size_of;

trait Shape {
    fn area(&self) -> f64;
}
struct Sq(f64);
struct Disc(f64);
impl Shape for Sq {
    fn area(&self) -> f64 {
        self.0 * self.0
    }
}
impl Shape for Disc {
    fn area(&self) -> f64 {
        3.14159 * self.0 * self.0
    }
}

// The same set, closed: an enum.
enum Fig {
    Sq(f64),
    Disc(f64),
}
fn area(f: &Fig) -> f64 {
    match f {
        Fig::Sq(s) => s * s,
        Fig::Disc(r) => 3.14159 * r * r,
    }
}

fn main() {
    let a = size_of::<&Sq>();
    let b = size_of::<&dyn Shape>();
    println!("&Sq {a}, &dyn Shape {b}");

    let xs: Vec<Box<dyn Shape>> = vec![
        Box::new(Sq(2.0)),
        Box::new(Disc(1.0)),
    ];
    let t: f64 =
        xs.iter().map(|s| s.area())
            .sum();
    println!("dyn:  {t:.3}");

    let ys = [
        Fig::Sq(2.0),
        Fig::Disc(1.0),
    ];
    let u: f64 =
        ys.iter().map(area).sum();
    println!("enum: {u:.3}");
    let n = size_of::<Fig>();
    println!("Fig is {n} bytes");
}`,
  },
};

const TYPES = `struct Sq(f64);
struct Rect(f64, f64);

impl Shape for Sq {
    fn area(&self) -> f64 {
        self.0 * self.0
    }
    fn scaled(&self, k: f64) -> Self {
        Sq(self.0 * k)
    }
}

impl Shape for Rect {
    fn area(&self) -> f64 {
        self.0 * self.1
    }
    fn scaled(&self, k: f64) -> Self {
        Rect(self.0 * k, self.1 * k)
    }
}`;

const TRAIT_BAD = `trait Shape {
    fn area(&self) -> f64;
    fn scaled(&self, k: f64) -> Self;
}`;

const TRAIT_OK = `trait Shape {
    fn area(&self) -> f64;
    fn scaled(&self, k: f64) -> Self
    where
        Self: Sized;
}`;

const TOTAL = `fn total(xs: &[Box<dyn Shape>]) -> f64 {
    xs.iter().map(|s| s.area()).sum()
}`;

export const exercises = {
  dynShapes: {
    lang: 'rust',
    title: 'Make Shape dyn compatible',
    prompt:
      'This `Shape` trait cannot be used as `dyn Shape`, because `scaled` returns `Self`, so the code does not compile. Change the trait so that `Box<dyn Shape>` is allowed while `Sq(2.0).scaled(3.0)` still works on concrete types, and write `total(xs)`, which adds up the areas of a slice of boxed shapes.',
    starter: `${TRAIT_BAD}

${TYPES}

fn total(xs: &[Box<dyn Shape>]) -> f64 {
    0.0
}`,
    solution: `${TRAIT_OK}

${TYPES}

${TOTAL}`,
    tests: `#[test]
fn total_adds_the_areas() {
    let xs: Vec<Box<dyn Shape>> = vec![
        Box::new(Sq(2.0)),
        Box::new(Rect(1.0, 3.0)),
    ];
    assert_eq!(total(&xs), 7.0);
}
#[test]
fn an_empty_list_has_no_area() {
    assert_eq!(total(&[]), 0.0);
}
#[test]
fn scaled_still_works_on_concrete_types() {
    assert_eq!(Sq(2.0).scaled(3.0).area(), 36.0);
    let r = Rect(1.0, 2.0).scaled(2.0);
    assert_eq!(r.area(), 8.0);
}`,
    hints: [
      'Read the error first: rustc says `scaled` references the `Self` type in its return type. That method is the only thing stopping a vtable from being built.',
      'You do not have to delete `scaled`. A bound on the method itself can say “only for types whose size is known”, which leaves it out of the vtable.',
      'Write the declaration as `fn scaled(&self, k: f64) -> Self where Self: Sized;` (the `where` clause can go on its own lines). Then `total` is `xs.iter().map(|s| s.area()).sum()`.',
    ],
    walkthrough: `**How to think about it.** Two separate things are asked: make the trait dyn compatible, and sum the areas. Start with the error, because nothing runs until it is gone. rustc's E0038 says \`Shape\` "is not dyn compatible ... because method \`scaled\` references the \`Self\` type in its return type". A vtable entry must have one fixed signature, and a \`dyn Shape\` caller does not know how big \`Self\` is, so it cannot receive one. The tests still call \`scaled\` on \`Sq\` and \`Rect\`, so deleting the method is not an option. The tool for exactly this case is \`where Self: Sized\` on that one method: it promises the method is only ever called on a type of known size, which means never through \`dyn\`, so rustc leaves it out of the vtable.

**The solution, line by line.**

- \`trait Shape {\` opens the trait.
- \`fn area(&self) -> f64;\` is an ordinary dispatchable method: a \`&self\` receiver, no generics, no \`Self\` elsewhere. It gets a slot in the vtable.
- \`fn scaled(&self, k: f64) -> Self where Self: Sized;\` (written over three lines) keeps the method for concrete types. \`Sq\` and \`Rect\` both have a known size, so their impls do not change at all, and \`Sq(2.0).scaled(3.0)\` still compiles. \`dyn Shape\` has no known size, so on a trait object \`scaled\` simply does not exist.
- The two impls are unchanged from the starter.
- \`fn total(xs: &[Box<dyn Shape>]) -> f64 {\` takes a borrowed slice of boxes, so it can sum any mix of shapes without taking ownership.
- \`xs.iter().map(|s| s.area()).sum()\` walks the slice (\`s\` is a \`&Box<dyn Shape>\`), calls \`area\` through the vtable for each one, and adds the results. \`sum\` knows to produce an \`f64\` from the function's return type. For an empty slice the sum is \`0.0\`.

Each \`s.area()\` here is one dyn call per element, the pattern the chapter calls the most expensive; for a handful of shapes that does not matter, and it is the price of holding a \`Sq\` and a \`Rect\` in one list.

**Common wrong attempts.**

- Writing \`total\` but leaving the trait alone. The starter's error remains (E0038), so nothing compiles.
- Deleting \`scaled\` from the trait. \`Box<dyn Shape>\` now works, but the impls' \`scaled\` methods are no longer part of any trait, so rustc rejects them (E0407, "method \`scaled\` is not a member of trait \`Shape\`"). Moving them into a separate \`impl Sq\` block would work, but then \`scaled\` is no longer something a generic \`S: Shape\` can call.
- Adding \`where Self: Sized\` to the whole trait (\`trait Shape: Sized\`). That makes \`Sized\` a supertrait, which the Reference lists as one of the things that rule \`dyn\` out entirely.`,
    wrong: [
      {
        code: `${TRAIT_BAD}

${TYPES}

${TOTAL}`,
        why: 'The trait is unchanged, so `Box<dyn Shape>` is still rejected with E0038 and nothing compiles.',
      },
      {
        code: `trait Shape: Sized {
    fn area(&self) -> f64;
    fn scaled(&self, k: f64) -> Self;
}

${TYPES}

${TOTAL}`,
        why: '`Sized` as a supertrait makes the whole trait dyn incompatible, so `dyn Shape` is still an error.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'In the chapter’s listings, why does `total::<Sq>` handle eight shapes per loop trip while `total_dyn` handles one?',
    options: [
      { t: 'Generic code is always unrolled eight times.', why: 'Unrolling and vectorising are optimisations, possible here only because the body of `area` was visible.' },
      { t: '`area` was inlined into the generic copy, so the compiler could vectorise the squares and adds; the dyn loop can only call an unknown function.', correct: true, why: 'Static dispatch lets the body be inlined; dynamic dispatch hides it until run time.' },
      { t: 'The dyn version uses 64-bit numbers.', why: 'Both use `u32`; the difference is the call.' },
    ],
  },
  {
    q: 'Which of these is NOT one of the costs of `Vec<Box<dyn Shape>>` compared with `Vec<Sq>`?',
    options: [
      { t: 'Each element is a separate heap allocation reached through a pointer.', why: 'That is a real cost: pointer chasing.' },
      { t: 'Each call loads a function pointer and jumps indirectly.', why: 'That is the call itself.' },
      { t: 'The method names are looked up by string at run time.', correct: true, why: 'Unlike a JavaScript property lookup, a dyn call uses a fixed slot number chosen at compile time; there is no lookup by name.' },
      { t: 'Each element pointer is two words wide.', why: 'True: `&dyn` and `Box<dyn>` are fat pointers.' },
    ],
  },
  {
    q: 'What does rustc 1.97 say about `Box<dyn Clone>`?',
    options: [
      { t: 'E0038: `Clone` is not dyn compatible, because it requires `Self: Sized`.', correct: true, why: 'That is the error and its note.' },
      { t: 'It compiles; the box clones its contents.', why: 'No vtable can be built for `clone`, which returns `Self`.' },
      { t: 'E0277: `Clone` is not implemented for `i32`.', why: '`i32` does implement `Clone`; the problem is the trait object.' },
    ],
  },
  {
    q: 'A trait has `fn log<T: Debug>(&self, x: T);`. Why can’t it be used as `dyn`?',
    options: [
      { t: 'Because `Debug` is not dyn compatible.', why: '`Debug` is dyn compatible; the problem is the type parameter on the method.' },
      { t: 'Because methods taking `&self` are never dispatchable.', why: '`&self` is the usual dispatchable receiver.' },
      { t: 'Because a generic method has one compiled copy per `T`, and a vtable has room for only one entry per method.', correct: true, why: 'rustc reports that the method “has generic type parameters”.' },
    ],
  },
  {
    q: 'Viscosity decides a collection’s layout at run time. Where should a `dyn Layout` call go for speed?',
    options: [
      { t: 'Inside the loop, once per particle.', why: 'That pays the dispatch cost, and the lost inlining, for every element.' },
      { t: 'Outside the loop: one dyn call per collection, which then runs a loop compiled for its own layout.', correct: true, why: 'The hot loop is then ordinary static code that can be inlined and vectorised.' },
      { t: 'It makes no difference; dyn calls are free.', why: 'They are cheap one at a time, but the lost optimisation adds up in hot loops.' },
    ],
  },
];
