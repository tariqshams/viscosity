// Chapter 40 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'async-what': {
    q: 'What does it mean that `setTimeout(fn, 1000)` is **asynchronous**?',
    a: 'It schedules `fn` to run later and returns at once, so the lines after it run straight away, before `fn`.',
  },
  'zero-delay': {
    q: 'Does `setTimeout(fn, 0)` call `fn` immediately?',
    a: 'No. `fn` runs in a later turn of the event loop, only after the code running now has finished.',
  },
  'no-interrupt': {
    q: 'A timer is due while a long `while` loop is running. When does its callback run?',
    a: 'Only after the loop (and the rest of the code running now) has finished: each piece of code runs to completion, and nothing interrupts it.',
  },
  'who-waits': {
    q: 'While JavaScript runs other code, who keeps track of a timer or a file being read?',
    a: 'The host (the browser or Node), outside your JavaScript. When the work is done, it puts a callback in the queue.',
  },
  'promise-what': {
    q: 'In one sentence: what is a promise?',
    a: 'An object that stands for a result that may not exist yet, which you can hold and attach callbacks to now.',
  },
  'promise-states': {
    q: 'What are a promise’s three states, and which of them are final?',
    a: 'Pending, fulfilled (with a value) and rejected (with a reason). Fulfilled and rejected are final: a promise settles once.',
  },
  'then-returns': {
    q: 'What does `p.then(f)` return, and why does that matter?',
    a: 'A new promise for whatever `f` returns (or throws), which is what lets you chain another `.then` or `.catch` after it.',
  },
  'then-later': {
    q: '`Promise.resolve(1).then(f); console.log(\'x\');`. Which runs first, `f` or the `console.log`?',
    a: 'The `console.log`. A `then` callback is never called straight away, even on a promise that has already settled.',
  },
};

export const examples = {
  'timer-order': {
    title: 'Timers, in the order they fall due',
    code: `const log = (s) => console.log(s);
log('start');
setTimeout(() => log('20 ms'), 20);
setTimeout(() => log('10 ms'), 10);
setTimeout(() => log('0 ms'), 0);
log('end');`,
  },
};

