// Chapter 213-b cards (split from chapter 213). Keys are stable ids.

export const prompts = {
  'sr-what': {
    q: 'What does strength reduction do to `j = c * i + d` in a loop?',
    a: 'Gives `j` its own phi that starts at `c × i₀ + d` and adds `c × s` each trip, so the loop no longer multiplies.',
  },
  'sr-start-step': {
    q: '`i` starts at 0 and steps by 1; `j = 4 * i + 3`. What are the new variable’s start and step?',
    a: 'Start `4 × 0 + 3 = 3`, step `4 × 1 = 4`.',
  },
  'sr-floats': {
    q: 'Why do compilers not strength-reduce `x = 0.1 * k`?',
    a: 'Adding 0.1 repeatedly rounds on every add, so the sum drifts from the multiply’s single rounding: the results would change.',
  },
  'sr-address': {
    q: 'Which multiply does almost every array loop contain, even if the source has none?',
    a: 'The address of element `i`: start plus element size times `i` (8 × i for a `Float64Array`).',
  },
  'ive-what': {
    q: 'What does induction variable elimination remove?',
    a: 'A counter used only by the loop’s test and its own update, once the test has been rewritten to use another member of its family.',
  },
  'ive-sign': {
    q: 'With `j = -2 * i`, what does the test `i < n` become?',
    a: '`j > -2 * n`: multiplying by a negative number flips the comparison.',
  },
  'ive-dce': {
    q: 'After the test is rewritten to use `j`, what deletes the old counter `i`?',
    a: 'Dead code elimination: nothing uses `i`’s phi or its `+ 1` any more.',
  },
  'sr-licm': {
    q: 'Where are the new start value `c × i₀ + d` and the bound `c × n + d` computed?',
    a: 'In the preheader, once per entry to the loop: they are loop-invariant.',
  },
};

export const examples = {
  reduce: {
    title: 'The same numbers, with no multiply',
    code: `const n = 6;
const a = [];
for (let i = 0; i < n; i++) {
  a.push(3 * i + 5);
}

const b = [];
let j = 5;        // 3 * 0 + 5
for (let i = 0; i < n; i++) {
  b.push(j);
  j += 3;         // 3 * 1
}
console.log(a);
console.log(b);`,
  },
};

