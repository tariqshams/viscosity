// Cards for Tail calls: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'tc-what': {
    q: 'What is a **tail call**?',
    a: 'A call whose result the caller returns straight away, with nothing left to do afterwards.',
  },
  'tc-plus': {
    q: 'Is the call in `return n * fact(n - 1)` a tail call? Why?',
    a: 'No: after it returns, the caller still has to multiply by `n`.',
  },
  'tc-or': {
    q: 'In `return a() || b()`, which call is in tail position?',
    a: 'Only `b()`: the value of `a()` still has to be tested.',
  },
  'tc-acc': {
    q: 'How do you usually turn a recursive function into a tail-recursive one?',
    a: 'Move the work left after the call into an extra accumulator parameter, so the call becomes the last thing done.',
  },
  'tco-what': {
    q: 'What does tail-call optimisation compile a tail call into?',
    a: 'A jump: the new arguments reuse the caller\'s frame and the return address still points at the caller\'s caller.',
  },
  'tco-ra': {
    q: 'Why does RISC-V\'s `tail g` not save a return address, while `call g` does?',
    a: '`g` should return straight to whoever called the current function, so the existing `ra` is left alone.',
  },
  'tco-js': {
    q: 'The ECMAScript spec asks for proper tail calls in strict mode. What did Node 22 do with deep strict-mode tail recursion?',
    a: 'It still threw `RangeError: Maximum call stack size exceeded`: V8 does not implement them.',
  },
  'tr-what': {
    q: 'What does a trampoline do with each thunk it receives?',
    a: 'Calls it, and keeps going while the result is another thunk; the first result that is not a thunk is the answer.',
  },
};

export const examples = {
  'drip-trampoline': {
    title: 'A trampoline in Drip',
    lang: 'drip',
    code: `# return the tail call, do not make it
fn sumT(n, acc) {
  if n == 0 { return [false, acc]; }
  return [true, fn () {
    return sumT(n - 1, acc + n);
  }];
}
# the trampoline: keep making calls
let r = sumT(1000, 0);
while r[0] { r = r[1](); }
print r[1];`,
  },
};

