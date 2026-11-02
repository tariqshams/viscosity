// Chapter 10 cards. Keys are stable ids: never rename them.

export const prompts = {
  'object-keys-strings': {
    q: 'Why does `hit[a] = true` (where `a` is an object, and `hit` a plain object) also make `hit[b]` true for a different object `b`?',
    a: 'Property names are always strings, and every plain object turns into the same string, `\'[object Object]\'`.',
  },
  'map-get-missing': {
    q: 'What does `m.get(k)` return when the Map `m` has no key `k`?',
    a: '`undefined`.',
  },
  'map-set-again': {
    q: '`m.set(\'a\', 1); m.set(\'a\', 2);` What are `m.get(\'a\')` and `m.size`?',
    a: '`2` and `1`. Setting an existing key replaces its value; each key appears once.',
  },
  'map-object-key': {
    q: '`m.set({ id: 1 }, \'x\')`. Then what is `m.get({ id: 1 })`, and why?',
    a: '`undefined`. Object keys are compared by identity, and the second `{ id: 1 }` is a different object.',
  },
  'forof-what': {
    q: 'What does `for (const x of xs)` give you each time round, and what does it not give you?',
    a: 'Each value of `xs` in order. It doesn’t give the index; use a classic `for` loop if you need `i`.',
  },
  'forof-map': {
    q: 'Looping `for (const e of m)` over a Map, what is `e`?',
    a: 'A two-slot array `[key, value]`, in the order the keys were first added.',
  },
  'set-dup': {
    q: 'You `add` the same value to a Set three times. What is its `size`?',
    a: '`1`. A Set holds each value at most once.',
  },
  'set-from-array': {
    q: 'What is the quickest way to remove duplicates from an array `xs`?',
    a: '`new Set(xs)`: it keeps one of each value, in first-seen order.',
  },
  'hash-why-fast': {
    q: 'In a hash table, why doesn’t a lookup have to check every entry?',
    a: 'The hash of the key says which bucket it must be in, so only the few entries in that bucket are checked.',
  },
  'hash-collision': {
    q: 'What is a collision in a hash table?',
    a: 'Two different keys hashing to the same bucket. They share it, and a lookup checks each one there.',
  },
};

export const examples = {
  'map-set-play': {
    title: 'Map, Set and for...of',
    code: `const a = { id: 1 };
const b = { id: 2 };

const hp = new Map();
hp.set(a, 100);
hp.set(b, 40);
hp.set(a, 90);
console.log(hp.get(a), hp.size);
console.log(hp.get({ id: 1 }));

for (const e of hp) {
  console.log(e[0].id, e[1]);
}

const s = new Set([3, 1, 3, 2, 1]);
console.log(s, s.has(2));`,
  },
};

