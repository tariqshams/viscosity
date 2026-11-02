// Chapter 109 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'co-what': {
    q: 'What is a **coroutine**?',
    a: 'A function that can suspend itself part-way through and later be resumed from the same point, with its local variables intact.',
  },
  'co-asym': {
    q: 'Generators are **asymmetric** coroutines. What does that mean?',
    a: 'When they yield, control always goes back to whoever resumed them.',
  },
  'co-send': {
    q: 'In Python, what does `gen.send(v)` do to a generator paused at `x = yield`?',
    a: 'It resumes the generator, and the paused `yield` evaluates to `v`, so `x` becomes `v`.',
  },
  'sl-depth': {
    q: 'Why can a stackless coroutine only pause in its own body?',
    a: 'It saves only its own frame (a state number and its variables); there is nowhere to keep the frames of functions it called.',
  },
  'sf-switch': {
    q: 'What does switching between two stackful coroutines have to save and load?',
    a: 'The CPU registers, including the stack pointer; the frames themselves stay on each coroutine\'s own stack.',
  },
  'sl-mark': {
    q: 'In JavaScript, how does a generator let a generator it calls pause on its behalf?',
    a: 'With `yield*` (or `await`, for async functions): every level of the chain must be marked.',
  },
  'gt-what': {
    q: 'What makes a thread a **green thread**?',
    a: 'It is scheduled by the language runtime, not by the operating system.',
  },
  'gt-go': {
    q: 'How big is a new goroutine\'s stack in Go 1.24, and what happens when it fills up?',
    a: 'It starts at the 2,048-byte minimum (stackMin), and is copied to a stack twice the size when it runs out.',
  },
};

export const examples = {
  'round-robin': {
    title: 'Green threads in eight lines',
    code: `function* worker(name, n) {
  for (let i = 1; i <= n; i++) {
    console.log(name, i);
    yield; // let someone else run
  }
}
const ready = [worker('A', 3),
  worker('B', 2)];
while (ready.length > 0) {
  const t = ready.shift();
  if (!t.next().done) ready.push(t);
}`,
  },
};

