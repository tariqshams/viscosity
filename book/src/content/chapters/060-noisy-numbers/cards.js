// Chapter 59b cards (split from chapter 59). Keys are stable ids: never
// rename them.

export const prompts = {
  'median-why': {
    q: 'Why report the median of many samples rather than the mean?',
    a: 'One very slow sample (a garbage-collection pause, say) drags the mean up, but barely moves the median.',
  },
  'p95-what': {
    q: 'What does a p95 of 4 ns per element tell you?',
    a: '95% of the samples were at most 4 ns per element: it describes the slow end of the runs.',
  },
  'timer-coarse': {
    q: 'Why does each sample in the harness last at least 10 ms?',
    a: 'Timers are coarse (browsers round `performance.now()` to 100 µs), so one short run cannot be timed accurately.',
  },
  'quantile-pos': {
    q: 'With 21 sorted samples, at which slot is the p95?',
    a: 'Slot (21 − 1) × 0.95 = 19, counting from 0.',
  },
  'isolation-why': {
    q: 'Why does the harness start a fresh process for each (suite, layout, size) case?',
    a: 'So type feedback, compiled code and heap state from one layout cannot affect another layout\'s timing.',
  },
  'isolation-heap': {
    q: 'Besides feedback, what else does a fresh process reset?',
    a: 'The heap: garbage left by one case cannot trigger a collection in the middle of the next.',
  },
  ratios: {
    q: 'Why compare ratios between layouts rather than absolute times on a shared machine?',
    a: 'A slower or busier machine changes every absolute time, but tends to leave the ratio between layouts roughly the same.',
  },
  'gap-noise': {
    q: 'The median is 2 ns and the p95 is 9 ns. What does that suggest?',
    a: 'The run was noisy: many samples were much slower than typical, so rerun it before trusting it.',
  },
};

export const examples = {
  'mean-vs-median': {
    title: 'One outlier, two summaries',
    code: `const ts = [2.1, 2.0, 2.2, 2.0,
  30, 2.1, 2.3];
let sum = 0;
for (const t of ts) sum += t;
console.log('mean', sum / ts.length);

const s = [...ts].sort((a, b) => a - b);
console.log('sorted', s);
console.log('median', s[3]);`,
  },
};

