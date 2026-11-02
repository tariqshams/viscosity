// Chapter 11b cards (split from chapter 11). Keys are stable ids: never rename them.

export const prompts = {
  'closure-what': {
    q: 'What is a closure?',
    a: 'A function together with the variables from the place it was written, which it keeps access to.',
  },
  'times-k': {
    q: '`const triple = times(3);` How does `triple` still know `k` after `times` has returned?',
    a: 'It is a closure: it kept an arrow to the page of that call, where `k` is 3.',
  },
  'page-survives': {
    q: 'Why isn’t `makeCounter`’s `count` thrown away when `makeCounter` returns?',
    a: 'The returned function still points at the page holding `count`, and a page is only thrown away once nothing points at it.',
  },
  'two-counters': {
    q: '`const a = makeCounter(); const b = makeCounter();` After `a(); a();`, what does `b()` return?',
    a: '`1`. Each call to `makeCounter` made its own page, so `b` has its own `count`.',
  },
  'live-not-copy': {
    q: '`let n = 1; const f = () => n; n = 5;` What does `f()` return?',
    a: '`5`. A closure holds the variable itself, not a copy of its value when the function was made.',
  },
  'alias-closure': {
    q: '`const a = makeCounter(); const b = a;` Do `a` and `b` have separate counts?',
    a: 'No: `b = a` copies the arrow to the one function, so they share one `count`.',
  },
  'loop-let': {
    q: 'In `for (let i = 0; i < 3; i++) { fs.push(() => i); }`, why does `fs[0]()` give `0`, not `3`?',
    a: 'With `let`, each pass of the loop gets its own fresh `i`, and each function closes over its own pass’s `i`.',
  },
  'private-why': {
    q: 'Why can no other code change `makeCounter`’s `count`?',
    a: 'It is in `makeCounter`’s scope, which outside code cannot see into; the only way to reach it is through the returned function.',
  },
};

export const examples = {
  counters: {
    title: 'Two private counters',
    code: `function makeCounter() {
  let count = 0;
  return () => {
    count = count + 1;
    return count;
  };
}

const a = makeCounter();
const b = makeCounter();
console.log(a(), a(), a());
console.log(b());
console.log(a());`,
  },
};

