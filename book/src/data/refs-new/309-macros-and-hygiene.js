// New references for chapter 309 (and its staged second half, 287b).
// Checked 2026-11-02. The listings are real output, trimmed to 44
// columns: gcc 13.3.0 (gcc -E -P), rustc 1.97.0 (the program printed 9 and
// "2 1"; RUSTC_BOOTSTRAP=1 rustc -Zunpretty=expanded and
// -Zunpretty=expanded,hygiene), @babel/template and @babel/generator 7.29
// from the book's own node_modules, and Node 22.23.4.
export default [
  {
    id: 'gcc-cpp-macros',
    authors: ['Free Software Foundation'],
    title: 'The C Preprocessor (GCC manual): Macros, and Macro Pitfalls',
    venue: 'gcc-mirror/gcc, gcc/doc/cpp.texi',
    year: null,
    doi: null,
    url: 'https://gcc.gnu.org/onlinedocs/cpp/Macros.html',
    accessed: '2026-11-02',
    checkedAgainst: 'gcc/doc/cpp.texi read raw from github.com/gcc-mirror/gcc (master) on 2026-11-02. Chapter Macros: “A macro is a fragment of code which has been given a name. Whenever the name is used, it is replaced by the contents of the macro.” Section Operator Precedence Problems: “each occurrence of a macro argument name had parentheses around it. In addition, another pair of parentheses usually surround the entire macro definition. Here is why it is best to write macros that way”, with the ceil_div example. Section Duplication of Side Effects: the min(X, Y) example. gcc 13.3.0 -E turned SQ(n + 1) into n + 1 * n + 1.',
    shaped: 'Chapters 309 and 309b: C’s text macros and their pitfalls.',
  },
  {
    id: 'rustref-macros-by-example',
    authors: ['The Rust Project Developers'],
    title: 'The Rust Reference: Macros By Example (including Hygiene)',
    venue: 'rust-lang/reference, src/macros-by-example.md',
    year: null,
    doi: null,
    url: 'https://doc.rust-lang.org/reference/macros-by-example.html',
    accessed: '2026-11-02',
    checkedAgainst: 'src/macros-by-example.md read raw from github.com/rust-lang/reference (master) on 2026-11-02: “Each rule has two parts: a matcher, describing the syntax that it matches, and a transcriber, describing the syntax that will replace a successfully matched invocation”; “tries each macro rule in turn. It transcribes the first successful match”; section Hygiene: “Macros by example have mixed-site hygiene. This means that loop labels, block labels, and local variables are looked up at the macro definition site while other symbols are looked up at the macro invocation site”, and “Labels and local variables defined in macro expansion are not shared between invocations”.',
    shaped: 'Chapters 309 and 309b: tree macros, and Rust’s mixed-site hygiene.',
  },
  {
    id: 'elisp-backquote',
    authors: ['Free Software Foundation'],
    title: 'GNU Emacs Lisp Reference Manual: Backquote',
    venue: 'emacs-mirror/emacs, doc/lispref/eval.texi',
    year: null,
    doi: null,
    url: 'https://www.gnu.org/software/emacs/manual/html_node/elisp/Backquote.html',
    accessed: '2026-11-02',
    checkedAgainst: 'doc/lispref/eval.texi read raw from github.com/emacs-mirror/emacs (master) on 2026-11-02, section Backquote: “Backquote constructs allow you to quote a list, but selectively evaluate elements of that list”; “The special marker , inside of the argument to backquote indicates a value that isn’t constant”; “You can also splice an evaluated value into the resulting list, using the special marker ,@”; the examples `(a list of ,(+ 2 3) elements) ⇒ (a list of 5 elements) and `(1 ,@some-list 4 ,@some-list) ⇒ (1 2 3 4 2 3) are quoted from it.',
    shaped: 'Chapter 309: Lisp’s backquote as the original quasiquote.',
  },
  {
    id: 'babel-template',
    authors: ['The Babel team'],
    title: '@babel/template',
    venue: 'babel/website, docs/template.md',
    year: null,
    doi: null,
    url: 'https://babeljs.io/docs/babel-template',
    accessed: '2026-11-02',
    checkedAgainst: 'docs/template.md read raw from github.com/babel/website (main) on 2026-11-02: “In computer science, this is known as an implementation of quasiquotes”; syntactic placeholders are written %%name%%. @babel/template 7.29.7 in the book’s node_modules turned the template if (!(%%cond%%)) throw %%msg%%; with an identifier ok and a string "failed" into if (!ok) throw "failed";.',
    shaped: 'Chapter 309: a quasiquote for JavaScript syntax trees.',
  },
  {
    id: 'kohlbecker1986',
    authors: ['Eugene Kohlbecker', 'Daniel P. Friedman', 'Matthias Felleisen', 'Bruce Duba'],
    title: 'Hygienic Macro Expansion',
    venue: 'Proceedings of the 1986 ACM Conference on LISP and Functional Programming (LFP ’86), pp. 151–161',
    year: 1986,
    doi: '10.1145/319838.319859',
    url: 'https://doi.org/10.1145/319838.319859',
    accessed: '2026-11-02',
    checkedAgainst: 'Not opened (doi.org, dl.acm.org, dblp and Indiana University’s repository are unreachable from this session). Bibliographic details from two independent listings read raw from GitHub on 2026-11-02: the README of rfindler/modern-macros-talk (Robby Findler’s talk on macros) and BIBLIOGRAPHY.md of aalpar/wile, both giving the authors, title, LFP ’86, pp. 151–161 and DOI 10.1145/319838.319859; web search (Wikipedia, Hygienic macro) adds that the term “hygiene” was coined in this paper. Only these facts are relied on.',
    shaped: 'Chapter 309b: the name and the idea of hygienic expansion.',
  },
];
