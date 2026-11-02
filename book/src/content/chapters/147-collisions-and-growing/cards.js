// Chapter 146 (second half) cards: prompts, examples, exercises and quiz.

export const prompts = {
  'linear-probe': {
    q: 'With linear probing, where does a key go if its starting slot is taken?',
    a: 'The next slot, then the next, wrapping round at the end, until a free one.',
  },
  'stop-empty': {
    q: 'When does a lookup in an open-addressing table decide the key is absent?',
    a: 'When it reaches a truly empty slot: no key, and not a tombstone.',
  },
  'tombstone-why': {
    q: 'What would go wrong if `delete` simply emptied the slot?',
    a: 'Keys that had probed past that slot would become unfindable: lookups would stop there too early.',
  },
  'first-tomb': {
    q: 'An insert passes a tombstone. Why can it not put the new key there straight away?',
    a: 'The key might already be further along the path; only reaching a truly empty slot proves it is new. Then the first tombstone is reused.',
  },
  'count-tombstones': {
    q: 'Why does the companion table’s `count` include tombstones?',
    a: 'They still fill slots for probing. Without counting them, the table could run out of empty slots and `find` would loop for ever.',
  },
  'load-limit': {
    q: 'An 8-slot companion table has `count` 6. What happens on the next `set`?',
    a: '6 + 1 > 8 × 0.75, so it first grows to 16 slots and re-inserts every live key.',
  },
  'grow-reinsert': {
    q: 'Why does growing re-insert every key instead of copying the arrays?',
    a: 'The mask changes (7 to 15), so a key’s starting slot may change. Re-inserting also drops tombstones.',
  },
  'grow-before-find': {
    q: 'Can a `set` that only overwrites an existing key make the companion table grow?',
    a: 'Yes. The load check runs before `find`, so it does not yet know whether the key is new.',
  },
};

export const examples = {
  'probe-run': {
    title: 'Watch keys probe',
    code: `function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
const keys = new Array(8).fill(null);
function put(k) {
  let i = hash(k) & 7;
  const path = [i];
  while (keys[i] !== null) {
    i = (i + 1) & 7;
    path.push(i);
  }
  keys[i] = k;
  console.log(k, 'probed', path);
}
for (const k of ['x', 'y', 'vy',
  'mass', 'health']) put(k);
console.log(keys);`,
  },
};

const hashFn = `const TOMB = true;
function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}`;

const top = `${hashFn}

class Table {
  constructor() {
    this.keys = new Array(8).fill(null);
    this.vals = new Array(8).fill(null);
  }`;

const getSet = `  get(key) {
    const i = this.find(key);
    if (this.keys[i] === null) {
      return undefined;
    }
    return this.vals[i];
  }
  set(key, v) {
    const i = this.find(key);
    this.keys[i] = key;
    this.vals[i] = v;
  }`;

const goodFind = `  find(key) {
    const mask = this.keys.length - 1;
    let i = hash(key) & mask;
    let tomb = -1;
    for (;;) {
      const k = this.keys[i];
      if (k === key) return i;
      if (k === null) {
        if (this.vals[i] === null) {
          return tomb !== -1 ? tomb : i;
        }
        if (tomb === -1) tomb = i;
      }
      i = (i + 1) & mask;
    }
  }`;

const goodDelete = `  delete(key) {
    const i = this.find(key);
    if (this.keys[i] === null) return;
    this.keys[i] = null;
    this.vals[i] = TOMB;
  }`;

