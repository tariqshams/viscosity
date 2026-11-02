// Chapter 398 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'cs-why-struct': {
    q: 'Why doesn’t drip-rs write its compiler as one function whose helpers are closures over shared variables, as the TypeScript one is?',
    a: 'A closure that writes a variable holds a mutable borrow of it while it may still be called, so a second closure cannot even read it (E0502).',
  },
  'cs-closure-borrow': {
    q: 'A closure does `pos += 1`. How does it borrow `pos`, and for how long?',
    a: 'Mutably, for as long as the closure may still be called. Nothing else may read or write `pos` in that time.',
  },
  'cs-lifetimes': {
    q: 'What do the two lifetimes in `Compiler<\'src, \'a>` stand for?',
    a: '`\'src` is the source text that tokens and local names borrow; `\'a` is what the caller lends: its `Heap` and its GC roots.',
  },
  'cs-tokens': {
    q: 'Why are drip-rs tokens cheap to copy?',
    a: 'A `Token<\'src>` is a kind, a line and a `&str` slice of the source: it is `Copy` and never copies text.',
  },
  'cs-vec': {
    q: 'The TypeScript compiler links nested functions through `enclosing`. What does drip-rs use instead?',
    a: 'A `Vec<FunctionState>` used as a stack, innermost last; `state()` returns `functions.last_mut()`.',
  },
  'cs-level': {
    q: 'How does `resolve_upvalue` reach the enclosing function without holding a reference to it?',
    a: 'By index: it takes a `level` and looks in `self.functions[level - 1]`. A number borrows nothing.',
  },
  'cs-read-first': {
    q: 'Why does `self.chunk().write(byte, self.previous.line)` fail to compile, and what is the fix?',
    a: '`self.chunk()` borrows all of `self` mutably until `write` ends, so reading `self.previous.line` inside it is E0503. Read the line into a local first.',
  },
  'cs-errors': {
    q: 'A program has both a syntax error and a broken static rule. Which does drip-rs report?',
    a: 'Only the syntax error: `compile` appends `static_errors` only when `syntax_errors` is empty.',
  },
};

export const examples = {
  'shared-state': {
    lang: 'rust',
    title: 'State in a struct, helpers as methods',
    code: `// The state lives in one struct; every
// helper borrows it as &mut self.
struct Lexer {
    src: Vec<char>,
    pos: usize,
    out: Vec<String>,
}

impl Lexer {
    fn peek(&self) -> char {
        let i = self.pos;
        *self.src.get(i).unwrap_or(&'$')
    }
    fn letter(&self) -> bool {
        self.peek().is_alphabetic()
    }
    fn advance(&mut self) -> char {
        let c = self.peek();
        self.pos += 1;
        c
    }
    fn word(&mut self) {
        let mut w = String::new();
        while self.letter() {
            w.push(self.advance());
        }
        self.out.push(w);
    }
    fn run(&mut self) {
        while self.peek() != '$' {
            if self.letter() {
                self.word();
            } else {
                self.advance();
            }
        }
    }
}

fn main() {
    let s = "let x = y;";
    let mut lx = Lexer {
        src: s.chars().collect(),
        pos: 0,
        out: Vec::new(),
    };
    lx.run();
    println!("{:?}", lx.out);

    // The closure version. Uncomment
    // these lines to see E0502:
    // let mut pos = 0;
    // let mut advance = || pos += 1;
    // let peek = || pos;
    // advance();
    // println!("{}", peek());
}`,
  },
};

