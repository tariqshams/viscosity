// Chapter 72 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.
// Merged from old chapters 115, 115.

export const prompts = {
  'e2e-what': {
    q: 'What is an end-to-end benchmark?',
    a: 'A measurement of a whole program, compiled as a user would compile it, rather than one loop written for the benchmark.',
  },
  'e2e-why': {
    q: 'Name two costs a whole program pays that a single-loop microbenchmark leaves out.',
    a: 'Building the data through the generated container, bounds checks Viscosity couldn’t remove, and loops that don’t benefit (any two).',
  },
  'e2e-self-time': {
    q: 'Who measures the time in Viscosity’s end-to-end benchmark?',
    a: 'Each program times its own hot section with `performance.now()` and prints `{ check, ms }` as its last line.',
  },
  'e2e-checksum': {
    q: 'What two jobs does each program’s checksum do?',
    a: 'It keeps the work observable, so it can’t be removed as dead code, and it lets the harness check both versions computed the same thing.',
  },
  'e2e-fresh': {
    q: 'Why does every run of every version get a fresh process?',
    a: 'So no run inherits the other version’s type feedback, compiled code or garbage.',
  },
  'e2e-median': {
    q: 'In the committed particles runs on Node, one compiled run took 135 ms while the best took 90. Why doesn’t that one run spoil the result?',
    a: 'The harness reports the best and the median, and a single slow outlier is neither the fastest run nor the one in the middle.',
  },
  'e2e-wins': {
    q: 'Which committed programs gained most, and what do they have in common?',
    a: 'Particles, ledger and heat: many elements, and hot loops that touch only some of the fields.',
  },
  'e2e-story': {
    q: 'Why were n-body and boids first slower with Viscosity?',
    a: 'Their hot loops used indexes the bounds proof didn’t cover (an outer loop’s counter; `i + 1` starts and `&&` guards), so checks ran inside the hottest loop.',
  },
  'e2e-fix': {
    q: 'Was the n-body slowdown fixed by removing bounds checks?',
    a: 'No. The proof was generalised, so the checks became unnecessary: 12 of 12 accesses proven in bounds.',
  },
  'e2e-noise': {
    q: 'One committed run gave ledger 5.11×; the later matrix gave 3.75× (best). What should you claim?',
    a: 'Only the coarse picture: ledger is several times faster. Timings on that shared VM varied by up to about 2× between runs.',
  },
  'e2e-python': {
    q: 'In CPython, what did column storage cost and what did it save?',
    a: 'It was slower per element than dataclass objects, but used about 4.9× less memory.',
  },
  'e2e-warmup': {
    q: 'Why does the end-to-end benchmark keep JIT warm-up in its timings, unlike Part II’s harness?',
    a: 'Because a real program pays for warm-up too; the question is how long the user’s program takes.',
  },
  'corpus-what': {
    q: 'What is a test corpus?',
    a: 'A large, curated collection of programs used as test inputs, each chosen to exercise one case.',
  },
  'corpus-generated': {
    q: 'In Viscosity, what does it take to add a new differential test case?',
    a: 'Adding one program file to the corpus folder. The tests are generated from the folder listing; no test code changes.',
  },
  'corpus-one-idea': {
    q: 'Why should each corpus file probe only one idea?',
    a: 'So when it fails you know what broke, and its name can say what it covers.',
  },
  'corpus-observable': {
    q: 'Why does `try_catch.js` print the caught error’s class and message?',
    a: 'A difference that isn’t printed can’t be caught: the differential test only compares output and errors.',
  },
  'corpus-deterministic': {
    q: 'Why must a corpus program avoid timing and randomness?',
    a: 'Two correct runs must print the same thing, or every difference would be a false alarm.',
  },
  'corpus-trap': {
    q: 'What mistake does `ints_stay_ints.py` catch?',
    a: 'Storing an integer field in an `array(\'d\')` column, which would turn 6 into 6.0 and print `float` instead of `int`.',
  },
  'corpus-matrix': {
    q: 'Which checks does one JavaScript corpus file feed?',
    a: 'Its decision header, the original-vs-compiled behaviour, acorn-vs-mini-parser equivalence, and 4 Rust fixture files.',
  },
  'corpus-python': {
    q: 'How does the Python differential test detect a changed exception?',
    a: 'It runs both programs with python3 and compares stdout and the last line of stderr, where the exception is printed.',
  },
  'corpus-rust': {
    q: 'What is the oracle for the Rust port of Viscosity?',
    a: 'The TypeScript compiler: its compiled code and explain reports, stored as fixtures, must be reproduced byte for byte.',
  },
  'corpus-assume': {
    q: 'Why are the Rust fixtures generated in both `check` and `assume` bounds modes?',
    a: 'So the unchecked code paths of the emitter are covered too, not only the checked ones.',
  },
  'corpus-limit': {
    q: 'What can a hand-written corpus never find?',
    a: 'A case nobody thought of. Random program generation (fuzzing) is the tool for that, and each bug it finds becomes a new corpus file.',
  },
};

