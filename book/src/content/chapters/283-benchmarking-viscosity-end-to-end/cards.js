// Chapter 283 cards. Keys are stable ids: never rename them.

export const prompts = {
  'e2e-what': {
    q: 'What is an end-to-end benchmark?',
    a: 'A measurement of a whole program, compiled as a user would compile it, rather than one loop written for the benchmark.',
  },
  'e2e-why': {
    q: 'Name two costs a whole program pays that a single-loop microbenchmark leaves out.',
    a: 'Building the data through the generated container, bounds checks Viscosity couldn’t remove, and loops that don’t benefit (any two).',
  },
  'e2e-self-time': {
    q: 'Who measures the time in Viscosity’s end-to-end benchmark?',
    a: 'Each program times its own hot section with `performance.now()` and prints `{ check, ms }` as its last line.',
  },
  'e2e-checksum': {
    q: 'What two jobs does each program’s checksum do?',
    a: 'It keeps the work observable, so it can’t be removed as dead code, and it lets the harness check both versions computed the same thing.',
  },
  'e2e-fresh': {
    q: 'Why does every run of every version get a fresh process?',
    a: 'So no run inherits the other version’s type feedback, compiled code or garbage.',
  },
  'e2e-median': {
    q: 'In the committed particles runs on Node, one compiled run took 135 ms while the best took 90. Why doesn’t that one run spoil the result?',
    a: 'The harness reports the best and the median, and a single slow outlier is neither the fastest run nor the one in the middle.',
  },
  'e2e-wins': {
    q: 'Which committed programs gained most, and what do they have in common?',
    a: 'Particles, ledger and heat: many elements, and hot loops that touch only some of the fields.',
  },
  'e2e-story': {
    q: 'Why were n-body and boids first slower with Viscosity?',
    a: 'Their hot loops used indexes the bounds proof didn’t cover (an outer loop’s counter; `i + 1` starts and `&&` guards), so checks ran inside the hottest loop.',
  },
  'e2e-fix': {
    q: 'Was the n-body slowdown fixed by removing bounds checks?',
    a: 'No. The proof was generalized, so the checks became unnecessary: 12 of 12 accesses proven in bounds.',
  },
  'e2e-noise': {
    q: 'One committed run gave ledger 5.11×; the later matrix gave 3.75× (best). What should you claim?',
    a: 'Only the coarse picture: ledger is several times faster. Timings on that shared VM varied by up to about 2× between runs.',
  },
  'e2e-python': {
    q: 'In CPython, what did column storage cost and what did it save?',
    a: 'It was slower per element than dataclass objects, but used about 4.9× less memory.',
  },
  'e2e-warmup': {
    q: 'Why does the end-to-end benchmark keep JIT warm-up in its timings, unlike Part II’s harness?',
    a: 'Because a real program pays for warm-up too; the question is how long the user’s program takes.',
  },
};

