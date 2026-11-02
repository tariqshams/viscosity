// Chapter 59 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.
// Merged from old chapters 68, 68, 68.

export const prompts = {
  'list-eval-order': {
    q: 'How does the interpreter evaluate the list literal `[a, b + 1, c]`?',
    a: 'It evaluates each element, left to right, and puts the values into a new `DripList` (whose `items` is a JavaScript array).',
  },
  'list-alias': {
    q: 'After `let ys = xs; push(ys, 3);`, has `xs` changed? Why?',
    a: 'Yes. A list is held by reference, so `ys` and `xs` name the same list.',
  },
  'list-equal': {
    q: 'What does `print [1] == [1];` print in Drip, and why?',
    a: '`false`: lists are compared by identity, and these are two different lists that happen to hold the same values.',
  },
  'index-errors': {
    q: 'Name the four checks `checkIndex` makes, in order.',
    a: 'The value is a list (`cannot index ...`); the index is a number (`a list index must be a number, not ...`); it is whole (`index 1.5 is not a whole number`); it is from 0 to `len - 1` (`index 3 is out of range for a list of length 3`).',
  },
  'index-no-grow': {
    q: 'Can `xs[len(xs)] = v;` add an element to the end of a Drip list?',
    a: 'No. Writing needs an existing index, so it is the runtime error `index ... is out of range`. Use `push(xs, v)` to grow a list.',
  },
  'push-returns': {
    q: 'What do `push(xs, v)` and `pop(xs)` return?',
    a: '`push` returns `none`; `pop` returns the element it removed (and is a runtime error on an empty list).',
  },
  'for-in-length': {
    q: 'In `for x in xs { ... }`, the body pushes onto `xs`. Are the new elements visited?',
    a: 'Yes. The loop reads the list’s length each time round, so pushed elements are visited (and a loop that always pushes never ends).',
  },
  'for-in-copy': {
    q: 'Why does `for x in xs { x = 0; }` leave `xs` unchanged?',
    a: '`x` is a fresh variable each time round, holding the element’s value; assigning to it changes the variable, not the list.',
  },
  'for-in-not-list': {
    q: 'What does `for x in 5 { }` do?',
    a: 'A runtime error, `cannot loop over a number`: a for-in loop needs a list (use `0..5` for a range).',
  },
  'decl-no-run': {
    q: 'What does running the declaration `fn add(a, b) { ... }` do?',
    a: 'It makes a function value (the declaration plus the current environment) and defines `add` to hold it. The body does not run.',
  },
  'fn-value': {
    q: 'What does `print add;` show for a Drip function `add`?',
    a: '`fn add`. A function is an ordinary runtime value, and printing it runs nothing.',
  },
  'anon-fn': {
    q: 'How do you write a Drip function with no name, and what does `print` show for it?',
    a: '`fn (x) { ... }`, written where an expression goes. It prints as `fn`.',
  },
  'callable-what': {
    q: 'Which two kinds of Drip value can a call expression run?',
    a: 'Drip functions (made with `fn`) and native functions (like `clock` and `len`).',
  },
  'class-not-callable': {
    q: 'What happens in Drip if you write `Point(1, 2)` for a class `Point`?',
    a: 'A runtime error: `cannot call a class: use \'new Point(...)\'`. Instances are made with `new`.',
  },
  'call-order': {
    q: 'In a call expression, what is evaluated first: the callee or the arguments?',
    a: 'The callee, then the arguments from left to right, and only then is the callee checked and run.',
  },
  'fresh-env': {
    q: 'Why do two calls of the same Drip function never share their local variables?',
    a: 'Each call makes a brand-new environment for its parameters and locals.',
  },
  'parent-env': {
    q: 'What is the parent of the environment a Drip call makes?',
    a: 'The environment where the function was declared (its `closure`), not the caller’s environment.',
  },
  'arity-what': {
    q: 'What is a function’s *arity*?',
    a: 'The number of arguments it takes. For a Drip function, its number of parameters.',
  },
  'arity-before': {
    q: 'Does any of a Drip function’s body run when a call has the wrong number of arguments?',
    a: 'No. The arity is checked before the call’s environment is made, so nothing in the body runs.',
  },
  'arity-mismatch': {
    q: '`fn f(a, b) {}` then `f(1);` What happens in Drip?',
    a: 'A runtime error, `f() takes 2 arguments but got 1`, and the body of `f` never runs.',
  },
  'js-lenient': {
    q: 'In JavaScript, what does a parameter hold when its argument is missing?',
    a: '`undefined`. JavaScript never checks the number of arguments.',
  },
  'native-no-env': {
    q: 'What does a call to a native skip that a call to a Drip function does?',
    a: 'Making a new environment and defining parameters in it: the argument list goes straight to TypeScript code.',
  },
  'native-what': {
    q: 'What is a native function?',
    a: 'A callable written in the host language (TypeScript, for Drip) rather than in the language being run.',
  },
  'native-why': {
    q: 'Why can’t `clock` be written in Drip itself?',
    a: 'Nothing in Drip can ask the outside world for the time. Only the host language can.',
  },
  'five-natives': {
    q: 'Name Drip’s five native functions.',
    a: '`clock`, `len`, `push`, `pop` and `str`.',
  },
};

