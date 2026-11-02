// Chapter 328 cards. Keys are stable ids: never rename them.
// Every rustc message and output quoted here was produced with rustc
// 1.97.0 (nightly for -Zunpretty=expanded) and gcc 13.3 on x86-64 Linux.

const L = (...xs) => xs.join('\n');

export const prompts = {
  'macro-not-fn': {
    q: 'Name one thing a macro can do that a Rust function cannot.',
    a: 'Take any number of arguments (like `vec![1, 2, 3]`), or produce new items such as structs and impls, because it works on code before compilation.',
  },
  'first-rule': {
    q: 'A `macro_rules!` macro has several rules and a call matches two of them. Which one is used?',
    a: 'The first one, in the order they are written.',
  },
  'double-brace': {
    q: 'Why do many transcribers use doubled braces, `=> {{ ... }}`?',
    a: 'The outer pair belongs to the rule; the inner pair is a block in the output, so several statements become one expression with a value.',
  },
  'frag-spec': {
    q: 'In `$x:expr`, what is `expr`?',
    a: 'A fragment specifier: it says the variable `$x` must match one complete expression.',
  },
  'tt-what': {
    q: 'What does the `tt` fragment match?',
    a: 'One token tree: a single token, or a whole bracketed group with everything inside it.',
  },
  repeat: {
    q: 'What does `$($x:expr),*` match?',
    a: 'Zero or more expressions separated by commas; `$( ... )*` in the transcriber then repeats once per match.',
  },
  'nine-not-five': {
    q: 'Why is `square!(1 + 2)` 9 in Rust, when C’s `#define SQUARE(x) x * x` gives 5?',
    a: 'Rust pastes the matched `expr` as one syntax-tree node, so it acts like `(1 + 2) * (1 + 2)`; C pastes text, giving `1 + 2 * 1 + 2`.',
  },
  'hygiene-rust': {
    q: 'A macro’s transcriber uses a variable `x` that the macro was not given, and the caller has a `let x`. What happens?',
    a: 'Error E0425 “cannot find value `x`”: hygiene stops the macro from capturing the caller’s local. Pass it in as an `ident`.',
  },
};

export const examples = {
  'three-macros': {
    lang: 'rust',
    title: 'square!, twice! and my_vec!',
    code: String.raw`macro_rules! square {
    ($x:expr) => {
        $x * $x
    };
}

macro_rules! twice {
    ($e:expr) => {{
        let t = 2;
        $e * t
    }};
}

macro_rules! my_vec {
    ($($x:expr),* $(,)?) => {{
        let mut v = Vec::new();
        $( v.push($x); )*
        v
    }};
}

fn main() {
    println!("{}", square!(1 + 2));
    let t = 5;
    println!("{}", twice!(t + 1));
    let v: Vec<i32> = my_vec![1, 2, 3];
    println!("{v:?}");
}`,
  },
};

const HM_TESTS = String.raw`use std::collections::HashMap;

#[test]
fn builds_a_map_from_pairs() {
    let m = hashmap! { "a" => 1, "b" => 2 };
    assert_eq!(m.len(), 2);
    assert_eq!(m["a"], 1);
    assert_eq!(m["b"], 2);
}

#[test]
fn allows_a_trailing_comma() {
    let m = hashmap! {
        1 => "one",
        2 => "two",
    };
    assert_eq!(m[&2], "two");
}

#[test]
fn keys_and_values_can_be_expressions() {
    let k = String::from("x");
    let m = hashmap! { k.clone() + "y" => 2 * 21 };
    assert_eq!(m["xy"], 42);
}

#[test]
fn empty_braces_make_an_empty_map() {
    let m: HashMap<u8, u8> = hashmap! {};
    assert!(m.is_empty());
}

#[test]
fn later_keys_win() {
    let m = hashmap! { "k" => 1, "k" => 2 };
    assert_eq!(m.len(), 1);
    assert_eq!(m["k"], 2);
}`;

