// Cards for "Pipelines and branch prediction" (split from chapter 52).
// Keys are stable ids: never rename them.

export const prompts = {
  'pipeline-what': {
    q: 'What is a CPU **pipeline**?',
    a: 'Splitting instructions into stages and working on several at once, each in a different stage, like an assembly line.',
  },
  'stage-ticks': {
    q: 'With a 4-stage pipeline and nothing waiting, how many ticks do 100 instructions take, and how many without a pipeline?',
    a: '103 with it (4 + 99); 400 without (100 × 4).',
  },
  'dependent-wait': {
    q: 'Why does `d = a + 1` straight after `a = b + c` leave a gap in the pipeline?',
    a: 'It needs the value of `a`, so it cannot execute until the instruction before it has finished.',
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
  'loop-branch': {
    q: 'How often is a loop’s own test `i < n` mispredicted, over a long loop?',
    a: 'About once: at the very end, when it finally comes out false.',
  },
};

export const examples = {
  'sorted-branch': {
    title: 'Random vs sorted, in JavaScript',
    code: `const n = 1 << 20;
const xs = new Float64Array(n);
for (let i = 0; i < n; i++) {
  const r = Math.random() * 100;
  xs[i] = Math.floor(r);
}
const ys = xs.slice().sort();

function sumBelow(a) {
  let s = 0;
  for (let i = 0; i < n; i++) {
    if (a[i] < 50) s += a[i];
  }
  return s;
}

function time(a) {
  const t0 = performance.now();
  sumBelow(a);
  return performance.now() - t0;
}

for (let k = 0; k < 3; k++) {
  time(xs);
  time(ys); // warm up
}
const a = time(xs).toFixed(2);
const b = time(ys).toFixed(2);
console.log('random, ms:', a);
console.log('sorted, ms:', b);
// same answer either way:
const s1 = sumBelow(xs);
const s2 = sumBelow(ys);
console.log('same sum:', s1 === s2);`,
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
      'The predictor’s whole memory is one boolean: what happened last time. Keep it in a variable `guess`, starting at `false`, with a counter `wrong`.',
      'For each outcome `o`: if it differs from `guess`, count a mistake.',
      'Then update the guess for next time: `guess = o`. Do this whether the guess was right or not.',
    ],
    walkthrough: `**How to think about it.** Run the starter by hand. The values 12, 30, 71, 5, 88 give the outcomes true, true, false, true, false for \`v < 50\`. The first guess is false and the outcome is true: wrong (1). Now the guess is true, and the outcome is true: right. Guess true, outcome false: wrong (2). Guess false, outcome true: wrong (3). Guess true, outcome false: wrong (4). So four mistakes. What you did at each step was compare, then *learn*: whatever just happened becomes the next guess, whether or not the guess was right.

**The solution, line by line.**

- \`function mispredicts(outs) {\` takes the outcomes in order.
- \`  let guess = false;\` is the predictor's memory, starting at false.
- \`  let wrong = 0;\` counts mistakes.
- \`  for (const o of outs) {\` handles each time the branch runs.
- \`    if (o !== guess) {\` compares the real outcome with the guess.
- \`      wrong++;\` counts a misprediction.
- \`    }\` closes the \`if\`.
- \`    guess = o;\` is the predictor's "learning": remember this outcome as the next guess.
- \`  }\` closes the loop.
- \`  return wrong;\` hands back the count.
- \`}\` closes the function.

The last two tests are the diagram: the same eight values cost 6 mistakes unsorted and 2 sorted (one at the very start, one at the switch). Real predictors remember longer histories and spot patterns this one can't, but no predictor can guess random data.

**Common wrong attempts.**

- Never updating the guess (always comparing with \`false\`) counts every true, so a long run of trues costs a mistake every time instead of once.
- Starting with \`guess = true\` makes an all-false run cost a mistake it should not.
- Updating the guess *before* comparing (\`guess = o\` first) compares each outcome with itself, so it never finds a mistake.`,
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
      {
        code: `function mispredicts(outs) {
  let guess = false;
  let wrong = 0;
  for (const o of outs) {
    guess = o;
    if (o !== guess) {
      wrong++;
    }
  }
  return wrong;
}`,
        why: 'The guess is replaced by the outcome before the comparison, so every outcome is compared with itself and no mistake is ever counted.',
      },
    ],
  },
  twoBit: {
    optional: true,
    title: 'A predictor that is harder to fool',
    prompt:
      'A better toy predictor keeps a counter from 0 to 3, starting at 0. It guesses `true` when the counter is 2 or 3, and `false` when it is 0 or 1. After each branch, the counter goes up by 1 if the outcome was `true` (but not above 3), and down by 1 if it was `false` (but not below 0). Write `twoBit(outs)` that returns how many guesses were wrong.',
    starter: `function twoBit(outs) {
  // your code here
}

// a loop of 3 that runs 5 times:
const o = [];
for (let k = 0; k < 5; k++) {
  o.push(true, true, true, false);
}
console.log(twoBit(o)); // 7`,
    solution: `function twoBit(outs) {
  let c = 0;
  let wrong = 0;
  for (const o of outs) {
    const guess = c >= 2;
    if (o !== guess) {
      wrong++;
    }
    if (o) {
      c = Math.min(3, c + 1);
    } else {
      c = Math.max(0, c - 1);
    }
  }
  return wrong;
}`,
    tests: `test('no branches', () => {
  expect(twoBit([])).toBe(0);
});
test('always false: never wrong', () => {
  expect(twoBit([false, false])).toBe(0);
});
test('always true: two mistakes to learn', () => {
  expect(twoBit([true, true, true])).toBe(2);
});
test('an inner loop, run 5 times', () => {
  const o = [];
  for (let k = 0; k < 5; k++) {
    o.push(true, true, true, false);
  }
  expect(twoBit(o)).toBe(7);
});
test('the counter stops at 3', () => {
  const t = true;
  const f = false;
  const o = [t, t, t, t, f, f, t];
  expect(twoBit(o)).toBe(5);
});`,
    hints: [
      'Keep a counter `c`, starting at 0, and a mistake counter. The guess is `c >= 2`.',
      'Compare the outcome with the guess and count a mistake if they differ, as before.',
      'Then move the counter: up by 1 for `true`, down by 1 for `false`, using `Math.min(3, c + 1)` and `Math.max(0, c - 1)` to keep it between 0 and 3.',
    ],
    walkthrough: `**How to think about it.** The "same as last time" predictor changes its mind after a single surprise, so in an inner loop (true, true, true, false, over and over) it is wrong twice per run: at the false that ends the loop, and again at the true that starts the next one. The counter gives the predictor a little inertia: one surprise moves it from 3 to 2, which still guesses true, so a single false does not make it forget that the branch is usually true. Trace the starter: the first two trues are wrong while the counter climbs from 0 to 2; after that each run of the inner loop costs one mistake, at its false. That is 2 + 5 = 7, against 10 for the one-bit predictor on the same outcomes.

**The solution, line by line.**

- \`function twoBit(outs) {\` takes the outcomes.
- \`  let c = 0;\` is the counter, starting at "strongly false".
- \`  let wrong = 0;\` counts mistakes.
- \`  for (const o of outs) {\` handles each branch.
- \`    const guess = c >= 2;\` is the prediction: true for 2 or 3.
- \`    if (o !== guess) {\` and \`      wrong++;\` count a misprediction.
- \`    }\` closes it.
- \`    if (o) {\` handles a true outcome.
- \`      c = Math.min(3, c + 1);\` moves up, but never past 3.
- \`    } else {\` handles a false one.
- \`      c = Math.max(0, c - 1);\` moves down, but never below 0.
- \`    }\` and \`  }\` close the \`if\` and the loop.
- \`  return wrong;\` hands back the count.
- \`}\` closes the function.

The last test shows why the limit matters: without it, four trues would push the counter to 4, two falses would only bring it down to 2, and the predictor would still be guessing true when the branch had just gone false twice in a row.

**Common wrong attempts.**

- Letting the counter grow without a limit makes the predictor slower and slower to change its mind after a long run of trues.
- Moving the counter before making the guess uses the outcome to predict itself, so it counts too few mistakes.`,
    wrong: [
      {
        code: `function twoBit(outs) {
  let c = 0;
  let wrong = 0;
  for (const o of outs) {
    if (o !== c >= 2) {
      wrong++;
    }
    c = o ? c + 1 : c - 1;
  }
  return wrong;
}`,
        why: 'The counter has no limits, so after four trues it reaches 4 and a single false leaves it at 3, still guessing true. Keep it between 0 and 3.',
      },
      {
        code: `function twoBit(outs) {
  let c = 0;
  let wrong = 0;
  for (const o of outs) {
    if (o) {
      c = Math.min(3, c + 1);
    } else {
      c = Math.max(0, c - 1);
    }
    if (o !== c >= 2) {
      wrong++;
    }
  }
  return wrong;
}`,
        why: 'The counter is updated before the guess is made, so each outcome partly predicts itself. Guess first, then update.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'What is the main benefit of a pipeline?',
    options: [
      { t: 'Each instruction finishes in fewer stages', why: 'Each instruction still goes through every stage.' },
      { t: 'It makes caches bigger', why: 'Pipelining is about instructions, not cache size.' },
      { t: 'Several instructions are in progress at once, so one can finish nearly every tick', correct: true, why: 'Like an assembly line: the stages are kept busy.' },
      { t: 'It removes the need for branches', why: 'Branches still exist; in fact they are what makes pipelines guess.' },
    ],
  },
  {
    q: 'Which pair of instructions can follow each other through the pipeline without a gap?',
    options: [
      { t: '`a = b + c` then `d = e + f`', correct: true, why: 'The second does not use `a`, so it need not wait for the first.' },
      { t: '`a = b + c` then `d = a + 1`', why: 'The second needs `a`, so it waits for the first to finish.' },
      { t: '`s = s + x` then `s = s + y`', why: 'The second needs the `s` the first produces.' },
      { t: 'None: every instruction waits for the one before', why: 'Only instructions that need an earlier result have to wait.' },
    ],
  },
  {
    q: 'The toy predictor (“same as last time”, first guess false) sees: true, true, false, false. How many wrong guesses?',
    options: [
      { t: '0', why: 'The first guess is false, so the first true is already a mistake.' },
      { t: '4', why: 'Repeated outcomes are guessed right by “same as last time”.' },
      { t: '2', correct: true, why: 'Wrong at the first true (guessed false) and at the first false (guessed true). The repeats are guessed right.' },
      { t: '1', why: 'There are two switches the predictor can’t see coming: the start and the change.' },
    ],
  },
  {
    q: 'What happens to instructions fetched after a branch that was mispredicted?',
    options: [
      { t: 'They are kept and run anyway', why: 'They belong to the wrong path; running them would give wrong results.' },
      { t: 'They are moved into the L1 cache', why: 'Caches hold memory contents; this is about instructions in flight.' },
      { t: 'The program crashes', why: 'Mispredictions are normal and invisible to the program, apart from the time they cost.' },
      { t: 'They are thrown away and the right path is fetched instead', correct: true, why: 'That wasted work is the cost of a misprediction.' },
    ],
  },
  {
    q: 'Which change is most likely to make `if (v < 50)` cheaper inside a loop over many random numbers?',
    options: [
      { t: 'Renaming `v` to something shorter', why: 'Names don’t exist at the machine level.' },
      { t: 'Sorting the numbers first, if order doesn’t matter', correct: true, why: 'Sorted data makes the branch predictable: one switch from true to false.' },
      { t: 'Changing 50 to 51', why: 'The outcomes would still be random.' },
      { t: 'Adding a second, unrelated if', why: 'That adds a branch; it doesn’t make the first one predictable.' },
    ],
  },
];
