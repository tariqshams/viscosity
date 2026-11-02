// Chapter 28 cards. Keys are stable ids: never rename them.

export const prompts = {
  'line-what': {
    q: 'What is a **cache line**, and how big is it on most mainstream processors?',
    a: 'The block that caches move as one unit: 64 bytes.',
  },
  'line-of': {
    q: 'With 64-byte lines, which line holds address 200?',
    a: 'Line 3, because Math.floor(200 / 64) = 3 (it covers addresses 192 to 255).',
  },
  'eighth-why': {
    q: 'Why is touching every 8th element of a big Float64Array not 8 times faster than touching every element?',
    a: 'Eight float64s fill a 64-byte line, so both loops fetch every line of the array.',
  },
  'count-lines': {
    q: 'To estimate a loop’s memory cost, what should you count?',
    a: 'The distinct cache lines it touches, not the number of values it reads.',
  },
  'spatial-what': {
    q: 'What is **spatial locality**?',
    a: 'Using data near data you just used, so it is already in a fetched line.',
  },
  'temporal-what': {
    q: 'What is **temporal locality**?',
    a: 'Using the same data again soon, while it is still in a cache.',
  },
  'fuse-why': {
    q: 'Why can one loop that computes two sums beat two separate loops over a huge array?',
    a: 'It uses each value while its line is still cached, instead of fetching the whole array twice.',
  },
  'stride-what': {
    q: 'What is the **stride** of reading one field from packed records of 6 fields, 8 bytes each?',
    a: '48 bytes: the distance from one record’s field to the next record’s.',
  },
  'stride-64': {
    q: 'Once a loop’s stride is 64 bytes or more, how many cache lines does each read cost?',
    a: 'A whole line each: no two reads share a line.',
  },
  'bandwidth-what': {
    q: 'What is **bandwidth**, and how do unused bytes in a cache line waste it?',
    a: 'How many bytes per second can flow from memory; every unused byte in a fetched line takes up some of that flow.',
  },
};

export const examples = {
  'every-eighth': {
    title: 'Every element vs every 8th',
    code: `const n = 1 << 23; // 8M doubles: 64 MB
const xs = new Float64Array(n);

function touch(step) {
  const t0 = performance.now();
  for (let i = 0; i < n; i += step) {
    xs[i] += 1;
  }
  return performance.now() - t0;
}

touch(1);
touch(8); // warm up first
// performance.now() is a clock in ms
const a = touch(1);
const b = touch(8);
console.log('all ms:', a.toFixed(1));
console.log('8th ms:', b.toFixed(1));
const r = (a / b).toFixed(1);
console.log('8th was', r, 'x faster');`,
  },
};

