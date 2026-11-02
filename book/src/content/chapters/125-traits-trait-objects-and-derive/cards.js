// Chapter 193 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.
// Merged from old chapters 125, 125, 125.

export const prompts = {
  'trait-what': {
    q: 'What is a Rust trait?',
    a: 'A named set of methods that types can implement, each type with an `impl Trait for Type` block.',
  },
  'trait-default': {
    q: 'What is a default method in a trait?',
    a: 'A method with a body in the trait itself. Implementing types get it for free and may override it.',
  },
  'trait-impl': {
    q: 'What must an `impl Trait for Type` block contain?',
    a: 'A definition of every required method of the trait (default methods are optional).',
  },
  'trait-missing': {
    q: 'An impl block leaves out one required method. What does rustc say?',
    a: 'E0046: not all trait items implemented, missing: `name`.',
  },
  nominal: {
    q: 'A struct has methods `id` and `exts` but no `impl Plugin` block. Is it a `Plugin`?',
    a: 'No. Traits are nominal: only an impl block makes a type implement a trait (E0277 otherwise).',
  },
  orphan: {
    q: 'Can you write `impl Display for Vec<i32>` in your own crate?',
    a: 'No. The orphan rule: you must have defined the trait or the type yourself.',
  },
  derive: {
    q: 'What does `#[derive(Debug, PartialEq)]` above a struct do?',
    a: 'The compiler writes the `Debug` and `PartialEq` impls for you, so `{:?}` and `==` work.',
  },
  'copy-trait': {
    q: 'What changes when a struct of `f64` fields derives `Clone, Copy`?',
    a: 'Assignment and passing copy the value instead of moving it, so the old variable stays usable.',
  },
  'dyn-what': {
    q: 'What does the type `&dyn Plugin` mean?',
    a: 'A reference to some value whose type implements `Plugin`, without saying which type.',
  },
  'dyn-needed': {
    q: 'Why is `vec![&Js, &Py]` rejected, and what fixes it?',
    a: 'A `Vec` has one element type, and `&Js` and `&Py` differ (E0308). Ask for `Vec<&dyn Plugin>`.',
  },
  'dyn-e0782': {
    q: 'What does rustc say about `Vec<&Plugin>`, without `dyn`?',
    a: 'E0782: expected a type, found a trait; it suggests adding `dyn`.',
  },
  fat: {
    q: 'What two pointers make up a `&dyn Trait`?',
    a: 'One to the value (the data) and one to the vtable for that value’s type.',
  },
  'dyn-box': {
    q: 'When would you use `Box<dyn Plugin>` rather than `&dyn Plugin`?',
    a: 'When the collection should own its plugins (on the heap) instead of borrowing values that live elsewhere.',
  },
  'dyn-cost': {
    q: 'What does a call through `&dyn Trait` cost compared with a direct call?',
    a: 'An indirect call through a function pointer loaded from the vtable, which also stops the compiler inlining it.',
  },
  'vtable-vs-ic': {
    q: 'How does a `dyn` call differ from a JavaScript method call that V8 speeds up with an inline cache?',
    a: 'It never looks a name up: methods are numbered at compile time, so the call reads a fixed vtable slot.',
  },
  trace: {
    q: 'Why does drip-rs’s collector take its roots as `&[&dyn Trace]`?',
    a: 'The roots have different types (the VM’s stack and globals, the compiler’s functions), and `dyn` lets one slice hold them all.',
  },
  'op-desugar': {
    q: 'What does rustc turn `a + b` into?',
    a: '`Add::add(a, b)`: a call to the `add` method of the `Add` trait for `a`’s type.',
  },
  'op-rhs': {
    q: 'What does the `f64` in `impl Mul<f64> for V2` choose?',
    a: 'The type on the right of `*` (the `Rhs` parameter), so `v * 2.0` is allowed. The result type is the associated `Output`.',
  },
  'op-byvalue': {
    q: 'Why does a vector type with `Add` usually also derive `Copy`?',
    a: '`add` takes both sides by value, so without `Copy` the expression `a + b` would move `a` and `b`.',
  },
  'op-index': {
    q: 'What is `heap[h]` compiled as?',
    a: '`*Index::index(&heap, h)`: `index` returns a reference and rustc dereferences it (`IndexMut` when the place is assigned to).',
  },
  'derive-what': {
    q: 'What does `#[derive(PartialEq)]` write for a struct?',
    a: 'An `eq` that is true when every field is equal, using each field’s own `PartialEq`.',
  },
  'derive-fields': {
    q: 'Why does `#[derive(Copy)]` fail on `struct Tok { text: String, line: u32 }`?',
    a: 'Every field must implement the trait, and `String` is not `Copy` (E0204).',
  },
  'derive-display': {
    q: 'Why can’t `Display` be derived?',
    a: 'It is for users, and only you know how a value should look to them; no field-by-field rule would be right.',
  },
  'derive-bound': {
    q: 'Why does drip-rs write `Clone` for `Gc<T>` by hand instead of deriving it?',
    a: 'Derive would add a `T: Clone` bound, but a handle is just an index and can always be copied, whatever `T` is.',
  },
};

