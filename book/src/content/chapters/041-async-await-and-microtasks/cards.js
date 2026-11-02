// Cards for “async, await and the microtask queue” (split from chapter 40).
// Keys are stable ids: never rename them.
//
// The runner waits for timers and promises, so the example and the core
// exercise use real async code; the extra exercise models the two queues.

export const prompts = {
  'async-returns': {
    q: 'What does calling `async function f() { return 1; }` give you: `1`, or something else?',
    a: 'A promise, fulfilled with `1`. An async function always returns a promise.',
  },
  'body-runs': {
    q: 'When you call an async function, how much of its body runs straight away?',
    a: 'Everything up to its first `await`; the rest runs later, after the awaited promise settles.',
  },
  'await-what': {
    q: 'What does `await p` give back if `p` is rejected?',
    a: 'Nothing: it throws `p`’s reason at that line, so a surrounding `try`/`catch` can catch it.',
  },
  'forgot-await': {
    q: '`const n = count();` where `count` is async. Why does `n + 1` print `[object Promise]1`?',
    a: 'Without `await`, `n` is the promise, not its value, and `+` turns the promise into text. Write `await count()`.',
  },
  'micro-what': {
    q: 'Which callbacks wait in the **microtask** queue?',
    a: 'Promise callbacks (`then`, `catch`, `finally`, and the rest of an async function after `await`), and functions passed to `queueMicrotask`.',
  },
  'micro-first': {
    q: 'A timer callback and a promise callback are both queued while the same code runs. Which runs first?',
    a: 'The promise callback: after each task, every microtask runs before the next task (such as the timer).',
  },
  'micro-drain': {
    q: 'A microtask queues another microtask. Does the new one run before the next task?',
    a: 'Yes. The loop keeps running microtasks until the microtask queue is completely empty, including ones added along the way.',
  },
  'micro-starve': {
    q: 'Why can an endless chain of microtasks stop timers from ever firing?',
    a: 'Timers are tasks, and the next task is only taken once the microtask queue is empty, which never happens.',
  },
};

export const examples = {
  'await-real': {
    title: 'await, for real',
    code: `function wait(ms) {
  return new Promise((r) => {
    setTimeout(r, ms);
  });
}

async function load() {
  console.log('1 start');
  await wait(10);
  console.log('3 resumed');
  return 'tree';
}

load().then((v) => console.log('4', v));
console.log('2 caller');`,
  },
};

