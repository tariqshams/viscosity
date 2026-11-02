// Chapter 115 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'e2e-what': {
    q: 'What is an end-to-end benchmark?',
    a: 'A measurement of a whole program, compiled as a user would compile it, rather than one loop written for the benchmark.',
  },
  'e2e-checksum': {
    q: 'In an end-to-end benchmark comparing an original and a compiled program, what two jobs does each program’s printed checksum do?',
    a: 'It keeps the work observable, so it can’t be removed as dead code, and it lets the harness check both versions computed the same thing.',
  },
  'e2e-fresh': {
    q: 'Why does an end-to-end benchmark of a compiler start a fresh process for every run of each version?',
    a: 'So no run inherits the other version’s type feedback, compiled code or garbage.',
  },
  'e2e-story': {
    q: 'Why were the n-body and boids benchmarks first slower after compiling with Viscosity?',
    a: 'Their hot loops used indexes the bounds proof didn’t cover (an outer loop’s counter; `i + 1` starts and `&&` guards), so checks ran inside the hottest loop.',
  },
  'corpus-what': {
    q: 'What is a test corpus?',
    a: 'A large, curated collection of programs used as test inputs, each chosen to exercise one case.',
  },
  'corpus-observable': {
    q: 'Why should a differential-test corpus program that catches an error print the error’s class and message?',
    a: 'A difference that isn’t printed can’t be caught: the differential test only compares output and errors.',
  },
  'corpus-rust': {
    q: 'What is the oracle for the Rust port of Viscosity?',
    a: 'The TypeScript compiler: its compiled code and explain reports, stored as fixtures, must be reproduced byte for byte.',
  },
  'corpus-limit': {
    q: 'What kind of bug can a hand-written test corpus never find?',
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
    walkthrough: `**How to think about it.** This is the core of the harness (\`packages/bench/src/e2e.ts\` and the matrix script), made a little stricter. Two rules come from *Benchmarking honestly*: correctness before speed, so the checksums are checked first and a mismatch throws; and a robust summary, so one slow run (the committed particles data has a 135 ms run among others from 90 to 124) cannot drag the answer about. The median does that: it ignores how far an outlier is from the rest.

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
    optional: true,
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
    walkthrough: `**How to think about it.** This is a fuzzer of the kind *Testing compilers: differential, round-trip, fuzzing and shrinking* describes, aimed at a layout compiler, which is what \`engine/rust/scripts/fuzz.mjs\` does for Viscosity at full size. There are two pieces: a generator that only ever makes valid programs, and a loop that runs every program through both versions and stops at the first disagreement. Two traps decide the details: a program that prints nothing can never disagree, so \`get\` must be among the statements; and the random generator must be made once, or every program comes out the same.

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
    q: 'In Viscosity’s end-to-end harness, the compiled ledger runs 5× faster but its checksum differs from the original’s. What does the harness do?',
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
    q: 'Why were Viscosity’s n-body and boids benchmarks slower in its first version?',
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
    q: 'A differential-test corpus program computes something but prints only “done”. What is wrong with it?',
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
];
