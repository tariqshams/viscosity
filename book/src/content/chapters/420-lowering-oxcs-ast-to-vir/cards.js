// Chapter 420 cards. Keys are stable ids: never rename them.

// A toy AST and a Visit trait shaped like oxc's (oxc_ast_visit): each
// visit method defaults to walking the node's children in source order.
const TOY = `enum Expr {
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
`;

export const prompts = {
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
    a: 'Simple kinds (const, let, var, param, catch) that no other function uses, that aren’t assigned in a `try`, and that aren’t initialized with an array.',
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
  mentions: {
    lang: 'rust',
    title: 'The Mentions visitor',
    prompt:
      'Lowering an unmodelled node needs every variable it mentions, in source order, and whether each one sits inside a nested function. Implement `Visit` for `Mentions`: `visit_name` records `(name, self.inner)`, and `visit_func` walks the function body with `inner` set to `true`, then puts back the value it had before (functions nest).',
    starter: `${TOY}
impl Visit for Mentions {
    fn visit_name(&mut self, n: &str) {
        todo!()
    }
    fn visit_func(&mut self, b: &Expr) {
        todo!()
    }
}`,
    solution: `${TOY}
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
        code: `${TOY}
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
        code: `${TOY}
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
    q: 'The TS lowering finds “every child” of an ESTree node with `Object.keys`. What does the Rust port use instead?',
    options: [
      { t: 'Reflection over the struct’s fields at run time', why: 'Rust has no run-time reflection over struct fields.' },
      { t: 'oxc’s `Visit` trait: generated walk functions that visit children in source order, with overrides for the kinds that matter', correct: true, why: 'The README calls this out: the default traversal visits children in source order, as `children()` does.' },
      { t: 'A hand-written `match` on every one of oxc’s node types', why: 'That is what the generated `walk_*` functions already are; the port only overrides a few.' },
      { t: 'It converts oxc’s AST to ESTree JSON first', why: 'It walks oxc’s AST directly and maps each case back to the ESTree shape in comments.' },
    ],
  },
  {
    q: 'A visitor overrides `visit_function` and does not call `walk::walk_function`. What does it see of a function’s body?',
    options: [
      { t: 'Everything: the default walk still runs afterwards', why: 'The override replaces the default; nothing runs it for you.' },
      { t: 'Only the parameters', why: 'Nothing under the function is visited unless the override walks it.' },
      { t: 'Nothing', correct: true, why: 'That is how `HoistCollector` in `resolve.rs` stops at nested functions on purpose.' },
    ],
  },
  {
    q: 'Why does the port use `FnKey::Func(Span)` where the TS code uses the function node object as a `Map` key?',
    options: [
      { t: 'Spans are faster to hash than objects', why: 'Speed isn’t the reason; TypeScript compares objects by identity cheaply too.' },
      { t: 'Rust can’t compare references at all', why: 'It can (`std::ptr::eq`), but holding AST references would tie every table to the parse’s lifetime.' },
      { t: 'A plain value key works without keeping references into the AST, and each function’s span is unique', correct: true, why: 'The resolver’s comment says spans of function nodes are unique. The same idea gives `refs: HashMap<Span, JsBindingId>`.' },
      { t: 'oxc requires it', why: 'oxc doesn’t care how you key your own tables.' },
    ],
  },
  {
    q: 'Which variable stays an SSA value?',
    options: [
      { t: '`let n = 0;` read and written by a nested function', why: 'Used in another function: it becomes a binding with load/store.' },
      { t: '`const ps = [];` used only in its own function', why: 'Array-initialized variables always become bindings, so the analyses see every read and write.' },
      { t: '`let s = 0;` assigned inside a `try` block', why: 'Assigned in a `try`: SSA would be unsound across exception edges.' },
      { t: '`let i = 0;` used only in its own loop', correct: true, why: 'A simple kind, used only in its owner, not in a `try`, not an array.' },
    ],
  },
  {
    q: 'What replaces the TS emitter’s `res.parent.get(n)` check (“is this `a[i]` the object of a member expression?”)?',
    options: [
      { t: 'A `direct` flag recorded in `JsNode::Member` while lowering', correct: true, why: '`expr_object` sets it just before lowering a member expression’s object.' },
      { t: 'A parent map built by a second visitor', why: 'The port needs no parent pointers at all.' },
      { t: 'Re-parsing the source in the emitter', why: 'The emitter never re-parses; it works from spans and facts.' },
    ],
  },
];
