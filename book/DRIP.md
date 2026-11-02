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

Printing, in detail:

- Inside a list or an instance, strings are quoted, with `\n`, `\t`, `\"`
  and `\\` written as escapes: `["a\tb"]`. At the top level (`print`,
  `str`) a string is just its characters.
- Instance fields print with their values in the same nested form:
  `P { name: "ann", tags: ["a"] }`.
- A list or instance that contains itself prints the inner occurrence as
  `[...]` or `C {...}`.
- Very large and very small numbers use JavaScript's layout:
  `1e+21`, `1.5e-7` (plain decimals from 1e-7 up to 1e21).
- A method read from an instance (a bound method) prints like its
  function: `fn speak`. Each read makes a new bound method, so
  `o.m == o.m` is false.

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
- Up to 255 parameters, 255 arguments and 255 elements in a list
  literal.
- A statement that starts with `fn (` is an expression statement (an
  anonymous function, perhaps called at once: `fn () { ... }();`);
  `fn` followed by a name is a declaration.
- `init` is a keyword, so `o.init()` is a syntax error; only `new` and
  `super.init(...)` run an initialiser.

## Semantics

**Variables and scope.** `let` declares a variable in the current block;
`let x;` sets it to `none`. Scope is lexical. Redeclaring a name in the
same *local* scope is a compile error; at the top level (globals) it is
allowed and replaces the old value. Reading a local variable in its own
initialiser is a compile error, even from inside a function written in
the initialiser (`let f = fn () { return f; };` in a block: declare a
named `fn` to recurse). Using an undefined global is a runtime
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
  (closures capture that iteration's value) and is local to the loop;
  the body is a block of its own inside it, so it may shadow the
  variable. Assigning to the variable does not change which values come
  next.
- A range evaluates `a`, then `b`, and only then checks that both are
  numbers.

**Functions.** `fn name(params) { body }` declares a function; `fn
(params) { body }` is an anonymous function expression. Functions are
values and closures: they capture variables, not copies. Calling with the
wrong number of arguments is a runtime error. Calls may nest 256 deep
(the script counts as one); one more is the runtime error `stack
overflow`. Arguments are evaluated left to right after the callee; in a
method call `o.m(args)` the method is looked up after the arguments are
evaluated. A function without `return`
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
| `len(x)` | length of a list or string (string length in Unicode code points) |
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
corpus pins the exact list. In detail:

- Syntax errors come first. After one, the parser skips to the start of
  the next statement (just after a `;`, at a keyword that starts a
  statement, or at the `}` that closes the current block, skipping any
  braces it opens on the way). If a `{` that should open a body is
  missing, no body is parsed.
- The static rules (a redeclared local, reading a local in its own
  initialiser, `return`, `break`, `continue`, `self` or `super` out of
  place, a class extending itself) are only checked, and reported in
  source order, when there are no syntax errors.
- An error names the line of the token it is about; a missing `;` is
  reported on the line of the token before it, and `end of file` on the
  last line that has anything on it. Found tokens are named as `'}'`,
  `'print'`, `a string` or `end of file`.

The messages:

| compile error | when |
|---|---|
| `unexpected character '@'` | a character Drip doesn't use (also a lone `&` or `\|`) |
| `unterminated string` | at the line the string starts on |
| `unknown escape '\q' in a string` | |
| `expected <what>, found <token>` | e.g. `expected ';' after the value`, `expected '{' after the condition`, `expected a loop variable name after 'for'` |
| `expected an expression, found <token>` | |
| `cannot assign to this expression` | `a + b = 1` |
| `a function cannot have more than 255 parameters` | also `a call cannot have more than 255 arguments`, `a list cannot have more than 255 elements` |
| `'x' is already declared in this scope` | |
| `cannot read 'x' in its own initialiser` | |
| `'return' outside a function`, `'break' outside a loop`, `'continue' outside a loop` | |
| `'init' cannot return a value` | |
| `cannot use 'self' outside a method`, `cannot use 'super' outside a method` | |
| `cannot use 'super' in a class that does not extend another` | |
| `a class cannot extend itself` | |

The bytecode VMs also have limits of their own, which the corpus does
not pin: 256 locals and 256 captured variables per function, 65,536
constants per function, and jumps of up to 65,535 bytes.

**Runtime errors** stop the program and are reported as

```text
runtime error: cannot add a number and a string
  at line 7 in fn area
  at line 12 in script
```

(the message, then one `at` line per active call, innermost first: `fn
name`, `anonymous fn` or `script`). Each `at` line gives the line being
run in that call; for the calls further out, the line of the call (its
`(`, or `new`).

Values are described with their article: `none`, `a boolean`, `a
number`, `a string`, `a list`, `a function`, `a class`, `a Point
instance` (`an` before a vowel).

| runtime error | when |
|---|---|
| `cannot add a number and a string` | `+` on anything but two numbers or two strings |
| `cannot use '-' on a string and a number` | `- * / %` |
| `cannot compare a string and a number with '<'` | `< <= > >=` |
| `cannot negate a string` | |
| `undefined variable 'x'` | reading or assigning a global that doesn't exist |
| `cannot call a number` | |
| `cannot call a class: use 'new Point(...)'` | |
| `area() takes 2 arguments but got 1` | (`anonymous fn takes ...` for an anonymous one) |
| `Point has no init, so it takes no arguments, but got 2` | |
| `'new' needs a class, not a function` | |
| `stack overflow` | |
| `Point has no property 'z'` | |
| `cannot read 'x' of a number`, `cannot set 'x' on a list` | properties of a non-instance |
| `Shape has no method 'm'` | `super.m` |
| `a class can only extend a class, not a number` | |
| `cannot index a string` | |
| `a list index must be a number, not a string` | |
| `index 1.5 is not a whole number` | |
| `index 3 is out of range for a list of length 3` | |
| `a range must start with a number, not a string` | also `a range must end with ...` |
| `cannot loop over a number` | `for x in` something that isn't a list |
| `len() needs a list or a string, not a number` | also `push() needs a list, not ...`, `pop() needs ...` |
| `cannot pop from an empty list` | |

The exact messages are pinned by the corpus, which is the source of truth
for wording; implementations must match it byte for byte.

## Exit codes (the command-line tools)

`0` success, `65` compile error, `70` runtime error, `66` cannot read the
file, `64` usage error.
