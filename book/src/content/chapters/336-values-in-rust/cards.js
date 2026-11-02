// Chapter 336 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  've-what': {
    q: 'In drip-rs, what Rust type stands for “any Drip value”?',
    a: 'An enum, `Value`, with one variant per kind: `None`, `Bool(bool)`, `Number(f64)`, `String(StrRef)`, and one handle variant per object type (eleven variants in all).',
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
    a: '`None` is stored as one of the tag values `Value`’s eleven variants don’t use, so `Some(v)` is just `v`.',
  },
  've-hash-free': {
    q: 'Which bytes of a `Value::String` hold the string’s hash, and why is that free?',
    a: 'Bytes 8 to 11 (the handle is at 4 to 7). `Number` already needs bytes 8 to 15, so every `Value` has them anyway.',
  },
  've-nan-eq': {
    q: 'With `#[derive(PartialEq)]` on `Value`, is `Number(NaN) == Number(NaN)`?',
    a: 'No. f64 equality follows IEEE 754, so NaN is unequal to itself, as with JavaScript’s `===`.',
  },
  've-format-heap': {
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
    None,
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
    prompt: `Write a cut-down drip-rs \`Value\`: an enum with the variants \`None\`, \`Bool(bool)\`, \`Number(f64)\` and \`Str(StrRef)\`, where \`StrRef\` (given) is a string's handle and hash. It must be **Copy**, comparable with \`==\`, and printable with \`{:?}\` (the tests use all three). Then write \`is_falsey\`: Drip's rule is that only \`none\` and \`false\` are falsey. One test checks that your \`Value\` is 16 bytes.`,
    starter: `#[derive(Clone, Copy, PartialEq, Debug)]
struct StrRef {
    handle: u32,
    hash: u32,
}

enum Value {
    None,
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
    None,
    Bool(bool),
    Number(f64),
    Str(StrRef),
}

impl Value {
    fn is_falsey(self) -> bool {
        match self {
            Self::None => true,
            Self::Bool(b) => !b,
            _ => false,
        }
    }
}`,
    tests: `use std::mem::size_of;

#[test]
fn none_and_false_are_falsey() {
    assert!(Value::None.is_falsey());
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
      'For `is_falsey`, `match self` with an arm for `Self::None`, one for `Self::Bool(b)`, and `_ => false` for the rest. (`matches!(self, Value::None | Value::Bool(false))` says the same in one expression.)',
    ],
    walkthrough: `**How to think about it.** Start from the question the VM asks of every value: "what kind are you, and what do you carry?" That is exactly an enum: one variant per kind, with a payload where there is something to carry. Then ask what the VM does with values all day (copies them onto and off the stack, compares them), and that tells you which traits to derive.

**The solution, line by line.**

- \`#[derive(Clone, Copy, PartialEq, Debug)]\` on \`Value\`: \`Clone\` and \`Copy\` make \`let b = a;\` a copy rather than a move, so the third test can still use \`a\`; \`PartialEq\` gives \`==\`; \`Debug\` is what \`assert_eq!\` prints when a test fails. Deriving \`Copy\` compiles only because \`bool\`, \`f64\` and \`StrRef\` are all \`Copy\` themselves.
- \`None,\` has no payload: there is nothing to carry.
- \`Bool(bool),\` and \`Number(f64),\` carry their value inline.
- \`Str(StrRef),\` carries the string's handle and hash, never the text, which lives in the heap.
- \`fn is_falsey(self) -> bool {\` takes \`self\` by value, which is free for a \`Copy\` type.
- \`Self::None => true,\` the first falsey value.
- \`Self::Bool(b) => !b,\` falsey exactly when \`b\` is \`false\`.
- \`_ => false,\` everything else is truthy, including \`0\` and the empty string (unlike JavaScript, where \`0\` is falsy). \`matches!(self, Value::None | Value::Bool(false))\`, as drip-rs writes it, says the same in one expression.

**What the tests also show.** The derived \`==\` compares the tag, then the payload, and for \`f64\` that is IEEE comparison: \`NaN != NaN\` and \`-0.0 == 0.0\`, exactly JavaScript's \`===\`, which is what Drip promises. And the size: the biggest payloads are 8 bytes (\`f64\` and \`StrRef\`), the tag takes a byte, and the \`f64\`'s 8-byte alignment rounds 9 up to 16.

**Common wrong attempts.**

- Using JavaScript's rule and calling \`Number(0.0)\` falsey: in Drip only \`none\` and \`false\` are.
- Leaving \`Copy\` out of the derive: \`let b = a;\` then moves \`a\`, and the test that uses \`a\` afterwards does not compile.
- Giving \`Str\` a \`String\` payload: \`Copy\` stops compiling (E0204), and the size grows to 24.`,
    wrong: [
      {
        code: `#[derive(Clone, Copy, PartialEq, Debug)]
struct StrRef {
    handle: u32,
    hash: u32,
}

#[derive(Clone, Copy, PartialEq, Debug)]
enum Value {
    None,
    Bool(bool),
    Number(f64),
    Str(String),
}

impl Value {
    fn is_falsey(self) -> bool {
        match self {
            Self::None => true,
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
    None,
    Bool(bool),
    Number(f64),
    Str(StrRef),
}

impl Value {
    fn is_falsey(self) -> bool {
        match self {
            Self::None => true,
            Self::Bool(b) => !b,
            Self::Number(n) => n == 0.0,
            Self::Str(_) => false,
        }
    }
}`,
        why: 'That is JavaScript’s rule, not Drip’s. In Drip, `0` is truthy: only `none` and `false` are falsey.',
      },
      {
        code: `#[derive(Clone, Copy, PartialEq, Debug)]
struct StrRef {
    handle: u32,
    hash: u32,
}

#[derive(PartialEq, Debug)]
enum Value {
    None,
    Bool(bool),
    Number(f64),
    Str(StrRef),
}

impl Value {
    fn is_falsey(&self) -> bool {
        match self {
            Self::None => true,
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
    walkthrough: `**How to think about it.** Rust's \`{}\` and \`{:e}\` both print the shortest digits that read back as the same double, and JavaScript chooses the same digits. So you never compute digits yourself; you only choose a layout, and the layout depends on three things: is the number special (NaN, an infinity), is it in JavaScript's plain range, and if not, does its exponent need a \`+\`.

**The solution, line by line.**

- \`if n.is_nan() { return "NaN".to_string(); }\` handles NaN first. Rust happens to print \`NaN\` too, but checking it first keeps the later comparisons honest, because every comparison with NaN is false.
- \`if n == f64::INFINITY { return "Infinity".to_string(); }\` and the same for \`-f64::INFINITY\`: Rust spells these \`inf\` and \`-inf\`, JavaScript \`Infinity\` and \`-Infinity\`. (Drip itself then renames them \`inf\`, \`-inf\` and \`nan\`.)
- \`let a = n.abs();\` the size of the number, whatever its sign.
- \`let plain = 1e-6 <= a && a < 1e21;\` JavaScript's plain-decimal range.
- \`if a == 0.0 || plain { return format!("{}", n); }\`: inside the range Rust's \`{}\` prints the same text as JavaScript. Zero is below 1e-6 but prints plainly, and Rust's \`{}\` prints \`-0\` for negative zero, which is what the TypeScript VM wants.
- \`let s = format!("{:e}", n);\` gives \`1e21\` or \`1.5e-7\`.
- \`if s.contains("e-") { s } else { s.replace('e', "e+") }\`: JavaScript always writes the exponent's sign, so only a non-negative exponent needs a \`+\` added.

The real \`format_number\` in drip-rs does the layout itself from \`{:e}\`'s digits, following the ECMAScript steps, so it does not rely on \`{}\` matching JavaScript in the middle range; it is checked against 42 numbers Node printed.

**Common wrong attempts.**

- A lower bound of 1e-7: \`1.5e-7\` then prints as \`0.00000015\`, but JavaScript prints \`1.5e-7\`.
- Forgetting the infinities: they fall through to \`{:e}\`, which prints \`inf\`.`,
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
      { t: 'Eleven variants need 16 bytes of tag', why: 'Eleven variants fit in a one-byte tag.' },
      { t: 'Every Rust enum is 16 bytes', why: 'Sizes depend on the payloads. A copy of `Value` without `Number` measures 12 bytes.' },
      { t: 'The `StrRef` hash makes it 16', why: 'Without the hash, `Number` still needs 16. The hash fits in space that was already there.' },
      { t: 'An 8-byte `f64` plus a tag, rounded up to the `f64`’s 8-byte alignment', correct: true, why: '1 + 8 = 9 bytes, and a size must be a multiple of the alignment, so 16.' },
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
    q: 'Why does `value.format(&heap)` take the heap?',
    options: [
      { t: 'Printing allocates a new string in the heap', why: 'Printing only reads. It never allocates Drip objects.' },
      { t: 'A string value holds only an index, and the text is in the heap', correct: true, why: 'The handle says which slot to read; the heap is where the slot is.' },
      { t: 'The heap holds the number formatting rules', why: 'Number formatting is a plain function, `format_number`.' },
      { t: 'To run the garbage collector before printing', why: 'Formatting a value never collects.' },
    ],
  },
  {
    q: 'In drip-rs, `Value` derives `PartialEq`. Which of these is `true`?',
    options: [
      { t: '`Number(NaN) == Number(NaN)`', why: 'f64 equality follows IEEE 754: NaN is unequal to everything, itself included.' },
      { t: '`None == Bool(false)`', why: 'Different variants are never equal, even though both are falsey.' },
      { t: 'Two string values with the same text', correct: true, why: 'Handles compare by index, and interning gives equal text one handle, so equal strings are equal values.' },
      { t: '`Number(0.0) == Number(-0.0)` is false', why: 'IEEE 754 says 0 and -0 are equal, as JavaScript’s `===` does.' },
    ],
  },
];
