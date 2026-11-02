// Chapter 147 cards. Keys are stable ids: never rename them.

export const prompts = {
  'gc68-gens': {
    q: 'Which generations does V8’s heap have?',
    a: 'A young generation (a nursery and an intermediate part) and an old generation.',
  },
  'scav-what': {
    q: 'What does V8’s Scavenger collect, and how?',
    a: 'The young generation only, by copying the objects that survive into the empty semispace.',
  },
  'scav-half': {
    q: 'Why is half of the young generation always empty?',
    a: 'A scavenge needs somewhere to copy the survivors to: the empty half is the next to-space.',
  },
  'scav-cost': {
    q: 'What does the cost of a scavenge depend on: the objects allocated, or the objects that survive?',
    a: 'The survivors. Dead objects are never visited; their space is just reused.',
  },
  'scav-trace': {
    q: 'In the `--trace-gc` line `Scavenge 4.4 (5.1) -> 3.5 (6.1) MB`, what do 4.4 and 3.5 mean?',
    a: 'The size of the objects in the heap before and after that scavenge, in megabytes (the numbers in brackets are the heap’s total memory).',
  },
  'scav-roots': {
    q: 'What are the roots of a scavenge?',
    a: 'The stack, the globals, and the recorded old-to-new references.',
  },
  'scav-forward': {
    q: 'What is a forwarding address for?',
    a: 'It is left in a moved object’s old copy, so every other pointer to that object can be updated, and the object is copied only once.',
  },
  'scav-promote': {
    q: 'When is a young object moved to the old generation?',
    a: 'When it survives a second scavenge.',
  },
};

export const examples = {};