export const examples = {};

export const exercises = {
  speedup: {
    title: 'Median speed-up with a checksum guard',
    prompt: 'Write `speedup(a, b)`. `a` and `b` are the runs of the original and the compiled program: arrays of `{ ms, check }`. If any run, in either array, has a `check` different from `a[0].check`, throw an `Error` whose message contains `checksum`. Otherwise return the median of `a`’s times divided by the median of `b`’s, rounded to 2 decimals as a number. Use the harness’s median: sort a copy and take the element at index `Math.floor(n / 2)`. Don’t change the inputs.',
    starter: `function speedup(a, b) {
  let sa = 0;
  let sb = 0;
  for (const r of a) sa += r.ms;
  for (const r of b) sb += r.ms;
  const ma = sa / a.length;
  const mb = sb / b.length;
  return +(ma / mb).toFixed(2);
}`,
    solution: `function median(xs) {
  const s = [...xs].sort(
    (x, y) => x - y);
  return s[Math.floor(s.length / 2)];
}

function speedup(a, b) {
  const want = a[0].check;
  for (const r of [...a, ...b]) {
    if (r.check !== want) {
      throw new Error(
        'checksum: ' + r.check);
    }
  }
  const ma = median(a.map((r) => r.ms));
  const mb = median(b.map((r) => r.ms));
  return +(ma / mb).toFixed(2);
}`,
    tests: `const run = (ms, check = 'c') => ({ ms, check });
test('the committed particles runs on Node', () => {
  const a = [410.6, 393, 497.3, 429, 399.3, 395.8, 423.3, 459.9, 574.4].map((m) => run(m));
  const b = [118.1, 94.2, 114, 95.3, 117.7, 90, 135, 123.9, 103.7].map((m) => run(m));
  expect(speedup(a, b)).toBe(3.71);
});
test('an outlier does not move the median', () => {
  const a = [100, 100, 100].map((m) => run(m));
  const b = [50, 50, 900].map((m) => run(m));
  expect(speedup(a, b)).toBe(2);
});
test('even counts use the upper middle', () => {
  const a = [10, 40, 20, 30].map((m) => run(m));
  const b = [10, 10, 10, 10].map((m) => run(m));
  expect(speedup(a, b)).toBe(3);
});
test('a different answer is an error', () => {
  const a = [run(100), run(100)];
  const b = [run(50), run(50, 'other')];
  expect(() => speedup(a, b)).toThrow('checksum');
});
test('even within the original', () => {
  const a = [run(100), run(100, 'x')];
  const b = [run(50), run(50)];
  expect(() => speedup(a, b)).toThrow('checksum');
});
test('does not reorder the inputs', () => {
  const a = [run(30), run(10), run(20)];
  speedup(a, [run(10), run(10), run(10)]);
  expect(a.map((r) => r.ms)).toEqual([30, 10, 20]);
});`,
    hints: [
      'Check the checksums first: loop over `[...a, ...b]` and compare each `check` with `a[0].check`.',
      'For the median, copy before sorting: `[...xs].sort((x, y) => x - y)`. Without the comparator, numbers sort as strings.',
      'Divide the two medians and round with `+(x).toFixed(2)`.',
    ],
    walkthrough: `**How to think about it.** This is the core of the harness (\`packages/bench/src/e2e.ts\` and the matrix script), made a little stricter. Two rules come from *Benchmarking honestly* and *Noisy numbers: the median, p95 and a fresh process*: correctness before speed, so the checksums are checked first and a mismatch throws; and a robust summary, so one slow run (the committed particles data has a 135 ms run among others from 90 to 124) cannot drag the answer about. The median does that: it ignores how far an outlier is from the rest.

**The solution, line by line.**

- \`function median(xs) {\` is a helper.
- \`const s = [...xs].sort((x, y) => x - y);\` sorts a *copy* (\`sort\` changes the array it is called on) with a numeric comparator; without one, numbers are compared as strings, and \`'135' < '90'\`.
- \`return s[Math.floor(s.length / 2)];\` takes the middle element; for an even count this is the upper of the two middle values, as the e2e harness does.
- \`function speedup(a, b) {\` and \`const want = a[0].check;\` take the first run's checksum as the reference.
- \`for (const r of [...a, ...b]) { if (r.check !== want) throw new Error('checksum: ' + r.check); }\` checks every run of both versions: a fast wrong answer must stop the benchmark, and a program whose own output varies from run to run cannot be compared at all.
- \`const ma = median(a.map((r) => r.ms));\` and the same for \`b\` pull out the times and summarise them.
- \`return +(ma / mb).toFixed(2);\` divides original by compiled (bigger is faster) and rounds; \`toFixed\` returns a string, and the \`+\` in front turns it back into a number.

For the committed particles runs, the medians are 423.3 and 114 ms, and the answer is 3.71, exactly the matrix's median speed-up.

**Common wrong attempts.**

- Averaging (the starter) lets the 135 ms run and the 574.4 ms run pull the means about; the answer comes out 4.01.
- \`sort()\` without a comparator sorts \`'90'\` after \`'135'\`, so the "median" of the compiled runs becomes 123.9.
- Checking only the last run's checksum, as the simplest harness does, misses a run that went wrong earlier.`,
    wrong: [
      {
        code: `function speedup(a, b) {
  const sa = a.map((r) => r.ms).sort();
  const sb = b.map((r) => r.ms).sort();
  const h = Math.floor(sa.length / 2);
  const ma = sa[h];
  const mb = sb[h];
  if (a[0].check !== b[0].check) {
    throw new Error('checksum');
  }
  return +(ma / mb).toFixed(2);
}`,
        why: '`sort()` without a comparator sorts numbers as strings, so `[92, 135, 89, 89, 91]` becomes `[135, 89, 89, 91, 92]` and the “median” is 89. It also only checks the first run of each.',
      },
      {
        code: `function median(xs) {
  const s = [...xs].sort(
    (x, y) => x - y);
  return s[Math.floor(s.length / 2)];
}

function speedup(a, b) {
  const ma = median(a.map((r) => r.ms));
  const mb = median(b.map((r) => r.ms));
  return +(ma / mb).toFixed(2);
}`,
        why: 'The medians are right, but nothing checks the answers: a compiled program that computes the wrong result gets a speed-up anyway.',
      },
    ],
  },
  clearlyFaster: {
    optional: true,
    title: 'Faster, or just noise?',
    prompt: 'Write `clearlyFaster(a, b)`, for two arrays of run times in ms (original, compiled). Return `true` only if **every** compiled run was faster than **every** original run (the ranges don’t overlap), else `false`.',
    starter: `function clearlyFaster(a, b) {
  const ma = a.reduce((s, x) => s + x);
  const mb = b.reduce((s, x) => s + x);
  return mb < ma;
}`,
    solution: `function clearlyFaster(a, b) {
  const slowB = Math.max(...b);
  return slowB < Math.min(...a);
}`,
    tests: `test('particles on Node: clearly faster', () => {
  expect(clearlyFaster([410.6, 393, 497.3, 429, 399.3, 395.8, 423.3, 459.9, 574.4], [118.1, 94.2, 114, 95.3, 117.7, 90, 135, 123.9, 103.7])).toBe(true);
});
test('n-body on Node: overlapping', () => {
  expect(clearlyFaster([62.6, 71.3, 63.4, 81.2, 92.6, 62, 73.6, 72.8, 61.6], [51.3, 72.9, 72.9, 71.9, 57, 57.3, 68.1, 62.8, 63.5])).toBe(false);
});
test('boids: overlapping on Node, clear on Bun', () => {
  expect(clearlyFaster([103.2, 68.6, 66, 60.1, 92, 63.3, 57.4, 121.9, 111.4], [43.8, 49.2, 53, 78.8, 66.6, 71.9, 46.1, 82.1, 56.6])).toBe(false);
  expect(clearlyFaster([96.4, 101, 67.6, 75.4, 73, 90.1, 83.4, 71.9, 64.1], [58.3, 55.9, 58, 39, 49.7, 61.2, 34.6, 37.2, 40.3])).toBe(true);
});
test('a tie is not faster', () => {
  expect(clearlyFaster([10, 12], [10, 9])).toBe(false);
});`,
    hints: [
      'The question is about the worst compiled run and the best original run.',
      '`Math.max(...b)` is the slowest compiled run; `Math.min(...a)` is the fastest original.',
    ],
    walkthrough: `**How to think about it.** "Clearly faster" here means the two sets of runs do not overlap at all: even the compiled program's worst run beat the original's best. So you need only two numbers, the slowest compiled run and the fastest original run.

**The solution, line by line.**

- \`const slowB = Math.max(...b);\` spreads the compiled times into \`Math.max\` and takes the slowest.
- \`return slowB < Math.min(...a);\` compares it with the fastest original run; a tie is not faster, so the comparison is strict.

All the test data is the committed per-run data from the benchmark matrix. For particles on Node the ranges are 393 to 574.4 ms against 90 to 135 ms: no doubt at all. For n-body on Node, the slowest compiled run (72.9 ms) was slower than the fastest original run (61.6 ms), although the best-of-9 speed-up was 1.2×. Boids overlaps on Node but not on Bun.

**Common wrong attempts.**

- Comparing sums or means (the starter) says "faster" whenever the compiled runs are faster on average, even if many original runs beat many compiled ones.
- Comparing the two *fastest* runs lets one lucky compiled run decide; for n-body on Node it says true.

This is not a statistical test: with more runs, ranges overlap more easily, and real benchmark tools use confidence intervals. But as a first check on a noisy machine, "do the ranges overlap?" stops you over-claiming a 1.2×.`,
    wrong: [
      {
        code: `function clearlyFaster(a, b) {
  const fastB = Math.min(...b);
  return fastB < Math.min(...a);
}`,
        why: 'It compares the best compiled run with the best original run, so one lucky compiled run is enough. For n-body on Node it says true although a compiled run (72.9 ms) was slower than an original one (61.6 ms).',
      },
    ],
  },
  fuzzToy: {
    title: 'Fuzz a toy layout compiler',
    prompt: 'A toy language has three statements over a list of records: `[\'push\', v]` adds `{ x: v }`, `[\'inc\', k]` adds `k` to every `x`, and `[\'get\', i]` prints element `i`’s `x`, or `none`. `runAoS` runs a program with objects; `runSoA`, the “compiled” version, uses one `Float64Array` column, and has bugs. Write `gen(rand)`: a random program of **1 to 8** statements, each a `push` of `rand(10)`, an `inc` of `1 + rand(3)`, or a `get` of `rand(6)`, all equally likely. Then write `fuzz(seed, n, f, g)`: make **one** generator with `makeRand(seed)`, generate up to `n` programs, and return the first program on which `f` and `g` give different output, or `null`.',
    starter: `// Given: a seeded random generator.
function makeRand(seed) {
  let s = seed;
  return (k) => {
    s = (s * 16807) % 2147483647;
    return s % k;
  };
}

// Given: the original, objects.
function runAoS(prog) {
  const ps = [];
  const out = [];
  for (const [op, a] of prog) {
    if (op === 'push') {
      ps.push({ x: a });
    }
    if (op === 'inc') {
      for (const p of ps) p.x += a;
    }
    if (op === 'get') {
      const p = ps[a];
      out.push(p ? p.x : 'none');
    }
  }
  return out.join(',');
}

// Given: the "compiled" version.
function runSoA(prog) {
  const xs = new Float64Array(4);
  let n = 0;
  const out = [];
  for (const [op, a] of prog) {
    if (op === 'push') xs[n++] = a;
    if (op === 'inc') {
      for (let i = 0; i < n; i++) {
        xs[i] += a;
      }
    }
    if (op === 'get') {
      const ok = a < xs.length;
      out.push(ok ? xs[a] : 'none');
    }
  }
  return out.join(',');
}

// Your code: a random program.
function gen(rand) {
  return [];
}

// Your code: the differential loop.
function fuzz(seed, n, f, g) {
  return null;
}`,
    solution: `// Given: a seeded random generator.
function makeRand(seed) {
  let s = seed;
  return (k) => {
    s = (s * 16807) % 2147483647;
    return s % k;
  };
}

// Given: the original, objects.
function runAoS(prog) {
  const ps = [];
  const out = [];
  for (const [op, a] of prog) {
    if (op === 'push') {
      ps.push({ x: a });
    }
    if (op === 'inc') {
      for (const p of ps) p.x += a;
    }
    if (op === 'get') {
      const p = ps[a];
      out.push(p ? p.x : 'none');
    }
  }
  return out.join(',');
}

// Given: the "compiled" version.
function runSoA(prog) {
  const xs = new Float64Array(4);
  let n = 0;
  const out = [];
  for (const [op, a] of prog) {
    if (op === 'push') xs[n++] = a;
    if (op === 'inc') {
      for (let i = 0; i < n; i++) {
        xs[i] += a;
      }
    }
    if (op === 'get') {
      const ok = a < xs.length;
      out.push(ok ? xs[a] : 'none');
    }
  }
  return out.join(',');
}

function gen(rand) {
  const len = 1 + rand(8);
  const prog = [];
  for (let i = 0; i < len; i++) {
    const r = rand(3);
    if (r === 0) {
      prog.push(['push', rand(10)]);
    } else if (r === 1) {
      prog.push(['inc', 1 + rand(3)]);
    } else {
      prog.push(['get', rand(6)]);
    }
  }
  return prog;
}

function fuzz(seed, n, f, g) {
  const rand = makeRand(seed);
  for (let t = 0; t < n; t++) {
    const p = gen(rand);
    if (f(p) !== g(p)) return p;
  }
  return null;
}`,
    tests: `const OPS = { push: [0, 9], inc: [1, 3], get: [0, 5] };
test('gen makes valid programs', () => {
  const rand = makeRand(5);
  for (let t = 0; t < 300; t++) {
    const p = gen(rand);
    expect(p.length >= 1 && p.length <= 8).toBe(true);
    for (const [op, a] of p) {
      const r = OPS[op];
      expect(!!r && Number.isInteger(a) && a >= r[0] && a <= r[1]).toBe(true);
    }
  }
});
test('gen uses every statement', () => {
  const rand = makeRand(9);
  const seen = new Set();
  for (let t = 0; t < 100; t++) for (const [op] of gen(rand)) seen.add(op);
  expect([...seen].sort()).toEqual(['get', 'inc', 'push']);
});
test('finds a program where the versions differ', () => {
  const p = fuzz(1, 1000, runAoS, runSoA);
  expect(p !== null).toBe(true);
  expect(runAoS(p) !== runSoA(p)).toBe(true);
});
test('same seed, same answer', () => {
  const a = JSON.stringify(fuzz(3, 1000, runAoS, runSoA));
  expect(JSON.stringify(fuzz(3, 1000, runAoS, runSoA))).toBe(a);
});
test('agreeing versions: null', () => {
  expect(fuzz(1, 300, runAoS, runAoS)).toBe(null);
});
test('explores many different programs', () => {
  const g = (p) => (p.length === 1 ? 'x' : runAoS(p));
  const p = fuzz(1, 1000, runAoS, g);
  expect(p !== null && p.length === 1).toBe(true);
});`,
    hints: [
      'In `gen`, draw the length with `1 + rand(8)`, then for each statement draw `rand(3)` to pick push, inc or get, and draw its argument.',
      'In `fuzz`, create `rand` once, before the loop, so each program continues the same random sequence.',
      'Compare `f(p)` and `g(p)` with `!==`, and return `p` itself, so the failure can be replayed.',
    ],
    walkthrough: `**How to think about it.** This is a fuzzer of the kind *Fuzzing and test-case reduction* built, aimed at a layout compiler, which is what \`engine/rust/scripts/fuzz.mjs\` does for Viscosity at full size. There are two pieces: a generator that only ever makes valid programs, and a loop that runs every program through both versions and stops at the first disagreement. Two traps decide the details: a program that prints nothing can never disagree, so \`get\` must be among the statements; and the random generator must be made once, or every program comes out the same.

**The solution, line by line.**

- \`function gen(rand) {\` takes the generator, so the caller decides the seed.
- \`const len = 1 + rand(8);\` picks a length from 1 to 8 (\`rand(8)\` is 0 to 7).
- \`const prog = [];\` and \`for (let i = 0; i < len; i++) {\` build that many statements.
- \`const r = rand(3);\` picks one of three kinds, equally likely.
- \`prog.push(['push', rand(10)]);\` is a push of 0 to 9; \`prog.push(['inc', 1 + rand(3)]);\` an increment of 1 to 3; \`prog.push(['get', rand(6)]);\` a read of index 0 to 5, which can go past the end on purpose.
- \`return prog;\` after the loop.
- \`function fuzz(seed, n, f, g) {\` and \`const rand = makeRand(seed);\` make **one** generator for the whole run, so each program differs from the last but the run as a whole can be repeated exactly.
- \`for (let t = 0; t < n; t++) { const p = gen(rand); if (f(p) !== g(p)) return p; }\` is the differential loop: the original (\`f\`) is the oracle, and the first program where the outputs differ is returned, ready to shrink and add to a corpus.
- \`return null;\` means no disagreement in \`n\` programs, which is evidence, not proof.

**What it finds.** Seed 1 finds a \`get\` past the end that prints \`0\` instead of \`none\`: the column has 4 slots, and unused slots hold 0, so checking against the capacity rather than the length is the bug. Change the check to \`a < n\` and run seed 1 again, and it finds the second: after five pushes, \`get 4\` prints nothing at all, because the fifth \`push\` was silently dropped (a \`Float64Array\` ignores writes past its end, and this column never grows). Fix \`runSoA\` (keep \`n\`, check \`a < n\`, and grow the column) and the fuzzer goes quiet.

**Common wrong attempts.**

- Calling \`makeRand(seed)\` inside the loop restarts the generator for every program, so the fuzzer tests one program \`n\` times.
- Generating only \`push\` and \`inc\` gives programs that print nothing, and empty outputs always agree.
- \`1 + rand(7)\` or \`rand(8)\` for the length gives 1 to 7, or allows empty programs, which the tests reject.`,
    wrong: [
      {
        code: `// Given: a seeded random generator.
function makeRand(seed) {
  let s = seed;
  return (k) => {
    s = (s * 16807) % 2147483647;
    return s % k;
  };
}

// Given: the original, objects.
function runAoS(prog) {
  const ps = [];
  const out = [];
  for (const [op, a] of prog) {
    if (op === 'push') {
      ps.push({ x: a });
    }
    if (op === 'inc') {
      for (const p of ps) p.x += a;
    }
    if (op === 'get') {
      const p = ps[a];
      out.push(p ? p.x : 'none');
    }
  }
  return out.join(',');
}

// Given: the "compiled" version.
function runSoA(prog) {
  const xs = new Float64Array(4);
  let n = 0;
  const out = [];
  for (const [op, a] of prog) {
    if (op === 'push') xs[n++] = a;
    if (op === 'inc') {
      for (let i = 0; i < n; i++) {
        xs[i] += a;
      }
    }
    if (op === 'get') {
      const ok = a < xs.length;
      out.push(ok ? xs[a] : 'none');
    }
  }
  return out.join(',');
}

function gen(rand) {
  const len = 1 + rand(8);
  const prog = [];
  for (let i = 0; i < len; i++) {
    if (rand(2) === 0) {
      prog.push(['push', rand(10)]);
    } else {
      prog.push(['inc', 1 + rand(3)]);
    }
  }
  return prog;
}

function fuzz(seed, n, f, g) {
  const rand = makeRand(seed);
  for (let t = 0; t < n; t++) {
    const p = gen(rand);
    if (f(p) !== g(p)) return p;
  }
  return null;
}`,
        why: 'It never generates `get`, so no program prints anything, and two silent programs always agree: the fuzzer finds nothing.',
      },
      {
        code: `// Given: a seeded random generator.
function makeRand(seed) {
  let s = seed;
  return (k) => {
    s = (s * 16807) % 2147483647;
    return s % k;
  };
}

// Given: the original, objects.
function runAoS(prog) {
  const ps = [];
  const out = [];
  for (const [op, a] of prog) {
    if (op === 'push') {
      ps.push({ x: a });
    }
    if (op === 'inc') {
      for (const p of ps) p.x += a;
    }
    if (op === 'get') {
      const p = ps[a];
      out.push(p ? p.x : 'none');
    }
  }
  return out.join(',');
}

// Given: the "compiled" version.
function runSoA(prog) {
  const xs = new Float64Array(4);
  let n = 0;
  const out = [];
  for (const [op, a] of prog) {
    if (op === 'push') xs[n++] = a;
    if (op === 'inc') {
      for (let i = 0; i < n; i++) {
        xs[i] += a;
      }
    }
    if (op === 'get') {
      const ok = a < xs.length;
      out.push(ok ? xs[a] : 'none');
    }
  }
  return out.join(',');
}

function gen(rand) {
  const len = 1 + rand(8);
  const prog = [];
  for (let i = 0; i < len; i++) {
    const r = rand(3);
    if (r === 0) {
      prog.push(['push', rand(10)]);
    } else if (r === 1) {
      prog.push(['inc', 1 + rand(3)]);
    } else {
      prog.push(['get', rand(6)]);
    }
  }
  return prog;
}

function fuzz(seed, n, f, g) {
  for (let t = 0; t < n; t++) {
    const p = gen(makeRand(seed));
    if (f(p) !== g(p)) return p;
  }
  return null;
}`,
        why: 'A new generator from the same seed for every program makes every program identical. It tests one program n times.',
      },
    ],
  },
  parseHeader: {
    optional: true,
    title: 'Read a corpus header',
    prompt: 'Write `parseHeader(src)`. Find the first line that starts with `// viscosity` or `# viscosity` (not `// @viscosity`, which is an annotation). Return `null` if there is none. Otherwise return `{ mode, want }`: `mode` is `\'opt-in\'` if the line contains `(opt-in)`, else `\'auto\'`; `want` maps each name to its layout, from the comma-separated `name=layout` pairs after the first `:`. Ignore empty pairs.',
    starter: `function parseHeader(src) {
  const first = src.split('\\n')[0];
  const [name, layout] = first
    .slice(first.indexOf(':') + 1)
    .trim().split('=');
  return {
    mode: 'auto',
    want: { [name]: layout },
  };
}`,
    solution: `function parseHeader(src) {
  const re = /^(\\/\\/|#) viscosity/;
  const line = src.split('\\n')
    .find((l) => re.test(l));
  if (!line) return null;
  const optIn =
    line.includes('(opt-in)');
  const rest = line.slice(
    line.indexOf(':') + 1);
  const want = {};
  for (const p of rest.split(',')) {
    const t = p.trim();
    if (!t) continue;
    const [name, layout] = t.split('=');
    want[name] = layout;
  }
  return {
    mode: optIn ? 'opt-in' : 'auto',
    want,
  };
}`,
    tests: `test('one collection', () => {
  expect(parseHeader('// viscosity: ps=soa\\nconst ps = [];')).toEqual({ mode: 'auto', want: { ps: 'soa' } });
});
test('two collections', () => {
  expect(parseHeader('// viscosity: ps=aos, keep=aos\\n').want).toEqual({ ps: 'aos', keep: 'aos' });
});
test('opt-in mode', () => {
  expect(parseHeader('// viscosity(opt-in): marked=soa, unmarked=aos')).toEqual({ mode: 'opt-in', want: { marked: 'soa', unmarked: 'aos' } });
});
test('Python, with nothing to transform', () => {
  expect(parseHeader('# viscosity: \\nimport os')).toEqual({ mode: 'auto', want: {} });
});
test('an annotation is not a header', () => {
  expect(parseHeader('// @viscosity aosoa(8)\\nconst ps = [];')).toBe(null);
  expect(parseHeader('// @viscosity soa\\n// viscosity: ps=aosoa').want).toEqual({ ps: 'aosoa' });
});`,
    hints: [
      'Split the source into lines and `find` the first that matches `/^(\\/\\/|#) viscosity/`. The space before `viscosity` is what rules out `// @viscosity`.',
      'Everything after the first `:` is the list. Split it on `,`, `trim` each part, and skip empty ones.',
      'Split each pair on `=` into a name and a layout.',
    ],
    walkthrough: `This is the header parsing at the top of both differential tests, as a separate function.

- **Find the right line.** Corpus files can carry annotations too, such as \`// @viscosity aosoa(8)\`, which are input for the compiler, not expectations for the test. Requiring a space right after the comment marker separates the two.
- **Mode lives in the header.** \`opt_in_mode.js\` must be compiled in opt-in mode for its expectations to hold, so the header says so, and the test passes the mode to \`compile\`.
- **Empty is meaningful.** A Python file with \`# viscosity: \` and nothing after it says “Viscosity should find no collection at all”. Skipping empty pairs gives \`{}\`, which the test compares with what Viscosity found.

With the header parsed into data, the expectation for every corpus file lives in the file itself, next to the program it describes.`,
    wrong: [
      {
        code: `function parseHeader(src) {
  const line = src.split('\\n').find(
    (l) => l.includes('viscosity'));
  if (!line) return null;
  const optIn =
    line.includes('(opt-in)');
  const rest = line.slice(
    line.indexOf(':') + 1);
  const want = {};
  for (const p of rest.split(',')) {
    const t = p.trim();
    if (!t) continue;
    const [name, layout] = t.split('=');
    want[name] = layout;
  }
  return {
    mode: optIn ? 'opt-in' : 'auto',
    want,
  };
}`,
        why: 'Any line mentioning viscosity matches, so an annotation like `// @viscosity aosoa(8)` is read as the header.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'What makes Viscosity’s end-to-end benchmark “end to end”?',
    options: [
      {
        t: 'It times every loop separately',
        why: 'It times each program’s whole hot section, as one number.',
      },
      {
        t: 'It uses the largest possible input',
        why: 'Size isn’t the point; a whole program is.',
      },
      {
        t: 'It compiles whole, unannotated programs with default options and times them as a user would run them',
        correct: true,
        why: 'Construction, checks and loops that don’t benefit are all included.',
      },
      {
        t: 'It runs on several machines',
        why: 'The committed results come from one shared cloud VM.',
      },
    ],
  },
  {
    q: 'The compiled ledger runs 5× faster but its checksum differs from the original’s. What does the harness do?',
    options: [
      {
        t: 'Throws, and reports no speed-up',
        correct: true,
        why: 'A fast wrong answer is a bug, not a result.',
      },
      {
        t: 'Reports 5× with a warning',
        why: 'It refuses to report any number.',
      },
      {
        t: 'Reruns until the checksums agree',
        why: 'A deterministic program that disagrees once will disagree again.',
      },
      {
        t: 'Ignores checksums; that’s the differential test’s job',
        why: 'Both check behaviour; the benchmark checks its own programs.',
      },
    ],
  },
  {
    q: 'Why were n-body and boids slower in the first version?',
    options: [
      {
        t: 'Float64Array is slower than objects for small arrays',
        why: 'With the checks gone, the same layout is faster.',
      },
      {
        t: 'The bounds proof didn’t cover their hot loops’ indexes, so checks ran in the innermost loop',
        correct: true,
        why: 'Outer-loop counters, `i + 1` starts and `&&` guards weren’t proven, per the commit.',
      },
      {
        t: 'The harness timed construction as well',
        why: 'Each program times only its hot section.',
      },
      {
        t: 'They were compiled in opt-in mode',
        why: 'The harness uses the default options.',
      },
    ],
  },
  {
    q: 'The 3-run results file says ledger 5.11×; the later 9-run matrix says 3.75× (best). What is the best conclusion?',
    options: [
      {
        t: 'The compiler regressed',
        why: 'The compiled time barely moved (46 ms, then 44.6 ms best); the original’s moved far more (237 ms, then 167.5 ms best).',
      },
      {
        t: 'One of the two runs is wrong and must be discarded',
        why: 'Both are honest measurements of a noisy machine.',
      },
      {
        t: 'Report the average, 4.4×',
        why: 'Averaging two noisy figures doesn’t remove the noise; it hides it.',
      },
      {
        t: 'Ledger is several times faster; the exact factor varies with machine noise',
        correct: true,
        why: 'Claim what both runs support, at the resolution they support.',
      },
    ],
  },
  {
    q: 'Why does the end-to-end harness use a new Node process for every run?',
    options: [
      {
        t: 'To use more CPU cores',
        why: 'Runs are sequential.',
      },
      {
        t: 'Because Node can only run one file per process',
        why: 'The point is isolation, not a Node restriction.',
      },
      {
        t: 'So no run inherits type feedback, compiled code or garbage from another',
        correct: true,
        why: 'The isolation rule from *Noisy numbers: the median, p95 and a fresh process*.',
      },
      {
        t: 'To skip JIT warm-up',
        why: 'A fresh process starts cold; warm-up is included in every run.',
      },
    ],
  },
  {
    q: 'In CPython, why does the Python plugin keep objects by default?',
    options: [
      {
        t: 'The analyses can’t handle Python',
        why: 'The same VIR and analyses serve both languages.',
      },
      {
        t: 'Columns were measured slower per element, though they used about 4.9× less memory',
        correct: true,
        why: 'So the cost model’s verdict for Python is “opt in if memory matters”.',
      },
      {
        t: 'Python has no typed arrays',
        why: '`array(\'d\')` is a typed column; it was just slower to read in CPython.',
      },
      {
        t: 'Columns used more memory',
        why: 'They used less: 3.3 MB against 16.0 MB.',
      },
    ],
  },
  {
    q: 'What makes a collection of test programs a corpus in Viscosity’s sense?',
    options: [
      {
        t: 'It is randomly generated',
        why: 'Viscosity’s corpus is hand-written (some files after a fuzzer found the bug); random generation is fuzzing.',
      },
      {
        t: 'It is curated, one case per program, and the tests are generated from it',
        correct: true,
        why: 'Adding a case means adding a file.',
      },
      {
        t: 'It contains only programs that pass',
        why: 'A corpus file is kept precisely so it keeps passing; a failing one is a bug report.',
      },
      {
        t: 'It is stored in a database',
        why: 'It is a folder of ordinary source files.',
      },
    ],
  },
  {
    q: 'A corpus program computes something but prints only “done”. What is wrong with it?',
    options: [
      {
        t: 'Nothing: it ran without crashing',
        why: 'A compiled version that computes the wrong value would still print “done”.',
      },
      {
        t: 'It is too short',
        why: 'Short is good; unobservable is the problem.',
      },
      {
        t: 'It needs a header',
        why: 'It may well have one; the problem is what it prints.',
      },
      {
        t: 'The differential test can only catch differences that are printed or thrown',
        correct: true,
        why: 'Print the values that a wrong layout could change.',
      },
    ],
  },
  {
    q: 'How many tests does adding one JavaScript corpus file add to the TypeScript suite?',
    options: [
      {
        t: 'Two: a differential test and a parser-equivalence test',
        correct: true,
        why: 'Plus 4 Rust fixture files when the generator is rerun.',
      },
      {
        t: 'One',
        why: 'The mini-parser test reads the corpus folder too.',
      },
      {
        t: 'None until someone writes a test for it',
        why: 'The tests are generated from the folder listing.',
      },
      {
        t: 'Four',
        why: 'Four is the number of Rust fixture files, which the Rust parity test reads, not the TypeScript suite.',
      },
    ],
  },
  {
    q: 'What is true of the Rust port’s parity testing today?',
    options: [
      {
        t: 'There are no fixtures yet',
        why: '402 fixture files are in engine/rust/tests/expected.',
      },
      {
        t: 'The TypeScript compiler generates the fixtures, and the Rust port matches every one byte for byte',
        correct: true,
        why: '`parity.rs` compares the code and the report for every program in both bounds modes: 190 pairs, all equal when run for this chapter.',
      },
      {
        t: 'The parity test compares only the explain reports',
        why: 'It compares the compiled code too, byte for byte.',
      },
      {
        t: 'Rust is the oracle for TypeScript',
        why: 'The reference implementation is TypeScript.',
      },
    ],
  },
  {
    q: 'Why does the Python differential test run `python3` in a subprocess instead of a VM context?',
    options: [
      {
        t: 'To make it faster',
        why: 'Subprocesses are slower; it is the only way to run Python.',
      },
      {
        t: 'Because the programs are Python: they must run on a real Python interpreter, and the outputs are compared the same way',
        correct: true,
        why: 'The oracle is still the original program, run for real.',
      },
      {
        t: 'Because Python has no exceptions',
        why: 'It compares the exception line in stderr.',
      },
      {
        t: 'To avoid comparing errors',
        why: 'It compares the last line of stderr, where the exception is printed.',
      },
    ],
  },
  {
    q: 'A fuzzer creates a new random generator from the same seed for every program. What happens?',
    options: [
      {
        t: 'It finds bugs faster',
        why: 'It tests one program over and over.',
      },
      {
        t: 'Its results can’t be reproduced',
        why: 'They are perfectly reproducible, and perfectly repetitive.',
      },
      {
        t: 'It finds the same bugs as the corpus',
        why: 'It finds whatever the single program finds, or nothing.',
      },
      {
        t: 'Every program is identical, so it tests one program n times',
        correct: true,
        why: 'Seed once, then keep drawing from the same generator.',
      },
    ],
  },
];
