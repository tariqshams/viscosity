// Chapter 1 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'fn-what': {
    q: 'In one sentence: what is a function?',
    a: 'A named piece of work (a block of code) that runs whenever you call it.',
  },
  'define-vs-call': {
    q: 'Does writing `function double(n) { return n * 2; }` compute anything?',
    a: 'No. It only defines the function (puts the recipe on the shelf). Work happens when you call it, e.g. `double(3)`.',
  },
  'parens-needed': {
    q: 'What is the difference between writing `double` and writing `double(3)`?',
    a: '`double` on its own only names the function; the parentheses are what call it and run its body.',
  },
  'param-vs-arg': {
    q: 'In `function double(n) { ... }` called as `double(3)`, which is the **parameter** and which is the **argument**?',
    a: '`n` is the parameter (the placeholder name in the definition). `3` is the argument (the actual value passed in this call).',
  },
  'by-position': {
    q: 'With `function minus(a, b) { return a - b; }`, why is `minus(3, 10)` different from `minus(10, 3)`?',
    a: 'Arguments are matched to parameters by position, so the first call has `a = 3, b = 10` (giving -7) and the second `a = 10, b = 3` (giving 7).',
  },
  'return-two-jobs': {
    q: 'What two things does `return` do?',
    a: 'It decides the value the call produces, and it stops the function immediately.',
  },
  'call-is-value': {
    q: 'If `double(3)` returns `6`, what is `double(3) + 1`?',
    a: '`7`: the call is replaced by its returned value, so it is `6 + 1`.',
  },
  'return-stops': {
    q: 'A function has `return 1;` on one line and `console.log("hi");` on the next. When the `return` runs, is "hi" printed?',
    a: 'No. `return` ends the call at once, so the lines after it never run.',
  },
};

export const examples = {
  double: {
    title: 'A function that doubles',
    code: `function double(n) {
  return n * 2;
}

console.log(double(3));
console.log(double(10));
console.log(double(3) + 1);`,
  },
};

export const exercises = {
  average: {
    title: 'The average of two numbers',
    prompt: 'Write a function `average(a, b)` that **returns** the average of its two arguments. For example `average(2, 4)` should return `3`.',
    starter: `function average(a, b) {
  // your code here
}

console.log(average(2, 4));`,
    solution: `function average(a, b) {
  return (a + b) / 2;
}`,
    tests: `test('average(2, 4) is 3', () => {
  expect(average(2, 4)).toBe(3);
});
test('average(1, 2) is 1.5', () => {
  expect(average(1, 2)).toBe(1.5);
});
test('works with negatives', () => {
  expect(average(-10, 10)).toBe(0);
});
test('returns, not just prints', () => {
  expect(typeof average(1, 1)).toBe('number');
});`,
    hints: [
      'Say it in words first: how do you work out the average of two numbers on paper?',
      'The average is the sum of the two numbers, divided by 2. The tests look at the value the call *produces*, so the body needs a `return`.',
      'Division happens before addition, so `a + b / 2` only halves `b`. Put brackets round the sum: `return (a + b) / 2;`.',
    ],
    walkthrough: `**How to think about it.** Before writing any code, do one by hand: the average of 2 and 4 is "add them, then halve the total", so 2 + 4 = 6 and 6 / 2 = 3. A function is that same recipe with the particular numbers replaced by the parameters \`a\` and \`b\`. The tests call \`average(...)\` and check what comes back, so the answer must leave through \`return\`, not through \`console.log\`.

**The solution, line by line.**

- \`function average(a, b) {\` defines a function called \`average\` with two parameters. In the call \`average(2, 4)\`, \`a\` holds \`2\` and \`b\` holds \`4\`, matched by position.
- \`  return (a + b) / 2;\` works out the sum first (the brackets make sure of that), divides it by 2, and sends the result back to whoever called. For \`average(2, 4)\` that is \`(2 + 4) / 2\`, which is \`6 / 2\`, which is \`3\`; for \`average(1, 2)\` it is \`1.5\`, because JavaScript numbers can have a fractional part.
- \`}\` closes the body.

**Common wrong attempts.**

- \`return a + b / 2;\` looks right but is not: as in maths class, division happens before addition, so this is \`a + (b / 2)\`, and \`average(2, 4)\` gives \`2 + 2\`, which is \`4\`.
- \`console.log((a + b) / 2);\` with no \`return\` *prints* the right number, so it looks as if it works, but the call itself produces nothing (JavaScript's \`undefined\`, which the next chapter explains), so any code that wanted to use the average gets nothing.`,
    wrong: [
      {
        code: `function average(a, b) {
  return a + b / 2;
}`,
        why: '`average(2, 4)` gives `4`, not `3`, because `b / 2` is worked out first. Add brackets: `(a + b) / 2`.',
      },
      {
        code: `function average(a, b) {
  console.log((a + b) / 2);
}`,
        why: 'This *prints* the right number but the call produces `undefined`, so the tests fail. Printing is not returning.',
      },
    ],
  },
  clamp: {
    optional: true,
    title: 'Keep a number in range',
    prompt: 'Write `clamp(x, lo, hi)`: it returns `lo` if `x` is below `lo`, returns `hi` if `x` is above `hi`, and otherwise returns `x` unchanged. Games use this all the time, for example to keep a player inside the screen.',
    starter: `function clamp(x, lo, hi) {
  // your code here
}

console.log(clamp(15, 0, 10));`,
    solution: `function clamp(x, lo, hi) {
  if (x < lo) {
    return lo;
  }
  if (x > hi) {
    return hi;
  }
  return x;
}`,
    tests: `test('below the range gives lo', () => {
  expect(clamp(-5, 0, 10)).toBe(0);
});
test('above the range gives hi', () => {
  expect(clamp(15, 0, 10)).toBe(10);
});
test('inside the range is unchanged', () => {
  expect(clamp(7, 0, 10)).toBe(7);
});
test('the edges are inside', () => {
  expect(clamp(0, 0, 10)).toBe(0);
  expect(clamp(10, 0, 10)).toBe(10);
});`,
    hints: [
      'Picture a number line from `lo` to `hi`. Where can `x` be? There are three places.',
      'The three cases are: too small, too big, and just right. Each can end with its own `return`.',
      'Write `if (x < lo) { return lo; }`, then the same for `hi`. Because `return` stops the function, a last line `return x;` only runs when neither `if` matched.',
    ],
    walkthrough: `**How to think about it.** Draw a number line with \`lo\` on the left and \`hi\` on the right. A value \`x\` is either to the left of \`lo\` (too small), to the right of \`hi\` (too big), or somewhere between them, edges included (just right). Each case has an obvious answer, so the function is three cases, and \`return\` lets each case finish the call on its own.

**The solution, line by line.**

- \`function clamp(x, lo, hi) {\` takes three parameters: the value, the lower limit and the upper limit.
- \`  if (x < lo) {\` asks whether \`x\` is too small.
- \`    return lo;\` answers with the lower limit, and stops: nothing below this runs for a too-small \`x\`.
- \`  }\` ends that case.
- \`  if (x > hi) {\` is only reached when \`x\` was not too small; it asks whether it is too big.
- \`    return hi;\` answers with the upper limit and stops.
- \`  }\` ends that case.
- \`  return x;\` is only reached when both checks failed, which means \`x\` is already in range, so it comes back unchanged. No \`else\` is needed, because each earlier \`return\` already left the function. (This "check the special cases first and leave early" style is very common in compilers.)
- \`}\` closes the body.

For \`clamp(15, 0, 10)\`: \`15 < 0\` is false, \`15 > 10\` is true, so the answer is \`10\`. For \`clamp(10, 0, 10)\`: neither check is true, because \`10 > 10\` is false, so the answer is \`10\` from the last line.

**Common wrong attempts.**

- Changing \`x\` inside the \`if\`s (\`x = lo;\`) but never writing \`return x;\` at the end: the logic is right, but nothing comes out of the call.
- Checking only one side: \`clamp(15, 0, 10)\` then returns \`15\`.`,
    wrong: [
      {
        code: `function clamp(x, lo, hi) {
  if (x < lo) {
    x = lo;
  }
  if (x > hi) {
    x = hi;
  }
}`,
        why: 'The logic is right, but nothing is returned, so every call produces `undefined`. Add `return x;` at the end.',
      },
      {
        code: `function clamp(x, lo, hi) {
  if (x <= lo) {
    return lo;
  }
  return x;
}`,
        why: 'This forgets the upper limit: `clamp(15, 0, 10)` returns `15`. (Using `<=` is fine here, since `x === lo` gives `lo` either way.)',
      },
    ],
  },
};

