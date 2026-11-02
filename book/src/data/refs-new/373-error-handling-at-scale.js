// New references for chapter 130 (Error handling at scale) and its staged
// second half (321-b, "From and the question mark"). Checked 2026-11-02 by
// reading the raw source on raw.githubusercontent.com. Every rustc message
// in the chapters is real output of rustc 1.97.0.
export default [
  {
    id: 'rustref-try-propagation',
    authors: ['The Rust Reference contributors'],
    title: 'Operator expressions: the try propagation expression (?)',
    venue: 'The Rust Reference (src/expressions/operator-expr.md)',
    year: null,
    doi: null,
    url: 'https://doc.rust-lang.org/reference/expressions/operator-expr.html#the-try-propagation-expression',
    accessed: '2026-11-02',
    checkedAgainst: 'Read raw from raw.githubusercontent.com/rust-lang/reference/master/src/expressions/operator-expr.md on 2026-11-02: the try propagation expression is written `Expression ?` and is “sometimes called the question mark operator, the ? operator, or the try operator”; for a Result, `Result::Ok(val)` evaluates to `val` and `Result::Err(e)` returns `Result::Err(From::from(e))` from the enclosing function; for an Option, `None` returns `None`.',
    shaped: 'Chapter 130-b: what ? does with an Err, written out as a match.',
  },
];
