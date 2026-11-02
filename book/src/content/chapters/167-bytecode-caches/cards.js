// Chapter 166b cards (split from 119). Keys are stable ids: never rename them.

export const prompts = {
  'cache-what': {
    q: 'What does a **bytecode cache** store, and what does it save?',
    a: 'A script’s compiled bytecode; a later load of the same script can skip parsing and compiling.',
  },
  'cache-after-run': {
    q: 'Since Chrome 66, why is the code cache made *after* the script’s top level has run?',
    a: 'So that it also holds the lazy functions that were called during startup, which have bytecode by then.',
  },
  'cache-grew': {
    q: 'Why was the `vm.Script` cache bigger after the script ran (528 vs 672 bytes)?',
    a: '`add` had been called, so it was compiled, and its bytecode joined the cache. Before running it was still lazy.',
  },
  'cache-no-lazy': {
    q: 'With `node --no-lazy`, both caches were 824 bytes. Why the same, and why bigger?',
    a: 'Lazy parsing was off, so every function was compiled up front: running the script added nothing new, and `sub` was in the cache too.',
  },
  'cache-reject': {
    q: 'What did `cachedDataRejected` say when one space was added to the source?',
    a: '`true`: the cache did not match, so V8 ignored it and compiled the source normally.',
  },
  'cache-same-length': {
    q: 'In the chapter’s Node 22 test, what happened when `a + b` was changed to `a - b` and the old cache was offered?',
    a: 'It was accepted (`cachedDataRejected` was `false`) and the old `a + b` code ran: V8’s own check missed a same-length edit.',
  },
  'cache-embedder': {
    q: 'Whose job is it to make sure a cache is only used for exactly the code it came from?',
    a: 'Whoever stores the cache (the embedder: Chrome, Node’s compile cache, or your own code), for example by keeping a hash of the source text.',
  },
  'cache-node': {
    q: 'How did Node’s module compile cache react to the one-character edit?',
    a: 'It rejected the cache with “code hash mismatch”, compiled the file again and wrote a new cache.',
  },
};

export const examples = {
  'cache-key': {
    title: 'A cache that checks too little',
    code: `// Keyed by length alone, like a
// coarse check.
let saved = null;
function load(src) {
  const n = src.length;
  if (saved && saved.n === n) {
    return saved.fn; // reuse
  }
  const fn = new Function('a, b', src);
  saved = { n, fn };
  return fn;
}
const add = load('return a + b;');
console.log(add(5, 3));
const sub = load('return a - b;');
console.log(sub(5, 3));
// 8 twice: the old code ran.
// Fix it: compare src itself.`,
  },
};