export const exercises = {
  speedup: {
    title: 'Median speed-up with a checksum guard',
    prompt:
      'Write `speedup(a, b)`. `a` and `b` are the runs of the original and the compiled program: arrays of `{ ms, check }`. If any run, in either array, has a `check` different from `a[0].check`, throw an `Error` whose message contains `checksum`. Otherwise return the median of `a`’s times divided by the median of `b`’s, rounded to 2 decimals as a number. Use the harness’s median: sort a copy and take the element at index `Math.floor(n / 2)`. Don’t change the inputs.',
    starter: `function speedup(a, b) {
  let sa = 0;
  let sb = 0;
  for (const r of a) sa += r.ms;
  for (const r of b) sb += r.ms;
  const ma = sa / a.length;
  const mb = sb / b.length;
  return +(ma / mb).toFixed(2);
}`,
    solution: `function median(xs) {
  const s = [...xs].sort(
    (x, y) => x - y);
  return s[Math.floor(s.length / 2)];
}

function speedup(a, b) {
  const want = a[0].check;
  for (const r of [...a, ...b]) {
    if (r.check !== want) {
      throw new Error(
        'checksum: ' + r.check);
    }
  }
  const ma = median(a.map((r) => r.ms));
  const mb = median(b.map((r) => r.ms));
  return +(ma / mb).toFixed(2);
}`,
    tests: `const run = (ms, check = 'c') => ({ ms, check });
test('the committed particles runs on Node', () => {
  const a = [410.6, 393, 497.3, 429, 399.3, 395.8, 423.3, 459.9, 574.4].map((m) => run(m));
  const b = [118.1, 94.2, 114, 95.3, 117.7, 90, 135, 123.9, 103.7].map((m) => run(m));
  expect(speedup(a, b)).toBe(3.71);
});
test('an outlier does not move the median', () => {
  const a = [100, 100, 100].map((m) => run(m));
  const b = [50, 50, 900].map((m) => run(m));
  expect(speedup(a, b)).toBe(2);
});
test('even counts use the upper middle', () => {
  const a = [10, 40, 20, 30].map((m) => run(m));
  const b = [10, 10, 10, 10].map((m) => run(m));
  expect(speedup(a, b)).toBe(3);
});
test('a different answer is an error', () => {
  const a = [run(100), run(100)];
  const b = [run(50), run(50, 'other')];
  expect(() => speedup(a, b)).toThrow('checksum');
});
test('even within the original', () => {
  const a = [run(100), run(100, 'x')];
  const b = [run(50), run(50)];
  expect(() => speedup(a, b)).toThrow('checksum');
});
test('does not reorder the inputs', () => {
  const a = [run(30), run(10), run(20)];
  speedup(a, [run(10), run(10), run(10)]);
  expect(a.map((r) => r.ms)).toEqual([30, 10, 20]);
});`,
    hints: [
      'Check the checksums first: loop over `[...a, ...b]` and compare each `check` with `a[0].check`.',
      'For the median, copy before sorting: `[...xs].sort((x, y) => x - y)`. Without the comparator, numbers sort as strings.',
      'Divide the two medians and round with `+(x).toFixed(2)`.',
    ],
    walkthrough: `**How to think about it.** This is the core of the harness (\`packages/bench/src/e2e.ts\` and the matrix script), made a little stricter. Two rules come from *Benchmarking honestly* and *Noisy numbers: the median, p95 and a fresh process*: correctness before speed, so the checksums are checked first and a mismatch throws; and a robust summary, so one slow run (the committed particles data has a 135 ms run among others from 90 to 124) cannot drag the answer about. The median does that: it ignores how far an outlier is from the rest.

**The solution, line by line.**

- \`function median(xs) {\` is a helper.
- \`const s = [...xs].sort((x, y) => x - y);\` sorts a *copy* (\`sort\` changes the array it is called on) with a numeric comparator; without one, numbers are compared as strings, and \`'135' < '90'\`.
- \`return s[Math.floor(s.length / 2)];\` takes the middle element; for an even count this is the upper of the two middle values, as the e2e harness does.
- \`function speedup(a, b) {\` and \`const want = a[0].check;\` take the first run's checksum as the reference.
- \`for (const r of [...a, ...b]) { if (r.check !== want) throw new Error('checksum: ' + r.check); }\` checks every run of both versions: a fast wrong answer must stop the benchmark, and a program whose own output varies from run to run cannot be compared at all.
- \`const ma = median(a.map((r) => r.ms));\` and the same for \`b\` pull out the times and summarise them.
- \`return +(ma / mb).toFixed(2);\` divides original by compiled (bigger is faster) and rounds; \`toFixed\` returns a string, and the \`+\` in front turns it back into a number.

For the committed particles runs, the medians are 423.3 and 114 ms, and the answer is 3.71, exactly the matrix's median speed-up.

**Common wrong attempts.**

- Averaging (the starter) lets the 135 ms run and the 574.4 ms run pull the means about; the answer comes out 4.01.
- \`sort()\` without a comparator sorts \`'90'\` after \`'135'\`, so the "median" of the compiled runs becomes 123.9.
- Checking only the last run's checksum, as the simplest harness does, misses a run that went wrong earlier.`,
    wrong: [
      {
        code: `function speedup(a, b) {
  const sa = a.map((r) => r.ms).sort();
  const sb = b.map((r) => r.ms).sort();
  const h = Math.floor(sa.length / 2);
  const ma = sa[h];
  const mb = sb[h];
  if (a[0].check !== b[0].check) {
    throw new Error('checksum');
  }
  return +(ma / mb).toFixed(2);
}`,
        why: '`sort()` without a comparator sorts numbers as strings, so `[92, 135, 89, 89, 91]` becomes `[135, 89, 89, 91, 92]` and the “median” is 89. It also only checks the first run of each.',
      },
      {
        code: `function median(xs) {
  const s = [...xs].sort(
    (x, y) => x - y);
  return s[Math.floor(s.length / 2)];
}

function speedup(a, b) {
  const ma = median(a.map((r) => r.ms));
  const mb = median(b.map((r) => r.ms));
  return +(ma / mb).toFixed(2);
}`,
        why: 'The medians are right, but nothing checks the answers: a compiled program that computes the wrong result gets a speed-up anyway.',
      },
    ],
  },
  clearlyFaster: {
    optional: true,
    title: 'Faster, or just noise?',
    prompt:
      'Write `clearlyFaster(a, b)`, for two arrays of run times in ms (original, compiled). Return `true` only if **every** compiled run was faster than **every** original run (the ranges don’t overlap), else `false`.',
    starter: `function clearlyFaster(a, b) {
  const ma = a.reduce((s, x) => s + x);
  const mb = b.reduce((s, x) => s + x);
  return mb < ma;
}`,
    solution: `function clearlyFaster(a, b) {
  const slowB = Math.max(...b);
  return slowB < Math.min(...a);
}`,
    tests: `test('particles on Node: clearly faster', () => {
  expect(clearlyFaster([410.6, 393, 497.3, 429, 399.3, 395.8, 423.3, 459.9, 574.4], [118.1, 94.2, 114, 95.3, 117.7, 90, 135, 123.9, 103.7])).toBe(true);
});
test('n-body on Node: overlapping', () => {
  expect(clearlyFaster([62.6, 71.3, 63.4, 81.2, 92.6, 62, 73.6, 72.8, 61.6], [51.3, 72.9, 72.9, 71.9, 57, 57.3, 68.1, 62.8, 63.5])).toBe(false);
});
test('boids: overlapping on Node, clear on Bun', () => {
  expect(clearlyFaster([103.2, 68.6, 66, 60.1, 92, 63.3, 57.4, 121.9, 111.4], [43.8, 49.2, 53, 78.8, 66.6, 71.9, 46.1, 82.1, 56.6])).toBe(false);
  expect(clearlyFaster([96.4, 101, 67.6, 75.4, 73, 90.1, 83.4, 71.9, 64.1], [58.3, 55.9, 58, 39, 49.7, 61.2, 34.6, 37.2, 40.3])).toBe(true);
});
test('a tie is not faster', () => {
  expect(clearlyFaster([10, 12], [10, 9])).toBe(false);
});`,
    hints: [
      'The question is about the worst compiled run and the best original run.',
      '`Math.max(...b)` is the slowest compiled run; `Math.min(...a)` is the fastest original.',
    ],
    walkthrough: `**How to think about it.** "Clearly faster" here means the two sets of runs do not overlap at all: even the compiled program's worst run beat the original's best. So you need only two numbers, the slowest compiled run and the fastest original run.

**The solution, line by line.**

- \`const slowB = Math.max(...b);\` spreads the compiled times into \`Math.max\` and takes the slowest.
- \`return slowB < Math.min(...a);\` compares it with the fastest original run; a tie is not faster, so the comparison is strict.

All the test data is the committed per-run data from the benchmark matrix. For particles on Node the ranges are 393 to 574.4 ms against 90 to 135 ms: no doubt at all. For n-body on Node, the slowest compiled run (72.9 ms) was slower than the fastest original run (61.6 ms), although the best-of-9 speed-up was 1.2×. Boids overlaps on Node but not on Bun.

**Common wrong attempts.**

- Comparing sums or means (the starter) says "faster" whenever the compiled runs are faster on average, even if many original runs beat many compiled ones.
- Comparing the two *fastest* runs lets one lucky compiled run decide; for n-body on Node it says true.

This is not a statistical test: with more runs, ranges overlap more easily, and real benchmark tools use confidence intervals. But as a first check on a noisy machine, "do the ranges overlap?" stops you over-claiming a 1.2×.`,
    wrong: [
      {
        code: `function clearlyFaster(a, b) {
  const fastB = Math.min(...b);
  return fastB < Math.min(...a);
}`,
        why: 'It compares the best compiled run with the best original run, so one lucky compiled run is enough. For n-body on Node it says true although a compiled run (72.9 ms) was slower than an original one (61.6 ms).',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'What makes Viscosity’s end-to-end benchmark “end to end”?',
    options: [
      { t: 'It times every loop separately', why: 'It times each program’s whole hot section, as one number.' },
      { t: 'It uses the largest possible input', why: 'Size isn’t the point; a whole program is.' },
      { t: 'It compiles whole, unannotated programs with default options and times them as a user would run them', correct: true, why: 'Construction, checks and loops that don’t benefit are all included.' },
      { t: 'It runs on several machines', why: 'The committed results come from one shared cloud VM.' },
    ],
  },
  {
    q: 'The compiled ledger runs 5× faster but its checksum differs from the original’s. What does the harness do?',
    options: [
      { t: 'Throws, and reports no speed-up', correct: true, why: 'A fast wrong answer is a bug, not a result.' },
      { t: 'Reports 5× with a warning', why: 'It refuses to report any number.' },
      { t: 'Reruns until the checksums agree', why: 'A deterministic program that disagrees once will disagree again.' },
      { t: 'Ignores checksums; that’s the differential test’s job', why: 'Both check behaviour; the benchmark checks its own programs.' },
    ],
  },
  {
    q: 'Why were n-body and boids slower in the first version?',
    options: [
      { t: 'Float64Array is slower than objects for small arrays', why: 'With the checks gone, the same layout is faster.' },
      { t: 'The bounds proof didn’t cover their hot loops’ indexes, so checks ran in the innermost loop', correct: true, why: 'Outer-loop counters, `i + 1` starts and `&&` guards weren’t proven, per the commit.' },
      { t: 'The harness timed construction as well', why: 'Each program times only its hot section.' },
      { t: 'They were compiled in opt-in mode', why: 'The harness uses the default options.' },
    ],
  },
  {
    q: 'The 3-run results file says ledger 5.11×; the later 9-run matrix says 3.75× (best). What is the best conclusion?',
    options: [
      { t: 'The compiler regressed', why: 'The compiled time barely moved (46 ms, then 44.6 ms best); the original’s moved far more (237 ms, then 167.5 ms best).' },
      { t: 'One of the two runs is wrong and must be discarded', why: 'Both are honest measurements of a noisy machine.' },
      { t: 'Report the average, 4.4×', why: 'Averaging two noisy figures doesn’t remove the noise; it hides it.' },
      { t: 'Ledger is several times faster; the exact factor varies with machine noise', correct: true, why: 'Claim what both runs support, at the resolution they support.' },
    ],
  },
  {
    q: 'Why does the end-to-end harness use a new Node process for every run?',
    options: [
      { t: 'To use more CPU cores', why: 'Runs are sequential.' },
      { t: 'Because Node can only run one file per process', why: 'The point is isolation, not a Node restriction.' },
      { t: 'So no run inherits type feedback, compiled code or garbage from another', correct: true, why: 'The isolation rule from *Noisy numbers: the median, p95 and a fresh process*.' },
      { t: 'To skip JIT warm-up', why: 'A fresh process starts cold; warm-up is included in every run.' },
    ],
  },
  {
    q: 'In CPython, why does the Python plugin keep objects by default?',
    options: [
      { t: 'The analyses can’t handle Python', why: 'The same VIR and analyses serve both languages.' },
      { t: 'Columns were measured slower per element, though they used about 4.9× less memory', correct: true, why: 'So the cost model’s verdict for Python is “opt in if memory matters”.' },
      { t: 'Python has no typed arrays', why: '`array(\'d\')` is a typed column; it was just slower to read in CPython.' },
      { t: 'Columns used more memory', why: 'They used less: 3.3 MB against 16.0 MB.' },
    ],
  },
];
