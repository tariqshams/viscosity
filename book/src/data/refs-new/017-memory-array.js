// New references for chapter 17. Verified 2026-10-31. developer.mozilla.org
// and v8.dev were not reachable from the writing session, so each page was
// checked against the source file it is published from on GitHub.
export default [
  {
    id: 'mdn-execution-model',
    authors: ['MDN contributors'],
    title: 'JavaScript execution model',
    venue: 'MDN Web Docs',
    year: null,
    doi: null,
    url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Execution_model',
    accessed: '2026-10-31',
    checkedAgainst: 'https://github.com/mdn/content/blob/main/files/en-us/web/javascript/reference/execution_model/index.md',
    shaped: 'Chapter 17: a JavaScript agent keeps a heap of objects (a large, mostly unstructured region filled as objects are created) and a stack of execution contexts, one frame per active call.',
  },
  {
    id: 'v8-pointer-compression',
    authors: ['Igor Sheludko', 'Santiago Aboy Solanes'],
    title: 'Pointer Compression in V8',
    venue: 'V8 blog',
    year: 2020,
    doi: null,
    url: 'https://v8.dev/blog/pointer-compression',
    accessed: '2026-10-31',
    checkedAgainst: 'https://github.com/v8/v8.dev/blob/main/src/blog/pointer-compression.md',
    shaped: 'Chapter 17: on a 64-bit process each pointer occupies eight bytes instead of four; V8 allocates JavaScript values on its heap and refers to them by pointer; pointer compression stores 32-bit offsets from a base address instead of full 64-bit pointers.',
  },
];
