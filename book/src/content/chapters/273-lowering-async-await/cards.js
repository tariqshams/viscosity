// Cards for Lowering async/await: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'k-what': {
    q: 'What is the **continuation** of an expression?',
    a: 'The rest of the computation that is waiting for its value, written as a function of that value.',
  },
  'k-then': {
    q: 'In `get(\'a\').then((a) => use(a))`, what is the callback passed to `then`?',
    a: 'The continuation of `get(\'a\')`, written by hand: the promise calls it with the value once it is ready.',
  },
  'k-hole': {
    q: 'What is the continuation of `f(x)` in `1 + f(x)`?',
    a: '`(v) => 1 + v`: put the value in the hole where `f(x)` was.',
  },
  'cps-what': {
    q: 'In continuation-passing style, what does a function do with its result?',
    a: 'It passes it to its continuation, an extra argument `k`, instead of returning it.',
  },
  'cps-node': {
    q: 'Why is Node\'s `readFile(path, enc, callback)` an example of CPS?',
    a: 'It never returns the contents; it passes them to the callback, its continuation.',
  },
  'lower-what': {
    q: 'Cutting a straight-line async function (no loops or branches) at its two `await`s gives how many pieces?',
    a: 'Three: before the first await, between the two, and after the second.',
  },
  'lower-live': {
    q: 'In a state-machine (stackless) lowering of async functions, why must a variable that is live across an `await` be moved out of the stack frame?',
    a: 'The function returns to the event loop at each await, so its stack frame is popped; the variable has to live in a record that outlasts the call.',
  },
  'lower-ts': {
    q: 'In TypeScript\'s ES5 output, what does `_a.label` hold, and what does `return [4, p]` mean?',
    a: '`_a.label` is the state number; `[4, p]` tells the helper to yield `p` and resume at the next label.',
  },
};

export const examples = {
  'hand-lowered': {
    title: 'total, lowered by hand',
    code: `function total(get) {
  let state = 0, a, b;
  return new Promise((res, rej) => {
    function step(v) {
      console.log('state', state);
      switch (state) {
        case 0:
          state = 1;
          get('a').then(step, rej);
          return;
        case 1:
          a = v; state = 2;
          get('b').then(step, rej);
          return;
        case 2:
          b = v; res(a + b);
      }
    }
    step();
  });
}
const get = (k) =>
  Promise.resolve(k === 'a' ? 1 : 2);
total(get).then((t) =>
  console.log('total', t));
console.log('total() returned');`,
  },
};

