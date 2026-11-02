// Chapter 228-b cards (staged split of 225). Keys are stable ids: never
// rename them.

export const prompts = {
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
  'fuzz-two-oracles': {
    q: 'What two things does the repository’s Viscosity fuzzer check for every program?',
    a: 'Behaviour (original and compiled print and throw the same) and parity (the TypeScript and Rust engines give the same code and explain text).',
  },
  'reduce-what': {
    q: 'What does test-case reduction do?',
    a: 'Shrinks a failing input by removing parts of it, keeping each removal only if the same failure remains.',
  },
  'reduce-valid': {
    q: 'Why does the repository’s reducer check that each candidate still parses?',
    a: 'Removing lines can break the program; a candidate that no longer parses fails for a different reason, not the bug.',
  },
  'one-minimal': {
    q: 'What does it mean for a reduced input to be 1-minimal?',
    a: 'It still fails, and removing any single piece of it makes it stop failing.',
  },
  'tv-what': {
    q: 'How does translation validation differ from testing the compiler?',
    a: 'It checks, for each compilation, that the output is equivalent to the input program, instead of sampling programs.',
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
  reduce: {
    title: 'Reduce a failing program',
    prompt:
      'A fuzzer found a program, given as an array of lines, for which `fails(lines)` is `true`. Write `reduce(lines, fails)` the way the repository’s reducer works: start with a chunk size of half the length (at least 1); try removing each chunk of that many consecutive lines, keeping a removal whenever the shorter (non-empty) array still fails, and repeat at this size until a whole pass removes nothing; then halve the chunk size (at least 1), and stop after a pass at size 1 removes nothing. Return the reduced array, and don’t change `lines` itself.',
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
    q: 'Why does the repository’s fuzzer give every program its own seed, derived from the campaign seed and the program’s number?',
    options: [
      { t: 'So any single failing program can be generated again on its own', correct: true, why: '`--only k` regenerates program k exactly, without rerunning the campaign.' },
      { t: 'To make the programs run faster', why: 'Seeds decide what is generated, not how fast it runs.' },
      { t: 'Because JavaScript has no random numbers', why: 'It has `Math.random`, but that cannot be replayed.' },
      { t: 'So that every program is the same', why: 'Different seeds give different programs; the same seed gives the same one.' },
    ],
  },
  {
    q: 'Why do Csmith and YARPGen go to great lengths to avoid undefined behaviour?',
    options: [
      { t: 'To make the programs shorter', why: 'Avoiding it usually makes programs longer.' },
      { t: 'Because C compilers reject undefined behaviour', why: 'They usually accept it silently; that is what makes it dangerous.' },
      { t: 'With undefined behaviour, two correct compilers may legitimately disagree, so a difference would prove nothing', correct: true, why: 'Differential testing needs programs with one right answer.' },
      { t: 'So that C-Reduce can run faster', why: 'Reduction is a separate step; UB matters for the oracle.' },
    ],
  },
  {
    q: 'A reducer removes a chunk and the candidate still fails, but no longer parses. What should it do?',
    options: [
      { t: 'Keep it: it still fails', why: 'It now fails for a different reason, a syntax error, not the bug being chased.' },
      { t: 'Reject it, as the repository’s reducer does, because it no longer shows the same bug', correct: true, why: 'Only valid candidates with the same kind of failure are kept.' },
      { t: 'Stop reducing altogether', why: 'Other chunks may still be removable.' },
      { t: 'Report a new compiler bug', why: 'A syntax error in a mangled program is expected, not a bug.' },
    ],
  },
  {
    q: 'What does the Drip companion’s fuzzer compare?',
    options: [
      { t: 'The run-time output of random Drip programs', why: 'Mangled programs are not run: one could loop forever.' },
      { t: 'The compile errors reported by the tree-walker’s front end and by the VM’s compiler, on corpus programs with one token dropped, replaced or inserted', correct: true, why: 'Both front ends must reject a broken program in exactly the same words.' },
      { t: 'TypeScript against Rust', why: 'That is the Viscosity fuzzer’s parity check.' },
      { t: 'Nothing: it only checks that nothing crashes', why: 'It compares the two lists of errors with each other.' },
    ],
  },
  {
    q: 'How is translation validation different from fuzzing?',
    options: [
      { t: 'It runs more random programs', why: 'It does not sample programs at all.' },
      { t: 'It proves the compiler correct for every program', why: 'That is compiler verification; translation validation checks one compilation at a time.' },
      { t: 'It only works for interpreters', why: 'Necula built one for the GNU C compiler.' },
      { t: 'It checks, every time the compiler runs, that this output is equivalent to this input', correct: true, why: 'It turns “is the compiler right?” into “was this compilation right?”.' },
    ],
  },
];
