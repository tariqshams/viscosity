// Chapter 245 cards (the second half of chapter 244): recall prompts,
// examples, exercises and quiz. Keys are stable ids.

export const prompts = {
  'interval-what': {
    q: 'What is a **live interval**?',
    a: 'A live range flattened to one span [start, end] over a fixed numbering of the instructions: the first and last points where the value is live.',
  },
  'interval-loses': {
    q: 'What precision does a live interval give up?',
    a: 'The gaps in a live range: two values whose ranges never meet can still have overlapping intervals, and then cannot share a register.',
  },
  'loop-stretch': {
    q: 'In sumsq, n is read only at line 4. Why does its interval run to line 8?',
    a: 'Line 8 jumps back to line 4, so n is still needed there: it is live to the end of the loop.',
  },
  'scan-order': {
    q: 'In what order does linear scan visit the intervals, and how does it keep the active list?',
    a: 'In order of start point; the active list (intervals holding a register) is kept sorted by end point.',
  },
  'scan-expire': {
    q: 'What does linear scan do first, at each new interval?',
    a: 'It expires the active intervals that ended before the new one starts, giving their registers back.',
  },
  'scan-spill-rule': {
    q: 'When no register is free, which interval does linear scan spill?',
    a: 'Whichever ends last: the new interval, or the active interval with the latest end.',
  },
  'scan-vs-colour': {
    q: 'With three registers, colouring spilled n in sumsq but linear scan spilled s. Why the difference?',
    a: 'Colouring weighs spill costs (n costs one load per trip); linear scan looks only at end points, and s ends last, though it costs a load and a store per trip.',
  },
  'greedy-order': {
    q: 'In what order does LLVM’s greedy allocator try things for a live range?',
    a: 'A free register; evicting a less worthy range; splitting the range (from its second visit); and finally spilling it.',
  },
};

export const examples = {
  scan: {
    title: 'Linear scan on sumsq',
    code: `// ivs: [{ v, start, end }]. regs: the
// register names. Returns { v: reg },
// with 'spill' for spilled values.
function linearScan(ivs, regs) {
  const where = {};
  const free = [...regs];
  const byEnd = (a, b) => a.end - b.end;
  let active = [];
  const order = [...ivs].sort(
    (a, b) => a.start - b.start);
  for (const iv of order) {
    // Expire intervals that have ended.
    for (const a of active) {
      if (a.end < iv.start) {
        free.push(where[a.v]);
      }
    }
    active = active.filter(
      (a) => a.end >= iv.start);
    const rank = (r) => regs.indexOf(r);
    free.sort((x, y) =>
      rank(x) - rank(y));
    if (free.length > 0) {
      where[iv.v] = free.shift();
      active.push(iv);
    } else {
      // Spill whichever ends last.
      const last = active.at(-1);
      if (last.end > iv.end) {
        where[iv.v] = where[last.v];
        where[last.v] = 'spill';
        active.pop();
        active.push(iv);
      } else {
        where[iv.v] = 'spill';
      }
    }
    active.sort(byEnd);
  }
  return where;
}

const sumsq = [
  { v: 'n', start: 1, end: 8 },
  { v: 's', start: 2, end: 9 },
  { v: 'i', start: 3, end: 8 },
  { v: 't', start: 5, end: 6 },
];
console.log(linearScan(sumsq,
  ['a1', 'a2', 'a3', 'a4']));
console.log(linearScan(sumsq,
  ['a1', 'a2', 'a3']));`,
  },
};

