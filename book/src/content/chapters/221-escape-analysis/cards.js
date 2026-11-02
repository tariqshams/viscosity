// Chapter 221 cards. Keys are stable ids: never rename them.

export const prompts = {
  'ea-what': {
    q: 'What question does escape analysis answer?',
    a: 'Can a reference to this value leave a region of code (reach code the compiler can’t see or control)?',
  },
  'ea-region': {
    q: '“Escapes” is always relative to what?',
    a: 'A region of code: a function, a loop, or the whole program being analysed. Leaving that region is escaping.',
  },
  'ea-conservative': {
    q: 'When escape analysis can’t tell whether a value escapes, what must it assume, and why?',
    a: 'That it escapes. Wrongly saying “stays inside” would let the compiler break the program; wrongly saying “escapes” only costs speed.',
  },
  'ea-follow': {
    q: 'Why does `ps[i]` add new uses to Viscosity’s worklist?',
    a: 'It produces a new value, the element. If the element escapes, the old layout can be observed through it, so its uses must be checked too.',
  },
  'ea-position': {
    q: '`ps[i].x = 5` and `box.last = ps[i]` are both `field.set`. Why is only the second an escape?',
    a: 'In the first, the element is the object written to. In the second, it is the value being stored, so a reference to it now lives in `box`.',
  },
  'ea-compare': {
    q: 'Nothing is stored in `ps[1] === ps[2]`. Why is it still an escape for Viscosity?',
    a: '`===` asks about object identity, and after the SoA rewrite there are no element objects to compare.',
  },
  'ea-phi': {
    q: 'Why does Viscosity treat a phi that merges an element as an escape?',
    a: 'It doesn’t track values flowing out of a merge, so it can’t see what happens to the merged value. Unknown means “escapes”.',
  },
  'ea-sites': {
    q: 'Name the main escape sites.',
    a: 'Passing to a call, storing into a variable, property, array or another object, and returning. (Viscosity adds comparisons, opaque ops and phis.)',
  },
  'ea-known': {
    q: 'When is passing `ps` to a function not an escape for Viscosity?',
    a: 'When the function is declared once, only called directly, and every call passes `ps`. Then the parameter is followed like `ps` itself.',
  },
  'ea-v8': {
    q: 'Why could V8 remove the objects in `get-objects` but not in `materialize`?',
    a: 'In `get-objects`, after inlining `consume`, the object is only read and dropped. In `materialize` the objects are stored and kept, so they escape.',
  },
};

export const examples = {
  identity: {
    title: 'Why === is an escape site',
    code: `// Array of objects: real objects.
const aos = [{ x: 1 }, { x: 2 }];
const a = aos[0];
console.log(a === aos[0]);

// SoA: rebuilding gives a NEW object.
const soa = { x: [1, 2] };
function get(i) {
  return { x: soa.x[i] };
}
console.log(get(0) === get(0));
// Same data, a different answer. A
// program that compares elements can
// tell the layout changed.`,
  },
};

