// Chapter 337 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'md-what': {
    q: 'What are the two steps of each turn of drip-rs’s dispatch loop, after reading a byte?',
    a: 'Decode the byte into an `OpCode` with `from_byte`, then `match` on the opcode and run its arm.',
  },
  'md-exhaustive': {
    q: 'You add a variant to `OpCode` but forget its arm in `run`. What happens?',
    a: 'The VM doesn’t compile: E0004, non-exhaustive patterns. A match over an enum must cover every variant.',
  },
  'md-decode': {
    q: 'With an exhaustive match, where can an unknown opcode still slip in?',
    a: 'Only when decoding: `OpCode::from_byte` returns `None` for a byte no opcode has. drip-rs `expect`s it, trusting its compiler.',
  },
  'md-result': {
    q: 'The TypeScript VM throws on a runtime error. What does drip-rs’s `run` do instead?',
    a: 'It returns `Err(RuntimeError)`. Arms that can fail use `?`, so the error leaves `run` at once.',
  },
  'md-borrow': {
    q: 'Why can’t `run` start with `let code = &self.code;` and keep using it?',
    a: '`self.push` needs `&mut self`, which would overlap the shared borrow of `self.code` (E0502).',
  },
  'md-rc': {
    q: 'Why is the running chunk an `Rc<Chunk>`, not a `&Chunk`?',
    a: 'Its function in the heap owns it too. A reference would keep the heap borrowed, and the arena could move; an `Rc` clone is one more owner, and the frozen chunk needs no `RefCell`.',
  },
  'md-sync': {
    q: 'drip-rs keeps `ip`, `chunk` and `slots` in the `Vm` as registers. When must they be synced with the frame?',
    a: 'On a call (save the caller’s `ip`, load the callee’s state) and on a return (load the caller’s state back).',
  },
  'md-measure': {
    q: 'Why does the cost of reaching the next byte matter so much in a bytecode VM (the README credits the registers with about 1.4× on `fib`)?',
    a: 'Every instruction starts by reading a byte, so that cost is paid on every turn of the loop.',
  },
};

export const examples = {
  registers: {
    lang: 'rust',
    title: 'Registers instead of a borrow',
    code: `// A toy VM in drip-rs's style: the
// running code is an Rc in a field,
// and each read borrows self only
// for one expression.
use std::rc::Rc;

struct Vm {
    code: Rc<Vec<u8>>,
    ip: usize,
    stack: Vec<f64>,
}

impl Vm {
    fn read_byte(&mut self) -> u8 {
        let b = self.code[self.ip];
        self.ip += 1;
        b
    }

    fn push(&mut self, v: f64) {
        self.stack.push(v);
    }

    fn run(&mut self) {
        let n = self.code.len();
        while self.ip < n {
            let b = self.read_byte();
            self.push(b as f64);
        }
    }
}

fn main() {
    let code = Rc::new(vec![1, 2, 3]);
    let mut vm = Vm {
        code: Rc::clone(&code),
        ip: 0,
        stack: Vec::new(),
    };
    vm.run();
    println!("{:?}", vm.stack);
    let n = Rc::strong_count(&code);
    println!("owners of the code: {n}");
}`,
  },
};

