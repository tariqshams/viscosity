// Chapter 52 cards. Keys are stable ids: never rename them.

export const prompts = {
  'line-what': {
    q: 'What is a **cache line**, and how big is it on most mainstream processors?',
    a: 'The block that caches move as one unit: 64 bytes.',
  },
  'line-of': {
    q: 'With 64-byte lines, which line holds address 200?',
    a: 'Line 3, because Math.floor(200 / 64) = 3 (it covers addresses 192 to 255).',
  },
  'line-offset': {
    q: 'How can the hardware find an address’s line and offset without dividing?',
    a: 'Because 64 is 2⁶: `a >> 6` is the line and `a & 63` (the low 6 bits) is the offset.',
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
  'stride-what': {
    q: 'What is the **stride** of reading one field from packed records of 6 fields, 8 bytes each?',
    a: '48 bytes: the distance from one record’s field to the next record’s.',
  },
  'stride-64': {
    q: 'Once a loop’s stride is 64 bytes or more, how many cache lines does each read cost?',
    a: 'A whole line each: no two reads share a line.',
  },
  'column-walk': {
    q: 'A big grid of float64s is stored row by row. Why is summing it column by column slower than row by row?',
    a: 'Down a column the stride is a whole row, so each read needs its own line; along a row, eight reads share each line.',
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
      'Two steps: turn each address into its line number, then count how many *different* line numbers there are.',
      'The line of `a` is `Math.floor(a / 64)`. For “how many different”, a `Set` (from *Map and Set*) ignores duplicates for you.',
      'Add every line number to a Set, then return its `size`.',
    ],
    walkthrough: `**How to think about it.** Do the starter by hand. Addresses 0, 8 and 63 are all between 0 and 63, so they are all in line 0; address 64 is the first byte of line 1. That is two lines, even though there are four addresses, because reading three values in one line costs one fetch, not three. So the question is really "how many different line numbers do these addresses give?", and "how many different" is exactly what a \`Set\` is for: it keeps each value once, whatever order they arrive in and however often they repeat.

**The solution, line by line.**

- \`function countLines(addrs) {\` takes the byte addresses a loop reads.
- \`  const lines = new Set();\` will hold each line number once.
- \`  for (const a of addrs) {\` visits every address.
- \`    lines.add(Math.floor(a / 64));\` turns the address into its line number and adds it; adding a number that is already there changes nothing.
- \`  }\` closes the loop.
- \`  return lines.size;\` is the number of different lines.
- \`}\` closes the function.

The last test is the packed layout from the stride diagram: eight reads of \`mass\`, 48 bytes apart starting at 32, land in six lines. You have just built the measuring tool a layout cost model uses.

**Common wrong attempts.**

- Adding up the line *numbers* (\`n += Math.floor(a / 64)\`) gives a sum, not a count: address 300 alone would count as 4.
- \`new Set(addrs).size\` counts different *addresses*. Addresses 0 and 8 are different, but they share one line, so convert each address to its line first.
- \`Math.ceil(a / 64)\` puts address 0 in line 0 but 1 to 64 all in line 1, shifting every boundary by one byte.`,
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
      {
        code: `function countLines(addrs) {
  const lines = new Set();
  for (const a of addrs) {
    lines.add(Math.ceil(a / 64));
  }
  return lines.size;
}`,
        why: 'Rounding up moves every boundary: 0 lands in line 0 but 8 and 63 in line 1. Lines start at multiples of 64, so round down.',
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
      'First work out the address the loop reads for record `i`.',
      'Record `i` starts at element `i * k`, which is byte `i * k * 8`, and field 0 is right there.',
      'Turn each of those addresses into a line number and count the distinct ones, as in the last exercise.',
    ],
    walkthrough: `**How to think about it.** This is the last exercise again, except that you work out the addresses yourself. Each record takes \`k\` elements of 8 bytes, so record \`i\` starts \`i * k * 8\` bytes in, and that is where its field 0 is; the stride is \`k * 8\`. With \`k = 6\` the reads are at 0, 48, 96, 144, …, and counting their lines by hand for eight records gives lines 0, 0, 1, 2, 3, 3, 4, 5: six different lines.

**The solution, line by line.**

- \`function fieldLines(n, k) {\` takes the number of records and fields per record.
- \`  const lines = new Set();\` collects distinct line numbers.
- \`  for (let i = 0; i < n; i++) {\` visits each record.
- \`    const addr = i * k * 8;\` is the byte address of record \`i\`'s field 0.
- \`    lines.add(Math.floor(addr / 64));\` records its line.
- \`  }\` closes the loop.
- \`  return lines.size;\` counts them.
- \`}\` closes the function.

Notice the pattern in the tests. With \`k = 1\` (a plain typed array), eight reads share each line. With \`k = 6\`, eight reads touch six lines. From \`k = 8\` up, every record costs its own line, and a bigger record does not make this loop any worse, because it is already paying a full line per read.

**Common wrong attempts.**

- \`Math.ceil(n * k * 8 / 64)\` counts every line of the whole buffer. Once the stride passes 64 bytes the loop skips lines entirely: 5 records of 16 fields span 10 lines, but the loop touches only 5.
- Returning \`n\` assumes one line per read, which is only true once the stride is 64 bytes or more.`,
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
      { t: 'The whole array', why: 'Only the line containing the number is fetched by that read.' },
      { t: '64: the whole cache line', correct: true, why: 'The line is the unit of transfer, so its other 56 bytes come along.' },
    ],
  },
  {
    q: 'A loop sums one field from records of 6 float64 fields packed together. What is its stride?',
    options: [
      { t: '6 bytes', why: 'Stride is measured in bytes, and each field is 8 bytes.' },
      { t: '8 bytes', why: 'That would be reading consecutive fields, or a typed array of just that field.' },
      { t: '48 bytes', correct: true, why: '6 fields × 8 bytes: from one record’s field to the next record’s.' },
      { t: '64 bytes', why: 'The records are 48 bytes long, not 64.' },
    ],
  },
  {
    q: 'Which loop has the best **spatial** locality?',
    options: [
      { t: 'Reading xs[0], xs[1], xs[2], … of a Float64Array in order', correct: true, why: 'Each read is right next to the last, so every byte of every fetched line is used.' },
      { t: 'Reading every 16th element of a Float64Array', why: 'The stride is 128 bytes, so each read needs its own line and uses 8 bytes of it.' },
      { t: 'Reading the same element a thousand times', why: 'That is reuse of the same data, the other kind of locality; it uses only 8 bytes of one line.' },
      { t: 'Reading elements at random indices', why: 'Random reads land in random lines, so nearby bytes are rarely used.' },
    ],
  },
  {
    q: 'A grid with 1,000 columns of float64s is stored row by row. Summing one column, what is the stride?',
    options: [
      { t: '8 bytes', why: 'That is the stride along a row, where neighbours are next to each other.' },
      { t: '1,000 bytes', why: 'Each step skips 1,000 *elements*, and each element is 8 bytes.' },
      { t: '64 bytes', why: 'The stride is fixed by the layout, not by the line size.' },
      { t: '8,000 bytes', correct: true, why: 'Going down one row skips a whole row of 1,000 elements × 8 bytes, so every read needs its own line.' },
    ],
  },
];
