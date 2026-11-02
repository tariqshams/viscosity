// Chapter 209-b cards (staged split of 191): recall prompts, examples,
// exercises and quiz. Keys are stable ids: renaming one would orphan
// readers' review history.

export const prompts = {
  'call-graph-what': {
    q: 'What is a **call graph**?',
    a: 'One node per function, and an edge f → g when f contains a call that may reach g.',
  },
  'inline-recursion': {
    q: 'Why can a recursive function not be inlined completely?',
    a: 'Each inlined copy contains another call to the function, so the expansion never ends; at most a few levels are inlined.',
  },
  'js-callee-unknown': {
    q: 'Name two reasons a JavaScript call’s target may be unknown before the program runs.',
    a: 'Functions are values (`f(x)` calls whatever `f` holds, and callbacks are called from inside other functions), and methods are found on the prototype chain at run time.',
  },
  'known-fn': {
    q: 'When does Viscosity treat a function as **known**?',
    a: 'When it is declared once and its name is used only for direct calls: never passed as a value, reassigned or called as a method.',
  },
  'param-alias': {
    q: 'When does Viscosity follow a collection into a known function’s parameter?',
    a: 'When every call site passes that same collection in that position.',
  },
  'bottom-up-why': {
    q: 'Why do inliners visit the call graph from the leaves up?',
    a: 'So each callee is already as optimized (and as big) as it will get when its callers decide whether to inline it.',
  },
  'called-once': {
    q: 'Why is a function called from exactly one place (and not visible outside the program) almost always inlined?',
    a: 'After inlining, the original can be deleted, so the program gets no bigger, and usually faster.',
  },
  'inline-cost': {
    q: 'What does inlining cost, and how do inliners limit it?',
    a: 'Code size, and so compile time and memory; inliners set a growth budget and prefer small, once-called or hot callees.',
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
  recursiveFns: {
    title: 'Which functions are recursive?',
    prompt:
      'Functions are given as expression trees, as in the inlining exercise: `{ n: 3 }` is a number, `{ v: \'x\' }` a variable, `{ op, l, r }` a binary operation and `{ call, args }` a call. `fns` maps a function name to `{ params, body }`. Build the call graph of `fns` and return the names (sorted) of the functions that can reach **themselves** through one or more calls: the ones an inliner cannot expand completely. Calls to names not in `fns` lead nowhere.',
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
};

export const quiz = [
  {
    q: 'In a call graph, what is recursion?',
    options: [
      { t: 'A function with more than one caller', why: 'That is a node with several incoming edges; no cycle is needed.' },
      { t: 'A cycle: a path of calls from a function back to itself', correct: true, why: 'Direct (f calls f) or mutual (f calls g calls f).' },
      { t: 'A call to an unknown function', why: 'That is an edge to “unknown”, which may or may not lead back.' },
    ],
  },
  {
    q: 'Which call has a target a compiler can know for certain before the program runs?',
    options: [
      { t: '`o.area()`', why: 'The method is found on o’s prototype chain at run time.' },
      { t: '`xs.map(g)` calling `g`', why: 'The call to `g` happens inside `map`, with whatever function was passed.' },
      { t: '`sq(3)`, where `sq` is a function declared once and never reassigned or passed around', correct: true, why: 'That is exactly what Viscosity calls a known function.' },
      { t: '`f(3)`, where `f = cond ? sq : cube`', why: 'It depends on `cond`, so either could be called.' },
    ],
  },
  {
    q: 'How does an optimizing JIT inline a call whose target it cannot prove?',
    options: [
      { t: 'It never does', why: 'JITs inline guesses routinely; it is one of their main advantages.' },
      { t: 'It inlines every function the call could possibly reach', why: 'That could be every function in the program.' },
      { t: 'It inlines the function type feedback says was called, behind a check, and deoptimizes if the check fails', correct: true, why: 'Speculation plus a guard, with deoptimization as the way back.' },
    ],
  },
  {
    q: 'Why do inliners work bottom-up, leaves first?',
    options: [
      { t: 'So each callee is already optimized, and its final size known, when its callers decide', correct: true, why: 'Top-down, a caller would inline an unoptimized callee and copy all of its calls along with it.' },
      { t: 'Because leaves are the hottest functions', why: 'Leaves are not necessarily hot; the order is about having callees finished first.' },
      { t: 'Because the call graph has no edges going up', why: 'Edges go from callers to callees; the order follows them in reverse.' },
    ],
  },
  {
    q: '`total(xs)` is called with two different arrays. What does Viscosity do?',
    options: [
      { t: 'Inlines `total` at both calls', why: 'Viscosity does not inline.' },
      { t: 'Keeps both arrays as arrays of objects, because `total` is called with other values', correct: true, why: 'It follows a collection into a known function only when every call site passes that same collection.' },
      { t: 'Converts both to struct of arrays and makes two copies of `total`', why: 'It does not clone functions; that is what inlining would effectively do.' },
    ],
  },
];