const NE_TESTS = String.raw`named_enum!(Color { Red, Green, Blue });
named_enum!(Dir { Up, Down, });

#[test]
fn makes_the_enum() {
    let c = Color::Green;
    assert_eq!(c, Color::Green);
    assert_ne!(Color::Red, Color::Blue);
    assert_eq!(format!("{:?}", Dir::Down), "Down");
}

#[test]
fn lists_the_names_in_order() {
    assert_eq!(Color::names(), ["Red", "Green", "Blue"]);
}

#[test]
fn trailing_comma_is_fine() {
    assert_eq!(Dir::names(), ["Up", "Down"]);
}`;

export const exercises = {
  hashmap: {
    lang: 'rust',
    title: 'A hashmap! literal',
    prompt:
      'Rust has `vec![...]` but no literal for maps. Write a `macro_rules!` macro `hashmap!` so that `hashmap! { "a" => 1, "b" => 2 }` builds a `HashMap` with those entries. It must accept any number of `key => value` pairs (including none), allow a trailing comma, and accept any expressions as keys and values. When a key appears twice, the later value wins (which `HashMap::insert` does for you).',
    starter: String.raw`use std::collections::HashMap;

macro_rules! hashmap {
    () => {
        todo!()
    };
}`,
    solution: String.raw`use std::collections::HashMap;

macro_rules! hashmap {
    ($($k:expr => $v:expr),*
     $(,)?) => {{
        let mut m = HashMap::new();
        $( m.insert($k, $v); )*
        m
    }};
}`,
    tests: HM_TESTS,
    hints: [
      'Start from `my_vec!` in the chapter: the same three steps (make an empty collection, add each item, hand it back), with a pair instead of a single item.',
      'The repeated part of the matcher is one pair, `$k:expr => $v:expr`. `=>` is allowed after an `expr` fragment. Wrap it as `$( ... ),*` and add `$(,)?` for the trailing comma.',
      'The transcriber needs double braces so its three statements become one expression: `{{ let mut m = HashMap::new(); $( m.insert($k, $v); )* m }}`.',
    ],
    walkthrough: L(
      '**How to think about it.** Write out by hand what one call should turn into, then make the macro produce it. `hashmap! { "a" => 1, "b" => 2 }` should become a block: make an empty map, insert `"a"` with `1`, insert `"b"` with `2`, and give back the map. The part that repeats is one `insert` per pair, so the matcher must capture a list of pairs, and the transcriber must repeat the `insert` line once per pair. That is `my_vec!` with pairs.',
      '',
      '**The solution, line by line.**',
      '',
      '- `use std::collections::HashMap;` brings `HashMap` into scope. The macro’s output names `HashMap`, and a type name in a macro’s output is looked up where the macro is *called* (only local variables and labels are hygienic), which is why the tests also import it.',
      '- `macro_rules! hashmap {` starts the definition. There is one rule.',
      '- `($($k:expr => $v:expr),*` is the matcher’s main part: zero or more repetitions of “an expression, the token `=>`, an expression”, separated by commas. Each repetition binds one `$k` and one `$v`. The call may use braces, brackets or parentheses; `hashmap! { ... }` uses braces so it looks like a map.',
      '- `$(,)?) => {{` allows one optional comma at the end, then closes the matcher. The doubled brace opens a block in the output.',
      '- `let mut m = HashMap::new();` makes the empty map. The key and value types are inferred from the inserts (or, for an empty call, from the type the caller wrote).',
      '- `$( m.insert($k, $v); )*` repeats once per captured pair, in order, so later keys overwrite earlier ones, as `HashMap::insert` does.',
      '- `m` is the block’s last expression, so the whole call has the map as its value; `}};` closes the block and the rule.',
      '',
      '**Common wrong attempts.**',
      '',
      '- Leaving out `$(,)?`. Every test without a trailing comma passes, but the trailing-comma test does not compile: rustc 1.97 says “unexpected end of macro invocation … missing tokens in macro arguments”, because after the last comma it expects another `$k:expr`.',
      '- Single braces in the transcriber, `=> { let mut m = ...; m };`. The expansion is then three statements, not one expression, and `let m = hashmap! {...}` fails with “expected expression, found `let` statement” and “macro expansion ignores `m` and any tokens following”.',
      '- Matching `$k:ident` instead of `$k:expr`. That accepts `a => 1` but rejects string keys like `"a"`, which are literals, not names.',
      '- Writing `$k: expr` and `$v: expr` with `;` between pairs while calling with commas: the separator in `$( ... ),*` must match the separator in the call.',
    ),
    wrong: [
      {
        code: String.raw`use std::collections::HashMap;

macro_rules! hashmap {
    ($($k:expr => $v:expr),*) => {{
        let mut m = HashMap::new();
        $( m.insert($k, $v); )*
        m
    }};
}`,
        why: 'No `$(,)?`, so the call with a trailing comma fails to compile: “unexpected end of macro invocation”.',
      },
      {
        code: String.raw`use std::collections::HashMap;

macro_rules! hashmap {
    ($($k:expr => $v:expr),*
     $(,)?) => {
        let mut m = HashMap::new();
        $( m.insert($k, $v); )*
        m
    };
}`,
        why: 'Single braces: the expansion is statements, not an expression, so `let m = hashmap! {...}` fails with “expected expression, found `let` statement”.',
      },
    ],
  },
  'named-enum': {
    optional: true,
    lang: 'rust',
    title: 'An enum that knows its variants’ names',
    prompt:
      'Write `named_enum!`, so that `named_enum!(Color { Red, Green, Blue });` defines `enum Color { Red, Green, Blue }` (deriving `Debug`, `Clone`, `Copy` and `PartialEq`) and an associated function `Color::names()` returning the variant names in order, as a `Names` (a `&\'static [&\'static str]`, given). A trailing comma after the last variant must be allowed. A function could not do this: it would have to create a new type.',
    starter: String.raw`type Names = &'static [&'static str];

macro_rules! named_enum {
    ($name:ident) => {};
}`,
    solution: String.raw`type Names = &'static [&'static str];

macro_rules! named_enum {
    ($name:ident {
        $($v:ident),* $(,)?
    }) => {
        #[derive(Debug, Clone, Copy,
                 PartialEq)]
        enum $name { $($v),* }

        impl $name {
            fn names() -> Names {
                &[$(stringify!($v)),*]
            }
        }
    };
}`,
    tests: NE_TESTS,
    hints: [
      'The enum’s name and each variant are names, so both are `ident` fragments. The matcher mirrors the call: a name, then braces holding comma-separated names.',
      'The transcriber produces two items: the `enum` (repeat `$v` separated by commas inside its braces) and an `impl` block for `$name`.',
      '`stringify!($v)` turns the tokens of `$v` into a string literal at compile time, so `&[$(stringify!($v)),*]` becomes `&["Red", "Green", "Blue"]`.',
    ],
    walkthrough: L(
      '**How to think about it.** Write the output for `Color` by hand: a derived `enum Color { Red, Green, Blue }`, and `impl Color { fn names() -> Names { &["Red", "Green", "Blue"] } }`. The variant list appears twice in that output, once as names and once as strings, so the macro captures it once and repeats it twice. Since the output is items (a type and an impl) rather than an expression, the transcriber has single braces.',
      '',
      '**The solution, line by line.**',
      '',
      '- `type Names = &\'static [&\'static str];` (given) is a short name for “a borrowed slice of string literals that lives for the whole program”.',
      '- `($name:ident { $($v:ident),* $(,)? }) => {` matches a name, then a brace group holding zero or more comma-separated names and an optional trailing comma. Inside a matcher, `{` and `}` are literal tokens to match.',
      '- `#[derive(Debug, Clone, Copy, PartialEq)]` and `enum $name { $($v),* }` write the type: `$name` becomes `Color`, and the repetition writes `Red, Green, Blue`.',
      '- `impl $name { fn names() -> Names {` opens the associated function on the new type.',
      '- `&[$(stringify!($v)),*]` repeats `stringify!($v)` per variant. `stringify!` is a built-in macro that turns its input tokens into a string literal, so this is `&["Red", "Green", "Blue"]`, a slice of literals, which lives forever.',
      '',
      '**Common wrong attempts.**',
      '',
      '- Double braces, `=> {{ ... }}`, copied from the `hashmap!` exercise. The output is then a block, and a block cannot stand where items are expected, at the top level of a file: rustc 1.97 says “macro expansion ignores `{` and any tokens following”. Double braces are for macros that produce an expression; this one produces items.',
      '- `$v:expr` instead of `$v:ident`: an `expr` cannot be used where a variant name is required, and the `enum` line fails to parse.',
      '- Writing `"$v"`: a string literal is not a template, so every name would be the two characters `$v`. That is what `stringify!` is for.',
    ),
  },
};

