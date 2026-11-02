// Chapter 80 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.
// Merged from old chapters 150, 150.

export const prompts = {
  'oxc-what': {
    q: 'What is oxc?',
    a: 'The Oxidation Compiler: a set of JavaScript and TypeScript tools written in Rust (parser, linter, formatter, transformer, minifier). The port uses its parser and AST.',
  },
  'oxc-inputs': {
    q: 'What three things does oxc’s `Parser::new` take?',
    a: 'An `Allocator` (the memory arena), the source text, and a `SourceType` (the port uses `SourceType::mjs()`, acorn’s `sourceType: \'module\'`).',
  },
  'oxc-errors': {
    q: 'How does oxc report a syntax error, compared with acorn?',
    a: 'As data: `ret.diagnostics` lists the errors and parsing still returns. acorn throws. The port turns the first error into a `CompileError`.',
  },
  'oxc-arena': {
    q: 'Where do oxc’s AST nodes live, and what is the `Box` in `Box<\'a, BinaryExpression<\'a>>`?',
    a: 'In the `Allocator`, a bump arena. That `Box` is oxc’s arena box: a pointer into the arena, not std’s heap `Box`.',
  },
  'oxc-nodrop': {
    q: 'What happens to individual nodes when an oxc allocator is dropped?',
    a: 'Nothing: they are never dropped one by one. The arena’s memory is released in bulk, which is why types that implement `Drop` are refused at compile time.',
  },
  'oxc-lifetime': {
    q: 'Why can’t the port store oxc’s `Program<\'a>` in the VIR `Module`?',
    a: '`\'a` borrows the allocator, a local of `lower`, so the tree can’t outlive `lower`. The port keeps spans and a side table of node facts instead.',
  },
  'oxc-units': {
    q: 'What do acorn’s offsets count, and what do oxc’s spans count?',
    a: 'acorn: UTF-16 code units (JavaScript string indices). oxc: UTF-8 bytes (Rust string indices).',
  },
  'oxc-same-cut': {
    q: 'acorn says 266 and oxc says 286 for the same statement. Why do both engines still splice at the same characters?',
    a: 'Each slices its own string in its own unit: the TS emitter a JavaScript string by code units, the Rust emitter a `String` by bytes.',
  },
  'oxc-lines': {
    q: 'oxc reports no line numbers. Which line breaks does the port count, and why those?',
    a: '`\\n`, `\\r\\n`, a lone `\\r`, U+2028 and U+2029: the ECMAScript line breaks that acorn counts, so `explain` names the same lines.',
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
  fnkey: {
    q: 'The TS resolver keys bindings’ owners by the function node object. What does the Rust port use?',
    a: '`FnKey::Func(Span)`: a function’s span, which is unique, or `FnKey::Program`.',
  },
  'ssa-or-binding': {
    q: 'Which JS variables does lowering turn into SSA values?',
    a: 'Simple kinds (const, let, var, param, catch) that no other function uses, that aren’t assigned in a `try`, and that aren’t initialised with an array.',
  },
  'mem-replace': {
    q: 'Why does `lower_function` call `std::mem::replace(&mut self.f, state)`?',
    a: 'To put the nested function’s builder state in place and get the outer one back, so it can be restored when the nested function is done.',
  },
  'side-table': {
    q: 'What does `SourceRef.node` hold in the Rust port, where the TS engine keeps an ESTree node?',
    a: 'A `NodeRef` index into a side table of `JsNode` facts: just what the emitter needs (spans of the object and index of `a[i]`, and so on).',
  },
  'direct-flag': {
    q: 'How does the port know that `a[i]` in `a[i].x` is the object of a member expression, with no parent pointers?',
    a: 'Lowering sets a `direct` flag just before it lowers a member expression’s object, and records it in the `JsNode::Member` facts.',
  },
  directives: {
    q: 'Why does the port lower a `"use strict"` directive to a string constant nothing uses?',
    a: 'ESTree keeps directives as expression statements, so the TS engine lowers them. Doing the same keeps value numbering identical.',
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
    q: 'What happens if the Rust emitter slices its `String` with acorn’s offsets 266..280?',
    options: [
      {
        t: 'It gets the same text, because Rust converts offsets automatically',
        why: 'Rust indexes `str` by bytes and never converts.',
      },
      {
        t: 'It gets `"9, and a line "`, the wrong text, and an offset inside a character would panic',
        correct: true,
        why: 'Byte 266 is twenty bytes before the statement. A slice must start and end on a character boundary.',
      },
      {
        t: 'It fails to compile',
        why: 'The offsets are run-time numbers; the compiler can’t check them.',
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
    q: 'What does oxc’s `Allocator` do when it is dropped?',
    options: [
      {
        t: 'Runs `Drop` for every node, in reverse order',
        why: 'Nodes in the arena are never dropped individually.',
      },
      {
        t: 'Moves the nodes to the normal heap',
        why: 'Nothing is moved; the memory is returned.',
      },
      {
        t: 'Nothing until the program exits',
        why: 'Its chunks are returned when it is dropped.',
      },
      {
        t: 'Releases its memory in bulk without dropping individual nodes',
        correct: true,
        why: 'That is why it refuses `Drop` types at compile time: their own allocations would leak.',
      },
    ],
  },
  {
    q: 'oxc reports no line numbers. How does `explain` still say "loop at line 6"?',
    options: [
      {
        t: 'It counts `\\n` characters only',
        why: 'acorn also counts `\\r`, `\\r\\n`, U+2028 and U+2029, and the port must match it.',
      },
      {
        t: 'The plugin counts them with `LineIndex`, at every ECMAScript line break, as acorn does',
        correct: true,
        why: '`LineIndex` records where each line starts and maps a byte offset to its line.',
      },
      {
        t: 'It calls acorn through Node to get them',
        why: 'The Rust engine doesn’t run JavaScript to compile.',
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
    q: 'The TS lowering finds “every child” of an ESTree node with `Object.keys`. What does the Rust port use instead?',
    options: [
      {
        t: 'Reflection over the struct’s fields at run time',
        why: 'Rust has no run-time reflection over struct fields.',
      },
      {
        t: 'oxc’s `Visit` trait: generated walk functions that visit children in source order, with overrides for the kinds that matter',
        correct: true,
        why: 'The README calls this out: the default traversal visits children in source order, as `children()` does.',
      },
      {
        t: 'A hand-written `match` on every one of oxc’s node types',
        why: 'That is what the generated `walk_*` functions already are; the port only overrides a few.',
      },
      {
        t: 'It converts oxc’s AST to ESTree JSON first',
        why: 'It walks oxc’s AST directly and maps each case back to the ESTree shape in comments.',
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
  {
    q: 'Why does the port use `FnKey::Func(Span)` where the TS code uses the function node object as a `Map` key?',
    options: [
      {
        t: 'Spans are faster to hash than objects',
        why: 'Speed isn’t the reason; TypeScript compares objects by identity cheaply too.',
      },
      {
        t: 'Rust can’t compare references at all',
        why: 'It can (`std::ptr::eq`), but holding AST references would tie every table to the parse’s lifetime.',
      },
      {
        t: 'A plain value key works without keeping references into the AST, and each function’s span is unique',
        correct: true,
        why: 'The resolver’s comment says spans of function nodes are unique. The same idea gives `refs: HashMap<Span, JsBindingId>`.',
      },
      {
        t: 'oxc requires it',
        why: 'oxc doesn’t care how you key your own tables.',
      },
    ],
  },
  {
    q: 'Which variable stays an SSA value?',
    options: [
      {
        t: '`let n = 0;` read and written by a nested function',
        why: 'Used in another function: it becomes a binding with load/store.',
      },
      {
        t: '`const ps = [];` used only in its own function',
        why: 'Array-initialised variables always become bindings, so the analyses see every read and write.',
      },
      {
        t: '`let s = 0;` assigned inside a `try` block',
        why: 'Assigned in a `try`: SSA would be unsound across exception edges.',
      },
      {
        t: '`let i = 0;` used only in its own loop',
        correct: true,
        why: 'A simple kind, used only in its owner, not in a `try`, not an array.',
      },
    ],
  },
  {
    q: 'What replaces the TS emitter’s `res.parent.get(n)` check (“is this `a[i]` the object of a member expression?”)?',
    options: [
      {
        t: 'A `direct` flag recorded in `JsNode::Member` while lowering',
        correct: true,
        why: '`expr_object` sets it just before lowering a member expression’s object.',
      },
      {
        t: 'A parent map built by a second visitor',
        why: 'The port needs no parent pointers at all.',
      },
      {
        t: 'Re-parsing the source in the emitter',
        why: 'The emitter never re-parses; it works from spans and facts.',
      },
    ],
  },
];
