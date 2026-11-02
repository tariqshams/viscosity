// Chapter 375 cards. Keys are stable ids: never rename them.

export const prompts = {
  'py-four': {
    q: 'Which TypeScript file does each module of `frontend-python` port?',
    a: '`tokens.rs` ← `tokens.ts`, `parser.rs` ← `parser.ts`, `lower.rs` ← `lower.ts`, `emit.rs` ← `emit.ts`; the crate root ← `index.ts`.',
  },
  'py-fail-closed': {
    q: 'The Python source uses a list comprehension. What does the Rust plugin do?',
    a: 'Fails closed: the parser’s `PySyntaxError` makes it lower an empty module, so nothing is reported and the file is emitted unchanged.',
  },
  'py-bytes': {
    q: 'Why may the Python tokenizer use byte offsets and still cut where the reference’s UTF-16 offsets do?',
    a: 'Everything it inspects is ASCII; non-ASCII text can only be inside strings and comments, which it skips whole.',
  },
  'py-depth': {
    q: 'What does a line break inside `( )` produce, and why?',
    a: 'No token: with bracket depth above 0 it is whitespace, and the next line’s indentation isn’t measured. The call stays one logical line.',
  },
  'py-eof': {
    q: 'Why did a file ending in `k = 1` make `1` a float in the old reference tokenizer?',
    a: 'Past the end, `src[i]` was `undefined`, and `/[eE]/.test(undefined)` tests the string "undefined", which has an `e`.',
  },
  'py-children': {
    q: 'In what order does `Ast::children` list a `For` node’s children, and why that order?',
    a: '`target`, `iter`, then the `body`: the order the reference created the object’s keys, which its generic walk follows.',
  },
  'py-order': {
    q: 'If a walk visits the same nodes in another order, what goes wrong?',
    a: 'The VIR instructions it emits come out in another order, so `explain` lists reasons in another order: same decisions, failed parity.',
  },
  'py-literal': {
    q: 'Why are only literal dataclass defaults modelled?',
    a: 'Python evaluates a default once, at class definition, but the emitter copies its text to every call. Only a literal gives the same value both ways.',
  },
  'py-rebound': {
    q: 'When is a dataclass modelled, given `P = Twice` may come later?',
    a: 'Only when its `class` statement is the only module-level statement binding the name (counted in `module_defs`).',
  },
  'py-tests': {
    q: 'What holds the Rust Python plugin to the reference?',
    a: '54 fixture pairs (27 programs, both bounds modes), compared byte for byte, and a `python3` differential test on every program.',
  },
};

