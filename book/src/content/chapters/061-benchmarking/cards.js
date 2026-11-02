// Chapter 61 cards. Keys are stable ids: never rename them.

export const prompts = {
  'warmup-why': {
    q: 'Why must a benchmark warm up before it starts recording times?',
    a: 'Early runs measure the interpreter and the compilers; only after warm-up is the optimized code running.',
  },
  'first-call': {
    q: 'A benchmark times only the first call of a function. What is it mostly measuring?',
    a: 'Cold code: the bytecode interpreter, plus the cost of getting started, not the optimized steady state.',
  },
  tiers: {
    q: 'What does V8 do with a function before it becomes hot?',
    a: 'Compiles it to bytecode and interprets it, while recording feedback such as the shapes and types it sees.',
  },
  feedback: {
    q: 'What is the **feedback** V8 records while a function runs, and who uses it?',
    a: 'A record of the object shapes and value types seen at each place in the code; the optimizing tiers use it to specialize.',
  },
  deopt: {
    q: 'What is **deoptimization**?',
    a: 'Throwing away speculative optimized code when one of its guesses breaks, and falling back to slower code.',
  },
  'dce-what': {
    q: 'What is **dead-code elimination**?',
    a: 'A compiler deleting computations whose results are never used and that have no other effect.',
  },
  'dce-legal': {
    q: 'Why is a compiler allowed to delete a loop whose result is never used?',
    a: 'Because the program\'s output cannot change: nothing observes the result, so removing the work is invisible.',
  },
  'sink-why': {
    q: 'Why does the harness add every kernel\'s result into a `sink` and read it at the end?',
    a: 'So the work has an observable result and the compiler cannot delete it as dead code.',
  },
};

export const examples = {
  warmup: {
    title: 'Watch a loop warm up',
    code: `function sum(xs) {
  let s = 0;
  for (const x of xs) s += x;
  return s;
}
const xs = new Float64Array(1e6);
xs.fill(1);
let sink = 0;
for (let r = 0; r < 8; r++) {
  const t0 = performance.now();
  sink += sum(xs);
  const ms = performance.now() - t0;
  console.log(r, ms.toFixed(2), 'ms');
}
console.log('sink', sink);`,
  },
};

