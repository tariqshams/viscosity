// Chapter 291 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'th-shared': {
    q: 'What makes shared-memory threads harder to reason about than callbacks on a single event loop?',
    a: 'Threads run at the same time on different cores and share memory, so their steps can interleave anywhere, not only between callbacks.',
  },
  'dr-what': {
    q: 'Define a **data race**.',
    a: 'Two accesses to the same memory location from different threads, at least one a write, that are not ordered by synchronisation (and, in C++, not both atomic).',
  },
  'dr-ub': {
    q: 'What does a data race mean in C++, and what does it mean in Go, Java or JavaScript?',
    a: 'In C++ (and C, and Rust\'s unsafe code) it is undefined behaviour. In Go, Java and JavaScript it is not: the language limits what a racy read may return (roughly, some value a write stored, though values wider than a machine word may tear).',
  },
  'sc-what': {
    q: 'What is **sequential consistency**?',
    a: 'Every run behaves as if the threads\' steps were interleaved into one order, each thread\'s steps kept in program order, with every read seeing the latest write in that order.',
  },
  'mm-what': {
    q: 'What does a **memory model** specify?',
    a: 'Which values each read in a multithreaded program may return: which reorderings of memory operations other threads are allowed to observe.',
  },
  'mm-sb': {
    q: 'In the store-buffering litmus test (thread 1: `x = 1; r1 = y`, thread 2: `y = 1; r2 = x`, all starting at 0), why is `r1 = r2 = 0` impossible under sequential consistency?',
    a: 'Whichever store comes first in the single order happens before the other thread\'s load, so at least one load sees a 1.',
  },
  'mm-tso': {
    q: 'How does an x86 core produce `r1 = r2 = 0` in the store-buffering test?',
    a: 'Each core parks its store in a private store buffer and lets its later load read memory before the store arrives.',
  },
  'mm-fence': {
    q: 'What does a full fence (`mfence`, or `lock or`) between the store and the load do on x86?',
    a: 'It waits until the core\'s store buffer has drained, so the load cannot overtake the store; SB\'s `0, 0` disappears.',
  },
  'mm-hoist': {
    q: 'With `flag` a plain (non-atomic) `int`, why may gcc -O2 compile `while (!flag) {}` into one load of `flag` followed by an infinite loop?',
    a: 'With a plain variable, the compiler may assume no other thread changes it, so it reads `flag` once and loops forever if it was 0.',
  },
  'mm-mp': {
    q: 'In the message-passing test, which outcome means the reader saw the flag but stale data?',
    a: '`r1 = 1, r2 = 0`: it read `flag` as 1 but `data` as 0. x86 forbids it; weakly ordered hardware such as Arm allows it.',
  },
};

export const examples = {
  litmus: {
    title: 'A model checker for litmus tests',
    code: `// A model checker for litmus tests.
// ['st', loc, val]  ['ld', loc, reg]
// ['fence'].  model: 'sc' or 'tso'.
function check(threads, model) {
  const seen = new Set();
  const show = (r) => Object.keys(r)
    .sort().map((k) => k + '=' + r[k])
    .join(' ');
  function go(pcs, bufs, mem, regs) {
    let moved = false;
    threads.forEach((ops, t) => {
      // a. flush t's oldest buffered
      //    store to memory
      if (bufs[t].length) {
        moved = true;
        const [[loc, v], ...rest] =
          bufs[t];
        const b = [...bufs];
        b[t] = rest;
        go(pcs, b,
          { ...mem, [loc]: v }, regs);
      }
      // b. or run t's next instruction
      const op = ops[pcs[t]];
      if (!op) return;
      if (op[0] === 'fence' &&
        bufs[t].length) return; // wait
      moved = true;
      const b = [...bufs];
      const r = { ...regs };
      let m = mem;
      if (op[0] === 'st') {
        if (model === 'sc')
          m = { ...mem,
            [op[1]]: op[2] };
        else
          b[t] = [...b[t],
            [op[1], op[2]]];
      }
      if (op[0] === 'ld') {
        const own = b[t].filter(
          (s) => s[0] === op[1]).pop();
        r[op[2]] = own ? own[1]
          : mem[op[1]] ?? 0;
      }
      const p = [...pcs];
      p[t]++;
      go(p, b, m, r);
    });
    if (!moved) seen.add(show(regs));
  }
  go(threads.map(() => 0),
    threads.map(() => []), {}, {});
  return [...seen].sort();
}

// Store buffering
const SB = [
  [['st', 'x', 1], ['ld', 'y', 'r1']],
  [['st', 'y', 1], ['ld', 'x', 'r2']],
];
console.log('SB sc ', check(SB, 'sc'));
console.log('SB tso', check(SB, 'tso'));
const SBF = SB.map(([s, l]) =>
  [s, ['fence'], l]);
console.log('fence ',
  check(SBF, 'tso'));
// Message passing
const MP = [
  [['st', 'data', 1],
    ['st', 'flag', 1]],
  [['ld', 'flag', 'r1'],
    ['ld', 'data', 'r2']],
];
console.log('MP tso', check(MP, 'tso'));`,
  },
};

