// Chapter 165 cards. Keys are stable ids: never rename them.

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
    q: 'Why does every run of every version get a new Node process?',
    a: 'So no run inherits the other version’s type feedback, compiled code or garbage.',
  },
  'e2e-median': {
    q: 'In the rerun of particles, one compiled run took 135 ms and the others about 90. Why doesn’t it spoil the result?',
    a: 'The harness reports the median, and an outlier is never in the middle.',
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
    q: 'The committed n-body speed-up is 1.09×; a rerun gave 1.20×. What should you claim?',
    a: 'Only that n-body gets a little faster: differences that small are within run-to-run noise on a shared VM.',
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
test('the rerun of particles', () => {
  const a = [442, 379, 397, 393, 378].map((m) => run(m));
  const b = [92, 135, 89, 89, 91].map((m) => run(m));
  expect(speedup(a, b)).toBe(4.32);
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
    walkthrough: `This is the core of \`packages/bench/src/e2e.ts\`, made a little stricter.

- **Correctness before speed.** The checksum check comes first, and it throws. A compiled program that is fast and wrong has no speed-up worth reporting; stopping the benchmark makes sure nobody quotes one. Checking every run, not just the last, also catches a program whose output varies from run to run, which would make the comparison meaningless.
- **Median, not mean.** The starter averages, so one slow run (the 135 ms one) drags the compiled time up and the speed-up down. The median ignores how far an outlier is from the rest.
- **Sort a copy, numerically.** \`sort()\` mutates its array, and without a comparator it compares numbers as strings (\`'135' < '89'\`). Both are classic benchmark-script bugs.
- **Upper median.** For an even count, \`Math.floor(n / 2)\` takes the upper of the two middle values, exactly as the harness does. Odd counts (3 or 5 runs) avoid the question.

The real harness throws on a mismatch between the two versions’ last checksums; checking every run is a small extra guard.`,
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
    tests: `test('particles: clearly faster', () => {
  expect(clearlyFaster([442, 379, 397, 393, 378], [92, 135, 89, 89, 91])).toBe(true);
});
test('n-body rerun: overlapping', () => {
  expect(clearlyFaster([64, 88, 59, 59, 74], [52, 55, 56, 53, 53])).toBe(true);
  expect(clearlyFaster([64, 88, 52, 59, 74], [52, 55, 56, 53, 53])).toBe(false);
});
test('boids rerun', () => {
  expect(clearlyFaster([83, 88, 69, 73, 62], [56, 53, 46, 63, 47])).toBe(false);
});
test('a tie is not faster', () => {
  expect(clearlyFaster([10, 12], [10, 9])).toBe(false);
});`,
    hints: [
      'The question is about the worst compiled run and the best original run.',
      '`Math.max(...b)` is the slowest compiled run; `Math.min(...a)` is the fastest original.',
    ],
    walkthrough: `The slowest compiled run has to beat the fastest original run.

- **Totals hide overlap.** The starter compares sums, so it says “faster” whenever the compiled runs are faster on average, even if some original runs beat some compiled ones.
- **Non-overlapping ranges are a strong, simple signal.** For particles (378–442 ms against 89–135 ms) there is no doubt. For the boids rerun, the fastest original run (62 ms) beat the slowest compiled run (63 ms), even though the medians said 1.39×.
- **It is not a statistical test.** With more runs, ranges overlap more easily, and real benchmark tools use confidence intervals instead. But as a first check on a noisy machine, “do the ranges overlap?” stops you from over-claiming a 1.09×.

These run times are the real per-run values from the chapter’s rerun (the n-body set is used twice, once with one value changed).`,
    wrong: [
      {
        code: `function clearlyFaster(a, b) {
  const fastB = Math.min(...b);
  return fastB < Math.min(...a);
}`,
        why: 'It compares the best compiled run with the best original run, so one lucky compiled run is enough. For boids it says true although a compiled run (63 ms) was slower than an original one (62 ms).',
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
    q: 'A rerun gives ledger 3.68× where the committed results say 5.11×. What is the best conclusion?',
    options: [
      { t: 'The compiler regressed', why: 'The compiled time barely moved (46 → 49 ms); the original’s did (237 → 180 ms).' },
      { t: 'One of the two runs is wrong and must be discarded', why: 'Both are honest measurements of a noisy machine.' },
      { t: 'Report the average, 4.4×', why: 'Averaging two noisy medians doesn’t remove the noise; it hides it.' },
      { t: 'Ledger is several times faster; the exact factor varies with machine noise', correct: true, why: 'Claim what both runs support, at the resolution they support.' },
    ],
  },
  {
    q: 'Why does the end-to-end harness use a new Node process for every run?',
    options: [
      { t: 'To use more CPU cores', why: 'Runs are sequential.' },
      { t: 'Because Node can only run one file per process', why: 'The point is isolation, not a Node restriction.' },
      { t: 'So no run inherits type feedback, compiled code or garbage from another', correct: true, why: 'The same isolation rule as chapter 33.' },
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
