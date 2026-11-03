// Designing Rust APIs and the Cargo workflow cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'conv-prefix': {
    q: 'What do the prefixes `as_`, `to_` and `into_` promise about a conversion?',
    a: '`as_`: free, borrowed to borrowed. `to_`: expensive (usually copies). `into_`: consumes the value and returns another owned one.',
  },
  getter: {
    q: 'By the API Guidelines, what should a getter for a `degrees` field be called?',
    a: '`degrees()`, not `get_degrees()`: Rust getters drop the `get_` prefix (with exceptions like `Cell::get`).',
  },
  orphan: {
    q: 'Why should a library type eagerly implement `Debug`, `Clone`, `PartialEq` and friends?',
    a: 'Because of the orphan rule: an impl must live in the crate of the trait or of the type, so users of your crate cannot add them.',
  },
  'bool-arg': {
    q: 'What is wrong with `greet("Ada", true)`, and what do the guidelines suggest?',
    a: 'A reader cannot tell what `true` means. Use a type that says it, such as `enum Volume { Quiet, Loud }` (C-CUSTOM-TYPE).',
  },
  'non-exh': {
    q: 'What does `#[non_exhaustive]` on a public enum force other crates to do?',
    a: 'Include a `_` arm in every `match` on it, so new variants can be added later without breaking them (E0004 otherwise).',
  },
  'feature-what': {
    q: 'What is a Cargo **feature**?',
    a: 'A named optional part of a crate, declared under `[features]`; code tests it with `#[cfg(feature = "name")]`.',
  },
  'default-feat': {
    q: 'How do you build a crate without its default features, but with `kelvin`?',
    a: '`cargo build --no-default-features --features kelvin`.',
  },
  additive: {
    q: 'Why must Cargo features be additive?',
    a: 'Cargo builds each dependency once with the union of every feature requested in the build, so a feature that removed something would break another crate.',
  },
};

export const examples = {
  greet: {
    lang: 'rust',
    title: 'An enum argument, and as_ / to_ / into_',
    code: `#[derive(Debug, Clone, Copy, PartialEq)]
enum Volume {
    Quiet,
    Loud,
}

fn greet(name: &str, v: Volume)
    -> String {
    let s = format!("hello, {name}");
    match v {
        Volume::Quiet => s,
        Volume::Loud => {
            s.to_uppercase()
        }
    }
}

fn main() {
    use Volume::{Loud, Quiet};
    let ada = String::from("Ada");
    // a &String works as a &str
    println!("{}", greet(&ada, Quiet));
    println!("{}", greet("Bo", Loud));

    let view = ada.as_bytes(); // free
    println!("{view:?}");
    let up = ada.to_uppercase(); // copy
    let b = ada.into_bytes(); // moves
    println!("{up} {b:?}");
}`,
  },
};

