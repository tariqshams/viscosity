// Chapter 58 cards. Keys are stable ids: never rename them.

export const prompts = {
  'why-own-gc': {
    q: 'The VM runs on JavaScript, which has a garbage collector. Why does the VM still need its own?',
    a: 'Its object list refers to every object it ever allocated, so V8 sees them all as alive. Only the VM knows what Drip code can still reach.',
  },
  'gc-def': {
    q: 'Which objects may a tracing garbage collector free?',
    a: 'Those that no chain of references from the roots can reach.',
  },
  'roots-list': {
    q: 'Name four kinds of root in the companion VM.',
    a: 'Any four of: the value stack, each frame’s closure, open upvalues, globals (keys and values), the `init` string, the compiler’s unfinished functions.',
  },
  cycle: {
    q: 'Two instances refer only to each other, and nothing else refers to either. Does mark-sweep free them?',
    a: 'Yes. Marking never reaches them from a root, so both stay white and are swept.',
  },
  'grey-meaning': {
    q: 'In tri-colour marking, what does it mean for an object to be grey?',
    a: 'It has been reached (marked), but the objects it refers to haven’t been traced yet.',
  },
  'why-gray-stack': {
    q: 'Why does the collector trace with an explicit grey stack instead of recursion?',
    a: 'A long chain of objects would recurse that many calls deep and overflow the host stack. An array can grow as large as needed.',
  },
  'weak-strings': {
    q: 'What would go wrong if sweep freed strings but the interning table kept their entries?',
    a: '`copyString` could find and return a freed string, so live code would hold a dead object.',
  },
  'stress-mode': {
    q: 'What does stress mode do, and why is it useful?',
    a: 'It collects on every allocation (and poisons freed objects), so a missing root shows up at once as a use-after-free error.',
  },
  'define-native': {
    q: 'Why does `defineNative` push the name string onto the value stack before allocating the native?',
    a: 'Allocating may trigger a collection, and the name isn’t reachable from any root yet, so it would be freed.',
  },
};

export const examples = {};

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
    walkthrough: `This is \`Heap.collect\` from the companion, with \`refs\` standing in for the type-by-type \`blacken\`.

\`\`\`js
const mark = (o) => {
  if (o.marked) return;
  o.marked = true;
  gray.push(o);
};
\`\`\`

- **Mark means grey.** Setting \`marked\` records "reached"; pushing onto \`gray\` records "not traced yet". An object on the stack is grey; once popped and traced, it is black.
- **The early return** is what makes cycles safe. Without it, \`a → b → a\` would push the same objects forever.

\`\`\`js
roots.forEach(mark);
while (gray.length > 0) {
  gray.pop().refs.forEach(mark);
}
\`\`\`

- **An explicit stack, not recursion.** A recursive \`mark\` would be one host call per link, and the 200 000-long chain in the last test would overflow the call stack. The array just grows.

\`\`\`js
const live = heap.filter(
  (o) => o.marked,
);
for (const o of live) {
  o.marked = false;
}
\`\`\`

- **Sweep** keeps the marked objects and drops the rest; the companion unlinks them from its object list instead of building a new array.
- **Reset to white**, or the next collection would think every survivor was already marked and never trace through it.`,
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
    walkthrough: `\`\`\`js
function removeWhite(table) {
  for (const [k, s] of table) {
    if (!s.marked) table.delete(k);
  }
}
\`\`\`

The table must run *after* marking and *before* sweeping. After marking, a string is marked exactly when something other than the table can reach it. Before sweeping, because sweep is about to free every unmarked string, and the table must not be left pointing at any of them. Don't reset the marks here: sweep does that, and it still needs them to know what to keep.

The companion's \`Table.removeWhite\` does the same over its key array, writing a tombstone into each emptied slot so later probes still work (chapter 51).`,
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
    q: 'Why does the companion VM need a collector even though V8 already has one?',
    options: [
      { t: 'V8’s collector is turned off inside the VM', why: 'It isn’t. V8 is collecting the whole time; it just can’t tell which VM objects are dead.' },
      { t: 'The VM’s object list refers to every object, so V8 sees them all as alive', correct: true, why: 'Only the VM can tell which objects Drip code can reach. Once it unlinks the rest, V8 can reclaim them.' },
      { t: 'V8 can’t collect objects created by TypeScript code', why: 'TypeScript compiles to JavaScript; its objects are ordinary V8 objects.' },
      { t: 'Drip values are stored outside the JavaScript heap', why: 'They are ordinary JavaScript objects and primitives.' },
    ],
  },
  {
    q: 'Which of these is *not* a root of the companion VM?',
    options: [
      { t: 'A value in a live stack slot', why: 'The stack is the first root `markRoots` visits.' },
      { t: 'The closure of each call frame', why: 'Running code needs its function’s constants, so frames’ closures are roots.' },
      { t: 'A global variable’s value', why: 'Globals can be read by name at any time, so they are roots.' },
      { t: 'A field of an instance', correct: true, why: 'Fields are reached through their instance during marking. If the instance is unreachable, so are its fields.' },
    ],
  },
  {
    q: 'During marking, `blacken` pops an object off the grey stack. What does it do?',
    options: [
      { t: 'Marks every object it refers to, turning white ones grey', correct: true, why: 'That is tracing. After it, the popped object is black: reached and fully traced.' },
      { t: 'Frees it', why: 'Nothing is freed during marking. Freeing is the sweep’s job.' },
      { t: 'Resets its mark to white', why: 'Sweep resets survivors, after marking is finished.' },
      { t: 'Pushes it back if it has fields', why: 'Each object is traced once. Its fields’ objects are pushed instead.' },
    ],
  },
  {
    q: 'Objects `a` and `b` refer only to each other, and nothing else refers to them. After a collection:',
    options: [
      { t: 'Both survive, because each is referenced', why: 'Being referenced isn’t enough; the reference has to come, indirectly, from a root.' },
      { t: 'Marking loops forever', why: '`markObject` returns at once for an object already marked, so cycles are safe. Here they aren’t even reached.' },
      { t: 'Both are freed', correct: true, why: 'No root leads to them, so they stay white and the sweep unlinks them.' },
      { t: 'One survives, chosen at random', why: 'Collection is deterministic: reachability decides.' },
    ],
  },
  {
    q: 'Why does the collector call `strings.removeWhite()` between marking and sweeping?',
    options: [
      { t: 'To free strings faster than sweep would', why: 'Sweep frees them either way. The point is the table’s pointers.' },
      { t: 'So the string table never points at a string that sweep frees', correct: true, why: 'The table is weak: it mustn’t keep strings alive, and it mustn’t hand out dead ones afterwards.' },
      { t: 'To mark every interned string as a root', why: 'That is exactly what a weak table avoids; otherwise no string would ever die.' },
      { t: 'Because sweep can’t see strings', why: 'Strings are on the object list like every other object.' },
    ],
  },
  {
    q: 'A collection just finished with 3 MiB of objects still live. When will the next one start?',
    options: [
      { t: 'On the next allocation', why: 'Only in stress mode. Normally the VM waits for `nextGC`.' },
      { t: 'After another 1 MiB is allocated', why: '1 MiB is only the minimum threshold. Here twice the live size is larger.' },
      { t: 'Never, until the program ends', why: 'Collections continue whenever allocation passes the threshold.' },
      { t: 'When `bytesAllocated` passes 6 MiB', correct: true, why: '`nextGC` is set to `bytesAllocated * 2` (at least 1 MiB), so it waits until the heap doubles.' },
    ],
  },
];