export const exercises = {
  makeTotal: {
    title: 'A private running total',
    prompt:
      'Write `makeTotal()`. It returns a function `add(n)` that adds `n` to a running total and returns the new total. The total starts at `0`, is private, and every call of `makeTotal` gets its own. So after `const add = makeTotal();`, `add(5)` is `5` and then `add(3)` is `8`.',
    starter: `function makeTotal() {
  // your code here
}

const add = makeTotal();
console.log(add(5));
console.log(add(3));`,
    solution: `function makeTotal() {
  let total = 0;
  return (n) => {
    total = total + n;
    return total;
  };
}`,
    tests: `test('keeps a running total', () => {
  const add = makeTotal();
  expect(add(5)).toBe(5);
  expect(add(3)).toBe(8);
});
test('starts at 0', () => {
  const add = makeTotal();
  expect(add(0)).toBe(0);
});
test('totals are independent', () => {
  const a = makeTotal();
  const b = makeTotal();
  a(10);
  a(10);
  expect(b(1)).toBe(1);
  expect(a(1)).toBe(21);
});`,
    hints: [
      'What has to be remembered between calls of `add`, and how many of it should each `makeTotal()` call make?',
      'This is `makeCounter` with one change: add `n` instead of 1.',
      'Declare `let total = 0;` inside `makeTotal`, but *outside* the function you return.',
      'Return an arrow function `(n) => { ... }` that updates `total` and returns it.',
    ],
    walkthrough: `**How to think about it.** Two things must be true at once. The total must be *remembered* between calls of \`add\`, so it cannot be a local variable of \`add\` (a fresh page on every call would reset it). And each \`makeTotal()\` must give a *separate* total, so it cannot live outside \`makeTotal\` either (then every adder would share it). The one place that satisfies both is inside \`makeTotal\` but outside the function it returns: one new variable per \`makeTotal\` call, kept alive by the closure. That is \`makeCounter\` with "add 1" replaced by "add \`n\`".

**The solution, line by line.**

- \`function makeTotal() {\` is the factory; each call of it makes one running total.
- \`  let total = 0;\` lives on the page of *this* call of \`makeTotal\`. It is a \`let\` because it will change.
- \`  return (n) => {\` creates and returns the adder. Because it is written inside \`makeTotal\`, it can see \`total\` (lexical scope), and because it is returned, it keeps that page alive after \`makeTotal\` finishes (a closure).
- \`    total = total + n;\` finds \`total\` on the kept page and changes it there: 0 becomes 5 after \`add(5)\`.
- \`    return total;\` sends back the new total; the next call, \`add(3)\`, finds the same variable holding 5 and returns 8.
- \`  };\` and \`}\` close the adder and the factory.

In the independence test, \`a\` and \`b\` come from two calls of \`makeTotal\`, so they hold arrows to two different pages, and \`a(10)\` twice leaves \`b\`'s total at 0. Nothing outside can reach either total except through its adder, so the total is private too.

**Common wrong attempts.**

- Declaring \`let total = 0;\` *inside* the arrow function makes a fresh total on every call of \`add\`, so \`add(5)\` then \`add(3)\` returns 3, not 8.
- Declaring it *outside* \`makeTotal\`, at the top of the program, makes every adder share one total (and lets any code change it), so the independence test fails.
- Returning \`total\` itself (\`return total;\` instead of returning a function) hands back the number 0, and \`add(5)\` then fails with "add is not a function".`,
    wrong: [
      {
        code: `function makeTotal() {
  return (n) => {
    let total = 0;
    total = total + n;
    return total;
  };
}`,
        why: '`total` is declared inside `add`, so each call starts a new total at 0: `add(5)` then `add(3)` gives `3`, not `8`. Move `let total = 0;` out one level.',
      },
      {
        code: `let total = 0;
function makeTotal() {
  return (n) => {
    total = total + n;
    return total;
  };
}`,
        why: 'Now every adder shares ONE `total` outside `makeTotal`, and so does any other code. The independence test fails. Declaring it inside `makeTotal` gives each call its own.',
      },
    ],
  },
  once: {
    optional: true,
    title: 'Run only once',
    prompt:
      'Write `once(f)`. It returns a new function. The first time that function is called, it calls `f()` and returns its result. Every later call returns that same result **without** calling `f` again. `f` must not be called before the first call.',
    starter: `function once(f) {
  // your code here
}

const hi = once(() => {
  console.log('working...');
  return 42;
});
console.log(hi());
console.log(hi());`,
    solution: `function once(f) {
  let done = false;
  let result;
  return () => {
    if (done === false) {
      result = f();
      done = true;
    }
    return result;
  };
}`,
    tests: `test('returns what f returns', () => {
  const g = once(() => 42);
  expect(g()).toBe(42);
  expect(g()).toBe(42);
});
test('calls f only once', () => {
  let calls = 0;
  const g = once(() => {
    calls++;
    return calls;
  });
  g();
  g();
  g();
  expect(calls).toBe(1);
});
test('waits for the first call', () => {
  let calls = 0;
  once(() => {
    calls++;
  });
  expect(calls).toBe(0);
});`,
    hints: [
      'The returned function needs to remember two things between calls: whether `f` has run, and what it returned.',
      'Keep them as `let` variables inside `once`, outside the returned function.',
      'In the returned function: if not done yet, call `f`, save the result and mark it done. Always return the saved result.',
    ],
    walkthrough: `**How to think about it.** The function \`once\` returns has to remember two things between its own calls: whether \`f\` has run yet, and what \`f\` returned. Memory between calls of a function means variables in a closure: declared inside \`once\`, outside the returned function. Then the returned function makes a decision on every call: the first time, do the work and save the answer; every later time, hand back the saved answer. Notice also *when* \`f\` must run: not while \`once(f)\` itself is running, but only when someone first calls the returned function (the third test checks exactly that).

**The solution, line by line.**

- \`function once(f) {\` takes the function to protect.
- \`  let done = false;\` answers "has \`f\` run yet?". It lives on \`once\`'s page, so it survives between calls of the returned function.
- \`  let result;\` will hold what \`f\` returned; it starts as \`undefined\`.
- \`  return () => {\` returns the guarded function, a closure over \`done\`, \`result\` and \`f\`. Nothing has called \`f\` yet.
- \`    if (done === false) {\` is true only on the first call.
- \`      result = f();\` calls \`f\` and saves its answer on the kept page.
- \`      done = true;\` makes sure the \`if\` is false on every later call.
- \`    }\` ends the \`if\`.
- \`    return result;\` runs on every call, returning the saved answer (42 in the first test, both times).
- \`  };\` and \`}\` close the returned function and \`once\`.

**Common wrong attempts.**

- \`const r = f(); return () => r;\` calls \`f\` straight away, while \`once(f)\` is running, even if nobody ever calls the result; the test "waits for the first call" catches it.
- Declaring \`done\` and \`result\` *inside* the returned function resets \`done\` to \`false\` on every call, so \`f\` runs every time.
- Checking \`if (result === undefined)\` instead of keeping \`done\` works for the tests here, but breaks for an \`f\` that genuinely returns \`undefined\`: it would run again on every call. A separate flag says exactly what you mean.`,
    wrong: [
      {
        code: `function once(f) {
  const r = f();
  return () => r;
}`,
        why: 'This calls `f` immediately, when `once(f)` runs, even if the returned function is never called. The test “waits for the first call” fails.',
      },
      {
        code: `function once(f) {
  return () => {
    let done = false;
    let result;
    if (done === false) {
      result = f();
      done = true;
    }
    return result;
  };
}`,
        why: '`done` is declared inside the returned function, so it is reset to `false` on every call, and `f` runs every time. Move both variables out one level.',
      },
    ],
  },
};