export const exercises = {
  driver: {
    title: 'Write the async driver',
    prompt: 'A compiler can lower `async function f() { const a = await p; ... }` to a generator `function* () { const a = yield p; ... }` plus a **driver** that runs it. Write `run(genFn, ...args)`. It creates the generator with `genFn(...args)` and returns a promise. Each value the generator yields is awaited (it may be a promise or a plain value); when it fulfils, its value is sent back in with `next(value)`; when it rejects, the error is thrown into the generator with `throw(error)`, so a `try`/`catch` around the `yield` can catch it. When the generator finishes, the promise fulfils with its return value; if it throws, the promise rejects with that error. Like an async function, the body must run at once, up to its first `yield`.',
    starter: `function run(genFn, ...args) {
  const g = genFn(...args);
  // drive g with g.next(v) and
  // g.throw(e) as each value settles
  return Promise.resolve(undefined);
}`,
    solution: `function run(genFn, ...args) {
  const g = genFn(...args);
  return new Promise((res, rej) => {
    function step(method, v) {
      let r;
      try {
        r = g[method](v);
      } catch (e) {
        return rej(e);
      }
      if (r.done) return res(r.value);
      Promise.resolve(r.value).then(
        (x) => step('next', x),
        (e) => step('throw', e));
    }
    step('next', undefined);
  });
}`,
    tests: `test('two awaited values are added', async () => {
  const t = await run(function* () {
    const a = yield Promise.resolve(1);
    const b = yield Promise.resolve(2);
    return a + b;
  });
  expect(t).toBe(3);
});
test('arguments reach the generator', async () => {
  const t = await run(function* (x, y) {
    const a = yield x;
    return a * y;
  }, 4, 5);
  expect(t).toBe(20);
});
test('a rejection is thrown into the body', async () => {
  const t = await run(function* () {
    try {
      yield Promise.reject(new Error('no'));
      return 'missed';
    } catch (e) {
      return 'caught ' + e.message;
    }
  });
  expect(t).toBe('caught no');
});
test('an uncaught throw rejects the promise', async () => {
  let msg = 'none';
  await run(function* () {
    yield 1;
    throw new Error('boom');
  }).catch((e) => { msg = e.message; });
  expect(msg).toBe('boom');
});
test('runs at once, pauses at the first yield', async () => {
  const log = [];
  const p = run(function* () {
    log.push('start');
    yield 0;
    log.push('end');
  });
  log.push('after run');
  await p;
  expect(log).toEqual(['start', 'after run', 'end']);
});`,
    hints: [
      'You need a function you can call again each time a yielded value settles. That function is the continuation; call it `step`.',
      'Wrap everything in `new Promise((res, rej) => ...)`. Inside, `step(method, v)` calls `g[method](v)` (with `method` either `\'next\'` or `\'throw\'`) and looks at the `{ value, done }` it gets back.',
      'If `done`, call `res(value)`. Otherwise use `Promise.resolve(value).then((x) => step(\'next\', x), (e) => step(\'throw\', e))`. Put the `g[method](v)` call in a `try`, and `rej(e)` in its `catch`. Start with `step(\'next\', undefined)`.',
    ],
    walkthrough: `**How to think about it.** The generator is the state machine: it already knows how to run one piece and stop at the next \`yield\`, keeping its own state and variables. What it lacks is someone to wake it up. That someone is the driver, and its job is a loop that cannot be a loop: it must stop after each piece, give the event loop back, and continue when a promise settles. The way to "continue later" is a continuation, so write one function, \`step\`, and hand it to each promise's \`then\`.

**The solution, line by line.**

- \`const g = genFn(...args);\` creates the generator object. No body code runs yet; a generator starts paused.
- \`return new Promise((res, rej) => {\` makes the promise the caller gets back at once. \`res\` and \`rej\` are kept so the last piece can settle it, however much later that is.
- \`function step(method, v) {\` is the continuation. \`method\` is \`'next'\` to resume normally with a value, or \`'throw'\` to resume by throwing an error at the paused \`yield\`.
- \`let r; try { r = g[method](v); } catch (e) { return rej(e); }\` runs the next piece of the body. If the body throws and does not catch it, the exception comes out of \`g.next\` or \`g.throw\` here, and the async function's promise must reject with it.
- \`if (r.done) return res(r.value);\` handles the end: the body returned, so the promise fulfils with the returned value.
- \`Promise.resolve(r.value).then(...)\`: otherwise the body yielded something to wait for. \`Promise.resolve\` turns a plain value such as \`0\` into a promise and leaves a promise alone, so both cases work. When it fulfils, \`step('next', x)\` resumes the body with \`x\` as the value of the \`yield\` expression; when it rejects, \`step('throw', e)\` resumes it by throwing \`e\` at the \`yield\`, where a \`try\` can catch it.
- \`step('next', undefined);\` runs the first piece straight away, inside the \`new Promise\` callback, which runs synchronously; that is why "start" is logged before "after run".

**Common wrong attempts.**

- A plain \`while (!r.done) r = g.next(r.value);\` loop never waits: it sends the promise objects themselves back in, so \`a + b\` joins two promises into a string, and it gives no chance for anything else to run.
- Forgetting the second argument to \`then\`: a rejected promise then never resumes the body, so the \`catch\` never runs and the returned promise never settles.
- Forgetting the \`try\` around \`g[method](v)\`: an error thrown by the body escapes from inside a \`then\` callback and is lost, so the returned promise never rejects.
- Calling \`step\` from a \`setTimeout\` to start: then the body does not run at once, which async functions do; the last test checks this.`,
    wrong: [
      {
        code: `function run(genFn, ...args) {
  const g = genFn(...args);
  let r = g.next();
  while (!r.done) r = g.next(r.value);
  return Promise.resolve(r.value);
}`,
        why: 'It never waits for anything: each promise is sent back in as the value, so `a + b` joins two promise objects into a string.',
      },
      {
        code: `function run(genFn, ...args) {
  const g = genFn(...args);
  return new Promise((res, rej) => {
    function step(v) {
      const r = g.next(v);
      if (r.done) return res(r.value);
      Promise.resolve(r.value)
        .then(step);
    }
    step();
  });
}`,
        why: 'Rejections are ignored and thrown errors are lost, so the two error tests never see their promise settle.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'What is the continuation of `g(x)` in `console.log(g(x) + 1)`?',
    options: [
      {
        t: '`g`',
        why: 'That is the function being called, not the work waiting for its result.',
      },
      {
        t: '`(v) => console.log(v + 1)`',
        correct: true,
        why: 'Once g(x) has a value v, what is left is to add 1 and print it.',
      },
      {
        t: '`(v) => g(v)`',
        why: 'That would call g again; the continuation is what happens after g returns.',
      },
      {
        t: '`console.log`',
        why: 'Printing is part of it, but the + 1 must happen first.',
      },
    ],
  },
  {
    q: 'In continuation-passing style, a function...',
    options: [
      {
        t: 'returns its result as usual and also calls a callback',
        why: 'In CPS nothing is returned; the result goes only to the continuation.',
      },
      {
        t: 'must be async',
        why: 'CPS is plain synchronous code; it is only a way of passing results on.',
      },
      {
        t: 'passes its result to an extra argument instead of returning it',
        correct: true,
        why: 'That extra argument, k, says what to do next.',
      },
      {
        t: 'cannot be recursive',
        why: 'It can: a recursive CPS function passes on a new continuation that wraps the old one.',
      },
    ],
  },
  {
    q: 'In a state-machine (stackless) lowering, why does an async function keep its live variables in a record rather than on the stack?',
    options: [
      {
        t: 'Records are faster than stack slots',
        why: 'They are usually slower; they are needed, not chosen for speed.',
      },
      {
        t: 'The function returns at every await, so its stack frame does not survive until the next piece runs',
        correct: true,
        why: 'Only a heap record outlives the returns to the event loop.',
      },
      {
        t: 'JavaScript has no stack',
        why: 'It does: every call pushes a frame on the call stack.',
      },
      {
        t: 'To make the function run on another thread',
        why: 'Everything still runs on one thread; pieces take turns through the event loop.',
      },
    ],
  },
  {
    q: 'A straight-line async function has three `await`s, one after another. Cut at each `await`, how many pieces does it make?',
    options: [
      {
        t: '3',
        why: 'There is a piece before the first await too: four in total.',
      },
      {
        t: '1',
        why: 'One state could not tell the pieces apart.',
      },
      {
        t: '6',
        why: 'Each await adds one cut, so one more piece, not two.',
      },
      {
        t: '4',
        correct: true,
        why: 'Three cuts make four pieces: before, between (twice) and after.',
      },
    ],
  },
  {
    q: 'In Rust, `async fn big()` holds a `[u8; 100]` that it reads after its one `.await`; `async fn small()` only awaits. rustc 1.97 makes their futures 102 and 2 bytes. Why the difference?',
    options: [
      {
        t: '`big` holds a 100-byte buffer that is still needed after its `.await`, so the future stores it',
        correct: true,
        why: 'A future saves exactly what lives across an await, plus its state.',
      },
      {
        t: '`big` has more awaits',
        why: 'Both have one.',
      },
      {
        t: 'Rust copies every local into the future, used or not',
        why: 'Then the size would not depend on what is live; only values live across an await are kept.',
      },
      {
        t: 'Futures always reserve 100 bytes',
        why: '`small`’s future is 2 bytes.',
      },
    ],
  },
];
