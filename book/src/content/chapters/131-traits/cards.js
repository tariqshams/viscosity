// Chapter 131 cards. Keys are stable ids: never rename them.

const TRAIT = `trait Layout {
    // where element i's field f lives
    fn slot(&self, i: usize, f: usize)
        -> usize;
}

// nf fields per element
struct Aos {
    nf: usize,
}

// n elements per column
struct Soa {
    n: usize,
}
`;

export const prompts = {
  'trait-what': {
    q: 'What is a Rust **trait**?',
    a: 'A named set of methods that many types can implement, like an interface.',
  },
  'trait-default': {
    q: 'What is a default method in a trait?',
    a: 'A method with a body in the trait itself. Implementing types get it for free and may override it.',
  },
  'trait-impl': {
    q: 'What must an `impl Plugin for Js` block contain?',
    a: 'Every required method of `Plugin` (those without a body). Missing one is error E0046.',
  },
  nominal: {
    q: 'A struct has an `id` method with the right signature but no `impl Plugin` for it. Can you pass it as a `&dyn Plugin`?',
    a: 'No (E0277). Rust traits are nominal: the type must declare the impl, a matching method isn’t enough.',
  },
  orphan: {
    q: 'What does the orphan rule forbid?',
    a: 'Implementing a trait for a type when neither the trait nor the type is defined in your crate.',
  },
  derive: {
    q: 'What does `#[derive(Debug, Clone)]` do?',
    a: 'Asks the compiler to write the `impl Debug` and `impl Clone` blocks for the type.',
  },
  'dyn-what': {
    q: 'Why do you need `&dyn Plugin` to keep a `Js` and a `Py` in one `Vec`?',
    a: 'A `Vec` holds one element type. `&dyn Plugin` is one type, “a reference to something that implements Plugin”, whatever the value’s real type.',
  },
  fat: {
    q: 'What two pointers make up a `&dyn Trait`?',
    a: 'One to the value, and one to the vtable for that value’s type and the trait.',
  },
  'vtable-vs-ic': {
    q: 'How does a `dyn` method call differ from a JavaScript method call through an inline cache?',
    a: 'It reads a fixed vtable slot chosen at compile time; there is no lookup by name and no shape check. It is still an indirect call.',
  },
  trace: {
    q: 'How does drip-rs’s collector mark roots of different types?',
    a: 'Each root type implements the `Trace` trait, and `collect` takes `&[&dyn Trace]`, calling `trace` on each.',
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
  layouts: {
    lang: 'rust',
    title: 'Two layouts, one trait',
    prompt:
      'A flat buffer of `f64`s stores `n` elements with `nf` fields each. `Layout::slot(i, f)` says where element `i`’s field `f` lives. Implement it for `Aos` (each element’s fields together: `x0 vx0 x1 vx1 …`) and for `Soa` (one column per field: `x0 x1 x2 … vx0 vx1 …`). Then write `read`, which reads a field through any `&dyn Layout`.',
    starter: `${TRAIT}
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
}

fn read(l: &dyn Layout, buf: &[f64],
    i: usize, f: usize) -> f64 {
    todo!()
}`,
    solution: `${TRAIT}
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
fn read_through_dyn() {
    // three particles: x = 0,1,2; vx = 10,11,12
    let aos = [0.0, 10.0, 1.0, 11.0, 2.0, 12.0];
    let soa = [0.0, 1.0, 2.0, 10.0, 11.0, 12.0];
    assert_eq!(read(&Aos { nf: 2 }, &aos, 2, 1), 12.0);
    assert_eq!(read(&Soa { n: 3 }, &soa, 2, 1), 12.0);
    assert_eq!(read(&Soa { n: 3 }, &soa, 1, 0), 1.0);
}

#[test]
fn both_layouts_agree() {
    let aos = [0.0, 10.0, 1.0, 11.0, 2.0, 12.0];
    let soa = [0.0, 1.0, 2.0, 10.0, 11.0, 12.0];
    let ls: Vec<(&dyn Layout, &[f64])> = vec![
        (&Aos { nf: 2 }, &aos),
        (&Soa { n: 3 }, &soa),
    ];
    for (l, buf) in ls {
        assert_eq!(read(l, buf, 0, 1), 10.0);
        assert_eq!(read(l, buf, 2, 0), 2.0);
    }
}`,
    hints: [
      'In AoS, element `i` starts at `i * nf`, and field `f` is `f` places further on.',
      'In SoA, field `f`’s column starts at `f * n`, and element `i` is `i` places into it.',
      '`read` is one line: ask the layout for the slot with `l.slot(i, f)`, then index the buffer.',
    ],
    walkthrough: `This is chapter 23’s picture of AoS and SoA, written as arithmetic.

- **AoS:** element \`i\` occupies \`nf\` neighbouring slots starting at \`i * nf\`, so field \`f\` is at \`i * self.nf + f\`.
- **SoA:** the buffer is \`nf\` columns of \`n\` each. Field \`f\`’s column starts at \`f * self.n\`, so element \`i\` is at \`f * self.n + i\`.
- **\`read\`** doesn’t know which layout it got. \`l\` is a fat pointer, and \`l.slot(i, f)\` goes through the vtable to \`Aos::slot\` or \`Soa::slot\`. That is how one loop could read either layout.

Notice what each struct stores: \`Aos\` needs the number of fields, \`Soa\` the number of elements. The trait hides that difference from \`read\`.`,
    wrong: [
      {
        code: `${TRAIT}
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
}

fn read(l: &dyn Layout, buf: &[f64],
    i: usize, f: usize) -> f64 {
    buf[l.slot(i, f)]
}`,
        why: 'That is the AoS formula with `n` in place of `nf`: it walks along elements, not down a column. In SoA, the field picks the column, so it is `f * n + i`.',
      },
      {
        code: `${TRAIT}
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
}

fn read(l: &dyn Layout, buf: &[f64],
    i: usize, f: usize) -> f64 {
    buf[l.slot(i, f)]
}`,
        why: 'The AoS formula is swapped. In AoS the element number picks the group of `nf` slots: `i * nf + f`.',
      },
    ],
  },
  aosoaLayout: {
    lang: 'rust',
    optional: true,
    title: 'A third layout: AoSoA',
    prompt:
      'Implement `Layout` for `Aosoa`: elements in blocks of `b`, and inside each block one run of `b` values per field (chapter 23). So block `i / b` starts at `(i / b) * b * nf`, field `f`’s run starts `f * b` into the block, and the element is `i % b` into the run.',
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
    walkthrough: `AoSoA is SoA inside each block and AoS between blocks. With \`b = 2\` and two fields the buffer reads \`x0 x1 vx0 vx1 | x2 x3 vx2 vx3\`.

For element 3, field 1: block \`3 / 2 = 1\` starts at \`1 * 2 * 2 = 4\`; field 1’s run is \`1 * 2 = 2\` further; the element is \`3 % 2 = 1\` into the run. \`4 + 2 + 1 = 7\`, which is \`vx3\`.

Because it implements the same trait, an \`&Aosoa\` could go into the same \`Vec<&dyn Layout>\` as the other two.`,
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
    q: 'What is the main difference between a TypeScript interface and a Rust trait?',
    options: [
      { t: 'Traits can’t have methods', why: 'Methods are all a trait has.' },
      { t: 'A type implements a trait only by declaring `impl Trait for Type`; an object matches an interface just by its shape', correct: true, why: 'Rust traits are nominal, TypeScript interfaces structural.' },
      { t: 'Interfaces are checked at run time, traits at compile time', why: 'TypeScript checks interfaces at compile time too, then erases them.' },
      { t: 'There is no real difference', why: 'Try passing a type with the right method but no impl: E0277.' },
    ],
  },
  {
    q: 'A trait has `fn id(&self) -> &str;` and `fn handles(&self, f: &str) -> bool { ... }`. What must `impl Trait for Js` contain?',
    options: [
      { t: 'Both methods', why: '`handles` has a body in the trait, so `Js` inherits it.' },
      { t: 'Neither', why: '`id` has no body, so every type must write it.' },
      { t: 'Only `id`; it may also override `handles`', correct: true, why: '`id` is required; `handles` is a default method.' },
    ],
  },
  {
    q: 'How big is a `&dyn Plugin` on a 64-bit machine, and why?',
    options: [
      { t: '8 bytes, like any reference', why: '`&Js` is 8 bytes; the `dyn` reference carries more.' },
      { t: '16 bytes: a pointer to the value plus a pointer to its vtable', correct: true, why: 'Measured on this machine with `size_of`, and the Rust Reference describes the two parts.' },
      { t: 'The size of the biggest type that implements `Plugin`', why: 'The value isn’t stored in the reference; only pointers are.' },
      { t: 'It depends on how many methods the trait has', why: 'The method pointers live in the vtable, not in the reference.' },
    ],
  },
  {
    q: 'What happens when you call `p.id()` on `p: &dyn Plugin`?',
    options: [
      { t: 'The method is looked up by its name in a hash table', why: 'That is closer to a JavaScript property lookup. A vtable is indexed by a slot fixed at compile time.' },
      { t: 'Rust checks the value’s type with a chain of `if`s', why: 'It doesn’t test types at all; the vtable already belongs to the right type.' },
      { t: 'The compiler has already inlined the right `id` at that call', why: 'It can’t know which type `p` refers to, so it can’t pick one body to inline.' },
      { t: 'It loads `id`’s function pointer from `p`’s vtable and calls it', correct: true, why: 'This is dynamic dispatch.' },
    ],
  },
  {
    q: 'You want `impl fmt::Display for Vec<f64>` in your crate. What happens?',
    options: [
      { t: 'It works', why: 'Neither `Display` nor `Vec` is yours.' },
      { t: 'It is rejected by the orphan rule: you must define the trait or the type', correct: true, why: 'Wrap the `Vec` in your own struct, and implement `Display` for that.' },
      { t: 'It works, but only inside `main`', why: 'Where you write the impl doesn’t change the rule.' },
    ],
  },
  {
    q: 'Why does drip-rs’s `collect` take `roots: &[&dyn Trace]` instead of a slice of one concrete type?',
    options: [
      { t: 'Because `dyn` is faster than a concrete type', why: 'It isn’t the reason, and a dyn call is indirect.' },
      { t: 'The roots come in different types (the VM’s roots, the compiler’s state), and all it needs is that each can trace itself', correct: true, why: 'Trait objects let one slice hold references to different types that share a trait.' },
      { t: 'Because Rust has no other way to pass a list', why: 'A `&[T]` of one type works fine when all roots have the same type.' },
    ],
  },
];
