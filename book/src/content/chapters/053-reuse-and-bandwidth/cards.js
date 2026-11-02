// Cards for "Reuse and bandwidth" (split from chapter 52).
// Keys are stable ids: never rename them.

export const prompts = {
  'temporal-what': {
    q: 'What is **temporal locality**?',
    a: 'Using the same data again soon, while it is still in a cache.',
  },
  'fuse-why': {
    q: 'Why can one loop that computes two sums beat two separate loops over a huge array?',
    a: 'It uses each value while its line is still cached, instead of fetching the whole array twice.',
  },
  'reuse-soon': {
    q: 'What decides whether data used again is still in the cache?',
    a: 'How much other data was touched in between: if it is more than the cache holds, the data has been thrown out.',
  },
  'bandwidth-what': {
    q: 'What is **bandwidth**?',
    a: 'How many bytes per second can flow from memory to the CPU.',
  },
  'latency-vs-bandwidth': {
    q: 'Latency or bandwidth: which one limits a loop that streams through a huge array in order?',
    a: 'Bandwidth: many line requests overlap, so the limit is how many bytes per second can arrive.',
  },
  'stream-floor': {
    q: 'Roughly how long must reading 8 MB once take, at a bandwidth of about 10 GB per second?',
    a: 'About 0.8 milliseconds: 8 × 10⁶ bytes ÷ (10 × 10⁹ bytes per second).',
  },
  'useful-share': {
    q: 'A loop reads one 8-byte field from packed records of 6 fields. What share of the fetched bytes does it use?',
    a: 'About one sixth: 8 useful bytes in every 48 that stream past.',
  },
  'soa-vs-packed': {
    q: 'Why is summing one field faster from a struct of arrays than from a packed buffer of 6-field records?',
    a: 'The struct of arrays fetches only that field’s bytes; the packed buffer drags five unused fields through the caches with every value.',
  },
};

export const examples = {
  'fuse-loops': {
    title: 'Two passes vs one',
    code: `const n = 1 << 23; // 8M doubles: 64 MB
const xs = new Float64Array(n);
for (let i = 0; i < n; i++) {
  xs[i] = i % 7;
}

function twoPasses() {
  let a = 0;
  let b = 0;
  for (const v of xs) a += v;
  for (const v of xs) b += v * v;
  return a + b;
}

function onePass() {
  let a = 0;
  let b = 0;
  for (const v of xs) {
    a += v;
    b += v * v;
  }
  return a + b;
}

function time(f) {
  const t0 = performance.now();
  f();
  return performance.now() - t0;
}

time(twoPasses);
time(onePass); // warm up first
const t2 = time(twoPasses).toFixed(1);
const t1 = time(onePass).toFixed(1);
console.log('two passes, ms:', t2);
console.log('one pass, ms:', t1);`,
  },
};

