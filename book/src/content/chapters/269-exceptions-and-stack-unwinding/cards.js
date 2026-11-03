// Cards for Exceptions and stack unwinding: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'unwind-what': {
    q: 'What does **unwinding** do with the frames between a throw and its catch?',
    a: 'It removes them from the call stack, from the top down, running each one’s cleanup code (finally blocks, destructors) as it goes.',
  },
  'two-phase': {
    q: 'What are the two phases of Itanium C++ ABI unwinding, and what does each do?',
    a: 'The search phase only reads, frame by frame, until it finds a handler; the cleanup phase walks again, running cleanups and removing frames, until it reaches that handler.',
  },
  'pad-what': {
    q: 'What is a **landing pad**?',
    a: 'A block of compiled code the unwinder jumps to when an exception passes through a call site; it cleans up and then resumes unwinding, or continues as a matched catch.',
  },
  'invoke-two': {
    q: 'How does an LLVM `invoke` differ from a `call`?',
    a: 'It names two places to continue: one for a normal return and one (the landing pad) for when the callee throws.',
  },
  resume: {
    q: 'Why does a cleanup-only landing pad end with `resume` rather than a return?',
    a: 'The frame only tidies up and does not handle the error, so it hands the exception back to the unwinder to keep looking further down the stack.',
  },
  'zero-cost-what': {
    q: 'What makes table-driven exceptions “zero-cost”?',
    a: 'The normal path has no extra instructions; the map from code ranges to landing pads lives in a separate table that is read only when something is thrown.',
  },
  'old-way': {
    q: 'What does the “pay as you go” (setjmp/longjmp style) scheme cost when no exception is ever thrown?',
    a: 'Every `try` still saves registers into a handler record and pushes it on a list, then pops it on the way out.',
  },
  'throw-slow': {
    q: 'Why is it acceptable that throwing is slow with zero-cost exceptions?',
    a: 'Exceptions are meant to be rare; the design moves the cost from every normal run onto the rare throw.',
  },
};

export const examples = {
  'unwind-order': {
    title: 'Cleanups run from the inside out',
    code: `function c() {
  try { throw new Error('deep'); }
  finally { console.log('c cleans'); }
}
function b() {
  try { c(); }
  finally { console.log('b cleans'); }
}
function a() {
  try { b(); }
  catch (e) {
    console.log('a got ' + e.message);
  }
}
a();
console.log('carry on');`,
  },
};

