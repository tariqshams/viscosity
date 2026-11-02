// New references for “async, await and the microtask queue” (split from
// chapter 40). developer.mozilla.org was read from its source markdown in
// the mdn/content repository on GitHub.
export default [
  {
    id: 'mdn-async-function',
    authors: ['MDN contributors'],
    title: 'async function',
    venue: 'MDN Web Docs',
    year: null,
    doi: null,
    url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function',
    accessed: '2026-11-02',
    checkedAgainst: 'https://raw.githubusercontent.com/mdn/content/main/files/en-us/web/javascript/reference/statements/async_function/index.md (slug Web/JavaScript/Reference/Statements/async_function): “Async functions always return a promise”; a non-promise return value is wrapped in a promise; the body runs synchronously up to and including the first await expression; “The behavior of async/await is similar to combining generators and promises.” Behaviour checked on Node v22.23.4.',
    shaped: 'Chapter 40 (second half): what an async function returns, how much of its body runs at once, and its link to generators.',
  },
  {
    id: 'mdn-await',
    authors: ['MDN contributors'],
    title: 'await',
    venue: 'MDN Web Docs',
    year: null,
    doi: null,
    url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await',
    accessed: '2026-11-02',
    checkedAgainst: 'https://raw.githubusercontent.com/mdn/content/main/files/en-us/web/javascript/reference/operators/await/index.md (slug Web/JavaScript/Reference/Operators/await): await “can only be used inside an async function or at the top level of a module”; it pauses the surrounding async function until the promise settles, returns the fulfillment value, and throws the rejection reason; a non-thenable value is wrapped in an already-fulfilled promise, and the function still pauses. Error messages checked on Node v22.23.4 and tsc 5.9.3.',
    shaped: 'Chapter 40 (second half): await pausing an async function, throwing a rejection, and where await is allowed.',
  },
  {
    id: 'mdn-microtask-guide',
    authors: ['MDN contributors'],
    title: 'Using microtasks in JavaScript with queueMicrotask()',
    venue: 'MDN Web Docs',
    year: null,
    doi: null,
    url: 'https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide',
    accessed: '2026-11-02',
    checkedAgainst: 'https://raw.githubusercontent.com/mdn/content/main/files/en-us/web/api/html_dom_api/microtask_guide/index.md (slug Web/API/HTML_DOM_API/Microtask_guide): tasks include starting a program, events and timers; promises use the microtask queue; after each task “microtasks will be executed until the microtask queue is empty”, including microtasks added meanwhile, before the next task; endlessly queued microtasks keep the loop from moving on. Ordering checked on Node v22.23.4.',
    shaped: 'Chapter 40 (second half): tasks and microtasks, the order they run in, and microtask starvation.',
  },
];