export const quiz = [
  {
    q: `What does this print?
\`\`\`
function f(n) {
  return n + 1;
}
console.log(f(f(1)));
\`\`\``,
    options: [
      {
        t: '`2`',
        why: 'That is `f(1)`. But that result is fed into `f` again.',
      },
      {
        t: '`3`',
        correct: true,
        why: 'The inner call runs first: `f(1)` is `2`. Then `f(2)` is `3`.',
      },
      {
        t: '`1`',
        why: 'Each call adds 1, and there are two calls.',
      },
    ],
  },
  {
    q: `What does this print?
\`\`\`
function g(x) {
  if (x > 0) {
    return 'yes';
  }
  return 'no';
  console.log('done');
}
console.log(g(5));
\`\`\``,
    options: [
      {
        t: '`yes` then `done`',
        why: 'The `console.log(\'done\')` comes after a `return`, so it never runs.',
      },
      {
        t: '`yes`',
        correct: true,
        why: '`x > 0`, so `return \'yes\'` runs and the function stops immediately.',
      },
      {
        t: '`no`',
        why: '5 is greater than 0, so the first `return` runs.',
      },
    ],
  },
  {
    q: 'With `function minus(a, b) { return a - b; }`, what is `minus(2, 9)`?',
    options: [
      {
        t: '`7`',
        why: 'That would be `9 - 2`. The first argument goes to `a`, so this is `2 - 9`.',
      },
      {
        t: '`11`',
        why: 'The body subtracts; it does not add.',
      },
      {
        t: '`-7`',
        correct: true,
        why: 'By position, `a` is 2 and `b` is 9, and `2 - 9` is `-7`.',
      },
    ],
  },
  {
    q: 'Which line **calls** a function (rather than defining it)?',
    options: [
      {
        t: '`const s = square(4);`',
        correct: true,
        why: 'Name followed by parentheses with arguments: the function runs, and `s` becomes `16`.',
      },
      {
        t: '`function square(x) { return x * x; }`',
        why: 'That defines `square`; it computes nothing yet.',
      },
      {
        t: '`return x * x;`',
        why: 'That is a statement inside the body of a definition.',
      },
      {
        t: '`square`',
        why: 'The name alone refers to the function without running it. The parentheses are what call it.',
      },
    ],
  },
  {
    q: 'What is one real difference between the JavaScript and the Java version of `area(w, h)`?',
    options: [
      {
        t: 'Java has no `return`',
        why: 'Both use `return` to send the answer back.',
      },
      {
        t: 'Java calls functions without parentheses',
        why: 'Java calls `area(3, 4)` exactly the way JavaScript does.',
      },
      {
        t: 'Java makes you write the type of each parameter and of the result',
        correct: true,
        why: '`static int area(int w, int h)` says both parameters and the answer are whole numbers; JavaScript checks no types.',
      },
    ],
  },
];