export const exercises = {
  tinyVm: {
    lang: 'rust',
    title: 'A tiny stack VM',
    prompt: `Write the dispatch loop of a tiny stack VM. Its instructions are an enum, \`Op\`: \`Num(n)\` pushes the number \`n\`; \`Add\`, \`Sub\` and \`Mul\` pop two numbers and push the result; \`Neg\` negates the top; \`Ret\` stops.

- \`step\` runs **one** instruction: read \`self.code[self.ip]\`, move \`ip\` on, and \`match\`. It returns \`false\` after \`Ret\` and \`true\` otherwise.
- \`run\` calls \`step\` until it returns \`false\`, then pops and returns the result.

For \`Sub\`, the right operand is on top: \`[Num(5), Num(2), Sub]\` is 5 − 2.`,
    starter: `#[derive(Clone, Copy, Debug)]
enum Op {
    Num(f64),
    Add,
    Sub,
    Mul,
    Neg,
    Ret,
}

struct Vm {
    code: Vec<Op>,
    ip: usize,
    stack: Vec<f64>,
}

impl Vm {
    fn new(code: Vec<Op>) -> Vm {
        let stack = Vec::new();
        Vm { code, ip: 0, stack }
    }

    fn push(&mut self, v: f64) {
        self.stack.push(v);
    }

    fn pop(&mut self) -> f64 {
        self.stack.pop().expect("empty")
    }

    fn step(&mut self) -> bool {
        todo!()
    }

    fn run(&mut self) -> f64 {
        todo!()
    }
}`,
    solution: `#[derive(Clone, Copy, Debug)]
enum Op {
    Num(f64),
    Add,
    Sub,
    Mul,
    Neg,
    Ret,
}

struct Vm {
    code: Vec<Op>,
    ip: usize,
    stack: Vec<f64>,
}

impl Vm {
    fn new(code: Vec<Op>) -> Vm {
        let stack = Vec::new();
        Vm { code, ip: 0, stack }
    }

    fn push(&mut self, v: f64) {
        self.stack.push(v);
    }

    fn pop(&mut self) -> f64 {
        self.stack.pop().expect("empty")
    }

    fn step(&mut self) -> bool {
        let op = self.code[self.ip];
        self.ip += 1;
        match op {
            Op::Num(n) => self.push(n),
            Op::Add => {
                let b = self.pop();
                let a = self.pop();
                self.push(a + b);
            }
            Op::Sub => {
                let b = self.pop();
                let a = self.pop();
                self.push(a - b);
            }
            Op::Mul => {
                let b = self.pop();
                let a = self.pop();
                self.push(a * b);
            }
            Op::Neg => {
                let n = self.pop();
                self.push(-n);
            }
            Op::Ret => return false,
        }
        true
    }

    fn run(&mut self) -> f64 {
        while self.step() {}
        self.pop()
    }
}`,
    tests: `use Op::*;

fn eval(code: Vec<Op>) -> f64 {
    Vm::new(code).run()
}

#[test]
fn a_number_comes_back() {
    assert_eq!(eval(vec![Num(7.0), Ret]), 7.0);
}

#[test]
fn add_and_multiply() {
    // 1 + 2 * 3, compiled
    let code = vec![Num(1.0), Num(2.0),
        Num(3.0), Mul, Add, Ret];
    assert_eq!(eval(code), 7.0);
}

#[test]
fn subtract_keeps_the_order() {
    let code =
        vec![Num(5.0), Num(2.0), Sub, Ret];
    assert_eq!(eval(code), 3.0);
}

#[test]
fn negate_the_top() {
    let code = vec![Num(4.0), Neg, Ret];
    assert_eq!(eval(code), -4.0);
}

#[test]
fn ret_returns_the_top() {
    let code = vec![Num(1.0), Num(2.0), Ret];
    assert_eq!(eval(code), 2.0);
}

#[test]
fn step_moves_ip_one_op() {
    let mut vm = Vm::new(vec![Num(1.0), Ret]);
    assert!(vm.step());
    assert_eq!(vm.ip, 1);
    assert!(!vm.step());
}`,
    hints: [
      '`Op` is `Copy`, so `let op = self.code[self.ip];` copies the instruction out, and the borrow of `self.code` ends right there.',
      'Then `self.ip += 1;` and `match op { ... }` with one arm per variant. For a binary operator, pop `b` (the top) first, then `a`.',
      '`Op::Ret => return false,` ends the step early. After the match, return `true`. `run` is `while self.step() {}` and then `self.pop()`.',
    ],
    walkthrough: `**How to think about it.** Every bytecode VM is the same three moves, repeated: fetch the instruction at \`ip\`, move \`ip\` on, and do what the instruction says. Write those three moves as \`step\`, and \`run\` is only "step until told to stop". The one Rust-specific question is borrowing: \`step\` must read \`self.code\` and then call \`self.push\`, which needs \`&mut self\`, and the trick from this chapter is to copy the instruction out first so that nothing stays borrowed.

**The solution, line by line.**

- \`let op = self.code[self.ip];\` fetches the instruction. Because \`Op\` is \`Copy\`, \`op\` is a copy, and the borrow of \`self.code\` ends with this line.
- \`self.ip += 1;\` moves on *before* running the instruction, as drip-rs's \`read_byte\` does: the instruction pointer always points at the next instruction.
- \`match op {\` has one arm per variant and no \`_\` arm, so if you forget one, rustc names it (E0004).
- \`Op::Num(n) => self.push(n),\` pushes the number the instruction carries.
- In \`Op::Add\`, \`let b = self.pop(); let a = self.pop(); self.push(a + b);\`: the left operand was pushed first, so it is *under* the right one; pop \`b\` first. \`Sub\` and \`Mul\` are the same with \`-\` and \`*\`.
- \`Op::Neg => { let n = self.pop(); self.push(-n); }\` replaces the top with its negation.
- \`Op::Ret => return false,\` ends the step and tells \`run\` to stop.
- \`true\` after the \`match\` says "keep going".
- \`fn run(&mut self) -> f64 { while self.step() {} self.pop() }\` loops until \`Ret\`, then pops the answer. In drip-rs, \`Return\` also pops the frame and, with no caller left, returns \`Ok(())\` from \`run\`.

**Common wrong attempts.**

- Popping \`a\` before \`b\`: \`5 - 2\` comes out as \`2 - 5\`. Addition and multiplication do not care, which is why this bug hides until a test subtracts.
- Adding \`_ => {}\` to make the compiler stop complaining: the exhaustiveness check is switched off, and \`Neg\` quietly does nothing, which is the TypeScript \`default\` problem again.`,
    wrong: [
      {
        code: `#[derive(Clone, Copy, Debug)]
enum Op {
    Num(f64),
    Add,
    Sub,
    Mul,
    Neg,
    Ret,
}

struct Vm {
    code: Vec<Op>,
    ip: usize,
    stack: Vec<f64>,
}

impl Vm {
    fn new(code: Vec<Op>) -> Vm {
        let stack = Vec::new();
        Vm { code, ip: 0, stack }
    }

    fn push(&mut self, v: f64) {
        self.stack.push(v);
    }

    fn pop(&mut self) -> f64 {
        self.stack.pop().expect("empty")
    }

    fn step(&mut self) -> bool {
        let op = self.code[self.ip];
        self.ip += 1;
        match op {
            Op::Num(n) => self.push(n),
            Op::Add => {
                let a = self.pop();
                let b = self.pop();
                self.push(a + b);
            }
            Op::Sub => {
                let a = self.pop();
                let b = self.pop();
                self.push(a - b);
            }
            Op::Mul => {
                let a = self.pop();
                let b = self.pop();
                self.push(a * b);
            }
            Op::Neg => {
                let n = self.pop();
                self.push(-n);
            }
            Op::Ret => return false,
        }
        true
    }

    fn run(&mut self) -> f64 {
        while self.step() {}
        self.pop()
    }
}`,
        why: 'The first pop is the *right* operand. Popping into `a` first makes `5 - 2` come out as `2 - 5`. Add and multiply still pass, which is why this bug hides.',
      },
      {
        code: `#[derive(Clone, Copy, Debug)]
enum Op {
    Num(f64),
    Add,
    Sub,
    Mul,
    Neg,
    Ret,
}

struct Vm {
    code: Vec<Op>,
    ip: usize,
    stack: Vec<f64>,
}

impl Vm {
    fn new(code: Vec<Op>) -> Vm {
        let stack = Vec::new();
        Vm { code, ip: 0, stack }
    }

    fn push(&mut self, v: f64) {
        self.stack.push(v);
    }

    fn pop(&mut self) -> f64 {
        self.stack.pop().expect("empty")
    }

    fn step(&mut self) -> bool {
        let op = self.code[self.ip];
        self.ip += 1;
        match op {
            Op::Num(n) => self.push(n),
            Op::Add => {
                let b = self.pop();
                let a = self.pop();
                self.push(a + b);
            }
            Op::Sub => {
                let b = self.pop();
                let a = self.pop();
                self.push(a - b);
            }
            Op::Mul => {
                let b = self.pop();
                let a = self.pop();
                self.push(a * b);
            }
            Op::Ret => return false,
            _ => {}
        }
        true
    }

    fn run(&mut self) -> f64 {
        while self.step() {}
        self.pop()
    }
}`,
        why: 'The `_ => {}` arm silences the exhaustiveness check, so `Neg` quietly does nothing. That is the TypeScript `default` problem again. Leave `_` out and rustc names every case you missed.',
      },
    ],
  },
  checkedVm: {
    optional: true,
    lang: 'rust',
    title: 'Errors as values',
    prompt: `Now values can be numbers or booleans, and an instruction can fail. Write:

- \`add(a, b)\`: \`Ok\` of the sum if both are numbers, else \`Err\` of Drip's message, \`cannot add a number and a boolean\` (built with the given \`describe\`, left operand first).
- \`neg(v)\`: \`Ok\` of the negated number, else \`Err\` of \`cannot negate a boolean\`.
- \`run(code)\`: run the instructions in order. \`Push(v)\` pushes \`v\`; \`Add\` and \`Neg\` use your functions **with \`?\`**, so an error stops the program; and \`Ret\` returns \`Ok\` of the top value.

The messages are the ones both Drip VMs print.`,
    starter: `#[derive(Clone, Copy, Debug, PartialEq)]
enum Value {
    Num(f64),
    Bool(bool),
}

#[derive(Clone, Copy)]
enum Op {
    Push(Value),
    Add,
    Neg,
    Ret,
}

use Value::*;

/// How error messages name a value.
fn describe(v: Value) -> &'static str {
    match v {
        Num(_) => "a number",
        Bool(_) => "a boolean",
    }
}

fn pop(s: &mut Vec<Value>) -> Value {
    s.pop().expect("stack underflow")
}

fn add(a: Value, b: Value)
    -> Result<Value, String> {
    todo!()
}

fn neg(v: Value)
    -> Result<Value, String> {
    todo!()
}

fn run(code: &[Op])
    -> Result<Value, String> {
    todo!()
}`,
    solution: `#[derive(Clone, Copy, Debug, PartialEq)]
enum Value {
    Num(f64),
    Bool(bool),
}

#[derive(Clone, Copy)]
enum Op {
    Push(Value),
    Add,
    Neg,
    Ret,
}

use Value::*;

/// How error messages name a value.
fn describe(v: Value) -> &'static str {
    match v {
        Num(_) => "a number",
        Bool(_) => "a boolean",
    }
}

fn pop(s: &mut Vec<Value>) -> Value {
    s.pop().expect("stack underflow")
}

fn add(a: Value, b: Value)
    -> Result<Value, String> {
    match (a, b) {
        (Num(x), Num(y)) => {
            Ok(Num(x + y))
        }
        _ => Err(format!(
            "cannot add {} and {}",
            describe(a), describe(b))),
    }
}

fn neg(v: Value)
    -> Result<Value, String> {
    match v {
        Num(x) => Ok(Num(-x)),
        _ => Err(format!(
            "cannot negate {}",
            describe(v))),
    }
}

fn run(code: &[Op])
    -> Result<Value, String> {
    let mut s = Vec::new();
    for &op in code {
        match op {
            Op::Push(v) => s.push(v),
            Op::Add => {
                let b = pop(&mut s);
                let a = pop(&mut s);
                s.push(add(a, b)?);
            }
            Op::Neg => {
                let v = pop(&mut s);
                s.push(neg(v)?);
            }
            Op::Ret => {
                return Ok(pop(&mut s));
            }
        }
    }
    Err("no Ret".to_string())
}`,
    tests: `#[test]
fn numbers_add() {
    let code = [Op::Push(Num(1.0)),
        Op::Push(Num(2.0)), Op::Add, Op::Ret];
    assert_eq!(run(&code), Ok(Num(3.0)));
}

#[test]
fn adding_a_bool_is_an_error() {
    let code = [Op::Push(Num(1.0)),
        Op::Push(Bool(true)), Op::Add, Op::Ret];
    assert_eq!(run(&code),
        Err("cannot add a number and a boolean".into()));
}

#[test]
fn negating_a_bool_is_an_error() {
    let code = [Op::Push(Bool(false)),
        Op::Neg, Op::Ret];
    assert_eq!(run(&code),
        Err("cannot negate a boolean".into()));
}

#[test]
fn an_error_stops_the_program() {
    // The Neg after the failing Add never runs.
    let code = [Op::Push(Bool(true)),
        Op::Push(Num(1.0)), Op::Add, Op::Neg,
        Op::Ret];
    assert_eq!(run(&code),
        Err("cannot add a boolean and a number".into()));
}

#[test]
fn negate_a_number() {
    let code = [Op::Push(Num(2.0)), Op::Neg,
        Op::Ret];
    assert_eq!(run(&code), Ok(Num(-2.0)));
}`,
    hints: [
      'Begin with `neg`, the one-value case: `match v { Num(x) => Ok(Num(-x)), _ => Err(...) }`, with the message built by `format!("cannot negate {}", describe(v))`.',
      'In `add`, match on the pair: `match (a, b) { (Num(x), Num(y)) => ..., _ => ... }`. The message names `a` first, because `a` is the left operand.',
      'In `run`, loop with `for &op in code` and match each op. For `Add`, pop `b` (the top) before `a`; then `s.push(add(a, b)?);` either pushes the sum or returns the error from `run`. For `Ret`, return `Ok(pop(&mut s))`; after the loop, return some `Err`, since a program without `Ret` is broken.',
    ],
    walkthrough: `**How to think about it.** This is drip-rs's error handling in miniature. Each instruction that can fail becomes a function returning \`Result\`, and the loop uses \`?\`, so the first error ends the whole run, exactly as \`pop_numbers("-")?\` ends \`Vm::run\`. The messages must match Drip's word for word, which is why \`describe\` is given: it is the cut-down version of drip-rs's own \`describe\`.

**The solution, line by line.**

- \`match (a, b) {\` in \`add\` checks both operands in one pattern, the same idea as \`pop_numbers\`'s \`let (Value::Number(a), Value::Number(b)) = ... else\`.
- \`(Num(x), Num(y)) => { Ok(Num(x + y)) }\` is the one good case.
- \`_ => Err(format!("cannot add {} and {}", describe(a), describe(b))),\` covers every other pair, naming the left operand first, as Drip does.
- \`neg\` has the same shape for one value: \`Num(x) => Ok(Num(-x))\`, otherwise \`cannot negate a boolean\`.
- \`let mut s = Vec::new();\` is the stack; \`for &op in code\` copies each \`Op\` out (it is \`Copy\`).
- \`Op::Push(v) => s.push(v),\` pushes a constant.
- In \`Op::Add\`, \`let b = pop(&mut s); let a = pop(&mut s);\` takes the right operand off first, because it was pushed last.
- \`s.push(add(a, b)?);\`: if \`add\` returns \`Ok(v)\`, \`?\` unwraps it and \`v\` is pushed; if it returns \`Err(e)\`, \`?\` returns \`Err(e)\` from \`run\` immediately, and no later instruction runs.
- \`Op::Neg\` is the same with one value, and \`Op::Ret => { return Ok(pop(&mut s)); }\` hands back the answer.
- \`Err("no Ret".to_string())\` after the loop reports a program that ran off its end.

**Common wrong attempts.**

- \`if let Ok(v) = add(a, b) { s.push(v); }\`: this quietly throws the error away, so a bad \`Add\` shrinks the stack and the program carries on. Use \`?\`.
- Naming the operands the wrong way round: \`true + 1\` must say \`cannot add a boolean and a number\`, and the last test checks it.

In drip-rs the error then reaches \`interpret\`, which clears the stack and frames and reports exit code 70.`,
    wrong: [
      {
        code: `#[derive(Clone, Copy, Debug, PartialEq)]
enum Value {
    Num(f64),
    Bool(bool),
}

#[derive(Clone, Copy)]
enum Op {
    Push(Value),
    Add,
    Neg,
    Ret,
}

use Value::*;

/// How error messages name a value.
fn describe(v: Value) -> &'static str {
    match v {
        Num(_) => "a number",
        Bool(_) => "a boolean",
    }
}

fn pop(s: &mut Vec<Value>) -> Value {
    s.pop().expect("stack underflow")
}

fn add(a: Value, b: Value)
    -> Result<Value, String> {
    match (a, b) {
        (Num(x), Num(y)) => {
            Ok(Num(x + y))
        }
        _ => Err(format!(
            "cannot add {} and {}",
            describe(a), describe(b))),
    }
}

fn neg(v: Value)
    -> Result<Value, String> {
    match v {
        Num(x) => Ok(Num(-x)),
        _ => Err(format!(
            "cannot negate {}",
            describe(v))),
    }
}

fn run(code: &[Op])
    -> Result<Value, String> {
    let mut s = Vec::new();
    for &op in code {
        match op {
            Op::Push(v) => s.push(v),
            Op::Add => {
                let b = pop(&mut s);
                let a = pop(&mut s);
                let r = add(a, b);
                if let Ok(v) = r {
                    s.push(v);
                }
            }
            Op::Neg => {
                let v = pop(&mut s);
                s.push(neg(v)?);
            }
            Op::Ret => {
                return Ok(pop(&mut s));
            }
        }
    }
    Err("no Ret".to_string())
}`,
        why: '`if let Ok(v)` throws the error away, so a bad `Add` just shrinks the stack and the program carries on. Use `?` to stop.',
      },
      {
        code: `#[derive(Clone, Copy, Debug, PartialEq)]
enum Value {
    Num(f64),
    Bool(bool),
}

#[derive(Clone, Copy)]
enum Op {
    Push(Value),
    Add,
    Neg,
    Ret,
}

use Value::*;

/// How error messages name a value.
fn describe(v: Value) -> &'static str {
    match v {
        Num(_) => "a number",
        Bool(_) => "a boolean",
    }
}

fn pop(s: &mut Vec<Value>) -> Value {
    s.pop().expect("stack underflow")
}

fn add(a: Value, b: Value)
    -> Result<Value, String> {
    match (a, b) {
        (Num(x), Num(y)) => {
            Ok(Num(x + y))
        }
        _ => Err(format!(
            "cannot add {} and {}",
            describe(b), describe(a))),
    }
}

fn neg(v: Value)
    -> Result<Value, String> {
    match v {
        Num(x) => Ok(Num(-x)),
        _ => Err(format!(
            "cannot negate {}",
            describe(v))),
    }
}

fn run(code: &[Op])
    -> Result<Value, String> {
    let mut s = Vec::new();
    for &op in code {
        match op {
            Op::Push(v) => s.push(v),
            Op::Add => {
                let b = pop(&mut s);
                let a = pop(&mut s);
                s.push(add(a, b)?);
            }
            Op::Neg => {
                let v = pop(&mut s);
                s.push(neg(v)?);
            }
            Op::Ret => {
                return Ok(pop(&mut s));
            }
        }
    }
    Err("no Ret".to_string())
}`,
        why: 'The message names the operands in the wrong order: `true + 1` must report `cannot add a boolean and a number`, left operand first.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'What replaces the TypeScript switch’s `default: throw` case in drip-rs?',
    options: [
      { t: 'A `_ =>` arm that panics', why: 'drip-rs has no `_` arm in `run`: it would turn off the exhaustiveness check.' },
      { t: 'Nothing: the match covers all 53 variants, and only `from_byte` can meet an unknown byte', correct: true, why: 'The compiler checks every opcode has an arm. Decoding returns `None` for a bad byte, and drip-rs `expect`s a valid one.' },
      { t: 'A runtime check before every instruction', why: 'There’s no extra check: decoding is the only place a bad byte shows up.' },
      { t: 'The disassembler', why: 'The disassembler prints bytecode; it doesn’t run it.' },
    ],
  },
  {
    q: `Why does this fail to compile?
\`\`\`rust
let code = &self.code;
for &b in code {
    self.push(b as f64);
}
\`\`\``,
    options: [
      { t: '`b as f64` is not allowed for a `u8`', why: 'Casting `u8` to `f64` is fine.' },
      { t: '`code` was moved out of `self`', why: '`&self.code` borrows; nothing moves.' },
      { t: '`self.push` needs `&mut self` while `code` still borrows `self.code`', correct: true, why: 'E0502: a shared borrow of the field and a mutable borrow of the whole overlap.' },
      { t: '`for` can’t loop over a reference', why: 'Looping over `&Vec<u8>` is normal; it yields `&u8`.' },
    ],
  },
  {
    q: 'Why does drip-rs keep the running chunk as an `Rc<Chunk>` field of the `Vm`?',
    options: [
      { t: 'So the VM can change the bytecode while it runs', why: 'Chunks are frozen once compiled. That’s why no `RefCell` is needed.' },
      { t: 'Because `Rc` makes reading bytes faster than a `Vec`', why: 'The bytes are still in a `Vec<u8>` inside the chunk. The `Rc` is about ownership.' },
      { t: 'To let the garbage collector free chunks', why: 'The `Rc` frees a chunk when its last owner goes, without the collector.' },
      { t: 'The VM needs its own owner of the chunk, so it doesn’t keep the heap borrowed', correct: true, why: 'The function in the heap owns the chunk too. A second owner leaves the heap free to change.' },
    ],
  },
  {
    q: 'In drip-rs, what does `call` do with the registers?',
    options: [
      { t: 'Saves the caller’s `ip` into its frame, then loads the callee’s `ip`, chunk and slots', correct: true, why: 'The registers always describe the running frame. `pop_frame` loads the caller’s back on return.' },
      { t: 'Nothing: the registers are recomputed on every byte', why: 'Then they wouldn’t save anything. They’re updated only on calls and returns.' },
      { t: 'Clears the stack', why: 'The arguments stay on the stack as the callee’s first slots.' },
      { t: 'Copies the callee’s bytecode into the `Vm`', why: 'It clones the `Rc`, which copies a pointer, not the bytecode.' },
    ],
  },
  {
    q: 'The `Sub` arm calls `self.pop_numbers("-")?` and the operands are a string and a number. What happens?',
    options: [
      { t: 'The VM panics', why: 'Nothing panics. The error is an ordinary value.' },
      { t: 'The message goes to stderr, and `?` returns `Err(RuntimeError)` from `run`', correct: true, why: '`runtime_error` writes the message and stack trace; `?` makes the error leave `run` at once.' },
      { t: 'The string is converted to a number', why: 'Drip doesn’t convert; it reports `cannot use \'-\' on a string and a number`.' },
      { t: 'The instruction is skipped and the loop continues', why: '`?` returns from `run`, so the loop stops.' },
    ],
  },
];
