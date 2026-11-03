// Cards for Closure conversion and lambda lifting: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'free-what': {
    q: 'What is a free variable of a function?',
    a: 'A variable it uses but neither declares nor takes as a parameter, such as `n` in `(x) => x + n`.',
  },
  'cc-what': {
    q: 'In a closure-converted program, how is a function value that may be called from anywhere represented?',
    a: 'As a pair: a pointer to the code, and an environment record holding its free variables (or boxes for them).',
  },
  'cc-call': {
    q: 'After closure conversion, what does a call `f(a)` become?',
    a: '`f.code(f.env, a)`: the code is called with the record as an extra first argument.',
  },
  'cc-v8': {
    q: 'In V8, what is the heap object that holds the variables a closure captures called?',
    a: 'A context: the enclosing function creates it (`CreateFunctionContext`), stores captured variables in its slots, and `CreateClosure` pairs the code with it.',
  },
  'cc-mutate': {
    q: 'In closure conversion, why is copying a captured variable\'s value into the record wrong when the variable is assigned after capture?',
    a: 'The closure and the code around it must see one variable; a copy would drift apart, so the variable is put in a shared heap box and the box is captured (assignment conversion).',
  },
  'lift-what': {
    q: 'What does lambda lifting do to a nested function?',
    a: 'Moves it to the top level and adds its free variables as extra parameters, passed at every call.',
  },
  'lift-when': {
    q: 'Why can a nested function with free variables that is returned as a value not be lambda-lifted?',
    a: 'Its callers only hold the function, so they cannot supply the extra arguments for its free variables.',
  },
  'lift-cost': {
    q: 'What does lambda lifting save, compared with closure conversion?',
    a: 'The allocation of an environment record each time a function value is made.',
  },
};

export const examples = {
  'convert-by-hand': {
    title: 'Closure conversion by hand',
    code: `// a closure is { code, env }
function addCode(env, x) {
  return x + env.n;
}
function adder(n) {
  return { code: addCode, env: { n } };
}
function call(c, ...args) {
  return c.code(c.env, ...args);
}
const add1 = adder(1);
const add5 = adder(5);
console.log(call(add1, 2),
  call(add5, 2));
console.log(add1.code === add5.code);`,
  },
};

