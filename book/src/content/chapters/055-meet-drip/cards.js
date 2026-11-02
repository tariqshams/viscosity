// Chapter 55 cards. Keys are stable ids: never rename them.
// Every Drip snippet here was run on the companion interpreter.

export const prompts = {
  'drip-lox': {
    q: 'Drip is a dialect of which language, and which two keywords are respelled?',
    a: 'Lox, from Crafting Interpreters. `fun` becomes `fn` and `var` becomes `let`.',
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
  'inherit-syntax': {
    q: 'How do you write “class `Mug` inherits from class `Cup`” in Drip?',
    a: '`class Mug < Cup { ... }`',
  },
  'dyn-when': {
    q: 'In a dynamically typed language like Drip, when is a type error found?',
    a: 'While the program runs, at the moment the operation with the wrong types runs.',
  },
  'dyn-vs-js': {
    q: 'What does `"a" + 1` do in Drip, and in JavaScript?',
    a: 'Drip stops with a runtime error. JavaScript converts the 1 and gives `"a1"`.',
  },
  'spec-what': {
    q: 'What is a language specification for?',
    a: 'To say precisely what every program means, so that every implementation behaves the same way.',
  },
  'corpus-role': {
    q: 'How is Drip’s meaning pinned down in this book?',
    a: 'By 265 test programs whose comments give the exact expected output or error; both implementations must pass them.',
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
print 0.1 + 0.2;

// print "a" + 1;`,
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
    walkthrough: `This is the same loop you'd write in JavaScript, with Drip spelling.

- **A running total.** \`let total = 0;\` inside the function, so every call starts from zero.
- **The loop.** \`for (let i = 1; i <= n; i = i + 1)\`. Drip has no \`++\`, so the step is written out in full. The condition is \`<=\` because \`n\` itself must be added.
- **Return, don't print.** \`return total;\` hands the number back, and the two \`print\` statements at the bottom show it. A function with no \`return\` gives \`nil\`, which is what the starter prints.

Check: 1 + 2 + … + 10 is 55, and 1 + … + 100 is 5050.`,
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
    walkthrough: `- **The constructor is \`init\`.** Calling \`Counter()\` makes a new instance and runs \`init\` on it, so \`this.n = 0;\` gives every instance its own field.
- **The method.** \`inc()\` reads the field, adds 1, stores it back and returns it. Drip has no \`+=\`, so it is \`this.n = this.n + 1;\`.
- **Two instances, two counts.** \`a\` and \`b\` each have their own \`n\`, which is why \`b.inc()\` prints 1 again.

Compare with the closure version in the functions example: a class and a closure are two ways to keep private state alive between calls.`,
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
    q: 'What happens when this Drip program runs?\n```\nprint "start";\nprint "a" * 2;\n```',
    options: [
      { t: 'It prints `start`, then stops with a runtime error on line 2', correct: true, why: 'Drip checks types as each line runs. Line 1 is fine, and the error only appears when `*` meets a string.' },
      { t: 'It refuses to run at all, before printing anything', why: 'That is what a static type checker would do. Drip is dynamically typed, so line 1 runs first.' },
      { t: 'It prints `start` and then `aa`', why: 'Drip has no string repetition. `*` needs two numbers.' },
      { t: 'It prints `start` and then `NaN`', why: 'Drip doesn’t convert the string as JavaScript would. It reports an error instead.' },
    ],
  },
  {
    q: 'Which of these is a valid Drip function declaration?',
    options: [
      { t: '`function add(a, b) { return a + b; }`', why: 'That is JavaScript. Drip’s keyword is `fn`.' },
      { t: '`fun add(a, b) { return a + b; }`', why: 'That is Lox. Drip respells `fun` as `fn`.' },
      { t: '`fn add(a, b) { return a + b; }`', correct: true, why: '`fn`, a name, parameters in parentheses, and a body in braces.' },
      { t: '`let add = (a, b) => a + b;`', why: 'Drip has no arrow functions.' },
    ],
  },
  {
    q: 'Drip’s tree-walker and its VM print different things for the same program. How do you decide which one is wrong?',
    options: [
      { t: 'The faster one is right', why: 'Speed says nothing about meaning.' },
      { t: 'Check the program against the spec: what the language says it must do', correct: true, why: 'The spec, here made concrete by the test programs, defines the right answer. Whichever disagrees with it has the bug.' },
      { t: 'The tree-walker is always right, because it came first', why: 'An implementation can have bugs no matter when it was written.' },
      { t: 'Neither: both answers are fine', why: 'If the outputs differ, at least one of them breaks the language’s rules.' },
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
