// Chapter 53 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.
// Merged from old chapters 58, 58.

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
    q: 'Two instances of the same Drip class each set `self.n`. Do they share one `n`?',
    a: 'No: each instance has its own fields.',
  },
  'print-statement': {
    q: 'Is `print` a function in Drip?',
    a: 'No, it is a statement: `print x;` needs no parentheses.',
  },
  'zero-true': {
    q: 'In Drip, does `if 0 { print "yes"; }` print anything?',
    a: 'Yes, it prints `yes`. Only `none` and `false` count as false; `0` counts as true.',
  },
  'closure-drip': {
    q: 'A Drip function is created inside another function. What does it remember?',
    a: 'The variables around the place it was made, even after the outer call returns (a closure).',
  },
  'dyn-when': {
    q: 'In a dynamically typed language like Drip, when is a type error found?',
    a: 'While the program runs, at the moment the operation with the wrong types runs.',
  },
  'types-on-values': {
    q: 'In Drip, does the type belong to the variable or to the value?',
    a: 'To the value: each value carries a tag (number, string, …); a variable is only a name for whichever value it holds.',
  },
  'var-change-type': {
    q: 'Is `let x = 1; x = "one";` allowed in Drip?',
    a: 'Yes. A variable can hold any kind of value, and the kind can change.',
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
    a: 'By hundreds of test programs (the corpus) whose comments give the exact expected output or error; both implementations must pass them.',
  },
  'expect-comment': {
    q: 'How does a Drip test program say that a line should fail?',
    a: 'With a comment `# expect runtime error:` followed by the exact error message.',
  },
  'not-proof': {
    q: 'An implementation passes every test in the corpus. Is it certainly correct?',
    a: 'No: the tests only cover the programs written down. Passing them is strong evidence, not proof.',
  },
};

export const examples = {
  values: {
    title: 'Values and variables',
    lang: 'drip',
    code: `print 7 / 2;
print "drip" + "drop";
print 3 < 4 && 4 < 5;
print !true;
print none;

let cups = 3;
cups += 1;
print cups;
print 0.1 + 0.2;`,
  },
  control: {
    title: 'if, while and for',
    lang: 'drip',
    code: `let n = 1;
while n < 50 {
  n = n * 2;
}
print n;

for i in 0..3 {
  print i;
}

if 0 { print "0 is true"; }
else { print "0 is false"; }`,
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
    self.ml = ml;
  }
  pour(x) {
    self.ml = self.ml - x;
    return self.ml;
  }
}

class Mug extends Cup {
  pour(x) {
    print "careful, hot";
    return super.pour(x);
  }
}

let m = new Mug(300);
print m.pour(50);
print m;`,
  },
  'type-error': {
    title: 'A label glued to a number',
    lang: 'drip',
    expectError: true,
    code: `print "start";
print "Total: " + 3;
print "never printed";`,
  },
};

export const exercises = {
  'sum-to': {
    lang: 'drip',
    title: 'Add up 1 to n, in Drip',
    prompt: 'Write a Drip function `sumTo(n)` that **returns** `1 + 2 + … + n`. The program then prints `sumTo(10)` and `sumTo(100)`, so the expected output is `55` and then `5050`.',
    starter: `fn sumTo(n) {
  # your code here
}

