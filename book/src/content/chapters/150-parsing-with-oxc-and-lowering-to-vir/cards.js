// Chapter 150 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'oxc-what': {
    q: 'What is oxc?',
    a: 'The Oxidation Compiler: a set of JavaScript and TypeScript tools written in Rust (parser, linter, formatter, transformer, minifier). The port uses its parser and AST.',
  },
  'oxc-arena': {
    q: 'Where do oxc’s AST nodes live, and what is the `Box` in `Box<\'a, BinaryExpression<\'a>>`?',
    a: 'In the `Allocator`, a bump arena. That `Box` is oxc’s arena box: a pointer into the arena, not std’s heap `Box`.',
  },
  'oxc-units': {
    q: 'What do acorn’s offsets count, and what do oxc’s spans count?',
    a: 'acorn: UTF-16 code units (JavaScript string indices). oxc: UTF-8 bytes (Rust string indices).',
  },
  'oxc-same-cut': {
    q: 'acorn says 266 and oxc says 286 for the same statement. Why do both engines still splice at the same characters?',
    a: 'Each slices its own string in its own unit: the TS emitter a JavaScript string by code units, the Rust emitter a `String` by bytes.',
  },
  'oxc-semantic': {
    q: 'oxc’s parser alone accepts `let a = 1; let a = 2;`. What makes the Rust engine reject it, as acorn does?',
    a: 'A second pass: oxc’s `SemanticBuilder` with `with_check_syntax_error(true)`, which reports the early errors the parser leaves out.',
  },
  'visitor-what': {
    q: 'What is the **visitor pattern**, as oxc’s `Visit` trait uses it?',
    a: 'A trait with one method per node kind. Each default method walks that node’s children; you override only the kinds you care about.',
  },
  'skip-walk': {
    q: 'You override `visit_arrow_function_expression` and never call the walk function. What happens?',
    a: 'Nothing inside arrow functions is visited: overriding replaces the default walk for that node.',
  },
  'side-table': {
    q: 'What does `SourceRef.node` hold in the Rust port, where the TS engine keeps an ESTree node?',
    a: 'A `NodeRef` index into a side table of `JsNode` facts: just what the emitter needs (spans of the object and index of `a[i]`, and so on).',
  },
};

export const examples = {
  'three-lengths': {
    lang: 'rust',
    title: 'Bytes, chars and UTF-16 code units',
    code: `fn main() {
    let s = "é😀x = 1";
    println!("bytes:  {}", s.len());
    let n = s.chars().count();
    println!("chars:  {n}");
    let u = s.encode_utf16().count();
    println!("UTF-16: {u}");
    let x = s.find('x').unwrap();
    let ux =
        s[..x].encode_utf16().count();
    println!("x: byte {x}, unit {ux}");
    println!("{:?}", &s[x..]);
    // byte 3 is inside the 😀:
    let ok = s.is_char_boundary(3);
    println!("{ok}");
    // so &s[3..] would panic
}`,
  },
  'visit-play': {
    lang: 'rust',
    title: 'Two visitors, one walk',
    code: `enum Expr {
    Num(f64),
    Name(String),
    Add(Box<Expr>, Box<Expr>),
    Func(Box<Expr>),
}

trait Visit: Sized {
    fn visit_expr(&mut self, e: &Expr) {
        walk_expr(self, e);
    }
    fn visit_name(&mut self, _: &str) {}
    fn visit_func(&mut self, b: &Expr) {
        self.visit_expr(b);
    }
}

fn walk_expr<V: Visit>(
    v: &mut V,
    e: &Expr,
) {
    use Expr::*;
    match e {
        Num(_) => {}
        Name(n) => v.visit_name(n),
        Add(a, b) => {
            v.visit_expr(a);
            v.visit_expr(b);
        }
        Func(b) => v.visit_func(b),
    }
}

// Overrides one method.
struct Names(Vec<String>);

impl Visit for Names {
    fn visit_name(&mut self, n: &str) {
        self.0.push(n.into());
    }
}

// Also overrides visit_func, and does
// not walk the body.
struct Outer(Vec<String>);

impl Visit for Outer {
    fn visit_name(&mut self, n: &str) {
        self.0.push(n.into());
    }
    fn visit_func(&mut self, _: &Expr) {
    }
}

fn name(s: &str) -> Box<Expr> {
    Box::new(Expr::Name(s.into()))
}

fn main() {
    // a + (() => b + 1)
    let body = Expr::Add(
        name("b"),
        Box::new(Expr::Num(1.0)),
    );
    let e = Expr::Add(
        name("a"),
        Box::new(Expr::Func(
            Box::new(body),
        )),
    );
    let mut all = Names(vec![]);
    all.visit_expr(&e);
    println!("all:   {:?}", all.0);
    let mut out = Outer(vec![]);
    out.visit_expr(&e);
    println!("outer: {:?}", out.0);
}`,
  },
};

