// Chapter 299 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'rb-why': {
    q: 'Why can moving an object while the program runs lose a write, even with a write barrier?',
    a: 'The program may still hold the old copy\'s address and write to it; the collector then discards the old copy, write and all.',
  },
  'rb-what': {
    q: 'What is a **read barrier**?',
    a: 'Code that runs when the program loads a pointer from the heap, checking (and fixing) it before the program uses it.',
  },
  'rb-inv': {
    q: 'What does the **to-space invariant** promise?',
    a: 'The program never holds a pointer to an object\'s old (from-space) copy.',
  },
  'rb-heal': {
    q: 'What does it mean for a read barrier to **self-heal**?',
    a: 'It writes the corrected pointer back into the field it loaded from, so the next load of that field takes the fast path.',
  },
  'rb-baker': {
    q: 'In Baker\'s 1978 collector, when does the scan advance, and what happens when the program fetches a from-space pointer?',
    a: 'A little at each allocation; a fetched from-space pointer makes the object be copied (or its copy found) first.',
  },
  'shen-lrb': {
    q: 'In Shenandoah (OpenJDK 21), what does the load-reference barrier do with an object in the collection set that has no copy yet?',
    a: 'If evacuation is in progress, the program\'s own thread copies (evacuates) it and returns the copy.',
  },
  'shen-race': {
    q: 'Two threads both copy the same object in Shenandoah. Which copy wins?',
    a: 'The one whose atomic update of the forwarding slot succeeds; the other thread uses that copy instead of its own.',
  },
  'zgc-colour': {
    q: 'What is a **coloured pointer** in generational ZGC (OpenJDK 21)?',
    a: 'A pointer that carries metadata bits (remapped, marked, remembered...) beside the address, so the barrier can judge it without reading memory.',
  },
  'zgc-fast': {
    q: 'What does generational ZGC\'s load barrier (OpenJDK 21) do with a pointer whose colour is good for the current phase?',
    a: 'It shifts the metadata bits away and uses the address directly: the fast path.',
  },
};

export const examples = {
  stale: {
    title: 'A write to the old copy',
    code: `// the program holds a pointer to acct
let acct = { balance: 10 };
// the collector copies acct...
const copy = { ...acct };
// ...but the program uses the old one
acct.balance += 5;
// the collector finishes and drops
// from-space: the copy is the object
acct = copy;
console.log(acct.balance); // not 15`,
  },
};