export const exercises = {
  countEach: {
    title: 'Count every value',
    prompt:
      'Write `countEach(xs)`. It returns a **Map** from each value in the array `xs` to how many times it appears. For example `countEach([\'a\', \'b\', \'a\'])` maps `\'a\'` to `2` and `\'b\'` to `1`. The number `1` and the string `\'1\'` are different values and must be counted separately.',
    starter: `function countEach(xs) {
  // your code here
}

const m = countEach(['a', 'b', 'a']);
console.log(m);`,
    solution: `function countEach(xs) {
  const m = new Map();
  for (const x of xs) {
    if (m.has(x)) {
      m.set(x, m.get(x) + 1);
    } else {
      m.set(x, 1);
    }
  }
  return m;
}`,
    tests: `test('counts strings', () => {
  const m = countEach(['a', 'b', 'a']);
  expect(m.get('a')).toBe(2);
  expect(m.get('b')).toBe(1);
  expect(m.size).toBe(2);
});
test('returns a Map', () => {
  expect(countEach([]) instanceof Map).toBe(true);
});
test('an empty array gives an empty Map', () => {
  expect(countEach([]).size).toBe(0);
});
test('1 and \\'1\\' are different keys', () => {
  const m = countEach([1, '1', 1]);
  expect(m.get(1)).toBe(2);
  expect(m.get('1')).toBe(1);
});`,
    hints: [
      'Start with `const m = new Map();` and return it at the end.',
      'Visit each value with `for (const x of xs)`.',
      'If `m.has(x)`, set it to `m.get(x) + 1`. Otherwise this is the first one: set it to `1`.',
    ],
    walkthrough: `This is the counting loop from the chapter, wrapped in a function.

- **The table.** \`new Map()\` starts empty. An empty input never enters the loop, so it comes back empty, which is right.
- **The loop.** We need each value but not its index, so \`for...of\` fits.
- **First time or not?** \`m.get(x)\` on a missing key is \`undefined\`, and \`undefined + 1\` is \`NaN\`. So check \`m.has(x)\` first: if it's there, add one, otherwise start at \`1\`.
- **Keys keep their type.** A Map stores \`1\` and \`'1'\` as two keys. A plain object would turn both into the property \`'1'\` and count 3 of them.

Counting with a Map is one of the most common loops in all of programming. Keep this one handy.`,
    wrong: [
      {
        code: `function countEach(xs) {
  const m = {};
  for (const x of xs) {
    if (m[x]) {
      m[x] = m[x] + 1;
    } else {
      m[x] = 1;
    }
  }
  return m;
}`,
        why: 'A plain object isn’t a Map, so it has no `get`, `has` or `size`. It also turns every key into a string, so `1` and `\'1\'` would be counted together.',
      },
      {
        code: `function countEach(xs) {
  const m = new Map();
  for (const x of xs) {
    m.set(x, m.get(x) + 1);
  }
  return m;
}`,
        why: 'The first time a value is seen, `m.get(x)` is `undefined`, and `undefined + 1` is `NaN`. Every count ends up `NaN`. Start new keys at `1`.',
      },
    ],
  },
  firstRepeat: {
    optional: true,
    title: 'The first value you see twice',
    prompt:
      'Write `firstRepeat(xs)`. Read `xs` from left to right, and return the first value that you have **already seen**. If no value repeats, return `undefined`. For `[3, 1, 4, 1, 5, 3]` the answer is `1`: you reach the second `1` (index 3) before the second `3` (index 5).',
    starter: `function firstRepeat(xs) {
  // your code here
}

const xs = [3, 1, 4, 1, 5, 3];
console.log(firstRepeat(xs));`,
    solution: `function firstRepeat(xs) {
  const seen = new Set();
  for (const x of xs) {
    if (seen.has(x)) {
      return x;
    }
    seen.add(x);
  }
  return undefined;
}`,
    tests: `test('the earliest second sighting', () => {
  expect(firstRepeat([3, 1, 4, 1, 5, 3])).toBe(1);
});
test('a repeat right away', () => {
  expect(firstRepeat([7, 7, 8, 8])).toBe(7);
});
test('no repeats', () => {
  expect(firstRepeat([1, 2, 3])).toBe(undefined);
});
test('works with strings', () => {
  expect(firstRepeat(['a', 'b', 'b'])).toBe('b');
});`,
    hints: [
      'Keep a Set of the values you have seen so far.',
      'For each value: if it is already in the Set, that’s your answer. Otherwise add it.',
      'If the loop finishes, nothing repeated: return `undefined`.',
    ],
    walkthrough: `The question "have I seen this before?" is exactly what a Set answers.

- **\`seen\`** starts empty and grows as we read.
- **Check, then add.** For each value, \`seen.has(x)\` asks whether it appeared earlier. If so, this is the first second sighting, so return it at once (the early return from chapter 1). If not, \`seen.add(x)\` remembers it.
- **The order matters.** Checking *before* adding means a value never matches itself.

A tempting alternative is two nested loops: for each value, search the rest of the array for a copy. That is slower, since it compares every pair, and as the wrong attempt shows, it also answers a different question.`,
    wrong: [
      {
        code: `function firstRepeat(xs) {
  const n = xs.length;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (xs[i] === xs[j]) {
        return xs[i];
      }
    }
  }
  return undefined;
}`,
        why: 'This finds the first value that has a copy *somewhere later*, which is `3`, not the first value whose second copy you reach. It also compares every pair, which gets slow on big arrays.',
      },
      {
        code: `function firstRepeat(xs) {
  const seen = new Set();
  for (const x of xs) {
    seen.add(x);
    if (seen.has(x)) {
      return x;
    }
  }
  return undefined;
}`,
        why: 'Adding *before* checking means every value is found straight away: it always returns the first item. Check first, then add.',
      },
    ],
  },
};

