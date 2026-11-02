# The Drip test corpus

The book's own test programs for Drip, written for *Viscosity* by Tariq
Shams and MIT licensed like the rest of the companion code. Every
implementation in the book runs all of them: the tree-walking interpreter
and the bytecode VM in `../ts`, and drip-rs in `../rust`. They must all
produce exactly the output, errors and exit code each program asks for.
The language itself is specified in `book/DRIP.md`; where the wording of
an error message matters, these programs are the source of truth.

## Layout

One folder per feature, small programs in each:

| folder | what it covers |
|---|---|
| `lexing/` | comments, whitespace, names, keywords, bad characters, line numbers |
| `numbers/`, `strings/` | literals, printing, escapes, arithmetic, `%`, nan and inf |
| `lists/` | literals, indexing, assignment, `push`/`pop`/`len`, printing, cycles |
| `operators/`, `truthiness/` | precedence, `&&`/`||`, `+=`/`-=`, assignment, equality |
| `scope/` | `let`, blocks, shadowing, globals, initialiser rules |
| `control/`, `for/`, `loops/` | `if`, `while`, `for ... in`, ranges, `break`, `continue` |
| `functions/`, `closures/`, `anonymous/` | calls, arity, recursion, captured variables, `fn (...) {}` |
| `classes/`, `init/`, `self/`, `fields/`, `methods/`, `inheritance/` | objects |
| `natives/` | `clock`, `len`, `push`, `pop`, `str` |
| `errors/` | runtime errors and their stack traces |
| `compile/` | compile errors and error recovery |
| `limits/` | 255 parameters, arguments and list elements, long code |
| `programs/` | whole programs: particles, a tokenizer, a stack machine, sorting records... |
| `benchmark/` | longer programs for timing, run by `npm run bench` (not by the tests) |

## Expectations

A program says what it should do in `#` comments:

```drip
print 1 + 2; # expect: 3
print xs[3]; # expect runtime error: index 3 is out of range for a list of length 3
# expect trace: at line 7 in fn area
# expect compile error: line 2: expected ';' after the value, found 'print'
```

- `# expect: <line>` is one line of output; the program's output must be
  exactly these lines, in order.
- `# expect runtime error: <message>` means the program stops with
  `runtime error: <message>` on stderr and exit code 70. Unless `# expect
  trace:` lines pin the whole stack trace, the innermost `at` line must
  name the line the comment is on.
- `# expect trace: at line N in <place>` pins the stack trace, innermost
  call first.
- `# expect compile error: line N: <message>` lists the compile errors.
  The implementation must report exactly these, in this order, and exit
  with 65 without running anything.

The checker is `../ts/test/corpus.ts`, ported to Rust in
`../rust/tests/common/mod.rs`.
