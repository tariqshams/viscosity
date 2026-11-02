// Chapter 49 cards. Keys are stable ids: never rename them.

export const prompts = {
  'prefetch-what': {
    q: 'What does the hardware **prefetcher** do?',
    a: 'It watches which lines a program reads and fetches the ones it predicts come next, before they are asked for.',
  },
  'prefetch-patterns': {
    q: 'Which access patterns can a prefetcher follow?',
    a: 'Simple ones: forwards or backwards, through a few arrays at once, with a small or medium steady stride.',
  },
  'shuffle-why': {
    q: 'Two loops read the same million elements, one in order and one shuffled. Why is the shuffled one slower?',
    a: 'The prefetcher can’t predict a shuffled order, so every miss is paid in full instead of overlapping with work.',
  },
  'chase-what': {
    q: 'What is **pointer chasing**?',
    a: 'Following a chain of pointers, where each load needs the address that the previous load produced.',
  },
  'chase-why': {
    q: 'Why can’t the CPU start the next step of a pointer chase early?',
    a: 'The next address is stored inside the data it is still waiting for.',
  },
  'pipeline-what': {
    q: 'What is a CPU **pipeline**?',
    a: 'Splitting instructions into stages and working on several at once, each in a different stage, like an assembly line.',
  },
  'why-guess': {
    q: 'Why must a pipelined CPU guess which way an `if` will go?',
    a: 'The answer comes late, at execute; to keep the pipeline full it must fetch the next instructions before then.',
  },
  'mispredict-cost': {
    q: 'What happens when a branch prediction turns out wrong?',
    a: 'The work done on the wrong path is thrown away, and the pipeline refills from the right one.',
  },
  'sorted-why': {
    q: 'Why does `if (v < 50)` predict better over sorted data than over random data?',
    a: 'Sorted data gives a long run of trues then a long run of falses: one switch. Random data switches unpredictably.',
  },
  'rare-branch': {
    q: 'Why does a check that almost never fails, like an error check, cost almost nothing?',
    a: 'The predictor learns it goes the same way every time, so its guess is almost always right.',
  },
};

export const examples = {
  'order-matters': {
    title: 'Same reads, different order',
    code: `const n = 1 << 22; // 4M doubles: 32 MB
const x = new Float64Array(n);
const inOrder = new Int32Array(n);
for (let i = 0; i < n; i++) {
  inOrder[i] = i;
}

// shuffle a copy (Fisher-Yates)
const shuffled = inOrder.slice();
for (let i = n - 1; i > 0; i--) {
  const r = Math.random() * (i + 1);
  const j = Math.floor(r);
  const t = shuffled[i];
  shuffled[i] = shuffled[j];
  shuffled[j] = t;
}

function sum(order) {
  const t0 = performance.now();
  let s = 0;
  for (let i = 0; i < n; i++) {
    s += x[order[i]];
  }
  return performance.now() - t0;
}

sum(inOrder);
sum(shuffled); // warm up
const a = sum(inOrder).toFixed(1);
const b = sum(shuffled).toFixed(1);
console.log('in order, ms:', a);
console.log('shuffled, ms:', b);`,
  },
};

