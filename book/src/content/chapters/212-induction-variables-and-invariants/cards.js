// Chapter 211-b cards (split from chapter 211). Keys are stable ids.

export const prompts = {
  'iv-what': {
    q: 'What is an induction variable?',
    a: 'A value that changes by a fixed step on every trip around a loop, like `i` in `i++`.',
  },
  'derived-iv': {
    q: 'In a loop over `i` (step 1), `j = 3 * i + 2`. By how much does `j` change each trip?',
    a: 'By 3: a derived induction variable `c·i + d` steps by `c` times `i`’s step.',
  },
  'trip-count': {
    q: 'When can Viscosity tell how many times a loop runs?',
    a: 'When the header tests a counting phi that starts at 0 against a constant bound, with `<` or `<=`.',
  },
  'bounds-dominate': {
    q: 'Why must the header test’s “true” successor dominate the access `ps[i]`?',
    a: 'Then every path to the access goes through the test passing, so `i < ps.length` holds when the access runs.',
  },
  'and-guard': {
    q: 'Can Viscosity prove `ps[i]` in bounds when the header tests `i < ps.length && go`?',
    a: 'Yes. It splits the condition into its `&&` parts, and one part is `i < ps.length`.',
  },
  'invariant-what': {
    q: 'When is an instruction loop-invariant?',
    a: 'When it is pure and every operand is defined outside the loop or is itself loop-invariant.',
  },
  'phi-not-invariant': {
    q: 'Why is a phi in the loop header never loop-invariant?',
    a: 'One of its inputs comes round from the latch, so it takes a new value on each trip by design.',
  },
  'length-not-invariant': {
    q: 'In a loop that calls `g.push(...)`, is `g.length` loop-invariant?',
    a: 'No. `g` does not change, but the memory that `g.length` reads does.',
  },
};

export const examples = {};

