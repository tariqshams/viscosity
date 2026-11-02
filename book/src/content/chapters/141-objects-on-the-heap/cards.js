// Chapter 141 cards. Keys are stable ids: never rename them.

export const prompts = {
  'why-heap': {
    q: 'Why can’t a string’s characters, or a list’s elements, live directly in a stack slot?',
    a: 'Slots are all one fixed size, and a string or a list can be any length.',
  },
  'obj-header': {
    q: 'Which two header fields does every companion-VM object share, and what is each for?',
    a: '`isMarked`, for the garbage collector’s marking, and `next`, which links the object list.',
  },
  isobj: {
    q: 'Why does `isObj` check `v !== null` as well as `typeof v === \'object\'`?',
    a: '`typeof null` is `\'object\'`, and `null` is the VM’s `none`, which is not a heap object.',
  },
  'literal-when': {
    q: 'When is the string object for the literal `"tea"` made?',
    a: 'At compile time: the compiler calls `copyString` and puts the object in the constant pool.',
  },
  'concat-new': {
    q: 'What does `"tea" + "pot"` do at run time?',
    a: '`add` sees two strings, joins their characters, and `copyString` makes the string object `"teapot"`.',
  },
  'peek-not-pop': {
    q: 'Why does `add` peek at its string operands, and shrink the stack only after the new string is made?',
    a: 'Making an object may run the garbage collector, which treats everything on the stack as in use, so the operands cannot be freed mid-way.',
  },
  'object-list-why': {
    q: 'Why does the VM link every object it allocates onto one list?',
    a: 'So it can always find every object, including unreachable ones, to free them later.',
  },
  'poison-cost': {
    q: 'Why is poisoning freed objects off by default in the companion VM?',
    a: 'Deleting every property pushes each dead object into V8’s slower dictionary properties; profiling found it was over half the runtime, so it is debug-only.',
  },
};

export const examples = {
  concat: {
    title: 'Strings on the VM',
    lang: 'drip-vm',
    expectError: true,
    code: `let s = "tea" + "pot";
print s;
let t = s;
print t == s;
print t + "s";
print "1" + 2;`,
  },
};

const ctor = `class Heap {
  constructor() {
    this.objects = null;
  }`;

const newString = `  newString(chars) {
    return this.allocate({
      type: 'string', chars, next: null,
    });
  }`;

