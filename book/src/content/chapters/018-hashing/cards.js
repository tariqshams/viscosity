// Chapter 18 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'linear-worst': {
    q: 'To find a name in an array of a million names with a loop, how many comparisons might it take, and when?',
    a: 'Up to a million: when the name is in the last slot, or not there at all.',
  },
  'hash-function-what': {
    q: 'What does a hash function do, in a hash table?',
    a: 'It turns a key into a number, which picks the bucket where that key is stored and looked for.',
  },
  'hash-why-fast': {
    q: 'In a hash table, why does a lookup not have to check every entry?',
    a: 'The hash of the key says which bucket it must be in, so only the few entries in that bucket are checked.',
  },
  'hash-collision': {
    q: 'What is a collision in a hash table?',
    a: 'Two different keys hashing to the same bucket. They share it, and a lookup checks each one there.',
  },
  'hash-same-key': {
    q: 'Why must a hash function always give the same number for the same key?',
    a: 'Otherwise a key could be stored in one bucket and later looked for in another, and it would seem to be missing.',
  },
  'bucket-mod': {
    q: 'A table has 8 buckets and a key hashes to 21. Which bucket does it go in?',
    a: 'Bucket 5: the remainder of 21 divided by 8 (`21 % 8`).',
  },
  'even-spread': {
    q: 'Why should a hash function spread keys evenly across the buckets?',
    a: 'So each bucket holds only a few entries; if many keys crowd into one bucket, looking in it becomes a long search again.',
  },
  'js-hash-hidden': {
    q: 'Python has `hash()` and Java has `hashCode()`. Can you see the hash a JavaScript Map uses?',
    a: 'No. JavaScript keeps the hash a Map uses hidden; you only see `set`, `get` and `has`.',
  },
};

export const examples = {
  'toy-table': {
    title: 'A toy hash table',
    code: `function hash(key) {
  return key.length % 4;
}

const buckets = [[], [], [], []];
const keys = ['red', 'blue', 'green'];
for (const k of keys) {
  buckets[hash(k)].push(k);
}
buckets[hash('pink')].push('pink');
console.log(buckets);

const b = buckets[hash('green')];
console.log(b.includes('green'));`,
  },
};

