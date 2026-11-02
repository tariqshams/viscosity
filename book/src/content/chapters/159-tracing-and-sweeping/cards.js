// Chapter 159 cards (the second half of a split chapter). Keys are stable ids: never rename them.

export const prompts = {
  'grey-meaning': {
    q: 'In tri-colour marking, what does it mean for an object to be grey?',
    a: 'It has been reached (marked), but the objects it refers to have not been traced yet. In the companion, it is on the `gray` stack.',
  },
  'why-gray-stack': {
    q: 'Why does the collector keep an explicit grey stack instead of marking recursively?',
    a: 'A long chain of references would need one host call per link and could overflow JavaScript’s call stack; an array can grow as far as it needs.',
  },
  'blacken-list': {
    q: 'What does blackening a Drip list mark?',
    a: 'Every item in it (`markValue` on each of `o.items`); numbers and booleans are skipped, objects are greyed.',
  },
  'invariant': {
    q: 'State the tri-colour invariant, and what it gives you when marking ends.',
    a: 'No black object refers to a white one; so when nothing is grey, every white object is unreachable.',
  },
  'weak-strings': {
    q: 'Why is the string table weak rather than a root?',
    a: 'It refers to every string, so as a root it would keep them all alive; and it must not keep entries for strings that sweep frees.',
  },
  'reset-white': {
    q: 'Why does sweep set `isMarked = false` on every object it keeps?',
    a: 'So the next collection starts with everything white; a stale mark would stop `markObject` tracing through that object.',
  },
  'grow-factor': {
    q: 'After a collection, when does the next one start?',
    a: 'When `bytesAllocated` passes `nextGC`, which is twice what survived, but never less than 1 MiB.',
  },
  'sweep-all': {
    q: 'How does sweep find the objects to free, given that nothing refers to them?',
    a: 'It walks the object list, which links every allocated object, and unlinks each one that is not marked.',
  },
};

export const examples = {
  chain: {
    title: 'A chain the collector must walk',
    lang: 'drip-vm',
    code: `let head = none;
for i in 0..200000 {
  head = [i, head];
}
let n = 0;
while head != none {
  n += 1;
  head = head[1];
}
print n;`,
  },
};