export const exercises = {
  warmBench: {
    title: 'Warm up, and keep the result',
    prompt:
      '`warmBench(fn, now)` times the function `fn` with the clock function `now`, but it makes the first two classic mistakes. Fix it so that it calls `fn` **3 times to warm up** (without calling `now`), then calls `now()` once, calls `fn` **5 times**, calls `now()` again, and returns `{ perCall, sink }`: `perCall` is the time between the two `now()` calls divided by 5, and `sink` is the sum of **every** result `fn` returned, warm-up included.',
    starter: `function warmBench(fn, now) {
  const t0 = now();
  fn();
  const t = now() - t0;
  return { perCall: t, sink: 0 };
}`,
    solution: `function warmBench(fn, now) {
  let sink = 0;
  for (let i = 0; i < 3; i++) {
    sink += fn(); // warm-up
  }
  const t0 = now();
  for (let i = 0; i < 5; i++) {
    sink += fn();
  }
  const t = now() - t0;
  return { perCall: t / 5, sink };
}`,
    tests: `// A fake clock: each call returns the
// next time in the list.
function clock(times) {
  let k = 0;
  return () => times[k++];
}
function counter() {
  const f = () => { f.calls++; return 1; };
  f.calls = 0;
  return f;
}
test('warms up 3 times, then runs 5', () => {
  const f = counter();
  warmBench(f, clock([10, 60]));
  expect(f.calls).toBe(8);
});
test('times only the 5 timed calls', () => {
  const r = warmBench(counter(),
    clock([10, 60]));
  expect(r.perCall).toBe(10);
});
test('every result goes into the sink', () => {
  const r = warmBench(counter(),
    clock([0, 5]));
  expect(r.sink).toBe(8);
});`,
    hints: [
      'There are three phases: warm up (untimed), time a batch, compute the answer. Write them one after another.',
      'Warm-up is a loop of 3 that does `sink += fn();` and never calls `now()`. Then `const t0 = now();`, a loop of 5 doing `sink += fn();`, and `const t = now() - t0;`.',
      'Return `{ perCall: t / 5, sink }`. Make sure `sink` starts at 0 and that *every* call, warm-up included, adds to it.',
    ],
    walkthrough: `**How to think about it.** The broken version has two faults from the chapter. It times the very first call, which runs cold, and it throws \`fn()\`'s result away, so a compiler would be free to delete the work. Fix them one at a time: put an untimed warm-up in front, and route every result into a sink. The tests use a fake clock (a function that returns 10, then 60) so the answer is predictable; that also means \`now()\` must be called exactly twice, once on each side of the timed batch.

**The solution, line by line.**

- \`let sink = 0;\` starts the sink. Everything \`fn\` returns will be added here.
- \`for (let i = 0; i < 3; i++) {\` runs the warm-up three times.
- \`sink += fn(); // warm-up\` calls the function and keeps its result. There is no \`now()\` here: warm-up runs are not timed, because they are the slow, cold ones we want to leave out. (The real harness warms up for at least 300 ms and five runs; three calls is the toy version.)
- \`const t0 = now();\` reads the clock once, just before the timed batch.
- \`for (let i = 0; i < 5; i++) {\` and \`sink += fn();\` run the batch, still keeping every result.
- \`const t = now() - t0;\` reads the clock again; \`t\` is how long the whole batch took. With the fake clock that is 60 − 10 = 50.
- \`return { perCall: t / 5, sink };\` divides by the number of timed calls to get the time per call (50 / 5 = 10), and returns the sink, which by now is 8 (three warm-up results plus five timed ones).

Timing a batch rather than one call matters too: one call of a fast function can be shorter than the timer's resolution, which the next chapter comes back to.

**Common wrong attempts.**

- Calling \`fn()\` without adding its result to \`sink\`, in the warm-up or the batch: the code looks the same, but those calls' results are dead, so the compiler may skip them, and the last test sees a sink of 5 instead of 8.
- Timing the warm-up too (calling \`now()\` before the warm-up loop) includes the cold calls in the measurement, which is the mistake warm-up exists to avoid. The fake-clock tests cannot catch this one (two \`now()\` calls still give 10 and 60), so check it by reading the code.
- Returning \`t\` instead of \`t / 5\` reports the whole batch, not one call.`,
    wrong: [
      {
        code: `function warmBench(fn, now) {
  let sink = 0;
  const t0 = now();
  for (let i = 0; i < 5; i++) {
    sink += fn();
  }
  const t = now() - t0;
  return { perCall: t / 5, sink };
}`,
        why: 'No warm-up: the timed batch includes the cold first calls. The test counts only 5 calls, not 8.',
      },
      {
        code: `function warmBench(fn, now) {
  for (let i = 0; i < 3; i++) fn();
  let sink = 0;
  const t0 = now();
  for (let i = 0; i < 5; i++) {
    sink += fn();
  }
  const t = now() - t0;
  return { perCall: t / 5, sink };
}`,
        why: 'The warm-up results are thrown away, so those calls are dead code an optimizer could delete. The sink comes out as 5, not 8.',
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
      { t: 'Exactly the same thing as the thousandth call', why: 'Calls get faster as the engine learns and recompiles.' },
    ],
  },
  {
    q: 'After a million calls with numbers, `add` is called once with two strings. What is V8 likely to do?',
    options: [
      { t: 'Convert the strings to numbers', why: 'That would change what the program means; `+` joins strings.' },
      { t: 'Throw a type error', why: 'JavaScript allows strings with `+`; nothing is wrong with the program.' },
      { t: 'Deoptimize: throw the number-specialized code away and fall back to slower code', correct: true, why: 'The optimized code was built on the guess "both are numbers", and the guess broke.' },
    ],
  },
  {
    q: 'A benchmark computes `sum(xs)` a million times but never uses the result. What might an optimizing compiler do?',
    options: [
      { t: 'Run it faster by saving the answer in a file', why: 'Compilers do not keep results between runs like that.' },
      { t: 'Refuse to compile the function', why: 'Unused results do not stop compilation.' },
      { t: 'Delete the work as dead code, making the time meaningless', correct: true, why: 'If nothing observes the result, the computation can legally be removed. A sink prevents this.' },
      { t: 'Nothing: compilers never remove code', why: 'Dead-code elimination is a standard optimization.' },
    ],
  },
  {
    q: 'Which line keeps `sumAll(xs)` from being dead code?',
    options: [
      { t: '`sink += sumAll(xs);` with `sink` printed at the end', correct: true, why: 'The result now feeds a value that is printed, so it is live.' },
      { t: '`const r = sumAll(xs);` with `r` never read', why: '`r` is never used, so the result is still dead.' },
      { t: 'Calling `sumAll(xs)` twice', why: 'Two unused results are still unused.' },
    ],
  },
  {
    q: 'Why does this book\'s harness warm up for at least 300 ms and five runs before recording?',
    options: [
      { t: 'To let the CPU cool down', why: 'Warm-up is about the engine\'s tiers, not temperature.' },
      { t: 'So the measured runs use optimized code rather than the interpreter', correct: true, why: 'By then the hot kernel has climbed the tiers and the times have settled.' },
      { t: 'Because the timer does not work at first', why: 'The timer works from the start; the code being timed changes.' },
      { t: 'To fill the sink before measuring', why: 'The sink is filled during warm-up too, but that is not why warm-up exists.' },
    ],
  },
];