export const quiz = [
  {
    q: '`const a = makeCounter(); const b = makeCounter();` Then `a(); a(); a();`. What does `b()` return?',
    options: [
      { t: '`4`', why: 'That would need `a` and `b` to share one `count`. They don’t.' },
      { t: '`3`', why: 'That is `a`’s count. `b` has never been called before.' },
      { t: '`0`', why: '`b()` adds one before returning, so it returns 1.' },
      { t: '`1`', correct: true, why: 'Each `makeCounter()` call made its own page with its own `count`, so `b` starts from 0 and returns 1.' },
    ],
  },
  {
    q: `What does this print?
\`\`\`
let n = 1;
const f = () => n * 10;
n = 5;
console.log(f());
\`\`\``,
    options: [
      { t: '`10`', why: 'A closure doesn’t take a snapshot of `n` when it is made.' },
      { t: '`50`', correct: true, why: '`f` reads the variable `n` itself when it runs, and by then `n` is 5.' },
      { t: '`undefined`', why: '`f` can see `n`, which is in scope where `f` is written.' },
      { t: 'An error, because `n` changed', why: '`n` is a `let`, so changing it is fine.' },
    ],
  },
  {
    q: 'Which best describes a closure?',
    options: [
      { t: 'A function that has finished running', why: 'Closures are about what a function can *see*, not whether it has run.' },
      { t: 'A copy of all the program’s variables', why: 'A closure keeps access to the variables where it was written, live, not a copy of everything.' },
      { t: 'A function together with the variables from the place it was written', correct: true, why: 'That is the definition: the function keeps access to its surrounding variables even after that code has finished.' },
      { t: 'A way to stop a function from being called', why: 'That’s not what closures do (though you could build one, like `once`, *with* a closure).' },
    ],
  },
  {
    q: `What does this print?
\`\`\`
const fs = [];
for (let i = 0; i < 3; i++) {
  fs.push(() => i * 10);
}
console.log(fs[1]());
\`\`\``,
    options: [
      { t: '`30`', why: 'That is what `var` would give (one shared `i`, left at 3). With `let`, each pass has its own `i`.' },
      { t: '`10`', correct: true, why: '`fs[1]` was made on the pass where its own `i` was 1, so it returns 1 × 10.' },
      { t: '`0`', why: 'That is `fs[0]()`.' },
      { t: 'A ReferenceError, because the loop is over', why: 'The closure keeps its pass’s `i` alive after the loop ends.' },
    ],
  },
  {
    q: 'Why is `makeCounter`’s `count` safe from the rest of the program?',
    options: [
      { t: 'It is a `const`', why: 'It is a `let`; it changes on every call.' },
      { t: 'JavaScript locks variables inside functions', why: 'Nothing is locked. It’s simply not in scope anywhere else.' },
      { t: 'It isn’t: any code can change it', why: 'Code outside `makeCounter` can’t even name `count`, let alone change it.' },
      { t: 'It is in `makeCounter`’s scope, and only the returned function can reach it', correct: true, why: 'Outer code can’t see into `makeCounter`. The only way to the variable is through the closure.' },
    ],
  },
];
