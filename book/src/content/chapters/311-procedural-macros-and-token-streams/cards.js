// Procedural macros and token streams cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'tt-kinds': {
    q: 'What are the four kinds of token tree?',
    a: '`Ident` (a name or keyword), `Punct` (one punctuation character), `Literal` (a number, string or character) and `Group` (a bracketed run of token trees).',
  },
  'not-ast': {
    q: 'How is a token stream different from a syntax tree?',
    a: 'Its only structure is matched brackets: it has no expressions, types or items. `a + b + (c)` is a flat run of trees, not a tree of additions.',
  },
  group: {
    q: 'A derive is given `struct Point { x: f64, y: f64 }`. How many token trees are at the top level?',
    a: 'Three: `struct`, `Point`, and one brace `Group` holding the fields.',
  },
  'pm-what': {
    q: 'What is a **procedural macro**?',
    a: 'A Rust function in a `proc-macro` crate that the compiler runs during expansion: it takes a `TokenStream` and returns one.',
  },
  'pm-crate': {
    q: 'Why must a procedural macro live in a crate of its own?',
    a: 'It is compiled first, for the machine doing the build, and run inside the compiler while other crates are expanded; it cannot be used in the crate that defines it.',
  },
  'three-kinds': {
    q: 'Name the three kinds of procedural macro, and what each does with its item.',
    a: 'Function-like (`m!(...)`, replaces the call), derive (`#[derive(M)]`, adds items after a struct or enum), attribute (`#[m]`, replaces the item).',
  },
  'syn-quote': {
    q: 'What do the `syn` and `quote` crates do?',
    a: '`syn` parses a token stream into a Rust syntax tree; `quote!` builds a token stream from a template, with `#var` and `#(...)*`.',
  },
  span: {
    q: 'Why is `syn::Error::new_spanned(name, "...")` better than `panic!` in a derive?',
    a: 'It points the error at the user’s own code (the span of `name`), instead of a vague “proc-macro derive panicked” on the derive line.',
  },
};

export const examples = {
  'toy-tokens': {
    lang: 'rust',
    title: 'A toy lexer that builds token trees',
    code: `// A toy version of what rustc hands a
// procedural macro: token trees.
#![allow(dead_code)]

#[derive(Debug)]
enum Tt {
    Ident(String),
    Punct(char),
    Group(char, Vec<Tt>),
}

fn closer(c: char) -> Option<char> {
    match c {
        '(' => Some(')'),
        '[' => Some(']'),
        '{' => Some('}'),
        _ => None,
    }
}

// Read the rest of a word from c on.
fn word(cs: &[char], i: &mut usize,
        c: char) -> Tt {
    let mut w = c.to_string();
    while *i < cs.len()
        && cs[*i].is_alphanumeric()
    {
        w.push(cs[*i]);
        *i += 1;
    }
    Tt::Ident(w)
}

fn lex(cs: &[char], i: &mut usize,
       end: Option<char>) -> Vec<Tt> {
    let mut out = Vec::new();
    while *i < cs.len() {
        let c = cs[*i];
        *i += 1;
        if Some(c) == end {
            break;
        }
        if c.is_whitespace() {
            continue;
        }
        let t = if c.is_alphanumeric() {
            word(cs, i, c)
        } else if closer(c).is_some() {
            let e = closer(c);
            Tt::Group(c, lex(cs, i, e))
        } else {
            Tt::Punct(c)
        };
        out.push(t);
    }
    out
}

fn main() {
    let src = "struct P { x: f64 }";
    let cs: Vec<char> =
        src.chars().collect();
    for t in lex(&cs, &mut 0, None) {
        println!("{t:?}");
    }
}`,
  },
};

