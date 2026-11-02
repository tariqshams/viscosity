// Chapter 11 cards. Keys are stable ids: never rename them.

export const prompts = {
  'block-scope': {
    q: 'A `const` is declared inside an `if (...) { }` block. Where can it be used?',
    a: 'Only from its declaration to the closing `}` of that block. Outside it you get a ReferenceError.',
  },
  'see-outward': {
    q: 'Can code inside a function use a variable declared outside it? Can outside code use a variable declared inside?',
    a: 'Inside can see outward: yes. Outside can’t see inward: no.',
  },
  shadow: {
    q: '`const x = 1;` and then, inside a block, `const x = 2;`. What is `x` inside the block, and after it?',
    a: '`2` inside (the inner `x` shadows the outer one), and `1` after the block.',
  },
  'lookup-order': {
    q: 'In what order does JavaScript search for a name?',
    a: 'The innermost scope first, then each scope written around it, outward; if none has it, a ReferenceError.',
  },
  'loop-var': {
    q: 'Where can the `i` of `for (let i = 0; i < n; i++)` be used?',
    a: 'Only inside that loop; after the loop it is not defined.',
  },
  'python-block': {
    q: 'In Python, is a variable made inside an `if` block visible after the block?',
    a: 'Yes: Python has no block scope, only function (and module) scope.',
  },
  'lexical-where': {
    q: 'Lexical scope: is what a function can see decided by where it is *written* or where it is *called*?',
    a: 'Where it is written in the source code.',
  },
  'nested-sees': {
    q: 'A function `inner` is written inside `outer`. Can `inner` use `outer`’s parameters without being passed them?',
    a: 'Yes. A nested function can see every name of the function around it.',
  },
};

export const examples = {
  scopes: {
    title: 'Where each name can be seen',
    code: `const x = 'outer';

function show() {
  console.log(x);
}

function run() {
  const x = 'inner';
  show();
  const peek = () => console.log(x);
  peek();
}
run();

if (true) {
  const y = 1;
  console.log(y);
}
// console.log(y);`,
  },
};

