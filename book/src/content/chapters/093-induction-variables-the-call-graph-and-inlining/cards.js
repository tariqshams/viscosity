// Chapter 93 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.
// Merged from old chapters 93, 93, 93.

export const prompts = {
  'iv-what': {
    q: 'What is an induction variable?',
    a: 'A value that changes by a fixed step on every trip around a loop, like `i` in `i++`.',
  },
  'derived-iv': {
    q: 'In a loop over `i` (step 1), `j = 3 * i + 2`. By how much does `j` change each trip?',
    a: 'By 3: a derived induction variable `c·i + d` steps by `c` times `i`’s step.',
  },
  'invariant-what': {
    q: 'When is an instruction loop-invariant?',
    a: 'When it is pure and every operand is defined outside the loop or is itself loop-invariant.',
  },
  'length-not-invariant': {
    q: 'In a loop that calls `g.push(...)`, is `g.length` loop-invariant?',
    a: 'No. `g` does not change, but the memory that `g.length` reads does.',
  },
  'call-graph-what': {
    q: 'What is a **call graph**?',
    a: 'One node per function, and an edge f → g when f contains a call that may reach g.',
  },
  'js-callee-unknown': {
    q: 'Name two reasons a JavaScript call’s target may be unknown before the program runs.',
    a: 'Functions are values (`f(x)` calls whatever `f` holds, and callbacks are called from inside other functions), and methods are found on the prototype chain at run time.',
  },
  'inline-simultaneous': {
    q: 'Inline `sub(b, a)` where `sub(a, b)` is `a - b`, replacing one parameter at a time. What goes wrong?',
    a: '`a → b` gives `b - b`, then `b → a` gives `a - a`. Parameters must be replaced all at once, in the original body.',
  },
  'inline-enables': {
    q: 'What is inlining’s main benefit, beyond saving the cost of a call?',
    a: 'Caller and callee become one piece of code, so other passes (folding, DCE, value numbering, layout analysis) see across the old boundary.',
  },
};

export const examples = {
  order: {
    title: 'Callees before callers',
    code: `// who calls whom
const calls = {
  main: ['step'],
  step: ['move', 'clamp'],
  move: ['clamp'], clamp: [],
  even: ['odd'], odd: ['even'],
};
// postorder: a function is listed
// after everything it calls
const done = new Set();
const order = [];
function visit(f) {
  if (done.has(f)) return;
  done.add(f);
  for (const g of calls[f]) visit(g);
  order.push(f);
}
for (const f of Object.keys(calls)) {
  visit(f);
}
console.log(order.join(' '));`,
  },
};

