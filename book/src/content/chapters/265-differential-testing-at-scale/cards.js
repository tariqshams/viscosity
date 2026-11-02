// Chapter 265 cards. Keys are stable ids: never rename them.

export const prompts = {
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

export const exercises = {
  fuzzToy: {
    title: 'Fuzz a toy layout compiler',
    prompt:
      'A toy language has three statements over a list of records: `[\'push\', v]` adds `{ x: v }`, `[\'inc\', k]` adds `k` to every `x`, and `[\'get\', i]` prints element `i`’s `x`, or `none`. `runAoS` runs a program with objects; `runSoA`, the “compiled” version, uses one `Float64Array` column, and has bugs. Write `gen(rand)`: a random program of **1 to 8** statements, each a `push` of `rand(10)`, an `inc` of `1 + rand(3)`, or a `get` of `rand(6)`, all equally likely. Then write `fuzz(seed, n, f, g)`: make **one** generator with `makeRand(seed)`, generate up to `n` programs, and return the first program on which `f` and `g` give different output, or `null`.',
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
    prompt:
      'Write `parseHeader(src)`. Find the first line that starts with `// viscosity` or `# viscosity` (not `// @viscosity`, which is an annotation). Return `null` if there is none. Otherwise return `{ mode, want }`: `mode` is `\'opt-in\'` if the line contains `(opt-in)`, else `\'auto\'`; `want` maps each name to its layout, from the comma-separated `name=layout` pairs after the first `:`. Ignore empty pairs.',
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
    q: 'What makes a collection of test programs a corpus in Viscosity’s sense?',
    options: [
      { t: 'It is randomly generated', why: 'Viscosity’s corpus is hand-written (some files after a fuzzer found the bug); random generation is fuzzing.' },
      { t: 'It is curated, one case per program, and the tests are generated from it', correct: true, why: 'Adding a case means adding a file.' },
      { t: 'It contains only programs that pass', why: 'A corpus file is kept precisely so it keeps passing; a failing one is a bug report.' },
      { t: 'It is stored in a database', why: 'It is a folder of ordinary source files.' },
    ],
  },
  {
    q: 'A corpus program computes something but prints only “done”. What is wrong with it?',
    options: [
      { t: 'Nothing: it ran without crashing', why: 'A compiled version that computes the wrong value would still print “done”.' },
      { t: 'It is too short', why: 'Short is good; unobservable is the problem.' },
      { t: 'It needs a header', why: 'It may well have one; the problem is what it prints.' },
      { t: 'The differential test can only catch differences that are printed or thrown', correct: true, why: 'Print the values that a wrong layout could change.' },
    ],
  },
  {
    q: 'How many tests does adding one JavaScript corpus file add to the TypeScript suite?',
    options: [
      { t: 'Two: a differential test and a parser-equivalence test', correct: true, why: 'Plus 4 Rust fixture files when the generator is rerun.' },
      { t: 'One', why: 'The mini-parser test reads the corpus folder too.' },
      { t: 'None until someone writes a test for it', why: 'The tests are generated from the folder listing.' },
      { t: 'Four', why: 'Four is the number of Rust fixture files, which the Rust parity test reads, not the TypeScript suite.' },
    ],
  },
  {
    q: 'What is true of the Rust port’s parity testing today?',
    options: [
      { t: 'There are no fixtures yet', why: '402 fixture files are in engine/rust/tests/expected.' },
      { t: 'The TypeScript compiler generates the fixtures, and the Rust port matches every one byte for byte', correct: true, why: '`parity.rs` compares the code and the report for every program in both bounds modes: 190 pairs, all equal when run for this chapter.' },
      { t: 'The parity test compares only the explain reports', why: 'It compares the compiled code too, byte for byte.' },
      { t: 'Rust is the oracle for TypeScript', why: 'The reference implementation is TypeScript.' },
    ],
  },
  {
    q: 'Why does the Python differential test run `python3` in a subprocess instead of a VM context?',
    options: [
      { t: 'To make it faster', why: 'Subprocesses are slower; it is the only way to run Python.' },
      { t: 'Because the programs are Python: they must run on a real Python interpreter, and the outputs are compared the same way', correct: true, why: 'The oracle is still the original program, run for real.' },
      { t: 'Because Python has no exceptions', why: 'It compares the exception line in stderr.' },
      { t: 'To avoid comparing errors', why: 'It compares the last line of stderr, where the exception is printed.' },
    ],
  },
  {
    q: 'A fuzzer creates a new random generator from the same seed for every program. What happens?',
    options: [
      { t: 'It finds bugs faster', why: 'It tests one program over and over.' },
      { t: 'Its results can’t be reproduced', why: 'They are perfectly reproducible, and perfectly repetitive.' },
      { t: 'It finds the same bugs as the corpus', why: 'It finds whatever the single program finds, or nothing.' },
      { t: 'Every program is identical, so it tests one program n times', correct: true, why: 'Seed once, then keep drawing from the same generator.' },
    ],
  },
];
