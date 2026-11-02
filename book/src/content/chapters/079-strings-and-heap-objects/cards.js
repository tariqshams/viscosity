// Chapter 79 cards. Keys are stable ids: never rename them.

export const prompts = {
  'why-heap': {
    q: 'Why can’t a string’s characters live directly in a stack slot?',
    a: 'Slots are all one fixed size, and a string can be any length.',
  },
  'obj-header': {
    q: 'Which two header fields does every companion-VM object share, and what is each for?',
    a: '`isMarked`, for the garbage collector’s marking, and `next`, which links the object list.',
  },
  'type-field': {
    q: 'How does the VM tell an `ObjString` from an `ObjClosure`?',
    a: 'By its `type` field: `Obj` is a discriminated union on `type`.',
  },
  isobj: {
    q: 'Why does `isObj` check `v !== null` as well as `typeof v === \'object\'`?',
    a: '`typeof null` is `\'object\'`, and `null` is the VM’s `nil`, which is not a heap object.',
  },
  'literal-when': {
    q: 'When is the string object for the literal `"tea"` made?',
    a: 'At compile time: the compiler calls `copyString` and puts the object in the constant pool.',
  },
  'concat-new': {
    q: 'What does `"tea" + "pot"` do at runtime?',
    a: '`OP_ADD` sees two strings, joins their characters, and allocates a new string object, `"teapot"`.',
  },
  'peek-not-pop': {
    q: 'Why does `OP_ADD` peek at its string operands, and pop them only after allocating?',
    a: 'Allocating may run the garbage collector. On the stack, the operands are roots, so they can’t be freed mid-way.',
  },
  'object-list-why': {
    q: 'Why does the VM link every object it allocates onto one list?',
    a: 'So it can always find every object, including unreachable ones, to free them later.',
  },
  'head-insert': {
    q: 'Where does `allocate` put a new object on the list, and why there?',
    a: 'At the head: it takes constant time, with no walking.',
  },
  'poison-cost': {
    q: 'Why did poisoning freed objects make the companion VM so slow?',
    a: 'Deleting every property moved each dead object into V8’s slow dictionary mode. It cost over half the time, so it is now debug-only.',
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
    walkthrough: `\`\`\`js
allocate(o) {
  o.next = this.objects;
  this.objects = o;
  return o;
}

live() {
  let n = 0;
  let o = this.objects;
  while (o !== null) {
    n++;
    o = o.next;
  }
  return n;
}
\`\`\`

- **Head insertion** is two assignments, in this order. First the new object points at the old head, then the head moves to the new object. Swap them and \`o.next\` points at \`o\` itself: the list becomes a loop of one, and everything older is lost.
- **Constant time.** \`allocate\` never walks the list, however long it is. Only \`live()\` walks, and the companion VM’s \`liveObjects()\` is exactly this loop.
- **No interning yet.** Two \`newString('hi')\` calls make two objects. The companion VM avoids that, which is chapter 81’s story.`,
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
      'The collector’s sweep (chapter 87) removes dead objects from the list. Write `unlink(heap, dead)`: remove the object `dead` from the list starting at `heap.objects`, whether it is the head, in the middle or at the end. Keep a `prev` pointer as you walk.',
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
    walkthrough: `\`\`\`js
function unlink(heap, dead) {
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
}
\`\`\`

Each object knows only the one after it, so removing \`dead\` means making the object *before* it skip over it. \`prev\` is that object, or \`null\` when \`dead\` is the head, in which case the list’s start moves instead. The companion VM’s sweep does exactly this, inside the loop that walks the whole list once: it keeps \`prev\` and unlinks every unmarked object it meets.`,
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
      { t: 'The obj tag and a reference to a string object on the heap', correct: true, why: 'The slot stays small; the object holds the characters.' },
      { t: 'The string’s length, with the characters in the constant pool', why: 'Runtime strings, such as concatenations, aren’t in any constant pool.' },
      { t: 'An index into a global string array', why: 'The companion VM uses a direct reference, not an index.' },
    ],
  },
  {
    q: 'When does the string object for the literal in `print "hi";` get created?',
    options: [
      { t: 'Every time `OP_PRINT` runs', why: 'Printing reads the object; it doesn’t make one.' },
      { t: 'When `OP_CONSTANT` runs', why: 'By then it already exists: `OP_CONSTANT` only pushes it from the pool.' },
      { t: 'At compile time, when the compiler meets the string token', correct: true, why: 'The compiler calls `copyString` and stores the object in the constant pool.' },
      { t: 'When the garbage collector runs', why: 'The collector frees objects; it never makes them.' },
    ],
  },
  {
    q: 'Why does `OP_ADD` peek at two strings and pop them only after `copyString` returns?',
    options: [
      { t: 'Peeking is faster than popping', why: 'Speed isn’t the reason; it ends up popping both anyway.' },
      { t: 'To keep the operands on the stack, where the garbage collector treats them as in use, in case allocating starts a collection', correct: true, why: 'The stack is a root. Popped too early, the operands might be freed mid-way.' },
      { t: 'Because `copyString` reads its arguments from the stack', why: 'It takes the joined characters as a normal argument.' },
      { t: 'So that a type error can still be reported', why: 'The type check happens before either path; the order of popping is about the collector.' },
    ],
  },
  {
    q: 'Where does `allocate` put a new object on the object list?',
    options: [
      { t: 'At the head, by setting its `next` to the old head', correct: true, why: 'Two assignments, constant time, no walking.' },
      { t: 'At the tail, so the list stays in creation order', why: 'That would mean walking the whole list, or keeping an extra tail pointer, on every allocation.' },
      { t: 'In sorted order by type', why: 'The list has no order other than newest first.' },
      { t: 'Nowhere: only reachable objects are listed', why: 'Every object is listed, reachable or not. That is the whole point.' },
    ],
  },
  {
    q: 'After `let s = "x"; s = s + "a"; s = s + "a";`, why is `"xa"` still on the object list?',
    options: [
      { t: 'Because `s` still points at it', why: '`s` points at `"xaa"` now.' },
      { t: 'Because the constant pool holds it', why: '`"xa"` was made at runtime; only `"x"` and `"a"` are constants.' },
      { t: 'Because strings are never garbage', why: 'Unreachable strings are garbage like anything else.' },
      { t: 'Nothing has removed it: the list holds every allocation until a collection sweeps the garbage', correct: true, why: 'That is how the collector will find it: by walking the list.' },
    ],
  },
  {
    q: 'What did profiling find about the companion VM’s “poisoning” of freed objects?',
    options: [
      { t: 'It caught a real use-after-free in the benchmark programs', why: 'It is a safety net for bugs; the finding was about its cost.' },
      { t: 'It had no measurable cost', why: 'It cost more than half the time on allocation-heavy programs.' },
      { t: 'Deleting every property moved dead objects into V8’s slow dictionary mode, costing over half the runtime, so it became debug-only', correct: true, why: 'The commit records `instantiation` dropping from 19.4 s to 3.6 s.' },
      { t: 'It made strings print incorrectly', why: 'Poisoning only affects objects that are already dead.' },
    ],
  },
];
