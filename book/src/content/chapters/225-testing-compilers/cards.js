// Chapter 225 cards. Keys are stable ids: never rename them.

export const prompts = {
  'oracle-what': {
    q: 'What is a test oracle, and why is it the hard part of testing a compiler?',
    a: 'Whatever tells you the right answer; for a compiler the answer is a whole program’s behaviour, too much to write out by hand for many programs.',
  },
  'golden-what': {
    q: 'What is a golden test? Give one in this repository.',
    a: 'A stored output, checked once, that every later run must match: the Drip corpus’s `# expect:` lines, or the Rust port’s fixtures generated from the TypeScript engine.',
  },
  'dt-oracle': {
    q: 'In Viscosity’s differential test, what plays the role of the expected answer?',
    a: 'The original program: whatever it prints and throws, the compiled program must print and throw too.',
  },
  'dt-errors': {
    q: 'Why does the differential test compare errors, not only printed output?',
    a: 'A compiled program that prints 0 where the original threw a TypeError has changed behaviour, even if every line printed before that matches.',
  },
  'dt-header': {
    q: 'Why does each corpus file also state the layout Viscosity should choose?',
    a: 'A compiler that never transforms anything passes every behaviour check; the header catches a lost optimization.',
  },
  'meta-what': {
    q: 'What does a metamorphic test change, and what does it check?',
    a: 'It changes the input in a way that must not change the answer (shuffle before sorting, delete code that did not run), and checks the answer stays the same.',
  },
  'rt-what': {
    q: 'What is round-trip testing?',
    a: 'Checking that opposite operations undo each other, e.g. parse → print → parse gives the same tree.',
  },
  'rt-identity': {
    q: 'What is Viscosity’s round-trip identity test?',
    a: 'A program with nothing to transform must come out of `compile` byte for byte unchanged, comments included.',
  },
};

export const examples = {
  oracles: {
    title: 'Three oracles for a sort',
    code: `function fast(xs) {
  return [...xs].sort((a, b) => a - b);
}
function slow(xs) {
  const ys = [...xs];
  const n = ys.length;
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++)
      if (ys[j] < ys[i])
        [ys[i], ys[j]] = [ys[j], ys[i]];
  return ys;
}
const text = (v) => JSON.stringify(v);
const same = (a, b) =>
  text(a) === text(b);
const xs = [5, 3, 9, 1, 3];

// Differential: two implementations.
console.log(same(fast(xs), slow(xs)));
// Metamorphic: reversing the input
// must not change the sorted result.
const rev = [...xs].reverse();
console.log(same(fast(xs), fast(rev)));
// Round trip: out to text and back.
const back = JSON.parse(text(xs));
console.log(same(back, xs));`,
  },
};

