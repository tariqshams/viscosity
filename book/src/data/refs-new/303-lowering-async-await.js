// New references for chapter 303. Checked 2026-11-02. The chapter also
// relies on mdn-async-function, mdn-await, mdn-promise, mdn-generator and
// cpython-dis. The listings are real output produced in this session,
// trimmed to 44 columns: TypeScript 5.9.3 (tsc --target es5 and es2015),
// Node 22.23.4 (--print-bytecode), Python 3.13.18 (dis.dis) and rustc
// 1.97.0 (std::mem::size_of_val printed “2 102” for small() and big()).
export default [
  {
    id: 'ts-emit-helpers',
    authors: ['Microsoft and the TypeScript contributors'],
    title: 'TypeScript compiler source: src/compiler/factory/emitHelpers.ts (the __awaiter and __generator helpers), v5.9.3',
    venue: 'microsoft/TypeScript on GitHub, tag v5.9.3',
    year: 2025,
    doi: null,
    url: 'https://github.com/microsoft/TypeScript/blob/v5.9.3/src/compiler/factory/emitHelpers.ts',
    accessed: '2026-11-02',
    checkedAgainst: 'Read raw from raw.githubusercontent.com/microsoft/TypeScript/v5.9.3/src/compiler/factory/emitHelpers.ts on 2026-11-02: the helpers named "typescript:awaiter" and "typescript:generator"; the comment lists the instructions the __generator helper understands, including “2: return(value?)” and “4: yield(value?) - Yield execution to the caller with an optional value. When resumed, the generator will continue at the next label.” src/compiler/transformers/generators.ts at the same tag has const enum Instruction { Next = 0, Throw = 1, Return = 2, Break = 3, Yield = 4, ... }. The same helper text ships in node_modules/typescript/lib/typescript.js 5.9.3, whose output for the chapter’s total() was quoted.',
    shaped: 'Chapter 303: how tsc lowers async functions to a generator plus __awaiter, or to a switch on _a.label for ES5.',
  },
  {
    id: 'rustref-await-expr',
    authors: ['The Rust Project Developers'],
    title: 'The Rust Reference: Await expressions',
    venue: 'rust-lang/reference, src/expressions/await-expr.md',
    year: null,
    doi: null,
    url: 'https://doc.rust-lang.org/reference/expressions/await-expr.html',
    accessed: '2026-11-02',
    checkedAgainst: 'Source read raw from raw.githubusercontent.com/rust-lang/reference/master/src/expressions/await-expr.md on 2026-11-02: await expressions are legal only within an async context; the operand is turned into a future, pinned and polled with the current task context; if poll returns Poll::Pending “the future returns Poll::Pending, suspending its state”, and when the context is polled again execution resumes; a Ready value becomes the value of the await expression. A non-normative desugaring shows the poll loop.',
    shaped: 'Chapter 303: a Rust async fn is a future, polled until ready, that saves its state at each .await.',
  },
  {
    id: 'plotkin1975',
    authors: ['Gordon D. Plotkin'],
    title: 'Call-by-name, call-by-value and the λ-calculus',
    venue: 'Theoretical Computer Science 1(2), pp. 125–159',
    year: 1975,
    doi: null,
    url: 'https://homepages.inf.ed.ac.uk/gdp/publications/cbn_cbv_lambda.pdf',
    accessed: '2026-11-02',
    checkedAgainst: 'Web search on 2026-11-02: the Utah TCS 1975 bibliography entry (ftp.math.utah.edu/pub/tex/bib/idx/tcs1975/1/2/125_159.html) gives G. D. Plotkin, Theoretical Computer Science 1(2):125–159, December 1975; the author’s own copy is listed at homepages.inf.ed.ac.uk/gdp/publications/cbn_cbv_lambda.pdf. The paper gives simulations (translations) between call-by-value and call-by-name languages and proves properties of them. The PDF and the publisher’s page could not be opened from this session, and no DOI could be confirmed, so only these facts are relied on.',
    shaped: 'Chapter 303: the call-by-value CPS translation.',
  },
];
