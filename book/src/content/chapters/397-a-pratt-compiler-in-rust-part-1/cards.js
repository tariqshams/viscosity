// Chapter 397 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

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
    prompt: `drip-rs names its parse functions with an enum. The other common design stores the functions themselves. Try it: write four functions \`add\`, \`sub\`, \`mul\` and \`div\` of type \`BinFn\`, a table \`op_fn(c)\` that returns the right one for \`+ - * /\` (and \`None\` for anything else), and \`apply(c, a, b)\`, which looks the function up and calls it. One test checks that a cell costs no more than a bare pointer.`,
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

- Writing \`let f = match c { '+' => Some(add), '-' => Some(sub), ... }; f\` with no type on \`f\`: the arms keep their own, different function types, and rustc stops with E0308, "expected fn item, found a different fn item". Annotate \`let f: Option<BinFn>\`, or return the \`match\` directly.
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
        why: 'Doesn’t compile: E0308, “expected fn item, found a different fn item”. With no expected type on `let f`, each arm keeps its own function’s type.',
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
};

export const quiz = [
  {
    q: 'In drip-rs, what does `prefix_rule(TokenKind::True)` return?',
    options: [
      { t: 'A closure that emits `true`', why: 'That is the TypeScript design. drip-rs returns a value naming the work, not a function.' },
      { t: '`Some(Prefix::Literal(OpCode::True))`', correct: true, why: 'The variant carries the opcode to emit, so `true`, `false` and `none` share one arm of `prefix`.' },
      { t: '`PREC_NONE`', why: 'That is what `infix_precedence` says about `true`: it never continues an expression.' },
      { t: '`None`', why: '`true` can start an expression, so it has a prefix rule.' },
    ],
  },
  {
    q: 'Parsing at precedence `PREC_FACTOR` (7), the next token is `+` (`PREC_TERM`, 6). What happens?',
    options: [
      { t: '`+` joins the operand being parsed', why: 'Only operators whose precedence is at least 7 may join it.' },
      { t: '“expected an expression” is reported', why: 'That is for a token with no prefix rule, at the start of an expression.' },
      { t: 'The loop stops, leaving `+` for an outer call', correct: true, why: '`7 <= 6` is false: `+` binds more loosely than the operand being parsed.' },
    ],
  },
  {
    q: 'Why does `infix` parse a binary operator’s right operand at `infix_precedence(kind) + 1`?',
    options: [
      { t: 'So that `*` binds tighter than `+`', why: 'That comes from the precedences themselves (7 against 6), not from the `+ 1`.' },
      { t: 'To skip the operator token', why: '`advance()` already consumed it before `infix` was called.' },
      { t: 'So operators of equal precedence group from the left, as in `(8 - 3) - 2`', correct: true, why: 'The second `-` is not tighter than the minimum, so it is left for the outer loop.' },
      { t: 'Because precedences are `u8` and must not be 0', why: 'No such rule exists; `PREC_NONE` is 0.' },
    ],
  },
  {
    q: 'Which is a reason drip-rs’s table names parse functions with a `Prefix` enum?',
    options: [
      { t: 'Rust has no way to store a function in a variable', why: 'It does: function pointers, such as `fn(&mut Compiler, bool)`.' },
      { t: 'An enum can capture the compiler’s variables', why: 'An enum value captures nothing; the code runs later, in `prefix`, with `&mut self`.' },
      { t: 'It is one byte, `Copy`, can carry data, and `match` checks every variant is handled', correct: true, why: 'All four were measured or are guaranteed by the compiler.' },
      { t: 'Function pointers are always 16 bytes', why: 'A function pointer is 8 bytes on a 64-bit machine, and `Option` of one is 8 too.' },
    ],
  },
  {
    q: 'What does drip-rs report for `a + b = 1;`?',
    options: [
      { t: '`line 1: cannot assign to this expression`', correct: true, why: 'Inside `a + b`, `can_assign` is false; the `=` is left over when the outer `continue_expression` ends, and its last line reports it.' },
      { t: 'Nothing: it assigns 1 to `b`', why: '`b` is parsed at `PREC_TERM + 1`, where `can_assign` is false, so its `named_variable` does not take the `=`.' },
      { t: '`line 1: expected an expression, found \'=\'`', why: '`=` is never asked for its prefix rule here; it is found after a complete expression.' },
    ],
  },
];
