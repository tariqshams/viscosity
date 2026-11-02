// Chapter 237 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'peephole-what': {
    q: 'What does a **peephole optimiser** do?',
    a: 'It slides a small window of neighbouring instructions over finished code and rewrites any window that matches one of its rules, until nothing matches.',
  },
  'repeat-same-spot': {
    q: 'After a peephole rule rewrites a window, why check the same place (and the one before it) again?',
    a: 'Deleting or replacing an instruction brings new neighbours together, and they may match a rule that did not match before.',
  },
  'store-stays': {
    q: 'In `sd a0, -24(s0)` followed by `ld a0, -24(s0)`, the peephole deletes the load. Why may it not delete the store too?',
    a: 'Code outside the window might read that slot later; only an analysis like liveness, which sees the whole function, can say it never does.',
  },
  'side-condition': {
    q: 'Why is `sd a0, 8(sp)` then `ld a1, 8(sp)` not covered by the rule "delete a load straight after a store to the same place"?',
    a: 'The load goes into a different register, a1, so it is not a no-op; at best it becomes a copy, `mv a1, a0`.',
  },
  'branch-over-jump': {
    q: 'How can `beq a0, a1, skip` / `j far` / `skip:` be improved?',
    a: 'To `bne a0, a1, far` / `skip:`, provided far is within a branch\'s reach.',
  },
  'superopt-what': {
    q: 'What does a **superoptimiser** search for?',
    a: 'The shortest (or cheapest) sequence of instructions that computes exactly the same thing as a given one.',
  },
  'test-then-prove': {
    q: 'Why does a superoptimiser run candidates on a few test inputs before trying to prove them correct?',
    a: 'Tests are cheap and throw out almost every wrong candidate; proof is expensive, so it is kept for the rare survivor.',
  },
  'massalin-limit': {
    q: 'How did Massalin\'s superoptimiser keep its search small enough to finish?',
    a: 'It limited itself to between 10 and 15 opcodes, and reached programs of about 12 instructions.',
  },
};

export const examples = {
  sgn: {
    title: 'Checking the branch-free sign function',
    code: `// srai a1, a0, 63; snez a0, a0;
// or a0, a1, a0
function sgn(x) {
  const a1 = x >> 63n;
  const a0 = x !== 0n ? 1n : 0n;
  return a1 | a0;
}

const big = 2n ** 63n - 1n;
const xs = [-5n, 0n, 7n,
  -big - 1n, big];
for (const x of xs) {
  console.log(x, sgn(x));
}`,
  },
};

const rules = `function noop(ins) {
  const [op, a, b, c] = ins;
  if (op === 'mv') return a === b;
  return op === 'addi' && a === b &&
    c === '0';
}

function reload(x, y) {
  return x[0] === 'sd' &&
    y[0] === 'ld' &&
    x[1] === y[1] && x[2] === y[2];
}

function jumpNext(x, y) {
  return x[0] === 'j' &&
    y[0] === x[1] + ':';
}
`;

const ops = `const OPS = {
  neg: (x) => -x,
  not: (x) => ~x,
  inc: (x) => x + 1,
  dec: (x) => x - 1,
  dbl: (x) => x * 2,
  half: (x) => x >> 1,
};
const TESTS = [-8, -3, -1, 0, 1, 2, 5,
  100];

function run(seq, x) {
  for (const op of seq) x = OPS[op](x);
  return x;
}
`;

