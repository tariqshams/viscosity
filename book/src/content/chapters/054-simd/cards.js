// Chapter 54 cards. Keys are stable ids: never rename them.

export const prompts = {
  'simd-what': {
    q: 'What does **SIMD** stand for, and what does it mean?',
    a: 'Single instruction, multiple data: one instruction applies the same operation to several values at once.',
  },
  'lane-what': {
    q: 'What is a **lane**?',
    a: 'One slot of a SIMD (vector) register, holding one of the values the instruction works on.',
  },
  'lanes-128': {
    q: 'How many 64-bit doubles fit in the lanes of a 128-bit register?',
    a: 'Two (128 ÷ 64). Four 32-bit floats would fit.',
  },
  'vectorize-what': {
    q: 'What does a compiler do when it **vectorizes** a loop?',
    a: 'Rewrites it so each step handles several iterations at once with SIMD instructions, one element per lane.',
  },
  'float-order': {
    q: 'Why can’t a compiler freely vectorize a floating-point sum?',
    a: 'Lane-wise summing regroups the additions, and floating-point addition isn’t associative, so the result could change.',
  },
  overlap: {
    q: 'What happens if the arrays a vectorized loop reads and writes might overlap in memory?',
    a: 'The compiler must check for overlap (LLVM does it at run time) and use the plain loop when they overlap.',
  },
  gather: {
    q: 'Why does filling a SIMD register with `x` values from an array of structs need a *gather*?',
    a: 'The x values aren’t side by side: other fields sit between them (a stride), so each must be read separately.',
  },
  'js-simd': {
    q: 'Where can web code use explicit SIMD instructions today?',
    a: 'In WebAssembly (fixed-width 128-bit SIMD). JavaScript has no SIMD API: SIMD.js was withdrawn.',
  },
};

export const examples = {
  'by-four': {
    title: 'A loop shaped like SIMD',
    code: `const a = [1, 2, 3, 4, 5, 6];
const b = [10, 20, 30, 40, 50, 60];
const c = [];
const W = 4; // lanes per step
let i = 0;
// full steps of W lanes
for (; i + W <= a.length; i += W) {
  for (let l = 0; l < W; l++) {
    c[i + l] = a[i + l] + b[i + l];
  }
}
// the tail that doesn't fill W lanes
for (; i < a.length; i++) {
  c[i] = a[i] + b[i];
}
console.log(c);`,
  },
};

