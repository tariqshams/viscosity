// Chapter 97 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.
// Merged from old chapters 97, 97.

export const prompts = {
  'oracle-what': {
    q: 'What is a test oracle, and why is it the hard part of testing a compiler?',
    a: 'Whatever tells you the right answer; for a compiler the answer is a whole program’s behaviour, too much to write out by hand for many programs.',
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
    a: 'A compiler that never transforms anything passes every behaviour check; the header catches a lost optimisation.',
  },
  'rt-what': {
    q: 'What is round-trip testing?',
    a: 'Checking that opposite operations undo each other, e.g. parse → print → parse gives the same tree.',
  },
  'fuzz-what': {
    q: 'What is fuzzing?',
    a: 'Generating large numbers of random inputs (for a compiler, random programs) to find bugs no written test covers.',
  },
  'fuzz-seed': {
    q: 'Why should a fuzzer’s random generator be seeded?',
    a: 'So a failing program can be generated again exactly, to debug it and to keep it as a test.',
  },
  'fuzz-valid': {
    q: 'Why is a disagreement on a program with undefined behaviour worthless?',
    a: 'Two correct compilers may legitimately do different things with it, so the difference proves nothing.',
  },
  'reduce-what': {
    q: 'What does test-case reduction do?',
    a: 'Shrinks a failing input by removing parts of it, keeping each removal only if the same failure remains.',
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
  fuzz: {
    title: 'A tiny differential fuzzer',
    code: `// Seeded randomness: one seed always
// gives the same programs, so a failure
// can be reproduced exactly.
let seed = 7;
function rand(k) {
  seed = (seed * 16807) % 2147483647;
  return seed % k;
}

// A random expression over x: a number,
// 'x', or [op, left, right].
function gen(d) {
  const r = rand(4);
  if (d === 0 || r === 0) {
    return rand(4);
  }
  if (r === 1) return 'x';
  const op = ['+', '-', '*'][rand(3)];
  return [op, gen(d - 1), gen(d - 1)];
}

function run(e, x) {
  if (e === 'x') return x;
  if (typeof e === 'number') return e;
  const a = run(e[1], x);
  const b = run(e[2], x);
  if (e[0] === '+') return a + b;
  if (e[0] === '-') return a - b;
  return a * b;
}

// The "optimiser": algebraic rules.
function fold(e) {
  if (!Array.isArray(e)) return e;
  const op = e[0];
  const a = fold(e[1]);
  const b = fold(e[2]);
  const na = typeof a === 'number';
  const nb = typeof b === 'number';
  if (na && nb) return run([op, a, b]);
  const zero = a === 0 || b === 0;
  if (op === '*' && zero) return 0;
  if (op !== '*' && a === 0) return b;
  if (op !== '*' && b === 0) return a;
  return [op, a, b];
}

let bad = false;
for (let t = 1; t <= 2000; t++) {
  const e = gen(3);
  const x = rand(10);
  const want = run(e, x);
  const got = run(fold(e), x);
  if (got !== want) {
    console.log('program', t, 'x =', x);
    console.log(JSON.stringify(e));
    console.log('want', want);
    console.log('got', got);
    bad = true;
    break;
  }
}
if (!bad) console.log('2000 agreed');
// Find the wrong rule and fix it.`,
  },
};

export const exercises = {
  diffTest: {
    title: 'Compare outcomes, errors included',
    prompt: 'Write `diffTest(f, g, gen, n)`. For `i` from `0` to `n - 1`, make an input `x = gen(i)` and run both `f(x)` and `g(x)`. An **outcome** is either a returned value or a thrown error. Two outcomes agree if both returned `===` values, or both threw errors with the same `message`. Return the first `x` whose outcomes disagree, or `undefined` if all agree.',
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
  reduce: {
    optional: true,
    title: 'Reduce a failing program',
    prompt: 'A fuzzer found a program, given as an array of lines, for which `fails(lines)` is `true`. Write `reduce(lines, fails)` the way the repository’s reducer works: start with a chunk size of half the length (at least 1); try removing each chunk of that many consecutive lines, keeping a removal whenever the shorter (non-empty) array still fails, and repeat at this size until a whole pass removes nothing; then halve the chunk size (at least 1), and stop after a pass at size 1 removes nothing. Return the reduced array, and don’t change `lines` itself.',
    starter: `function reduce(lines, fails) {
  // your code here
  return lines;
}

const fails = (ls) =>
  ls.includes('B') && ls.includes('E');
const prog = ['A', 'B', 'C', 'D', 'E'];
console.log(reduce(prog, fails));`,
    solution: `function reduce(lines, fails) {
  let xs = lines;
  let chunk = xs.length >> 1 || 1;
  while (true) {
    let changed = true;
    while (changed) {
      changed = false;
      let i = 0;
      while (i + chunk <= xs.length) {
        const c = [...xs.slice(0, i),
          ...xs.slice(i + chunk)];
        if (c.length > 0 && fails(c)) {
          xs = c;
          changed = true;
        } else {
          i += chunk;
        }
      }
    }
    if (chunk === 1) break;
    chunk = Math.max(1, chunk >> 1);
  }
  return xs;
}`,
    tests: `const both = (ls) => ls.includes('B') && ls.includes('E');
const L = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
test('keeps only what matters', () => {
  expect(reduce(L, both)).toEqual(['B', 'E']);
});
test('a single culprit', () => {
  const f = (ls) => ls.includes('x = 1 / 0');
  expect(reduce(['a', 'x = 1 / 0', 'b'], f))
    .toEqual(['x = 1 / 0']);
});
test('never reduces to nothing', () => {
  expect(reduce(['p', 'q', 'r'], () => true).length).toBe(1);
});
test('the result is 1-minimal', () => {
  const f = (ls) => ls.filter((l) => l < 'D').length >= 2;
  const r = reduce(L, f);
  expect(f(r)).toBe(true);
  for (let i = 0; i < r.length; i++) {
    const less = [...r.slice(0, i), ...r.slice(i + 1)];
    expect(f(less)).toBe(false);
  }
});
test('does not change the input', () => {
  const xs = ['A', 'B', 'E'];
  reduce(xs, both);
  expect(xs).toEqual(['A', 'B', 'E']);
});`,
    hints: [
      'Think in two loops: an outer one over chunk sizes (half, then a quarter, ... down to 1), and an inner one that sweeps the array removing chunks of the current size.',
      'Build a candidate without lines `i` to `i + chunk - 1` with `[...xs.slice(0, i), ...xs.slice(i + chunk)]`. If it is non-empty and still fails, keep it and do not move `i` (the next chunk has slid into place); otherwise move `i` on by `chunk`.',
      'Repeat the sweep at one size while it changed something (`let changed = true; while (changed) { ... }`), then `if (chunk === 1) break;` and halve with `Math.max(1, chunk >> 1)`.',
    ],
    walkthrough: `**How to think about it.** Removing one line at a time works but is slow on a long program: every try runs the whole failing check again. Removing big chunks first gets rid of most of the noise in a few tries; when no big chunk can go, smaller chunks are tried, down to single lines, which is what makes the result 1-minimal. Each removal is kept only if the shorter program *still fails*, so at every moment you hold a failing program, only ever a smaller one. This is the repository fuzzer's \`reduce\`, minus its check that each candidate parses.

**The solution, line by line.**

- \`let xs = lines;\` is the current failing program. It is never changed in place: every candidate is a new array, so the caller's \`lines\` survives.
- \`let chunk = xs.length >> 1 || 1;\` starts at half the length (\`>> 1\` halves and drops any fraction), or at 1 when that half would be 0.
- \`while (true) {\` loops over chunk sizes.
- \`let changed = true; while (changed) { changed = false;\` sweeps again at this size for as long as a sweep removed something, because one removal can make another possible.
- \`let i = 0; while (i + chunk <= xs.length) {\` visits every whole chunk.
- \`const c = [...xs.slice(0, i), ...xs.slice(i + chunk)];\` is the candidate without lines \`i\` to \`i + chunk - 1\`.
- \`if (c.length > 0 && fails(c)) { xs = c; changed = true; }\` keeps a non-empty candidate that still fails. \`i\` stays put, because the lines after the removed chunk have moved down into position \`i\`.
- \`else { i += chunk; }\` puts the chunk back (by simply not using \`c\`) and moves on.
- \`if (chunk === 1) break;\` stops once single lines have been tried with no success.
- \`chunk = Math.max(1, chunk >> 1);\` halves the chunk size for the next round.
- \`return xs;\` is the reduced, still-failing program.

**Common wrong attempts.**

- Testing each line on its own (\`fails([line])\`): a bug that needs two lines together never fails on one line alone, so this finds nothing.
- Forgetting the \`c.length > 0\` guard: with a check that always fails (a crash on any input, say), the result is the empty program, which tells the person fixing the bug nothing.
- Moving \`i\` on after a successful removal: the chunk that slid into position \`i\` is then never tried at this size, so the result can be bigger than it needs to be.`,
    wrong: [
      {
        code: `function reduce(lines, fails) {
  return lines.filter((l) =>
    fails([l]));
}`,
        why: 'It tests each line alone. A failure that needs B *and* E never fails on one line, so this returns `[]`.',
      },
      {
        code: `function reduce(lines, fails) {
  let xs = lines;
  let chunk = xs.length >> 1 || 1;
  while (true) {
    let changed = true;
    while (changed) {
      changed = false;
      let i = 0;
      while (i + chunk <= xs.length) {
        const c = [...xs.slice(0, i),
          ...xs.slice(i + chunk)];
        if (fails(c)) {
          xs = c;
          changed = true;
        } else {
          i += chunk;
        }
      }
    }
    if (chunk === 1) break;
    chunk = Math.max(1, chunk >> 1);
  }
  return xs;
}`,
        why: 'No guard against the empty program: when every candidate fails, everything is removed and `[]` is returned.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Viscosity’s differential test needs no expected outputs. Why?',
    options: [
      {
        t: 'The compiler is assumed correct',
        why: 'The compiler is exactly what is being tested.',
      },
      {
        t: 'The original program’s own behaviour is the expected answer',
        correct: true,
        why: 'Compiled code must print and throw exactly what the original does.',
      },
      {
        t: 'The tests only check that compiling doesn’t crash',
        why: 'They run both versions and compare everything they did.',
      },
      {
        t: 'Expected outputs are stored in the headers',
        why: 'Headers state layout decisions, not outputs.',
      },
    ],
  },
  {
    q: 'Which is a metamorphic test?',
    options: [
      {
        t: 'Running a program under two compilers and comparing',
        why: 'That is differential testing: two implementations.',
      },
      {
        t: 'Comparing an output with one stored last month',
        why: 'That is a golden test.',
      },
      {
        t: 'Deleting code that did not run on an input, and checking the program still behaves the same on that input',
        correct: true,
        why: 'One implementation, a change that must not change the answer: that is the EMI method.',
      },
      {
        t: 'Parsing, printing and parsing again',
        why: 'That is a round trip.',
      },
    ],
  },
  {
    q: 'A printer drops the brackets in `(1 + 2) * 3`. Which test catches it most directly?',
    options: [
      {
        t: 'A golden test of the parser alone',
        why: 'The parser is fine; the printer is wrong.',
      },
      {
        t: 'A round trip: parse, print, parse, and compare the trees',
        correct: true,
        why: 'Printed as `1 + 2 * 3`, it parses to a different tree.',
      },
      {
        t: 'Stress GC',
        why: 'That tests the garbage collector.',
      },
      {
        t: 'Test262',
        why: 'Test262 tests a JavaScript engine against the specification, not this printer.',
      },
    ],
  },
  {
    q: 'Why do Csmith and YARPGen go to great lengths to avoid undefined behaviour?',
    options: [
      {
        t: 'To make the programs shorter',
        why: 'Avoiding it usually makes programs longer.',
      },
      {
        t: 'Because C compilers reject undefined behaviour',
        why: 'They usually accept it silently; that is what makes it dangerous.',
      },
      {
        t: 'With undefined behaviour, two correct compilers may legitimately disagree, so a difference would prove nothing',
        correct: true,
        why: 'Differential testing needs programs with one right answer.',
      },
      {
        t: 'So that C-Reduce can run faster',
        why: 'Reduction is a separate step; UB matters for the oracle.',
      },
    ],
  },
  {
    q: 'A reducer removes a chunk and the candidate still fails, but no longer parses. What should it do?',
    options: [
      {
        t: 'Keep it: it still fails',
        why: 'It now fails for a different reason, a syntax error, not the bug being chased.',
      },
      {
        t: 'Reject it, as the repository’s reducer does, because it no longer shows the same bug',
        correct: true,
        why: 'Only valid candidates with the same kind of failure are kept.',
      },
      {
        t: 'Stop reducing altogether',
        why: 'Other chunks may still be removable.',
      },
      {
        t: 'Report a new compiler bug',
        why: 'A syntax error in a mangled program is expected, not a bug.',
      },
    ],
  },
];
