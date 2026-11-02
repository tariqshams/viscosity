// Chapter 57 cards. Keys are stable ids: never rename them.

export const prompts = {
  'decl-no-run': {
    q: 'What does executing `fn add(a, b) { ... }` do?',
    a: 'It makes a function value (the declaration plus the current environment) and defines `add` to hold it. The body doesn’t run.',
  },
  'callable-what': {
    q: 'What two methods does every Drip callable have?',
    a: '`arity()`, how many arguments it expects, and `call(interp, args)`, which runs it.',
  },
  'fn-value': {
    q: 'What does `print add;` show for a Drip function `add`?',
    a: '`<fn add>`. A function is an ordinary runtime value.',
  },
  'call-order': {
    q: 'In a call expression, what is evaluated first: the callee or the arguments?',
    a: 'The callee, then the arguments from left to right, and only then are the checks made.',
  },
  'fresh-env': {
    q: 'Why don’t two calls of the same Drip function share their local variables?',
    a: 'Each call creates a brand-new environment for its parameters and locals.',
  },
  'parent-env': {
    q: 'What is the parent of the environment a Drip call creates?',
    a: 'The environment where the function was declared (its `closure`), not the caller’s environment.',
  },
  'arity-what': {
    q: 'What is a function’s *arity*?',
    a: 'The number of arguments it takes. For a Drip function, its number of parameters.',
  },
  'arity-mismatch': {
    q: '`fn f(a, b) {}` then `f(1);` What happens in Drip?',
    a: 'A runtime error, `Expected 2 arguments but got 1.`, and `f`’s body never runs.',
  },
  'js-lenient': {
    q: 'In JavaScript, what does a parameter hold when its argument is missing?',
    a: '`undefined`. JavaScript doesn’t enforce arity.',
  },
  'native-what': {
    q: 'What is a native function?',
    a: 'A callable implemented in the host language (TypeScript, for Drip) rather than in the language being run.',
  },
  'native-why': {
    q: 'Why can’t `clock` be written in Drip itself?',
    a: 'Nothing in Drip can ask the outside world for the time. Only the host language can.',
  },
};

export const examples = {
  lexical: {
    title: 'The parent is where the function was written',
    lang: 'drip',
    code: `fn show() {
  print x;
}

let x = "global";
{
  let x = "local";
  show();
}`,
  },
  timing: {
    title: 'Timing a loop with a native',
    lang: 'drip',
    code: `print clock;

let start = clock();
let sum = 0;
for (let i = 0; i < 100000; i = i + 1) {
  sum = sum + i;
}
print sum;
print clock() - start;`,
  },
};

const solution = `function makeNative(n, fn) {
  return {
    callable: true,
    arity: () => n,
    call: (args) => fn(args),
  };
}

const isCallable = (v) =>
  typeof v === 'object' &&
  v !== null && v.callable === true;

function callValue(callee, args) {
  if (!isCallable(callee)) {
    throw new Error(
      'Can only call functions ' +
      'and classes.');
  }
  const n = callee.arity();
  if (args.length !== n) {
    throw new Error(
      \`Expected \${n} arguments \` +
      \`but got \${args.length}.\`);
  }
  return callee.call(args);
}`;

const lenient = `function makeNative(n, fn) {
  return {
    callable: true,
    arity: () => n,
    call: (args) => fn(args),
  };
}

function callValue(callee, args) {
  if (!callee.callable) {
    throw new Error(
      'Can only call functions ' +
      'and classes.');
  }
  const n = callee.arity();
  if (args.length < n) {
    throw new Error(
      \`Expected \${n} arguments \` +
      \`but got \${args.length}.\`);
  }
  return callee.call(args);
}`;

const late = `function makeNative(n, fn) {
  return {
    callable: true,
    arity: () => n,
    call: (args) => fn(args),
  };
}

function callValue(callee, args) {
  if (typeof callee !== 'object' ||
      callee === null ||
      !callee.callable) {
    throw new Error(
      'Can only call functions ' +
      'and classes.');
  }
  const result = callee.call(args);
  const n = callee.arity();
  if (args.length !== n) {
    throw new Error(
      \`Expected \${n} arguments \` +
      \`but got \${args.length}.\`);
  }
  return result;
}`;

