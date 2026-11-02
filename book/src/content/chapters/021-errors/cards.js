// Chapter 21 cards. Keys are stable ids: never rename them.

export const prompts = {
  'throw-what': {
    q: 'What does `throw new Error(\'x\')` do to the function it runs in?',
    a: 'Stops it immediately, without returning anything, and raises an exception carrying the Error object.',
  },
  'throw-vs-return': {
    q: 'Why is throwing better than returning a strange value like `-1` when a function can’t do its job?',
    a: 'A strange value flows on silently and causes a bug far away; a throw stops the program right where the problem is, unless some code handles it.',
  },
  'catch-when': {
    q: 'When does a `catch` block run?',
    a: 'Only when something inside the matching `try` block throws (including code in functions it calls).',
  },
  'try-skip': {
    q: 'Line 2 of a 4-line `try` block throws. Do lines 3 and 4 run?',
    a: 'No. The rest of the `try` block is skipped and control jumps to `catch`; it never goes back.',
  },
  'catch-e': {
    q: 'In `catch (e) { ... }`, what does `e` hold?',
    a: 'The value that was thrown, usually an Error object (so `e.message` is its text).',
  },
  'finally-when': {
    q: 'When does a `finally` block run?',
    a: 'Always, after the `try` (and the `catch`, if it ran), whether or not anything was thrown, even after a `return`.',
  },
  'block-scope': {
    q: '`try { const n = 5; } catch (e) {}` then `console.log(n);`. What happens, and why?',
    a: 'A `ReferenceError`: `const n` is block-scoped, so it exists only inside the `try` braces. Declare it before the `try`.',
  },
  'other-langs': {
    q: 'C has no exceptions. How does a C function like `strtol` report that its input was bad?',
    a: 'Through what it returns or fills in (here, `end` pointing at the bad character); every caller must check by hand.',
  },
};