export const exercises = {
  celsius: {
    lang: 'rust',
    title: 'A small type with a well-behaved API',
    prompt: 'Finish `Celsius`, a temperature that is never below absolute zero (`Celsius::ZERO_K`, −273.15). Following the API Guidelines: `new(deg)` returns `Some` only for a real temperature (not below absolute zero, and not NaN); the getter is `degrees()`, not `get_degrees()`; `to_fahrenheit()` converts; `From<Celsius> for f64` gives the plain number back (so `.into()` works too); and the type derives `Debug`, `Clone`, `Copy`, `PartialEq` and `PartialOrd`. The field stays private.',
    starter: `/// A temperature in degrees Celsius,
/// never below absolute zero.
// TODO: derive the common traits
pub struct Celsius(f64);

impl Celsius {
    pub const ZERO_K: f64 = -273.15;

    pub fn new(deg: f64)
        -> Option<Self> {
        todo!()
    }

    // TODO: degrees() and
    // to_fahrenheit()
}

// TODO: impl From<Celsius> for f64`,
    solution: `/// A temperature in degrees Celsius,
/// never below absolute zero.
#[derive(Debug, Clone, Copy,
         PartialEq, PartialOrd)]
pub struct Celsius(f64);

impl Celsius {
    pub const ZERO_K: f64 = -273.15;

    pub fn new(deg: f64)
        -> Option<Self> {
        if deg >= Self::ZERO_K {
            Some(Celsius(deg))
        } else {
            None
        }
    }

    pub fn degrees(&self) -> f64 {
        self.0
    }

    pub fn to_fahrenheit(&self) -> f64 {
        self.0 * 9.0 / 5.0 + 32.0
    }
}

impl From<Celsius> for f64 {
    fn from(c: Celsius) -> f64 {
        c.0
    }
}`,
    tests: `#[test]
fn new_accepts_real_temperatures() {
    assert_eq!(Celsius::new(21.5).unwrap().degrees(), 21.5);
    assert_eq!(Celsius::new(-273.15).unwrap().degrees(), -273.15);
}

#[test]
fn new_refuses_below_absolute_zero() {
    assert_eq!(Celsius::new(-300.0), None);
    assert_eq!(Celsius::new(f64::NAN), None);
}

#[test]
fn converts_to_fahrenheit() {
    let c = Celsius::new(100.0).unwrap();
    assert_eq!(c.to_fahrenheit(), 212.0);
    assert_eq!(Celsius::new(-40.0).unwrap().to_fahrenheit(), -40.0);
}

#[test]
fn is_copy_debug_and_comparable() {
    let a = Celsius::new(10.0).unwrap();
    let b = a; // Copy: a is still usable
    assert_eq!(a, b);
    assert!(Celsius::new(5.0).unwrap() < a);
    assert_eq!(format!("{a:?}"), "Celsius(10.0)");
}

#[test]
fn turns_into_a_plain_f64() {
    let c = Celsius::new(36.6).unwrap();
    let x: f64 = c.into();
    assert_eq!(x, 36.6);
    assert_eq!(f64::from(c), 36.6);
}`,
    hints: [
      'Start with the derive line and the constructor: what makes a temperature real? Then the three small methods, then the `From` impl.',
      'Write the check so that NaN fails it: `if deg >= Self::ZERO_K { Some(Celsius(deg)) } else { None }`. Every comparison with NaN is false, so NaN lands in `else`.',
      'Implement `From`, never `Into`: `impl From<Celsius> for f64 { fn from(c: Celsius) -> f64 { c.0 } }`. The standard library then gives you `Into<f64> for Celsius` for free.',
    ],
    walkthrough: `**How to think about it.** Picture the person using this type, and the guideline each piece answers. They will want to make one (a constructor that can refuse nonsense, so it returns an \`Option\`), read it (a getter named for what it returns), convert it (a method for Fahrenheit, a standard trait for the plain number), and use it like any small value: copy it, compare it, print it. The private field is what makes the constructor’s check worth anything: nobody can build a \`Celsius(-500.0)\` around it.

**The solution, line by line.**

- \`#[derive(Debug, Clone, Copy, PartialEq, PartialOrd)]\` implements the common traits (C-COMMON-TRAITS). \`Copy\` makes \`let b = a;\` copy rather than move, which the tests rely on. Not \`Eq\` or \`Ord\`: an \`f64\` field cannot have them, because NaN is not equal to itself.
- \`pub struct Celsius(f64);\` is a newtype with a private field (C-STRUCT-PRIVATE, C-NEWTYPE): a \`Celsius\` and a plain \`f64\` cannot be mixed up by accident.
- \`pub const ZERO_K: f64 = -273.15;\` names the limit once.
- \`pub fn new(deg: f64) -> Option<Self> { if deg >= Self::ZERO_K { Some(Celsius(deg)) } else { None } }\` is the only way in. The comparison is written “is it at least the limit?”, so that NaN, for which every comparison is false, is refused.
- \`pub fn degrees(&self) -> f64 { self.0 }\` is the getter, named without \`get_\` (C-GETTER).
- \`pub fn to_fahrenheit(&self) -> f64 { self.0 * 9.0 / 5.0 + 32.0 }\` is a \`to_\` conversion: it computes a new value and leaves \`self\` alone. (Taking \`self\` by value would also be fine for a \`Copy\` type.)
- \`impl From<Celsius> for f64 { fn from(c: Celsius) -> f64 { c.0 } }\` is the standard conversion trait (C-CONV-TRAITS). Because of a blanket impl in the standard library, \`let x: f64 = c.into();\` now works as well.

**Common wrong attempts.**

- \`if deg < Self::ZERO_K { None } else { Some(Celsius(deg)) }\` reads the same but is not: \`NaN < -273.15\` is false, so NaN is accepted. The test \`new_refuses_below_absolute_zero\` checks NaN.
- Leaving out \`Copy\`. Then \`let b = a;\` moves \`a\`, and the next use of \`a\` is error E0382, “borrow of moved value”.
- Implementing \`Into<f64> for Celsius\` instead of \`From\`. The guidelines say never to implement \`Into\` directly: implement \`From\`, and \`Into\` comes with it, which is also what makes \`f64::from(c)\` work.
- Naming the getter \`get_degrees\`. It compiles, but the tests (and users who know the conventions) look for \`degrees\`.`,
    wrong: [
      {
        code: `/// A temperature in degrees Celsius,
/// never below absolute zero.
#[derive(Debug, Clone, Copy,
         PartialEq, PartialOrd)]
pub struct Celsius(f64);

impl Celsius {
    pub const ZERO_K: f64 = -273.15;

    pub fn new(deg: f64)
        -> Option<Self> {
        if deg < Self::ZERO_K {
            None
        } else {
            Some(Celsius(deg))
        }
    }

    pub fn degrees(&self) -> f64 {
        self.0
    }

    pub fn to_fahrenheit(&self) -> f64 {
        self.0 * 9.0 / 5.0 + 32.0
    }
}

impl From<Celsius> for f64 {
    fn from(c: Celsius) -> f64 {
        c.0
    }
}`,
        why: '`deg < ZERO_K` is false for NaN, so `new(f64::NAN)` returns `Some`.',
      },
      {
        code: `/// A temperature in degrees Celsius,
/// never below absolute zero.
#[derive(Debug, Clone, PartialEq,
         PartialOrd)]
pub struct Celsius(f64);

impl Celsius {
    pub const ZERO_K: f64 = -273.15;

    pub fn new(deg: f64)
        -> Option<Self> {
        if deg >= Self::ZERO_K {
            Some(Celsius(deg))
        } else {
            None
        }
    }

    pub fn degrees(&self) -> f64 {
        self.0
    }

    pub fn to_fahrenheit(&self) -> f64 {
        self.0 * 9.0 / 5.0 + 32.0
    }
}

impl From<Celsius> for f64 {
    fn from(c: Celsius) -> f64 {
        c.0
    }
}`,
        why: 'Without `Copy`, `let b = a;` moves `a`, and the test fails to compile with E0382.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Which method name fits the guidelines for a cheap, borrowed view of a `String` as bytes?',
    options: [
      {
        t: '`to_bytes`',
        why: '`to_` suggests an expensive conversion, usually a copy.',
      },
      {
        t: '`into_bytes`',
        why: '`into_` consumes the String; that is a different method.',
      },
      {
        t: '`as_bytes`',
        correct: true,
        why: '`as_` means free and borrowed to borrowed: `&str` to `&[u8]`.',
      },
      {
        t: '`get_bytes`',
        why: 'Rust avoids the `get_` prefix.',
      },
    ],
  },
  {
    q: 'Your crate defines `pub struct Url` without `Display`. Can a user’s crate add `impl Display for Url`?',
    options: [
      {
        t: 'Yes, anywhere',
        why: 'The orphan rule forbids it: they own neither the trait nor the type.',
      },
      {
        t: 'No: an impl must be in the crate of the trait or of the type, so only std or your crate can',
        correct: true,
        why: 'Which is why the guidelines say to implement common traits eagerly.',
      },
      {
        t: 'Only with `unsafe impl`',
        why: '`unsafe impl` is for unsafe traits; it does not lift the orphan rule.',
      },
    ],
  },
  {
    q: 'A crate adds a variant to a public `#[non_exhaustive]` enum. What happens to other crates’ `match` expressions on it?',
    options: [
      {
        t: 'They keep compiling, because they were already required to have a `_` arm',
        correct: true,
        why: 'non_exhaustive makes the wildcard mandatory outside the crate, so new variants break nobody.',
      },
      {
        t: 'They fail with E0004 until updated',
        why: 'That is what would happen without the attribute.',
      },
      {
        t: 'The new variant is silently ignored at run time',
        why: 'It is matched by the `_` arm, which the caller wrote and controls.',
      },
    ],
  },
  {
    q: 'In one build, crate A asks for `temps` with feature `kelvin`, crate B for `temps` with `fahrenheit`. How is `temps` built?',
    options: [
      {
        t: 'Twice, once for each',
        why: 'Cargo builds one copy, which is the reason for the rule.',
      },
      {
        t: 'Once, with the feature listed first in the lock file',
        why: 'There is no such rule.',
      },
      {
        t: 'Once, with both features enabled',
        correct: true,
        why: 'Cargo uses the union of every feature requested for a dependency.',
      },
    ],
  },
  {
    q: 'Why does the Cargo book advise a feature named `std` that adds the standard library, rather than one named `no_std` that removes it?',
    options: [
      {
        t: 'Because features are unified, and one crate turning on `no_std` would take std away from every other crate in the build',
        correct: true,
        why: 'Features must be additive: turning one on may only add things.',
      },
      {
        t: 'Because names starting with `no_` are not allowed',
        why: 'They are allowed; they are just a sign of a subtractive feature.',
      },
      {
        t: 'Because `std` is a reserved word',
        why: 'It is not; it is the conventional name for the additive version.',
      },
    ],
  },
];