// The growing table: find works on any pair of arrays.
const gFind = `${hashFn}

function find(ks, vs, key) {
  const mask = ks.length - 1;
  let i = hash(key) & mask;
  let tomb = -1;
  for (;;) {
    if (ks[i] === key) return i;
    if (ks[i] === null) {
      if (vs[i] === null) {
        return tomb !== -1 ? tomb : i;
      }
      if (tomb === -1) tomb = i;
    }
    i = (i + 1) & mask;
  }
}

class Table {
  constructor() {
    this.keys = new Array(8).fill(null);
    this.vals = new Array(8).fill(null);
    this.count = 0;
  }
  set(key, v) {
    const cap = this.keys.length;
    if (this.count + 1 > cap * 0.75) {
      this.grow(cap * 2);
    }
    const ks = this.keys;
    const vs = this.vals;
    const i = find(ks, vs, key);
    const empty = ks[i] === null;
    if (empty && vs[i] === null) {
      this.count++;
    }
    ks[i] = key;
    vs[i] = v;
  }
  get(key) {
    const ks = this.keys;
    const i = find(ks, this.vals, key);
    if (ks[i] === null) {
      return undefined;
    }
    return this.vals[i];
  }
  delete(key) {
    const ks = this.keys;
    const i = find(ks, this.vals, key);
    if (ks[i] === null) return;
    ks[i] = null;
    this.vals[i] = TOMB;
  }`;

const goodGrow = `  grow(cap) {
    const ks = Array(cap).fill(null);
    const vs = Array(cap).fill(null);
    this.count = 0;
    for (let i = 0;
      i < this.keys.length; i++) {
      const k = this.keys[i];
      if (k === null) continue;
      const d = find(ks, vs, k);
      ks[d] = k;
      vs[d] = this.vals[i];
      this.count++;
    }
    this.keys = ks;
    this.vals = vs;
  }`;

