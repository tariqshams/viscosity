// Chapter 270 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'bump-what': {
    q: 'What does a **bump allocator** do to allocate `n` words?',
    a: 'Checks that `top + n` does not pass `limit`, returns `top`, and adds `n` to `top`.',
  },
  'bump-needs': {
    q: 'What shape must free memory be in for bump allocation, and which collectors leave it that way?',
    a: 'One contiguous run; copying and compacting collectors leave it that way.',
  },
  'bump-tlab': {
    q: 'How do runtimes let many threads bump-allocate without locks?',
    a: 'Each thread gets its own small region (a thread-local allocation buffer, or .NET\'s allocation context) and bumps its own pointer.',
  },
  'fl-what': {
    q: 'What is a **free list**?',
    a: 'A linked list of the free blocks in a heap, each recording its size, which the allocator searches.',
  },
  'fl-split': {
    q: 'First fit finds a 10-word hole for a 6-word request. What happens to the other 4 words?',
    a: 'The hole is split: 6 words are given out and the 4-word remainder stays on the free list.',
  },
  'fl-classes': {
    q: 'Why do real allocators keep one free list per **size class**?',
    a: 'So a request goes straight to a list of blocks that fit, with no search; the price is a little padding per object.',
  },
  'frag-what': {
    q: 'What is **fragmentation**?',
    a: 'Free memory that exists in total but is broken into pieces too small to satisfy the requests.',
  },
  'sl-passes': {
    q: 'What are the three passes of Lisp 2 sliding compaction?',
    a: 'Compute each live object\'s new address; update every pointer to the new addresses; move each object to its new address.',
  },
  'sl-order': {
    q: 'Why is it safe for sliding compaction to move objects in address order?',
    a: 'Objects only move down, into space already passed, so nothing is overwritten before it has been moved.',
  },
  'sl-cost': {
    q: 'What does sliding compaction save, and what does it cost, compared with semispace copying?',
    a: 'It needs no spare half; but its three passes walk the whole heap, dead objects included, rather than only the live ones.',
  },
};

export const examples = {
  bump: {
    title: 'A bump allocator',
    code: `const limit = 16; // words of heap
let top = 0;
function alloc(n) {
  if (top + n > limit) return null;
  const a = top;
  top += n;
  return a;
}
console.log(alloc(4), alloc(3));
console.log(alloc(8));
console.log(alloc(2)); // collect!`,
  },
};

