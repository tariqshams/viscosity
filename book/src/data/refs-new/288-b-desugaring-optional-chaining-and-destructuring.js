// New references for chapter 288b (staged split of chapter 288). Checked
// 2026-11-02. The chapter also relies on ecma262 and cpython-dis (whose
// UNPACK_SEQUENCE entry, “Unpacks STACK[-1] into count individual values
// … Require there to be exactly count values”, was read raw from
// python/cpython 3.13 Doc/library/dis.rst). The listings are real output,
// wrapped or trimmed to 44 columns: TypeScript 5.9.3 (the book’s own
// node_modules; --target ES2019, ES5 and ES5 with --downlevelIteration),
// Node 22.23.4 (--print-bytecode, and the TypeErrors quoted) and Python
// 3.13.18 (dis).
export default [
  {
    id: 'mdn-optional-chaining',
    authors: ['MDN contributors'],
    title: 'Optional chaining (?.)',
    venue: 'MDN Web Docs, JavaScript reference',
    year: null,
    doi: null,
    url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining',
    accessed: '2026-11-02',
    checkedAgainst: 'files/en-us/web/javascript/reference/operators/optional_chaining/index.md read raw from github.com/mdn/content (main) on 2026-11-02 (the source MDN publishes the page from): “The ?. operator is like the . chaining operator, except that instead of causing an error if a reference is nullish (null or undefined), the expression short-circuits with a return value of undefined. When used with function calls, it returns undefined if the given function does not exist”; and the note that an && chain also stops at a falsy value such as 0.',
    shaped: 'Chapter 288b: what ?. means, and why && is not the same.',
  },
  {
    id: 'mdn-destructuring',
    authors: ['MDN contributors'],
    title: 'Destructuring',
    venue: 'MDN Web Docs, JavaScript reference',
    year: null,
    doi: null,
    url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring',
    accessed: '2026-11-02',
    checkedAgainst: 'files/en-us/web/javascript/reference/operators/destructuring/index.md read raw from github.com/mdn/content (main) on 2026-11-02: “Each destructured property can have a default value. The default value is used when the property is not present, or has value undefined. It is not used if the property has value null”; “It will only be evaluated when necessary”; “Array destructuring calls the iterable protocol of the right-hand side. Therefore, any iterable, not necessarily arrays, can be destructured.”',
    shaped: 'Chapter 288b: the meaning of destructuring, defaults and array patterns.',
  },
  {
    id: 'ts-downlevel-iteration',
    authors: ['Microsoft (the TypeScript team)'],
    title: 'TSConfig Reference: downlevelIteration',
    venue: 'microsoft/TypeScript-Website, packages/tsconfig-reference/copy/en/options/downlevelIteration.md',
    year: null,
    doi: null,
    url: 'https://www.typescriptlang.org/tsconfig/#downlevelIteration',
    accessed: '2026-11-02',
    checkedAgainst: 'downlevelIteration.md read raw from github.com/microsoft/TypeScript-Website (v2) on 2026-11-02: “Emit more compliant, but verbose and less performant JavaScript for iteration”; “Downleveling is TypeScript’s term for transpiling to an older version of JavaScript”. TypeScript 5.9.3 lowered const [p, , q] = xs to xs[0] and xs[2] for ES5, and to __read(xs, 3) with --downlevelIteration.',
    shaped: 'Chapter 288b: TypeScript’s downlevel output for destructuring.',
  },
];