export const exercises = {
  scheduler: {
    title: 'A round-robin scheduler',
    prompt: 'Write `schedule(tasks)`. `tasks` is an array of generator objects (already created). Run them **round-robin**: take the first task in the queue, resume it once with `next()`, and if it is not finished put it at the back of the queue; repeat until the queue is empty. Return an array of every value the tasks yielded, in the order they were yielded. (A task\'s `return` value is not included.)',
    starter: `function schedule(tasks) {
  const out = [];
  // run each task to the end, in turn
  return out;
}`,
    solution: `function schedule(tasks) {
  const queue = [...tasks];
  const out = [];
  while (queue.length > 0) {
    const t = queue.shift();
    const r = t.next();
    if (r.done) continue;
    out.push(r.value);
    queue.push(t);
  }
  return out;
}`,
    tests: `function* g(name, n) {
  for (let i = 1; i <= n; i++) yield name + i;
}
test('two tasks take turns', () => {
  expect(schedule([g('a', 2), g('b', 2)]))
    .toEqual(['a1', 'b1', 'a2', 'b2']);
});
test('a longer task keeps running alone', () => {
  expect(schedule([g('a', 3), g('b', 1)]))
    .toEqual(['a1', 'b1', 'a2', 'a3']);
});
test('return values are not collected', () => {
  function* r() { yield 1; return 99; }
  expect(schedule([r()])).toEqual([1]);
});
test('no tasks, no output', () => {
  expect(schedule([])).toEqual([]);
});
test('a task that never yields is dropped', () => {
  function* none() { return 5; }
  expect(schedule([none(), g('b', 1)]))
    .toEqual(['b1']);
});`,
    hints: [
      'Keep a queue of tasks. One "turn" is: take a task from the front and call its `next()` once.',
      'Look at what `next()` returns: `{ value, done }`. If `done` is true the task has finished, so it is not put back, and its value (the return value) is not collected.',
      'Loop `while (queue.length > 0)`: `const t = queue.shift(); const r = t.next(); if (r.done) continue; out.push(r.value); queue.push(t);`.',
    ],
    walkthrough: `**How to think about it.** Each generator is a coroutine; \`next()\` resumes it until its next \`yield\`, where it pauses itself and hands out a value. A scheduler only has to decide whose turn it is. Round-robin is the fairest simple rule: everyone gets one turn, in a fixed order, and whoever still has work goes to the back of the line. A queue (an array used with \`shift\` and \`push\`) is that line.

**The solution, line by line.**

- \`const queue = [...tasks];\` copies the array, so the caller's array is not emptied by our \`shift\` calls.
- \`const out = [];\` will collect the yielded values in order.
- \`while (queue.length > 0) {\` runs until every task has finished.
- \`const t = queue.shift();\` takes the task at the front of the line.
- \`const r = t.next();\` gives it one turn: it runs until it yields (or returns).
- \`if (r.done) continue;\` means the task finished on this turn. \`r.value\` is then its return value, which the exercise says not to collect, and the task is not put back.
- \`out.push(r.value);\` records the value it yielded.
- \`queue.push(t);\` sends it to the back of the line, so every other task runs before it runs again.
- \`return out;\` hands back the whole interleaved record.

**Common wrong attempts.**

- Running each task to the end before starting the next (a \`for\` loop over tasks with an inner \`while (!r.done)\`) gives \`a1, a2, b1, b2\`: the tasks never take turns, which is the whole point of green threads.
- Pushing \`r.value\` before checking \`r.done\` collects the return values too (the \`99\` in the third test) or an \`undefined\` from a finished task.
- Putting a task back even when it is done makes the loop call \`next()\` on finished generators forever, collecting \`undefined\` each time; the loop never ends.`,
    wrong: [
      {
        code: `function schedule(tasks) {
  const out = [];
  for (const t of tasks) {
    let r = t.next();
    while (!r.done) {
      out.push(r.value);
      r = t.next();
    }
  }
  return out;
}`,
        why: 'Each task runs to the end before the next starts, so the result is a1, a2, b1, b2: nobody takes turns.',
      },
      {
        code: `function schedule(tasks) {
  const queue = [...tasks];
  const out = [];
  while (queue.length > 0) {
    const t = queue.shift();
    const r = t.next();
    out.push(r.value);
    if (!r.done) queue.push(t);
  }
  return out;
}`,
        why: 'It records the value of the finishing turn too, which is the return value (99) or undefined.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Why does `xs.forEach((x) => { yield x; })` inside a generator fail?',
    options: [
      {
        t: 'forEach is too slow for generators',
        why: 'Speed has nothing to do with it; the program does not even parse.',
      },
      {
        t: 'The arrow function is not a generator, and a stackless generator can only pause in its own body',
        correct: true,
        why: 'yield belongs to the function it is written in, and the arrow function cannot pause.',
      },
      {
        t: 'yield needs parentheses',
        why: 'yield x is fine inside a generator body.',
      },
      {
        t: 'Arrays cannot be used in generators',
        why: 'Generators can loop over arrays with for...of and yield each element.',
      },
    ],
  },
  {
    q: 'A stackful coroutine pauses ten calls deep. What does the switch save?',
    options: [
      {
        t: 'A copy of all ten frames',
        why: 'The frames stay on the coroutine\'s own stack; nothing is copied.',
      },
      {
        t: 'Nothing; the frames are thrown away',
        why: 'Then the ten calls could not carry on when it is resumed.',
      },
      {
        t: 'Only the innermost frame',
        why: 'That is closer to what a stackless coroutine saves.',
      },
      {
        t: 'The registers, including the stack pointer',
        correct: true,
        why: 'Loading that pointer again brings back the whole chain at once.',
      },
    ],
  },
  {
    q: 'Which of these is a stackful coroutine?',
    options: [
      {
        t: 'A Lua coroutine, which may yield inside nested function calls',
        correct: true,
        why: 'The Lua manual says resume returns even if the yield happens inside nested calls.',
      },
      {
        t: 'A JavaScript generator',
        why: 'It is lowered to one state machine and can only yield in its own body.',
      },
      {
        t: 'A Python generator',
        why: 'A helper with yield only makes another generator; Python generators are stackless.',
      },
      {
        t: 'A Rust async fn',
        why: 'Its future is a state machine holding one function\'s saved variables.',
      },
    ],
  },
  {
    q: 'What makes a green thread "green"?',
    options: [
      {
        t: 'It uses less electricity',
        why: 'The name is about who schedules it, not power.',
      },
      {
        t: 'It can never block',
        why: 'Goroutines block on channels all the time; the runtime runs another one meanwhile.',
      },
      {
        t: 'The language runtime schedules it, not the operating system',
        correct: true,
        why: 'Go\'s scheduler and the JVM decide which green thread runs on which OS thread.',
      },
      {
        t: 'It runs only on one CPU core',
        why: 'Go and Java spread green threads over several OS threads and cores.',
      },
    ],
  },
  {
    q: 'Go started 100,000 goroutines with about 2 KB of stack each. Why can it afford so many?',
    options: [
      {
        t: 'Goroutines share one stack',
        why: 'Each has its own stack; that is what lets one block deep in a call chain.',
      },
      {
        t: 'Their stacks start small (2,048 bytes) and are copied to bigger ones only when needed',
        correct: true,
        why: 'stack.go sets stackMin = 2048, and growth doubles the size.',
      },
      {
        t: 'Go has no stacks at all',
        why: 'It does; the runtime measured how much they used.',
      },
      {
        t: 'The operating system makes 100,000 threads cheap',
        why: 'The OS is not asked for 100,000 threads; the runtime multiplexes goroutines.',
      },
    ],
  },
];
