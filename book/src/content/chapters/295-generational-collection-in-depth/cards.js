// Chapter 295 cards. Keys are stable ids: never rename them.

export const prompts = {
  'nu-what': {
    q: 'What is the **nursery**?',
    a: 'The part of the young generation where new objects are allocated; it is small and emptied by copying.',
  },
  'nu-age': {
    q: 'In a generational collector with survivor spaces, what is an object\'s **age**?',
    a: 'The number of young collections it has survived; at the tenuring threshold it is promoted.',
  },
  'nu-why-wait': {
    q: 'Why not promote every object the first time it survives?',
    a: 'Some objects were only made just before the collection and die soon after; waiting a few collections lets them die young instead of filling the old generation.',
  },
  'rs-what': {
    q: 'What does the remembered set of a minor collection record?',
    a: 'The old objects (or fields) that may point at young objects; they are extra roots.',
  },
  'rs-young-old': {
    q: 'Why does a store of an old object into a young one (`young.parent = old`) need no remembered-set entry?',
    a: 'The minor collection scans every live young object anyway, and it is not collecting the old one.',
  },
  'rs-stale': {
    q: 'An old object drops its only young pointer, but stays in the remembered set. Is that a bug?',
    a: 'No: the set may hold too much (wasted scanning), never too little.',
  },
  'ct-what': {
    q: 'What does a card-table write barrier do on a pointer store?',
    a: 'It marks the byte for the card holding the written field as dirty, with no further checks.',
  },
  'ct-shift': {
    q: 'With 512-byte cards, how is the card for address `a` found?',
    a: '`a >> 9`, which is `a` divided by 512, rounded down.',
  },
  'ct-tradeoff': {
    q: 'What does a card table trade, compared with a precise remembered set?',
    a: 'A cheaper barrier (one byte store) for more work at collection time: every old object on a dirty card must be scanned.',
  },
};

export const examples = {
  remset: {
    title: 'A remembered-set write barrier',
    code: `const old = new Set(); // promoted
const rs = new Set(); // remembered
function write(o, f, v) {
  o[f] = v;
  const young = v !== null &&
    typeof v === 'object' &&
    !old.has(v);
  if (old.has(o) && young) rs.add(o);
}
const cache = { name: 'cache' };
old.add(cache); // promoted long ago
const kid = { name: 'kid' }; // young
write(cache, 'item', kid);
write(kid, 'back', cache); // no entry
write(cache, 'n', 42); // no entry
console.log([...rs].map((o) => o.name));`,
  },
};

