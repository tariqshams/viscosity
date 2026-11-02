// Chapter 316 cards. Keys are stable ids: never rename them.

export const prompts = {
  'nll-lexical': {
    q: 'Under the old lexical rule, how long does the loan in `let r = &v;` last?',
    a: 'Until the end of the block `r` is declared in, whether or not `r` is used again.',
  },
  'nll-what': {
    q: 'Under non-lexical lifetimes, when does a loan end?',
    a: 'After the last point where its reference (or a copy of it) may still be used: where it stops being live.',
  },
  'nll-live': {
    q: 'When is a variable **live** at a point?',
    a: 'When the value it holds at that point may be used later on some path.',
  },
  'nll-branch': {
    q: 'A reference is used only in the `then` branch of an `if`. Is it live in the `else` branch?',
    a: 'No: liveness follows the control-flow graph, so on the `else` path its value is never used, and the loan does not hold there.',
  },
  'ri-region': {
    q: 'In NLL, what is a **region** (a lifetime)?',
    a: 'A set of points in the control-flow graph where a reference must stay valid, and so where its loan is in force.',
  },
  'ri-copy': {
    q: 'What constraint does `let r2 = r;` add, and why?',
    a: '`r`\'s region must include every point of `r2`\'s region reachable from here (`\'r: \'r2`), because `r2` carries the same loan.',
  },
  'ri-fixpoint': {
    q: 'How are the region constraints solved?',
    a: 'Start every region at its live points, then keep applying the constraints, growing the sets, until a full pass changes nothing (a fixpoint).',
  },
  'ri-smallest': {
    q: 'Why does the solver aim for the **smallest** regions that satisfy the constraints?',
    a: 'A smaller region means a loan ends sooner, which rejects fewer correct programs.',
  },
  'ri-pc3': {
    q: 'Which kind of program does rustc\'s NLL still reject, and what project aims to accept it?',
    a: 'Returning a reference out of a function from one branch while the other branch mutates (NLL problem case #3); Polonius.',
  },
};

export const examples = {
  'nll-checker': {
    title: 'Lend with non-lexical lifetimes',
    code: `// Lend with non-lexical lifetimes:
// 1. liveness, 2. regions, 3. check.
function regions(lines) {
  const def = {}, live = {};
  const copies = [];
  lines.forEach((w, i) => {
    const used = w[0] === 'use' ? w[1]
      : w[0] === 'let' ? w[3] : null;
    if (w[0] === 'let') {
      def[w[1]] = i;
      live[w[1]] = new Set();
      if (live[w[3]]) copies.push({
        from: w[3], to: w[1], at: i });
    }
    // a use at i makes x live from
    // its definition up to i
    if (used && live[used])
      for (let q = def[used] + 1;
        q <= i; q++) live[used].add(q);
  });
  let changed = true; // fixpoint
  while (changed) {
    changed = false;
    for (const c of copies)
      for (const q of live[c.to])
        if (q >= c.at &&
          !live[c.from].has(q)) {
          live[c.from].add(q);
          changed = true;
        }
  }
  return live;
}

function check(src) {
  const lines = src.trim().split('\\n')
    .map((l) => l.trim().split(/\\s+/));
  const reg = regions(lines);
  const loans = [], errs = [];
  lines.forEach((w, i) => {
    // loans whose region holds i
    const now = loans.filter(
      (l) => reg[l.by].has(i));
    const bad = (p, acc) => {
      for (const l of now) {
        if (l.of !== p) continue;
        if (acc === 'read' &&
          l.k === 'shr') continue;
        errs.push(\`line \${i + 1}: \` +
          \`\${acc} \${p} meets \` +
          \`\${l.by}'s loan\`);
        return;
      }
    };
    const e = w[3];
    if (w[0] === 'use')
      bad(w[1], 'read');
    else if (w[0] !== 'let')
      bad(w[0], 'assign');
    else if (e === '&mut') {
      bad(w[4], 'mut');
      loans.push({ k: 'mut',
        of: w[4], by: w[1] });
    } else if (e[0] === '&') {
      bad(e.slice(1), 'read');
      loans.push({ k: 'shr',
        of: e.slice(1), by: w[1] });
    }
  });
  return errs.length ? errs : ['ok'];
}

console.log(check(\`
let v = new
let r = &v
use r
let m = &mut v
use m\`));
console.log(check(\`
let x = new
let r = &x
let r2 = r
x = new
use r2\`));`,
  },
};