export const exercises = {
  binaryCompiler: {
    lang: 'rust',
    title: 'A binary-expression compiler',
    prompt: `Here is a tiny compiler struct in drip-rs's style: its state (\`src\`, \`pos\`, \`code\`) is in one struct, and its helpers are methods on \`&mut self\`. Numbers are single digits and there are no spaces, so \`"1+2*3"\` is a whole program.

Write \`expr(min)\`, a Pratt loop: compile one number, then, while the next character is an operator whose precedence (\`prec\`, given) is at least \`min\`, consume it, compile its right operand, and emit its \`Op\`. The output is in stack order: \`"1+2*3"\` compiles to \`[Num(1), Num(2), Num(3), Mul, Add]\`.

Operators of equal precedence group from the left: \`"8-3-2"\` is \`(8-3)-2\`. \`prec\` returns 0 for anything that isn't an operator, including the end of the input.`,
    starter: `#[derive(Clone, Copy, Debug, PartialEq)]
enum Op {
    Num(f64),
    Add,
    Sub,
    Mul,
    Div,
}

struct Compiler {
    src: Vec<char>,
    pos: usize,
    code: Vec<Op>,
}

fn prec(c: char) -> u8 {
    match c {
        '+' | '-' => 1,
        '*' | '/' => 2,
        _ => 0,
    }
}

impl Compiler {
    fn peek(&self) -> char {
        let i = self.pos;
        self.src.get(i).copied()
            .unwrap_or('\\0')
    }

    fn advance(&mut self) -> char {
        let c = self.peek();
        self.pos += 1;
        c
    }

    fn number(&mut self) {
        let c = self.advance();
        let d = c.to_digit(10).unwrap();
        let n = d as f64;
        self.code.push(Op::Num(n));
    }

    // Compile operators of precedence
    // at least min, after one operand.
    fn expr(&mut self, min: u8) {
        todo!()
    }
}

fn compile(s: &str) -> Vec<Op> {
    let mut c = Compiler {
        src: s.chars().collect(),
        pos: 0,
        code: Vec::new(),
    };
    c.expr(1);
    c.code
}`,
    solution: `#[derive(Clone, Copy, Debug, PartialEq)]
enum Op {
    Num(f64),
    Add,
    Sub,
    Mul,
    Div,
}

struct Compiler {
    src: Vec<char>,
    pos: usize,
    code: Vec<Op>,
}

fn prec(c: char) -> u8 {
    match c {
        '+' | '-' => 1,
        '*' | '/' => 2,
        _ => 0,
    }
}

impl Compiler {
    fn peek(&self) -> char {
        let i = self.pos;
        self.src.get(i).copied()
            .unwrap_or('\\0')
    }

    fn advance(&mut self) -> char {
        let c = self.peek();
        self.pos += 1;
        c
    }

    fn number(&mut self) {
        let c = self.advance();
        let d = c.to_digit(10).unwrap();
        let n = d as f64;
        self.code.push(Op::Num(n));
    }

    // Compile operators of precedence
    // at least min, after one operand.
    fn expr(&mut self, min: u8) {
        self.number();
        loop {
            let op = self.peek();
            let p = prec(op);
            if p == 0 || p < min {
                break;
            }
            self.advance();
            self.expr(p + 1);
            self.code.push(match op {
                '+' => Op::Add,
                '-' => Op::Sub,
                '*' => Op::Mul,
                _ => Op::Div,
            });
        }
    }
}

fn compile(s: &str) -> Vec<Op> {
    let mut c = Compiler {
        src: s.chars().collect(),
        pos: 0,
        code: Vec::new(),
    };
    c.expr(1);
    c.code
}`,
    tests: `use Op::*;

#[test]
fn one_number() {
    assert_eq!(compile("7"), vec![Num(7.0)]);
}

#[test]
fn one_operator() {
    assert_eq!(compile("1+2"),
        vec![Num(1.0), Num(2.0), Add]);
}

#[test]
fn star_binds_tighter_on_the_right() {
    assert_eq!(compile("1+2*3"),
        vec![Num(1.0), Num(2.0), Num(3.0),
            Mul, Add]);
}

#[test]
fn star_binds_tighter_on_the_left() {
    assert_eq!(compile("2*3+4"),
        vec![Num(2.0), Num(3.0), Mul,
            Num(4.0), Add]);
}

#[test]
fn minus_groups_from_the_left() {
    // (8 - 3) - 2
    assert_eq!(compile("8-3-2"),
        vec![Num(8.0), Num(3.0), Sub,
            Num(2.0), Sub]);
}

#[test]
fn slash_groups_from_the_left() {
    assert_eq!(compile("8/4/2"),
        vec![Num(8.0), Num(4.0), Div,
            Num(2.0), Div]);
}

#[test]
fn two_products_summed() {
    assert_eq!(compile("1*2+3*4"),
        vec![Num(1.0), Num(2.0), Mul,
            Num(3.0), Num(4.0), Mul, Add]);
}`,
    hints: [
      'Start with one operand, `self.number();`. Then `loop`: look at the next character and its precedence, and `break` if the character is not an operator (precedence 0) or binds more loosely than `min`.',
      'Save the operator in a local (`let op = self.peek();`) before you `advance` and recurse: once the right operand is compiled, `peek()` shows a different character.',
      'Compile the right operand with `self.expr(p + 1)`, one level tighter, so an operator of the same precedence is left for this loop; then push the `Op` that matches `op`.',
    ],
    walkthrough: `**How to think about it.** This is drip-rs's \`continue_expression\` with the table folded into \`prec\`: one prefix (a number), then a loop that absorbs infix operators while they bind at least as tightly as \`min\`. Before writing it, compile \`1+2*3\` by hand: \`1\`, then \`+\` (precedence 1, allowed at \`min\` 1), whose right operand is \`2*3\` (the \`*\` is allowed in because 2 is at least 1 + 1), and only then \`Add\`. The other thing to keep in mind is the state: every helper is a method, so \`expr\` can call \`number\`, \`peek\`, \`advance\` and itself, each lending the whole \`Compiler\` and getting it back.

**The solution, line by line.**

- \`fn expr(&mut self, min: u8) {\` borrows the compiler mutably for the whole call; \`min\` is the loosest operator allowed to join.
- \`self.number();\` compiles the left operand, which pushes \`Num(...)\` onto \`self.code\`.
- \`loop {\` repeats once per operator absorbed.
- \`let op = self.peek();\` reads the next character into a local: the read-first habit, because the recursion below moves \`pos\` on.
- \`let p = prec(op);\` looks its precedence up (0 for anything that is not an operator, including the end of the input).
- \`if p == 0 || p < min { break; }\` stops at the end of the input, or at an operator that binds too loosely for this call; that operator is left for an outer call.
- \`self.advance();\` consumes the operator.
- \`self.expr(p + 1);\` compiles the right operand one level tighter, so the second \`-\` in \`8-3-2\` cannot join it and comes back to this loop: \`(8-3)-2\`.
- \`self.code.push(match op { '+' => Op::Add, ... });\` emits the operator after both operands, because a stack machine needs them both on the stack first.

**Common wrong attempts.**

- \`self.expr(p)\` instead of \`p + 1\`: an operator of the same precedence joins the right operand, so \`8-3-2\` compiles as \`8-(3-2)\`, which is 7, not 3.
- Pushing the \`Op\` before compiling the right operand: \`1+2\` becomes \`[Num(1), Add, Num(2)]\`, and \`Add\` runs with only one operand on the stack.
- Calling \`self.peek()\` again after the recursion to decide which \`Op\` to push: by then \`pos\` has moved past the right operand, and you read the wrong character.`,
    wrong: [
      {
        code: `#[derive(Clone, Copy, Debug, PartialEq)]
enum Op {
    Num(f64),
    Add,
    Sub,
    Mul,
    Div,
}

struct Compiler {
    src: Vec<char>,
    pos: usize,
    code: Vec<Op>,
}

fn prec(c: char) -> u8 {
    match c {
        '+' | '-' => 1,
        '*' | '/' => 2,
        _ => 0,
    }
}

impl Compiler {
    fn peek(&self) -> char {
        let i = self.pos;
        self.src.get(i).copied()
            .unwrap_or('\\0')
    }

    fn advance(&mut self) -> char {
        let c = self.peek();
        self.pos += 1;
        c
    }

    fn number(&mut self) {
        let c = self.advance();
        let d = c.to_digit(10).unwrap();
        let n = d as f64;
        self.code.push(Op::Num(n));
    }

    // Compile operators of precedence
    // at least min, after one operand.
    fn expr(&mut self, min: u8) {
        self.number();
        loop {
            let op = self.peek();
            let p = prec(op);
            if p == 0 || p < min {
                break;
            }
            self.advance();
            self.expr(p);
            self.code.push(match op {
                '+' => Op::Add,
                '-' => Op::Sub,
                '*' => Op::Mul,
                _ => Op::Div,
            });
        }
    }
}

fn compile(s: &str) -> Vec<Op> {
    let mut c = Compiler {
        src: s.chars().collect(),
        pos: 0,
        code: Vec::new(),
    };
    c.expr(1);
    c.code
}`,
        why: 'Recursing with `self.expr(p)` lets the second `-` join the right operand, so `8-3-2` compiles as `8-(3-2)`, which is 7, not 3. Pass `p + 1`.',
      },
      {
        code: `#[derive(Clone, Copy, Debug, PartialEq)]
enum Op {
    Num(f64),
    Add,
    Sub,
    Mul,
    Div,
}

struct Compiler {
    src: Vec<char>,
    pos: usize,
    code: Vec<Op>,
}

fn prec(c: char) -> u8 {
    match c {
        '+' | '-' => 1,
        '*' | '/' => 2,
        _ => 0,
    }
}

impl Compiler {
    fn peek(&self) -> char {
        let i = self.pos;
        self.src.get(i).copied()
            .unwrap_or('\\0')
    }

    fn advance(&mut self) -> char {
        let c = self.peek();
        self.pos += 1;
        c
    }

    fn number(&mut self) {
        let c = self.advance();
        let d = c.to_digit(10).unwrap();
        let n = d as f64;
        self.code.push(Op::Num(n));
    }

    // Compile operators of precedence
    // at least min, after one operand.
    fn expr(&mut self, min: u8) {
        self.number();
        loop {
            let op = self.peek();
            let p = prec(op);
            if p == 0 || p < min {
                break;
            }
            self.advance();
            self.code.push(match op {
                '+' => Op::Add,
                '-' => Op::Sub,
                '*' => Op::Mul,
                _ => Op::Div,
            });
            self.expr(p + 1);
        }
    }
}

fn compile(s: &str) -> Vec<Op> {
    let mut c = Compiler {
        src: s.chars().collect(),
        pos: 0,
        code: Vec::new(),
    };
    c.expr(1);
    c.code
}`,
        why: 'The operator is emitted before its right operand, so `1+2` becomes `[Num(1), Add, Num(2)]`. A stack machine needs both operands first.',
      },
    ],
  },
  unaryMinus: {
    optional: true,
    lang: 'rust',
    title: 'Unary minus',
    prompt: `Now \`Op\` has a \`Neg\` instruction, and \`expr\` starts with \`self.prefix()\` instead of \`self.number()\`. Write \`prefix\`: if the next character is \`-\`, it's a unary minus. Consume it, compile its operand, and emit \`Neg\`. Otherwise compile a number.

Unary minus binds tighter than \`*\`: \`"-2*3"\` is \`(-2)*3\`. The binary operators have precedences 1 and 2, so unary is 3.`,
    starter: `#[derive(Clone, Copy, Debug, PartialEq)]
enum Op {
    Num(f64),
    Add,
    Sub,
    Mul,
    Div,
    Neg,
}

struct Compiler {
    src: Vec<char>,
    pos: usize,
    code: Vec<Op>,
}

fn prec(c: char) -> u8 {
    match c {
        '+' | '-' => 1,
        '*' | '/' => 2,
        _ => 0,
    }
}

impl Compiler {
    fn peek(&self) -> char {
        let i = self.pos;
        self.src.get(i).copied()
            .unwrap_or('\\0')
    }

    fn advance(&mut self) -> char {
        let c = self.peek();
        self.pos += 1;
        c
    }

    fn number(&mut self) {
        let c = self.advance();
        let d = c.to_digit(10).unwrap();
        let n = d as f64;
        self.code.push(Op::Num(n));
    }

    // Compile operators of precedence
    // at least min, after one operand.
    fn expr(&mut self, min: u8) {
        self.prefix();
        loop {
            let op = self.peek();
            let p = prec(op);
            if p == 0 || p < min {
                break;
            }
            self.advance();
            self.expr(p + 1);
            self.code.push(match op {
                '+' => Op::Add,
                '-' => Op::Sub,
                '*' => Op::Mul,
                _ => Op::Div,
            });
        }
    }

    // A '-' here is unary minus.
    fn prefix(&mut self) {
        todo!()
    }
}

fn compile(s: &str) -> Vec<Op> {
    let mut c = Compiler {
        src: s.chars().collect(),
        pos: 0,
        code: Vec::new(),
    };
    c.expr(1);
    c.code
}`,
    solution: `#[derive(Clone, Copy, Debug, PartialEq)]
enum Op {
    Num(f64),
    Add,
    Sub,
    Mul,
    Div,
    Neg,
}

struct Compiler {
    src: Vec<char>,
    pos: usize,
    code: Vec<Op>,
}

fn prec(c: char) -> u8 {
    match c {
        '+' | '-' => 1,
        '*' | '/' => 2,
        _ => 0,
    }
}

impl Compiler {
    fn peek(&self) -> char {
        let i = self.pos;
        self.src.get(i).copied()
            .unwrap_or('\\0')
    }

    fn advance(&mut self) -> char {
        let c = self.peek();
        self.pos += 1;
        c
    }

    fn number(&mut self) {
        let c = self.advance();
        let d = c.to_digit(10).unwrap();
        let n = d as f64;
        self.code.push(Op::Num(n));
    }

    // Compile operators of precedence
    // at least min, after one operand.
    fn expr(&mut self, min: u8) {
        self.prefix();
        loop {
            let op = self.peek();
            let p = prec(op);
            if p == 0 || p < min {
                break;
            }
            self.advance();
            self.expr(p + 1);
            self.code.push(match op {
                '+' => Op::Add,
                '-' => Op::Sub,
                '*' => Op::Mul,
                _ => Op::Div,
            });
        }
    }

    fn prefix(&mut self) {
        if self.peek() == '-' {
            self.advance();
            self.expr(3);
            self.code.push(Op::Neg);
        } else {
            self.number();
        }
    }
}

fn compile(s: &str) -> Vec<Op> {
    let mut c = Compiler {
        src: s.chars().collect(),
        pos: 0,
        code: Vec::new(),
    };
    c.expr(1);
    c.code
}`,
    tests: `use Op::*;

#[test]
fn binary_still_works() {
    assert_eq!(compile("8-3-2"),
        vec![Num(8.0), Num(3.0), Sub,
            Num(2.0), Sub]);
}

#[test]
fn a_negative_number() {
    assert_eq!(compile("-4"),
        vec![Num(4.0), Neg]);
}

#[test]
fn minus_binds_tighter_than_star() {
    // (-2) * 3
    assert_eq!(compile("-2*3"),
        vec![Num(2.0), Neg, Num(3.0), Mul]);
}

#[test]
fn subtract_a_negative() {
    // 1 - (-2)
    assert_eq!(compile("1--2"),
        vec![Num(1.0), Num(2.0), Neg, Sub]);
}

#[test]
fn double_negation() {
    assert_eq!(compile("--3"),
        vec![Num(3.0), Neg, Neg]);
}`,
    hints: [
      'Check `self.peek() == \'-\'`. If it is, `self.advance()` past it.',
      'The operand may only contain operators tighter than unary minus. With precedences 1 and 2 for the binary operators, that is `self.expr(3)`, which stops before any binary operator.',
      'After the operand, push `Op::Neg`. In the `else` branch, call `self.number()`.',
    ],
    walkthrough: `**How to think about it.** A \`-\` at the start of an operand cannot be subtraction, because nothing is on its left; that is the idea of *Prefix and infix operators*: one token, two rules, and its position decides which. So \`prefix\` only has to ask "is the next character a minus?", and if so compile a negated operand. The question is how much the operand may contain, and the answer is: only things tighter than unary minus, so \`-2*3\` is \`(-2)*3\`.

**The solution, line by line.**

- \`fn prefix(&mut self) {\` is one more method on the same struct, so \`expr\` and \`prefix\` can call each other.
- \`if self.peek() == '-' {\` looks without consuming.
- \`self.advance();\` consumes the minus.
- \`self.expr(3);\` compiles the operand at the unary level: no binary operator has precedence 3 or more, so the loop in \`expr\` stops straight after one operand (which may itself start with \`-\`, as in \`--3\`).
- \`self.code.push(Op::Neg);\` negates it, after it is on the stack.
- \`} else { self.number(); }\` is the ordinary case.

This is drip-rs's \`Prefix::Unary\` arm, which calls \`self.parse_precedence(PREC_UNARY)\` and then emits \`neg\` or \`not\`. Notice the mutual recursion, \`prefix\` calling \`expr\` calling \`prefix\`: with closures sharing \`pos\` it could not be written at all, while as methods it is two functions lending each other the compiler.

**Common wrong attempts.**

- \`self.expr(1)\` for the operand: it swallows \`*3\` as well, so \`-2*3\` compiles as \`-(2*3)\`, with \`Neg\` after \`Mul\`.
- Calling \`self.number()\` straight after the minus: \`--3\` then fails, because the second \`-\` is not a digit.`,
    wrong: [
      {
        code: `#[derive(Clone, Copy, Debug, PartialEq)]
enum Op {
    Num(f64),
    Add,
    Sub,
    Mul,
    Div,
    Neg,
}

struct Compiler {
    src: Vec<char>,
    pos: usize,
    code: Vec<Op>,
}

fn prec(c: char) -> u8 {
    match c {
        '+' | '-' => 1,
        '*' | '/' => 2,
        _ => 0,
    }
}

impl Compiler {
    fn peek(&self) -> char {
        let i = self.pos;
        self.src.get(i).copied()
            .unwrap_or('\\0')
    }

    fn advance(&mut self) -> char {
        let c = self.peek();
        self.pos += 1;
        c
    }

    fn number(&mut self) {
        let c = self.advance();
        let d = c.to_digit(10).unwrap();
        let n = d as f64;
        self.code.push(Op::Num(n));
    }

    // Compile operators of precedence
    // at least min, after one operand.
    fn expr(&mut self, min: u8) {
        self.prefix();
        loop {
            let op = self.peek();
            let p = prec(op);
            if p == 0 || p < min {
                break;
            }
            self.advance();
            self.expr(p + 1);
            self.code.push(match op {
                '+' => Op::Add,
                '-' => Op::Sub,
                '*' => Op::Mul,
                _ => Op::Div,
            });
        }
    }

    fn prefix(&mut self) {
        if self.peek() == '-' {
            self.advance();
            self.expr(1);
            self.code.push(Op::Neg);
        } else {
            self.number();
        }
    }
}

fn compile(s: &str) -> Vec<Op> {
    let mut c = Compiler {
        src: s.chars().collect(),
        pos: 0,
        code: Vec::new(),
    };
    c.expr(1);
    c.code
}`,
        why: 'With `self.expr(1)`, the operand swallows the `*3` too, so `-2*3` compiles as `-(2*3)`, and `Neg` comes after `Mul`. Parse the operand at the unary level, 3.',
      },
    ],
  },
};

