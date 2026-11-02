// Chapter 13 cards. Keys are stable ids: never rename them.

export const prompts = {
  'throw-what': {
    q: 'What does `throw new Error(\'x\')` do to the function it runs in?',
    a: 'Stops it immediately, without returning, and raises an exception carrying the Error object.',
  },
  'throw-vs-return': {
    q: 'Why is throwing better than returning a strange value like `-1` when a function can’t do its job?',
    a: 'A strange value flows on silently and causes bugs far away; a throw stops the program right where the problem is, unless someone handles it.',
  },
  'catch-when': {
    q: 'When does a `catch` block run?',
    a: 'Only when something inside the matching `try` block throws.',
  },
  'finally-when': {
    q: 'When does a `finally` block run?',
    a: 'Always, after the `try` (and `catch`, if it ran), whether or not anything was thrown.',
  },
  'try-skip': {
    q: 'Line 2 of a 4-line `try` block throws. Do lines 3 and 4 run?',
    a: 'No. The rest of the `try` block is skipped and control jumps to `catch`.',
  },
  'error-props': {
    q: 'Which two properties does every Error object have?',
    a: '`name` (the kind of error, e.g. `\'TypeError\'`) and `message` (the text describing it).',
  },
  'custom-error': {
    q: 'In `class ParseError extends Error`, what does `super(message)` do in the constructor?',
    a: 'Runs Error’s own constructor first, so the new error’s `message` is set up properly.',
  },
  rethrow: {
    q: 'Why might a `catch` block contain `throw e;`?',
    a: 'To pass on an error it doesn’t know how to handle, so it keeps unwinding to code that does.',
  },
  'unwind-what': {
    q: 'A throws inside B, which was called by C, and only C has a `try`. What happens to B’s frame?',
    a: 'It is popped without returning or finishing its line; the error carries on down to C’s `catch`.',
  },
};

export const examples = {
  'try-it': {
    title: 'Which lines run?',
    code: `function check(n) {
  if (n < 0) {
    throw new Error('negative: ' + n);
  }
  return n;
}

try {
  console.log(check(3));
  console.log(check(-1));
  console.log('not reached');
} catch (e) {
  console.log(e.name, e.message);
} finally {
  console.log('finally');
}
console.log('carrying on');`,
  },
};

