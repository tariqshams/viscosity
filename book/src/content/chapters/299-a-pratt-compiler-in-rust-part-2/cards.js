// Chapter 299 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'cs-why-struct': {
    q: 'Why doesn’t drip-rs write its compiler as one function with closures over shared variables, like the TypeScript one?',
    a: 'Closures that write a shared variable each hold a mutable borrow of it, so they can’t coexist (E0502), and a closure can’t call itself recursively.',
  },
  'cs-closure-borrow': {
    q: 'A closure does `pos += 1`. How long does it borrow `pos`, and how?',
    a: 'Mutably, for as long as the closure may still be called. Nothing else may read or write `pos` in that time.',
  },
  'cs-lifetimes': {
    q: 'What do the two lifetimes in `Compiler<\'src, \'a>` stand for?',
    a: '`\'src` is the source text that tokens and local names borrow. `\'a` is the caller’s heap, roots and error list.',
  },
  'cs-tokens': {
    q: 'Why are drip-rs tokens cheap to copy?',
    a: 'A `Token<\'src>` is a kind, a line and a `&str` slice of the source: it is `Copy` and never copies text.',
  },
  'cs-vec': {
    q: 'The TypeScript compiler links nested functions through `enclosing`. What does drip-rs use?',
    a: 'A `Vec<FunctionState>` used as a stack, innermost last. `state()` returns `functions.last_mut()`.',
  },
  'cs-level': {
    q: 'How does `resolve_upvalue` name the enclosing function without holding a reference to it?',
    a: 'By index: it takes a `level` and looks in `self.functions[level - 1]`. A number borrows nothing.',
  },
  'cs-read-first': {
    q: 'Why does `self.chunk().lines.push(self.line)` fail, and what is the fix?',
    a: '`self.chunk()` borrows all of `self` mutably until the push ends, so reading `self.line` inside it is E0503. Read it into a local first.',
  },
  'cs-errors': {
    q: 'How does drip-rs’s `compile` say “there were errors”?',
    a: 'It returns `None`: `(!compiler.had_error).then_some(function)`. The messages are already in the borrowed error list.',
  },
};