export const exercises = {
  hashSet: {
    title: 'A tiny hash set',
    prompt: `A hash set of whole numbers is an array \`t\` of buckets, each bucket an array. The bucket for a number \`k\` is \`t[k % t.length]\`. Write:

- \`add(t, k)\`, which puts \`k\` into its bucket, unless it is already there;
- \`has(t, k)\`, which returns \`true\` or \`false\` by looking **only** in \`k\`'s bucket.

For example, with \`t = [[], [], [], []]\`, \`add(t, 13)\` puts 13 in bucket 1, because \`13 % 4\` is 1.`,
    starter: `function add(t, k) {
  // your code here
}

function has(t, k) {
  // your code here
}

const t = [[], [], [], []];
add(t, 13);
console.log(t, has(t, 13));`,
    solution: `function has(t, k) {
  const b = t[k % t.length];
  for (const x of b) {
    if (x === k) return true;
  }
  return false;
}

function add(t, k) {
  if (!has(t, k)) {
    t[k % t.length].push(k);
  }
}`,
    tests: `const table = (n) => {
  const t = [];
  for (let i = 0; i < n; i++) t.push([]);
  return t;
};
test('has finds what add stored', () => {
  const t = table(4);
  add(t, 13);
  expect(has(t, 13)).toBe(true);
  expect(has(t, 7)).toBe(false);
});
test('k goes into bucket k % length', () => {
  const t = table(4);
  add(t, 13);
  expect(t[1]).toEqual([13]);
  const u = table(8);
  add(u, 13);
  expect(u[5]).toEqual([13]);
});
test('no duplicates', () => {
  const t = table(4);
  add(t, 6);
  add(t, 6);
  expect(t[2]).toEqual([6]);
});
test('colliding keys share a bucket', () => {
  const t = table(4);
  add(t, 1);
  add(t, 5);
  add(t, 9);
  expect(t[1]).toEqual([1, 5, 9]);
  expect(has(t, 5)).toBe(true);
  expect(has(t, 13)).toBe(false);
});
test('has looks only in its bucket', () => {
  const t = table(4);
  t[0].push(6);
  expect(has(t, 6)).toBe(false);
});`,
    hints: [
      'Both functions start the same way: work out which bucket `k` belongs in.',
      'The bucket is `t[k % t.length]`. Use `t.length` rather than `4`, so the set works with any number of buckets.',
      'In `has`, loop over that one bucket and return `true` on a match; after the loop, return `false`.',
      'In `add`, call `has(t, k)` first, and only `push` when it says `false`.',
    ],
    walkthrough: `**How to think about it.** Everything in a hash table starts with the same question: "which bucket?" Answer that once, the same way in both functions, and the rest is the array work you already know. \`has\` is a search, but a search of one short bucket rather than of everything; \`add\` is a \`push\`, guarded so that a number is never stored twice. Writing \`has\` first is easiest, because \`add\` can then use it.

**The solution, line by line.**

- \`function has(t, k) {\` takes the table and the number to look for.
- \`  const b = t[k % t.length];\` works out the bucket. \`t.length\` is the number of buckets, and \`k % t.length\` is the remainder, always between 0 and \`t.length - 1\`, so it is always a real slot. For 13 in a four-bucket table, that is \`t[1]\`.
- \`  for (const x of b) {\` visits only the entries in that one bucket.
- \`    if (x === k) return true;\` stops as soon as it finds \`k\`.
- \`  }\` ends the loop.
- \`  return false;\` is reached only when the bucket did not hold \`k\`. Because \`k\` can only ever be stored in this bucket, that means it is nowhere in the table.
- \`}\` ends \`has\`.
- \`function add(t, k) {\` takes the table and the number to store.
- \`  if (!has(t, k)) {\` asks whether it is already there; \`!\` turns \`true\` into \`false\` and back, so the body runs only when \`has\` says no.
- \`    t[k % t.length].push(k);\` puts \`k\` at the end of its bucket. The bucket number is worked out exactly as in \`has\`, which is the one rule a hash table cannot break.
- \`  }\` and \`}\` close the \`if\` and the function.

The "colliding keys" test stores 1, 5 and 9, which all leave 1 when divided by 4, so they share bucket 1, and \`has(t, 13)\` checks those three and gives up, without ever looking at the other buckets.

**Common wrong attempts.**

- A \`has\` that loops over *every* bucket gets the right answers for numbers that \`add\` stored, but it has thrown the whole point away: it is a full search again. The last test catches it by putting a number in the wrong bucket by hand.
- An \`add\` with no \`has\` check stores 6 twice, so a "set" holds duplicates.
- Writing \`k % 4\` instead of \`k % t.length\` works for four buckets and breaks for any other size.`,
    wrong: [
      {
        code: `function has(t, k) {
  for (const b of t) {
    for (const x of b) {
      if (x === k) return true;
    }
  }
  return false;
}

function add(t, k) {
  if (!has(t, k)) {
    t[k % t.length].push(k);
  }
}`,
        why: 'This `has` searches every bucket, which is the slow full search a hash table exists to avoid. The last test shows it: it finds a 6 that is not in 6’s bucket.',
      },
      {
        code: `function has(t, k) {
  const b = t[k % t.length];
  for (const x of b) {
    if (x === k) return true;
  }
  return false;
}

function add(t, k) {
  t[k % t.length].push(k);
}`,
        why: 'Without the `has` check, adding 6 twice stores it twice, so the set holds a duplicate.',
      },
      {
        code: `function has(t, k) {
  const b = t[k % 4];
  for (const x of b) {
    if (x === k) return true;
  }
  return false;
}

function add(t, k) {
  if (!has(t, k)) {
    t[k % 4].push(k);
  }
}`,
        why: 'The `4` only fits a four-bucket table: with eight buckets, 13 should go in bucket 5, not 1. Use `t.length`.',
      },
    ],
  },
  bucketSizes: {
    optional: true,
    title: 'How evenly do keys spread?',
    prompt: 'Write `bucketSizes(keys, B)`. It returns an array of `B` numbers: how many of the whole numbers in `keys` land in each bucket, using `k % B` as the bucket. For example `bucketSizes([1, 2, 3, 4], 2)` is `[2, 2]`, and `bucketSizes([0, 4, 8, 12], 4)` is `[4, 0, 0, 0]`: a very uneven spread.',
    starter: `function bucketSizes(keys, B) {
  // your code here
}

console.log(bucketSizes([1, 2, 3], 2));`,
    solution: `function bucketSizes(keys, B) {
  const sizes = [];
  for (let i = 0; i < B; i++) {
    sizes.push(0);
  }
  for (const k of keys) {
    const b = k % B;
    sizes[b] = sizes[b] + 1;
  }
  return sizes;
}`,
    tests: `test('an even spread', () => {
  expect(bucketSizes([1, 2, 3, 4], 2)).toEqual([2, 2]);
});
test('everything in one bucket', () => {
  const ks = [0, 4, 8, 12];
  expect(bucketSizes(ks, 4)).toEqual([4, 0, 0, 0]);
});
test('no keys gives all zeros', () => {
  expect(bucketSizes([], 3)).toEqual([0, 0, 0]);
});`,
    hints: [
      'The answer has one slot per bucket, so it has `B` slots whatever the keys are.',
      'Start with an array of `B` zeros (push `0` in a loop), then visit each key.',
      'For each key, its bucket is `k % B`; add one to that slot: `sizes[b] = sizes[b] + 1`.',
    ],
    walkthrough: `**How to think about it.** This is counting again, like the last chapter's \`countEach\`, except the things being counted are bucket numbers, and you know in advance exactly which bucket numbers exist (0 to \`B - 1\`). So an array with one slot per bucket, all starting at zero, is the natural tally sheet.

**The solution, line by line.**

- \`function bucketSizes(keys, B) {\` takes the keys and the number of buckets.
- \`  const sizes = [];\` starts the tally.
- \`  for (let i = 0; i < B; i++) {\` and \`    sizes.push(0);\` fill it with \`B\` zeros, one per bucket, so even buckets that nothing lands in show up as \`0\`.
- \`  }\` ends that loop.
- \`  for (const k of keys) {\` visits each key.
- \`    const b = k % B;\` works out its bucket.
- \`    sizes[b] = sizes[b] + 1;\` adds one to that bucket's count.
- \`  }\` ends the loop, and \`  return sizes;\` hands back the counts.

The second test is the interesting one: 0, 4, 8 and 12 are all multiples of 4, so with four buckets they all leave remainder 0 and crowd into bucket 0. That is why real hash functions scramble their input before taking the remainder: keys in real programs often follow patterns like this one.

**Common wrong attempts.**

- Starting with an empty array and never filling in the zeros: \`sizes[b]\` is \`undefined\` the first time, and \`undefined + 1\` is \`NaN\`; empty buckets are missing altogether.
- Returning one slot per *key* instead of per bucket.`,
    wrong: [
      {
        code: `function bucketSizes(keys, B) {
  const sizes = [];
  for (const k of keys) {
    const b = k % B;
    sizes[b] = sizes[b] + 1;
  }
  return sizes;
}`,
        why: 'Without the starting zeros, the first `sizes[b] + 1` is `undefined + 1`, which is `NaN`, and buckets nothing lands in are missing.',
      },
      {
        code: `function bucketSizes(keys, B) {
  const sizes = [];
  for (const k of keys) {
    sizes.push(k % B);
  }
  return sizes;
}`,
        why: 'This lists each key’s bucket number rather than counting how many keys each bucket gets.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'A loop searches an unsorted array of 1000 names for one that is **not** there. How many names does it compare?',
    options: [
      {
        t: '1',
        why: 'It cannot know the name is missing until it has looked everywhere.',
      },
      {
        t: 'About 10',
        why: 'There is no shortcut in an unsorted array.',
      },
      {
        t: 'All 1000',
        correct: true,
        why: 'Every slot has to be checked before it can say "not found".',
      },
      {
        t: '500',
        why: 'That is the average when the name is there; a missing name needs every slot.',
      },
    ],
  },
  {
    q: 'With the toy hash `key.length % 4`, which bucket does `\'green\'` go in?',
    options: [
      {
        t: '1',
        correct: true,
        why: '`\'green\'` has 5 letters, and `5 % 4` is 1.',
      },
      {
        t: '5',
        why: 'There are only buckets 0 to 3; the `% 4` brings 5 down to 1.',
      },
      {
        t: '0',
        why: 'That is where four-letter keys go.',
      },
      {
        t: '4',
        why: '`% 4` never gives 4: the remainders are 0, 1, 2 and 3.',
      },
    ],
  },
  {
    q: 'What is a collision?',
    options: [
      {
        t: 'Two entries with the same key',
        why: 'A table keeps each key once; a collision is about different keys.',
      },
      {
        t: 'A lookup for a missing key',
        why: 'That simply finds nothing.',
      },
      {
        t: 'A hash function that gives random numbers',
        why: 'That is a broken hash function, a different problem.',
      },
      {
        t: 'Two different keys that hash to the same bucket',
        correct: true,
        why: 'They share the bucket, and a lookup checks each entry there.',
      },
    ],
  },
  {
    q: 'A hash function sometimes gives a different bucket for the same key. What goes wrong?',
    options: [
      {
        t: 'Nothing, as long as the buckets are spread evenly',
        why: 'Spread does not matter if the key cannot be found again.',
      },
      {
        t: 'A key can be stored in one bucket and looked for in another, so it seems missing',
        correct: true,
        why: 'Storing and finding must work out the same bucket.',
      },
      {
        t: 'The table throws an error',
        why: 'There is no error message, which is what makes it hard to spot.',
      },
      {
        t: 'Lookups become slower but still correct',
        why: 'They become wrong, not slower.',
      },
    ],
  },
  {
    q: '1000 keys are spread evenly over 4 buckets. What does that mean for lookups, and what helps?',
    options: [
      {
        t: 'Each bucket holds about 250 keys, so lookups are slow; more buckets help',
        correct: true,
        why: 'About n / B entries per bucket: with more buckets, each bucket is shorter.',
      },
      {
        t: 'Lookups are instant whatever the number of buckets',
        why: 'Each lookup still searches its bucket, and these buckets are long.',
      },
      {
        t: 'Nothing can help: hash tables are always slow',
        why: 'Adding buckets keeps each bucket short.',
      },
      {
        t: 'Fewer buckets would help',
        why: 'Fewer buckets means longer buckets.',
      },
    ],
  },
];
