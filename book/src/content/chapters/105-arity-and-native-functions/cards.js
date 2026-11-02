// Chapter 104 (second half: arity and natives) cards. Keys are stable ids.

export const prompts = {
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

const describe = `function describe(v) {
  if (v === null) return 'none';
  if (Array.isArray(v)) return 'a list';
  return 'a ' + typeof v;
}`;

const solution = `${describe}

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
}`;

const plural = `${describe}

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
}`;

const late = `${describe}

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
}`;

export const exercises = {
  callValue: {
    title: 'Calls with arity checks',
    prompt: `Write the two halves of a native call, in plain JavaScript. The helper \`describe(v)\` is written for you: it gives \`'none'\` for \`null\`, \`'a list'\` for an array, and otherwise \`'a '\` plus the \`typeof\` (\`'a number'\`, \`'a string'\`).

- \`makeNative(name, arity, fn)\` returns a native: an object \`{ native: true, name, arity, fn }\`.
- \`callValue(callee, args)\` calls \`callee\` with the array \`args\`. If \`callee\` is not an object whose \`native\` property is \`true\` (numbers, strings, \`null\` and arrays are not), throw an \`Error\` whose message is \`'cannot call '\` plus \`describe(callee)\`. If \`args.length\` differs from \`callee.arity\`, throw \`len() takes 1 argument but got 2\` (with the native's own name and numbers, and \`argument\` singular only when the arity is 1) **without** running \`fn\`. Otherwise return \`callee.fn(args)\`.`,
    starter: `${describe}

function makeNative(name, arity, fn) {
  // your code here
}

function callValue(callee, args) {
  // your code here
}

const add = makeNative('add', 2,
  (xs) => xs[0] + xs[1]);
console.log(callValue(add, [1, 2]));`,
    solution,
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
        code: plural,
        why: 'For arity 1 this says `1 arguments`; Drip writes `1 argument`. Choose the word from the arity.',
      },
      {
        code: late,
        why: 'Two problems: `!callee.native` crashes on `null` with a TypeError rather than `cannot call none`, and the native runs before its arity is checked.',
      },
    ],
  },
  sumAll: {
    optional: true,
    lang: 'drip',
    title: 'Sum a list with len',
    prompt:
      'Write `fn sumAll(xs)` that prints the sum of the numbers in the list `xs`, using `len` and a `while` loop with an index (no `for x in`). The program must print `6`, `0` and `10`.',
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
    q: '`fn f(a, b, c) {}` then `f(1, 2);` What happens?',
    options: [
      { t: '`c` is set to `none` and the body runs', why: 'That is close to what JavaScript does (with `undefined`). Drip checks arity.' },
      { t: 'A syntax error', why: 'It parses fine. The mismatch is found while running, at the call.' },
      { t: 'A runtime error: `f() takes 3 arguments but got 2`', correct: true, why: 'The argument count must match the arity exactly, and the check comes before the body runs.' },
      { t: 'The missing argument is ignored', why: 'Drip never ignores a mismatch; it is an error.' },
    ],
  },
  {
    q: 'In JavaScript, `function f(a, b) { return b; }` is called as `f(1)`. What does it return?',
    options: [
      { t: '`undefined`', correct: true, why: 'JavaScript never checks the count: the missing argument leaves `b` as `undefined`.' },
      { t: 'An error about the argument count', why: 'That is Drip’s behaviour, not JavaScript’s.' },
      { t: '`1`', why: 'The `1` goes to the first parameter, `a`; `b` gets nothing.' },
    ],
  },
  {
    q: 'What does `print len;` show?',
    options: [
      { t: '`fn len`', why: 'That is how a Drip function prints. `len` is a native.' },
      { t: 'A runtime error: `len` needs an argument', why: 'Printing a function does not call it, so no arity check happens.' },
      { t: '`native fn len`', correct: true, why: 'A native prints as `native fn` and its name.' },
    ],
  },
  {
    q: 'Which happens when Drip runs `push(xs, 3)`, but NOT when it runs a call to a Drip function?',
    options: [
      { t: 'The arguments are evaluated left to right', why: 'Every call does that.' },
      { t: 'TypeScript code runs with the argument list, and no Drip environment is made', correct: true, why: 'A native hands its arguments straight to TypeScript; a Drip function gets a new environment with its parameters in it.' },
      { t: 'The arity is checked', why: 'Both kinds of call check the arity first.' },
    ],
  },
  {
    q: 'Why does the interpreter provide `clock` as a native function?',
    options: [
      { t: 'Natives run faster, and clock is called often', why: 'Speed can be a reason for a native, but here the reason is more basic.' },
      { t: 'Functions with zero parameters must be native', why: 'You can declare `fn f() { ... }` in Drip with arity 0.' },
      { t: 'So that it skips the arity check', why: 'Calling `clock` goes through the same arity check; its arity is 0, so `clock(1)` is an error.' },
      { t: 'Drip has no way to read the time itself, so the host language must', correct: true, why: 'No Drip expression can ask the outside world anything; `clock` wraps `performance.now()` from TypeScript.' },
    ],
  },
];