export const exercises = {
  peep: {
    title: 'A peephole optimiser',
    prompt:
      'Write `peephole(code)`. `code` is a list of instructions, each an array of strings such as `[\'ld\', \'a0\', \'-24(s0)\']` or a label `[\'next:\']`. The three rules are written for you: `noop(x)` is true for `addi r, r, 0` and `mv r, r` (delete it); `reload(x, y)` is true when `x` stores a register and `y` loads the same register from the same place (delete `y`); `jumpNext(x, y)` is true for a jump to the label on the very next line (delete `x`). Apply them until none matches, and return a **new** array (do not change `code`). After a deletion, look again one position earlier, because new neighbours may now match.',
    starter: rules + `
function peephole(code) {
  const out = code.slice();
  // your code here
  return out;
}`,
    solution: rules + `
function peephole(code) {
  const out = code.slice();
  let i = 0;
  while (i < out.length) {
    const x = out[i];
    const y = out[i + 1] ?? [];
    if (noop(x)) {
      out.splice(i, 1);
    } else if (reload(x, y)) {
      out.splice(i + 1, 1);
    } else if (jumpNext(x, y)) {
      out.splice(i, 1);
    } else {
      i++;
      continue;
    }
    i = Math.max(0, i - 1);
  }
  return out;
}`,
    tests: `const frag = [['sd', 'a0', '-24(s0)'],
  ['ld', 'a0', '-24(s0)'],
  ['mul', 'a0', 'a0', 'a0'],
  ['addi', 'a0', 'a0', '0'],
  ['j', 'next'], ['next:'], ['ret']];
test('the fragment from the chapter', () => {
  expect(peephole(frag)).toEqual([
    ['sd', 'a0', '-24(s0)'],
    ['mul', 'a0', 'a0', 'a0'],
    ['next:'], ['ret']]);
});
test('a different register is kept', () => {
  const c = [['sd', 'a0', '8(sp)'],
    ['ld', 'a1', '8(sp)']];
  expect(peephole(c)).toEqual(c);
});
test('two reloads in a row both go', () => {
  expect(peephole([['sd', 'a0', '8(sp)'],
    ['ld', 'a0', '8(sp)'],
    ['ld', 'a0', '8(sp)']]))
    .toEqual([['sd', 'a0', '8(sp)']]);
});
test('a deletion lines up a new pair', () => {
  expect(peephole([['sd', 'a0', '8(sp)'],
    ['mv', 'a0', 'a0'],
    ['ld', 'a0', '8(sp)']]))
    .toEqual([['sd', 'a0', '8(sp)']]);
});
test('the input is not changed', () => {
  peephole(frag);
  expect(frag.length).toBe(7);
});`,
    hints: [
      'Walk an index `i` along a copy of the code. At each position, look at the instruction `x = out[i]` and its neighbour `y = out[i + 1]` (which may not exist; use `[]` then).',
      'If a rule matches, remove the right instruction with `out.splice(index, 1)`: `x` for `noop` and `jumpNext`, `y` (at `i + 1`) for `reload`. If no rule matches, move on with `i++`.',
      'After a deletion, do not move forwards: set `i = Math.max(0, i - 1)`, so the instruction before can be paired with its new neighbour. Loop `while (i < out.length)`.',
    ],
    walkthrough: `**How to think about it.** The window is two instructions wide, so at every position we look at one instruction and the one after it. The rules are already written; the part that needs thought is the driving loop, because a rewrite changes the code under our feet. When an instruction is deleted, its two neighbours become adjacent for the first time, and that new pair might match a rule (the fourth test is built to show this: deleting \`mv a0, a0\` makes the store and the load neighbours). So after a deletion we must look again, starting one position earlier. When nothing matches, we move one step on. The loop ends when the index walks off the end without any rule firing, which is exactly "a whole pass changed nothing".

**The solution, line by line.**

- \`const out = code.slice();\` copies the list, so the caller's code is left alone (the last test checks that).
- \`let i = 0;\` puts the window at the top.
- \`while (i < out.length) {\` keeps going until the window has moved past the last instruction.
- \`const x = out[i];\` and \`const y = out[i + 1] ?? [];\` are the two instructions in the window; at the very end there is no \`y\`, and the empty array makes every rule about pairs fail harmlessly.
- \`if (noop(x)) { out.splice(i, 1); }\` deletes an \`addi r, r, 0\` or \`mv r, r\`.
- \`else if (reload(x, y)) { out.splice(i + 1, 1); }\` deletes the load, not the store: the register already holds the value, but the slot may be read later.
- \`else if (jumpNext(x, y)) { out.splice(i, 1); }\` deletes a jump whose target label is the next line.
- \`else { i++; continue; }\` means no rule matched here, so the window slides on.
- \`i = Math.max(0, i - 1);\` runs only after a deletion: step back one position (but never below 0) so the previous instruction meets its new neighbour.
- \`return out;\` hands back the cleaned code.

On the chapter's fragment: at 0 the reload rule deletes the \`ld\`; back at 0, \`sd\`/\`mul\` match nothing; at 1, \`mul\`/\`addi\` match nothing, at 2 the \`addi\` is a no-op and goes; back at 1, then 2, where \`j next\` sits above \`next:\` and goes; then the window slides off the end.

**Common wrong attempts.**

- Always moving on after a deletion (\`i++\`). The deleted instruction's neighbours never get compared, so in the fourth test the store and the load end up side by side and the load survives.
- Deleting the store in the reload rule instead of the load. The register still has the right value afterwards, so this looks fine locally, but the slot is now never written, and any later code that reads it gets garbage; the first test catches it.`,
    wrong: [
      {
        code: rules + `
function peephole(code) {
  const out = code.slice();
  let i = 0;
  while (i < out.length) {
    const x = out[i];
    const y = out[i + 1] ?? [];
    if (noop(x)) out.splice(i, 1);
    else if (reload(x, y)) {
      out.splice(i + 1, 1);
    } else if (jumpNext(x, y)) {
      out.splice(i, 1);
    }
    i++;
  }
  return out;
}`,
        why: 'It always moves on, so a pair lined up by a deletion is never checked; the fourth test keeps its load.',
      },
      {
        code: rules + `
function peephole(code) {
  const out = code.slice();
  let i = 0;
  while (i < out.length) {
    const x = out[i];
    const y = out[i + 1] ?? [];
    if (noop(x)) {
      out.splice(i, 1);
    } else if (reload(x, y)) {
      out.splice(i, 1);
    } else if (jumpNext(x, y)) {
      out.splice(i, 1);
    } else {
      i++;
      continue;
    }
    i = Math.max(0, i - 1);
  }
  return out;
}`,
        why: 'It deletes the store instead of the load, so the slot is never written; the first test expects the store to stay.',
      },
    ],
  },
  search: {
    optional: true,
    title: 'A tiny superoptimiser',
    prompt:
      'A toy machine has six one-operand instructions, in `OPS`: `neg`, `not`, `inc`, `dec`, `dbl` and `half`. A program is a list of their names, run left to right by `run(seq, x)`. Write `superopt(f, maxLen)`: try every program of length 0, then every program of length 1, then 2, and so on up to `maxLen`, in the order the names appear in `OPS`, and return the **first** one that agrees with `f` on every input in `TESTS`. Return `null` if there is none. For example `superopt((x) => -(x + 1), 3)` is `[\'not\']`.',
    starter: ops + `
function superopt(f, maxLen) {
  // your code here
  return null;
}`,
    solution: ops + `
function agrees(seq, f) {
  return TESTS.every(
    (x) => run(seq, x) === f(x));
}

function superopt(f, maxLen) {
  const names = Object.keys(OPS);
  let seqs = [[]];
  for (let n = 0; n <= maxLen; n++) {
    for (const s of seqs) {
      if (agrees(s, f)) return s;
    }
    const next = [];
    for (const s of seqs) {
      for (const op of names) {
        next.push([...s, op]);
      }
    }
    seqs = next;
  }
  return null;
}`,
    tests: `test('not is -(x + 1)', () => {
  expect(superopt((x) => -(x + 1), 3))
    .toEqual(['not']);
});
test('2x + 2 is inc then dbl', () => {
  expect(superopt((x) => 2 * x + 2, 3))
    .toEqual(['inc', 'dbl']);
});
test('4x is dbl twice', () => {
  expect(superopt((x) => 4 * x, 3))
    .toEqual(['dbl', 'dbl']);
});
test('the identity is the empty program', () => {
  expect(superopt((x) => x, 2)).toEqual([]);
});
test('x * x cannot be built', () => {
  expect(superopt((x) => x * x, 2)).toBe(null);
});`,
    hints: [
      'Keep a list of all programs of the current length, starting with `[[]]` (one program, of length 0). Check each against `f` on every test input.',
      'To get the programs of the next length, extend every current program by every instruction name: for each `s`, for each `op`, push `[...s, op]`.',
      'Write a helper `agrees(seq, f)` that returns `TESTS.every((x) => run(seq, x) === f(x))`. Loop the length from 0 to `maxLen`; return the first program that agrees; after the loop, return `null`.',
    ],
    walkthrough: `**How to think about it.** This is Massalin's idea in miniature: enumerate programs in order of length, so that the first one that works is guaranteed to be a shortest one, and use a handful of test inputs as the filter. Programs of length n are all programs of length n − 1 with one more instruction on the end, so we can build each length from the last. With six instructions there are 6^n programs of length n, which is why real superoptimisers limit the instruction set and the length.

**The solution, line by line.**

- \`function agrees(seq, f)\` runs the candidate on every test input and checks it matches \`f\` on each; \`every\` stops at the first mismatch, which is what makes testing a cheap filter.
- \`const names = Object.keys(OPS);\` lists the instruction names in the order they were written: neg, not, inc, dec, dbl, half.
- \`let seqs = [[]];\` is the list of programs of length 0: only the empty program.
- \`for (let n = 0; n <= maxLen; n++) {\` goes through the lengths in order.
- \`for (const s of seqs) { if (agrees(s, f)) return s; }\` returns the first program of this length that passes; because shorter lengths were tried first, it is a shortest one.
- The next block builds \`next\`, every program one instruction longer, by extending each \`s\` with each \`op\` in order, and \`seqs = next;\` moves to that length.
- \`return null;\` runs only if no program up to \`maxLen\` agreed.

For \`(x) => -(x + 1)\` the search finds \`['not']\` at length 1: in two's complement, \`~x\` is \`-x - 1\`, which is the same number. For \`2x + 2\` it tries 36 two-instruction programs in order and the first that passes is \`['inc', 'dbl']\`, that is \`(x + 1) * 2\`.

Remember that agreeing on \`TESTS\` is not a proof; with only eight inputs, a wrong program could slip through, which is why a real superoptimiser proves its answer before using it.

**Common wrong attempts.**

- Testing on a single input. With \`x = 0\` alone, \`2x + 2\` is 2, and \`['inc', 'inc']\` gives 2 as well, so the search returns it before reaching \`['inc', 'dbl']\`: a program that is right on the test and wrong almost everywhere else.
- Growing programs by one instruction but forgetting the empty program: starting from the six one-instruction programs means \`(x) => x\` is never matched by \`[]\`.`,
    wrong: [
      {
        code: ops + `
function superopt(f, maxLen) {
  const names = Object.keys(OPS);
  let seqs = [[]];
  for (let n = 0; n <= maxLen; n++) {
    for (const s of seqs) {
      if (run(s, 0) === f(0)) return s;
    }
    const next = [];
    for (const s of seqs) {
      for (const op of names) {
        next.push([...s, op]);
      }
    }
    seqs = next;
  }
  return null;
}`,
        why: 'Testing only x = 0 lets wrong programs through: for 2x + 2 it returns `[\'inc\', \'inc\']`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'A peephole window shows `sd a0, -24(s0)` then `ld a0, -24(s0)`. What can a peephole rule safely do?',
    options: [
      { t: 'Delete both: they cancel out', why: 'The store may be read later by code outside the window; deleting it could break the program.' },
      { t: 'Delete the load, keep the store', correct: true, why: 'a0 already holds the value, so the load is a no-op; whether the store is needed depends on code the window cannot see.' },
      { t: 'Nothing: two instructions are too few to judge', why: 'Two neighbouring instructions are exactly what a peephole looks at, and this pair is a classic match.' },
    ],
  },
  {
    q: 'clang compiles `x * 8` for RISC-V as `slli a0, a0, 3`. Why?',
    options: [
      { t: 'RISC-V has no multiply instruction', why: 'With the M extension it has `mul`; the shift is chosen because it is cheaper.' },
      { t: 'A shift is always more accurate than a multiply', why: 'Both give the exact same whole-number result here; the difference is cost.' },
      { t: 'Shifting left by 3 multiplies by 8 and is cheaper than a multiply', correct: true, why: 'Replacing an expensive operation by a cheaper equivalent one is strength reduction, here done on machine instructions.' },
    ],
  },
  {
    q: 'Why does GCC run its `peephole2` pass after register allocation but before scheduling?',
    options: [
      { t: 'Allocation creates new patterns to clean up, and scheduling should see the cleaned-up code', correct: true, why: 'GCC\'s documentation says this order can give much better code on machines that schedule.' },
      { t: 'Peephole rules cannot run on registers', why: 'They run on instructions with real registers; that is the point of running after allocation.' },
      { t: 'Scheduling would undo every peephole change', why: 'Scheduling reorders instructions but does not reintroduce deleted ones.' },
    ],
  },
  {
    q: 'A superoptimiser finds a candidate that matches the target on all 50 of its test inputs. What should it do?',
    options: [
      { t: 'Use it: 50 tests is plenty', why: 'A candidate can agree on every test and still differ on some untested input among the 2^64.' },
      { t: 'Prove (or otherwise check) that it is equal on every input before using it', correct: true, why: 'Tests are a cheap filter; correctness for all inputs needs a proof, for example with an SMT solver.' },
      { t: 'Throw it away: tests cannot tell you anything', why: 'Tests throw out almost all wrong candidates very cheaply, which is why they come first.' },
    ],
  },
  {
    q: 'How do Souper and STOKE differ?',
    options: [
      { t: 'Souper works on LLVM IR with an SMT solver; STOKE does a random search over x86-64 code', correct: true, why: 'That is how each describes itself: Souper finds missing peephole optimisations in LLVM IR, STOKE explores x86-64 programs by random transformations.' },
      { t: 'Souper enumerates every program by length; STOKE only reorders instructions', why: 'Souper synthesises candidates with a solver, and STOKE changes instructions as well as their order.' },
      { t: 'They are two names for Massalin\'s original program', why: 'Both are much later systems that scale the idea up in different ways.' },
    ],
  },
];