export const exercises = {
  lisp2: {
    title: 'Lisp 2 sliding compaction',
    prompt: `The heap is an array of objects in address order, \`{ addr, size, live, refs }\`; marking has already set \`live\`, and \`refs\` holds addresses or \`null\`. \`roots\` is an array of addresses of live objects.

Write \`compact(heap, roots)\` in three passes. **1.** Walking in order with \`free\` starting at 0, give each live object \`o.fwd = free\` and add its size. **2.** Rewrite the \`refs\` of every live object, and the roots, to the forwarding addresses of their targets. **3.** Slide: set each live object's \`addr\` to its \`fwd\`. Return \`{ heap, roots }\`, where \`heap\` holds only the live objects, in their original order.`,
    starter: `function compact(heap, roots) {
  // memory: address -> object
  const mem = new Map(
    heap.map((o) => [o.addr, o]));
  // 1. o.fwd for each live object
  // 2. rewrite refs and roots
  // 3. slide: o.addr = o.fwd
  return { heap, roots };
}`,
    solution: `function compact(heap, roots) {
  const mem = new Map(
    heap.map((o) => [o.addr, o]));
  let free = 0;
  for (const o of heap) {
    if (!o.live) continue;
    o.fwd = free;
    free += o.size;
  }
  const to = (p) =>
    p === null ? null : mem.get(p).fwd;
  for (const o of heap) {
    if (o.live) o.refs = o.refs.map(to);
  }
  const out = [];
  for (const o of heap) {
    if (!o.live) continue;
    o.addr = o.fwd;
    out.push(o);
  }
  return {
    heap: out,
    roots: roots.map(to),
  };
}`,
    tests: `const mk = () => [
  { addr: 0, size: 2, live: false,
    refs: [null] },
  { addr: 2, size: 3, live: true,
    refs: [9] },
  { addr: 5, size: 4, live: false,
    refs: [2] },
  { addr: 9, size: 2, live: true,
    refs: [2, null] },
  { addr: 11, size: 1, live: true,
    refs: [] },
];
test('live objects slide down, in order',
  () => {
    const r = compact(mk(), [9, 11]);
    expect(r.heap.map((o) => o.addr))
      .toEqual([0, 3, 5]);
  });
test('forwarding addresses are set', () => {
  const h = mk();
  compact(h, [9]);
  expect([h[1].fwd, h[3].fwd, h[4].fwd])
    .toEqual([0, 3, 5]);
});
test('pointers follow their targets', () => {
  const r = compact(mk(), [9, 11]);
  expect(r.heap.map((o) => o.refs))
    .toEqual([[3], [0, null], []]);
});
test('roots are rewritten', () => {
  const r = compact(mk(), [9, 11, 2]);
  expect(r.roots).toEqual([3, 5, 0]);
});
test('a packed heap does not move', () => {
  const h = [
    { addr: 0, size: 1, live: true,
      refs: [1] },
    { addr: 1, size: 1, live: true,
      refs: [0] },
  ];
  const r = compact(h, [0]);
  expect(r.heap.map((o) => o.addr))
    .toEqual([0, 1]);
  expect(r.heap[0].refs).toEqual([1]);
});`,
    hints: [
      'Build the whole thing in the order of the three passes. Pass 1 needs only a running total, `free`, and the live objects in order.',
      'Pass 2 needs to turn an old address into a new one: look the object up in `mem` by its old address and read its `fwd`. A helper `to(p)` that also passes `null` through does it for both refs and roots.',
      'Pass 3: collect the live objects into a new array, setting `o.addr = o.fwd` on each. Return `{ heap: out, roots: roots.map(to) }`. Pass 2 must use `mem`, built before any address changed.',
    ],
    walkthrough: `**How to think about it.** Sliding is easiest to see as arithmetic: an object's new address is the total size of the live objects before it. Pass 1 computes exactly that with a running total. Once every object knows its new address, the pointers can be fixed (pass 2), because a pointer is an old address and the object at that old address knows where it is going. Only then do objects move (pass 3). The order matters: if pass 3 ran before pass 2, the old addresses in the pointers would no longer name anything.

**The solution, line by line.**

- \`const mem = new Map(heap.map((o) => [o.addr, o]));\` is our stand-in for memory: given an address, find the object there. It is built before anything moves, so it is keyed by the old addresses.
- \`let free = 0;\` is the address the next live object will slide to.
- \`for (const o of heap) { if (!o.live) continue; o.fwd = free; free += o.size; }\` is pass 1. Dead objects are skipped, so they take no space in the new layout. Storing \`fwd\` in the object is the Lisp 2 detail: the forwarding address lives in an extra word of each object.
- \`const to = (p) => p === null ? null : mem.get(p).fwd;\` turns an old address into the new one, and leaves \`null\` alone.
- \`for (const o of heap) { if (o.live) o.refs = o.refs.map(to); }\` is pass 2. Only live objects are updated; dead objects' pointers do not matter, since they are about to be overwritten.
- \`const out = [];\` will be the compacted heap.
- \`for (const o of heap) { if (!o.live) continue; o.addr = o.fwd; out.push(o); }\` is pass 3, the move. Walking in address order means each object goes to an address no greater than its old one, which in real memory is what makes copying in place safe.
- \`return { heap: out, roots: roots.map(to) };\` (wrapped) returns the live objects and the rewritten roots.

On the test heap: the object at 2 (size 3) goes to 0; the one at 9 (size 2) to 3; the one at 11 to 5. Its pointer to 9 becomes 3, and the pointer from 9 back to 2 becomes 0. The free space after compaction starts at 6 and runs to the end, all in one piece.

**Common wrong attempts.**

- Adding every object's size in pass 1, dead ones included: then nothing actually closes up, since each live object keeps its old address.
- Moving in pass 1 (setting \`addr\` as you go) and then looking up targets by address: the lookups now mix old and new addresses and find the wrong objects. That is why \`mem\` is built first and pass 3 comes last.
- Forgetting the roots: the heap is perfect, but the program's own pointers still name old addresses.`,
    wrong: [
      {
        code: `function compact(heap, roots) {
  const mem = new Map(
    heap.map((o) => [o.addr, o]));
  let free = 0;
  for (const o of heap) {
    o.fwd = free;
    free += o.size;
  }
  const to = (p) =>
    p === null ? null : mem.get(p).fwd;
  for (const o of heap) {
    if (o.live) o.refs = o.refs.map(to);
  }
  const out = [];
  for (const o of heap) {
    if (!o.live) continue;
    o.addr = o.fwd;
    out.push(o);
  }
  return {
    heap: out,
    roots: roots.map(to),
  };
}`,
        why: 'Dead objects are counted in pass 1, so every live object keeps its old address and no gap closes.',
      },
      {
        code: `function compact(heap, roots) {
  const mem = new Map(
    heap.map((o) => [o.addr, o]));
  let free = 0;
  for (const o of heap) {
    if (!o.live) continue;
    o.fwd = free;
    free += o.size;
  }
  const to = (p) =>
    p === null ? null : mem.get(p).fwd;
  for (const o of heap) {
    if (o.live) o.refs = o.refs.map(to);
  }
  const out = [];
  for (const o of heap) {
    if (!o.live) continue;
    o.addr = o.fwd;
    out.push(o);
  }
  return { heap: out, roots };
}`,
        why: 'The roots are never rewritten, so the program\'s own pointers name addresses that now hold other objects.',
      },
    ],
  },
  firstFit: {
    optional: true,
    title: 'First fit with splitting',
    prompt: 'A free list is an array of holes `{ addr, size }` in address order. Write `alloc(free, n)`: find the **first** hole with `size >= n`; give out its first `n` words (return its address); if the hole was bigger, shrink it in place (its `addr` grows by `n` and its `size` falls by `n`), otherwise remove it from the array. If no hole fits, return `null` and leave the list alone.',
    starter: `function alloc(free, n) {
  return null;
}`,
    solution: `function alloc(free, n) {
  const len = free.length;
  for (let i = 0; i < len; i++) {
    const h = free[i];
    if (h.size < n) continue;
    const a = h.addr;
    if (h.size === n) {
      free.splice(i, 1);
    } else {
      h.addr += n;
      h.size -= n;
    }
    return a;
  }
  return null;
}`,
    tests: `const mk = () => [
  { addr: 0, size: 3 },
  { addr: 10, size: 5 },
  { addr: 20, size: 6 },
];
test('first fit skips small holes', () => {
  expect(alloc(mk(), 4)).toBe(10);
});
test('a bigger hole is split', () => {
  const f = mk();
  alloc(f, 4);
  expect(f[1]).toEqual({ addr: 14, size: 1 });
});
test('an exact fit removes the hole', () => {
  const f = mk();
  expect(alloc(f, 3)).toBe(0);
  expect(f.length).toBe(2);
});
test('fragmentation: 14 free, 7 fails', () => {
  const f = mk();
  expect(alloc(f, 7)).toBe(null);
  expect(f.length).toBe(3);
});`,
    hints: [
      'Walk the holes in order and stop at the first with `size >= n`.',
      'Remember its address before you change anything: that is the answer.',
      'If `size === n`, remove it with `free.splice(i, 1)`; otherwise `h.addr += n; h.size -= n;`. After the loop, `return null`.',
    ],
    walkthrough: `**How to think about it.** First fit is a linear search with a side effect. The search is the easy part; the care is in the side effect: the block given out must leave the list, either entirely (an exact fit) or by shrinking the hole from the front (a split), so the same words are never handed out twice.

**The solution, line by line.**

- \`const len = free.length;\` and \`for (let i = 0; i < len; i++) {\` walk the holes in address order. (The length can be read once, because the loop returns as soon as it changes the list.)
- \`const h = free[i]; if (h.size < n) continue;\` skips holes too small for the request.
- \`const a = h.addr;\` saves the address to hand out, before the hole is changed.
- \`if (h.size === n) { free.splice(i, 1); }\` removes a hole used up exactly.
- \`else { h.addr += n; h.size -= n; }\` splits: the hole now starts after the words given out, and is smaller by \`n\`.
- \`return a;\` hands out the block.
- \`return null;\` after the loop means no hole was big enough: 14 words free in total, but no 7 in a row, which is fragmentation.

**Common wrong attempts.**

- Returning the address after shrinking the hole: the caller gets the address just past its own block.
- Taking the *best* fit instead of the first: a reasonable policy, but a different one; the first test asks for first fit.
- Leaving a zero-sized hole on the list after an exact fit: harmless in this exercise's search, but a real allocator would walk it forever.`,
    wrong: [
      {
        code: `function alloc(free, n) {
  const len = free.length;
  for (let i = 0; i < len; i++) {
    const h = free[i];
    if (h.size < n) continue;
    h.addr += n;
    h.size -= n;
    return h.addr;
  }
  return null;
}`,
        why: 'The address is read after the hole has been shrunk, so the caller gets the address just past its block.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Why can a copying collector\'s heap use bump allocation, while a mark-sweep heap usually cannot?',
    options: [
      {
        t: 'Copying leaves free memory in one run; sweeping leaves holes between survivors',
        correct: true,
        why: 'A bump allocator needs one contiguous free region.',
      },
      {
        t: 'Mark-sweep heaps have no free memory',
        why: 'They have plenty, just in pieces.',
      },
      {
        t: 'Bump allocation needs a write barrier',
        why: 'Allocation and barriers are separate; the issue is the shape of free memory.',
      },
    ],
  },
  {
    q: 'A free list holds holes of 3, 5 and 6 words. First fit is asked for 4 words. What is left?',
    options: [
      {
        t: '3, 5 and 2',
        why: 'That would be taking from the last hole; first fit takes the first that fits.',
      },
      {
        t: '3, 1 and 6',
        correct: true,
        why: 'The 5-word hole is the first big enough; it is split, leaving 1 word.',
      },
      {
        t: '5 and 6',
        why: 'The 3-word hole is too small to use, so it stays.',
      },
    ],
  },
  {
    q: '14 words are free, in holes of 3, 5 and 6. A request for 7 words fails. What is this called?',
    options: [
      {
        t: 'A memory leak',
        why: 'Nothing is unreachable; the free memory is just in small pieces.',
      },
      {
        t: 'Floating garbage',
        why: 'That is about objects kept by a snapshot collector.',
      },
      {
        t: 'Fragmentation',
        correct: true,
        why: 'Enough free memory in total, but not in one piece.',
      },
    ],
  },
  {
    q: 'Live objects of sizes 2, 4 and 2 sit at addresses 0, 5 and 10. Where does sliding compaction put them?',
    options: [
      {
        t: '0, 2 and 6',
        correct: true,
        why: 'Each new address is the total size of the live objects before it: 0, then 2, then 2 + 4.',
      },
      {
        t: '0, 5 and 10',
        why: 'That is where they are; compaction closes the gaps.',
      },
      {
        t: '0, 4 and 8',
        why: 'The sizes, not a fixed stride, decide the addresses.',
      },
    ],
  },
  {
    q: 'Why does Lisp 2 update pointers (pass 2) before moving objects (pass 3)?',
    options: [
      {
        t: 'Because moving is slower',
        why: 'Speed is not the reason; correctness is.',
      },
      {
        t: 'Because pointers hold old addresses, and the objects at those addresses must still be there to say where they are going',
        correct: true,
        why: 'Each object\'s forwarding address is read from the object at the old address.',
      },
      {
        t: 'Because pass 3 deletes the forwarding addresses',
        why: 'They can stay; the order is about finding the objects.',
      },
    ],
  },
  {
    q: 'What is the main advantage of sliding compaction over semispace copying?',
    options: [
      {
        t: 'It touches only the live objects',
        why: 'Its passes walk the whole heap; copying is the one that touches only the live.',
      },
      {
        t: 'It needs no write barrier',
        why: 'Neither design needs a barrier when the program is stopped.',
      },
      {
        t: 'It needs no spare half of the heap',
        correct: true,
        why: 'Objects slide within the same space.',
      },
    ],
  },
];