export const exercises = {
  callValue: {
    title: 'Calls with arity checks',
    prompt: `Write the two halves of a call.

- \`makeNative(n, fn)\` returns a callable: an object with \`callable: true\`, \`arity()\` returning \`n\`, and \`call(args)\` returning \`fn(args)\`.
- \`callValue(callee, args)\` calls \`callee\` with the array \`args\`. If \`callee\` is not an object with \`callable === true\` (numbers, strings and \`null\` aren't), throw an \`Error\` with the message \`Can only call functions and classes.\` If \`args.length\` differs from \`callee.arity()\`, throw \`Expected N arguments but got M.\` **without** calling it. Otherwise return what \`callee.call(args)\` returns.`,
    starter: `function makeNative(n, fn) {
  // your code here
}

function callValue(callee, args) {
  // your code here
}

const add = makeNative(2,
  (xs) => xs[0] + xs[1]);
console.log(callValue(add, [1, 2]));`,
    solution,
    tests: `const msg = (f) => {
  try { f(); } catch (e) { return e.message; }
  return 'no error';
};
test('a native can be called', () => {
  const add = makeNative(2, (xs) => xs[0] + xs[1]);
  expect(add.arity()).toBe(2);
  expect(callValue(add, [3, 4])).toBe(7);
});
test('zero arguments is fine too', () => {
  const now = makeNative(0, () => 42);
  expect(callValue(now, [])).toBe(42);
});
test('too few arguments', () => {
  const f = makeNative(2, () => 0);
  expect(msg(() => callValue(f, [1])))
    .toBe('Expected 2 arguments but got 1.');
});
test('too many arguments', () => {
  const f = makeNative(1, () => 0);
  expect(msg(() => callValue(f, [1, 2, 3])))
    .toBe('Expected 1 arguments but got 3.');
});
test('a mismatch never runs the body', () => {
  let ran = false;
  const f = makeNative(1, () => { ran = true; });
  msg(() => callValue(f, []));
  expect(ran).toBe(false);
});
test('non-callables are refused', () => {
  const m = 'Can only call functions and classes.';
  expect(msg(() => callValue(123, []))).toBe(m);
  expect(msg(() => callValue('hi', []))).toBe(m);
  expect(msg(() => callValue(null, []))).toBe(m);
  expect(msg(() => callValue({}, []))).toBe(m);
});`,
    hints: [
      '`makeNative` just returns an object literal with three properties; two of them are arrow functions.',
      'Check callability first: `typeof v === \'object\' && v !== null && v.callable === true`. Remember that `typeof null` is `\'object\'`.',
      'Then compare `args.length` with `callee.arity()` using `!==`, and throw before calling. Use a template literal for the message.',
    ],
    walkthrough: `This is the \`call\` case of the interpreter, with the evaluating already done.

- **\`makeNative\`** is \`NativeFunction\` as an object literal. The callee doesn't need to know it's native: anything with \`arity\` and \`call\` will do. That's the point of the callable interface.
- **Callable check first.** You can't even ask \`123\` for its arity. The \`v !== null\` test matters because \`typeof null\` is \`'object'\`, and \`null.callable\` would crash with a TypeError instead of Drip's message.
- **Arity check before calling.** \`!==\` catches both too few and too many. And it must come *before* \`callee.call\`, or a native with side effects would already have done its work by the time you complain.

\`\`\`js
if (!isCallable(callee)) throw ...;
if (args.length !== callee.arity())
  throw ...;
return callee.call(args);
\`\`\`

The message says "1 arguments" for arity 1. That's the companion's (and the Lox test suite's) exact wording, so it is kept.`,
    wrong: [
      {
        code: lenient,
        why: 'Two problems. `args.length < n` lets extra arguments through, which Drip rejects. And `!callee.callable` crashes with a TypeError on `null`, instead of throwing Drip’s message.',
      },
      {
        code: late,
        why: 'This calls the function first and checks the arity afterwards, so on a mismatch the body has already run. Check before you call.',
      },
    ],
  },
  squares: {
    optional: true,
    lang: 'drip',
    title: 'Your first Drip function',
    prompt:
      'The loop below calls `square`, which doesn’t exist yet. Above it, declare a Drip function `square(n)` that prints `n * n`, so the program prints `1`, `4`, `9`, `16`, `25`.',
    starter: `// declare square here

for (let i = 1; i <= 5; i = i + 1) {
  square(i);
}`,
    solution: `fn square(n) {
  print n * n;
}

for (let i = 1; i <= 5; i = i + 1) {
  square(i);
}`,
    tests: `1
4
9
16
25`,
    hints: [
      'A Drip function starts with the keyword `fn`, then the name, then the parameters in brackets.',
      'The body is a block: `{ print n * n; }`.',
    ],
    walkthrough: `\`fn square(n) { print n * n; }\` defines a global \`square\` holding a function value of arity 1.

Each trip round the loop evaluates \`square(i)\`: look up \`square\`, evaluate \`i\`, check that 1 argument matches arity 1, then make a fresh environment with \`n\` set to the current \`i\` and run the body in it. The function's environment has the globals as its parent, but it never needs them: \`n\` is found in the call's own environment.

The declaration has to come before the loop. Drip runs the program top to bottom, so if the loop came first, \`square\` wouldn't be defined yet when it is looked up.`,
    wrong: [
      {
        code: `for (let i = 1; i <= 5; i = i + 1) {
  square(i);
}

fn square(n) {
  print n * n;
}`,
        why: 'The loop runs before the declaration has been executed, so the first lookup of `square` fails: `Undefined variable \'square\'.`',
      },
      {
        code: `fn square() {
  print i * i;
}

for (let i = 1; i <= 5; i = i + 1) {
  square(i);
}`,
        why: '`square` takes no parameters, so `square(i)` fails the arity check: `Expected 0 arguments but got 1.` (And `i` lives in the loop, which `square` can’t see.)',
      },
    ],
  },
};

