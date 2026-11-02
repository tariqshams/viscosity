// Chapter 296 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'prt-fnptr': {
    q: 'What is the type of a cell in drip-rs’s parse-rule table?',
    a: '`Option<fn(&mut Compiler, bool)>`: a function pointer to a parse function, or `None`.',
  },
  'prt-option-size': {
    q: 'Why is `Option<fn(&mut u8, bool)>` the same size as the bare function pointer (8 bytes here)?',
    a: 'Function pointers are never null, so `None` can be stored as the null pattern. No separate tag is needed.',
  },
  'prt-no-capture': {
    q: 'A TypeScript parse function reads `previous` from the enclosing `compile`. Where does a drip-rs parse function get it?',
    a: 'From its `&mut Compiler` argument. A plain function pointer captures nothing.',
  },
  'prt-match': {
    q: 'How does drip-rs look up the rule for a token?',
    a: '`Compiler::rule(kind)` is a `match` on `TokenKind` that builds the `ParseRule`, with a `_` arm for tokens that have no rule.',
  },
  'prt-fn-item': {
    q: 'Why do the arms of the rule `match` need the annotation `(Option<ParseFn>, Option<ParseFn>, _)`?',
    a: 'Each function has its own unique type, so `Some(Self::unary)` and `Some(Self::number)` differ (E0308). The annotation turns them into one function-pointer type.',
  },
  'prt-ord': {
    q: 'What does `#[derive(PartialOrd, Ord)]` on the `Precedence` enum compare?',
    a: 'Variant position: the first declared is the smallest. So `None < Assignment < … < Primary`.',
  },
  'prt-next': {
    q: 'TypeScript writes `prec + 1`. What does drip-rs write, and why?',
    a: '`precedence.next()`, a `match` from each variant to the one above. An enum has no `+ 1`.',
  },
  'prt-assoc-fn': {
    q: 'Why is `rule` written as `Self::rule(kind)`, with no `self`?',
    a: 'It needs no compiler state. As an associated function it borrows nothing, so it can be called anywhere, even in the loop condition.',
  },
  'prt-expect': {
    q: 'Why may `parse_precedence` `expect` an infix rule inside its loop?',
    a: 'The loop only runs when the token’s precedence is above `None`, and every such token has an infix rule.',
  },
};

export const examples = {};

