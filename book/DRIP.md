# Drip: the language this book builds

Drip is the small language the reader implements three times: a tree-walking
interpreter (Part III), a bytecode virtual machine (Part IV), both in
TypeScript, and the virtual machine again in Rust (Track B). This file is
its specification; `book/companion/ts` (the reference implementation),
`book/companion/rust` (drip-rs) and the test corpus in `book/companion/corpus`
must all agree with it.

Drip is deliberately close to the JavaScript and TypeScript the reader
learned in Part I (`let`, `&&`, `new`, `extends`, `[1, 2, 3]`), with a few
choices of its own (braces always, no parentheses around conditions,
`for ... in`, `self`, `none`, `#` comments). It has lists of records from
the start, because the whole book is about how arrays of records are laid
out in memory.

## A taste

```drip
# Particles, the way Viscosity sees them.
class Particle {
  init(x, vx) {
    self.x = x;
    self.vx = vx;
  }
  step(dt) {
    self.x += self.vx * dt;
  }
}

let ps = [];
for i in 0..3 {
  push(ps, new Particle(i, 1));
}
for p in ps {
  p.step(0.5);
}
print ps[2].x;        # 2.5
print len(ps);        # 3
```

## Lexical structure

- **Source** is UTF-8 text. Whitespace (space, tab, carriage return,
  newline) separates tokens and is otherwise ignored; newlines only count
  lines.
- **Comments** run from `#` to the end of the line.
- **Numbers** are decimal: one or more digits, optionally followed by `.`
  and one or more digits (`0`, `42`, `3.25`). There is no leading `.5`,
  no trailing `5.`, no exponent and no sign (`-3` is unary minus applied
  to `3`). All numbers are 64-bit floats.
- **Strings** are written in double quotes and may span lines. Escapes:
  `\n` newline, `\t` tab, `\"` quote, `\\` backslash. Any other escape is
  a compile error.
- **Identifiers**: a letter or `_`, then letters, digits or `_`.
- **Keywords** (cannot be identifiers):
  `break class continue else extends false fn for if in init let new none print return self super true while`.
  (`init` is a keyword only so that it cannot be shadowed; it names the
  constructor method.)
- **Punctuation and operators**:
  `( ) { } [ ] , . ; ..`
  `+ - * / % ! = == != < <= > >= && || += -=`

## Values

| Type | Literal / how made | Printed as |
|---|---|---|
| none | `none` | `none` |
| boolean | `true`, `false` | `true`, `false` |
| number | `3`, `2.5` | shortest form that reads back the same; whole numbers without `.0` (`3`, `2.5`, `0.1`); `-0` prints `-0`; `NaN` prints `nan`; infinities `inf`, `-inf` |
| string | `"hi"` | its characters, unquoted (inside a list: quoted, `["a", "b"]`) |
| list | `[1, "a", none]` | `[1, "a", none]` |
| function | `fn f() {}`, `fn (x) { ... }` | `fn f` (anonymous: `fn`) |
| native function | `clock`, `len`, ... | `native fn len` |
| class | `class C {}` | `class C` |
| instance | `new C(...)` | `C { x: 1, y: 2 }` (fields in the order they were first set; no fields: `C {}`) |

**Truthiness:** `false` and `none` are false; everything else (including
`0`, `""` and `[]`) is true.

**Equality** (`==`, `!=`): numbers by value (`nan == nan` is false), strings
by contents, booleans and `none` by value; lists, functions, classes and
instances by identity. Values of different types are never equal.

## Grammar

```text
program     → declaration* EOF ;
declaration → classDecl | fnDecl | letDecl | statement ;
classDecl   → "class" IDENT ( "extends" IDENT )? "{" method* "}" ;
method      → ( "init" | IDENT ) "(" params? ")" block ;
fnDecl      → "fn" IDENT "(" params? ")" block ;
params      → IDENT ( "," IDENT )* ;
letDecl     → "let" IDENT ( "=" expression )? ";" ;

statement   → printStmt | ifStmt | whileStmt | forStmt | returnStmt
            | breakStmt | continueStmt | block | exprStmt ;
printStmt   → "print" expression ";" ;
ifStmt      → "if" expression block ( "else" ( ifStmt | block ) )? ;
whileStmt   → "while" expression block ;
forStmt     → "for" IDENT "in" expression ( ".." expression )? block ;
returnStmt  → "return" expression? ";" ;
breakStmt   → "break" ";" ;
continueStmt→ "continue" ";" ;
block       → "{" declaration* "}" ;
exprStmt    → expression ";" ;

expression  → assignment ;
assignment  → target ( "=" | "+=" | "-=" ) assignment | or ;
target      → ( call "." )? IDENT | call "[" expression "]" ;
or          → and ( "||" and )* ;
and         → equality ( "&&" equality )* ;
equality    → comparison ( ( "==" | "!=" ) comparison )* ;
comparison  → term ( ( "<" | "<=" | ">" | ">=" ) term )* ;
term        → factor ( ( "+" | "-" ) factor )* ;
factor      → unary ( ( "*" | "/" | "%" ) unary )* ;
unary       → ( "!" | "-" ) unary | call ;
call        → primary ( "(" args? ")" | "[" expression "]" | "." IDENT )* ;
args        → expression ( "," expression )* ;
primary     → NUMBER | STRING | "true" | "false" | "none" | "self"
            | "super" "." ( IDENT | "init" )
            | "new" IDENT "(" args? ")"
            | "[" args? "]"
            | "fn" "(" params? ")" block
            | IDENT | "(" expression ")" ;
```