export const quiz = [
  {
    q: `What does this print?
\`\`\`
fn greet(name) {
  print "hi " + name;
}
print "start";
\`\`\``,
    options: [
      { t: '`hi nil` then `start`', why: 'The body only runs when `greet` is called, and it never is.' },
      { t: 'A runtime error: `name` is undefined', why: 'Nothing evaluates `name`, because the body never runs.' },
      { t: '`start`', correct: true, why: 'The declaration just defines `greet` as a function value. Only the `print` statement produces output.' },
      { t: '`<fn greet>` then `start`', why: 'A declaration doesn’t print anything. You’d see `<fn greet>` only by printing `greet`.' },
    ],
  },
  {
    q: '`fn f(a, b, c) {}` then `f(1, 2);` What happens?',
    options: [
      { t: '`c` is set to `nil` and the body runs', why: 'That is close to JavaScript’s behaviour (with `undefined`). Drip checks arity.' },
      { t: 'A runtime error: `Expected 3 arguments but got 2.`', correct: true, why: 'The argument count must match the arity exactly, and the check happens before the call.' },
      { t: 'A syntax error', why: 'It parses fine. The mismatch is found while running.' },
      { t: 'The extra parameter is ignored', why: 'Parameters are never ignored. Mismatches are errors.' },
    ],
  },
  {
    q: 'Which of these is NOT a callable in Drip?',
    options: [
      { t: 'A function declared with `fn`', why: 'Drip functions are callables.' },
      { t: '`clock`', why: '`clock` is a native function, which is a callable.' },
      { t: 'A class (from chapter 61)', why: 'Calling a class makes an instance, so classes are callables too.' },
      { t: 'The string `"add"`', correct: true, why: 'Strings are runtime values with no `call`. `"add"()` is the error `Can only call functions and classes.`' },
    ],
  },
  {
    q: 'When `add(1, 2)` is called, where are `a` and `b` defined?',
    options: [
      { t: 'In a new environment made for this call', correct: true, why: '`call` creates a fresh environment, defines each parameter in it, and runs the body there.' },
      { t: 'In the globals', why: 'Then two calls, or a recursive call, would overwrite each other’s parameters.' },
      { t: 'In the caller’s environment', why: 'The caller’s variables are untouched. The new environment’s parent is the function’s own stored environment.' },
      { t: 'In the function value itself', why: 'The function value holds the declaration and an environment, not argument values. Those belong to one call.' },
    ],
  },
  {
    q: `What does this print?
\`\`\`
fn show() { print x; }
let x = "global";
{
  let x = "local";
  show();
}
\`\`\``,
    options: [
      { t: '`local`', why: 'That would happen if the call’s environment had the caller’s environment as its parent. Drip uses where the function was declared.' },
      { t: 'A runtime error: `x` is undefined', why: 'By the time `show()` runs, the global `x` exists.' },
      { t: '`nil`', why: '`x` holds a string in both places.' },
      { t: '`global`', correct: true, why: 'The call’s environment hangs off `show`’s declaring environment, the globals, so the lookup never sees the block’s `x`.' },
    ],
  },
  {
    q: 'Why does the interpreter provide `clock` as a native function?',
    options: [
      { t: 'Native functions run faster, and clock is called often', why: 'Speed can be a reason for natives, but here the reason is simpler.' },
      { t: 'Drip has no way to read the time itself, so the host language must do it', correct: true, why: 'No Drip expression can ask the outside world anything. `clock` wraps `performance.now()` from TypeScript.' },
      { t: 'Functions with zero parameters must be native', why: 'You can declare `fn f() { ... }` in Drip with arity 0.' },
      { t: 'So that it doesn’t need an arity check', why: 'Calling `clock` goes through the same arity check; its arity is 0.' },
    ],
  },
];
