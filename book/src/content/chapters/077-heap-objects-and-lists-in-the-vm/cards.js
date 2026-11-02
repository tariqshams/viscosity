// Chapter 77 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'why-heap': {
    q: 'Why can’t a string’s characters, or a list’s elements, live directly in a stack slot?',
    a: 'Slots are all one fixed size, and a string or a list can be any length.',
  },
  'obj-header': {
    q: 'Which two header fields does every heap object in the companion Drip VM share, and what is each for?',
    a: '`isMarked`, for the garbage collector’s marking, and `next`, which links the object list.',
  },
  'literal-when': {
    q: 'In a single-pass bytecode compiler such as the companion Drip compiler, when is the string object for the literal `"tea"` made?',
    a: 'At compile time: the compiler calls `copyString` and puts the object in the constant pool.',
  },
  'peek-not-pop': {
    q: 'In a VM with a garbage collector, why does a string-joining `add` peek at its operands and shrink the stack only after the new string is made?',
    a: 'Making an object may run the garbage collector, which treats everything on the stack as in use, so the operands cannot be freed mid-way.',
  },
  'object-list-why': {
    q: 'Why does a VM that manages its own memory link every object it allocates onto one list?',
    a: 'So it can always find every object, including unreachable ones, to free them later.',
  },
  'list-operand': {
    q: 'In the companion Drip VM, what does the instruction `list 3` do?',
    a: 'It takes the top 3 values off the stack, in order, makes a new list object holding them, and pushes one reference to it.',
  },
  'index-order': {
    q: 'In what order does the companion Drip VM check a list access such as `xs[i]`?',
    a: 'Is it a list? Is the index a number? A whole number? In range (0 up to, not including, the length)?',
  },
  'no-grow-by-index': {
    q: 'In Drip, what does `xs[len(xs)] = 4;` do when `xs` has 3 elements?',
    a: 'Stops with `index 3 is out of range for a list of length 3`: writing can replace an element, never add one. Use `push`.',
  },
};

export const examples = {
  sieve: {
    title: 'A small sieve on the VM',
    lang: 'drip-vm',
    code: `# primes below 30, with a list of flags
let n = 30;
let flags = [];
for i in 0..n {
  push(flags, true);
}
let primes = [];
for i in 2..n {
  if flags[i] {
    push(primes, i);
    let j = i * i;
    while j < n {
      flags[j] = false;
      j += i;
    }
  }
}
print primes;
print len(primes);`,
  },
};