export const exercises = {
  cheney: {
    title: 'A two-space copying collector',
    prompt:
      'The heap is an array `from` of objects `{ name, refs }`, where `refs` holds **indices** into `from`. `roots` is an array of indices too. Write `scavenge(from, roots)`, a Cheney-style copying collector. It returns `{ to, roots }`: `to` is a new array holding a fresh copy of every reachable object, with `refs` rewritten to indices into `to`, and `roots` rewritten the same way.\n\nOrder matters: copy the roots first, in order, then scan `to` from the front, copying each object’s refs in order when they haven’t been copied yet. Copy each object exactly once, and don’t change `from`. Use a loop, not recursion.',
    starter: `function scavenge(from, roots) {
  const to = [];
  const fwd = []; // old index -> new
  return { to, roots };
}`,
    solution: `function scavenge(from, roots) {
  const to = [];
  const fwd = []; // old index -> new
  const copy = (i) => {
    if (fwd[i] === undefined) {
      fwd[i] = to.length;
      const o = from[i];
      to.push({
        name: o.name,
        refs: [...o.refs],
      });
    }
    return fwd[i];
  };
  const newRoots = roots.map(copy);
  for (let s = 0; s < to.length; s++) {
    to[s].refs = to[s].refs.map(copy);
  }
  return { to, roots: newRoots };
}`,
    tests: `const heap = () => [
  { name: 'A', refs: [1] },
  { name: 'B', refs: [] },
  { name: 'C', refs: [4] },
  { name: 'D', refs: [0] },
  { name: 'E', refs: [] },
  { name: 'F', refs: [2] },
];
const names = (r) => r.to.map((o) => o.name);
test('only survivors are copied', () => {
  const r = scavenge(heap(), [0, 3]);
  expect(names(r)).toEqual(['A', 'D', 'B']);
});
test('refs point into to-space', () => {
  const r = scavenge(heap(), [0, 3]);
  expect(r.to[0].refs).toEqual([2]);
  expect(r.to[1].refs).toEqual([0]);
  expect(r.roots).toEqual([0, 1]);
});
test('shared objects are copied once', () => {
  const h = [
    { name: 'X', refs: [1, 1] },
    { name: 'Y', refs: [0] },
  ];
  const r = scavenge(h, [0, 1, 0]);
  expect(names(r)).toEqual(['X', 'Y']);
  expect(r.to[0].refs).toEqual([1, 1]);
  expect(r.roots).toEqual([0, 1, 0]);
});
test('from-space is left alone', () => {
  const h = heap();
  const before = JSON.stringify(h);
  scavenge(h, [0]);
  expect(JSON.stringify(h)).toBe(before);
});
test('no roots, no survivors', () => {
  expect(scavenge(heap(), []).to.length)
    .toBe(0);
});
test('a long chain does not overflow', () => {
  const h = [];
  for (let i = 0; i < 200000; i++) {
    h.push({ name: i, refs: [i + 1] });
  }
  h[199999].refs = [];
  const r = scavenge(h, [0]);
  expect(r.to.length).toBe(200000);
  expect(r.to[5].refs).toEqual([6]);
});`,
    hints: [
      'Write `copy(i)`: if `fwd[i]` is unset, push a copy of `from[i]` onto `to` and set `fwd[i]` to its new index. Either way, return `fwd[i]`.',
      'The copy’s `refs` still hold *old* indices at first. That’s fine: they are fixed when the scan reaches the copy.',
      'Map the roots through `copy`, then loop `s` from 0 while `s < to.length` (the length grows as you go), replacing `to[s].refs` with `to[s].refs.map(copy)`.',
    ],
    walkthrough: `**How to think about it.** This is Cheney's algorithm, the single-threaded semispace collector V8 used for its young generation until version 6.2. Before coding, run the stepper's heap by hand: the roots are A and D; copy A, then D; then scan the copies from the front, and each time a copy refers to something not yet copied, copy that to the end. You need two things: a way to remember "this object has already been copied, and here is where" (the forwarding address), and a queue of copied objects whose references are not fixed yet. The trick of Cheney's algorithm is that to-space *is* that queue, so no extra list or recursion is needed.

**The solution, line by line.**

- \`const to = [];\` is to-space, empty at the start.
- \`const fwd = []; // old index -> new\` holds the forwarding addresses. In V8 the forwarding address is written into the old copy of the object itself; here it is a side array, so \`from\` stays untouched.
- \`const copy = (i) => {\` is a helper that makes sure object \`i\` has been copied, and returns its new index.
- \`if (fwd[i] === undefined) {\` asks whether it has been copied yet. Checking first is what copies a shared object only once, and stops a cycle from copying forever.
- \`fwd[i] = to.length;\` The copy will go at the end of \`to\`, so its new index is the current length; we record that before anything else.
- \`to.push({ name: o.name, refs: [...o.refs] });\` makes the copy. Its \`refs\` still hold *old* indices, and that is fine: nothing is followed yet, and they are fixed when the scan reaches this copy.
- \`return fwd[i];\` returns the new index, whether the object was copied just now or long ago.
- \`const newRoots = roots.map(copy);\` copies the roots first, in order, and gives their new indices.
- \`for (let s = 0; s < to.length; s++) {\` is the scan. Everything between \`s\` and the end of \`to\` has been copied but not scanned yet (the grey objects of *Garbage collection: mark and sweep*). The loop condition reads \`to.length\` every time, so as copying appends new objects the loop keeps going until the scan catches up with the end.
- \`to[s].refs = to[s].refs.map(copy);\` fixes this copy's references: each old index is replaced by the new index of the referenced object, copying it first if needed.
- \`return { to, roots: newRoots };\` gives back to-space and the new roots.

The objects that are never reached (C, E and F in the tests) are never visited at all: the work is proportional to what survives. And because there is no recursion, the 200,000-long chain is just a loop with one step per object.

**Common wrong attempts.**

- Keeping only the roots (\`from.filter((o, i) => roots.includes(i))\`): what the roots refer to is lost, and \`refs\` still point at old indices.
- Copying without forwarding addresses: an object reached twice is copied twice, so a shared object splits into separate copies (the "shared objects are copied once" test fails), and a cycle would copy forever.
- Writing \`copy\` recursively, following each reference as soon as the object is copied: it works on small heaps but overflows the call stack on the long chain, which is exactly why Cheney's algorithm uses to-space as its queue.`,
    wrong: [
      {
        code: `function scavenge(from, roots) {
  const to = from.filter((o, i) =>
    roots.includes(i));
  return { to, roots };
}`,
        why: 'This keeps only the roots themselves, not what they refer to, and leaves `refs` pointing at old indices.',
      },
      {
        code: `function scavenge(from, roots) {
  const to = [];
  const copy = (i) => {
    to.push({
      name: from[i].name,
      refs: [...from[i].refs],
    });
    return to.length - 1;
  };
  const newRoots = roots.map(copy);
  for (let s = 0; s < to.length; s++) {
    if (s > 1000) break;
    to[s].refs = to[s].refs.map(copy);
  }
  return { to, roots: newRoots };
}`,
        why: 'Without forwarding addresses, an object reached twice is copied twice, so shared objects split into separate copies, and a cycle would copy forever (this version only stops because of its `break`).',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Why is V8’s young generation collected by copying, even though copying is expensive?',
    options: [
      { t: 'Because young objects are bigger than old ones', why: 'Size has nothing to do with it; their lifetimes do.' },
      { t: 'Because copying is the only way to free memory', why: 'The old generation is mostly swept, without copying.' },
      { t: 'Because most young objects die, and copying only pays for the few that survive', correct: true, why: 'The generational hypothesis: the cost is proportional to the survivors, and everything else is implicitly garbage.' },
      { t: 'Because the young generation is shared between threads', why: 'Parallel scavenging uses several threads, but that is not why it copies.' },
    ],
  },
  {
    q: 'During a scavenge, how does V8 find young objects that only old objects point to?',
    options: [
      { t: 'It traces the whole old generation every time', why: 'That would make every minor collection as costly as a major one.' },
      { t: 'From the old-to-new references recorded by the write barrier, used as extra roots', correct: true, why: 'Together with the stack and globals, they give every reference into the young generation.' },
      { t: 'It doesn’t: such objects are freed and recreated', why: 'That would lose live data.' },
      { t: 'It promotes every object on its first scavenge, to be safe', why: 'Objects stay young until they survive a second scavenge.' },
    ],
  },
  {
    q: 'In the `--trace-gc` output for a loop that keeps every tenth object, which line marks a major collection?',
    options: [
      { t: '`Scavenge 4.4 (5.1) -> 3.5 (6.1) MB`', why: 'A scavenge is the minor, young-generation collector.' },
      { t: '`allocation failure`', why: 'That is the reason given for the scavenges: the young generation was full.' },
      { t: 'None: V8 only runs major collections when the program ends', why: 'The trace shows one in the middle of the run.' },
      { t: '`Mark-Compact 13.4 (28.7) -> 10.2 (27.2) MB`', correct: true, why: 'It collects the whole heap; that run had 25 scavenges and one Mark-Compact.' },
    ],
  },
  {
    q: 'The `len2` loop from *Escape analysis in V8* needed about 1700 scavenges without escape analysis and a handful with it. What does that tell you about the GC?',
    options: [
      { t: 'Escape analysis makes each scavenge faster', why: 'It doesn’t change how a scavenge works; it changes how many are needed.' },
      { t: 'Objects that are never allocated never fill the young generation, so there is nothing to collect', correct: true, why: 'Even cheap scavenges add up. The cheapest garbage is the garbage that never existed.' },
      { t: 'The objects were promoted straight to the old generation', why: 'They died immediately; promotion is for survivors.' },
      { t: 'The scavenges were replaced by Mark-Compact collections', why: 'Mark-Compact is for the whole heap and would be even more expensive.' },
    ],
  },
  {
    q: 'In this chapter’s runs, a scavenge took about 0.09 ms when nothing was kept and about 16 ms when every object was kept. What explains the difference?',
    options: [
      { t: 'More objects were allocated in the second run', why: 'Both runs allocate the same three million objects; what differs is how many stay in use.' },
      { t: 'The second run used Mark-Compact instead', why: 'Both numbers are for scavenges; Mark-Compact lines are separate in the trace.' },
      { t: 'A scavenge copies only live objects, so its cost grows with the survivors', correct: true, why: 'Dead objects are never visited. Keeping everything means copying everything.' },
      { t: 'The young generation is slower to allocate in when it is full', why: 'The trace times the scavenge itself, and that time is spent copying the survivors.' },
    ],
  },
];
