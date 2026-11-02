// Chapter 126 cards. Keys are stable ids: never rename them.

export const prompts = {
  'hash-what': {
    q: 'What does a hash function do, and what must always hold?',
    a: 'It turns a key into a number. Equal keys must always give equal hashes.',
  },
  'fnv-steps': {
    q: 'What does FNV-1a do for each character?',
    a: 'XORs the character code into the hash, then multiplies by the FNV prime, keeping 32 bits.',
  },
  'imul-why': {
    q: 'Why does `hashString` use `Math.imul(h, 16777619)` rather than `h * 16777619`?',
    a: '`*` multiplies doubles; the product passes 2^53 and loses its low bits. `Math.imul` wraps exactly at 32 bits.',
  },
  'ushr-why': {
    q: 'Why does `hashString` end with `h >>> 0`?',
    a: 'XOR and `Math.imul` give signed 32-bit results. `>>> 0` reads the same bits as an unsigned number.',
  },
  'mask-index': {
    q: 'How does an 8-slot table turn a hash into a starting slot?',
    a: '`hash & 7`: keep the low 3 bits. It works because the capacity is a power of two.',
  },
  'linear-probe': {
    q: 'With linear probing, where does a key go if its starting slot is taken?',
    a: 'The next slot, then the next, wrapping round at the end, until a free one.',
  },
  'stop-empty': {
    q: 'When does a lookup in an open-addressing table conclude the key is absent?',
    a: 'When it reaches a truly empty slot (no key, and not a tombstone).',
  },
  'tombstone-why': {
    q: 'What would go wrong if `delete` simply emptied the slot?',
    a: 'Keys that had probed past that slot would become unfindable: lookups would stop there too early.',
  },
  'count-tombstones': {
    q: 'Why does the companion table’s `count` include tombstones?',
    a: 'They still fill slots for probing. Without counting them, the table could run out of empty slots and `find` would loop forever.',
  },
  'grow-reinsert': {
    q: 'Why does growing re-insert every key instead of copying the arrays?',
    a: 'The mask changes (7 to 15), so every key’s starting slot changes. Re-inserting also drops tombstones.',
  },
  'soa-table': {
    q: 'What did the struct-of-arrays change to `table.ts` replace, and what did it save?',
    a: 'An array of `{ key, value }` entry objects became parallel `keys` and `values` arrays: no object to allocate or chase per slot.',
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

export const exercises = {
  probeTable: {
    title: 'Linear probing with tombstones',
    prompt:
      'This 8-slot table stores keys and values in two parallel arrays. `get` and `set` are done, but `find` ignores collisions and `delete` loses keys. Write `find(key)`: start at `hash(key) & mask`, step to the next slot (wrapping) until you reach the key or a truly empty slot, and if you passed a tombstone on the way to an empty slot, return the first tombstone instead. Then make `delete` leave a tombstone: key `null`, value `TOMB`. The tests never fill the table, so no growing is needed.',
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
      'In the tests, `x` and `health` both start at slot 7. `vy` is in 0 and `mass` in 1, so `health` should end up in slot 2, after wrapping from 7 to 0.',
      'Loop forever with `for (;;)`, and step with `i = (i + 1) & mask`, which wraps from 7 back to 0. Return as soon as `keys[i] === key`.',
      'A slot with key `null` is either empty (value `null`: stop here) or a tombstone (value `TOMB`: remember the first one in `tomb`, then keep going). At an empty slot, return `tomb` if you saw one, otherwise `i`.',
    ],
    walkthrough: `\`\`\`js
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

delete(key) {
  const i = this.find(key);
  if (this.keys[i] === null) return;
  this.keys[i] = null;
  this.vals[i] = TOMB;
}
\`\`\`

- **Three kinds of slot.** A key: the key you want, or someone else’s (keep going). No key and value \`null\`: truly empty, so the key isn’t in the table. No key and value \`TOMB\`: a tombstone, so keep going.
- **Why keep going past a tombstone.** \`health\` was placed in slot 2 *because* slot 1 was full at the time. Deleting \`mass\` must not cut that path, or \`health\` disappears.
- **Why remember the first tombstone.** When the key turns out to be new, reusing the earliest tombstone keeps the table compact and the probe path short. You can only know the key is new once you hit an empty slot, so you can’t stop at the tombstone itself.
- **\`& mask\` wraps** from 7 back to 0, because 8 & 7 is 0.

This is the companion VM’s \`Table.find\`, with \`hash(key)\` in place of the stored \`key.hash\` and \`===\` on strings in place of identity on interned objects.`,
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
        why: 'Lookups are right, but inserting never reuses a tombstone: the new `mass` goes to slot 5, the first empty one, and tombstones pile up.',
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
  fnv1a: {
    optional: true,
    title: 'FNV-1a from scratch',
    prompt:
      'Write `fnv1a(s)`: start at `2166136261`; for each character, XOR in `s.charCodeAt(i)` and then multiply by `16777619` with 32-bit wrap-around; return the result as an unsigned 32-bit number. The tests use the official FNV-1a test vectors.',
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
      'Loop over the characters. Inside, two steps, in this order: `h ^= s.charCodeAt(i)`, then the multiply.',
      'Use `Math.imul(h, 16777619)` for the multiply: `h * 16777619` loses low bits once the product passes 2^53.',
      'Return `h >>> 0`, or the result can be negative.',
    ],
    walkthrough: `\`\`\`js
function fnv1a(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
\`\`\`

- **XOR, then multiply.** That order is the “1a”. The older FNV-1 multiplies first and XORs second, and gives different hashes: for \`"a"\` it gives \`0x050c5d7e\`.
- **\`Math.imul\`** multiplies as 32-bit integers and keeps the low 32 bits of the product, which is exactly the “mod 2^32” of the C original. A plain \`*\` would compute a product up to about 2^55 as a double, which can’t hold all of its low bits.
- **\`>>> 0\`** turns the signed 32-bit result into the unsigned value the test vectors use. \`0xe40c292c\` is above 2^31, so without it \`"a"\` would come out negative.`,
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
        why: 'A double multiply loses the low bits of the product. Short strings can come out right by luck, but `"foobar"` gives 249808880, not 0xbf9cf968. Use `Math.imul`.',
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
        why: 'Multiplying before XOR is FNV-1, not FNV-1a: `"a"` gives 0x050c5d7e.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'In JavaScript, why does FNV-1a need `Math.imul` for its multiply?',
    options: [
      { t: '`*` is slower', why: 'Speed isn’t the issue: `*` gives the wrong answer for big products.' },
      { t: '`*` multiplies doubles, so a product beyond 2^53 loses low bits; `Math.imul` does exact 32-bit wrap-around', correct: true, why: 'The hash depends on exactly those low bits.' },
      { t: '`*` can’t multiply by a prime', why: 'It can multiply anything; the trouble is precision.' },
      { t: '`Math.imul` makes the result unsigned', why: 'It returns a signed 32-bit result. `>>> 0` makes it unsigned.' },
    ],
  },
  {
    q: 'A table has 16 slots. Which starting slot does a key with hash 37 get?',
    options: [
      { t: '37', why: 'There are only 16 slots, numbered 0 to 15.' },
      { t: '21', why: '21 is 37 − 16, still past the last slot, 15. Masking keeps only the low four bits.' },
      { t: '1', why: '37 & 15 isn’t 1. Look at the low four bits of 37 (100101).' },
      { t: '5', correct: true, why: '37 & 15 keeps the low four bits, 0101, which is 5.' },
    ],
  },
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
      { t: 'So the deleted value can be restored later', why: 'Tombstones store no key or value to restore.' },
      { t: 'To keep `count` small', why: 'Tombstones are counted, so they do the opposite.' },
      { t: 'So lookups keep probing past it and still find keys that were stored beyond it', correct: true, why: 'An empty slot means “stop”, which would hide those keys.' },
      { t: 'Because JavaScript arrays can’t hold `null`', why: 'They can, and the table uses `null` for empty keys.' },
    ],
  },
  {
    q: 'The companion table has 8 slots and `count` is 6. What happens on the next insert of a new key?',
    options: [
      { t: 'It goes into the next free slot as usual', why: '7 entries would pass the 0.75 limit (6 of 8).' },
      { t: 'The table grows to 16 slots and re-inserts every live key first', correct: true, why: '`count + 1 > capacity * 0.75`, so it doubles, and the new mask changes every starting slot.' },
      { t: 'The table grows to 9 slots', why: 'Capacity stays a power of two, so masking works: 8 doubles to 16.' },
      { t: 'The insert fails: the table is full', why: 'It is never allowed to get full; it grows first.' },
    ],
  },
  {
    q: 'What did changing `table.ts` from entry objects to parallel `keys` and `values` arrays remove?',
    options: [
      { t: 'The need for a hash function', why: 'Both layouts hash keys the same way.' },
      { t: 'Collisions', why: 'Layout doesn’t change which slots keys want.' },
      { t: 'Tombstones', why: 'Tombstones are still there: key `null`, value `true`.' },
      { t: 'A separate heap object per slot, so probing no longer chases a pointer to each entry', correct: true, why: 'Chapter 59’s struct of arrays, applied to the VM’s own table.' },
    ],
  },
];
