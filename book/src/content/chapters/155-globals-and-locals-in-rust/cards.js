// Chapter 155 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'rl-ident-const': {
    q: 'What does drip-rs’s `identifier_constant(name)` do?',
    a: 'Interns the name and adds it to the chunk’s constant pool as a `Value::String`, returning the constant’s index. It doesn’t reuse an earlier copy.',
  },
  'rl-set-new': {
    q: 'How does `SetGlobal` detect assignment to a global that was never defined?',
    a: '`globals.set` returns `true` when the key was new. The VM then deletes the entry again and reports “Undefined variable”.',
  },
  'rl-globals-root': {
    q: 'Why must the VM’s `globals` table be a GC root?',
    a: 'Its keys and values are handles to heap objects that may be reachable from nowhere else.',
  },
  'rl-local': {
    q: 'What three things does drip-rs’s compiler record for each local?',
    a: 'Its name (a `&\'src str` into the source), its scope depth (`Option<usize>`), and whether a closure captures it.',
  },
  'rl-option-depth': {
    q: 'What does `depth: None` mean for a drip-rs local, and what did TypeScript use instead?',
    a: 'Declared, but its initializer is still being compiled, so it can’t be read yet. TypeScript used `depth: -1`.',
  },
  'rl-rev': {
    q: 'Why does `resolve_local` search the locals from the end?',
    a: 'Later locals are more deeply nested, so the innermost variable with that name, the one that shadows the others, is found first.',
  },
  'rl-no-emit': {
    q: 'What instruction defines a local variable?',
    a: 'None. The initializer leaves its value on the stack, which is already the local’s slot; the compiler only marks it initialized.',
  },
  'rl-end-scope': {
    q: 'Why can’t drip-rs’s `end_scope` keep `let st = self.state();` and call `self.emit_op` in the loop?',
    a: '`st` is a mutable borrow into `self.functions`, still used after the call, and `emit_op` needs all of `self`: E0499. Read `is_captured`, pop, then emit.',
  },
  'rl-declare': {
    q: 'How does `declare_variable` report a duplicate without a borrow conflict?',
    a: 'It first computes a plain `bool` with `iter().rev().take_while(..).any(..)`, ending the borrow of the locals, then calls `self.error`.',
  },
};

export const examples = {};

