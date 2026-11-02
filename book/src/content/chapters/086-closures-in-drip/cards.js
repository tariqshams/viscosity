// Chapter 86 cards. Keys are stable ids: never rename them.

export const prompts = {
  'call-parent-question': {
    q: 'Every Drip call makes a fresh environment for its parameters. What design question does that leave open?',
    a: 'Which environment should be its parent.',
  },
  'parent-globals': {
    q: 'If a call’s environment always had the globals as its parent, what would `n = n + 1` inside `count` do?',
    a: 'Fail at runtime with `Undefined variable \'n\'.`, because `n` lives in `makeCounter`’s call environment, which is not on that chain.',
  },
  'parent-caller': {
    q: 'What goes wrong if a call’s environment hangs off the *caller’s* environment?',
    a: 'A name’s meaning depends on who calls the function (dynamic scope), not on where it was written.',
  },
  'closure-field': {
    q: 'Besides its declaration, what does a `DripFunction` store?',
    a: 'Its `closure`: the environment that was current when its `fn` declaration ran.',
  },
  'which-env': {
    q: '`fn count` is declared inside `makeCounter`’s body. Which environment does `count` capture?',
    a: 'The environment of the call of `makeCounter` that ran that declaration.',
  },
  'two-counters-drip': {
    q: 'In Drip, `let a = makeCounter(); let b = makeCounter();` Do `a` and `b` share `n`?',
    a: 'No. Each call made its own environment, so each `count` captured a different one with its own `n`.',
  },
  outlives: {
    q: 'Why does `makeCounter`’s call environment survive after the call returns?',
    a: 'It is a heap object, and `count.closure` still refers to it.',
  },
  'host-frame': {
    q: 'The host-stack frames that ran `makeCounter`’s body are gone. Why doesn’t that destroy `n`?',
    a: 'The frames only held a reference. The `Environment` holding `n` lives on the heap.',
  },
  'live-shared': {
    q: 'Two functions declared in the same call: if one assigns a captured variable, does the other see the change?',
    a: 'Yes. They captured the same environment, so they share the variable itself.',
  },
  'loop-shared': {
    q: 'Why do functions made in a Drip `for` loop all see the final `i`?',
    a: 'The `for` desugars to a block that declares `i` once, so every pass’s body environment has the same parent holding the one `i`.',
  },
  'loop-fix': {
    q: 'How do you give each function made in a Drip loop its own copy of `i`?',
    a: 'Create it inside a call (or a `let` in the body), e.g. `capture(i)`: each call makes a new environment with its own `v`.',
  },
  'call-allocates': {
    q: 'What does every Drip call allocate in the tree-walker, even if no closure is ever made?',
    a: 'A new `Environment`, with its own `Map` of names to values.',
  },
};

export const examples = {
  'shared-box': {
    title: 'Two closures, one environment',
    lang: 'drip',
    code: `let get;
let set;
fn makeBox(v) {
  fn g() { return v; }
  fn s(x) { v = x; }
  get = g;
  set = s;
}

makeBox("old");
print get();
set("new");
print get();`,
  },
};