export const exercises = {
  arenaWalk: {
    lang: 'rust',
    title: 'Children in the reference’s order',
    prompt:
      'Here is a tiny arena AST, five kinds of a Python subset. `names` walks it in preorder and lists the `Name`s it meets, like the reference’s generic walk. Write `children(a, id)` so that it lists each node’s children in the reference’s key order: `Assign` is `target, value`; `For` is `target, iter`, then the body; `Call` is `func`, the `args`, then the value of each keyword argument, in order. Names and numbers have no children.',
    starter: `type Id = usize;

enum Kind {
    Name(String),
    Num(f64),
    Assign { target: Id, value: Id },
    For {
        target: Id,
        iter: Id,
        body: Vec<Id>,
    },
    Call {
        func: Id,
        args: Vec<Id>,
        kws: Vec<(String, Id)>,
    },
}

#[derive(Default)]
struct Ast {
    nodes: Vec<Kind>,
}

impl Ast {
    fn add(&mut self, k: Kind) -> Id {
        self.nodes.push(k);
        self.nodes.len() - 1
    }
}

// Preorder, like the reference's walk:
// the names, in the order visited.
fn names(a: &Ast, id: Id) -> Vec<&str> {
    let mut out = Vec::new();
    let node = &a.nodes[id];
    if let Kind::Name(n) = node {
        out.push(n.as_str());
    }
    for c in children(a, id) {
        out.extend(names(a, c));
    }
    out
}

fn children(
    a: &Ast,
    id: Id,
) -> Vec<Id> {
    todo!()
}`,
    solution: `type Id = usize;

enum Kind {
    Name(String),
    Num(f64),
    Assign { target: Id, value: Id },
    For {
        target: Id,
        iter: Id,
        body: Vec<Id>,
    },
    Call {
        func: Id,
        args: Vec<Id>,
        kws: Vec<(String, Id)>,
    },
}

#[derive(Default)]
struct Ast {
    nodes: Vec<Kind>,
}

impl Ast {
    fn add(&mut self, k: Kind) -> Id {
        self.nodes.push(k);
        self.nodes.len() - 1
    }
}

// Preorder, like the reference's walk:
// the names, in the order visited.
fn names(a: &Ast, id: Id) -> Vec<&str> {
    let mut out = Vec::new();
    let node = &a.nodes[id];
    if let Kind::Name(n) = node {
        out.push(n.as_str());
    }
    for c in children(a, id) {
        out.extend(names(a, c));
    }
    out
}

fn children(
    a: &Ast,
    id: Id,
) -> Vec<Id> {
    use Kind::*;
    let mut out = Vec::new();
    match &a.nodes[id] {
        Name(_) | Num(_) => {}
        Assign { target, value } => {
            out.push(*target);
            out.push(*value);
        }
        For { target, iter, body } => {
            out.push(*target);
            out.push(*iter);
            out.extend(body);
        }
        Call { func, args, kws } => {
            out.push(*func);
            out.extend(args);
            for (_, v) in kws {
                out.push(*v);
            }
        }
    }
    out
}`,
    tests: `fn name(a: &mut Ast, s: &str) -> Id {
    a.add(Kind::Name(s.to_string()))
}

#[test]
fn a_name_has_no_children() {
    let mut a = Ast::default();
    let x = name(&mut a, "x");
    assert_eq!(children(&a, x), vec![]);
    assert_eq!(names(&a, x), vec!["x"]);
}

#[test]
fn assign_is_target_then_value() {
    let mut a = Ast::default();
    let t = name(&mut a, "t");
    let v = name(&mut a, "v");
    let s = a.add(Kind::Assign { target: t, value: v });
    assert_eq!(children(&a, s), vec![t, v]);
}

#[test]
fn for_is_target_iter_body() {
    // for p in ps: q = p
    let mut a = Ast::default();
    let q = name(&mut a, "q");
    let p1 = name(&mut a, "p");
    let s = a.add(Kind::Assign { target: q, value: p1 });
    let p = name(&mut a, "p");
    let ps = name(&mut a, "ps");
    let f = a.add(Kind::For { target: p, iter: ps, body: vec![s] });
    assert_eq!(children(&a, f), vec![p, ps, s]);
    assert_eq!(names(&a, f), vec!["p", "ps", "q", "p"]);
}

#[test]
fn call_is_func_args_then_keyword_values() {
    // f(x, 2, k=w)
    let mut a = Ast::default();
    let w = name(&mut a, "w");
    let f = name(&mut a, "f");
    let x = name(&mut a, "x");
    let two = a.add(Kind::Num(2.0));
    let c = a.add(Kind::Call {
        func: f,
        args: vec![x, two],
        kws: vec![("k".to_string(), w)],
    });
    assert_eq!(children(&a, c), vec![f, x, two, w]);
    assert_eq!(names(&a, c), vec!["f", "x", "w"]);
}`,
    hints: [
      'Start with `use Kind::*;` and `match &a.nodes[id] { ... }`. Matching on a reference binds the fields by reference, so `target` is a `&Id`: push `*target`.',
      '`out.extend(body)` adds every id of a `&Vec<Id>` (an iterator of `&Id` works with `extend` for `Copy` types).',
      'For keywords, only the value is a child: `for (_, v) in kws { out.push(*v); }`.',
    ],
    walkthrough: `This is \`Ast::children\` from \`engine/rust/crates/frontend-python/src/parser.rs\`, cut down to five kinds.

- **Why spell the order out?** The reference walks a node’s keys in the order its parser created them (\`{ target, iter, body }\`). An arena node has fields, not keys, so the port lists them by hand, kind by kind. Any other order still visits every node, but the names an unmodelled statement reads would be emitted in another order, and so would \`explain\`’s reasons.
- **Keywords.** The reference stores keyword arguments as \`{ name, value }\` objects; its walk descends into \`value\` only. Here a keyword is \`(String, Id)\`, and only the \`Id\` is a child.
- **The wrong attempts** each swap one pair: keyword values before positional arguments, or the iterable before the loop variable. Every node is still visited, which is exactly why such a slip survives a test that only counts nodes, and fails one that checks the order.`,
    wrong: [
      {
        code: `type Id = usize;

enum Kind {
    Name(String),
    Num(f64),
    Assign { target: Id, value: Id },
    For {
        target: Id,
        iter: Id,
        body: Vec<Id>,
    },
    Call {
        func: Id,
        args: Vec<Id>,
        kws: Vec<(String, Id)>,
    },
}

#[derive(Default)]
struct Ast {
    nodes: Vec<Kind>,
}

impl Ast {
    fn add(&mut self, k: Kind) -> Id {
        self.nodes.push(k);
        self.nodes.len() - 1
    }
}

// Preorder, like the reference's walk:
// the names, in the order visited.
fn names(a: &Ast, id: Id) -> Vec<&str> {
    let mut out = Vec::new();
    let node = &a.nodes[id];
    if let Kind::Name(n) = node {
        out.push(n.as_str());
    }
    for c in children(a, id) {
        out.extend(names(a, c));
    }
    out
}

fn children(
    a: &Ast,
    id: Id,
) -> Vec<Id> {
    use Kind::*;
    let mut out = Vec::new();
    match &a.nodes[id] {
        Name(_) | Num(_) => {}
        Assign { target, value } => {
            out.push(*target);
            out.push(*value);
        }
        For { target, iter, body } => {
            out.push(*target);
            out.push(*iter);
            out.extend(body);
        }
        Call { func, args, kws } => {
            out.push(*func);
            for (_, v) in kws {
                out.push(*v);
            }
            out.extend(args);
        }
    }
    out
}`,
        why: 'Keyword values come before the positional arguments. `f(x, 2, k=w)` walks `f, w, x`: the reference walks `f, x, w`.',
      },
      {
        code: `type Id = usize;

enum Kind {
    Name(String),
    Num(f64),
    Assign { target: Id, value: Id },
    For {
        target: Id,
        iter: Id,
        body: Vec<Id>,
    },
    Call {
        func: Id,
        args: Vec<Id>,
        kws: Vec<(String, Id)>,
    },
}

#[derive(Default)]
struct Ast {
    nodes: Vec<Kind>,
}

impl Ast {
    fn add(&mut self, k: Kind) -> Id {
        self.nodes.push(k);
        self.nodes.len() - 1
    }
}

// Preorder, like the reference's walk:
// the names, in the order visited.
fn names(a: &Ast, id: Id) -> Vec<&str> {
    let mut out = Vec::new();
    let node = &a.nodes[id];
    if let Kind::Name(n) = node {
        out.push(n.as_str());
    }
    for c in children(a, id) {
        out.extend(names(a, c));
    }
    out
}

fn children(
    a: &Ast,
    id: Id,
) -> Vec<Id> {
    use Kind::*;
    let mut out = Vec::new();
    match &a.nodes[id] {
        Name(_) | Num(_) => {}
        Assign { target, value } => {
            out.push(*target);
            out.push(*value);
        }
        For { target, iter, body } => {
            out.push(*iter);
            out.push(*target);
            out.extend(body);
        }
        Call { func, args, kws } => {
            out.push(*func);
            out.extend(args);
            for (_, v) in kws {
                out.push(*v);
            }
        }
    }
    out
}`,
        why: 'The iterable comes before the loop variable, but the reference created `target` first.',
      },
      {
        code: `type Id = usize;

enum Kind {
    Name(String),
    Num(f64),
    Assign { target: Id, value: Id },
    For {
        target: Id,
        iter: Id,
        body: Vec<Id>,
    },
    Call {
        func: Id,
        args: Vec<Id>,
        kws: Vec<(String, Id)>,
    },
}

#[derive(Default)]
struct Ast {
    nodes: Vec<Kind>,
}

impl Ast {
    fn add(&mut self, k: Kind) -> Id {
        self.nodes.push(k);
        self.nodes.len() - 1
    }
}

// Preorder, like the reference's walk:
// the names, in the order visited.
fn names(a: &Ast, id: Id) -> Vec<&str> {
    let mut out = Vec::new();
    let node = &a.nodes[id];
    if let Kind::Name(n) = node {
        out.push(n.as_str());
    }
    for c in children(a, id) {
        out.extend(names(a, c));
    }
    out
}

fn children(
    a: &Ast,
    id: Id,
) -> Vec<Id> {
    use Kind::*;
    let mut out = Vec::new();
    match &a.nodes[id] {
        Name(_) | Num(_) => {}
        Assign { target, value } => {
            out.push(*target);
            out.push(*value);
        }
        For { target, iter, body } => {
            out.push(*target);
            out.push(*iter);
            out.extend(body);
        }
        Call { func, args, kws } => {
            out.push(*func);
            out.extend(args);
        }
    }
    out
}`,
        why: 'Keyword values are left out, so a name read only in `k=w` is never seen by the walk.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'A Python file uses `lambda`. What does `viscosity explain` print for it?',
    options: [
      { t: 'A syntax error, and the build fails', why: 'Outside the subset is not an error: the plugin fails closed.' },
      { t: '“No arrays of objects found.”, and `build` emits the file unchanged', correct: true, why: 'The plugin lowers an empty module and keeps the reason in `PyExtra::unsupported`.' },
      { t: 'A refusal for each list in the file', why: 'Nothing is lowered, so there are no collections to refuse.' },
    ],
  },
  {
    q: 'In the tokenizer, line 3 is indented 2 columns, between two open levels of 0 and 4. When is that not an error?',
    options: [
      { t: 'When line 2 ended inside an open bracket', correct: true, why: 'With depth above 0 the line break is whitespace, and line 3’s width is never measured.' },
      { t: 'When line 3 is a comment', why: 'A comment-only line is skipped too, but that isn’t what the question describes.' },
      { t: 'Never: 2 is always inconsistent', why: 'Only widths measured at the start of a logical line are compared.' },
      { t: 'When tabs are used', why: 'A tab just moves the width to the next multiple of 8.' },
    ],
  },
  {
    q: 'Why does `Ast::children` list a `Call`’s keyword values after its positional arguments?',
    options: [
      { t: 'Python evaluates them in that order', why: 'True, but the reason in the port is parity with the reference’s walk.' },
      { t: 'It is faster', why: 'Order makes no difference to speed.' },
      { t: 'The reference’s parser created `args` before `keywords`, and its walk follows key order; the port must visit in the same order', correct: true, why: 'Walk order decides VIR order, and VIR order decides the order of explain’s reasons.' },
    ],
  },
  {
    q: '`tag: str = f"k={K}"` is a dataclass default. What does the Rust lowering do?',
    options: [
      { t: 'Copies the f-string to each call, like any string', why: 'That was the reference’s bug: the compiled program then printed a later value of `K`.' },
      { t: 'Evaluates it at compile time', why: 'Viscosity doesn’t run Python code.' },
      { t: 'Treats it as non-literal: the class isn’t modelled, so its list stays as objects', correct: true, why: '`is_literal_default` returns false for `ConstValue::Str { fstring: true, .. }`.' },
    ],
  },
  {
    q: 'Which field gets an `array(\'d\')` column?',
    options: [
      { t: 'Every numeric field', why: 'An int stored in `array(\'d\')` comes back as a float, and prints as `1.0`.' },
      { t: 'Only fields proven to always hold floats; ints and anything else get lists', correct: true, why: 'So `count: int` gets a list and `weight: float` a typed column.' },
      { t: 'Only fields named in an annotation', why: 'The annotation chooses the layout of the list, not the column types.' },
    ],
  },
  {
    q: 'The old reference tokenizer hung on a file ending `k = 0x1`. Why didn’t the Rust port?',
    options: [
      { t: 'Rust has no regular expressions', why: 'There are regex crates; the port just doesn’t need one here.' },
      { t: 'Past the end, `s.get(k)` is `None`, read as byte 0, which is not a hex digit', correct: true, why: 'The reference read `undefined`, which `/[0-9a-fA-F_]/` tests as the string "undefined", matching forever.' },
      { t: 'Rust stops loops after a time limit', why: 'No such thing: the loop ends because the character test fails.' },
    ],
  },
];