export const exercises = {
  basicIvs: {
    title: 'Find the basic induction variables',
    prompt:
      '`loop` lists a loop’s instructions `{ id, op, args }`. Each argument is either an instruction id (a string) or a number. A header phi has `args: [start, next]`, where `next` is the value coming round from the latch. Write `basicIvs(loop)` returning an object mapping each phi that is a **basic induction variable** to its step: `next` must be an instruction `phi + n`, `n + phi` or `phi - n`, where `n` is a number. A `-` gives a negative step.',
    starter: `function basicIvs(loop) {
  // your code here
  return {};
}

const I = (id, op, ...args) =>
  ({ id, op, args });
console.log(basicIvs([
  I('i', 'phi', 'z', 'i2'),
  I('t', '*', 'i', 2),
  I('i2', '+', 'i', 1),
]));
// { i: 1 }`,
    solution: `function basicIvs(loop) {
  const byId = {};
  for (const x of loop) byId[x.id] = x;
  const out = {};
  for (const p of loop) {
    if (p.op !== 'phi') continue;
    const n = byId[p.args[1]];
    if (!n) continue;
    const [a, b] = n.args;
    const num = (v) =>
      typeof v === 'number';
    const me = p.id;
    const plus = n.op === '+';
    const minus = n.op === '-';
    if (plus && a === me && num(b))
      out[me] = b;
    if (plus && b === me && num(a))
      out[me] = a;
    if (minus && a === me && num(b))
      out[me] = -b;
  }
  return out;
}`,
    tests: `const I = (id, op, ...args) => ({ id, op, args });
test('the everyday counter', () => {
  expect(basicIvs([I('i', 'phi', 'z', 'i2'), I('t', '*', 'i', 2), I('i2', '+', 'i', 1)])).toEqual({ i: 1 });
});
test('the step can come first: 4 + i', () => {
  expect(basicIvs([I('i', 'phi', 'z', 'n'), I('n', '+', 4, 'i')])).toEqual({ i: 4 });
});
test('counting down gives a negative step', () => {
  expect(basicIvs([I('k', 'phi', 'top', 'k2'), I('k2', '-', 'k', 2)])).toEqual({ k: -2 });
});
test('10 - k is not a step of k', () => {
  expect(basicIvs([I('k', 'phi', 'top', 'k2'), I('k2', '-', 10, 'k')])).toEqual({});
});
test('doubling is not a fixed step', () => {
  expect(basicIvs([I('p', 'phi', 'one', 'p2'), I('p2', '*', 'p', 2)])).toEqual({});
});
test('a running sum adds a varying value', () => {
  const loop = [I('i', 'phi', 'z', 'i2'), I('s', 'phi', 'z', 's2'), I('v', 'load', 'a', 'i'), I('s2', '+', 's', 'v'), I('i2', '+', 'i', 1)];
  expect(basicIvs(loop)).toEqual({ i: 1 });
});
test('two counters in one loop', () => {
  const loop = [I('i', 'phi', 'z', 'i2'), I('j', 'phi', 'w', 'j2'), I('i2', '+', 'i', 1), I('j2', '+', 'j', 8)];
  expect(basicIvs(loop)).toEqual({ i: 1, j: 8 });
});`,
    hints: [
      'For each phi, look up the instruction its second argument names: that is what comes round from the latch.',
      'Make a lookup table from id to instruction first, so you can find `next` quickly.',
      'Check three shapes: `+` with the phi first and a number second, `+` the other way round, and `-` with the phi first. Use `typeof v === \'number\'` to spot a number.',
    ],
    walkthrough: `**How to think about it.** The definition says a basic induction variable is a phi whose value from the latch is "itself plus a fixed step". So for every phi you only need to look at one other instruction, the one named by its second argument, and ask whether it has that shape. The shapes to accept are \`phi + n\` and \`n + phi\` (addition does not care about order) and \`phi - n\` (a step of \`-n\`). Subtraction does care about order: \`10 - k\` flips \`k\` round every trip, it does not step it. And the step must be a number literal, which rules out a running sum like \`s + v\`, where \`v\` changes each trip.

**The solution, line by line.**

- \`const byId = {};\` and \`for (const x of loop) byId[x.id] = x;\` build a table from id to instruction, so finding \`next\` is one lookup.
- \`const out = {};\` will hold the answer.
- \`for (const p of loop) {\` and \`if (p.op !== 'phi') continue;\` look only at phis.
- \`const n = byId[p.args[1]];\` fetches the instruction that comes round from the latch; \`if (!n) continue;\` skips a phi whose second argument is not an instruction in the loop.
- \`const [a, b] = n.args;\` names its two operands.
- \`const num = (v) => typeof v === 'number';\` (split over two lines) is a small helper for "is this a number literal?", and \`const me = p.id;\` is a short name for the phi.
- \`const plus = n.op === '+';\` and \`const minus = n.op === '-';\` name the two operators we accept.
- \`if (plus && a === me && num(b))\` with \`out[me] = b;\` accepts \`phi + n\` with step \`n\`, and the next \`if\` accepts \`n + phi\` with step \`a\`.
- \`if (minus && a === me && num(b))\` with \`out[me] = -b;\` accepts \`phi - n\` and records a negative step; \`n - phi\` fails the \`a === me\` test.
- \`return out;\` hands back the map.

**Common wrong attempts.**

- Treating every phi as an induction variable: the running sum \`s\` is a phi too, but what it adds changes every trip.
- Accepting \`-\` in either order, or forgetting to negate: \`k - 2\` steps by -2, while \`10 - k\` is not an induction variable at all.
- Accepting any \`+\`: \`s + v\` adds a value loaded from memory, not a fixed step.`,
    wrong: [
      {
        code: `function basicIvs(loop) {
  const byId = {};
  for (const x of loop) byId[x.id] = x;
  const out = {};
  for (const p of loop) {
    if (p.op !== 'phi') continue;
    const n = byId[p.args[1]];
    if (n && n.op === '+') {
      out[p.id] = n.args[1];
    }
  }
  return out;
}`,
        why: 'Accepts any `+`, so the running sum `s = s + v` comes out with “step” `v`; it also misses `4 + i` and every `-`.',
      },
      {
        code: `function basicIvs(loop) {
  const byId = {};
  for (const x of loop) byId[x.id] = x;
  const out = {};
  for (const p of loop) {
    if (p.op !== 'phi') continue;
    const n = byId[p.args[1]];
    if (!n) continue;
    const [a, b] = n.args;
    const k = typeof a === 'number'
      ? a : b;
    if (typeof k !== 'number') continue;
    if (a === p.id || b === p.id)
      out[p.id] = k;
  }
  return out;
}`,
        why: 'Ignores the operator: `k - 2` becomes a step of +2, `10 - k` is accepted, and `p * 2` is called a step of 2.',
      },
    ],
  },
  invariants: {
    optional: true,
    title: 'Find the loop-invariant instructions',
    prompt:
      '`loop` is a list of instructions `{ id, op, args }` inside a loop; `outside` lists ids defined before the loop. An instruction is invariant if its op is in `PURE` and every operand is defined outside or is invariant. Return the invariant ids in `loop` order. Note: an instruction may be listed before one it depends on.',
    starter: `const PURE = ['const', '+', '-', '*'];

function invariants(loop, outside) {
  // your code here
  return [];
}

const I = (id, op, ...args) =>
  ({ id, op, args });
const loop = [
  I('i', 'phi', 'z', 'j'),
  I('k', 'const'),
  I('m', '*', 'n', 'k'),
  I('j', '+', 'i', 'k'),
];
const out = ['n', 'z'];
console.log(invariants(loop, out));
// ['k', 'm']`,
    solution: `const PURE = ['const', '+', '-', '*'];

function invariants(loop, outside) {
  const inv = new Set(outside);
  let changed = true;
  while (changed) {
    changed = false;
    for (const i of loop) {
      if (inv.has(i.id)) continue;
      const ok = PURE.includes(i.op) &&
        i.args.every((a) => inv.has(a));
      if (ok) {
        inv.add(i.id);
        changed = true;
      }
    }
  }
  return loop
    .filter((i) => inv.has(i.id))
    .map((i) => i.id);
}`,
    tests: `const I = (id, op, ...args) => ({ id, op, args });
test('constants and values built from outside are invariant', () => {
  const loop = [I('i', 'phi', 'z', 'j'), I('k', 'const'), I('m', '*', 'n', 'k'), I('j', '+', 'i', 'k')];
  expect(invariants(loop, ['n', 'z'])).toEqual(['k', 'm']);
});
test('order in the list does not matter', () => {
  const loop = [I('b', '*', 'a', 'a'), I('a', '+', 'n', 'n')];
  expect(invariants(loop, ['n'])).toEqual(['b', 'a']);
});
test('a phi is never invariant', () => {
  expect(invariants([I('p', 'phi', 'n', 'n')], ['n'])).toEqual([]);
});
test('memory reads are not assumed invariant', () => {
  const loop = [I('v', 'load', 'g', 'i0'), I('w', '+', 'v', 'v')];
  expect(invariants(loop, ['g', 'i0'])).toEqual([]);
});`,
    hints: [
      'Keep a `Set` of ids known invariant, starting with everything defined outside.',
      'Sweep over the loop, adding any pure instruction whose operands are all in the set.',
      'One sweep may not be enough when an instruction comes before one it depends on. Repeat until a sweep adds nothing: a fixpoint.',
    ],
    walkthrough: `**How to think about it.** The rule "invariant if every operand is defined outside the loop or is itself invariant" refers to itself, so you cannot decide each instruction once, in the order given: an instruction may be listed before the one it depends on. The way out is the one from chapter 195. Keep a set of ids known to be invariant, seeded with everything defined outside the loop (those are invariant by definition), sweep over the loop adding any pure instruction whose operands are all in the set, and repeat the sweep until one adds nothing: a fixpoint. Each sweep can only add ids, and there are only so many, so it must stop.

**The solution, line by line.**

- \`const inv = new Set(outside);\` seeds the set with the values from before the loop.
- \`let changed = true;\` and \`while (changed) {\` repeat sweeps until one changes nothing; \`changed = false;\` resets the flag at the start of each sweep.
- \`for (const i of loop) {\` visits every instruction, and \`if (inv.has(i.id)) continue;\` skips ones already known.
- \`const ok = PURE.includes(i.op) &&\` and \`i.args.every((a) => inv.has(a));\` ask both questions: is the operation pure, and are all its operands invariant? (\`every\` on an empty list is \`true\`, so a constant passes.)
- \`if (ok) {\`, \`inv.add(i.id);\` and \`changed = true;\` record a new invariant and ask for another sweep.
- After the loop, \`return loop.filter((i) => inv.has(i.id)).map((i) => i.id);\` keeps the loop's own invariant ids, in the order they were listed (the outside ids are not part of the answer).

Two operations are deliberately missing from \`PURE\`. A **phi** merges the value from the latch, so it changes by design: it is the induction variable. A **load** reads memory that a store inside the loop might change, and deciding that needs alias analysis.

**Common wrong attempts.**

- One sweep only: \`b = a * a\` listed before \`a = n + n\` is missed, because when the sweep reaches \`b\`, \`a\` is not known yet.
- Letting phis or loads in: the tests check that both stay out.`,
    wrong: [
      {
        code: `const PURE = ['const', '+', '-', '*'];

function invariants(loop, outside) {
  const inv = new Set(outside);
  for (const i of loop) {
    const ok = PURE.includes(i.op) &&
      i.args.every((a) => inv.has(a));
    if (ok) inv.add(i.id);
  }
  return loop
    .filter((i) => inv.has(i.id))
    .map((i) => i.id);
}`,
        why: 'A single sweep misses `b = a * a` when `b` is listed before `a`: at that moment `a` isn’t known to be invariant yet. Repeat until nothing changes.',
      },
    ],
  },
};