export const exercises = {
  diffTest: {
    title: 'Compare outcomes, errors included',
    prompt:
      'Write `diffTest(f, g, gen, n)`. For `i` from `0` to `n - 1`, make an input `x = gen(i)` and run both `f(x)` and `g(x)`. An **outcome** is either a returned value or a thrown error. Two outcomes agree if both returned `===` values, or both threw errors with the same `message`. Return the first `x` whose outcomes disagree, or `undefined` if all agree.',
    starter: `function diffTest(f, g, gen, n) {
  for (let i = 0; i < n; i++) {
    const x = gen(i);
    if (f(x) !== g(x)) return x;
  }
  return undefined;
}`,
    solution: `function outcome(fn, x) {
  try {
    return ['ok', fn(x)];
  } catch (e) {
    return ['err', e.message];
  }
}

function diffTest(f, g, gen, n) {
  for (let i = 0; i < n; i++) {
    const x = gen(i);
    const a = outcome(f, x);
    const b = outcome(g, x);
    const same = a[0] === b[0]
      && a[1] === b[1];
    if (!same) return x;
  }
  return undefined;
}`,
    tests: `const id = (i) => i;
test('agreeing versions', () => {
  expect(diffTest((x) => x * 2, (x) => x + x, id, 50))
    .toBe(undefined);
});
test('finds the first difference', () => {
  const f = (x) => x % 7;
  const g = (x) => (x > 20 ? 0 : x % 7);
  expect(diffTest(f, g, id, 50)).toBe(22);
});
test('one throws, one returns', () => {
  const f = (x) => {
    if (x > 3) throw new Error('out of bounds');
    return x;
  };
  const g = (x) => x;
  expect(diffTest(f, g, id, 10)).toBe(4);
});
test('same error: agree', () => {
  const f = (x) => { throw new Error('no'); };
  const g = (x) => { throw new Error('no'); };
  expect(diffTest(f, g, id, 5)).toBe(undefined);
});
test('different messages: disagree', () => {
  const f = (x) => { throw new Error('no'); };
  const g = (x) => { throw new Error('nope'); };
  expect(diffTest(f, g, (i) => 'p' + i, 5)).toBe('p0');
});`,
    hints: [
      'What should happen when `f(x)` throws? Make “what happened” a value you can compare.',
      'Write a helper `outcome(fn, x)` that calls `fn(x)` inside `try`, returning `[\'ok\', value]`, or `[\'err\', message]` from `catch`.',
      'Two outcomes agree when both parts are `===`: the kind (`ok`/`err`) and the value or message.',
      'Return `x`, the input, as soon as they disagree, so the failure can be reproduced.',
    ],
    walkthrough: `**How to think about it.** This is \`runIsolated\` plus \`toEqual\` from Viscosity’s differential test, shrunk to one function call. The starter compares only what \`f\` and \`g\` return, which breaks in two ways: if one of them throws, the starter itself crashes instead of reporting a difference; and if both throw, it cannot tell whether they threw the *same* thing. The fix is to turn "what happened" into a value first (a returned value or an error message, with a label saying which), and only then compare.

**The solution, line by line.**

- \`function outcome(fn, x) {\` runs one implementation on one input and describes what happened.
- \`try { return ['ok', fn(x)]; }\` labels a normal return as \`'ok'\`, with the value.
- \`catch (e) { return ['err', e.message]; }\` labels a throw as \`'err'\`, with the error’s message, so two different errors can be told apart.
- \`for (let i = 0; i < n; i++) {\` tries \`n\` inputs.
- \`const x = gen(i);\` makes the input for this round (a counter, or a seeded random generator).
- \`const a = outcome(f, x); const b = outcome(g, x);\` runs both versions on the same input.
- \`const same = a[0] === b[0] && a[1] === b[1];\` agrees only if both the kind and the value or message are equal.
- \`if (!same) return x;\` returns the input itself, which is what you need to reproduce the bug and keep it as a new test.
- \`return undefined;\` after the loop means every input agreed.

**Common wrong attempts.**

- Wrapping both calls in a single \`try\`: when only \`f\` throws, the \`catch\` swallows it and the disagreement is never reported.
- Replacing every error by the same word: then a \`TypeError\` and a \`RangeError\` agree, though Viscosity’s test insists on the same message.
- Returning \`true\` or \`i\` instead of \`x\`: the caller then has to regenerate the input to see it.`,
    wrong: [
      {
        code: `function diffTest(f, g, gen, n) {
  for (let i = 0; i < n; i++) {
    const x = gen(i);
    try {
      if (f(x) !== g(x)) return x;
    } catch (e) {
      // both threw: fine
    }
  }
  return undefined;
}`,
        why: 'Catching around both calls hides the case where only one throws: `f` throws, the catch swallows it, and the disagreement is never reported.',
      },
      {
        code: `function outcome(fn, x) {
  try {
    return ['ok', fn(x)];
  } catch (e) {
    return ['err', 'error'];
  }
}

function diffTest(f, g, gen, n) {
  for (let i = 0; i < n; i++) {
    const x = gen(i);
    const a = outcome(f, x);
    const b = outcome(g, x);
    const same = a[0] === b[0]
      && a[1] === b[1];
    if (!same) return x;
  }
  return undefined;
}`,
        why: 'Every error looks the same, so two different errors agree. Viscosity checks that the compiled code throws the same message, not just any error.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Viscosity’s differential test needs no expected outputs. Why?',
    options: [
      { t: 'The compiler is assumed correct', why: 'The compiler is exactly what is being tested.' },
      { t: 'The original program’s own behaviour is the expected answer', correct: true, why: 'Compiled code must print and throw exactly what the original does.' },
      { t: 'The tests only check that compiling doesn’t crash', why: 'They run both versions and compare everything they did.' },
      { t: 'Expected outputs are stored in the headers', why: 'Headers state layout decisions, not outputs.' },
    ],
  },
  {
    q: 'With `--bounds assume`, the compiled `out_of_bounds.js` prints `0` where the original throws. Which check catches it?',
    options: [
      { t: 'The header check', why: 'The layout is still soa, so the header matches.' },
      { t: 'The mini-parser test', why: 'That compares two parsers, not original against compiled behaviour.' },
      { t: 'Nothing: the printed lines before it match', why: 'The outcome includes the extra line and the missing error.' },
      { t: 'Comparing the full outcomes, printed lines and error, of both runs', correct: true, why: 'One run ends with a TypeError, the other prints 0 and ends normally: different outcomes.' },
    ],
  },
  {
    q: 'A change makes Viscosity keep every collection as an array of objects. Which tests fail?',
    options: [
      { t: 'The header checks, because the decisions no longer match', correct: true, why: 'Behaviour is unchanged, so only the expected decisions reveal the lost optimization.' },
      { t: 'The behaviour comparisons', why: 'Leaving code alone never changes behaviour.' },
      { t: 'The round-trip identity test', why: 'A program with nothing to transform still comes back unchanged.' },
      { t: 'None', why: 'That is why the corpus pins down decisions as well as behaviour.' },
    ],
  },
  {
    q: 'Which is a metamorphic test?',
    options: [
      { t: 'Running a program under two compilers and comparing', why: 'That is differential testing: two implementations.' },
      { t: 'Comparing an output with one stored last month', why: 'That is a golden test.' },
      { t: 'Deleting code that did not run on an input, and checking the program still behaves the same on that input', correct: true, why: 'One implementation, a change that must not change the answer: that is the EMI method.' },
      { t: 'Parsing, printing and parsing again', why: 'That is a round trip.' },
    ],
  },
  {
    q: 'A printer drops the brackets in `(1 + 2) * 3`. Which test catches it most directly?',
    options: [
      { t: 'A golden test of the parser alone', why: 'The parser is fine; the printer is wrong.' },
      { t: 'A round trip: parse, print, parse, and compare the trees', correct: true, why: 'Printed as `1 + 2 * 3`, it parses to a different tree.' },
      { t: 'Stress GC', why: 'That tests the garbage collector.' },
      { t: 'Test262', why: 'Test262 tests a JavaScript engine against the specification, not this printer.' },
    ],
  },
];