export const exercises = {
  sizes: {
    title: 'Read them in turn',
    prompt: `\`read(name)\` (given in the starter) returns a promise for a file's text, rejected if the file does not exist.

Write an **async** function \`sizes(names)\` that reads the files one after another, in order, and returns an array of their lengths; for a file that cannot be read, put \`-1\` in its place and carry on. For example \`await sizes(['a', 'zzz', 'b'])\` is \`[6, -1, 2]\`.`,
    starter: `const files = { a: 'let x;', b: 'x;' };

function read(name) {
  return new Promise((ok, fail) => {
    setTimeout(() => {
      const t = files[name];
      if (t !== undefined) ok(t);
      else fail(new Error(name));
    }, 5);
  });
}

async function sizes(names) {
  const out = [];
  // your code here
  return out;
}`,
    solution: `const files = { a: 'let x;', b: 'x;' };

function read(name) {
  return new Promise((ok, fail) => {
    setTimeout(() => {
      const t = files[name];
      if (t !== undefined) ok(t);
      else fail(new Error(name));
    }, 5);
  });
}

async function sizes(names) {
  const out = [];
  for (const n of names) {
    try {
      const text = await read(n);
      out.push(text.length);
    } catch (e) {
      out.push(-1);
    }
  }
  return out;
}`,
    tests: `test('reads every file, in order', async () => {
  expect(await sizes(['a', 'b'])).toEqual([6, 2]);
});
test('a missing file gives -1', async () => {
  expect(await sizes(['a', 'zzz', 'b']))
    .toEqual([6, -1, 2]);
});
test('no names, no sizes', async () => {
  expect(await sizes([])).toEqual([]);
});
test('it returns a promise', () => {
  const p = sizes(['a']);
  expect(typeof p.then).toBe('function');
  return p;
});`,
    hints: [
      'Loop over the names with `for...of`, and inside the loop wait for each file with `await read(n)`.',
      'A rejected promise makes `await` throw, so wrap the `await` and the `push` in `try { ... } catch (e) { ... }`.',
      'In the `try`: `const text = await read(n); out.push(text.length);`. In the `catch`: `out.push(-1);`.',
    ],
    walkthrough: `**How to think about it.** Written without promises, this would be an ordinary loop: for each name, read the file, push its length, and if reading fails, push \`-1\`. \`async\` and \`await\` let you write exactly that loop, with \`await\` in front of the one step that takes time, and \`try\`/\`catch\` for the step that can fail, because awaiting a rejected promise throws.

**The solution, line by line.**

- \`async function sizes(names) {\` makes it an async function: it returns a promise at once, and may use \`await\` inside.
- \`const out = [];\` collects the answers.
- \`for (const n of names) {\` takes the names in order.
- \`try {\` starts the part that may fail.
- \`const text = await read(n);\` pauses \`sizes\` until this file's promise settles, then gives its text. Other code (and the timer inside \`read\`) runs meanwhile; the loop does not move on until the file is in.
- \`out.push(text.length);\` records its length.
- \`} catch (e) {\` is reached when \`read(n)\` was rejected: \`await\` threw the error at that line, skipping the \`push\` above.
- \`out.push(-1);\` records the failure, and the loop carries on with the next name.
- \`return out;\` fulfils the promise \`sizes\` returned with the finished array, which is what \`await sizes(...)\` in the tests receives.

**Common wrong attempts.**

- Leaving out \`await\`: \`text\` is then a promise, and a promise has no \`length\`, so every entry is \`undefined\`, and a missing file is never noticed.
- No \`try\`/\`catch\`: the first missing file throws out of \`sizes\`, so its promise is rejected and you get no array at all.
- \`names.map(async (n) => ...)\`: this makes an array of promises, not of numbers; \`await\` inside an arrow only pauses that arrow, not \`sizes\`.`,
    wrong: [
      {
        code: `const files = { a: 'let x;', b: 'x;' };

function read(name) {
  return new Promise((ok, fail) => {
    setTimeout(() => {
      const t = files[name];
      if (t !== undefined) ok(t);
      else fail(new Error(name));
    }, 5);
  });
}

async function sizes(names) {
  return names.map(async (n) => {
    try {
      const text = await read(n);
      return text.length;
    } catch (e) {
      return -1;
    }
  });
}`,
        why: '`map` with an async arrow makes an array of *promises*, not numbers: the `await` pauses only each arrow, not `sizes`.',
      },
      {
        code: `const files = { a: 'let x;', b: 'x;' };

function read(name) {
  return new Promise((ok, fail) => {
    setTimeout(() => {
      const t = files[name];
      if (t !== undefined) ok(t);
      else fail(new Error(name));
    }, 5);
  });
}

async function sizes(names) {
  const out = [];
  for (const n of names) {
    const text = await read(n);
    out.push(text.length);
  }
  return out;
}`,
        why: 'With no `try`/`catch`, the missing file `zzz` rejects the whole `sizes` promise instead of giving `-1`.',
      },
    ],
  },
  twoQueues: {
    optional: true,
    title: 'An event loop with two queues',
    prompt: `Write \`makeLoop()\`. It returns an object with three methods:

- \`task(fn)\`: add \`fn\` to the end of the **task** queue.
- \`micro(fn)\`: add \`fn\` to the end of the **microtask** queue.
- \`run()\`: until the task queue is empty, take the oldest task and call it; then, before the next task, call microtasks, oldest first, until the microtask queue is **completely** empty (a microtask may queue more microtasks, and they must run too).

Tasks and microtasks may themselves call \`task\` and \`micro\`.`,
    starter: `function makeLoop() {
  const tasks = [];
  return {
    task(fn) { tasks.push(fn); },
    micro(fn) { tasks.push(fn); },
    run() {
      while (tasks.length > 0) {
        tasks.shift()();
      }
    },
  };
}`,
    solution: `function makeLoop() {
  const tasks = [];
  const micros = [];
  return {
    task(fn) { tasks.push(fn); },
    micro(fn) { micros.push(fn); },
    run() {
      while (tasks.length > 0) {
        tasks.shift()();
        while (micros.length > 0) {
          micros.shift()();
        }
      }
    },
  };
}`,
    tests: `test('tasks run oldest first', () => {
  const L = makeLoop();
  const log = [];
  L.task(() => {
    log.push('A');
    L.task(() => log.push('B'));
    L.task(() => log.push('C'));
  });
  L.run();
  expect(log).toEqual(['A', 'B', 'C']);
});
test('a microtask runs before the next task', () => {
  const L = makeLoop();
  const log = [];
  L.task(() => {
    log.push('A');
    L.task(() => log.push('timer'));
    L.micro(() => log.push('then'));
  });
  L.run();
  expect(log).toEqual(['A', 'then', 'timer']);
});
test('microtasks added by microtasks run too', () => {
  const L = makeLoop();
  const log = [];
  L.task(() => {
    L.task(() => log.push('task'));
    L.micro(() => {
      log.push('m1');
      L.micro(() => log.push('m2'));
    });
  });
  L.run();
  expect(log).toEqual(['m1', 'm2', 'task']);
});
test('microtasks run after every task', () => {
  const L = makeLoop();
  const log = [];
  L.task(() => {
    L.task(() => {
      log.push('t2');
      L.micro(() => log.push('m2'));
    });
    L.task(() => log.push('t3'));
  });
  L.run();
  expect(log).toEqual(['t2', 'm2', 't3']);
});`,
    hints: [
      'You need a second array: one queue for tasks and one for microtasks.',
      'In `run`, after each task, empty the microtask queue before going round for the next task. A `while` loop that asks "is it empty yet?" each time also catches microtasks added while you work.',
      'Inside `while (tasks.length > 0) { ... }`, call `tasks.shift()()`, then `while (micros.length > 0) micros.shift()();`.',
    ],
    walkthrough: `**How to think about it.** Start from the event loop of the last chapter (one queue, run oldest first) and add the one new rule: microtasks jump the line, and not one at a time but all of them, after every task. So there are two arrays, and the shape of \`run\` is a loop inside a loop: the outer one walks through tasks, and after each task the inner one empties the microtask queue. Because a microtask can queue another, the inner loop must keep asking "is it empty yet?" rather than running a fixed list.

**The solution, line by line.**

- \`const tasks = [];\` and \`const micros = [];\` are the two queues. They live in the closure, so only the three methods can reach them.
- \`task(fn) { tasks.push(fn); },\` adds a task at the back of its queue.
- \`micro(fn) { micros.push(fn); },\` adds a microtask at the back of the other queue.
- \`while (tasks.length > 0) {\` keeps going while any task is left, including tasks queued by earlier ones.
- \`tasks.shift()();\` takes the oldest task off the front (\`shift()\` removes and returns the first element) and calls it straight away; the second pair of brackets is the call.
- \`while (micros.length > 0) {\` then empties the microtask queue completely, asking again each time round, so a microtask queued by a microtask is still run now.
- \`micros.shift()();\` takes and runs the oldest microtask.

In the third test, the first task queues a task and a microtask. When it ends, the inner loop runs \`m1\`, which queues \`m2\`; the inner loop asks again, finds \`m2\` and runs it; only then does the outer loop take the queued task. So the log is \`m1\`, \`m2\`, \`task\`, which is exactly how a real promise chain behaves next to a timer.

**Common wrong attempts.**

- One shared queue for both (the starter): microtasks wait behind tasks that were queued earlier, so \`timer\` prints before \`then\`.
- Running the microtasks that were waiting *when the task ended*, by looping over a copy: \`m2\`, added while \`m1\` runs, is left for later, after the next task.
- Running all tasks first and the microtasks at the very end: microtasks must run after *every* task, not once.`,
    wrong: [
      {
        code: `function makeLoop() {
  const tasks = [];
  const micros = [];
  return {
    task(fn) { tasks.push(fn); },
    micro(fn) { micros.push(fn); },
    run() {
      while (tasks.length > 0) {
        tasks.shift()();
        const now = micros.splice(0);
        for (const m of now) m();
      }
    },
  };
}`,
        why: 'This runs only the microtasks that were waiting when the task ended. One queued by a microtask (`m2`) is left until after the next task.',
      },
      {
        code: `function makeLoop() {
  const tasks = [];
  const micros = [];
  return {
    task(fn) { tasks.push(fn); },
    micro(fn) { micros.push(fn); },
    run() {
      while (tasks.length > 0) {
        tasks.shift()();
      }
      while (micros.length > 0) {
        micros.shift()();
      }
    },
  };
}`,
        why: 'Every task runs before any microtask, so `timer` comes before `then`. Microtasks must be emptied after each task.',
      },
    ],
  },
};