export const exercises = {
  byteOffset: {
    optional: true,
    lang: 'rust',
    title: 'From acorn offsets to Rust offsets',
    prompt: 'A JavaScript tool hands you offsets in UTF-16 code units, as acorn reports them. Write `byte_offset`, which turns one into the UTF-8 byte offset of the same character in a Rust `&str`, so that `&src[byte_offset(src, off)..]` starts where JavaScript’s `src.slice(off)` does. `c.len_utf16()` tells you how many code units a `char` takes (1 or 2), and `src.char_indices()` gives each character with its byte offset.',
    starter: `// The byte offset in src of the
// character at UTF-16 offset off (what
// acorn and JavaScript's slice count).
// off is never inside a character; off
// at the end gives src.len().
fn byte_offset(src: &str, off: usize)
    -> usize {
    todo!()
}`,
    solution: `// The byte offset in src of the
// character at UTF-16 offset off (what
// acorn and JavaScript's slice count).
// off is never inside a character; off
// at the end gives src.len().
fn byte_offset(src: &str, off: usize)
    -> usize {
    let mut units = 0;
    for (b, c) in src.char_indices() {
        if units == off {
            return b;
        }
        units += c.len_utf16();
    }
    src.len()
}`,
    tests: `#[test]
fn ascii_offsets_are_the_same() {
    assert_eq!(byte_offset("let x", 4), 4);
}

#[test]
fn accents_take_two_bytes() {
    // é: 1 UTF-16 unit, 2 bytes
    assert_eq!(byte_offset("é = 1", 2), 3);
}

#[test]
fn emoji_take_two_units_and_four_bytes() {
    let s = "é😀x";
    assert_eq!(byte_offset(s, 1), 2);
    assert_eq!(byte_offset(s, 3), 6);
}

#[test]
fn the_end_maps_to_len() {
    assert_eq!(byte_offset("é😀", 3), 6);
    assert_eq!(byte_offset("", 0), 0);
}

#[test]
fn slices_where_acorn_points() {
    let s = "// Ünïcödé 😀\\nconst ps = [];";
    let at = s.find("const").unwrap();
    let u = s[..at].encode_utf16().count();
    let b = byte_offset(s, u);
    assert!(s[b..].starts_with("const"));
}`,
    hints: [
      'Walk the characters with `src.char_indices()`, which gives `(byte_offset, char)` pairs, and keep a running count of UTF-16 units.',
      'Before adding a character’s units, check whether the count has reached `off`: if so, this character’s byte offset is the answer.',
      'If the loop ends, `off` is the end of the string, so return `src.len()`. A 😀 adds 2 to the count (`len_utf16()`), an `é` adds 1.',
    ],
    walkthrough: `**How to think about it.** Two counters move through the string together: the byte offset, which Rust gives you for free, and the UTF-16 offset, which you add up yourself. Walk the characters in order; the answer is the byte offset of the character at which the UTF-16 count reaches \`off\`. Try it by hand on \`"é😀x"\` first: é starts at byte 0 and unit 0, 😀 at byte 2 and unit 1, x at byte 6 and unit 3, and the end is byte 7 and unit 4.

**The solution, line by line.**

- \`let mut units = 0;\` is the UTF-16 offset of the character we are about to look at.
- \`for (b, c) in src.char_indices() {\` walks the characters, each with \`b\`, the byte offset where it starts.
- \`if units == off { return b; }\` checks *before* counting this character: if JavaScript's offset points at the start of this character, its byte offset is the answer.
- \`units += c.len_utf16();\` moves the UTF-16 counter past the character: 1 for é or x, 2 for 😀 (a surrogate pair).
- \`src.len()\` runs only if no character starts at \`off\`, which (since \`off\` is never inside a character) means \`off\` is the end of the string, so the answer is the byte length.

For \`byte_offset("é😀x", 3)\`: at é, units is 0 (no match), then 1; at 😀, units is 1 (no match), then 3; at x, units is 3, a match, so the answer is x's byte offset, 6.

**Common wrong attempts.**

- Treating the offset as a count of \`char\`s (\`char_indices().nth(off)\`) works for é, but a 😀 is one \`char\` and two code units, so every offset after an emoji lands one character too far.
- Returning \`off\` unchanged is right only while the text is ASCII; after é the byte offset is already one larger.

The port has the opposite function, \`lines::utf16_offset\`, which counts \`source[..offset].encode_utf16()\`. Inside the engine neither is needed, because each engine slices its own string in its own unit; conversions matter only at the border, when offsets cross from one language to the other.`,
    wrong: [
      {
        code: `// The byte offset in src of the
// character at UTF-16 offset off (what
// acorn and JavaScript's slice count).
// off is never inside a character; off
// at the end gives src.len().
fn byte_offset(src: &str, off: usize)
    -> usize {
    match src.char_indices().nth(off) {
        Some((b, _)) => b,
        None => src.len(),
    }
}`,
        why: 'This treats the offset as a count of `char`s. That works for `é`, but a 😀 is one `char` and two UTF-16 code units, so every offset after an emoji lands one character too far.',
      },
      {
        code: `// The byte offset in src of the
// character at UTF-16 offset off (what
// acorn and JavaScript's slice count).
// off is never inside a character; off
// at the end gives src.len().
fn byte_offset(src: &str, off: usize)
    -> usize {
    off.min(src.len())
}`,
        why: 'UTF-16 offsets are not byte offsets. They agree only while the text is ASCII; after `é` the byte offset is already one larger.',
      },
    ],
  },
  mentions: {
    lang: 'rust',
    title: 'The Mentions visitor',
    prompt: 'Lowering an unmodelled node needs every variable it mentions, in source order, and whether each one sits inside a nested function. Implement `Visit` for `Mentions`: `visit_name` records `(name, self.inner)`, and `visit_func` walks the function body with `inner` set to `true`, then puts back the value it had before (functions nest).',
    starter: `enum Expr {
    Num(f64),
    Name(String),
    Add(Box<Expr>, Box<Expr>),
    Call(Box<Expr>, Vec<Expr>),
    Func(Box<Expr>),
}

trait Visit: Sized {
    fn visit_expr(&mut self, e: &Expr) {
        walk_expr(self, e);
    }
    fn visit_name(&mut self, _: &str) {}
    fn visit_func(&mut self, b: &Expr) {
        self.visit_expr(b);
    }
}

fn walk_expr<V: Visit>(
    v: &mut V,
    e: &Expr,
) {
    use Expr::*;
    match e {
        Num(_) => {}
        Name(n) => v.visit_name(n),
        Add(a, b) => {
            v.visit_expr(a);
            v.visit_expr(b);
        }
        Call(f, args) => {
            v.visit_expr(f);
            for a in args {
                v.visit_expr(a);
            }
        }
        Func(b) => v.visit_func(b),
    }
}

// Each name, and whether it is inside
// a nested function.
#[derive(Default)]
struct Mentions {
    found: Vec<(String, bool)>,
    inner: bool,
}

impl Visit for Mentions {
    fn visit_name(&mut self, n: &str) {
        todo!()
    }
    fn visit_func(&mut self, b: &Expr) {
        todo!()
    }
}`,
    solution: `enum Expr {
    Num(f64),
    Name(String),
    Add(Box<Expr>, Box<Expr>),
    Call(Box<Expr>, Vec<Expr>),
    Func(Box<Expr>),
}

trait Visit: Sized {
    fn visit_expr(&mut self, e: &Expr) {
        walk_expr(self, e);
    }
    fn visit_name(&mut self, _: &str) {}
    fn visit_func(&mut self, b: &Expr) {
        self.visit_expr(b);
    }
}

fn walk_expr<V: Visit>(
    v: &mut V,
    e: &Expr,
) {
    use Expr::*;
    match e {
        Num(_) => {}
        Name(n) => v.visit_name(n),
        Add(a, b) => {
            v.visit_expr(a);
            v.visit_expr(b);
        }
        Call(f, args) => {
            v.visit_expr(f);
            for a in args {
                v.visit_expr(a);
            }
        }
        Func(b) => v.visit_func(b),
    }
}

// Each name, and whether it is inside
// a nested function.
#[derive(Default)]
struct Mentions {
    found: Vec<(String, bool)>,
    inner: bool,
}

impl Visit for Mentions {
    fn visit_name(&mut self, n: &str) {
        let f = self.inner;
        self.found.push((n.into(), f));
    }
    fn visit_func(&mut self, b: &Expr) {
        let saved = self.inner;
        self.inner = true;
        self.visit_expr(b);
        self.inner = saved;
    }
}`,
    tests: `fn name(s: &str) -> Expr {
    Expr::Name(s.to_string())
}

fn func(e: Expr) -> Expr {
    Expr::Func(Box::new(e))
}

fn call(f: Expr, a: Vec<Expr>) -> Expr {
    Expr::Call(Box::new(f), a)
}

fn run(e: &Expr) -> Vec<(String, bool)> {
    let mut m = Mentions::default();
    m.visit_expr(e);
    m.found
}

fn pairs(v: &[(&str, bool)])
    -> Vec<(String, bool)> {
    v.iter()
        .map(|(n, b)| (n.to_string(), *b))
        .collect()
}

#[test]
fn names_in_source_order() {
    // f(a, 1)
    let e = call(name("f"), vec![
        name("a"),
        Expr::Num(1.0),
    ]);
    assert_eq!(run(&e), pairs(&[
        ("f", false),
        ("a", false),
    ]));
}

#[test]
fn names_inside_a_function_are_inner() {
    // f(a, () => b + a)
    let body = Expr::Add(
        Box::new(name("b")),
        Box::new(name("a")),
    );
    let e = call(name("f"), vec![
        name("a"),
        func(body),
    ]);
    assert_eq!(run(&e), pairs(&[
        ("f", false),
        ("a", false),
        ("b", true),
        ("a", true),
    ]));
}

#[test]
fn leaving_a_function_restores_the_flag() {
    // g(() => () => x, y)
    let e = call(name("g"), vec![
        func(func(name("x"))),
        name("y"),
    ]);
    assert_eq!(run(&e), pairs(&[
        ("g", false),
        ("x", true),
        ("y", false),
    ]));
}`,
    hints: [
      '`visit_name` only pushes: the name (`n.into()` makes a `String`) and the current `self.inner`.',
      'In `visit_func`, overriding replaces the default walk, so you must call `self.visit_expr(b)` yourself or the body is never visited.',
      'Save `self.inner` in a local before setting it to `true`, and assign it back after the walk. Setting it to `false` afterwards is wrong for a function inside a function.',
    ],
    walkthrough: `**How to think about it.** Ask which node kinds you need to *change*, and leave the rest to the trait. Names are where something is recorded, so \`visit_name\` must be overridden. Functions are where the flag changes, so \`visit_func\` must be overridden too. \`Add\`, \`Call\` and \`Num\` need nothing special: their default walk already visits their children in source order. The one trap is that overriding \`visit_func\` throws away its default walk of the body, so you have to walk it yourself, and functions nest, so the flag must be put back to what it *was*, not to \`false\`.

**The solution, line by line.**

- \`fn visit_name(&mut self, n: &str) {\` is called by \`walk_expr\` for every \`Name\` node.
- \`let f = self.inner;\` reads the current flag (copying a \`bool\`).
- \`self.found.push((n.into(), f));\` records the pair; \`n.into()\` turns the \`&str\` into an owned \`String\`, because the list must outlive the tree.
- \`fn visit_func(&mut self, b: &Expr) {\` is called for every \`Func\` node, with its body \`b\`.
- \`let saved = self.inner;\` remembers the flag as it was outside this function.
- \`self.inner = true;\` marks everything below as inside a function.
- \`self.visit_expr(b);\` walks the body: the walk the override replaced.
- \`self.inner = saved;\` restores the outer value. In \`g(() => () => x, y)\`, leaving the inner function sets it back to \`true\` (we are still in the outer one), and leaving the outer one sets it back to \`false\`, so \`y\` is outer.

**Common wrong attempts.**

- Setting \`inner = true\` and never restoring it marks every later name as inner, such as the \`y\` above.
- Setting the flag and not calling \`self.visit_expr(b)\` loses every name inside a function, because the override replaced the walk.

This is the real \`Mentions\` collector in \`lower.rs\` on a smaller tree; there, \`std::mem::replace(&mut self.inner, true)\` does the save and the set in one step.`,
    wrong: [
      {
        code: `enum Expr {
    Num(f64),
    Name(String),
    Add(Box<Expr>, Box<Expr>),
    Call(Box<Expr>, Vec<Expr>),
    Func(Box<Expr>),
}

trait Visit: Sized {
    fn visit_expr(&mut self, e: &Expr) {
        walk_expr(self, e);
    }
    fn visit_name(&mut self, _: &str) {}
    fn visit_func(&mut self, b: &Expr) {
        self.visit_expr(b);
    }
}

fn walk_expr<V: Visit>(
    v: &mut V,
    e: &Expr,
) {
    use Expr::*;
    match e {
        Num(_) => {}
        Name(n) => v.visit_name(n),
        Add(a, b) => {
            v.visit_expr(a);
            v.visit_expr(b);
        }
        Call(f, args) => {
            v.visit_expr(f);
            for a in args {
                v.visit_expr(a);
            }
        }
        Func(b) => v.visit_func(b),
    }
}

// Each name, and whether it is inside
// a nested function.
#[derive(Default)]
struct Mentions {
    found: Vec<(String, bool)>,
    inner: bool,
}

impl Visit for Mentions {
    fn visit_name(&mut self, n: &str) {
        let f = self.inner;
        self.found.push((n.into(), f));
    }
    fn visit_func(&mut self, b: &Expr) {
        self.inner = true;
        self.visit_expr(b);
    }
}`,
        why: 'The flag is never restored, so every name after the first function (the `y` in `g(() => …, y)`) is wrongly marked inner.',
      },
      {
        code: `enum Expr {
    Num(f64),
    Name(String),
    Add(Box<Expr>, Box<Expr>),
    Call(Box<Expr>, Vec<Expr>),
    Func(Box<Expr>),
}

trait Visit: Sized {
    fn visit_expr(&mut self, e: &Expr) {
        walk_expr(self, e);
    }
    fn visit_name(&mut self, _: &str) {}
    fn visit_func(&mut self, b: &Expr) {
        self.visit_expr(b);
    }
}

fn walk_expr<V: Visit>(
    v: &mut V,
    e: &Expr,
) {
    use Expr::*;
    match e {
        Num(_) => {}
        Name(n) => v.visit_name(n),
        Add(a, b) => {
            v.visit_expr(a);
            v.visit_expr(b);
        }
        Call(f, args) => {
            v.visit_expr(f);
            for a in args {
                v.visit_expr(a);
            }
        }
        Func(b) => v.visit_func(b),
    }
}

// Each name, and whether it is inside
// a nested function.
#[derive(Default)]
struct Mentions {
    found: Vec<(String, bool)>,
    inner: bool,
}

impl Visit for Mentions {
    fn visit_name(&mut self, n: &str) {
        let f = self.inner;
        self.found.push((n.into(), f));
    }
    fn visit_func(&mut self, b: &Expr) {
        self.inner = true;
    }
}`,
        why: 'Overriding `visit_func` replaced the walk of the body, and this version never walks it, so names inside functions are lost.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'For `const ps = [];` in `unicode_offsets.js`, acorn reports 266 and oxc 286. Which is right?',
    options: [
      {
        t: 'acorn: oxc miscounts non-ASCII text',
        why: 'oxc counts bytes correctly; `&src[286..300]` is exactly `const ps = [];`.',
      },
      {
        t: 'Both: acorn counts UTF-16 code units, oxc counts UTF-8 bytes',
        correct: true,
        why: 'The accented letters, emoji and line-separator characters before it take more bytes than code units.',
      },
      {
        t: 'oxc: acorn skips comments when counting',
        why: 'acorn counts every code unit, comments included.',
      },
      {
        t: 'Neither: offsets should count characters',
        why: 'Neither language indexes strings by characters; each uses its own unit.',
      },
    ],
  },
  {
    q: 'Why does the Rust port keep no oxc AST after `lower` returns?',
    options: [
      {
        t: 'The tree is `Program<\'a>`, borrowing an allocator that is a local of `lower`, so it can’t outlive `lower`',
        correct: true,
        why: 'The port keeps spans (plain `u32` pairs) and a side table of node facts instead.',
      },
      {
        t: 'oxc deletes the tree as soon as parsing finishes',
        why: 'The tree lives as long as the allocator; the port drops the allocator when `lower` ends.',
      },
      {
        t: 'The emitter re-parses the source',
        why: 'It doesn’t need to: it splices byte ranges it already has.',
      },
    ],
  },
  {
    q: 'Which statement about early errors in the port is true?',
    options: [
      {
        t: 'oxc’s parser alone reports every early error acorn reports',
        why: 'oxc’s documentation says the parser’s list of errors is not comprehensive; redeclarations such as `let a; let a;` are left to its semantic pass.',
      },
      {
        t: 'Both engines report every early error at the same line and column',
        why: 'oxc anchors some on a different token: for `let a = 1; let a = 2;` Rust says (1:4) and acorn (1:15).',
      },
      {
        t: 'After parsing, the port runs oxc’s semantic syntax checks, so a redeclared `let` is rejected by both engines',
        correct: true,
        why: '`SemanticBuilder` with `with_check_syntax_error(true)` runs right after parsing; before it was added, the Rust engine compiled the file.',
      },
    ],
  },
  {
    q: 'A visitor overrides `visit_function` and does not call `walk::walk_function`. What does it see of a function’s body?',
    options: [
      {
        t: 'Everything: the default walk still runs afterwards',
        why: 'The override replaces the default; nothing runs it for you.',
      },
      {
        t: 'Only the parameters',
        why: 'Nothing under the function is visited unless the override walks it.',
      },
      {
        t: 'Nothing',
        correct: true,
        why: 'That is how `HoistCollector` in `resolve.rs` stops at nested functions on purpose.',
      },
    ],
  },
];
