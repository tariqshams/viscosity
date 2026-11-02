// Chapter 236 cards: recall prompts, examples, exercises and quiz.
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
    a: 'Its function in the heap owns it too. A reference would keep the heap borrowed, and the arena could move. An `Rc` is a second owner.',
  },
  'md-sync': {
    q: 'drip-rs keeps `ip`, `chunk` and `slots` in the `Vm` as registers. When must they be synced with the frame?',
    a: 'On a call (save the caller’s `ip`, load the callee’s state) and on a return (load the caller’s state back).',
  },
  'md-measure': {
    q: 'Why does the cost of reaching the next byte matter so much in a bytecode VM?',
    a: 'Every instruction starts by reading a byte, so that cost is paid on every turn of the loop.',
  },
};

export const examples = {};

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
    walkthrough: `**Fetch.** \`let op = self.code[self.ip];\` reads the instruction. Because \`Op\` is \`Copy\`, \`op\` is a copy, and nothing stays borrowed. That's the trick from this chapter: read through \`self\` for one expression, then use \`&mut self\` freely.

**Advance.** \`self.ip += 1\` before running the instruction, as drip-rs's \`read_byte\` does. The instruction pointer always points at the *next* instruction.

**Dispatch.** One \`match\` arm per variant. There's no \`_\` arm, so if you forget one, rustc tells you which (E0004).

**Operand order.** The left operand was pushed first, so it is *under* the right one. Pop \`b\` first, then \`a\`, then push \`a - b\`. Getting this backwards breaks only \`Sub\` (and division, if you add it): addition and multiplication don't care, which is why the order bug hides so well.

**Stopping.** \`Ret\` returns \`false\` from \`step\`. \`run\` loops until then and pops the answer. In drip-rs, \`Return\` also pops the frame and, with no caller left, returns \`Ok(())\` from \`run\`.`,
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

- \`add(a, b)\`: \`Ok\` of the sum if both are numbers, else \`Err("Operands must be numbers.")\`.
- \`neg(v)\`: \`Ok\` of the negated number, else \`Err("Operand must be a number.")\`.
- \`run(code)\`: run the instructions in order. \`Push(v)\` pushes \`v\`, \`Add\` and \`Neg\` use your functions **with \`?\`**, so an error stops the program, and \`Ret\` returns \`Ok\` of the top value.

The messages are drip-rs’s own.`,
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

fn pop(s: &mut Vec<Value>) -> Value {
    s.pop().expect("stack underflow")
}

fn add(a: Value, b: Value)
    -> Result<Value, String> {
    let m = "Operands must be numbers.";
    match (a, b) {
        (Num(x), Num(y)) => {
            Ok(Num(x + y))
        }
        _ => Err(m.to_string()),
    }
}

fn neg(v: Value)
    -> Result<Value, String> {
    let m = "Operand must be a number.";
    match v {
        Num(x) => Ok(Num(-x)),
        _ => Err(m.to_string()),
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
        Err("Operands must be numbers.".into()));
}

#[test]
fn negating_a_bool_is_an_error() {
    let code = [Op::Push(Bool(false)),
        Op::Neg, Op::Ret];
    assert_eq!(run(&code),
        Err("Operand must be a number.".into()));
}

#[test]
fn an_error_stops_the_program() {
    // The Neg after the failing Add never runs.
    let code = [Op::Push(Bool(true)),
        Op::Push(Num(1.0)), Op::Add, Op::Neg,
        Op::Ret];
    assert_eq!(run(&code),
        Err("Operands must be numbers.".into()));
}

#[test]
fn negate_a_number() {
    let code = [Op::Push(Num(2.0)), Op::Neg,
        Op::Ret];
    assert_eq!(run(&code), Ok(Num(-2.0)));
}`,
    hints: [
      'In `add`, match on the pair: `match (a, b) { (Num(x), Num(y)) => ..., _ => ... }`.',
      'In `run`, loop with `for &op in code` and match each op. `s.push(add(a, b)?);` either pushes the sum or returns the error from `run`.',
      'For `Ret`, return `Ok(pop(&mut s))`. After the loop, return some `Err`: a program without `Ret` is broken.',
    ],
    walkthrough: `**Fallible helpers.** \`add\` and \`neg\` return \`Result\`. Matching on a tuple \`(a, b)\` checks both operands in one pattern, the same idea as \`pop_numbers\`'s \`let (Value::Number(a), Value::Number(b)) = ... else\`.

**\`?\` in the loop.** \`add(a, b)?\` means: if it's \`Ok(v)\`, use \`v\`; if it's \`Err(e)\`, return \`Err(e)\` from \`run\` right now. That's how drip-rs's arms abort the whole interpreter loop with one character, where the TypeScript VM throws.

**Where the error goes.** The test \`an_error_stops_the_program\` checks that nothing after the failure runs. In drip-rs the error then reaches \`interpret\`, which resets the stack and frames and reports exit code 70.`,
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

fn pop(s: &mut Vec<Value>) -> Value {
    s.pop().expect("stack underflow")
}

fn add(a: Value, b: Value)
    -> Result<Value, String> {
    let m = "Operands must be numbers.";
    match (a, b) {
        (Num(x), Num(y)) => {
            Ok(Num(x + y))
        }
        _ => Err(m.to_string()),
    }
}

fn neg(v: Value)
    -> Result<Value, String> {
    let m = "Operand must be a number.";
    match v {
        Num(x) => Ok(Num(-x)),
        _ => Err(m.to_string()),
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
    ],
  },
};

export const quiz = [
  {
    q: 'What replaces the TypeScript switch’s `default: throw` case in drip-rs?',
    options: [
      { t: 'A `_ =>` arm that panics', why: 'drip-rs has no `_` arm in `run`: it would turn off the exhaustiveness check.' },
      { t: 'Nothing: the match covers all 37 variants, and only `from_byte` can meet an unknown byte', correct: true, why: 'The compiler checks every opcode has an arm. Decoding returns `None` for a bad byte, and drip-rs `expect`s a valid one.' },
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
    q: 'In my measurement (best of 5, shared cloud VM), how did the variant that walks through the heap for every byte compare on `fib`?',
    options: [
      { t: 'About the same as the registers', why: 'It was the slowest of the three, by far.' },
      { t: 'Faster, because it avoids the `Rc`', why: 'Reading through `self.chunk` was the fastest.' },
      { t: 'About twice as slow: 2983 ms against 1396 ms', correct: true, why: 'Every instruction reads a byte, so a longer path to that byte costs on every step.' },
      { t: 'It didn’t pass the corpus', why: 'All three variants passed the 246 programs.' },
    ],
  },
  {
    q: 'An arm calls `self.pop_numbers()?` and the operands are strings. What happens?',
    options: [
      { t: 'The VM panics', why: 'Nothing panics. The error is an ordinary value.' },
      { t: 'The message goes to stderr, and `?` returns `Err(RuntimeError)` from `run`', correct: true, why: '`runtime_error` writes the message and stack trace; `?` makes the error leave `run` at once.' },
      { t: 'The strings are converted to numbers', why: 'Drip doesn’t convert; it reports “Operands must be numbers.”' },
      { t: 'The instruction is skipped and the loop continues', why: '`?` returns from `run`, so the loop stops.' },
    ],
  },
];
