// Chapter 293-b cards (staged second half of chapter 293). Keys are
// stable ids: never rename them.

export const prompts = {
  'at-what': {
    q: 'What two things does an **atomic** operation give you?',
    a: 'Indivisibility (no other thread sees it half done, so updates are never lost) and an ordering promise relative to other memory operations.',
  },
  'at-rmw': {
    q: 'Why does `Atomics.add(m, 0, 1)` in two workers never lose an increment, when `m[0] = m[0] + 1` can?',
    a: 'The atomic add reads, adds and writes as one indivisible step, so the other thread cannot slip in between the read and the write.',
  },
  'at-relaxed': {
    q: 'What does a **relaxed** atomic promise, and what does it not?',
    a: 'It is indivisible and every thread agrees on the order of writes to that one variable, but it orders nothing else: other memory may be seen out of order around it.',
  },
  'at-relacq': {
    q: 'What does a release store paired with an acquire load that reads its value guarantee?',
    a: 'Every write made before the release is visible to the reader after the acquire.',
  },
  'at-seqcst': {
    q: 'What does `seq_cst` add on top of release and acquire?',
    a: 'A single total order of all seq_cst operations that every thread agrees on (which forbids the store-buffering surprise).',
  },
  'at-x86': {
    q: 'On x86-64, which atomic needs an extra instruction: a release store, an acquire load, or a seq_cst store?',
    a: 'The seq_cst store (clang emits `xchg`); release stores and acquire loads are plain `mov`s, because x86 already keeps those orders.',
  },
  'at-js': {
    q: 'Which memory orderings do JavaScript\'s Atomics offer?',
    a: 'Only one: every Atomics operation is sequentially consistent. The spec says weaker orderings such as release/acquire are not supported.',
  },
  'hb-what': {
    q: 'How is **happens-before** built?',
    a: 'From program order within each thread plus synchronizes-with edges between threads (a release read by an acquire, a lock released and then taken), closed under "and then" (transitively).',
  },
  'hb-race': {
    q: 'Using happens-before, when are two accesses a data race?',
    a: 'When they touch the same location from different threads, at least one writes, and neither happens before the other.',
  },
  'hb-vc': {
    q: 'With vector clocks, how do you test "access a happens before access b"?',
    a: 'Check that a\'s own-thread entry is at most b\'s entry for a\'s thread: `a.vc[a.t] <= b.vc[a.t]`.',
  },
};

export const examples = {
  weak: {
    title: 'Message passing on a weak machine',
    code: `// A weakly ordered machine: buffered
// stores may reach memory in ANY order.
// ['rel', loc, val] is a release store:
// it waits until every earlier store of
// its thread has reached memory.
function check(threads) {
  const seen = new Set();
  function go(pcs, bufs, mem, regs) {
    let moved = false;
    threads.forEach((ops, t) => {
      // a. flush ANY buffered store
      bufs[t].forEach(([loc, v], k) => {
        moved = true;
        const b = [...bufs];
        b[t] = bufs[t].filter(
          (_, j) => j !== k);
        go(pcs, b,
          { ...mem, [loc]: v }, regs);
      });
      // b. or run the next instruction
      const op = ops[pcs[t]];
      if (!op) return;
      if (op[0] === 'rel' &&
        bufs[t].length) return; // wait
      moved = true;
      const b = [...bufs];
      const r = { ...regs };
      if (op[0] !== 'ld')
        b[t] = [...b[t],
          [op[1], op[2]]];
      else r[op[2]] = mem[op[1]] ?? 0;
      const p = [...pcs];
      p[t]++;
      go(p, b, mem, r);
    });
    if (!moved)
      seen.add('r1=' + regs.r1 +
        ' r2=' + regs.r2);
  }
  go(threads.map(() => 0),
    threads.map(() => []), {}, {});
  return [...seen].sort();
}

const reader = [['ld', 'flag', 'r1'],
  ['ld', 'data', 'r2']];
const plain = [['st', 'data', 1],
  ['st', 'flag', 1]];
const release = [['st', 'data', 1],
  ['rel', 'flag', 1]];
console.log('plain  ',
  check([plain, reader]));
console.log('release',
  check([release, reader]));`,
  },
};