export const exercises = {
  endScope: {
    lang: 'rust',
    title: 'end_scope',
    prompt: `This compiler is shaped like drip-rs's: functions in a \`Vec\`, \`state()\` for the innermost one, and \`emit_op\` taking \`&mut self\`. Write \`end_scope\`:

1. Lower \`scope_depth\` by one.
2. While the last local's depth is deeper than the new \`scope_depth\`, remove it and emit \`Op::Pop\`, or \`Op::CloseUpvalue\` if it \`is_captured\`.

Locals go innermost first: the last one in the \`Vec\` is popped first. Locals of the enclosing scope stay.

Holding \`let st = self.state();\` across a call to \`self.emit_op\` won't compile. Read what you need, finish with \`st\`, then emit.`,
    starter: `#[derive(Clone, Copy, Debug, PartialEq)]
enum Op {
    Pop,
    CloseUpvalue,
}

struct Local {
    name: &'static str,
    depth: Option<usize>,
    is_captured: bool,
}

struct Func {
    locals: Vec<Local>,
    scope_depth: usize,
    code: Vec<Op>,
}

struct Compiler {
    fns: Vec<Func>,
}

impl Compiler {
    fn new() -> Self {
        let f = Func {
            locals: Vec::new(),
            scope_depth: 0,
            code: Vec::new(),
        };
        Compiler { fns: vec![f] }
    }

    fn state(&mut self) -> &mut Func {
        self.fns.last_mut().unwrap()
    }

    fn emit_op(&mut self, op: Op) {
        self.state().code.push(op);
    }

    fn begin_scope(&mut self) {
        self.state().scope_depth += 1;
    }

    fn add_local(
        &mut self,
        name: &'static str,
    ) {
        let st = self.state();
        let d = st.scope_depth;
        st.locals.push(Local {
            name,
            depth: Some(d),
            is_captured: false,
        });
    }

    // Leave a scope. Drop its locals,
    // innermost first, emitting Pop, or
    // CloseUpvalue for a captured one.
    fn end_scope(&mut self) {
        todo!()
    }
}`,
    solution: `#[derive(Clone, Copy, Debug, PartialEq)]
enum Op {
    Pop,
    CloseUpvalue,
}

struct Local {
    name: &'static str,
    depth: Option<usize>,
    is_captured: bool,
}

struct Func {
    locals: Vec<Local>,
    scope_depth: usize,
    code: Vec<Op>,
}

struct Compiler {
    fns: Vec<Func>,
}

impl Compiler {
    fn new() -> Self {
        let f = Func {
            locals: Vec::new(),
            scope_depth: 0,
            code: Vec::new(),
        };
        Compiler { fns: vec![f] }
    }

    fn state(&mut self) -> &mut Func {
        self.fns.last_mut().unwrap()
    }

    fn emit_op(&mut self, op: Op) {
        self.state().code.push(op);
    }

    fn begin_scope(&mut self) {
        self.state().scope_depth += 1;
    }

    fn add_local(
        &mut self,
        name: &'static str,
    ) {
        let st = self.state();
        let d = st.scope_depth;
        st.locals.push(Local {
            name,
            depth: Some(d),
            is_captured: false,
        });
    }

    // Leave a scope. Drop its locals,
    // innermost first, emitting Pop, or
    // CloseUpvalue for a captured one.
    fn end_scope(&mut self) {
        self.state().scope_depth -= 1;
        loop {
            let st = self.state();
            let d = st.scope_depth;
            let last = st.locals.last();
            let Some(l) = last else {
                break;
            };
            let deeper = l
                .depth
                .is_some_and(|x| x > d);
            if !deeper {
                break;
            }
            let cap = l.is_captured;
            st.locals.pop();
            // st is done: now emit.
            self.emit_op(if cap {
                Op::CloseUpvalue
            } else {
                Op::Pop
            });
        }
    }
}`,
    tests: `use Op::*;

fn names(c: &mut Compiler) -> Vec<&str> {
    c.state()
        .locals
        .iter()
        .map(|l| l.name)
        .collect()
}

#[test]
fn pops_the_inner_locals() {
    let mut c = Compiler::new();
    c.begin_scope();
    c.add_local("a");
    c.begin_scope();
    c.add_local("b");
    c.add_local("c");
    c.end_scope();
    assert_eq!(c.state().code, [Pop, Pop]);
}

#[test]
fn keeps_the_outer_locals() {
    let mut c = Compiler::new();
    c.begin_scope();
    c.add_local("a");
    c.begin_scope();
    c.add_local("b");
    c.end_scope();
    assert_eq!(names(&mut c), ["a"]);
    assert_eq!(c.state().scope_depth, 1);
}

#[test]
fn closes_a_captured_local() {
    let mut c = Compiler::new();
    c.begin_scope();
    c.add_local("a");
    c.add_local("b");
    c.add_local("c");
    c.state().locals[1].is_captured = true;
    c.end_scope();
    // c first, then b, then a.
    assert_eq!(c.state().code,
        [Pop, CloseUpvalue, Pop]);
}

#[test]
fn an_empty_scope_emits_nothing() {
    let mut c = Compiler::new();
    c.begin_scope();
    c.add_local("a");
    c.begin_scope();
    c.end_scope();
    assert_eq!(c.state().code, []);
    assert_eq!(names(&mut c), ["a"]);
}

#[test]
fn two_scopes_in_turn() {
    let mut c = Compiler::new();
    c.begin_scope();
    c.add_local("a");
    c.begin_scope();
    c.add_local("b");
    c.end_scope();
    c.end_scope();
    assert_eq!(c.state().code, [Pop, Pop]);
    assert!(names(&mut c).is_empty());
}`,
    hints: [
      'Start with `self.state().scope_depth -= 1;`. That borrow ends at the semicolon.',
      'Loop. In each turn, take `let st = self.state();`, look at `st.locals.last()`, and `break` if there is none or its depth isn’t `Some(x)` with `x > st.scope_depth`.',
      'Copy `l.is_captured` into a local, call `st.locals.pop()`, and only then `self.emit_op(...)`. `st` must not be used after the emit.',
    ],
    walkthrough: `**The order is the point.** In TypeScript, \`endScope\` holds the function in \`c\` and emits while it loops. Here \`st\` is a \`&mut Func\` borrowed out of \`self\`, and \`self.emit_op\` needs \`&mut self\` too. If \`st\` is used after the emit, rustc reports E0499.

**So each turn re-borrows.** \`let st = self.state();\` at the top of the loop, read \`depth\` and \`is_captured\` (both \`Copy\`), pop, and stop using \`st\`. The emit is then the only borrow alive. That is exactly drip-rs's \`end_scope\`.

**Deeper, not equal.** After the decrement, \`scope_depth\` is the enclosing scope's depth. Its own locals have exactly that depth and must stay, so the test is \`x > d\`.

**Why \`CloseUpvalue\`.** A captured local must move to the heap as its scope ends, because a closure still refers to it (chapter 158). An uncaptured one is simply popped.`,
    wrong: [
      {
        code: `#[derive(Clone, Copy, Debug, PartialEq)]
enum Op {
    Pop,
    CloseUpvalue,
}

struct Local {
    name: &'static str,
    depth: Option<usize>,
    is_captured: bool,
}

struct Func {
    locals: Vec<Local>,
    scope_depth: usize,
    code: Vec<Op>,
}

struct Compiler {
    fns: Vec<Func>,
}

impl Compiler {
    fn new() -> Self {
        let f = Func {
            locals: Vec::new(),
            scope_depth: 0,
            code: Vec::new(),
        };
        Compiler { fns: vec![f] }
    }

    fn state(&mut self) -> &mut Func {
        self.fns.last_mut().unwrap()
    }

    fn emit_op(&mut self, op: Op) {
        self.state().code.push(op);
    }

    fn begin_scope(&mut self) {
        self.state().scope_depth += 1;
    }

    fn add_local(
        &mut self,
        name: &'static str,
    ) {
        let st = self.state();
        let d = st.scope_depth;
        st.locals.push(Local {
            name,
            depth: Some(d),
            is_captured: false,
        });
    }

    // Leave a scope. Drop its locals,
    // innermost first, emitting Pop, or
    // CloseUpvalue for a captured one.
    fn end_scope(&mut self) {
        let st = self.state();
        st.scope_depth -= 1;
        let d = st.scope_depth;
        loop {
            let last = st.locals.last();
            let Some(l) = last else {
                break;
            };
            let deeper = l
                .depth
                .is_some_and(|x| x > d);
            if !deeper {
                break;
            }
            let op = if l.is_captured {
                Op::CloseUpvalue
            } else {
                Op::Pop
            };
            self.emit_op(op);
            st.locals.pop();
        }
    }
}`,
        why: 'The TypeScript shape. `st` borrows `self` mutably and is used again (`st.locals.pop()`) after `self.emit_op`, so this is E0499.',
      },
      {
        code: `#[derive(Clone, Copy, Debug, PartialEq)]
enum Op {
    Pop,
    CloseUpvalue,
}

struct Local {
    name: &'static str,
    depth: Option<usize>,
    is_captured: bool,
}

struct Func {
    locals: Vec<Local>,
    scope_depth: usize,
    code: Vec<Op>,
}

struct Compiler {
    fns: Vec<Func>,
}

impl Compiler {
    fn new() -> Self {
        let f = Func {
            locals: Vec::new(),
            scope_depth: 0,
            code: Vec::new(),
        };
        Compiler { fns: vec![f] }
    }

    fn state(&mut self) -> &mut Func {
        self.fns.last_mut().unwrap()
    }

    fn emit_op(&mut self, op: Op) {
        self.state().code.push(op);
    }

    fn begin_scope(&mut self) {
        self.state().scope_depth += 1;
    }

    fn add_local(
        &mut self,
        name: &'static str,
    ) {
        let st = self.state();
        let d = st.scope_depth;
        st.locals.push(Local {
            name,
            depth: Some(d),
            is_captured: false,
        });
    }

    // Leave a scope. Drop its locals,
    // innermost first, emitting Pop, or
    // CloseUpvalue for a captured one.
    fn end_scope(&mut self) {
        loop {
            let st = self.state();
            let d = st.scope_depth;
            let last = st.locals.last();
            let Some(l) = last else {
                break;
            };
            let deeper = l
                .depth
                .is_some_and(|x| x > d);
            if !deeper {
                break;
            }
            let cap = l.is_captured;
            st.locals.pop();
            // st is done: now emit.
            self.emit_op(if cap {
                Op::CloseUpvalue
            } else {
                Op::Pop
            });
        }
    }
}`,
        why: 'It never lowers `scope_depth`, so no local is deeper than the current depth, nothing is popped, and the inner scope never ends.',
      },
      {
        code: `#[derive(Clone, Copy, Debug, PartialEq)]
enum Op {
    Pop,
    CloseUpvalue,
}

struct Local {
    name: &'static str,
    depth: Option<usize>,
    is_captured: bool,
}

struct Func {
    locals: Vec<Local>,
    scope_depth: usize,
    code: Vec<Op>,
}

struct Compiler {
    fns: Vec<Func>,
}

impl Compiler {
    fn new() -> Self {
        let f = Func {
            locals: Vec::new(),
            scope_depth: 0,
            code: Vec::new(),
        };
        Compiler { fns: vec![f] }
    }

    fn state(&mut self) -> &mut Func {
        self.fns.last_mut().unwrap()
    }

    fn emit_op(&mut self, op: Op) {
        self.state().code.push(op);
    }

    fn begin_scope(&mut self) {
        self.state().scope_depth += 1;
    }

    fn add_local(
        &mut self,
        name: &'static str,
    ) {
        let st = self.state();
        let d = st.scope_depth;
        st.locals.push(Local {
            name,
            depth: Some(d),
            is_captured: false,
        });
    }

    // Leave a scope. Drop its locals,
    // innermost first, emitting Pop, or
    // CloseUpvalue for a captured one.
    fn end_scope(&mut self) {
        self.state().scope_depth -= 1;
        loop {
            let st = self.state();
            let d = st.scope_depth;
            let last = st.locals.last();
            let Some(l) = last else {
                break;
            };
            let deeper = l
                .depth
                .is_some_and(|x| x > d);
            if !deeper {
                break;
            }
            let cap = l.is_captured;
            st.locals.pop();
            // st is done: now emit.
            self.emit_op(Op::Pop);
        }
    }
}`,
        why: 'It always emits `Pop`, so a captured local is discarded instead of closed over, and a closure would lose it.',
      },
    ],
  },
  resolveLocal: {
    optional: true,
    lang: 'rust',
    title: 'resolve_local',
    prompt: `Write \`resolve_local\`: return the slot (index) of the local called \`name\`, or \`None\` if there is no such local.

- If several locals share the name, the innermost (the last in the \`Vec\`) wins.
- If the one found has depth \`None\`, it is being read in its own initializer, as in \`let a = a;\`. Record the error \`MSG\` with \`self.error\`, and still return its slot, as drip-rs does.`,
    starter: `const MSG: &str = "Can't read local \\
    variable in its own initializer.";

struct Local {
    name: &'static str,
    depth: Option<usize>,
}

struct Compiler {
    locals: Vec<Local>,
    errors: Vec<String>,
}

impl Compiler {
    fn error(&mut self, msg: &str) {
        self.errors.push(msg.into());
    }

    // The slot of local \`name\`, if any.
    // Reading a local in its own
    // initializer is an error (MSG).
    fn resolve_local(
        &mut self,
        name: &str,
    ) -> Option<usize> {
        todo!()
    }
}`,
    solution: `const MSG: &str = "Can't read local \\
    variable in its own initializer.";

struct Local {
    name: &'static str,
    depth: Option<usize>,
}

struct Compiler {
    locals: Vec<Local>,
    errors: Vec<String>,
}

impl Compiler {
    fn error(&mut self, msg: &str) {
        self.errors.push(msg.into());
    }

    // The slot of local \`name\`, if any.
    // Reading a local in its own
    // initializer is an error (MSG).
    fn resolve_local(
        &mut self,
        name: &str,
    ) -> Option<usize> {
        let ls = &self.locals;
        let i = ls.iter().rposition(
            |l| l.name == name,
        )?;
        if ls[i].depth.is_none() {
            self.error(MSG);
        }
        Some(i)
    }
}`,
    tests: `fn compiler(ls: &[(&'static str, bool)])
    -> Compiler {
    let locals = ls
        .iter()
        .map(|&(name, ready)| Local {
            name,
            depth: ready.then_some(1),
        })
        .collect();
    Compiler { locals, errors: vec![] }
}

#[test]
fn finds_a_local() {
    let mut c = compiler(&[("a", true),
        ("b", true)]);
    assert_eq!(c.resolve_local("b"), Some(1));
    assert!(c.errors.is_empty());
}

#[test]
fn the_innermost_shadow_wins() {
    let mut c = compiler(&[("a", true),
        ("x", true), ("a", true)]);
    assert_eq!(c.resolve_local("a"), Some(2));
}

#[test]
fn an_unknown_name_is_none() {
    let mut c = compiler(&[("a", true)]);
    assert_eq!(c.resolve_local("z"), None);
    assert!(c.errors.is_empty());
}

#[test]
fn reading_in_its_own_initializer() {
    // { let a = 1; { let a = a; } }
    let mut c = compiler(&[("a", true),
        ("a", false)]);
    assert_eq!(c.resolve_local("a"), Some(1));
    assert_eq!(c.errors, [MSG]);
}`,
    hints: [
      '`iter().rposition(|l| l.name == name)` is `position`, searching from the end: it gives the index of the last match.',
      'Put `?` after it, so a missing name returns `None` straight away.',
      'Then check `self.locals[i].depth.is_none()`, call `self.error(MSG)` if so, and return `Some(i)`.',
    ],
    walkthrough: `**From the end.** \`{ let a = 1; { let a = 2; print a; } }\` must print 2, so the search starts at the newest local. drip-rs writes it \`locals.iter().enumerate().rev().find(..)\`; \`rposition\` is the same search, giving just the index.

**\`?\` on an \`Option\`.** When nothing matches, \`rposition\` returns \`None\` and \`?\` returns it from \`resolve_local\`. The caller, \`named_variable\`, then tries upvalues, and finally treats the name as a global.

**Still return the slot.** The error is reported, \`had_error\` makes the whole compile fail, and compiling carries on to find more errors. Returning \`None\` instead would quietly treat \`a\` as a global and hide the mistake.

**Borrows.** \`ls\` borrows \`self.locals\`, but its last use is \`ls[i].depth.is_none()\`, so \`self.error\` may borrow \`self\` mutably. Even a TypeScript-style \`for\` loop that calls \`self.error\` and then returns compiles here, because the iterator is never used after the call.`,
    wrong: [
      {
        code: `const MSG: &str = "Can't read local \\
    variable in its own initializer.";

struct Local {
    name: &'static str,
    depth: Option<usize>,
}

struct Compiler {
    locals: Vec<Local>,
    errors: Vec<String>,
}

impl Compiler {
    fn error(&mut self, msg: &str) {
        self.errors.push(msg.into());
    }

    // The slot of local \`name\`, if any.
    // Reading a local in its own
    // initializer is an error (MSG).
    fn resolve_local(
        &mut self,
        name: &str,
    ) -> Option<usize> {
        let ls = &self.locals;
        let i = ls.iter().position(
            |l| l.name == name,
        )?;
        if ls[i].depth.is_none() {
            self.error(MSG);
        }
        Some(i)
    }
}`,
        why: '`position` searches from the front, so it finds the outermost variable with that name, not the one that shadows it.',
      },
      {
        code: `const MSG: &str = "Can't read local \\
    variable in its own initializer.";

struct Local {
    name: &'static str,
    depth: Option<usize>,
}

struct Compiler {
    locals: Vec<Local>,
    errors: Vec<String>,
}

impl Compiler {
    fn error(&mut self, msg: &str) {
        self.errors.push(msg.into());
    }

    // The slot of local \`name\`, if any.
    // Reading a local in its own
    // initializer is an error (MSG).
    fn resolve_local(
        &mut self,
        name: &str,
    ) -> Option<usize> {
        let ls = &self.locals;
        let i = ls.iter().rposition(
            |l| l.name == name,
        )?;
        // Not ready yet: not found.
        ls[i].depth?;
        Some(i)
    }
}`,
        why: '`depth?` returns `None` for an uninitialized local without reporting anything, so `let a = a;` would silently read a global `a`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'In drip-rs, where does a global variable’s value live at run time?',
    options: [
      { t: 'In a stack slot chosen by the compiler', why: 'That is a local.' },
      { t: 'In the `globals` table of the `Vm`, keyed by the interned name', correct: true, why: '`DefineGlobal` does `self.globals.set(name, self.peek(0))`.' },
      { t: 'In the constant pool', why: 'The pool holds the *name*. The value is in the table.' },
      { t: 'In a Rust `static`', why: 'drip-rs has no mutable statics.' },
    ],
  },
  {
    q: '`let n = 1; n = n + 1; print n;` compiles to four constants that are all the string `n`. Why?',
    options: [
      { t: 'Interning failed', why: 'Interning worked: all four are the same `StrRef`. Only the pool entries repeat.' },
      { t: 'Each one is a different variable', why: 'There is one global `n`.' },
      { t: '`identifier_constant` adds a new pool entry each time and doesn’t look for an old one', correct: true, why: 'As in clox and the TypeScript compiler. It is why long scripts can hit the 256-constant limit.' },
      { t: 'The disassembler prints each constant four times', why: 'The constant indices differ: 0, 2, 3 and 5.' },
    ],
  },
  {
    q: 'What does `depth: None` on a drip-rs `Local` stand for?',
    options: [
      { t: 'A global variable', why: 'Globals aren’t in the locals `Vec` at all.' },
      { t: 'A local declared but not yet initialized: reading it is an error', correct: true, why: 'It becomes `Some(depth)` in `mark_initialized`. TypeScript used `-1`.' },
      { t: 'A local captured by a closure', why: 'That is `is_captured`.' },
      { t: 'The reserved slot 0', why: 'Slot 0 has depth `Some(0)`.' },
    ],
  },
  {
    q: 'Which instruction does `let b = a + 2;` emit to store `b`, inside a block?',
    options: [
      { t: '`SET_LOCAL`', why: '`SET_LOCAL` is for assignment, `b = ...`, to an existing local.' },
      { t: '`DEFINE_GLOBAL`', why: 'Only top-level `let`s are globals.' },
      { t: '`POP`', why: 'A `POP` for `b` comes when its scope ends.' },
      { t: 'None: the value of `a + 2` is left on the stack, in `b`’s slot', correct: true, why: 'The compiler only marks `b` initialized.' },
    ],
  },
  {
    q: `Why is this \`end_scope\` loop rejected?
\`\`\`rust
let st = self.state();
// ... in a loop:
self.emit_op(OpCode::Pop);
st.locals.pop();
\`\`\``,
    options: [
      { t: '`st` is a mutable borrow of `self` still used after `emit_op`, which needs `&mut self` too', correct: true, why: 'E0499. drip-rs pops and stops using `state` before it emits.' },
      { t: '`emit_op` can’t be called in a loop', why: 'It can, as long as no other borrow of `self` is alive.' },
      { t: '`Vec::pop` needs ownership of the vector', why: 'It takes `&mut self`, which `st` provides.' },
      { t: 'Popping a local is unsafe', why: 'Nothing here is unsafe.' },
    ],
  },
  {
    q: 'In `{ let a = 1; { let a = 2; print a; } }`, which `a` does `resolve_local` find, and why?',
    options: [
      { t: 'The outer one, at slot 1, because it was declared first', why: 'The search runs from the end.' },
      { t: 'Neither: it is a compile error to shadow', why: 'Shadowing in an inner scope is allowed. Only the same scope is an error.' },
      { t: 'The inner one, at slot 2, because the search runs from the end of the `Vec`', correct: true, why: '`.rev().find(..)`: the innermost matching name wins.' },
      { t: 'Whichever has the larger value', why: 'The compiler doesn’t know the values.' },
    ],
  },
];
