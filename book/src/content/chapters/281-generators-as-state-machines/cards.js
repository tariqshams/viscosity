// Chapter 281 cards. Keys are stable ids: never rename them.

export const prompts = {
  'rf-what': {
    q: 'What is a **resumable function**?',
    a: 'A function that can stop part-way, return to its caller, and later continue from the same point with its local variables as they were.',
  },
  'frame-gone': {
    q: 'Why can a generator’s local variables not live in an ordinary stack frame?',
    a: 'The frame is thrown away when `next()` returns, but the variables are needed again by the next call.',
  },
  'what-moves': {
    q: 'In state-machine lowering, which two things move into the record that outlives each call?',
    a: 'The variables that must survive a `yield`, and the state number saying where to continue.',
  },
  'yield-becomes': {
    q: 'What does the k-th `yield e` become after lowering?',
    a: '`st = k; return more(e);`: save the state of the code after it, then return the value.',
  },
  'after-yield': {
    q: 'Where does the code just after a `yield` end up in the lowered function?',
    a: 'In its own `case` of the switch, the one whose number the `yield` saved, so the next call to `next()` starts there.',
  },
  finished: {
    q: 'What should the lowered `next()` return once the generator has finished, however often it is called?',
    a: '`{ value: undefined, done: true }`: a finished generator stays finished.',
  },
  'v8-saves': {
    q: 'What does V8’s `SuspendGenerator` bytecode do?',
    a: 'It stores the function’s parameters and registers (and its state) in the generator object, then returns.',
  },
  'python-frame': {
    q: 'Where does CPython keep a generator’s variables between calls?',
    a: 'In the generator object: its whole interpreter frame is embedded in it, on the heap.',
  },
};

export const examples = {
  'lowered-count': {
    title: 'The lowered count, next to the real one',
    code: `function more(v) {
  return { value: v, done: false };
}
function over(v) {
  return { value: v, done: true };
}

// the lowered version of:
// function* count(n) {
//   for (let i = 0; i < n; i++)
//     yield i;
//   return 'done';
// }
function count(n) {
  let st = 0;
  let i;
  function next() {
    for (;;) {
      switch (st) {
        case 0:
          i = 0;
          st = 1;
          break;
        case 1:
          if (i >= n) {
            st = 3;
            return over('done');
          }
          st = 2;
          return more(i);
        case 2:
          i++;
          st = 1;
          break;
        default:
          return over(undefined);
      }
    }
  }
  return { next };
}

function* real(n) {
  for (let i = 0; i < n; i++) yield i;
  return 'done';
}

const a = count(2);
const b = real(2);
for (let k = 0; k < 4; k++) {
  const x = JSON.stringify(a.next());
  const y = JSON.stringify(b.next());
  console.log(x, x === y ? 'same' : y);
}`,
  },
};

