// New references for chapter 117 (Functions and expressions) and its
// staged second half (300-b, "Blocks and if are expressions"). Checked
// 2026-11-02 by reading the raw sources from github.com/rust-lang/book
// (main) and github.com/rust-lang/reference (master). Every rustc message
// in the chapters is real output of rustc 1.97.0.
export default [
  {
    id: 'rust-book-functions',
    authors: ['Steve Klabnik', 'Carol Nichols', 'Chris Krycho', 'and contributors'],
    title: 'The Rust Programming Language, chapter 3.3: Functions',
    venue: 'doc.rust-lang.org',
    year: null,
    doi: null,
    url: 'https://doc.rust-lang.org/book/ch03-03-how-functions-work.html',
    accessed: '2026-11-02',
    checkedAgainst: 'Read raw from raw.githubusercontent.com/rust-lang/book/main/src/ch03-03-how-functions-work.md on 2026-11-02: Rust uses snake case for function and variable names; Rust does not care where functions are defined, only that they are defined somewhere in a scope the caller can see; “In function signatures, you must declare the type of each parameter”; “Function bodies are made up of a series of statements optionally ending in an expression”; statements perform an action and do not return a value, expressions evaluate to a value; let is a statement, so let x = (let y = 6) is an error; expressions do not include ending semicolons, and adding one turns an expression into a statement; return types are declared after an arrow, the return value is the value of the final expression, and return returns early; the plus_one example with a stray semicolon gives “mismatched types” with the hint to remove the semicolon.',
    shaped: 'Chapters 117 and 117-b: functions, statements and expressions, and the tail expression.',
  },
  {
    id: 'rustref-block-expr',
    authors: ['The Rust Reference contributors'],
    title: 'Block expressions',
    venue: 'The Rust Reference (src/expressions/block-expr.md)',
    year: null,
    doi: null,
    url: 'https://doc.rust-lang.org/reference/expressions/block-expr.html',
    accessed: '2026-11-02',
    checkedAgainst: 'Read raw from raw.githubusercontent.com/rust-lang/reference/master/src/expressions/block-expr.md on 2026-11-02: a block is {, any number of statements, then an optional expression “called the final operand”, then }; “When a block contains a final operand, the block has the type and value of that final operand”; “When a block does not contain a final operand and the block does not diverge, the block has unit type and unit value”.',
    shaped: 'Chapter 117-b: the value of a block, and the unit value ().',
  },
  {
    id: 'rustref-if-expr',
    authors: ['The Rust Reference contributors'],
    title: 'if expressions',
    venue: 'The Rust Reference (src/expressions/if-expr.md)',
    year: null,
    doi: null,
    url: 'https://doc.rust-lang.org/reference/expressions/if-expr.html',
    accessed: '2026-11-02',
    checkedAgainst: 'Read raw from raw.githubusercontent.com/rust-lang/reference/master/src/expressions/if-expr.md on 2026-11-02: an if expression is a condition, a consequent block, any number of else if conditions and blocks, and an optional else block; the condition must have type bool; “An if expression must have the same type in all situations”, and an if with no else has type (). E0308 (“`if` and `else` have incompatible types”) and E0317 (“`if` may be missing an `else` clause”) were reproduced with rustc 1.97.0.',
    shaped: 'Chapter 117-b: if as an expression with one type.',
  },
];
