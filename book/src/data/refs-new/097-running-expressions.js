export default [
  {
    id: 'mdn-falsy',
    authors: ['MDN contributors'],
    title: 'Falsy (Glossary)',
    venue: 'MDN Web Docs',
    year: null,
    doi: null,
    url: 'https://developer.mozilla.org/en-US/docs/Glossary/Falsy',
    accessed: '2026-11-02',
    checkedAgainst: 'https://raw.githubusercontent.com/mdn/content/main/files/en-us/glossary/falsy/index.md (MDN’s own source repository; developer.mozilla.org was not reachable from the writing session): “A falsy (sometimes written falsey) value is a value that is considered false when encountered in a Boolean context”, and the table giving “a complete list of JavaScript falsy values”: null, undefined, false, NaN, 0, -0, 0n, "" and document.all.',
    shaped: 'Running expressions: JavaScript counts 0, -0, NaN, "", null and undefined as false, where Drip counts only none and false.',
  },
];