export const examples = {};

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
      'Start with `self.number();` for the left operand. Then `loop`: peek at the next character and its precedence, and `break` if it is 0 or below `min`.',
      'Read the operator into a local (`let op = self.peek();`) before you `advance` and recurse: by the time the right operand is compiled, `peek()` shows something else.',
      'Compile the right operand with `self.expr(p + 1)`, one level tighter, so an equal-precedence operator is left for this loop. Then push the `Op` for `op`.',
    ],
    walkthrough: `**The shape.** This is drip-rs's \`parse_precedence\` with the table folded into \`prec\`: one prefix (a number), then a loop of infix operators that bind at least as tightly as \`min\`.

**State through \`&mut self\`.** \`expr\` calls \`number\`, \`peek\`, \`advance\` and itself, and each call lends the whole \`Compiler\` and gets it back. Nothing is captured, nothing conflicts.

**Read first.** \`let op = self.peek();\` saves the operator before \`self.expr(p + 1)\` moves \`pos\` past the right operand, just as drip-rs's \`binary\` saves \`self.previous.kind\` before recursing.

**Why \`p + 1\`.** The right operand of \`-\` in \`8-3-2\` is compiled with minimum 2, so the second \`-\` (precedence 1) can't join it. Control returns to this loop, which emits the first \`Sub\` and then picks up the second \`-\`: \`(8-3)-2\`. That's \`Precedence::next()\` in drip-rs.

**Why the push comes after.** Stack bytecode is postfix: both operands must be on the stack before the operator runs.`,
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
      'Check `self.peek() == \'-\'`. If so, `self.advance()` past it.',
      'The operand is an expression in which only operators tighter than unary may appear. With precedences 1 and 2 for the binary operators, that is `self.expr(3)`: just the operand itself.',
      'Then push `Op::Neg`. In the `else` branch, call `self.number()`.',
    ],
    walkthrough: `**Prefix position.** A \`-\` at the start of an operand can't be subtraction, because there is nothing on its left. That is the Pratt idea from chapter 85: the same token has a prefix rule and an infix rule, and the position decides which. In drip-rs's table, \`Minus\` has \`unary\` as its prefix and \`binary\` as its infix.

**Its operand.** drip-rs's \`unary\` calls \`parse_precedence(Precedence::Unary)\`. Here that is \`self.expr(3)\`: no binary operator has precedence 3, so the loop stops at once, and the operand is just a number, or another unary minus (\`--3\`).

**Recursion through \`&mut self\`.** \`prefix\` calls \`expr\`, which calls \`prefix\`. Both are methods on the same struct, so this mutual recursion is simply two methods lending each other the compiler. With closures, it couldn't be written at all.`,
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
let mut advance = || pos += 1;
let mut number = || {
    code.push(bytes[pos]);
    advance();
};
\`\`\``,
    options: [
      { t: '`advance` borrows `pos` mutably while it may still be called, so `number` can’t also read `pos`', correct: true, why: 'E0502. Two closures can’t share a variable that one of them writes.' },
      { t: 'Closures can’t push to a `Vec`', why: 'A closure can change a captured `Vec`; it just borrows it mutably.' },
      { t: 'A closure can’t call another closure', why: 'It can. The trouble is the overlapping borrows of `pos`.' },
      { t: '`pos` must be declared `static`', why: 'No. drip-rs’s fix is a struct and methods, not globals.' },
    ],
  },
  {
    q: 'In drip-rs, where does `previous`, the TypeScript compiler’s local variable, live?',
    options: [
      { t: 'In a global variable, as in clox', why: 'drip-rs has no mutable globals. It’s a struct field.' },
      { t: 'In each parse function’s own locals', why: 'Then it couldn’t be shared between the functions that need it.' },
      { t: 'In the heap', why: 'Tokens never go in the Drip heap. They borrow the source text.' },
      { t: 'In a field of the `Compiler` struct, reached through `&mut self`', correct: true, why: 'Every helper is a method, so every helper can read and write `self.previous`.' },
    ],
  },
  {
    q: 'What does the lifetime `\'src` in `Token<\'src>` let drip-rs avoid?',
    options: [
      { t: 'Running the garbage collector during compilation', why: 'Lifetimes don’t control the collector. The compiler does collect, with its functions as roots.' },
      { t: 'Copying each lexeme’s text: a token holds a `&str` slice of the source', correct: true, why: 'The lifetime promises the source outlives the tokens, so the slices stay valid.' },
      { t: 'Checking for syntax errors', why: 'Errors are still checked and reported.' },
      { t: 'Having a scanner at all', why: 'The scanner produces the tokens. The lifetime says what they borrow.' },
    ],
  },
  {
    q: 'Why is nesting a `Vec<FunctionState>` in drip-rs, rather than a linked list through `enclosing`?',
    options: [
      { t: 'A `Vec` is faster to iterate', why: 'Speed isn’t the point. There are rarely more than a few nested functions.' },
      { t: 'Rust has no way to write linked lists', why: 'It does (with `Box`, for instance). Mutating several nodes at once is what gets awkward.' },
      { t: 'Resolving an upvalue changes several functions’ states; with a `Vec` they are named by index, which borrows nothing', correct: true, why: '`resolve_upvalue(level, name)` reaches `self.functions[level - 1]` through the one `&mut self`.' },
      { t: 'The garbage collector needs a `Vec`', why: 'The functions are roots either way. A `Vec` is just convenient to pass.' },
    ],
  },
  {
    q: 'Which version of `emit` compiles?',
    options: [
      { t: '`self.chunk().write(byte, self.previous.line);`', why: 'E0503: `self.chunk()` holds a mutable borrow of `self` while the argument reads `self.previous`.' },
      { t: '`let line = self.previous.line; self.chunk().write(byte, line);`', correct: true, why: 'The read is over before `chunk()` borrows `self`. That is drip-rs’s `emit`.' },
      { t: 'Neither: `emit` can’t touch the chunk at all', why: 'It can, through `chunk()`, as long as nothing else of `self` is used during that borrow.' },
      { t: 'Both: the borrow checker can’t see inside methods', why: 'It sees the method’s signature, `&mut self -> &mut Chunk`, and that is enough to reject the first.' },
    ],
  },
  {
    q: 'In `binary`, why is `let operator = self.previous.kind;` the first line?',
    options: [
      { t: 'Because `TokenKind` isn’t `Copy`', why: 'It is `Copy`. That’s why reading it into a local is cheap.' },
      { t: 'For speed only', why: 'It’s needed for correctness.' },
      { t: 'The match on the operator must come first in every function', why: 'The match comes last, after the right operand is compiled.' },
      { t: 'Compiling the right operand moves `previous` on, so the operator must be saved first', correct: true, why: 'After `parse_precedence`, `previous` is the last token of the right operand.' },
    ],
  },
];