export const exercises = {
  interleave: {
    title: 'Every interleaving',
    prompt: 'Sequential consistency means "some interleaving of the threads\' steps". Write `interleave(a, b)`, which returns an array of **every** way to merge the arrays `a` and `b` into one array, keeping each array\'s own order. For example `interleave([\'a1\', \'a2\'], [\'b1\'])` has three answers: `[a1, a2, b1]`, `[a1, b1, a2]` and `[b1, a1, a2]` (in any order). If either array is empty there is exactly one merge.',
    starter: `function interleave(a, b) {
  return [[...a, ...b]];
}`,
    solution: `function interleave(a, b) {
  if (a.length === 0) return [b];
  if (b.length === 0) return [a];
  const [x, ...as] = a;
  const [y, ...bs] = b;
  const first = interleave(as, b)
    .map((rest) => [x, ...rest]);
  const second = interleave(a, bs)
    .map((rest) => [y, ...rest]);
  return [...first, ...second];
}`,
    tests: `const key = (xs) => xs.map((m) => m.join(' ')).sort();
test('one merge when a side is empty', () => {
  expect(interleave([], ['b1'])).toEqual([['b1']]);
  expect(interleave(['a1'], [])).toEqual([['a1']]);
});
test('two and one make three', () => {
  expect(key(interleave(['a1', 'a2'], ['b1'])))
    .toEqual(['a1 a2 b1', 'a1 b1 a2', 'b1 a1 a2']);
});
test('counts are binomial', () => {
  expect(interleave([1, 2], [3, 4]).length).toBe(6);
  expect(interleave([1, 2, 3], [4, 5, 6]).length)
    .toBe(20);
});
test('each thread keeps its order', () => {
  for (const m of interleave(['a', 'A'], ['b', 'B'])) {
    expect(m.indexOf('a') < m.indexOf('A')).toBe(true);
    expect(m.indexOf('b') < m.indexOf('B')).toBe(true);
  }
});
test('SB under SC never gives 0, 0', () => {
  const T1 = [['st', 'x'], ['ld', 'y', 'r1']];
  const T2 = [['st', 'y'], ['ld', 'x', 'r2']];
  const out = new Set();
  for (const m of interleave(T1, T2)) {
    const mem = { x: 0, y: 0 }, r = {};
    for (const [op, loc, reg] of m)
      if (op === 'st') mem[loc] = 1;
      else r[reg] = mem[loc];
    out.add(r.r1 + ',' + r.r2);
  }
  expect([...out].sort()).toEqual(['0,1', '1,0', '1,1']);
});`,
    hints: [
      'Think recursively: the first step of a merge is either the first element of `a` or the first element of `b`.',
      'If it is `a[0]`, the rest is any merge of `a.slice(1)` with all of `b`; if it is `b[0]`, the rest is any merge of `a` with `b.slice(1)`. When one array is empty, the only merge is the other array.',
      'Return `[b]` if `a` is empty and `[a]` if `b` is empty. Otherwise build `interleave(as, b).map((rest) => [x, ...rest])` and the same for `y`, and concatenate the two lists.',
    ],
    walkthrough: `**How to think about it.** Listing merges by hand quickly gets confusing, so ask instead what the *first* step can be. Under sequential consistency either thread can go first, and each thread's next step is its first remaining one; so a merge starts with \`a[0]\` or with \`b[0]\`, and what follows is a merge of what is left. That is a recursive definition, with a simple base case: when one thread has finished, the other runs to the end alone. The count of merges of lengths n and m is "n + m choose n" (6 for 2 and 2, 20 for 3 and 3), which is why model checkers need to be clever as programs grow: the number of interleavings explodes.

**The solution, line by line.**

- \`if (a.length === 0) return [b];\` one thread has nothing left, so there is exactly one merge: the other thread's steps in order. (Returning \`[]\` here would be wrong: that means "no merges at all", and everything built on it would vanish.)
- \`if (b.length === 0) return [a];\` the same the other way round.
- \`const [x, ...as] = a;\` and \`const [y, ...bs] = b;\` split each array into its first step and the rest.
- \`const first = interleave(as, b).map((rest) => [x, ...rest]);\` (over two lines) collects every merge that starts with \`a\`'s first step: take every merge of the rest of \`a\` with all of \`b\` and put \`x\` in front.
- \`const second = interleave(a, bs).map((rest) => [y, ...rest]);\` does the same for merges that start with \`b\`'s first step.
- \`return [...first, ...second];\` every merge starts with one or the other, never both, so together they are all of them, each once.

The last test is a real model checker in eight lines: it runs the store-buffering test under every interleaving with one shared memory and collects the outcomes, and \`0,0\` is not among them, which is the chapter's claim about sequential consistency, now checked by your code.

**Common wrong attempts.**

- Returning \`[]\` for the base case: every result is then empty, because the recursion bottoms out in "no merges".
- Only ever taking from \`a\` first (or alternating strictly): that produces one or two merges, not all of them.
- Mutating \`a\` with \`shift()\`: the second recursive call then sees an array that the first call already emptied.`,
    wrong: [
      {
        code: `function interleave(a, b) {
  if (a.length === 0) return [];
  if (b.length === 0) return [];
  const [x, ...as] = a;
  const [y, ...bs] = b;
  const first = interleave(as, b)
    .map((rest) => [x, ...rest]);
  const second = interleave(a, bs)
    .map((rest) => [y, ...rest]);
  return [...first, ...second];
}`,
        why: 'The base case says "no merges", so every result is empty. When one side is empty there is exactly one merge.',
      },
      {
        code: `function interleave(a, b) {
  const out = [];
  for (let i = 0; i <= a.length; i++)
    out.push([...a.slice(0, i), ...b,
      ...a.slice(i)]);
  return out;
}`,
        why: 'It only inserts all of `b` as one block, so `[a1, b1, a2, b2]`-style merges are missing: 3 results for two and two, not 6.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Which pair of accesses is a data race?',
    options: [
      {
        t: 'Two threads both read `x` at the same time',
        why: 'Two reads never conflict: neither changes anything.',
      },
      {
        t: 'Thread 1 writes `x` and thread 2 reads `x`, with no lock or atomic ordering them',
        correct: true,
        why: 'Same location, different threads, one write, and nothing orders them.',
      },
      {
        t: 'One thread writes `x` and then reads it',
        why: 'One thread\'s own accesses are ordered by program order.',
      },
    ],
  },
  {
    q: 'Run many times on an x86 machine, what does the store-buffering litmus test (plain stores and loads) show?',
    options: [
      {
        t: 'r1 = r2 = 0 in a small fraction of runs, and never once a full fence separates each store from the following load',
        correct: true,
        why: 'Stores waited in store buffers while the loads read memory; `lock or` (the fence) drains the buffer first.',
      },
      {
        t: 'r1 = r2 = 0 never, because x86 is sequentially consistent',
        why: 'x86 is TSO, not SC: it lets a load pass an earlier store to a different location.',
      },
      {
        t: 'r1 = r2 = 0 every time',
        why: 'Most runs interleave normally; the surprise appears in a few per cent of them.',
      },
    ],
  },
  {
    q: 'Why may a compiler turn `while (!flag) {}` into "read flag once, then loop forever"?',
    options: [
      {
        t: 'It is a compiler bug',
        why: 'It is allowed: for a plain variable, the compiler may assume no other thread writes it.',
      },
      {
        t: 'Because loops are always unrolled',
        why: 'Unrolling has nothing to do with it.',
      },
      {
        t: 'Because `flag` is a plain variable, so another thread writing it would be a data race, which the compiler may assume never happens',
        correct: true,
        why: 'Make it an atomic (acquire load) and gcc reloads it every pass.',
      },
    ],
  },
  {
    q: 'Under x86-TSO, can the message-passing test end with r1 = 1 (flag seen) and r2 = 0 (old data)?',
    options: [
      {
        t: 'Yes, because stores are buffered',
        why: 'They are, but each core\'s buffer is FIFO, so data reaches memory before flag.',
      },
      {
        t: 'No: each store buffer drains in order and loads are not reordered with each other',
        correct: true,
        why: 'Weakly ordered hardware such as Arm does allow it, which is why portable code needs release and acquire.',
      },
      {
        t: 'Only if the threads run on the same core',
        why: 'Same-core threads interleave and see memory sequentially.',
      },
    ],
  },
  {
    q: 'What does the ECMAScript specification say a data race on a SharedArrayBuffer means?',
    options: [
      {
        t: 'Undefined behaviour, as in C++',
        why: 'The spec says plainly: "there is no undefined behaviour".',
      },
      {
        t: 'The program throws a RangeError',
        why: 'Races are not detected or reported.',
      },
      {
        t: 'Operations may appear sequentially inconsistent, but the model limits the values a racy read can return',
        correct: true,
        why: 'Data-race-free programs appear sequentially consistent; racy ones get limited surprises.',
      },
    ],
  },
];