export const exercises = {
  families: {
    title: 'Find the induction variable families',
    prompt:
      '`insts` lists a loop’s instructions `{ id, op, args }` in order (each operand is defined before it is used); an argument is an id (a string) or a number. `ivs` lists the basic induction variables. Write `families(insts, ivs)` returning an object that maps every family member to `[base, c, d]`, meaning `c × base + d`. A basic variable `i` is `[i, 1, 0]`. Then, for an instruction whose operand is a member `[b, c, d]` and whose other operand is a number `k`: `*` gives `[b, c·k, d·k]` (either order), `+` gives `[b, c, d + k]` (either order), and `member - k` gives `[b, c, d - k]`. Anything else is not a member.',
    starter: `function families(insts, ivs) {
  // your code here
  return {};
}

const I = (id, op, ...args) =>
  ({ id, op, args });
console.log(families([
  I('t', '*', 'i', 2),
  I('j', '+', 't', 1),
], ['i']));
// i: [i, 1, 0], t: [i, 2, 0],
// j: [i, 2, 1]`,
    solution: `function families(insts, ivs) {
  const fam = {};
  for (const v of ivs)
    fam[v] = [v, 1, 0];
  const num = (v) =>
    typeof v === 'number';
  for (const x of insts) {
    const [a, b] = x.args;
    let m = null;
    let k = null;
    if (fam[a] && num(b)) {
      m = fam[a];
      k = b;
    } else if (num(a) && fam[b] &&
        x.op !== '-') {
      m = fam[b];
      k = a;
    }
    if (!m) continue;
    const [base, c, d] = m;
    if (x.op === '*')
      fam[x.id] = [base, c * k, d * k];
    if (x.op === '+')
      fam[x.id] = [base, c, d + k];
    if (x.op === '-')
      fam[x.id] = [base, c, d - k];
  }
  return fam;
}`,
    tests: `const I = (id, op, ...args) => ({ id, op, args });
test('2 * i + 1', () => {
  expect(families([I('t', '*', 'i', 2), I('j', '+', 't', 1)], ['i'])).toEqual({ i: ['i', 1, 0], t: ['i', 2, 0], j: ['i', 2, 1] });
});
test('numbers can come first', () => {
  expect(families([I('t', '*', 8, 'i'), I('p', '+', 16, 't')], ['i'])).toEqual({ i: ['i', 1, 0], t: ['i', 8, 0], p: ['i', 8, 16] });
});
test('a multiply after an add scales the offset too', () => {
  expect(families([I('u', '+', 'i', 1), I('v', '*', 'u', 3)], ['i'])).toEqual({ i: ['i', 1, 0], u: ['i', 1, 1], v: ['i', 3, 3] });
});
test('subtracting a number', () => {
  expect(families([I('k', '-', 'i', 1)], ['i'])).toEqual({ i: ['i', 1, 0], k: ['i', 1, -1] });
});
test('10 - i and i * i are not members', () => {
  expect(families([I('r', '-', 10, 'i'), I('q', '*', 'i', 'i')], ['i'])).toEqual({ i: ['i', 1, 0] });
});
test('two families side by side', () => {
  const insts = [I('a', '*', 'x', 4), I('b', '+', 'y', 2), I('c', '+', 'a', 'b')];
  expect(families(insts, ['x', 'y'])).toEqual({ x: ['x', 1, 0], y: ['y', 1, 0], a: ['x', 4, 0], b: ['y', 1, 2] });
});`,
    hints: [
      'Start the answer with every basic variable as `[i, 1, 0]`, then walk the instructions once, in order.',
      'For each instruction, find which operand (if any) is already a member and whether the other one is a number. Remember that `k - member` does not count.',
      'Apply the rule for the operator: a multiply scales both `c` and `d` by `k`; an add or subtract only moves `d`.',
    ],
    walkthrough: `**How to think about it.** Each member of a family is described by three things: which basic variable it grows from, how many times as fast (\`c\`), and its offset (\`d\`). The rules then come straight from algebra. If \`m = c × i + d\`, then \`m × k = (c·k) × i + d·k\`, so a multiply scales both numbers; \`m + k = c × i + (d + k)\` only moves the offset; and \`m - k\` moves it the other way. \`k - m\` would be \`-c × i + (k - d)\`, which is a member too in real compilers, but the exercise leaves it out, so it must be rejected. Because operands are defined before their users, one pass in order is enough: by the time you meet an instruction, everything it could build on is already in the table.

**The solution, line by line.**

- \`const fam = {};\` and \`for (const v of ivs) fam[v] = [v, 1, 0];\` (two lines) start the table with each basic variable: one times itself plus nothing.
- \`const num = (v) => typeof v === 'number';\` (two lines) spots a number literal.
- \`for (const x of insts) {\` visits the instructions in order, and \`const [a, b] = x.args;\` names the operands.
- \`let m = null;\` and \`let k = null;\` will hold the member operand's triple and the number.
- \`if (fam[a] && num(b)) {\` handles "member, then number", setting \`m = fam[a]\` and \`k = b\`.
- \`} else if (num(a) && fam[b] && x.op !== '-') {\` handles "number, then member", except for subtraction, where the order matters.
- \`if (!m) continue;\` skips anything that is not a member operation (two ids, or no member at all).
- \`const [base, c, d] = m;\` unpacks the triple.
- The three \`if\`s apply the rules: \`*\` gives \`[base, c * k, d * k]\`, \`+\` gives \`[base, c, d + k]\`, \`-\` gives \`[base, c, d - k]\`. Any other operator records nothing.
- \`return fam;\` hands back the table, basic variables included.

On the third test, \`u = i + 1\` is \`[i, 1, 1]\`, and \`v = u * 3\` is \`[i, 3, 3]\`: \`3 × (i + 1) = 3i + 3\`, so the offset was scaled too.

**Common wrong attempts.**

- Scaling only \`c\` on a multiply gives \`[i, 3, 1]\` for \`(i + 1) * 3\`, which is \`3i + 1\`, the wrong number.
- Accepting \`10 - i\` as \`[i, 1, -10]\` gets the sign of \`i\` wrong.
- Treating \`i * i\` or \`a + b\` (two ids) as members: neither has a fixed step.`,
    wrong: [
      {
        code: `function families(insts, ivs) {
  const fam = {};
  for (const v of ivs)
    fam[v] = [v, 1, 0];
  for (const x of insts) {
    const [a, b] = x.args;
    const m = fam[a] ?? fam[b];
    const k = fam[a] ? b : a;
    if (!m || typeof k !== 'number')
      continue;
    const [base, c, d] = m;
    if (x.op === '*')
      fam[x.id] = [base, c * k, d];
    if (x.op === '+')
      fam[x.id] = [base, c, d + k];
    if (x.op === '-')
      fam[x.id] = [base, c, d - k];
  }
  return fam;
}`,
        why: 'A multiply must scale the offset too: `(i + 1) * 3` is `3i + 3`, not `3i + 1`. It also accepts `10 - i` as if it were `i - 10`.',
      },
    ],
  },
  reduced: {
    optional: true,
    title: 'Strength-reduce a loop by hand',
    prompt:
      '`orig(n)` returns `[7 * i + 2 for i from 0 to n - 1]`. Write `reduced(n)` that returns the same array **without any multiply**: keep a variable that starts at the first value and add the step each trip. (The tests check the results and that your function’s source contains no `*`.)',
    starter: `function orig(n) {
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push(7 * i + 2);
  }
  return out;
}

function reduced(n) {
  // your code here: no multiply!
  return [];
}

console.log(orig(4), reduced(4));`,
    solution: `function orig(n) {
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push(7 * i + 2);
  }
  return out;
}

function reduced(n) {
  const out = [];
  let j = 2;
  for (let i = 0; i < n; i++) {
    out.push(j);
    j += 7;
  }
  return out;
}`,
    tests: `test('the same values as orig', () => {
  expect(reduced(5)).toEqual([2, 9, 16, 23, 30]);
});
test('zero trips', () => {
  expect(reduced(0)).toEqual([]);
});
test('a longer run still matches', () => {
  expect(reduced(200)).toEqual(orig(200));
});
test('no multiply left in reduced', () => {
  expect(reduced.toString().includes('*')).toBe(false);
});`,
    hints: [
      'What is `7 * i + 2` when `i` is 0? That is where your new variable starts.',
      'By how much does `7 * i + 2` grow when `i` grows by 1? That is your step.',
      'Push the variable, then add 7 to it, inside a loop that runs `n` times.',
    ],
    walkthrough: `**How to think about it.** This is the chapter's recipe done by hand. The value \`7 * i + 2\` is a member of \`i\`'s family with \`c = 7\` and \`d = 2\`, and \`i\` starts at 0 and steps by 1, so the new variable starts at \`7 × 0 + 2 = 2\` and steps by \`7 × 1 = 7\`. Order matters inside the loop: push the current value first, then step it, so that trip 0 sees 2.

**The solution, line by line.**

- \`const out = [];\` collects the values.
- \`let j = 2;\` is the new variable's start, \`c × i₀ + d\`; in a compiler this line would live in the preheader.
- \`for (let i = 0; i < n; i++) {\` keeps the original loop shape (the counter is still used by the test; removing it would be induction variable elimination).
- \`out.push(j);\` uses the variable where the original used \`7 * i + 2\`.
- \`j += 7;\` steps it by \`c × s\`, ready for the next trip.
- \`return out;\` hands back the array.

**Common wrong attempts.**

- Stepping before pushing (\`j += 7; out.push(j);\`) shifts every value by one step: \`[9, 16, ...]\`.
- Starting \`j\` at 0 forgets the offset \`d\`.`,
    wrong: [
      {
        code: `function reduced(n) {
  const out = [];
  let j = 2;
  for (let i = 0; i < n; i++) {
    j += 7;
    out.push(j);
  }
  return out;
}`,
        why: 'Steps before using the value, so the first element is 9, not 2.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'A loop over `i` (start 0, step 1) computes `j = 5 * i + 2`. After strength reduction, what does the new `j` start at, and what does it add per trip?',
    options: [
      { t: 'Starts at 0, adds 5', why: 'The start must include the offset: `5 × 0 + 2 = 2`.' },
      { t: 'Starts at 2, adds 5', correct: true, why: 'Start `c × i₀ + d = 2`; step `c × s = 5`.' },
      { t: 'Starts at 2, adds 7', why: 'The offset is added once, at the start; the step is only `c × s`.' },
    ],
  },
  {
    q: 'Why is strength reduction safe for an integer counter but not for `x = 0.1 * k`?',
    options: [
      { t: 'Because floats cannot be added in a loop', why: 'They can; the result is just not the same as the multiply.' },
      { t: 'Because the compiler cannot tell what `0.1 * k` is', why: 'It is a perfectly good family member; the problem is rounding.' },
      { t: 'Because each float addition rounds, and ten adds of 0.1 give 0.9999999999999999 where 10 × 0.1 gives 1', correct: true, why: 'Whole numbers (up to 2⁵³) have nothing to round, so repeated adds and one multiply agree.' },
    ],
  },
  {
    q: 'After strength reduction, `i` is used only in the test `i < n`, and `j = 3 * i + 1`. What can replace the test?',
    options: [
      { t: '`j < n`', why: '`j` grows three times as fast, so it would stop the loop early.' },
      { t: '`j < 3 * n + 1`, with the bound computed in the preheader', correct: true, why: 'Since 3 is positive, `i < n` exactly when `3i + 1 < 3n + 1`.' },
      { t: '`j > 3 * n + 1`', why: 'The comparison only flips for a negative multiplier.' },
      { t: 'Nothing: a loop’s test can never change', why: 'Rewriting the test is exactly what induction variable elimination does.' },
    ],
  },
  {
    q: 'Once the test uses `j`, how does `i` actually disappear?',
    options: [
      { t: 'Dead code elimination deletes its phi and its `+ 1`, since nothing uses them', correct: true, why: 'Induction variable elimination only has to make `i` unused; DCE does the deleting.' },
      { t: 'Strength reduction deletes it', why: 'Strength reduction adds a new variable; it does not remove the old one.' },
      { t: 'LICM hoists it out of the loop', why: '`i` changes every trip; it is not invariant.' },
    ],
  },
  {
    q: 'With `j = -2 * i + 10`, a compiler rewrites `i < n` as `j < -2 * n + 10`. What is wrong?',
    options: [
      { t: 'Nothing', why: 'Multiplying an inequality by a negative number reverses it.' },
      { t: 'The bound should be computed inside the loop', why: 'The bound is invariant; the preheader is the right place.' },
      { t: 'It should be `j > -2 * n + 10`: the multiplier is negative, so the comparison flips', correct: true, why: 'As `i` grows, `j` shrinks, so “not yet at the end” means `j` is still above the bound.' },
      { t: 'It should be `j <= -2 * n + 10`', why: 'Only the direction changes, and it becomes `>`, not `<=`.' },
    ],
  },
];
