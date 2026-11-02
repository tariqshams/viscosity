// Chapter 65 cards. Keys are stable ids: never rename them.
// Every Drip snippet here was run on the companion interpreter.

export const prompts = {
  'drip-why': {
    q: 'Why does Part III build a small language of its own instead of JavaScript?',
    a: 'JavaScript is too big to implement fully while learning; Drip is small enough to finish, yet has closures and classes.',
  },
  'drip-twice': {
    q: 'In which two ways does this book implement Drip?',
    a: 'As a tree-walking interpreter (Part III) and as a bytecode VM (Part IV).',
  },
  'float-div': {
    q: 'What does `7 / 2` give in Drip, and why?',
    a: '`3.5`: every Drip number is a 64-bit float, as in JavaScript, so division does not round down.',
  },
  'fn-value': {
    q: 'Can a Drip function return another function?',
    a: 'Yes: functions are values, so they can be returned, stored in variables and passed around.',
  },
  'class-state': {
    q: 'Two instances of the same Drip class each set `this.n`. Do they share one `n`?',
    a: 'No: each instance has its own fields.',
  },
  'print-statement': {
    q: 'Is `print` a function in Drip?',
    a: 'No, it is a statement: `print x;` needs no parentheses.',
  },
  'zero-true': {
    q: 'In Drip, does `if (0) print "yes";` print anything?',
    a: 'Yes, it prints `yes`. Only `nil` and `false` count as false; `0` counts as true.',
  },
  'closure-drip': {
    q: 'A Drip function is created inside another function. What does it remember?',
    a: 'The variables around the place it was made, even after the outer call returns (a closure).',
  },
};

export const examples = {
  values: {
    title: 'Values and variables',
    lang: 'drip',
    code: `print 7 / 2;
print "drip" + "drop";
print 3 < 4 and 4 < 5;
print !true;
print nil;

let cups = 3;
cups = cups + 1;
print cups;
print 0.1 + 0.2;`,
  },
  control: {
    title: 'if, while and for',
    lang: 'drip',
    code: `let n = 1;
while (n < 50) {
  n = n * 2;
}
print n;

for (let i = 0; i < 3; i = i + 1) {
  print i;
}

if (0) print "0 is true";
else print "0 is false";`,
  },
  functions: {
    title: 'Functions and a closure',
    lang: 'drip',
    code: `fn square(x) {
  return x * x;
}
print square(4);

fn makeCounter() {
  let n = 0;
  fn count() {
    n = n + 1;
    return n;
  }
  return count;
}

let c = makeCounter();
print c();
print c();
print makeCounter;`,
  },
  classes: {
    title: 'Classes and inheritance',
    lang: 'drip',
    code: `class Cup {
  init(ml) {
    this.ml = ml;
  }
  pour(x) {
    this.ml = this.ml - x;
    return this.ml;
  }
}

class Mug < Cup {
  pour(x) {
    print "careful, hot";
    return super.pour(x);
  }
}

let m = Mug(300);
print m.pour(50);
print m;`,
  },
};

