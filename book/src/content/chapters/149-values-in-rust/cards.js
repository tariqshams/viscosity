// Chapter 149 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  've-what': {
    q: 'In drip-rs, what Rust type stands for “any Drip value”?',
    a: 'An enum, `Value`, with one variant per kind: `Nil`, `Bool(bool)`, `Number(f64)`, `String(StrRef)`, and one handle variant per object type.',
  },
  've-copy': {
    q: 'Why can `Value` derive `Copy`?',
    a: 'Every payload is `Copy`: bool, f64, and handles (small indexes). No variant owns heap memory.',
  },
  've-handles': {
    q: 'What would go wrong if `Value` had a `String(String)` variant?',
    a: 'The value would own its text, so it couldn’t be `Copy`. Copying a value onto the stack would mean cloning the text, or sharing it through `Rc`.',
  },
  've-size': {
    q: 'Where does rustc put the `f64` of `Value::Number`, and why there?',
    a: 'At bytes 8 to 15, after the 1-byte tag and 7 bytes of padding: an `f64` must start at a multiple of 8.',
  },
  've-option': {
    q: 'In rustc’s layout report, why does `Option<Value>` have no discriminant of its own?',
    a: '`None` is stored as one of the tag values `Value`’s ten variants don’t use, so `Some(v)` is just `v`.',
  },
  've-hash-free': {
    q: 'Which bytes of a `Value::String` hold the string’s hash, and why is that free?',
    a: 'Bytes 8 to 11 (the handle is at 4 to 7). `Number` already needs bytes 8 to 15, so every `Value` has them anyway.',
  },
  've-nan-eq': {
    q: 'With `#[derive(PartialEq)]` on `Value`, is `Number(NaN) == Number(NaN)`?',
    a: 'No. f64 equality follows IEEE 754, so NaN is unequal to itself, as with JavaScript’s `===`.',
  },
  've-display-heap': {
    q: 'Why does printing a `Value` need a `&Heap`?',
    a: 'A string or object value holds only a handle (an index). The text and names it prints live in the heap.',
  },
  've-digits': {
    q: 'Rust prints 1e21 as `1000000000000000000000`, JavaScript as `1e+21`. What do the two agree on?',
    a: 'The digits: both use the shortest digits that read back as the same double. Only the layout differs.',
  },
  've-layout': {
    q: 'For which magnitudes does JavaScript print plain decimals instead of exponent notation?',
    a: 'From 1e-6 up to (but not including) 1e21. Outside that range it writes `d.ddde±x`.',
  },
};

export const examples = {
  sizes: {
    title: 'Measure a Value, and watch Rust print',
    lang: 'rust',
    code: `use std::mem::{align_of, size_of};

#[derive(Clone, Copy)]
struct Gc(u32);

#[derive(Clone, Copy)]
struct StrRef {
    handle: Gc,
    hash: u32,
}

#[derive(Clone, Copy)]
enum Value {
    Nil,
    Bool(bool),
    Number(f64),
    String(StrRef),
    Closure(Gc),
}

fn main() {
    let s = size_of::<Value>();
    let a = align_of::<Value>();
    println!("Value: {s} B, align {a}");
    let o = size_of::<Option<Value>>();
    println!("Option<Value>: {o}");

    // {} and {:e} for a few doubles.
    let ns = [0.1 + 0.2, 1e21, 1.5e-7,
        f64::INFINITY, f64::NAN, -0.0];
    for n in ns {
        println!("{n}   {n:e}");
    }
    // Try: delete Number. Size now?
}`,
  },
};