print sumTo(10);
print sumTo(100);`,
    solution: `fn sumTo(n) {
  let total = 0;
  for i in 1..n + 1 {
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
      'Walk the numbers with a range: `for i in 1..something { ... }`, adding each `i` to the total.',
      'A range stops just before its end, so `1..n` misses n itself; write `1..n + 1`, and end the function with `return total;`.',
    ],
    walkthrough: `**How to think about it.** Do it by hand first for a small n: the sum up to 4 is 1 + 2 + 3 + 4, which is 10, and you get there by keeping a running total and adding each number in turn. That is a loop with a counter that goes from 1 up to n, *including* n, and a total that starts at 0. In Drip the only new parts are the spelling: \`fn\` and \`let\`, and a \`for\` that walks a range, \`a..b\`, which gives every whole number from \`a\` up to, but not including, \`b\`. The tests check the printed output, so the function must *return* the total and let the two \`print\` lines show it.

**The solution, line by line.**

- \`fn sumTo(n) {\` declares a function called \`sumTo\` with one parameter.
- \`let total = 0;\` makes the running total inside the function, so every call starts again from zero.
- \`for i in 1..n + 1 {\` gives \`i\` the values 1, 2, ... up to \`n\`; the end is \`n + 1\` because a range stops just before its end, and \`n\` itself must be added.
- \`total = total + i;\` adds the current number to the total (\`total += i;\` says the same thing more briefly).
- \`}\` ends the loop, and \`return total;\` hands the sum back to the caller.
- \`}\` ends the function; the two \`print\` lines then show \`55\` and \`5050\`.

Check: 1 + 2 + ... + 10 is 55, and 1 + ... + 100 is 5050 (pair 1 with 100, 2 with 99, and so on: fifty pairs of 101).

**Common wrong attempts.**

- \`1..n\` instead of \`1..n + 1\`: the loop stops before adding \`n\`, so you get 45 and 4950.
- \`print total;\` instead of \`return total;\`: the function prints inside itself and then returns nothing, which in Drip is \`none\`, so the output has an extra \`none\` after each number.
- \`total++;\`: Drip has no \`++\`, so the program does not even start; the parser reports \`line 4: expected an expression, found '+'\` at the second \`+\`.`,
    wrong: [
      {
        code: `fn sumTo(n) {
  let total = 0;
  for i in 1..n {
    total = total + i;
  }
  return total;
}

print sumTo(10);
print sumTo(100);`,
        why: 'The range `1..n` stops just before `n`, so `n` is never added: you get 45 and 4950. Use `1..n + 1`.',
      },
      {
        code: `fn sumTo(n) {
  let total = 0;
  for i in 1..n + 1 {
    total = total + i;
  }
  print total;
}

print sumTo(10);
print sumTo(100);`,
        why: 'This prints the total inside the function and then returns nothing, so each call also prints `none`. Use `return total;`.',
      },
    ],
  },
  'counter-class': {
    optional: true,
    lang: 'drip',
    title: 'A counter class',
    prompt: 'Write a Drip class `Counter`. Its `init()` sets a field `n` to 0. Its method `inc()` adds 1 to `n` and **returns** the new value. Each instance has its own count, so the program below should print `1`, `2`, then `1`.',
    starter: `class Counter {
  # your code here
}

let a = new Counter();
print a.inc();
print a.inc();
let b = new Counter();
print b.inc();`,
    solution: `class Counter {
  init() {
    self.n = 0;
  }
  inc() {
    self.n = self.n + 1;
    return self.n;
  }
}

let a = new Counter();
print a.inc();
print a.inc();
let b = new Counter();
print b.inc();`,
    tests: `1
2
1`,
    hints: [
      'Methods are written inside the class body with no `fn` keyword: `init() { ... }`.',
      'Fields live on `self`: `self.n = 0;` in `init`.',
      'In `inc`, change `self.n`, not a plain `n`: a bare `n` is a variable lookup, and there is no variable called `n`.',
    ],
    walkthrough: `**How to think about it.** A counter needs a number that survives between calls to \`inc\`, and each counter needs its *own* number, so that \`b\` starts again at 1. That is exactly what a field on an instance gives you: \`init\` runs once for each new instance and can set \`self.n\` to 0, and every method of that instance can read and change it through \`self\`. Methods in a Drip class body are written without \`fn\`.

**The solution, line by line.**

- \`class Counter {\` starts the class.
- \`init() {\` is the constructor: \`new Counter()\` makes a new instance and runs \`init\` on it.
- \`self.n = 0;\` gives the new instance its own field \`n\`, starting at 0, and \`}\` ends \`init\`.
- \`inc() {\` is the method that counts.
- \`self.n = self.n + 1;\` reads the field, adds 1 and stores it back (\`self.n += 1;\` would do the same).
- \`return self.n;\` hands back the new value, so \`print a.inc();\` has something to print; \`}\` ends the method and the next \`}\` the class.

Then \`a\` counts \`1\`, \`2\`, and \`b\`, a new instance with its own \`n\`, prints \`1\`. Compare with \`makeCounter\` in the functions example: a class and a closure are two ways to keep private state alive between calls.

**Common wrong attempts.**

- Writing \`n = n + 1;\` without \`self.\`: a bare \`n\` is a variable, not the field, and there is no variable called \`n\`, so Drip stops with \`runtime error: undefined variable 'n'\`.
- Forgetting \`return self.n;\`: the count goes up, but \`inc\` returns \`none\`, so every line prints \`none\`.
- Writing \`fn inc() {\` inside the class: methods take no \`fn\`, so the parser reports \`expected a method name, found 'fn'\`.
- Writing \`Counter()\` without \`new\`: Drip stops with \`cannot call a class: use 'new Counter(...)'\`.`,
    wrong: [
      {
        code: `class Counter {
  init() {
    self.n = 0;
  }
  inc() {
    n = n + 1;
    return n;
  }
}

let a = new Counter();
print a.inc();
print a.inc();
let b = new Counter();
print b.inc();`,
        why: 'A bare `n` is not the field: Drip looks for a variable `n`, finds none, and stops with “undefined variable \'n\'”. Write `self.n`.',
      },
      {
        code: `class Counter {
  init() {
    self.n = 0;
  }
  inc() {
    self.n = self.n + 1;
  }
}

let a = new Counter();
print a.inc();
print a.inc();
let b = new Counter();
print b.inc();`,
        why: 'The count goes up, but `inc` returns nothing, so every `print` shows `none`. End with `return self.n;`.',
      },
    ],
  },
  'checked-add': {
    title: 'Drip’s + operator',
    prompt: 'Write `add(a, b)`, the check that Drip’s interpreter runs for `+`. If both values are numbers, return their sum; if both are strings, return them joined; otherwise **throw** an `Error` whose message names both types, in Drip’s words: `cannot add a string and a number` for `add(\'a\', 1)`, `cannot add a boolean and a number` for `add(true, 1)`. `typeof` tells you a value’s type: `typeof 1` is `\'number\'`, `typeof \'a\'` is `\'string\'` and `typeof true` is `\'boolean\'`.',
    starter: `function add(a, b) {
  // your code here
}

console.log(add(1, 2));
console.log(add('drip', 'drop'));`,
    solution: `function add(a, b) {
  const ta = typeof a;
  const tb = typeof b;
  if (ta === 'number' &&
      tb === 'number') {
    return a + b;
  }
  if (ta === 'string' &&
      tb === 'string') {
    return a + b;
  }
  throw new Error('cannot add a ' +
    ta + ' and a ' + tb);
}`,
    tests: `test('two numbers add', () => {
  expect(add(1, 2)).toBe(3);
});
test('two strings join', () => {
  expect(add('drip', 'drop')).toBe('dripdrop');
});
test('a string and a number throw', () => {
  expect(() => add('a', 1)).toThrow();
  expect(() => add(1, 'a')).toThrow();
});
test('booleans and null throw', () => {
  expect(() => add(true, 1)).toThrow();
  expect(() => add(null, null)).toThrow();
});
test('the exact messages', () => {
  let msg = '';
  try { add('a', 1); } catch (e) { msg = e.message; }
  expect(msg).toBe(
    'cannot add a string and a number');
  try { add(true, 1); } catch (e) { msg = e.message; }
  expect(msg).toBe(
    'cannot add a boolean and a number');
});`,
    hints: [
      'There are exactly two allowed cases. Check for each one, and treat everything else as an error.',
      'Ask `typeof a === \'number\' && typeof b === \'number\'` for the first case, and the same with `\'string\'` for the second. In both, JavaScript’s own `+` does the right thing.',
      'After the two `if`s, nothing allowed is left, so the last line can be `throw new Error(\'cannot add a \' + ta + \' and a \' + tb);`, where `ta` and `tb` are the two `typeof` results.',
    ],
    walkthrough: `**How to think about it.** Write the rule from the formal box as cases: number and number, string and string, and everything else. The first two have an answer; the third is an error. Since the interpreter is written in JavaScript, and Drip's numbers and strings *are* JavaScript numbers and strings, JavaScript's own \`+\` gives the right answer in both allowed cases. The whole job of \`add\` is to refuse the cases where JavaScript would quietly convert instead (\`'a' + 1\` is \`'a1'\`, and \`true + 1\` is \`2\`). That is dynamic typing in one function: the check happens on the actual values, when \`+\` runs.

**The solution, line by line.**

- \`function add(a, b) {\` takes the two values that \`+\` was given.
- \`const ta = typeof a;\` and \`const tb = typeof b;\` read each value's type tag, as a string such as \`'number'\`.
- \`if (ta === 'number' && tb === 'number') {\` is the first allowed case (split over two lines to fit)...
- \`return a + b;\` ...where JavaScript's \`+\` adds.
- \`if (ta === 'string' && tb === 'string') {\` is the second allowed case...
- \`return a + b;\` ...where the same \`+\` joins.
- \`throw new Error('cannot add a ' + ta + ' and a ' + tb);\` is reached only when neither case matched, so every other pair stops, with a message built from the two tags: for \`add('a', 1)\` it is \`cannot add a string and a number\`, exactly Drip's wording (the line is split in two only to keep it short).

The real interpreter does the same thing in its \`'+'\` case, with two differences: it describes each value with a small helper, \`describe\`, which also knows the words \`none\`, \`a list\` and \`a Point instance\` (so \`none + none\` says \`cannot add none and none\`, where \`typeof null\` would have said \`object\`), and it throws a \`RuntimeError\` that carries the token, so the report can name the line.

**Common wrong attempts.**

- \`if (typeof a === 'string' || typeof b === 'string') return a + b;\` followed by a plain \`return a + b;\`: this copies JavaScript's rule, so \`add('a', 1)\` gives \`'a1'\` and \`add(true, 1)\` gives \`2\` instead of throwing.
- Checking only the first value (\`if (typeof a === 'number') return a + b;\`): \`add(1, 'a')\` then returns \`'1a'\`.
- Returning a string like \`'error'\` instead of throwing: the caller cannot tell an error from a real value, and the program carries on.`,
    wrong: [
      {
        code: `function add(a, b) {
  return a + b;
}`,
        why: 'This is JavaScript’s `+`, which converts: `add(\'a\', 1)` gives `\'a1\'` and `add(true, 1)` gives `2`. Drip must throw.',
      },
      {
        code: `function add(a, b) {
  if (typeof a === 'number') {
    return a + b;
  }
  if (typeof a === 'string') {
    return a + b;
  }
  throw new Error('cannot add a ' +
    typeof a + ' and a ' + typeof b);
}`,
        why: 'Only `a` is checked, so `add(1, \'a\')` returns `\'1a\'` and `add(\'a\', 1)` returns `\'a1\'`. Both values need the same tag.',
      },
    ],
  },
  expects: {
    optional: true,
    title: 'Read a test’s expectations',
    prompt: 'Write `expects(src)`. `src` is the text of a Drip test program. Return an array of the expected outputs: for every line containing `# expect: `, the text after it, in order. Lines with `# expect runtime error:` are not outputs, so they are not included.',
    starter: `function expects(src) {
  // your code here
}

const t = 'print 1; # expect: 1';
console.log(expects(t));`,
    solution: `function expects(src) {
  const out = [];
  const tag = '# expect: ';
  const n = tag.length;
  for (const line of src.split('\\n')) {
    const i = line.indexOf(tag);
    if (i !== -1) {
      out.push(line.slice(i + n));
    }
  }
  return out;
}`,
    tests: `const truth = [
  '# Everything else is true.',
  'print truth(0); # expect: true',
  'print len(""); # expect: 0',
].join('\\n');
test('two expectations, in order', () => {
  expect(expects(truth)).toEqual(['true', '0']);
});
test('no expectations', () => {
  expect(expects('print 1;')).toEqual([]);
});
test('spaces inside are kept', () => {
  expect(expects('print "a b"; # expect: a b'))
    .toEqual(['a b']);
});
test('runtime errors are not outputs', () => {
  const src = 'none.x; # expect runtime error: No.';
  expect(expects(src)).toEqual([]);
});`,
    hints: [
      'Work one line at a time: `src.split(\'\\n\')` gives the lines.',
      'The comment is usually at the *end* of a line, after the code, so search for it with `indexOf` rather than checking the start.',
      'When `indexOf` finds the tag at index `i`, the expected text starts at `i + tag.length` (10 characters on); `slice` from there to the end.',
    ],
    walkthrough: `**How to think about it.** A test runner needs two lists to compare: what the program printed, and what its comments say it should print. This function makes the second list. Look at a real test line, \`print truth(0); # expect: true\`: the comment comes *after* the code on the same line, so you have to search inside each line, not just look at its start. And the tag must include the colon and space, \`# expect: \`, so that \`# expect runtime error:\` lines (which do not have a colon straight after \`expect\`) are left out.

**The solution, line by line.**

- \`const out = [];\` collects the expected outputs.
- \`const tag = '# expect: ';\` is the exact text to look for, colon and space included, and \`const n = tag.length;\` remembers its length, 10.
- \`for (const line of src.split('\\n')) {\` visits the program one line at a time.
- \`const i = line.indexOf(tag);\` finds where the tag starts in this line, or gives \`-1\` if it is not there.
- \`if (i !== -1) {\` only lines that contain the tag count...
- \`out.push(line.slice(i + n));\` ...and the expected output is everything after the tag, to the end of the line. For \`print "a b"; # expect: a b\` that is \`a b\`, with its inner space kept.
- \`return out;\` hands back the list, in the order the lines appeared.

Compare \`out\` with the program's printed lines, element by element, and you have the core of the corpus runner in \`companion/ts/test/corpus.ts\`.

**Common wrong attempts.**

- \`if (line.startsWith(tag))\`: real tests put the comment after the code, so this finds nothing in \`what_is_true.drip\`.
- Searching for \`'# expect'\` without the colon: \`# expect runtime error:\` lines then count as outputs.
- Slicing at a fixed position such as \`i + 9\`: the tag is 10 characters long, so every expectation keeps a leading space.`,
    wrong: [
      {
        code: `function expects(src) {
  const out = [];
  const tag = '# expect: ';
  for (const line of src.split('\\n')) {
    if (line.startsWith(tag)) {
      out.push(line.slice(tag.length));
    }
  }
  return out;
}`,
        why: 'The comment comes after the code on its line, so `startsWith` never matches a real test line.',
      },
      {
        code: `function expects(src) {
  const out = [];
  const tag = '# expect';
  for (const line of src.split('\\n')) {
    const i = line.indexOf(tag);
    if (i !== -1) {
      out.push(line.slice(i + 10));
    }
  }
  return out;
}`,
        why: 'Without the colon in the tag, `# expect runtime error:` lines are counted as outputs too.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'What does `print 7 / 2;` show in Drip?',
    options: [
      {
        t: '`3`',
        why: 'Drip has one kind of number, a 64-bit float, so division doesn’t round down.',
      },
      {
        t: '`3.5`',
        correct: true,
        why: 'Numbers are floats, like JavaScript’s, and whole numbers print without a decimal point.',
      },
      {
        t: '`3.50`',
        why: 'Drip prints numbers the way JavaScript’s `String` does: no trailing zeros.',
      },
      {
        t: 'A runtime error',
        why: 'Both operands are numbers, so `/` is fine.',
      },
    ],
  },
  {
    q: `What does this Drip program print?
\`\`\`
if "" { print "yes"; }
else { print "no"; }
\`\`\``,
    options: [
      {
        t: '`no`',
        why: 'That’s what JavaScript would do. In Drip, the empty string counts as true.',
      },
      {
        t: 'Nothing',
        why: 'One of the two branches always runs.',
      },
      {
        t: 'A runtime error',
        why: 'Any value can be a condition in Drip.',
      },
      {
        t: '`yes`',
        correct: true,
        why: 'Only `none` and `false` are false. `""` is a string, so it counts as true.',
      },
    ],
  },
  {
    q: 'Which of these values does Drip treat as false in an `if`?',
    options: [
      {
        t: '`0`',
        why: 'That is JavaScript’s rule. In Drip, every number is true.',
      },
      {
        t: '`none`',
        correct: true,
        why: 'Only `none` and `false` are false in Drip.',
      },
      {
        t: '`""`',
        why: 'The empty string is still a string, and every string is true in Drip.',
      },
      {
        t: 'a function',
        why: 'Functions are values like any other, and true.',
      },
    ],
  },
  {
    q: 'Every runnable Drip box in Part III runs on which implementation?',
    options: [
      {
        t: 'The bytecode VM',
        why: 'The VM comes in Part IV.',
      },
      {
        t: 'JavaScript’s own engine, directly',
        why: 'Drip is not JavaScript; it needs its own interpreter, even though that interpreter is written in TypeScript.',
      },
      {
        t: 'The tree-walking interpreter you are about to build',
        correct: true,
        why: 'Part III builds it, and the companion code is a finished copy of it.',
      },
      {
        t: 'None: the boxes only show the code',
        why: 'They really run; edit them and run them again.',
      },
    ],
  },
  {
    q: `What does this print?
\`\`\`
fn make() {
  let n = 0;
  fn inc() {
    n = n + 1;
    return n;
  }
  return inc;
}
let a = make();
let b = make();
print a();
print a();
print b();
\`\`\``,
    options: [
      {
        t: '`1`, `2`, `3`',
        why: 'That would mean `a` and `b` share one `n`. Each call to `make` creates a new one.',
      },
      {
        t: '`1`, `1`, `1`',
        why: 'The closure keeps its `n` between calls, so `a` counts up.',
      },
      {
        t: '`0`, `1`, `0`',
        why: '`inc` adds 1 before returning, so the first call returns 1.',
      },
      {
        t: '`1`, `2`, `1`',
        correct: true,
        why: '`a` and `b` each close over their own `n`. `a` counts 1, 2 and `b` starts again at 1.',
      },
    ],
  },
  {
    q: `What happens when this Drip program runs?
\`\`\`
print "start";
print "a" * 2;
\`\`\``,
    options: [
      {
        t: 'It prints `start`, then stops with a runtime error on line 2',
        correct: true,
        why: 'Drip checks types as each line runs. Line 1 is fine, and the error only appears when `*` meets a string.',
      },
      {
        t: 'It refuses to run at all, before printing anything',
        why: 'That is what a static type checker would do. Drip is dynamically typed, so line 1 runs first.',
      },
      {
        t: 'It prints `start` and then `aa`',
        why: 'Drip has no string repetition. `*` needs two numbers.',
      },
      {
        t: 'It prints `start` and then `NaN`',
        why: 'Drip doesn’t convert the string as JavaScript would. It reports an error instead.',
      },
    ],
  },
  {
    q: 'Which of these Drip lines runs without an error?',
    options: [
      {
        t: '`print "3" + 4;`',
        why: 'A string and a number: no rule for `+` fits, so it is a runtime error.',
      },
      {
        t: '`print 3 + "4";`',
        why: 'The same pair the other way round; still a runtime error.',
      },
      {
        t: '`print none + none;`',
        why: '`none` is neither a number nor a string.',
      },
      {
        t: '`print "3" + "4";`',
        correct: true,
        why: 'Two strings join, so it prints `34`.',
      },
    ],
  },
  {
    q: 'What does `"a" + 1` give in JavaScript, and why is that not what Drip does?',
    options: [
      {
        t: '`"a1"`: JavaScript’s `+` converts the number to a string; Drip refuses and stops with a runtime error',
        correct: true,
        why: 'Both are dynamically typed; they differ in whether `+` converts.',
      },
      {
        t: 'A runtime error, exactly as in Drip',
        why: 'That is Python’s behaviour. JavaScript converts.',
      },
      {
        t: '`NaN`, because a string is not a number',
        why: 'With a string on either side, JavaScript’s `+` joins rather than adds.',
      },
      {
        t: 'A compile error, because JavaScript checks types first',
        why: 'Plain JavaScript checks no types before running; TypeScript would.',
      },
    ],
  },
  {
    q: 'Drip’s tree-walker and its VM print different things for the same program. How do you decide which one is wrong?',
    options: [
      {
        t: 'The faster one is right',
        why: 'Speed says nothing about meaning.',
      },
      {
        t: 'Check the program against the spec: what the language says it must do',
        correct: true,
        why: 'The spec, here made concrete by the test programs, defines the right answer. Whichever disagrees with it has the bug.',
      },
      {
        t: 'The tree-walker is always right, because it came first',
        why: 'An implementation can have bugs no matter when it was written.',
      },
      {
        t: 'Neither: both answers are fine',
        why: 'If the outputs differ, at least one of them breaks the language’s rules.',
      },
    ],
  },
  {
    q: 'A new Drip implementation passes every test program in the corpus. What can you say?',
    options: [
      {
        t: 'It is certainly correct',
        why: 'Tests only cover the programs someone wrote down; a program none of them tries could still go wrong.',
      },
      {
        t: 'Nothing: tests say nothing about correctness',
        why: 'They say a lot. Every passed test is one program it handles exactly as the spec says.',
      },
      {
        t: 'It agrees with the spec on those programs, which is strong evidence, not proof',
        correct: true,
        why: 'That is exactly what a test suite gives you.',
      },
      {
        t: 'It must be faster than the tree-walker',
        why: 'The tests check output, not speed.',
      },
    ],
  },
];