export const exercises = {
  promisify: {
    title: 'From a callback to a promise',
    prompt: `Old Node code often reports results through a callback: \`readLater(name, cb)\` (given in the starter) calls \`cb(null, text)\` a little later when the file exists, or \`cb(error)\` when it does not.

Write \`read(name)\`, which returns a **promise**: fulfilled with the text, or rejected with the error. Use \`new Promise((resolve, reject) => ...)\`.`,
    starter: `const files = { 'a.drip': 'print 1;' };

function readLater(name, cb) {
  setTimeout(() => {
    const text = files[name];
    if (text === undefined) {
      cb(new Error('no file ' + name));
    } else {
      cb(null, text);
    }
  }, 10);
}

function read(name) {
  // your code here
}`,
    solution: `const files = { 'a.drip': 'print 1;' };

function readLater(name, cb) {
  setTimeout(() => {
    const text = files[name];
    if (text === undefined) {
      cb(new Error('no file ' + name));
    } else {
      cb(null, text);
    }
  }, 10);
}

function read(name) {
  return new Promise((ok, fail) => {
    readLater(name, (err, text) => {
      if (err) fail(err);
      else ok(text);
    });
  });
}`,
    tests: `test('fulfils with the text', () => {
  return read('a.drip').then((t) => {
    expect(t).toBe('print 1;');
  });
});
test('rejects when the file is missing', () => {
  return read('b.drip').then(
    () => { throw new Error('it fulfilled'); },
    (e) => expect(e.message).toBe('no file b.drip'),
  );
});
test('returns a promise straight away', () => {
  const p = read('a.drip');
  expect(typeof p.then).toBe('function');
  return p;
});`,
    hints: [
      '`read` must return something at once, before the file has been read: that is the promise.',
      'Inside `new Promise((resolve, reject) => { ... })`, call `readLater(name, ...)` with a callback of your own; that callback receives `(err, text)`.',
      'In your callback: `if (err) reject(err); else resolve(text);` (whatever you named those two). And do not forget the `return` in front of `new Promise`.',
    ],
    walkthrough: `**How to think about it.** \`readLater\` already does the waiting; it just reports the answer the old way, by calling you back. A promise is the new way of reporting the same answer. So \`read\` makes a promise, starts \`readLater\` inside it, and when the callback fires, turns "error or text" into "reject or resolve". This is called **promisifying** a function, and it is exactly how promise-based APIs such as \`node:fs/promises\` sit on top of older callback ones.

**The solution, line by line.**

- \`function read(name) {\` takes the file name.
- \`return new Promise((ok, fail) => {\` makes a pending promise and returns it at once. The function inside runs straight away and is handed the promise's \`resolve\` and \`reject\` functions, which we name \`ok\` and \`fail\` here (any names work).
- \`readLater(name, (err, text) => {\` starts the old function, passing our own callback; \`readLater\` returns immediately, and the callback runs about 10 ms later, from the event loop.
- \`if (err) fail(err);\` turns an error into a rejection: whoever holds the promise gets it in their \`catch\` (or as the second callback of \`then\`).
- \`else ok(text);\` turns success into fulfilment with the text.
- The closing brackets end the callback, the function given to \`new Promise\`, and \`read\`.

The tests return promises, and the runner waits for them: the first test's \`then\` runs once the file has been "read", 10 ms later.

**Common wrong attempts.**

- Leaving out \`return\`: the promise is made but \`read\` returns \`undefined\`, so \`read(...).then\` throws a \`TypeError\`.
- Calling \`resolve(text)\` whatever happens: a missing file fulfils with \`undefined\` instead of rejecting, so the caller never learns about the error.
- Trying \`return text;\` inside the callback: that returns from the callback, to \`readLater\`, which ignores it; the only way out of a callback is to call \`resolve\`.`,
    wrong: [
      {
        code: `const files = { 'a.drip': 'print 1;' };

function readLater(name, cb) {
  setTimeout(() => {
    const text = files[name];
    if (text === undefined) {
      cb(new Error('no file ' + name));
    } else {
      cb(null, text);
    }
  }, 10);
}

function read(name) {
  return readLater(name, (e, text) => {
    return text;
  });
}`,
        why: '`readLater` returns nothing, and `return text` only returns from the callback, so `read(...)` is `undefined` and `.then` on it throws.',
      },
      {
        code: `const files = { 'a.drip': 'print 1;' };

function readLater(name, cb) {
  setTimeout(() => {
    const text = files[name];
    if (text === undefined) {
      cb(new Error('no file ' + name));
    } else {
      cb(null, text);
    }
  }, 10);
}

function read(name) {
  return new Promise((resolve) => {
    readLater(name, (err, text) => {
      resolve(text);
    });
  });
}`,
        why: 'A missing file is fulfilled with `undefined` instead of rejected, so the rejection test fails.',
      },
    ],
  },
  later: {
    optional: true,
    title: 'A tiny promise',
    prompt: `Build \`Later\`, a tiny promise (without the "later turn of the loop" part, which the next chapter adds). A new \`Later\` is pending.

- \`p.then(f)\`: if \`p\` has already been resolved, call \`f(value)\` at once; otherwise remember \`f\`, to call later.
- \`p.resolve(v)\`: if \`p\` is still pending, store \`v\`, mark \`p\` as resolved, and call every remembered callback with \`v\`, in the order they were added. If \`p\` was already resolved, do nothing: a promise settles once.`,
    starter: `class Later {
  constructor() {
    this.waiting = [];
  }
  then(f) {
    this.waiting.push(f);
  }
  resolve(v) {
    // your code here
  }
}`,
    solution: `class Later {
  constructor() {
    this.done = false;
    this.value = undefined;
    this.waiting = [];
  }
  then(f) {
    if (this.done) f(this.value);
    else this.waiting.push(f);
  }
  resolve(v) {
    if (this.done) return;
    this.done = true;
    this.value = v;
    for (const f of this.waiting) f(v);
    this.waiting = [];
  }
}`,
    tests: `test('nothing runs before resolve', () => {
  const p = new Later();
  const got = [];
  p.then((v) => got.push(v));
  expect(got).toEqual([]);
});
test('resolve calls the waiting callbacks in order', () => {
  const p = new Later();
  const got = [];
  p.then((v) => got.push('a' + v));
  p.then((v) => got.push('b' + v));
  p.resolve(1);
  expect(got).toEqual(['a1', 'b1']);
});
test('then after resolve still gets the value', () => {
  const p = new Later();
  p.resolve(7);
  let got = null;
  p.then((v) => { got = v; });
  expect(got).toBe(7);
});
test('a promise settles only once', () => {
  const p = new Later();
  const got = [];
  p.then((v) => got.push(v));
  p.resolve(1);
  p.resolve(2);
  p.then((v) => got.push(v));
  expect(got).toEqual([1, 1]);
});`,
    hints: [
      'A `Later` needs to remember three things: whether it has been resolved yet, the value it was resolved with, and the callbacks still waiting.',
      'In `resolve`, first check whether it was already resolved (and leave if so); then store the value, mark it done and call each waiting callback with a `for...of` loop.',
      '`then` has two cases: `if (this.done) f(this.value);` for a promise that has already settled, `else this.waiting.push(f);` for one still pending.',
    ],
    walkthrough: `**How to think about it.** A promise is a box that is empty at first and filled exactly once. Two kinds of people come to the box: those who arrive *before* it is filled (they have to leave a note saying "call me", which is the list of waiting callbacks) and those who arrive *after* (the value is already there, so they can be handed it at once). So the object needs three pieces of state: a flag saying whether it is filled, the value, and the list of notes. Then each method is a short case analysis.

**The solution, line by line.**

- \`constructor() {\` sets up a new, pending \`Later\`.
- \`  this.done = false;\` records that it has not been resolved yet.
- \`  this.value = undefined;\` is where the value will go (nothing yet).
- \`  this.waiting = [];\` is the list of callbacks that arrived too early.
- \`then(f) {\` is called by anyone who wants the value.
- \`  if (this.done) f(this.value);\` handles someone who arrives late: the value is already known, so call them with it now.
- \`  else this.waiting.push(f);\` handles someone who arrives early: remember \`f\` for when the value comes.
- \`resolve(v) {\` fills the box.
- \`  if (this.done) return;\` makes a second \`resolve\` do nothing, which is the "settles once" rule: without it, a second call would change the value and call everyone again.
- \`  this.done = true;\` and \`  this.value = v;\` record that it is now filled, and with what.
- \`  for (const f of this.waiting) f(v);\` calls every early arrival, in the order they arrived, because \`push\` added them to the end of the array.
- \`  this.waiting = [];\` empties the list: those callbacks have had their call, and the array is no longer needed.

For the test with two \`resolve\`s: the first fills the box with \`1\` and calls the waiting callback, so \`got\` is \`[1]\`; the second \`resolve(2)\` returns at once; and the late \`then\` is handed the stored \`1\`, so \`got\` ends as \`[1, 1]\`.

**How this differs from a real promise.** A real promise never calls a callback from inside \`then\` or \`resolve\`: it puts the call in a queue, to run once the code running now has finished. That is why \`Promise.resolve(5).then(...)\` prints after the next line. The next chapter shows that queue.

**Common wrong attempts.**

- Calling the waiting callbacks in \`resolve\` but forgetting the late case in \`then\`: a callback added after \`resolve\` is pushed onto a list that will never be called again, so it never runs.
- Leaving out the \`done\` check at the top of \`resolve\`: a second \`resolve\` overwrites the value and calls every waiting callback a second time.`,
    wrong: [
      {
        code: `class Later {
  constructor() {
    this.waiting = [];
  }
  then(f) {
    this.waiting.push(f);
  }
  resolve(v) {
    for (const f of this.waiting) f(v);
  }
}`,
        why: 'A callback added with `then` after `resolve` is only pushed onto the list, so it is never called; and a second `resolve` calls everyone again.',
      },
      {
        code: `class Later {
  constructor() {
    this.done = false;
    this.waiting = [];
  }
  then(f) {
    if (this.done) f(this.value);
    else this.waiting.push(f);
  }
  resolve(v) {
    this.done = true;
    this.value = v;
    for (const f of this.waiting) f(v);
  }
}`,
        why: 'There is no check that it was already resolved, so `resolve(2)` after `resolve(1)` calls the waiting callbacks again with 2: the promise settles twice.',
      },
    ],
  },
};

