// Chapter 296 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'cp-what': {
    q: 'What does a **copying collector** do with the live objects, and with the dead ones?',
    a: 'It copies the live ones into an empty space and rewrites the pointers to them; the dead ones are never visited, and their space is freed all at once.',
  },
  'cp-cost': {
    q: 'Why does a copying collection cost what survives rather than what was allocated?',
    a: 'It only ever touches objects it reaches from the roots; dead objects are never looked at.',
  },
  'cp-half': {
    q: 'What does a semispace collector pay for its speed?',
    a: 'Memory: one of its two halves is always empty, waiting to be the next to-space, so it can use only half of what it holds.',
  },
  'ch-two': {
    q: 'What are Cheney\'s two pointers into to-space, and what does each mark?',
    a: '`free`: where the next copy goes. `scan`: the first copied object whose fields have not been looked at yet.',
  },
  'ch-done': {
    q: 'When does Cheney\'s algorithm stop?',
    a: 'When `scan` catches up with `free`: every copied object has had its fields scanned.',
  },
  'ch-grey': {
    q: 'In Cheney\'s algorithm, which objects are grey?',
    a: 'Those in to-space between `scan` and `free`: copied, but with fields still holding from-space addresses.',
  },
  'fw-what': {
    q: 'What is a **forwarding pointer**, and where is it written?',
    a: 'A note saying where an object has been copied to, usually written over the old copy (its header) in from-space.',
  },
  'fw-two-jobs': {
    q: 'What two jobs does a forwarding pointer do?',
    a: 'It marks the object as already copied (so shared objects and cycles are copied once), and it maps the old address to the new one (so fields can be updated).',
  },
  'ch-bfs': {
    q: 'In what order does Cheney\'s algorithm copy objects, and what does that cost?',
    a: 'Breadth-first, since scan to free is a queue; children can end up far from their parent, which can hurt cache locality.',
  },
};

export const examples = {
  'recursive-copy': {
    title: 'Copying a long chain by recursion',
    code: `// a chain of 100,000 objects
let head = null;
for (let i = 0; i < 100000; i++) {
  head = { next: head };
}
// the obvious copier: recursion
function copy(o) {
  if (o === null) return null;
  return { next: copy(o.next) };
}
try {
  copy(head);
  console.log('copied');
} catch (e) {
  console.log(String(e));
}`,
  },
};

