// Chapter 108 (second half: environment lifetime) cards. Keys are stable ids.

export const prompts = {
  'heap-why': {
    q: 'Why is a Drip call’s environment on the heap rather than in the call’s TypeScript frame?',
    a: 'It is made with `new Environment(...)`, and JavaScript objects made with `new` live on the heap; the frame only holds a reference.',
  },
  'gc-what': {
    q: 'When may JavaScript’s garbage collector reclaim an object?',
    a: 'Once the program can no longer reach it by following references.',
  },
  'outlives': {
    q: 'Can a Drip environment outlive the call that created it? Give an example.',
    a: 'Yes: when the call returns a function made inside it, that function’s closure keeps the call’s environment alive.',
  },
  'host-frame': {
    q: 'When `makeCounter` returns, what disappears and what stays?',
    a: 'Its TypeScript frames on the host stack disappear; its environment (a heap object) stays while the closure refers to it.',
  },
  'what-keeps': {
    q: 'Name three things that can keep a Drip environment alive.',
    a: 'A running call, a child environment (through its parent link), and a function’s captured environment.',
  },
  'live-shared': {
    q: 'Two functions made in the same call both use `v`. One assigns `v = 5`. What does the other see?',
    a: '`5`. They captured the same environment, so they share the variable.',
  },
  'reclaimed-when': {
    q: 'After `let a = makeCounter(); a = none;`, can the counter’s environment be reclaimed?',
    a: 'Yes: nothing refers to the function any more, so nothing reaches its captured environment.',
  },
  'call-allocates': {
    q: 'What does every Drip function call allocate in the tree-walker, even when no closure needs it?',
    a: 'A new `Environment` object, with a new `Map` inside it.',
  },
};

export const examples = {
  'shared-box': {
    title: 'Two closures, one environment',
    lang: 'drip',
    code: `fn makeBox(v) {
  let get = fn () { return v; };
  let set = fn (x) { v = x; };
  return [get, set];
}

let box = makeBox("old");
print box[0]();
box[1]("new");
print box[0]();`,
  },
};

const sol = `function liveEnvs(roots) {
  const seen = new Set();
  const todo = [...roots];
  while (todo.length > 0) {
    const x = todo.pop();
    if (typeof x !== 'object') continue;
    if (x === null || seen.has(x)) {
      continue;
    }
    if ('closure' in x) {
      todo.push(x.closure);
      continue;
    }
    seen.add(x);
    todo.push(x.parent, ...x.vars);
  }
  return [...seen].map((e) => e.name);
}`;

