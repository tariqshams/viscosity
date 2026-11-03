// Chapter 295 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'mc-what': {
    q: 'What are the three tasks of V8’s Mark-Compact collector?',
    a: 'Mark live objects from the roots, sweep the gaps into free-lists, and compact (copy out of) some fragmented pages.',
  },
  'mc-free-list': {
    q: 'After Mark-Compact sweeps a page, where do the gaps left by dead objects go?',
    a: 'Onto free-lists, sorted by size, so later allocations can reuse them.',
  },
  'mc-concurrent': {
    q: 'In V8 (as in Node 22), who does most of the old-generation marking, and when?',
    a: 'Helper threads, concurrently, while JavaScript keeps running; the main thread only pauses for a short finishing step.',
  },
  'mc-some': {
    q: 'Why does V8’s Mark-Compact compact only some pages?',
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
  'wb-old-new': {
    q: 'Which pointer stores does a generational collector’s minor collection (such as V8’s Scavenger) need recorded: old-to-new or new-to-old?',
    a: 'Old-to-new. A scavenge never looks at the old generation, so an old object pointing at a young one must be written down; young objects are scanned anyway when they are copied.',
  },
  'wb-skip': {
    q: 'When can V8’s Maglev compiler skip a write barrier entirely?',
    a: 'When storing into an object it has just allocated, as long as no other allocation could have happened since.',
  },
};

export const examples = {};