export const quiz = [
  {
    q: "What does this print?\n```\nsetTimeout(() => console.log('T'));\nPromise.resolve()\n  .then(() => console.log('P'));\nconsole.log('S');\n```",
    options: [
      { t: '`T`, `P`, `S`', why: 'Nothing queued can run before the code that queued it has finished, so `S` is first.' },
      { t: '`S`, `T`, `P`', why: 'The timer was queued first, but it is a task; the promise callback is a microtask, and microtasks run before the next task.' },
      { t: '`S`, `P`, `T`', correct: true, why: 'The code finishes (`S`), then every microtask runs (`P`), then the next task, the timer (`T`).' },
    ],
  },
  {
    q: 'What is `f()` here?\n```\nasync function f() {\n  return 5;\n}\n```',
    options: [
      { t: 'A promise fulfilled with `5`', correct: true, why: 'An async function always returns a promise; `return 5` fulfils it with 5.' },
      { t: 'The number `5`', why: 'Only `await f()` (inside another async function) gives the number itself.' },
      { t: '`undefined`', why: 'The function does return something: a promise for its result.' },
    ],
  },
  {
    q: "What does this print?\n```\nasync function f() {\n  console.log('1');\n  await null;\n  console.log('3');\n}\nf();\nconsole.log('2');\n```",
    options: [
      { t: '`1`, `3`, `2`', why: '`await` pauses `f`, even for a value that is ready, and the caller carries on first.' },
      { t: '`1`, `2`, `3`', correct: true, why: 'The body runs at once up to the `await`, printing 1; `f()` returns, the caller prints 2; then the rest of `f` runs as a microtask.' },
      { t: '`2`, `1`, `3`', why: 'Calling an async function runs its body straight away, up to the first `await`, so 1 comes first.' },
    ],
  },
  {
    q: 'A function without `async` contains `await fetchData()`. What happens?',
    options: [
      { t: 'It waits, like in an async function', why: '`await` is only allowed in async functions and at the top level of modules.' },
      { t: 'The file is refused with a `SyntaxError` before any of it runs', correct: true, why: 'Node will not even start it (in a module the message is “Unexpected reserved word”), and tsc reports error TS1308.' },
      { t: '`await` is ignored, and the promise is used as the value', why: 'It is not ignored: the code does not compile at all.' },
    ],
  },
  {
    q: 'What is a real difference between async functions in JavaScript and in Python?',
    options: [
      { t: 'Python has no `await` keyword', why: 'Python has both `async def` and `await`, used much as in JavaScript.' },
      { t: 'In Python, calling an async function runs none of its body until it is awaited; in JavaScript the body runs at once, up to the first `await`', correct: true, why: 'Python makes a coroutine that does nothing until something awaits or schedules it.' },
      { t: 'Python runs async functions on several threads at once', why: '`asyncio` runs them on one thread with an event loop, like JavaScript.' },
    ],
  },
];