export const exercises = {
  liveEnvs: {
    title: 'Which environments are alive?',
    prompt: `Model the garbage collector's question in plain JavaScript. An environment is \`{ name, parent, vars }\`: \`parent\` is another environment or \`null\`, and \`vars\` is an array of the values it holds. A value is a number, a string, or a function \`{ closure }\` whose \`closure\` is an environment.

Write \`liveEnvs(roots)\`: given an array of root environments, return an array of the **names** of every environment reachable from them, in any order. From an environment you can reach its parent and every value in \`vars\`; from a function you can reach its \`closure\`. Each name appears once, and the function must finish even when an environment holds a function whose closure is that same environment (a cycle).`,
    starter: `function liveEnvs(roots) {
  // your code here
}`,
    solution: sol,
    tests: `const env = (name, parent, vars = []) => ({ name, parent, vars });
const sorted = (xs) => [...xs].sort();
test('the globals alone', () => {
  const G = env('G', null);
  expect(sorted(liveEnvs([G]))).toEqual(['G']);
});
test('a closure keeps its call alive', () => {
  const G = env('G', null);
  const call = env('call', G, [0]);
  G.vars.push({ closure: call });
  expect(sorted(liveEnvs([G]))).toEqual(['G', 'call']);
});
test('drop the function and the call is gone', () => {
  const G = env('G', null);
  env('call', G, [0]);
  G.vars.push(5);
  expect(sorted(liveEnvs([G]))).toEqual(['G']);
});
test('a child reaches its whole chain', () => {
  const G = env('G', null);
  const A = env('A', G);
  const C = env('C', A);
  expect(sorted(liveEnvs([C]))).toEqual(['A', 'C', 'G']);
});
test('cycles finish, and names appear once', () => {
  const G = env('G', null);
  const call = env('call', G);
  const f = { closure: call };
  call.vars.push(f, f);
  G.vars.push(f);
  expect(sorted(liveEnvs([G, G]))).toEqual(['G', 'call']);
});`,
    hints: [
      'This is a walk over a graph: keep a list of things still to look at, and a set of environments already seen.',
      'Take one item at a time. Skip numbers, strings, `null` and anything already seen. A function sends you on to its `closure`; an environment is recorded, then its `parent` and all its `vars` go on the list.',
      'Use `const seen = new Set(); const todo = [...roots];` and a `while (todo.length > 0)` loop with `todo.pop()`; at the end, map the seen environments to their names.',
    ],
    walkthrough: `**How to think about it.** "Can the program still reach this environment?" is a question about following arrows: from the roots, along parent links, into the values an environment holds, and from functions to their captured environments. The usual way to follow arrows without getting lost is a to-do list plus a set of places already visited. The visited set matters because the arrows can go round in a circle: an environment holding a function whose closure is that same environment is exactly what \`makeCounter\` builds when its body declares \`count\`.

**The solution, line by line.**

- \`function liveEnvs(roots) {\` takes the root environments.
- \`  const seen = new Set();\` will hold every live environment, once each (a \`Set\` ignores repeats and compares objects by identity).
- \`  const todo = [...roots];\` copies the roots into a to-do list.
- \`  while (todo.length > 0) {\` keeps going until nothing is left to look at.
- \`    const x = todo.pop();\` takes one item.
- \`    if (typeof x !== 'object') continue;\` skips numbers and strings, which refer to nothing.
- \`    if (x === null || seen.has(x)) { continue; }\` skips the end of a parent chain (\`null\`, whose \`typeof\` is also \`'object'\`) and anything already visited, which is what stops cycles.
- \`    if ('closure' in x) { todo.push(x.closure); continue; }\` handles a function: it is not an environment itself, but it leads to one.
- \`    seen.add(x);\` records a live environment.
- \`    todo.push(x.parent, ...x.vars);\` queues its parent and every value it holds.
- \`  }\` ends the loop, and \`  return [...seen].map((e) => e.name);\` turns the set into an array of names.

This is, in miniature, the *mark* half of the mark-and-sweep collector that Part IV builds for the VM.

**Common wrong attempts.**

- A recursive walk with no visited set: on a cycle it goes round for ever, until JavaScript stops it with a \`RangeError\` (too much recursion).
- Following only \`parent\` links: the captured environment of a function held in \`vars\` is never found, so the closure test fails; reaching an environment *through a function* is the whole point of this chapter.`,
    wrong: [
      {
        code: `function liveEnvs(roots) {
  const out = [];
  const visit = (x) => {
    if (typeof x !== 'object') return;
    if (x === null) return;
    if ('closure' in x) {
      return visit(x.closure);
    }
    out.push(x.name);
    visit(x.parent);
    x.vars.forEach(visit);
  };
  roots.forEach(visit);
  return out;
}`,
        why: 'With no record of what was visited, a cycle sends it round for ever (a RangeError), and a root listed twice is counted twice.',
      },
      {
        code: `function liveEnvs(roots) {
  const seen = new Set();
  for (let e of roots) {
    while (e && !seen.has(e)) {
      seen.add(e);
      e = e.parent;
    }
  }
  return [...seen].map((e) => e.name);
}`,
        why: 'This follows only parent links, so an environment kept alive by a function’s closure is never found.',
      },
    ],
  },
  account: {
    optional: true,
    lang: 'drip',
    title: 'A shared bank balance',
    prompt:
      'Write `fn makeAccount(start)` that returns a list of two anonymous functions sharing one balance: the first takes an amount and adds it, the second returns the balance. The program must print `100`, `150` and `150`.',
    starter: `fn makeAccount(start) {
  # your code here
}

let acct = makeAccount(100);
let deposit = acct[0];
let balance = acct[1];
print balance();
deposit(50);
print balance();
print acct[1]();`,
    solution: `fn makeAccount(start) {
  let money = start;
  let add = fn (x) { money += x; };
  let get = fn () { return money; };
  return [add, get];
}

let acct = makeAccount(100);
let deposit = acct[0];
let balance = acct[1];
print balance();
deposit(50);
print balance();
print acct[1]();`,
    tests: `100
150
150`,
    hints: [
      'Both functions must see the same balance, so it has to live in the environment of the `makeAccount` call, which both capture.',
      'Inside `makeAccount`, keep the balance in a variable, make two anonymous functions that use it, and return them in a list.',
      'The adder is `fn (x) { money += x; }` and the reader is `fn () { return money; }`.',
    ],
    walkthrough: `**How to think about it.** The two functions are made in the same call, so they capture the same environment, and a variable in that environment is shared between them for as long as either lives. The balance belongs there. (Using the parameter \`start\` directly would work too, since parameters live in the call's environment; a separate \`money\` just reads more clearly.)

**The solution, line by line.**

- \`fn makeAccount(start) {\` declares the maker.
- \`  let money = start;\` puts the balance in this call's environment.
- \`  let add = fn (x) { money += x; };\` makes a function that changes the shared \`money\`.
- \`  let get = fn () { return money; };\` makes one that reads it.
- \`  return [add, get];\` hands both back in a list. The call ends, but its environment lives on, kept by both closures.
- The program pulls the two functions out of the list, prints 100, deposits 50 through one closure, and reads 150 through the other; \`acct[1]()\` is the same function as \`balance\`, so it reads 150 too.

**Common wrong attempts.**

- Making \`money\` inside each anonymous function: each call starts afresh, and \`balance()\` never sees the deposit.
- Calling \`makeAccount(100)\` twice (once to get the adder, once for the reader): that makes two separate environments, so the deposit goes into one and the balance is read from the other.`,
    wrong: [
      {
        code: `fn makeAccount(start) {
  let money = start;
  let add = fn (x) { money += x; };
  let get = fn () { return money; };
  return [add, get];
}

let deposit = makeAccount(100)[0];
let balance = makeAccount(100)[1];
let acct = [deposit, balance];
print balance();
deposit(50);
print balance();
print acct[1]();`,
        why: 'Two calls make two separate environments, so the deposit goes into one balance and `balance()` reads the other: `100`, `100`, `100`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'After `makeCounter()` returns a function, why does its environment still exist?',
    options: [
      { t: 'The interpreter copies the environment into the function', why: 'Nothing is copied: the function refers to the same environment object.' },
      { t: 'Its TypeScript frame stays on the host stack', why: 'The frame is gone as soon as the call returns.' },
      { t: 'The returned function’s closure field refers to it, so it is still reachable', correct: true, why: 'Heap objects live as long as something can reach them.' },
    ],
  },
  {
    q: `What does this print?
\`\`\`
fn pair() {
  let n = 0;
  let inc = fn () { n += 1; };
  let get = fn () { return n; };
  return [inc, get];
}
let p = pair();
p[0]();
p[0]();
print p[1]();
\`\`\``,
    options: [
      { t: '`0`', why: '`get` does not have its own copy of `n`; it shares the one `inc` changes.' },
      { t: '`2`', correct: true, why: 'Both closures captured the same environment, and `inc` added 1 to its `n` twice.' },
      { t: '`1`', why: 'Each call of `p[0]()` adds 1 to the same `n`, and there are two calls.' },
    ],
  },
  {
    q: 'Which of these keeps an environment alive?',
    options: [
      { t: 'A function value whose closure field refers to it', correct: true, why: 'Reachable through the closure, so the garbage collector must keep it.' },
      { t: 'Having been the environment of a call that has returned', why: 'That alone keeps nothing alive; something must still refer to it.' },
      { t: 'Holding a large number of variables', why: 'Size has nothing to do with whether it can be reached.' },
    ],
  },
  {
    q: 'In the tree-walker, which calls allocate a new `Environment` object?',
    options: [
      { t: 'Only calls of functions that make closures', why: 'The tree-walker cannot tell in advance, and does not try: it makes one for every call.' },
      { t: 'Every call of a Drip function', correct: true, why: '`callFunction` always does `new Environment(f.closure)`, with a new `Map` inside.' },
      { t: 'None: environments are made once per function', why: 'Each call needs its own parameters, so each call gets its own environment.' },
    ],
  },
  {
    q: 'How does Part IV’s bytecode VM keep a captured variable alive after its call returns?',
    options: [
      { t: 'It keeps every call’s locals on the heap, as the tree-walker does', why: 'It keeps locals in stack slots, which is why it needs a special step for captured ones.' },
      { t: 'It moves just the captured variables off the stack into small heap objects', correct: true, why: 'Only what a closure captures pays for a heap object; everything else stays in fast stack slots.' },
      { t: 'It forbids closures from outliving their call', why: 'Drip allows it in both implementations; the results must be identical.' },
    ],
  },
];