Notes:

- Conditions take **no parentheses** and bodies **always** take braces:
  `if x > 1 { print x; }`. (A parenthesised condition is still legal; it
  is just a grouping.)
- A block that would be parsed as an expression statement's start is
  never ambiguous, because blocks only appear where statements are
  expected and Drip has no object literals.
- `a..b` is only part of `for`; it is not an expression elsewhere.
- Assignment is right-associative and is an expression whose value is the
  assigned value. `x += e` means `x = x + e` with `x` (or `o.f`, or
  `xs[i]`) evaluated once.
- `&&` and `||` short-circuit and produce one of their operands (like
  JavaScript): `none || 3` is `3`.
- Up to 255 parameters and 255 arguments.

## Semantics

**Variables and scope.** `let` declares a variable in the current block;
`let x;` sets it to `none`. Scope is lexical. Redeclaring a name in the
same *local* scope is a compile error; at the top level (globals) it is
allowed and replaces the old value. Reading a local variable in its own
initialiser is a compile error. Using an undefined global is a runtime
error.

**Statements.** `print` prints the value and a newline. `while` repeats
while the condition is truthy. `break` and `continue` apply to the
innermost loop and are compile errors outside one.

**`for`.**

- `for i in a..b { body }` evaluates `a` and `b` once (both must be
  numbers) and runs the body with `i = a, a + 1, ...` while `i < b`.
- `for x in e { body }` evaluates `e` once; it must be a list. The body
  runs once per element, in order, reading the length each time round (so
  pushing inside the loop extends it).
- In both, the loop variable is a fresh variable for each iteration
  (closures capture that iteration's value) and is local to the loop.

**Functions.** `fn name(params) { body }` declares a function; `fn
(params) { body }` is an anonymous function expression. Functions are
values and closures: they capture variables, not copies. Calling with the
wrong number of arguments is a runtime error. A function without `return`
(or with a bare `return;`) returns `none`. `return` outside a function is
a compile error.

**Classes.** `class C { methods }` declares a class; `class C extends B`
inherits B's methods (B must be a class, and not C itself). `new C(args)`
makes an instance and calls `init` with the arguments if C (or an
ancestor) defines one; otherwise it must be called with no arguments.
`init` always returns the instance: `return value;` inside `init` is a
compile error (a bare `return;` is allowed). Inside methods, `self` is the
instance and `super.m` is the superclass's `m`, bound to `self`. Using
`self` outside a method, or `super` outside a subclass's method, is a
compile error. Calling a class without `new` is a runtime error.

**Fields and methods.** `o.f` reads a field, or else a method bound to
`o`. Reading a missing property is a runtime error; assigning to any field
of an instance creates it. Only instances have properties.

**Lists.** `[a, b]` makes a list. `xs[i]` reads element `i` (a whole
number from 0 to `len(xs) - 1`; anything else is a runtime error);
`xs[i] = v` writes an existing element. Lists are values passed by
reference, like JavaScript arrays.

**Operators.** `+` adds two numbers or joins two strings (anything else is
a runtime error: use `str` to convert). `- * / %` and the comparisons need
numbers; `%` is the floating-point remainder with the sign of the left
operand (as in JavaScript). `-` negates a number; `!` negates truthiness.

**Native functions.**

| Function | Does |
|---|---|
| `clock()` | seconds since the program started, as a number |
| `len(x)` | length of a list or string (string length in characters) |
| `push(xs, v)` | appends `v` to list `xs`; returns `none` |
| `pop(xs)` | removes and returns the last element; error if empty |
| `str(x)` | the value as a string, exactly as `print` would show it |

## Errors

Error messages are Drip's own; they are written in plain words, lower
case, and say what was expected.

**Compile errors** (scanner, parser, resolver) are reported as

```text
line 3: expected '}' to close the block, found end of file
```

and no code runs. The implementations report the first error in each
statement and keep going (error recovery), printing every error; the
corpus pins the exact list.

**Runtime errors** stop the program and are reported as

```text
runtime error: cannot add a number and a string
  at line 7 in fn area
  at line 12 in script
```

(the message, then one `at` line per active call, innermost first).

The exact messages are pinned by the corpus, which is the source of truth
for wording; implementations must match it byte for byte.

## Exit codes (the command-line tools)

`0` success, `65` compile error, `70` runtime error, `66` cannot read the
file, `64` usage error.