export const exercises = {
  'field-names': {
    lang: 'rust',
    title: 'A struct’s fields, from its token trees',
    prompt: 'A derive receives a struct as token trees. Using the simplified `Tt` type given (like `proc_macro::TokenTree`, with a `Group` holding its delimiter and the trees inside), write `field_names(ts)`, which returns the struct’s name and the names of its fields in order, or `None` if the trees contain no `struct`. Be careful: `#[...]` attributes and `pub` may appear before `struct` and before fields; types may be paths like `std::string::String` (so a `:` does not always follow a field name); and commas inside `<...>`, as in `HashMap<String, u8>`, do not separate fields, because `<` and `>` are punctuation, not groups.',
    starter: `// A token tree, simplified from
// proc_macro::TokenTree.
#[derive(Debug, Clone, PartialEq)]
enum Tt {
    Ident(String),
    Punct(char),
    Lit(String),
    // delimiter ('(', '[' or '{'),
    // and the trees inside it
    Group(char, Vec<Tt>),
}

fn field_names(ts: &[Tt])
    -> Option<(String, Vec<String>)> {
    todo!()
}`,
    solution: `// A token tree, simplified from
// proc_macro::TokenTree.
#[derive(Debug, Clone, PartialEq)]
enum Tt {
    Ident(String),
    Punct(char),
    Lit(String),
    // delimiter ('(', '[' or '{'),
    // and the trees inside it
    Group(char, Vec<Tt>),
}

fn is_word(t: &Tt, w: &str) -> bool {
    matches!(t, Tt::Ident(s) if s == w)
}

fn braces(t: &Tt) -> Option<&Vec<Tt>> {
    match t {
        Tt::Group('{', v) => Some(v),
        _ => None,
    }
}

fn field_names(ts: &[Tt])
    -> Option<(String, Vec<String>)> {
    let at = ts.iter().position(|t| {
        is_word(t, "struct")
    })?;
    let Some(Tt::Ident(name)) =
        ts.get(at + 1)
    else {
        return None;
    };
    let body = ts[at + 2..].iter()
        .find_map(braces)?;
    let mut out = Vec::new();
    let mut d = 0; // depth inside < >
    let mut start = true;
    for t in body {
        match t {
            Tt::Punct('<') => d += 1,
            Tt::Punct('>') => d -= 1,
            Tt::Punct(',') => {
                if d == 0 {
                    start = true;
                }
            }
            Tt::Ident(w) if start => {
                if w != "pub" {
                    out.push(w.clone());
                    start = false;
                }
            }
            _ => {}
        }
    }
    Some((name.clone(), out))
}`,
    tests: `// A tiny lexer for the tests: identifiers, string literals,
// one-character punctuation, and bracketed groups.
fn toks(src: &str) -> Vec<Tt> {
    fn go(cs: &[char], i: &mut usize, close: Option<char>) -> Vec<Tt> {
        let mut out = Vec::new();
        while *i < cs.len() {
            let c = cs[*i];
            if Some(c) == close {
                *i += 1;
                return out;
            }
            if c.is_whitespace() {
                *i += 1;
            } else if c.is_alphanumeric() || c == '_' {
                let s = *i;
                while *i < cs.len() && (cs[*i].is_alphanumeric() || cs[*i] == '_') {
                    *i += 1;
                }
                out.push(Tt::Ident(cs[s..*i].iter().collect()));
            } else if c == '"' {
                let s = *i;
                *i += 1;
                while cs[*i] != '"' {
                    *i += 1;
                }
                *i += 1;
                out.push(Tt::Lit(cs[s..*i].iter().collect()));
            } else if let Some(end) = match c { '(' => Some(')'), '[' => Some(']'), '{' => Some('}'), _ => None } {
                *i += 1;
                let inner = go(cs, i, Some(end));
                out.push(Tt::Group(c, inner));
            } else {
                *i += 1;
                out.push(Tt::Punct(c));
            }
        }
        out
    }
    let cs: Vec<char> = src.chars().collect();
    go(&cs, &mut 0, None)
}

fn names(src: &str) -> Option<(String, Vec<String>)> {
    field_names(&toks(src))
}

fn want(name: &str, fs: &[&str]) -> Option<(String, Vec<String>)> {
    Some((name.to_string(), fs.iter().map(|s| s.to_string()).collect()))
}

#[test]
fn a_plain_struct() {
    assert_eq!(names("struct Point { x: f64, y: f64 }"),
        want("Point", &["x", "y"]));
}

#[test]
fn trailing_comma_and_no_fields() {
    assert_eq!(names("struct A { a: u8, }"), want("A", &["a"]));
    assert_eq!(names("struct E {}"), want("E", &[]));
}

#[test]
fn paths_in_types_are_not_fields() {
    assert_eq!(names("struct S { a: std::string::String, b: u8 }"),
        want("S", &["a", "b"]));
}

#[test]
fn commas_inside_angle_brackets_do_not_split() {
    assert_eq!(names("struct M { m: HashMap<String, Vec<u8>>, n: u8 }"),
        want("M", &["m", "n"]));
}

#[test]
fn pub_and_attributes_are_skipped() {
    let src = "#[derive(Debug)] pub struct P { pub a: u8, #[doc = \\"x\\"] b: u8, pub(crate) c: u8 }";
    assert_eq!(names(src), want("P", &["a", "b", "c"]));
}

#[test]
fn generic_structs_work() {
    assert_eq!(names("struct W<T> { v: Vec<T> }"), want("W", &["v"]));
}

#[test]
fn not_a_struct_gives_none() {
    assert_eq!(names("enum Shape { Dot, Line }"), None);
    assert_eq!(names("struct"), None);
}`,
    hints: [
      'Break it in two: find the struct (the tree after the `struct` keyword is its name, and the first brace group after that is its body), then walk the body.',
      'A field name is the first identifier after the start of the body or after a top-level comma, skipping `pub`. Keep a flag “at the start of a field”, set it after each comma and clear it after taking a name.',
      'For the commas, keep a depth counter: add one at `Punct(\'<\')`, take one away at `Punct(\'>\')`, and only treat a comma as a separator when the depth is 0. Attributes and `pub(crate)` are groups, which the walk can ignore.',
    ],
    walkthrough: `**How to think about it.** A derive gets no syntax tree, only trees of tokens, so you must decide by hand what a “field” looks like in tokens. Look at the test inputs written out as trees. \`struct S { pub a: std::string::String, b: HashMap<String, u8> }\` is \`Ident(struct) Ident(S) Group({ ... })\`, and inside the group: \`pub a : std : : string : : String , b : HashMap < String , u8 >\`. Two tempting rules fail on that line. “A name followed by \`:\`” also catches \`std\` and \`string\`, because \`::\` is two \`:\` punctuation tokens. “Split at every comma” splits \`HashMap<String, u8>\` in two, because \`<\` and \`>\` are not brackets to the token-tree level, only punctuation. The rule that works is: fields are separated by commas *at angle-bracket depth zero*, and a field’s name is the first identifier in its piece that is not \`pub\`.

**The solution, line by line.**

- \`fn is_word(t: &Tt, w: &str) -> bool { matches!(t, Tt::Ident(s) if s == w) }\` is a helper: is this tree the identifier \`w\`? \`matches!\` is a standard macro that runs a pattern (with a guard) and gives \`true\` or \`false\`.
- \`fn braces(t: &Tt) -> Option<&Vec<Tt>>\` returns the inside of a \`{ }\` group, and \`None\` for anything else. It exists so that \`find_map\` can use it.
- \`let at = ts.iter().position(|t| { is_word(t, "struct") })?;\` finds where the keyword is. \`position\` gives \`Some(index)\` or \`None\`, and \`?\` returns \`None\` from the whole function if there is no \`struct\` (as for the enum test). Anything before it, such as \`#[derive(Debug)]\` or \`pub\`, is skipped.
- \`let Some(Tt::Ident(name)) = ts.get(at + 1) else { return None; };\` takes the next tree, which must be the name. \`get\` avoids a panic when \`struct\` is the last token (the \`names("struct")\` test), and \`let ... else\` returns \`None\` when the pattern does not match.
- \`let body = ts[at + 2..].iter().find_map(braces)?;\` finds the first brace group after the name. Searching, rather than taking the very next tree, skips generic parameters such as \`<T>\` in \`struct W<T> { ... }\`.
- \`let mut out = Vec::new(); let mut d = 0; let mut start = true;\` are the results, the angle-bracket depth, and the flag “the next identifier starts a field”.
- \`Tt::Punct('<') => d += 1,\` and \`Tt::Punct('>') => d -= 1,\` track whether we are inside a type’s angle brackets.
- \`Tt::Punct(',') => { if d == 0 { start = true; } }\` marks the start of the next field, but only for commas outside angle brackets.
- \`Tt::Ident(w) if start => { if w != "pub" { out.push(w.clone()); start = false; } }\` takes the first identifier of a field as its name, unless it is \`pub\`, in which case we stay at the start and take the next one. Groups (\`#[doc = "x"]\`’s brackets, \`pub(crate)\`’s parentheses) and \`#\` fall into \`_ => {}\`, ignored.
- \`Some((name.clone(), out))\` returns the name and the fields in the order seen.

One thing this does not handle is a function-pointer type such as \`f: fn(u8) -> u8\`, whose \`->\` contains a \`>\` that is not closing anything: the depth would go below zero. This is exactly the kind of case \`syn\` gets right, and why nearly every real derive uses it.

**Common wrong attempts.**

- “A field is an identifier followed by \`Punct(':')\`.” It finds \`a\` and \`b\`, but also \`std\` and \`string\` in \`std::string::String\`, so the paths test fails.
- Splitting at every comma, without the depth counter. \`m: HashMap<String, Vec<u8>>, n: u8\` then has three pieces, and \`Vec\` is reported as a field.
- Taking \`ts[at + 2]\` as the body. That breaks on generic structs, where \`<T>\` comes first, and panics when the struct is the last thing in the input.`,
    wrong: [
      {
        code: `// A token tree, simplified from
// proc_macro::TokenTree.
#[derive(Debug, Clone, PartialEq)]
enum Tt {
    Ident(String),
    Punct(char),
    Lit(String),
    // delimiter ('(', '[' or '{'),
    // and the trees inside it
    Group(char, Vec<Tt>),
}

fn is_word(t: &Tt, w: &str) -> bool {
    matches!(t, Tt::Ident(s) if s == w)
}

fn braces(t: &Tt) -> Option<&Vec<Tt>> {
    match t {
        Tt::Group('{', v) => Some(v),
        _ => None,
    }
}

fn field_names(ts: &[Tt])
    -> Option<(String, Vec<String>)> {
    let at = ts.iter().position(|t| {
        is_word(t, "struct")
    })?;
    let Some(Tt::Ident(name)) =
        ts.get(at + 1)
    else {
        return None;
    };
    let body = ts[at + 2..].iter()
        .find_map(braces)?;
    let mut out = Vec::new();
    for w in body.windows(2) {
        if let [Tt::Ident(n),
                Tt::Punct(':')] = w
        {
            out.push(n.clone());
        }
    }
    Some((name.clone(), out))
}`,
        why: 'An identifier followed by `:` also matches `std` and `string` in a path like `std::string::String`.',
      },
      {
        code: `// A token tree, simplified from
// proc_macro::TokenTree.
#[derive(Debug, Clone, PartialEq)]
enum Tt {
    Ident(String),
    Punct(char),
    Lit(String),
    // delimiter ('(', '[' or '{'),
    // and the trees inside it
    Group(char, Vec<Tt>),
}

fn is_word(t: &Tt, w: &str) -> bool {
    matches!(t, Tt::Ident(s) if s == w)
}

fn braces(t: &Tt) -> Option<&Vec<Tt>> {
    match t {
        Tt::Group('{', v) => Some(v),
        _ => None,
    }
}

fn field_names(ts: &[Tt])
    -> Option<(String, Vec<String>)> {
    let at = ts.iter().position(|t| {
        is_word(t, "struct")
    })?;
    let Some(Tt::Ident(name)) =
        ts.get(at + 1)
    else {
        return None;
    };
    let body = ts[at + 2..].iter()
        .find_map(braces)?;
    let mut out = Vec::new();
    let mut d = 0; // depth inside < >
    let mut start = true;
    for t in body {
        match t {
            Tt::Punct('<') => d += 1,
            Tt::Punct('>') => d -= 1,
            Tt::Punct(',') => {
                if true {
                    start = true;
                }
            }
            Tt::Ident(w) if start => {
                if w != "pub" {
                    out.push(w.clone());
                    start = false;
                }
            }
            _ => {}
        }
    }
    Some((name.clone(), out))
}`,
        why: 'Every comma splits, including the one inside `HashMap<String, Vec<u8>>`, so `Vec` is taken for a field.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'What does a derive macro receive for `#[derive(Describe)] struct P { x: u8 }`?',
    options: [
      {
        t: 'A syntax tree with a struct node and a field node',
        why: 'That is what `syn` builds from the input; the macro itself receives tokens.',
      },
      {
        t: 'The type information for `P`, including whether `u8` implements `Debug`',
        why: 'Macros run before type checking; they see tokens only.',
      },
      {
        t: 'A token stream: `struct`, `P`, and a brace group holding `x : u8`',
        correct: true,
        why: 'Three token trees at the top level; the fields are inside the group.',
      },
    ],
  },
  {
    q: 'Which is true of a crate that defines a procedural macro?',
    options: [
      {
        t: 'It must have `proc-macro = true` under `[lib]`, and its macros cannot be used inside it',
        correct: true,
        why: 'The Reference: proc macros live in the root of a proc-macro crate and may only be used from other crates.',
      },
      {
        t: 'It can also export ordinary functions for programs to call at run time',
        why: 'A proc-macro crate exports only its macros; shared run-time code goes in a separate crate.',
      },
      {
        t: 'It runs in the finished program, the first time the macro’s output is used',
        why: 'It runs inside the compiler, during the build, and is not part of the finished program.',
      },
    ],
  },
  {
    q: 'In `quote! { impl #name { ... #( self.#fields; )* } }`, what does `#( ... )*` do?',
    options: [
      {
        t: 'It is a comment inside the generated code',
        why: 'It is quote’s repetition, written like `$( ... )*` in `macro_rules!`.',
      },
      {
        t: 'It repeats its contents once for each element of `fields`',
        correct: true,
        why: 'Each repetition interpolates the next field name.',
      },
      {
        t: 'It loops at run time over the struct’s fields',
        why: 'The repetition happens while the macro runs, at compile time; the output has one line per field.',
      },
    ],
  },
  {
    q: 'Why does `a: std::string::String` trip up a rule like “a field name is an identifier followed by `:`”?',
    options: [
      {
        t: 'Because `std::string::String` is a single `Ident` token',
        why: 'It is several: identifiers separated by `:` punctuation.',
      },
      {
        t: 'Because `::` is two `:` punctuation tokens, so `std` and `string` are also identifiers followed by `:`',
        correct: true,
        why: 'Token trees do not know which colons begin a type; that is why `syn` exists.',
      },
      {
        t: 'Because paths are groups',
        why: 'Only `( )`, `[ ]` and `{ }` make groups.',
      },
    ],
  },
  {
    q: 'What does `#[derive(Debug)]` in Rust have in common with Python’s `@dataclass`, and how do they differ?',
    options: [
      {
        t: 'Both generate methods from a type’s fields; Rust does it at compile time from tokens, Python at run time by inspecting the class',
        correct: true,
        why: 'So Rust’s generated code is type-checked like your own and costs nothing when the program runs.',
      },
      {
        t: 'Both run when the program starts',
        why: 'Only the Python decorator runs then; the derive ran during the build.',
      },
      {
        t: 'They are the same mechanism with different syntax',
        why: 'One rewrites tokens before compilation; the other is an ordinary function that changes a class object while the program runs.',
      },
    ],
  },
];