export const exercises = {
  miniHeap: {
    title: 'An object list',
    prompt: 'Finish this tiny heap. `allocate(o)` must link `o` in at the **head** of `this.objects` (through `o.next`) and return it. `live()` must walk the list and return how many objects are on it. `newString` is done for you.',
    starter: `class Heap {
  constructor() {
    this.objects = null;
  }
  allocate(o) {
    return o;
  }
  newString(chars) {
    return this.allocate({
      type: 'string', chars, next: null,
    });
  }
  live() {
    return 0;
  }
}`,
    solution: `class Heap {
  constructor() {
    this.objects = null;
  }
  allocate(o) {
    o.next = this.objects;
    this.objects = o;
    return o;
  }
  newString(chars) {
    return this.allocate({
      type: 'string', chars, next: null,
    });
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

(One difference from the companion VM: its \`copyString\` first looks for an existing string with the same characters, as *String interning and globals by name* explains; this mini heap makes a new object every time, which is why the last test expects two.)`,
    wrong: [
      {
        code: `class Heap {
  constructor() {
    this.objects = null;
  }
  allocate(o) {
    this.objects = o;
    return o;
  }
  newString(chars) {
    return this.allocate({
      type: 'string', chars, next: null,
    });
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
}`,
        why: 'The head moves, but the new object never points at the old one, so every older object falls off the list. `live()` is never more than 1.',
      },
      {
        code: `class Heap {
  constructor() {
    this.objects = null;
  }
  allocate(o) {
    this.objects = o;
    o.next = this.objects;
    return o;
  }
  newString(chars) {
    return this.allocate({
      type: 'string', chars, next: null,
    });
  }
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
  growList: {
    optional: true,
    title: 'A list that grows itself',
    prompt: 'A VM written in C or Rust cannot lean on a growable array, so here is a list that manages its own room: `slots` is a block of `cap` slots, and the first `len` are in use. Write `push(v)`: when the list is full, make a new block **twice** as big (`new Array(...)`), copy the elements across one by one (adding 1 to `copies` for each), then store `v`. Write `get(i)` with Drip’s checks: a fraction throws `notWhole(i)` and an index outside 0 to `len - 1` throws `outOfRange(i, len)` (both messages are made for you).',
    starter: `const outOfRange = (i, n) =>
  \`index \${i} is out of range \` +
  \`for a list of length \${n}\`;
const notWhole = (i) =>
  \`index \${i} is not a whole number\`;

class GrowList {
  constructor() {
    this.cap = 2;
    this.len = 0;
    this.slots = new Array(2);
    this.copies = 0;
  }
  push(v) {
    this.slots.push(v);
    this.len++;
  }
  get(i) {
    return this.slots[i];
  }
}`,
    solution: `const outOfRange = (i, n) =>
  \`index \${i} is out of range \` +
  \`for a list of length \${n}\`;
const notWhole = (i) =>
  \`index \${i} is not a whole number\`;

class GrowList {
  constructor() {
    this.cap = 2;
    this.len = 0;
    this.slots = new Array(2);
    this.copies = 0;
  }
  push(v) {
    if (this.len === this.cap) {
      const cap = this.cap * 2;
      const bigger = new Array(cap);
      const n = this.len;
      for (let i = 0; i < n; i++) {
        bigger[i] = this.slots[i];
        this.copies++;
      }
      this.slots = bigger;
      this.cap = cap;
    }
    this.slots[this.len] = v;
    this.len++;
  }
  get(i) {
    if (!Number.isInteger(i)) {
      throw new Error(notWhole(i));
    }
    if (i < 0 || i >= this.len) {
      const n = this.len;
      throw new Error(outOfRange(i, n));
    }
    return this.slots[i];
  }
}`,
    tests: `const msg = (f) => {
  try { f(); } catch (e) { return e.message; }
  return 'no error';
};
const make = (vs) => {
  const xs = new GrowList();
  for (const v of vs) xs.push(v);
  return xs;
};
test('starts empty with room for 2', () => {
  const xs = new GrowList();
  expect(xs.len).toBe(0);
  expect(xs.slots.length).toBe(2);
});
test('two pushes fit without copying', () => {
  const xs = make(['a', 'b']);
  expect(xs.cap).toBe(2);
  expect(xs.copies).toBe(0);
  expect(xs.get(1)).toBe('b');
});
test('a full list doubles', () => {
  const xs = make(['a', 'b', 'c', 'd', 'e']);
  expect(xs.len).toBe(5);
  expect(xs.cap).toBe(8);
  expect(xs.slots.length).toBe(8);
  expect(xs.copies).toBe(6);
  expect(xs.get(0)).toBe('a');
  expect(xs.get(4)).toBe('e');
});
test('a hundred pushes copy under 200', () => {
  const xs = new GrowList();
  for (let i = 0; i < 100; i++) xs.push(i);
  expect(xs.get(99)).toBe(99);
  expect(xs.copies < 200).toBe(true);
});
test('bad indexes, with Drip\\'s messages', () => {
  const xs = make(['a', 'b', 'c']);
  expect(msg(() => xs.get(3))).toBe(
    'index 3 is out of range for a list of length 3');
  expect(msg(() => xs.get(-1))).toBe(
    'index -1 is out of range for a list of length 3');
  expect(msg(() => xs.get(1.5))).toBe(
    'index 1.5 is not a whole number');
});`,
    hints: [
      'Two separate jobs: `push` only has to act specially when `this.len === this.cap`; otherwise it stores `v` at index `this.len` and adds 1 to `len`. Do not use the array’s own `push`: the point is to manage the room yourself.',
      'When full: make `new Array(this.cap * 2)`, loop `i` from 0 to `this.len - 1` copying `this.slots[i]` into it (and counting each copy), then make the new block `this.slots` and update `this.cap`.',
      'For `get`, test `Number.isInteger(i)` first, then `i < 0 || i >= this.len`; the last valid index is `len - 1`, so `i === len` is out of range.',
    ],
    walkthrough: `**How to think about it.** The list has two sizes, and keeping them apart is the whole exercise: \`cap\` is how many slots the block has, and \`len\` is how many of them hold elements. A push into spare room is one store and one increment. A push into a full block needs room first, and a block cannot be stretched, so you make a new, bigger one and move everything into it. Doubling is the choice that keeps that rare: after a growth to 8 slots, the next three pushes are cheap, and after a growth to 16, the next seven are. Try it on paper with the test's five pushes: growth at the third push (copy 2) and at the fifth (copy 4), 6 copies in all, capacity 8.

**The solution, line by line.**

- \`push(v) {\` takes the value to add.
- \`  if (this.len === this.cap) {\` asks whether every slot is in use; only then is there work to do.
- \`    const cap = this.cap * 2;\` works out the new capacity, double the old.
- \`    const bigger = new Array(cap);\` makes the new block, with all \`cap\` slots empty.
- \`    const n = this.len;\` and \`    for (let i = 0; i < n; i++) {\` walk the elements in use, from 0 up to \`len - 1\`.
- \`      bigger[i] = this.slots[i];\` copies one element into the same position in the new block.
- \`      this.copies++;\` counts that copy, so the tests can see what growing cost.
- \`    this.slots = bigger;\` switches the list to the new block; the old one is now garbage.
- \`    this.cap = cap;\` records the new capacity.
- \`  this.slots[this.len] = v;\` stores the value in the first unused slot, whose index is the old length (now there is certainly room).
- \`  this.len++;\` counts it.
- \`get(i) {\` reads one element.
- \`  if (!Number.isInteger(i))\` rejects \`1.5\` (and NaN) with \`notWhole(i)\`, the same message as the VM's \`checkIndex\`, and in the same order: whole first, then range.
- \`  if (i < 0 || i >= this.len)\` rejects anything before the start or at or past the length; note \`len\`, not \`cap\`: the spare slots exist but hold no elements.
- \`  return this.slots[i];\` returns the element.

**Common wrong attempts.**

- Growing by one (\`this.cap + 1\`) works, but every push into a full list copies everything, so five pushes cost 2 + 3 + 4 = 9 copies, and a hundred cost thousands; the capacity test catches it.
- Checking \`i > this.len\` lets \`get(len)\` through, and it returns \`undefined\` from a spare slot instead of stopping with the out-of-range message.
- Checking against \`this.cap\` instead of \`this.len\` has the same bug for every spare slot.
- Making the new block but forgetting to copy loses every element, so \`get(0)\` is \`undefined\` after the first growth.`,
    wrong: [
      {
        code: `const outOfRange = (i, n) =>
  \`index \${i} is out of range \` +
  \`for a list of length \${n}\`;
const notWhole = (i) =>
  \`index \${i} is not a whole number\`;

class GrowList {
  constructor() {
    this.cap = 2;
    this.len = 0;
    this.slots = new Array(2);
    this.copies = 0;
  }
  push(v) {
    if (this.len === this.cap) {
      const cap = this.cap + 1;
      const bigger = new Array(cap);
      const n = this.len;
      for (let i = 0; i < n; i++) {
        bigger[i] = this.slots[i];
        this.copies++;
      }
      this.slots = bigger;
      this.cap = cap;
    }
    this.slots[this.len] = v;
    this.len++;
  }
  get(i) {
    if (!Number.isInteger(i)) {
      throw new Error(notWhole(i));
    }
    if (i < 0 || i >= this.len) {
      const n = this.len;
      throw new Error(outOfRange(i, n));
    }
    return this.slots[i];
  }
}`,
        why: 'Grows by one slot, so every push into a full list copies everything again: five pushes cost 9 copies and leave a capacity of 5, not 8.',
      },
      {
        code: `const outOfRange = (i, n) =>
  \`index \${i} is out of range \` +
  \`for a list of length \${n}\`;
const notWhole = (i) =>
  \`index \${i} is not a whole number\`;

class GrowList {
  constructor() {
    this.cap = 2;
    this.len = 0;
    this.slots = new Array(2);
    this.copies = 0;
  }
  push(v) {
    if (this.len === this.cap) {
      const cap = this.cap * 2;
      const bigger = new Array(cap);
      const n = this.len;
      for (let i = 0; i < n; i++) {
        bigger[i] = this.slots[i];
        this.copies++;
      }
      this.slots = bigger;
      this.cap = cap;
    }
    this.slots[this.len] = v;
    this.len++;
  }
  get(i) {
    if (!Number.isInteger(i)) {
      throw new Error(notWhole(i));
    }
    if (i < 0 || i > this.len) {
      const n = this.len;
      throw new Error(outOfRange(i, n));
    }
    return this.slots[i];
  }
}`,
        why: '`i > this.len` lets `get(len)` through: it returns `undefined` from a spare slot instead of stopping with the out-of-range message.',
      },
    ],
  },
  unlinkObj: {
    optional: true,
    title: 'Taking an object off the list',
    prompt: 'The collector’s sweep (in “Reclaiming memory: mark and sweep”) removes dead objects from the list. Write `unlink(heap, dead)`: remove the object `dead` from the list starting at `heap.objects`, whether it is the head, in the middle or at the end. Keep a `prev` pointer as you walk.',
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
  markList: {
    optional: true,
    title: 'Marking through lists',
    prompt: 'Values are numbers or list objects `{ type: \'list\', items, isMarked }`. Write `markValue(v)`, the collector’s step for lists: a number is ignored; a list that is not yet marked gets `isMarked = true`, and then each of its items is marked the same way. It must finish even for a list that contains itself.',
    starter: `function markValue(v) {
  if (typeof v === 'number') return;
  v.isMarked = true;
}`,
    solution: `function markValue(v) {
  if (typeof v === 'number') return;
  if (v.isMarked) return;
  v.isMarked = true;
  for (const x of v.items) {
    markValue(x);
  }
}`,
    tests: `const list = (...items) =>
  ({ type: 'list', items, isMarked: false });
test('a nested list is marked all the way down', () => {
  const inner = list(1, 2);
  const outer = list(list(inner), 3);
  markValue(outer);
  expect(inner.isMarked).toBe(true);
  expect(outer.items[0].isMarked).toBe(true);
});
test('a list that contains itself', () => {
  const xs = list(1);
  xs.items.push(xs);
  markValue(xs);
  expect(xs.isMarked).toBe(true);
});
test('unreachable lists stay unmarked', () => {
  const a = list(1);
  const b = list(2);
  markValue(a);
  expect(b.isMarked).toBe(false);
});`,
    hints: [
      'A list keeps its items alive, so after marking a list you must mark each of its items, and their items in turn.',
      'Calling `markValue` on each item is natural, but a list that contains itself would then go round forever. What can you check first?',
      'Return straight away if `v.isMarked` is already true: that list, and everything it reaches, is being handled.',
    ],
    walkthrough: `**How to think about it.** Marking means "this is in use", and a list in use keeps its elements in use, so marking has to follow every reference from a list into its items, and from those items into theirs. Calling the same function on each item does that. The danger is a cycle: a list that contains itself would be visited again and again. The \`isMarked\` flag is the way out, because it already records "I have been here".

**The solution, line by line.**

- \`if (typeof v === 'number') return;\` skips plain values: a number is not an object, and there is nothing to mark.
- \`if (v.isMarked) return;\` stops at a list already marked, which is what makes cycles (and lists shared by two others) safe.
- \`v.isMarked = true;\` marks the list. It is set *before* visiting the items, so that if one of the items is this very list, the line above stops the visit.
- \`for (const x of v.items) {\` and \`markValue(x);\` follow every reference out of the list.

The companion VM does the same work without recursion: \`markObject\` sets \`isMarked\` and puts the object on a "grey" worklist, and a loop takes objects off it and calls \`blacken\`, whose \`'list'\` case marks each item. *Reclaiming memory: mark and sweep* explains why a worklist is the safer choice for very deep structures.

**Common wrong attempts.**

- Marking only the list (the starter) leaves its items unmarked, and a collector would free elements that are still in use.
- Visiting the items without checking \`isMarked\` first works for nested lists but never finishes on a list that contains itself (JavaScript eventually throws a stack overflow).
- Setting \`isMarked\` *after* the loop has the same problem: the self-reference is visited before the flag is set.`,
    wrong: [
      {
        code: `function markValue(v) {
  if (typeof v === 'number') return;
  for (const x of v.items) {
    markValue(x);
  }
  v.isMarked = true;
}`,
        why: 'The flag is set after the items are visited and never checked, so a list that contains itself is visited forever (a stack overflow).',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'In the companion Drip VM, why does `add` peek at two strings and shrink the stack only after `copyString` returns?',
    options: [
      {
        t: 'Peeking is faster than popping',
        why: 'Speed is not the reason; the stack shrinks anyway, a moment later.',
      },
      {
        t: 'So the operands stay on the stack, where the garbage collector treats them as in use, in case making the new string starts a collection',
        correct: true,
        why: 'Popped too early, the operands might be freed while their characters are being joined.',
      },
      {
        t: 'Because `copyString` reads its arguments from the stack',
        why: 'It takes the joined characters as an ordinary argument.',
      },
      {
        t: 'So that a type error can still be reported',
        why: 'The kinds are checked before either branch runs; the order is about the collector.',
      },
    ],
  },
  {
    q: 'In the companion Drip VM, where does `allocate` put a new object on the object list?',
    options: [
      {
        t: 'At the head, by setting its `next` to the old head',
        correct: true,
        why: 'Two assignments, the same work however long the list is.',
      },
      {
        t: 'At the tail, so the list stays in the order objects were made',
        why: 'That would mean walking the whole list, or keeping a second pointer, on every allocation.',
      },
      {
        t: 'In order of type',
        why: 'The list has no order other than newest first.',
      },
      {
        t: 'Nowhere: only reachable objects are listed',
        why: 'Every object is listed, reachable or not. That is the point.',
      },
    ],
  },
  {
    q: 'The companion Drip compiler meets the list literal `[a, b, c]`. What does it emit?',
    options: [
      {
        t: 'The code for `a`, `b` and `c`, in that order, then `list 3`',
        correct: true,
        why: 'The elements are left on the stack in source order, and `list 3` gathers them into one object.',
      },
      {
        t: '`list 3` first, then three `index.set` instructions',
        why: 'The list is built from values already on the stack, in one instruction.',
      },
      {
        t: 'A single `const` holding the whole list',
        why: 'Lists are made at run time, because each run needs a new list and the elements may be any expressions.',
      },
      {
        t: 'Three `push` calls on an empty list',
        why: '`push` is a native function for programs to call; a literal compiles to `list n`.',
      },
    ],
  },
  {
    q: 'What does `print "abc"[1.5];` report on the companion Drip VM?',
    options: [
      {
        t: '`index 1.5 is not a whole number`',
        why: 'That check comes later: the first test is whether the value being indexed is a list.',
      },
      {
        t: '`a list index must be a number, not a string`',
        why: '1.5 is a number; and the list test comes first anyway.',
      },
      {
        t: '`cannot index a string`',
        correct: true,
        why: '`checkIndex` tests for a list first, so a string fails before the index is looked at.',
      },
      {
        t: '`b`',
        why: 'Drip strings cannot be indexed at all, and 1.5 is not a whole number.',
      },
    ],
  },
];
