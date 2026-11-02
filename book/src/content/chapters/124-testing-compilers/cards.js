// Chapter 124 cards. Keys are stable ids: never rename them.

export const prompts = {
  'dt-oracle': {
    q: 'In Viscosity’s differential test, what plays the role of the expected answer?',
    a: 'The original program: whatever it prints and throws, the compiled program must print and throw too.',
  },
  'dt-errors': {
    q: 'Why does the differential test compare errors, not only printed output?',
    a: 'A compiled program that prints 0 where the original threw a TypeError has changed behaviour, even if every printed line matches up to there.',
  },
  'dt-fresh': {
    q: 'Why does each version run in a brand-new VM context?',
    a: 'So neither run can see globals or state left by the other: each outcome depends only on its own code.',
  },
  'dt-header': {
    q: 'Why does each corpus file also state the layout Viscosity should choose?',
    a: 'A compiler that never transforms anything passes every behaviour check. The header catches a lost optimization.',
  },
  'dt-parsers': {
    q: 'What does the mini-parser test compare?',
    a: 'The compiled code and explanation from the hand-written parser against those from acorn: they must be byte-identical.',
  },
  'rt-what': {
    q: 'What is round-trip testing?',
    a: 'Checking that opposite operations undo each other, e.g. parse → print → parse gives the same tree.',
  },
  'rt-identity': {
    q: 'What is Viscosity’s round-trip identity test?',
    a: 'A program with nothing to transform must come out of `compile` byte-for-byte unchanged, comments included.',
  },
  'drip-gc': {
    q: 'What does stress GC mode do, and what bug does it expose?',
    a: 'It collects on every allocation, so an object that isn’t reachable from the roots is freed at once and its use fails.',
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
    q: 'Why is a disagreement on an invalid random program worthless?',
    a: 'If the program has undefined or nondeterministic behaviour, two correct implementations may legitimately differ.',
  },
};