export const exercises = {
  mispredicts: {
    title: 'Count the wrong guesses',
    prompt:
      'A toy branch predictor guesses that each `if` will go the same way it went last time. Its very first guess is `false`. Write `mispredicts(outs)`, where `outs` is an array of booleans (what the `if` actually did each time), that returns how many guesses were wrong.',
    starter: `function mispredicts(outs) {
  // your code here
}

const xs = [12, 30, 71, 5, 88];
const outs = xs.map((v) => v < 50);
console.log(mispredicts(outs));`,
    solution: `function mispredicts(outs) {
  let guess = false;
  let wrong = 0;
  for (const o of outs) {
    if (o !== guess) {
      wrong++;
    }
    guess = o;
  }
  return wrong;
}`,
    tests: `test('no branches, no mistakes', () => {
  expect(mispredicts([])).toBe(0);
});
test('always false: never wrong', () => {
  expect(mispredicts([false, false])).toBe(0);
});
test('always true: wrong only at first', () => {
  expect(mispredicts([true, true, true])).toBe(1);
});
test('alternating: wrong every time', () => {
  const o = [true, false, true, false];
  expect(mispredicts(o)).toBe(4);
});
test('the unsorted values from the diagram', () => {
  const xs = [12, 30, 71, 5, 88, 64, 47, 93];
  const o = xs.map((v) => v < 50);
  expect(mispredicts(o)).toBe(6);
});
test('the same values, sorted', () => {
  const xs = [5, 12, 30, 47, 64, 71, 88, 93];
  const o = xs.map((v) => v < 50);
  expect(mispredicts(o)).toBe(2);
});`,
    hints: [
      'Keep a variable `guess`, starting at `false`, and a counter `wrong`.',
      'For each outcome `o`: if it differs from `guess`, count a mistake.',
      'Then update the guess for next time: `guess = o`. Do this whether the guess was right or not.',
    ],
    walkthrough: `The predictor’s whole memory is one boolean: what happened last time.

- **Compare.** Before each branch, the guess is whatever the last outcome was. If the real outcome differs, that is a misprediction.
- **Learn.** Afterwards, remember this outcome as the next guess. That one line is the predictor’s “learning”.
- **Start.** The first guess is \`false\`, so a run that starts with \`true\` costs one mistake straight away.

The last two tests are the diagram: the same eight values cost 6 mistakes unsorted and 2 sorted. Real predictors remember longer histories and spot patterns this one can’t, but no predictor can guess random data.`,
    wrong: [
      {
        code: `function mispredicts(outs) {
  let wrong = 0;
  for (const o of outs) {
    if (o !== false) {
      wrong++;
    }
  }
  return wrong;
}`,
        why: 'This always guesses `false`: it never learns. It counts the trues, so a long run of trues costs a mistake every time instead of just once. Update the guess after each branch.',
      },
      {
        code: `function mispredicts(outs) {
  let guess = true;
  let wrong = 0;
  for (const o of outs) {
    if (o !== guess) {
      wrong++;
    }
    guess = o;
  }
  return wrong;
}`,
        why: 'The learning is right, but the very first guess must be `false`. Starting from `true` makes an all-false run cost one mistake.',
      },
    ],
  },
  findStride: {
    optional: true,
    title: 'Be the prefetcher',
    prompt:
      'Write `findStride(xs)`, where `xs` is a list of addresses in the order they were read. If every gap between consecutive addresses is the same, return that gap (it may be negative: the reads go backwards). Otherwise, or if there are fewer than two addresses, return `null`: no pattern to follow.',
    starter: `function findStride(xs) {
  // your code here
}

console.log(findStride([0, 8, 16, 24]));`,
    solution: `function findStride(xs) {
  if (xs.length < 2) {
    return null;
  }
  const d = xs[1] - xs[0];
  for (let i = 2; i < xs.length; i++) {
    if (xs[i] - xs[i - 1] !== d) {
      return null;
    }
  }
  return d;
}`,
    tests: `test('a typed array, in order', () => {
  expect(findStride([0, 8, 16, 24])).toBe(8);
});
test('one field of packed records', () => {
  expect(findStride([32, 80, 128])).toBe(48);
});
test('backwards', () => {
  expect(findStride([100, 52, 4])).toBe(-48);
});
test('pointer chasing: no pattern', () => {
  expect(findStride([0, 64, 8, 512])).toBe(null);
});
test('a pattern that breaks at the end', () => {
  expect(findStride([0, 8, 16, 99])).toBe(null);
});
test('too few reads to tell', () => {
  expect(findStride([5])).toBe(null);
  expect(findStride([])).toBe(null);
});`,
    hints: [
      'With fewer than two addresses there is no gap at all: return `null`.',
      'Take the first gap, `xs[1] - xs[0]`, as the candidate stride.',
      'Check every later gap `xs[i] - xs[i - 1]` against it. Any mismatch means `null`. If they all match, return the stride.',
    ],
    walkthrough: `A real prefetcher does a hardware version of this, continuously, for the reads it watches.

- **Not enough data.** One address has no gaps, so no pattern.
- **Candidate.** The first gap is the guess. Keep its sign: a negative stride means the loop walks backwards, which prefetchers handle too.
- **Confirm.** Every later gap must match. One odd gap and the pattern is broken.

Run it on addresses from a pointer chase and you get \`null\`: that is this chapter’s point in one line. Real prefetchers are more forgiving than this (they keep watching and lock onto a pattern once it settles), but random addresses beat them too.`,
    wrong: [
      {
        code: `function findStride(xs) {
  if (xs.length < 2) {
    return null;
  }
  return xs[1] - xs[0];
}`,
        why: 'This trusts the first gap without checking the rest, so it “finds” a stride of 64 in a random pointer chase.',
      },
      {
        code: `function findStride(xs) {
  if (xs.length < 2) {
    return null;
  }
  const d = Math.abs(xs[1] - xs[0]);
  for (let i = 2; i < xs.length; i++) {
    const g = xs[i] - xs[i - 1];
    if (Math.abs(g) !== d) {
      return null;
    }
  }
  return d;
}`,
        why: 'Taking the absolute value loses the direction: a backwards walk reports +48 instead of −48, and a zig-zag like 0, 8, 0 would count as a stride. Keep the sign.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Which loop is the prefetcher most likely to help?',
    options: [
      { t: 'Walking a linked list of nodes scattered around memory', why: 'Each address is only known after the previous load: pointer chasing.' },
      { t: 'Reading a Float64Array from the last element to the first', correct: true, why: 'Backwards with a steady stride is a simple pattern prefetchers follow.' },
      { t: 'Reading elements at random indices', why: 'There is no pattern to predict.' },
      { t: 'None: prefetchers only work on strings', why: 'Prefetchers see addresses, not types; they work on any data.' },
    ],
  },
  {
    q: 'Why is following `ps[j].x` for a random `j` worse than reading `x[j]` from a Float64Array?',
    options: [
      { t: 'Objects store x as text', why: 'Numbers in objects are still numbers; the issue is where they are and how you reach them.' },
      { t: 'Float64Arrays are always fully cached', why: 'A big Float64Array doesn’t fit in cache either; random reads still miss.' },
      { t: 'The object’s address must first be loaded from memory, so each read waits on another read', correct: true, why: 'That is pointer chasing. With a typed array, the address comes straight from `j`.' },
      { t: 'There is no difference', why: 'The benchmark shows a large one at a million elements.' },
    ],
  },
  {
    q: 'What is the main benefit of a pipeline?',
    options: [
      { t: 'Each instruction finishes in fewer stages', why: 'Each instruction still goes through every stage.' },
      { t: 'It makes caches bigger', why: 'Pipelining is about instructions, not cache size.' },
      { t: 'It removes the need for branches', why: 'Branches still exist; in fact they are what makes pipelines guess.' },
      { t: 'Several instructions are in progress at once, so one can finish nearly every tick', correct: true, why: 'Like an assembly line: the stages are kept busy.' },
    ],
  },
  {
    q: 'The toy predictor (“same as last time”, first guess false) sees: true, true, false, false. How many wrong guesses?',
    options: [
      { t: '2', correct: true, why: 'Wrong at the first true (guessed false) and at the first false (guessed true). The repeats are guessed right.' },
      { t: '0', why: 'The first guess is false, so the first true is already a mistake.' },
      { t: '4', why: 'Repeated outcomes are guessed right by “same as last time”.' },
      { t: '1', why: 'There are two switches the predictor can’t see coming: the start and the change.' },
    ],
  },
  {
    q: 'What happens to instructions fetched after a branch that was mispredicted?',
    options: [
      { t: 'They are kept and run anyway', why: 'They belong to the wrong path; running them would give wrong results.' },
      { t: 'They are thrown away and the right path is fetched instead', correct: true, why: 'That wasted work is the cost of a misprediction.' },
      { t: 'They are moved into the L1 cache', why: 'Caches hold memory contents; this is about instructions in flight.' },
      { t: 'The program crashes', why: 'Mispredictions are normal and invisible to the program, apart from the time they cost.' },
    ],
  },
  {
    q: 'Which change is most likely to make `if (v < 50)` cheaper inside a loop over many random numbers?',
    options: [
      { t: 'Renaming `v` to something shorter', why: 'Names don’t exist at the machine level.' },
      { t: 'Changing 50 to 51', why: 'The outcomes would still be random.' },
      { t: 'Sorting the numbers first, if order doesn’t matter', correct: true, why: 'Sorted data makes the branch predictable: one switch from true to false.' },
      { t: 'Adding a second, unrelated if', why: 'That adds a branch; it doesn’t make the first one predictable.' },
    ],
  },
];
