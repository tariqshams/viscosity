// Chapter 95 cards. Keys are stable ids: never rename them.

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
  'mc-what': {
    q: 'What are the three tasks of V8’s Mark-Compact collector?',
    a: 'Mark live objects from the roots, sweep the gaps into free-lists, and compact (copy out of) some fragmented pages.',
  },
  'mc-some': {
    q: 'Why does Mark-Compact compact only some pages?',
    a: 'Copying long-lived objects is expensive, so only highly fragmented pages are evacuated; the rest are swept.',
  },
  'wb-what': {
    q: 'Name the two jobs V8’s write barrier does.',
    a: 'Record old-to-new pointers for the Scavenger, and, while marking runs, make sure a newly stored object gets marked.',
  },
  'wb-marking': {
    q: 'Why does concurrent marking need a write barrier?',
    a: 'JavaScript keeps changing pointers while the marker works, and could hide a live object behind one already scanned.',
  },
  'wb-skip': {
    q: 'When can Maglev skip a write barrier entirely?',
    a: 'When storing into an object it has just allocated, as long as no other allocation could have happened since.',
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
    walkthrough: `This is Cheney's algorithm, the single-threaded semispace collector V8 used for its young generation until version 6.2.

\`\`\`js
if (fwd[i] === undefined) {
  fwd[i] = to.length;
  const o = from[i];
  to.push({
    name: o.name,
    refs: [...o.refs],
  });
}
return fwd[i];
\`\`\`

- **\`fwd\` is the forwarding address.** In V8 it is written into the old copy of the object itself. Here it is a side array, so \`from\` stays untouched. Checking it first is what copies a shared object only once, and stops a cycle from copying forever.
- **Copy, don't trace.** The new object gets the *old* refs. Nothing is followed yet.

\`\`\`js
for (let s = 0; s < to.length; s++) {
  to[s].refs = to[s].refs.map(copy);
}
\`\`\`

- **to-space is the work queue.** Everything between \`s\` and the end has been copied but not scanned: the grey objects of chapter 85, with no separate stack. Copying a ref appends it to the end, and the loop catches up.
- **Breadth-first, with no recursion.** The 200 000-long chain is a loop with one step per object.
- **The garbage costs nothing.** C, E and F are never visited. The work is proportional to what survives.`,
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
  barrier: {
    optional: true,
    title: 'A write barrier for the remembered set',
    prompt:
      'Objects are `{ old, fields }`. Write `write(owner, key, val, rs)`, which stores `val` into `owner.fields[key]` and then runs the barrier: if `owner` is old and `val` is an object that is **not** old, add `owner` to the `Set` `rs`. Then write `youngRoots(stack, rs)`, which returns the young objects a scavenge must treat as roots: the young objects in `stack`, then the young objects held in the fields of each member of `rs`, without duplicates.',
    starter: `function write(owner, key, val, rs) {
  owner.fields[key] = val;
}
function youngRoots(stack, rs) {
  return stack;
}`,
    solution: `const young = (v) =>
  typeof v === 'object' && v !== null &&
  !v.old;

function write(owner, key, val, rs) {
  owner.fields[key] = val;
  if (owner.old && young(val)) {
    rs.add(owner);
  }
}

function youngRoots(stack, rs) {
  const out = new Set(
    stack.filter(young));
  for (const o of rs) {
    const vs = Object.values(o.fields);
    for (const v of vs) {
      if (young(v)) out.add(v);
    }
  }
  return [...out];
}`,
    tests: `const obj = (old) => ({ old, fields: {} });
test('old to young is remembered', () => {
  const rs = new Set();
  const o = obj(true);
  const y = obj(false);
  write(o, 'f', y, rs);
  expect(o.fields.f === y).toBe(true);
  expect(rs.has(o)).toBe(true);
});
test('other stores are not', () => {
  const rs = new Set();
  write(obj(false), 'f', obj(false), rs);
  write(obj(true), 'f', obj(true), rs);
  write(obj(true), 'n', 42, rs);
  write(obj(true), 'z', null, rs);
  expect(rs.size).toBe(0);
});
test('roots: the stack, then remembered', () => {
  const rs = new Set();
  const o = obj(true);
  const a = obj(false);
  const b = obj(false);
  write(o, 'f', b, rs);
  write(o, 'g', a, rs);
  const r = youngRoots([a, obj(true)], rs);
  expect(r.length).toBe(2);
  expect(r[0] === a).toBe(true);
  expect(r[1] === b).toBe(true);
});`,
    hints: [
      'A helper `young(v)` is handy: an object, not `null`, whose `old` is false.',
      'In `youngRoots`, a `Set` removes duplicates and keeps insertion order. Add the young stack values first, then the young field values of each remembered object.',
    ],
    walkthrough: `\`\`\`js
if (owner.old && young(val)) {
  rs.add(owner);
}
\`\`\`

- **The barrier runs on every store**, so it has to be cheap: two checks, and usually nothing else. Only the rare old-to-young store does any work.
- **Why it is needed.** A scavenge doesn't trace the old generation. Without the remembered set, a young object held only by an old one would look unreachable and be lost.

\`\`\`js
for (const o of rs) {
  const vs = Object.values(o.fields);
  for (const v of vs) {
    if (young(v)) out.add(v);
  }
}
\`\`\`

- **Remembered objects are extra roots.** Their young fields join the stack as starting points, exactly as in the stepper. A field that was later overwritten with an old object simply contributes nothing.`,
    wrong: [
      {
        code: `function write(owner, key, val, rs) {
  owner.fields[key] = val;
  if (owner.old) rs.add(owner);
}
function youngRoots(stack, rs) {
  return stack.filter((v) => !v.old);
}`,
        why: 'Remembering every store into an old object makes the set grow for no reason, and `youngRoots` ignores the set completely: a young object kept alive only by an old one would be collected.',
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
    q: 'Concurrent marking runs while JavaScript executes. What could go wrong without a write barrier?',
    options: [
      { t: 'The program stores a pointer to an unmarked object into one already scanned, and the live object is freed', correct: true, why: 'The barrier marks the stored value grey, so no black object ends up pointing at a white one.' },
      { t: 'Marking would never finish', why: 'Marking ends when the worklist is empty; the danger is ending too early, with live objects white.' },
      { t: 'Objects would be copied twice', why: 'That is what forwarding addresses prevent during a scavenge, a different problem.' },
      { t: 'Nothing: concurrent marking doesn’t need one', why: 'V8’s post on concurrent marking shows the barrier it uses.' },
    ],
  },
  {
    q: 'Why does the Mark-Compact collector not compact every page?',
    options: [
      { t: 'Compacting would break the remembered set', why: 'Pointer updating is part of compaction; that isn’t the reason.' },
      { t: 'Pages can’t be compacted while JavaScript runs', why: 'Compaction happens in the pause, in parallel; the choice of pages is about cost.' },
      { t: 'Copying many long-lived objects is expensive, so only highly fragmented pages are evacuated and the rest are swept', correct: true, why: 'V8 picks pages with a fragmentation heuristic.' },
      { t: 'Old objects can’t move', why: 'They can: evacuated pages move their surviving objects.' },
    ],
  },
  {
    q: 'Chapter 94’s `len2` loop needed about 1700 scavenges without escape analysis and a handful with it. What does that tell you about the GC?',
    options: [
      { t: 'Escape analysis makes each scavenge faster', why: 'It doesn’t change how a scavenge works; it changes how many are needed.' },
      { t: 'Objects that are never allocated never fill the young generation, so there is nothing to collect', correct: true, why: 'Even cheap scavenges add up. The cheapest garbage is the garbage that never existed.' },
      { t: 'The objects were promoted straight to the old generation', why: 'They died immediately; promotion is for survivors.' },
      { t: 'The scavenges were replaced by Mark-Compact collections', why: 'Mark-Compact is for the whole heap and would be even more expensive.' },
    ],
  },
];