export const exercises = {
  'free-vars': {
    title: 'Find the free variables',
    prompt: 'Expressions of a tiny language are arrays: `[\'num\', 1]`, `[\'var\', \'x\']`, `[\'add\', a, b]`, `[\'call\', f, arg1, ...]` and `[\'fn\', [\'x\', \'y\'], body]` (a function with parameters `x` and `y`). Write `freeVars(e)`, which returns the names of the free variables of `e`, **sorted and without repeats**. A variable is free if it is not a parameter of a `fn` that encloses it.',
    starter: `function freeVars(e, bound = []) {
  return [];
}`,
    solution: `function freeVars(e, bound = []) {
  const [k] = e;
  if (k === 'num') return [];
  if (k === 'var') {
    return bound.includes(e[1])
      ? [] : [e[1]];
  }
  if (k === 'fn') {
    return freeVars(e[2],
      [...bound, ...e[1]]);
  }
  // add and call: every part
  const all = e.slice(1).flatMap(
    (x) => freeVars(x, bound));
  return [...new Set(all)].sort();
}`,
    tests: `const v = (x) => ['var', x];
const add = (a, b) => ['add', a, b];
const fn = (ps, b) => ['fn', ps, b];
test('a number has none', () => {
  expect(freeVars(['num', 1])).toEqual([]);
});
test('a variable on its own is free', () => {
  expect(freeVars(v('x'))).toEqual(['x']);
});
test('sorted, without repeats', () => {
  expect(freeVars(add(v('y'), v('x'))))
    .toEqual(['x', 'y']);
  expect(freeVars(add(v('x'), v('x'))))
    .toEqual(['x']);
});
test('parameters are bound', () => {
  const e = fn(['x'], add(v('x'), v('n')));
  expect(freeVars(e)).toEqual(['n']);
});
test('adder has no free variables', () => {
  const e = fn(['n'],
    fn(['x'], add(v('x'), v('n'))));
  expect(freeVars(e)).toEqual([]);
});
test('calls: the function counts too', () => {
  const e = ['call', v('f'), v('a')];
  expect(freeVars(e)).toEqual(['a', 'f']);
});
test('a parameter only binds inside', () => {
  const e = add(v('x'), fn(['x'], v('x')));
  expect(freeVars(e)).toEqual(['x']);
});`,
    hints: [
      'Walk the tree, carrying a list of the names that are bound at this point (the parameters of every `fn` you are inside). Start with an empty list.',
      'Five cases: a number has none; a variable is free unless it is in the bound list; a `fn` adds its parameters to the bound list and looks at its body; `add` and `call` combine the answers of all their parts.',
      'For `add` and `call`, `e.slice(1).flatMap((x) => freeVars(x, bound))` collects every part, then `[...new Set(all)].sort()` removes repeats and sorts.',
    ],
    walkthrough: `**How to think about it.** "Free" is a question about where a name is used compared with where it is bound, so the function has to remember, as it walks down the tree, which names are bound at the current point. That is the second parameter, \`bound\`: it starts empty, and each time the walk enters a \`fn\`, that function's parameters are added for the walk through its body (and only its body). A variable is free exactly when it is reached with its name not in \`bound\`. Everything else is collecting answers from the parts.

**The solution, line by line.**

- \`function freeVars(e, bound = []) {\` takes an expression and the bound names, which default to none, so callers write \`freeVars(e)\`.
- \`const [k] = e;\` reads the kind of node from element 0.
- \`if (k === 'num') return [];\` a number uses no variables.
- \`if (k === 'var') {\` a use of a name.
- \`return bound.includes(e[1]) ? [] : [e[1]];\` (two lines): if some enclosing \`fn\` binds the name, it is not free; otherwise it is the one free variable here.
- \`if (k === 'fn') {\` a function: its parameters \`e[1]\` bind inside its body \`e[2]\`.
- \`return freeVars(e[2], [...bound, ...e[1]]);\` (two lines) walks the body with the parameters added. A new array is made, so the parameters do not leak out to the function's neighbours, which is what the last test checks: in \`x + fn(x) { x }\`, the outer \`x\` is still free.
- \`const all = e.slice(1).flatMap((x) => freeVars(x, bound));\` handles \`add\` and \`call\` together: both are a kind followed by parts, and for \`call\` the function being called is a part too (the \`f\` in \`f(a)\` is a variable like any other).
- \`return [...new Set(all)].sort();\` drops repeats with a \`Set\` and sorts the names.

The \`fn\` case can return the body's answer directly, because every recursive answer is already sorted and free of repeats.

This is the first step of both transformations in the chapter: closure conversion makes one record field per free variable, and lambda lifting one extra parameter per free variable.

**Common wrong attempts.**

- Ignoring \`bound\` reports parameters as free: \`fn(x) { x + n }\` would give \`['n', 'x']\`.
- Walking only \`e.slice(2)\` for a call skips the function position, so \`f(a)\` would report only \`a\`.`,
    wrong: [
      {
        code: `function freeVars(e, bound = []) {
  const [k] = e;
  if (k === 'num') return [];
  if (k === 'var') return [e[1]];
  if (k === 'fn') return freeVars(e[2]);
  const all = e.slice(1).flatMap(
    (x) => freeVars(x));
  return [...new Set(all)].sort();
}`,
        why: 'It never records parameters as bound, so every variable is reported as free.',
      },
      {
        code: `function freeVars(e, bound = []) {
  const [k] = e;
  if (k === 'num') return [];
  if (k === 'var') {
    return bound.includes(e[1])
      ? [] : [e[1]];
  }
  if (k === 'fn') {
    return freeVars(e[2],
      [...bound, ...e[1]]);
  }
  const all = e.slice(2).flatMap(
    (x) => freeVars(x, bound));
  return [...new Set(all)].sort();
}`,
        why: 'For `add` and `call` it skips the first part, so the called function and the left operand are missed.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'What are the free variables of `(x) => x * k + y`?',
    options: [
      {
        t: '`x`, `k` and `y`',
        why: '`x` is the parameter, so it is bound.',
      },
      {
        t: '`k` and `y`',
        correct: true,
        why: 'They are used but not declared or taken as parameters.',
      },
      {
        t: 'None: a function needs nothing from outside',
        why: 'It cannot run without values for `k` and `y` from outside.',
      },
    ],
  },
  {
    q: 'After closure conversion, `adder(1)` and `adder(5)` each return a closure. What do the two closures share?',
    options: [
      {
        t: 'The environment record',
        why: 'Each call to `adder` builds its own record, `{ n: 1 }` and `{ n: 5 }`.',
      },
      {
        t: 'Nothing: each has its own copy of the code',
        why: 'The code is one top-level function; only the records differ.',
      },
      {
        t: 'The code pointer',
        correct: true,
        why: 'Both point at the one `addCode`, so `add1.code === add5.code` is `true`.',
      },
      {
        t: 'A stack frame of `adder`',
        why: 'A closure cannot rely on `adder`’s frame, which is gone once `adder` returns; that is the problem conversion solves.',
      },
    ],
  },
  {
    q: 'In Python 3.13’s bytecode for `adder`, what does `BUILD_TUPLE 1` build?',
    options: [
      {
        t: 'The environment: a tuple holding the cell for `n`',
        correct: true,
        why: '`SET_FUNCTION_ATTRIBUTE 8 (closure)` then attaches it to the new function.',
      },
      {
        t: 'The arguments for calling `add`',
        why: '`add` is not called here, only created.',
      },
      {
        t: 'A list of `add`’s parameters',
        why: 'Parameters are part of the code object; the tuple holds captured cells.',
      },
      {
        t: 'The return value of `adder`',
        why: 'That is the function made by `MAKE_FUNCTION`; the tuple goes inside it.',
      },
    ],
  },
  {
    q: 'Why does `let c = 0; const inc = () => ++c;` need more than copying `c` into the record?',
    options: [
      {
        t: 'Because `c` is a number',
        why: 'The type does not matter; assignment does.',
      },
      {
        t: 'Because records cannot hold numbers',
        why: 'They can; the problem is that a copy would not stay in step with the original.',
      },
      {
        t: 'Because the closure and the code around it must see one shared `c`, so `c` is boxed and the box is captured',
        correct: true,
        why: 'That is assignment conversion; Python’s cells and Lua’s closed upvalues are such boxes.',
      },
    ],
  },
  {
    q: 'Which nested function with free variables can be lambda-lifted?',
    options: [
      {
        t: 'One that is returned from its parent',
        why: 'Its callers could not supply the extra arguments; it must be closure-converted.',
      },
      {
        t: 'One stored in an array for later',
        why: 'Whoever takes it out of the array does not know its free variables either.',
      },
      {
        t: 'One that is only ever called by name inside its parent',
        correct: true,
        why: 'Every call is known, so each can be given the free variables as arguments.',
      },
      {
        t: 'Any of them, because lifting is always allowed',
        why: 'Lifting changes every call, so it needs every call to be known.',
      },
    ],
  },
];