export const exercises = {
  countLines: {
    title: 'How many lines?',
    prompt:
      'Write `countLines(addrs)` that returns how many **different** 64-byte cache lines the byte addresses in `addrs` fall in. Address `a` is in line `Math.floor(a / 64)`.',
    starter: `function countLines(addrs) {
  // your code here
}

// expect 2:
console.log(countLines([0, 8, 63, 64]));`,
    solution: `function countLines(addrs) {
  const lines = new Set();
  for (const a of addrs) {
    lines.add(Math.floor(a / 64));
  }
  return lines.size;
}`,
    tests: `test('one line', () => {
  expect(countLines([0, 8, 16, 63])).toBe(1);
});
test('64 starts a new line', () => {
  expect(countLines([0, 8, 63, 64])).toBe(2);
});
test('no addresses', () => {
  expect(countLines([])).toBe(0);
});
test('order and repeats do not matter', () => {
  expect(countLines([300, 0, 300, 5])).toBe(2);
});
test('stride 48, eight reads', () => {
  const xs = [];
  for (let i = 0; i < 8; i++) xs.push(32 + i * 48);
  expect(countLines(xs)).toBe(6);
});`,
    hints: [
      'For each address, compute its line number with `Math.floor(a / 64)`.',
      'You want the number of *different* line numbers. A `Set` (chapter 10) ignores duplicates.',
      'Add every line number to a Set, then return its `size`.',
    ],
    walkthrough: `Two ideas from this chapter, and one from chapter 10.

- **Address to line.** Lines start at multiples of 64, so \`Math.floor(a / 64)\` names the line. Addresses 0 to 63 give 0; 64 gives 1.
- **Distinct lines.** Reading three values in one line costs one fetch, not three, so duplicates must count once. A \`Set\` keeps each line number once, whatever order the addresses arrive in.
- **Answer.** \`lines.size\`.

The last test is the packed layout from the stride diagram: eight reads of \`mass\`, 48 bytes apart, land in six lines. You have just built the tool that a layout cost model uses.`,
    wrong: [
      {
        code: `function countLines(addrs) {
  let n = 0;
  for (const a of addrs) {
    n += Math.floor(a / 64);
  }
  return n;
}`,
        why: 'This adds up line *numbers* instead of counting distinct lines. Address 300 alone would count as 4 lines.',
      },
      {
        code: `function countLines(addrs) {
  const lines = new Set(addrs);
  return lines.size;
}`,
        why: 'This counts distinct *addresses*. Addresses 0 and 8 are different, but they share one line. Convert each address to its line number first.',
      },
    ],
  },
  fieldLines: {
    optional: true,
    title: 'Lines for one field',
    prompt:
      'Records are packed from address 0, each with `k` fields of 8 bytes. A loop reads field 0 of records `0` to `n - 1`. Write `fieldLines(n, k)` that returns how many different 64-byte lines that loop touches.',
    starter: `function fieldLines(n, k) {
  // your code here
}

// expect 6:
console.log(fieldLines(8, 6));`,
    solution: `function fieldLines(n, k) {
  const lines = new Set();
  for (let i = 0; i < n; i++) {
    const addr = i * k * 8;
    lines.add(Math.floor(addr / 64));
  }
  return lines.size;
}`,
    tests: `test('one field per record: a typed array', () => {
  expect(fieldLines(8, 1)).toBe(1);
  expect(fieldLines(16, 1)).toBe(2);
});
test('six fields: stride 48', () => {
  expect(fieldLines(8, 6)).toBe(6);
});
test('eight fields: one line per record', () => {
  expect(fieldLines(8, 8)).toBe(8);
});
test('sixteen fields: still one per record', () => {
  expect(fieldLines(5, 16)).toBe(5);
});
test('no records', () => {
  expect(fieldLines(0, 6)).toBe(0);
});`,
    hints: [
      'Field 0 of record `i` is at address `i * k * 8`.',
      'Turn each address into a line number and count the distinct ones, as in the last exercise.',
    ],
    walkthrough: `Generate the addresses, then count lines.

- Record \`i\` starts at element \`i * k\`, which is byte \`i * k * 8\`. Field 0 is right there.
- The stride is \`k * 8\` bytes. With \`k = 1\` (a plain typed array), eight reads share each line. With \`k = 6\`, eight reads touch six lines. From \`k = 8\` up, every record costs its own line.

Notice the pattern: once the stride reaches 64 bytes, a bigger record doesn’t make this loop any worse. It is already paying a full line per read.`,
    wrong: [
      {
        code: `function fieldLines(n, k) {
  return Math.ceil(n * k * 8 / 64);
}`,
        why: 'This counts every line in the whole buffer. Once the stride passes 64 bytes the loop skips lines entirely: 5 records of 16 fields span 10 lines but the loop touches only 5.',
      },
      {
        code: `function fieldLines(n, k) {
  return n;
}`,
        why: 'One line per read is only true once the stride is 64 bytes or more. With small strides, several reads share a line.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'With 64-byte cache lines, which pair of addresses is in the same line?',
    options: [
      { t: '63 and 64', why: '63 is the last byte of line 0; 64 is the first byte of line 1.' },
      { t: '64 and 127', correct: true, why: 'Both give Math.floor(a / 64) = 1.' },
      { t: '0 and 64', why: 'Those are the first bytes of lines 0 and 1.' },
      { t: '100 and 200', why: '100 is in line 1, 200 in line 3.' },
    ],
  },
  {
    q: 'You read one 8-byte number that isn’t cached. How many bytes come from memory?',
    options: [
      { t: '1', why: 'Caches don’t move single bytes.' },
      { t: '8', why: 'Even an 8-byte read brings in its whole line.' },
      { t: '64: the whole cache line', correct: true, why: 'The line is the unit of transfer, so its other 56 bytes come along.' },
      { t: 'The whole array', why: 'Only the line containing the number is fetched by that read.' },
    ],
  },
  {
    q: 'A loop sums one field from records of 6 float64 fields packed together. What is its stride?',
    options: [
      { t: '6 bytes', why: 'Stride is measured in bytes, and each field is 8 bytes.' },
      { t: '8 bytes', why: 'That would be reading consecutive fields, or a typed array of just that field.' },
      { t: '64 bytes', why: 'The records are 48 bytes long, not 64.' },
      { t: '48 bytes', correct: true, why: '6 fields × 8 bytes: from one record’s field to the next record’s.' },
    ],
  },
  {
    q: 'Which is an example of **temporal** locality?',
    options: [
      { t: 'Reading xs[0], then xs[1], then xs[2]', why: 'That is spatial locality: nearby data.' },
      { t: 'Using a value twice within one loop iteration, while it is still cached', correct: true, why: 'Same data again, soon: that is temporal locality.' },
      { t: 'Storing x and y in separate arrays', why: 'That is a layout decision, not a reuse pattern.' },
      { t: 'Following a pointer to an object', why: 'That says nothing about reusing data soon.' },
    ],
  },
  {
    q: 'In the benchmark, summing `mass` was faster from a struct of arrays than from the packed Float64Array buffer. Why?',
    options: [
      { t: 'The packed buffer contains objects and pointers', why: 'It doesn’t: it is one Float64Array. That is why it beats the objects.' },
      { t: 'The struct of arrays uses fewer bytes per number', why: 'Both store each number in 8 bytes.' },
      { t: 'With stride 8, every byte of each line is a mass; with stride 48, most of each line is other fields', correct: true, why: 'Fewer lines fetched for the same masses means less waiting and less bandwidth.' },
      { t: 'The packed buffer is read backwards', why: 'Both are read in increasing order.' },
    ],
  },
  {
    q: 'What does **bandwidth** measure?',
    options: [
      { t: 'How many bytes per second can flow from memory to the CPU', correct: true, why: 'Latency is how long one access takes; bandwidth is how much can flow per second.' },
      { t: 'How long a single read takes', why: 'That is latency.' },
      { t: 'How many bytes a cache line holds', why: 'That is the line size, 64 bytes on most processors.' },
      { t: 'How many registers a CPU has', why: 'Registers have nothing to do with memory bandwidth.' },
    ],
  },
];