export const exercises = {
  'sum-to': {
    lang: 'drip',
    title: 'Add up 1 to n, in Drip',
    prompt:
      'Write a Drip function `sumTo(n)` that **returns** `1 + 2 + … + n`. The program then prints `sumTo(10)` and `sumTo(100)`, so the expected output is `55` and then `5050`.',
    starter: `fn sumTo(n) {
  // your code here
}

print sumTo(10);
print sumTo(100);`,
    solution: `fn sumTo(n) {
  let total = 0;
  for (let i = 1; i <= n; i = i + 1) {
    total = total + i;
  }
  return total;
}

print sumTo(10);
print sumTo(100);`,
    tests: `55
5050`,
    hints: [
      'Start a running total at 0 with `let`, then add each number from 1 to n.',
      'Drip has no `++` or `+=`. Write `i = i + 1` and `total = total + i`.',
      'Make sure the loop includes n itself (`i <= n`), and that the function ends with `return total;`.',
    ],
    walkthrough: `**How to think about it.** Do it by hand first for a small n: the sum up to 4 is 1 + 2 + 3 + 4, which is 10, and you get there by keeping a running total and adding each number in turn. That is a loop with a counter that goes from 1 up to n, *including* n, and a total that starts at 0. In Drip the only new parts are the spelling: \`fn\` and \`let\`, and the step written out in full because there is no \`++\` or \`+=\`. The tests check the printed output, so the function must *return* the total and let the two \`print\` lines show it.

**The solution, line by line.**

- \`fn sumTo(n) {\` declares a function called \`sumTo\` with one parameter.
- \`let total = 0;\` makes the running total inside the function, so every call starts again from zero.
- \`for (let i = 1; i <= n; i = i + 1) {\` counts \`i\` from 1 while it is at most \`n\`; the condition is \`<=\` because \`n\` itself must be added, and the step is \`i = i + 1\` in full.
- \`total = total + i;\` adds the current number to the total (again, no \`+=\`).
- \`}\` ends the loop, and \`return total;\` hands the sum back to the caller.
- \`}\` ends the function; the two \`print\` lines then show \`55\` and \`5050\`.

Check: 1 + 2 + ... + 10 is 55, and 1 + ... + 100 is 5050 (pair 1 with 100, 2 with 99, and so on: fifty pairs of 101).

**Common wrong attempts.**

- \`i < n\` instead of \`i <= n\`: the loop stops before adding \`n\`, so you get 45 and 4950.
- \`print total;\` instead of \`return total;\`: the function prints inside itself and then returns nothing, which in Drip is \`nil\`, so the output has an extra \`nil\` after each number.
- \`total += i;\` or \`i++\`: Drip has neither, so the program does not even start; the parser reports \`Expect expression.\` at the \`=\`.`,
    wrong: [
      {
        code: `fn sumTo(n) {
  let total = 0;
  for (let i = 1; i < n; i = i + 1) {
    total = total + i;
  }
  return total;
}

print sumTo(10);
print sumTo(100);`,
        why: 'With `i < n` the loop stops before adding `n`, so you get 45 and 4950. Use `i <= n`.',
      },
      {
        code: `fn sumTo(n) {
  let total = 0;
  for (let i = 1; i <= n; i = i + 1) {
    total = total + i;
  }
  print total;
}

print sumTo(10);
print sumTo(100);`,
        why: 'This prints the total inside the function and then returns nothing, so each call also prints `nil`. Use `return total;`.',
      },
    ],
  },
  'counter-class': {
    optional: true,
    lang: 'drip',
    title: 'A counter class',
    prompt:
      'Write a Drip class `Counter`. Its `init()` sets a field `n` to 0. Its method `inc()` adds 1 to `n` and **returns** the new value. Each instance has its own count, so the program below should print `1`, `2`, then `1`.',
    starter: `class Counter {
  // your code here
}

let a = Counter();
print a.inc();
print a.inc();
let b = Counter();
print b.inc();`,
    solution: `class Counter {
  init() {
    this.n = 0;
  }
  inc() {
    this.n = this.n + 1;
    return this.n;
  }
}

let a = Counter();
print a.inc();
print a.inc();
let b = Counter();
print b.inc();`,
    tests: `1
2
1`,
    hints: [
      'Methods are written inside the class body with no `fn` keyword: `init() { ... }`.',
      'Fields live on `this`: `this.n = 0;` in `init`.',
      'In `inc`, change `this.n`, not a plain `n`: a bare `n` is a variable lookup, and there is no variable called `n`.',
    ],
    walkthrough: `**How to think about it.** A counter needs a number that survives between calls to \`inc\`, and each counter needs its *own* number, so that \`b\` starts again at 1. That is exactly what a field on an instance gives you: \`init\` runs once for each new instance and can set \`this.n\` to 0, and every method of that instance can read and change it through \`this\`. Methods in a Drip class body are written without \`fn\`.

**The solution, line by line.**

- \`class Counter {\` starts the class.
- \`init() {\` is the constructor: calling \`Counter()\` makes a new instance and runs \`init\` on it.
- \`this.n = 0;\` gives the new instance its own field \`n\`, starting at 0, and \`}\` ends \`init\`.
- \`inc() {\` is the method that counts.
- \`this.n = this.n + 1;\` reads the field, adds 1 and stores it back (no \`+=\` in Drip).
- \`return this.n;\` hands back the new value, so \`print a.inc();\` has something to print; \`}\` ends the method and the next \`}\` the class.

Then \`a\` counts \`1\`, \`2\`, and \`b\`, a new instance with its own \`n\`, prints \`1\`. Compare with \`makeCounter\` in the functions example: a class and a closure are two ways to keep private state alive between calls.

**Common wrong attempts.**

- Writing \`n = n + 1;\` without \`this.\`: a bare \`n\` is a variable, not the field, and there is no variable called \`n\`, so Drip stops with \`Undefined variable 'n'.\`
- Forgetting \`return this.n;\`: the count goes up, but \`inc\` returns \`nil\`, so every line prints \`nil\`.
- Writing \`fn inc() {\` inside the class: methods take no \`fn\`, so the parser reports an error.`,
    wrong: [
      {
        code: `class Counter {
  init() {
    this.n = 0;
  }
  inc() {
    n = n + 1;
    return n;
  }
}

let a = Counter();
print a.inc();
print a.inc();
let b = Counter();
print b.inc();`,
        why: 'A bare `n` is not the field: Drip looks for a variable `n`, finds none, and stops with “Undefined variable \'n\'.”. Write `this.n`.',
      },
      {
        code: `class Counter {
  init() {
    this.n = 0;
  }
  inc() {
    this.n = this.n + 1;
  }
}

let a = Counter();
print a.inc();
print a.inc();
let b = Counter();
print b.inc();`,
        why: 'The count goes up, but `inc` returns nothing, so every `print` shows `nil`. End with `return this.n;`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'What does `print 7 / 2;` show in Drip?',
    options: [
      { t: '`3`', why: 'Drip has one kind of number, a 64-bit float, so division doesn’t round down.' },
      { t: '`3.5`', correct: true, why: 'Numbers are floats, like JavaScript’s, and whole numbers print without a decimal point.' },
      { t: '`3.50`', why: 'Drip prints numbers the way JavaScript’s `String` does: no trailing zeros.' },
      { t: 'A runtime error', why: 'Both operands are numbers, so `/` is fine.' },
    ],
  },
  {
    q: 'What does this Drip program print?\n```\nif ("") print "yes";\nelse print "no";\n```',
    options: [
      { t: '`no`', why: 'That’s what JavaScript would do. In Drip, the empty string counts as true.' },
      { t: 'Nothing', why: 'One of the two branches always runs.' },
      { t: 'A runtime error', why: 'Any value can be a condition in Drip.' },
      { t: '`yes`', correct: true, why: 'Only `nil` and `false` are false. `""` is a string, so it counts as true.' },
    ],
  },
  {
    q: 'Which of these values does Drip treat as false in an `if`?',
    options: [
      { t: '`0`', why: 'That is JavaScript’s rule. In Drip, every number is true.' },
      { t: '`nil`', correct: true, why: 'Only `nil` and `false` are false in Drip.' },
      { t: '`""`', why: 'The empty string is still a string, and every string is true in Drip.' },
      { t: 'a function', why: 'Functions are values like any other, and true.' },
    ],
  },
  {
    q: 'Every runnable Drip box in Part III runs on which implementation?',
    options: [
      { t: 'The bytecode VM', why: 'The VM comes in Part IV.' },
      { t: 'JavaScript’s own engine, directly', why: 'Drip is not JavaScript; it needs its own interpreter, even though that interpreter is written in TypeScript.' },
      { t: 'The tree-walking interpreter you are about to build', correct: true, why: 'Part III builds it, and the companion code is a finished copy of it.' },
      { t: 'None: the boxes only show the code', why: 'They really run; edit them and run them again.' },
    ],
  },
  {
    q: 'What does this print?\n```\nfn make() {\n  let n = 0;\n  fn inc() {\n    n = n + 1;\n    return n;\n  }\n  return inc;\n}\nlet a = make();\nlet b = make();\nprint a();\nprint a();\nprint b();\n```',
    options: [
      { t: '`1`, `2`, `3`', why: 'That would mean `a` and `b` share one `n`. Each call to `make` creates a new one.' },
      { t: '`1`, `1`, `1`', why: 'The closure keeps its `n` between calls, so `a` counts up.' },
      { t: '`0`, `1`, `0`', why: '`inc` adds 1 before returning, so the first call returns 1.' },
      { t: '`1`, `2`, `1`', correct: true, why: '`a` and `b` each close over their own `n`. `a` counts 1, 2 and `b` starts again at 1.' },
    ],
  },
];
