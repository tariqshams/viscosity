// Chapter 78 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'hash-what': {
    q: 'What does a hash function do, and what must always hold?',
    a: 'It turns a key into a number. Equal keys must always give equal hashes.',
  },
  'imul-why': {
    q: 'In a JavaScript implementation of FNV-1a, why multiply with `Math.imul(h, 16777619)` rather than `h * 16777619`?',
    a: '`*` multiplies doubles, and a product past 2^53 loses its low bits. `Math.imul` wraps exactly at 32 bits.',
  },
  'mask-index': {
    q: 'How does a hash table with 8 slots (a power of two) turn a hash into a slot?',
    a: '`hash & 7`: it keeps the low 3 bits, a number from 0 to 7.',
  },
  'collision-what': {
    q: 'What is a collision, and can a good hash function prevent them?',
    a: 'Two different keys that want the same slot. No: with more possible keys than slots they must happen; a good hash only makes them rare.',
  },
  'stop-empty': {
    q: 'When does a lookup in an open-addressing table decide the key is absent?',
    a: 'When it reaches a truly empty slot: no key, and not a tombstone.',
  },
  'tombstone-why': {
    q: 'In an open-addressing hash table, what would go wrong if `delete` simply emptied the slot?',
    a: 'Keys that had probed past that slot would become unfindable: lookups would stop there too early.',
  },
  'load-limit': {
    q: 'A hash table that grows before its load factor would pass 0.75 has 8 slots and a count of 6. What happens on the next insert?',
    a: '6 + 1 > 8 × 0.75, so it first grows (doubling to 16 slots) and re-inserts every live key.',
  },
  'grow-reinsert': {
    q: 'When a power-of-two hash table grows, why must it re-insert every key instead of copying its arrays across?',
    a: 'The mask changes (7 to 15), so a key’s starting slot may change. Re-inserting also drops tombstones.',
  },
};

export const examples = {
  fnv: {
    title: 'FNV-1a, and where the fields land',
    code: `function fnv(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const ks = ['x', 'y', 'vx', 'vy',
  'mass', 'health'];
for (const k of ks) {
  console.log(k, fnv(k), fnv(k) & 7);
}
// one letter apart, far apart:
console.log(fnv('health'));
console.log(fnv('healti'));`,
  },
};

