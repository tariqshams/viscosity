// Chapter 53 cards. Keys are stable ids: never rename them.

export const prompts = {
  'warmup-why': {
    q: 'Why must a benchmark warm up before it starts recording times?',
    a: 'Early runs measure the interpreter and the compilers; only after warm-up is the optimized code running.',
  },
  tiers: {
    q: 'What does V8 do with a function before it becomes hot?',
    a: 'Compiles it to bytecode and interprets it, while recording feedback such as the shapes and types it sees.',
  },
  deopt: {
    q: 'What is **deoptimization**?',
    a: 'Throwing away speculative optimized code when one of its assumptions breaks, and falling back to slower code.',
  },
  'dce-what': {
    q: 'What is **dead-code elimination**?',
    a: 'A compiler deleting computations whose results are never used.',
  },
  'sink-why': {
    q: 'Why does the harness add every kernel’s result into a `sink` and print it at the end?',
    a: 'So the work has an observable result and the compiler can’t delete it as dead code.',
  },
  'median-why': {
    q: 'Why report the median of many samples rather than the mean?',
    a: 'One very slow sample (a GC pause, say) drags the mean up, but barely moves the median.',
  },
  'p95-what': {
    q: 'What does a p95 of 4 ns per element tell you?',
    a: '95% of the samples were at most 4 ns per element: it describes the slow end of the runs.',
  },
  'timer-coarse': {
    q: 'Why does each sample in the harness last at least 10 ms?',
    a: 'Timers are coarse (browsers round `performance.now()` to 100 µs), so one short run can’t be timed accurately.',
  },
  'isolation-why': {
    q: 'Why does the harness start a fresh process for each (suite, layout, size) case?',
    a: 'So type feedback, compiled code and heap state from one layout can’t affect another layout’s timing.',
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
  fixBench: {
    title: 'Fix the broken benchmark',
    prompt:
      '`bench(fn, now)` times the function `fn` using the clock function `now`, but it makes the classic mistakes. Fix it so that it: calls `fn` **3 times to warm up** (without timing them), then takes **9 timed samples** (one `fn()` call each, `now()` before and after), adds **every** result of `fn()` into a sink, and returns `{ median, sink }`, where `median` is the middle of the 9 sample times.',
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
    walkthrough: `Each fix answers one trap from the chapter.

- **Warm-up.** The first calls run cold code. Calling \`fn\` three times before timing anything lets the engine optimize it. The real harness warms up for 300 ms; three calls is the toy version.
- **Sink.** \`sink += fn()\` on *every* call, warm-up included, means no call's result is unused, so none can be deleted as dead code.
- **Many samples.** One timing is one roll of the dice. Nine timings show the spread.
- **Median.** Sort, then take the middle. In the test clock one sample takes 100 while the others take 1 to 9. The mean would be about 14; the median is 3, which is what a typical call really costs.

Why \`sort((a, b) => a - b)\`? Plain \`sort()\` compares as strings, so 100 would sort before 2.`,
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
      {
        code: `function bench(fn, now) {
  for (let i = 0; i < 3; i++) fn();
  const ts = [];
  for (let i = 0; i < 9; i++) {
    const t0 = now();
    fn();
    ts.push(now() - t0);
  }
  ts.sort((a, b) => a - b);
  return { median: ts[4], sink: 0 };
}`,
        why: 'The results of `fn()` are thrown away, so an optimizing compiler would be free to delete the work. Add each one into the sink.',
      },
    ],
  },
  p95: {
    optional: true,
    title: 'Compute p95 like the harness',
    prompt:
      'Write `p95(xs)` the way the harness does. Sort a **copy** of `xs` numerically. The 95% position is `pos = (n - 1) * 0.95`. If `pos` falls between two slots, interpolate: `s[lo] + (s[hi] - s[lo]) * (pos - lo)`, where `lo` and `hi` are `pos` rounded down and up. Don’t change `xs`.',
    starter: `function p95(xs) {
  // your code here
}

console.log(p95([2, 1]));`,
    solution: `function p95(xs) {
  const s = [...xs];
  s.sort((a, b) => a - b);
  const pos = (s.length - 1) * 0.95;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  const frac = pos - lo;
  return s[lo] + (s[hi] - s[lo]) * frac;
}`,
    tests: `test('21 values: exactly slot 19', () => {
  const xs = [];
  for (let i = 1; i <= 21; i++) xs.push(i);
  expect(p95(xs)).toBeCloseTo(20);
});
test('interpolates between two slots', () => {
  expect(p95([2, 1])).toBeCloseTo(1.95);
});
test('a single sample', () => {
  expect(p95([5])).toBe(5);
});
test('sorts numbers, not strings', () => {
  expect(p95([10, 9, 100])).toBeCloseTo(91);
});
test('leaves the input alone', () => {
  const xs = [3, 1, 2];
  p95(xs);
  expect(xs).toEqual([3, 1, 2]);
});`,
    hints: [
      'Copy, then sort the copy: `const s = [...xs];` then `s.sort((a, b) => a - b)`. Sorting `xs` directly would change the caller’s array.',
      '`pos` is usually not a whole number. `Math.floor(pos)` and `Math.ceil(pos)` are the slots on either side.',
      'The fraction `pos - lo` says how far to move from `s[lo]` towards `s[hi]`.',
    ],
    walkthrough: `This is the \`quantile\` function from the harness, specialized to 0.95.

- **Copy and sort.** Spread makes a new array (chapter 7), so the caller's samples keep their order.
- **Find the position.** With \`n\` sorted samples, index 0 is the fastest and \`n - 1\` the slowest, so the 95% point sits at \`(n - 1) * 0.95\`.
- **Interpolate.** For two samples \`[1, 2]\`, the position is 0.95: almost all the way from 1 to 2, giving 1.95.

Interpolating makes p95 change smoothly as samples change, instead of jumping from slot to slot.`,
    wrong: [
      {
        code: `function p95(xs) {
  const s = [...xs];
  s.sort((a, b) => a - b);
  return s[Math.floor(s.length * 0.95)];
}`,
        why: 'This picks a single slot without interpolating, and its position formula is off: for `[1, 2]` it returns 2 instead of 1.95.',
      },
      {
        code: `function p95(xs) {
  const s = xs.sort((a, b) => a - b);
  const pos = (s.length - 1) * 0.95;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return s[lo] + (s[hi] - s[lo]) *
    (pos - lo);
}`,
        why: '`xs.sort` sorts the caller’s array in place. The answers are right, but the input is changed: copy it first.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'A benchmark times the first call of a function and reports it. What is it mostly measuring?',
    options: [
      { t: 'The steady-state speed of optimized code', why: 'The first call runs before V8 has optimized anything.' },
      { t: 'Cold code: the interpreter, plus the cost of getting started', correct: true, why: 'V8 interprets bytecode first and optimizes only once a function is hot.' },
      { t: 'Exactly the same thing as the thousandth call', why: 'Calls get faster as the engine learns and compiles.' },
      { t: 'Only the garbage collector', why: 'The GC may run, but the main effect is the code not being optimized yet.' },
    ],
  },
  {
    q: 'A benchmark computes `sum(xs)` a million times but never uses the result. What might an optimizing compiler do?',
    options: [
      { t: 'Run it even faster by caching the answer in a file', why: 'Compilers don’t persist results like that.' },
      { t: 'Refuse to compile the function', why: 'Unused results don’t stop compilation.' },
      { t: 'Delete the work as dead code, making the time meaningless', correct: true, why: 'If nothing observes the result, the computation can legally be removed. A sink prevents this.' },
      { t: 'Nothing: compilers never remove code', why: 'Dead-code elimination is a standard optimization.' },
    ],
  },
  {
    q: 'Samples (ms): `2, 2, 2, 2, 2, 2, 50`. Which summary best describes a typical run?',
    options: [
      { t: 'The median, 2 ms', correct: true, why: 'The median ignores the one outlier.' },
      { t: 'The mean, about 8.9 ms', why: 'One slow sample drags the mean far above every typical run.' },
      { t: 'The maximum, 50 ms', why: 'That is the worst case, not the typical one.' },
      { t: 'The first sample', why: 'One sample can be anything; that is why we take many.' },
    ],
  },
  {
    q: 'Why does the harness run each (suite, layout, size) case in its own process?',
    options: [
      { t: 'To use all the CPU cores at once', why: 'The cases run one after another, not in parallel.' },
      { t: 'Because Node can only run one function per process', why: 'Node can run any number of functions.' },
      { t: 'To make the benchmark finish sooner', why: 'Starting processes makes it slower, not faster.' },
      { t: 'So feedback, compiled code and heap state from one layout can’t affect another', correct: true, why: 'A shared function that saw several shapes would be measured in a mixed state.' },
    ],
  },
  {
    q: 'In a browser, why can’t you time one 50-microsecond loop run with `performance.now()`?',
    options: [
      { t: '`performance.now()` only counts whole seconds', why: 'It returns fractional milliseconds.' },
      { t: 'Browsers coarsen it (to 100 µs, or 5 µs when isolated), so one short run is below its resolution', correct: true, why: 'That is why each sample repeats the work until it lasts several milliseconds.' },
      { t: '`performance.now()` doesn’t work in loops', why: 'It works anywhere; the issue is its resolution.' },
      { t: 'The loop is deleted before it runs', why: 'Dead-code elimination is a separate trap.' },
    ],
  },
  {
    q: 'This book’s results came from a shared cloud machine. What should you trust most?',
    options: [
      { t: 'The absolute nanoseconds, to two decimal places', why: 'Absolute times change with the machine and its load.' },
      { t: 'Only the fastest sample of each case', why: 'The minimum hides how noisy the run was.' },
      { t: 'Ratios between layouts, checked against the spread between median and p95', correct: true, why: 'Ratios survive a slower or busier machine; a wide median–p95 gap warns of noise.' },
      { t: 'Nothing: shared machines make benchmarks useless', why: 'Careful method makes them useful; you just read them as ratios.' },
    ],
  },
];