export const quiz = [
  {
    q: 'In SSA, which instruction is the basic induction variable of `for (let i = 0; i < n; i++)`?',
    options: [
      { t: 'The comparison `i < n` in the header', why: 'That is the loop’s test; it uses the induction variable.' },
      { t: 'The phi in the header that takes `0` from before the loop and `i + 1` from the latch', correct: true, why: 'A start from outside and `phi + step` from inside is the shape of a basic induction variable.' },
      { t: 'The constant `1`', why: 'That is the step, which is loop-invariant, not the variable.' },
    ],
  },
  {
    q: 'Inside the `x` loop of a grid walk, `i = y * W + x`, where `y` and `W` do not change in that loop. What is `i`?',
    options: [
      { t: 'A derived induction variable of `x`, with step 1', correct: true, why: 'It is `1·x + (y·W)`, a constant multiple of `x` plus an invariant, so it steps with `x`.' },
      { t: 'Loop-invariant', why: '`x` changes every trip, so `i` does too.' },
      { t: 'Not an induction variable, because it uses a multiply', why: 'The multiply is of two invariants; `x` itself is only added.' },
      { t: 'A basic induction variable', why: 'Basic ones are header phis; `i` is computed from the phi `x`.' },
    ],
  },
  {
    q: 'Which header test lets Viscosity prove `ps[i]` in bounds inside a `for (let i = 0; ...; i++)` loop?',
    options: [
      { t: '`i <= ps.length`', why: '`i` can equal `ps.length`, one past the end.' },
      { t: '`i < n`, where `const n = 1000`', why: 'The bound must be the length of the same collection; `n` might not match it.' },
      { t: '`ps.length > i - 1`', why: 'The proof looks for the pattern `i < ps.length` with the counting phi on the left.' },
      { t: '`i < ps.length && i < 64`', correct: true, why: 'The condition is split at `&&`, and one part is `i < ps.length`.' },
    ],
  },
  {
    q: 'Why does `for (let i = 0; i < ps.length; i += 2)` leave its accesses checked?',
    options: [
      { t: 'Because stepping by 2 can skip past the end', why: 'Not really: the test `i < ps.length` still runs before each access. Viscosity only recognises counting phis that step by exactly 1.' },
      { t: 'Because `+=` is not allowed in loops Viscosity transforms', why: 'The collection is still transformed (struct of arrays); only the bounds proof fails.' },
      { t: 'Because `isCountingPhi` requires a step of exactly `+1`, so `i` is not recognised', correct: true, why: 'The proof is deliberately narrow. Anything it does not recognise gets a check, which is always safe.' },
    ],
  },
  {
    q: 'A loop body contains `t = n * 2` (with `n` defined before the loop) and `g.push(t)`. Which is loop-invariant?',
    options: [
      { t: '`t = n * 2`', correct: true, why: 'Its only operands come from outside the loop and multiplying numbers has no effects, so it is the same every trip.' },
      { t: '`g.length`, because `g` never changes', why: 'The array object stays the same, but its length grows every trip.' },
      { t: 'Both', why: '`g.push` changes `g` each time; it is a write, not an invariant value.' },
      { t: 'Neither: nothing in a loop is invariant', why: '`n * 2` is the same every time.' },
    ],
  },
  {
    q: 'Why is finding invariant instructions done with repeated sweeps rather than one pass?',
    options: [
      { t: 'Because instructions can change between sweeps', why: 'The instructions stay the same; only what we know about them grows.' },
      { t: 'Because the rule refers to itself, and an instruction can be listed before an operand that is only later found invariant', correct: true, why: 'Sweeping until nothing changes reaches the fixpoint whatever the order.' },
      { t: 'Because phis have to be visited twice', why: 'Phis in the header are never invariant, however often you visit them.' },
    ],
  },
];