export const exercises = {
  toyGc: {
    title: 'A toy mark-sweep collector',
    prompt:
      'Objects are `{ name, refs, marked }`, where `refs` is an array of other objects. Write `collect(heap, roots)`: mark every object reachable from `roots` using an explicit grey stack (no recursion), then return a new array of the marked objects, in heap order, with their `marked` flags reset to `false`.',
    starter: `function collect(heap, roots) {
  const gray = [];
  // 1. mark the roots (grey)
  // 2. trace until gray is empty
  // 3. sweep: keep marked, reset
  return heap;
}`,
    solution: `function collect(heap, roots) {
  const gray = [];
  const mark = (o) => {
    if (o.marked) return;
    o.marked = true;
    gray.push(o);
  };
  roots.forEach(mark);
  while (gray.length > 0) {
    gray.pop().refs.forEach(mark);
  }
  const live = heap.filter(
    (o) => o.marked,
  );
  for (const o of live) {
    o.marked = false;
  }
  return live;
}`,
    tests: `const obj = (name) =>
  ({ name, refs: [], marked: false });
const names = (h) => h.map((o) => o.name);
test('unreachable objects are freed', () => {
  const [a, b, c] = ['a', 'b', 'c'].map(obj);
  a.refs.push(b);
  const live = collect([a, b, c], [a]);
  expect(names(live)).toEqual(['a', 'b']);
});
test('a cycle with no root is freed', () => {
  const [a, d, e] = ['a', 'd', 'e'].map(obj);
  d.refs.push(e);
  e.refs.push(d);
  const live = collect([a, d, e], [a]);
  expect(names(live)).toEqual(['a']);
});
test('shared and cyclic refs survive once', () => {
  const [a, b, c] = ['a', 'b', 'c'].map(obj);
  a.refs.push(b, c);
  b.refs.push(a);
  c.refs.push(b);
  const live = collect([c, b, a], [a]);
  expect(names(live)).toEqual(['c', 'b', 'a']);
});
test('survivors are white again', () => {
  const [a, b] = ['a', 'b'].map(obj);
  a.refs.push(b);
  const live = collect([a, b], [a]);
  expect(live.every((o) => !o.marked))
    .toBe(true);
  const again = collect(live, [a]);
  expect(names(again)).toEqual(['a', 'b']);
});
test('a long chain does not overflow', () => {
  const heap = [];
  for (let i = 0; i < 200000; i++) {
    const o = obj(i);
    if (i > 0) heap[i - 1].refs.push(o);
    heap.push(o);
  }
  const live = collect(heap, [heap[0]]);
  expect(live.length).toBe(200000);
});`,
    hints: [
      'Write a small `mark(o)`: if `o.marked` is already true, return; otherwise set it and push `o` onto `gray`. Call it on every root.',
      'Trace with `while (gray.length > 0)`: pop an object and call `mark` on each of its `refs`. The early return in `mark` handles cycles.',
      'Sweep with `heap.filter((o) => o.marked)`, then set `marked = false` on each survivor before returning them.',
    ],
    walkthrough: `**How to think about it.** Split the job into the chapter's two phases. Marking answers "which objects can the program reach?", starting from the roots and following \`refs\`; sweeping answers "what do we keep?", by going through the whole heap once. The one trap is the long chain in the last test: a \`mark\` that calls itself for every reference would need 200,000 nested calls, and JavaScript's call stack is far smaller than that. So marking keeps its own pile of grey objects in an ordinary array, which can grow as large as it needs.

**The solution, line by line.**

- \`const gray = [];\` is the grey stack: objects reached but not yet traced.
- \`const mark = (o) => { if (o.marked) return; o.marked = true; gray.push(o); };\` is \`markObject\`. Setting \`marked\` records "reached", pushing records "still to trace". The early return makes cycles safe: in the third test \`a\` refers to \`b\` and \`b\` back to \`a\`, and the second visit to \`a\` stops at once.
- \`roots.forEach(mark);\` makes every root grey.
- \`while (gray.length > 0) { gray.pop().refs.forEach(mark); }\` is the blacken loop: take any grey object, grey everything it refers to, and it is now black. The loop ends when nothing is grey, and by the tri-colour invariant every reachable object is then marked.
- \`const live = heap.filter((o) => o.marked);\` is the sweep: keep the marked objects, in heap order, and drop the rest. (The companion unlinks them from its object list instead of building a new array.)
- \`for (const o of live) { o.marked = false; }\` resets the survivors to white, ready for the next collection.
- \`return live;\`

**Common wrong attempts.**

- A recursive \`mark\` that calls \`o.refs.forEach(mark)\` directly passes the small tests but throws a \`RangeError\` on the 200,000-object chain: the host stack overflows.
- Forgetting to reset the marks works once; but at the next collection every survivor already looks marked, \`mark\` returns at once for it, its references are never traced, and objects reachable only through it are freed (the fourth test collects twice to catch this).
- Sweeping before marking has finished (for example, filtering inside the loop) frees objects that are still grey or white but reachable.`,
    wrong: [
      {
        code: `function collect(heap, roots) {
  const mark = (o) => {
    if (o.marked) return;
    o.marked = true;
    o.refs.forEach(mark);
  };
  roots.forEach(mark);
  const live = heap.filter(
    (o) => o.marked,
  );
  for (const o of live) {
    o.marked = false;
  }
  return live;
}`,
        why: 'Correct on small graphs, but it recurses once per link. On the 200 000-object chain the host stack overflows (`RangeError`). Use a grey stack.',
      },
      {
        code: `function collect(heap, roots) {
  const gray = [];
  const mark = (o) => {
    if (o.marked) return;
    o.marked = true;
    gray.push(o);
  };
  roots.forEach(mark);
  while (gray.length > 0) {
    gray.pop().refs.forEach(mark);
  }
  return heap.filter((o) => o.marked);
}`,
        why: 'Survivors keep `marked = true`. The next collection then skips them in `mark`, never traces their references, and frees objects that are still reachable.',
      },
    ],
  },
  weakTable: {
    optional: true,
    title: 'A weak string table',
    prompt:
      'The interning table is a `Map` from characters to string objects `{ chars, marked }`. Write `removeWhite(table)`: after marking, delete every entry whose string is not marked, and leave the marked ones (and their flags) alone.',
    starter: `function removeWhite(table) {
  // delete entries whose string
  // was not marked
}`,
    solution: `function removeWhite(table) {
  for (const [k, s] of table) {
    if (!s.marked) table.delete(k);
  }
}`,
    tests: `const str = (chars, marked) =>
  ({ chars, marked });
test('white strings are dropped', () => {
  const t = new Map();
  t.set('a', str('a', true));
  t.set('b', str('b', false));
  t.set('c', str('c', false));
  removeWhite(t);
  expect([...t.keys()]).toEqual(['a']);
});
test('marks are left alone', () => {
  const t = new Map();
  const a = str('a', true);
  t.set('a', a);
  removeWhite(t);
  expect(a.marked).toBe(true);
  expect(t.get('a') === a).toBe(true);
});`,
    hints: [
      'Loop over the entries with `for (const [k, s] of table)`.',
      'Deleting the current entry while iterating a `Map` is allowed in JavaScript.',
      '`if (!s.marked) table.delete(k);`',
    ],
    walkthrough: `**How to think about it.** After marking, a string is marked exactly when something other than the table can reach it, because the table is not a root. So the job is: forget every unmarked string, and touch nothing else. It must happen before sweep, because sweep is about to free exactly those strings, and the table must not be left pointing at any of them.

**The solution, line by line.**

- \`for (const [k, s] of table) {\` visits every entry: \`k\` is the characters, \`s\` the string object.
- \`if (!s.marked) table.delete(k);\` drops an entry whose string nothing else reaches. Deleting the current entry while looping over a \`Map\` is allowed in JavaScript.
- Nothing else: the marks are left alone, because sweep still needs them to know what to keep.

**Common wrong attempts.**

- Resetting \`s.marked = false\` here, to be tidy, makes sweep think every string is white, so it frees live strings too.
- Deleting marked strings instead of unmarked ones (a flipped condition) keeps garbage and forgets live strings, so the next \`copyString\` of a live string's characters makes a duplicate, and \`==\` by identity breaks.

The companion's \`Table.removeWhite\` does the same over its key array, writing a tombstone into each emptied slot so later probes still work (the chapter "Finding things fast: hash tables").`,
    wrong: [
      {
        code: `function removeWhite(table) {
  for (const [k, s] of table) {
    if (!s.marked) table.delete(k);
    s.marked = false;
  }
}`,
        why: 'It removes the right entries but also clears the marks. Sweep runs next and would then free every string, including the live ones.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'During marking, `blacken` takes an object off the grey stack. What does it do?',
    options: [
      { t: 'Frees it', why: 'Nothing is freed during marking; freeing is the sweep’s job.' },
      { t: 'Marks every object it refers to, turning white ones grey', correct: true, why: 'That is tracing. Afterwards the popped object is black: reached and fully traced.' },
      { t: 'Resets its mark to white', why: 'Sweep resets survivors, after marking is finished.' },
      { t: 'Pushes it back if it has fields', why: 'Each object is traced once; the objects its fields hold are pushed instead.' },
    ],
  },
  {
    q: 'A Drip list holds itself: `let a = []; push(a, a);`. What happens when the collector blackens it?',
    options: [
      { t: 'Marking loops for ever', why: '`markObject` returns at once for an object already marked, so the self-reference stops there.' },
      { t: 'The list is freed, because a cycle is garbage', why: 'It is reachable from the global `a`, so it is live; cycles are only garbage when no root reaches them.' },
      { t: '`markValue(a)` sees `isMarked` already set and does nothing more', correct: true, why: 'The early return is what makes cycles, including a list inside itself, safe.' },
      { t: 'A stack overflow', why: 'The grey stack is an array, and the self-reference is never pushed twice.' },
    ],
  },
  {
    q: 'Why does the collector call `strings.removeWhite()` between marking and sweeping?',
    options: [
      { t: 'To free strings faster than sweep would', why: 'Sweep frees them either way; the point is the table’s references.' },
      { t: 'To mark every interned string as a root', why: 'That is exactly what a weak table avoids; otherwise no string would ever die.' },
      { t: 'Because sweep cannot see strings', why: 'Strings are on the object list like every other object.' },
      { t: 'So the string table never points at a string that sweep frees', correct: true, why: 'After marking it knows which strings are live; before sweeping it can still drop the rest.' },
    ],
  },
  {
    q: 'A collection has just finished with 3 MiB of objects still live. When will the next one start?',
    options: [
      { t: 'When `bytesAllocated` passes 6 MiB', correct: true, why: '`nextGC` is set to twice what survived (at least 1 MiB), so it waits until the heap doubles.' },
      { t: 'On the next allocation', why: 'Only in stress mode. Normally the VM waits for `nextGC`.' },
      { t: 'After another 1 MiB is allocated', why: '1 MiB is only the floor. Here twice the live size is larger.' },
      { t: 'Never, until the program ends', why: 'Collections continue whenever allocation passes the threshold.' },
    ],
  },
  {
    q: 'Sweep is walking the object list. `prev` is a kept object and `o` is unmarked. What happens?',
    options: [
      { t: '`o` is reset to white and kept', why: 'Only marked objects are kept; an unmarked one is garbage.' },
      { t: '`o` is pushed on the grey stack', why: 'Marking is over; sweep never greys anything.' },
      { t: '`o` steps on to the next object, and `prev.next` is set to it, unlinking the dead one', correct: true, why: 'With nothing in the VM referring to it any more, V8 can reclaim it.' },
      { t: 'The whole list is rebuilt', why: 'Sweep changes one link per dead object, in a single walk.' },
    ],
  },
];
