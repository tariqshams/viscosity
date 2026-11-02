export default [
  {
    id: 'mdn-array-values',
    authors: ['MDN contributors'],
    title: 'Array.prototype.values()',
    venue: 'MDN Web Docs',
    year: null,
    doi: null,
    url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/values',
    accessed: '2026-11-02',
    checkedAgainst: 'https://raw.githubusercontent.com/mdn/content/main/files/en-us/web/javascript/reference/global_objects/array/values/index.md (MDN’s own source repository; developer.mozilla.org was not reachable from the writing session), section “Mutations during iteration”: “the array iterator object does not save the array\'s length at the time of its creation, but reads it once on each iteration. Therefore, if the array grows during iteration, the iterator will visit the new elements too. This may lead to infinite loops.”, with the example `for (const e of arr) { arr.push(e * 10); }`.',
    shaped: 'Lists in Drip: JavaScript’s for...of over an array also reads the length each time round, so pushing inside the loop extends it, as in Drip’s for-in.',
  },
];
