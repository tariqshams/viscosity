export default [
  {
    id: 'mdn-block',
    authors: ['MDN contributors'],
    title: 'Block statement',
    venue: 'MDN Web Docs',
    year: null,
    doi: null,
    url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/block',
    accessed: '2026-11-02',
    checkedAgainst: 'https://raw.githubusercontent.com/mdn/content/main/files/en-us/web/javascript/reference/statements/block/index.md (MDN’s own source repository; developer.mozilla.org was not reachable from the writing session): “A block statement is used to group zero or more statements. The block is delimited by a pair of braces”, and the interactive example in which `let y = 2;` inside an `if` block leaves the outer `y` at 1.',
    shaped: 'Environments and scope: a JavaScript block gives let its own scope, so an inner let hides an outer one only inside the braces, as in Drip.',
  },
];