export const exercises = {
  fixLoop: {
    title: 'One i each',
    lang: 'drip',
    prompt:
      'This Drip program saves three functions from a loop, but every one prints `4`. Change it so that `f1()`, `f2()` and `f3()` print `1`, `2` and `3`. Keep the loop and the three calls at the end.',
    starter: `let f1;
let f2;
let f3;
for (let i = 1; i <= 3; i = i + 1) {
  fn show() { print i; }
  if (i == 1) f1 = show;
  if (i == 2) f2 = show;
  if (i == 3) f3 = show;
}
f1();
f2();
f3();`,
    solution: `fn capture(v) {
  fn show() { print v; }
  return show;
}

let f1;
let f2;
let f3;
for (let i = 1; i <= 3; i = i + 1) {
  if (i == 1) f1 = capture(i);
  if (i == 2) f2 = capture(i);
  if (i == 3) f3 = capture(i);
}
f1();
f2();
f3();`,
    tests: `1
2
3`,
    hints: [
      'All three `show`s print the same `i` because there is only one `i`. You need a new environment per function, holding that pass’s value.',
      'Calls make new environments. Write a function `capture(v)` that declares `show` inside itself and returns it.',
      'In the loop, write `f1 = capture(i);` and so on. Each `show` then captures its own call’s `v`.',
    ],
    walkthrough: `Every \`show\` printed \`4\` because they all look up the same variable. The \`for\` is desugared into a block that runs \`let i = 1\` once, so there is one \`i\`, and by the time you call the functions the loop has pushed it to \`4\`.

The fix is to make a new environment per function, holding the value of \`i\` at that moment. A call does exactly that:

\`\`\`
fn capture(v) {
  fn show() { print v; }
  return show;
}
\`\`\`

Each \`capture(i)\` makes a fresh environment with its own \`v\`, and the \`show\` declared inside captures *that* environment. Three calls, three environments, three values.

There is a second fix. The loop body is a block, and each pass runs it with a new environment. So \`let j = i;\` inside the body, with \`fn show() { print j; }\`, also works: each pass gets its own \`j\`. What doesn’t work is any variable declared *outside* the body, because there is only one of it.`,
    wrong: [
      {
        code: `let f1;
let f2;
let f3;
let j;
for (let i = 1; i <= 3; i = i + 1) {
  j = i;
  fn show() { print j; }
  if (i == 1) f1 = show;
  if (i == 2) f2 = show;
  if (i == 3) f3 = show;
}
f1();
f2();
f3();`,
        why: '`j` is declared once, outside the loop, so all three functions share it and print `3`. The copy must be declared somewhere that is new on every pass.',
      },
      {
        code: `fn capture(v) {
  fn show() { print v; }
  return show();
}

let f1;
let f2;
let f3;
for (let i = 1; i <= 3; i = i + 1) {
  if (i == 1) f1 = capture(i);
  if (i == 2) f2 = capture(i);
  if (i == 3) f3 = capture(i);
}
f1();
f2();
f3();`,
        why: '`return show();` *calls* `show` and returns its result, `nil`. So the loop prints 1, 2, 3 early and then `f1()` fails: nil can’t be called. Return the function itself: `return show;`.',
      },
    ],
  },
  callFn: {
    optional: true,
    title: 'Calling with a captured environment',
    prompt:
      'A tiny model of the interpreter in plain JavaScript. `Env` is given. A function value is `{ params, body, closure }`, where `body(env)` computes the result. Write `callFn(f, args)`: make a new `Env` whose parent is `f.closure`, define each parameter in it, and return `f.body(env)`.',
    starter: `class Env {
  constructor(parent) {
    this.vars = new Map();
    this.parent = parent;
  }
  get(name) {
    if (this.vars.has(name)) {
      return this.vars.get(name);
    }
    if (this.parent) {
      return this.parent.get(name);
    }
    throw new Error('no ' + name);
  }
}

function callFn(f, args) {
  // your code here
}`,
    solution: `class Env {
  constructor(parent) {
    this.vars = new Map();
    this.parent = parent;
  }
  get(name) {
    if (this.vars.has(name)) {
      return this.vars.get(name);
    }
    if (this.parent) {
      return this.parent.get(name);
    }
    throw new Error('no ' + name);
  }
}

function callFn(f, args) {
  const env = new Env(f.closure);
  f.params.forEach((p, i) => {
    env.vars.set(p, args[i]);
  });
  return f.body(env);
}`,
    tests: `test('parameters are visible', () => {
  const g = new Env(null);
  const f = {
    params: ['a', 'b'],
    body: (e) => e.get('a') * e.get('b'),
    closure: g,
  };
  expect(callFn(f, [3, 4])).toBe(12);
});
test('the captured environment is visible', () => {
  const g = new Env(null);
  const made = new Env(g);
  made.vars.set('n', 10);
  const f = {
    params: ['k'],
    body: (e) => e.get('n') + e.get('k'),
    closure: made,
  };
  expect(callFn(f, [5])).toBe(15);
});
test('each call gets its own environment', () => {
  const g = new Env(null);
  const f = {
    params: ['k'],
    body: (e) => e.get('k'),
    closure: g,
  };
  callFn(f, [1]);
  expect(g.vars.has('k')).toBe(false);
  expect(callFn(f, [2])).toBe(2);
});`,
    hints: [
      'The new environment’s parent is the function’s `closure`, not `null` and not some global.',
      '`const env = new Env(f.closure);` then set each parameter: `env.vars.set(p, args[i])`.',
      'Finish with `return f.body(env);`.',
    ],
    walkthrough: `This is \`DripFunction.call\` with the interpreter stripped away.

\`\`\`js
function callFn(f, args) {
  const env = new Env(f.closure);
  f.params.forEach((p, i) => {
    env.vars.set(p, args[i]);
  });
  return f.body(env);
}
\`\`\`

- **\`new Env(f.closure)\`** is the line that makes closures work. The body can see its parameters (in \`env\`) and, one step up, everything visible where the function was made.
- **A new \`Env\` per call** keeps calls apart. If you wrote the parameters straight into \`f.closure\`, they would leak into the surrounding scope and stay there after the call. The third test checks that.
- **\`f.body(env)\`** stands in for \`executeFunctionBody\`: run the body with \`env\` as the current environment.`,
    wrong: [
      {
        code: `function callFn(f, args) {
  const env = new Env(null);
  f.params.forEach((p, i) => {
    env.vars.set(p, args[i]);
  });
  return f.body(env);
}`,
        why: 'With no parent, the body can only see its own parameters. Looking up `n` from the captured environment throws. The parent must be `f.closure`.',
      },
      {
        code: `function callFn(f, args) {
  f.params.forEach((p, i) => {
    f.closure.vars.set(p, args[i]);
  });
  return f.body(f.closure);
}`,
        why: 'This writes the parameters into the captured environment itself, so they leak out and survive the call. Every call needs its own new environment.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'When does a Drip function capture its environment?',
    options: [
      { t: 'Every time it is called', why: 'A call makes a new environment, but the parent it hangs off was fixed earlier.' },
      { t: 'When its `fn` declaration runs', correct: true, why: 'The interpreter passes `this.env`, the current environment, to `new DripFunction(...)` at that moment.' },
      { t: 'When the program starts', why: 'A nested function doesn’t exist until the call around it runs its declaration.' },
      { t: 'When it returns', why: 'By then the call’s environment has already been used. Capturing happens at creation.' },
    ],
  },
  {
    q: `What does this print?
\`\`\`
let x = "outer";
fn show() { print x; }
fn run() {
  let x = "inner";
  show();
}
run();
\`\`\``,
    options: [
      { t: '`inner`', why: 'That is dynamic scope: looking names up through the caller. Drip uses the environment where `show` was declared.' },
      { t: '`nil`', why: '`show` can see the global `x`, which is `"outer"`.' },
      { t: 'A runtime error', why: '`x` is defined in the globals, which `show` captured.' },
      { t: '`outer`', correct: true, why: '`show` was declared at the top level, so its calls hang off the globals, where `x` is `"outer"`.' },
    ],
  },
  {
    q: 'What keeps `makeCounter`’s call environment alive after the call returns?',
    options: [
      { t: 'The host stack frame of that call', why: 'That frame is gone once the call returns. It only held a reference anyway.' },
      { t: 'The returned function’s `closure` field refers to it', correct: true, why: 'An environment is a heap object, and it lives as long as something refers to it.' },
      { t: 'The globals copy it', why: 'Nothing is copied. The function refers to the original environment.' },
      { t: 'Nothing: `n` is recomputed each call', why: 'Then the counter couldn’t count. `n` really is kept.' },
    ],
  },
  {
    q: 'A function made inside a call is called. What is the parent of its new call environment?',
    options: [
      { t: 'The globals', why: 'Then it couldn’t see the locals of the call it was made in.' },
      { t: 'The environment of whoever called it', why: 'That would be dynamic scope.' },
      { t: 'The environment it captured when it was declared', correct: true, why: '`new Environment(this.closure)`: the captured environment, which is the call it was made in.' },
      { t: 'It has no parent', why: 'Then it couldn’t see any outer name, not even globals.' },
    ],
  },
  {
    q: 'Three functions are made in one Drip `for (let i = 1; i <= 3; i = i + 1)` loop and each prints `i`. Called after the loop, what do they print?',
    options: [
      { t: '`4`, `4`, `4`', correct: true, why: 'The desugared `for` declares `i` once. All three see it, and the loop left it at 4.' },
      { t: '`1`, `2`, `3`', why: 'That is JavaScript’s `let` behaviour. Drip’s `for` makes one `i`, not one per pass.' },
      { t: '`3`, `3`, `3`', why: 'The loop stops when `i <= 3` fails, which is when `i` is 4.' },
      { t: 'An error: `i` is out of scope', why: 'The functions captured the environment holding `i`, so it is still reachable.' },
    ],
  },
  {
    q: 'In the tree-walker, which of these is true of environments?',
    options: [
      { t: 'They live on the host stack and vanish when a call returns', why: 'They are heap objects. Only references to them sit in stack frames.' },
      { t: 'There is exactly one per function', why: 'There is one per *call* (and per block run), so recursive calls each get their own.' },
      { t: 'They are created only for functions that make closures', why: 'Every call makes one. The interpreter doesn’t check whether a closure will need it.' },
      { t: 'They can outlive the call that made them', correct: true, why: 'A captured environment stays alive as long as some function, or child environment, refers to it.' },
    ],
  },
];
