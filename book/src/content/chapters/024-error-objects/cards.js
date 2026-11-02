// Chapter 24 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'error-props': {
    q: 'Which two standard properties does every Error object have (its own or inherited)?',
    a: '`name` (the kind of error, e.g. `\'TypeError\'`) and `message` (the text describing it).',
  },
  'builtin-kinds': {
    q: 'Which kind of error does `null.x` throw, and which does reading a name that was never declared throw?',
    a: '`null.x` throws a `TypeError`; an undeclared name throws a `ReferenceError`.',
  },
  'throw-string': {
    q: 'You `throw \'oops\'` (a string) and catch it as `e`. What is `e.message`, and why?',
    a: '`undefined`: `e` is the string itself, and strings have no `message` property. Throw `new Error(...)` instead.',
  },
  'custom-error': {
    q: 'In `class ParseError extends Error`, what does `super(message)` do in the constructor?',
    a: 'Runs Error’s own constructor first, so the new error’s `message` is set up properly (and `this` can be used afterwards).',
  },
  rethrow: {
    q: 'Why might a `catch` block contain `throw e;`?',
    a: 'To pass on an error it doesn’t know how to handle, so it keeps unwinding to code that does.',
  },
  'unwind-what': {
    q: '`C` calls `B`, `B` calls `A`, and `A` throws. Only `C` has a `try`, around its call to `B`. What happens to `B`’s frame?',
    a: 'It is popped without returning or finishing its line; the error carries on down to C’s `catch`.',
  },
  'propagate-why': {
    q: 'Why is it useful that an error travels down the stack by itself?',
    a: 'The function that notices a problem is often far from the code that knows what to do; no function in between has to check for and pass on error values.',
  },
  'finally-unwind': {
    q: 'An error unwinds through a function that has `try { ... } finally { ... }` but no `catch`. Does the `finally` block run?',
    a: 'Yes. It runs as the error passes, and then the error keeps unwinding.',
  },
};

export const examples = {
  unwind: {
    title: 'Thrown from deep inside a recursion',
    code: `class ParseError extends Error {
  constructor(message, pos) {
    super(message);
    this.name = 'ParseError';
    this.pos = pos;
  }
}

// the value of s up to index i,
// one call per digit
function value(s, i) {
  if (i < 0) return 0;
  const d = s.charCodeAt(i) - 48;
  if (d < 0 || d > 9) {
    const m = 'bad digit';
    throw new ParseError(m, i);
  }
  return value(s, i - 1) * 10 + d;
}

function parse(s) {
  return value(s, s.length - 1);
}

for (const s of ['123', '1x3', '42']) {
  try {
    console.log(s, '=', parse(s));
  } catch (e) {
    if (!(e instanceof ParseError)) {
      throw e;
    }
    console.log(s, e.message, e.pos);
  }
}`,
  },
};