export const exercises = {
  sourceCache: {
    title: 'A cache keyed by name, checked by content',
    prompt:
      'Write `makeCache(compile)`. It returns a function `load(name, src)`. The cache keeps at most one entry per `name`. If there is an entry for `name` whose source is **exactly** `src`, return its compiled code without calling `compile`. Otherwise call `compile(src)`, store the result (with `src`) under `name`, replacing any old entry, and return it. (This is how a browser keys its cache by URL but must still check the content.)',
    starter: `function makeCache(compile) {
  return (name, src) => compile(src);
}`,
    solution: `function makeCache(compile) {
  const store = new Map();
  return (name, src) => {
    const e = store.get(name);
    if (e && e.src === src) {
      return e.code;
    }
    const code = compile(src);
    store.set(name, { src, code });
    return code;
  };
}`,
    tests: `function setup() {
  let n = 0;
  const compile = (s) => { n++; return 'code:' + s; };
  return { load: makeCache(compile), count: () => n };
}
test('the same file twice compiles once', () => {
  const { load, count } = setup();
  load('a.js', 'x+y');
  expect(load('a.js', 'x+y')).toBe('code:x+y');
  expect(count()).toBe(1);
});
test('a same-length edit is recompiled', () => {
  const { load, count } = setup();
  load('a.js', 'x+y');
  expect(load('a.js', 'x-y')).toBe('code:x-y');
  expect(count()).toBe(2);
});
test('the new version replaces the old', () => {
  const { load, count } = setup();
  load('a.js', 'x+y');
  load('a.js', 'x-y');
  load('a.js', 'x-y');
  expect(count()).toBe(2);
});
test('different files do not share', () => {
  const { load, count } = setup();
  load('a.js', 'x+y');
  expect(load('b.js', 'x+y')).toBe('code:x+y');
  expect(count()).toBe(2);
});`,
    hints: [
      'You need somewhere to keep, for each name, the source you compiled and what compiling gave you. Which JavaScript structure maps names to things?',
      'Create a `Map` inside `makeCache`, before the `return`, so `load` keeps it between calls. Store `{ src, code }` objects under each name.',
      'In `load`: get the entry for `name`; if it exists **and** `e.src === src`, return `e.code`. Otherwise compile, `store.set(name, { src, code })`, and return `code`.',
    ],
    walkthrough: `**How to think about it.** There are two questions a cache must answer, and they are different: *where* might there be a cached answer (by name, the way Chrome looks a script up by its URL), and *is it still the right answer* (is the source exactly the one it was made from). The chapter's surprise was a check that answered the second question too roughly. Here the store answers the first, and comparing the whole source text answers the second.

**The solution, line by line.**

- \`function makeCache(compile) {\` receives the expensive function we want to avoid calling.
- \`  const store = new Map();\` maps each name to its last entry. It lives in \`makeCache\`'s scope, so \`load\` keeps it between calls.
- \`  return (name, src) => {\` returns \`load\`.
- \`    const e = store.get(name);\` looks for an entry under this name; \`e\` is \`undefined\` if there is none.
- \`    if (e && e.src === src) {\` reuses the entry only if it exists *and* its source is identical, character for character. A same-length edit like \`x+y\` to \`x-y\` fails this test, as it should.
- \`      return e.code;\` is the cache hit: no compile.
- \`    }\` ends the hit case.
- \`    const code = compile(src);\` is the miss: compile the new source.
- \`    store.set(name, { src, code });\` replaces whatever was under this name with the new source and its code, so the next identical load is a hit.
- \`    return code;\` and the closing braces finish.

**Common wrong attempts.**

- Keying the map by \`src\` alone: it works for these tests' answers, but a cache would then grow with every version of every file ever seen; the name-plus-check design keeps one entry per file.
- Comparing \`e.src.length === src.length\`: the chapter's coarse check, which the second test catches, because \`x-y\` would get \`x+y\`'s code.
- Forgetting to \`store.set\` after a miss: every load then compiles, and the first test fails.`,
    wrong: [
      {
        code: `function makeCache(compile) {
  const store = new Map();
  return (name, src) => {
    const e = store.get(name);
    if (e && e.n === src.length) {
      return e.code;
    }
    const code = compile(src);
    store.set(name,
      { n: src.length, code });
    return code;
  };
}`,
        why: 'This checks only the length, so editing `x+y` to `x-y` returns the old code: exactly the hole the chapter found in V8’s own check.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'In Chrome’s scheme, on which visit is compiling first skipped?',
    options: [
      { t: 'The first: the cache is made while downloading', why: 'On the first visit only the file is stored.' },
      { t: 'The second', why: 'The second visit still compiles, and this time saves the compiled code next to the file.' },
      { t: 'The third', correct: true, why: 'From the third (hot) run, the file and its bytecode both come from the cache, and compiling is skipped.' },
    ],
  },
  {
    q: 'In the `vm.Script` experiment, why was the second cache bigger than the first?',
    options: [
      { t: 'Running the script compiled `add`, so its bytecode was included', correct: true, why: 'Before running, `add` was still lazy. `sub` was never called, so it stayed lazy throughout.' },
      { t: 'Running the script changed its source', why: 'The source never changed; that is why the cache was accepted.' },
      { t: 'It also contains TurboFan machine code', why: 'Nothing was hot enough for TurboFan. The cache holds what the bytecode compiler produced.' },
    ],
  },
  {
    q: 'Which change was rejected by V8’s check in the chapter’s Node 22 test?',
    options: [
      { t: 'Changing `a + b` to `a - b`', why: 'Surprisingly, that same-length edit was accepted, and the old code ran.' },
      { t: 'Running the script a second time with the same source', why: 'Reusing the cache on later runs is the whole point; it was accepted.' },
      { t: 'Adding one space to the end of the source', correct: true, why: '`cachedDataRejected` was `true` for that one.' },
    ],
  },
  {
    q: 'Why does Node’s module compile cache reject the same-length edit that `vm.Script` accepted?',
    options: [
      { t: 'It uses a newer V8', why: 'Both ran on the same Node 22 build.' },
      { t: 'It stores a hash of the code with the cache and compares it (“code hash mismatch”)', correct: true, why: 'Node, as the embedder, checks the content itself rather than relying on V8’s coarse check.' },
      { t: 'It never reuses caches', why: 'It accepted the cache for the unchanged file.' },
      { t: 'It compiles every module twice', why: 'It compiled the edited file once and wrote a new cache.' },
    ],
  },
  {
    q: 'You store `vm.Script` caches on disk yourself. What should you keep next to each one?',
    options: [
      { t: 'The time it was made', why: 'A file can change without its time telling you, and an unchanged file does not need recompiling just because time passed.' },
      { t: 'Nothing; `cachedDataRejected` is enough', why: 'The chapter’s test shows a same-length edit getting past it.' },
      { t: 'A hash of the source text (and the Node version), checked before offering the cache', correct: true, why: 'Then any edit, whatever its length, sends you back to compiling.' },
    ],
  },
];
