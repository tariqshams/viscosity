// Chapter 402 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'rl-ident-const': {
    q: 'What does drip-rs’s `identifier_constant(name)` do?',
    a: 'Interns the name and adds it to the chunk’s constant pool as a `Value::String`, returning the constant’s index. It does not reuse an earlier copy.',
  },
  'rl-set-new': {
    q: 'How does `store.global` notice an assignment to a global that was never defined?',
    a: '`globals.set` returns `true` when the key was new. The VM then deletes the entry again and reports `undefined variable \'m\'`.',
  },
  'rl-globals-root': {
    q: 'Why must the VM’s `globals` table be a garbage-collection root?',
    a: 'Its keys and values are handles to heap objects that may be reachable from nowhere else.',
  },
  'rl-local': {
    q: 'What three things does drip-rs’s compiler record for each local?',
    a: 'Its name (a `&\'src str` into the source), its scope depth (`Option<usize>`), and whether a closure captures it.',
  },
  'rl-option-depth': {
    q: 'What does `depth: None` mean for a drip-rs local, and what did TypeScript use instead?',
    a: 'Declared, but its initialiser is still being compiled, so it cannot be read yet. TypeScript used `depth: -1`.',
  },
  'rl-rev': {
    q: 'Why does `resolve_local` search the locals from the end?',
    a: 'Later locals are more deeply nested, so the innermost variable with that name, the one that shadows the others, is found first.',
  },
  'rl-no-emit': {
    q: 'Which instruction defines a local variable?',
    a: 'None. The initialiser leaves its value on the stack, which is already the local’s slot; the compiler only marks it initialised.',
  },
  'rl-end-scope': {
    q: 'Why can’t drip-rs’s `end_scope` keep `let state = self.state();` and call `self.emit_op` in the loop?',
    a: '`state` is a mutable borrow into `self.functions`, still used after the call, and `emit_op` needs all of `self`: E0499. Read `is_captured`, pop, then emit.',
  },
  'rl-declare': {
    q: 'How does `declare_variable` report a duplicate without a borrow conflict?',
    a: 'It first computes a plain `bool` with `iter().rev().take_while(..).any(..)`, ending the borrow of the locals, then reports the error.',
  },
};