export const exercises = {
  firstEscape: {
    title: 'Classify the uses',
    prompt:
      'An element called `el` has a def-use list `uses`. Each use is `{ op, args, line }`, where `args` are value names. Write `firstEscape(el, uses)`. A `field.get` or `field.set` whose **first** argument is `el` is safe (it reads or writes the element). Every other use is an escape. Return `op + \' at line \' + line` for the **first** escaping use, or `null` if none escapes.',
    starter: `function firstEscape(el, uses) {
  // your code here
  return null;
}

console.log(firstEscape('e', [
  { op: 'field.get',
    args: ['e'], line: 4 },
  { op: 'call',
    args: ['log', 'e'], line: 6 },
]));`,
    solution: `function firstEscape(el, uses) {
  for (const u of uses) {
    const onEl = u.args[0] === el;
    const field = u.op === 'field.get'
      || u.op === 'field.set';
    if (onEl && field) continue;
    return u.op + ' at line ' + u.line;
  }
  return null;
}`,
    tests: `test('only field accesses: no escape', () => {
  expect(firstEscape('e', [
    { op: 'field.get', args: ['e'], line: 4 },
    { op: 'field.set', args: ['e', 'v'], line: 5 },
  ])).toBe(null);
});
test('a call is an escape', () => {
  expect(firstEscape('e', [
    { op: 'field.get', args: ['e'], line: 4 },
    { op: 'call', args: ['log', 'e'], line: 6 },
  ])).toBe('call at line 6');
});
test('stored as the value of field.set', () => {
  expect(firstEscape('e', [
    { op: 'field.set', args: ['box', 'e'], line: 7 },
  ])).toBe('field.set at line 7');
});
test('reports the first escape', () => {
  expect(firstEscape('e', [
    { op: 'return', args: ['e'], line: 2 },
    { op: 'call', args: ['f', 'e'], line: 3 },
  ])).toBe('return at line 2');
});
test('no uses at all', () => {
  expect(firstEscape('e', [])).toBe(null);
});`,
    hints: [
      'Loop over `uses` in order. For each use, decide “safe” or “escape”.',
      'A use is safe only if its op is `field.get` or `field.set` **and** `u.args[0] === el`.',
      'Return the message as soon as you find an escape; after the loop, return `null`.',
    ],
    walkthrough: `This is the element half of Viscosity’s safety check, in miniature.

- **A short allow-list.** Only two uses are safe: reading a field of the element and writing a field of the element. Everything else (calls, returns, stores, comparisons, phis, operations nobody modelled) counts as an escape. This is the conservative rule: anything not *known* to be safe is unsafe.
- **Position matters.** \`field.set\` has two value arguments: the object written to and the value stored. If \`el\` is the first, we are changing the element, which SoA can rewrite as \`ps.x[i] = v\`. If \`el\` is the second, a reference to the element is being stored in some other object, and that object can be read later. So check \`u.args[0] === el\`, not only the op.
- **Name the site.** Returning which use escaped, with its line, is what makes \`viscosity explain\` useful: it tells the programmer exactly what to change.

The real code also records every safe use as a read or write access, because the planner later needs to know which fields each loop touches.`,
    wrong: [
      {
        code: `function firstEscape(el, uses) {
  for (const u of uses) {
    if (u.op === 'field.get') continue;
    if (u.op === 'field.set') continue;
    return u.op + ' at line ' + u.line;
  }
  return null;
}`,
        why: 'This only looks at the op. `box.last = el` is also a `field.set`, but there `el` is the value being stored, so it escapes. Check that `el` is the first argument.',
      },
      {
        code: `function firstEscape(el, uses) {
  let bad = null;
  for (const u of uses) {
    const onEl = u.args[0] === el;
    const f = u.op.startsWith('field');
    if (!(onEl && f)) {
      bad = u.op + ' at line ' + u.line;
    }
  }
  return bad;
}`,
        why: 'Without an early return, later escapes overwrite earlier ones, so it reports the last escape instead of the first.',
      },
    ],
  },
  escapesVia: {
    optional: true,
    title: 'Follow it into functions',
    prompt:
      '`uses` maps a value name to its list of uses, each `{ op }` or `{ op: \'call\', to }`. `field`, `length` and `index` uses are safe. A `call` with a `to` passes the value to a **known** function whose parameter is named `to`: follow the parameter’s uses instead. A `call` without `to`, or any other op, escapes. Write `escapesVia(v, uses)` returning `true` if `v` escapes. Functions may call themselves, so don’t loop forever.',
    starter: `function escapesVia(v, uses) {
  // your code here
}

const uses = {
  ps: [{ op: 'length' },
       { op: 'call', to: 'qs' }],
  qs: [{ op: 'field' }],
};
console.log(escapesVia('ps', uses));`,
    solution: `function escapesVia(v, uses) {
  const safe = ['field', 'length',
    'index'];
  const seen = new Set([v]);
  const work = [v];
  while (work.length) {
    const x = work.pop();
    for (const u of uses[x] ?? []) {
      if (safe.includes(u.op)) continue;
      if (u.op === 'call' && u.to) {
        if (!seen.has(u.to)) {
          seen.add(u.to);
          work.push(u.to);
        }
        continue;
      }
      return true;
    }
  }
  return false;
}`,
    tests: `test('followed into a function', () => {
  expect(escapesVia('ps', {
    ps: [{ op: 'length' }, { op: 'call', to: 'qs' }],
    qs: [{ op: 'field' }, { op: 'index' }],
  })).toBe(false);
});
test('escapes inside the callee', () => {
  expect(escapesVia('ps', {
    ps: [{ op: 'call', to: 'qs' }],
    qs: [{ op: 'field' }, { op: 'return' }],
  })).toBe(true);
});
test('an unknown call escapes', () => {
  expect(escapesVia('ps', {
    ps: [{ op: 'field' }, { op: 'call' }],
  })).toBe(true);
});
test('a recursive function ends', () => {
  expect(escapesVia('ps', {
    ps: [{ op: 'call', to: 'qs' }],
    qs: [{ op: 'call', to: 'qs' }, { op: 'length' }],
  })).toBe(false);
});`,
    hints: [
      'Keep a worklist of value names still to check, starting with `[v]`.',
      'For a `call` with `to`, push `to` onto the worklist instead of escaping.',
      'Keep a `seen` set so a parameter is only added once; that is what stops recursion looping forever.',
    ],
    walkthrough: `This is how Viscosity follows a collection into a known function. A parameter that always receives \`ps\` is just another name for \`ps\`, so its uses are checked exactly like the original’s.

- **A worklist.** Start with \`v\`. Checking a value can discover new values to check (the parameters it flows into), so they go on the list.
- **A seen set.** A recursive function passes its parameter to itself. Without \`seen\`, \`qs\` would be pushed again and again. With it, each value is checked once, and the loop must end because there are finitely many names.
- **Fail fast.** The first escape anywhere answers the question, so return \`true\` at once. Only if the worklist empties without one is the answer \`false\`.

In the real analysis, “known function” has a strict meaning: declared once, never stored or passed around, and called only directly, so every call site is visible. And every one of those call sites must pass the same collection.`,
    wrong: [
      {
        code: `function escapesVia(v, uses) {
  for (const u of uses[v] ?? []) {
    if (u.op === 'call' && u.to) {
      if (escapesVia(u.to, uses)) {
        return true;
      }
      continue;
    }
    if (u.op === 'call') return true;
    if (u.op === 'return') return true;
  }
  return false;
}`,
        why: 'Recursing without a `seen` set loops forever on a function that calls itself. It also allows unknown ops instead of treating them as escapes.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Which use of an element `p = ps[i]` is **not** an escape site for Viscosity?',
    options: [
      { t: '`log(p)`', why: 'Passing an element to a call is an escape: the callee might keep it or print it.' },
      { t: '`p.x = p.x * 2`', correct: true, why: 'Reading and writing a field of the element is exactly what SoA can rewrite, as `ps.x[i] = ps.x[i] * 2`.' },
      { t: '`box.last = p`', why: 'Here the element is the stored value, so a reference to it now lives in `box`.' },
      { t: '`return p`', why: 'A return hands the element to the caller, outside the code being rewritten.' },
    ],
  },
  {
    q: 'An analysis says an object “does not escape”, but in fact it does. What can go wrong?',
    options: [
      { t: 'Only a little speed is lost', why: 'That is the cost of the opposite mistake, saying “escapes” when it doesn’t.' },
      { t: 'Nothing: the engine corrects it at run time', why: 'Viscosity rewrites the source ahead of time. There is no run-time safety net for its output.' },
      { t: 'The compiler throws an error', why: 'The compiler believes it is safe, so it carries on and transforms the code.' },
      { t: 'The program can behave differently, because code outside sees the changed layout', correct: true, why: 'That is why escape analysis must be conservative: when unsure, assume “escapes”.' },
    ],
  },
  {
    q: 'Why is `ps[i] === target` treated as an escape?',
    options: [
      { t: 'Comparisons are slow', why: 'Speed isn’t the issue; correctness is.' },
      { t: '`===` on objects checks identity, and after SoA there are no element objects to be identical', correct: true, why: 'A rebuilt object is new each time, so the comparison could change its answer.' },
      { t: 'Because `target` might be a number', why: 'Even if `target` is an object, the identity question is what can’t be preserved.' },
      { t: 'It isn’t: comparisons are always safe', why: 'Viscosity’s `describeUse` reports it: “compared or combined with "==="”.' },
    ],
  },
  {
    q: '`step(ps)` is the only call to a function `step(qs)` declared once. What does Viscosity do with `qs`?',
    options: [
      { t: 'Gives up: any call is an escape', why: 'For known functions whose every call site passes the same collection, it does better.' },
      { t: 'Inlines `step` first', why: 'Viscosity doesn’t inline. It follows the parameter instead.' },
      { t: 'Treats `qs` as another reference to `ps` and checks its uses inside `step`', correct: true, why: 'All call sites pass `ps`, so `qs` points to exactly that collection.' },
      { t: 'Copies `ps` before the call', why: 'Copying would change identity. It rewrites `step` to use the columns instead.' },
    ],
  },
  {
    q: 'Why did SoA not lose in the `get-objects` benchmark, while it lost badly in `materialize`?',
    options: [
      { t: 'In `get-objects`, V8 inlined `consume` and removed the temporary object; in `materialize` the objects are kept', correct: true, why: 'Only an object that escapes has to exist. Stored objects escape, so their allocations stay.' },
      { t: '`get-objects` reads fewer elements', why: 'Both suites visit every element.' },
      { t: 'Viscosity optimized `get-objects`', why: 'These suites are hand-written layouts measured on plain V8.' },
      { t: 'SoA objects are smaller', why: 'With SoA there are no element objects at all until something builds one.' },
    ],
  },
  {
    q: 'Viscosity is stricter than V8 here: `move(ps[i])` keeps the array of objects. Why can’t it simply do what V8 does?',
    options: [
      { t: 'JavaScript forbids it', why: 'Nothing in the language forbids it; it is a question of proof.' },
      { t: 'V8 doesn’t do escape analysis', why: 'It does: that is how the temporary object in `get-objects` disappeared.' },
      { t: 'SoA columns can’t be passed to functions', why: '`step(ps)` shows the collection itself can be followed into a function.' },
      { t: 'It runs ahead of time, doesn’t inline, and can’t deoptimize, so it must prove safety on the code as written', correct: true, why: 'V8 can speculate and back out. A source-to-source compiler’s output must be right for every run.' },
    ],
  },
];
