// Chapter 317 cards. Keys are stable ids: never rename them.

export const prompts = {
  'lz-pick': {
    q: 'Why does `pick(true, 1, slow())` run `slow()` in JavaScript, while `true ? 1 : slow()` does not?',
    a: 'JavaScript evaluates every argument before the call (call-by-value); the `? :` operator only evaluates the branch it chooses.',
  },
  'th-what': {
    q: 'What is a **thunk**?',
    a: 'A suspended computation: the code for an expression plus the variables it needs, waiting to be run when its value is wanted.',
  },
  'th-js': {
    q: 'How do you write a thunk for `slow()` in JavaScript, and how do you force it?',
    a: 'As a function of no arguments, `() => slow()`; force it by calling it.',
  },
  'th-closure': {
    q: 'After closure conversion, what does a thunk look like in memory?',
    a: 'A heap record with a code pointer and the free variables of the expression (GHC adds a field that will later point to the value).',
  },
  'cbn-what': {
    q: 'Under call-by-name, how many times does an argument run if the function uses it three times?',
    a: 'Three times: the unevaluated expression is passed, and every use evaluates it afresh.',
  },
  'cbneed-what': {
    q: 'What is the one difference between call-by-name and call-by-need?',
    a: 'Call-by-need remembers: the first force updates the thunk with its value, so later forces reuse it.',
  },
  'cbneed-pure': {
    q: 'Why is it safe to share one result between every use of a call-by-need argument?',
    a: 'In a pure language the expression gives the same value every time, so running it once and sharing gives the same answer as running it each time.',
  },
  'cbneed-hole': {
    q: 'What is a **black hole**, and what does it let a runtime report?',
    a: 'A thunk marked "being evaluated". If evaluation forces the same thunk again, the runtime finds the mark and can report a loop (GHC\'s `<<loop>>`).',
  },
  'cbneed-rust': {
    q: 'Which Rust type is call-by-need for a single value, and what happens on re-entry?',
    a: '`std::cell::LazyCell` (or the thread-safe `LazyLock`): it runs its closure on first access, and a re-entrant access panics, because the cell is marked poisoned while initialising.',
  },
};

export const examples = {
  strategies: {
    title: 'By value, by name and by need',
    code: `// One argument, three strategies.
let runs = 0;
function slow() {
  runs++;          // count the work
  return 21;
}
// the function uses its argument twice
const twice = (x) => x() + x();

// call-by-value: work first, then wrap
runs = 0;
const v = slow();
twice(() => v);
console.log('by value:', runs);

// call-by-name: pass the work itself
runs = 0;
twice(() => slow());
console.log('by name:', runs);

// call-by-need: a thunk that remembers
function delay(f) {
  let done = false, val;
  return () => {
    if (!done) {
      val = f();
      done = true;
    }
    return val;
  };
}
runs = 0;
console.log(twice(delay(slow)));
console.log('by need:', runs);`,
  },
};