export const examples = {
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

// The "optimizer": algebraic rules.
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
      'Write a helper `outcome(fn, x)` that calls `fn(x)` inside `try`, returning `[\'ok\', value]`, or `[\'err\', message]` from `catch`.',
      'Two outcomes agree when both parts are `===`: the kind (`ok`/`err`) and the value or message.',
      'Return `x`, the input, as soon as they disagree, so the failure can be reproduced.',
    ],
    walkthrough: `This is \`runIsolated\` plus \`toEqual\` from Viscosity’s differential test, reduced to one function call.

- **Errors are results too.** The starter compares only return values. If \`f\` throws, the starter crashes; if both throw, it can’t tell whether they threw the same thing. Wrapping each call in \`try\`/\`catch\` turns “what happened” into a value you can compare.
- **Compare kind and payload.** \`['ok', 0]\` and \`['err', 'out of bounds']\` must disagree, which is exactly the \`--bounds assume\` bug: one version returned a value where the other threw.
- **Return the input.** The input is what you need to reproduce and debug the failure, and to keep it as a new corpus test.
- **\`gen(i)\` makes inputs.** Here it can be a counter or a seeded random generator. Feeding it a seed is what turns this into a fuzzer.

The real test compares a list of printed lines and an error string with \`toEqual\`, but the idea is the same.`,
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
  shrink: {
    optional: true,
    title: 'Shrink a failing input',
    prompt:
      'A fuzzer found an array `xs` for which `fails(xs)` is `true`. Write `shrink(xs, fails)`: repeatedly try removing **one element** at a time, keeping any removal after which `fails` is still `true`, until no single removal still fails. Return the smaller array. Don’t change `xs` itself.',
    starter: `function shrink(xs, fails) {
  // your code here
  return xs;
}

// Fails whenever 3 and 5 are both in.
const fails = (ys) =>
  ys.includes(3) && ys.includes(5);
console.log(
  shrink([1, 3, 8, 5, 2], fails));`,
    solution: `function shrink(xs, fails) {
  let ys = xs;
  let progress = true;
  while (progress) {
    progress = false;
    for (const i of ys.keys()) {
      const t = [...ys.slice(0, i),
        ...ys.slice(i + 1)];
      if (fails(t)) {
        ys = t;
        progress = true;
        break;
      }
    }
  }
  return ys;
}`,
    tests: `const both = (ys) => ys.includes(3) && ys.includes(5);
test('keeps only what matters', () => {
  expect(shrink([1, 3, 8, 5, 2], both)).toEqual([3, 5]);
});
test('a single culprit', () => {
  const f = (ys) => ys.some((y) => y < 0);
  expect(shrink([4, 9, -1, 7], f)).toEqual([-1]);
});
test('a length bug', () => {
  const f = (ys) => ys.length >= 2;
  expect(shrink([7, 7, 7, 7], f).length).toBe(2);
});
test('does not change the input', () => {
  const xs = [1, 3, 5];
  shrink(xs, both);
  expect(xs).toEqual([1, 3, 5]);
});`,
    hints: [
      'Build a candidate without element `i`: `[...ys.slice(0, i), ...ys.slice(i + 1)]`.',
      'If the candidate still fails, keep it as the new current array and start scanning again.',
      'Stop when a full scan finds no removal that still fails.',
    ],
    walkthrough: `Fuzzers find failures that are big and noisy: the program in the fuzzing example has a dozen nodes, but the bug needs only \`0 - x\`. Shrinking finds the small version.

- **Keep the failure.** A removal is only accepted if \`fails\` is still true. So every step keeps a failing input, just a smaller one.
- **Scan until stuck.** After a successful removal, other elements may now be removable too, so scan again. When a whole scan removes nothing, every remaining element is needed: the result is *1-minimal*.
- **Don’t mutate.** \`slice\` and spread build new arrays, so the caller’s input survives, which matters when you want to save the original failure too.

Real reducers work on program trees rather than flat lists, and try removing big chunks before single elements, but the loop is the same: shrink while it still fails.`,
    wrong: [
      {
        code: `function shrink(xs, fails) {
  const out = [];
  for (const x of xs) {
    if (fails([x])) out.push(x);
  }
  return out;
}`,
        why: 'It tests each element alone. A failure that needs two elements together (3 *and* 5) never fails on its own, so this returns `[]`, which doesn’t fail at all.',
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
    q: 'Which is a round-trip test?',
    options: [
      { t: 'Running a program under two compilers', why: 'That is differential testing.' },
      { t: 'Checking a sort against a slow sort', why: 'Also differential: two implementations of one thing.' },
      { t: 'Parsing a program, printing the tree, parsing again, and comparing the trees', correct: true, why: 'Two opposite operations must undo each other.' },
      { t: 'Running the corpus under stress GC', why: 'That stresses the collector; nothing is undone.' },
    ],
  },
  {
    q: 'What is true of fuzzing in this repository?',
    options: [
      { t: 'Viscosity runs Csmith on every build', why: 'Csmith generates C programs, and the repository uses no fuzzer.' },
      { t: 'It isn’t implemented yet; the tests are a hand-built corpus, parser equivalence, a round trip and the Drip corpus', correct: true, why: 'Fuzzing is the next step, taught here at toy size.' },
      { t: 'The Drip corpus is randomly generated', why: 'Its programs are hand-written, with `// expect:` comments.' },
      { t: 'Test262 is run against the compiled code', why: 'Test262 is JavaScript’s conformance suite; Viscosity doesn’t run it.' },
    ],
  },
  {
    q: 'Why does Csmith take care to generate C programs free of undefined behaviour?',
    options: [
      { t: 'To make them compile faster', why: 'Speed is not the reason.' },
      { t: 'So they are shorter', why: 'Avoiding undefined behaviour usually makes programs longer, not shorter.' },
      { t: 'Because C compilers reject undefined behaviour', why: 'They usually accept it silently; that is what makes it dangerous.' },
      { t: 'With undefined behaviour, two correct compilers may legitimately disagree, so a difference would prove nothing', correct: true, why: 'Differential testing needs programs that have one right answer.' },
    ],
  },
];