export const examples = {
  'locals-run': {
    lang: 'drip-vm',
    title: 'Globals and locals together',
    code: `let total = 0;
fn sum(xs) {
  let s = 0;
  for x in xs {
    s += x;
  }
  return s;
}
total = sum([1, 2, 3]);
print total;`,
  },
};

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
      'First `self.state().scope_depth -= 1;`, on its own line, so that borrow ends at once. Then `loop`.',
      'At the top of each turn, `let st = self.state();`, read the depth, and look at `st.locals.last()`; `break` if there is none, or if its depth is not deeper than the new `scope_depth`.',
      'Copy `is_captured` into a local, `st.locals.pop()`, and only after that call `self.emit_op(...)`, with `Op::CloseUpvalue` for a captured local and `Op::Pop` otherwise.',
    ],
    walkthrough: `**How to think about it.** Ending a scope means forgetting its locals, newest first, and emitting one instruction per local so the stack matches. The TypeScript version holds the function in a variable for the whole loop and emits as it goes; in Rust that variable is a \`&mut\` borrowed out of \`self\`, and \`self.emit_op\` needs \`&mut self\` too, so the two cannot overlap. The fix is to arrange each turn of the loop in two halves: first use \`st\` (read, pop), then stop using it and emit.

**The solution, line by line.**

- \`self.state().scope_depth -= 1;\` leaves the scope. After this, \`scope_depth\` is the enclosing scope's depth.
- \`loop {\` removes one local per turn.
- \`let st = self.state();\` re-borrows the innermost function at the start of every turn.
- \`let d = st.scope_depth;\` copies the depth (a \`usize\`, so \`Copy\`).
- \`let last = st.locals.last(); let Some(l) = last else { break; };\` stops when there are no locals left.
- \`let deeper = l.depth.is_some_and(|x| x > d); if !deeper { break; }\` stops at the first local that belongs to the enclosing scope. Deeper, not equal: the enclosing scope's own locals have exactly depth \`d\` and must stay.
- \`let cap = l.is_captured;\` copies the one fact the emit needs.
- \`st.locals.pop();\` forgets the local. This is the last use of \`st\` in the turn.
- \`self.emit_op(if cap { Op::CloseUpvalue } else { Op::Pop });\` is now the only borrow alive, so it compiles. A captured local must move to the heap as its scope ends, because a closure still refers to it; any other local is simply popped.

This is drip-rs's real \`end_scope\`, line for line.

**Common wrong attempts.**

- Taking \`let st = self.state();\` once, before the loop, and calling \`st.locals.pop()\` after \`self.emit_op\`: E0499, two mutable borrows of \`self\` alive at once.
- Forgetting \`scope_depth -= 1\`: no local is ever deeper than the current depth, so nothing is popped and the scope never ends.
- Always emitting \`Op::Pop\`: a captured local is thrown away instead of closed over, and a closure would lose it.`,
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
- If the one found has depth \`None\`, it is being read in its own initialiser, as in \`let a = a;\`. Record the error \`cannot read 'a' in its own initialiser\` (with the real name) using \`self.error\`, and still return its slot, as drip-rs does.`,
    starter: `
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
    // initialiser is an error.
    fn resolve_local(
        &mut self,
        name: &str,
    ) -> Option<usize> {
        todo!()
    }
}`,
    solution: `
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
    // initialiser is an error.
    fn resolve_local(
        &mut self,
        name: &str,
    ) -> Option<usize> {
        let ls = &self.locals;
        let i = ls.iter().rposition(
            |l| l.name == name,
        )?;
        if ls[i].depth.is_none() {
            let m = format!("cannot \\
                read '{name}' in its \\
                own initialiser");
            self.error(&m);
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
    assert_eq!(c.errors, ["cannot read 'a' \\
        in its own initialiser"]);
}`,
    hints: [
      'Search from the end: `self.locals.iter().rposition(|l| l.name == name)` gives the index of the last match, or `None`.',
      'Put `?` after it, so an unknown name returns `None` from `resolve_local` straight away.',
      'If `self.locals[i].depth.is_none()`, build the message with `format!` and call `self.error(&m)`; then return `Some(i)` either way.',
    ],
    walkthrough: `**How to think about it.** Two questions: which local does this name mean, and is it ready to be read? The first is "the newest local with this name", because a later \`let\` in an inner block shadows an outer one, so search from the end. The second is the \`depth\` field: \`None\` means the variable is declared but its initialiser is still being compiled.

**The solution, line by line.**

- \`let ls = &self.locals;\` borrows the list to search it.
- \`let i = ls.iter().rposition(|l| l.name == name)?;\`: \`rposition\` searches from the end and returns the index of the first match it meets, which is the innermost; when nothing matches it returns \`None\`, and \`?\` returns that from \`resolve_local\`. (drip-rs writes \`locals.iter().enumerate().rev().find(..)?\`, the same search.)
- \`if ls[i].depth.is_none() {\` asks whether the local is still being initialised. This is the last use of \`ls\`, so its borrow ends here.
- \`let m = format!("cannot read '{name}' in its own initialiser");\` builds Drip's message (the \`\\\\\` continues the string on the next line).
- \`self.error(&m);\` needs \`&mut self\`, which is allowed now that \`ls\` is finished.
- \`Some(i)\` returns the slot even after an error: the error makes the whole compile fail anyway, and compiling carries on to find more errors. Returning \`None\` would quietly treat \`a\` as a global and hide the mistake.

**Common wrong attempts.**

- \`position\` instead of \`rposition\`: it searches from the front and finds the outermost \`a\`, not the one that shadows it.
- \`ls[i].depth?;\` to skip unready locals: it returns \`None\` without reporting anything, so \`let a = a;\` would silently read a global \`a\`.`,
    wrong: [
      {
        code: `
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
    // initialiser is an error.
    fn resolve_local(
        &mut self,
        name: &str,
    ) -> Option<usize> {
        let ls = &self.locals;
        let i = ls.iter().position(
            |l| l.name == name,
        )?;
        if ls[i].depth.is_none() {
            let m = format!("cannot \\
                read '{name}' in its \\
                own initialiser");
            self.error(&m);
        }
        Some(i)
    }
}`,
        why: '`position` searches from the front, so it finds the outermost variable with that name, not the one that shadows it.',
      },
      {
        code: `
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
    // initialiser is an error.
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
    q: 'In the listing for `let n = 1; n = n + 1; print n;`, why are constants 1, 2, 3 and 5 all `\'n\'`?',
    options: [
      { t: '`identifier_constant` adds a constant every time a name is used, without looking for an earlier copy', correct: true, why: 'Each is the same interned `StrRef`, stored again in the pool.' },
      { t: 'The names are different strings that happen to print the same', why: 'They are interned, so they are the same string object.' },
      { t: 'The VM copies the name each time it runs', why: 'The constants are made by the compiler, before anything runs.' },
    ],
  },
  {
    q: 'What does drip-rs print for the one-line program `m = 1;`?',
    options: [
      { t: 'Nothing: it creates a global `m`', why: 'Only `let` creates a global; assignment never does.' },
      { t: '`line 1: \'m\' is not declared`', why: 'Globals are checked at run time, not by the compiler.' },
      { t: '`runtime error: undefined variable \'m\'`, then `  at line 1 in script`', correct: true, why: '`store.global` sees `set` return `true` (a new key), deletes it again and reports the error.' },
    ],
  },
  {
    q: 'What does `depth: None` on a drip-rs `Local` mean?',
    options: [
      { t: 'The local is a global', why: 'Globals are never in the locals `Vec`.' },
      { t: 'The local is declared, but its initialiser is still being compiled', correct: true, why: 'Reading it now is the error `cannot read \'a\' in its own initialiser`.' },
      { t: 'The local has been captured by a closure', why: 'That is `is_captured`.' },
      { t: 'The local is at scope depth 0', why: 'Depth 0 would be `Some(0)`.' },
    ],
  },
  {
    q: 'Why does this fail, inside a block: `let a = 1; { let a = a + 1; }`?',
    options: [
      { t: 'Locals cannot shadow other locals', why: 'They can, in a nested block; the trouble is reading the inner one.' },
      { t: 'The inner `a` is declared before its initialiser is compiled, so `a + 1` finds the unfinished inner `a`', correct: true, why: '`resolve_local` searches from the end and finds the inner `a` with depth `None`.' },
      { t: '`a + 1` is not allowed in a `let`', why: 'Any expression is; `let b = a + 1;` works.' },
    ],
  },
  {
    q: 'What does `load.local 2` do at run time?',
    options: [
      { t: 'Looks up the name of local 2 in a table', why: 'Locals have no names at run time.' },
      { t: 'Reads constant 2 and searches the stack for it', why: 'The operand is a slot number, not a constant index.' },
      { t: 'Calls `resolve_local`', why: 'That runs in the compiler, never in the VM.' },
      { t: 'Pushes `self.stack[self.slots + 2]`: one addition and one indexed read', correct: true, why: '`self.slots` is the running frame’s base.' },
    ],
  },
];