export const exercises = {
  lastBig: {
    title: 'Fix the vanishing variable',
    prompt:
      '`lastBig(xs)` should return the **last** number in `xs` that is greater than 10, or `undefined` if there is none. The starter code throws `ReferenceError: found is not defined`. Fix it by changing where `found` is declared (and how it is set).',
    starter: `function lastBig(xs) {
  for (let i = 0; i < xs.length; i++) {
    if (xs[i] > 10) {
      const found = xs[i];
    }
  }
  return found;
}

console.log(lastBig([4, 12, 7, 30, 2]));`,
    solution: `function lastBig(xs) {
  let found;
  for (let i = 0; i < xs.length; i++) {
    if (xs[i] > 10) {
      found = xs[i];
    }
  }
  return found;
}`,
    tests: `test('the last big number', () => {
  expect(lastBig([4, 12, 7, 30, 2])).toBe(30);
});
test('only one big number', () => {
  expect(lastBig([11, 3])).toBe(11);
});
test('no big numbers', () => {
  expect(lastBig([1, 2, 3])).toBe(undefined);
});
test('empty array', () => {
  expect(lastBig([])).toBe(undefined);
});`,
    hints: [
      'Where is `found` declared, and where is it used? Draw the braces around each.',
      '`found` is declared inside the `if` block, so it is gone by the time `return found;` runs. It must be declared in a scope that also contains the `return`.',
      'Declare `let found;` before the loop (it starts as `undefined`), and inside the `if` write `found = xs[i];` with no `const`.',
    ],
    walkthrough: `**How to think about it.** Find the declaration and the use, and ask which braces each sits in. \`const found\` is declared inside the \`if\` block, which is inside the loop, which is inside the function; \`return found;\` sits only inside the function. Looking \`found\` up from the \`return\` searches the function's scope and then the program's, and neither has it (the block's scope is *inside*, and can't be seen from out there), hence the ReferenceError. So the declaration must move out to a scope that contains the \`return\`: the function's own scope, before the loop. Once it lives there, the loop must *change* that one variable rather than declare a new one each time.

**The solution, line by line.**

- \`function lastBig(xs) {\` is unchanged.
- \`  let found;\` declares \`found\` in the function's scope, so both the loop and the \`return\` can see it. With no value given it starts as \`undefined\`, which is exactly the answer we want if no number is big. It must be \`let\`, because it will change.
- \`  for (let i = 0; i < xs.length; i++) {\` visits every number.
- \`    if (xs[i] > 10) {\` picks out the big ones.
- \`      found = xs[i];\` has no \`let\` or \`const\`, so it declares nothing; it looks \`found\` up (block, no; loop, no; function, yes) and changes that variable. Each big number replaces the last one, so after the loop \`found\` holds the *last* big number: 12, then 30.
- \`    }\` and \`  }\` close the \`if\` and the loop.
- \`  return found;\` now finds \`found\` in the function's scope.

**Common wrong attempts.**

- Adding \`let found;\` before the loop but keeping \`const found = xs[i];\` inside: the inner \`const\` *shadows* the outer \`found\`, so the outer one is never changed and the function always returns \`undefined\`.
- \`const found;\` before the loop is refused outright (a \`const\` must be given a value, and could never be changed anyway).
- Returning from inside the \`if\` gives the *first* big number, 12, not the last.`,
    wrong: [
      {
        code: `function lastBig(xs) {
  let found;
  for (let i = 0; i < xs.length; i++) {
    if (xs[i] > 10) {
      const found = xs[i];
    }
  }
  return found;
}`,
        why: 'The inner `const found` is a second variable that shadows the outer one, so the outer `found` stays `undefined`. Assign to it instead: `found = xs[i];`.',
      },
      {
        code: `function lastBig(xs) {
  for (let i = 0; i < xs.length; i++) {
    if (xs[i] > 10) {
      return xs[i];
    }
  }
  return undefined;
}`,
        why: 'This returns the *first* number over 10 (12), not the last (30).',
      },
    ],
  },
  inRange: {
    optional: true,
    title: 'A callback that sees its surroundings',
    prompt:
      'Write `inRange(xs, lo, hi)` that returns a new array of the numbers in `xs` that are at least `lo` and at most `hi`, using `filter` with an arrow function written inside `inRange`. For example `inRange([1, 5, 9, 3], 2, 6)` is `[5, 3]`.',
    starter: `function inRange(xs, lo, hi) {
  // your code here
}

const xs = [1, 5, 9, 3];
console.log(inRange(xs, 2, 6));`,
    solution: `function inRange(xs, lo, hi) {
  return xs.filter((x) => {
    return x >= lo && x <= hi;
  });
}`,
    tests: `test('keeps the middle ones', () => {
  expect(inRange([1, 5, 9, 3], 2, 6)).toEqual([5, 3]);
});
test('ends are included', () => {
  expect(inRange([2, 6, 7], 2, 6)).toEqual([2, 6]);
});
test('nothing in range', () => {
  expect(inRange([1, 9], 3, 4)).toEqual([]);
});`,
    hints: [
      '`filter` keeps the items for which the callback returns `true`. What question should the callback ask about each number?',
      'The callback only receives one number, `x`. Where do `lo` and `hi` come from?',
      'Because the arrow is written inside `inRange`, it can use `lo` and `hi` directly: `xs.filter((x) => x >= lo && x <= hi)`.',
    ],
    walkthrough: `**How to think about it.** \`filter\` will call your callback once per number, passing only the number. Yet the question "is this between \`lo\` and \`hi\`?" needs two more values. You do not have to pass them: write the arrow function *inside* \`inRange\`, and by lexical scope it can see \`inRange\`'s parameters, \`lo\` and \`hi\`, as names in the room around it.

**The solution, line by line.**

- \`function inRange(xs, lo, hi) {\` takes the numbers and the two limits.
- \`  return xs.filter((x) => {\` hands \`filter\` an arrow function, a nested function of \`inRange\`, and returns the new array \`filter\` builds.
- \`    return x >= lo && x <= hi;\` is the callback's whole job: \`x\` is its own parameter, while \`lo\` and \`hi\` are found by looking outward, in \`inRange\`'s scope. \`&&\` requires both comparisons to be true, and \`>=\` and \`<=\` include the ends.
- \`  });\` closes the arrow function and the \`filter\` call, and \`}\` closes \`inRange\`.

**Common wrong attempts.**

- Writing the test as a separate top-level function, \`function ok(x) { return x >= lo && x <= hi; }\`, fails with a ReferenceError: written outside \`inRange\`, it cannot see \`lo\` or \`hi\`, wherever it is called from.
- \`x > lo && x < hi\` leaves out the ends, so the second test fails.`,
    wrong: [
      {
        code: `function inRange(xs, lo, hi) {
  return xs.filter((x) => {
    return x > lo && x < hi;
  });
}`,
        why: '`>` and `<` leave out numbers equal to `lo` or `hi`; the range should include its ends.',
      },
      {
        code: `function ok(x) {
  return x >= lo && x <= hi;
}
function inRange(xs, lo, hi) {
  return xs.filter(ok);
}`,
        why: '`ok` is written outside `inRange`, so by lexical scope it cannot see `lo` and `hi`: ReferenceError.',
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
    q: `What does this print?
\`\`\`
const n = 1;
{
  const n = 2;
  console.log(n);
}
console.log(n);
\`\`\``,
    options: [
      { t: '`2` then `2`', why: 'The inner `n` exists only inside its braces; after them, the outer `n` is visible again.' },
      { t: '`1` then `1`', why: 'Inside the block, the inner `n` shadows the outer one.' },
      { t: 'An error: `n` is declared twice', why: 'The two `n`s are in different scopes, which is allowed; only two in the same scope would be an error.' },
      { t: '`2` then `1`', correct: true, why: 'The inner `n` shadows the outer one inside the block; after the block, the outer `n` (1) is back.' },
    ],
  },
  {
    q: `Why does this throw a ReferenceError?
\`\`\`
function total(xs) {
  for (let i = 0; i < xs.length; i++) {
    let sum = 0;
    sum = sum + xs[i];
  }
  return sum;
}
\`\`\``,
    options: [
      { t: '`sum` must be a `const`', why: '`sum` changes, so `let` is right; the problem is where it is declared.' },
      { t: '`sum` is declared inside the loop’s braces, so the `return` cannot see it', correct: true, why: 'Block scope: `sum` ends at the loop’s closing `}`. Declare it before the loop.' },
      { t: '`xs[i]` is undefined', why: 'The loop reads only valid slots; the error is about the name `sum`.' },
      { t: 'Loops cannot declare variables', why: 'They can; those variables just belong to the loop.' },
    ],
  },
  {
    q: 'A variable is given the value 1 inside an `if` block and printed after the block. In which language does that print `1` rather than fail?',
    options: [
      { t: 'Java', why: 'Java has block scope, so using `a` after the block is a compile error.' },
      { t: 'Python', correct: true, why: 'Python’s scopes are whole functions and modules, so `a` is still visible after the `if`.' },
      { t: 'C', why: 'C has block scope: `a` is undeclared after the block.' },
      { t: 'JavaScript with `let`', why: '`let` is block-scoped, so this is a ReferenceError.' },
    ],
  },
];