export const exercises = {
  delay: {
    title: 'A call-by-need thunk',
    prompt:
      'Write `delay(f)`, which returns an object with a `force()` method. `f` must not run until the first `force()`. The first `force()` runs `f` and returns its result; every later `force()` returns the same result without running `f` again, even if that result is `undefined`. If `f` forces the same thunk while it is running (a loop), `force()` must throw an `Error` with the message `<<loop>>`. If `f` throws, the error passes through and the thunk goes back to unevaluated, so a later `force()` tries again.',
    starter: `function delay(f) {
  return {
    force() {
      return f();
    },
  };
}`,
    solution: `function delay(f) {
  let state = 'todo', val;
  return {
    force() {
      if (state === 'done')
        return val;
      if (state === 'busy')
        throw new Error('<<loop>>');
      state = 'busy';
      try {
        val = f();
      } catch (e) {
        state = 'todo';
        throw e;
      }
      state = 'done';
      return val;
    },
  };
}`,
    tests: `test('f does not run until forced', () => {
  let n = 0;
  const t = delay(() => { n++; return 1; });
  expect(n).toBe(0);
  expect(t.force()).toBe(1);
  expect(n).toBe(1);
});
test('the result is shared', () => {
  let n = 0;
  const t = delay(() => { n++; return 21; });
  expect(t.force() + t.force()).toBe(42);
  expect(n).toBe(1);
});
test('undefined is remembered too', () => {
  let n = 0;
  const t = delay(() => { n++; });
  t.force(); t.force();
  expect(n).toBe(1);
});
test('forcing itself is a loop', () => {
  let t;
  t = delay(() => t.force() + 1);
  expect(() => t.force()).toThrow('<<loop>>');
});
test('after a throw it can try again', () => {
  let n = 0;
  const t = delay(() => {
    n++;
    if (n === 1) throw new Error('x');
    return 5;
  });
  expect(() => t.force()).toThrow('x');
  expect(t.force()).toBe(5);
});`,
    hints: [
      'The thunk has three states, the same ones as in the step-through: not yet run, running, and done. Keep one variable for the state and one for the value, inside `delay` so that the returned `force` closes over them.',
      'In `force`: if the state is done, return the value. If it is running, someone is forcing it from inside its own evaluation, so throw `new Error(\'<<loop>>\')`. Otherwise mark it running, call `f`, store the value, mark it done.',
      'Wrap the call to `f` in `try { val = f(); } catch (e) { state = \'todo\'; throw e; }` so that a failure does not leave the thunk stuck as "running". Do not test `val === undefined` to decide whether it is done: use the state.',
    ],
    walkthrough: `**How to think about it.** A call-by-need thunk is a tiny state machine with three states, the ones GHC's runtime uses: a thunk that has not been run, a black hole that is being run, and an updated value. Each \`force\` looks at the state and does one of three things, and only the first-ever force does real work. The variables that hold the state must outlive each call to \`force\` and be private to this one thunk, which is exactly what a closure gives you (chapter 12).

**The solution, line by line.**

- \`function delay(f) {\` takes the work, as a function of no arguments.
- \`let state = 'todo', val;\` makes the thunk's two private cells: its state, and (later) its value. Nothing runs \`f\` here, so building a thunk is cheap.
- \`return { force() { ... } };\` returns an object whose one method closes over \`state\`, \`val\` and \`f\`.
- \`if (state === 'done') return val;\` (over two lines) is the fast path: the thunk was updated, so share the value. Testing the state rather than \`val\` is what makes an \`undefined\` result count as done.
- \`if (state === 'busy') throw new Error('<<loop>>');\` (over two lines) catches re-entry: we are inside our own evaluation, and carrying on would recurse forever. This is the black hole.
- \`state = 'busy';\` marks the black hole before calling \`f\`, so that a re-entrant force sees it.
- \`try { val = f(); }\` does the work, once.
- \`catch (e) { state = 'todo'; throw e; }\` undoes the black hole if \`f\` fails, then passes the error on, so the thunk can be retried. (Rust's \`LazyCell\` makes the opposite choice: a panic leaves it poisoned for good.)
- \`state = 'done'; return val;\` is the update: from now on every force takes the fast path.

**Common wrong attempts.**

- The starter calls \`f\` on every force: that is call-by-name, and the sharing test sees \`f\` run twice.
- \`if (val !== undefined) return val;\` as the "done" test: a thunk whose value is \`undefined\` runs again on every force.
- Marking the state done before calling \`f\`: a re-entrant force returns \`undefined\` instead of reporting the loop.
- No \`try\`/\`catch\`: after one failure the thunk stays "busy" forever, and the retry throws \`<<loop>>\` although there is no loop.`,
    wrong: [
      {
        code: `function delay(f) {
  let val;
  return {
    force() {
      if (val !== undefined)
        return val;
      val = f();
      return val;
    },
  };
}`,
        why: 'An `undefined` result is never remembered, so `f` runs again, and re-entry recurses forever instead of throwing `<<loop>>`.',
      },
      {
        code: `function delay(f) {
  let state = 'todo', val;
  return {
    force() {
      if (state === 'done')
        return val;
      if (state === 'busy')
        throw new Error('<<loop>>');
      state = 'busy';
      val = f();
      state = 'done';
      return val;
    },
  };
}`,
        why: 'Nearly right, but if `f` throws the state stays `busy`, so the retry wrongly reports `<<loop>>`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: '`const twice = (x) => x() + x();` is called with a thunk for `slow()`. How many times does `slow` run under call-by-name, and under call-by-need?',
    options: [
      { t: 'By name 1, by need 1', why: 'Call-by-name re-evaluates on every use, and `twice` uses `x` twice.' },
      { t: 'By name 2, by need 1', correct: true, why: 'By name runs the expression at each use; by need runs it once and shares the result.' },
      { t: 'By name 2, by need 2', why: 'By need updates the thunk after the first force, so the second use is free.' },
    ],
  },
  {
    q: 'A function never uses its argument. Which strategy still runs the argument?',
    options: [
      { t: 'Call-by-value', correct: true, why: 'Arguments are evaluated before the call, needed or not; by name and by need run them 0 times.' },
      { t: 'Call-by-need', why: 'An unforced thunk is never run.' },
      { t: 'Call-by-name', why: 'Nothing evaluates the expression unless it is used.' },
    ],
  },
  {
    q: 'Which of these is call-by-need built into everyday JavaScript?',
    options: [
      { t: '`f(a(), b())`', why: 'Both arguments run before the call: call-by-value.' },
      { t: '`a() && b()`, where `b()` runs only if needed, at most once', correct: true, why: 'The right operand is evaluated only when the left is truthy, and at most once: it behaves like a thunk forced on demand.' },
      { t: '`[a(), b()]`', why: 'Array literals evaluate every element.' },
    ],
  },
  {
    q: 'In GHC\'s runtime, what happens to a thunk when its evaluation finishes?',
    options: [
      { t: 'It is freed at once', why: 'Other references may still point to it; it is updated so they can find the value.' },
      { t: 'It is updated: it becomes an indirection to its result, so later uses read the value', correct: true, why: 'That is the third of the three states in rts/Updates.h.' },
      { t: 'Nothing; it is run again at the next use', why: 'That would be call-by-name.' },
    ],
  },
  {
    q: 'Why does a call-by-need runtime mark a thunk as a black hole while evaluating it?',
    options: [
      { t: 'So that a thunk which needs its own value can be reported as a loop instead of recursing forever', correct: true, why: 'GHC reports `<<loop>>`; Rust\'s LazyCell panics with "previously been poisoned".' },
      { t: 'To make the garbage collector skip it', why: 'The mark is about evaluation, not collection.' },
      { t: 'To make it run faster the second time', why: 'The update does that; the black hole only covers the time while it runs.' },
    ],
  },
];