export const quiz = [
  {
    q: `What does this print?
\`\`\`
const m = new Map();
m.set('a', 1);
m.set('a', 2);
console.log(m.size, m.get('a'));
\`\`\``,
    options: [
      { t: '`2 1`', why: 'A key appears only once, and the second `set` replaced the value.' },
      { t: '`1 2`', correct: true, why: 'There is one key, `\'a\'`, and its value was replaced by `2`.' },
      { t: '`2 2`', why: 'Setting the same key again doesn’t add a second entry.' },
      { t: '`1 1`', why: 'The second `set` replaces the first value.' },
    ],
  },
  {
    q: `What does this print?
\`\`\`
const m = new Map();
m.set({ id: 1 }, 'hi');
console.log(m.get({ id: 1 }));
\`\`\``,
    options: [
      { t: '`hi`', why: 'The two `{ id: 1 }`s are different objects, and Map compares object keys by identity.' },
      { t: 'An error', why: 'Looking up a missing key is fine; it just finds nothing.' },
      { t: '`{ id: 1 }`', why: '`get` returns values, not keys.' },
      { t: '`undefined`', correct: true, why: 'The lookup uses a new object, which was never stored as a key.' },
    ],
  },
  {
    q: 'What is `new Set([1, 2, 2, 3, 3, 3]).size`?',
    options: [
      { t: '`3`', correct: true, why: 'A Set keeps one of each value: 1, 2 and 3.' },
      { t: '`6`', why: 'Duplicates are dropped, so the size isn’t the array’s length.' },
      { t: '`1`', why: 'There are three different values.' },
      { t: '`0`', why: 'Building a Set from an array adds every value.' },
    ],
  },
  {
    q: 'Why is a Map a better lookup table than a plain object when the keys are particle objects?',
    options: [
      { t: 'Maps use less memory', why: 'That isn’t the issue here.' },
      { t: 'Objects can’t hold more than a few properties', why: 'Objects can hold many properties.' },
      { t: 'An object turns every key into a string, so all particle objects become the same key', correct: true, why: 'They all become `\'[object Object]\'`. A Map keeps each object as its own key.' },
      { t: 'Maps can only hold objects', why: 'Map keys can be any value: strings and numbers too.' },
    ],
  },
  {
    q: 'In `for (const e of m)`, where `m` is a Map, what is `e`?',
    options: [
      { t: 'Just the key', why: 'Looping over the Map itself gives both the key and the value.' },
      { t: 'Just the value', why: 'You get the key as well.' },
      { t: 'The index of the entry', why: '`for...of` never gives indexes.' },
      { t: 'A `[key, value]` pair, as a two-slot array', correct: true, why: 'So `e[0]` is the key and `e[1]` the value, in insertion order.' },
    ],
  },
  {
    q: 'How does a hash table usually find a key without checking every entry?',
    options: [
      { t: 'It keeps the keys in alphabetical order', why: 'That’s a different technique (a sorted structure). Hash tables don’t sort.' },
      { t: 'The hash of the key picks a bucket, and only that bucket is checked', correct: true, why: 'With keys spread evenly, each bucket holds only a few entries.' },
      { t: 'It checks every entry, just very quickly', why: 'Avoiding a full search is the whole point.' },
      { t: 'It remembers the last key you asked for', why: 'That would help only for repeated lookups of one key.' },
    ],
  },
];