export const exercises = {
  parseDigits: {
    title: 'Refuse bad input',
    prompt: `Write \`parseDigits(s)\`: like \`toNumber\`, it turns a string of digits into a number. But it must **throw an Error** instead of returning nonsense:

- if \`s\` is empty, throw an Error with the message \`'empty number'\`;
- if the character at index \`i\` isn't a digit, throw an Error with the message \`'bad digit at '\` followed by \`i\` (so \`parseDigits('4x')\` throws \`bad digit at 1\`).`,
    starter: `function parseDigits(s) {
  // your code here
}

console.log(parseDigits('42'));`,
    solution: `function parseDigits(s) {
  if (s.length === 0) {
    throw new Error('empty number');
  }
  let n = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c < 48 || c > 57) {
      const m = \`bad digit at \${i}\`;
      throw new Error(m);
    }
    n = n * 10 + (c - 48);
  }
  return n;
}`,
    tests: `function messageOf(f) {
  try {
    f();
  } catch (e) {
    return e.message;
  }
  return 'did not throw';
}
test('good input still works', () => {
  expect(parseDigits('42')).toBe(42);
  expect(parseDigits('7')).toBe(7);
});
test('a bad character throws', () => {
  expect(() => parseDigits('4x')).toThrow();
});
test('the message says where', () => {
  const m = messageOf(() => parseDigits('4x'));
  expect(m).toBe('bad digit at 1');
  const m2 = messageOf(() => parseDigits('-5'));
  expect(m2).toBe('bad digit at 0');
});
test('the empty string throws', () => {
  const m = messageOf(() => parseDigits(''));
  expect(m).toBe('empty number');
});
test('throws a real Error object', () => {
  let e = null;
  try { parseDigits('a'); } catch (x) { e = x; }
  expect(e instanceof Error).toBe(true);
});`,
    hints: [
      'Start from `toNumber`. The new work is two checks that `throw` instead of carrying on.',
      'Check for the empty string first, before the loop: `if (s.length === 0) { throw new Error(...); }`.',
      'Inside the loop, a character is not a digit when its code is below 48 or above 57: `c < 48 || c > 57`. Build the message with a template literal: `` `bad digit at ${i}` ``.',
    ],
    walkthrough: `This is \`toNumber\` with two guards added.

- **Empty input.** \`''\` would otherwise quietly give 0, which looks like a real answer. So check \`s.length === 0\` first and throw.
- **Bad characters.** In the loop, read the code \`c\`. If it's outside 48–57, it isn't a digit. Build the message from the index (a template literal is perfect) and throw.
- **Throw an Error, not a string.** \`throw 'bad digit'\` is legal JavaScript, but then \`e.message\` is \`undefined\`, and there is no \`name\` either. Always use \`new Error(...)\`.

Notice what you *don't* need: no special return value for "failed", and no check after every call. Code that calls \`parseDigits\` can assume the number it gets back is real. If it isn't, the error is already on its way down the stack.

Your Drip scanner will do exactly this when it meets a character it doesn't recognize, with a line and column in the message.`,
    wrong: [
      {
        code: `function parseDigits(s) {
  let n = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c < 48 || c > 57) {
      return -1;
    }
    n = n * 10 + (c - 48);
  }
  return n;
}`,
        why: 'Returning `-1` is the quiet wrong answer this chapter warns about: callers must remember to check for it, and `-1` looks like a number. It also forgets the empty string. Use `throw new Error(...)`.',
      },
      {
        code: `function parseDigits(s) {
  if (s.length === 0) {
    throw 'empty number';
  }
  let n = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c < 48 || c > 57) {
      throw 'bad digit at ' + i;
    }
    n = n * 10 + (c - 48);
  }
  return n;
}`,
        why: 'This throws plain strings. They do stop the function, but a string has no `message` or `name`, so `e.message` is `undefined` in every `catch`. Throw `new Error(message)`.',
      },
      {
        code: `function parseDigits(s) {
  if (s.length === 0) {
    console.log('empty number');
  }
  let n = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c < 48 || c > 57) {
      console.log('bad digit at ' + i);
    }
    n = n * 10 + (c - 48);
  }
  return n;
}`,
        why: 'Printing a warning is not stopping. The function carries on and still returns nonsense (112 for `\'4x\'`). The calling code never finds out.',
      },
    ],
  },
  attempt: {
    optional: true,
    title: 'Turn a throw into a value',
    prompt:
      'Write `attempt(f)`. It calls the function `f` with no arguments. If `f` returns a value `v`, `attempt` returns `{ ok: true, value: v }`. If `f` throws an Error, `attempt` returns `{ ok: false, error: message }`, where `message` is the error’s message. `attempt` itself must never throw.',
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
      'Put the call `f()` inside a `try` block.',
      'If the call succeeds, build and return the `ok: true` object right there in the `try`.',
      'In `catch (e)`, return the `ok: false` object, using `e.message`.',
    ],
    walkthrough: `This is a small but real pattern: it turns an exception back into an ordinary value, so the caller can decide what to do with it.

- **Try the call.** \`const v = f();\` inside \`try\`. If \`f\` throws, even from a function it called, the error unwinds into this \`try\`'s \`catch\`.
- **Success.** Return \`{ ok: true, value: v }\` from inside the \`try\`.
- **Failure.** In \`catch (e)\`, return \`{ ok: false, error: e.message }\`.

The third test throws a \`TypeError\` two calls deep (reading \`.x\` of \`null\`). \`attempt\` catches it anyway: propagation carries every error down to the nearest \`try\`.

Some languages, Rust among them, return result objects like this instead of throwing. You'll meet that style in Track B.`,
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
    q: `What does this print?
\`\`\`
try {
  console.log('a');
  throw new Error('b');
  console.log('c');
} catch (e) {
  console.log(e.message);
}
\`\`\``,
    options: [
      { t: '`a`, `c`, `b`', why: 'The line after `throw` never runs: the rest of the `try` block is skipped.' },
      { t: '`a`, `b`', correct: true, why: '`a` prints, then the throw jumps straight to `catch`, which prints the message `b`.' },
      { t: '`b`', why: '`a` prints before anything is thrown.' },
      { t: '`a`, then the program stops with an error', why: 'The error is caught, so the program carries on.' },
    ],
  },
  {
    q: 'When does a `finally` block run?',
    options: [
      { t: 'Only if an error was thrown', why: 'That describes `catch`.' },
      { t: 'Only if no error was thrown', why: '`finally` doesn’t depend on whether anything was thrown.' },
      { t: 'Only if there is no `catch` block', why: '`finally` can sit alongside a `catch`, and runs in both cases.' },
      { t: 'Always, after the `try` and any `catch`', correct: true, why: 'That is its job: clean-up that must happen however the `try` ended.' },
    ],
  },
  {
    q: '`a()` calls `b()`, which calls `c()`, which throws. Only `a` has a `try/catch` around its call to `b`. What happens?',
    options: [
      { t: '`c` returns `undefined` to `b`', why: 'A throw never returns. `c`’s frame is popped without producing a value.' },
      { t: 'The program stops, because `c` has no `catch`', why: 'The error keeps unwinding until it finds a `try`, and `a` has one.' },
      { t: '`c` and `b` are popped without finishing, and `a`’s `catch` runs', correct: true, why: 'The error propagates down the stack to the nearest `try`.' },
      { t: '`b` catches it automatically', why: 'Only code inside a `try` catches errors.' },
    ],
  },
  {
    q: 'You `throw \'oops\'` (a string) and catch it as `e`. What is `e.message`?',
    options: [
      { t: '`undefined`', correct: true, why: '`e` is the string itself, and strings have no `message` property. That’s why we throw Error objects.' },
      { t: '`\'oops\'`', why: 'Only Error objects have a `message`; `e` here is just a string.' },
      { t: '`\'Error\'`', why: 'That would be the `name` of an Error object; this is a plain string.' },
      { t: 'It throws a second error', why: 'Reading a missing property gives `undefined`, it doesn’t throw.' },
    ],
  },
  {
    q: 'What does `e instanceof ParseError` let a `catch` block do?',
    options: [
      { t: 'Make the error stop unwinding', why: 'Being inside `catch` already did that.' },
      { t: 'Handle parse errors and rethrow other kinds', correct: true, why: 'It tells the kinds of error apart, so the `catch` only deals with the ones it understands.' },
      { t: 'Print the stack trace', why: '`instanceof` only checks which class made an object.' },
      { t: 'Convert the error to a string', why: 'It returns `true` or `false`.' },
    ],
  },
  {
    q: 'Why does a parser usually throw an error on bad input, rather than return a special value?',
    options: [
      { t: 'Throwing is faster than returning', why: 'Speed isn’t the reason, and throwing is usually not faster.' },
      { t: 'JavaScript functions can’t return objects', why: 'They can return anything.' },
      { t: 'Return values can’t contain strings', why: 'They can.' },
      { t: 'The problem is noticed deep in recursive calls, and a throw carries it straight to the code that reports it', correct: true, why: 'Every function in between would otherwise have to check for and pass along the special value.' },
    ],
  },
];