export const exercises = {
  parseError: {
    title: 'An error that knows where',
    prompt: `Write two things.

1. A class \`ParseError\` that **extends Error**. Its constructor takes \`(message, pos)\`; the error's \`message\` is \`message\`, its \`name\` is \`'ParseError'\`, and it has a property \`pos\` holding \`pos\`.
2. A function \`expectDigit(s, i)\` that returns the value of the digit at index \`i\` of \`s\` (so \`expectDigit('42', 1)\` is \`2\`). If the character there is not a digit, **or \`i\` is past the end of \`s\`**, it throws \`new ParseError('expected a digit', i)\`.`,
    starter: `class ParseError extends Error {
  // your constructor here
}

function expectDigit(s, i) {
  // your code here
}

console.log(expectDigit('42', 1));`,
    solution: `class ParseError extends Error {
  constructor(message, pos) {
    super(message);
    this.name = 'ParseError';
    this.pos = pos;
  }
}

function expectDigit(s, i) {
  const c = s.charCodeAt(i);
  if (!(c >= 48 && c <= 57)) {
    const m = 'expected a digit';
    throw new ParseError(m, i);
  }
  return c - 48;
}`,
    tests: `function caught(f) {
  try {
    f();
  } catch (e) {
    return e;
  }
  return null;
}
test('digits come back as numbers', () => {
  expect(expectDigit('42', 0)).toBe(4);
  expect(expectDigit('42', 1)).toBe(2);
});
test('a ParseError is an Error', () => {
  const e = caught(() => expectDigit('4x', 1));
  expect(e instanceof ParseError).toBe(true);
  expect(e instanceof Error).toBe(true);
});
test('name, message and pos', () => {
  const e = caught(() => expectDigit('4x', 1));
  expect(e.name).toBe('ParseError');
  expect(e.message).toBe('expected a digit');
  expect(e.pos).toBe(1);
});
test('past the end is not a digit', () => {
  const e = caught(() => expectDigit('4', 1));
  expect(e instanceof ParseError).toBe(true);
  expect(e.pos).toBe(1);
});
test('it travels out of other calls', () => {
  function two(s) {
    return expectDigit(s, 0) * 10 +
      expectDigit(s, 1);
  }
  expect(two('42')).toBe(42);
  const e = caught(() => two('x2'));
  expect(e.pos).toBe(0);
});`,
    hints: [
      'Start with the class. Its constructor has three jobs: hand the message to Error, set the name, and store the position. Which one has to come first?',
      '`super(message)` must come first, before any use of `this`. Then `this.name = \'ParseError\';` and `this.pos = pos;`.',
      'For `expectDigit`, read `const c = s.charCodeAt(i);`. Past the end, `c` is `NaN`, and every comparison with `NaN` is false, so test the *good* case and negate it: `if (!(c >= 48 && c <= 57)) { ... throw new ParseError(...) }`, then `return c - 48;`.',
    ],
    walkthrough: `**How to think about it.** There are two separate pieces. The class is a recipe for a new kind of Error, and its constructor must do what every Error's constructor does (store the message), plus our own extras (a name and a position). The function is the guard you wrote in the last chapter, with one twist: it must refuse an index past the end of the string as well, and it must throw our new kind of error rather than a plain one.

**The class, line by line.**

- \`class ParseError extends Error {\` declares a new class that is a special kind of Error: every ParseError is also an Error, so \`instanceof Error\` is true for it.
- \`  constructor(message, pos) {\` runs every time someone writes \`new ParseError(...)\`, with the two arguments.
- \`    super(message);\` runs Error's own constructor with the message, which sets \`this.message\`. In a class that extends another, \`super\` must be called before \`this\` is used, so it comes first.
- \`    this.name = 'ParseError';\` replaces the name it inherited (\`'Error'\`), so printing the error shows \`ParseError: expected a digit\`.
- \`    this.pos = pos;\` stores the extra detail, the index where the problem is.
- \`  }\` and \`}\` close the constructor and the class.

**The function, line by line.**

- \`function expectDigit(s, i) {\` takes the string and the index to look at.
- \`  const c = s.charCodeAt(i);\` reads the char code. For an index past the end, \`charCodeAt\` returns \`NaN\` ("not a number").
- \`  if (!(c >= 48 && c <= 57)) {\` asks "is it *not* true that \`c\` is a digit code?". Writing it this way matters: \`NaN >= 48\` is false, so the inside \`&&\` is false, and the \`!\` makes the whole test true, so a past-the-end index is refused too.
- \`    const m = 'expected a digit';\` names the message (only to keep the next line short).
- \`    throw new ParseError(m, i);\` makes our kind of error, with the position, and throws it. The function stops here.
- \`  }\` ends the check.
- \`  return c - 48;\` is only reached for a real digit, and turns its code into its value.
- \`}\` closes the function.

The last test calls \`expectDigit\` from inside another function, \`two\`. When \`two('x2')\` runs, the very first \`expectDigit\` throws; \`two\`'s frame is popped before it can multiply or add, and the error lands in the test's \`try\` with \`pos\` 0. Nothing in \`two\` had to know that errors were possible.

**Common wrong attempts.**

- Leaving out \`this.name = 'ParseError'\`: everything works except the name, which stays \`'Error'\`, so the printed message says the wrong kind.
- Throwing \`new Error('expected a digit')\`: the message is right, but \`instanceof ParseError\` is false and there is no \`pos\`, so a \`catch\` cannot recognise or locate it.
- Testing \`if (c < 48 || c > 57)\`: this works for every real character, but past the end \`c\` is \`NaN\`, both comparisons are false, nothing is thrown, and the function returns \`NaN - 48\`, which is \`NaN\`: a quiet wrong answer.
- Using \`this\` before calling \`super\`: JavaScript stops with a \`ReferenceError\`, because the Error part of the object does not exist until \`super\` has run.`,
    wrong: [
      {
        code: `class ParseError extends Error {
  constructor(message, pos) {
    super(message);
    this.pos = pos;
  }
}

function expectDigit(s, i) {
  const c = s.charCodeAt(i);
  if (!(c >= 48 && c <= 57)) {
    const m = 'expected a digit';
    throw new ParseError(m, i);
  }
  return c - 48;
}`,
        why: 'The name is never set, so it stays `\'Error\'`, inherited from Error. Add `this.name = \'ParseError\';`.',
      },
      {
        code: `class ParseError extends Error {
  constructor(message, pos) {
    super(message);
    this.name = 'ParseError';
    this.pos = pos;
  }
}

function expectDigit(s, i) {
  const c = s.charCodeAt(i);
  if (!(c >= 48 && c <= 57)) {
    const m = 'expected a digit';
    throw new Error(m);
  }
  return c - 48;
}`,
        why: 'This throws a plain Error, so `instanceof ParseError` is false and there is no `pos`. Throw `new ParseError(m, i)`.',
      },
      {
        code: `class ParseError extends Error {
  constructor(message, pos) {
    super(message);
    this.name = 'ParseError';
    this.pos = pos;
  }
}

function expectDigit(s, i) {
  const c = s.charCodeAt(i);
  if (c < 48 || c > 57) {
    const m = 'expected a digit';
    throw new ParseError(m, i);
  }
  return c - 48;
}`,
        why: 'Past the end, `c` is `NaN`, and `NaN < 48` and `NaN > 57` are both false, so nothing is thrown and the function returns `NaN`. Test the good case and negate it.',
      },
    ],
  },
  attempt: {
    optional: true,
    title: 'Turn a throw into a value',
    prompt: 'Write `attempt(f)`. It calls the function `f` with no arguments. If `f` returns a value `v`, `attempt` returns `{ ok: true, value: v }`. If `f` throws an Error, `attempt` returns `{ ok: false, error: message }`, where `message` is the error’s message. `attempt` itself must never throw.',
    starter: `function attempt(f) {
  // your code here
}

console.log(attempt(() => 42));`,
    solution: `function attempt(f) {
  try {
    const v = f();
    return { ok: true, value: v };
  } catch (e) {
    const m = e.message;
    return { ok: false, error: m };
  }
}`,
    tests: `test('a normal result', () => {
  const r = attempt(() => 42);
  expect(r).toEqual({ ok: true, value: 42 });
});
test('a thrown error becomes a value', () => {
  const r = attempt(() => {
    throw new Error('nope');
  });
  expect(r).toEqual({ ok: false, error: 'nope' });
});
test('errors from deeper calls too', () => {
  const inner = () => null.x;
  const r = attempt(() => inner());
  expect(r.ok).toBe(false);
});
test('calls f exactly once', () => {
  let calls = 0;
  attempt(() => { calls++; return 1; });
  expect(calls).toBe(1);
});`,
    hints: [
      'There are two ways `f()` can end. Which statement lets you write separate code for each?',
      'Put `const v = f();` inside a `try` block, and return the `ok: true` object right there.',
      'In `catch (e)`, return `{ ok: false, error: e.message }`.',
    ],
    walkthrough: `**How to think about it.** This turns an exception back into an ordinary value, so that the caller can decide what to do with it later, without a \`try\` of its own. The call \`f()\` either returns or throws, and try/catch gives each outcome its own block, so each block builds one of the two result objects.

**The solution, line by line.**

- \`function attempt(f) {\` takes the function to run.
- \`  try {\` protects everything inside it: a throw from \`f\`, or from anything \`f\` calls, lands in the \`catch\` below.
- \`    const v = f();\` calls \`f\` exactly once and keeps its result.
- \`    return { ok: true, value: v };\` only runs if \`f\` returned normally, and reports success.
- \`  } catch (e) {\` runs only if something threw; \`e\` is the thrown Error.
- \`    const m = e.message;\` reads its message.
- \`    return { ok: false, error: m };\` reports the failure as a plain object.
- \`  }\` and \`}\` close the \`catch\` and the function.

The third test throws a \`TypeError\` two calls deep (reading \`.x\` of \`null\` inside \`inner\`). \`attempt\` catches it anyway: propagation carries every error down to the nearest \`try\`, and the frame for \`inner\` is popped on the way.

Some languages, Rust among them, return result objects like this instead of throwing; you will meet that style in Track B.

**Common wrong attempts.**

- No \`try\` at all: an error thrown by \`f\` unwinds straight through \`attempt\`.
- Putting the whole Error object in \`error\` instead of its message.
- Calling \`f\` once to test it and again for the value, which runs it twice on success.`,
    wrong: [
      {
        code: `function attempt(f) {
  const v = f();
  return { ok: true, value: v };
}`,
        why: 'Without a `try`, an error thrown by `f` unwinds straight through `attempt`, which then throws instead of returning a result.',
      },
      {
        code: `function attempt(f) {
  try {
    return { ok: true, value: f() };
  } catch (e) {
    return { ok: false, error: e };
  }
}`,
        why: 'Close, but `error` holds the whole Error object rather than its message. Use `e.message`.',
      },
      {
        code: `function attempt(f) {
  try {
    f();
  } catch (e) {
    const m = e.message;
    return { ok: false, error: m };
  }
  return { ok: true, value: f() };
}`,
        why: 'This calls `f` twice on success: once to test it and once for the value. If `f` has side effects (or is slow) that is a bug. Keep the first result.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'You `throw \'oops\'` (a string) and catch it as `e`. What is `e.message`?',
    options: [
      {
        t: '`undefined`',
        correct: true,
        why: '`e` is the string itself, and strings have no `message` property. That’s why we throw Error objects.',
      },
      {
        t: '`\'oops\'`',
        why: 'Only Error objects have a `message`; `e` here is just a string.',
      },
      {
        t: '`\'Error\'`',
        why: 'That would be the `name` of an Error object; this is a plain string.',
      },
      {
        t: 'It throws a second error',
        why: 'Reading a missing property gives `undefined`, it doesn’t throw.',
      },
    ],
  },
  {
    q: 'What does `e instanceof ParseError` let a `catch` block do?',
    options: [
      {
        t: 'Make the error stop unwinding',
        why: 'Being inside `catch` already did that.',
      },
      {
        t: 'Handle parse errors and rethrow other kinds',
        correct: true,
        why: 'It tells the kinds of error apart, so the `catch` only deals with the ones it understands.',
      },
      {
        t: 'Print the stack trace',
        why: '`instanceof` only checks whether an object is an instance of a class.',
      },
      {
        t: 'Convert the error to a string',
        why: 'It returns `true` or `false`.',
      },
    ],
  },
  {
    q: '`a()` calls `b()`, which calls `c()`, which throws. Only `a` has a `try/catch` around its call to `b`. What happens?',
    options: [
      {
        t: '`c` returns `undefined` to `b`',
        why: 'A throw never returns. `c`’s frame is popped without producing a value.',
      },
      {
        t: 'The program stops, because `c` has no `catch`',
        why: 'The error keeps unwinding until it finds a `try`, and `a` has one.',
      },
      {
        t: '`b` catches it automatically',
        why: 'Only code inside a `try` catches errors.',
      },
      {
        t: '`c` and `b` are popped without finishing, and `a`’s `catch` runs',
        correct: true,
        why: 'The error propagates down the stack to the nearest `try`.',
      },
    ],
  },
  {
    q: `What does this print?
\`\`\`
function b() {
  try {
    throw new Error('x');
  } finally {
    console.log('f');
  }
}
try { b(); }
catch (e) { console.log(e.message); }
\`\`\``,
    options: [
      {
        t: '`f`, then `x`',
        correct: true,
        why: '`b` has no `catch`, but its `finally` runs as the error passes; then the outer `catch` prints the message.',
      },
      {
        t: '`x`, then `f`',
        why: 'The `finally` in `b` runs first, on the error’s way out of `b`.',
      },
      {
        t: '`x` only',
        why: 'A `finally` block runs even while an error is unwinding.',
      },
    ],
  },
  {
    q: 'A JavaScript parser made of recursive functions notices bad input deep inside nested calls. Why is throwing an error a common choice there, rather than returning a special value?',
    options: [
      {
        t: 'Throwing is faster than returning',
        why: 'Speed isn’t the reason, and throwing is usually not faster.',
      },
      {
        t: 'JavaScript functions can’t return objects',
        why: 'They can return anything.',
      },
      {
        t: 'The problem is noticed deep in recursive calls, and a throw carries it straight to the code that reports it',
        correct: true,
        why: 'Every function in between would otherwise have to check for and pass along the special value.',
      },
      {
        t: 'Return values can’t contain strings',
        why: 'They can.',
      },
    ],
  },
];