export const exercises = {
  cards: {
    title: 'A card table and a minor collection',
    prompt:
      'The heap `h` is an array of objects `{ old, refs }`; an object\'s address is its index, and `refs` holds addresses or `null`. `cards` has one entry per `CARD` (4) objects, `0` for clean and `1` for dirty.\n\n1. Write `write(h, cards, o, f, v)`, the write barrier: store `v` into field `f` of object `o`, and mark the card holding `o` as dirty. (Mark it always, as HotSpot\'s card-table barrier does.)\n2. Write `minor(h, cards, roots)`. Starting from the roots, and from the `refs` of every **old** object on a **dirty** card, find every **young** object that is reachable through young objects. Do not trace into or through old objects. Return the live young addresses, sorted.',
    starter: `const CARD = 4; // objects per card
function write(h, cards, o, f, v) {
  h[o].refs[f] = v;
}
function minor(h, cards, roots) {
  return [];
}`,
    solution: `const CARD = 4; // objects per card
function write(h, cards, o, f, v) {
  h[o].refs[f] = v;
  cards[Math.floor(o / CARD)] = 1;
}
function minor(h, cards, roots) {
  const live = new Set();
  const work = [];
  const reach = (p) => {
    if (p === null || h[p].old) return;
    if (live.has(p)) return;
    live.add(p);
    work.push(p);
  };
  roots.forEach(reach);
  const nc = cards.length;
  for (let c = 0; c < nc; c++) {
    if (!cards[c]) continue;
    const lo = c * CARD;
    const hi = Math.min(lo + CARD,
      h.length);
    for (let o = lo; o < hi; o++) {
      if (!h[o].old) continue;
      h[o].refs.forEach(reach);
    }
  }
  while (work.length > 0) {
    h[work.pop()].refs.forEach(reach);
  }
  return [...live]
    .sort((a, b) => a - b);
}`,
    tests: `// 0..5 are old, 6..9 young; 7 -> 8
const mk = () => {
  const h = [];
  for (let i = 0; i < 10; i++) {
    h.push({ old: i < 6, refs: [null] });
  }
  h[7].refs[0] = 8;
  return { h, cards: [0, 0, 0] };
};
test('roots reach young objects', () => {
  const { h, cards } = mk();
  expect(minor(h, cards, [6])).toEqual([6]);
});
test('the barrier dirties one card', () => {
  const { h, cards } = mk();
  write(h, cards, 5, 0, 7);
  expect(h[5].refs[0]).toBe(7);
  expect(cards).toEqual([0, 1, 0]);
});
test('an old object keeps a young one', () => {
  const { h, cards } = mk();
  write(h, cards, 5, 0, 7);
  expect(minor(h, cards, [])).toEqual([7, 8]);
});
test('old objects are not traced', () => {
  const { h, cards } = mk();
  h[1].refs[0] = 9; // no barrier!
  expect(minor(h, cards, [1])).toEqual([]);
});
test('a dead old object still keeps its child',
  () => {
    const { h, cards } = mk();
    write(h, cards, 4, 0, 9);
    expect(minor(h, cards, [])).toEqual([9]);
  });
test('stores into young objects mark too', () => {
  const { h, cards } = mk();
  write(h, cards, 9, 0, 6);
  expect(cards).toEqual([0, 0, 1]);
  expect(minor(h, cards, [9])).toEqual([6, 9]);
});`,
    hints: [
      'The barrier is two lines: the store itself, then the card. Which card holds object `o` if each card holds 4 objects?',
      'For `minor`, write a helper `reach(p)` that ignores `null`, ignores old objects, and ignores young objects already seen; otherwise it records `p` as live and pushes it onto a work list. Call it on every root, and on every ref of every old object on a dirty card.',
      'A dirty card `c` covers addresses `c * CARD` up to (not including) `c * CARD + CARD`, cut off at `h.length`. After seeding, loop `while (work.length > 0)` and call `reach` on each ref of `h[work.pop()]`. Return the live set as a sorted array: `[...live].sort((a, b) => a - b)`.',
    ],
    walkthrough: `**How to think about it.** A minor collection is an ordinary trace with two changes. First, it has extra roots: the young pointers held by old objects, which it finds by looking only at the old objects on dirty cards. Second, it stops at the edge of the young generation: an old object is never traced, because it is not being collected and reading it would be exactly the cost generations exist to avoid. The barrier is what makes the extra roots complete: every store goes through it, so every old object that might point into the young generation sits on a dirty card.

**The solution, line by line.**

- \`const CARD = 4;\` says how many objects a card covers. (HotSpot covers 512 bytes; objects of different sizes just mean more bookkeeping, not a different idea.)
- \`h[o].refs[f] = v;\` is the store the program asked for.
- \`cards[Math.floor(o / CARD)] = 1;\` dirties the card holding \`o\`. Objects 0 to 3 are card 0, 4 to 7 card 1, and so on; dividing and rounding down is the \`addr >> 9\` of a real card table. It asks nothing about \`v\` or about \`o\`'s age, which is what makes it so cheap.
- \`const live = new Set();\` holds the young objects found so far, and \`const work = [];\` those whose refs are not yet traced (the grey ones).
- \`const reach = (p) => {\` is called on every pointer the trace meets.
- \`if (p === null || h[p].old) return;\` skips empty fields and old objects: the edge of the young generation.
- \`if (live.has(p)) return;\` skips a young object already found, so shared objects and cycles are handled once.
- \`live.add(p); work.push(p);\` records it as live and queues its refs.
- \`roots.forEach(reach);\` seeds the trace from the ordinary roots. An old root is simply skipped.
- The \`for\` over \`c\`, with \`if (!cards[c]) continue;\`, visits only dirty cards.
- \`lo\` and \`hi\` are the first address of the card and one past its last, cut off at the end of the heap.
- \`if (!h[o].old) continue;\` followed by \`h[o].refs.forEach(reach);\` treats every ref of an old object on a dirty card as a root. Young objects on the same card are skipped here; if they are live, the trace will reach them anyway.
- \`while (work.length > 0) { h[work.pop()].refs.forEach(reach); }\` finishes the trace through young objects only.
- \`return [...live].sort((a, b) => a - b);\` (on two lines) returns the addresses in order. (Without the comparison function, \`sort\` would compare them as strings.)

The tests check the important cases. In "old objects are not traced", object 1 points at 9 but the store skipped the barrier, so card 0 is clean; the root 1 is old and is not traced, so 9 is not found. That is the exact bug a missing barrier causes in a real collector. In "a dead old object still keeps its child", object 4 is unreachable, but it is old and on a dirty card, so its child 9 survives this minor collection anyway; it will only be freed after a full collection finds 4 dead. Generational collectors accept this: the young collection is fast because it trusts the old generation without checking it.

**Common wrong attempts.**

- Tracing through old objects: the answers are safe (nothing live is lost), but the collection now reads the old generation, so it is a full collection that only frees young objects. The "old objects are not traced" test catches it.
- \`cards[o] = 1\`: one card per object is a remembered set of objects in disguise, and it writes past the end of the card array.
- Scanning young objects on dirty cards as roots: harmless here, but it keeps dead young objects alive.`,
    wrong: [
      {
        code: `const CARD = 4; // objects per card
function write(h, cards, o, f, v) {
  h[o].refs[f] = v;
  cards[Math.floor(o / CARD)] = 1;
}
function minor(h, cards, roots) {
  const seen = new Set();
  const work = [...roots];
  while (work.length > 0) {
    const p = work.pop();
    if (p === null || seen.has(p)) {
      continue;
    }
    seen.add(p);
    work.push(...h[p].refs);
  }
  return [...seen]
    .filter((p) => !h[p].old)
    .sort((a, b) => a - b);
}`,
        why: 'This traces straight through old objects (and ignores the cards), so it reads the old generation; a root that is old is followed, which a minor collection must not do.',
      },
      {
        code: `const CARD = 4; // objects per card
function write(h, cards, o, f, v) {
  h[o].refs[f] = v;
  cards[o] = 1;
}
function minor(h, cards, roots) {
  const live = new Set();
  const work = [];
  const reach = (p) => {
    if (p === null || h[p].old) return;
    if (live.has(p)) return;
    live.add(p);
    work.push(p);
  };
  roots.forEach(reach);
  const nc = cards.length;
  for (let c = 0; c < nc; c++) {
    if (!cards[c]) continue;
    const lo = c * CARD;
    const hi = Math.min(lo + CARD,
      h.length);
    for (let o = lo; o < hi; o++) {
      if (!h[o].old) continue;
      h[o].refs.forEach(reach);
    }
  }
  while (work.length > 0) {
    h[work.pop()].refs.forEach(reach);
  }
  return [...live]
    .sort((a, b) => a - b);
}`,
        why: '`cards[o] = 1` uses the object\'s address as the card number, so the wrong card is dirtied (and the array grows past its end).',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Why does a minor collection need a remembered set at all?',
    options: [
      { t: 'To find young objects reachable only through old objects, without reading the old generation', correct: true, why: 'The old generation is not traced, so its pointers into the young one must be recorded as they are made.' },
      { t: 'To know which old objects are garbage', why: 'A minor collection does not decide anything about old objects.' },
      { t: 'To count references, as reference counting does', why: 'It records places, not counts.' },
    ],
  },
  {
    q: 'Which store must a generational write barrier record?',
    options: [
      { t: '`young.parent = oldObj`', why: 'The young object is scanned anyway; nothing is lost.' },
      { t: '`oldObj.n = 42`', why: 'A number is not a pointer, so nothing can be hidden.' },
      { t: '`oldObj.child = youngObj`', correct: true, why: 'An old-to-young pointer: without a record, the young object could be freed while still reachable.' },
    ],
  },
  {
    q: 'With 512-byte cards, a store writes the field at address 0x1400. Which card is dirtied?',
    options: [
      { t: 'Card 9', why: 'Card 9 ends at 0x13FF.' },
      { t: 'Card 10', correct: true, why: '0x1400 is 5,120, and 5,120 >> 9 = 10.' },
      { t: 'Card 0x1400', why: 'The card number is the address shifted right by 9, not the address.' },
    ],
  },
  {
    q: 'An old object that nothing reaches any more sits on a dirty card and points at a young object. What happens at the next minor collection?',
    options: [
      { t: 'The young object is freed, because its owner is dead', why: 'A minor collection never checks whether old objects are live.' },
      { t: 'The collector crashes', why: 'Nothing is wrong; it is just conservative.' },
      { t: 'The young object survives, until a full collection frees the old one', correct: true, why: 'The old object is trusted as live, so its young pointer is a root this time.' },
    ],
  },
  {
    q: 'In HotSpot\'s age table, an object of age 3 has survived how many young collections?',
    options: [
      { t: 'Three', correct: true, why: 'Age counts young collections survived; at the tenuring threshold it is promoted.' },
      { t: 'Three seconds\' worth', why: 'Age is counted in collections, not time.' },
      { t: 'It has been promoted three times', why: 'An object is promoted once, at the threshold.' },
    ],
  },
];
