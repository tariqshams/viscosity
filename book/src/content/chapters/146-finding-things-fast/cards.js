// Chapter 146 cards: recall prompts, examples, exercises and quiz.

export const prompts = {
  'hash-what': {
    q: 'What does a hash function do, and what must always hold?',
    a: 'It turns a key into a number. Equal keys must always give equal hashes.',
  },
  'fnv-steps': {
    q: 'What two things does FNV-1a do for each character, and in which order?',
    a: 'First it XORs the character code into the hash, then it multiplies by the FNV prime, keeping 32 bits.',
  },
  'imul-why': {
    q: 'Why does `hashString` use `Math.imul(h, 16777619)` rather than `h * 16777619`?',
    a: '`*` multiplies doubles, and a product past 2^53 loses its low bits. `Math.imul` wraps exactly at 32 bits.',
  },
  'ushr-why': {
    q: 'Why does `hashString` end with `h >>> 0`?',
    a: 'XOR and `Math.imul` give signed 32-bit results, which can be negative. `>>> 0` reads the same bits as a number that never is.',
  },
  'mask-index': {
    q: 'How does an 8-slot table turn a hash into a slot?',
    a: '`hash & 7`: it keeps the low 3 bits, a number from 0 to 7.',
  },
  'power-of-two': {
    q: 'Why does the companion table keep its capacity a power of two?',
    a: 'So `hash & (capacity - 1)` picks a slot: keeping the low bits is the same as the remainder, and cheaper.',
  },
  'collision-what': {
    q: 'What is a collision, and can a good hash function prevent them?',
    a: 'Two different keys that want the same slot. No: with more possible keys than slots they must happen; a good hash only makes them rare.',
  },
  'hash-table-what': {
    q: 'Why does a hash-table lookup not get slower as the table holds more keys?',
    a: 'It does not search: the key’s hash says which slot to look in.',
  },
  'soa-table': {
    q: 'The VM’s table is two parallel arrays, `keys` and `values`. What did that layout replace, and what did it save?',
    a: 'An array of `{ key, value }` entry objects; it saves allocating, and following a pointer to, one object per slot.',
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

const hashFn = `function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}`;

const tableTop = `${hashFn}

class Table {
  constructor() {
    this.keys = new Array(8).fill(null);
    this.vals = new Array(8).fill(null);
  }`;

const goodSet = `  set(key, v) {
    const i = hash(key) & 7;
    this.keys[i] = key;
    this.vals[i] = v;
  }`;

const goodGet = `  get(key) {
    const i = hash(key) & 7;
    if (this.keys[i] !== key) {
      return undefined;
    }
    return this.vals[i];
  }`;

export const exercises = {
  fnv1a: {
    title: 'FNV-1a from scratch',
    prompt:
      'Write `fnv1a(s)`: start at `2166136261`; for each character, XOR in `s.charCodeAt(i)` and then multiply by `16777619` with 32-bit wrap-around; return the result as a 32-bit number that is never negative. The tests use the official FNV-1a test vectors.',
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
    prompt:
      'This 8-slot table keeps keys and values in two parallel arrays, `keys` and `vals`. Write `set(key, v)` and `get(key)`: the slot is `hash(key) & 7`. `get` returns `undefined` when the key is not there, **including** when a different key sits in its slot. The tests never store two keys that share a slot, so you do not need a collision rule yet.',
    starter: `${tableTop}
  set(key, v) {
  }
  get(key) {
    return this.vals[hash(key) & 7];
  }
}`,
    solution: `${tableTop}
${goodSet}
${goodGet}
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
        code: `${tableTop}
${goodSet}
  get(key) {
    return this.vals[hash(key) & 7];
  }
}`,
        why: '`get` never checks the key, so `get("health")` returns 10, the value of `x` in the same slot, and `get("z")` returns `null` instead of `undefined`.',
      },
      {
        code: `${tableTop}
  set(key, v) {
    this.vals[hash(key) & 7] = v;
  }
${goodGet}
}`,
        why: 'The key is never stored, so `keys[i] !== key` is always true and every `get` returns `undefined`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'In JavaScript, why does FNV-1a need `Math.imul` for its multiply?',
    options: [
      { t: '`*` is slower', why: 'Speed is not the issue: `*` gives the wrong answer for big products.' },
      { t: '`*` multiplies doubles, so a product beyond 2^53 loses low bits; `Math.imul` does exact 32-bit wrap-around', correct: true, why: 'The hash depends on exactly those low bits; for `"x"` a plain `*` is already off by one.' },
      { t: '`*` cannot multiply by a prime', why: 'It can multiply anything; the trouble is precision.' },
      { t: '`Math.imul` makes the result unsigned', why: 'It returns a signed 32-bit result. `>>> 0` makes it unsigned.' },
    ],
  },
  {
    q: 'A table has 16 slots. Which slot does a key with hash 37 go to?',
    options: [
      { t: '37', why: 'There are only 16 slots, numbered 0 to 15.' },
      { t: '21', why: '21 is 37 − 16, still past the last slot, 15. Masking keeps only the low four bits.' },
      { t: '1', why: '37 & 15 is not 1. Look at the low four bits of 37 (100101).' },
      { t: '5', correct: true, why: '37 & 15 keeps the low four bits, 0101, which is 5 (and 37 mod 16 is 5 too).' },
    ],
  },
  {
    q: 'Which property must every hash function have?',
    options: [
      { t: 'Different keys always get different hashes', why: 'Impossible: there are more strings than 32-bit numbers, so some must share.' },
      { t: 'Equal keys always get equal hashes', correct: true, why: 'Otherwise a lookup could compute a different slot from the one the key was stored in.' },
      { t: 'The hash can be turned back into the key', why: 'Hash functions do not need to be reversible, and FNV-1a is not.' },
      { t: 'Similar keys get similar hashes', why: 'The opposite: a good hash spreads similar keys apart, like `health` and `healti`.' },
    ],
  },
  {
    q: 'An 8-slot table holds `x` in slot 7. A lookup for `health`, which also hashes to slot 7, finds `x` there. What must a correct `get` conclude, if it has no collision rule?',
    options: [
      { t: 'That `health` has the value of `x`', why: 'A different key in the slot says nothing about `health`; returning its value would be a wrong answer.' },
      { t: 'That the hash function is broken', why: 'Collisions are normal; no hash function avoids them.' },
      { t: 'That `health` is not in that slot, which is why the table stores keys as well as values', correct: true, why: 'Comparing the stored key is how a table tells its own key from a collision.' },
      { t: 'That the table is full', why: 'Seven slots are empty. A collision is about one slot, not the whole table.' },
    ],
  },
  {
    q: 'What did changing `table.ts` from entry objects to parallel `keys` and `values` arrays remove?',
    options: [
      { t: 'The need for a hash function', why: 'Both layouts hash keys the same way.' },
      { t: 'Collisions', why: 'Layout does not change which slots keys want.' },
      { t: 'A separate heap object per slot, so a lookup no longer follows a pointer to each entry', correct: true, why: 'The struct of arrays, applied to the VM’s own table.' },
      { t: 'The `count` field', why: '`count` is still there, counting entries.' },
    ],
  },
];