export const examples = {
  'try-it': {
    title: 'A tiny REPL that survives bad lines',
    code: `function toNumber(s) {
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
}

const inputs = ['12', '4x', '7'];
for (const line of inputs) {
  try {
    const n = toNumber(line);
    console.log(line, '->', n * 2);
  } catch (e) {
    console.log('error:', e.message);
  } finally {
    console.log('ready');
  }
}
console.log('session over');`,
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
      'Start from `toNumber` in the chapter. The new work is two checks that `throw` instead of carrying on. Which two inputs should be refused?',
      'Check for the empty string first, before the loop: `if (s.length === 0) { ... }`. An empty string would otherwise give `0`, which looks like a real answer.',
      'Inside the loop, a character is not a digit when its code is below 48 or above 57: `c < 48 || c > 57`. Build the message with a template literal, `` `bad digit at ${i}` ``, and `throw new Error(m)`.',
    ],
    walkthrough: `**How to think about it.** Begin by asking which inputs \`toNumber\` gets wrong. There are two kinds. An empty string never enters the loop, so \`n\` stays \`0\` and comes back as if \`''\` meant zero. A string with a non-digit in it runs the arithmetic on a nonsense "digit" and returns a nonsense number. Each of those needs a check that refuses, and the refusal must be a \`throw\` so that the call never produces a value at all. The rest of \`toNumber\` (the loop and the arithmetic) is already right, so we keep it.

**The solution, line by line.**

- \`function parseDigits(s) {\` defines the function with one parameter, the string to read.
- \`  if (s.length === 0) {\` checks the empty case first, before any work starts: a guard at the top of the function.
- \`    throw new Error('empty number');\` makes an Error object with the message the tests expect and throws it. The function stops here; nothing below runs for \`''\`.
- \`  }\` ends the guard.
- \`  let n = 0;\` starts the running total, exactly as in \`toNumber\`.
- \`  for (let i = 0; i < s.length; i++) {\` visits each character by its index \`i\`.
- \`    const c = s.charCodeAt(i);\` reads the char code of character \`i\` (\`'0'\` is 48 and \`'9'\` is 57).
- \`    if (c < 48 || c > 57) {\` is true when the code is outside the digit range, which means this character is not a digit.
- \`\` const m = \`bad digit at \${i}\`; \`\` builds the message, putting the index into it with a template literal: for \`'4x'\` it is \`'bad digit at 1'\`, for \`'-5'\` it is \`'bad digit at 0'\`. (It sits on its own line only to keep the line short.)
- \`      throw new Error(m);\` throws an Error carrying that message. The loop never finishes and \`return n\` is never reached.
- \`    }\` ends the check.
- \`    n = n * 10 + (c - 48);\` is only reached for real digits: shift the total one place left and add this digit.
- \`  }\` ends the loop.
- \`  return n;\` returns the finished number. If we get here, every character was a digit, so the number is real.
- \`}\` closes the function.

Notice what you *don't* need: no special "failed" value, and no check after every call. Code that calls \`parseDigits\` can trust that a returned number is real, because a bad input never returns.

**Common wrong attempts.**

- Returning \`-1\` for bad input. This is the quiet wrong answer again: \`-1\` looks like a number, every caller has to remember to check for it, and it does not say which character was wrong.
- Throwing a plain string, \`throw 'bad digit at ' + i\`. It does stop the function, but a string has no \`message\` property, so \`e.message\` is \`undefined\` in every \`catch\` (the next chapter looks inside Error objects). Always throw \`new Error(...)\`.
- Printing a warning with \`console.log\` instead of throwing. Printing is not stopping: the function carries on and still returns \`112\` for \`'4x'\`, and the calling code never finds out.
- Forgetting the empty string: \`parseDigits('')\` then returns \`0\` without complaint.`,
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
  orDefault: {
    optional: true,
    title: 'A fallback value',
    prompt:
      'Write `orDefault(f, d)`. It calls the function `f` with no arguments and returns what `f` returns; but if `f` throws, it returns `d` instead. `orDefault` itself must never throw. For example `orDefault(() => 5, 0)` is `5`, and `orDefault(() => { throw new Error(\'no\'); }, 0)` is `0`.',
    starter: `function orDefault(f, d) {
  // your code here
}

console.log(orDefault(() => 5, 0));`,
    solution: `function orDefault(f, d) {
  try {
    return f();
  } catch (e) {
    return d;
  }
}`,
    tests: `test('a normal result comes back', () => {
  expect(orDefault(() => 5, 0)).toBe(5);
});
test('a throw gives the default', () => {
  const bad = () => {
    throw new Error('no');
  };
  expect(orDefault(bad, 0)).toBe(0);
});
test('errors from deeper calls too', () => {
  const inner = () => null.x;
  expect(orDefault(() => inner(), 'd'))
    .toBe('d');
});
test('calls f exactly once', () => {
  let calls = 0;
  orDefault(() => { calls++; return 1; }, 0);
  expect(calls).toBe(1);
});`,
    hints: [
      'The risky part is the call `f()`. Where must a risky call go so that a throw can be caught?',
      'Put `return f();` inside a `try` block. If it succeeds, that `return` hands the value straight back.',
      'Add `catch (e) { return d; }`: it only runs when `f` threw.',
    ],
    walkthrough: `**How to think about it.** There are exactly two ways the call \`f()\` can end: it returns a value, or it throws. We want the value in the first case and \`d\` in the second, which is precisely the shape of try/catch: the normal path goes in \`try\`, and the "it threw" path goes in \`catch\`.

**The solution, line by line.**

- \`function orDefault(f, d) {\` takes the function to try and the fallback value.
- \`  try {\` starts the protected block: any throw inside it, or inside any function it calls, jumps to the \`catch\` below.
- \`    return f();\` calls \`f\`. If \`f\` returns normally, this \`return\` sends its value straight back to our caller and we are done. If \`f\` throws, the \`return\` never happens.
- \`  } catch (e) {\` runs only when the call threw; \`e\` holds whatever was thrown (we do not need it here).
- \`    return d;\` hands back the fallback instead.
- \`  }\` and \`}\` close the \`catch\` and the function.

The third test throws a \`TypeError\` from inside another function (\`inner\` reads \`.x\` of \`null\`), and \`orDefault\` still catches it, because a \`catch\` covers everything that happens while its \`try\` block runs, however many calls deep.

**Common wrong attempts.**

- Calling \`f()\` once to "test" it and then again for the value: on success \`f\` runs twice, which is a bug when \`f\` does something (prints, counts, reads input) or is slow. Keep the first result.
- Leaving out the \`try\`: then a throw in \`f\` goes straight through \`orDefault\`, which throws instead of returning \`d\`.`,
    wrong: [
      {
        code: `function orDefault(f, d) {
  return f();
}`,
        why: 'Without a `try`, an error thrown by `f` passes straight through `orDefault`, which then throws instead of returning `d`.',
      },
      {
        code: `function orDefault(f, d) {
  try {
    f();
  } catch (e) {
    return d;
  }
  return f();
}`,
        why: 'This calls `f` twice on success: once to test it and once for the value. If `f` has side effects (or is slow) that is a bug. Return the first result.',
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
    q: `What does this print?
\`\`\`
try {
  console.log('a');
} catch (e) {
  console.log('b');
} finally {
  console.log('c');
}
\`\`\``,
    options: [
      { t: '`a`, `b`, `c`', why: 'Nothing threw, so the `catch` block is skipped.' },
      { t: '`a`', why: '`finally` runs whether or not anything was thrown.' },
      { t: '`b`, `c`', why: 'The `try` block runs first, and it prints `a`.' },
      { t: '`a`, `c`', correct: true, why: 'The `try` block finishes normally, `catch` is skipped, and `finally` runs anyway.' },
    ],
  },
  {
    q: 'When does a `finally` block run?',
    options: [
      { t: 'Only if an error was thrown', why: 'That describes `catch`.' },
      { t: 'Always, after the `try` and any `catch`', correct: true, why: 'That is its job: clean-up that must happen however the `try` ended, even after a `return`.' },
      { t: 'Only if no error was thrown', why: '`finally` doesn’t depend on whether anything was thrown.' },
      { t: 'Only if there is no `catch` block', why: '`finally` can sit alongside a `catch`, and runs in both cases.' },
    ],
  },
  {
    q: `What happens here?
\`\`\`
try {
  const n = 5;
} catch (e) {}
console.log(n);
\`\`\``,
    options: [
      { t: 'It prints `5`', why: '`const n` is block-scoped: it only exists between the `try` braces.' },
      { t: 'It prints `undefined`', why: 'The name `n` does not exist out here at all, which is different from holding `undefined`.' },
      { t: 'A `ReferenceError`: `n is not defined`', correct: true, why: 'The `try` block is a block like any other, so `n` vanished at its closing brace. Declare `let n` before the `try`.' },
    ],
  },
  {
    q: 'Which language has no exceptions, so a caller must check a returned value to find out that something failed?',
    options: [
      { t: 'Python', why: 'Python has exceptions: `raise`, `try` and `except`.' },
      { t: 'Java', why: 'Java has exceptions, and even makes you declare some of them.' },
      { t: 'C', correct: true, why: 'C functions report failure through return values (or values they fill in), and every caller must check by hand.' },
    ],
  },
];