export const quiz = [
  {
    q: `What does this print?
\`\`\`
console.log('1');
setTimeout(() => console.log('2'), 0);
console.log('3');
\`\`\``,
    options: [
      {
        t: '`1`, `2`, `3`',
        why: 'A delay of 0 does not mean now: the callback waits until the code running now has finished.',
      },
      {
        t: '`1`, `3`, `2`',
        correct: true,
        why: 'The whole snippet runs to the end first, printing 1 and 3; then the event loop runs the timer callback.',
      },
      {
        t: '`2`, `1`, `3`',
        why: 'The callback cannot run before the code that scheduled it has even finished.',
      },
    ],
  },
  {
    q: `What happens here?
\`\`\`
try {
  setTimeout(() => {
    throw new Error('x');
  }, 0);
} catch (e) {
  console.log('caught');
}
\`\`\``,
    options: [
      {
        t: 'It prints `caught`',
        why: 'The `try` block has finished long before the callback runs, so its `catch` is no longer on the call stack.',
      },
      {
        t: 'The error is not caught, and Node stops the program with `Error: x`',
        correct: true,
        why: 'The callback throws in a later turn of the loop, where no `catch` is waiting.',
      },
      {
        t: 'Nothing: errors in callbacks are ignored',
        why: 'They are not ignored; with no `catch` to stop it, the error ends the program.',
      },
    ],
  },
  {
    q: `What does this print?
\`\`\`
Promise.resolve(2)
  .then((n) => n + 1)
  .then((n) => { n * 2; })
  .then((m) => console.log(m));
\`\`\``,
    options: [
      {
        t: '`6`',
        why: 'The second callback has braces and no `return`, so it returns `undefined`, not `6`.',
      },
      {
        t: '`3`',
        why: 'Each `then` passes on its own callback’s result, not the one before.',
      },
      {
        t: '`undefined`',
        correct: true,
        why: 'With braces, `n * 2` is worked out and thrown away; the callback returns `undefined`, and that is what the last step receives.',
      },
    ],
  },
  {
    q: 'A promise was rejected. Later, `p.then(f)` is called on it, with no second argument. What happens to `f`?',
    options: [
      {
        t: 'It is called with the rejection reason',
        why: '`then`’s first callback is only for fulfilment; a reason goes to `catch`.',
      },
      {
        t: 'It is never called; the new promise `then` returns is rejected with the same reason',
        correct: true,
        why: 'Without a rejection callback, the rejection passes straight down the chain, to the next `catch`.',
      },
      {
        t: 'It is called with `undefined`',
        why: 'A rejected promise never calls fulfilment callbacks at all.',
      },
    ],
  },
  {
    q: 'What is a real difference between the JavaScript and the Java versions of “run this later”?',
    options: [
      {
        t: 'Java runs the callback on a second thread, which can run at the same time as other code',
        correct: true,
        why: 'JavaScript runs one piece of code at a time on one thread; Java’s scheduler uses a thread of its own.',
      },
      {
        t: 'Java cannot run anything later',
        why: 'It can: `schedule` runs the callback after the delay.',
      },
      {
        t: 'JavaScript’s version blocks the program until the delay is over',
        why: 'That is C’s `sleep`. `setTimeout` returns at once.',
      },
    ],
  },
];