export const exercises = {
  basicIvs: {
    optional: true,
    title: 'Find the basic induction variables',
    prompt: '`loop` lists a loop’s instructions `{ id, op, args }`. Each argument is either an instruction id (a string) or a number. A header phi has `args: [start, next]`, where `next` is the value coming round from the latch. Write `basicIvs(loop)` returning an object mapping each phi that is a **basic induction variable** to its step: `next` must be an instruction `phi + n`, `n + phi` or `phi - n`, where `n` is a number. A `-` gives a negative step.',
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
    prompt: '`loop` is a list of instructions `{ id, op, args }` inside a loop; `outside` lists ids defined before the loop. An instruction is invariant if its op is in `PURE` and every operand is defined outside or is invariant. Return the invariant ids in `loop` order. Note: an instruction may be listed before one it depends on.',
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
    walkthrough: `**How to think about it.** The rule "invariant if every operand is defined outside the loop or is itself invariant" refers to itself, so you cannot decide each instruction once, in the order given: an instruction may be listed before the one it depends on. The way out is the one from chapter 92. Keep a set of ids known to be invariant, seeded with everything defined outside the loop (those are invariant by definition), sweep over the loop adding any pure instruction whose operands are all in the set, and repeat the sweep until one adds nothing: a fixpoint. Each sweep can only add ids, and there are only so many, so it must stop.

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
  recursiveFns: {
    optional: true,
    title: 'Which functions are recursive?',
    prompt: 'Functions are given as expression trees, as in the inlining exercise: `{ n: 3 }` is a number, `{ v: \'x\' }` a variable, `{ op, l, r }` a binary operation and `{ call, args }` a call. `fns` maps a function name to `{ params, body }`. Build the call graph of `fns` and return the names (sorted) of the functions that can reach **themselves** through one or more calls: the ones an inliner cannot expand completely. Calls to names not in `fns` lead nowhere.',
    starter: `function recursive(fns) {
  // your code here
  return [];
}`,
    solution: `function calls(e, out) {
  if ('op' in e) {
    calls(e.l, out);
    calls(e.r, out);
  }
  if ('call' in e) {
    out.add(e.call);
    for (const a of e.args) {
      calls(a, out);
    }
  }
  return out;
}

function recursive(fns) {
  const graph = new Map();
  for (const name of Object.keys(fns)) {
    const body = fns[name].body;
    const out = calls(body, new Set());
    graph.set(name, out);
  }
  const reaches = (from, to) => {
    const seen = new Set();
    const stack = [...graph.get(from)];
    while (stack.length > 0) {
      const g = stack.pop();
      if (g === to) return true;
      if (seen.has(g)) continue;
      if (!graph.has(g)) continue;
      seen.add(g);
      stack.push(...graph.get(g));
    }
    return false;
  };
  return Object.keys(fns)
    .filter((f) => reaches(f, f))
    .sort();
}`,
    tests: `const V = (v) => ({ v });
const B = (op, l, r) => ({ op, l, r });
const C = (call, ...args) =>
  ({ call, args });
test('a direct self-call', () => {
  expect(recursive({ f: { params: ['a'],
    body: C('f', V('a')) } }))
    .toEqual(['f']);
});
test('mutual recursion counts for both', () => {
  const fns = {
    even: { params: ['n'],
      body: C('odd', V('n')) },
    odd: { params: ['n'],
      body: C('even', V('n')) },
    main: { params: [],
      body: C('even', V('k')) },
  };
  expect(recursive(fns))
    .toEqual(['even', 'odd']);
});
test('calls to unknown names lead nowhere', () => {
  expect(recursive({ f: { params: [],
    body: C('log', V('x')) } }))
    .toEqual([]);
});
test('a chain without cycles', () => {
  const fns = {
    sq: { params: ['a'],
      body: B('*', V('a'), V('a')) },
    quad: { params: ['a'],
      body: C('sq', C('sq', V('a'))) },
  };
  expect(recursive(fns)).toEqual([]);
});
test('a call hidden in an argument', () => {
  const fns = {
    f: { params: ['a'], body: C('log',
      B('+', C('f', V('a')), V('a'))) },
  };
  expect(recursive(fns)).toEqual(['f']);
});`,
    hints: [
      'First build the graph: for each function, the set of names its body calls. Walk the tree, and remember that calls can hide inside the arguments of other calls and inside binary operations.',
      'A function `f` is recursive if a search that starts from `f`’s *callees* ever arrives back at `f`. Use a stack (or queue) of names still to look at.',
      'Keep a `seen` set, so a cycle that does not pass through `f` cannot loop forever, and skip names that are not in the graph (unknown functions are dead ends).',
    ],
    walkthrough: `**How to think about it.** The question "can \`f\` reach itself?" is about paths in the call graph, so the work splits into two steps: build the graph, then search it once per function. Building it means walking each body and collecting the names it calls; a \`Set\` is right, because calling \`sq\` twice is still one edge. Searching it is the graph search from the dominator and liveness chapters: a stack of nodes to visit and a set of nodes already visited. The one twist is where the search starts: from \`f\`'s callees, not from \`f\` itself, or every function would "reach itself" in zero steps.

**The solution, line by line.**

- \`function calls(e, out) {\` collects into the set \`out\` every name called anywhere in the tree \`e\`.
- \`if ('op' in e) { calls(e.l, out); calls(e.r, out); }\` looks inside both sides of a binary operation.
- \`if ('call' in e) { out.add(e.call); for (const a of e.args) { calls(a, out); } }\` records the call and then looks inside its arguments, where more calls can hide (\`log(f(a) + a)\` calls both \`log\` and \`f\`).
- \`return out;\` numbers and variables add nothing.
- \`const graph = new Map();\` will map each function's name to the set of names it calls.
- \`for (const name of Object.keys(fns)) { ... graph.set(name, out); }\` builds that set for every function.
- \`const reaches = (from, to) => {\` asks whether a path of one or more calls leads from \`from\` to \`to\`.
- \`const seen = new Set();\` the names already explored.
- \`const stack = [...graph.get(from)];\` starts with \`from\`'s callees: one call has already been made.
- \`while (stack.length > 0) { const g = stack.pop();\` takes the next name to explore.
- \`if (g === to) return true;\` found a path back.
- \`if (seen.has(g)) continue;\` already explored; this is what stops other cycles from looping forever.
- \`if (!graph.has(g)) continue;\` an unknown function: nothing to follow.
- \`seen.add(g); stack.push(...graph.get(g));\` explore \`g\`'s callees next.
- \`return false;\` the search ran out without finding a way back.
- \`return Object.keys(fns).filter((f) => reaches(f, f)).sort();\` keeps the recursive functions, sorted.

**Common wrong attempts.**

- Looking only for direct self-calls: \`even\` and \`odd\` call each other, so each reaches itself in two steps, and a check for "\`f\` calls \`f\`" misses both.
- Starting the search from \`f\` itself, \`[from]\`: the first name popped is \`f\`, which equals \`to\`, so every function is reported as recursive.
- Forgetting to look inside call arguments: \`log(f(a) + a)\` then seems to call only \`log\`.`,
    wrong: [
      {
        code: `function selfCalls(e, name) {
  if ('op' in e) {
    return selfCalls(e.l, name) ||
      selfCalls(e.r, name);
  }
  if ('call' in e) {
    return e.call === name ||
      e.args.some(
        (a) => selfCalls(a, name));
  }
  return false;
}

function recursive(fns) {
  return Object.keys(fns)
    .filter((f) =>
      selfCalls(fns[f].body, f))
    .sort();
}`,
        why: 'This finds only direct self-calls. `even` and `odd` call each other, so each reaches itself in two steps, and this misses both.',
      },
      {
        code: `function calls(e, out) {
  if ('op' in e) {
    calls(e.l, out);
    calls(e.r, out);
  }
  if ('call' in e) {
    out.add(e.call);
    for (const a of e.args) {
      calls(a, out);
    }
  }
  return out;
}

function recursive(fns) {
  const graph = new Map();
  for (const name of Object.keys(fns)) {
    const body = fns[name].body;
    const out = calls(body, new Set());
    graph.set(name, out);
  }
  const reaches = (from, to) => {
    const seen = new Set();
    const stack = [from];
    while (stack.length > 0) {
      const g = stack.pop();
      if (g === to) return true;
      if (seen.has(g)) continue;
      if (!graph.has(g)) continue;
      seen.add(g);
      stack.push(...graph.get(g));
    }
    return false;
  };
  return Object.keys(fns)
    .filter((f) => reaches(f, f))
    .sort();
}`,
        why: 'The search starts at `from` itself, so the very first name popped equals `to`: every function looks recursive.',
      },
    ],
  },
  inlineTree: {
    title: 'Inline calls in an expression tree',
    prompt: 'Expressions are trees: `{ n: 3 }` is a number, `{ v: \'x\' }` a variable, `{ op, l, r }` a binary operation and `{ call, args }` a call. `fns` maps a function name to `{ params, body }`. Write `inline(e, fns)` that returns a new tree with every call to a function in `fns` replaced by its body, with the (inlined) arguments put in place of the parameters **simultaneously**. Calls to other names stay, but their arguments are inlined. Bodies may call other functions in `fns`; there is no recursion.',
    starter: `function inline(e, fns) {
  // your code here
  return e;
}

const fns = {
  sq: {
    params: ['a'],
    body: { op: '*', l: { v: 'a' },
      r: { v: 'a' } },
  },
};
const e = { call: 'sq',
  args: [{ v: 'x' }] };
const out = inline(e, fns);
console.log(JSON.stringify(out));`,
    solution: `function subst(e, env) {
  if ('v' in e) {
    const x = env.get(e.v);
    return x === undefined ? e : x;
  }
  if ('op' in e) {
    const l = subst(e.l, env);
    const r = subst(e.r, env);
    return { op: e.op, l, r };
  }
  if ('call' in e) {
    const args = e.args.map(
      (a) => subst(a, env));
    return { call: e.call, args };
  }
  return e;
}

function inline(e, fns) {
  if ('op' in e) {
    const l = inline(e.l, fns);
    const r = inline(e.r, fns);
    return { op: e.op, l, r };
  }
  if (!('call' in e)) return e;
  const args = e.args.map(
    (a) => inline(a, fns));
  const f = fns[e.call];
  if (!f) return { call: e.call, args };
  const env = new Map();
  f.params.forEach((p, i) => {
    env.set(p, args[i]);
  });
  const body = subst(f.body, env);
  return inline(body, fns);
}`,
    tests: `const N = (n) => ({ n });
const V = (v) => ({ v });
const B = (op, l, r) => ({ op, l, r });
const C = (call, ...args) => ({ call, args });
const fns = {
  sq: { params: ['a'], body: B('*', V('a'), V('a')) },
  sub: { params: ['a', 'b'], body: B('-', V('a'), V('b')) },
  quad: { params: ['a'], body: C('sq', C('sq', V('a'))) },
};
test('inlines a simple call', () => {
  expect(inline(C('sq', V('x')), fns)).toEqual(B('*', V('x'), V('x')));
});
test('arguments can be expressions', () => {
  const arg = B('+', N(1), V('y'));
  expect(inline(C('sq', arg), fns)).toEqual(B('*', arg, arg));
});
test('substitutes all parameters at once', () => {
  expect(inline(C('sub', V('b'), V('a')), fns)).toEqual(B('-', V('b'), V('a')));
});
test('unknown calls stay, with inlined arguments', () => {
  expect(inline(C('log', C('sq', V('y'))), fns)).toEqual(C('log', B('*', V('y'), V('y'))));
});
test('calls inside an inlined body are inlined too', () => {
  const zz = B('*', V('z'), V('z'));
  expect(inline(C('quad', V('z')), fns)).toEqual(B('*', zz, zz));
});
test('trees without calls are unchanged', () => {
  expect(inline(B('+', V('x'), N(2)), fns)).toEqual(B('+', V('x'), N(2)));
});`,
    hints: [
      'Write a helper `subst(e, env)` that replaces variables found in a `Map` from parameter name to expression, and copies everything else.',
      'In `inline`, handle a call by first inlining its arguments, then building the map `param → argument` and calling `subst` on the body once, with all parameters in the map.',
      'The substituted body may itself contain calls to functions in `fns`: run `inline` on the result.',
    ],
    walkthrough: `**How to think about it.** Inline the first test by hand: the call \`sq(x)\`, where \`sq\`'s body is \`a * a\`. You look up \`sq\`, take its body, and write \`x\` wherever \`a\` appears: \`x * x\`. So there are two separate jobs. One is *substitution*: walk a body and swap each parameter for its argument. The other is *finding the calls*: walk the caller's tree, and at each call to a known function, do the substitution. Splitting them into two functions keeps each one simple. Two details from the chapter decide how they fit together: every parameter must be swapped in one pass over the original body (so a \`Map\` holding all of them is the natural tool), and the result of a substitution may contain calls of its own (\`quad\` calls \`sq\`), so it has to be inlined again.

**The solution, line by line.**

- \`function subst(e, env) {\` replaces variables using \`env\`, a \`Map\` from parameter name to argument tree.
- \`if ('v' in e) { const x = env.get(e.v); return x === undefined ? e : x; }\` a variable that is a parameter becomes its argument; any other variable stays. The argument is returned *as it is* and never walked again, which is what makes the substitution simultaneous: in \`sub(b, a)\` the \`b\` put in for \`a\` is never looked at by the replacement for \`b\`.
- \`if ('op' in e) { ... return { op: e.op, l, r }; }\` rebuilds a binary node from its substituted children.
- \`if ('call' in e) { ... return { call: e.call, args }; }\` keeps a call, substituting inside its arguments.
- \`return e;\` a number is unchanged.
- \`function inline(e, fns) {\` walks the caller's tree.
- \`if ('op' in e) { ... }\` rebuilds a binary node from its inlined children.
- \`if (!('call' in e)) return e;\` numbers and variables have nothing to inline.
- \`const args = e.args.map((a) => inline(a, fns));\` inlines inside the arguments first, so \`sq(sq(z))\` works from the inside out.
- \`const f = fns[e.call]; if (!f) return { call: e.call, args };\` a call to an unknown function stays, with its arguments inlined.
- \`const env = new Map(); f.params.forEach((p, i) => { env.set(p, args[i]); });\` pairs every parameter with its argument, by position, before any replacing happens.
- \`const body = subst(f.body, env);\` makes the substituted copy of the body, in one pass.
- \`return inline(body, fns);\` inlines any calls the body itself contains (\`quad\` becomes \`sq(sq(z))\`, which becomes \`(z * z) * (z * z)\`). This cannot loop forever because the task promises no recursion; with recursion, an inliner would need the call graph to stop after a few levels.

**Common wrong attempts.**

- Replacing one parameter at a time (\`body = rep(body, p, args[i])\` in a loop): for \`sub(b, a)\` the first step gives \`b - b\` and the second \`a - a\`.
- Returning the substituted body without inlining it again: \`quad(z)\` comes out as \`sq(sq(z))\`, with the calls inside the body never inlined.

This toy copies an argument wherever its parameter appears (\`sq(1 + y)\` becomes \`(1 + y) * (1 + y)\`). That is fine for pure expressions; a real compiler first evaluates each argument once into a fresh temporary, so side effects happen once, and in an IR the callee's locals and SSA values get fresh names as they are copied.`,
    wrong: [
      {
        code: `function rep(e, name, by) {
  if ('v' in e) {
    return e.v === name ? by : e;
  }
  if ('op' in e) {
    const l = rep(e.l, name, by);
    const r = rep(e.r, name, by);
    return { op: e.op, l, r };
  }
  if ('call' in e) {
    const args = e.args.map(
      (a) => rep(a, name, by));
    return { call: e.call, args };
  }
  return e;
}

function inline(e, fns) {
  if ('op' in e) {
    const l = inline(e.l, fns);
    const r = inline(e.r, fns);
    return { op: e.op, l, r };
  }
  if (!('call' in e)) return e;
  const args = e.args.map(
    (a) => inline(a, fns));
  const f = fns[e.call];
  if (!f) return { call: e.call, args };
  let body = f.body;
  f.params.forEach((p, i) => {
    body = rep(body, p, args[i]);
  });
  return inline(body, fns);
}`,
        why: 'Replacing one parameter at a time lets a later replacement rewrite an argument that an earlier one put in. `sub(b, a)` becomes `b - b` and then `a - a`.',
      },
      {
        code: `function subst(e, env) {
  if ('v' in e) {
    const x = env.get(e.v);
    return x === undefined ? e : x;
  }
  if ('op' in e) {
    const l = subst(e.l, env);
    const r = subst(e.r, env);
    return { op: e.op, l, r };
  }
  if ('call' in e) {
    const args = e.args.map(
      (a) => subst(a, env));
    return { call: e.call, args };
  }
  return e;
}

function inline(e, fns) {
  if ('op' in e) {
    const l = inline(e.l, fns);
    const r = inline(e.r, fns);
    return { op: e.op, l, r };
  }
  if (!('call' in e)) return e;
  const args = e.args.map(
    (a) => inline(a, fns));
  const f = fns[e.call];
  if (!f) return { call: e.call, args };
  const env = new Map();
  f.params.forEach((p, i) => {
    env.set(p, args[i]);
  });
  return subst(f.body, env);
}`,
        why: 'The substituted body is returned as it is, so calls *inside* the body (like the two `sq` calls in `quad`) are never inlined.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'In SSA, which instruction is the basic induction variable of `for (let i = 0; i < n; i++)`?',
    options: [
      {
        t: 'The comparison `i < n` in the header',
        why: 'That is the loop’s test; it uses the induction variable.',
      },
      {
        t: 'The phi in the header that takes `0` from before the loop and `i + 1` from the latch',
        correct: true,
        why: 'A start from outside and `phi + step` from inside is the shape of a basic induction variable.',
      },
      {
        t: 'The constant `1`',
        why: 'That is the step, which is loop-invariant, not the variable.',
      },
    ],
  },
  {
    q: 'A loop body contains `t = n * 2` (with `n` defined before the loop) and `g.push(t)`. Which is loop-invariant?',
    options: [
      {
        t: '`t = n * 2`',
        correct: true,
        why: 'Its only operands come from outside the loop and multiplying numbers has no effects, so it is the same every trip.',
      },
      {
        t: '`g.length`, because `g` never changes',
        why: 'The array object stays the same, but its length grows every trip.',
      },
      {
        t: 'Both',
        why: '`g.push` changes `g` each time; it is a write, not an invariant value.',
      },
      {
        t: 'Neither: nothing in a loop is invariant',
        why: '`n * 2` is the same every time.',
      },
    ],
  },
  {
    q: 'In a call graph, what is recursion?',
    options: [
      {
        t: 'A function with more than one caller',
        why: 'That is a node with several incoming edges; no cycle is needed.',
      },
      {
        t: 'A cycle: a path of calls from a function back to itself',
        correct: true,
        why: 'Direct (f calls f) or mutual (f calls g calls f).',
      },
      {
        t: 'A call to an unknown function',
        why: 'That is an edge to “unknown”, which may or may not lead back.',
      },
    ],
  },
  {
    q: 'How does an optimising JIT inline a call whose target it cannot prove?',
    options: [
      {
        t: 'It never does',
        why: 'JITs inline guesses routinely; it is one of their main advantages.',
      },
      {
        t: 'It inlines every function the call could possibly reach',
        why: 'That could be every function in the program.',
      },
      {
        t: 'It inlines the function type feedback says was called, behind a check, and deoptimises if the check fails',
        correct: true,
        why: 'Speculation plus a guard, with deoptimisation as the way back.',
      },
    ],
  },
  {
    q: 'Inline `sub(b, a)`, where `function sub(a, b) { return a - b; }`. What is the result?',
    options: [
      {
        t: '`a - b`',
        why: 'That is the body before any substitution.',
      },
      {
        t: '`b - a`',
        correct: true,
        why: 'Replace both parameters at once in the original body: `a` becomes `b` and `b` becomes `a`.',
      },
      {
        t: '`a - a`',
        why: 'That is what replacing one parameter at a time gives: the second replacement rewrites the first one’s result.',
      },
      {
        t: '`b - b`',
        why: 'That is the halfway point of the one-at-a-time mistake.',
      },
    ],
  },
];