export const examples = {
  'trait-play': {
    lang: 'rust',
    title: 'A trait, two impls and a derive',
    code: `trait Plugin {
    fn id(&self) -> &str;
    fn exts(&self) -> &[&str];
    fn handles(&self, f: &str) -> bool {
        for e in self.exts() {
            if f.ends_with(e) {
                return true;
            }
        }
        false
    }
}

struct Js;
struct Py;

impl Plugin for Js {
    fn id(&self) -> &str {
        "javascript"
    }
    fn exts(&self) -> &[&str] {
        &[".js", ".mjs"]
    }
}

impl Plugin for Py {
    fn id(&self) -> &str {
        "python"
    }
    fn exts(&self) -> &[&str] {
        &[".py"]
    }
}

#[derive(Debug, Clone, Copy, PartialEq)]
struct P {
    x: f64,
    y: f64,
}

fn main() {
    println!("{}", Js.id());
    println!("{}", Js.handles("a.mjs"));
    println!("{}", Py.handles("a.mjs"));
    let a = P { x: 1.0, y: 2.0 };
    let b = a;
    println!("{:?} {}", a, a == b);
}`,
  },
  'dyn-play': {
    lang: 'rust',
    title: 'Plugins behind dyn',
    code: `trait Plugin {
    fn id(&self) -> &str;
    fn exts(&self) -> &[&str];
    fn handles(&self, f: &str) -> bool {
        for e in self.exts() {
            if f.ends_with(e) {
                return true;
            }
        }
        false
    }
}

struct Js;
struct Py;

impl Plugin for Js {
    fn id(&self) -> &str {
        "javascript"
    }
    fn exts(&self) -> &[&str] {
        &[".js", ".mjs"]
    }
}

impl Plugin for Py {
    fn id(&self) -> &str {
        "python"
    }
    fn exts(&self) -> &[&str] {
        &[".py"]
    }
}

fn main() {
    let ps: Vec<&dyn Plugin> =
        vec![&Js, &Py];
    for f in ["a.mjs", "b.py", "c.rb"] {
        let mut who = "none";
        for p in &ps {
            if p.handles(f) {
                who = p.id();
            }
        }
        println!("{} -> {}", f, who);
    }
    use std::mem::size_of;
    let one = size_of::<&Js>();
    let two = size_of::<&dyn Plugin>();
    println!("{} {}", one, two);
}`,
  },
  'particle-ops': {
    lang: 'rust',
    title: 'Particles with + and +=',
    code: `use std::ops::{Add, AddAssign, Mul};

#[derive(Debug, Clone, Copy)]
#[derive(PartialEq, Default)]
struct V2 {
    x: f64,
    y: f64,
}

impl Add for V2 {
    type Output = V2;
    fn add(self, o: V2) -> V2 {
        V2 {
            x: self.x + o.x,
            y: self.y + o.y,
        }
    }
}

impl Mul<f64> for V2 {
    type Output = V2;
    fn mul(self, k: f64) -> V2 {
        V2 {
            x: self.x * k,
            y: self.y * k,
        }
    }
}

impl AddAssign for V2 {
    fn add_assign(&mut self, o: V2) {
        *self = *self + o;
    }
}

#[derive(Debug, Default)]
struct Particle {
    pos: V2,
    vel: V2,
}

fn main() {
    let mut p = Particle {
        vel: V2 { x: 1.0, y: 0.5 },
        ..Default::default()
    };
    let dt = 0.5;
    for _ in 0..4 {
        p.pos += p.vel * dt;
    }
    println!("{:?}", p.pos);
    let back = V2 { x: 2.0, y: 1.0 };
    println!("{}", p.pos == back);
    println!("{p:?}");
}`,
  },
};

export const exercises = {
  layouts: {
    lang: 'rust',
    title: 'Two layouts, one trait',
    prompt: 'A flat buffer of `f64`s stores `n` elements (particles, say) with `nf` fields each. The trait method `slot(i, f)` says at which index of the buffer element `i`’s field `f` lives. Implement it for `Aos`, which keeps each element’s fields together (`x0 vx0 x1 vx1 …`), and for `Soa`, which keeps one column per field (`x0 x1 x2 … vx0 vx1 …`). Each struct stores only what its formula needs.',
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
        todo!()
    }
}

impl Layout for Soa {
    fn slot(&self, i: usize, f: usize)
        -> usize {
        todo!()
    }
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
}`,
    tests: `#[test]