export const exercises = {
  loadBarrier: {
    title: 'A self-healing read barrier',
    prompt: `The heap \`h\` is an array of objects \`{ space, fwd, refs }\`: \`space\` is \`'from'\` or \`'to'\`, \`fwd\` is the address of an object's to-space copy or \`null\`, and \`refs\` holds addresses or \`null\`.

Write \`load(h, o, f)\`, the program's read of field \`f\` of object \`o\`, with a Baker-style read barrier. If the field holds \`null\` or a to-space address, return it. If it holds a from-space address \`p\`: if \`h[p]\` has no copy yet, add one at the end of \`h\` (\`space: 'to'\`, \`fwd: null\`, a copy of its \`refs\`) and record its address in \`h[p].fwd\`. Then **heal** the field (write the new address into \`h[o].refs[f]\`) and return the new address.`,
    starter: `// load h[o].refs[f], never returning
// a from-space address
function load(h, o, f) {
  return h[o].refs[f];
}`,
    solution: `function load(h, o, f) {
  const p = h[o].refs[f];
  if (p === null) return null;
  if (h[p].space === 'to') return p;
  if (h[p].fwd === null) {
    h.push({
      space: 'to', fwd: null,
      refs: [...h[p].refs],
    });
    h[p].fwd = h.length - 1;
  }
  h[o].refs[f] = h[p].fwd; // heal
  return h[p].fwd;
}`,
    tests: `// 0 is in to-space; 1 and 2 are in
// from-space; 0 -> 1, 2 and 1 -> 2
const mk = () => [
  { space: 'to', fwd: null,
    refs: [1, 2, null] },
  { space: 'from', fwd: null, refs: [2] },
  { space: 'from', fwd: null, refs: [] },
];
test('it returns a to-space copy', () => {
  const h = mk();
  const q = load(h, 0, 0);
  expect(q).toBe(3);
  expect(h[q].space).toBe('to');
  expect(h[q].refs).toEqual([2]);
});
test('the old copy is forwarded', () => {
  const h = mk();
  load(h, 0, 0);
  expect(h[1].fwd).toBe(3);
});
test('the field is healed', () => {
  const h = mk();
  load(h, 0, 0);
  expect(h[0].refs[0]).toBe(3);
});
test('copied once, however reached', () => {
  const h = mk();
  const a = load(h, 0, 1); // 2 -> 3
  const b = load(h, 0, 0); // 1 -> 4
  expect(load(h, b, 0)).toBe(a);
  expect(h.length).toBe(5);
});
test('null and to-space pass through', () => {
  const h = mk();
  expect(load(h, 0, 2)).toBe(null);
  h[0].refs[0] = 0;
  expect(load(h, 0, 0)).toBe(0);
  expect(h.length).toBe(3);
});`,
    hints: [
      'Read the field into `p` first. Two cases need nothing: `p` is `null`, or `h[p].space` is already `\'to\'`.',
      'Otherwise `p` is in from-space. Its copy is `h[p].fwd`; if that is `null`, make the copy now with `h.push(...)` and set `h[p].fwd = h.length - 1`.',
      'Last two lines: heal with `h[o].refs[f] = h[p].fwd;` and `return h[p].fwd;`. Copy the refs with `[...h[p].refs]`: they may still hold from-space addresses, which is fine, because they will pass through this barrier when they are loaded.',
    ],
    walkthrough: `**How to think about it.** The barrier's job is one promise: whatever the program gets from a load is a to-space address. Most loads already are, so the fast path must be a quick test that returns at once. The slow path is Cheney's \`copy\` from chapter 296, done on demand: follow the forwarding pointer if there is one, or make the copy and leave one. Healing is the last touch: since the field is wrong, fix it now, so this field never costs a slow path again.

**The solution, line by line.**

- \`const p = h[o].refs[f];\` is the plain load the program asked for.
- \`if (p === null) return null;\` and \`if (h[p].space === 'to') return p;\` are the fast path: nothing to check, or already a to-space address.
- \`if (h[p].fwd === null) {\` means the object at \`p\` has not been copied yet.
- \`h.push({ space: 'to', fwd: null, refs: [...h[p].refs] });\` makes the copy at the end of the heap (the free pointer of a real to-space). The copy's \`refs\` are a fresh array with the same addresses, some of which may be in from-space; they are fixed lazily, by later loads, which is what makes this incremental.
- \`h[p].fwd = h.length - 1;\` leaves the forwarding pointer on the old copy, so every other path to it finds the same copy.
- \`h[o].refs[f] = h[p].fwd; // heal\` writes the new address back into the field we loaded from.
- \`return h[p].fwd;\` hands the program the to-space address.

In the test "copied once, however reached", the first load copies object 2 to address 3. The second copies object 1 to address 4; its \`refs\` still say 2. Loading field 0 of the copy at 4 finds 2, which is in from-space but already forwarded to 3, so it returns 3 without copying again, and heals the copy's field. The heap ends with five objects, not six.

**Common wrong attempts.**

- Copying on every load, without checking \`fwd\`: one object gets two copies, so a write through one is invisible through the other, which is the very bug the barrier exists to prevent.
- Returning the new address without healing: correct, but every later load of that field takes the slow path again.
- Copying deeply (all the refs at once): that turns one load into a whole collection, and the pause the barrier was meant to avoid comes back.`,
    wrong: [
      {
        code: `function load(h, o, f) {
  const p = h[o].refs[f];
  if (p === null) return null;
  if (h[p].space === 'to') return p;
  h.push({
    space: 'to', fwd: null,
    refs: [...h[p].refs],
  });
  h[p].fwd = h.length - 1;
  h[o].refs[f] = h[p].fwd;
  return h[p].fwd;
}`,
        why: 'It never checks `fwd`, so an object reached twice is copied twice, and the program ends up with two diverging copies.',
      },
      {
        code: `function load(h, o, f) {
  const p = h[o].refs[f];
  if (p === null) return null;
  if (h[p].space === 'to') return p;
  if (h[p].fwd === null) {
    h.push({
      space: 'to', fwd: null,
      refs: [...h[p].refs],
    });
    h[p].fwd = h.length - 1;
  }
  return h[p].fwd;
}`,
        why: 'The answer is right, but the field is never healed: it keeps its from-space address and every load of it takes the slow path.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Why does a concurrent **marking** collector need only a write barrier, while a concurrent **copying** one needs a read barrier too?',
    options: [
      {
        t: 'Marking moves nothing, so every pointer the program holds stays valid; copying can leave it holding an old copy',
        correct: true,
        why: 'A stale pointer is only possible when objects move.',
      },
      {
        t: 'Copying collectors never need write barriers',
        why: 'Shenandoah, for one, keeps an SATB write barrier for its marking.',
      },
      {
        t: 'Marking is always faster than copying',
        why: 'Speed is not the reason; correctness is.',
      },
    ],
  },
  {
    q: 'A read barrier with self-healing loads a field holding a forwarded from-space address. What happens to the field?',
    options: [
      {
        t: 'Nothing; only the returned value is fixed',
        why: 'That is a barrier without healing.',
      },
      {
        t: 'It is set to null',
        why: 'The object is still reachable; nulling the field would break the program.',
      },
      {
        t: 'It is overwritten with the to-space address',
        correct: true,
        why: 'So the next load of that field takes the fast path.',
      },
    ],
  },
  {
    q: 'In Shenandoah, two threads load the same not-yet-copied object at once, and both start copying it. What happens?',
    options: [
      {
        t: 'Both copies are kept, one per thread',
        why: 'That would give the program two diverging copies.',
      },
      {
        t: 'One atomic update of the forwarding slot succeeds; the other thread uses the winner\'s copy',
        correct: true,
        why: '`try_update_forwardee` returns either the new copy or the one a competing thread installed.',
      },
      {
        t: 'The program is stopped until the collector decides',
        why: 'Evacuation is concurrent; the race is settled atomically.',
      },
    ],
  },
  {
    q: 'What lets ZGC\'s load barrier decide, on its fast path, without reading the object?',
    options: [
      {
        t: 'A card table',
        why: 'Card tables are for remembered sets, not load barriers.',
      },
      {
        t: 'A forwarding word in every object',
        why: 'Reading it would mean touching the object.',
      },
      {
        t: 'Metadata bits carried in the pointer itself',
        correct: true,
        why: 'The colour is tested against the current phase\'s bad mask and shifted away.',
      },
    ],
  },
  {
    q: 'On OpenJDK 21 with a 128 MB heap, what order of pause times do Shenandoah and generational ZGC give an allocation-heavy program?',
    options: [
      {
        t: 'Hundredths to tenths of a millisecond',
        correct: true,
        why: 'Their pauses only start and finish phases; marking, evacuation and reference updating run beside the program.',
      },
      {
        t: 'About 20 ms each',
        why: 'That is the scale of a stop-the-world copying pause, such as one of G1\'s young collections, not of these concurrent compactors.',
      },
      {
        t: 'There were no pauses at all',
        why: 'Both still have short pauses, to start and finish phases.',
      },
    ],
  },
];
