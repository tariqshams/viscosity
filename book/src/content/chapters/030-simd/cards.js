// Chapter 30 cards. Keys are stable ids: never rename them.

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
  'lanes-mix': {
    q: 'In a SIMD add of registers A and B, which lanes are added together?',
    a: 'Matching lanes only: lane 0 with lane 0, lane 1 with lane 1, and so on. Lanes never mix.',
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
  'soa-simd': {
    q: 'Why is struct of arrays the layout SIMD wants?',
    a: 'Each column is contiguous, so one vector load fills every lane with the next few values.',
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
      'Start with `W` zeros in `lanes`, one per lane.',
      'Element `i` belongs to lane `i % W`: `lanes[i % W] += xs[i]`. One plain loop over every element handles the tail for free.',
      'After the loop, add the `W` lane sums together for `total`.',
    ],
    walkthrough: `This is the skeleton of every vectorized sum, written one lane at a time.

- **One accumulator per lane.** A SIMD register holds \`W\` partial sums side by side. Our \`lanes\` array plays that register.
- **Element i goes to lane i % W.** Elements 0, 4, 8 land in lane 0; 1, 5, 9 in lane 1; and so on. On real hardware, one instruction adds a whole chunk of \`W\` elements into all lanes at once.
- **Combine at the end.** The lanes are added together once, after the loop. Compilers call this the *horizontal* step.

Notice that the additions now happen in a different *grouping* from a plain left-to-right sum. For whole numbers that doesn't matter. For floats it can change the last digit, which is exactly why compilers won't do this to a floating-point sum unless you allow it.`,
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
      'There are `packed.length / nf` records.',
      'Record `i` starts at index `i * nf`, so its field `f` is at `i * nf + f`.',
    ],
    walkthrough: `Each record occupies \`nf\` slots, so the stride between one record's field \`f\` and the next one's is \`nf\`.

- Count the records: \`packed.length / nf\`.
- Make the output: \`new Float64Array(n)\`, a contiguous column of doubles.
- Copy \`packed[i * nf + f]\` into \`out[i]\`.

The result is one SoA column. Gathering it costs one separate read per element; once it is gathered, a SIMD loop could load it straight into lanes.`,
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
    q: 'A SIMD add instruction works on two registers with four lanes each. What does it produce?',
    options: [
      { t: 'One number: the sum of all eight values', why: 'That would mix lanes. A SIMD add keeps lanes separate.' },
      { t: 'Four sums: lane 0 + lane 0, lane 1 + lane 1, and so on', correct: true, why: 'Same operation, applied lane by lane, in one instruction.' },
      { t: 'Four sums, computed one after another by four instructions', why: 'The point of SIMD is that one instruction does all four.' },
      { t: 'It depends on whether the numbers are integers', why: 'There are integer and float SIMD instructions, but both work lane by lane.' },
    ],
  },
  {
    q: 'JavaScript numbers are 64-bit doubles. How many fit in a 128-bit SIMD register?',
    options: [
      { t: '4', why: 'Four lanes fit if each value is 32 bits, like `f32x4`.' },
      { t: '1', why: 'One double uses only 64 of the 128 bits.' },
      { t: '8', why: 'That would need 16-bit values.' },
      { t: '2', correct: true, why: '128 ÷ 64 = 2. WebAssembly calls this shape `f64x2`.' },
    ],
  },
  {
    q: 'Why might a compiler refuse to vectorize `let s = 0; for (...) s += xs[i];` when `xs` holds floats?',
    options: [
      { t: 'Vectorizing regroups the additions, and float addition isn’t associative', correct: true, why: 'Different grouping can round differently, so the answer could change. LLVM only does it when you allow reordering.' },
      { t: 'SIMD can’t add floating-point numbers', why: 'There are float SIMD instructions, such as `f64x2.add`.' },
      { t: 'The loop is too short', why: 'Length isn’t the issue here; the order of additions is.' },
      { t: 'Sums always need a branch', why: 'This loop has no branch in its body.' },
    ],
  },
  {
    q: 'Particles are stored as an array of structs with 6 fields each. A SIMD loop wants four `x` values in one register. What must happen?',
    options: [
      { t: 'One vector load of the next four slots', why: 'The next four slots are x, y, vx, vy of one particle, not four x values.' },
      { t: 'Nothing: the CPU reorders memory automatically', why: 'Hardware doesn’t rearrange your data layout.' },
      { t: 'A gather: four separate reads, 6 slots apart', correct: true, why: 'The x values have a stride of 6. In SoA they would be side by side and one load would do.' },
      { t: 'The loop must use integers instead', why: 'The problem is where the values are, not their type.' },
    ],
  },
  {
    q: 'Which statement about SIMD and JavaScript is accurate?',
    options: [
      { t: 'Browsers ship the SIMD.js API for JavaScript', why: 'SIMD.js was removed from Stage 3 and browsers aren’t implementing it.' },
      { t: 'V8 is documented to vectorize every JavaScript loop', why: 'None of the sources checked for this book say that, so don’t assume it.' },
      { t: 'SIMD is impossible on the web', why: 'WebAssembly has 128-bit SIMD.' },
      { t: 'WebAssembly has fixed-width 128-bit SIMD; JavaScript has no SIMD API', correct: true, why: 'The `v128` type and instructions like `f64x2.add` are part of WebAssembly 2.0.' },
    ],
  },
  {
    q: 'Viscosity stores SoA columns as `Float64Array`s. Why does that matter for SIMD?',
    options: [
      { t: 'Float64Array values are 32-bit, so twice as many fit in a lane', why: 'Float64Array holds 64-bit doubles.' },
      { t: 'Each column is a contiguous run of doubles, ready for vector loads', correct: true, why: 'That is exactly the input a SIMD back end (WebAssembly or native) needs.' },
      { t: 'Typed arrays make JavaScript run SIMD instructions automatically', why: 'Nothing guarantees that; the layout only makes SIMD possible for a back end that uses it.' },
      { t: 'It doesn’t matter: SIMD ignores layout', why: 'Layout is the whole story: SIMD wants neighbours.' },
    ],
  },
];