fn aos_keeps_an_element_together() {
    let l = Aos { nf: 2 };
    assert_eq!(l.slot(0, 0), 0);
    assert_eq!(l.slot(0, 1), 1);
    assert_eq!(l.slot(3, 1), 7);
}
#[test]
fn soa_keeps_a_field_together() {
    let l = Soa { n: 5 };
    assert_eq!(l.slot(3, 0), 3);
    assert_eq!(l.slot(3, 1), 8);
}
#[test]
fn both_read_the_same_particle() {
    // three particles: x = 0,1,2; vx = 10,11,12
    let aos = [0.0, 10.0, 1.0, 11.0, 2.0, 12.0];
    let soa = [0.0, 1.0, 2.0, 10.0, 11.0, 12.0];
    let a = Aos { nf: 2 };
    let s = Soa { n: 3 };
    assert_eq!(aos[a.slot(2, 1)], 12.0);
    assert_eq!(soa[s.slot(2, 1)], 12.0);
    assert_eq!(soa[s.slot(1, 0)], 1.0);
}`,
    hints: [
      'Write a small buffer out by hand for each layout (three particles, two fields) and number the slots. Where is particle 2’s `vx` in each?',
      'In AoS, element `i` starts at `i * nf`, and field `f` is `f` places further on. In SoA, field `f`’s column starts at `f * n`, and element `i` is `i` places into it.',
      'The two bodies are `i * self.nf + f` and `f * self.n + i`. Each is the method’s last expression, so it is the value returned.',
    ],
    walkthrough: `**How to think about it.** This is the picture of *AoS vs SoA, measured*, written as arithmetic. Lay out three particles with fields \`x\` and \`vx\` both ways and number the slots. AoS: \`x0 vx0 x1 vx1 x2 vx2\`, so particle 2's \`vx\` is slot 5. SoA: \`x0 x1 x2 vx0 vx1 vx2\`, so it is also slot 5 here, but particle 1's \`x\` is slot 1 in both and particle 0's \`vx\` is slot 1 in AoS and slot 3 in SoA. The trait is the promise "give me an element and a field and I will tell you the slot"; each struct keeps that promise its own way.

**The solution, line by line.**

- \`impl Layout for Aos {\` signs \`Aos\` up for the trait; without this line, \`Aos\` would not be a \`Layout\` even with a \`slot\` method.
- \`fn slot(&self, i: usize, f: usize) -> usize {\` repeats the trait's signature exactly; \`&self\` because computing a slot reads the struct and changes nothing.
- \`i * self.nf + f\`: element \`i\` occupies \`nf\` neighbouring slots starting at \`i * nf\`, and field \`f\` is \`f\` slots into that group. For \`nf = 2\`, element 3's field 1 is \`3 * 2 + 1 = 7\`.
- \`impl Layout for Soa {\` signs up the second type.
- \`f * self.n + i\`: the buffer is \`nf\` columns of \`n\` slots each; field \`f\`'s column starts at \`f * n\`, and element \`i\` is \`i\` slots into it. For \`n = 5\`, element 3's field 1 is \`1 * 5 + 3 = 8\`.

Notice what each struct stores: \`Aos\` needs the number of fields, \`Soa\` the number of elements. The trait hides that difference from whoever calls \`slot\`, which is the whole point, and the next chapter calls it through a single \`&dyn Layout\` that could be either.

**Common wrong attempts.**

- Using the AoS formula for SoA (\`i * self.n + f\`) walks along elements instead of down a column.
- Swapping the AoS formula (\`f * self.nf + i\`) treats the field as the group: element 3's field 1 would be slot 5, which belongs to particle 2.`,
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
        i * self.n + f
    }
}`,
        why: 'That is the AoS formula with `n` in place of `nf`: it walks along elements, not down a column. In SoA the field picks the column: `f * n + i`.',
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
        f * self.nf + i
    }
}

impl Layout for Soa {
    fn slot(&self, i: usize, f: usize)
        -> usize {
        f * self.n + i
    }
}`,
        why: 'The AoS formula is swapped. In AoS the element number picks the group of `nf` slots: `i * nf + f`.',
      },
    ],
  },
  readDyn: {
    lang: 'rust',
    title: 'Reading through any layout',
    prompt: 'The `Layout` trait and its `Aos` and `Soa` impls from the last chapter are given. Write `read(l, buf, i, f)`, which returns element `i`’s field `f` from the flat buffer `buf`, for whichever layout `l` turns out to be. `l` is a `&dyn Layout`, so `read` is compiled once and works for both.',
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

fn read(l: &dyn Layout, buf: &[f64],
    i: usize, f: usize) -> f64 {
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

fn read(l: &dyn Layout, buf: &[f64],
    i: usize, f: usize) -> f64 {
    buf[l.slot(i, f)]
}`,
    tests: `#[test]
fn reads_aos() {
    // three particles: x = 0,1,2; vx = 10,11,12
    let aos = [0.0, 10.0, 1.0, 11.0, 2.0, 12.0];
    let a = Aos { nf: 2 };
    assert_eq!(read(&a, &aos, 2, 1), 12.0);
    assert_eq!(read(&a, &aos, 1, 0), 1.0);
}
#[test]
fn reads_soa() {
    let soa = [0.0, 1.0, 2.0, 10.0, 11.0, 12.0];
    let s = Soa { n: 3 };
    assert_eq!(read(&s, &soa, 2, 1), 12.0);
    assert_eq!(read(&s, &soa, 1, 0), 1.0);
}
#[test]
fn one_list_both_layouts() {
    let aos = [0.0, 10.0, 1.0, 11.0, 2.0, 12.0];
    let soa = [0.0, 1.0, 2.0, 10.0, 11.0, 12.0];
    let (a, s) = (Aos { nf: 2 }, Soa { n: 3 });
    let ls: Vec<(&dyn Layout, &[f64])> =
        vec![(&a, &aos), (&s, &soa)];
    for (l, buf) in ls {
        assert_eq!(read(l, buf, 0, 1), 10.0);
        assert_eq!(read(l, buf, 2, 0), 2.0);
    }
}`,
    hints: [
      '`read` does not need to know which layout it has: the layout itself knows where the value is.',
      'Ask the layout for the index with `l.slot(i, f)`; that call goes through the vtable to `Aos::slot` or `Soa::slot`.',
      'Then index the buffer with it: the whole body is `buf[l.slot(i, f)]`.',
    ],
    walkthrough: `**How to think about it.** Each layout already answers "where is element \`i\`'s field \`f\`?" through its \`slot\` method; \`read\` only has to ask and then look. The interesting part is that \`l\` is a trait object, so \`read\` has no idea, while it runs, whether it is talking to an \`Aos\` or a \`Soa\`.

**The solution, line by line.**

- \`fn read(l: &dyn Layout, buf: &[f64], i: usize, f: usize) -> f64 {\` takes a fat pointer to some layout, a borrowed slice of numbers, and the element and field wanted.
- \`buf[l.slot(i, f)]\`: \`l.slot(i, f)\` loads \`slot\`'s entry from \`l\`'s vtable and calls it with \`l\`'s data pointer as \`self\`, giving an index; indexing the slice with it reads the number (and would panic if the index were out of range). As the last expression it is the return value.

In the last test one \`Vec\` holds an \`Aos\` and a \`Soa\` side by side, each paired with its buffer; the same compiled \`read\` serves both, and only the vtable pointer differs from one pair to the next.

**Common wrong attempts.**

- Trying \`match l { Aos { .. } => ..., Soa { .. } => ... }\` does not compile: a trait object hides which type it holds, and that is the point; ask it through the trait instead.
- \`fn read(l: Layout, ...)\` without \`&dyn\` is E0782 (a trait is not a type), and \`dyn Layout\` on its own has no fixed size, so it must sit behind a pointer.`,
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

fn read(l: &dyn Layout, buf: &[f64],
    i: usize, f: usize) -> f64 {
    buf[l.slot(f, i)]
}`,
        why: 'The arguments are swapped: this asks for element `f`’s field `i`.',
      },
    ],
  },
  aosoaLayout: {
    lang: 'rust',
    optional: true,
    title: 'A third layout: AoSoA',
    prompt: 'Implement `Layout` for `Aosoa`: elements in blocks of `b`, and inside each block one run of `b` values per field (the AoSoA layout of *When SoA loses: materialization and AoSoA*). So block `i / b` starts at `(i / b) * b * nf`, field `f`’s run starts `f * b` into the block, and the element is `i % b` into the run.',
    starter: `trait Layout {
    fn slot(&self, i: usize, f: usize)
        -> usize;
}

struct Aosoa {
    nf: usize,
    b: usize,
}

impl Layout for Aosoa {
    fn slot(&self, i: usize, f: usize)
        -> usize {
        todo!()
    }
}`,
    solution: `trait Layout {
    fn slot(&self, i: usize, f: usize)
        -> usize;
}

struct Aosoa {
    nf: usize,
    b: usize,
}

impl Layout for Aosoa {
    fn slot(&self, i: usize, f: usize)
        -> usize {
        let b = self.b;
        let s = (i / b) * b * self.nf;
        s + f * b + i % b
    }
}`,
    tests: `#[test]
fn first_block() {
    let l = Aosoa { nf: 2, b: 2 };
    // x0 x1 vx0 vx1 | x2 x3 vx2 vx3
    assert_eq!(l.slot(0, 0), 0);
    assert_eq!(l.slot(1, 0), 1);
    assert_eq!(l.slot(0, 1), 2);
}

#[test]
fn second_block() {
    let l = Aosoa { nf: 2, b: 2 };
    assert_eq!(l.slot(2, 0), 4);
    assert_eq!(l.slot(3, 1), 7);
}

#[test]
fn blocks_of_eight() {
    let l = Aosoa { nf: 3, b: 8 };
    assert_eq!(l.slot(9, 2), 24 + 16 + 1);
}`,
    hints: [
      'Work out which block the element is in: `i / self.b`.',
      'Each block holds `b * nf` values, so it starts at `(i / b) * b * nf`.',
      'Inside the block, add `f * self.b` for the field’s run and `i % self.b` for the element.',
    ],
    walkthrough: `**How to think about it.** AoSoA is SoA inside each block and AoS between blocks. With \`b = 2\` and two fields the buffer reads \`x0 x1 vx0 vx1 | x2 x3 vx2 vx3\`. Finding a value takes three steps: which block, which run inside the block, which place inside the run.

**The solution, line by line.**

- \`let b = self.b;\` keeps the block size in a short name.
- \`let s = (i / b) * b * self.nf;\` is where the element's block starts: \`i / b\` is the block number (elements 0 and 1 are in block 0, 2 and 3 in block 1, because integer division rounds down), and every block holds \`b * nf\` values.
- \`s + f * b + i % b\` then skips the runs of the fields before \`f\` inside the block, and adds the element's place inside its run, the remainder after dividing \`i\` by \`b\`.

For element 3, field 1: block \`3 / 2 = 1\` starts at \`1 * 2 * 2 = 4\`; field 1's run is \`1 * 2 = 2\` further; the element is \`3 % 2 = 1\` into the run; \`4 + 2 + 1 = 7\`, which is \`vx3\`. Because \`Aosoa\` implements the same trait, an \`&Aosoa\` could go into the same \`Vec<&dyn Layout>\` as the other two.

**Common wrong attempt.** \`block * self.nf + f * self.b + i\` forgets that each block holds \`b * nf\` values, and adds all of \`i\` instead of \`i % b\`.`,
    wrong: [
      {
        code: `trait Layout {
    fn slot(&self, i: usize, f: usize)
        -> usize;
}

struct Aosoa {
    nf: usize,
    b: usize,
}

impl Layout for Aosoa {
    fn slot(&self, i: usize, f: usize)
        -> usize {
        let block = i / self.b;
        block * self.nf + f * self.b + i
    }
}`,
        why: 'The block start forgets that each block holds `b * nf` values, and it adds all of `i` instead of `i % b`.',
      },
    ],
  },
  vec2: {
    lang: 'rust',
    title: 'A vector type with operators',
    prompt: 'Give `V2` what a physics loop needs. Derive `Debug`, `Clone`, `Copy`, `PartialEq` and `Default` (so tests can compare with `assert_eq!` and print `V2 { x: 1.0, y: 2.0 }`, and `V2::default()` is the zero vector). Then implement `+` between two `V2`s, `* f64` (scale both parts), unary `-`, and `+=`. The `use` line is given.',
    starter: `use std::ops::{Add, AddAssign};
use std::ops::{Mul, Neg};

struct V2 {
    x: f64,
    y: f64,
}`,
    solution: `use std::ops::{Add, AddAssign};
use std::ops::{Mul, Neg};

#[derive(Debug, Clone, Copy)]
#[derive(PartialEq, Default)]
struct V2 {
    x: f64,
    y: f64,
}

impl Add for V2 {
    type Output = V2;
    fn add(self, o: V2) -> V2 {
        V2 {
            x: self.x + o.x,
            y: self.y + o.y,
        }
    }
}

impl Mul<f64> for V2 {
    type Output = V2;
    fn mul(self, k: f64) -> V2 {
        V2 {
            x: self.x * k,
            y: self.y * k,
        }
    }
}

impl Neg for V2 {
    type Output = V2;
    fn neg(self) -> V2 {
        V2 { x: -self.x, y: -self.y }
    }
}

impl AddAssign for V2 {
    fn add_assign(&mut self, o: V2) {
        self.x += o.x;
        self.y += o.y;
    }
}`,
    tests: `fn v(x: f64, y: f64) -> V2 {
    V2 { x, y }
}
#[test]
fn adds_and_scales() {
    assert_eq!(v(1.0, 2.0) + v(3.0, 4.0), v(4.0, 6.0));
    assert_eq!(v(1.0, 2.0) * 2.0, v(2.0, 4.0));
    assert_eq!(-v(1.0, -2.0), v(-1.0, 2.0));
}
#[test]
fn plus_equals_moves_a_particle() {
    let mut pos = V2::default();
    let vel = v(1.0, 0.5);
    pos += vel * 2.0;
    pos += vel * 2.0;
    assert_eq!(pos, v(4.0, 2.0));
    assert_eq!(vel, v(1.0, 0.5)); // still usable: Copy
}
#[test]
fn debug_prints_the_fields() {
    let s = format!("{:?}", v(1.0, 2.0));
    assert_eq!(s, "V2 { x: 1.0, y: 2.0 }");
}`,
    hints: [
      'Start above the struct: `#[derive(...)]` with the five traits (you may split them over two `#[derive]` lines). Then write one `impl` block per operator; each comes from `std::ops`, which the `use` line already imports.',
      '`Add`, `Mul<f64>` and `Neg` each need `type Output = V2;` and one method taking `self` by value: `add(self, o: V2)`, `mul(self, k: f64)`, `neg(self)`. Build a new `V2` from the fields.',
      '`AddAssign` has no `Output`: `fn add_assign(&mut self, o: V2) { self.x += o.x; self.y += o.y; }`. Without `Copy` in the derive, `vel` would be moved by `vel * 2.0` and the test could not use it again.',
    ],
    walkthrough: `**How to think about it.** Split the task into "routine" and "real". The routine part is the five traits whose impls would only repeat each field (print them, copy them, compare them, zero them): that is exactly what \`#[derive]\` is for. The real part is the four operators, because only you know that adding vectors adds their parts. For each operator, find its trait in \`std::ops\` and remember the formal table from the chapter: \`a + b\` is \`Add::add(a, b)\`, \`v * k\` is \`Mul::mul(v, k)\`, \`-v\` is \`Neg::neg(v)\` and \`a += b\` is \`AddAssign::add_assign(&mut a, b)\`.

**The solution, line by line.**

- \`#[derive(Debug, Clone, Copy)]\` and \`#[derive(PartialEq, Default)]\` (two attributes are the same as one longer list; the split only keeps lines short) write five impls. \`Debug\` prints \`V2 { x: 1.0, y: 2.0 }\` (the last test checks that exact text), \`PartialEq\` compares both fields, which \`assert_eq!\` needs (together with \`Debug\`, to print the two sides when they differ), \`Default\` makes \`V2::default()\` the vector \`(0.0, 0.0)\` because \`f64\`'s default is \`0.0\`, and \`Copy\` (which requires \`Clone\`) lets a \`V2\` be used again after it has been passed by value.
- \`impl Add for V2 { type Output = V2; fn add(self, o: V2) -> V2 { V2 { x: self.x + o.x, y: self.y + o.y } } }\` is \`impl Add<V2> for V2\`, since \`Rhs\` defaults to \`Self\`. \`Output\` says the sum is another \`V2\`.
- \`impl Mul<f64> for V2\` chooses \`f64\` as the right-hand side, so \`v * 2.0\` works. Its \`mul\` scales both parts. (\`2.0 * v\` would still not compile: that needs \`impl Mul<V2> for f64\`.)
- \`impl Neg for V2\` is the one-sided operator \`-v\`; \`neg\` takes only \`self\` and flips both signs.
- \`impl AddAssign for V2 { fn add_assign(&mut self, o: V2) { self.x += o.x; self.y += o.y; } }\` changes the left side in place through \`&mut self\`, so it returns nothing and has no \`Output\`. The \`+=\` on \`f64\` fields inside it uses \`f64\`'s own \`AddAssign\`.

In the second test, \`pos += vel * 2.0\` is \`AddAssign::add_assign(&mut pos, Mul::mul(vel, 2.0))\`: \`vel\` is copied into \`mul\`, the product is added into \`pos\`, and \`vel\` is still there for the next line and the final \`assert_eq!\`.

**Common wrong attempts.**

- Deriving everything except \`Copy\`. The first \`vel * 2.0\` moves \`vel\`, and the next use is rejected with E0382 ("use of moved value: \`vel\`"), so the tests do not compile.
- \`impl Mul for V2\` (with \`Rhs\` left as \`V2\`) and then \`v * 2.0\`: rustc reports E0308, mismatched types, because the right-hand side must be a \`V2\`.
- Writing \`Display\` in the derive list: \`Display\` cannot be derived, and \`{:?}\` uses \`Debug\` anyway.`,
    wrong: [
      {
        code: `use std::ops::{Add, AddAssign};
use std::ops::{Mul, Neg};

#[derive(Debug, Clone)]
#[derive(PartialEq, Default)]
struct V2 {
    x: f64,
    y: f64,
}

impl Add for V2 {
    type Output = V2;
    fn add(self, o: V2) -> V2 {
        V2 {
            x: self.x + o.x,
            y: self.y + o.y,
        }
    }
}

impl Mul<f64> for V2 {
    type Output = V2;
    fn mul(self, k: f64) -> V2 {
        V2 {
            x: self.x * k,
            y: self.y * k,
        }
    }
}

impl Neg for V2 {
    type Output = V2;
    fn neg(self) -> V2 {
        V2 { x: -self.x, y: -self.y }
    }
}

impl AddAssign for V2 {
    fn add_assign(&mut self, o: V2) {
        self.x += o.x;
        self.y += o.y;
    }
}`,
        why: 'Without `Copy`, `vel * 2.0` moves `vel`, so the test that uses `vel` again does not compile (E0382).',
      },
      {
        code: `use std::ops::{Add, AddAssign};
use std::ops::{Mul, Neg};

#[derive(Debug, Clone, Copy)]
#[derive(PartialEq, Default)]
struct V2 {
    x: f64,
    y: f64,
}

impl Add for V2 {
    type Output = V2;
    fn add(self, o: V2) -> V2 {
        V2 {
            x: self.x + o.y,
            y: self.y + o.y,
        }
    }
}

impl Mul<f64> for V2 {
    type Output = V2;
    fn mul(self, k: f64) -> V2 {
        V2 {
            x: self.x * k,
            y: self.y * k,
        }
    }
}

impl Neg for V2 {
    type Output = V2;
    fn neg(self) -> V2 {
        V2 { x: -self.x, y: -self.y }
    }
}

impl AddAssign for V2 {
    fn add_assign(&mut self, o: V2) {
        self.x += o.x;
        self.y += o.y;
    }
}`,
        why: '`add` mixes up the fields (`self.x + o.y`), so `v(1, 2) + v(3, 4)` is `(5, 6)`, not `(4, 6)`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'A struct `Rb` has its own `id` and `exts` methods, but no `impl Plugin for Rb`. What does `Plugin::handles(&Rb, "a.rb")` do?',
    options: [
      {
        t: 'Runs the default `handles`, using `Rb`’s methods',
        why: 'That would be structural typing, as in TypeScript. Rust only counts the impl block.',
      },
      {
        t: 'Fails to compile: E0277, the trait bound `Rb: Plugin` is not satisfied',
        correct: true,
        why: 'Traits are nominal: a type implements one only through `impl Plugin for Rb`.',
      },
      {
        t: 'Compiles, but panics at run time',
        why: 'Trait membership is checked entirely at compile time.',
      },
    ],
  },
  {
    q: 'In a trait, what is the difference between `fn id(&self) -> &str;` and a method with a `{ ... }` body?',
    options: [
      {
        t: 'The first is required: every impl must write it. The second is a default every impl gets',
        correct: true,
        why: 'Impls may still override a default method.',
      },
      {
        t: 'The first is private, the second public',
        why: 'Both are part of the trait; the semicolon only means “no body here”.',
      },
      {
        t: 'The first can only be called on the type, the second on a value',
        why: 'Both take `&self`, so both are methods called on a value.',
      },
    ],
  },
  {
    q: 'Which impl can your crate write, if it defines a trait `Describe` but not `Vec` or `Display`?',
    options: [
      {
        t: '`impl Display for Vec<i32>`',
        why: 'Neither the trait nor the type is yours: the orphan rule forbids it.',
      },
      {
        t: '`impl Describe for Vec<i32>`',
        correct: true,
        why: 'The trait is yours, so you may implement it for any type, even one from the standard library.',
      },
      {
        t: 'Neither',
        why: 'Owning either the trait or the type is enough.',
      },
    ],
  },
  {
    q: '`#[derive(Clone, Copy)]` is on `struct P { x: f64, y: f64 }`. After `let b = a;`, what is true?',
    options: [
      {
        t: '`a` has moved into `b` and can’t be used',
        why: 'That is what happens without `Copy`.',
      },
      {
        t: '`b` is a reference to `a`',
        why: '`let b = a;` makes a whole new value; a reference would be `&a`.',
      },
      {
        t: '`b` is a copy, and `a` is still usable',
        correct: true,
        why: '`Copy` makes assignment copy the bits instead of moving.',
      },
    ],
  },
  {
    q: 'How does a TypeScript interface differ from a Rust trait?',
    options: [
      {
        t: 'An interface is matched by shape and erased at run time; a trait is matched by name, through an impl block',
        correct: true,
        why: 'Structural versus nominal: in Rust, having the right methods is not enough.',
      },
      {
        t: 'They are the same: both are checked by shape',
        why: 'Only TypeScript checks shapes.',
      },
      {
        t: 'A trait cannot have methods with bodies',
        why: 'Traits can have default methods with bodies.',
      },
    ],
  },
  {
    q: 'On this machine `&Js` is 8 bytes. How big is `&dyn Plugin`, and why?',
    options: [
      {
        t: '8 bytes: a reference is a reference',
        why: 'A trait-object reference carries a second pointer.',
      },
      {
        t: '16 bytes: a data pointer plus a vtable pointer',
        correct: true,
        why: 'A fat pointer: the value’s address and its type’s vtable.',
      },
      {
        t: 'It depends on whether it points at a `Js` or a `Py`',
        why: 'Every `&dyn Plugin` is the same size; that is what lets one `Vec` hold both.',
      },
    ],
  },
  {
    q: 'What happens at run time when you call `p.id()` on `p: &dyn Plugin`?',
    options: [
      {
        t: 'The method is looked up by its name, `"id"`',
        why: 'Nothing is looked up by name; methods were numbered at compile time.',
      },
      {
        t: 'A function pointer is loaded from a fixed slot of `p`’s vtable and called with `p`’s data pointer as `self`',
        correct: true,
        why: 'Dynamic dispatch through the vtable.',
      },
      {
        t: 'The compiler inlines `Js::id`',
        why: 'It cannot: it does not know which type `p` points at.',
      },
    ],
  },
  {
    q: 'Why does `vec![&Js, &Py]` fail to compile?',
    options: [
      {
        t: 'A `Vec` cannot hold references',
        why: 'It can; `Vec<&dyn Plugin>` holds references.',
      },
      {
        t: '`Js` and `Py` are unit structs, which cannot be borrowed',
        why: 'Unit structs can be borrowed like any value.',
      },
      {
        t: 'The elements have different types, `&Js` and `&Py` (E0308)',
        correct: true,
        why: 'Annotate it as `Vec<&dyn Plugin>` so both turn into trait objects.',
      },
    ],
  },
  {
    q: 'What is the difference between `Vec<&dyn Plugin>` and `Vec<Box<dyn Plugin>>`?',
    options: [
      {
        t: 'The first borrows plugins that live elsewhere; the second owns them, on the heap',
        correct: true,
        why: 'Both hold fat pointers and dispatch the same way.',
      },
      {
        t: 'Only the second uses a vtable',
        why: 'Both are trait objects, so both use a vtable.',
      },
      {
        t: 'Only the first can hold different types',
        why: 'Both can.',
      },
    ],
  },
  {
    q: 'drip-rs’s collector takes `roots: &[&dyn Trace]`. What does that let the VM and the compiler do?',
    options: [
      {
        t: 'Avoid tracing roots at all',
        why: 'Every root is traced; `dyn` only hides its type.',
      },
      {
        t: 'Run the collector on another thread',
        why: 'Nothing here is about threads.',
      },
      {
        t: 'Each pass roots of their own different types to one function',
        correct: true,
        why: 'The VM passes its `VmRoots`, the compiler its half-built functions; the collector calls `trace` through each vtable.',
      },
    ],
  },
  {
    q: 'What is `a == b` compiled as?',
    options: [
      {
        t: '`PartialEq::eq(a, b)`, moving both values',
        why: 'Comparison borrows; it never moves.',
      },
      {
        t: '`PartialEq::eq(&a, &b)`',
        correct: true,
        why: 'Both sides are borrowed, so `a` and `b` are still usable afterwards.',
      },
      {
        t: 'A comparison of the two addresses, as `===` does on JavaScript objects',
        why: 'Rust’s `==` calls the type’s `PartialEq` impl.',
      },
    ],
  },
  {
    q: 'You have `impl Mul<f64> for V2`. Which of these compiles?',
    options: [
      {
        t: '`2.0 * v`',
        why: 'That needs `impl Mul<V2> for f64`; the left side picks the impl.',
      },
      {
        t: '`v * v`',
        why: 'That needs `impl Mul<V2> for V2`.',
      },
      {
        t: '`v * 2.0`',
        correct: true,
        why: 'Left side `V2`, right side `f64`: exactly the impl given.',
      },
    ],
  },
  {
    q: 'Why does `AddAssign` have no `Output` type?',
    options: [
      {
        t: 'Because `+=` changes its left side in place through `&mut self` and produces no new value.',
        correct: true,
        why: '`add_assign(&mut self, rhs)` returns `()`.',
      },
      {
        t: 'Because it always produces `Self`.',
        why: 'It produces nothing; the left side is updated.',
      },
      {
        t: 'Because `+=` is only defined for numbers.',
        why: 'You can implement it for any type you own.',
      },
    ],
  },
  {
    q: '`#[derive(Clone)] struct Gc<T> { index: u32, marker: PhantomData<T> }`. What does derive write?',
    options: [
      {
        t: '`impl<T> Clone for Gc<T>`, for every `T`',
        why: 'Derive adds a bound on each type parameter.',
      },
      {
        t: '`impl<T: Clone> Clone for Gc<T>`, so a handle to a non-cloneable `T` has no `clone`',
        correct: true,
        why: 'That is why drip-rs writes these impls by hand.',
      },
      {
        t: 'Nothing: derive does not work on generic types.',
        why: 'It does, with the extra bounds.',
      },
    ],
  },
  {
    q: 'Which trait can NOT be written by `#[derive]`?',
    options: [
      {
        t: '`Default`',
        why: 'Derivable: each field gets its own default.',
      },
      {
        t: '`PartialOrd`',
        why: 'Derivable: fields are compared in declaration order.',
      },
      {
        t: '`Hash`',
        why: 'Derivable: each field is hashed.',
      },
      {
        t: '`Display`',
        correct: true,
        why: 'Only you know how a value should look to a user.',
      },
    ],
  },
];