export const exercises = {
  bounce: {
    title: 'A trampoline and a sum to bounce on it',
    prompt: 'Write two functions. `trampoline(f, ...args)` calls `f(...args)`; while the result is a function (a thunk), it calls that and takes its result instead; it returns the first result that is not a function. `sumT(n, acc)` adds `n + (n - 1) + ... + 1` to `acc`: if `n` is 0 it returns `acc`; otherwise, instead of calling itself, it **returns a thunk** that makes the call `sumT(n - 1, acc + n)`. Then `trampoline(sumT, 100000, 0)` must work without running out of stack.',
    starter: `function trampoline(f, ...args) {
  return f(...args);
}
function sumT(n, acc) {
  if (n === 0) return acc;
  return sumT(n - 1, acc + n);
}`,
    solution: `function trampoline(f, ...args) {
  let r = f(...args);
  while (typeof r === 'function') {
    r = r();
  }
  return r;
}
function sumT(n, acc) {
  if (n === 0) return acc;
  return () => sumT(n - 1, acc + n);
}`,
    tests: `test('sums a small range', () => {
  expect(trampoline(sumT, 4, 0)).toBe(10);
});
test('sumT(0, 7) is the answer itself', () => {
  expect(sumT(0, 7)).toBe(7);
});
test('sumT returns a thunk, not a sum', () => {
  expect(typeof sumT(3, 0)).toBe('function');
});
test('100000 deep without overflow', () => {
  expect(trampoline(sumT, 100000, 0))
    .toBe(5000050000);
});
test('works for other tail calls too', () => {
  const ev = (n) => n === 0 ? true
    : () => od(n - 1);
  const od = (n) => n === 0 ? false
    : () => ev(n - 1);
  expect(trampoline(ev, 100001)).toBe(false);
});`,
    hints: [
      'The trampoline is a loop: it keeps a current result, and the loop goes on as long as that result is a function.',
      '`while (typeof r === \'function\') r = r();` is the heart of it. For `sumT`, change the recursive call into something that *describes* the call without making it.',
      'In `sumT`, write `return () => sumT(n - 1, acc + n);`: an arrow function with no parameters that makes the call only when the trampoline invokes it.',
    ],
    walkthrough: `**How to think about it.** The stack overflows because each call to \`sumT\` waits, on the stack, for the next one to return. A trampoline breaks that chain: rather than making its tail call, a function returns a thunk, a function of no arguments that will make the call later. Returning the thunk ends the current call, so its frame is gone before the next call starts. Something must then call the thunk, and the thunk after that, and so on; that something is a plain \`while\` loop, which never gets deeper than one call at a time.

**The solution, line by line.**

- \`function trampoline(f, ...args) {\` takes the first function and its arguments (\`...args\` gathers them into an array).
- \`let r = f(...args);\` makes the first call. For \`trampoline(sumT, 4, 0)\` that returns a thunk.
- \`while (typeof r === 'function') {\` asks: is this a thunk, or the answer? A number is not a function, so the loop stops at the answer.
- \`r = r();\` bounces: call the thunk, which makes exactly one call to \`sumT\` and returns either the next thunk or the final sum. The stack is never more than a few frames deep.
- \`return r;\` hands back the answer.
- \`function sumT(n, acc) {\` is the tail-recursive sum from the chapter.
- \`if (n === 0) return acc;\` is the base case, returning the plain answer, which is what stops the trampoline.
- \`return () => sumT(n - 1, acc + n);\` is the only change from ordinary tail recursion: the call is wrapped in an arrow function with no parameters and returned unmade. \`n\` and \`acc\` are captured by the closure, so the thunk remembers them.

**Common wrong attempts.**

- Using \`if\` instead of \`while\` in the trampoline bounces once and then returns a thunk as the "answer".
- Working out the next step first (\`const next = sumT(n - 1, acc + n); return () => next;\`) makes the recursive call immediately, so the stack grows exactly as before and overflows at 100,000.
- Forgetting to return the thunk (writing \`() => sumT(...)\` without \`return\`) makes \`sumT\` return \`undefined\`.
- A thunk that takes a parameter is fine for the loop but unnecessary; the trampoline calls it with none.`,
    wrong: [
      {
        code: `function trampoline(f, ...args) {
  let r = f(...args);
  if (typeof r === 'function') r = r();
  return r;
}
function sumT(n, acc) {
  if (n === 0) return acc;
  return () => sumT(n - 1, acc + n);
}`,
        why: 'It bounces only once, so for anything but tiny inputs the "answer" is still a thunk.',
      },
      {
        code: `function trampoline(f, ...args) {
  let r = f(...args);
  while (typeof r === 'function') {
    r = r();
  }
  return r;
}
function sumT(n, acc) {
  if (n === 0) return acc;
  const next = sumT(n - 1, acc + n);
  return () => next;
}`,
        why: 'The recursive call is made before the thunk is returned, so the stack grows as before and 100,000 overflows.',
      },
    ],
  },
  'find-tail': {
    optional: true,
    title: 'Find the tail calls',
    prompt: 'A function body is an expression tree made of arrays: `[\'num\', 1]`, `[\'var\', \'x\']`, `[\'op\', \'+\', a, b]` (any operator), `[\'call\', \'f\', arg1, ...]`, `[\'if\', c, a, b]` (the conditional `c ? a : b`), `[\'or\', a, b]` and `[\'and\', a, b]`. Write `tailCalls(e)`, which returns the names of the calls that are in **tail position** in the body `e`, left to right.',
    starter: `function tailCalls(e) {
  return [];
}`,
    solution: `function tailCalls(e) {
  const k = e[0];
  if (k === 'call') return [e[1]];
  if (k === 'if') {
    return [...tailCalls(e[2]),
      ...tailCalls(e[3])];
  }
  if (k === 'or' || k === 'and') {
    return tailCalls(e[2]);
  }
  return [];
}`,
    tests: `test('a returned call is a tail call', () => {
  expect(tailCalls(['call', 'f', ['var', 'x']]))
    .toEqual(['f']);
});
test('a call under + is not', () => {
  expect(tailCalls(['op', '+', ['num', 1],
    ['call', 'f']])).toEqual([]);
});
test('both branches of a conditional', () => {
  expect(tailCalls(['if', ['call', 'p'],
    ['call', 'a'],
    ['op', '*', ['var', 'n'], ['call', 'b']]]))
    .toEqual(['a']);
});
test('only the right side of ||', () => {
  expect(tailCalls(['or', ['call', 'a'],
    ['call', 'b']])).toEqual(['b']);
});
test('an argument is not in tail position', () => {
  expect(tailCalls(['call', 'f', ['call', 'g']]))
    .toEqual(['f']);
});`,
    hints: [
      'Follow the tail contexts from the chapter: which parts of each kind of node produce the final answer unchanged?',
      'A call node is itself in tail position (its arguments are not). For `if`, both branches are; the condition is not. For `or` and `and`, only the right-hand side is.',
      'Recurse only into those parts: `if (k === \'if\') return [...tailCalls(e[2]), ...tailCalls(e[3])];` and `if (k === \'or\' || k === \'and\') return tailCalls(e[2]);`. Everything else gives `[]`.',
    ],
    walkthrough: `**How to think about it.** This is the grammar of tail contexts written as a recursive function. Start from the whole body, which is in tail position by definition, and ask for each kind of node which of its parts pass their value through unchanged. Only those parts can contain tail calls, so only those are searched.

**The solution, line by line.**

- \`const k = e[0];\` reads the node's kind.
- \`if (k === 'call') return [e[1]];\` a call in tail position is a tail call; its name is \`e[1]\`. Its arguments are evaluated *before* the call, so none of them is in tail position and we do not look inside.
- \`if (k === 'if') { return [...tailCalls(e[2]), ...tailCalls(e[3])]; }\` the condition \`e[1]\` must be tested, so it is skipped; either branch may be the answer, so both are searched, then branch before else branch to keep left-to-right order.
- \`if (k === 'or' || k === 'and') { return tailCalls(e[2]); }\` the left side is tested, the right side is returned as it is.
- \`return [];\` covers numbers, variables and operators: an operator still has work to do after its operands, so nothing under it is in tail position.

**Common wrong attempts.**

- Collecting every call in the tree finds \`p\`, \`g\` and the call under \`*\` too.
- Searching both sides of \`||\` reports \`a\`, whose value must be tested before the function can return.`,
    wrong: [
      {
        code: `function tailCalls(e) {
  if (!Array.isArray(e)) return [];
  const own = e[0] === 'call'
    ? [e[1]] : [];
  return [...own, ...e.slice(1)
    .flatMap((x) => tailCalls(x))];
}`,
        why: 'It collects every call in the tree, including conditions, arguments and calls under operators.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Which `return` makes a tail call to `f`?',
    options: [
      {
        t: '`return f(x) + 1;`',
        why: 'The + 1 is done after f returns.',
      },
      {
        t: '`return [f(x)];`',
        why: 'The result is wrapped in an array after the call.',
      },
      {
        t: '`return ok ? f(x) : 0;`',
        correct: true,
        why: 'The branch\'s value is returned unchanged, so f(x) is in tail position.',
      },
      {
        t: '`return f(x) && done;`',
        why: 'f(x)\'s value must be tested; only the right side of && is in tail position.',
      },
    ],
  },
  {
    q: 'What does tail-call optimisation do with the caller\'s frame?',
    options: [
      {
        t: 'Copies it to the heap',
        why: 'That is what an async function does with live variables; a tail call has no need to keep them.',
      },
      {
        t: 'Reuses (or releases) it, and jumps to the callee',
        correct: true,
        why: 'The caller has nothing left to do, so its frame can hold the callee\'s arguments.',
      },
      {
        t: 'Keeps it, but makes it smaller',
        why: 'The stack would still grow by one frame per call.',
      },
      {
        t: 'Turns it into a thunk',
        why: 'That is the trampoline, done by hand when the compiler will not optimise.',
      },
    ],
  },
  {
    q: 'clang -O1 compiles `long f(long x) { return g(x + 1); }` for RISC-V as `addi a0, a0, 1` then `tail g`. Where does `g` return to?',
    options: [
      {
        t: 'To f, which then returns',
        why: 'f no longer has a frame or a return address of its own on the way back.',
      },
      {
        t: 'To the start of f',
        why: 'That is the loop clang makes for a self tail call, not this.',
      },
      {
        t: 'Nowhere; tail calls never return',
        why: 'g returns normally, to the address in ra.',
      },
      {
        t: 'To whoever called f, because ra was left unchanged',
        correct: true,
        why: 'tail jumps without writing ra (jalr x0, ...).',
      },
    ],
  },
  {
    q: 'A strict-mode JavaScript `sum(n, acc)` whose only recursive call is `return sum(n - 1, acc + n)` overflows the stack for `sum(100000, 0)` in Node 22. Why?',
    options: [
      {
        t: 'V8 does not implement the proper tail calls the specification asks for',
        correct: true,
        why: 'Node throws `RangeError: Maximum call stack size exceeded`: the rule in the specification is not what V8 ships.',
      },
      {
        t: 'The function is not tail-recursive',
        why: 'Its recursive call is in tail position.',
      },
      {
        t: 'The specification forbids tail calls',
        why: 'It requires them, in strict mode.',
      },
      {
        t: 'Numbers that big need BigInt',
        why: '5000050000 fits easily in a JavaScript number.',
      },
    ],
  },
  {
    q: 'A trampoline keeps the stack shallow because...',
    options: [
      {
        t: 'it runs each call on a separate thread',
        why: 'Everything runs on one thread, in one loop.',
      },
      {
        t: 'it deletes old frames from the middle of the stack',
        why: 'No code can do that; each call returns before the next is made.',
      },
      {
        t: 'each function returns a thunk for its tail call, and the loop makes that call after the function has returned',
        correct: true,
        why: 'So only one call is ever in progress, under the loop.',
      },
      {
        t: 'it rewrites the recursion as a for loop at compile time',
        why: 'That is TCO by a compiler; a trampoline works at run time with no compiler help.',
      },
    ],
  },
];