export const exercises = {
  countFetches: {
    title: 'A cache that forgets',
    prompt:
      'Simulate the toy cache from the diagram. `lines` is the list of cache lines a loop touches, in order; the cache holds at most `cap` lines, and when it is full and a new line arrives, it throws out the line **used longest ago**. Write `countFetches(lines, cap)` that returns how many lines had to be fetched (a line not in the cache when it is used). Using a line that is in the cache makes it the most recently used.',
    starter: `function countFetches(lines, cap) {
  // your code here
}

const two = [0, 1, 2, 0, 1, 2];
console.log(countFetches(two, 2)); // 6`,
    solution: `function countFetches(lines, cap) {
  const cache = []; // oldest first
  let fetches = 0;
  for (const l of lines) {
    const k = cache.indexOf(l);
    if (k >= 0) {
      cache.splice(k, 1);
    } else {
      fetches++;
      if (cache.length === cap) {
        cache.shift();
      }
    }
    cache.push(l);
  }
  return fetches;
}`,
    tests: `test('two passes over 3 lines, cache of 2', () => {
  const two = [0, 1, 2, 0, 1, 2];
  expect(countFetches(two, 2)).toBe(6);
});
test('the same two passes, cache of 3', () => {
  const two = [0, 1, 2, 0, 1, 2];
  expect(countFetches(two, 3)).toBe(3);
});
test('fused: each line used twice in a row', () => {
  const one = [0, 0, 1, 1, 2, 2];
  expect(countFetches(one, 2)).toBe(3);
});
test('using a line keeps it', () => {
  // 0 is used again before 2 arrives,
  // so 1 is the oldest and goes
  expect(countFetches([0, 1, 0, 2, 0], 2)).toBe(3);
});
test('nothing touched', () => {
  expect(countFetches([], 2)).toBe(0);
});`,
    hints: [
      'Keep the cache as an array in order of use: oldest at the front, most recent at the back. Three array methods help: `xs.indexOf(v)` gives the index of `v` (or `-1` if it is not there), `xs.splice(k, 1)` removes the item at index `k`, and `xs.shift()` removes the first item.',
      'For each line: if it is in the cache, take it out of its place (it will go to the back). If it is not, count a fetch, and if the cache is full, throw out the front item.',
      'Either way, finish by pushing the line onto the back: it is now the most recently used. Return the count at the end.',
    ],
    walkthrough: `**How to think about it.** Play the first test by hand with a cache of 2, writing the cache oldest first. Line 0: not there, fetch (1), cache \`[0]\`. Line 1: fetch (2), \`[0, 1]\`. Line 2: fetch (3); the cache is full, so the oldest, 0, goes: \`[1, 2]\`. Line 0 again: it was thrown out, so fetch (4), and 1 goes: \`[2, 0]\`. Line 1: fetch (5), \`[0, 1]\`. Line 2: fetch (6). Six fetches for three lines: the two-pass loop from the diagram. Now notice the bookkeeping you did: the cache is a list kept in order of use, the front is "used longest ago", and a line that is used goes to the back. The fourth test checks the last part: in \`[0, 1, 0, 2, 0]\`, using 0 a second time moves it to the back, so when 2 arrives it is 1 that is thrown out, and the final 0 is a hit.

**The solution, line by line.**

- \`function countFetches(lines, cap) {\` takes the lines in order and the cache size.
- \`  const cache = []; // oldest first\` is the cache, in order of use.
- \`  let fetches = 0;\` counts fetches.
- \`  for (const l of lines) {\` handles each use of a line.
- \`    const k = cache.indexOf(l);\` looks for the line: \`k\` is its position, or \`-1\` if it is not cached.
- \`    if (k >= 0) {\` means a hit.
- \`      cache.splice(k, 1);\` takes it out of its old position, so that it can go to the back below.
- \`    } else {\` means a miss.
- \`      fetches++;\` counts the fetch.
- \`      if (cache.length === cap) {\` checks whether the cache is full.
- \`        cache.shift();\` throws out the front item, the line used longest ago.
- \`      }\` and \`    }\` close the two \`if\`s.
- \`    cache.push(l);\` puts the line at the back: whether it was a hit or a fetch, it is now the most recently used.
- \`  }\` closes the loop.
- \`  return fetches;\` hands back the count.
- \`}\` closes the function.

Compare the first and third tests: the same six uses of three lines cost 6 fetches as two passes and 3 when fused. Then compare the first and second: with room for all three lines, even two passes cost only 3. Temporal locality is about whether the reuse comes before the cache runs out of room.

**Common wrong attempts.**

- Leaving a hit where it is (not moving it to the back) turns the rule into "throw out the line *fetched* longest ago", which gets the fourth test wrong: it throws out 0, which was just used.
- Counting a fetch on every use and only skipping the push for hits counts hits as fetches too.
- Throwing out the *back* item (\`cache.pop()\`) throws out the newest line instead of the oldest.`,
    wrong: [
      {
        code: `function countFetches(lines, cap) {
  const cache = [];
  let fetches = 0;
  for (const l of lines) {
    if (cache.indexOf(l) < 0) {
      fetches++;
      if (cache.length === cap) {
        cache.shift();
      }
      cache.push(l);
    }
  }
  return fetches;
}`,
        why: 'A hit is left in its old place, so the cache throws out the line fetched longest ago, not the one used longest ago. In [0, 1, 0, 2, 0] it throws out 0 just after using it.',
      },
      {
        code: `function countFetches(lines, cap) {
  const cache = [];
  let fetches = 0;
  for (const l of lines) {
    const k = cache.indexOf(l);
    if (k >= 0) {
      cache.splice(k, 1);
    } else {
      fetches++;
      if (cache.length === cap) {
        cache.pop();
      }
    }
    cache.push(l);
  }
  return fetches;
}`,
        why: '`pop` removes the *last* item, the most recently used line. The line to throw out is the oldest, at the front: use `shift`.',
      },
    ],
  },
  usefulShare: {
    optional: true,
    title: 'What share is useful?',
    prompt:
      'A long loop reads one 8-byte field from packed records of `k` fields (8 bytes each), with 64-byte lines. Write `usefulShare(k)` that returns the share of the fetched bytes that the loop uses, as a number between 0 and 1.',
    starter: `function usefulShare(k) {
  // your code here
}

// about 0.1667:
console.log(usefulShare(6));`,
    solution: `function usefulShare(k) {
  if (k <= 8) {
    return 1 / k;
  }
  return 8 / 64;
}`,
    tests: `test('one field: every byte used', () => {
  expect(usefulShare(1)).toBeCloseTo(1);
});
test('two fields: half', () => {
  expect(usefulShare(2)).toBeCloseTo(0.5);
});
test('six fields: one sixth', () => {
  expect(usefulShare(6)).toBeCloseTo(1 / 6);
});
test('eight fields: one line per read', () => {
  expect(usefulShare(8)).toBeCloseTo(1 / 8);
});
test('sixteen fields: still one eighth', () => {
  expect(usefulShare(16)).toBeCloseTo(1 / 8);
});`,
    hints: [
      'Think about two cases: records smaller than a line, and records of a line or more.',
      'While a record fits in a line (`k <= 8`), the whole record streams past for each read, and 8 of its `8 * k` bytes are used.',
      'Once the stride reaches 64 bytes, each read fetches one whole line of its own and uses 8 of its 64 bytes; lines in between are skipped.',
    ],
    walkthrough: `**How to think about it.** Use the stride. With \`k\` fields of 8 bytes, consecutive reads are \`8 * k\` bytes apart. If that is less than a line, the loop eventually fetches every line of the buffer, so all \`8 * k\` bytes of each record stream past and 8 of them are used: a share of \`8 / (8 * k)\`, which is \`1 / k\`. If the stride is a line or more, the loop fetches one line per read and skips the rest, so the share is 8 of 64 bytes, one eighth, however big the records get. At exactly \`k = 8\` both rules give one eighth, so it does not matter which case it falls in.

**The solution, line by line.**

- \`function usefulShare(k) {\` takes the number of fields per record.
- \`  if (k <= 8) {\` is the case where a record fits in a line.
- \`    return 1 / k;\` is 8 useful bytes out of \`8 * k\`.
- \`  }\` closes it.
- \`  return 8 / 64;\` is the case of a stride of a line or more: 8 useful bytes in each 64-byte line fetched.
- \`}\` closes the function.

(A one-line version is \`Math.max(1 / k, 1 / 8)\`: the share never drops below one eighth.)

**Common wrong attempts.**

- \`return 1 / k;\` on its own is right for small records but keeps shrinking for big ones; with 16 fields it gives one sixteenth, though the loop never fetches the lines it skips.
- \`return 8 / 64;\` on its own treats every layout as one line per read, which is wrong for a plain typed array (\`k = 1\`), where every byte is used.`,
    wrong: [
      {
        code: `function usefulShare(k) {
  return 1 / k;
}`,
        why: 'For records bigger than a line the loop skips whole lines, so the share stops at one eighth: with 16 fields it is 1/8, not 1/16.',
      },
      {
        code: `function usefulShare(k) {
  return 8 / 64;
}`,
        why: 'Small records share lines: a plain typed array (k = 1) uses every byte it fetches.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Which is an example of **temporal** locality?',
    options: [
      { t: 'Reading xs[0], then xs[1], then xs[2]', why: 'That is spatial locality: nearby data.' },
      { t: 'Storing x and y in separate arrays', why: 'That is a layout decision, not a reuse pattern.' },
      { t: 'Using a value twice within one loop iteration, while it is still cached', correct: true, why: 'Same data again, soon: that is temporal locality.' },
      { t: 'Following a pointer to an object', why: 'That says nothing about reusing data soon.' },
    ],
  },
  {
    q: 'An array is far bigger than the caches. Why can two separate loops over it cost about twice as much memory traffic as one fused loop?',
    options: [
      { t: 'The second loop finds the early lines long gone and fetches the whole array again', correct: true, why: 'By the end of the first pass, the start of the array has been thrown out to make room.' },
      { t: 'Two loops do twice as many additions', why: 'Both versions do the same arithmetic; the difference is in fetching.' },
      { t: 'Loops cannot read typed arrays twice', why: 'They can; the second read just has to fetch the data again.' },
      { t: 'The fused loop has a smaller stride', why: 'Both read every element in order, with stride 8.' },
    ],
  },
  {
    q: 'What does **bandwidth** measure?',
    options: [
      { t: 'How long a single read takes', why: 'That is latency.' },
      { t: 'How many bytes per second can flow from memory to the CPU', correct: true, why: 'Latency is how long one access takes; bandwidth is how much can flow per second.' },
      { t: 'How many bytes a cache line holds', why: 'That is the line size, 64 bytes on most processors.' },
      { t: 'How many registers a CPU has', why: 'Registers have nothing to do with memory bandwidth.' },
    ],
  },
  {
    q: 'In the benchmark, summing `mass` was faster from a struct of arrays than from the packed Float64Array buffer. Why?',
    options: [
      { t: 'The packed buffer contains objects and pointers', why: 'It doesn’t: it is one Float64Array. That is why it beats the objects.' },
      { t: 'The struct of arrays uses fewer bytes per number', why: 'Both store each number in 8 bytes.' },
      { t: 'The packed buffer is read backwards', why: 'Both are read in increasing order.' },
      { t: 'With stride 8, every byte of each line is a mass; with stride 48, most of each line is other fields', correct: true, why: 'Fewer bytes fetched for the same masses means less waiting and less bandwidth used.' },
    ],
  },
  {
    q: 'At about 10 GB per second, what is the least time it can take to read a 64 MB array once?',
    options: [
      { t: 'About 6.4 microseconds', why: 'That is a thousand times too small: 64 × 10⁶ ÷ (10 × 10⁹) is 0.0064 seconds.' },
      { t: 'About 6.4 milliseconds', correct: true, why: '64 million bytes ÷ 10 billion bytes per second = 0.0064 s.' },
      { t: 'About 6.4 seconds', why: 'That is a thousand times too large.' },
      { t: 'No time at all, if the loop is in order', why: 'Order helps the hardware keep the flow going, but the bytes still have to arrive.' },
    ],
  },
];