export const examples = {
  particles: {
    title: 'Particles in two layouts',
    lang: 'drip',
    code: `# a list of records: [x, vx]
let ps = [[0, 1], [5, -1], [9, 2]];
for p in ps {
  p[0] += p[1];
}
print ps;

# one list per field
let xs = [0, 5, 9];
let vxs = [1, -1, 2];
for i in 0..len(xs) {
  xs[i] += vxs[i];
}
print xs;`,
  },
  callables: {
    title: 'What can be called',
    lang: 'drip',
    code: `fn hi() { print "hi"; }
let fs = [hi, fn () { print "yo"; }];
for f in fs {
  f();
}
print fs;
let n = 3;
n();`,
    expectError: true,
  },
  timing: {
    title: 'Timing a loop with a native',
    lang: 'drip',
    code: `print clock;

let start = clock();
let sum = 0;
for i in 0..100000 {
  sum += i;
}
print sum;
print clock() - start;`,
  },
};

export const exercises = {
  'check-index': {
    title: 'Check an index the way Drip does',
    prompt: 'Write `checkIndex(xs, i)` and use it in `index(xs, i)`, which reads element `i` of a Drip list. `DripList` (with its `items` array) and `describe` are given. `checkIndex` returns `xs` when everything is fine, and otherwise throws an `Error` with exactly Drip’s message, checking in this order: not a list, `cannot index a string`; index not a number, `a list index must be a number, not a string`; not whole, `index 1.5 is not a whole number`; out of range, `index 3 is out of range for a list of length 3`.',
    starter: `class DripList {
  constructor(items) {
    this.items = items;
  }
}

function describe(v) {
  if (v === null) return 'none';
  if (v instanceof DripList) {
    return 'a list';
  }
  return 'a ' + typeof v;
}

function checkIndex(xs, i) {
  // four checks, in order
  return xs;
}

function index(xs, i) {
  return checkIndex(xs, i).items[i];
}`,
    solution: `class DripList {
  constructor(items) {
    this.items = items;
  }
}

function describe(v) {
  if (v === null) return 'none';
  if (v instanceof DripList) {
    return 'a list';
  }
  return 'a ' + typeof v;
}

function checkIndex(xs, i) {
  if (!(xs instanceof DripList)) {
    throw new Error('cannot index '
      + describe(xs));
  }
  if (typeof i !== 'number') {
    throw new Error('a list index must'
      + ' be a number, not '
      + describe(i));
  }
  if (!Number.isInteger(i)) {
    throw new Error('index ' + i
      + ' is not a whole number');
  }
  const n = xs.items.length;
  if (i < 0 || i >= n) {
    throw new Error('index ' + i
      + ' is out of range for a list'
      + ' of length ' + n);
  }
  return xs;
}

function index(xs, i) {
  return checkIndex(xs, i).items[i];
}`,
    tests: `const L = (...xs) => new DripList(xs);
const msg = (f) => {
  try { f(); } catch (e) { return e.message; }
  return 'no error';
};
test('reads an element', () => {
  expect(index(L(10, 20, 30), 1)).toBe(20);
  expect(index(L('a'), 0)).toBe('a');
});
test('only lists can be indexed', () => {
  expect(msg(() => index('abc', 0)))
    .toBe('cannot index a string');
  expect(msg(() => index(null, 0)))
    .toBe('cannot index none');
});
test('the index must be a number', () => {
  expect(msg(() => index(L(1), '0')))
    .toBe('a list index must be a number,'
      + ' not a string');
});
test('the index must be whole', () => {
  expect(msg(() => index(L(1, 2), 1.5)))
    .toBe('index 1.5 is not a whole number');
});
test('the index must be in range', () => {
  expect(msg(() => index(L(1, 2, 3), 3)))
    .toBe('index 3 is out of range'
      + ' for a list of length 3');
  expect(msg(() => index(L(1, 2, 3), -1)))
    .toBe('index -1 is out of range'
      + ' for a list of length 3');
  expect(msg(() => index(L(), 0)))
    .toBe('index 0 is out of range'
      + ' for a list of length 0');
});
test('the checks run in order', () => {
  expect(msg(() => index(L(), 'x')))
    .toBe('a list index must be a number,'
      + ' not a string');
});`,
    hints: [
      'Write the four checks as four `if`s, each with its own `throw`, in the order the prompt gives; the order matters when two things are wrong at once.',
      '`xs instanceof DripList` tests for a list, `typeof i !== \'number\'` for a number, and `Number.isInteger(i)` for a whole number. Use `describe` for the type names.',
      'The range check is `i < 0 || i >= xs.items.length`. Build the message as `\'index \' + i + \' is out of range for a list of length \' + n`; JavaScript prints `1.5` and `-1` the same way Drip does.',
    ],
    walkthrough: `**How to think about it.** Every way \`xs[i]\` can go wrong becomes one question, asked in a fixed order, and each question needs the previous answer to be "yes" before it even makes sense: you cannot ask whether \`"x"\` is a whole number, and you cannot ask whether an index is in range for something that is not a list. So the function is four guards in a row, each throwing its own message, and if all four pass, the list is safe to read. Writing it as a separate \`checkIndex\` is what lets the companion use the same checks for reading (\`index\`) and writing (\`indexSet\`).

**The solution, line by line.**

- \`if (!(xs instanceof DripList)) { throw new Error('cannot index ' + describe(xs)); }\` refuses anything that is not a list. A JavaScript string is not a \`DripList\`, so \`"abc"[0]\` gives \`cannot index a string\`; \`describe(null)\` gives \`none\`, so the message reads \`cannot index none\`.
- \`if (typeof i !== 'number') { throw ... 'a list index must be a number, not ' + describe(i) }\` refuses \`"0"\` and \`true\`; Drip never turns a string into a number.
- \`if (!Number.isInteger(i)) { throw ... }\` refuses \`1.5\`. (It also refuses \`NaN\` and \`Infinity\`, which are numbers but not whole ones.)
- \`const n = xs.items.length;\` reads the current length.
- \`if (i < 0 || i >= n) { throw ... }\` refuses anything outside \`0\` to \`n - 1\`. The largest good index is \`n - 1\`, so \`i >= n\` (not \`i > n\`) is the right test; an empty list has no good index at all.
- \`return xs;\` hands back the checked list, so the caller can write \`checkIndex(xs, i).items[i]\` in one expression.
- \`function index(xs, i) { return checkIndex(xs, i).items[i]; }\` is the companion's \`index\` case: check, then read.

**Common wrong attempts.**

- \`i > n\` instead of \`i >= n\` lets \`index(L(1, 2, 3), 3)\` through, and JavaScript returns \`undefined\` for a missing element: a value Drip does not even have.
- Checking the range before the type: \`index(L(), 'x')\` then reports \`out of range\` instead of the real problem, that the index is a string.
- Using \`Math.floor(i) === i\` without the number check first: \`'2'\` slips through the string test if the checks are reordered, because JavaScript converts it.`,
    wrong: [
      {
        code: `class DripList {
  constructor(items) {
    this.items = items;
  }
}

function describe(v) {
  if (v === null) return 'none';
  if (v instanceof DripList) {
    return 'a list';
  }
  return 'a ' + typeof v;
}

function checkIndex(xs, i) {
  if (!(xs instanceof DripList)) {
    throw new Error('cannot index '
      + describe(xs));
  }
  const n = xs.items.length;
  if (i < 0 || i > n) {
    throw new Error('index ' + i
      + ' is out of range for a list'
      + ' of length ' + n);
  }
  return xs;
}

function index(xs, i) {
  return checkIndex(xs, i).items[i];
}`,
        why: '`i > n` lets the index `n` through (JavaScript then reads `undefined`), and with no number or whole-number checks, `\'0\'` and `1.5` are never reported properly.',
      },
    ],
  },
  'to-columns': {
    optional: true,
    lang: 'drip',
    title: 'From a list of records to a list per field',
    prompt: '`ps` is a list of records `[x, vx]`. Using a `for ... in` loop and `push`, build two new lists, `xs` with every `x` and `vxs` with every `vx`, in the same order, then print `xs`, `vxs` and `len(xs)`. Do not change `ps`.',
    starter: `let ps = [[0, 1], [5, -1], [9, 2]];
let xs = [];
let vxs = [];
# fill xs and vxs here
print xs;
print vxs;
print len(xs);`,
    solution: `let ps = [[0, 1], [5, -1], [9, 2]];
let xs = [];
let vxs = [];
for p in ps {
  push(xs, p[0]);
  push(vxs, p[1]);
}
print xs;
print vxs;
print len(xs);`,
    tests: `[0, 5, 9]
[1, -1, 2]
3`,
    hints: [
      'Each time round the loop, `p` is one record, such as `[5, -1]`. Where in `p` is the x, and where is the vx?',
      '`p[0]` is the x and `p[1]` is the vx. `push(list, value)` appends to the end of a list.',
      'Inside `for p in ps { ... }`, write `push(xs, p[0]);` and `push(vxs, p[1]);`.',
    ],
    walkthrough: `**How to think about it.** This is the change of layout from the memory chapters, done by hand: the same numbers, regrouped from "one small list per particle" into "one list per field". Walk the records in order, and for each one copy its first number onto the end of \`xs\` and its second onto the end of \`vxs\`; because both lists grow in the same order, position \`i\` in each still belongs to particle \`i\`.

**The solution, line by line.**

- \`let ps = [[0, 1], [5, -1], [9, 2]];\` is the list of records, given.
- \`let xs = []; let vxs = [];\` start two empty lists.
- \`for p in ps {\` visits each record in order; \`p\` is a fresh variable each time, holding a reference to that record (the same inner list, not a copy).
- \`push(xs, p[0]);\` reads the record's element 0, its x, and appends it to \`xs\`.
- \`push(vxs, p[1]);\` does the same with element 1, the vx.
- After the loop, \`print xs;\` shows \`[0, 5, 9]\`, \`print vxs;\` shows \`[1, -1, 2]\`, and \`print len(xs);\` shows \`3\`.

**Common wrong attempts.**

- \`xs[0] = p[0];\` (writing by index into an empty list) stops with \`index 0 is out of range for a list of length 0\`: writing cannot grow a list; \`push\` can.
- \`let xs = ps[0];\` takes the first *record*, \`[0, 1]\`, not the first field of every record.
- Writing \`for p in ps { push(xs, p); }\` copies whole records, so \`xs\` prints as \`[[0, 1], [5, -1], [9, 2]]\`.`,
    wrong: [
      {
        code: `let ps = [[0, 1], [5, -1], [9, 2]];
let xs = [];
let vxs = [];
for i in 0..len(ps) {
  xs[i] = ps[i][0];
  vxs[i] = ps[i][1];
}
print xs;
print vxs;
print len(xs);`,
        why: 'Writing `xs[i]` needs an existing element, so the first round stops with `index 0 is out of range for a list of length 0`. Grow a list with `push`.',
      },
    ],
  },
  each: {
    lang: 'drip',
    title: 'A function that takes a function',
    prompt: 'Declare a Drip function `each(xs, f)` that calls `f` once for every item of the list `xs`, in order, passing the item as the argument. The calls at the bottom (which use anonymous functions) must then print `10`, `20`, `30`, `a!` and `b!`.',
    starter: `# declare each here

each([1, 2, 3], fn (x) {
  print x * 10;
});
each(["a", "b"], fn (s) {
  print s + "!";
});`,
    solution: `fn each(xs, f) {
  for x in xs {
    f(x);
  }
}

each([1, 2, 3], fn (x) {
  print x * 10;
});
each(["a", "b"], fn (s) {
  print s + "!";
});`,
    tests: `10
20
30
a!
b!`,
    hints: [
      '`each` has two parameters: a list and a function. What should happen once for every item of the list?',
      'A `for x in xs { ... }` loop visits every item. Inside it, `f` is an ordinary variable holding a function, so you can call it like any function.',
      'The body is one loop: `for x in xs { f(x); }`.',
    ],
    walkthrough: `**How to think about it.** Read the calls at the bottom first: each one passes a list and an anonymous function, and expects that function to be run once per item. So \`each\` needs two parameters, the list and the function, and its job is a loop that hands each item to the function. Nothing about \`f\` is special: it is a parameter like any other, which happens to hold a function value, and a call expression accepts any variable that holds a callable.

**The solution, line by line.**

- \`fn each(xs, f) {\` declares a global function with two parameters. In the first call, \`xs\` holds the list \`[1, 2, 3]\` and \`f\` holds the anonymous function that prints \`x * 10\`.
- \`  for x in xs {\` runs its body once per item, with \`x\` holding the item.
- \`    f(x);\` is a call expression whose callee is the variable \`f\`. The interpreter looks \`f\` up (a function value), evaluates \`x\`, checks that it is a Drip function, makes a fresh environment for the anonymous function with its parameter (also called \`x\` in the first call, \`s\` in the second) holding the item, and runs its body, which prints.
- \`  }\` and \`}\` close the loop and the function.
- The two calls at the bottom then print \`10\`, \`20\`, \`30\`, and \`a!\`, \`b!\`.

**Common wrong attempts.**

- Writing \`f;\` instead of \`f(x);\` inside the loop: the name alone only *reads* the function value and throws it away, so nothing is printed. The brackets are what call it.
- Writing \`f(xs);\`: the whole list is passed instead of one item, and the first call tries \`[1, 2, 3] * 10\`, which stops with \`cannot use '*' on a list and a number\`.`,
    wrong: [
      {
        code: `fn each(xs, f) {
  for x in xs {
    f;
  }
}

each([1, 2, 3], fn (x) {
  print x * 10;
});
each(["a", "b"], fn (s) {
  print s + "!";
});`,
        why: '`f;` reads the function without calling it, so nothing is printed. Call it with the item: `f(x);`.',
      },
      {
        code: `fn each(xs, f) {
  for x in xs {
    f(xs);
  }
}

each([1, 2, 3], fn (x) {
  print x * 10;
});
each(["a", "b"], fn (s) {
  print s + "!";
});`,
        why: 'This passes the whole list each time, so `x * 10` becomes `[1, 2, 3] * 10`: `cannot use \'*\' on a list and a number`.',
      },
    ],
  },
  squares: {
    optional: true,
    lang: 'drip',
    title: 'Your first Drip function',
    prompt: 'The loop below calls `square`, which does not exist yet. Above it, declare a Drip function `square(n)` that prints `n * n`, so the program prints `1`, `4`, `9`, `16` and `25`.',
    starter: `# declare square here

for i in 1..6 {
  square(i);
}`,
    solution: `fn square(n) {
  print n * n;
}

for i in 1..6 {
  square(i);
}`,
    tests: `1
4
9
16
25`,
    hints: [
      'A Drip function starts with the keyword `fn`, then the name, then the parameters in brackets.',
      'The body is a block in braces, and it needs one statement: print the parameter times itself.',
      'Write `fn square(n) { print n * n; }` above the loop.',
    ],
    walkthrough: `**How to think about it.** The loop is already written and runs \`square(i)\` for \`i\` from 1 up to (but not including) 6, so all that is missing is a function called \`square\` with one parameter that prints its square. It must be declared before the loop, because Drip runs the program from top to bottom and a call looks the name up at the moment it runs.

**The solution, line by line.**

- \`fn square(n) {\` declares a global function \`square\` with one parameter. Running this line makes the function value and stores it under the name \`square\`; nothing is printed yet.
- \`  print n * n;\` is the body: it prints the parameter times itself.
- \`}\` ends the body.
- \`for i in 1..6 {\` runs its body with \`i\` set to 1, 2, 3, 4 and 5 in turn.
- \`  square(i);\` looks up \`square\` (found in the globals), evaluates \`i\`, checks that one argument was given for its one parameter, then makes a fresh environment with \`n\` holding the current \`i\` and runs the body there, printing \`1\`, then \`4\`, and so on up to \`25\`.
- \`}\` ends the loop.

**Common wrong attempts.**

- Declaring \`square\` *after* the loop: the loop runs first, and the very first call stops with \`undefined variable 'square'\`.
- Declaring \`fn square()\` with no parameter and printing \`i * i\` inside: the call \`square(i)\` fails the check on the number of arguments with \`square() takes 0 arguments but got 1\` (and \`i\` belongs to the loop, which \`square\` cannot see anyway).`,
    wrong: [
      {
        code: `for i in 1..6 {
  square(i);
}

fn square(n) {
  print n * n;
}`,
        why: 'The loop runs before the declaration, so the first call fails: `undefined variable \'square\'`.',
      },
      {
        code: `fn square() {
  print i * i;
}

for i in 1..6 {
  square(i);
}`,
        why: '`square` takes no parameters, so `square(i)` fails the check on the number of arguments: `square() takes 0 arguments but got 1`.',
      },
    ],
  },
  callValue: {
    title: 'Calls with arity checks',
    prompt: `Write the two halves of a native call, in plain JavaScript. The helper \`describe(v)\` is written for you: it gives \`'none'\` for \`null\`, \`'a list'\` for an array, and otherwise \`'a '\` plus the \`typeof\` (\`'a number'\`, \`'a string'\`).

- \`makeNative(name, arity, fn)\` returns a native: an object \`{ native: true, name, arity, fn }\`.
- \`callValue(callee, args)\` calls \`callee\` with the array \`args\`. If \`callee\` is not an object whose \`native\` property is \`true\` (numbers, strings, \`null\` and arrays are not), throw an \`Error\` whose message is \`'cannot call '\` plus \`describe(callee)\`. If \`args.length\` differs from \`callee.arity\`, throw \`len() takes 1 argument but got 2\` (with the native's own name and numbers, and \`argument\` singular only when the arity is 1) **without** running \`fn\`. Otherwise return \`callee.fn(args)\`.`,
    starter: `function describe(v) {
  if (v === null) return 'none';
  if (Array.isArray(v)) return 'a list';
  return 'a ' + typeof v;
}

function makeNative(name, arity, fn) {
  // your code here
}

function callValue(callee, args) {
  // your code here
}

const add = makeNative('add', 2,
  (xs) => xs[0] + xs[1]);
console.log(callValue(add, [1, 2]));`,
    solution: `function describe(v) {
  if (v === null) return 'none';
  if (Array.isArray(v)) return 'a list';
  return 'a ' + typeof v;
}

function makeNative(name, arity, fn) {
  return {
    native: true, name, arity, fn,
  };
}

function callValue(callee, args) {
  if (typeof callee !== 'object' ||
      callee === null ||
      callee.native !== true) {
    const d = describe(callee);
    throw new Error('cannot call ' + d);
  }
  const n = callee.arity;
  if (args.length !== n) {
    const word = n === 1
      ? 'argument' : 'arguments';
    throw new Error(
      \`\${callee.name}() takes \${n} \` +
      \`\${word} but got \${args.length}\`);
  }
  return callee.fn(args);
}`,
    tests: `const msg = (f) => {
  try { f(); } catch (e) { return e.message; }
  return 'no error';
};
test('a native can be called', () => {
  const add = makeNative('add', 2, (xs) => xs[0] + xs[1]);
  expect(add.arity).toBe(2);
  expect(callValue(add, [3, 4])).toBe(7);
});
test('zero arguments is fine too', () => {
  const now = makeNative('clock', 0, () => 42);
  expect(callValue(now, [])).toBe(42);
});
test('too few arguments', () => {
  const f = makeNative('area', 2, () => 0);
  expect(msg(() => callValue(f, [1])))
    .toBe('area() takes 2 arguments but got 1');
});
test('arity 1 is singular', () => {
  const f = makeNative('len', 1, () => 0);
  expect(msg(() => callValue(f, [1, 2])))
    .toBe('len() takes 1 argument but got 2');
});
test('a mismatch never runs the native', () => {
  let ran = false;
  const f = makeNative('f', 1, () => { ran = true; });
  msg(() => callValue(f, []));
  expect(ran).toBe(false);
});
test('values that are not natives are refused', () => {
  expect(msg(() => callValue(123, []))).toBe('cannot call a number');
  expect(msg(() => callValue('hi', []))).toBe('cannot call a string');
  expect(msg(() => callValue(null, []))).toBe('cannot call none');
  expect(msg(() => callValue([1], []))).toBe('cannot call a list');
});`,
    hints: [
      'Do it in the same order as the interpreter: first "can this be called at all?", then "is the count right?", and only then "run it".',
      '`makeNative` returns an object literal; with shorthand properties it is one line. For the first check, remember that `typeof null` is `\'object\'`, so test `callee === null` before reading `callee.native`.',
      'For the arity message, pick the word first: `const word = n === 1 ? \'argument\' : \'arguments\';`, then build the message with a template literal, and throw before you call `callee.fn`.',
    ],
    walkthrough: `**How to think about it.** This is the native-function branch of the interpreter's call expression, with the evaluating already done for you: \`callee\` is the value of whatever was written before the \`(\`, and \`args\` is the list of argument values. The interpreter asks its questions in a fixed order, and so should you: can this value be called at all, does the number of arguments match, and only then, run it. The order matters because a check that comes after the call is too late: the native has already done its work.

**The solution, line by line.**

- \`function makeNative(name, arity, fn) {\` takes the three things a native needs: a name for error messages, its arity and the JavaScript function that does the work.
- \`  return {\`, \`native: true, name, arity, fn,\` and \`};\` build the object. \`name\` on its own inside the braces is shorthand for \`name: name\`. The \`native: true\` property is how \`callValue\` will recognise one (the interpreter uses \`instanceof NativeFunction\` for the same job).
- \`function callValue(callee, args) {\` is the call itself.
- \`  if (typeof callee !== 'object' ||\` rules out numbers, strings and booleans at once, because their \`typeof\` is not \`'object'\`.
- \`      callee === null ||\` is needed because \`typeof null\` is \`'object'\` (a famous accident in JavaScript); without it, the next line would crash reading a property of \`null\`.
- \`      callee.native !== true) {\` rules out every other object, including arrays and plain objects that are not natives.
- \`    const d = describe(callee);\` names the value with its article, and \`throw new Error('cannot call ' + d);\` gives Drip's message, \`cannot call a number\` or \`cannot call none\`.
- \`  const n = callee.arity;\` reads the expected count once.
- \`  if (args.length !== n) {\` catches both too few and too many; \`!==\` is "is not equal to".
- \`    const word = n === 1 ? 'argument' : 'arguments';\` picks the singular only for arity 1, the way the interpreter's \`plural\` helper does.
- \`    throw new Error(\` with the template literal builds \`area() takes 2 arguments but got 1\` from the native's name, its arity and the count it got. Because this throws, the next line is never reached for a mismatch.
- \`  return callee.fn(args);\` runs the native and hands its result back as the value of the call.

**Common wrong attempts.**

- Writing \`arguments\` every time reads well for most arities but gives \`len() takes 1 arguments\` for arity 1, which is not Drip's message.
- Calling \`callee.fn(args)\` first and checking the arity afterwards returns the right errors, but a native with an effect (printing, pushing onto a list) has already done it by the time you complain.
- Testing only \`if (!callee.native)\` looks shorter, but on \`null\` it crashes with JavaScript's own \`TypeError\` (cannot read properties of null) instead of throwing Drip's \`cannot call none\`.`,
    wrong: [
      {
        code: `function describe(v) {
  if (v === null) return 'none';
  if (Array.isArray(v)) return 'a list';
  return 'a ' + typeof v;
}

function makeNative(name, arity, fn) {
  return {
    native: true, name, arity, fn,
  };
}

function callValue(callee, args) {
  if (typeof callee !== 'object' ||
      callee === null ||
      callee.native !== true) {
    const d = describe(callee);
    throw new Error('cannot call ' + d);
  }
  const n = callee.arity;
  if (args.length !== n) {
    throw new Error(
      \`\${callee.name}() takes \${n} \` +
      \`arguments but got \${args.length}\`
    );
  }
  return callee.fn(args);
}`,
        why: 'For arity 1 this says `1 arguments`; Drip writes `1 argument`. Choose the word from the arity.',
      },
      {
        code: `function describe(v) {
  if (v === null) return 'none';
  if (Array.isArray(v)) return 'a list';
  return 'a ' + typeof v;
}

function makeNative(name, arity, fn) {
  return {
    native: true, name, arity, fn,
  };
}

function callValue(callee, args) {
  if (!callee.native) {
    const d = describe(callee);
    throw new Error('cannot call ' + d);
  }
  const result = callee.fn(args);
  const n = callee.arity;
  if (args.length !== n) {
    const word = n === 1
      ? 'argument' : 'arguments';
    throw new Error(
      \`\${callee.name}() takes \${n} \` +
      \`\${word} but got \${args.length}\`);
  }
  return result;
}`,
        why: 'Two problems: `!callee.native` crashes on `null` with a TypeError rather than `cannot call none`, and the native runs before its arity is checked.',
      },
    ],
  },
  sumAll: {
    optional: true,
    lang: 'drip',
    title: 'Sum a list with len',
    prompt: 'Write `fn sumAll(xs)` that prints the sum of the numbers in the list `xs`, using `len` and a `while` loop with an index (no `for x in`). The program must print `6`, `0` and `10`.',
    starter: `fn sumAll(xs) {
  # your code here
}

sumAll([1, 2, 3]);
sumAll([]);
sumAll([10]);`,
    solution: `fn sumAll(xs) {
  let total = 0;
  let i = 0;
  while i < len(xs) {
    total += xs[i];
    i += 1;
  }
  print total;
}

sumAll([1, 2, 3]);
sumAll([]);
sumAll([10]);`,
    tests: `6
0
10`,
    hints: [
      'You need two variables: a running total, and an index that walks from 0 up to the last position.',
      'The last index is one less than the length, so keep going while `i < len(xs)`.',
      'Inside the loop: `total += xs[i];` and `i += 1;`. After the loop, print the total.',
    ],
    walkthrough: `**How to think about it.** Add the items up the way you would by hand: start a running total at 0, look at each item in turn, add it on. Without \`for x in\`, "each item in turn" means an index \`i\` that goes 0, 1, 2, ... and stops before \`len(xs)\`, because a list of length 3 has positions 0, 1 and 2. The native \`len\` is what tells a Drip program how long a list is.

**The solution, line by line.**

- \`fn sumAll(xs) {\` declares the function, with arity 1.
- \`  let total = 0;\` starts the running total. Starting at 0 also makes the empty list come out right.
- \`  let i = 0;\` is the index of the item to look at next.
- \`  while i < len(xs) {\` calls the native \`len\` each time round (its arity is 1, and it got 1), and keeps going while \`i\` is a real position.
- \`    total += xs[i];\` adds the item at position \`i\`.
- \`    i += 1;\` moves on to the next position.
- \`  }\` ends the loop.
- \`  print total;\` prints the sum: \`6\`, then \`0\` for the empty list (the loop body never runs, because \`0 < 0\` is false), then \`10\`.
- \`}\` ends the function.

**Common wrong attempts.**

- \`while i <= len(xs)\` goes one step too far: on the last round \`xs[i]\` asks for position 3 of a list of length 3, and Drip stops with \`index 3 is out of range for a list of length 3\`.
- Calling \`len()\` with no argument, or \`len(xs, i)\`: \`len\` is a native with arity 1, so both stop with \`len() takes 1 argument but got 0\` (or \`got 2\`).`,
    wrong: [
      {
        code: `fn sumAll(xs) {
  let total = 0;
  let i = 0;
  while i <= len(xs) {
    total += xs[i];
    i += 1;
  }
  print total;
}

sumAll([1, 2, 3]);
sumAll([]);
sumAll([10]);`,
        why: '`<=` reads one position past the end: `index 3 is out of range for a list of length 3`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: `What does this print?
\`\`\`
let xs = [1, 2];
let ys = xs;
ys[0] = 9;
print xs;
\`\`\``,
    options: [
      {
        t: '`[1, 2]`',
        why: '`ys` is not a copy: it names the same list as `xs`.',
      },
      {
        t: '`[9, 2]`',
        correct: true,
        why: 'Both names refer to one list, so writing through `ys` changes what `xs` shows.',
      },
      {
        t: '`[9, 1, 2]`',
        why: 'Index assignment overwrites an element; it does not insert one.',
      },
      {
        t: 'A runtime error',
        why: 'Index 0 exists, so the write is fine.',
      },
    ],
  },
  {
    q: 'Which of these is **not** a runtime error in Drip, with `let xs = [1, 2, 3];`?',
    options: [
      {
        t: '`xs[3]`',
        why: '`index 3 is out of range for a list of length 3`.',
      },
      {
        t: '`xs[1.5]`',
        why: '`index 1.5 is not a whole number`.',
      },
      {
        t: '`xs["0"]`',
        why: '`a list index must be a number, not a string`: Drip never converts a string to a number.',
      },
      {
        t: '`xs[len(xs) - 1]`',
        correct: true,
        why: 'This is index 2, the last element, so it reads `3`.',
      },
    ],
  },
  {
    q: `What does this print?
\`\`\`
let xs = [1, 2];
for x in xs {
  if x < 3 { push(xs, x + 2); }
  print x;
}
\`\`\``,
    options: [
      {
        t: '`1`, `2`',
        why: 'The loop reads the length each time round, so the pushed elements are visited too.',
      },
      {
        t: '`1`, `2`, `3`',
        why: 'The element 4 pushed while visiting 2 is visited as well.',
      },
      {
        t: '`1`, `2`, `3`, `4`',
        correct: true,
        why: 'Visiting 1 pushes 3, visiting 2 pushes 4; 3 and 4 are not below 3, so nothing more is pushed, and all four are printed.',
      },
      {
        t: 'It never ends',
        why: 'Only elements below 3 push, so the list stops growing at length 4.',
      },
    ],
  },
  {
    q: 'What does `print push(xs, 5);` print?',
    options: [
      {
        t: '`none`',
        correct: true,
        why: '`push` appends and returns `none`.',
      },
      {
        t: 'The new length',
        why: 'That is what JavaScript’s `push` returns; Drip’s returns `none`.',
      },
      {
        t: '`5`',
        why: 'That would be `pop` after the push.',
      },
      {
        t: 'The whole list',
        why: '`push` changes the list but does not return it.',
      },
    ],
  },
  {
    q: 'Why does the companion check the list’s length *each time round* a for-in loop, instead of once at the start?',
    options: [
      {
        t: 'To make the loop faster',
        why: 'Reading the length once would be (a little) faster; this is about behaviour.',
      },
      {
        t: 'Because Drip’s specification says pushing inside the loop extends it, as JavaScript’s for...of does for arrays',
        correct: true,
        why: 'That is the behaviour Drip promises, and checking the length before every round is what delivers it.',
      },
      {
        t: 'Because the list is copied at the start of the loop',
        why: 'It is not copied; the loop walks the very list it was given.',
      },
      {
        t: 'Because `len` is a native function',
        why: 'The loop reads `items.length` directly; it does not call `len`.',
      },
    ],
  },
  {
    q: `What does this print?
\`\`\`
fn greet(name) {
  print "hi " + name;
}
print "start";
\`\`\``,
    options: [
      {
        t: '`hi none` then `start`',
        why: 'The body only runs when `greet` is called, and it never is.',
      },
      {
        t: '`start`',
        correct: true,
        why: 'The declaration only defines `greet` as a function value. The one `print` statement that runs prints `start`.',
      },
      {
        t: 'A runtime error: `name` is undefined',
        why: 'Nothing evaluates `name`, because the body never runs.',
      },
      {
        t: '`fn greet` then `start`',
        why: 'A declaration prints nothing. You would see `fn greet` only by printing `greet`.',
      },
    ],
  },
  {
    q: 'Which of these can a Drip call expression run?',
    options: [
      {
        t: 'A class, as in `Point(1, 2)`',
        why: 'Classes are not callable: Drip stops with `cannot call a class: use \'new Point(...)\'`.',
      },
      {
        t: 'The string `"add"`',
        why: 'A string has no code to run: `cannot call a string`.',
      },
      {
        t: 'A list of functions',
        why: 'The list is not a function, even if its items are: `cannot call a list`. Call an item instead: `fs[0]()`.',
      },
      {
        t: '`len`',
        correct: true,
        why: '`len` is a native function, which is one of the two kinds of callable.',
      },
    ],
  },
  {
    q: 'When `add(1, 2)` is called, where are `a` and `b` defined?',
    options: [
      {
        t: 'In a new environment made for this call',
        correct: true,
        why: '`callFunction` makes a fresh environment, defines each parameter in it, and runs the body there.',
      },
      {
        t: 'In the globals',
        why: 'Then two calls, or a recursive call, would overwrite each other’s parameters.',
      },
      {
        t: 'In the caller’s environment',
        why: 'The caller’s variables are untouched. The new environment’s parent is the function’s own stored environment.',
      },
      {
        t: 'In the function value itself',
        why: 'The function value holds the declaration and an environment, not argument values; those belong to one call.',
      },
    ],
  },
  {
    q: `What does this print?
\`\`\`
fn show() { print x; }
let x = "global";
{
  let x = "local";
  show();
}
\`\`\``,
    options: [
      {
        t: '`local`',
        why: 'That would happen if the call’s environment hung off the caller’s. Drip uses where the function was declared.',
      },
      {
        t: 'A runtime error: `x` is undefined',
        why: 'By the time `show()` runs, the global `x` exists.',
      },
      {
        t: '`global`',
        correct: true,
        why: 'The call’s environment hangs off the environment `show` was declared in, the globals, so the lookup never sees the block’s `x`.',
      },
      {
        t: '`none`',
        why: '`x` holds a string in both places.',
      },
    ],
  },
  {
    q: `What does this print?
\`\`\`
let f = fn (x) { print x + 1; };
let g = f;
g(1);
print g;
\`\`\``,
    options: [
      {
        t: '`2` then `fn f`',
        why: 'The function was never given a name: `let f = ...` names the variable, not the function, so it prints as plain `fn`.',
      },
      {
        t: '`2` then `fn`',
        correct: true,
        why: '`g` holds the same anonymous function as `f`, so `g(1)` prints `2`; printing an anonymous function shows `fn`.',
      },
      {
        t: 'A runtime error: `g` is not a function',
        why: '`let g = f;` copies the function value, and a variable holding a function can be called like any other.',
      },
    ],
  },
  {
    q: '`fn f(a, b, c) {}` then `f(1, 2);` What happens?',
    options: [
      {
        t: '`c` is set to `none` and the body runs',
        why: 'That is close to what JavaScript does (with `undefined`). Drip checks arity.',
      },
      {
        t: 'A syntax error',
        why: 'It parses fine. The mismatch is found while running, at the call.',
      },
      {
        t: 'A runtime error: `f() takes 3 arguments but got 2`',
        correct: true,
        why: 'The argument count must match the arity exactly, and the check comes before the body runs.',
      },
      {
        t: 'The missing argument is ignored',
        why: 'Drip never ignores a mismatch; it is an error.',
      },
    ],
  },
  {
    q: 'In JavaScript, `function f(a, b) { return b; }` is called as `f(1)`. What does it return?',
    options: [
      {
        t: '`undefined`',
        correct: true,
        why: 'JavaScript never checks the count: the missing argument leaves `b` as `undefined`.',
      },
      {
        t: 'An error about the argument count',
        why: 'That is Drip’s behaviour, not JavaScript’s.',
      },
      {
        t: '`1`',
        why: 'The `1` goes to the first parameter, `a`; `b` gets nothing.',
      },
    ],
  },
  {
    q: 'What does `print len;` show?',
    options: [
      {
        t: '`fn len`',
        why: 'That is how a Drip function prints. `len` is a native.',
      },
      {
        t: 'A runtime error: `len` needs an argument',
        why: 'Printing a function does not call it, so no arity check happens.',
      },
      {
        t: '`native fn len`',
        correct: true,
        why: 'A native prints as `native fn` and its name.',
      },
    ],
  },
  {
    q: 'Which happens when Drip runs `push(xs, 3)`, but NOT when it runs a call to a Drip function?',
    options: [
      {
        t: 'The arguments are evaluated left to right',
        why: 'Every call does that.',
      },
      {
        t: 'TypeScript code runs with the argument list, and no Drip environment is made',
        correct: true,
        why: 'A native hands its arguments straight to TypeScript; a Drip function gets a new environment with its parameters in it.',
      },
      {
        t: 'The arity is checked',
        why: 'Both kinds of call check the arity first.',
      },
    ],
  },
  {
    q: 'Why does the interpreter provide `clock` as a native function?',
    options: [
      {
        t: 'Natives run faster, and clock is called often',
        why: 'Speed can be a reason for a native, but here the reason is more basic.',
      },
      {
        t: 'Functions with zero parameters must be native',
        why: 'You can declare `fn f() { ... }` in Drip with arity 0.',
      },
      {
        t: 'So that it skips the arity check',
        why: 'Calling `clock` goes through the same arity check; its arity is 0, so `clock(1)` is an error.',
      },
      {
        t: 'Drip has no way to read the time itself, so the host language must',
        correct: true,
        why: 'No Drip expression can ask the outside world anything; `clock` wraps `performance.now()` from TypeScript.',
      },
    ],
  },
];