export const exercises = {
  'cheney-flat': {
    title: 'Cheney\'s algorithm over a flat heap',
    prompt: `The heap \`from\` is an array of **words**. An object at address \`a\` is a header word \`from[a] = n\` (its number of fields, at least 1) followed by \`n\` field words, each an address in \`from\` or \`null\`. \`roots\` is an array of addresses.

Write \`collect(from, roots)\`, Cheney's algorithm. Copy the roots in order, then advance a \`scan\` index through \`to\`, copying what each field points at to the end of \`to\` (the \`free\` position) and rewriting the field. When you copy an object, overwrite its old header with \`FWD\` and the word after it with its new address; a pointer to an address whose header is \`FWD\` is rewritten to that new address without copying again. Return \`{ to, roots }\`, with the roots rewritten too. No recursion is needed.`,
    starter: `const FWD = 'fwd';
function collect(from, roots) {
  const to = [];
  // copy(p): copy the object at p to
  // the end of to, or follow its note
  return { to, roots };
}`,
    solution: `const FWD = 'fwd';
function collect(from, roots) {
  const to = [];
  const copy = (p) => {
    if (p === null) return null;
    if (from[p] === FWD)
      return from[p + 1];
    const n = from[p];
    const a = to.length; // free
    for (let i = 0; i <= n; i++) {
      to.push(from[p + i]);
    }
    from[p] = FWD;
    from[p + 1] = a;
    return a;
  };
  const rs = roots.map(copy);
  let scan = 0;
  while (scan < to.length) {
    const n = to[scan];
    for (let i = 1; i <= n; i++) {
      to[scan + i] = copy(to[scan + i]);
    }
    scan += n + 1;
  }
  return { to, roots: rs };
}`,
    tests: `const heap = () => [
  2, 7, 3, // A@0 -> D@7, B@3
  1, 9,    // B@3 -> E@9
  1, 0,    // G@5 -> A (garbage)
  1, null, // D@7
  1, 3,    // E@9 -> B@3
];
test('the stepper\\'s heap', () => {
  const r = collect(heap(), [0]);
  expect(r.to)
    .toEqual([2, 3, 5, 1, null, 1, 7, 1, 5]);
  expect(r.roots).toEqual([0]);
});
test('forwarding notes are left behind', () => {
  const h = heap();
  collect(h, [0]);
  expect([h[0], h[1]]).toEqual([FWD, 0]);
  expect([h[3], h[4]]).toEqual([FWD, 5]);
  expect([h[9], h[10]]).toEqual([FWD, 7]);
});
test('garbage is not touched', () => {
  const h = heap();
  collect(h, [0]);
  expect([h[5], h[6]]).toEqual([1, 0]);
});
test('a shared object is copied once', () => {
  const h = [2, 3, 3, 1, null];
  const r = collect(h, [3, 0, 3]);
  expect(r.to).toEqual([1, null, 2, 0, 0]);
  expect(r.roots).toEqual([0, 2, 0]);
});
test('a cycle ends', () => {
  const r = collect([1, 0], [0]);
  expect(r.to).toEqual([1, 0]);
});
test('no roots, nothing copied', () => {
  expect(collect([1, null], []).to)
    .toEqual([]);
});`,
    hints: [
      'Write the helper first: `copy(p)` gives back the new address of the object at old address `p`. There are three cases: `p` is `null`, the object has already been copied (its header is `FWD`), or it has not.',
      'For an object not yet copied: its size is `n = from[p]`; its new address is `to.length` (that is the free pointer); push the `n + 1` words `from[p]` to `from[p + n]` onto `to`; then write `FWD` into `from[p]` and the new address into `from[p + 1]`.',
      'Then: `const rs = roots.map(copy);` and a loop `while (scan < to.length)` that reads `n = to[scan]`, replaces each field `to[scan + i]` (for `i` from 1 to `n`) with `copy(to[scan + i])`, and finally moves `scan` on by `n + 1`.',
    ],
    walkthrough: `**How to think about it.** Do one object by hand first. Copying A means writing its header and its two fields onto the end of \`to\`, word for word; its fields still hold *from-space* addresses, and that is fine, because \`scan\` will come back and fix them. What makes the copy "Cheney" is that there is no other to-do list: every copied object is in \`to\`, in order, and the ones not yet fixed are exactly those at or after \`scan\`. So the program has two parts: a helper that copies one object (or finds its forwarding note), and a loop that walks \`scan\` forwards until it reaches the end of \`to\`, which is the free pointer.

**The solution, line by line.**

- \`const FWD = 'fwd';\` is the marker a forwarded header holds. A real header is a number, so it can never be confused with this string.
- \`const to = [];\` is to-space. Its length is always the free pointer: the next copy goes at \`to.length\`.
- \`const copy = (p) => {\` returns the new address of the object at old address \`p\`.
- \`if (p === null) return null;\` handles an empty field: there is nothing to copy, and the field stays \`null\`.
- \`if (from[p] === FWD) return from[p + 1];\` (on two lines) is the forwarding check: this object was copied already, so return the address its note gives. This line is what copies a shared object only once, and what stops a cycle from going round for ever.
- \`const n = from[p];\` reads the header: the number of fields.
- \`const a = to.length; // free\` remembers where the copy will start.
- The \`for\` loop with \`i <= n\` pushes the header and all \`n\` fields, \`n + 1\` words in all.
- \`from[p] = FWD;\` and \`from[p + 1] = a;\` write the note over the old object: its header becomes the marker, and its first field the new address. (This is why every object has at least one field: the note needs that second word.)
- \`return a;\` gives the caller the new address.
- \`const rs = roots.map(copy);\` copies each root, in order, and keeps their new addresses. A root that appears twice gets the same address both times, thanks to the note.
- \`let scan = 0;\` starts at the first copied object.
- \`while (scan < to.length) {\` runs while there are grey objects: copied, but not yet scanned. \`to.length\` grows as the loop copies more, which is the queue being fed from the back.
- \`const n = to[scan];\` reads the header of the object at \`scan\`. (Headers in \`to\` are never \`FWD\`: notes are only written in \`from\`.)
- The inner \`for\` replaces each field \`to[scan + i]\`, which holds an old address, with \`copy(...)\` of it, which is the new address, copying the target first if need be.
- \`scan += n + 1;\` steps over this object, header and fields, to the next one. It is now black.
- \`return { to, roots: rs };\` hands back to-space and the rewritten roots.

On the test heap: the root A is copied to address 0 (free becomes 3). Scanning A copies D (old address 7) to 3 and B (old address 3) to 5, and rewrites A's fields to 3 and 5. Scanning D finds \`null\`. Scanning B copies E to 7. Scanning E finds the old address 3, whose header is now \`FWD\` with the note 5, so the field becomes 5 without a second copy. Then \`scan\` is 9, which equals \`to.length\`, and the loop stops. G, at 5, was never reached, so its words are untouched.

**Common wrong attempts.**

- Returning the old \`roots\`: the copies are right, but the program's own pointers still name from-space addresses, which are about to be thrown away.
- Copying the roots and stopping, with no scan loop: the copies' fields still hold from-space addresses, and nothing the roots point at survives.
- Moving \`scan\` by 1 instead of \`n + 1\`: the loop then reads a field as if it were a header, and copies nonsense.
- Writing the note before pushing the words: \`from[p + 1]\` is overwritten with the new address before it is copied, so the copy's first field is wrong.`,
    wrong: [
      {
        code: `const FWD = 'fwd';
function collect(from, roots) {
  const to = [];
  const copy = (p) => {
    if (p === null) return null;
    if (from[p] === FWD)
      return from[p + 1];
    const a = to.length;
    for (let i = 0; i <= from[p]; i++) {
      to.push(from[p + i]);
    }
    from[p] = FWD;
    from[p + 1] = a;
    return a;
  };
  roots.map(copy);
  let scan = 0;
  while (scan < to.length) {
    const n = to[scan];
    for (let i = 1; i <= n; i++) {
      to[scan + i] = copy(to[scan + i]);
    }
    scan += n + 1;
  }
  return { to, roots };
}`,
        why: 'The roots are copied but not rewritten: the program still holds from-space addresses. Keep the result of `roots.map(copy)`.',
      },
      {
        code: `const FWD = 'fwd';
function collect(from, roots) {
  const to = [];
  const copy = (p) => {
    if (p === null) return null;
    if (from[p] === FWD)
      return from[p + 1];
    const a = to.length;
    from[p + 1] = a;
    const n = from[p];
    from[p] = FWD;
    to.push(n);
    for (let i = 1; i <= n; i++) {
      to.push(from[p + i]);
    }
    return a;
  };
  const rs = roots.map(copy);
  let scan = 0;
  while (scan < to.length) {
    const n = to[scan];
    for (let i = 1; i <= n; i++) {
      to[scan + i] = copy(to[scan + i]);
    }
    scan += n + 1;
  }
  return { to, roots: rs };
}`,
        why: 'The note is written before the fields are copied, so the first field is lost: the copy gets its own new address instead of the old pointer.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'A heap holds 1,000 objects, of which 10 are reachable. Roughly how many objects does a copying collection touch?',
    options: [
      {
        t: '10',
        correct: true,
        why: 'It copies only what it reaches from the roots; the 990 dead objects are never looked at.',
      },
      {
        t: '1,000',
        why: 'That is what a sweep visits. A copying collector never walks the dead.',
      },
      {
        t: '990',
        why: 'The dead ones are exactly the ones it does not touch.',
      },
    ],
  },
  {
    q: 'During Cheney\'s algorithm, what is true of an object in to-space that lies at or after `scan` but before `free`?',
    options: [
      {
        t: 'It is garbage that will be freed',
        why: 'Everything in to-space was reached, so it is live.',
      },
      {
        t: 'It has been copied, but its fields still hold from-space addresses',
        correct: true,
        why: 'Those are the grey objects: the queue of work still to do.',
      },
      {
        t: 'It has been copied and fully scanned',
        why: 'That describes objects before `scan`: the black ones.',
      },
    ],
  },
  {
    q: 'Why does Cheney\'s algorithm need no stack or work list?',
    options: [
      {
        t: 'Because it only copies the roots',
        why: 'It copies everything reachable, through any number of pointers.',
      },
      {
        t: 'Because it uses recursion instead',
        why: 'Recursion is what it avoids; a long chain would overflow the call stack.',
      },
      {
        t: 'Because to-space itself, between `scan` and `free`, is the queue of objects still to scan',
        correct: true,
        why: 'Copies are added at `free` and taken at `scan`, so no other structure is needed.',
      },
    ],
  },
  {
    q: 'Two objects in from-space both point at C. What makes both end up pointing at the same copy of C?',
    options: [
      {
        t: 'The forwarding pointer written over C when it was first copied',
        correct: true,
        why: 'The second visit finds the note and returns the new address without copying again.',
      },
      {
        t: 'Copying C twice and keeping the later copy',
        why: 'Copying twice is exactly what the forwarding pointer prevents; it would also loop on a cycle.',
      },
      {
        t: 'A reference count on C',
        why: 'Copying collectors keep no counts; the note is enough.',
      },
    ],
  },
  {
    q: 'A tree has root 1 with children 2 and 3; 2 has children 4 and 5. In what order does Cheney\'s algorithm place them in to-space?',
    options: [
      {
        t: '1 2 4 5 3',
        why: 'That is depth-first order, which recursion would give.',
      },
      {
        t: '1 2 3 4 5',
        correct: true,
        why: 'Breadth-first: the queue serves 1, which adds 2 and 3, then 2, which adds 4 and 5.',
      },
      {
        t: '5 4 3 2 1',
        why: 'The root is copied first.',
      },
    ],
  },
];
