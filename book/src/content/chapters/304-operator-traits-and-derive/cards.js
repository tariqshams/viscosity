// Chapter 274 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
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