export const exercises = {
  miniHeap: {
    title: 'An object list',
    prompt:
      'Finish this tiny heap. `allocate(o)` must link `o` in at the **head** of `this.objects` (through `o.next`) and return it. `live()` must walk the list and return how many objects are on it. `newString` is done for you.',
    starter: `${ctor}
  allocate(o) {
    return o;
  }
${newString}
  live() {
    return 0;
  }
}`,
    solution: `${ctor}
  allocate(o) {
    o.next = this.objects;
    this.objects = o;
    return o;
  }
${newString}
  live() {
    let n = 0;
    let o = this.objects;
    while (o !== null) {
      n++;
      o = o.next;
    }
    return n;
  }
}`,
    tests: `test('an empty heap', () => {
  const h = new Heap();
  expect(h.objects).toBe(null);
  expect(h.live()).toBe(0);
});
test('the newest object is at the head', () => {
  const h = new Heap();
  h.newString('a');
  const b = h.newString('b');
  expect(h.objects).toBe(b);
  expect(h.objects.next.chars).toBe('a');
  expect(h.objects.next.next).toBe(null);
});
test('live() counts every object', () => {
  const h = new Heap();
  for (const c of ['x', 'y', 'z']) {
    h.newString(c);
  }
  expect(h.live()).toBe(3);
});
test('equal strings are separate objects', () => {
  const h = new Heap();
  const p = h.newString('hi');
  const q = h.newString('hi');
  expect(p === q).toBe(false);
  expect(h.live()).toBe(2);
});`,
    hints: [
      'The new object becomes the head, so whatever was the head before must become its `next`.',
      'Order matters: set `o.next = this.objects` before you overwrite `this.objects`.',
      'For `live()`, start at `this.objects` and follow `next` until you reach `null`, counting as you go.',
    ],
    walkthrough: `**How to think about it.** A linked list is a chain of objects where each one knows only the one after it, through \`next\`, and the heap keeps just one thing: \`this.objects\`, the first object in the chain. To add a new object at the front, two things must change: the new object must point at whatever used to be first, and the heap must start pointing at the new object. Draw it with boxes and arrows before writing it, because the order of those two changes is the whole exercise. Counting is the other half: start at the head and keep following \`next\` until there is nothing left.

**The solution, line by line.**

- \`allocate(o) {\` receives the new object, whose \`next\` is still \`null\`.
- \`  o.next = this.objects;\` makes the new object point at the old head (or at \`null\`, if the heap was empty). Nothing is lost yet, because \`this.objects\` still refers to the old head too.
- \`  this.objects = o;\` moves the head to the new object. The old head is still reachable, one step down, through \`o.next\`.
- \`  return o;\` hands the object back, so \`newString\` can return it to its caller.
- \`live() {\` counts the chain.
- \`  let n = 0;\` is the count so far.
- \`  let o = this.objects;\` starts at the newest object.
- \`  while (o !== null) {\` keeps going until we step off the end of the chain.
- \`    n++;\` counts the object we are standing on.
- \`    o = o.next;\` steps to the next older object.
- \`  return n;\` is the number of objects on the list.

Neither line of \`allocate\` walks the list, so making an object costs the same with three objects on the list or three million; only \`live()\` walks, and the companion VM's \`liveObjects()\` is exactly this loop, written as a \`for\`.

**Common wrong attempts.**

- Only \`this.objects = o;\` moves the head but never links the new object to the old one, so every older object falls off the list and \`live()\` is never more than 1.
- The two lines swapped (\`this.objects = o; o.next = this.objects;\`): by the time \`o.next\` is set, \`this.objects\` is already \`o\`, so the object points at itself, everything older is lost, and a plain \`while (o !== null)\` loop would never end.

(One difference from the companion VM: its \`copyString\` first looks for an existing string with the same characters, as the chapter "String interning" explains; this mini heap makes a new object every time, which is why the last test expects two.)`,
    wrong: [
      {
        code: `${ctor}
  allocate(o) {
    this.objects = o;
    return o;
  }
${newString}
  live() {
    let n = 0;
    let o = this.objects;
    while (o !== null) {
      n++;
      o = o.next;
    }
    return n;
  }
}`,
        why: 'The head moves, but the new object never points at the old one, so every older object falls off the list. `live()` is never more than 1.',
      },
      {
        code: `${ctor}
  allocate(o) {
    this.objects = o;
    o.next = this.objects;
    return o;
  }
${newString}
  live() {
    let n = 0;
    let o = this.objects;
    while (o && n < 100) {
      n++;
      o = o.next;
    }
    return n;
  }
}`,
        why: 'Wrong order: by the time `o.next` is set, `this.objects` is already `o`, so the object points at itself and the older objects are lost.',
      },
    ],
  },
  unlinkObj: {
    optional: true,
    title: 'Taking an object off the list',
    prompt:
      'The collector’s sweep (in “Reclaiming memory: mark and sweep”) removes dead objects from the list. Write `unlink(heap, dead)`: remove the object `dead` from the list starting at `heap.objects`, whether it is the head, in the middle or at the end. Keep a `prev` pointer as you walk.',
    starter: `function unlink(heap, dead) {
  // remove dead from heap.objects
}`,
    solution: `function unlink(heap, dead) {
  let prev = null;
  let o = heap.objects;
  while (o !== null) {
    if (o === dead) {
      if (prev) prev.next = o.next;
      else heap.objects = o.next;
      return;
    }
    prev = o;
    o = o.next;
  }
}`,
    tests: `const chain = (...cs) => {
  let head = null;
  for (const c of cs.reverse()) {
    head = { chars: c, next: head };
  }
  return { objects: head };
};
const list = (h) => {
  const out = [];
  for (let o = h.objects; o; o = o.next) {
    out.push(o.chars);
  }
  return out;
};
test('remove from the middle', () => {
  const h = chain('c', 'b', 'a');
  unlink(h, h.objects.next);
  expect(list(h)).toEqual(['c', 'a']);
});
test('remove the head', () => {
  const h = chain('c', 'b', 'a');
  unlink(h, h.objects);
  expect(list(h)).toEqual(['b', 'a']);
});
test('remove the tail', () => {
  const h = chain('c', 'b', 'a');
  unlink(h, h.objects.next.next);
  expect(list(h)).toEqual(['c', 'b']);
});`,
    hints: [
      'In a singly linked list you can only change the `next` of the object *before* `dead`, so remember it as you walk.',
      'If `dead` is the head, there is no object before it: move `heap.objects` instead.',
    ],
    walkthrough: `**How to think about it.** Each object knows only the object after it, so you cannot step backwards; to remove \`dead\`, the object *before* it has to skip over it, which means remembering that object as you walk. Call it \`prev\`. There is one special case: when \`dead\` is the very first object there is no object before it, and it is the heap's own \`objects\` that must move.

**The solution, line by line.**

- \`let prev = null;\` means "no object before this one yet".
- \`let o = heap.objects;\` starts at the head.
- \`while (o !== null) {\` walks the whole chain.
- \`  if (o === dead) {\` compares by identity: we want this exact object.
- \`    if (prev) prev.next = o.next;\` makes the previous object skip \`dead\`, in the middle or at the tail (where \`o.next\` is \`null\`, so \`prev\` becomes the new tail).
- \`    else heap.objects = o.next;\` handles the head: the list now starts at the second object.
- \`    return;\` stops, since the job is done.
- \`  prev = o;\` and \`  o = o.next;\` move both pointers one step along, \`prev\` always one behind \`o\`.

The companion VM's sweep is this loop with one change: it does not stop at the first match, but unlinks every unmarked object it meets in a single walk, keeping \`prev\` as it goes.

**Common wrong attempts.**

- Looking one ahead (\`if (o.next === dead) o.next = dead.next;\`) works in the middle and at the tail, but never checks the head itself, so removing the first object does nothing.
- Setting \`dead.next = null\` instead of changing the object before it cuts \`dead\` off from the rest of the list, but the object before it still points at \`dead\`, so it is still on the list and everything after it is lost.`,
    wrong: [
      {
        code: `function unlink(heap, dead) {
  let o = heap.objects;
  while (o !== null) {
    if (o.next === dead) {
      o.next = dead.next;
      return;
    }
    o = o.next;
  }
}`,
        why: 'This looks one ahead, which works in the middle and at the tail, but it never checks the head itself, so removing the first object does nothing.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'What does a stack slot hold for a Drip string?',
    options: [
      { t: 'The characters, packed into the slot', why: 'A slot has a fixed size, and a string can be any length.' },
      { t: 'The object tag and a reference to a string object on the heap', correct: true, why: 'The slot stays small; the object holds the characters.' },
      { t: 'The string’s length, with the characters in the constant pool', why: 'Strings made at run time, such as joins, are in no constant pool.' },
      { t: 'An index into a global array of strings', why: 'The companion VM uses a direct reference, not an index.' },
    ],
  },
  {
    q: 'When does the string object for the literal in `print "hi";` get made?',
    options: [
      { t: 'Every time `print` runs', why: 'Printing reads the object; it does not make one.' },
      { t: 'When the `const` instruction runs', why: 'By then it already exists: `const` only pushes it from the pool.' },
      { t: 'When the garbage collector runs', why: 'The collector frees objects; it never makes them.' },
      { t: 'At compile time, when the compiler meets the string token', correct: true, why: 'The compiler calls `copyString` and stores the object in the constant pool.' },
    ],
  },
  {
    q: 'Why does `add` peek at two strings and shrink the stack only after `copyString` returns?',
    options: [
      { t: 'Peeking is faster than popping', why: 'Speed is not the reason; the stack shrinks anyway, a moment later.' },
      { t: 'So the operands stay on the stack, where the garbage collector treats them as in use, in case making the new string starts a collection', correct: true, why: 'Popped too early, the operands might be freed while their characters are being joined.' },
      { t: 'Because `copyString` reads its arguments from the stack', why: 'It takes the joined characters as an ordinary argument.' },
      { t: 'So that a type error can still be reported', why: 'The kinds are checked before either branch runs; the order is about the collector.' },
    ],
  },
  {
    q: 'Where does `allocate` put a new object on the object list?',
    options: [
      { t: 'At the head, by setting its `next` to the old head', correct: true, why: 'Two assignments, the same work however long the list is.' },
      { t: 'At the tail, so the list stays in the order objects were made', why: 'That would mean walking the whole list, or keeping a second pointer, on every allocation.' },
      { t: 'In order of type', why: 'The list has no order other than newest first.' },
      { t: 'Nowhere: only reachable objects are listed', why: 'Every object is listed, reachable or not. That is the point.' },
    ],
  },
  {
    q: 'After `let s = "x"; s = s + "a"; s = s + "a";`, why is `"xa"` still on the object list?',
    options: [
      { t: 'Because `s` still refers to it', why: '`s` refers to `"xaa"` now.' },
      { t: 'Because the constant pool holds it', why: '`"xa"` was made at run time; only `"x"` and `"a"` are constants.' },
      { t: 'Nothing has taken it off: the list holds every allocation until a collection sweeps the garbage', correct: true, why: 'That is how the collector will find it: by walking the list.' },
      { t: 'Because strings are never garbage', why: 'Unreachable strings are garbage like anything else.' },
    ],
  },
];
