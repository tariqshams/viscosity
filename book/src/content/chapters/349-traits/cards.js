// Chapter 349 cards. Keys are stable ids: never rename them.

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
`;

const impls = (aos, soa) => `${TRAIT}
impl Layout for Aos {
    fn slot(&self, i: usize, f: usize)
        -> usize {
        ${aos}
    }
}

impl Layout for Soa {
    fn slot(&self, i: usize, f: usize)
        -> usize {
        ${soa}
    }
}`;

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
};

export const exercises = {
  layouts: {
    lang: 'rust',
    title: 'Two layouts, one trait',
    prompt:
      'A flat buffer of `f64`s stores `n` elements (particles, say) with `nf` fields each. The trait method `slot(i, f)` says at which index of the buffer element `i`’s field `f` lives. Implement it for `Aos`, which keeps each element’s fields together (`x0 vx0 x1 vx1 …`), and for `Soa`, which keeps one column per field (`x0 x1 x2 … vx0 vx1 …`). Each struct stores only what its formula needs.',
    starter: impls('todo!()', 'todo!()'),
    solution: impls('i * self.nf + f', 'f * self.n + i'),
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
        code: impls('i * self.nf + f', 'i * self.n + f'),
        why: 'That is the AoS formula with `n` in place of `nf`: it walks along elements, not down a column. In SoA the field picks the column: `f * n + i`.',
      },
      {
        code: impls('f * self.nf + i', 'f * self.n + i'),
        why: 'The AoS formula is swapped. In AoS the element number picks the group of `nf` slots: `i * nf + f`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'A struct `Rb` has its own `id` and `exts` methods, but no `impl Plugin for Rb`. What does `Plugin::handles(&Rb, "a.rb")` do?',
    options: [
      { t: 'Runs the default `handles`, using `Rb`’s methods', why: 'That would be structural typing, as in TypeScript. Rust only counts the impl block.' },
      { t: 'Fails to compile: E0277, the trait bound `Rb: Plugin` is not satisfied', correct: true, why: 'Traits are nominal: a type implements one only through `impl Plugin for Rb`.' },
      { t: 'Compiles, but panics at run time', why: 'Trait membership is checked entirely at compile time.' },
    ],
  },
  {
    q: 'In a trait, what is the difference between `fn id(&self) -> &str;` and a method with a `{ ... }` body?',
    options: [
      { t: 'The first is required: every impl must write it. The second is a default every impl gets', correct: true, why: 'Impls may still override a default method.' },
      { t: 'The first is private, the second public', why: 'Both are part of the trait; the semicolon only means “no body here”.' },
      { t: 'The first can only be called on the type, the second on a value', why: 'Both take `&self`, so both are methods called on a value.' },
    ],
  },
  {
    q: 'Which impl can your crate write, if it defines a trait `Describe` but not `Vec` or `Display`?',
    options: [
      { t: '`impl Display for Vec<i32>`', why: 'Neither the trait nor the type is yours: the orphan rule forbids it.' },
      { t: '`impl Describe for Vec<i32>`', correct: true, why: 'The trait is yours, so you may implement it for any type, even one from the standard library.' },
      { t: 'Neither', why: 'Owning either the trait or the type is enough.' },
    ],
  },
  {
    q: '`#[derive(Clone, Copy)]` is on `struct P { x: f64, y: f64 }`. After `let b = a;`, what is true?',
    options: [
      { t: '`a` has moved into `b` and can’t be used', why: 'That is what happens without `Copy`.' },
      { t: '`b` is a reference to `a`', why: '`let b = a;` makes a whole new value; a reference would be `&a`.' },
      { t: '`b` is a copy, and `a` is still usable', correct: true, why: '`Copy` makes assignment copy the bits instead of moving.' },
    ],
  },
  {
    q: 'How does a TypeScript interface differ from a Rust trait?',
    options: [
      { t: 'An interface is matched by shape and erased at run time; a trait is matched by name, through an impl block', correct: true, why: 'Structural versus nominal: in Rust, having the right methods is not enough.' },
      { t: 'They are the same: both are checked by shape', why: 'Only TypeScript checks shapes.' },
      { t: 'A trait cannot have methods with bodies', why: 'Traits can have default methods with bodies.' },
    ],
  },
];