export const exercises = {
  races: {
    title: 'A happens-before race detector',
    prompt:
      'Write `races(trace, n)`. `trace` is one run of `n` threads (numbered `0` to `n - 1`), as a list of events in the order they happened: `{ t, op, x }`, where `op` is `\'r\'` or `\'w\'` (a plain read or write of location `x`), `\'rel\'` (a release of the sync variable `x`) or `\'acq\'` (an acquire of `x` that reads what earlier releases of `x` wrote). Use vector clocks: each thread keeps an array of `n` counters and bumps its own counter at every event; a release joins the thread\'s clock into the sync variable\'s clock; an acquire joins the variable\'s clock into the thread\'s. Return the location `x` of every pair of accesses that race (same `x`, different threads, at least one write, neither happens before the other), one entry per pair, in trace order.',
    starter: `function races(trace, n) {
  return [];
}`,
    solution: `function races(trace, n) {
  const C = [];
  for (let t = 0; t < n; t++)
    C.push(Array(n).fill(0));
  const L = {};
  const join = (a, b) =>
    a.map((v, i) => Math.max(v, b[i]));
  const acc = [];
  for (const e of trace) {
    C[e.t][e.t]++;
    const c = C[e.t];
    if (e.op === 'rel') {
      L[e.x] = join(L[e.x] ?? c, c);
    } else if (e.op === 'acq') {
      if (L[e.x])
        C[e.t] = join(c, L[e.x]);
    } else {
      acc.push({ ...e, vc: [...c] });
    }
  }
  const hb = (a, b) =>
    a.vc[a.t] <= b.vc[a.t];
  const out = [];
  acc.forEach((a, i) => {
    for (const b of acc.slice(i + 1)) {
      const w = a.op === 'w' ||
        b.op === 'w';
      if (a.t !== b.t && a.x === b.x &&
        w && !hb(a, b)) out.push(a.x);
    }
  });
  return out;
}`,
    tests: `const W = (t, x) => ({ t, op: 'w', x });
const R = (t, x) => ({ t, op: 'r', x });
const rel = (t, x) => ({ t, op: 'rel', x });
const acq = (t, x) => ({ t, op: 'acq', x });
test('no synchronisation: a race', () => {
  expect(races([W(0, 'd'), R(1, 'd')], 2))
    .toEqual(['d']);
});
test('two reads never race', () => {
  expect(races([R(0, 'd'), R(1, 'd')], 2))
    .toEqual([]);
});
test('release then acquire orders them', () => {
  const tr = [W(0, 'd'), rel(0, 'f'),
    acq(1, 'f'), R(1, 'd')];
  expect(races(tr, 2)).toEqual([]);
});
test('different sync variables do not', () => {
  const tr = [W(0, 'd'), rel(0, 'f'),
    acq(1, 'g'), R(1, 'd')];
  expect(races(tr, 2)).toEqual(['d']);
});
test('a write after the release races', () => {
  const tr = [rel(0, 'f'), W(0, 'd'),
    acq(1, 'f'), R(1, 'd')];
  expect(races(tr, 2)).toEqual(['d']);
});
test('later steps keep earlier order', () => {
  const tr = [W(0, 'd'), rel(0, 'f'),
    W(0, 'e'), acq(1, 'f'), R(1, 'd')];
  expect(races(tr, 2)).toEqual([]);
});
test('happens-before is transitive', () => {
  const tr = [W(0, 'd'), rel(0, 'a'),
    acq(1, 'a'), rel(1, 'b'),
    acq(2, 'b'), W(2, 'd')];
  expect(races(tr, 3)).toEqual([]);
});`,
    hints: [
      'Keep `C`, one clock (an array of `n` zeros) per thread, and `L`, a clock per sync variable. Every event first bumps its own thread\'s entry: `C[e.t][e.t]++`.',
      'For `rel`, set `L[x]` to the element-wise maximum of `L[x]` and the thread\'s clock; for `acq`, set the thread\'s clock to the maximum of itself and `L[x]` (if any). For `r` and `w`, save the event with a copy of the clock: `{ ...e, vc: [...C[e.t]] }`.',
      'Then compare every saved pair `a` (earlier) and `b` (later): they race if the threads differ, `x` is the same, one is a write, and not `a.vc[a.t] <= b.vc[a.t]`.',
    ],
    walkthrough: `**How to think about it.** Happens-before is a graph: program order runs down each thread, and a release-to-acquire edge crosses between threads. Two accesses are ordered if a path leads from one to the other. Searching the graph for every pair works, but there is a neater way that real race detectors use: give each event a **vector clock**, an array with one counter per thread, saying "how many steps of each thread are known to have happened before me". Within a thread, the counter for that thread goes up by one at each step. Across a release and acquire, the acquirer takes the element-wise maximum, inheriting everything the releaser knew. Then "a happens before b" is a single comparison: b knows about at least as many of a's thread's steps as a itself had made.

**The solution, line by line.**

- \`const C = []\` and the loop fill \`C\` with \`n\` arrays of \`n\` zeros, one clock per thread; \`const L = {};\` holds one clock per sync variable, created on first release.
- \`const join = (a, b) => a.map((v, i) => Math.max(v, b[i]));\` is the element-wise maximum: everything either side knew.
- \`for (const e of trace) {\` walks the run in order, and \`C[e.t][e.t]++;\` counts this step for its thread.
- \`if (e.op === 'rel') { L[e.x] = join(L[e.x] ?? c, c); }\` publishes what this thread knows into the variable (keeping what earlier releases published).
- \`else if (e.op === 'acq') { if (L[e.x]) C[e.t] = join(c, L[e.x]); }\` the acquirer learns everything the releasers knew. If nothing was released yet, it learns nothing.
- \`else { acc.push({ ...e, vc: [...c] }); }\` saves each read and write with a *copy* of its clock, since the thread's array keeps changing.
- \`const hb = (a, b) => a.vc[a.t] <= b.vc[a.t];\` for an earlier \`a\` and later \`b\`: if \`b\`'s clock has caught up with \`a\`'s own count, a path of edges led from \`a\` to \`b\`.
- The double loop compares each saved access with every later one, and \`out.push(a.x)\` records a race when the threads differ, the location is the same, at least one is a write, and \`hb\` fails.

In the "write after the release" test, the write's clock is \`[2, 0]\` but the reader, after acquiring \`[1, 0]\`, has \`[1, 2]\`: \`2 <= 1\` is false, so it is a race, exactly as the C++ and Go memory models say: only writes *before* the release are published.

**Common wrong attempts.**

- Saving \`c\` itself instead of \`[...c]\`: every saved event then shares the thread's live clock, which keeps counting after the access, so the access seems to have happened later than it did, and correctly ordered pairs are reported as false races.
- Joining on release by replacing \`L[x]\` with the thread's clock (no join): with two releasers, the second wipes out what the first published.
- Treating any acquire as synchronising with any release, whatever the variable: the "different sync variables" test then finds no race.`,
    wrong: [
      {
        code: `function races(trace, n) {
  const C = [];
  for (let t = 0; t < n; t++)
    C.push(Array(n).fill(0));
  const L = {};
  const join = (a, b) =>
    a.map((v, i) => Math.max(v, b[i]));
  const acc = [];
  for (const e of trace) {
    C[e.t][e.t]++;
    const c = C[e.t];
    if (e.op === 'rel') {
      L[e.x] = join(L[e.x] ?? c, c);
    } else if (e.op === 'acq') {
      if (L[e.x])
        C[e.t] = join(c, L[e.x]);
    } else {
      acc.push({ ...e, vc: c });
    }
  }
  const hb = (a, b) =>
    a.vc[a.t] <= b.vc[a.t];
  const out = [];
  acc.forEach((a, i) => {
    for (const b of acc.slice(i + 1)) {
      const w = a.op === 'w' ||
        b.op === 'w';
      if (a.t !== b.t && a.x === b.x &&
        w && !hb(a, b)) out.push(a.x);
    }
  });
  return out;
}`,
        why: 'It saves the live clock `c`, not a copy, so a write\'s clock keeps counting after it happened; in the "later steps" test the write to d then looks unordered with the read, a false race.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Thread A: `data = 42; flag.store(1, release)`. Thread B: `if (flag.load(acquire) == 1) print(data)`. What can B print?',
    options: [
      { t: '42 or 0', why: 'If B saw flag = 1, the release/acquire pair makes A\'s earlier write visible.' },
      { t: 'Only 42, whenever it prints at all', correct: true, why: 'The acquire read the value the release wrote, so the write to data happens before the read.' },
      { t: 'Anything, because data is not atomic', why: 'data is ordered by the release/acquire pair, so there is no race on it.' },
    ],
  },
  {
    q: 'clang compiles a `seq_cst` atomic store to `xchg` on x86 but a `release` store to a plain `mov`. Why?',
    options: [
      { t: 'x86 never reorders a store with earlier accesses, so release is free; seq_cst must also stop a later load passing the store, which needs a locked instruction', correct: true, why: 'That is exactly the store-buffering reordering from the last chapter.' },
      { t: '`xchg` is faster than `mov`', why: 'It is slower: it waits for the store buffer.' },
      { t: 'Release stores are not atomic on x86', why: 'Aligned 32-bit `mov` stores are atomic on x86; release adds only ordering.' },
    ],
  },
  {
    q: 'Which language offers release/acquire atomics?',
    options: [
      { t: 'JavaScript (`Atomics`)', why: 'JavaScript atomics are all sequentially consistent; the spec says release/acquire is not supported.' },
      { t: 'Rust and C++ (`Ordering::Release`, `memory_order_release`), and Java through VarHandle\'s setRelease/getAcquire', correct: true, why: 'Rust follows C++20; Java\'s VarHandle has Plain, Opaque, Acquire/Release and Volatile modes.' },
      { t: 'None; release/acquire is a hardware term only', why: 'It is in the C++ standard, the Rust standard library and Java\'s VarHandle.' },
    ],
  },
  {
    q: 'Happens-before is the transitive closure of which two relations?',
    options: [
      { t: 'Program order and synchronizes-with', correct: true, why: 'Go\'s memory model: "the transitive closure of the union of the sequenced before and synchronized before relations".' },
      { t: 'Real time and cache order', why: 'Happens-before is defined by the program\'s synchronisation, not by clock time.' },
      { t: 'Reads and writes', why: 'Those are the events; the relation is built from ordering edges between them.' },
    ],
  },
  {
    q: 'In the weak model checker, why does the `rel` store remove MP\'s `r1=1 r2=0`?',
    options: [
      { t: 'It writes memory twice', why: 'It is one store.' },
      { t: 'It makes the reader wait', why: 'It changes only the writer\'s side.' },
      { t: 'It may not enter its buffer until every earlier store of its thread has reached memory, so data arrives before flag', correct: true, why: 'That is the release half; on Arm the reader also needs acquire (`ldar`) so its loads are not reordered.' },
    ],
  },
];
