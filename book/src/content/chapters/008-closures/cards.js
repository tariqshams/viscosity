// Chapter 8 cards. Keys are stable ids: never rename them.

export const prompts = {
  'scope-what': {
    q: 'What is the *scope* of a name?',
    a: 'The region of code where that name can be used.',
  },
  'block-scope': {
    q: 'A `const` is declared inside an `if (...) { }` block. Where can it be used?',
    a: 'Only from its declaration to the closing `}` of that block. Outside it you get a ReferenceError.',
  },
  'see-outward': {
    q: 'Can code inside a function use a variable declared outside it? Can outside code use a variable declared inside?',
    a: 'Inside can see outward: yes. Outside can’t see inward: no.',
  },
  'lexical-where': {
    q: 'Lexical scope: is what a function can see decided by where it is *written* or where it is *called*?',
    a: 'Where it is written in the source code.',
  },
  'nested-sees': {
    q: 'A function `inner` is written inside `outer`. Can `inner` use `outer`’s parameters without being passed them?',
    a: 'Yes. A nested function can see every name of the function around it.',
  },
  'closure-what': {
    q: 'What is a closure?',
    a: 'A function together with the variables from the place it was written, which it keeps access to.',
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
  'loop-let': {
    q: 'In `for (let i = 0; i < 3; i++) { fs.push(() => i); }`, why does `fs[0]()` give `0`, not `3`?',
    a: 'With `let`, each pass of the loop gets its own fresh `i`, and each function closes over its own pass’s `i`.',
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
      'This is `makeCounter` with one change: add `n` instead of 1.',
      'Declare `let total = 0;` inside `makeTotal`, but *outside* the function you return.',
      'Return an arrow function `(n) => { ... }` that updates `total` and returns it.',
    ],
    walkthrough: `Where you declare \`total\` is the whole exercise.

- **Inside \`makeTotal\`.** Every call of \`makeTotal\` makes a fresh page, so each total gets its own variable. That's what makes them independent.
- **Outside the returned function.** If \`total\` were declared inside \`add\`, it would be created fresh on *every* \`add\` call and start from 0 each time.
- **The returned arrow** closes over \`total\`. It's the only code anywhere that can reach that variable, so the total is private.

\`\`\`js
function makeTotal() {
  let total = 0;          // one per makeTotal call
  return (n) => {
    total = total + n;    // the kept variable
    return total;
  };
}
\`\`\`

This "factory that returns a function with private state" pattern is everywhere: id generators, caches, and in Part III, the bits of an interpreter that hand out fresh names.`,
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
    walkthrough: `\`once\` needs memory between calls, so it needs a closure with two captured variables.

- **\`done\`** starts \`false\`. It answers "has \`f\` run yet?".
- **\`result\`** starts \`undefined\` and will hold whatever \`f\` returned.
- **The returned function** checks \`done\`. The first time, it calls \`f\`, stores the result and sets \`done\` to \`true\`. Every time, it returns \`result\`.

Why not just \`const r = f(); return () => r;\`? That calls \`f\` straight away, while \`once\` itself is running, before anyone has asked for the result. The third test catches exactly that. Deciding *when* work happens is a theme you'll meet again: in Part III, the interpreter only evaluates the branch of an \`if\` it actually takes.`,
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
    q: `What happens?
\`\`\`
if (true) {
  const z = 1;
}
console.log(z);
\`\`\``,
    options: [
      { t: 'It prints `1`', why: '`z` is block-scoped: it doesn’t exist after the closing `}`.' },
      { t: 'It prints `undefined`', why: 'A name that is out of scope isn’t `undefined`; it doesn’t exist at all here.' },
      { t: 'A ReferenceError: `z` is not defined', correct: true, why: '`const` is visible only inside its block, and this line is outside it.' },
      { t: 'It prints `true`', why: '`z` was set to `1`, and in any case it isn’t visible here.' },
    ],
  },
  {
    q: `What does this print?
\`\`\`
const x = 'outer';
function show() { console.log(x); }
function run() {
  const x = 'inner';
  show();
}
run();
\`\`\``,
    options: [
      { t: '`outer`', correct: true, why: 'Lexical scope: `show` was written at the top level, where the only `x` is `\'outer\'`. Where it is called from doesn’t matter.' },
      { t: '`inner`', why: 'That would be true if scope followed calls. JavaScript scope follows where code is written.' },
      { t: '`undefined`', why: '`show` can see the top-level `x`, which is `\'outer\'`.' },
      { t: 'A ReferenceError', why: 'The top-level `x` is visible inside `show`.' },
    ],
  },
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
    q: 'Why is `makeCounter`’s `count` safe from the rest of the program?',
    options: [
      { t: 'It is a `const`', why: 'It is a `let`; it changes on every call.' },
      { t: 'It is in `makeCounter`’s scope, and only the returned function can reach it', correct: true, why: 'Outer code can’t see into `makeCounter`. The only way to the variable is through the closure.' },
      { t: 'JavaScript locks variables inside functions', why: 'Nothing is locked. It’s simply not in scope anywhere else.' },
      { t: 'It isn’t: any code can change it', why: 'Code outside `makeCounter` can’t even name `count`, let alone change it.' },
    ],
  },
];