export const exercises = {
  solve: {
    title: 'Solve the region constraints',
    prompt:
      'Write `solve(live, copies)`. `live` maps each reference name to an array of the program points where it is live, for example `{ r: [2, 3], r2: [4, 5] }`. `copies` is a list of outlives constraints `{ from, to, at }`, one for each `let to = from` at point `at`: the region of `from` must contain every point of the region of `to` that is at or after `at`. Return an object with the same names, each mapped to its final region as an array sorted from smallest to largest. The constraints may be listed in any order, so keep applying them until nothing changes.',
    starter: `function solve(live, copies) {
  // start from live, then grow
  return live;
}`,
    solution: `function solve(live, copies) {
  const r = {};
  for (const x in live)
    r[x] = new Set(live[x]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const c of copies)
      for (const q of r[c.to])
        if (q >= c.at &&
          !r[c.from].has(q)) {
          r[c.from].add(q);
          changed = true;
        }
  }
  const out = {};
  for (const x in r)
    out[x] = [...r[x]]
      .sort((a, b) => a - b);
  return out;
}`,
    tests: `test('a single copy', () => {
  expect(solve({ r: [2, 3], r2: [4, 5] },
    [{ from: 'r', to: 'r2', at: 3 }]))
    .toEqual({ r: [2, 3, 4, 5], r2: [4, 5] });
});
test('only points at or after the copy', () => {
  expect(solve({ r: [5], r2: [1, 6] },
    [{ from: 'r', to: 'r2', at: 5 }]))
    .toEqual({ r: [5, 6], r2: [1, 6] });
});
test('a chain needs more than one pass', () => {
  const out = solve(
    { a: [3], b: [4], c: [5, 6] },
    [{ from: 'a', to: 'b', at: 3 },
     { from: 'b', to: 'c', at: 4 }]);
  expect(out.a).toEqual([3, 4, 5, 6]);
  expect(out.b).toEqual([4, 5, 6]);
  expect(out.c).toEqual([5, 6]);
});
test('no copies: regions are the live points', () => {
  expect(solve({ r: [4, 2] }, []))
    .toEqual({ r: [2, 4] });
});`,
    hints: [
      'Turn every array in `live` into a `Set`, so adding a point twice is harmless and you can ask `has` quickly. These sets only ever grow.',
      'For one constraint, look at every point `q` in the region of `to`; if `q >= at` and the region of `from` lacks it, add it. One pass over all constraints is not enough when one region feeds another.',
      'Wrap the pass in `let changed = true; while (changed) { changed = false; ... }` and set `changed = true` whenever you add a point. At the end, turn each set back into an array with `[...set].sort((a, b) => a - b)`.',
    ],
    walkthrough: `**How to think about it.** Each constraint says "this set must contain those points", and the only way to satisfy it is to add points; adding never makes an earlier constraint false again, but it can make one that was already satisfied unsatisfied, because the set it copies from has grown. That is the shape of every fixpoint you met in chapter 196: start small, apply the rules, repeat until a whole pass changes nothing. Because the sets only grow and there are finitely many points, the loop must stop, and where it stops is the smallest answer that satisfies every constraint.

**The solution, line by line.**

- \`function solve(live, copies) {\` takes the live points and the constraints.
- \`const r = {};\` and the \`for (const x in live) r[x] = new Set(live[x]);\` loop copy each array into a fresh \`Set\`; the input is left alone, and the starting region of each reference is exactly where it is live.
- \`let changed = true;\` primes the loop, and \`while (changed) {\` repeats passes; \`changed = false;\` at the top of each pass assumes this pass will find nothing.
- \`for (const c of copies)\` visits each constraint \`from: to @ at\`.
- \`for (const q of r[c.to])\` walks the points of the target's region.
- \`if (q >= c.at && !r[c.from].has(q)) {\` keeps only points at or after the copy (before the copy, \`to\` did not hold this loan yet) that are missing from \`from\`.
- \`r[c.from].add(q); changed = true;\` grows the region and records that this pass did something, so another pass will run.
- After the loop, \`out[x] = [...r[x]].sort((a, b) => a - b);\` turns each set into a sorted array; the comparison function matters, because the default \`sort\` compares as text.
- \`return out;\` gives the solution.

**Common wrong attempts.**

- One pass with no \`while\`: with the constraints listed as \`a: b\` then \`b: c\`, \`a\` is processed before \`b\` has grown, so \`a\` misses 5 and 6, and an assignment at 5 would be wrongly allowed. That is a soundness bug, the worst kind for a checker.
- Forgetting \`q >= c.at\`: \`r\` then picks up points of \`r2\` from before the copy, so loans last longer than they should and correct programs are rejected.
- Calling \`.sort()\` with no comparison: \`[10, 9]\` stays \`[10, 9]\` because "10" comes before "9" as text.`,
    wrong: [
      {
        code: `function solve(live, copies) {
  const r = {};
  for (const x in live)
    r[x] = new Set(live[x]);
  for (const c of copies)
    for (const q of r[c.to])
      if (q >= c.at) r[c.from].add(q);
  const out = {};
  for (const x in r)
    out[x] = [...r[x]]
      .sort((a, b) => a - b);
  return out;
}`,
        why: 'Only one pass: in the chain a: b, b: c, `a` is updated before `b` grows, so `a` misses points 5 and 6.',
      },
      {
        code: `function solve(live, copies) {
  const r = {};
  for (const x in live)
    r[x] = new Set(live[x]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const c of copies)
      for (const q of r[c.to])
        if (!r[c.from].has(q)) {
          r[c.from].add(q);
          changed = true;
        }
  }
  const out = {};
  for (const x in r)
    out[x] = [...r[x]]
      .sort((a, b) => a - b);
  return out;
}`,
        why: 'It ignores `at`, so points from before the copy leak into `from` (point 1 in the second test), making loans longer than needed.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Which program does rustc accept today, but the old lexical borrow checker rejected?\n```\nA: let r = &v; use(r); v.push(1);\nB: let r = &v; v.push(1); use(r);\n```',
    options: [
      { t: 'A', correct: true, why: '`r` is last used before the push, so under NLL its loan has ended; lexically it lasted to the end of the block.' },
      { t: 'B', why: '`r` is used after the push, so its loan is live there under any rule: E0502.' },
      { t: 'Both', why: 'B is wrong under every rule: the push could move the elements `r` points to.' },
    ],
  },
  {
    q: 'In `let p = &a; if c { use(p); p = &b; } use(p);`, is the loan of `a` in force on the line right after `use(p)` inside the `if`?',
    options: [
      { t: 'Yes, because `p` is used again at the end', why: 'The value used at the end is the new one, `&b`; the old value is never read again on this path.' },
      { t: 'No: on that path `p` is dead until it is reassigned, so the loan of `a` is not in force there', correct: true, why: 'This is the NLL RFC\'s own example: liveness is about the value a variable holds, not the variable\'s name.' },
      { t: 'Only if `c` is true at run time', why: 'The checker never runs the program; it reasons about the path.' },
    ],
  },
  {
    q: 'Why does `let r2 = r;` make `r`\'s region grow?',
    options: [
      { t: 'Because `r2` is a copy of `r`\'s loan, so the loan must hold wherever `r2` is live (from this point on)', correct: true, why: 'Hence the outlives constraint `\'r: \'r2` at the copy.' },
      { t: 'Because `r` is used on that line', why: 'That adds one point by liveness; the constraint adds all of `r2`\'s later points.' },
      { t: 'It does not; regions only come from liveness', why: 'Then `x = new` before a use of `r2` would wrongly be allowed.' },
    ],
  },
  {
    q: 'Why is a single pass over the constraints not enough?',
    options: [
      { t: 'Because the constraints are not sorted by line', why: 'Sorting helps straight-line code, but loops in the control-flow graph mean no order works in general.' },
      { t: 'Because a set can grow after a constraint that copies from it was already applied', correct: true, why: 'So the solver repeats until a pass changes nothing, the fixpoint.' },
      { t: 'Because points can be removed', why: 'Sets only grow; that is why the loop ends.' },
    ],
  },
  {
    q: 'rustc 1.97 rejects `get_default`, which returns `map.get_mut(&k)`\'s result from one branch and inserts in the other. What is the status?',
    options: [
      { t: 'It is a bug in the program', why: 'The program is memory-safe; the checker is too strict here.' },
      { t: 'NLL problem case #3, deferred from NLL and the motivating example for Polonius', correct: true, why: 'The Polonius update post names it as the motivating example.' },
      { t: 'It compiles with `--edition 2024`', why: 'Editions do not change this; it still fails in rustc 1.97.' },
    ],
  },
];
