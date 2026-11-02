// Chapter 74 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.
// Merged from old chapters 140, 140.

export const prompts = {
  'prt-three': {
    q: 'drip-rs splits each row of the parse-rule table into three matches on `TokenKind`. What are they?',
    a: '`prefix_rule` (what the token does at the start of an expression), `infix_precedence` (how tightly it binds after one) and the `prefix` / `infix` methods (the code that runs).',
  },
  'prt-prec-numbers': {
    q: 'What type are drip-rs’s precedences, and why does that suit the parser?',
    a: 'Plain `u8` constants, `PREC_NONE` = 0 up to `PREC_CALL` = 9, the same numbers as TypeScript’s `Prec`; the parser can add 1 to them.',
  },
  'prt-none-zero': {
    q: 'Why does `infix_precedence(Semicolon)` returning 0 end an expression?',
    a: 'Every expression is parsed at precedence 1 or more, and the loop only continues while `precedence <= infix_precedence(next)`; 0 never passes.',
  },
  'prt-enum-why': {
    q: 'What does a prefix cell of drip-rs’s table hold, and how big is it?',
    a: 'An `Option<Prefix>`: an enum naming the parse function (with data, as in `Literal(OpCode)`). It is 1 byte.',
  },
  'prt-fnptr': {
    q: 'What is a function pointer type such as `fn(&mut Compiler, bool)`?',
    a: 'The address of some function with that signature, chosen at run time. It captures nothing, and is never null, so `Option` of one costs no extra space.',
  },
  'prt-plus-one': {
    q: 'Why does `infix` parse a binary operator’s right side at `infix_precedence(kind) + 1`?',
    a: 'So an operator of the same precedence cannot join the right side; it is left for the outer loop, and `8 - 3 - 2` groups as `(8 - 3) - 2`.',
  },
  'prt-can-assign': {
    q: 'When is `can_assign` true in `continue_expression`?',
    a: 'Only when parsing at the loosest level, `precedence <= PREC_ASSIGNMENT`. Inside `a + b`, it is false, so `a + b = 1` reports “cannot assign to this expression”.',
  },
  'prt-loop': {
    q: 'In `continue_expression(precedence, prefix)`, when does the `while` loop stop?',
    a: 'When the next token’s infix precedence is lower than `precedence`: it binds too loosely to join, so it is left for an outer call.',
  },
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
  'mini-pratt': {
    lang: 'rust',
    title: 'A three-match table in miniature',
    code: `// Single digits and + - * only.
#[derive(Clone, Copy)]
enum Prefix {
    Number,
    Unary,
}

fn prefix_rule(c: char)
    -> Option<Prefix> {
    match c {
        '0'..='9' => {
            Some(Prefix::Number)
        }
        '-' => Some(Prefix::Unary),
        _ => None,
    }
}

fn infix_prec(c: char) -> u8 {
    match c {
        '+' | '-' => 6,
        '*' => 7,
        _ => 0,
    }
}

struct P {
    src: Vec<char>,
    pos: usize,
    out: Vec<String>,
}

impl P {
    fn peek(&self) -> char {
        let i = self.pos;
        *self.src.get(i).unwrap_or(&';')
    }

    fn parse(&mut self, prec: u8) {
        let c = self.peek();
        self.pos += 1;
        let Some(p) = prefix_rule(c)
        else {
            let e = format!("err {c}");
            self.out.push(e);
            return;
        };
        match p {
            Prefix::Number => {
                self.out.push(c.into());
            }
            Prefix::Unary => {
                self.parse(8);
                let neg = "neg".into();
                self.out.push(neg);
            }
        }
        let mut op = self.peek();
        while prec <= infix_prec(op) {
            self.pos += 1;
            let r = infix_prec(op) + 1;
            self.parse(r);
            self.out.push(op.into());
            op = self.peek();
        }
    }
}

fn main() {
    let inputs =
        ["-1+2*3", "8-3-2", "1+"];
    for s in inputs {
        let mut p = P {
            src: s.chars().collect(),
            pos: 0,
            out: Vec::new(),
        };
        p.parse(1);
        let out = p.out.join(" ");
        println!("{s:8} => {out}");
    }
}`,
  },
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
  precTable: {
    lang: 'rust',
    title: 'Three matches',
    prompt: `Build a small parse-rule table in drip-rs’s style for single-character tokens. The precedences are \`u8\` constants, as in drip-rs.

1. \`prefix_rule(c)\`: a digit \`'0'\` to \`'9'\` is \`Prefix::Number\`, \`'-'\` is \`Prefix::Unary\`, \`'('\` is \`Prefix::Grouping\`; anything else has no prefix rule (\`None\`).
2. \`infix_prec(c)\`: \`+\` and \`-\` are \`TERM\`, \`*\`, \`/\` and \`%\` are \`FACTOR\`, anything else is \`NONE\`.
3. \`binds(min, c)\`: may the operator \`c\` continue an expression being parsed at precedence \`min\`? That is drip-rs’s loop condition.`,
    starter: `const NONE: u8 = 0;
const ASSIGNMENT: u8 = 1;
const TERM: u8 = 6;
const FACTOR: u8 = 7;

#[derive(Clone, Copy, Debug, PartialEq)]
enum Prefix {
    Number,
    Unary,
    Grouping,
}

fn prefix_rule(c: char)
    -> Option<Prefix> {
    todo!()
}

fn infix_prec(c: char) -> u8 {
    todo!()
}

fn binds(min: u8, c: char) -> bool {
    todo!()
}`,
    solution: `const NONE: u8 = 0;
const ASSIGNMENT: u8 = 1;
const TERM: u8 = 6;
const FACTOR: u8 = 7;

#[derive(Clone, Copy, Debug, PartialEq)]
enum Prefix {
    Number,
    Unary,
    Grouping,
}

fn prefix_rule(c: char)
    -> Option<Prefix> {
    match c {
        '0'..='9' => {
            Some(Prefix::Number)
        }
        '-' => Some(Prefix::Unary),
        '(' => Some(Prefix::Grouping),
        _ => None,
    }
}

fn infix_prec(c: char) -> u8 {
    match c {
        '+' | '-' => TERM,
        '*' | '/' | '%' => FACTOR,
        _ => NONE,
    }
}

fn binds(min: u8, c: char) -> bool {
    min <= infix_prec(c)
}`,
    tests: `#[test]
fn digits_start_numbers() {
    assert_eq!(prefix_rule('0'),
        Some(Prefix::Number));
    assert_eq!(prefix_rule('7'),
        Some(Prefix::Number));
}

#[test]
fn minus_and_paren_start_too() {
    assert_eq!(prefix_rule('-'),
        Some(Prefix::Unary));
    assert_eq!(prefix_rule('('),
        Some(Prefix::Grouping));
}

#[test]
fn others_have_no_prefix_rule() {
    assert_eq!(prefix_rule('+'), None);
    assert_eq!(prefix_rule(';'), None);
}

#[test]
fn operators_have_precedences() {
    assert_eq!(infix_prec('+'), TERM);
    assert_eq!(infix_prec('-'), TERM);
    assert_eq!(infix_prec('*'), FACTOR);
    assert_eq!(infix_prec('%'), FACTOR);
    assert_eq!(infix_prec(')'), NONE);
}

#[test]
fn star_joins_a_term() {
    assert!(binds(TERM, '*'));
}

#[test]
fn plus_cannot_join_a_factor() {
    assert!(!binds(FACTOR, '+'));
}

#[test]
fn equal_precedence_binds() {
    assert!(binds(FACTOR, '*'));
    assert!(binds(TERM, '-'));
}

#[test]
fn a_semicolon_ends_it() {
    assert!(!binds(ASSIGNMENT, ';'));
}`,
    hints: [
      'Each function is one `match` on the character. Which arms does each need, and what does the `_` arm return?',
      'A range pattern `\'0\'..=\'9\'` matches every digit, and `|` puts several characters in one arm: `\'+\' | \'-\' => TERM`.',
      '`binds` is one comparison between `min` and `infix_prec(c)`. In `2 * 3 * 4`, the second `*` must be allowed to continue a product being parsed at `FACTOR`: is the comparison `<` or `<=`?',
    ],
    walkthrough: `**How to think about it.** Each of the three functions answers one question about a single token, and each answer depends on the token alone, so each is a \`match\` on \`c\` with no other state. Write the arms by reading the list in the prompt, then decide what the \`_\` arm says about every token you did not list: "no prefix rule" (\`None\`) for the first, "never continues" (\`NONE\`, which is 0) for the second. The third function is the parser's loop condition, so think about the cases where it must say yes.

**The solution, line by line.**

- \`fn prefix_rule(c: char) -> Option<Prefix> {\` returns an \`Option\`, because most characters cannot start an expression.
- \`match c {\` looks at the character.
- \`'0'..='9' => Some(Prefix::Number),\` is a range pattern: any character from \`'0'\` to \`'9'\`, inclusive, starts a number.
- \`'-' => Some(Prefix::Unary),\` makes minus a prefix operator as well (it is also an infix one; the two tables are separate, which is exactly why a token can be both).
- \`'(' => Some(Prefix::Grouping),\` starts a bracketed expression.
- \`_ => None,\` covers everything else: \`+\`, \`;\` and so on cannot start an expression.
- \`fn infix_prec(c: char) -> u8 {\` returns the precedence as a plain number.
- \`'+' | '-' => TERM,\` and \`'*' | '/' | '%' => FACTOR,\` use \`|\` to give several operators one arm.
- \`_ => NONE,\` gives 0 to everything else, which no expression ever accepts.
- \`fn binds(min: u8, c: char) -> bool { min <= infix_prec(c) }\` is the loop condition of \`continue_expression\`.

Why \`<=\`? In \`2 * 3 * 4\`, after \`2 * 3\` has been parsed by a loop running at \`FACTOR\` (that is, the outer loop of a product), the second \`*\` has precedence \`FACTOR\` too, and it must be allowed in: equal is enough. Which way equal operators *group* is decided elsewhere, by the \`+ 1\` when the right operand is parsed.

**Common wrong attempts.**

- \`min < infix_prec(c)\`: an operator at the same level as the minimum can no longer continue, so after \`2 * 3\` the second \`*\` is refused and the parse stops early.
- Leaving \`'-'\` out of \`prefix_rule\`: \`-5\` then fails with "expected an expression". Minus needs a row in both tables.
- Using \`'0' | '9'\` instead of \`'0'..='9'\`: that matches only the two digits written, not the ones between.`,
    wrong: [
      {
        code: `const NONE: u8 = 0;
const ASSIGNMENT: u8 = 1;
const TERM: u8 = 6;
const FACTOR: u8 = 7;

#[derive(Clone, Copy, Debug, PartialEq)]
enum Prefix {
    Number,
    Unary,
    Grouping,
}

fn prefix_rule(c: char)
    -> Option<Prefix> {
    match c {
        '0'..='9' => {
            Some(Prefix::Number)
        }
        '-' => Some(Prefix::Unary),
        '(' => Some(Prefix::Grouping),
        _ => None,
    }
}

fn infix_prec(c: char) -> u8 {
    match c {
        '+' | '-' => TERM,
        '*' | '/' | '%' => FACTOR,
        _ => NONE,
    }
}

fn binds(min: u8, c: char) -> bool {
    min < infix_prec(c)
}`,
        why: 'With `<`, an operator at the same level as the minimum can’t continue, so in `2 * 3 * 4` the second `*` is refused.',
      },
      {
        code: `const NONE: u8 = 0;
const ASSIGNMENT: u8 = 1;
const TERM: u8 = 6;
const FACTOR: u8 = 7;

#[derive(Clone, Copy, Debug, PartialEq)]
enum Prefix {
    Number,
    Unary,
    Grouping,
}

fn prefix_rule(c: char)
    -> Option<Prefix> {
    match c {
        '0'..='9' => {
            Some(Prefix::Number)
        }
        '(' => Some(Prefix::Grouping),
        _ => None,
    }
}

fn infix_prec(c: char) -> u8 {
    match c {
        '+' | '-' => TERM,
        '*' | '/' | '%' => FACTOR,
        _ => NONE,
    }
}

fn binds(min: u8, c: char) -> bool {
    min <= infix_prec(c)
}`,
        why: '`-` is both a prefix and an infix operator. Without its prefix row, `-5` cannot start an expression.',
      },
    ],
  },
  fnTable: {
    optional: true,
    lang: 'rust',
    title: 'The other design: a table of function pointers',
    prompt: 'drip-rs names its parse functions with an enum. The other common design stores the functions themselves. Try it: write four functions `add`, `sub`, `mul` and `div` of type `BinFn`, a table `op_fn(c)` that returns the right one for `+ - * /` (and `None` for anything else), and `apply(c, a, b)`, which looks the function up and calls it. One test checks that a cell costs no more than a bare pointer.',
    starter: `type BinFn = fn(f64, f64) -> f64;

fn op_fn(c: char) -> Option<BinFn> {
    todo!()
}

fn apply(c: char, a: f64, b: f64)
    -> Option<f64> {
    todo!()
}`,
    solution: `type BinFn = fn(f64, f64) -> f64;

fn add(a: f64, b: f64) -> f64 {
    a + b
}
fn sub(a: f64, b: f64) -> f64 {
    a - b
}
fn mul(a: f64, b: f64) -> f64 {
    a * b
}
fn div(a: f64, b: f64) -> f64 {
    a / b
}

fn op_fn(c: char) -> Option<BinFn> {
    match c {
        '+' => Some(add),
        '-' => Some(sub),
        '*' => Some(mul),
        '/' => Some(div),
        _ => None,
    }
}

fn apply(c: char, a: f64, b: f64)
    -> Option<f64> {
    let f = op_fn(c)?;
    Some(f(a, b))
}`,
    tests: `use std::mem::size_of;

#[test]
fn the_four_operators() {
    assert_eq!(apply('+', 2.0, 3.0), Some(5.0));
    assert_eq!(apply('-', 5.0, 2.0), Some(3.0));
    assert_eq!(apply('*', 2.0, 4.0), Some(8.0));
    assert_eq!(apply('/', 9.0, 3.0), Some(3.0));
}

#[test]
fn unknown_operators_have_no_rule() {
    assert_eq!(apply('%', 1.0, 2.0), None);
    assert!(op_fn('?').is_none());
}

#[test]
fn a_cell_is_a_pointer() {
    let f: BinFn = op_fn('*').unwrap();
    assert_eq!(f(6.0, 7.0), 42.0);
}

#[test]
fn option_costs_nothing() {
    assert_eq!(size_of::<Option<BinFn>>(),
        size_of::<BinFn>());
}`,
    hints: [
      'Each operator is an ordinary function, such as `fn add(a: f64, b: f64) -> f64 { a + b }`.',
      '`op_fn` is a `match` returning `Some(add)` and so on. The declared return type, `Option<BinFn>`, tells Rust to turn each function into the shared pointer type.',
      'In `apply`, `let f = op_fn(c)?;` returns `None` early for an unknown operator; then `Some(f(a, b))` calls whichever function the pointer holds.',
    ],
    walkthrough: `**How to think about it.** A cell of this table is "which function to run", stored as the function itself. Rust can do that with a function pointer type, \`fn(f64, f64) -> f64\` (here given the name \`BinFn\` with \`type\`). So you need the four functions, a \`match\` that picks one, and a caller.

**The solution, line by line.**

- \`type BinFn = fn(f64, f64) -> f64;\` names the pointer type: any function taking two \`f64\`s and returning one.
- \`fn add(a: f64, b: f64) -> f64 { a + b }\`, and the same for \`sub\`, \`mul\` and \`div\`, are four ordinary functions. \`a\` is the left operand, so \`sub\` is \`a - b\`.
- \`fn op_fn(c: char) -> Option<BinFn> {\` promises an optional pointer.
- \`'+' => Some(add),\` and the next three arms each wrap a function. On its own, \`add\` has a type unique to \`add\`; because the function's return type says \`Option<BinFn>\`, Rust converts each arm to the shared pointer type.
- \`_ => None,\` is the "no rule" cell.
- \`let f = op_fn(c)?;\` uses \`?\` on an \`Option\`: for \`None\` it returns \`None\` from \`apply\` at once; otherwise \`f\` is the pointer.
- \`Some(f(a, b))\` calls through the pointer.

The last test checks a promise of the standard library: a function pointer is never null, so \`None\` can be stored as null, and \`Option<BinFn>\` is the same size as \`BinFn\` (8 bytes on a 64-bit machine). drip-rs's \`Option<Prefix>\` is smaller still, 1 byte, which is one reason it names functions instead of storing them.

**Common wrong attempts.**

- Writing \`let f = match c { '+' => Some(add), '-' => Some(sub), ... }; f\` with no type on \`f\`: the arms keep their own, different function types, and rustc stops with E0308, "\`match\` arms have incompatible types" (its note: "different fn items have unique types"). Annotate \`let f: Option<BinFn>\`, or return the \`match\` directly.
- Swapping the operands in \`sub\` or \`div\` (\`b - a\`): \`apply('-', 5.0, 2.0)\` must be 5 − 2.`,
    wrong: [
      {
        code: `type BinFn = fn(f64, f64) -> f64;

fn add(a: f64, b: f64) -> f64 {
    a + b
}
fn sub(a: f64, b: f64) -> f64 {
    a - b
}
fn mul(a: f64, b: f64) -> f64 {
    a * b
}
fn div(a: f64, b: f64) -> f64 {
    a / b
}

fn op_fn(c: char) -> Option<BinFn> {
    let f = match c {
        '+' => Some(add),
        '-' => Some(sub),
        '*' => Some(mul),
        '/' => Some(div),
        _ => None,
    };
    f
}

fn apply(c: char, a: f64, b: f64)
    -> Option<f64> {
    let f = op_fn(c)?;
    Some(f(a, b))
}`,
        why: 'Doesn’t compile: E0308, “`match` arms have incompatible types”, because different fn items have unique types. With no expected type on `let f`, each arm keeps its own function’s type.',
      },
      {
        code: `type BinFn = fn(f64, f64) -> f64;

fn add(a: f64, b: f64) -> f64 {
    a + b
}
fn sub(a: f64, b: f64) -> f64 {
    b - a
}
fn mul(a: f64, b: f64) -> f64 {
    a * b
}
fn div(a: f64, b: f64) -> f64 {
    b / a
}

fn op_fn(c: char) -> Option<BinFn> {
    match c {
        '+' => Some(add),
        '-' => Some(sub),
        '*' => Some(mul),
        '/' => Some(div),
        _ => None,
    }
}

fn apply(c: char, a: f64, b: f64)
    -> Option<f64> {
    let f = op_fn(c)?;
    Some(f(a, b))
}`,
        why: '`a` is the left operand: `apply(\'-\', 5.0, 2.0)` must be 5 − 2, not 2 − 5.',
      },
    ],
  },
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
    q: 'In drip-rs, what does `prefix_rule(TokenKind::True)` return?',
    options: [
      {
        t: 'A closure that emits `true`',
        why: 'That is the TypeScript design. drip-rs returns a value naming the work, not a function.',
      },
      {
        t: '`Some(Prefix::Literal(OpCode::True))`',
        correct: true,
        why: 'The variant carries the opcode to emit, so `true`, `false` and `none` share one arm of `prefix`.',
      },
      {
        t: '`PREC_NONE`',
        why: 'That is what `infix_precedence` says about `true`: it never continues an expression.',
      },
      {
        t: '`None`',
        why: '`true` can start an expression, so it has a prefix rule.',
      },
    ],
  },
  {
    q: 'Parsing at precedence `PREC_FACTOR` (7), the next token is `+` (`PREC_TERM`, 6). What happens?',
    options: [
      {
        t: '`+` joins the operand being parsed',
        why: 'Only operators whose precedence is at least 7 may join it.',
      },
      {
        t: '“expected an expression” is reported',
        why: 'That is for a token with no prefix rule, at the start of an expression.',
      },
      {
        t: 'The loop stops, leaving `+` for an outer call',
        correct: true,
        why: '`7 <= 6` is false: `+` binds more loosely than the operand being parsed.',
      },
    ],
  },
  {
    q: 'Why does `infix` parse a binary operator’s right operand at `infix_precedence(kind) + 1`?',
    options: [
      {
        t: 'So that `*` binds tighter than `+`',
        why: 'That comes from the precedences themselves (7 against 6), not from the `+ 1`.',
      },
      {
        t: 'To skip the operator token',
        why: '`advance()` already consumed it before `infix` was called.',
      },
      {
        t: 'So operators of equal precedence group from the left, as in `(8 - 3) - 2`',
        correct: true,
        why: 'The second `-` is not tighter than the minimum, so it is left for the outer loop.',
      },
      {
        t: 'Because precedences are `u8` and must not be 0',
        why: 'No such rule exists; `PREC_NONE` is 0.',
      },
    ],
  },
  {
    q: 'Which is a reason drip-rs’s table names parse functions with a `Prefix` enum?',
    options: [
      {
        t: 'Rust has no way to store a function in a variable',
        why: 'It does: function pointers, such as `fn(&mut Compiler, bool)`.',
      },
      {
        t: 'An enum can capture the compiler’s variables',
        why: 'An enum value captures nothing; the code runs later, in `prefix`, with `&mut self`.',
      },
      {
        t: 'It is one byte, `Copy`, can carry data, and `match` checks every variant is handled',
        correct: true,
        why: 'All four were measured or are guaranteed by the compiler.',
      },
      {
        t: 'Function pointers are always 16 bytes',
        why: 'A function pointer is 8 bytes on a 64-bit machine, and `Option` of one is 8 too.',
      },
    ],
  },
  {
    q: 'What does drip-rs report for `a + b = 1;`?',
    options: [
      {
        t: '`line 1: cannot assign to this expression`',
        correct: true,
        why: 'Inside `a + b`, `can_assign` is false; the `=` is left over when the outer `continue_expression` ends, and its last line reports it.',
      },
      {
        t: 'Nothing: it assigns 1 to `b`',
        why: '`b` is parsed at `PREC_TERM + 1`, where `can_assign` is false, so its `named_variable` does not take the `=`.',
      },
      {
        t: '`line 1: expected an expression, found \'=\'`',
        why: '`=` is never asked for its prefix rule here; it is found after a complete expression.',
      },
    ],
  },
  {
    q: `Why does this fail to compile?
\`\`\`rust
let mut pos = 0;
let mut advance = || pos += 1;
let peek = || pos;
advance();
\`\`\``,
    options: [
      {
        t: '`advance` borrows `pos` mutably while it may still be called, so `peek` cannot also borrow it',
        correct: true,
        why: 'E0502. Two closures cannot share a variable that one of them writes.',
      },
      {
        t: 'Closures cannot capture numbers',
        why: 'They can capture anything in scope; the trouble is the overlapping borrows.',
      },
      {
        t: 'A closure cannot be called before another is defined',
        why: 'Order of definition is not the issue; `advance` is still in use when `peek` borrows `pos`.',
      },
      {
        t: '`pos` must be declared `static`',
        why: 'No. drip-rs’s fix is a struct and methods, not globals.',
      },
    ],
  },
  {
    q: 'Where does drip-rs keep `previous`, which the TypeScript compiler keeps in a local variable of `compile`?',
    options: [
      {
        t: 'In each parse function’s own locals',
        why: 'Then it could not be shared between the functions that need it.',
      },
      {
        t: 'In a field of the `Compiler` struct, reached through `&mut self`',
        correct: true,
        why: 'Every helper is a method, so every helper can read and write `self.previous`.',
      },
      {
        t: 'In the heap',
        why: 'Tokens never go in the Drip heap. They borrow the source text.',
      },
      {
        t: 'In a mutable global variable',
        why: 'drip-rs has none; it is a struct field.',
      },
    ],
  },
  {
    q: 'What does the lifetime `\'src` in `Token<\'src>` let drip-rs avoid?',
    options: [
      {
        t: 'Running the garbage collector during compilation',
        why: 'Lifetimes do not control the collector; the compiler does collect, with its functions as roots.',
      },
      {
        t: 'Checking for syntax errors',
        why: 'Errors are still checked and reported.',
      },
      {
        t: 'Copying each lexeme’s text: a token holds a `&str` slice of the source',
        correct: true,
        why: 'The lifetime promises the source outlives the tokens, so the slices stay valid.',
      },
    ],
  },
  {
    q: 'Why does drip-rs keep nested functions in a `Vec<FunctionState>` rather than a list linked through `enclosing`?',
    options: [
      {
        t: 'A `Vec` is faster to walk',
        why: 'Speed is not the point; there are rarely more than a few nested functions.',
      },
      {
        t: 'Rust cannot express linked lists',
        why: 'It can (with `Box`, for instance). Changing several nodes at once is what gets awkward.',
      },
      {
        t: 'Resolving a captured variable changes several functions’ states; in a `Vec` they are named by index, which borrows nothing',
        correct: true,
        why: '`resolve_upvalue(level, name)` reaches `self.functions[level - 1]` through the one `&mut self`.',
      },
    ],
  },
  {
    q: 'Which version of `emit` compiles?',
    options: [
      {
        t: '`self.chunk().write(byte, self.previous.line);`',
        why: 'E0503: `self.chunk()` holds a mutable borrow of `self` while the argument reads `self.previous`.',
      },
      {
        t: 'Neither: `emit` cannot touch the chunk at all',
        why: 'It can, through `chunk()`, as long as nothing else of `self` is used during that borrow.',
      },
      {
        t: 'Both: the borrow checker cannot see inside methods',
        why: 'It sees the signature, `&mut self -> &mut Chunk`, and that is enough to reject the first.',
      },
      {
        t: '`let line = self.previous.line; self.emit_at(line, byte);`',
        correct: true,
        why: 'The read is over before anything borrows `self` mutably. That is drip-rs’s `emit`.',
      },
    ],
  },
];