export const exercises = {
  unwinder: {
    title: 'The unwinder’s loop',
    prompt: 'A stack is an array of frames `{ fn, pc }`, bottom first, top last; `pc` is where that frame stopped. `tables[fn]` is the list of rows for function `fn` (possibly missing), each `{ from, to, target, kind }`, covering `from <= pc < to`, where `kind` is `\'catch\'` or `\'cleanup\'`. Write `unwind(stack, tables)`: walk from the top frame down; in each frame, look at its rows in order. A covering cleanup row is recorded as the string `fn + \'@\' + target` in a list `ran`; the first covering catch row stops the walk. Return `done(frame, target, ran)` (the index of the catching frame and its target), or `done(-1, -1, ran)` if nothing catches; the helpers `inside` and `done` are given.',
    starter: `function inside(pc, r) {
  return pc >= r.from && pc < r.to;
}
function done(frame, target, ran) {
  return { frame, target, ran };
}

function unwind(stack, tables) {
  const ran = [];
  // walk the frames from the top down
  return done(-1, -1, ran);
}`,
    solution: `function inside(pc, r) {
  return pc >= r.from && pc < r.to;
}
function done(frame, target, ran) {
  return { frame, target, ran };
}

function unwind(stack, tables) {
  const ran = [];
  let i = stack.length - 1;
  while (i >= 0) {
    const f = stack[i];
    const rows = tables[f.fn] || [];
    for (const r of rows) {
      if (!inside(f.pc, r)) continue;
      if (r.kind === 'catch') {
        return done(i, r.target, ran);
      }
      ran.push(f.fn + '@' + r.target);
    }
    i--;
  }
  return done(-1, -1, ran);
}`,
    tests: `const T = {
  main: [{ from: 3, to: 6, target: 9, kind: 'catch' }],
  load: [{ from: 5, to: 8, target: 12, kind: 'cleanup' }],
};
const S = [
  { fn: 'main', pc: 4 },
  { fn: 'load', pc: 7 },
  { fn: 'parse', pc: 2 },
];
test('finds main and runs load’s cleanup', () => {
  expect(unwind(S, T)).toEqual({ frame: 0, target: 9, ran: ['load@12'] });
});
test('a pc outside the range is not covered', () => {
  const s = [{ fn: 'main', pc: 7 }, { fn: 'load', pc: 7 }];
  expect(unwind(s, T)).toEqual({ frame: -1, target: -1, ran: ['load@12'] });
});
test('the top frame can catch its own throw', () => {
  const t = { f: [{ from: 0, to: 9, target: 4, kind: 'catch' }] };
  expect(unwind([{ fn: 'g', pc: 1 }, { fn: 'f', pc: 2 }], t)).toEqual({ frame: 1, target: 4, ran: [] });
});
test('rows are tried in order inside one frame', () => {
  const t = { f: [
    { from: 0, to: 9, target: 7, kind: 'cleanup' },
    { from: 0, to: 9, target: 3, kind: 'catch' },
  ] };
  expect(unwind([{ fn: 'f', pc: 5 }], t)).toEqual({ frame: 0, target: 3, ran: ['f@7'] });
});
test('an empty stack catches nothing', () => {
  expect(unwind([], T)).toEqual({ frame: -1, target: -1, ran: [] });
});`,
    hints: [
      'The top frame is the last element of `stack`. Which index is that, and which way does the walk go?',
      'Use a loop over `i` from `stack.length - 1` down to `0`. In each frame, get `tables[f.fn] || []` (a function with no table has no rows) and look at each row with `inside(f.pc, r)`.',
      'Inside the row loop: skip rows that do not cover the pc; for a `catch` row, `return { frame: i, target: r.target, ran }` at once; for a `cleanup` row, `ran.push(f.fn + \'@\' + r.target)` and keep going. After both loops, return the “uncaught” object.',
    ],
    walkthrough: `**How to think about it.** This is the rule from the chapter, \`unwind(e, f1 … fn)\`, written as a loop instead of a recursion. Start at the top of the stack (the frame that threw), ask its table “is the place where you stopped covered by a row?”, and act on the answer: a catch row ends the whole walk, a cleanup row is run (here we only record it) and the walk continues, and no row at all means the frame is simply dropped. Then move one frame down and ask again. If you run out of frames, nothing caught the error. (This is a one-phase unwinder: it records cleanups even when nothing catches. C++ would search first and run no cleanups at all in that case.)

**The solution, line by line.**

- \`done(frame, target, ran)\` is given too: it builds the answer object (\`{ frame, target, ran }\` is short for \`{ frame: frame, target: target, ran: ran }\`).
- \`function inside(pc, r) { return pc >= r.from && pc < r.to; }\` is given: a row covers the pc when the pc is at or after \`from\` and strictly before \`to\`, the same half-open ranges as Java’s and CPython’s exception tables.
- \`const ran = [];\` collects the cleanups in the order they would run.
- \`let i = stack.length - 1;\` starts at the top frame, the last element.
- \`while (i >= 0) {\` keeps going until we have looked at the bottom frame, index 0.
- \`const f = stack[i];\` is the frame we are asking now.
- \`const rows = tables[f.fn] || [];\` fetches its function’s table; a function with no try and nothing to clean up has no entry in \`tables\` at all, and \`|| []\` turns that \`undefined\` into an empty list so the loop below runs zero times.
- \`for (const r of rows) {\` tries the rows in order, which matters: an inner cleanup is listed before an outer catch.
- \`if (!inside(f.pc, r)) continue;\` skips a row that covers some other part of the function.
- \`if (r.kind === 'catch') { return done(i, r.target, ran); }\` is the handler: stop at once and say which frame and which landing pad.
- \`ran.push(f.fn + '@' + r.target);\` records a cleanup landing pad, and the row loop carries on, since a cleanup never stops the walk.
- \`i--;\` after the row loop drops this frame and moves one down.
- \`return done(-1, -1, ran);\` after the while loop means no frame caught it.

For the first test: \`parse\` (index 2) has no table; \`load\` at pc 7 is inside 5 to 8, a cleanup, so \`'load@12'\` is recorded; \`main\` at pc 4 is inside 3 to 6, a catch, so the answer is frame 0, target 9.

**Common wrong attempts.**

- Walking from index 0 upwards finds the *outermost* handler first, which is the wrong one: the nearest handler to the throw must win.
- Returning on the first covering row of any kind stops at a cleanup, so the error is never delivered to the catch further down.
- Forgetting \`|| []\` crashes with “rows is not iterable” on the first function that has no table, here \`parse\`.`,
    wrong: [
      {
        code: `function inside(pc, r) {
  return pc >= r.from && pc < r.to;
}
function done(frame, target, ran) {
  return { frame, target, ran };
}
function unwind(stack, tables) {
  const ran = [];
  let i = 0;
  while (i < stack.length) {
    const f = stack[i];
    const rows = tables[f.fn] || [];
    for (const r of rows) {
      if (!inside(f.pc, r)) continue;
      if (r.kind === 'catch') {
        return done(i, r.target, ran);
      }
      ran.push(f.fn + '@' + r.target);
    }
    i++;
  }
  return done(-1, -1, ran);
}`,
        why: 'This walks from the bottom up, so it stops at the outermost frame before visiting the frames above it: the cleanups are not recorded and the wrong handler wins when two frames catch.',
      },
      {
        code: `function inside(pc, r) {
  return pc >= r.from && pc < r.to;
}
function done(frame, target, ran) {
  return { frame, target, ran };
}
function unwind(stack, tables) {
  const ran = [];
  let i = stack.length - 1;
  while (i >= 0) {
    const f = stack[i];
    for (const r of tables[f.fn]) {
      if (!inside(f.pc, r)) continue;
      if (r.kind === 'catch') {
        return done(i, r.target, ran);
      }
      ran.push(f.fn + '@' + r.target);
    }
    i--;
  }
  return done(-1, -1, ran);
}`,
        why: '`tables.parse` is `undefined`, and `for (const r of undefined)` throws a TypeError. A function with no table must be treated as having no rows.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'A throw happens in `parse`, called by `load`, called by `main`, and only `main` has a catch. Which frames are removed from the stack?',
    options: [
      {
        t: 'Only `parse`',
        why: 'Removing `parse` is not enough: `load` has no handler either, so it must go too.',
      },
      {
        t: '`parse` and `load`',
        correct: true,
        why: 'Every frame above the nearest frame with a handler is removed; `main` stays and runs its catch.',
      },
      {
        t: 'All three',
        why: '`main` has the handler, so its frame survives and continues at the catch.',
      },
    ],
  },
  {
    q: 'Why does the Itanium ABI search for a handler before running any cleanup?',
    options: [
      {
        t: 'Because running cleanups twice would be wrong',
        why: 'Cleanups run once either way; the split is about what happens when nothing catches.',
      },
      {
        t: 'Because tables can only be read once',
        why: 'Tables are read-only data and can be read as often as needed; the cleanup phase reads them again.',
      },
      {
        t: 'So that, if nothing catches, the program can stop with the stack left as it was at the throw',
        correct: true,
        why: 'If the search fails, terminate() is called before any frame is changed.',
      },
    ],
  },
  {
    q: 'In LLVM IR, what does `landingpad { ptr, i32 } cleanup` followed later by `resume` tell you about the frame?',
    options: [
      {
        t: 'It catches every exception',
        why: 'A catch would list `catch` clauses and continue as normal code instead of resuming.',
      },
      {
        t: 'It has cleanup to run but does not handle the exception',
        correct: true,
        why: 'The pad tidies up (for example, runs a destructor) and then hands the exception back to the unwinder.',
      },
      {
        t: 'The call can never throw',
        why: 'A call that can never throw would be a plain `call` with no landing pad at all.',
      },
    ],
  },
  {
    q: 'With zero-cost exceptions, what extra work does a function do on a normal run through a `try` block where nothing is thrown?',
    options: [
      {
        t: 'None: the normal path has no extra instructions',
        correct: true,
        why: 'The ranges and landing pads live in a separate table that is only read after a throw.',
      },
      {
        t: 'It pushes a handler record and pops it again',
        why: 'That is the older “pay as you go” scheme (setjmp/longjmp, SJLJ), which zero-cost tables replace.',
      },
      {
        t: 'It checks a global error flag after each call',
        why: 'That is how error codes are handled by hand in C; exceptions avoid it.',
      },
    ],
  },
  {
    q: 'Java’s `javap` shows `from 0 to 4 target 5 type NumberFormatException`. A NumberFormatException is thrown by the call at bytecode 1. Where does execution continue?',
    options: [
      {
        t: 'At bytecode 4',
        why: '4 is where the covered range ends (it is exclusive), not where the handler starts.',
      },
      {
        t: 'In the caller, because Java has no landing pads',
        why: 'The entry covers bytecode 1, so this method handles it; the handler at 5 is Java’s landing pad.',
      },
      {
        t: 'At bytecode 5, the handler',
        correct: true,
        why: 'Bytecode 1 lies in the range 0 to 4 and the type matches, so the first matching entry sends control to 5.',
      },
    ],
  },
];