export const exercises = {
  summarize: {
    title: 'Median and p95, like the harness',
    prompt:
      'Write `summarize(xs)` that returns `{ median, p95 }` for the timings `xs`, the way the harness does. Sort a **copy** of `xs` numerically (do not change `xs`). For a fraction `q`, the position is `pos = (n - 1) * q`; with `lo` and `hi` being `pos` rounded down and up, the answer is `s[lo] + (s[hi] - s[lo]) * (pos - lo)`. Use `q = 0.5` for the median and `q = 0.95` for p95.',
    starter: `function summarize(xs) {
  // your code here
}

console.log(summarize([3, 1, 2]));`,
    solution: `function quantile(s, q) {
  const pos = (s.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  const frac = pos - lo;
  return s[lo] + (s[hi] - s[lo]) * frac;
}
function summarize(xs) {
  const s = [...xs];
  s.sort((a, b) => a - b);
  return {
    median: quantile(s, 0.5),
    p95: quantile(s, 0.95),
  };
}`,
    tests: `test('odd count: the middle sample', () => {
  expect(summarize([3, 1, 2]).median).toBe(2);
});
test('even count: halfway between', () => {
  expect(summarize([4, 1, 3, 2]).median)
    .toBeCloseTo(2.5);
});
test('p95 of 21 samples is slot 19', () => {
  const xs = [];
  for (let i = 1; i <= 21; i++) xs.push(i);
  expect(summarize(xs).p95).toBeCloseTo(20);
});
test('p95 interpolates', () => {
  expect(summarize([2, 1]).p95)
    .toBeCloseTo(1.95);
});
test('sorts numbers, not strings', () => {
  expect(summarize([10, 9, 100]).median)
    .toBe(10);
});
test('leaves the input alone', () => {
  const xs = [3, 1, 2];
  summarize(xs);
  expect(xs).toEqual([3, 1, 2]);
});`,
    hints: [
      'Both numbers use the same recipe with a different fraction, so write a helper `quantile(s, q)` that works on an already sorted array, and call it twice.',
      'Copy first, then sort the copy numerically: `const s = [...xs]; s.sort((a, b) => a - b);`. Plain `sort()` would compare `100` and `9` as strings.',
      'In `quantile`: `pos = (s.length - 1) * q`, `lo = Math.floor(pos)`, `hi = Math.ceil(pos)`, and return `s[lo] + (s[hi] - s[lo]) * (pos - lo)`.',
    ],
    walkthrough: `**How to think about it.** The median and the p95 are the same calculation with a different fraction, so the clean solution writes that calculation once, as \`quantile\`, and calls it twice. The calculation needs sorted samples, and sorting changes an array in place, so we sort a copy to leave the caller's samples alone. Do one by hand first: for \`[4, 1, 3, 2]\`, sorted is \`[1, 2, 3, 4]\`; the median's position is 3 × 0.5 = 1.5, between slot 1 (\`2\`) and slot 2 (\`3\`), half of the way along, so 2.5.

**The solution, line by line.**

- \`function quantile(s, q) {\` takes an already sorted array and a fraction.
- \`const pos = (s.length - 1) * q;\`: slot 0 is the fastest sample and slot \`n - 1\` the slowest, so the fraction \`q\` of the way between them is \`(n - 1) * q\`.
- \`const lo = Math.floor(pos);\` and \`const hi = Math.ceil(pos);\` are the slots on either side; when \`pos\` is a whole number they are the same slot.
- \`const frac = pos - lo;\` is the leftover fraction: how far past slot \`lo\` the position is.
- \`return s[lo] + (s[hi] - s[lo]) * frac;\` starts at \`s[lo]\` and moves towards \`s[hi]\` by that fraction. When \`lo\` and \`hi\` are equal, the second part is zero and the answer is that slot exactly.
- \`function summarize(xs) {\` is the function the tests call.
- \`const s = [...xs];\` copies the samples with spread (from the chapter on copies), so sorting cannot change the caller's array.
- \`s.sort((a, b) => a - b);\` sorts numerically: the comparison returns a negative number when \`a\` should come first.
- \`return { median: quantile(s, 0.5), p95: quantile(s, 0.95) };\` (split over four lines in the solution) asks for the two fractions.

For 21 samples 1 to 21, the p95 position is 20 × 0.95 = 19, a whole slot, holding \`20\`. For \`[2, 1]\` it is 0.95, almost all the way from 1 to 2, so 1.95.

**Common wrong attempts.**

- \`xs.sort(...)\` sorts the caller's array in place; the answers are right, but the caller's samples have been reordered, which the last test catches.
- Plain \`sort()\` compares as text, so \`[10, 9, 100]\` sorts as \`[10, 100, 9]\` and the "median" is \`100\`.
- Picking one slot without interpolating, such as \`s[Math.floor(n * 0.95)]\`, jumps from slot to slot as samples change, and gives 2 instead of 1.95 for \`[2, 1]\`.`,
    wrong: [
      {
        code: `function summarize(xs) {
  const s = [...xs].sort();
  const n = s.length;
  return {
    median: s[Math.floor(n / 2)],
    p95: s[Math.floor(n * 0.95)],
  };
}`,
        why: 'Plain `sort()` compares as strings, so `100` sorts before `9`; and picking a single slot means no interpolation, so an even count gives the wrong median.',
      },
      {
        code: `function quantile(s, q) {
  const pos = (s.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  const frac = pos - lo;
  return s[lo] + (s[hi] - s[lo]) * frac;
}
function summarize(xs) {
  xs.sort((a, b) => a - b);
  return {
    median: quantile(xs, 0.5),
    p95: quantile(xs, 0.95),
  };
}`,
        why: '`xs.sort` reorders the caller\'s array in place. The answers are right, but the input has changed: copy it first.',
      },
    ],
  },
  fixBench: {
    optional: true,
    title: 'Fix the broken benchmark',
    prompt:
      '`bench(fn, now)` times `fn` with the clock function `now`, and makes every classic mistake. Fix it so that it: calls `fn` **3 times to warm up** (without timing them), then takes **9 timed samples** (one `fn()` call each, `now()` before and after), adds **every** result of `fn()` into a sink, and returns `{ median, sink }`, where `median` is the middle of the 9 sample times.',
    starter: `function bench(fn, now) {
  const t0 = now();
  fn();
  const t = now() - t0;
  return { median: t, sink: 0 };
}`,
    solution: `function bench(fn, now) {
  let sink = 0;
  for (let i = 0; i < 3; i++) {
    sink += fn(); // warm-up
  }
  const ts = [];
  for (let i = 0; i < 9; i++) {
    const t0 = now();
    sink += fn();
    ts.push(now() - t0);
  }
  ts.sort((a, b) => a - b);
  return { median: ts[4], sink };
}`,
    tests: `// A fake clock: each call returns the next time.
function clock(times) {
  let k = 0;
  return () => times[k++];
}
// Sample times: 5,1,2,9,3,4,100,3,2
const T = [0, 5, 10, 11, 20, 22, 30, 39,
  40, 43, 50, 54, 60, 160, 200, 203,
  210, 212];
function counter() {
  const f = () => { f.calls++; return 1; };
  f.calls = 0;
  return f;
}
test('warms up 3 times, then samples 9', () => {
  const f = counter();
  bench(f, clock(T));
  expect(f.calls).toBe(12);
});
test('every result goes into the sink', () => {
  expect(bench(counter(), clock(T)).sink)
    .toBe(12);
});
test('reports the median, not the mean', () => {
  expect(bench(counter(), clock(T)).median)
    .toBe(3);
});`,
    hints: [
      'Warm-up first: a loop that calls `fn()` 3 times and adds each result to `sink`, without calling `now()`.',
      'Then 9 samples: `const t0 = now(); sink += fn(); ts.push(now() - t0);`.',
      'Sort numerically with `ts.sort((a, b) => a - b)`. With 9 sorted samples, the median is `ts[4]`.',
    ],
    walkthrough: `**How to think about it.** Each fix answers one trap from this chapter or the last, so take them in order: warm up, keep every result, take many samples, and summarize with the median. The test's fake clock makes the nine sample times 5, 1, 2, 9, 3, 4, 100, 3 and 2; the mean of those is about 14, while sorted they are 1, 2, 2, 3, 3, 4, 5, 9, 100, with 3 in the middle.

**The solution, line by line.**

- \`let sink = 0;\` starts the sink.
- \`for (let i = 0; i < 3; i++) {\` and \`sink += fn(); // warm-up\` warm up three times, untimed, keeping each result.
- \`const ts = [];\` will hold the nine sample times.
- \`for (let i = 0; i < 9; i++) {\` takes the samples.
- \`const t0 = now();\` reads the clock just before one call,
- \`sink += fn();\` makes the call and keeps the result,
- \`ts.push(now() - t0);\` reads the clock again and records how long that sample took.
- \`ts.sort((a, b) => a - b);\` sorts the times numerically (plain \`sort()\` would put 100 before 2).
- \`return { median: ts[4], sink };\`: with nine sorted samples the middle one is at slot 4 (four below it, four above). It is 3 here, the typical cost, while the one 100 sits harmlessly at the end.

**Common wrong attempts.**

- Leaving out the warm-up: only 9 calls are made, and every sample includes cold code.
- Averaging the samples: the one 100-unit outlier drags the answer to about 14.
- Calling \`fn()\` without adding to the sink: the results are dead, so an optimizer may delete the work.`,
    wrong: [
      {
        code: `function bench(fn, now) {
  let sink = 0;
  const ts = [];
  for (let i = 0; i < 9; i++) {
    const t0 = now();
    sink += fn();
    ts.push(now() - t0);
  }
  ts.sort((a, b) => a - b);
  return { median: ts[4], sink };
}`,
        why: 'No warm-up: every sample includes the cold first calls. The test counts only 9 calls, not 12.',
      },
      {
        code: `function bench(fn, now) {
  let sink = 0;
  for (let i = 0; i < 3; i++) {
    sink += fn();
  }
  let total = 0;
  for (let i = 0; i < 9; i++) {
    const t0 = now();
    sink += fn();
    total += now() - t0;
  }
  return { median: total / 9, sink };
}`,
        why: 'This reports the mean. The one 100-unit outlier drags it to about 14, while a typical sample takes 3.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Samples (ms): `2, 2, 2, 2, 2, 2, 50`. Which summary best describes a typical run?',
    options: [
      { t: 'The mean, about 8.9 ms', why: 'One slow sample drags the mean far above every typical run.' },
      { t: 'The median, 2 ms', correct: true, why: 'The median ignores the one outlier.' },
      { t: 'The maximum, 50 ms', why: 'That is the worst case, not the typical one.' },
    ],
  },
  {
    q: 'What is the median of `[1, 2, 3, 4]`, using the harness\'s quantile rule?',
    options: [
      { t: '2', why: 'That is slot 1, but the position is 1.5, halfway between slots 1 and 2.' },
      { t: '3', why: 'That is slot 2; the position 1.5 is halfway between 2 and 3.' },
      { t: '2.5', correct: true, why: '(4 − 1) × 0.5 = 1.5, so halfway between 2 and 3.' },
    ],
  },
  {
    q: 'Why does the harness run each (suite, layout, size) case in its own process?',
    options: [
      { t: 'To use all the CPU cores at once', why: 'The cases run one after another, not in parallel.' },
      { t: 'So feedback, compiled code and heap state from one layout cannot affect another', correct: true, why: 'A shared function that saw several shapes would be measured in a mixed state.' },
      { t: 'To make the benchmark finish sooner', why: 'Starting processes makes it slower, not faster.' },
    ],
  },
  {
    q: 'In a browser, why can you not time a single 50-microsecond loop run with `performance.now()`?',
    options: [
      { t: '`performance.now()` only counts whole seconds', why: 'It returns fractional milliseconds.' },
      { t: '`performance.now()` does not work inside loops', why: 'It works anywhere; the issue is its resolution.' },
      { t: 'Browsers round it (to 100 µs, or 5 µs when isolated), so one short run is below its resolution', correct: true, why: 'That is why each sample repeats the work until it lasts several milliseconds.' },
      { t: 'The loop is deleted before it runs', why: 'Dead-code elimination is a separate trap, fixed by a sink.' },
    ],
  },
  {
    q: 'This book\'s results came from a shared cloud machine. What should you trust most?',
    options: [
      { t: 'Ratios between layouts, checked against the gap between median and p95', correct: true, why: 'Ratios survive a slower or busier machine; a wide median-to-p95 gap warns of noise.' },
      { t: 'The absolute nanoseconds, to two decimal places', why: 'Absolute times change with the machine and its load.' },
      { t: 'Only the fastest sample of each case', why: 'The minimum hides how noisy the run was.' },
      { t: 'Nothing: shared machines make benchmarks useless', why: 'Careful method makes them useful, read as ratios.' },
    ],
  },
];