export const exercises = {
  probeTable: {
    title: 'Linear probing with tombstones',
    prompt:
      'This 8-slot table stores keys and values in two parallel arrays. `get` and `set` are done, but `find` ignores collisions and `delete` breaks probe paths. Write `find(key)`: start at `hash(key) & mask`, step to the next slot (wrapping) until you reach the key or a truly empty slot, and if you passed a tombstone on the way to an empty slot, return the first tombstone instead. Then make `delete` leave a tombstone: key `null`, value `TOMB`. The tests never fill the table, so no growing is needed.',
    starter: `${top}
  find(key) {
    const mask = this.keys.length - 1;
    return hash(key) & mask;
  }
${getSet}
  delete(key) {
    const i = this.find(key);
    if (this.keys[i] === null) return;
    this.keys[i] = null;
    this.vals[i] = null;
  }
}`,
    solution: `${top}
${goodFind}
${getSet}
${goodDelete}
}`,
    tests: `const fill = () => {
  const t = new Table();
  t.set('vy', 2);
  t.set('mass', 5);
  t.set('x', 10);
  t.set('health', 100);
  return t;
};
test('set and get', () => {
  const t = new Table();
  t.set('x', 10);
  t.set('y', 20);
  expect(t.get('x')).toBe(10);
  expect(t.get('y')).toBe(20);
  expect(t.get('vx')).toBe(undefined);
});
test('setting again replaces', () => {
  const t = new Table();
  t.set('x', 1);
  t.set('x', 2);
  expect(t.get('x')).toBe(2);
  expect(t.keys.filter((k) => k === 'x').length)
    .toBe(1);
});
test('a collision probes and wraps', () => {
  const t = fill();
  expect(t.get('health')).toBe(100);
  expect(t.keys.indexOf('health')).toBe(2);
  expect(t.get('x')).toBe(10);
});
test('delete leaves a tombstone', () => {
  const t = fill();
  t.delete('mass');
  expect(t.get('mass')).toBe(undefined);
  expect(t.keys[1]).toBe(null);
  expect(t.vals[1]).toBe(TOMB);
});
test('keys past a tombstone are still found', () => {
  const t = fill();
  t.delete('mass');
  expect(t.get('health')).toBe(100);
});
test('inserting reuses the tombstone', () => {
  const t = fill();
  t.delete('mass');
  t.set('mass', 6);
  expect(t.get('mass')).toBe(6);
  expect(t.keys.indexOf('mass')).toBe(1);
});`,
    hints: [
      'In the tests, `x` and `health` both start at slot 7, `vy` is in slot 0 and `mass` in slot 1. Where should `health` end up?',
      'Loop for ever with `for (;;)`, and step with `i = (i + 1) & mask`, which wraps from 7 back to 0. Return as soon as `keys[i] === key`.',
      'A slot with key `null` is either empty (value `null`: stop here) or a tombstone (value `TOMB`: remember the first one in `tomb`, then keep going). At an empty slot, return `tomb` if you saw one, otherwise `i`. In `delete`, write `TOMB` instead of `null` into `vals[i]`.',
    ],
    walkthrough: `**How to think about it.** Every slot is one of three things, and \`find\` has to treat each differently: a key (yours: done; someone else's: keep going), truly empty (no key, value \`null\`: your key is not here, stop), or a tombstone (no key, value \`TOMB\`: keep going, but remember it as a place to reuse). Start by writing the loop that handles only keys and empty slots, check the collision test passes, and then add the tombstone case.

**The solution, line by line.**

\`\`\`js
find(key) {
  const mask = this.keys.length - 1;
  let i = hash(key) & mask;
  let tomb = -1;
  for (;;) {
    const k = this.keys[i];
    if (k === key) return i;
    if (k === null) {
      if (this.vals[i] === null) {
        return tomb !== -1 ? tomb : i;
      }
      if (tomb === -1) tomb = i;
    }
    i = (i + 1) & mask;
  }
}
\`\`\`

- \`const mask = this.keys.length - 1;\` is 7 for 8 slots.
- \`let i = hash(key) & mask;\` is the starting slot; for \`health\` it is 7.
- \`let tomb = -1;\` means "no tombstone seen yet"; -1 can never be a slot.
- \`for (;;) {\` loops until one of the \`return\`s runs. It always ends, because the table is never full.
- \`const k = this.keys[i];\` reads the key in this slot.
- \`if (k === key) return i;\` is a hit: the key is here.
- \`if (k === null) {\` means no key: empty or tombstone.
- \`if (this.vals[i] === null) {\` is truly empty, so the key is absent. \`return tomb !== -1 ? tomb : i;\` returns the first tombstone if there was one (so a new key reuses it), otherwise this empty slot.
- \`if (tomb === -1) tomb = i;\` records only the *first* tombstone, then the loop goes on.
- \`i = (i + 1) & mask;\` steps on; \`8 & 7\` is 0, so slot 7 wraps to slot 0.

In \`delete\`, the only change is \`this.vals[i] = TOMB;\` instead of \`null\`: the slot loses its key but keeps a mark that says "keep going". With the test data, \`health\` probes 7, 0, 1 and lands in 2; after \`delete('mass')\`, the walk passes the tombstone in 1 and still reaches 2.

**Common wrong attempts.**

- Treating any \`null\` key as a stopping point: after \`delete('mass')\`, the lookup for \`health\` stops at slot 1 and reports it missing.
- Stopping only at truly empty slots but never remembering a tombstone: lookups work, but a re-inserted \`mass\` goes to slot 3, the first empty one, and tombstones pile up.
- A correct \`find\` with the old \`delete\`: the slot becomes truly empty, which cuts the path to \`health\`.`,
    wrong: [
      {
        code: `${top}
  find(key) {
    const mask = this.keys.length - 1;
    let i = hash(key) & mask;
    for (;;) {
      const k = this.keys[i];
      if (k === key || k === null) {
        return i;
      }
      i = (i + 1) & mask;
    }
  }
${getSet}
${goodDelete}
}`,
        why: 'This treats a tombstone like an empty slot, so after deleting `mass`, looking up `health` stops at slot 1 and reports it missing.',
      },
      {
        code: `${top}
  find(key) {
    const mask = this.keys.length - 1;
    let i = hash(key) & mask;
    for (;;) {
      const k = this.keys[i];
      if (k === key) return i;
      if (k === null &&
        this.vals[i] === null) return i;
      i = (i + 1) & mask;
    }
  }
${getSet}
${goodDelete}
}`,
        why: 'Lookups are right, but inserting never reuses a tombstone: the new `mass` goes to slot 3, the first empty one.',
      },
      {
        code: `${top}
${goodFind}
${getSet}
  delete(key) {
    const i = this.find(key);
    if (this.keys[i] === null) return;
    this.keys[i] = null;
    this.vals[i] = null;
  }
}`,
        why: '`find` is right, but `delete` leaves a truly empty slot, which cuts the probe path: `health` can no longer be found.',
      },
    ],
  },
  growTable: {
    optional: true,
    title: 'Growing the table',
    prompt:
      'This table checks its load in `set`, as the companion’s does, and calls `grow(cap)` with double the capacity. Write `grow(cap)`: make new `keys` and `vals` arrays of size `cap`, re-insert every live key with `find(newKeys, newVals, key)` (skip slots with no key, which also drops tombstones), recount `this.count`, and replace the old arrays.',
    starter: `${gFind}
  grow(cap) {
  }
}`,
    solution: `${gFind}
${goodGrow}
}`,
    tests: `const five = () => {
  const t = new Table();
  for (const k of ['x', 'y', 'vy',
    'mass', 'health']) t.set(k, k);
  return t;
};
test('a 7th key grows the table', () => {
  const t = five();
  t.set('vx', 1);
  expect(t.keys.length).toBe(8);
  t.set('name', 2);
  expect(t.keys.length).toBe(16);
});
test('every key is still found', () => {
  const t = five();
  t.set('vx', 1);
  t.set('name', 2);
  for (const k of ['x', 'y', 'vy', 'mass']) {
    expect(t.get(k)).toBe(k);
  }
  expect(t.get('vx')).toBe(1);
});
test('keys move to their new slot', () => {
  const t = five();
  t.set('vx', 1);
  t.set('name', 2);
  expect(t.keys.indexOf('health')).toBe(15);
});
test('tombstones are dropped', () => {
  const t = five();
  t.delete('mass');
  t.set('vx', 1);
  t.set('name', 2);
  expect(t.vals.includes(TOMB)).toBe(false);
  expect(t.count).toBe(6);
});`,
    hints: [
      'Growing is "make an empty, bigger table and insert everything again". Start with two new arrays filled with `null`.',
      'Loop over the *old* `this.keys`. Skip a slot whose key is `null` (empty or tombstone). For every other one, `find` its slot in the *new* arrays.',
      'Write the key and its old value at that new slot and add 1 to `this.count`, which you set to 0 before the loop. After the loop, set `this.keys` and `this.vals` to the new arrays.',
    ],
    walkthrough: `**How to think about it.** You cannot copy slot \`i\` of the old arrays to slot \`i\` of the new ones, because a key's slot depends on the capacity: with 16 slots, \`health\` hashes to slot 15, not 7. So growing is the same work as building the table from scratch with the live keys. Because only real keys are inserted, tombstones vanish, and \`count\` has to be recomputed from what actually went in.

**The solution, line by line.**

\`\`\`js
grow(cap) {
  const ks = Array(cap).fill(null);
  const vs = Array(cap).fill(null);
  this.count = 0;
  for (let i = 0;
    i < this.keys.length; i++) {
    const k = this.keys[i];
    if (k === null) continue;
    const d = find(ks, vs, k);
    ks[d] = k;
    vs[d] = this.vals[i];
    this.count++;
  }
  this.keys = ks;
  this.vals = vs;
}
\`\`\`

- The first two lines make the new, empty arrays; every slot is truly empty.
- \`this.count = 0;\` starts the count again, since tombstones will not be copied.
- The \`for\` loop visits every slot of the *old* arrays.
- \`const k = this.keys[i];\` reads the old key; \`if (k === null) continue;\` skips both empty slots and tombstones.
- \`const d = find(ks, vs, k);\` finds where \`k\` belongs in the new arrays, using the new mask (15).
- \`ks[d] = k; vs[d] = this.vals[i];\` moves the key and its value together.
- \`this.count++;\` counts one live key.
- The last two lines swap the new arrays in; the old ones are garbage now.

In the tests, the 7th insert (\`name\`) would push the count past 6, so \`set\` calls \`grow(16)\` first; afterwards \`health\` sits alone in slot 15, and with \`mass\` deleted the count is 5 live keys plus \`name\`, 6.

**Common wrong attempts.**

- Copying each slot to the same index in a bigger array: the keys are there, but \`get('health')\` now starts at slot 15, finds it empty and says \`undefined\`.
- Forgetting to reset \`count\`: it keeps the old tombstones' share, so it is too big, and the table grows again too soon.`,
    wrong: [
      {
        code: `${gFind}
  grow(cap) {
    const ks = Array(cap).fill(null);
    const vs = Array(cap).fill(null);
    for (let i = 0;
      i < this.keys.length; i++) {
      ks[i] = this.keys[i];
      vs[i] = this.vals[i];
    }
    this.keys = ks;
    this.vals = vs;
  }
}`,
        why: 'Copying slots to the same index ignores the new mask: `health` stays in slot 2, but a lookup now starts at slot 15, finds it empty and returns `undefined`.',
      },
      {
        code: `${gFind}
  grow(cap) {
    const ks = Array(cap).fill(null);
    const vs = Array(cap).fill(null);
    for (let i = 0;
      i < this.keys.length; i++) {
      const k = this.keys[i];
      if (k === null) continue;
      const d = find(ks, vs, k);
      ks[d] = k;
      vs[d] = this.vals[i];
    }
    this.keys = ks;
    this.vals = vs;
  }
}`,
        why: 'The keys move correctly, but `count` is never reset, so it still includes the dropped tombstone: 7 instead of 6.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'In an 8-slot table, `x` is in slot 7, `vy` in 0, `mass` in 1. Where does `health` go if its hash & 7 is 7?',
    options: [
      { t: 'Slot 2', correct: true, why: 'Linear probing tries 7, wraps to 0, then 1, then finds slot 2 empty.' },
      { t: 'Slot 7, replacing `x`', why: 'A different key never replaces another. It probes on.' },
      { t: 'Slot 8', why: 'There is no slot 8: the index wraps round to 0.' },
      { t: 'Nowhere: a collision is an error', why: 'Collisions are normal; probing handles them.' },
    ],
  },
  {
    q: 'Why does `delete` leave a tombstone instead of an empty slot?',
    options: [
      { t: 'So the deleted value can be restored later', why: 'Tombstones keep no key or value to restore.' },
      { t: 'To keep `count` small', why: 'Tombstones are counted, so they do the opposite.' },
      { t: 'So lookups keep probing past it and still find keys stored beyond it', correct: true, why: 'An empty slot means “stop”, which would hide those keys.' },
      { t: 'Because JavaScript arrays cannot hold `null`', why: 'They can, and the table uses `null` for empty keys.' },
    ],
  },
  {
    q: 'An insert of a new key passes a tombstone in slot 1, then other keys, then an empty slot 3. Where does the key go?',
    options: [
      { t: 'Slot 3, the empty one', why: 'That works, but wastes the tombstone; the companion reuses it.' },
      { t: 'Slot 1, the first tombstone it passed', correct: true, why: 'Reaching slot 3 proved the key is new, and reusing slot 1 keeps the path short.' },
      { t: 'It stops at slot 1 as soon as it sees the tombstone', why: 'It cannot know yet that the key is not further along.' },
      { t: 'The table grows first', why: 'Only if the load check says so; reusing a tombstone does not add to `count`.' },
    ],
  },
  {
    q: 'The companion table has 8 slots and `count` is 6. What happens on the next `set` of a new key?',
    options: [
      { t: 'It goes into the next free slot as usual', why: '7 entries would pass the 0.75 limit (6 of 8).' },
      { t: 'The table grows to 9 slots', why: 'The capacity stays a power of two, so masking works: 8 doubles to 16.' },
      { t: 'The insert fails: the table is full', why: 'It is never allowed to get full; it grows first.' },
      { t: 'The table grows to 16 slots and re-inserts every live key first', correct: true, why: '`count + 1 > capacity * 0.75`, so it doubles, and the new mask can change every starting slot.' },
    ],
  },
  {
    q: 'Why does the companion table count tombstones in `count`?',
    options: [
      { t: 'So `count` tells you how many keys you can look up', why: 'That would be live entries only; tombstones hold no key.' },
      { t: 'Because tombstones fill slots as far as probing goes; without counting them, the table could lose every empty slot and `find` would never stop', correct: true, why: 'The load limit must see every slot that is not truly empty.' },
      { t: 'Because tombstones are copied when the table grows', why: 'They are dropped when it grows.' },
      { t: 'It does not count them', why: 'It does: the field’s comment says “live entries + tombstones”.' },
    ],
  },
];