export const exercises = {
  scan: {
    title: 'Linear scan, with expiry and the spill rule',
    prompt:
      'Finish `linearScan(ivs, regs)`. `ivs` is an array of intervals `{ v, start, end }` (both ends included) and `regs` the register names, in order of preference. Return an object giving each `v` a register or `\'spill\'`. The starter sorts the intervals by start, takes a free register when there is one (the lowest in `regs` order), and keeps `active` sorted by end. Add the two missing parts: **expire** the active intervals with `end < iv.start`, returning their registers to `free`; and when no register is free, **spill whichever ends last**: if the last active interval ends after `iv`, give its register to `iv` and spill it (and swap it for `iv` in `active`); otherwise spill `iv`.',
    starter: `// ivs: [{ v, start, end }]. regs: the
// register names. Returns { v: reg },
// with 'spill' for spilled values.
function linearScan(ivs, regs) {
  const where = {};
  const free = [...regs];
  const byEnd = (a, b) => a.end - b.end;
  let active = [];
  const order = [...ivs].sort(
    (a, b) => a.start - b.start);
  for (const iv of order) {
    // TODO: expire intervals that ended
    // before iv starts, freeing their
    // registers.
    const rank = (r) => regs.indexOf(r);
    free.sort((x, y) =>
      rank(x) - rank(y));
    if (free.length > 0) {
      where[iv.v] = free.shift();
      active.push(iv);
    } else {
      // TODO: spill the one that ends
      // last: iv, or the last active.
      where[iv.v] = 'spill';
    }
    active.sort(byEnd);
  }
  return where;
}`,
    solution: `// ivs: [{ v, start, end }]. regs: the
// register names. Returns { v: reg },
// with 'spill' for spilled values.
function linearScan(ivs, regs) {
  const where = {};
  const free = [...regs];
  const byEnd = (a, b) => a.end - b.end;
  let active = [];
  const order = [...ivs].sort(
    (a, b) => a.start - b.start);
  for (const iv of order) {
    // Expire intervals that have ended.
    for (const a of active) {
      if (a.end < iv.start) {
        free.push(where[a.v]);
      }
    }
    active = active.filter(
      (a) => a.end >= iv.start);
    const rank = (r) => regs.indexOf(r);
    free.sort((x, y) =>
      rank(x) - rank(y));
    if (free.length > 0) {
      where[iv.v] = free.shift();
      active.push(iv);
    } else {
      // Spill whichever ends last.
      const last = active.at(-1);
      if (last.end > iv.end) {
        where[iv.v] = where[last.v];
        where[last.v] = 'spill';
        active.pop();
        active.push(iv);
      } else {
        where[iv.v] = 'spill';
      }
    }
    active.sort(byEnd);
  }
  return where;
}`,
    tests: `const sumsq = [
  { v: 'n', start: 1, end: 8 },
  { v: 's', start: 2, end: 9 },
  { v: 'i', start: 3, end: 8 },
  { v: 't', start: 5, end: 6 },
];
function valid(ivs, w) {
  for (const a of ivs) {
    for (const b of ivs) {
      if (a === b || w[a.v] === 'spill') {
        continue;
      }
      const meet = a.start <= b.end &&
        b.start <= a.end;
      if (meet) {
        expect(w[a.v] !== w[b.v]).toBe(true);
      }
    }
  }
}
test('sumsq fits in four registers', () => {
  const w = linearScan(sumsq,
    ['a1', 'a2', 'a3', 'a4']);
  expect(w).toEqual({ n: 'a1', s: 'a2',
    i: 'a3', t: 'a4' });
});
test('with three, s (ends last) is spilled', () => {
  const w = linearScan(sumsq,
    ['a1', 'a2', 'a3']);
  expect(w.s).toBe('spill');
  expect(w.t).toBe('a2');
  valid(sumsq, w);
});
test('ended intervals give their register back', () => {
  const ivs = [
    { v: 'a', start: 0, end: 1 },
    { v: 'b', start: 2, end: 3 },
    { v: 'c', start: 4, end: 5 },
  ];
  expect(linearScan(ivs, ['r1']))
    .toEqual({ a: 'r1', b: 'r1', c: 'r1' });
});
test('touching at one point is overlapping', () => {
  const ivs = [
    { v: 'a', start: 0, end: 4 },
    { v: 'b', start: 4, end: 6 },
  ];
  expect(linearScan(ivs, ['r1']).b)
    .toBe('spill');
});
test('the new interval is spilled if it ends last', () => {
  const ivs = [
    { v: 'a', start: 0, end: 3 },
    { v: 'b', start: 1, end: 9 },
  ];
  expect(linearScan(ivs, ['r1']))
    .toEqual({ a: 'r1', b: 'spill' });
});
test('a long interval makes way for a short one', () => {
  const ivs = [
    { v: 'a', start: 0, end: 10 },
    { v: 'b', start: 1, end: 2 },
    { v: 'c', start: 3, end: 20 },
  ];
  expect(linearScan(ivs, ['r1'])).toEqual(
    { a: 'spill', b: 'r1', c: 'r1' });
});`,
    hints: [
      'Expiry comes first, before looking for a free register. An interval has ended if its `end` is smaller than the new interval’s `start`; touching at one point (`end === start`) still counts as overlapping.',
      'To expire: push `where[a.v]` onto `free` for each active `a` with `a.end < iv.start`, then keep only the others: `active = active.filter((a) => a.end >= iv.start)`.',
      'For the spill rule: `const last = active.at(-1);` (active is sorted by end). If `last.end > iv.end`, then `where[iv.v] = where[last.v]; where[last.v] = \'spill\'; active.pop(); active.push(iv);`, else `where[iv.v] = \'spill\'`.',
    ],
    walkthrough: `**How to think about it.** Linear scan is a single loop over the intervals in start order, and at each one it does three things: tidy up (expire what has finished), then either take a free register, or make a choice about who loses out. The tidy-up is what lets one register be used by many short values in turn; the choice is the car-park rule, which frees the register that would otherwise stay busy longest. Both depend on \`active\` being sorted by end point, so the interval that ends last is always at the end of the list.

**The solution, line by line** (the two missing parts).

- \`for (const a of active) { if (a.end < iv.start) { free.push(where[a.v]); } }\` returns the register of every active interval that is over before \`iv\` begins. The comparison is strict: an interval ending at 4 is still live at 4, so it overlaps one that starts at 4.
- \`active = active.filter((a) => a.end >= iv.start);\` removes those intervals from the active list.
- (The starter's next lines sort \`free\` back into \`regs\` order and give \`iv\` the lowest free register if there is one.)
- \`const last = active.at(-1);\` is the active interval that ends last; \`at(-1)\` reads the final element.
- \`if (last.end > iv.end) {\` asks whether \`last\` would hold its register longer than \`iv\` would.
- \`where[iv.v] = where[last.v];\` hands \`last\`'s register to \`iv\`.
- \`where[last.v] = 'spill';\` and \`last\` goes to memory (with the spill code of the previous chapter).
- \`active.pop(); active.push(iv);\` swaps them in the active list; the sort at the end of the loop puts \`iv\` in its place.
- \`} else { where[iv.v] = 'spill'; }\` otherwise \`iv\` itself ends last, so it is the one spilled.

On \`sumsq\` with three registers: \`n\`, \`s\` and \`i\` take \`a1\`, \`a2\` and \`a3\`; at \`t\` (5 to 6) nothing has expired and nothing is free, the last active is \`s\` (ends 9), which ends after \`t\`, so \`s\` is spilled and \`t\` gets \`a2\`. In "a long interval makes way for a short one", \`a\` (0 to 10) is spilled for \`b\` (1 to 2), and then \`c\` (3 to 20) finds \`b\` expired and takes the register.

**Common wrong attempts.**

- Expiring intervals whose end *equals* the new start: they are still live at that point, so two values would share a register at the same instant; the "touching" test catches it.
- Comparing with the *first* active interval (the one that ends soonest) instead of the last: that spills a value that was about to free its register anyway, and keeps the one that will stay longest.`,
    wrong: [
      {
        code: `// ivs: [{ v, start, end }]. regs: the
// register names. Returns { v: reg },
// with 'spill' for spilled values.
function linearScan(ivs, regs) {
  const where = {};
  const free = [...regs];
  const byEnd = (a, b) => a.end - b.end;
  let active = [];
  const order = [...ivs].sort(
    (a, b) => a.start - b.start);
  for (const iv of order) {
    // Expire intervals that have ended.
    for (const a of active) {
      if (a.end <= iv.start) {
        free.push(where[a.v]);
      }
    }
    active = active.filter(
      (a) => a.end > iv.start);
    const rank = (r) => regs.indexOf(r);
    free.sort((x, y) =>
      rank(x) - rank(y));
    if (free.length > 0) {
      where[iv.v] = free.shift();
      active.push(iv);
    } else {
      // Spill whichever ends last.
      const last = active.at(-1);
      if (last.end > iv.end) {
        where[iv.v] = where[last.v];
        where[last.v] = 'spill';
        active.pop();
        active.push(iv);
      } else {
        where[iv.v] = 'spill';
      }
    }
    active.sort(byEnd);
  }
  return where;
}`,
        why: 'This expires an interval that ends exactly where the new one starts, so two values that are both live at that point share a register.',
      },
      {
        code: `// ivs: [{ v, start, end }]. regs: the
// register names. Returns { v: reg },
// with 'spill' for spilled values.
function linearScan(ivs, regs) {
  const where = {};
  const free = [...regs];
  const byEnd = (a, b) => a.end - b.end;
  let active = [];
  const order = [...ivs].sort(
    (a, b) => a.start - b.start);
  for (const iv of order) {
    // Expire intervals that have ended.
    for (const a of active) {
      if (a.end < iv.start) {
        free.push(where[a.v]);
      }
    }
    active = active.filter(
      (a) => a.end >= iv.start);
    const rank = (r) => regs.indexOf(r);
    free.sort((x, y) =>
      rank(x) - rank(y));
    if (free.length > 0) {
      where[iv.v] = free.shift();
      active.push(iv);
    } else {
      // Spill whichever ends last.
      const last = active[0];
      if (last.end > iv.end) {
        where[iv.v] = where[last.v];
        where[last.v] = 'spill';
        active.pop();
        active.push(iv);
      } else {
        where[iv.v] = 'spill';
      }
    }
    active.sort(byEnd);
  }
  return where;
}`,
        why: 'This compares with the active interval that ends first, not last, so it spills the wrong value.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Do the intervals [2, 5] and [5, 9] overlap?',
    options: [
      { t: 'No, one ends where the other starts', why: 'Both ends are included, so both are live at 5.' },
      { t: 'Yes: 2 ≤ 9 and 5 ≤ 5', correct: true, why: 'Each starts no later than the other ends.' },
      { t: 'Only if they are in a loop', why: 'Overlap is about the numbers alone.' },
    ],
  },
  {
    q: 'One register; intervals a [0, 10] and b [1, 2]. What does linear scan do when b arrives?',
    options: [
      { t: 'Spills b, because a was there first', why: 'Arrival order does not decide; end point does.' },
      { t: 'Gives b a second register', why: 'There is only one.' },
      { t: 'Spills a, which ends later, and gives its register to b', correct: true, why: 'Free the register that would stay busy longest.' },
    ],
  },
  {
    q: 'Why can linear scan be much faster than graph colouring?',
    options: [
      { t: 'It never builds an interference graph: one sorted pass over the intervals is enough', correct: true, why: 'Checking overlap of intervals is two comparisons, and each interval is handled once.' },
      { t: 'It never spills', why: 'It spills whenever registers run out.' },
      { t: 'It uses more registers', why: 'It has the same registers as any other allocator.' },
    ],
  },
  {
    q: 'What is a weakness of plain linear scan compared with colouring?',
    options: [
      { t: 'It cannot handle loops', why: 'Loops just stretch intervals.' },
      { t: 'It produces wrong code', why: 'Its code is correct, only sometimes slower.' },
      { t: 'It chooses spills by end point, not cost, and treats a range with gaps as one solid interval', correct: true, why: 'That is why it spilled s (a load and a store per trip) where colouring spilled n.' },
    ],
  },
  {
    q: 'Which of these is true of real allocators, according to their sources?',
    options: [
      { t: 'LLVM’s default allocator is Chaitin’s graph colouring', why: 'Its default is the greedy allocator, which splits and evicts live ranges from a priority queue.' },
      { t: 'regalloc2, used by Cranelift, began as a port of IonMonkey’s backtracking allocator', correct: true, why: 'Its README says so, and it also ships a fast allocator based on reverse linear scan.' },
      { t: 'V8 builds no live ranges', why: 'TurboFan’s LinearScanAllocator works on live ranges.' },
    ],
  },
];
