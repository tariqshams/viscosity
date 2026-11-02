// New references for chapter 306 (Option and Result) and its staged second
// half (306-b, "Result and the ? operator"). Checked 2026-11-02 by reading
// the raw sources from github.com/rust-lang/book (main) and
// github.com/rust-lang/reference (master). Every rustc message, panic
// message and printed value in the chapters is real output of rustc 1.97.0.
export default [
  {
    id: 'rust-book-result',
    authors: ['Steve Klabnik', 'Carol Nichols', 'Chris Krycho', 'and contributors'],
    title: 'The Rust Programming Language, chapter 9.2: Recoverable Errors with Result',
    venue: 'doc.rust-lang.org',
    year: null,
    doi: null,
    url: 'https://doc.rust-lang.org/book/ch09-02-recoverable-errors-with-result.html',
    accessed: '2026-11-02',
    checkedAgainst: 'Read raw from raw.githubusercontent.com/rust-lang/book/main/src/ch09-02-recoverable-errors-with-result.md on 2026-11-02: the definition enum Result<T, E> { Ok(T), Err(E) }; Result and its variants are brought into scope by the prelude; unwrap returns the value inside Ok and calls panic! on Err; propagating errors by returning them to the calling code; “The ? placed after a Result value is defined to work in almost the same way as the match expressions”, returning the Err early from the whole function; error values that ? is called on “go through the from function, defined in the From trait”, converting them to the function’s error type; “The ? operator can only be used in functions whose return type is compatible with the value the ? is used on”; ? can be used on Option in a function that returns Option. E0277 for ? in a function returning f64, the unused_must_use warning, and the outputs of \"42\".parse::<i32>() and \"4x\".parse::<i32>() were reproduced with rustc 1.97.0.',
    shaped: 'Chapter 306-b: Result, propagating errors, and the ? operator.',
  },
  {
    id: 'rustref-question-mark',
    authors: ['The Rust Reference contributors'],
    title: 'Operator expressions: the try propagation expression (?)',
    venue: 'The Rust Reference (src/expressions/operator-expr.md)',
    year: null,
    doi: null,
    url: 'https://doc.rust-lang.org/reference/expressions/operator-expr.html#the-try-propagation-expression',
    accessed: '2026-11-02',
    checkedAgainst: 'Read raw from raw.githubusercontent.com/rust-lang/reference/master/src/expressions/operator-expr.md on 2026-11-02, section expr.try: “The try propagation operator can be applied to expressions with the type of” Result<T, E>, where “Result::Ok(val) evaluates to val” and “Result::Err(e) returns Result::Err(From::from(e))”, and Option<T>, where “Option::Some(val) evaluates to val” and “Option::None returns Option::None” (as well as ControlFlow and Poll); the operator is also called the question mark operator, the ? operator or the try operator.',
    shaped: 'Chapter 306-b: the precise meaning of ?, written out as a match.',
  },
];