export const exercises = {
  probeTable: {
    title: 'Linear probing with tombstones',
    prompt: 'This 8-slot table stores keys and values in two parallel arrays. `get` and `set` are done, but `find` ignores collisions and `delete` breaks probe paths. Write `find(key)`: start at `hash(key) & mask`, step to the next slot (wrapping) until you reach the key or a truly empty slot, and if you passed a tombstone on the way to an empty slot, return the first tombstone instead. Then make `delete` leave a tombstone: key `null`, value `TOMB`. The tests never fill the table, so no growing is needed.',
    starter: `const TOMB = true;
function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

class Table {
  constructor() {
    this.keys = new Array(8).fill(null);
    this.vals = new Array(8).fill(null);
  }
  find(key) {
    const mask = this.keys.length - 1;
    return hash(key) & mask;
  }
  get(key) {
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
  }
  delete(key) {
    const i = this.find(key);
    if (this.keys[i] === null) return;
    this.keys[i] = null;
    this.vals[i] = null;
  }
}`,
    solution: `const TOMB = true;
function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

class Table {
  constructor() {
    this.keys = new Array(8).fill(null);
    this.vals = new Array(8).fill(null);
  }
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
  get(key) {
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
  }
  delete(key) {
    const i = this.find(key);
    if (this.keys[i] === null) return;
    this.keys[i] = null;
    this.vals[i] = TOMB;
  }
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
        code: `const TOMB = true;
function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

class Table {
  constructor() {
    this.keys = new Array(8).fill(null);
    this.vals = new Array(8).fill(null);
  }
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
  get(key) {
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
  }
  delete(key) {
    const i = this.find(key);
    if (this.keys[i] === null) return;
    this.keys[i] = null;
    this.vals[i] = TOMB;
  }
}`,
        why: 'This treats a tombstone like an empty slot, so after deleting `mass`, looking up `health` stops at slot 1 and reports it missing.',
      },
      {
        code: `const TOMB = true;
function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

class Table {
  constructor() {
    this.keys = new Array(8).fill(null);
    this.vals = new Array(8).fill(null);
  }
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
  get(key) {
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
  }
  delete(key) {
    const i = this.find(key);
    if (this.keys[i] === null) return;
    this.keys[i] = null;
    this.vals[i] = TOMB;
  }
}`,
        why: 'Lookups are right, but inserting never reuses a tombstone: the new `mass` goes to slot 3, the first empty one.',
      },
      {
        code: `const TOMB = true;
function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

class Table {
  constructor() {
    this.keys = new Array(8).fill(null);
    this.vals = new Array(8).fill(null);
  }
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
  get(key) {
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
  }
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
  fnv1a: {
    optional: true,
    title: 'FNV-1a from scratch',
    prompt: 'Write `fnv1a(s)`: start at `2166136261`; for each character, XOR in `s.charCodeAt(i)` and then multiply by `16777619` with 32-bit wrap-around; return the result as a 32-bit number that is never negative. The tests use the official FNV-1a test vectors.',
    starter: `function fnv1a(s) {
  let h = 2166136261;
  return h;
}`,
    solution: `function fnv1a(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}`,
    tests: `test('the empty string is the offset basis', () => {
  expect(fnv1a('')).toBe(0x811c9dc5);
});
test('"a"', () => {
  expect(fnv1a('a')).toBe(0xe40c292c);
});
test('"foobar"', () => {
  expect(fnv1a('foobar')).toBe(0xbf9cf968);
});
test('never negative', () => {
  for (const s of ['x', 'vx', 'health']) {
    expect(fnv1a(s) >= 0).toBe(true);
  }
});`,
    hints: [
      'The starter already returns the right answer for the empty string. What has to happen once for every character?',
      'Loop over the characters. Inside the loop there are two steps, in this order: `h ^= s.charCodeAt(i)`, then the multiply.',
      'Write the multiply as `h = Math.imul(h, 16777619);` (a plain `*` loses low bits), and finish with `return h >>> 0;` so the result is never negative.',
    ],
    walkthrough: `**How to think about it.** The test for the empty string already passes, because a string with no characters never changes the offset basis. Every other test needs the loop: one round per character, each round doing the same two things. Then there are two traps, both about JavaScript numbers: the multiply must wrap at 32 bits, and the result must be read as unsigned. If you write the loop with a plain \`*\` and no \`>>> 0\`, the tests tell you which trap you fell in: a negative number means the missing \`>>> 0\`; a wrong positive number for \`"foobar"\` means the \`*\`.

**The solution, line by line.**

\`\`\`js
function fnv1a(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
\`\`\`

- \`let h = 2166136261;\` is the offset basis, \`0x811c9dc5\`. It is \`let\`, not \`const\`, because every round changes it.
- \`for (let i = 0; i < s.length; i++) {\` visits each character position once, from the first to the last.
- \`h ^= s.charCodeAt(i);\` takes the character's code (\`"a"\` is 97) and XORs it into \`h\`. JavaScript's \`^\` works on 32-bit integers, so from here on \`h\` may be negative; that is fine, because the bits are what matter.
- \`h = Math.imul(h, 16777619);\` multiplies as 32-bit integers and keeps the low 32 bits of the product, which is exactly the "mod 2^32" of the C original.
- \`}\` ends the round; the next character mixes into the new \`h\`.
- \`return h >>> 0;\` shifts by zero places with the *unsigned* shift, which changes no bits but reads them as a number from 0 to 2^32 − 1. \`0xe40c292c\` (the hash of \`"a"\`) is above 2^31, so without this it would come out as \`-468965076\`.

**Common wrong attempts.**

- Leaving out \`>>> 0\`: the bits are right but the number is signed, so \`"a"\` gives \`-468965076\` instead of \`3826002220\`.
- \`h = (h * 16777619) >>> 0;\`: the product of two numbers this size can be about 2^56, and a double holds every whole number only up to 2^53, so the lowest bits are rounded before \`>>> 0\` ever sees them. Short strings can come out right by luck, but \`"foobar"\` gives \`249808880\`, not \`0xbf9cf968\`.
- Multiplying before the XOR: that is the older FNV-1, a different hash, and \`"a"\` gives \`0x050c5d7e\`. The "a" in FNV-1a means "XOR first".`,
    wrong: [
      {
        code: `function fnv1a(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h;
}`,
        why: 'Without `>>> 0` the result is a signed 32-bit number: `"a"` gives -468965076 instead of 3826002220.',
      },
      {
        code: `function fnv1a(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h;
}`,
        why: 'A double multiply rounds away the low bits of a big product. `"foobar"` gives 249808880, not 0xbf9cf968. Use `Math.imul`.',
      },
      {
        code: `function fnv1a(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h, 16777619);
    h ^= s.charCodeAt(i);
  }
  return h >>> 0;
}`,
        why: 'Multiplying before the XOR is FNV-1, not FNV-1a: `"a"` gives 0x050c5d7e.',
      },
    ],
  },
  tinyTable: {
    optional: true,
    title: 'A table with no collisions yet',
    prompt: 'This 8-slot table keeps keys and values in two parallel arrays, `keys` and `vals`. Write `set(key, v)` and `get(key)`: the slot is `hash(key) & 7`. `get` returns `undefined` when the key is not there, **including** when a different key sits in its slot. The tests never store two keys that share a slot, so you do not need a collision rule yet.',
    starter: `function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

class Table {
  constructor() {
    this.keys = new Array(8).fill(null);
    this.vals = new Array(8).fill(null);
  }
  set(key, v) {
  }
  get(key) {
    return this.vals[hash(key) & 7];
  }
}`,
    solution: `function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

class Table {
  constructor() {
    this.keys = new Array(8).fill(null);
    this.vals = new Array(8).fill(null);
  }
  set(key, v) {
    const i = hash(key) & 7;
    this.keys[i] = key;
    this.vals[i] = v;
  }
  get(key) {
    const i = hash(key) & 7;
    if (this.keys[i] !== key) {
      return undefined;
    }
    return this.vals[i];
  }
}`,
    tests: `const fields = () => {
  const t = new Table();
  t.set('x', 10);
  t.set('y', 20);
  t.set('vx', 1);
  return t;
};
test('get what was set', () => {
  const t = fields();
  expect(t.get('x')).toBe(10);
  expect(t.get('vx')).toBe(1);
});
test('the key lands in its slot', () => {
  const t = fields();
  expect(t.keys[7]).toBe('x');
  expect(t.vals[4]).toBe(20);
});
test('a missing key gives undefined', () => {
  expect(fields().get('z')).toBe(undefined);
});
test('another key in the slot: undefined', () => {
  // health also hashes to slot 7
  const t = fields();
  expect(t.get('health')).toBe(undefined);
});`,
    hints: [
      'Both methods start the same way: work out the slot with `hash(key) & 7`.',
      '`set` writes the key into `this.keys` and the value into `this.vals`, both at that slot.',
      'In `get`, a slot can hold a *different* key (`health` and `x` share slot 7). Check `this.keys[i] !== key` and return `undefined` in that case, before reading `this.vals[i]`.',
    ],
    walkthrough: `**How to think about it.** A hash table without collisions is the simplest table there is: the slot is a sum you can always redo, so storing and finding both start by redoing it. The only subtle part is \`get\`: an occupied slot is not proof that *your* key is there, because another key may have the same slot. So the table must store the key itself, not only the value, and compare it.

**The solution, line by line.**

\`\`\`js
set(key, v) {
  const i = hash(key) & 7;
  this.keys[i] = key;
  this.vals[i] = v;
}
get(key) {
  const i = hash(key) & 7;
  if (this.keys[i] !== key) {
    return undefined;
  }
  return this.vals[i];
}
\`\`\`

- \`const i = hash(key) & 7;\` hashes the key and keeps its low three bits, a slot from 0 to 7. For \`"x"\` that is 7.
- \`this.keys[i] = key;\` stores the key itself; \`get\` needs it later to check whose slot this is.
- \`this.vals[i] = v;\` stores the value in the same position of the other array: slot \`i\` of one belongs with slot \`i\` of the other.
- In \`get\`, the first line redoes the same sum, so it lands in the same slot.
- \`if (this.keys[i] !== key)\` covers two cases at once: an empty slot (\`null\` is not your key) and a slot that holds another key.
- \`return undefined;\` reports "not here".
- \`return this.vals[i];\` is only reached when the key matched.

**Common wrong attempts.**

- Reading \`this.vals[hash(key) & 7]\` without checking the key, as the starter does: \`get('health')\` then returns \`10\`, the value of \`x\`, which shares slot 7. A wrong answer is worse than no answer.
- Storing only the value in \`set\`: \`get\` then has no way to check the key, and every lookup in an empty slot compares against \`null\`.`,
    wrong: [
      {
        code: `function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

class Table {
  constructor() {
    this.keys = new Array(8).fill(null);
    this.vals = new Array(8).fill(null);
  }
  set(key, v) {
    const i = hash(key) & 7;
    this.keys[i] = key;
    this.vals[i] = v;
  }
  get(key) {
    return this.vals[hash(key) & 7];
  }
}`,
        why: '`get` never checks the key, so `get("health")` returns 10, the value of `x` in the same slot, and `get("z")` returns `null` instead of `undefined`.',
      },
      {
        code: `function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

class Table {
  constructor() {
    this.keys = new Array(8).fill(null);
    this.vals = new Array(8).fill(null);
  }
  set(key, v) {
    this.vals[hash(key) & 7] = v;
  }
  get(key) {
    const i = hash(key) & 7;
    if (this.keys[i] !== key) {
      return undefined;
    }
    return this.vals[i];
  }
}`,
        why: 'The key is never stored, so `keys[i] !== key` is always true and every `get` returns `undefined`.',
      },
    ],
  },
  growTable: {
    optional: true,
    title: 'Growing the table',
    prompt: 'This table checks its load in `set`, as the companion’s does, and calls `grow(cap)` with double the capacity. Write `grow(cap)`: make new `keys` and `vals` arrays of size `cap`, re-insert every live key with `find(newKeys, newVals, key)` (skip slots with no key, which also drops tombstones), recount `this.count`, and replace the old arrays.',
    starter: `const TOMB = true;
function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

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
  }
  grow(cap) {
  }
}`,
    solution: `const TOMB = true;
function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

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
  }
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
        code: `const TOMB = true;
function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

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
  }
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
        code: `const TOMB = true;
function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

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
  }
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
    q: 'A hash table has 16 slots and picks a slot with `hash & 15`. Which slot does a key with hash 37 go to?',
    options: [
      {
        t: '37',
        why: 'There are only 16 slots, numbered 0 to 15.',
      },
      {
        t: '21',
        why: '21 is 37 − 16, still past the last slot, 15. Masking keeps only the low four bits.',
      },
      {
        t: '1',
        why: '37 & 15 is not 1. Look at the low four bits of 37 (100101).',
      },
      {
        t: '5',
        correct: true,
        why: '37 & 15 keeps the low four bits, 0101, which is 5 (and 37 mod 16 is 5 too).',
      },
    ],
  },
  {
    q: 'An 8-slot table with linear probing holds `x` in slot 7, `vy` in 0 and `mass` in 1. Where does a new key `health` go if its hash & 7 is 7?',
    options: [
      {
        t: 'Slot 2',
        correct: true,
        why: 'Linear probing tries 7, wraps to 0, then 1, then finds slot 2 empty.',
      },
      {
        t: 'Slot 7, replacing `x`',
        why: 'A different key never replaces another. It probes on.',
      },
      {
        t: 'Slot 8',
        why: 'There is no slot 8: the index wraps round to 0.',
      },
      {
        t: 'Nowhere: a collision is an error',
        why: 'Collisions are normal; probing handles them.',
      },
    ],
  },
  {
    q: 'In an open-addressing table, why does `delete` leave a tombstone instead of an empty slot?',
    options: [
      {
        t: 'So the deleted value can be restored later',
        why: 'Tombstones keep no key or value to restore.',
      },
      {
        t: 'To keep `count` small',
        why: 'Tombstones are counted, so they do the opposite.',
      },
      {
        t: 'So lookups keep probing past it and still find keys stored beyond it',
        correct: true,
        why: 'An empty slot means “stop”, which would hide those keys.',
      },
      {
        t: 'Because JavaScript arrays cannot hold `null`',
        why: 'They can, and the table uses `null` for empty keys.',
      },
    ],
  },
  {
    q: 'A table that grows before its load factor would pass 0.75 has 8 slots and a count of 6. What happens on the next `set` of a new key?',
    options: [
      {
        t: 'It goes into the next free slot as usual',
        why: '7 entries would pass the 0.75 limit (6 of 8).',
      },
      {
        t: 'The table grows to 9 slots',
        why: 'The capacity stays a power of two, so masking works: 8 doubles to 16.',
      },
      {
        t: 'The insert fails: the table is full',
        why: 'It is never allowed to get full; it grows first.',
      },
      {
        t: 'The table grows to 16 slots and re-inserts every live key first',
        correct: true,
        why: '`count + 1 > capacity * 0.75`, so it doubles, and the new mask can change every starting slot.',
      },
    ],
  },
];