export const exercises = {
  zigzag: {
    title: 'Lower a generator by hand',
    prompt: `Without using \`function*\` or \`yield\`, write \`zigzag(xs)\` so that it behaves exactly like this generator:

\`\`\`js
function* zigzag(xs) {
  for (let i = 0; i < xs.length; i++) {
    yield xs[i];
    yield -xs[i];
  }
  return 'end';
}
\`\`\`

It returns an object with a \`next()\` method; the helpers \`more(v)\` and \`over(v)\` are given. The tests compare your results with the real generator’s, including what happens after it finishes.`,
    starter: `function more(v) {
  return { value: v, done: false };
}
function over(v) {
  return { value: v, done: true };
}

function zigzag(xs) {
  let st = 0;
  let i = 0;
  function next() {
    // switch on st here
    return over(undefined);
  }
  return { next };
}`,
    solution: `function more(v) {
  return { value: v, done: false };
}
function over(v) {
  return { value: v, done: true };
}

function zigzag(xs) {
  let st = 0;
  let i = 0;
  function next() {
    for (;;) {
      switch (st) {
        case 0:
          if (i >= xs.length) {
            st = 3;
            return over('end');
          }
          st = 1;
          return more(xs[i]);
        case 1:
          st = 2;
          return more(-xs[i]);
        case 2:
          i++;
          st = 0;
          break;
        default:
          return over(undefined);
      }
    }
  }
  return { next };
}`,
    tests: `function* real(xs) {
  for (let i = 0; i < xs.length; i++) {
    yield xs[i];
    yield -xs[i];
  }
  return 'end';
}
function run(g, k) {
  const out = [];
  for (let j = 0; j < k; j++) out.push(g.next());
  return out;
}
test('it is not a generator function', () => {
  expect(Object.getPrototypeOf(zigzag)).toBe(Function.prototype);
});
test('[1, 2] gives 1, -1, 2, -2, then end', () => {
  expect(run(zigzag([1, 2]), 5)).toEqual(run(real([1, 2]), 5));
});
test('a finished generator stays finished', () => {
  expect(run(zigzag([7]), 5)).toEqual(run(real([7]), 5));
});
test('an empty list finishes at once', () => {
  expect(run(zigzag([]), 2)).toEqual(run(real([]), 2));
});
test('it is lazy: nothing is read before next()', () => {
  let reads = 0;
  const xs = [1, 2, 3];
  const spy = new Proxy(xs, { get(t, k) { if (k === '0') reads++; return t[k]; } });
  const g = zigzag(spy);
  expect(reads).toBe(0);
  g.next();
  expect(reads).toBe(1);
});
test('a longer list matches the real generator', () => {
  const xs = [3, 1, 4, 1, 5];
  expect(run(zigzag(xs), 13)).toEqual(run(real(xs), 13));
});`,
    hints: [
      'List the places the generator can stop or continue: the start of a round of the loop (with the test), just after the first `yield`, and just after the second `yield`. Each will be a state.',
      'Keep `st` and `i` outside `next()` (in the closure), and write `next()` as `for (;;) { switch (st) { ... } }`. State 0 tests `i < xs.length` and yields `xs[i]`; state 1 yields `-xs[i]`; state 2 does `i++` and goes back to 0.',
      'Each yield is “set `st` to the next state, then `return more(...)`”. The loop’s end is “set `st` to a finished state, then `return over(\'end\')`”, and the finished state (the `default`) returns `over(undefined)` every time.',
    ],
    walkthrough: `**How to think about it.** Follow the chapter’s three steps. First, what must survive between calls to \`next()\`? The index \`i\` (and \`xs\`, which the closure already keeps), plus the state number. Second, where can the generator stop and later continue? At the very start of each round of the loop (where the test \`i < xs.length\` happens), just after \`yield xs[i]\`, and just after \`yield -xs[i]\`; plus a finished state. That is four states. Third, write \`next()\` as a \`switch\` on the state, inside a \`for (;;)\` so that a \`break\` can jump to another state without returning.

**The solution, line by line.**

- \`function more(v)\` and \`function over(v)\` are given: they build \`{ value: v, done: false }\` and \`{ value: v, done: true }\`.
- \`let st = 0;\` and \`let i = 0;\` are the record: they live in \`zigzag\`’s scope, captured by the closure \`next\`, so they survive every return from \`next()\`. (Setting \`i = 0\` here, rather than in a separate start state, is fine because nothing happens before the loop.)
- \`function next() { for (;;) { switch (st) {\` jumps to the code for the current state; \`break\` leaves the \`switch\` and the \`for (;;)\` comes straight back to it.
- \`case 0:\` is the loop test. \`if (i >= xs.length) { st = 3; return over('end'); }\` handles the end of the loop: the generator returns \`'end'\` once and moves to the finished state. Otherwise \`st = 1; return more(xs[i]);\` is the first \`yield\`: save “continue after me” and hand out \`xs[i]\`. Notice that \`xs[i]\` is read only now, during a call to \`next()\`, which is what makes it lazy.
- \`case 1:\` is the code after the first \`yield\`, which is the second one: \`st = 2; return more(-xs[i]);\`.
- \`case 2:\` is the code after the second \`yield\`: the loop’s \`i++\`, then \`st = 0; break;\` jumps back to the test without returning.
- \`default: return over(undefined);\` is the finished state (3): every later call returns \`{ value: undefined, done: true }\`, exactly like a real generator.
- \`return { next };\` gives the caller an object with the \`next\` method (\`{ next }\` is short for \`{ next: next }\`).

**Common wrong attempts.**

- A version without explicit states, flipping a boolean between the positive and the negative value, can produce the right values but forgets that a finished generator says \`'end'\` only once: it returns \`over('end')\` forever after.
- Forgetting the finished state (no \`st = 3\` and no \`default\`) has the same problem: every call after the end runs the loop test again and returns \`'end'\` again, where a real generator returns \`undefined\`.`,
    wrong: [
      {
        code: `function more(v) {
  return { value: v, done: false };
}
function over(v) {
  return { value: v, done: true };
}

function zigzag(xs) {
  let i = 0;
  let neg = false;
  function next() {
    if (i >= xs.length) {
      return over('end');
    }
    const v = neg ? -xs[i] : xs[i];
    if (neg) i++;
    neg = !neg;
    return more(v);
  }
  return { next };
}`,
        why: 'The values are right, but after the end it keeps returning `{ value: \'end\', done: true }`; a real generator returns `\'end\'` once, then `undefined`.',
      },
      {
        code: `function more(v) {
  return { value: v, done: false };
}
function over(v) {
  return { value: v, done: true };
}

function zigzag(xs) {
  let st = 0;
  let i = 0;
  function next() {
    for (;;) {
      switch (st) {
        case 0:
          if (i >= xs.length) {
            return over('end');
          }
          st = 1;
          return more(xs[i]);
        case 1:
          st = 2;
          return more(-xs[i]);
        case 2:
          i++;
          st = 0;
          break;
      }
    }
  }
  return { next };
}`,
        why: 'There is no finished state, so every call after the end runs the loop test again and returns `\'end\'` again.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'What does calling `count(2)` (the real generator) run?',
    options: [
      { t: 'The body up to the first `yield`', why: 'Nothing of the body runs until the first `next()`.' },
      { t: 'None of the body: it only creates the generator object', correct: true, why: 'In the lowered version, it only makes the record and returns `{ next }`.' },
      { t: 'The whole body, saving the values in a list', why: 'That would not be lazy; values are produced one per `next()`.' },
    ],
  },
  {
    q: 'In the lowered `count`, what does `break` inside the `switch` do?',
    options: [
      { t: 'Ends the call to `next()`', why: 'Only `return` ends the call; `break` leaves the `switch`.' },
      { t: 'Leaves the `for (;;)` loop', why: 'Inside a `switch`, `break` leaves the `switch`, not the enclosing loop.' },
      { t: 'Leaves the `switch`, so the `for (;;)` runs it again at the state now in `st`: a jump', correct: true, why: 'That pair is how the lowered code moves between states without returning.' },
    ],
  },
  {
    q: 'A generator has three `yield`s. How many states does a straightforward lowering need, at least?',
    options: [
      { t: 'Three', why: 'The start and the finished state are needed too.' },
      { t: 'Five: the start, one after each `yield`, and finished', correct: true, why: 'Each `yield` needs a state to continue from, plus where it begins and where it ends.' },
      { t: 'One, since the state is the line number', why: 'A single state could not tell the three resume points apart.' },
    ],
  },
  {
    q: 'In TypeScript’s ES5 output, what does `return [4 /*yield*/, i];` tell the `__generator` helper?',
    options: [
      { t: 'To yield `i` and move the label on by one', correct: true, why: 'In tslib, case 4 does `_.label++` and returns `{ value: op[1], done: false }`.' },
      { t: 'To jump to label 4', why: 'A jump is `[3, label]`; the 4 is the kind of instruction, “yield”.' },
      { t: 'To return `i` and finish', why: 'Returning is `[2, value]`.' },
    ],
  },
  {
    q: 'Which statement about where the three real systems keep a generator’s state is right?',
    options: [
      { t: 'All of them keep it on the call stack', why: 'None can: the stack frame is gone after each `next()`.' },
      { t: 'Only V8 keeps a state number', why: 'All three track where to resume: `SwitchOnGeneratorState`, `_a.label`, and CPython’s saved instruction pointer.' },
      { t: 'CPython keeps the whole frame inside the generator object; V8 copies its registers into it', correct: true, why: 'Different amounts of the frame, the same idea: the state outlives the call.' },
    ],
  },
];