export const quiz = [
  {
    q: `Why does this fail to compile?
\`\`\`rust
let mut pos = 0;
let mut advance = || pos += 1;
let peek = || pos;
advance();
\`\`\``,
    options: [
      { t: '`advance` borrows `pos` mutably while it may still be called, so `peek` cannot also borrow it', correct: true, why: 'E0502. Two closures cannot share a variable that one of them writes.' },
      { t: 'Closures cannot capture numbers', why: 'They can capture anything in scope; the trouble is the overlapping borrows.' },
      { t: 'A closure cannot be called before another is defined', why: 'Order of definition is not the issue; `advance` is still in use when `peek` borrows `pos`.' },
      { t: '`pos` must be declared `static`', why: 'No. drip-rs’s fix is a struct and methods, not globals.' },
    ],
  },
  {
    q: 'Where does drip-rs keep `previous`, which the TypeScript compiler keeps in a local variable of `compile`?',
    options: [
      { t: 'In each parse function’s own locals', why: 'Then it could not be shared between the functions that need it.' },
      { t: 'In a field of the `Compiler` struct, reached through `&mut self`', correct: true, why: 'Every helper is a method, so every helper can read and write `self.previous`.' },
      { t: 'In the heap', why: 'Tokens never go in the Drip heap. They borrow the source text.' },
      { t: 'In a mutable global variable', why: 'drip-rs has none; it is a struct field.' },
    ],
  },
  {
    q: 'What does the lifetime `\'src` in `Token<\'src>` let drip-rs avoid?',
    options: [
      { t: 'Running the garbage collector during compilation', why: 'Lifetimes do not control the collector; the compiler does collect, with its functions as roots.' },
      { t: 'Checking for syntax errors', why: 'Errors are still checked and reported.' },
      { t: 'Copying each lexeme’s text: a token holds a `&str` slice of the source', correct: true, why: 'The lifetime promises the source outlives the tokens, so the slices stay valid.' },
    ],
  },
  {
    q: 'Why does drip-rs keep nested functions in a `Vec<FunctionState>` rather than a list linked through `enclosing`?',
    options: [
      { t: 'A `Vec` is faster to walk', why: 'Speed is not the point; there are rarely more than a few nested functions.' },
      { t: 'Rust cannot express linked lists', why: 'It can (with `Box`, for instance). Changing several nodes at once is what gets awkward.' },
      { t: 'Resolving a captured variable changes several functions’ states; in a `Vec` they are named by index, which borrows nothing', correct: true, why: '`resolve_upvalue(level, name)` reaches `self.functions[level - 1]` through the one `&mut self`.' },
    ],
  },
  {
    q: 'Which version of `emit` compiles?',
    options: [
      { t: '`self.chunk().write(byte, self.previous.line);`', why: 'E0503: `self.chunk()` holds a mutable borrow of `self` while the argument reads `self.previous`.' },
      { t: 'Neither: `emit` cannot touch the chunk at all', why: 'It can, through `chunk()`, as long as nothing else of `self` is used during that borrow.' },
      { t: 'Both: the borrow checker cannot see inside methods', why: 'It sees the signature, `&mut self -> &mut Chunk`, and that is enough to reject the first.' },
      { t: '`let line = self.previous.line; self.emit_at(line, byte);`', correct: true, why: 'The read is over before anything borrows `self` mutably. That is drip-rs’s `emit`.' },
    ],
  },
];
