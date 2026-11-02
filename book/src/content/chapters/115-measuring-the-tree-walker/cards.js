// Chapter 114 (second half: measuring) cards. Keys are stable ids.

export const prompts = {
  'how-measured': {
    q: 'How did the harness time each Drip program?',
    a: 'A fresh Node process per program and engine, three runs, best kept, timing the whole run: scanning, parsing, resolving and running.',
  },
  'vm-slower': {
    q: 'On which kind of benchmark program was the TypeScript VM slower than the tree-walker?',
    a: 'Object-heavy ones: making many instances or reading many fields (`instantiation`, `fields`, `trees`), and `strings`.',
  },
  'same-engine': {
    q: 'Why might a bytecode VM written in TypeScript not beat a tree-walker by much?',
    a: 'Both run on V8; the tree-walker uses V8’s own tuned `Map`s and objects, while the VM rebuilds its stack, tables and objects in TypeScript.',
  },
  'overhead-what': {
    q: 'What is *interpreter overhead*?',
    a: 'Work the interpreter does that the program did not ask for: dispatch, pointer chasing, name lookups, allocation and checks.',
  },
  'n-minus-2': {
    q: 'For one `n - 2`, how much real work does the tree-walker do, and roughly how much else?',
    a: 'One subtraction, plus seven method calls, four switches, two `Map` lookups and five checks.',
  },
  'dispatch': {
    q: 'Why is “dispatch on every node” wasted work?',
    a: 'The interpreter asks what kind each node is every time it runs, though the answer never changes.',
  },
  'chase': {
    q: 'Why is following the tree’s and environments’ references slow for the CPU?',
    a: 'Each load needs the previous one’s result, so the CPU waits for memory step by step (pointer chasing).',
  },
  'allocations': {
    q: 'Name two places the tree-walker allocates new objects while running.',
    a: 'Any two of: an `Environment` and `Map` per call; two environments per `for` pass; a bound method and environment per method read; a `frames` entry per call.',
  },
};

export const examples = {
  timing: {
    title: 'Timing the tree-walker',
    lang: 'drip',
    code: `fn fib(n) {
  if n < 2 {
    return n;
  }
  return fib(n - 1) + fib(n - 2);
}

let t0 = clock();
print fib(20);
let t1 = clock();
let sum = 0;
for i in 0..100000 {
  sum += i;
}
print sum;
let t2 = clock();
print "fib(20): " + str(t1 - t0);
print "loop: " + str(t2 - t1);`,
  },
};

const start = `function evaluate(node, env, st) {
  if (node.kind === 'num') {
    return node.value;
  }
  if (node.kind === 'var') {
    return env.get(node.name);
  }
  const { left, right } = node;
  const l = evaluate(left, env, st);
  const r = evaluate(right, env, st);
  if (node.kind === 'add') return l + r;
  return l * r;
}`;