export const exercises = {
  value: {
    lang: 'rust',
    title: 'Your own Value',
    prompt: `Write a cut-down drip-rs \`Value\`: an enum with the variants \`Nil\`, \`Bool(bool)\`, \`Number(f64)\` and \`Str(StrRef)\`, where \`StrRef\` (given) is a string's handle and hash. It must be **Copy**, comparable with \`==\`, and printable with \`{:?}\` (the tests use all three). Then write \`is_falsey\`: Drip's rule is that only \`nil\` and \`false\` are falsey. One test checks that your \`Value\` is 16 bytes.`,
    starter: `#[derive(Clone, Copy, PartialEq, Debug)]
struct StrRef {
    handle: u32,
    hash: u32,
}

enum Value {
    Nil,
}

impl Value {
    fn is_falsey(self) -> bool {
        todo!()
    }
}`,
    solution: `#[derive(Clone, Copy, PartialEq, Debug)]
struct StrRef {
    handle: u32,
    hash: u32,
}

#[derive(Clone, Copy, PartialEq, Debug)]
enum Value {
    Nil,
    Bool(bool),
    Number(f64),
    Str(StrRef),
}

impl Value {
    fn is_falsey(self) -> bool {
        match self {
            Self::Nil => true,
            Self::Bool(b) => !b,
            _ => false,
        }
    }
}`,
    tests: `use std::mem::size_of;

#[test]
fn nil_and_false_are_falsey() {
    assert!(Value::Nil.is_falsey());
    assert!(Value::Bool(false).is_falsey());
}

#[test]
fn zero_and_strings_are_truthy() {
    assert!(!Value::Bool(true).is_falsey());
    assert!(!Value::Number(0.0).is_falsey());
    let s = StrRef { handle: 0, hash: 7 };
    assert!(!Value::Str(s).is_falsey());
}

#[test]
fn a_value_is_copied_not_moved() {
    let a = Value::Number(1.5);
    let b = a;
    assert_eq!(a, b);
}

#[test]
fn nan_is_not_equal_to_itself() {
    let n = Value::Number(f64::NAN);
    assert_ne!(n, n);
    let z = Value::Number(-0.0);
    assert_eq!(z, Value::Number(0.0));
}

#[test]
fn a_value_is_16_bytes() {
    assert_eq!(size_of::<Value>(), 16);
}`,
    hints: [
      'Each variant with a payload is written like `Number(f64)`. `Str` carries a whole `StrRef`.',
      'Put the same `#[derive(...)]` line on `Value` that `StrRef` has. `Copy` is allowed because every payload is `Copy`.',
      'For `is_falsey`, `match self` with an arm for `Self::Nil`, one for `Self::Bool(b)`, and `_ => false` for the rest. (`matches!(self, Value::Nil | Value::Bool(false))` says the same in one expression.)',
    ],
    walkthrough: `**The variants.** \`Nil\` has no payload; \`Bool(bool)\`, \`Number(f64)\` and \`Str(StrRef)\` each carry one. That is the drip-rs shape, minus the object handles.

**The derives.** \`Clone, Copy\` let \`let b = a;\` copy instead of move, so the third test can still use \`a\`. Deriving \`Copy\` only works because \`bool\`, \`f64\` and \`StrRef\` are all \`Copy\` themselves. \`PartialEq\` gives \`==\`, and \`Debug\` is what \`assert_eq!\` prints when a test fails.

**Equality for free.** The derived \`==\` compares the tag, then the payload. For \`f64\` that is IEEE comparison, so \`NaN != NaN\` and \`-0.0 == 0.0\`, exactly what JavaScript's \`===\` does, which is what Drip promises.

**Falsey.** Only two values are falsey in Drip: \`Nil\`, and \`Bool(b)\` when \`b\` is false. The \`_\` arm says everything else, including \`0\` (unlike in JavaScript), is truthy.

**16 bytes.** The biggest payloads are 8 bytes (\`f64\` and \`StrRef\`), the tag takes a byte, and the \`f64\`'s 8-byte alignment rounds 9 up to 16. Try changing \`Str\` to hold a \`String\`: the size goes to 24 and \`Copy\` stops compiling.`,
    wrong: [
      {
        code: `#[derive(Clone, Copy, PartialEq, Debug)]
struct StrRef {
    handle: u32,
    hash: u32,
}

#[derive(Clone, Copy, PartialEq, Debug)]
enum Value {
    Nil,
    Bool(bool),
    Number(f64),
    Str(String),
}

impl Value {
    fn is_falsey(self) -> bool {
        match self {
            Self::Nil => true,
            Self::Bool(b) => !b,
            _ => false,
        }
    }
}`,
        why: 'Doesn’t compile: `String` owns heap memory, so it isn’t `Copy`, and neither can `Value` be (E0204). Store a handle, not the text.',
      },
      {
        code: `#[derive(Clone, Copy, PartialEq, Debug)]
struct StrRef {
    handle: u32,
    hash: u32,
}

#[derive(Clone, Copy, PartialEq, Debug)]
enum Value {
    Nil,
    Bool(bool),
    Number(f64),
    Str(StrRef),
}

impl Value {
    fn is_falsey(self) -> bool {
        match self {
            Self::Nil => true,
            Self::Bool(b) => !b,
            Self::Number(n) => n == 0.0,
            Self::Str(_) => false,
        }
    }
}`,
        why: 'That is JavaScript’s rule, not Drip’s. In Drip, `0` is truthy: only `nil` and `false` are falsey.',
      },
      {
        code: `#[derive(Clone, Copy, PartialEq, Debug)]
struct StrRef {
    handle: u32,
    hash: u32,
}

#[derive(PartialEq, Debug)]
enum Value {
    Nil,
    Bool(bool),
    Number(f64),
    Str(StrRef),
}

impl Value {
    fn is_falsey(&self) -> bool {
        match self {
            Self::Nil => true,
            Self::Bool(b) => !b,
            _ => false,
        }
    }
}`,
        why: 'Without `Clone, Copy`, `let b = a;` moves the value, and using `a` afterwards is E0382. A VM copies values on every push and peek, so they must be `Copy`.',
      },
    ],
  },
  jsNumber: {
    optional: true,
    lang: 'rust',
    title: 'Print a number like JavaScript',
    prompt: `Write \`js_num(n)\`, returning the text JavaScript's \`String(n)\` gives, except that negative zero is \`"-0"\`, as in the TypeScript VM. Use Rust's own formatting for the digits:

- NaN is \`"NaN"\`; the infinities are \`"Infinity"\` and \`"-Infinity"\`.
- Zero, and every \`n\` whose size |n| is at least 1e-6 and below 1e21, print exactly as Rust's \`{}\` prints them.
- Everything else prints as Rust's \`{:e}\` does, except that a non-negative exponent gets a \`+\`: \`1e21\` becomes \`1e+21\`.`,
    starter: `fn js_num(n: f64) -> String {
    format!("{}", n)
}`,
    solution: `fn js_num(n: f64) -> String {
    if n.is_nan() {
        return "NaN".to_string();
    }
    if n == f64::INFINITY {
        return "Infinity".to_string();
    }
    if n == -f64::INFINITY {
        return "-Infinity".to_string();
    }
    let a = n.abs();
    let plain = 1e-6 <= a && a < 1e21;
    if a == 0.0 || plain {
        return format!("{}", n);
    }
    let s = format!("{:e}", n);
    if s.contains("e-") {
        s
    } else {
        s.replace('e', "e+")
    }
}`,
    tests: `#[test]
fn ordinary_numbers() {
    assert_eq!(js_num(100.0), "100");
    assert_eq!(js_num(0.1 + 0.2),
        "0.30000000000000004");
    assert_eq!(js_num(-123.456), "-123.456");
}

#[test]
fn nan_and_the_infinities() {
    assert_eq!(js_num(f64::NAN), "NaN");
    assert_eq!(js_num(f64::INFINITY), "Infinity");
    assert_eq!(js_num(-f64::INFINITY),
        "-Infinity");
}

#[test]
fn zero_keeps_its_sign() {
    assert_eq!(js_num(0.0), "0");
    assert_eq!(js_num(-0.0), "-0");
}

#[test]
fn big_numbers_use_e_plus() {
    assert_eq!(js_num(1e21), "1e+21");
    assert_eq!(js_num(1.2345678901234569e23),
        "1.2345678901234569e+23");
    assert_eq!(js_num(1e20),
        "100000000000000000000");
}

#[test]
fn small_numbers_use_e_minus() {
    assert_eq!(js_num(0.000001), "0.000001");
    assert_eq!(js_num(1.5e-7), "1.5e-7");
    assert_eq!(js_num(-1e-7), "-1e-7");
    assert_eq!(js_num(5e-324), "5e-324");
}`,
    hints: [
      'Deal with the odd cases first: `n.is_nan()`, `n.is_infinite()`.',
      'For the plain range, compare `n.abs()` with `1e-6` and `1e21`, and remember zero (which is below 1e-6 but prints plainly).',
      'Outside it, `format!("{:e}", n)` gives `1e21` or `1.5e-7`. Only the first needs changing: replace the `e` with `e+` when there is no `e-`.',
    ],
    walkthrough: `**Why this works.** Rust's \`{}\` and \`{:e}\` both print the shortest digits that read back as the same double, and JavaScript chooses the same digits. So you never compute digits yourself; you only choose a layout.

**The specials.** Rust spells infinity \`inf\`, and JavaScript \`Infinity\`, so those are written by hand. NaN happens to agree, but checking it first keeps the later comparisons honest (every comparison with NaN is false).

**The plain range.** JavaScript writes plain decimals for 1e-6 ≤ |n| < 1e21. Rust's \`{}\` never uses an exponent, and inside that range it prints the same text. Zero is a special case: \`0.0\` and \`-0.0\` are below 1e-6, but print as \`0\` and \`-0\`.

**The exponent form.** Outside the range, \`{:e}\` gives \`1e21\` or \`1.5e-7\`. JavaScript always writes the exponent's sign, so a non-negative exponent gets a \`+\`.

The real \`format_number\` in drip-rs does the layout itself from \`{:e}\`'s digits, following the ECMAScript algorithm step by step, so it doesn't rely on \`{}\` matching JavaScript in the middle range. It's checked against 42 numbers Node printed.`,
    wrong: [
      {
        code: `fn js_num(n: f64) -> String {
    if n.is_nan() {
        return "NaN".to_string();
    }
    if n == f64::INFINITY {
        return "Infinity".to_string();
    }
    if n == -f64::INFINITY {
        return "-Infinity".to_string();
    }
    let a = n.abs();
    let plain = 1e-7 <= a && a < 1e21;
    if a == 0.0 || plain {
        return format!("{}", n);
    }
    let s = format!("{:e}", n);
    if s.contains("e-") {
        s
    } else {
        s.replace('e', "e+")
    }
}`,
        why: 'The lower bound is off by a factor of ten: 1.5e-7 would print as `0.00000015`, but JavaScript prints `1.5e-7`. Plain decimals start at 1e-6.',
      },
      {
        code: `fn js_num(n: f64) -> String {
    if n.is_nan() {
        return "NaN".to_string();
    }
    let a = n.abs();
    let plain = 1e-6 <= a && a < 1e21;
    if a == 0.0 || plain {
        return format!("{}", n);
    }
    let s = format!("{:e}", n);
    if s.contains("e-") {
        s
    } else {
        s.replace('e', "e+")
    }
}`,
        why: 'Infinity falls through to `{:e}`, which prints `inf`, not `Infinity`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Why do drip-rs values hold `Gc` handles for objects, instead of the objects themselves?',
    options: [
      { t: 'Handles are faster to dereference than references', why: 'Speed isn’t the reason. A handle still has to be looked up in the heap’s arena.' },
      { t: 'Many values can refer to one object, and a handle owns nothing, so values stay `Copy`', correct: true, why: 'An owning variant would need one owner per object. A handle is just an index, so any number of values can carry it.' },
      { t: 'Rust enums can’t contain structs', why: 'They can. `StrRef` is a struct inside a variant.' },
      { t: 'To make `Value` smaller than 8 bytes', why: '`Value` is 16 bytes either way, because of the `f64`.' },
    ],
  },
  {
    q: 'Which of these explains the 16 bytes of a drip-rs `Value` on x86-64?',
    options: [
      { t: 'Ten variants need 16 bytes of tag', why: 'Ten variants fit in a one-byte tag.' },
      { t: 'Every Rust enum is 16 bytes', why: 'Sizes depend on the payloads. A copy of `Value` without `Number` measures 12 bytes.' },
      { t: 'The `StrRef` hash makes it 16', why: 'Without the hash, `Number` still needs 16. The hash fits in space that was already there.' },
      { t: 'An 8-byte `f64` plus a tag, rounded up to the `f64`’s 8-byte alignment', correct: true, why: '1 + 8 = 9 bytes, and a size must be a multiple of the alignment, so 16.' },
    ],
  },
  {
    q: 'What does `size_of::<Option<Value>>()` return in drip-rs (rustc 1.97, x86-64)?',
    options: [
      { t: '16', correct: true, why: '`None` uses a tag value that no variant of `Value` uses, so no extra tag is needed.' },
      { t: '17', why: 'Sizes are multiples of the alignment (8), so 17 is impossible.' },
      { t: '24', why: 'That would be a separate tag plus padding. rustc found a spare tag value instead.' },
      { t: '8', why: 'It can’t be smaller than the `Value` it may hold.' },
    ],
  },
  {
    q: 'What does `format!("{}", 1e21)` produce in Rust?',
    options: [
      { t: '`1e+21`', why: 'That’s JavaScript. Rust’s `{}` never uses an exponent.' },
      { t: '`1e21`', why: 'That’s what `{:e}` or `{:?}` print.' },
      { t: '`1000000000000000000000`', correct: true, why: 'Rust’s `Display` for floats writes plain digits. That’s why drip-rs needs its own `format_number`.' },
      { t: '`inf`', why: '1e21 is well within the range of an f64.' },
    ],
  },
  {
    q: 'Why does `value.display(&heap)` take the heap?',
    options: [
      { t: 'Printing allocates a new string in the heap', why: 'Printing only reads. It never allocates Drip objects.' },
      { t: 'A string value holds only an index, and the text is in the heap', correct: true, why: 'The handle says which slot to read; the heap is where the slot is.' },
      { t: 'The heap holds the number formatting rules', why: 'Number formatting is a plain function, `format_number`.' },
      { t: 'To run the garbage collector before printing', why: 'Displaying a value never collects.' },
    ],
  },
  {
    q: 'In drip-rs, `Value` derives `PartialEq`. Which of these is `true`?',
    options: [
      { t: '`Number(NaN) == Number(NaN)`', why: 'f64 equality follows IEEE 754: NaN is unequal to everything, itself included.' },
      { t: '`Nil == Bool(false)`', why: 'Different variants are never equal, even though both are falsey.' },
      { t: 'Two string values with the same text', correct: true, why: 'Handles compare by index, and interning gives equal text one handle, so equal strings are equal values.' },
      { t: '`Number(0.0) == Number(-0.0)` is false', why: 'IEEE 754 says 0 and -0 are equal, as JavaScript’s `===` does.' },
    ],
  },
];
