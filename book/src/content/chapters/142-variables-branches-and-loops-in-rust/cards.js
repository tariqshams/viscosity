// Chapter 75 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.
// Merged from old chapters 142, 142.

export const prompts = {
  'rl-local': {
    q: 'What three things does drip-rs’s compiler record for each local?',
    a: 'Its name (a `&\'src str` into the source), its scope depth (`Option<usize>`), and whether a closure captures it.',
  },
  'rl-option-depth': {
    q: 'What does `depth: None` mean for a drip-rs local, and what did TypeScript use instead?',
    a: 'Declared, but its initialiser is still being compiled, so it cannot be read yet. TypeScript used `depth: -1`.',
  },
  'rl-rev': {
    q: 'Why does a single-pass compiler that keeps its locals in a `Vec`, such as drip-rs’s, resolve a name by searching the locals from the end?',
    a: 'Later locals are more deeply nested, so the innermost variable with that name, the one that shadows the others, is found first.',
  },
  'rl-end-scope': {
    q: 'Why can’t drip-rs’s `end_scope` keep `let state = self.state();` and call `self.emit_op` in the loop?',
    a: '`state` is a mutable borrow into `self.functions`, still used after the call, and `emit_op` needs all of `self`: E0499. Read `is_captured`, pop, then emit.',
  },
  'pj-number': {
    q: 'In a Rust compiler that backpatches jumps, why does the caller keep the jump’s position as a `usize` rather than a `&mut u8` into the code?',
    a: 'A number borrows nothing, so the compiler can keep emitting the body. A `&mut` reference would lock the chunk until the patch.',
  },
  'pj-minus-two': {
    q: 'In drip-rs’s `patch_jump(offset)`, where `offset` is the jump’s first operand byte, why is the distance `len - offset - 2`?',
    a: 'A jump is measured from the end of its operand, and the operand is the two bytes starting at `offset`; the VM’s `ip` is at `offset + 2` when it adds.',
  },
  'pj-order': {
    q: 'Why does drip-rs’s `patch_jump` call `self.static_error(...)` before `let code = &mut self.chunk().code;`?',
    a: '`code` borrows `self` mutably through `chunk()`, and `static_error` needs `&mut self` too. Borrowing `code` first and reporting after is error E0499.',
  },
  'pj-big-endian': {
    q: 'In drip-rs, in which order are a jump’s two offset bytes stored, and why?',
    a: 'High byte first, because the VM’s `read_short` rebuilds the number as `(high << 8) | low`.',
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
  primes: {
    lang: 'drip-vm',
    title: 'for, while, break and continue',
    code: `# The primes below 20.
for n in 2..20 {
  let prime = true;
  let d = 2;
  while d * d <= n {
    if n % d == 0 {
      prime = false;
      break;
    }
    d += 1;
  }
  if !prime { continue; }
  print n;
}`,
  },
};

export const exercises = {
  endScope: {
    optional: true,
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
        why: '`depth?` returns `None` for an uninitialised local without reporting anything, so `let a = a;` would silently read a global `a`.',
      },
    ],
  },
  patchJump: {
    lang: 'rust',
    title: 'emit_jump and patch_jump',
    prompt: `Write the two halves of a forward jump for this small compiler, which is shaped like drip-rs's.

- \`emit_jump(op)\` emits \`op\` and two placeholder bytes \`0xff, 0xff\`, and returns the index of the first placeholder.
- \`patch_jump(at)\` makes that jump land on the next byte to be emitted. The distance counts from the end of the two-byte operand. Store it high byte first. If it doesn't fit in a \`u16\`, report \`TOO_FAR\` with \`self.static_error\` (and still write the bytes).

Mind the order: \`static_error\` needs all of \`self\`, so call it before you borrow \`self.code\` for writing.`,
    starter: `const JUMP: u8 = 1;
const JUMP_UNLESS: u8 = 2;
const POP: u8 = 3;

const TOO_FAR: &str =
    "too much code to jump over";

struct Compiler {
    code: Vec<u8>,
    errors: Vec<String>,
}

impl Compiler {
    fn new() -> Self {
        Compiler {
            code: Vec::new(),
            errors: Vec::new(),
        }
    }

    fn emit(&mut self, byte: u8) {
        self.code.push(byte);
    }

    fn static_error(
        &mut self,
        m: &str,
    ) {
        self.errors.push(m.into());
    }

    // Emit \`op\`, then a 2-byte hole.
    // Return where the hole is.
    fn emit_jump(&mut self, op: u8)
        -> usize {
        todo!()
    }

    // Make the jump whose operand is at
    // \`at\` land on the next byte.
    fn patch_jump(&mut self, at: usize)
    {
        todo!()
    }
}`,
    solution: `const JUMP: u8 = 1;
const JUMP_UNLESS: u8 = 2;
const POP: u8 = 3;

const TOO_FAR: &str =
    "too much code to jump over";

struct Compiler {
    code: Vec<u8>,
    errors: Vec<String>,
}

impl Compiler {
    fn new() -> Self {
        Compiler {
            code: Vec::new(),
            errors: Vec::new(),
        }
    }

    fn emit(&mut self, byte: u8) {
        self.code.push(byte);
    }

    fn static_error(
        &mut self,
        m: &str,
    ) {
        self.errors.push(m.into());
    }

    // Emit \`op\`, then a 2-byte hole.
    // Return where the hole is.
    fn emit_jump(&mut self, op: u8)
        -> usize {
        self.emit(op);
        self.emit(0xff);
        self.emit(0xff);
        self.code.len() - 2
    }

    // Make the jump whose operand is at
    // \`at\` land on the next byte.
    fn patch_jump(&mut self, at: usize)
    {
        let len = self.code.len();
        let jump = len - at - 2;
        if jump > u16::MAX as usize {
            self.static_error(TOO_FAR);
        }
        let code = &mut self.code;
        code[at] = (jump >> 8) as u8;
        code[at + 1] = jump as u8;
    }
}`,
    tests: `#[test]
fn emit_jump_leaves_a_hole() {
    let mut c = Compiler::new();
    c.emit(POP);
    let at = c.emit_jump(JUMP);
    assert_eq!(at, 2);
    assert_eq!(c.code,
        [POP, JUMP, 0xff, 0xff]);
}

#[test]
fn jumps_over_three_bytes() {
    let mut c = Compiler::new();
    let j = c.emit_jump(JUMP_UNLESS);
    c.emit(POP);
    c.emit(POP);
    c.emit(POP);
    c.patch_jump(j);
    assert_eq!(c.code[1..3], [0, 3]);
}

#[test]
fn a_jump_over_nothing_is_zero() {
    let mut c = Compiler::new();
    let j = c.emit_jump(JUMP);
    c.patch_jump(j);
    assert_eq!(c.code, [JUMP, 0, 0]);
}

#[test]
fn the_high_byte_comes_first() {
    let mut c = Compiler::new();
    let j = c.emit_jump(JUMP);
    for _ in 0..300 {
        c.emit(POP);
    }
    c.patch_jump(j);
    // 300 = 1 * 256 + 44
    assert_eq!(c.code[1..3], [1, 44]);
    assert!(c.errors.is_empty());
}

#[test]
fn two_holes_patched_in_turn() {
    // if c { A } else { B C }
    let mut c = Compiler::new();
    let then_j = c.emit_jump(JUMP_UNLESS);
    c.emit(POP);
    let else_j = c.emit_jump(JUMP);
    c.patch_jump(then_j);
    c.emit(POP);
    c.emit(POP);
    c.patch_jump(else_j);
    assert_eq!(c.code[1..3], [0, 4]);
    assert_eq!(c.code[5..7], [0, 2]);
}

#[test]
fn too_far_is_an_error() {
    let mut c = Compiler::new();
    let j = c.emit_jump(JUMP);
    for _ in 0..70_000 {
        c.emit(POP);
    }
    c.patch_jump(j);
    assert_eq!(c.errors, [TOO_FAR]);
}`,
    hints: [
      'Start with `emit_jump`: three `emit` calls, then return a position. After three bytes, where does the first placeholder sit?',
      'For `patch_jump`, picture the VM: after reading the jump it stands at `at + 2`, and it should arrive at `self.code.len()`. The distance is the difference.',
      'Check `jump > u16::MAX as usize` and report first. Then borrow `let code = &mut self.code;` and write `(jump >> 8) as u8` at `at` and `jump as u8` at `at + 1`.',
    ],
    walkthrough: `**How to think about it.** A forward jump is two promises kept at different times. When the jump is emitted, nobody knows how far it goes, so all \`emit_jump\` can do is reserve room and say where the room is. Later, when the code to be skipped has been emitted, \`patch_jump\` knows the target (the current end of the code) and fills the room in. The only thing that travels between the two calls is a \`usize\`, the address of the hole. Before writing any arithmetic, draw the bytes: \`[op][hi][lo][...skipped...]\`, and mark where the VM stands after reading the operand.

**\`emit_jump\`, line by line.**

- \`self.emit(op);\` writes the opcode.
- \`self.emit(0xff);\` and \`self.emit(0xff);\` reserve the two operand bytes. Their value does not matter (it will be overwritten), but \`0xff\` makes an unpatched jump easy to spot in a dump.
- \`self.code.len() - 2\` is the function's value: after three bytes, the first placeholder is two from the end. In the first test the code is \`[POP, JUMP, ff, ff]\`, length 4, so the answer is 2.

**\`patch_jump\`, line by line.**

- \`let len = self.code.len();\` is where the target is: the next byte to be emitted.
- \`let jump = len - at - 2;\` is the distance from \`at + 2\` (just past the operand, where the VM's \`ip\` is when it adds) to \`len\`. A jump over nothing is \`0\`; over three \`POP\`s it is \`3\`.
- \`if jump > u16::MAX as usize {\` asks whether the distance fits in two bytes. \`u16::MAX\` is 65,535; \`as usize\` converts it so both sides have the same type.
- \`self.static_error(TOO_FAR);\` records the problem. This line needs \`&mut self\`, which is why it comes *before* the borrow below.
- \`let code = &mut self.code;\` borrows the bytes once for the two writes.
- \`code[at] = (jump >> 8) as u8;\` shifts the high 8 bits down and stores them first. For 300, that is 1.
- \`code[at + 1] = jump as u8;\` stores the low 8 bits: \`as u8\` drops everything above them, so 300 becomes 44 (300 = 1 × 256 + 44).

**Two holes at once.** The \`if\`/\`else\` test opens a then-jump, emits one byte, opens an else-jump, patches the then-jump (distance 4: the \`POP\` and the three bytes of the else-jump), emits two bytes and patches the else-jump (distance 2). Each hole is its own number, so nothing about one affects the other.

**Common wrong attempts.**

- \`let jump = len - at;\` forgets that the VM measures from the end of the operand, so every jump lands two bytes too far, in the middle of some later instruction.
- Writing the low byte first: a jump of 3 is stored as \`[3, 0]\`, which the VM's \`read_short\` (high byte first) reads back as 768, so almost every distance comes out wrong.
- Taking \`let code = &mut self.code;\` first and calling \`self.static_error\` afterwards, while \`code\` is still to be used: rustc rejects it with E0499, two mutable borrows of \`self\` at once.`,
    wrong: [
      {
        code: `const JUMP: u8 = 1;
const JUMP_UNLESS: u8 = 2;
const POP: u8 = 3;

const TOO_FAR: &str =
    "too much code to jump over";

struct Compiler {
    code: Vec<u8>,
    errors: Vec<String>,
}

impl Compiler {
    fn new() -> Self {
        Compiler {
            code: Vec::new(),
            errors: Vec::new(),
        }
    }

    fn emit(&mut self, byte: u8) {
        self.code.push(byte);
    }

    fn static_error(
        &mut self,
        m: &str,
    ) {
        self.errors.push(m.into());
    }

    // Emit \`op\`, then a 2-byte hole.
    // Return where the hole is.
    fn emit_jump(&mut self, op: u8)
        -> usize {
        self.emit(op);
        self.emit(0xff);
        self.emit(0xff);
        self.code.len() - 2
    }

    // Make the jump whose operand is at
    // \`at\` land on the next byte.
    fn patch_jump(&mut self, at: usize)
    {
        let len = self.code.len();
        let jump = len - at;
        if jump > u16::MAX as usize {
            self.static_error(TOO_FAR);
        }
        let code = &mut self.code;
        code[at] = (jump >> 8) as u8;
        code[at + 1] = jump as u8;
    }
}`,
        why: 'It forgets the operand: `len - at` counts the two offset bytes themselves, so every jump lands two bytes too far.',
      },
      {
        code: `const JUMP: u8 = 1;
const JUMP_UNLESS: u8 = 2;
const POP: u8 = 3;

const TOO_FAR: &str =
    "too much code to jump over";

struct Compiler {
    code: Vec<u8>,
    errors: Vec<String>,
}

impl Compiler {
    fn new() -> Self {
        Compiler {
            code: Vec::new(),
            errors: Vec::new(),
        }
    }

    fn emit(&mut self, byte: u8) {
        self.code.push(byte);
    }

    fn static_error(
        &mut self,
        m: &str,
    ) {
        self.errors.push(m.into());
    }

    // Emit \`op\`, then a 2-byte hole.
    // Return where the hole is.
    fn emit_jump(&mut self, op: u8)
        -> usize {
        self.emit(op);
        self.emit(0xff);
        self.emit(0xff);
        self.code.len() - 2
    }

    // Make the jump whose operand is at
    // \`at\` land on the next byte.
    fn patch_jump(&mut self, at: usize)
    {
        let len = self.code.len();
        let jump = len - at - 2;
        if jump > u16::MAX as usize {
            self.static_error(TOO_FAR);
        }
        let code = &mut self.code;
        let hi = (jump >> 8) as u8;
        code[at] = jump as u8;
        code[at + 1] = hi;
    }
}`,
        why: 'It stores the low byte first, so the VM, which reads the high byte first, sees a different distance: 3 is read back as 768.',
      },
      {
        code: `const JUMP: u8 = 1;
const JUMP_UNLESS: u8 = 2;
const POP: u8 = 3;

const TOO_FAR: &str =
    "too much code to jump over";

struct Compiler {
    code: Vec<u8>,
    errors: Vec<String>,
}

impl Compiler {
    fn new() -> Self {
        Compiler {
            code: Vec::new(),
            errors: Vec::new(),
        }
    }

    fn emit(&mut self, byte: u8) {
        self.code.push(byte);
    }

    fn static_error(
        &mut self,
        m: &str,
    ) {
        self.errors.push(m.into());
    }

    // Emit \`op\`, then a 2-byte hole.
    // Return where the hole is.
    fn emit_jump(&mut self, op: u8)
        -> usize {
        self.emit(op);
        self.emit(0xff);
        self.emit(0xff);
        self.code.len() - 2
    }

    // Make the jump whose operand is at
    // \`at\` land on the next byte.
    fn patch_jump(&mut self, at: usize)
    {
        let code = &mut self.code;
        let jump = code.len() - at - 2;
        if jump > u16::MAX as usize {
            self.static_error(TOO_FAR);
        }
        code[at] = (jump >> 8) as u8;
        code[at + 1] = jump as u8;
    }
}`,
        why: 'It borrows `self.code` and then calls `self.static_error` while that borrow is still to be used: E0499. Report before borrowing.',
      },
    ],
  },
  emitLoop: {
    optional: true,
    lang: 'rust',
    title: 'emit_loop',
    prompt: `Write \`emit_loop(to)\`: emit \`LOOP\`, then a two-byte offset, high byte first, such that the VM jumps back to \`to\`.

The VM reads the offset with its \`ip\` just past the operand and subtracts it (the tests' \`lands_at\` does the same). If the offset doesn't fit in a \`u16\`, report \`TOO_BIG\` with \`static_error\`.`,
    starter: `const LOOP: u8 = 4;
const POP: u8 = 3;

const TOO_BIG: &str =
    "loop body too large";

struct Compiler {
    code: Vec<u8>,
    errors: Vec<String>,
}

impl Compiler {
    fn new() -> Self {
        Compiler {
            code: Vec::new(),
            errors: Vec::new(),
        }
    }

    fn emit(&mut self, byte: u8) {
        self.code.push(byte);
    }

    fn static_error(
        &mut self,
        m: &str,
    ) {
        self.errors.push(m.into());
    }

    // Emit LOOP and a 2-byte offset
    // that takes the VM back to \`to\`.
    fn emit_loop(&mut self, to: usize)
    {
        todo!()
    }
}`,
    solution: `const LOOP: u8 = 4;
const POP: u8 = 3;

const TOO_BIG: &str =
    "loop body too large";

struct Compiler {
    code: Vec<u8>,
    errors: Vec<String>,
}

impl Compiler {
    fn new() -> Self {
        Compiler {
            code: Vec::new(),
            errors: Vec::new(),
        }
    }

    fn emit(&mut self, byte: u8) {
        self.code.push(byte);
    }

    fn static_error(
        &mut self,
        m: &str,
    ) {
        self.errors.push(m.into());
    }

    // Emit LOOP and a 2-byte offset
    // that takes the VM back to \`to\`.
    fn emit_loop(&mut self, to: usize)
    {
        self.emit(LOOP);
        let len = self.code.len();
        // +2: the operand still to come
        let offset = len - to + 2;
        if offset > u16::MAX as usize {
            self.static_error(TOO_BIG);
        }
        self.emit((offset >> 8) as u8);
        self.emit(offset as u8);
    }
}`,
    tests: `// What the VM does: read the offset, with
// ip just past it, and step back.
fn lands_at(code: &[u8], at: usize)
    -> usize {
    let hi = code[at + 1] as usize;
    let lo = code[at + 2] as usize;
    at + 3 - ((hi << 8) | lo)
}

#[test]
fn writes_loop_then_the_offset() {
    let mut c = Compiler::new();
    c.emit(POP);
    c.emit_loop(0);
    // len 2 after LOOP: 2 - 0 + 2 = 4
    assert_eq!(c.code, [POP, LOOP, 0, 4]);
}

#[test]
fn lands_on_the_loop_start() {
    let mut c = Compiler::new();
    c.emit(POP);
    c.emit(POP); // the loop starts here
    for _ in 0..10 {
        c.emit(POP);
    }
    let at = c.code.len();
    c.emit_loop(2);
    assert_eq!(lands_at(&c.code, at), 2);
}

#[test]
fn a_long_body_uses_the_high_byte() {
    let mut c = Compiler::new();
    for _ in 0..1000 {
        c.emit(POP);
    }
    c.emit_loop(0);
    assert_eq!(lands_at(&c.code, 1000), 0);
    assert!(c.errors.is_empty());
}

#[test]
fn too_long_is_an_error() {
    let mut c = Compiler::new();
    for _ in 0..70_000 {
        c.emit(POP);
    }
    c.emit_loop(0);
    assert_eq!(c.errors, [TOO_BIG]);
}`,
    hints: [
      'A backward jump knows its target already, so there is no hole: emit everything now. What comes first, the opcode or the measuring?',
      'Emit `LOOP`, then measure `self.code.len()`. The VM will subtract from two bytes further on, after the operand.',
      'The offset is `len - to + 2`. Report the error if it is too big, then emit `(offset >> 8) as u8` and `offset as u8`.',
    ],
    walkthrough: `**How to think about it.** A loop's backward jump is the easy case of backpatching: its target, the loop's start, was compiled before the jump, so the distance can be written at once. The only care needed is to measure from the right place, which is where the VM's \`ip\` will be when it subtracts: just past the two operand bytes.

**The solution, line by line.**

- \`self.emit(LOOP);\` writes the opcode first, so that the length measured next is the position of the first operand byte.
- \`let len = self.code.len();\` is that position.
- \`let offset = len - to + 2;\` adds the two operand bytes still to come: the VM will stand at \`len + 2\` and must arrive at \`to\`, so it subtracts \`(len + 2) - to\`. In the chapter's while loop, \`loop\` is at 31, \`len\` is 32, and \`32 - 6 + 2 = 28\` takes \`ip\` from 34 back to 6.
- \`if offset > u16::MAX as usize {\` and \`self.static_error(TOO_BIG);\` report a loop body too long for two bytes.
- \`self.emit((offset >> 8) as u8);\` and \`self.emit(offset as u8);\` write the offset high byte first, as \`read_short\` expects.

There is no borrow trouble here: \`emit\` and \`static_error\` are separate calls, and nothing is held between them.

**Common wrong attempts.**

- Leaving out \`+ 2\`: the offset is measured from before the operand, but the VM subtracts from after it, so the loop lands two bytes past its start, in the middle of an instruction.
- Measuring \`len\` before emitting \`LOOP\`: the offset is one short and the VM lands one byte late.`,
    wrong: [
      {
        code: `const LOOP: u8 = 4;
const POP: u8 = 3;

const TOO_BIG: &str =
    "loop body too large";

struct Compiler {
    code: Vec<u8>,
    errors: Vec<String>,
}

impl Compiler {
    fn new() -> Self {
        Compiler {
            code: Vec::new(),
            errors: Vec::new(),
        }
    }

    fn emit(&mut self, byte: u8) {
        self.code.push(byte);
    }

    fn static_error(
        &mut self,
        m: &str,
    ) {
        self.errors.push(m.into());
    }

    // Emit LOOP and a 2-byte offset
    // that takes the VM back to \`to\`.
    fn emit_loop(&mut self, to: usize)
    {
        self.emit(LOOP);
        let len = self.code.len();
        let offset = len - to;
        if offset > u16::MAX as usize {
            self.static_error(TOO_BIG);
        }
        self.emit((offset >> 8) as u8);
        self.emit(offset as u8);
    }
}`,
        why: 'Without `+ 2`, the offset is measured from before the operand, but the VM subtracts from after it, so the loop lands two bytes past its start.',
      },
      {
        code: `const LOOP: u8 = 4;
const POP: u8 = 3;

const TOO_BIG: &str =
    "loop body too large";

struct Compiler {
    code: Vec<u8>,
    errors: Vec<String>,
}

impl Compiler {
    fn new() -> Self {
        Compiler {
            code: Vec::new(),
            errors: Vec::new(),
        }
    }

    fn emit(&mut self, byte: u8) {
        self.code.push(byte);
    }

    fn static_error(
        &mut self,
        m: &str,
    ) {
        self.errors.push(m.into());
    }

    // Emit LOOP and a 2-byte offset
    // that takes the VM back to \`to\`.
    fn emit_loop(&mut self, to: usize)
    {
        let len = self.code.len();
        self.emit(LOOP);
        let offset = len - to + 2;
        if offset > u16::MAX as usize {
            self.static_error(TOO_BIG);
        }
        self.emit((offset >> 8) as u8);
        self.emit(offset as u8);
    }
}`,
        why: 'It measures the length before emitting `LOOP`, so the offset is one short and the VM lands one byte late.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'What does `depth: None` on a drip-rs `Local` mean?',
    options: [
      {
        t: 'The local is a global',
        why: 'Globals are never in the locals `Vec`.',
      },
      {
        t: 'The local is declared, but its initialiser is still being compiled',
        correct: true,
        why: 'Reading it now is the error `cannot read \'a\' in its own initialiser`.',
      },
      {
        t: 'The local has been captured by a closure',
        why: 'That is `is_captured`.',
      },
      {
        t: 'The local is at scope depth 0',
        why: 'Depth 0 would be `Some(0)`.',
      },
    ],
  },
  {
    q: 'Why does this fail, inside a block: `let a = 1; { let a = a + 1; }`?',
    options: [
      {
        t: 'Locals cannot shadow other locals',
        why: 'They can, in a nested block; the trouble is reading the inner one.',
      },
      {
        t: 'The inner `a` is declared before its initialiser is compiled, so `a + 1` finds the unfinished inner `a`',
        correct: true,
        why: '`resolve_local` searches from the end and finds the inner `a` with depth `None`.',
      },
      {
        t: '`a + 1` is not allowed in a `let`',
        why: 'Any expression is; `let b = a + 1;` works.',
      },
    ],
  },
  {
    q: 'A `jump.unless` operand is at offset 14, and the code is 34 bytes long when it is patched. What distance is written?',
    options: [
      {
        t: '20',
        why: '34 − 14 counts the operand’s own two bytes.',
      },
      {
        t: '34',
        why: 'Jumps are relative to where the VM stands, not absolute addresses.',
      },
      {
        t: '21',
        why: 'That would be measured from the opcode at 13.',
      },
      {
        t: '18',
        correct: true,
        why: '34 − 14 − 2. From 16, just past the operand, 18 bytes on is 34.',
      },
    ],
  },
  {
    q: `Why does this version of \`patch_jump\` fail to compile?
\`\`\`rust
let code = &mut self.chunk().code;
let jump = code.len() - offset - 2;
if jump > u16::MAX as usize {
    self.static_error(self.previous,
        "too much code to jump over");
}
code[offset] = (jump >> 8) as u8;
\`\`\``,
    options: [
      {
        t: '`code` mutably borrows `self` and is used after `static_error`, which needs `&mut self` too',
        correct: true,
        why: 'Error E0499: two mutable borrows of `self` alive at once. Report before taking `code`.',
      },
      {
        t: '`u16::MAX` cannot be compared with a `usize`',
        why: '`as usize` converts it, so the comparison is between two `usize`s.',
      },
      {
        t: '`as u8` is not allowed on a `usize`',
        why: 'It is allowed: it keeps the low 8 bits.',
      },
      {
        t: 'A `Vec<u8>` cannot be indexed with a `usize`',
        why: '`usize` is exactly the type a `Vec` is indexed with.',
      },
    ],
  },
];