export const exercises = {
  precTable: {
    lang: 'rust',
    title: 'A precedence table',
    prompt: `Here is a cut-down \`Prec\` enum, lowest first.

1. Give it the derives it needs, so that precedences can be copied, compared with \`==\` and ordered with \`<\` and \`<=\` by their position, and printed with \`{:?}\`.
2. \`infix_prec(c)\`: \`+\` and \`-\` are \`Term\`, \`*\` and \`/\` are \`Factor\`, anything else is \`None\`.
3. \`next()\`: one level tighter. \`Unary\` is the top, and stays \`Unary\`.
4. \`binds(min, c)\`: may the operator \`c\` continue an expression being parsed at \`min\`? That is drip-rs's loop condition: \`min <= infix_prec(c)\`.`,
    starter: `enum Prec {
    None,
    Term,
    Factor,
    Unary,
}

fn infix_prec(c: char) -> Prec {
    todo!()
}

impl Prec {
    fn next(self) -> Prec {
        todo!()
    }
}

fn binds(min: Prec, c: char) -> bool {
    todo!()
}`,
    solution: `#[derive(Clone, Copy, Debug, PartialEq)]
#[derive(Eq, PartialOrd, Ord)]
enum Prec {
    None,
    Term,
    Factor,
    Unary,
}

fn infix_prec(c: char) -> Prec {
    match c {
        '+' | '-' => Prec::Term,
        '*' | '/' => Prec::Factor,
        _ => Prec::None,
    }
}

impl Prec {
    fn next(self) -> Prec {
        match self {
            Prec::None => Prec::Term,
            Prec::Term => Prec::Factor,
            Prec::Factor => Prec::Unary,
            Prec::Unary => Prec::Unary,
        }
    }
}

fn binds(min: Prec, c: char) -> bool {
    min <= infix_prec(c)
}`,
    tests: `#[test]
fn precedences_are_ordered() {
    assert!(Prec::None < Prec::Term);
    assert!(Prec::Term < Prec::Factor);
    assert!(Prec::Factor < Prec::Unary);
}

#[test]
fn operators_have_precedences() {
    assert_eq!(infix_prec('+'), Prec::Term);
    assert_eq!(infix_prec('-'), Prec::Term);
    assert_eq!(infix_prec('*'), Prec::Factor);
    assert_eq!(infix_prec('/'), Prec::Factor);
    assert_eq!(infix_prec(';'), Prec::None);
}

#[test]
fn next_is_one_level_tighter() {
    assert_eq!(Prec::Term.next(), Prec::Factor);
    assert_eq!(Prec::Factor.next(), Prec::Unary);
    assert_eq!(Prec::Unary.next(), Prec::Unary);
}

#[test]
fn star_joins_a_term() {
    assert!(binds(Prec::Term, '*'));
}

#[test]
fn plus_cannot_join_a_factor() {
    assert!(!binds(Prec::Factor, '+'));
}

#[test]
fn equal_precedence_binds() {
    assert!(binds(Prec::Factor, '*'));
    assert!(binds(Prec::Term, '-'));
}

#[test]
fn a_semicolon_ends_it() {
    assert!(!binds(Prec::Term, ';'));
}`,
    hints: [
      'You need `Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord`. (`#[derive]` lines can be split in two.)',
      '`infix_prec` is a `match` with `|` patterns, and `_ => Prec::None`. `next` is a `match` with one arm per variant.',
      '`binds` is one comparison. Think about `binds(Prec::Factor, \'*\')` in `2 * 3 * 4`: the second `*` must be allowed to continue.',
    ],
    walkthrough: `**Derives.** \`PartialOrd\` and \`Ord\` order the variants by their position in the enum, so the declaration order *is* the precedence table. \`PartialOrd\` needs \`PartialEq\`, and \`Ord\` needs \`Eq\`. \`Copy\` lets \`next(self)\` take the value without moving anything you care about, and \`Debug\` is what \`assert_eq!\` prints on failure.

**infix_prec.** One arm per group of operators, the same shape as drip-rs's \`rule\` match. Anything else gets \`None\`, the lowest precedence, which no expression's minimum ever reaches: that's what makes \`;\` end an expression.

**next.** An enum has no \`+ 1\`, so you write the successor out. It's the same \`next\` drip-rs uses to parse a binary operator's right operand one level tighter.

**binds.** \`<=\`, not \`<\`. At equal precedence the operator still continues the expression being parsed at that level, which is what lets the *outer* loop pick up the second \`-\` in \`8 - 3 - 2\`. Associativity is decided by what minimum you pass to the right operand, not by this comparison. Chapter 297's exercise puts them together.`,
    wrong: [
      {
        code: `#[derive(Clone, Copy, Debug, PartialEq)]
#[derive(Eq, PartialOrd, Ord)]
enum Prec {
    None,
    Factor,
    Term,
    Unary,
}

fn infix_prec(c: char) -> Prec {
    match c {
        '+' | '-' => Prec::Term,
        '*' | '/' => Prec::Factor,
        _ => Prec::None,
    }
}

impl Prec {
    fn next(self) -> Prec {
        match self {
            Prec::None => Prec::Term,
            Prec::Term => Prec::Factor,
            Prec::Factor => Prec::Unary,
            Prec::Unary => Prec::Unary,
        }
    }
}

fn binds(min: Prec, c: char) -> bool {
    min <= infix_prec(c)
}`,
        why: 'With `Ord` derived, the order of the variants is the precedence. Declaring `Factor` before `Term` makes `+` bind tighter than `*`.',
      },
      {
        code: `#[derive(Clone, Copy, Debug, PartialEq)]
#[derive(Eq, PartialOrd, Ord)]
enum Prec {
    None,
    Term,
    Factor,
    Unary,
}

fn infix_prec(c: char) -> Prec {
    match c {
        '+' | '-' => Prec::Term,
        '*' | '/' => Prec::Factor,
        _ => Prec::None,
    }
}

impl Prec {
    fn next(self) -> Prec {
        match self {
            Prec::None => Prec::Term,
            Prec::Term => Prec::Factor,
            Prec::Factor => Prec::Unary,
            Prec::Unary => Prec::Unary,
        }
    }
}

fn binds(min: Prec, c: char) -> bool {
    min < infix_prec(c)
}`,
        why: 'With `<`, an operator at the same level as the minimum can’t continue, so in `2 * 3 * 4` the parse would stop after `2 * 3` and never see the second `*`.',
      },
    ],
  },
  fnTable: {
    optional: true,
    lang: 'rust',
    title: 'A table of function pointers',
    prompt: `Write four functions \`add\`, \`sub\`, \`mul\` and \`div\` of type \`BinFn\`, a table \`op_fn(c)\` that returns the right one for \`+ - * /\` (and \`None\` for anything else), and \`apply(c, a, b)\`, which looks the function up and calls it. One test checks that your table's cells cost no more than a bare pointer.`,
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
      'Each operator is an ordinary `fn add(a: f64, b: f64) -> f64`.',
      '`op_fn` is a `match` returning `Some(add)` and so on. Because the function’s return type says `Option<BinFn>`, every arm is turned into a function pointer.',
      'In `apply`, `let f = op_fn(c)?;` returns `None` early for an unknown operator, then `Some(f(a, b))`.',
    ],
    walkthrough: `**Functions become pointers.** \`add\` on its own has a type unique to \`add\`. Where a \`BinFn\` is expected, Rust coerces it to the function-pointer type. In \`op_fn\`, the declared return type \`Option<BinFn>\` is the expected type of every arm, so all four coerce.

**Without that expected type,** for instance \`let f = match c { '+' => Some(add), '-' => Some(sub), ... };\`, the arms disagree: "expected fn item, found a different fn item". That's why drip-rs annotates the tuple in \`rule\`.

**apply.** \`?\` works on \`Option\` too: \`None\` returns early. Calling \`f(a, b)\` calls whichever function the pointer holds.

**No cost for Option.** A function pointer is never null, so \`None\` is stored as null, and \`Option<BinFn>\` is pointer-sized. drip-rs's \`ParseRule\` relies on this: two optional pointers and a one-byte precedence, 24 bytes in all.`,
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
        why: 'Doesn’t compile: E0308, “expected fn item, found a different fn item”. With no expected type on `let f`, each arm keeps its own function’s type. Annotate `let f: Option<BinFn>`, or return the `match` directly.',
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
    q: 'What is `ParseFn` in drip-rs?',
    options: [
      { t: 'A trait that every parse function implements', why: 'No trait is involved: it’s a plain function-pointer type.' },
      { t: 'A closure that captures the compiler', why: 'Plain `fn` pointers capture nothing. The compiler is passed in as the first argument.' },
      { t: 'A type alias for `fn(&mut Compiler, bool)`, a function pointer', correct: true, why: 'Any function or method with that signature, like `Compiler::binary`, fits.' },
      { t: 'An enum of every parse function', why: 'That would be another design. drip-rs stores pointers.' },
    ],
  },
  {
    q: 'Without the tuple annotation, `match kind { T::Minus => (Some(Self::unary), ...), T::Number => (Some(Self::number), ...), ... }` fails. Why?',
    options: [
      { t: 'Each function has its own unique type, and the arms disagree', correct: true, why: 'rustc reports E0308, “expected fn item, found a different fn item”. The annotation coerces them all to `ParseFn`.' },
      { t: 'Methods can’t be used as values', why: 'They can: `Self::unary` is a value, and it coerces to a function pointer.' },
      { t: '`Some` can’t hold a function', why: '`Option<fn(..)>` is perfectly ordinary.' },
      { t: 'The `_` arm must come first', why: '`_` must come last, or it would catch everything.' },
    ],
  },
  {
    q: 'With `#[derive(PartialOrd, Ord)] enum Precedence { None, Assignment, Or, ..., Primary }`, which is true?',
    options: [
      { t: '`Precedence::Primary < Precedence::None`', why: 'The first declared variant is the smallest, so `None` is the lowest.' },
      { t: 'Comparing them needs a hand-written `impl`', why: 'The derive writes the comparison for you.' },
      { t: '`Precedence::Term + 1` is `Precedence::Factor`', why: 'Enums have no `+`. drip-rs uses `next()`.' },
      { t: '`Precedence::Term < Precedence::Factor`', correct: true, why: '`Term` is declared before `Factor`, and derived `Ord` orders variants by position.' },
    ],
  },
  {
    q: 'In `parse_precedence(Precedence::Factor)`, the next token is `+` (precedence `Term`). What happens?',
    options: [
      { t: 'The loop stops: `Factor <= Term` is false', correct: true, why: '`+` binds more loosely than the operand being parsed, so it’s left for an outer call.' },
      { t: '`+` joins this operand', why: 'Only operators whose precedence is at least `Factor` may join it.' },
      { t: '“Expect expression.” is reported', why: 'That’s for a missing prefix rule, at the start of an expression.' },
      { t: 'The compiler panics on the `expect`', why: 'The `expect` is only reached inside the loop, and `+` does have an infix rule.' },
    ],
  },
  {
    q: 'How big is `Option<fn(&mut u8, bool)>` on the book’s 64-bit machine?',
    options: [
      { t: '16 bytes: 8 for the pointer, 8 for the tag and padding', why: 'No tag is needed: a function pointer is never null.' },
      { t: '8 bytes, the same as the pointer', correct: true, why: '`None` uses the null pattern, which no function pointer has.' },
      { t: '9 bytes', why: 'Sizes are multiples of the alignment (8), and anyway no tag is needed.' },
      { t: '0 bytes', why: 'A pointer needs room for an address.' },
    ],
  },
  {
    q: 'Why does drip-rs’s `binary` parse its right operand at `precedence.next()`?',
    options: [
      { t: 'So that `*` binds tighter than `+`', why: 'That comes from the table’s precedences, not from `next()`.' },
      { t: 'To skip the operator token', why: '`advance()` already did that before `binary` was called.' },
      { t: 'To make operators of equal precedence group from the left, as in `(8 - 3) - 2`', correct: true, why: 'The second `-` is not tighter than the minimum, so it is left for the outer loop.' },
      { t: 'Because `parse_precedence` rejects the same precedence twice', why: 'It has no such rule. The minimum just decides which operators may join.' },
    ],
  },
];