export const exercises = {
  countVisits: {
    title: 'Counting the overhead',
    prompt: `A tiny tree-walker in plain JavaScript. Nodes are \`{ kind: 'num', value }\`, \`{ kind: 'var', name }\` (read from the \`Map\` \`env\`), \`{ kind: 'add', left, right }\` or \`{ kind: 'mul', left, right }\`. The starter evaluates them. Change it so that, as well as returning the value, it counts into the object \`st\`:

- \`st.visits\`: one for every node evaluated,
- \`st.lookups\`: one for every \`Map\` lookup of a variable,
- \`st.ops\`: one for every addition or multiplication actually done (the real work).

Then \`(x + 2) * 3\` reports 5 visits, 1 lookup and 2 operations.`,
    starter: start,
    solution: `function evaluate(node, env, st) {
  st.visits++;
  if (node.kind === 'num') {
    return node.value;
  }
  if (node.kind === 'var') {
    st.lookups++;
    return env.get(node.name);
  }
  const { left, right } = node;
  const l = evaluate(left, env, st);
  const r = evaluate(right, env, st);
  st.ops++;
  if (node.kind === 'add') return l + r;
  return l * r;
}`,
    tests: `const num = (value) => ({ kind: 'num', value });
const v = (name) => ({ kind: 'var', name });
const add = (left, right) => ({ kind: 'add', left, right });
const mul = (left, right) => ({ kind: 'mul', left, right });
const fresh = () => ({ visits: 0, lookups: 0, ops: 0 });
const env = new Map([['x', 4], ['y', 5]]);
test('a single number: one visit, no work', () => {
  const s = fresh();
  expect(evaluate(num(7), env, s)).toBe(7);
  expect(s).toEqual({ visits: 1, lookups: 0, ops: 0 });
});
test('(x + 2) * 3', () => {
  const s = fresh();
  expect(evaluate(mul(add(v('x'), num(2)), num(3)), env, s)).toBe(18);
  expect(s).toEqual({ visits: 5, lookups: 1, ops: 2 });
});
test('x * y + x', () => {
  const s = fresh();
  expect(evaluate(add(mul(v('x'), v('y')), v('x')), env, s)).toBe(24);
  expect(s).toEqual({ visits: 5, lookups: 3, ops: 2 });
});
test('counts add up across calls', () => {
  const s = fresh();
  evaluate(add(num(1), num(1)), env, s);
  evaluate(add(num(1), num(1)), env, s);
  expect(s).toEqual({ visits: 6, lookups: 0, ops: 2 });
});`,
    hints: [
      'Each counter belongs at exactly one place in the function. Where does every call pass, whatever the node is?',
      'Count a visit at the very top, before any `if`. Count a lookup inside the `var` case, just before `env.get`.',
      'Count an operation after both operands have been evaluated, just before the addition or multiplication: `st.ops++;`.',
    ],
    walkthrough: `**How to think about it.** The three counters measure three different things, so each goes where that thing happens. A *visit* is a call of \`evaluate\`, whatever the node; so it is counted at the very top, before the function decides anything. A *lookup* happens only for a variable node, at the \`env.get\`. An *operation* is the real work, the \`+\` or \`*\` itself, which happens once per add or mul node, after both sides are known. Comparing the counts is the point: \`(x + 2) * 3\` visits five nodes and does a lookup, to do two operations.

**The solution, line by line.**

- \`function evaluate(node, env, st) {\` now also receives the counters, \`st\`.
- \`  st.visits++;\` counts this call, first, so number nodes are counted too.
- \`  if (node.kind === 'num') {\` and \`    return node.value;\` are unchanged: a number is a visit and nothing else.
- \`  if (node.kind === 'var') {\` handles a variable; \`    st.lookups++;\` counts the \`Map\` lookup, and \`    return env.get(node.name);\` does it.
- \`  const { left, right } = node;\` takes the two children out of the node, and \`  const l = ...\` and \`  const r = ...\` evaluate both sides (each counts its own visits and lookups as it goes).
- \`  st.ops++;\` counts the one real operation of this node.
- The last two lines do the addition or multiplication, unchanged.

**Common wrong attempts.**

- Counting a visit only in the \`add\` and \`mul\` cases: number and variable nodes are visits too (every one cost a call and a check of its kind), so \`(x + 2) * 3\` would report 2 visits instead of 5.
- Putting \`st.ops++\` at the top with the visit: every number and variable would then count as real work, hiding the overhead the exercise is meant to show.`,
    wrong: [
      {
        code: `function evaluate(node, env, st) {
  if (node.kind === 'num') {
    return node.value;
  }
  if (node.kind === 'var') {
    st.lookups++;
    return env.get(node.name);
  }
  st.visits++;
  const { left, right } = node;
  const l = evaluate(left, env, st);
  const r = evaluate(right, env, st);
  st.ops++;
  if (node.kind === 'add') return l + r;
  return l * r;
}`,
        why: 'Numbers and variables are never counted as visits, so `(x + 2) * 3` reports 2 visits instead of 5.',
      },
      {
        code: `function evaluate(node, env, st) {
  st.visits++;
  st.ops++;
  if (node.kind === 'num') {
    return node.value;
  }
  if (node.kind === 'var') {
    st.lookups++;
    return env.get(node.name);
  }
  const { left, right } = node;
  const l = evaluate(left, env, st);
  const r = evaluate(right, env, st);
  if (node.kind === 'add') return l + r;
  return l * r;
}`,
        why: 'Every node is counted as an operation, so the counts can no longer tell real work from overhead: 5 ops instead of 2.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'In this book’s benchmark run, how did the TypeScript bytecode VM compare with the tree-walker?',
    options: [
      { t: 'Several times faster on every program', why: 'The biggest speed-up was 1.3 times, and four programs were slower on the VM.' },
      { t: 'Faster on six programs by at most 1.3 times, slower on four', correct: true, why: 'That is what `drip-bench-2026-11-02` records, best of three runs on one shared machine.' },
      { t: 'Exactly the same speed', why: 'The times differ on every program, in both directions.' },
    ],
  },
  {
    q: 'Which is a fair conclusion from three runs per program on one shared cloud machine?',
    options: [
      { t: 'The VM design is slower than tree-walking in general', why: 'One machine, one host language and a few runs cannot support a claim that general.' },
      { t: 'The numbers prove exactly why the VM was slower', why: 'Timings show *what* happened, not why; Part IV measures the causes.' },
      { t: 'It is a careful first look that the VM chapters must examine further', correct: true, why: 'Fresh processes and best-of-three help, but a shared machine and few runs call for caution.' },
    ],
  },
  {
    q: 'Evaluating `n - 2` in the tree-walker involves how many real operations?',
    options: [
      { t: 'One: the subtraction', correct: true, why: 'Everything else (seven calls, four switches, two Map lookups, five checks) is overhead.' },
      { t: 'Seven, one per method call', why: 'The method calls are bookkeeping; only the subtraction was asked for.' },
      { t: 'Two: one per operand', why: 'Reading the operands is overhead: a Map lookup for `n`, a constant for 2.' },
    ],
  },
  {
    q: 'Why is following references through the tree and the environment chain slow?',
    options: [
      { t: 'References take a lot of memory', why: 'The problem is not size; it is that each step must wait for the previous load.' },
      { t: 'Each load depends on the one before, so the CPU cannot fetch ahead', correct: true, why: 'That is pointer chasing: dependent loads wait for memory one after another.' },
      { t: 'JavaScript checks every reference for null', why: 'The cost that matters here is waiting for memory, not checking.' },
    ],
  },
  {
    q: 'Which of these does the tree-walker allocate on every call of a Drip function?',
    options: [
      { t: 'A new copy of the function’s syntax tree', why: 'The tree is shared by every call; nothing copies it.' },
      { t: 'Nothing: calls are free', why: 'Calls are one of the most expensive things it does.' },
      { t: 'A new Environment with its own Map, and a frames entry', correct: true, why: '`callFunction` makes both before the body runs.' },
    ],
  },
];