export const quiz = [
  {
    q: 'With `macro_rules! square { ($x:expr) => { $x * $x }; }`, what is `square!(2 + 1)`?',
    options: [
      { t: '5, as with a C macro', why: 'C pastes text; Rust pastes the expression `2 + 1` as one node.' },
      { t: '9', correct: true, why: 'It behaves as `(2 + 1) * (2 + 1)`.' },
      { t: 'A compile error: `2 + 1` is not one token', why: '`expr` matches a whole expression, however many tokens it has.' },
    ],
  },
  {
    q: '`square!(2, 3)` fails with “no rules expected `,`”. Why?',
    options: [
      { t: 'Macros cannot take two arguments', why: 'They can; this macro’s only rule has room for one expression.' },
      { t: 'The only rule matches one `expr` and nothing after it, so the comma fits no rule', correct: true, why: 'A call is checked against every rule; if none matches, it is an error at the call.' },
      { t: '`2, 3` is a tuple without brackets', why: 'There is no tuple here; the tokens match no rule.' },
    ],
  },
  {
    q: 'Which matcher accepts `my_vec![]`, `my_vec![1]` and `my_vec![1, 2,]`?',
    options: [
      { t: '`($($x:expr),+)`', why: '`+` needs at least one item, and there is no room for the trailing comma.' },
      { t: '`($x:expr, $($rest:expr),*)`', why: 'This needs at least one expression followed by a comma.' },
      { t: '`($($x:expr),* $(,)?)`', correct: true, why: 'Zero or more comma-separated expressions, then an optional comma.' },
      { t: '`($x:tt)`', why: 'One token tree: `1, 2,` is several.' },
    ],
  },
  {
    q: '`twice!` is `($e:expr) => {{ let t = 2; $e * t }}`. The caller writes `let t = 5; twice!(t + 1)`. What is the value?',
    options: [
      { t: '6', why: 'That is `t + 1` alone; the macro still multiplies it by its own `t`, which is 2.' },
      { t: '12', correct: true, why: 'The caller’s `t` is 5, so `$e` is 6, times the macro’s own `t`, 2.' },
      { t: '9', why: 'That would need the caller’s `t + 1` to see the macro’s `t = 2`. Hygiene prevents it.' },
    ],
  },
  {
    q: 'When is a macro the right tool rather than a function?',
    options: [
      { t: 'Whenever the code is short, because macros are faster', why: 'A function call is usually inlined anyway; macros are not faster, only more powerful and harder to read.' },
      { t: 'When you need something a function cannot do, such as any number of arguments or generating new items', correct: true, why: 'Otherwise a function is easier to read, type-check and debug.' },
      { t: 'When the code must run at compile time', why: 'Macros produce code at compile time; the code they produce still runs when the program runs.' },
    ],
  },
];