export const exercises = {
  barrier: {
    title: 'A write barrier for the remembered set',
    prompt: 'Objects are `{ old, fields }`. Write `write(owner, key, val, rs)`, which stores `val` into `owner.fields[key]` and then runs the barrier: if `owner` is old and `val` is an object that is **not** old, add `owner` to the `Set` `rs`. Then write `youngRoots(stack, rs)`, which returns the young objects a scavenge must treat as roots: the young objects in `stack`, then the young objects held in the fields of each member of `rs`, without duplicates.',
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
      'Ask which single kind of store a scavenge could get wrong if it were not written down. A helper `young(v)` is handy: an object, not `null`, whose `old` is false.',
      'In `write`, do the store first, then ask one question: is `owner` old *and* is `val` a young object? Only then add `owner` to `rs`.',
      'In `youngRoots`, a `Set` removes duplicates and keeps insertion order. Add the young stack values first, then the young field values of each remembered object.',
    ],
    walkthrough: `**How to think about it.** There are two halves, and each matches half of the barrier's remembered-set job. \`write\` is the barrier itself: it runs on *every* store, so it should do the store, then make one quick decision. Ask, for each kind of store, "would a scavenge miss something if this were not written down?" A scavenge never looks inside old objects, so the only dangerous store is an old object being given a pointer to a young one; everything else (young into young, old into old, a number, \`null\`) needs no record. \`youngRoots\` is what the scavenge does with the records: start from the stack, then add whatever young objects the remembered objects point to. A \`Set\` is the natural tool, because it drops duplicates and keeps the order things were added in.

**The solution, line by line.**

- \`const young = (v) => typeof v === 'object' && v !== null && !v.old;\` A helper that says whether a value is a young object. \`typeof null\` is \`'object'\` in JavaScript, so \`null\` has to be ruled out by hand; numbers and strings fail the first test.
- \`owner.fields[key] = val;\` does the store first. The barrier never stops a store from happening; it only takes notes.
- \`if (owner.old && young(val)) {\` is the whole decision: an old owner, and a young value.
- \`rs.add(owner);\` remembers the *owner*, not the value, because at scavenge time we want to look inside the old object and find whatever young objects it points to *then*. Adding it to a \`Set\` twice is harmless.
- \`const out = new Set(stack.filter(young));\` In \`youngRoots\`, start with the young values on the stack, in stack order (old values on the stack are not young roots).
- \`for (const o of rs) {\` then visit each remembered old object, in the order they were remembered.
- \`const vs = Object.values(o.fields);\` lists every value in its fields.
- \`if (young(v)) out.add(v);\` adds each young one. A field that has since been overwritten with an old object or a number simply contributes nothing, and a young object already found on the stack is not added twice.
- \`return [...out];\` turns the set back into an array, in insertion order: the stack's young objects first, then the remembered ones.

**Common wrong attempts.**

- Remembering every store into an old object (\`if (owner.old) rs.add(owner);\`): the set fills with objects that point at nothing young, and the "other stores are not" test fails. In a real engine that would make every scavenge scan far more than it needs.
- Remembering the *value* instead of the owner: the set then holds the young object as it was at the moment of the store; if the field is later overwritten, the scavenge would keep an object nothing points to any more, and if the owner gets a second young object in another field, the record is missing.
- Returning only the stack's young objects from \`youngRoots\`: a young object kept alive only by an old one is then left out of the roots, which is exactly the lost object the remembered set exists to prevent.`,
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
    q: 'Concurrent marking runs while JavaScript executes. What could go wrong without a write barrier?',
    options: [
      {
        t: 'The program stores a pointer to an unmarked object into one already scanned and removes its other paths, and the live object is freed',
        correct: true,
        why: 'The barrier marks the stored value grey, so no black object ends up pointing at a white one.',
      },
      {
        t: 'Marking would never finish',
        why: 'Marking ends when the worklist is empty; the danger is ending too early, with live objects white.',
      },
      {
        t: 'Objects would be copied twice',
        why: 'That is what forwarding addresses prevent during a scavenge, a different problem.',
      },
      {
        t: 'Nothing: concurrent marking doesn’t need one',
        why: 'V8’s post on concurrent marking shows the barrier it uses.',
      },
    ],
  },
  {
    q: 'Why does the Mark-Compact collector not compact every page?',
    options: [
      {
        t: 'Compacting would break the remembered set',
        why: 'Pointer updating is part of compaction; that isn’t the reason.',
      },
      {
        t: 'Pages can’t be compacted while JavaScript runs',
        why: 'Compaction happens in the pause, in parallel; the choice of pages is about cost.',
      },
      {
        t: 'Copying many long-lived objects is expensive, so only highly fragmented pages are evacuated and the rest are swept',
        correct: true,
        why: 'V8 picks pages with a fragmentation heuristic.',
      },
      {
        t: 'Old objects can’t move',
        why: 'They can: evacuated pages move their surviving objects.',
      },
    ],
  },
  {
    q: 'On Node 22, a forced Mark-Compact took about 38 ms while a million small objects were in use, and about 4 ms after they had all become garbage. Why the difference?',
    options: [
      {
        t: 'The second collection had less garbage to free',
        why: 'It had more: about 40 MB had just become garbage. Freeing gaps is cheap and largely done on other threads.',
      },
      {
        t: 'Marking visits the objects still in use, so the pause follows the live data',
        correct: true,
        why: 'With 44 MB in use there is a lot to mark; with almost nothing in use there is almost nothing.',
      },
      {
        t: 'The second collection was a scavenge',
        why: 'Both lines in the trace say Mark-Compact.',
      },
      {
        t: 'V8 caches the result of the first collection',
        why: 'Each collection starts from the roots again; nothing is reused.',
      },
    ],
  },
  {
    q: 'Which of these stores makes V8’s write barrier add an entry to the remembered set?',
    options: [
      {
        t: 'A young object stores a pointer to an old one',
        why: 'The Scavenger scans young objects as it copies them, so this pointer will be seen anyway.',
      },
      {
        t: 'An old object stores a pointer to a young one',
        correct: true,
        why: 'A scavenge never looks inside old objects, so this old-to-new pointer has to be written down to become a root.',
      },
      {
        t: 'An old object stores a pointer to another old one',
        why: 'Neither object is young, so a scavenge does not care.',
      },
      {
        t: 'Any store at all, to be safe',
        why: 'The barrier runs on every pointer store, but records only old-to-new ones; recording everything would make every scavenge scan far more.',
      },
    ],
  },
  {
    q: 'What rule does the concurrent-marking barrier keep true?',
    options: [
      {
        t: 'No grey object points at a black one',
        why: 'That is allowed and harmless: the black object is already found.',
      },
      {
        t: 'Every object is black when marking starts',
        why: 'Marking starts with everything white except the roots.',
      },
      {
        t: 'The program cannot store pointers while marking runs',
        why: 'It can, freely; the barrier makes those stores safe rather than forbidding them.',
      },
      {
        t: 'No black object points at a white one',
        correct: true,
        why: 'When the program stores a white object into a black one, the barrier greys it, so the marker will still visit it.',
      },
    ],
  },
];
