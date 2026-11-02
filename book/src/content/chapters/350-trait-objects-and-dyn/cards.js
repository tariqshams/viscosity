// Chapter 349-b cards. Keys are stable ids: never rename them.

const TRAIT = `trait Layout {
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

const READ = (body) => `${TRAIT}
fn read(l: &dyn Layout, buf: &[f64],
    i: usize, f: usize) -> f64 {
${body}
}`;

export const prompts = {
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
};

export const examples = {
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
};

export const exercises = {
  readDyn: {
    lang: 'rust',
    title: 'Reading through any layout',
    prompt:
      'The `Layout` trait and its `Aos` and `Soa` impls from the last chapter are given. Write `read(l, buf, i, f)`, which returns element `i`’s field `f` from the flat buffer `buf`, for whichever layout `l` turns out to be. `l` is a `&dyn Layout`, so `read` is compiled once and works for both.',
    starter: READ('    todo!()'),
    solution: READ('    buf[l.slot(i, f)]'),
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
        code: READ('    buf[l.slot(f, i)]'),
        why: 'The arguments are swapped: this asks for element `f`’s field `i`.',
      },
    ],
  },
  aosoaLayout: {
    lang: 'rust',
    optional: true,
    title: 'A third layout: AoSoA',
    prompt:
      'Implement `Layout` for `Aosoa`: elements in blocks of `b`, and inside each block one run of `b` values per field (the AoSoA layout of *When SoA loses: materialization and AoSoA*). So block `i / b` starts at `(i / b) * b * nf`, field `f`’s run starts `f * b` into the block, and the element is `i % b` into the run.',
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
};

export const quiz = [
  {
    q: 'On this machine `&Js` is 8 bytes. How big is `&dyn Plugin`, and why?',
    options: [
      { t: '8 bytes: a reference is a reference', why: 'A trait-object reference carries a second pointer.' },
      { t: '16 bytes: a data pointer plus a vtable pointer', correct: true, why: 'A fat pointer: the value’s address and its type’s vtable.' },
      { t: 'It depends on whether it points at a `Js` or a `Py`', why: 'Every `&dyn Plugin` is the same size; that is what lets one `Vec` hold both.' },
    ],
  },
  {
    q: 'What happens at run time when you call `p.id()` on `p: &dyn Plugin`?',
    options: [
      { t: 'The method is looked up by its name, `"id"`', why: 'Nothing is looked up by name; methods were numbered at compile time.' },
      { t: 'A function pointer is loaded from a fixed slot of `p`’s vtable and called with `p`’s data pointer as `self`', correct: true, why: 'Dynamic dispatch through the vtable.' },
      { t: 'The compiler inlines `Js::id`', why: 'It cannot: it does not know which type `p` points at.' },
    ],
  },
  {
    q: 'Why does `vec![&Js, &Py]` fail to compile?',
    options: [
      { t: 'A `Vec` cannot hold references', why: 'It can; `Vec<&dyn Plugin>` holds references.' },
      { t: '`Js` and `Py` are unit structs, which cannot be borrowed', why: 'Unit structs can be borrowed like any value.' },
      { t: 'The elements have different types, `&Js` and `&Py` (E0308)', correct: true, why: 'Annotate it as `Vec<&dyn Plugin>` so both turn into trait objects.' },
    ],
  },
  {
    q: 'What is the difference between `Vec<&dyn Plugin>` and `Vec<Box<dyn Plugin>>`?',
    options: [
      { t: 'The first borrows plugins that live elsewhere; the second owns them, on the heap', correct: true, why: 'Both hold fat pointers and dispatch the same way.' },
      { t: 'Only the second uses a vtable', why: 'Both are trait objects, so both use a vtable.' },
      { t: 'Only the first can hold different types', why: 'Both can.' },
    ],
  },
  {
    q: 'drip-rs’s collector takes `roots: &[&dyn Trace]`. What does that let the VM and the compiler do?',
    options: [
      { t: 'Avoid tracing roots at all', why: 'Every root is traced; `dyn` only hides its type.' },
      { t: 'Run the collector on another thread', why: 'Nothing here is about threads.' },
      { t: 'Each pass roots of their own different types to one function', correct: true, why: 'The VM passes its `VmRoots`, the compiler its half-built functions; the collector calls `trace` through each vtable.' },
    ],
  },
];
