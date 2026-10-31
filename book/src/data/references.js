// The single bibliography for the book, the engine and the website.
//
// THE RULE: nothing goes into `references` from memory. Each entry was
// checked against a primary or authoritative page (publisher, the official
// site, PubMed, the authors' own pages, the npm registry). The page used is
// recorded in `checkedAgainst`, and `accessed` gives the date.
// Entries that couldn't be confirmed yet live in `pending` below. They are
// never rendered and can't be cited: scripts/check_chapters.mjs fails the
// build if a chapter cites one.
//
// `shaped` says which part of the book or engine the work influenced.
// The Acknowledgements page uses it to credit people, not only papers.

/** @typedef {{ id: string, authors: string[], title: string, venue: string,
 *   year: number | null, doi: string | null, url: string, accessed: string,
 *   checkedAgainst: string, shaped: string, note?: string }} Reference */

/** @type {Reference[]} */
export const references = [
  {
    id: 'nystrom2021',
    authors: ['Robert Nystrom'],
    title: 'Crafting Interpreters',
    venue: 'Free web edition at craftinginterpreters.com (© 2015–2021); source, text and test suite at github.com/munificent/craftinginterpreters',
    year: 2021,
    doi: null,
    url: 'https://github.com/munificent/craftinginterpreters',
    accessed: '2026-10-31',
    checkedAgainst: 'https://github.com/munificent/craftinginterpreters (README, LICENSE, site/index.html footer “Handcrafted by Robert Nystrom, © 2015–2021”; commit 4a840f70)',
    shaped: 'The whole shape of this book: build a language twice (a tree-walking interpreter, then a bytecode VM), and in Track B rebuild everything in a second, lower-level language. The Drip test suite is adapted from its MIT-licensed Lox tests. Its prose and illustrations (CC BY-NC-ND 4.0) are not copied or adapted here.',
  },
  {
    id: 'makor2022',
    authors: ['Lukas Makor', 'Sebastian Kloibhofer', 'David Leopoldseder', 'Daniele Bonetta', 'Lukas Stadler', 'Hanspeter Mössenböck'],
    title: 'Automatic Array Transformation to Columnar Storage at Run Time',
    venue: 'Proceedings of the 19th International Conference on Managed Programming Languages and Runtimes (MPLR ’22), ACM, pp. 16–28',
    year: 2022,
    doi: '10.1145/3546918.3546919',
    url: 'https://dl.acm.org/doi/10.1145/3546918.3546919',
    accessed: '2026-10-31',
    checkedAgainst: 'https://dl.acm.org/doi/fullHtml/10.1145/3546918.3546919',
    shaped: 'The core idea behind Viscosity: transform arrays of JavaScript objects into columnar (struct-of-arrays) storage automatically, and amortize the cost of the transformation.',
  },
  {
    id: 'kloibhofer2023',
    authors: ['Sebastian Kloibhofer', 'Lukas Makor', 'David Leopoldseder', 'Daniele Bonetta', 'Lukas Stadler', 'Hanspeter Mössenböck'],
    title: 'Control Flow Duplication for Columnar Arrays in a Dynamic Compiler',
    venue: 'The Art, Science, and Engineering of Programming, vol. 7, issue 3, article 9',
    year: 2023,
    doi: '10.22152/programming-journal.org/2023/7/9',
    url: 'https://programming-journal.org/2023/7/9/',
    accessed: '2026-10-31',
    checkedAgainst: 'https://programming-journal.org/2023/7/9/',
    shaped: 'Specialized code paths for transformed arrays, and handling nested (multi-level) objects; the reason Viscosity plans for duplicated, layout-specialized loops.',
  },
  {
    id: 'ye2022',
    authors: ['Junyao Ye', 'Jingyong Su', 'Yilong Cao'],
    title: 'A Stochastic Shortest Path Algorithm for Optimizing Spaced Repetition Scheduling',
    venue: 'Proceedings of the 28th ACM SIGKDD Conference on Knowledge Discovery and Data Mining (KDD ’22), pp. 4381–4390',
    year: 2022,
    doi: '10.1145/3534678.3539081',
    url: 'https://doi.org/10.1145/3534678.3539081',
    accessed: '2026-10-31',
    checkedAgainst: 'https://dblp1.uni-trier.de/rec/conf/kdd/YeSC22.html',
    shaped: 'The research behind FSRS, the scheduler that decides when each review prompt in this book comes back.',
  },
  {
    id: 'fsrs',
    authors: ['Jarrett Ye (Junyao Ye)', 'the open-spaced-repetition contributors'],
    title: 'FSRS: Free Spaced Repetition Scheduler',
    venue: 'open-spaced-repetition (GitHub organization)',
    year: null,
    doi: null,
    url: 'https://github.com/open-spaced-repetition',
    accessed: '2026-10-31',
    checkedAgainst: 'https://github.com/open-spaced-repetition',
    shaped: 'The scheduling algorithm for the book’s spaced-repetition prompts.',
  },
  {
    id: 'tsfsrs',
    authors: ['ishiko732', 'the open-spaced-repetition contributors'],
    title: 'ts-fsrs (TypeScript implementation of FSRS), MIT licence',
    venue: 'npm package',
    year: null,
    doi: null,
    url: 'https://github.com/open-spaced-repetition/ts-fsrs',
    accessed: '2026-10-31',
    checkedAgainst: 'https://registry.npmjs.org/ts-fsrs/latest',
    shaped: 'The library that runs FSRS in your browser for the review prompts.',
  },
  {
    id: 'roediger2006',
    authors: ['Henry L. Roediger III', 'Jeffrey D. Karpicke'],
    title: 'Test-Enhanced Learning: Taking Memory Tests Improves Long-Term Retention',
    venue: 'Psychological Science, 17(3), 249–255',
    year: 2006,
    doi: '10.1111/j.1467-9280.2006.01693.x',
    url: 'https://doi.org/10.1111/j.1467-9280.2006.01693.x',
    accessed: '2026-10-31',
    checkedAgainst: 'https://pubmed.ncbi.nlm.nih.gov/16507066/',
    shaped: 'Why the book asks you to recall answers (retrieval practice) instead of only rereading.',
  },
  {
    id: 'paivio1986',
    authors: ['Allan Paivio'],
    title: 'Mental Representations: A Dual Coding Approach',
    venue: 'Oxford University Press (Oxford Psychology Series, no. 9)',
    year: 1986,
    doi: null,
    url: 'https://academic.oup.com/book/10932',
    accessed: '2026-10-31',
    checkedAgainst: 'https://academic.oup.com/book/10932',
    shaped: 'Dual coding: every key idea comes with both words and a picture.',
  },
  {
    id: 'pharrmark2012',
    authors: ['Matt Pharr', 'William R. Mark'],
    title: 'ispc: A SPMD Compiler for High-Performance CPU Programming',
    venue: 'Proceedings of Innovative Parallel Computing (InPar), San Jose, CA',
    year: 2012,
    doi: null,
    url: 'https://llvm.org/pubs/2012-05-13-InPar-ispc.html',
    accessed: '2026-10-31',
    checkedAgainst: 'https://llvm.org/pubs/2012-05-13-InPar-ispc.html',
    shaped: 'ISPC’s soa<N> types: the AoSoA (blocked) layout that Viscosity can choose.',
  },
  {
    id: 'ispcdocs',
    authors: ['The Intel ISPC project'],
    title: 'Intel ISPC User’s Guide: Structure of Array Types',
    venue: 'ispc.github.io documentation',
    year: null,
    doi: null,
    url: 'https://ispc.github.io/ispc.html',
    accessed: '2026-10-31',
    checkedAgainst: 'https://ispc.github.io/ispc.html',
    shaped: 'How a language can keep ordinary indexing syntax while storing data as blocked SoA.',
  },
  {
    id: 'ziap2025',
    authors: ['Bui Huy Giap (“Zap”, ziap)'],
    title: 'Struct of Arrays (SoA) in TypeScript with metaprogramming',
    venue: 'Zap’s website (blog post, 17 September 2025)',
    year: 2025,
    doi: null,
    url: 'https://ziap.github.io/blog/parallel-array/',
    accessed: '2026-10-31',
    checkedAgainst: 'https://ziap.github.io/',
    shaped: 'Showed SoA in TypeScript winning on field-subset reads and losing when whole objects must be rebuilt; the reason Viscosity chooses a layout instead of always using SoA.',
  },
  {
    id: 'bynensmeurer2018',
    authors: ['Mathias Bynens', 'Benedikt Meurer'],
    title: 'JavaScript engine fundamentals: Shapes and Inline Caches',
    venue: 'mathiasbynens.be',
    year: 2018,
    doi: null,
    url: 'https://mathiasbynens.be/notes/shapes-ics',
    accessed: '2026-10-31',
    checkedAgainst: 'https://mathiasbynens.be/notes/shapes-ics',
    shaped: 'The explanation of shapes (hidden classes) and inline caches in the engine-internals part.',
  },
  {
    id: 'braun2013',
    authors: ['Matthias Braun', 'Sebastian Buchwald', 'Sebastian Hack', 'Roland Leißa', 'Christoph Mallon', 'Andreas Zwinkau'],
    title: 'Simple and Efficient Construction of Static Single Assignment Form',
    venue: 'Compiler Construction (CC 2013), LNCS 7791, Springer, pp. 102–122',
    year: 2013,
    doi: '10.1007/978-3-642-37051-9_6',
    url: 'https://doi.org/10.1007/978-3-642-37051-9_6',
    accessed: '2026-10-31',
    checkedAgainst: 'https://www.compilers.cs.uni-saarland.de/projects/ssaconstr/',
    shaped: 'The SSA construction algorithm used by Viscosity’s IR (VIR).',
  },
  {
    id: 'coopertorczon2022',
    authors: ['Keith D. Cooper', 'Linda Torczon'],
    title: 'Engineering a Compiler (3rd edition)',
    venue: 'Morgan Kaufmann (Elsevier)',
    year: 2022,
    doi: null,
    url: 'https://shop.elsevier.com/books/engineering-a-compiler/cooper/978-0-12-815412-0',
    accessed: '2026-10-31',
    checkedAgainst: 'https://www.elsevier.com/books/catalog/isbn/9780128154120',
    shaped: 'The compiler middle-end part: control-flow graphs, dataflow analysis, optimization passes.',
  },
  {
    id: 'wurthinger2013',
    authors: ['Thomas Würthinger', 'Christian Wimmer', 'Andreas Wöß', 'Lukas Stadler', 'Gilles Duboscq', 'Christian Humer', 'Gregor Richards', 'Doug Simon', 'Mario Wolczko'],
    title: 'One VM to Rule Them All',
    venue: 'Onward! 2013 (SPLASH 2013), ACM, pp. 187–204',
    year: 2013,
    doi: '10.1145/2509578.2509581',
    url: 'https://doi.org/10.1145/2509578.2509581',
    accessed: '2026-10-31',
    checkedAgainst: 'https://2013.splashcon.org/details/onward-2013-papers/6/One-VM-to-Rule-Them-All',
    shaped: 'Truffle and Graal, the runtime in which the columnar-array research was built.',
  },
  {
    id: 'klabnik2026',
    authors: ['Steve Klabnik', 'Carol Nichols', 'Chris Krycho'],
    title: 'The Rust Programming Language (3rd edition)',
    venue: 'No Starch Press; free online at doc.rust-lang.org/book',
    year: 2026,
    doi: null,
    url: 'https://doc.rust-lang.org/book/',
    accessed: '2026-10-31',
    checkedAgainst: 'https://nostarch.com/rust-programming-language-3rd-edition',
    shaped: 'Track B: how the book teaches Rust.',
  },
  {
    id: 'llvmnewpm',
    authors: ['The LLVM Project'],
    title: 'Using the New Pass Manager',
    venue: 'LLVM documentation',
    year: null,
    doi: null,
    url: 'https://llvm.org/docs/NewPassManager.html',
    accessed: '2026-10-31',
    checkedAgainst: 'https://llvm.org/docs/NewPassManager.html',
    shaped: 'Viscosity’s pass manager: cached analyses that are invalidated when a transform changes the program.',
  },
  {
    id: 'mdn-functions',
    authors: ['MDN contributors'],
    title: 'Functions (JavaScript Guide)',
    venue: 'MDN Web Docs',
    year: null,
    doi: null,
    url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions',
    accessed: '2026-10-31',
    checkedAgainst: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions',
    shaped: 'The reference for chapter 1 (functions).',
  },
  {
    id: 'mdn-objects',
    authors: ['MDN contributors'],
    title: 'Working with objects (JavaScript Guide)',
    venue: 'MDN Web Docs',
    year: null,
    doi: null,
    url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Working_with_objects',
    accessed: '2026-10-31',
    checkedAgainst: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Working_with_objects',
    shaped: 'The reference for chapters 3 and 4 (objects, and comparing objects by reference).',
  },
  {
    id: 'mdn-equality',
    authors: ['MDN contributors'],
    title: 'Equality comparisons and sameness',
    venue: 'MDN Web Docs',
    year: null,
    doi: null,
    url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Equality_comparisons_and_sameness',
    accessed: '2026-10-31',
    checkedAgainst: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Equality_comparisons_and_sameness',
    shaped: 'The reference for chapter 4 (identity and ===).',
  },
  {
    id: 'mdn-console-log',
    authors: ['MDN contributors'],
    title: 'console: log() static method',
    venue: 'MDN Web Docs',
    year: null,
    doi: null,
    url: 'https://developer.mozilla.org/en-US/docs/Web/API/console/log_static',
    accessed: '2026-10-31',
    checkedAgainst: 'https://developer.mozilla.org/en-US/docs/Web/API/console/log_static',
    shaped: 'console.log, which every runnable example uses.',
  },
  {
    id: 'mdn-typed-arrays',
    authors: ['MDN contributors'],
    title: 'JavaScript typed arrays',
    venue: 'MDN Web Docs',
    year: null,
    doi: null,
    url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Typed_arrays',
    accessed: '2026-10-31',
    checkedAgainst: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Typed_arrays',
    shaped: 'Float64Array and friends: the storage Viscosity generates.',
  },
  {
    "id": "mdn-first-class-function",
    "authors": [
      "MDN contributors"
    ],
    "title": "First-class function (Glossary)",
    "venue": "MDN Web Docs",
    "year": null,
    "doi": null,
    "url": "https://developer.mozilla.org/en-US/docs/Glossary/First-class_Function",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/mdn/content/main/files/en-us/glossary/first-class_function/index.md (MDN’s own source repository, github.com/mdn/content; developer.mozilla.org was not reachable from the writing session)",
    "shaped": "The definition of first-class functions in chapter 5."
  },
  {
    "id": "mdn-callback-function",
    "authors": [
      "MDN contributors"
    ],
    "title": "Callback function (Glossary)",
    "venue": "MDN Web Docs",
    "year": null,
    "doi": null,
    "url": "https://developer.mozilla.org/en-US/docs/Glossary/Callback_function",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/mdn/content/main/files/en-us/glossary/callback_function/index.md (MDN’s own source repository, github.com/mdn/content; developer.mozilla.org was not reachable from the writing session)",
    "shaped": "The definition of a callback in chapter 5."
  },
  {
    "id": "mdn-function-object",
    "authors": [
      "MDN contributors"
    ],
    "title": "Function",
    "venue": "MDN Web Docs",
    "year": null,
    "doi": null,
    "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/mdn/content/main/files/en-us/web/javascript/reference/global_objects/function/index.md (MDN’s own source repository, github.com/mdn/content; developer.mozilla.org was not reachable from the writing session)",
    "shaped": "The fact that every JavaScript function is an object (chapter 5)."
  },
  {
    "id": "mdn-arrow-functions",
    "authors": [
      "MDN contributors"
    ],
    "title": "Arrow function expressions",
    "venue": "MDN Web Docs",
    "year": null,
    "doi": null,
    "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/mdn/content/main/files/en-us/web/javascript/reference/functions/arrow_functions/index.md (MDN’s own source repository, github.com/mdn/content; developer.mozilla.org was not reachable from the writing session)",
    "shaped": "Arrow function syntax in chapter 5."
  },
  {
    "id": "mdn-array-reduce",
    "authors": [
      "MDN contributors"
    ],
    "title": "Array.prototype.reduce()",
    "venue": "MDN Web Docs",
    "year": null,
    "doi": null,
    "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/mdn/content/main/files/en-us/web/javascript/reference/global_objects/array/reduce/index.md (MDN’s own source repository, github.com/mdn/content; developer.mozilla.org was not reachable from the writing session)",
    "shaped": "reduce, and the TypeError on an empty array with no initial value (chapter 5)."
  },
  {
    "id": "mdn-while",
    "authors": [
      "MDN contributors"
    ],
    "title": "while",
    "venue": "MDN Web Docs",
    "year": null,
    "doi": null,
    "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/while",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/mdn/content/main/files/en-us/web/javascript/reference/statements/while/index.md (MDN’s own source repository, github.com/mdn/content; developer.mozilla.org was not reachable from the writing session)",
    "shaped": "The while loop, break and continue in chapter 5."
  },
  {
    "id": "mdn-closures",
    "authors": [
      "MDN contributors"
    ],
    "title": "Closures (JavaScript Guide)",
    "venue": "MDN Web Docs",
    "year": null,
    "doi": null,
    "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Closures",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/mdn/content/main/files/en-us/web/javascript/guide/closures/index.md (MDN’s own source repository, github.com/mdn/content; developer.mozilla.org was not reachable from the writing session)",
    "shaped": "The definitions of closures, lexical scoping and block scope in chapter 6."
  },
  {
    "id": "mdn-classes",
    "authors": [
      "MDN contributors"
    ],
    "title": "Classes",
    "venue": "MDN Web Docs",
    "year": null,
    "doi": null,
    "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/mdn/content/main/files/en-us/web/javascript/reference/classes/index.md (MDN’s own source repository, github.com/mdn/content; developer.mozilla.org was not reachable from the writing session)",
    "shaped": "Class syntax in chapter 7, including that class bodies always run in strict mode."
  },
  {
    "id": "mdn-using-classes",
    "authors": [
      "MDN contributors"
    ],
    "title": "Using classes (JavaScript Guide)",
    "venue": "MDN Web Docs",
    "year": null,
    "doi": null,
    "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_classes",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/mdn/content/main/files/en-us/web/javascript/guide/using_classes/index.md (MDN’s own source repository, github.com/mdn/content; developer.mozilla.org was not reachable from the writing session)",
    "shaped": "Chapter 7: methods are stored once and shared by every instance."
  },
  {
    "id": "mdn-this",
    "authors": [
      "MDN contributors"
    ],
    "title": "this",
    "venue": "MDN Web Docs",
    "year": null,
    "doi": null,
    "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/mdn/content/main/files/en-us/web/javascript/reference/operators/this/index.md (MDN’s own source repository, github.com/mdn/content; developer.mozilla.org was not reachable from the writing session)",
    "shaped": "Chapter 7: this is the object a method is accessed on, decided by how the function is called."
  },
  {
    "id": "mdn-instanceof",
    "authors": [
      "MDN contributors"
    ],
    "title": "instanceof",
    "venue": "MDN Web Docs",
    "year": null,
    "doi": null,
    "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/instanceof",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/mdn/content/main/files/en-us/web/javascript/reference/operators/instanceof/index.md (MDN’s own source repository, github.com/mdn/content; developer.mozilla.org was not reachable from the writing session)",
    "shaped": "The instanceof operator in chapter 7."
  },
  {
    "id": "mdn-map",
    "authors": [
      "MDN contributors"
    ],
    "title": "Map",
    "venue": "MDN Web Docs",
    "year": null,
    "doi": null,
    "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/mdn/content/main/files/en-us/web/javascript/reference/global_objects/map/index.md (MDN’s own source repository, github.com/mdn/content; developer.mozilla.org was not reachable from the writing session)",
    "shaped": "Chapter 8: Map keys of any type, SameValueZero equality, insertion order, and the specification’s sublinear access-time requirement."
  },
  {
    "id": "mdn-set",
    "authors": [
      "MDN contributors"
    ],
    "title": "Set",
    "venue": "MDN Web Docs",
    "year": null,
    "doi": null,
    "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/mdn/content/main/files/en-us/web/javascript/reference/global_objects/set/index.md (MDN’s own source repository, github.com/mdn/content; developer.mozilla.org was not reachable from the writing session)",
    "shaped": "Set in chapter 8: unique values, insertion order."
  },
  {
    "id": "mdn-for-of",
    "authors": [
      "MDN contributors"
    ],
    "title": "for...of",
    "venue": "MDN Web Docs",
    "year": null,
    "doi": null,
    "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...of",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/mdn/content/main/files/en-us/web/javascript/reference/statements/for...of/index.md (MDN’s own source repository, github.com/mdn/content; developer.mozilla.org was not reachable from the writing session)",
    "shaped": "The for...of loop over arrays, Maps and Sets in chapter 8."
  },
  {
    "id": "gunasekaran2018",
    "authors": [
      "Sathya Gunasekaran"
    ],
    "title": "Optimizing hash tables: hiding the hash code",
    "venue": "V8 blog (v8.dev), 29 January 2018",
    "year": 2018,
    "doi": null,
    "url": "https://v8.dev/blog/hash-code",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/v8/v8.dev/main/src/blog/hash-code.md (the post’s source in the v8.dev repository; v8.dev itself was not reachable from the writing session)",
    "shaped": "Chapter 8: V8’s Map and Set are hash tables, and an object key’s hash code is a stored random number."
  },
  {
    "id": "mdn-call-stack",
    "authors": [
      "MDN contributors"
    ],
    "title": "Call stack (Glossary)",
    "venue": "MDN Web Docs",
    "year": null,
    "doi": null,
    "url": "https://developer.mozilla.org/en-US/docs/Glossary/Call_stack",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://github.com/mdn/content/blob/main/files/en-us/glossary/call_stack/index.md (the source MDN publishes the page from; developer.mozilla.org itself was unreachable from this session)",
    "shaped": "Chapter 9: the call stack, one entry per active call, and the stack overflow error."
  },
  {
    "id": "mdn-recursion",
    "authors": [
      "MDN contributors"
    ],
    "title": "Recursion (Glossary)",
    "venue": "MDN Web Docs",
    "year": null,
    "doi": null,
    "url": "https://developer.mozilla.org/en-US/docs/Glossary/Recursion",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://github.com/mdn/content/blob/main/files/en-us/glossary/recursion/index.md (the source MDN publishes the page from; developer.mozilla.org itself was unreachable from this session)",
    "shaped": "Chapter 9: recursion, base cases and recursive cases."
  },
  {
    "id": "mdn-too-much-recursion",
    "authors": [
      "MDN contributors"
    ],
    "title": "InternalError: too much recursion",
    "venue": "MDN Web Docs",
    "year": null,
    "doi": null,
    "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors/Too_much_recursion",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://github.com/mdn/content/blob/main/files/en-us/web/javascript/reference/errors/too_much_recursion/index.md (the source MDN publishes the page from; developer.mozilla.org itself was unreachable from this session)",
    "shaped": "Chapter 9: the error each browser reports when recursion never stops (RangeError in Chrome and Safari, InternalError in Firefox)."
  },
  {
    "id": "mdn-string",
    "authors": [
      "MDN contributors"
    ],
    "title": "String",
    "venue": "MDN Web Docs",
    "year": null,
    "doi": null,
    "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://github.com/mdn/content/blob/main/files/en-us/web/javascript/reference/global_objects/string/index.md (the source MDN publishes the page from; developer.mozilla.org itself was unreachable from this session)",
    "shaped": "Chapter 10: character access with str[i], and strings as sequences of UTF-16 code units."
  },
  {
    "id": "mdn-charcodeat",
    "authors": [
      "MDN contributors"
    ],
    "title": "String.prototype.charCodeAt()",
    "venue": "MDN Web Docs",
    "year": null,
    "doi": null,
    "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/charCodeAt",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://github.com/mdn/content/blob/main/files/en-us/web/javascript/reference/global_objects/string/charcodeat/index.md (the source MDN publishes the page from; developer.mozilla.org itself was unreachable from this session)",
    "shaped": "Chapter 10: char codes are integers from 0 to 65535 (one UTF-16 code unit)."
  },
  {
    "id": "mdn-template-literals",
    "authors": [
      "MDN contributors"
    ],
    "title": "Template literals (Template strings)",
    "venue": "MDN Web Docs",
    "year": null,
    "doi": null,
    "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://github.com/mdn/content/blob/main/files/en-us/web/javascript/reference/template_literals/index.md (the source MDN publishes the page from; developer.mozilla.org itself was unreachable from this session)",
    "shaped": "Chapter 10: backtick strings with ${expression} placeholders."
  },
  {
    "id": "mdn-primitive",
    "authors": [
      "MDN contributors"
    ],
    "title": "Primitive (Glossary)",
    "venue": "MDN Web Docs",
    "year": null,
    "doi": null,
    "url": "https://developer.mozilla.org/en-US/docs/Glossary/Primitive",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://github.com/mdn/content/blob/main/files/en-us/glossary/primitive/index.md (the source MDN publishes the page from; developer.mozilla.org itself was unreachable from this session)",
    "shaped": "Chapter 10: strings are primitives, and all primitives are immutable."
  },
  {
    "id": "mdn-control-flow",
    "authors": [
      "MDN contributors"
    ],
    "title": "Control flow and error handling (JavaScript Guide)",
    "venue": "MDN Web Docs",
    "year": null,
    "doi": null,
    "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Control_flow_and_error_handling",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://github.com/mdn/content/blob/main/files/en-us/web/javascript/guide/control_flow_and_error_handling/index.md (the source MDN publishes the page from; developer.mozilla.org itself was unreachable from this session)",
    "shaped": "Chapter 11: throw, try...catch and finally (finally runs whether or not an exception was thrown)."
  },
  {
    "id": "mdn-error",
    "authors": [
      "MDN contributors"
    ],
    "title": "Error",
    "venue": "MDN Web Docs",
    "year": null,
    "doi": null,
    "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://github.com/mdn/content/blob/main/files/en-us/web/javascript/reference/global_objects/error/index.md (the source MDN publishes the page from; developer.mozilla.org itself was unreachable from this session)",
    "shaped": "Chapter 11: Error objects, their name and message, the built-in error types, custom error classes, and the non-standard stack property."
  },
  {
    "id": "mdn-modules",
    "authors": [
      "MDN contributors"
    ],
    "title": "JavaScript modules (JavaScript Guide)",
    "venue": "MDN Web Docs",
    "year": null,
    "doi": null,
    "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://github.com/mdn/content/blob/main/files/en-us/web/javascript/guide/modules/index.md (the source MDN publishes the page from; developer.mozilla.org itself was unreachable from this session)",
    "shaped": "Chapter 12: export and import, module scope, strict mode in modules, modules run once, and the dependency graph evaluated depth-first."
  },
  {
    "id": "mdn-strict-mode",
    "authors": [
      "MDN contributors"
    ],
    "title": "Strict mode",
    "venue": "MDN Web Docs",
    "year": null,
    "doi": null,
    "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://github.com/mdn/content/blob/main/files/en-us/web/javascript/reference/strict_mode/index.md (the source MDN publishes the page from; developer.mozilla.org itself was unreachable from this session)",
    "shaped": "Chapter 12: strict mode turns some silent errors into thrown errors."
  },
  {
    "id": "ts-basics",
    "authors": [
      "The TypeScript team (Microsoft)"
    ],
    "title": "The Basics (TypeScript Handbook)",
    "venue": "typescriptlang.org",
    "year": null,
    "doi": null,
    "url": "https://www.typescriptlang.org/docs/handbook/2/basic-types.html",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://github.com/microsoft/TypeScript-Website/blob/v2/packages/documentation/copy/en/handbook-v2/Basics.md",
    "shaped": "Chapter 13: static type checking with tsc, tsc still emitting JavaScript when it finds errors (unless --noEmitOnError), and erased types (“type annotations never change the runtime behavior of your program”)."
  },
  {
    "id": "ts-everyday-types",
    "authors": [
      "The TypeScript team (Microsoft)"
    ],
    "title": "Everyday Types (TypeScript Handbook)",
    "venue": "typescriptlang.org",
    "year": null,
    "doi": null,
    "url": "https://www.typescriptlang.org/docs/handbook/2/everyday-types.html",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://github.com/microsoft/TypeScript-Website/blob/v2/packages/documentation/copy/en/handbook-v2/Everyday%20Types.md",
    "shaped": "Chapters 13 and 14: annotations on variables, parameters and return values, inference, any, object types, interfaces, union types and literal types."
  },
  {
    "id": "ts-narrowing",
    "authors": [
      "The TypeScript team (Microsoft)"
    ],
    "title": "Narrowing (TypeScript Handbook)",
    "venue": "typescriptlang.org",
    "year": null,
    "doi": null,
    "url": "https://www.typescriptlang.org/docs/handbook/2/narrowing.html",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://github.com/microsoft/TypeScript-Website/blob/v2/packages/documentation/copy/en/handbook-v2/Narrowing.md",
    "shaped": "Chapter 14: typeof type guards, discriminated unions, the never type and exhaustiveness checking."
  },
  {
    "id": "ts-generics",
    "authors": [
      "The TypeScript team (Microsoft)"
    ],
    "title": "Generics (TypeScript Handbook)",
    "venue": "typescriptlang.org",
    "year": null,
    "doi": null,
    "url": "https://www.typescriptlang.org/docs/handbook/2/generics.html",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://github.com/microsoft/TypeScript-Website/blob/v2/packages/documentation/copy/en/handbook-v2/Type%20Manipulation/Generics.md",
    "shaped": "Chapter 14: type parameters, Array<Type>, and generic functions."
  },
  {
    "id": "estree",
    "authors": [
      "ESTree contributors"
    ],
    "title": "The ESTree Spec (es5.md: Node objects)",
    "venue": "github.com/estree/estree",
    "year": null,
    "doi": null,
    "url": "https://github.com/estree/estree/blob/master/es5.md",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://github.com/estree/estree/blob/master/es5.md",
    "shaped": "Chapter 14: real JavaScript ASTs are a discriminated union; every ESTree node has a string `type` field that says which kind of node it is."
  },
  {
    "id": "node-test",
    "authors": [
      "Node.js contributors"
    ],
    "title": "Test runner (node:test)",
    "venue": "Node.js documentation",
    "year": null,
    "doi": null,
    "url": "https://nodejs.org/api/test.html",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://github.com/nodejs/node/blob/main/doc/api/test.md",
    "shaped": "Chapter 15: Node’s built-in test runner, for running tests outside the book."
  },
  {
    "id": "node-assert",
    "authors": [
      "Node.js contributors"
    ],
    "title": "Assert (node:assert)",
    "venue": "Node.js documentation",
    "year": null,
    "doi": null,
    "url": "https://nodejs.org/api/assert.html",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://github.com/nodejs/node/blob/main/doc/api/assert.md",
    "shaped": "Chapter 15: assert.strictEqual, Node’s built-in assertion functions."
  },
  {
    "id": "csmith",
    "authors": [
      "Xuejun Yang",
      "Yang Chen",
      "Eric Eide",
      "John Regehr"
    ],
    "title": "Csmith: a random generator of C programs",
    "venue": "github.com/csmith-project/csmith (README)",
    "year": null,
    "doi": null,
    "url": "https://github.com/csmith-project/csmith",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://github.com/csmith-project/csmith/blob/master/README.md",
    "shaped": "Chapter 15: a real tool that finds compiler bugs with random programs, “using differential testing as the test oracle”."
  },
  {
    "id": "test262",
    "authors": [
      "Ecma TC39 and Test262 contributors"
    ],
    "title": "Test262: ECMAScript Test Suite",
    "venue": "github.com/tc39/test262",
    "year": null,
    "doi": null,
    "url": "https://github.com/tc39/test262",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://github.com/tc39/test262/blob/main/README.md",
    "shaped": "Chapter 15: the official conformance test suite for the JavaScript language (over 50,000 test files as of May 2025, per its README)."
  },
  {
    "id": "mdn-number",
    "authors": [
      "MDN contributors"
    ],
    "title": "Number",
    "venue": "MDN Web Docs",
    "year": null,
    "doi": null,
    "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://github.com/mdn/content/blob/main/files/en-us/web/javascript/reference/global_objects/number/index.md",
    "shaped": "Chapter 16: every JavaScript number is a double-precision 64-bit IEEE 754 value; integers are exact only up to 2^53 − 1."
  },
  {
    "id": "mdn-arraybuffer",
    "authors": [
      "MDN contributors"
    ],
    "title": "ArrayBuffer",
    "venue": "MDN Web Docs",
    "year": null,
    "doi": null,
    "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://github.com/mdn/content/blob/main/files/en-us/web/javascript/reference/global_objects/arraybuffer/index.md",
    "shaped": "Chapter 16: an ArrayBuffer is raw bytes that you read and write through views."
  },
  {
    "id": "mdn-typedarray",
    "authors": [
      "MDN contributors"
    ],
    "title": "TypedArray",
    "venue": "MDN Web Docs",
    "year": null,
    "doi": null,
    "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://github.com/mdn/content/blob/main/files/en-us/web/javascript/reference/global_objects/typedarray/index.md",
    "shaped": "Chapter 16: value encoding and normalization (two’s complement for signed integers, IEEE 754 for floats, out-of-range values normalized), the platform’s native byte order, zero-filled new typed arrays."
  },
  {
    "id": "mdn-bitwise-and",
    "authors": [
      "MDN contributors"
    ],
    "title": "Bitwise AND (&)",
    "venue": "MDN Web Docs",
    "year": null,
    "doi": null,
    "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Bitwise_AND",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://github.com/mdn/content/blob/main/files/en-us/web/javascript/reference/operators/bitwise_and/index.md",
    "shaped": "Chapter 16: bitwise operators convert numbers to 32-bit integers in two’s complement and work bit by bit."
  },
  {
    "id": "apple-wwdc25-cpu",
    "authors": [
      "Apple Inc."
    ],
    "title": "Optimize CPU performance with Instruments (WWDC25 session 308)",
    "venue": "Apple Developer",
    "year": 2025,
    "doi": null,
    "url": "https://developer.apple.com/videos/play/wwdc2025/308/",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://developer.apple.com/videos/play/wwdc2025/308/ (the session transcript on that page)",
    "shaped": "Chapters 18–20: a CPU follows a list of instructions, modifying registers and memory; instructions are fetched and decoded, then executed; Apple silicon CPUs are pipelined and use branch predictors that guess wrong when a branch has no consistent pattern; L1 caches inside each CPU, a larger, slower L2, and main memory about 50 times slower than the fast path on those chips; caches move memory in 64- or 128-byte cache lines."
  },
  {
    "id": "slotin-amh-hierarchy",
    "authors": [
      "Sergey Slotin"
    ],
    "title": "Memory Hierarchy, in Algorithms for Modern Hardware",
    "venue": "algorithmica.org (open online book)",
    "year": null,
    "doi": null,
    "url": "https://en.algorithmica.org/hpc/external-memory/hierarchy/",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://github.com/algorithmica-org/algorithmica/blob/master/content/english/hpc/external-memory/hierarchy.md",
    "shaped": "Chapter 18: the approximate 2021 commodity-hardware table (L1 about 2 ns, L2 about 5 ns, L3 about 20 ns, RAM about 100 ns, all moving 64-byte blocks); registers as the fastest storage; each level usually much faster but smaller than the next."
  },
  {
    "id": "slotin-amh-pipelining",
    "authors": [
      "Sergey Slotin"
    ],
    "title": "Instruction-Level Parallelism, in Algorithms for Modern Hardware",
    "venue": "algorithmica.org (open online book)",
    "year": null,
    "doi": null,
    "url": "https://en.algorithmica.org/hpc/pipelining/",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://github.com/algorithmica-org/algorithmica/blob/master/content/english/hpc/pipelining/_index.md",
    "shaped": "Chapters 18 and 20: the stages of running an instruction (fetch, decode, execute, memory, write back); pipelining starts the next instruction before the previous one finishes; most modern CPUs are superscalar."
  },
  {
    "id": "slotin-amh-cache-lines",
    "authors": [
      "Sergey Slotin"
    ],
    "title": "Cache Lines, in Algorithms for Modern Hardware",
    "venue": "algorithmica.org (open online book)",
    "year": null,
    "doi": null,
    "url": "https://en.algorithmica.org/hpc/cpu-cache/cache-lines/",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://github.com/algorithmica-org/algorithmica/blob/master/content/english/hpc/cpu-cache/cache-lines.md",
    "shaped": "Chapter 19: caches transfer whole cache lines, 64 bytes on most architectures; reading one byte fetches its neighbours too; a loop touching every 16th int takes about as long as touching every int once the array is large; count cache lines, not reads."
  },
  {
    "id": "slotin-amh-locality",
    "authors": [
      "Sergey Slotin"
    ],
    "title": "Spatial and Temporal Locality, in Algorithms for Modern Hardware",
    "venue": "algorithmica.org (open online book)",
    "year": null,
    "doi": null,
    "url": "https://en.algorithmica.org/hpc/external-memory/locality/",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://github.com/algorithmica-org/algorithmica/blob/master/content/english/hpc/external-memory/locality.md",
    "shaped": "Chapter 19: definitions of temporal locality (the same data again soon) and spatial locality (nearby data next)."
  },
  {
    "id": "linux-x86-kconfig-cpu",
    "authors": [
      "Linux kernel contributors"
    ],
    "title": "arch/x86/Kconfig.cpu (X86_L1_CACHE_SHIFT)",
    "venue": "Linux kernel source",
    "year": null,
    "doi": null,
    "url": "https://github.com/torvalds/linux/blob/master/arch/x86/Kconfig.cpu",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/torvalds/linux/master/arch/x86/Kconfig.cpu and https://raw.githubusercontent.com/torvalds/linux/master/arch/arm64/include/asm/cache.h",
    "shaped": "Chapter 19: the kernel assumes a cache line of 2^6 = 64 bytes for 64-bit x86 (X86_L1_CACHE_SHIFT defaults to 6 for X86_64) and for arm64 (L1_CACHE_SHIFT is 6)."
  },
  {
    "id": "wasm-simd",
    "authors": [
      "The WebAssembly Community Group (SIMD subgroup)"
    ],
    "title": "WebAssembly 128-bit packed SIMD Extension (proposal overview, SIMD.md)",
    "venue": "WebAssembly/simd repository on GitHub",
    "year": null,
    "doi": null,
    "url": "https://github.com/WebAssembly/simd/blob/main/proposals/simd/SIMD.md",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/WebAssembly/simd/main/proposals/simd/SIMD.md and https://raw.githubusercontent.com/WebAssembly/simd/main/README.md",
    "shaped": "Chapter 21: WebAssembly’s single v128 type, its lane interpretations (f64x2, f32x4, i32x4, ...), and instructions such as f64x2.add and v128.load; the proposal grew out of the SIMD.js work."
  },
  {
    "id": "wasm-finished-proposals",
    "authors": [
      "The WebAssembly Community Group"
    ],
    "title": "Finished Proposals",
    "venue": "WebAssembly/proposals repository on GitHub",
    "year": null,
    "doi": null,
    "url": "https://github.com/WebAssembly/proposals/blob/main/finished-proposals.md",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/WebAssembly/proposals/main/finished-proposals.md",
    "shaped": "Chapter 21: fixed-width SIMD is a finished proposal, part of WebAssembly 2.0 (relaxed SIMD followed in 3.0)."
  },
  {
    "id": "tc39-simdjs",
    "authors": [
      "Ecma TC39 (SIMD.js champions and contributors)"
    ],
    "title": "SIMD.js (ecmascript_simd): historical repository README",
    "venue": "tc39/ecmascript_simd repository on GitHub",
    "year": null,
    "doi": null,
    "url": "https://github.com/tc39/ecmascript_simd",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/tc39/ecmascript_simd/master/README.md",
    "shaped": "Chapter 21: SIMD.js was taken out of active development, removed from Stage 3, and is not being implemented by browsers; SIMD on the web moved to WebAssembly."
  },
  {
    "id": "llvm-vectorizers",
    "authors": [
      "The LLVM Project"
    ],
    "title": "Auto-Vectorization in LLVM",
    "venue": "LLVM documentation",
    "year": null,
    "doi": null,
    "url": "https://llvm.org/docs/Vectorizers.html",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/llvm/llvm-project/main/llvm/docs/Vectorizers.md",
    "shaped": "Chapter 21: what a loop vectorizer does (widens a loop to work on consecutive iterations), runtime overlap checks, why floating-point reductions need permission to reorder, and why strided gathers are often judged not worth it."
  },
  {
    "id": "ispc-perfguide",
    "authors": [
      "The Intel ISPC project"
    ],
    "title": "Intel ISPC Performance Guide: Use “Structure of Arrays” Layout When Possible",
    "venue": "ispc.github.io documentation",
    "year": null,
    "doi": null,
    "url": "https://ispc.github.io/perfguide.html",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/ispc/ispc/main/docs/perfguide.rst",
    "shaped": "Chapters 21 and 23: contiguous data allows vector loads and stores, while AoS fields need gathers; blocks of 8 (SoA inside each block) are the blocked compromise."
  },
  {
    "id": "v8-pointer-compression",
    "authors": [
      "Igor Sheludko",
      "Santiago Aboy Solanes"
    ],
    "title": "Pointer Compression in V8",
    "venue": "V8 blog (v8.dev), 30 March 2020",
    "year": 2020,
    "doi": null,
    "url": "https://v8.dev/blog/pointer-compression",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/v8/v8.dev/main/src/blog/pointer-compression.md",
    "shaped": "Chapter 22: value tagging (the lowest bit tells a Smi from a pointer), the 31-bit Smi payload with pointer compression and 32 bits on 64-bit builds without it, and the advice to keep number-crunching data in Float64 typed arrays."
  },
  {
    "id": "v8-react-cliff",
    "authors": [
      "Benedikt Meurer",
      "Mathias Bynens"
    ],
    "title": "The story of a V8 performance cliff in React",
    "venue": "V8 blog (v8.dev), 28 August 2019",
    "year": 2019,
    "doi": null,
    "url": "https://v8.dev/blog/react-cliff",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/v8/v8.dev/main/src/blog/react-cliff.md",
    "shaped": "Chapter 22: Smi vs HeapNumber, immutable HeapNumbers (an update allocates), Smi and Double field representations, representation changes, and the advice not to start numeric fields as null."
  },
  {
    "id": "v8-fast-properties",
    "authors": [
      "Camillo Bruni"
    ],
    "title": "Fast properties in V8",
    "venue": "V8 blog (v8.dev), 30 August 2017",
    "year": 2017,
    "doi": null,
    "url": "https://v8.dev/blog/fast-properties",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/v8/v8.dev/main/src/blog/fast-properties.md and its figure src/_img/fast-properties/in-object-properties.png",
    "shaped": "Chapter 22: the object header (hidden class, properties and elements pointers) followed by in-object properties."
  },
  {
    "id": "mdn-class-fields",
    "authors": [
      "MDN contributors"
    ],
    "title": "Public class fields",
    "venue": "MDN Web Docs",
    "year": null,
    "doi": null,
    "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Public_class_fields",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://github.com/mdn/content/blob/main/files/en-us/web/javascript/reference/classes/public_class_fields/index.md",
    "shaped": "Chapter 22: fields are added before the base-class constructor body runs, and fields without initializers start as undefined."
  },
  {
    "id": "ts-use-define",
    "authors": [
      "The TypeScript team"
    ],
    "title": "TSConfig reference: useDefineForClassFields",
    "venue": "typescriptlang.org",
    "year": null,
    "doi": null,
    "url": "https://www.typescriptlang.org/tsconfig/#useDefineForClassFields",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://github.com/microsoft/TypeScript-Website/blob/v2/packages/tsconfig-reference/copy/en/options/useDefineForClassFields.md and the defaults table in packages/tsconfig-reference/scripts/tsconfigRules.ts (true when target is ES2022 or higher)",
    "shaped": "Chapter 22: with modern targets, TypeScript emits standard class fields for declarations like x: number;."
  },
  {
    "id": "ts-37-declare",
    "authors": [
      "The TypeScript team"
    ],
    "title": "TypeScript 3.7 release notes: the useDefineForClassFields flag and the declare property modifier",
    "venue": "typescriptlang.org handbook",
    "year": 2019,
    "doi": null,
    "url": "https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-7.html",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://github.com/microsoft/TypeScript-Website/blob/v2/packages/documentation/copy/en/release-notes/TypeScript%203.7.md",
    "shaped": "Chapter 22: a declare modifier on a field produces no output code, so the field is created only by the constructor."
  },
  {
    "id": "v8-maglev",
    "authors": [
      "Toon Verwaest",
      "Leszek Swirski",
      "Victor Gomes",
      "Olivier Flückiger",
      "Darius Mercadier",
      "Camillo Bruni"
    ],
    "title": "Maglev - V8’s Fastest Optimizing JIT",
    "venue": "V8 blog (v8.dev), 5 December 2023",
    "year": 2023,
    "doi": null,
    "url": "https://v8.dev/blog/maglev",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/v8/v8.dev/main/src/blog/maglev.md",
    "shaped": "Chapter 24: V8’s tiers (Ignition, Sparkplug, Maglev, TurboFan), runtime feedback about object shapes and types, speculative optimized code and deoptimization."
  },
  {
    "id": "llvm-passes",
    "authors": [
      "The LLVM Project"
    ],
    "title": "LLVM’s Analysis and Transform Passes",
    "venue": "LLVM documentation",
    "year": null,
    "doi": null,
    "url": "https://llvm.org/docs/Passes.html",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/llvm/llvm-project/main/llvm/docs/Passes.md (the dce and adce entries)",
    "shaped": "Chapter 24: dead code elimination as a standard optimizing-compiler pass."
  },
  {
    "id": "mdn-performance-now",
    "authors": [
      "MDN contributors"
    ],
    "title": "Performance: now() method",
    "venue": "MDN Web Docs",
    "year": null,
    "doi": null,
    "url": "https://developer.mozilla.org/en-US/docs/Web/API/Performance/now",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://github.com/mdn/content/blob/main/files/en-us/web/api/performance/now/index.md",
    "shaped": "Chapter 24: performance.now() is a high-resolution timer, coarsened in browsers to 100 microseconds (5 in cross-origin-isolated pages)."
  },
  {
    "id": "mdn-execution-model",
    "authors": [
      "MDN contributors"
    ],
    "title": "JavaScript execution model",
    "venue": "MDN Web Docs",
    "year": null,
    "doi": null,
    "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Execution_model",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://github.com/mdn/content/blob/main/files/en-us/web/javascript/reference/execution_model/index.md",
    "shaped": "Chapter 17: a JavaScript agent keeps a heap of objects (a large, mostly unstructured region filled as objects are created) and a stack of execution contexts, one frame per active call."
  },
  {
    "id": "slotin-amh-prefetching",
    "authors": [
      "Sergey Slotin"
    ],
    "title": "Prefetching, in Algorithms for Modern Hardware",
    "venue": "algorithmica.org (open online book)",
    "year": null,
    "doi": null,
    "url": "https://en.algorithmica.org/hpc/cpu-cache/prefetching/",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://github.com/algorithmica-org/algorithmica/blob/master/content/english/hpc/cpu-cache/prefetching.md",
    "shaped": "Chapter 20: the hardware prefetcher watches memory accesses and loads the next cache lines early; it detects only simple patterns (forward or backward, several arrays at once, small-to-medium strides)."
  },
  {
    "id": "slotin-amh-latency",
    "authors": [
      "Sergey Slotin"
    ],
    "title": "Memory Latency, in Algorithms for Modern Hardware",
    "venue": "algorithmica.org (open online book)",
    "year": null,
    "doi": null,
    "url": "https://en.algorithmica.org/hpc/cpu-cache/latency/",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://github.com/algorithmica-org/algorithmica/blob/master/content/english/hpc/cpu-cache/latency.md",
    "shaped": "Chapter 20: following a random permutation (pointer chasing) is orders of magnitude slower than linear iteration, because each load waits for the previous one; common in heap-allocated, pointer-heavy data structures."
  },
  {
    "id": "slotin-amh-branching",
    "authors": [
      "Sergey Slotin"
    ],
    "title": "The Cost of Branching, in Algorithms for Modern Hardware",
    "venue": "algorithmica.org (open online book)",
    "year": null,
    "doi": null,
    "url": "https://en.algorithmica.org/hpc/pipelining/branching/",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://github.com/algorithmica-org/algorithmica/blob/master/content/english/hpc/pipelining/branching.md",
    "shaped": "Chapter 20: CPUs speculatively execute the likelier side of a branch; a mispredicted branch discards the pipeline; summing elements below 50 of random data is several times slower than the same loop over sorted data; predictors learn patterns, and almost-never-taken checks cost almost nothing."
  },
  {
    "id": "slotin-amh-mlp",
    "authors": [
      "Sergey Slotin"
    ],
    "title": "Memory-Level Parallelism, in Algorithms for Modern Hardware",
    "venue": "algorithmica.org (open online book)",
    "year": null,
    "doi": null,
    "url": "https://en.algorithmica.org/hpc/cpu-cache/mlp/",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://github.com/algorithmica-org/algorithmica/blob/master/content/english/hpc/cpu-cache/mlp.md",
    "shaped": "Chapter 20: memory requests can overlap; linear iteration is far faster than pointer jumping because the CPU knows the next addresses and sends requests ahead of time."
  },
  {
    "id": "v8-ignition",
    "authors": [
      "Ross McIlroy"
    ],
    "title": "Firing up the Ignition interpreter",
    "venue": "V8 blog (v8.dev), 23 August 2016",
    "year": 2016,
    "doi": null,
    "url": "https://v8.dev/blog/ignition-interpreter",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/v8/v8.dev/main/src/blog/ignition-interpreter.md (the post’s source in the v8.dev repository; v8.dev itself was not reachable from the writing session)",
    "shaped": "Chapter 25: V8 compiles JavaScript functions to a compact bytecode that an interpreter (Ignition) runs, with optimizing compilers re-compiling hot code; Ignition is a register machine with an accumulator rather than a stack machine."
  },
  {
    "id": "ecma262",
    "authors": [
      "Ecma International, Technical Committee 39 (TC39)"
    ],
    "title": "ECMAScript® Language Specification (ECMA-262), current draft",
    "venue": "Ecma International; living draft at tc39.es/ecma262, source at github.com/tc39/ecma262",
    "year": null,
    "doi": null,
    "url": "https://tc39.es/ecma262/",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://github.com/tc39/ecma262 (README.md: “the source for the current draft of ECMA-262, the ECMAScript® Language Specification”; spec.html metadata title “ECMAScript 2027 Language Specification”, and the opening paragraphs of clause “ECMAScript Language: Lexical Grammar”). tc39.es was not reachable from the writing session.",
    "shaped": "Chapter 26: JavaScript’s language specification as the example of a precise spec. Chapter 28: the spec’s rule that source text is scanned left to right, “repeatedly taking the longest possible sequence of code points as the next input element” (maximal munch), and the following paragraph: which lexical goal symbol applies (e.g. InputElementDiv vs InputElementRegExp) depends on the syntactic grammar context, because `/` may begin division or a regular expression."
  },
  {
    "id": "ecma262-keywords",
    "authors": [
      "Ecma International, TC39"
    ],
    "title": "ECMAScript Language Specification (ECMA-262), “Keywords and Reserved Words”",
    "venue": "Ecma International; living draft at tc39.es/ecma262",
    "year": null,
    "doi": null,
    "url": "https://tc39.es/ecma262/#sec-keywords-and-reserved-words",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://github.com/tc39/ecma262/blob/main/spec.html (the source the draft is built from, commit 0de5cb15; emu-clause id=\"sec-keywords-and-reserved-words\"). tc39.es itself was not fetched from this session.",
    "shaped": "Chapter 29: JavaScript separates keywords from reserved words; `if` and `while` are both, while `async` is a keyword that is not reserved and may be used as a variable name."
  },
  {
    "id": "ecma262-grammar",
    "authors": [
      "Ecma International, TC39"
    ],
    "title": "ECMAScript Language Specification (ECMA-262), “Notational Conventions: Syntactic and Lexical Grammars”",
    "venue": "Ecma International; living draft at tc39.es/ecma262",
    "year": null,
    "doi": null,
    "url": "https://tc39.es/ecma262/#sec-syntactic-and-lexical-grammars",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://github.com/tc39/ecma262/blob/main/spec.html (the source the draft is built from, commit 0de5cb15; clauses “Context-Free Grammars” and “Grammar Notation”, including the WhileStatement and ArgumentList examples and the “opt” suffix). tc39.es itself was not fetched from this session.",
    "shaped": "Chapter 30: JavaScript’s syntax is specified as a context-free grammar of productions, with nonterminals on the left, tokens as terminal symbols, recursive rules for lists, and an “opt” suffix for optional symbols."
  },
  {
    "id": "ecma262-operators",
    "authors": [
      "Ecma International, TC39"
    ],
    "title": "ECMAScript Language Specification (ECMA-262), “Multiplicative Operators” and “Additive Operators”",
    "venue": "Ecma International; living draft at tc39.es/ecma262",
    "year": null,
    "doi": null,
    "url": "https://tc39.es/ecma262/#sec-additive-operators",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://github.com/tc39/ecma262/blob/main/spec.html (the source the draft is built from, commit 0de5cb15; emu-clauses id=\"sec-multiplicative-operators\" and id=\"sec-additive-operators\", whose Syntax sections define AdditiveExpression in terms of MultiplicativeExpression). tc39.es itself was not fetched from this session.",
    "shaped": "Chapter 32: JavaScript’s grammar encodes precedence with one nonterminal per level (AdditiveExpression built from MultiplicativeExpression), using left-recursive rules for left associativity."
  },
  {
    "id": "mdn-logical-or",
    "authors": [
      "MDN contributors"
    ],
    "title": "Logical OR (||)",
    "venue": "MDN Web Docs",
    "year": null,
    "doi": null,
    "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Logical_OR",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/mdn/content/main/files/en-us/web/javascript/reference/operators/logical_or/index.md (MDN’s own source repository): “the || operator actually returns the value of one of the specified operands”, and the section on short-circuit evaluation",
    "shaped": "Chapter 38: JavaScript’s || short-circuits and returns one of its operands rather than a boolean, just like Drip’s or."
  },
  {
    "id": "mdn-function-length",
    "authors": [
      "MDN contributors"
    ],
    "title": "Function: length",
    "venue": "MDN Web Docs",
    "year": null,
    "doi": null,
    "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/length",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/mdn/content/main/files/en-us/web/javascript/reference/global_objects/function/length/index.md (MDN’s own source repository): “indicates the number of parameters expected by the function”, contrasted with arguments.length, the number actually passed",
    "shaped": "Chapter 39: JavaScript records a function’s arity as f.length but does not enforce it, unlike Drip."
  },
  {
    "id": "v8-sparkplug",
    "authors": [
      "Leszek Swirski"
    ],
    "title": "Sparkplug — a non-optimizing JavaScript compiler",
    "venue": "V8 blog (v8.dev), 27 May 2021",
    "year": 2021,
    "doi": null,
    "url": "https://v8.dev/blog/sparkplug",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/v8/v8.dev/main/src/blog/sparkplug.md (the post’s source in the v8.dev repository; read in full from the writing session, v8.dev itself not opened)",
    "shaped": "Chapters 45, 47 and 48: interpreters have inherent bytecode-decoding and dispatch overheads; dispatching to the next bytecode depends on branch prediction; Ignition’s interpreter frame keeps a pointer to the bytecode array and the offset of the current bytecode; Sparkplug compiles bytecode to machine code in one linear pass, its core a switch inside a for loop, with no intermediate representation, relying on the bytecode compiler having already done work such as variable resolution."
  },
  {
    "id": "lcn2-fnv",
    "authors": [
      "Landon Curt Noll"
    ],
    "title": "fnv: Fowler/Noll/Vo hash (reference implementation)",
    "venue": "Source repository by Landon Curt Noll, github.com/lcn2/fnv (README, hash_32a.c, fnv.h, test_fnv.c)",
    "year": null,
    "doi": null,
    "url": "https://github.com/lcn2/fnv",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/lcn2/fnv/master/README.md, hash_32a.c (FNV_32_PRIME 0x01000193; xor each octet, then multiply mod 2^32), fnv.h (FNV1_32A_INIT 0x811c9dc5) and test_fnv.c (FNV-1a 32 test vectors: \"\" = 0x811c9dc5, \"a\" = 0xe40c292c, \"foobar\" = 0xbf9cf968). isthe.com and the IETF datatracker/rfc-editor were not reachable from the writing session, so the author’s own GitHub source was used.",
    "shaped": "Chapter 51: FNV-1a, its 32-bit offset basis and prime, the xor-then-multiply order, its authors, and the test vectors the exercise checks against."
  },
  {
    "id": "mdn-math-imul",
    "authors": [
      "MDN contributors"
    ],
    "title": "Math.imul()",
    "venue": "MDN Web Docs",
    "year": null,
    "doi": null,
    "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/imul",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/mdn/content/main/files/en-us/web/javascript/reference/global_objects/math/imul/index.md (the source MDN publishes the page from; developer.mozilla.org itself was unreachable from this session)",
    "shaped": "Chapter 51: Math.imul performs C-like 32-bit integer multiplication, which FNV-1a needs."
  },
  {
    "id": "mdn-unsigned-right-shift",
    "authors": [
      "MDN contributors"
    ],
    "title": "Unsigned right shift (>>>)",
    "venue": "MDN Web Docs",
    "year": null,
    "doi": null,
    "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Unsigned_right_shift",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/mdn/content/main/files/en-us/web/javascript/reference/operators/unsigned_right_shift/index.md (the source MDN publishes the page from; developer.mozilla.org itself was unreachable from this session)",
    "shaped": "Chapter 51: >>> fills with zero bits so the result is never negative; x >>> 0 reads a 32-bit pattern as an unsigned number."
  },
  {
    "id": "cpython-dictobject",
    "authors": [
      "Python Software Foundation and CPython contributors"
    ],
    "title": "Objects/dictobject.c (CPython dictionary implementation, design comments)",
    "venue": "CPython source repository, github.com/python/cpython, main branch",
    "year": null,
    "doi": null,
    "url": "https://github.com/python/cpython/blob/main/Objects/dictobject.c",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/python/cpython/main/Objects/dictobject.c (comments on slot states incl. Dummy slots that cannot become Unused again; resize at USABLE_FRACTION, two-thirds full; probe recurrence j = 5*j + 1 + perturb mixing in higher hash bits)",
    "shaped": "Chapter 51: a production open-addressing table with tombstone-like dummy slots, a two-thirds load limit and non-linear probing."
  },
  {
    "id": "python-sys-intern",
    "authors": [
      "Python Software Foundation"
    ],
    "title": "sys.intern(string), in: sys — System-specific parameters and functions",
    "venue": "The Python Standard Library documentation",
    "year": null,
    "doi": null,
    "url": "https://docs.python.org/3/library/sys.html#sys.intern",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/python/cpython/main/Doc/library/sys.rst (the source the documentation is built from; docs.python.org itself was unreachable from this session)",
    "shaped": "Chapter 52: Python interns names automatically, and interned dictionary keys let key comparisons after hashing be a pointer compare; interned strings are not immortal."
  },
  {
    "id": "openjdk-string-intern",
    "authors": [
      "OpenJDK contributors"
    ],
    "title": "java.lang.String#intern() (Javadoc in String.java)",
    "venue": "OpenJDK source repository, github.com/openjdk/jdk, master branch",
    "year": null,
    "doi": null,
    "url": "https://github.com/openjdk/jdk/blob/master/src/java.base/share/classes/java/lang/String.java",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/openjdk/jdk/master/src/java.base/share/classes/java/lang/String.java (Javadoc of intern(): a pool of strings maintained by String; s.intern() == t.intern() iff s.equals(t); all literal strings and string-valued constant expressions are interned)",
    "shaped": "Chapter 52: Java interns every string literal and offers intern() for other strings."
  },
  {
    "id": "cpython-dis",
    "authors": [
      "Python Software Foundation"
    ],
    "title": "dis: Disassembler for Python bytecode",
    "venue": "The Python Standard Library documentation (Python 3, current development version)",
    "year": null,
    "doi": null,
    "url": "https://docs.python.org/3/library/dis.html",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/python/cpython/main/Doc/library/dis.rst (the source the page is built from; docs.python.org was not reachable from the writing session). Entries read: LOAD_GLOBAL (namei) “Loads the global named co_names[namei>>1] onto the stack”; LOAD_FAST (var_num) “Pushes a reference to the local co_varnames[var_num] onto the stack”; STORE_FAST; JUMP_FORWARD (delta) “Increments bytecode counter by delta”; JUMP_BACKWARD (delta); POP_JUMP_IF_FALSE (delta) “If STACK[-1] is false, increments the bytecode counter by delta. STACK[-1] is popped.”",
    "shaped": "Chapters 53–55: CPython names globals by an index into a table of names but locals by a plain index, and its conditional jump pops the condition (unlike Drip’s JUMP_IF_FALSE, which peeks)."
  },
  {
    "id": "lua-lfunc",
    "authors": [
      "Roberto Ierusalimschy",
      "Luiz Henrique de Figueiredo",
      "Waldemar Celes"
    ],
    "title": "lfunc.c: auxiliary functions to manipulate prototypes and closures (Lua source code)",
    "venue": "The Lua programming language, official source repository (github.com/lua/lua), Lua.org, PUC-Rio",
    "year": 2026,
    "doi": null,
    "url": "https://github.com/lua/lua/blob/master/lfunc.c",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/lua/lua/master/lfunc.c (luaF_findupval and luaF_closeupval) and lua.h (LUA_AUTHORS, copyright 1994–2026 Lua.org, PUC-Rio)",
    "shaped": "Chapter 57: open upvalues kept on a list in stack order and reused when found (luaF_findupval), and closing an upvalue by moving the value into the upvalue and repointing its value pointer there (luaF_closeupval)."
  },
  {
    "id": "v8-trash-talk",
    "authors": [
      "Peter Marshall"
    ],
    "title": "Trash talk: the Orinoco garbage collector",
    "venue": "V8 blog (v8.dev), 3 January 2019",
    "year": 2019,
    "doi": null,
    "url": "https://v8.dev/blog/trash-talk",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/v8/v8.dev/main/src/blog/trash-talk.md (the post’s source in the v8.dev repository)",
    "shaped": "Chapters 58 and 60: marking from a root set that includes the execution stack and the global object; sweeping into free-lists and compacting some pages; the generational hypothesis (most objects die young); the young generation (nursery and intermediate) and the old generation; the Scavenger copying survivors, with old-to-new references kept by write barriers as extra roots."
  },
  {
    "id": "v8-concurrent-marking",
    "authors": [
      "Ulan Degenbaev",
      "Michael Lippautz",
      "Hannes Payer"
    ],
    "title": "Concurrent marking in V8",
    "venue": "V8 blog (v8.dev), 11 June 2018",
    "year": 2018,
    "doi": null,
    "url": "https://v8.dev/blog/concurrent-marking",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/v8/v8.dev/main/src/blog/concurrent-marking.md (the post’s source in the v8.dev repository)",
    "shaped": "Chapter 58: tri-colour marking with two mark bits per object (white, grey, black) and a marking worklist; the write barrier that keeps a black object from pointing at a white one while marking runs concurrently."
  },
  {
    "id": "spidermonkey-value",
    "authors": [
      "Mozilla contributors"
    ],
    "title": "js/public/Value.h: JS::Value, SpiderMonkey’s representation of JavaScript values (Firefox source code)",
    "venue": "Firefox source repository (github.com/mozilla-firefox/firefox), Mozilla",
    "year": 2026,
    "doi": null,
    "url": "https://github.com/mozilla-firefox/firefox/blob/main/js/public/Value.h",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/mozilla-firefox/firefox/main/js/public/Value.h (header comment: non-number values stored in NaN bit patterns with a tag field; NUNBOX32 and PUNBOX64 boxing modes; in PUNBOX64 the tag is stored in the 5 most significant fraction bits next to the exponent, with 47 pointer bits; setDouble and setNumber canonicalize NaNs)",
    "shaped": "Chapter 60: a production JavaScript engine that NaN-boxes its values, packing a tag next to the exponent and a pointer into the remaining bits, and canonicalizing NaNs."
  },
  {
    "id": "cpython-superinstructions",
    "authors": [
      "Python Software Foundation and CPython contributors"
    ],
    "title": "CPython: Python/flowgraph.c (insert_superinstructions) and the dis module documentation (LOAD_FAST_LOAD_FAST)",
    "venue": "CPython source repository (github.com/python/cpython), main branch; docs.python.org",
    "year": 2026,
    "doi": null,
    "url": "https://github.com/python/cpython/blob/main/Python/flowgraph.c",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/python/cpython/main/Python/flowgraph.c (make_super_instruction and insert_superinstructions: within each basic block, adjacent LOAD_FAST pairs become LOAD_FAST_LOAD_FAST when both opargs are below 16, packed as (a << 4) | b, and the second instruction becomes a NOP) and https://raw.githubusercontent.com/python/cpython/main/Doc/library/dis.rst (LOAD_FAST_LOAD_FAST, “versionadded 3.13”)",
    "shaped": "Chapter 60: a real interpreter’s compiler inserting superinstructions for a common instruction pair."
  },
  {
    "id": "v8-constant-folding-reducer",
    "authors": [
      "The V8 project authors"
    ],
    "title": "constant-folding-reducer.cc: TurboFan’s ConstantFoldingReducer (V8 source code)",
    "venue": "V8 JavaScript engine, official source repository (github.com/v8/v8), src/compiler",
    "year": 2018,
    "doi": null,
    "url": "https://github.com/v8/v8/blob/main/src/compiler/constant-folding-reducer.cc",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/v8/v8/main/src/compiler/constant-folding-reducer.cc and constant-folding-reducer.h (TryGetConstant and ConstantFoldingReducer::Reduce; copyright 2018 the V8 project authors)",
    "shaped": "Chapter 80: TurboFan replaces an eliminatable, typed node whose type is a single value (null, undefined, -0, NaN, one heap constant, or one plain number) with that constant."
  },
  {
    "id": "v8-release-61",
    "authors": [
      "The V8 team"
    ],
    "title": "V8 release v6.1",
    "venue": "V8 blog (v8.dev), 3 August 2017",
    "year": 2017,
    "doi": null,
    "url": "https://v8.dev/blog/v8-release-61",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/v8/v8.dev/main/src/blog/v8-release-61.md (front matter: title, author “the V8 team”, date 2017-08-03; the sentence “Array.prototype.forEach is now inlined in TurboFan and optimized for all major non-holey elements kinds”)",
    "shaped": "Chapter 82: an example of V8’s optimizing compiler (TurboFan) inlining a call, Array.prototype.forEach."
  },
  {
    "id": "v8-array-sort",
    "authors": [
      "Simon Zünd"
    ],
    "title": "Getting things sorted in V8",
    "venue": "V8 blog (v8.dev), 28 September 2018",
    "year": 2018,
    "doi": null,
    "url": "https://v8.dev/blog/array-sort",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/v8/v8.dev/main/src/blog/array-sort.md (front matter: title, author Simon Zünd, date 2018-09-28; the Microbenchmarks section: the JavaScript version “allows the optimizing compiler to inline the comparison function”, while the Torque version has call overhead from the builtin to JavaScript)",
    "shaped": "Chapter 82: when Array.prototype.sort was written in JavaScript, V8’s optimizing compiler could inline the user’s comparison function."
  },
  {
    "id": "v8-retiring-octane",
    "authors": [
      "The V8 team"
    ],
    "title": "Retiring Octane",
    "venue": "V8 blog (v8.dev), 12 April 2017",
    "year": 2017,
    "doi": null,
    "url": "https://v8.dev/blog/retiring-octane",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/v8/v8.dev/main/src/blog/retiring-octane.md (front matter: title, author “the V8 team”, date 2017-04-12; the paragraph saying Octane “encourages aggressive inlining to minimize the overhead of function calls, but inlining strategies that are tailored to Octane have led to regressions from increased compilation costs and higher memory usage in real-world use cases”)",
    "shaped": "Chapter 82: the cost side of inlining: heuristics tuned to a benchmark increased compile time and memory use in real code."
  },
  {
    "id": "llvm-loop-terminology",
    "authors": [
      "The LLVM Project"
    ],
    "title": "LLVM Loop Terminology (and Canonical Forms)",
    "venue": "LLVM documentation",
    "year": null,
    "doi": null,
    "url": "https://llvm.org/docs/LoopTerminology.html",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/llvm/llvm-project/main/llvm/docs/LoopTerminology.md (“Loop Definition”: a strongly connected subset of CFG nodes whose entry edges all go to one header, which dominates the loop, “often called a natural loop”; “Terminology”: entering block, preheader, latch, backedge, exiting and exit blocks)",
    "shaped": "Chapter 83: the definition of a natural loop and the names header, latch, back edge and preheader."
  },
  {
    "id": "llvm-alias-analysis",
    "authors": [
      "The LLVM Project"
    ],
    "title": "LLVM Alias Analysis Infrastructure",
    "venue": "LLVM documentation",
    "year": null,
    "doi": null,
    "url": "https://llvm.org/docs/AliasAnalysis.html",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/llvm/llvm-project/main/llvm/docs/AliasAnalysis.md (Introduction: alias analysis “attempt[s] to determine whether or not two pointers ever can point to the same object in memory”, answering Must, May or No; “The alias method”: returns MustAlias, PartialAlias, MayAlias, or NoAlias)",
    "shaped": "Chapter 84: the must / may / no alias answers, and alias analysis as deciding whether two pointers can refer to the same object."
  },
  {
    "id": "v8-launch-ignition-turbofan",
    "authors": [
      "The V8 team"
    ],
    "title": "Launching Ignition and TurboFan",
    "venue": "V8 blog (v8.dev), 15 May 2017",
    "year": 2017,
    "doi": null,
    "url": "https://v8.dev/blog/launching-ignition-and-turbofan",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/v8/v8.dev/main/src/blog/launching-ignition-and-turbofan.md (the post’s source in the v8.dev repository, read in full; v8.dev itself not opened). Read: V8 v5.9 / Chrome 59 uses Ignition and TurboFan “universally and exclusively”; Full-codegen and Crankshaft, used since 2010, retired; Ignition’s original motivation was memory on mobile; TurboFan compiles optimized code directly from Ignition bytecode instead of re-parsing source as Crankshaft did; Ignition’s bytecode handlers are generated by TurboFan.",
    "shaped": "Chapter 61: the 2017 switch to an interpreter-first pipeline, and TurboFan compiling from bytecode rather than from source."
  },
  {
    "id": "v8-src-tiering-12-4",
    "authors": [
      "The V8 project authors"
    ],
    "title": "V8 source code at tag 12.4.254.21: src/flags/flag-definitions.h, src/execution/tiering-manager.cc and src/interpreter/interpreter-assembler.cc",
    "venue": "V8 source repository (github.com/v8/v8), tag 12.4.254.21 (the V8 inside Node v22.23.4)",
    "year": 2024,
    "doi": null,
    "url": "https://github.com/v8/v8/blob/12.4.254.21/src/execution/tiering-manager.cc",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/v8/v8/12.4.254.21/src/flags/flag-definitions.h (DEFINE_INT invocation_count_for_feedback_allocation 8, invocation_count_for_maglev 400, invocation_count_for_turbofan 3000; DEFINE_BOOL lazy_feedback_allocation true; DEFINE_INT max_valid_polymorphic_map_count 4) and https://raw.githubusercontent.com/v8/v8/12.4.254.21/src/execution/tiering-manager.cc (InterruptBudgetFor returns invocation_count_for_turbofan * bytecode_length, and the Maglev and feedback-allocation budgets the same way; the optimization reason “hot and stable”) and https://raw.githubusercontent.com/v8/v8/12.4.254.21/src/interpreter/interpreter-assembler.cc (DecreaseInterruptBudget is called on backward jumps with the jump distance as weight, and UpdateInterruptBudgetOnReturn charges the bytes from the start of the function to the return). The defaults were also confirmed locally with node --v8-options on Node v22.23.4, which also lists maglev as default --no-maglev in that build.",
    "shaped": "Chapters 61 and 64: how this V8 version measures hotness (a budget of a count times the bytecode length, spent on returns and loop back-jumps), the default thresholds, and the polymorphic limit of 4 maps."
  },
  {
    "id": "v8-src-interpreter-12-4",
    "authors": [
      "The V8 project authors"
    ],
    "title": "V8 source code at tag 12.4.254.21: src/interpreter/bytecodes.h and src/interpreter/interpreter-generator.cc",
    "venue": "V8 source repository (github.com/v8/v8), tag 12.4.254.21",
    "year": 2024,
    "doi": null,
    "url": "https://github.com/v8/v8/blob/12.4.254.21/src/interpreter/interpreter-generator.cc",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/v8/v8/12.4.254.21/src/interpreter/interpreter-generator.cc (“Ldar <src>: Load accumulator with value from register <src>”; “Add <src>: Add register <src> to accumulator”, implemented by BinaryOpWithFeedback, whose second operand is the feedback slot index; “GetNamedProperty <object> <name_index> <slot>: Calls the LoadIC at FeedBackVector slot <slot> for <object> and the name at constant pool entry <name_index>”) and https://raw.githubusercontent.com/v8/v8/12.4.254.21/src/interpreter/bytecodes.h (operand types of Ldar, Add and GetNamedProperty).",
    "shaped": "Chapters 61 and 64: reading real Ignition bytecode, the accumulator, and the feedback-slot operand that connects a bytecode to its inline cache."
  },
  {
    "id": "v8-leaving-sea-of-nodes",
    "authors": [
      "Darius Mercadier"
    ],
    "title": "Land ahoy: leaving the Sea of Nodes",
    "venue": "V8 blog (v8.dev), 25 March 2025",
    "year": 2025,
    "doi": null,
    "url": "https://v8.dev/blog/leaving-the-sea-of-nodes",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/v8/v8.dev/main/src/blog/leaving-the-sea-of-nodes.md (introduction: Turbofan used a Sea of Nodes IR; for almost three years V8 has been replacing it with a control-flow-graph IR called Turboshaft; the whole JavaScript backend of Turbofan now uses Turboshaft).",
    "shaped": "Chapter 61: the top tier keeps changing inside; in 2025 TurboFan’s JavaScript backend had moved to a CFG-based IR called Turboshaft."
  },
  {
    "id": "v8-preparser",
    "authors": [
      "Toon Verwaest",
      "Marja Hölttä"
    ],
    "title": "Blazingly fast parsing, part 2: lazy parsing",
    "venue": "V8 blog (v8.dev), 15 April 2019",
    "year": 2019,
    "doi": null,
    "url": "https://v8.dev/blog/preparser",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/v8/v8.dev/main/src/blog/preparser.md (read in full; v8.dev itself not opened). Read: all major browsers implement lazy parsing; the preparser verifies that skipped functions are syntactically valid and produces what outer functions need; a preparsed function is fully parsed and compiled when first called; it must track variable declarations and references to decide stack vs heap-allocated context; since V8 v6.3 / Chrome 63 inner functions are skipped using stored metadata, so any function is at most preparsed once and fully parsed once; PIFE heuristics: a parenthesized function expression, and since V8 v5.7 the !function pattern; eager compilation of everything has a significant memory cost; bytecode flushing can cause a re-parse.",
    "shaped": "Chapter 62: lazy parsing, why the preparser must still track variables, the double-parse cost, and the PIFE heuristic."
  },
  {
    "id": "v8-explicit-compile-hints",
    "authors": [
      "Marja Hölttä"
    ],
    "title": "Giving V8 a Heads-Up: Faster JavaScript Startup with Explicit Compile Hints",
    "venue": "V8 blog (v8.dev), 29 April 2025",
    "year": 2025,
    "doi": null,
    "url": "https://v8.dev/blog/explicit-compile-hints",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/v8/v8.dev/main/src/blog/explicit-compile-hints.md (read in full). Read: finding a function’s end requires parsing the full syntax, with no shortcut of counting braces; eager compilation can happen on a background thread while the script loads; in an experiment 17 of 20 popular pages improved; Chrome 136 ships the //# allFunctionsCalledOnLoad magic comment; the --log-function-events flag shows preparse, full-parse and parse-function events.",
    "shaped": "Chapter 62: why a preparser can’t just count braces, the 2025 explicit compile hints, and the --log-function-events experiment."
  },
  {
    "id": "v8-code-caching",
    "authors": [
      "Yang Guo"
    ],
    "title": "Code caching",
    "venue": "V8 blog (v8.dev), 27 July 2015",
    "year": 2015,
    "doi": null,
    "url": "https://v8.dev/blog/code-caching",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/v8/v8.dev/main/src/blog/code-caching.md (read in full). Read: available since V8 4.2 through the embedder API (kProduceCodeCache / kConsumeCodeCache); later compilations deserialize instead of compiling; Chrome produced cache data only for scripts seen at least twice within a couple of days.",
    "shaped": "Chapter 62: the idea of serializing compiled code so a later compile can skip work, as an API any embedder (such as Node) can use."
  },
  {
    "id": "v8-improved-code-caching",
    "authors": [
      "Mythri Alle"
    ],
    "title": "Improved code caching",
    "venue": "V8 blog (v8.dev), 24 April 2018",
    "year": 2018,
    "doi": null,
    "url": "https://v8.dev/blog/improved-code-caching",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/v8/v8.dev/main/src/blog/improved-code-caching.md (read in full). Read: from Chrome 66 the cache is generated after top-level execution, so it also contains lazily compiled functions that ran; 20–40% less parse and compile time; this became possible after Ignition (Chrome 59) because Ignition uses data-driven inline caches whose context-dependent data lives in feedback vectors, separate from the generated code; version mismatches make cached data unusable.",
    "shaped": "Chapters 62 and 64: caching after execution captures lazily compiled functions; feedback lives in feedback vectors, separate from bytecode."
  },
  {
    "id": "v8-code-caching-devs",
    "authors": [
      "Leszek Swirski"
    ],
    "title": "Code caching for JavaScript developers",
    "venue": "V8 blog (v8.dev), 8 April 2019, updated 16 June 2020",
    "year": 2019,
    "doi": null,
    "url": "https://v8.dev/blog/code-caching-for-devs",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/v8/v8.dev/main/src/blog/code-caching-for-devs.md (read up to the service-worker section). Read: code caching is also called bytecode caching; Chrome has an in-memory Isolate cache keyed by source with about an 80% real-world hit rate, and an on-disk cache managed by Blink; cold, warm and hot runs; caches are per script and keyed by URL; changing code clears them; only functions compiled by the end of top-level execution are cached; the minimum is 1 KiB of source; “heuristics can change”.",
    "shaped": "Chapter 62: how a browser’s bytecode cache works across cold, warm and hot runs, and why it is an implementation detail."
  },
  {
    "id": "node-vm-cached-data",
    "authors": [
      "Node.js contributors"
    ],
    "title": "Node.js v22 documentation: VM (executing JavaScript): cachedData, script.cachedDataRejected and script.createCachedData()",
    "venue": "Node.js documentation (nodejs.org), v22.x",
    "year": 2024,
    "doi": null,
    "url": "https://nodejs.org/docs/latest-v22.x/api/vm.html#scriptcreatecacheddata",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/nodejs/node/v22.x/doc/api/vm.md (the documentation source on the v22.x branch). Read: createCachedData (added v10.6.0) returns a Buffer usable with the cachedData option; lazily compiled functions are compiled when first invoked, and a cache created after running the script contains them (the add() example); cachedDataRejected is true or false depending on whether V8 accepted the data.",
    "shaped": "Chapter 62: the bytecode-cache experiment in Node, with sizes before and after running, and rejection after an edit."
  },
  {
    "id": "node-compile-cache",
    "authors": [
      "Node.js contributors"
    ],
    "title": "Node.js v22 documentation: Modules, module compile cache and module.enableCompileCache()",
    "venue": "Node.js documentation (nodejs.org), v22.x",
    "year": 2024,
    "doi": null,
    "url": "https://nodejs.org/docs/latest-v22.x/api/module.html#module-compile-cache",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/nodejs/node/v22.x/doc/api/module.md (section “Module compile cache”: added v22.1.0, enabled by module.enableCompileCache() (added v22.8.0) or NODE_COMPILE_CACHE=dir; uses an on-disk V8 code cache; may slow the first load; a cache from one Node.js version cannot be reused by another).",
    "shaped": "Chapter 62: Node’s own on-disk bytecode cache for modules."
  },
  {
    "id": "v8-slack-tracking",
    "authors": [
      "Michael Stanton"
    ],
    "title": "Slack tracking in V8",
    "venue": "V8 blog (v8.dev), 24 September 2020",
    "year": 2020,
    "doi": null,
    "url": "https://v8.dev/blog/slack-tracking",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/v8/v8.dev/main/src/blog/slack-tracking.md (the post’s source in the v8.dev repository; the opening sections read in full). Read: V8 calls shapes or hidden classes “maps”; in-object properties are the fastest because they avoid an indirection; slack tracking gives new objects extra in-object space, then returns the unused space; a counter in the map starts at seven constructions; the expected number of properties comes from the compiler, plus eight more (JSFunction::CalculateExpectedNofProperties).",
    "shaped": "Chapter 63: the name “map”, in-object slack, the counter of seven, and the plus-eight estimate, checked against a real %DebugPrint run (10 in-object slots shrinking to 2)."
  },
  {
    "id": "v8-src-map-12-4",
    "authors": [
      "The V8 project authors"
    ],
    "title": "V8 source code at tag 12.4.254.21: src/objects/map.h",
    "venue": "V8 source repository (github.com/v8/v8), tag 12.4.254.21 (the V8 inside Node v22.23.4)",
    "year": 2024,
    "doi": null,
    "url": "https://github.com/v8/v8/blob/12.4.254.21/src/objects/map.h",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/v8/v8/12.4.254.21/src/objects/map.h (comments: “[back pointer]: points back to the parent map from which a transition leads to this map”; is_dictionary_map “Tells whether the map is used for JSObjects in dictionary mode (ie normalized objects, ie objects for which HasFastProperties returns false). A map can never be used for both dictionary mode and fast mode JSObjects”; references to the map transition tree).",
    "shaped": "Chapter 63: reading the back pointer and dictionary_map lines in real %DebugPrint output."
  },
  {
    "id": "v8-src-ic-12-4",
    "authors": [
      "The V8 project authors"
    ],
    "title": "V8 source code at tag 12.4.254.21: src/common/globals.h (InlineCacheState), src/ic/ic.cc and src/ic/stub-cache.h",
    "venue": "V8 source repository (github.com/v8/v8), tag 12.4.254.21 (the V8 inside Node v22.23.4)",
    "year": 2024,
    "doi": null,
    "url": "https://github.com/v8/v8/blob/12.4.254.21/src/ic/ic.cc",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/v8/v8/12.4.254.21/src/common/globals.h (enum class InlineCacheState with comments: UNINITIALIZED “Has never been executed”, MONOMORPHIC “only one receiver type has been seen”, POLYMORPHIC “Multiple receiver types have been seen”, MEGAMORPHIC “Many receiver types have been seen”, plus NO_FEEDBACK, RECOMPUTE_HANDLER, MEGADOM, GENERIC); https://raw.githubusercontent.com/v8/v8/12.4.254.21/src/ic/ic.cc (TransitionMarkFromState maps these states to the letters 0, 1, P, N used in --log-ic output; UpdatePolymorphicIC keeps (map, handler) pairs and gives up once the number of valid maps reaches max_valid_polymorphic_map_count; megamorphic handlers go into the stub cache); https://raw.githubusercontent.com/v8/v8/12.4.254.21/src/ic/stub-cache.h (“The stub cache is used for megamorphic property accesses. It maps (map, name, type) to property access handlers”).",
    "shaped": "Chapter 64: the IC states, the (shape, handler) entries, the limit of four, the shared stub cache for megamorphic sites, and how to read --log-ic output."
  },
  {
    "id": "v8-fast-super",
    "authors": [
      "Marja Hölttä"
    ],
    "title": "Super fast super property access",
    "venue": "V8 blog (v8.dev), 18 February 2021",
    "year": 2021,
    "doi": null,
    "url": "https://v8.dev/blog/fast-super",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/v8/v8.dev/main/src/blog/fast-super.md (read in full). Read: from V8 v9.0 super property access reuses the inline cache system instead of a runtime call; “V8’s data-driven inline cache system is the core part for implementing fast property access”; with mixins, the super.m() access site becomes megamorphic and slower.",
    "shaped": "Chapter 64: inline caches as the core of fast property access, and a real pattern (mixins) that makes one access site megamorphic."
  },
  {
    "id": "v8-elements-kinds",
    "authors": [
      "Mathias Bynens"
    ],
    "title": "Elements kinds in V8",
    "venue": "V8 blog (v8.dev), 12 September 2017 (with an update note dated 28 February 2025)",
    "year": 2017,
    "doi": null,
    "url": "https://v8.dev/blog/elements-kinds",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/v8/v8.dev/main/src/blog/elements-kinds.md (the post’s source in the v8.dev repository, read in full; v8.dev itself not opened)",
    "shaped": "Chapter 65: elements stored apart from named properties; the SMI, DOUBLE and ELEMENTS kinds and their PACKED and HOLEY variants; one-way transitions through a lattice; -0, NaN and Infinity as doubles; holey arrays needing extra checks and prototype-chain lookups; the 2025 exception for Array.prototype.fill; 21 elements kinds (in 2017); specialized kinds for typed arrays; element-access inline caches becoming polymorphic across kinds; %DebugPrint with --allow-natives-syntax."
  },
  {
    "id": "v8-src-elements-kind",
    "authors": [
      "The V8 project authors"
    ],
    "title": "src/objects/elements-kind.h (V8 source code)",
    "venue": "V8 source repository, main branch (GitHub mirror of chromium.googlesource.com/v8/v8)",
    "year": null,
    "doi": null,
    "url": "https://github.com/v8/v8/blob/main/src/objects/elements-kind.h",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/v8/v8/main/src/objects/elements-kind.h (the ElementsKind enum and its comments)",
    "shaped": "Chapter 65: the comment on PACKED_DOUBLE_ELEMENTS / HOLEY_DOUBLE_ELEMENTS, “the fast kind for unwrapped, non-tagged double values”, and the order of the fast kinds."
  },
  {
    "id": "v8-lazy-unlinking",
    "authors": [
      "Juliana Franco"
    ],
    "title": "An internship on laziness: lazy unlinking of deoptimized functions",
    "venue": "V8 blog (v8.dev), 4 October 2017",
    "year": 2017,
    "doi": null,
    "url": "https://v8.dev/blog/lazy-unlinking",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/v8/v8.dev/main/src/blog/lazy-unlinking.md (the post’s source in the v8.dev repository; v8.dev itself not opened)",
    "shaped": "Chapter 66: Ignition collects profiling information that TurboFan uses; when that information stops being valid (for example an argument of a different type), the optimized code must be deoptimized and unlinked from the function so it is not run again, and the function goes back to the interpreter through a trampoline."
  },
  {
    "id": "v8-src-escape-analysis",
    "authors": [
      "The V8 project authors"
    ],
    "title": "src/compiler/escape-analysis.h, escape-analysis.cc and escape-analysis-reducer.cc (V8 source code, TurboFan)",
    "venue": "V8 source repository, main branch (GitHub mirror of chromium.googlesource.com/v8/v8); files © 2017",
    "year": 2017,
    "doi": null,
    "url": "https://github.com/v8/v8/blob/main/src/compiler/escape-analysis.h",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/v8/v8/main/src/compiler/escape-analysis.h, .../escape-analysis.cc and .../escape-analysis-reducer.cc (read on the main branch, 31 October 2026)",
    "shaped": "Chapter 67: a VirtualObject per allocation site tracking a Variable per field and an escape status; “escaped” meaning escaped to untracked memory or used in an operation that requires materialization; StoreField to a non-escaped virtual object recorded and marked for deletion, LoadField replaced by the stored value, unknown nodes treating all value inputs as escaping; the reducer replacing non-escaped virtual objects in deopt frame states by ObjectState nodes with one input per field (so the deoptimizer can materialize them), and failing if an Allocate for a non-escaped virtual object survives."
  },
  {
    "id": "v8-src-late-escape-analysis",
    "authors": [
      "The V8 project authors"
    ],
    "title": "src/compiler/turboshaft/late-escape-analysis-reducer.h (V8 source code, Turboshaft)",
    "venue": "V8 source repository, main branch (GitHub mirror of chromium.googlesource.com/v8/v8); file © 2022",
    "year": 2022,
    "doi": null,
    "url": "https://github.com/v8/v8/blob/main/src/compiler/turboshaft/late-escape-analysis-reducer.h",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/v8/v8/main/src/compiler/turboshaft/late-escape-analysis-reducer.h (header comment: “LateEscapeAnalysis removes allocation that have no uses besides the stores initializing the object”)",
    "shaped": "Chapter 67: Turboshaft’s late escape analysis, which removes allocations whose only uses are the stores that initialize them."
  },
  {
    "id": "v8-orinoco-scavenger",
    "authors": [
      "Ulan Degenbaev",
      "Michael Lippautz",
      "Hannes Payer"
    ],
    "title": "Orinoco: young generation garbage collection",
    "venue": "V8 blog (v8.dev), 29 November 2017",
    "year": 2017,
    "doi": null,
    "url": "https://v8.dev/blog/orinoco-parallel-scavenger",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/v8/v8.dev/main/src/blog/orinoco-parallel-scavenger.md (the post’s source in the v8.dev repository; v8.dev itself not opened)",
    "shaped": "Chapter 68: nursery, intermediate and old generations; old-to-young references as roots; Cheney’s semispace copying collector (from-space, to-space) used until V8 v6.2, then a parallel Scavenger with dynamic work stealing; remembered sets kept per page, usually the majority of the root set."
  },
  {
    "id": "jsc-optionslist",
    "authors": [
      "WebKit contributors"
    ],
    "title": "Source/JavaScriptCore/runtime/OptionsList.h: JavaScriptCore’s run-time options",
    "venue": "WebKit source repository (github.com/WebKit/WebKit), main branch",
    "year": 2026,
    "doi": null,
    "url": "https://github.com/WebKit/WebKit/blob/main/Source/JavaScriptCore/runtime/OptionsList.h",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/WebKit/WebKit/main/Source/JavaScriptCore/runtime/OptionsList.h (options useLLInt “allows the LLINT to be used”, useBaselineJIT “allows the baseline JIT to be used”, useDFGJIT “allows the DFG JIT to be used”, useFTLJIT “allows the FTL JIT to be used”; useLLIntICs “Use property and call ICs in LLInt code”)",
    "shaped": "Chapter 69: the names of JavaScriptCore’s four execution tiers, LLInt, Baseline JIT, DFG JIT and FTL JIT, and that even its interpreter has inline caches."
  },
  {
    "id": "jsc-llint",
    "authors": [
      "WebKit contributors"
    ],
    "title": "Source/JavaScriptCore/llint/LowLevelInterpreter.asm: the LLInt, written in offlineasm",
    "venue": "WebKit source repository (github.com/WebKit/WebKit), main branch",
    "year": 2026,
    "doi": null,
    "url": "https://github.com/WebKit/WebKit/blob/main/Source/JavaScriptCore/llint/LowLevelInterpreter.asm",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/WebKit/WebKit/main/Source/JavaScriptCore/llint/LowLevelInterpreter.asm (header comment: “Crash course on the language that this is written in (which I just call ‘assembly’ even though it’s more than that)”, with macros, platform “if”s and registers t0–t7) and Source/JavaScriptCore/offlineasm/asm.rb",
    "shaped": "Chapter 69: JavaScriptCore’s first tier is an interpreter written in a portable assembly-like language of its own, not in C++."
  },
  {
    "id": "jsc-osr-exit",
    "authors": [
      "WebKit contributors"
    ],
    "title": "Source/JavaScriptCore/dfg/DFGOSRExit.h: OSR exits from DFG code",
    "venue": "WebKit source repository (github.com/WebKit/WebKit), main branch",
    "year": 2026,
    "doi": null,
    "url": "https://github.com/WebKit/WebKit/blob/main/Source/JavaScriptCore/dfg/DFGOSRExit.h",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/WebKit/WebKit/main/Source/JavaScriptCore/dfg/DFGOSRExit.h (“This structure describes how to exit the speculative path by going into baseline code”; SpeculationRecovery: “additional recovery that may need be performed should a speculation check fail”)",
    "shaped": "Chapter 69: when a DFG speculation check fails, JavaScriptCore leaves the speculative code and continues in baseline code."
  },
  {
    "id": "jsc-ftl-b3",
    "authors": [
      "WebKit contributors"
    ],
    "title": "Source/JavaScriptCore/ftl/FTLLowerDFGToB3.cpp: lowering DFG IR to B3 for the FTL tier",
    "venue": "WebKit source repository (github.com/WebKit/WebKit), main branch",
    "year": 2026,
    "doi": null,
    "url": "https://github.com/WebKit/WebKit/blob/main/Source/JavaScriptCore/ftl/FTLLowerDFGToB3.cpp",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/WebKit/WebKit/main/Source/JavaScriptCore/ftl/FTLLowerDFGToB3.cpp (class LowerDFGToB3 and function lowerDFGToB3) and Source/JavaScriptCore/b3/B3Procedure.h",
    "shaped": "Chapter 69: the FTL tier reuses the DFG’s analysis of a function and lowers it into a second compiler IR, B3, for heavier optimization."
  },
  {
    "id": "jsc-jsvalue",
    "authors": [
      "WebKit contributors"
    ],
    "title": "Source/JavaScriptCore/runtime/JSCJSValue.h: the encoding of JSValue",
    "venue": "WebKit source repository (github.com/WebKit/WebKit), main branch",
    "year": 2026,
    "doi": null,
    "url": "https://github.com/WebKit/WebKit/blob/main/Source/JavaScriptCore/runtime/JSCJSValue.h",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/WebKit/WebKit/main/Source/JavaScriptCore/runtime/JSCJSValue.h (comment “We use a NaN-encoded form for immediates”: the top 15 bits give the type; pointers begin 0000; 32-bit integers are tagged 0xFFFE; doubles are encoded by a 64-bit integer addition of 2^49, so none begins 0x0000 or 0xFFFE; false 0x06, true 0x07, undefined 0x0a, null 0x02)",
    "shaped": "Chapter 69: a second NaN-based value encoding, the mirror image of SpiderMonkey’s: pointers stored as they are, doubles shifted by 2^49, int32s tagged 0xFFFE."
  },
  {
    "id": "sm-jitoptions",
    "authors": [
      "Mozilla contributors"
    ],
    "title": "js/src/jit/JitOptions.cpp: SpiderMonkey’s JIT options and warm-up thresholds",
    "venue": "Firefox source repository (github.com/mozilla-firefox/firefox), main branch",
    "year": 2026,
    "doi": null,
    "url": "https://github.com/mozilla-firefox/firefox/blob/main/js/src/jit/JitOptions.cpp",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/mozilla-firefox/firefox/main/js/src/jit/JitOptions.cpp (“Whether the Baseline Interpreter is enabled”, “Whether the Baseline JIT is enabled”, “Whether the IonMonkey JIT is enabled”; “How many invocations or loop iterations are needed before functions enter the Baseline Interpreter”: baselineInterpreterWarmUpThreshold 10; “… compiled with the baseline compiler”: baselineJitWarmUpThreshold 100; “… compiled with the Ion compiler at OptimizationLevel::Normal”: normalIonWarmUpThreshold 1500)",
    "shaped": "Chapter 69: SpiderMonkey’s tiers and the default warm-up counts that move a function between them."
  },
  {
    "id": "sm-warp",
    "authors": [
      "Mozilla contributors"
    ],
    "title": "js/src/jit/WarpOracle.h, WarpSnapshot.h and WarpBuilder.h: Warp, the front end of SpiderMonkey’s Ion compiler",
    "venue": "Firefox source repository (github.com/mozilla-firefox/firefox), main branch",
    "year": 2026,
    "doi": null,
    "url": "https://github.com/mozilla-firefox/firefox/blob/main/js/src/jit/WarpBuilder.h",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/mozilla-firefox/firefox/main/js/src/jit/WarpOracle.h (“WarpOracle creates a WarpSnapshot data structure that’s used by WarpBuilder to generate the MIR graph off-thread”), WarpSnapshot.h (“Information from a Baseline IC stub”; “Informs WarpBuilder that an IC site is cold and execution should bail out”) and WarpBuilder.h ([SMDOC] “WarpBuilder traverses the script’s bytecode and compiles each instruction to corresponding MIR instructions”)",
    "shaped": "Chapter 69: SpiderMonkey’s optimizing compiler is fed by a snapshot of what its baseline inline caches saw, and builds its IR from bytecode off the main thread."
  },
  {
    "id": "sm-cacheir",
    "authors": [
      "Mozilla contributors"
    ],
    "title": "js/src/jit/CacheIR.h: [SMDOC] CacheIR",
    "venue": "Firefox source repository (github.com/mozilla-firefox/firefox), main branch",
    "year": 2026,
    "doi": null,
    "url": "https://github.com/mozilla-firefox/firefox/blob/main/js/src/jit/CacheIR.h",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/mozilla-firefox/firefox/main/js/src/jit/CacheIR.h (“CacheIR is an (extremely simple) linear IR language for inline caches. From this IR, we can generate machine code for Baseline or Ion IC stubs.”)",
    "shaped": "Chapter 69: SpiderMonkey describes each inline cache case in a tiny IR of its own, shared by its baseline and optimizing tiers."
  },
  {
    "id": "sm-bailouts",
    "authors": [
      "Mozilla contributors"
    ],
    "title": "js/src/jit/Bailouts.h: [SMDOC] IonMonkey Bailouts",
    "venue": "Firefox source repository (github.com/mozilla-firefox/firefox), main branch",
    "year": 2026,
    "doi": null,
    "url": "https://github.com/mozilla-firefox/firefox/blob/main/js/src/jit/Bailouts.h",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/mozilla-firefox/firefox/main/js/src/jit/Bailouts.h (“A ‘bailout’ is the process of recovering a baseline interpreter frame from an IonFrame”; used “when a guard fails in the Ion code itself; for example, an LGuardShape fails or an LAddI overflows”; values may be unboxed, objects optimized away and frames missing because of inlining; “snapshots” say how to recover each value)",
    "shaped": "Chapter 69: when a guard in SpiderMonkey’s optimized code fails, execution resumes in the Baseline Interpreter, rebuilt from snapshots."
  },
  {
    "id": "truffle-readme",
    "authors": [
      "Oracle and the GraalVM contributors"
    ],
    "title": "Truffle Language Implementation Framework (truffle/README.md and truffle/docs/README.md)",
    "venue": "GraalVM source repository (github.com/oracle/graal), master branch",
    "year": 2026,
    "doi": null,
    "url": "https://github.com/oracle/graal/tree/master/truffle",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/oracle/graal/master/truffle/README.md (“an open-source library for building programming language implementations as interpreters for self-modifying Abstract Syntax Trees”, together with the Graal compiler; developed by Oracle and the Institute for System Software of the Johannes Kepler University Linz) and truffle/docs/README.md (“automatically deriving high-performance code from interpreters”; partial evaluation “is central to how Truffle derives compiled code from interpreters”)",
    "shaped": "Chapter 70: what Truffle is: a framework where a language is written as a self-modifying AST interpreter and compiled code is derived from it."
  },
  {
    "id": "truffle-pe",
    "authors": [
      "Oracle and the GraalVM contributors"
    ],
    "title": "Partial Evaluation in Truffle (truffle/docs/PartialEvaluation.md)",
    "venue": "GraalVM source repository (github.com/oracle/graal), master branch",
    "year": 2026,
    "doi": null,
    "url": "https://github.com/oracle/graal/blob/master/truffle/docs/PartialEvaluation.md",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/oracle/graal/master/truffle/docs/PartialEvaluation.md (read in full: Input -> Output specialized to DynamicInput -> Output; the residual program; partially evaluating an interpreter over a guest program, the first Futamura projection; the AddNode / LoadArgumentNode example folding to args[1] + args[2]; PE constants: the root node, static final fields and stable fields; Truffle profiles call and loop counts and schedules hot call targets for compilation; @CompilationFinal profiling with intsSeen / stringsSeen; transferToInterpreterAndInvalidate deoptimizes and invalidates; deoptimization cycles if state never stabilizes)",
    "shaped": "Chapter 70: partial evaluation of an interpreter, step by step, and how speculation and invalidation fit in."
  },
  {
    "id": "truffle-node-replace",
    "authors": [
      "Oracle and the GraalVM contributors"
    ],
    "title": "com.oracle.truffle.api.nodes.Node (Node.java): replace(Node)",
    "venue": "GraalVM source repository (github.com/oracle/graal), master branch",
    "year": 2026,
    "doi": null,
    "url": "https://github.com/oracle/graal/blob/master/truffle/src/com.oracle.truffle.api/src/com/oracle/truffle/api/nodes/Node.java",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/oracle/graal/master/truffle/src/com.oracle.truffle.api/src/com/oracle/truffle/api/nodes/Node.java (replace(newNode, reason) “Replaces this node with another node”, and its body begins with CompilerDirectives.transferToInterpreterAndInvalidate(); reportReplace notifies observers “and invalidating any compiled call targets”)",
    "shaped": "Chapter 70: a Truffle node can replace itself in the tree, and doing so throws away compiled code that relied on the old node."
  },
  {
    "id": "truffle-specialization",
    "authors": [
      "Oracle and the GraalVM contributors"
    ],
    "title": "com.oracle.truffle.api.dsl.Specialization (Specialization.java): rewriteOn and replaces",
    "venue": "GraalVM source repository (github.com/oracle/graal), master branch",
    "year": 2026,
    "doi": null,
    "url": "https://github.com/oracle/graal/blob/master/truffle/src/com.oracle.truffle.api.dsl/src/com/oracle/truffle/api/dsl/Specialization.java",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/oracle/graal/master/truffle/src/com.oracle.truffle.api.dsl/src/com/oracle/truffle/api/dsl/Specialization.java (rewriteOn: “If one of theses exceptions is thrown once then no further instantiations of this specialization are going to be created for this node”, example doAddNoOverflow with Math.addExact falling back to doAddWithOverflow; replaces: replaced specializations are “removed and never instantiated again for this node instance”)",
    "shaped": "Chapter 70: how Truffle’s DSL lets one node move from an integer specialization to a more general one, and never back."
  },
  {
    "id": "graaljs-add",
    "authors": [
      "Oracle and the GraalJS contributors"
    ],
    "title": "GraalJS: JSAddNode.java and JSAddNormalNode.java (the JavaScript + operator)",
    "venue": "GraalJS source repository (github.com/oracle/graaljs), master branch",
    "year": 2026,
    "doi": null,
    "url": "https://github.com/oracle/graaljs/blob/master/graal-js/src/com.oracle.truffle.js/src/com/oracle/truffle/js/nodes/binary/JSAddNode.java",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/oracle/graaljs/master/graal-js/src/com.oracle.truffle.js/src/com/oracle/truffle/js/nodes/binary/JSAddNode.java (specializations doDouble, doString, doStringInt, doBigInt, …, and a generic doPrimitiveConversion that replaces them) and JSAddNormalNode.java (doInt: @Specialization(rewriteOn = ArithmeticException.class) returning Math.addExact(a, b)); also README.md: “GraalJS is a JavaScript engine implemented in Java on top of GraalVM”",
    "shaped": "Chapter 70: a real self-specializing AST node: JavaScript’s + in GraalJS."
  },
  {
    "id": "graal-publications",
    "authors": [
      "Oracle and the GraalVM contributors"
    ],
    "title": "GraalVM Academic Publications (docs/Publications.md)",
    "venue": "GraalVM source repository (github.com/oracle/graal), master branch",
    "year": 2026,
    "doi": null,
    "url": "https://github.com/oracle/graal/blob/master/docs/Publications.md",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/oracle/graal/master/docs/Publications.md (“One VM to Rule Them All … Describes the vision of the Truffle approach, and the full system stack including the interpreter and dynamic compiler”; “Self-Optimizing AST Interpreters … Describes the design of self-optimizing and self-specializing interpreter, and the application to JavaScript”, DLS ’12; it also lists Makor et al., MPLR ’22, and Kloibhofer et al., <Programming> 2023)",
    "shaped": "Chapters 70 and 71: which papers describe Truffle’s design, in the GraalVM team’s own words."
  },
  {
    "id": "wurthinger2012",
    "authors": [
      "Thomas Würthinger",
      "Andreas Wöß",
      "Lukas Stadler",
      "Gilles Duboscq",
      "Doug Simon",
      "Christian Wimmer"
    ],
    "title": "Self-Optimizing AST Interpreters",
    "venue": "Proceedings of the 8th Symposium on Dynamic Languages (DLS ’12), ACM",
    "year": 2012,
    "doi": "10.1145/2384577.2384587",
    "url": "https://doi.org/10.1145/2384577.2384587",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/oracle/graal/master/docs/Publications.md (authors, title, venue, and the link dl.acm.org/citation.cfm?doid=2384577.2384587; the paper itself was not reachable from the writing session)",
    "shaped": "Chapter 70: the paper the GraalVM team cites for the design of self-optimizing, self-specializing AST interpreters, applied to JavaScript."
  },
  {
    "id": "v8-flag-definitions",
    "authors": [
      "The V8 project authors"
    ],
    "title": "src/flags/flag-definitions.h (V8 12.4.254.21)",
    "venue": "V8 source repository (GitHub mirror github.com/v8/v8), tag 12.4.254.21",
    "year": 2024,
    "doi": null,
    "url": "https://github.com/v8/v8/blob/12.4.254.21/src/flags/flag-definitions.h",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/v8/v8/12.4.254.21/src/flags/flag-definitions.h (trace_opt “trace optimized compilation”, trace_deopt “trace deoptimization”, trace_gc “print one trace line following each garbage collection”, print_bytecode “print bytecode generated by ignition interpreter”, print_bytecode_filter default \"*\", trace_generalization “trace map generalization”, allow_natives_syntax “allow natives syntax”, maglev defaulting to ENABLE_MAGLEV_BY_DEFAULT); also `node --v8-options` on Node v22.23.4, which lists the same help texts and shows --maglev defaulting to --no-maglev in that build",
    "shaped": "Chapter 72: what each tracing flag is for, in V8’s own words, and that they are internal flags defined per V8 version."
  },
  {
    "id": "v8-runtime-h",
    "authors": [
      "The V8 project authors"
    ],
    "title": "src/runtime/runtime.h (V8 12.4.254.21): the runtime functions behind %-syntax",
    "venue": "V8 source repository (GitHub mirror github.com/v8/v8), tag 12.4.254.21",
    "year": 2024,
    "doi": null,
    "url": "https://github.com/v8/v8/blob/12.4.254.21/src/runtime/runtime.h",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/v8/v8/12.4.254.21/src/runtime/runtime.h (DebugPrint, HasFastProperties, GetOptimizationStatus, PrepareFunctionForOptimization and OptimizeFunctionOnNextCall are listed in FOR_EACH_INTRINSIC_TEST)",
    "shaped": "Chapter 72: %DebugPrint and %HasFastProperties are V8 test intrinsics, available only with --allow-natives-syntax."
  },
  {
    "id": "v8-deopt-kinds",
    "authors": [
      "The V8 project authors"
    ],
    "title": "src/common/globals.h (DeoptimizeKind) and src/deoptimizer/deoptimize-reason.h (V8 12.4.254.21)",
    "venue": "V8 source repository (GitHub mirror github.com/v8/v8), tag 12.4.254.21",
    "year": 2024,
    "doi": null,
    "url": "https://github.com/v8/v8/blob/12.4.254.21/src/deoptimizer/deoptimize-reason.h",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/v8/v8/12.4.254.21/src/common/globals.h (“Eager: a check failed in the optimized code and deoptimization happens immediately. Lazy: the code has been marked as dependent on some assumption which is checked elsewhere …”) and https://raw.githubusercontent.com/v8/v8/12.4.254.21/src/deoptimizer/deoptimize-reason.h (reasons “not a Smi”, “Insufficient type feedback for call”, “not a Number or Oddball”)",
    "shaped": "Chapter 72: what “deopt-eager” and the reason strings in a --trace-deopt line mean."
  },
  {
    "id": "v8-gc-tracer",
    "authors": [
      "The V8 project authors"
    ],
    "title": "src/heap/gc-tracer.cc (V8 12.4.254.21): the --trace-gc line",
    "venue": "V8 source repository (GitHub mirror github.com/v8/v8), tag 12.4.254.21",
    "year": 2024,
    "doi": null,
    "url": "https://github.com/v8/v8/blob/12.4.254.21/src/heap/gc-tracer.cc",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/v8/v8/12.4.254.21/src/heap/gc-tracer.cc (the format \"%8.0f ms: %s%s%s %.1f (%.1f) -> %.1f (%.1f) MB, pooled: … %.2f / %.2f ms … %s; %s\" filled with the time since start, the collector, start object size (start memory size) -> end object size (end memory size), the duration and external time, and the GC reason)",
    "shaped": "Chapter 72: how to read one line of --trace-gc output."
  },
  {
    "id": "v8-ignition-handlers",
    "authors": [
      "The V8 project authors"
    ],
    "title": "src/interpreter/bytecodes.h and src/interpreter/interpreter-generator.cc (V8 12.4.254.21)",
    "venue": "V8 source repository (GitHub mirror github.com/v8/v8), tag 12.4.254.21",
    "year": 2024,
    "doi": null,
    "url": "https://github.com/v8/v8/blob/12.4.254.21/src/interpreter/interpreter-generator.cc",
    "accessed": "2026-10-31",
    "checkedAgainst": "https://raw.githubusercontent.com/v8/v8/12.4.254.21/src/interpreter/interpreter-generator.cc (“Ldar <src>: Load accumulator with value from register <src>”; “Add <src>: Add register <src> to accumulator”, implemented by BinaryOpWithFeedback, whose second operand is the slot index into the feedback vector) and src/interpreter/bytecodes.h (Add takes OperandType::kReg and OperandType::kIdx)",
    "shaped": "Chapter 72: reading a --print-bytecode listing: what Ldar and Add do, and that [0] is a feedback slot."
  },
];

// Not yet confirmed against a primary source. NOT rendered and NOT citable.
// Each gets promoted once its publisher page or DOI has been checked
// directly (doi.org, craftinginterpreters.com and quantum.country were
// unreachable from the session that built this list).
export const pending = [
  { id: 'matuschaknielsen2019', what: 'Andy Matuschak & Michael Nielsen, Quantum Country (“Quantum computing for the very curious”), 2019', why: 'quantum.country was unreachable; only the authors’ own notes pages were seen.' },
  { id: 'ttft2019', what: 'Matuschak & Nielsen, “How can we develop transformative tools for thought?”, numinous.productions, 2019', why: 'Only an archived copy was seen.' },
  { id: 'sweller1988', what: 'John Sweller, “Cognitive Load During Problem Solving: Effects on Learning”, Cognitive Science 12(2), 1988', why: 'The DOI comes only from secondary sources.' },
  { id: 'swellercooper1985', what: 'Sweller & Cooper, worked examples in algebra, Cognition and Instruction 2(1), 1985', why: 'The DOI comes only from secondary sources.' },
  { id: 'drepper2007', what: 'Ulrich Drepper, What Every Programmer Should Know About Memory, 2007', why: 'Couldn’t confirm the PDF is still live.' },
  { id: 'acton2014', what: 'Mike Acton, “Data-Oriented Design and C++”, CppCon 2014', why: 'The video URL hasn’t been opened.' },
  { id: 'odinsoa', what: 'Odin language overview, #soa (Bill “gingerBill” Hall)', why: 'The docs page text hasn’t been seen.' },
  { id: 'pratt1973', what: 'Vaughan Pratt, “Top Down Operator Precedence”, POPL 1973', why: 'The ACM page wasn’t reachable.' },
  { id: 'cytron1991', what: 'Cytron, Ferrante, Rosen, Wegman, Zadeck, SSA form, TOPLAS 1991', why: 'The DOI hasn’t been confirmed at ACM.' },
  { id: 'holzle1991', what: 'Hölzle, Chambers, Ungar, polymorphic inline caches, ECOOP 1991', why: 'The exact title wording is unconfirmed.' },
  { id: 'deutschschiffman1984', what: 'Deutsch & Schiffman, “Efficient Implementation of the Smalltalk-80 System”, POPL 1984', why: 'The DOI is unconfirmed.' },
  { id: 'oxc', what: 'Oxc, the JavaScript Oxidation Compiler (Boshen and contributors)', why: 'oxc.rs and its LICENSE weren’t reachable.' },
  { id: 'mdn-array', what: 'MDN, Array reference', why: 'The English page wasn’t seen directly.' },
];

export function byId(id) {
  return references.find((r) => r.id === id);
}