export const exercises = {
  sumLanes: {
    title: 'Sum the way SIMD does',
    prompt:
      'Write `sumLanes(xs, W)` that sums `xs` using `W` lane accumulators, like a vectorized sum. Element `i` goes into lane `i % W`. Return `{ lanes, total }`: `lanes` is the array of `W` lane sums, and `total` is the lanes added together.',
    starter: `function sumLanes(xs, W) {
  const lanes = [];
  // your code here
}

const r = sumLanes([1, 2, 3, 4, 5], 2);
console.log(r);`,
    solution: `function sumLanes(xs, W) {
  const lanes = [];
  for (let l = 0; l < W; l++) {
    lanes.push(0);
  }
  for (let i = 0; i < xs.length; i++) {
    lanes[i % W] += xs[i];
  }
  let total = 0;
  for (let l = 0; l < W; l++) {
    total += lanes[l];
  }
  return { lanes, total };
}`,
    tests: `test('ten numbers in four lanes', () => {
  const r = sumLanes([1,2,3,4,5,6,7,8,9,10], 4);
  expect(r.lanes).toEqual([15, 18, 10, 12]);
  expect(r.total).toBe(55);
});
test('one lane is the plain sum', () => {
  expect(sumLanes([3, 4, 5], 1).total).toBe(12);
});
test('the tail is not forgotten', () => {
  const r = sumLanes([1, 1, 1, 1, 1], 4);
  expect(r.lanes).toEqual([2, 1, 1, 1]);
  expect(r.total).toBe(5);
});
test('empty input gives zero lanes', () => {
  expect(sumLanes([], 2)).toEqual({ lanes: [0, 0], total: 0 });
});`,
    hints: [
      'Picture the register as an array of `W` running totals. What should each total start at?',
      'Element `i` belongs to lane `i % W` (the remainder after dividing by `W`), so one plain loop over every element can do `lanes[i % W] += xs[i]`; that also handles the tail for free.',
      'After the loop, add the `W` lane totals together into `total`, and `return { lanes, total };`.',
    ],
    walkthrough: `**How to think about it.** A vectorized sum keeps one running total per lane, like the four-lane register you stepped through in the chapter: lane 0 collects elements 0, 4, 8, ..., lane 1 collects 1, 5, 9, ..., and so on. So the question for each element is only "which lane is this?", and the remainder \`i % W\` answers it: 0, 1, 2, 3, 0, 1, 2, 3, ... as \`i\` counts up. Once every element is in its lane, the lanes are added together (compilers call this the *horizontal* step). Try it by hand first with \`[1, 2, 3, 4, 5]\` and \`W = 2\`: lane 0 gets 1 + 3 + 5 = 9, lane 1 gets 2 + 4 = 6, and the total is 15.

**The solution, line by line.**

- \`const lanes = [];\` is the pretend register.
- \`for (let l = 0; l < W; l++) {\` and \`lanes.push(0);\` put \`W\` zeros in it, one starting total per lane. (Without them, \`lanes[0] += ...\` would add to \`undefined\` and give \`NaN\`.)
- \`for (let i = 0; i < xs.length; i++) {\` visits every element once, tail included.
- \`lanes[i % W] += xs[i];\` adds element \`i\` into its lane. On real hardware, one instruction does this for a whole chunk of \`W\` elements at once; here we do it one at a time, but into the same lanes.
- \`let total = 0;\` starts the horizontal step.
- \`for (let l = 0; l < W; l++) {\` and \`total += lanes[l];\` add the lanes together.
- \`return { lanes, total };\` hands back both, so the tests can check the lanes as well as the answer.

For ten numbers 1 to 10 with \`W = 4\`, the lanes are \`[1+5+9, 2+6+10, 3+7, 4+8]\`, which is \`[15, 18, 10, 12]\`, and the total is 55.

Notice the additions now happen in a different *grouping* from a plain left-to-right sum. For whole numbers that does not matter; for floats it can change the last digit, which is exactly why a compiler will not do this to a floating-point sum unless you allow it.

**Common wrong attempts.**

- Looping only over full chunks (\`i + W <= xs.length\`) forgets the tail: with five elements and \`W = 4\`, element 4 is silently dropped. Real vectorized loops always add a tail loop for this reason.
- Summing everything into one total gets the right \`total\` but not the lanes; the exercise is about spreading the work across \`W\` lanes.
- Forgetting the starting zeros gives \`NaN\` in every lane.`,
    wrong: [
      {
        code: `function sumLanes(xs, W) {
  const lanes = [];
  for (let l = 0; l < W; l++) {
    lanes.push(0);
  }
  for (let i = 0; i + W <= xs.length;
       i += W) {
    for (let l = 0; l < W; l++) {
      lanes[l] += xs[i + l];
    }
  }
  let total = 0;
  for (const s of lanes) total += s;
  return { lanes, total };
}`,
        why: 'This only processes full chunks of `W`. When the length isn’t a multiple of `W`, the last few elements (the tail) are silently dropped.',
      },
      {
        code: `function sumLanes(xs, W) {
  let total = 0;
  for (const x of xs) total += x;
  return { lanes: [total], total };
}`,
        why: 'The total is right, but everything went into one lane. The point is to spread elements across `W` lanes by `i % W`.',
      },
    ],
  },
  column: {
    optional: true,
    title: 'Gather a column',
    prompt:
      'Records are packed into one array, `nf` numbers per record (packed AoS). Write `column(packed, nf, f)` that returns a **new `Float64Array`** holding field `f` of every record, in order. This is the gather that AoS forces on SIMD code.',
    starter: `function column(packed, nf, f) {
  // your code here
}

const p = [1, 2, 3, 4, 5, 6];
console.log(column(p, 3, 1));`,
    solution: `function column(packed, nf, f) {
  const n = packed.length / nf;
  const out = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    out[i] = packed[i * nf + f];
  }
  return out;
}`,
    tests: `test('field 1 of two 3-field records', () => {
  const c = column([1, 2, 3, 4, 5, 6], 3, 1);
  expect(Array.from(c)).toEqual([2, 5]);
});
test('returns a Float64Array', () => {
  const c = column([1, 2], 2, 0);
  expect(c instanceof Float64Array).toBe(true);
});
test('field 0 with stride 2', () => {
  const c = column([7, 0, 8, 0, 9, 0], 2, 0);
  expect(Array.from(c)).toEqual([7, 8, 9]);
});`,
    hints: [
      'How many records are there? Each one takes `nf` slots.',
      'Record `i` starts at slot `i * nf`, so its field number `f` is at `i * nf + f`.',
      'Make `const out = new Float64Array(n);`, then in a loop set `out[i] = packed[i * nf + f];` and return `out`.',
    ],
    walkthrough: `**How to think about it.** In packed AoS the records sit one after another, \`nf\` numbers each, so field \`f\` of consecutive records is \`nf\` slots apart: that distance is the stride. To build a column we jump through the array by that stride, picking one number per record. Do one by hand: in \`[1, 2, 3, 4, 5, 6]\` with \`nf = 3\`, record 0 is \`1, 2, 3\` and record 1 is \`4, 5, 6\`; field 1 of each is \`2\` and \`5\`.

**The solution, line by line.**

- \`const n = packed.length / nf;\` counts the records: six slots of three numbers is two records.
- \`const out = new Float64Array(n);\` makes the column: \`n\` doubles side by side, all zero to begin with.
- \`for (let i = 0; i < n; i++) {\` visits each record.
- \`out[i] = packed[i * nf + f];\` finds record \`i\`'s start (\`i * nf\`), steps \`f\` slots into it, and copies that number into the column.
- \`return out;\` hands back the new column.

Gathering costs one separate read per element, which is exactly what SIMD hardware has to do with an array of structs; once the column exists, though, a vector load can fill a register from it in one go.

**Common wrong attempts.**

- \`packed[i + f]\` forgets the stride and reads neighbouring slots, which mixes fields from the same record.
- Returning an ordinary array (\`[]\` with \`push\`) gives the right numbers but not a contiguous column of raw doubles, and the test checks for a \`Float64Array\`.`,
    wrong: [
      {
        code: `function column(packed, nf, f) {
  const out = new Float64Array(
    packed.length / nf);
  for (let i = 0; i < out.length; i++) {
    out[i] = packed[i + f];
  }
  return out;
}`,
        why: 'This forgets the stride: `packed[i + f]` reads neighbouring slots, mixing different fields. Record `i` starts at `i * nf`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'A SIMD add instruction works on two registers of four lanes each. What does it produce?',
    options: [
      { t: 'One number: the sum of all eight values', why: 'That would mix lanes, and a SIMD add keeps lanes separate.' },
      { t: 'Four sums: lane 0 + lane 0, lane 1 + lane 1, and so on', correct: true, why: 'The same operation, applied lane by lane, in one instruction.' },
      { t: 'Four sums, worked out one after another by four instructions', why: 'The point of SIMD is that one instruction does all four.' },
    ],
  },
  {
    q: 'JavaScript numbers are 64-bit doubles. How many fit in the lanes of a 128-bit register?',
    options: [
      { t: '4', why: 'Four lanes fit when each value is 32 bits, as in `f32x4`.' },
      { t: '1', why: 'One double uses only 64 of the 128 bits.' },
      { t: '2', correct: true, why: '128 ÷ 64 = 2. WebAssembly calls this shape `f64x2`.' },
      { t: '8', why: 'Eight lanes would need 16-bit values in 128 bits, or a 512-bit register for doubles.' },
    ],
  },
  {
    q: 'Why might a compiler refuse to vectorize `s += xs[i]` over an array of floats, unless told it may?',
    options: [
      { t: 'Lane-wise summing regroups the additions, and a different grouping can round differently', correct: true, why: '`(0.1 + 0.2) + 0.3` and `0.1 + (0.2 + 0.3)` differ, so the answer could change. LLVM only reorders when you allow it.' },
      { t: 'SIMD cannot add floating-point numbers', why: 'There are float SIMD instructions, such as `f64x2.add`.' },
      { t: 'The loop has a tail', why: 'Tails are normal; a separate loop handles them.' },
      { t: 'Sums always need an if', why: 'This loop has no branch in its body.' },
    ],
  },
  {
    q: 'Particles are an array of structs, 6 numbers each. A SIMD loop wants four `x` values in one register. What has to happen?',
    options: [
      { t: 'One vector load of the next four slots', why: 'The next four slots are x, y, vx and vy of one particle, not four x values.' },
      { t: 'A gather: four separate reads, 6 slots apart', correct: true, why: 'The x values have a stride of 6. In a struct of arrays they would be side by side, and one load would do.' },
      { t: 'Nothing: the CPU rearranges memory by itself', why: 'Hardware does not change your data layout.' },
    ],
  },
  {
    q: 'Which statement about SIMD and JavaScript is accurate?',
    options: [
      { t: 'Browsers ship the SIMD.js API', why: 'SIMD.js was removed from Stage 3, and browsers are not implementing it.' },
      { t: 'V8 is documented to vectorize every loop', why: 'None of the sources checked for this book says that, so do not assume it.' },
      { t: 'SIMD is impossible on the web', why: 'WebAssembly has 128-bit SIMD.' },
      { t: 'WebAssembly has fixed-width 128-bit SIMD; JavaScript has no SIMD API', correct: true, why: 'The `v128` type and instructions like `f64x2.add` are part of WebAssembly 2.0.' },
    ],
  },
];
