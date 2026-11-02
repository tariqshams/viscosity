// Chapter 174 cards. Keys are stable ids: never rename them.

export const prompts = {
  'ast-to-ir-what': {
    q: 'What does AST-to-IR translation (lowering) do with an expression, and with a statement?',
    a: 'An expression becomes instructions that compute it, returning the value holding the result. A statement adds instructions and, for control flow, blocks and branches.',
  },
  'resolve-first': {
    q: 'Why does Viscosity resolve scopes before it lowers anything?',
    a: 'Lowering must know which binding each identifier means, and whether any closure uses it, before it can pick SSA or a binding.',
  },
  usedin: {
    q: 'What does a binding’s `usedIn` set tell the lowering?',
    a: 'The functions that reference it. If any of them is not the declaring function, a closure captures it, so it must be a binding.',
  },
  'ssa-rule': {
    q: 'When does Viscosity lower a JavaScript variable to SSA values?',
    a: 'When it is a const, let, var, parameter or catch variable that no other function uses, is never assigned inside try, and is not initialized with an array.',
  },
  'array-binding': {
    q: 'Why is `const ps = []` always a binding, never SSA?',
    a: 'So every read of ps is a visible load and the collection analysis can find all its uses by scanning loads and stores.',
  },
  'try-binding': {
    q: 'Why are variables assigned inside `try` never SSA?',
    a: 'The lowering doesn’t model exception edges, so SSA values could be wrong in the catch block. Explicit loads and stores stay correct.',
  },
  readtarget: {
    q: 'In `p.x += 1`, why does `readTarget` lower `p` once and share it between get and set?',
    a: 'JavaScript evaluates the target object once; lowering it twice could repeat side effects and would hide that read and write touch the same object.',
  },
  'update-unop': {
    q: 'Why does `x++` lower to `unop +` before the add?',
    a: 'That is ToNumber: postfix ++ returns the old value converted to a number, even if x held a string.',
  },
  'math-intrinsic': {
    q: 'When is `Math.sqrt(x)` lowered to an intrinsic instead of a call?',
    a: 'Only when `Math` resolves to the global binding; a local variable named Math could be anything.',
  },
  'forof-index': {
    q: 'What does `for (const p of ps)` become in VIR when `ps` is an identifier?',
    a: 'An index loop: a phi for a hidden index in the head, a `< length` test, and `index.get ps, i` for p in the body.',
  },
  hoist: {
    q: 'How does lowering make `sq(3)` work when `function sq` is declared below the call?',
    a: 'Function declarations are hoisted: each is lowered first, and a closure is stored in its binding at the top of the scope.',
  },
  'opaque-what': {
    q: 'What is an `opaque` instruction?',
    a: 'A stand-in for code VIR doesn’t model. Its arguments are the variables that code mentions; its result is unknown.',
  },
  'opaque-mentioned': {
    q: 'What would go wrong if an opaque instruction dropped the variables its code mentions?',
    a: 'A collection used inside unmodelled code would look untouched, and Viscosity could change a layout that code depends on.',
  },
};

export const examples = {};

export const exercises = {
  lowerStmts: {
    title: 'Lower statements to SSA instructions',
    prompt:
      'Write `lower(stmts)`. A statement is `[\'let\', name, e]`, `[\'set\', name, e]` or `[\'log\', e]`. An expression is a number, a variable name, or `[op, a, b]`. Return a list of instruction strings, numbering values from `%0`:\n\n- a number `n` emits `%k = const n`\n- `[op, a, b]` lowers `a`, then `b`, then emits `%k = binop op %a, %b`\n- a variable name emits **nothing**: it is SSA, so it is just the value it was last given\n- `let` and `set` emit nothing themselves; they record which value the name now holds\n- `log` emits `log %v`\n\nThrow an `Error` for a name that was never declared with `let`.',
    starter: `function lower(stmts) {
  const out = [];
  // your code here
  return out;
}

console.log(lower([
  ['let', 'a', 1],
  ['set', 'a', ['+', 'a', 2]],
  ['log', 'a'],
]));`,
    solution: `function lower(stmts) {
  const out = [];
  const env = new Map();
  let next = 0;
  const get = (name) => {
    if (!env.has(name)) {
      throw new Error('no ' + name);
    }
    return env.get(name);
  };
  function expr(e) {
    if (typeof e === 'number') {
      out.push(\`%\${next} = const \${e}\`);
      return next++;
    }
    if (typeof e === 'string') {
      return get(e);
    }
    const a = expr(e[1]);
    const b = expr(e[2]);
    const t = \`\${e[0]} %\${a}, %\${b}\`;
    out.push(\`%\${next} = binop \${t}\`);
    return next++;
  }
  for (const s of stmts) {
    if (s[0] === 'log') {
      out.push('log %' + expr(s[1]));
    } else {
      if (s[0] === 'set') get(s[1]);
      env.set(s[1], expr(s[2]));
    }
  }
  return out;
}`,
    tests: `test('constants and log', () => {
  expect(lower([['let', 'a', 7], ['log', 'a']])).toEqual(['%0 = const 7', 'log %0']);
});
test('a name is its latest value', () => {
  expect(lower([
    ['let', 'a', 1],
    ['set', 'a', ['+', 'a', 2]],
    ['log', 'a'],
  ])).toEqual(['%0 = const 1', '%1 = const 2', '%2 = binop + %0, %1', 'log %2']);
});
test('left before right', () => {
  expect(lower([['log', ['-', 5, ['*', 2, 3]]]])).toEqual([
    '%0 = const 5', '%1 = const 2', '%2 = const 3',
    '%3 = binop * %1, %2', '%4 = binop - %0, %3', 'log %4',
  ]);
});
test('reads emit nothing', () => {
  expect(lower([
    ['let', 'x', 4],
    ['let', 'y', ['*', 'x', 'x']],
    ['log', 'y'],
  ])).toEqual(['%0 = const 4', '%1 = binop * %0, %0', 'log %1']);
});
test('unknown names throw', () => {
  expect(() => lower([['log', 'z']])).toThrow();
  expect(() => lower([['set', 'z', 1]])).toThrow();
});`,
    hints: [
      'Keep a `Map` from name to value number, and a counter `next` for the next `%k`.',
      'Write a recursive `expr(e)` that returns a value number: a number emits a `const`, a name looks itself up, an array lowers both sides and emits a `binop`.',
      'For `set`, check that the name exists first, then lower the right side and update the map. Lowering `a + 2` must read the *old* `a`.',
    ],
    walkthrough: `This is the core of \`lower.ts\` at toy size: \`expr\` returns a value, statements only add instructions, and SSA variables are a map, not memory.

- **Names are a map.** \`env\` plays the role of \`writeVariable\`/\`readVariable\`. There are no branches here, so there is never a phi: the current value of a name is simply the last one written.
- **Reads emit nothing.** In \`x * x\`, both operands are \`%0\`. If variables were bindings, you would emit two loads instead, and the analyses would have to work out that they read the same thing.
- **Order matters.** Lowering \`a\` before \`b\` matches JavaScript’s left-to-right evaluation, and fixes the numbering.
- **\`set\` reads before it writes.** \`env.set(name, expr(...))\` lowers the right side first, so \`a + 2\` sees the old \`a\`, exactly like \`a = a + 2\`.

The real lowering adds blocks, phis at joins, bindings for captured variables, and \`opaque\` for everything it doesn’t model.`,
    wrong: [
      {
        code: `function lower(stmts) {
  const out = [];
  let next = 0;
  function expr(e) {
    if (typeof e === 'number') {
      out.push(\`%\${next} = const \${e}\`);
      return next++;
    }
    if (typeof e === 'string') {
      out.push(\`%\${next} = load \${e}\`);
      return next++;
    }
    const a = expr(e[1]);
    const b = expr(e[2]);
    const t = \`\${e[0]} %\${a}, %\${b}\`;
    out.push(\`%\${next} = binop \${t}\`);
    return next++;
  }
  for (const s of stmts) {
    if (s[0] === 'log') {
      out.push('log %' + expr(s[1]));
    } else {
      const v = expr(s[2]);
      out.push(\`store \${s[1]}, %\${v}\`);
    }
  }
  return out;
}`,
        why: 'That treats every variable as a binding, with loads and stores. It is a valid lowering, but not SSA: the values and their numbering differ, and unknown names are never caught.',
      },
      {
        code: `function lower(stmts) {
  const out = [];
  const env = new Map();
  let next = 0;
  const get = (name) => {
    if (!env.has(name)) {
      throw new Error('no ' + name);
    }
    return env.get(name);
  };
  function expr(e) {
    if (typeof e === 'number') {
      out.push(\`%\${next} = const \${e}\`);
      return next++;
    }
    if (typeof e === 'string') {
      return get(e);
    }
    const b = expr(e[2]);
    const a = expr(e[1]);
    const t = \`\${e[0]} %\${a}, %\${b}\`;
    out.push(\`%\${next} = binop \${t}\`);
    return next++;
  }
  for (const s of stmts) {
    if (s[0] === 'log') {
      out.push('log %' + expr(s[1]));
    } else {
      if (s[0] === 'set') get(s[1]);
      env.set(s[1], expr(s[2]));
    }
  }
  return out;
}`,
        why: 'It lowers the right operand first. JavaScript evaluates left to right, and with side effects (a call on each side) the order would be visibly wrong.',
      },
    ],
  },
  mentioned: {
    optional: true,
    title: 'What does this subtree mention?',
    prompt:
      'Write `mentioned(node)` for ESTree-like nodes. Return the names of every `Identifier` in the subtree, each once, in the order first seen. But skip names that are not variables: the property of a **non-computed** `MemberExpression` (`p.x` mentions `p`, not `x`) and the key of a **non-computed** `Property` (`{ a: v }` mentions `v`). Computed ones (`p[i]`, `{ [k]: v }`) mention both sides.',
    starter: `function mentioned(node) {
  const out = [];
  function visit(n) {
    if (!n) return;
    if (typeof n !== 'object') return;
    if (Array.isArray(n)) {
      n.forEach(visit);
      return;
    }
    if (n.type === 'Identifier') {
      out.push(n.name);
      return;
    }
    for (const k in n) visit(n[k]);
  }
  visit(node);
  return out;
}`,
    solution: `function mentioned(node) {
  const out = [];
  function visit(n) {
    if (!n) return;
    if (typeof n !== 'object') return;
    if (Array.isArray(n)) {
      n.forEach(visit);
      return;
    }
    if (n.type === 'Identifier') {
      if (!out.includes(n.name)) {
        out.push(n.name);
      }
      return;
    }
    const plain = !n.computed;
    if (n.type === 'MemberExpression'
      && plain) {
      visit(n.object);
      return;
    }
    if (n.type === 'Property'
      && plain) {
      visit(n.value);
      return;
    }
    for (const k in n) visit(n[k]);
  }
  visit(node);
  return out;
}`,
    tests: `const id = (name) => ({ type: 'Identifier', name });
const mem = (o, p, computed = false) => ({ type: 'MemberExpression', object: o, property: p, computed });
const prop = (k, v, computed = false) => ({ type: 'Property', key: k, value: v, computed });
test('p.x mentions only p', () => {
  expect(mentioned(mem(id('p'), id('x')))).toEqual(['p']);
});
test('p[i] mentions both', () => {
  expect(mentioned(mem(id('p'), id('i'), true))).toEqual(['p', 'i']);
});
test('object keys are not variables', () => {
  const o = { type: 'ObjectExpression', properties: [prop(id('a'), id('v')), prop(id('k'), id('w'), true)] };
  expect(mentioned(o)).toEqual(['v', 'k', 'w']);
});
test('each name once, in order', () => {
  const call = { type: 'CallExpression', callee: mem(id('ps'), id('push')), arguments: [id('q'), id('ps')] };
  expect(mentioned(call)).toEqual(['ps', 'q']);
});`,
    hints: [
      'Visit generically: arrays element by element, objects field by field. Strings and numbers are not nodes.',
      'Special-case `MemberExpression` and `Property` when `computed` is false: visit only the object, or only the value.',
      'Use `out.includes` to keep each name once.',
    ],
    walkthrough: `This is \`mentioned\` from \`lower.ts\`, minus the bindings. The real one also skips globals (it asks the resolver), and reads nested functions’ variables as captured bindings.

- **Generic walk, two exceptions.** Most nodes are just containers, so visiting every field finds every identifier. Only two places hold an \`Identifier\` that is a *name* rather than a variable: \`p.x\` and \`{ x: v }\`.
- **Computed means it is an expression.** In \`p[i]\` and \`{ [k]: v }\`, the brackets hold real code, so \`i\` and \`k\` are variables and must be reported.
- **Why it matters.** Every name you return becomes an argument of an \`opaque\` instruction, which the analyses treat as an escape. Returning too many names (\`x\` in \`p.x\`) only makes Viscosity a little more cautious. Returning too few could let it change a layout the opaque code depends on.`,
    wrong: [
      {
        code: `function mentioned(node) {
  const out = [];
  function visit(n) {
    if (!n) return;
    if (typeof n !== 'object') return;
    if (Array.isArray(n)) {
      n.forEach(visit);
      return;
    }
    if (n.type === 'Identifier') {
      if (!out.includes(n.name)) {
        out.push(n.name);
      }
      return;
    }
    if (n.type === 'MemberExpression') {
      visit(n.object);
      return;
    }
    if (n.type === 'Property') {
      visit(n.value);
      return;
    }
    for (const k in n) visit(n[k]);
  }
  visit(node);
  return out;
}`,
        why: 'It ignores `computed`, so `p[i]` loses `i` and `{ [k]: w }` loses `k`. Too few names is the dangerous direction: those variables would look untouched.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Which variable does Viscosity lower to SSA values?',
    options: [
      { t: '`let n = 0;` read by an arrow function', why: 'Captured by a closure: it must be a binding the closure can load at any time.' },
      { t: '`let s = 0;` updated only in a loop in the same function', correct: true, why: 'Local, uncaptured, not assigned in try, not an array: it becomes values and phis.' },
      { t: '`const ps = [];` never reassigned', why: 'Array-initialized variables are always bindings, so the collection analysis sees every use.' },
      { t: '`let t;` assigned inside a `try` block', why: 'Exception edges are not modelled, so it stays a binding.' },
    ],
  },
  {
    q: 'What does `for (const p of ps) p.x += 1;` become in VIR?',
    options: [
      { t: 'One `opaque` instruction for the whole loop', why: 'Only when the right side is not a plain identifier do the test and element become opaque.' },
      { t: 'A call to `ps[Symbol.iterator]`', why: 'The iterator protocol is replaced by an index loop for identifiers.' },
      { t: 'A loop whose head has a phi for a hidden index, a `< length` test, and an `index.get` in the body', correct: true, why: 'So element i is an ordinary index.get the analyses understand.' },
      { t: 'A copy of the body for every element', why: 'That would be unrolling; the length isn’t even known.' },
    ],
  },
  {
    q: 'In the for-of lowering, why is the loop head sealed last?',
    options: [
      { t: 'Its back edge from the continue block doesn’t exist until the body is lowered', correct: true, why: 'Braun’s construction can only fill in a phi once all predecessors are known.' },
      { t: 'Sealing order doesn’t matter', why: 'Sealing early would build the index phi without its back-edge operand.' },
      { t: 'The head has no phis', why: 'It has the phi for the index.' },
      { t: 'Because the exit block must be sealed first', why: 'The exit is sealed after the head, and it is independent.' },
    ],
  },
  {
    q: '`const o = { a: 1, ...d };` lowers to `opaque(object literal) %2`, where `%2` is `d`. Why is `d` an argument?',
    options: [
      { t: 'To compute `a`', why: 'The constant 1 isn’t even lowered.' },
      { t: 'Opaque instructions always take one argument', why: 'They take every variable the code mentions, any number.' },
      { t: 'Because spread is a method call', why: 'It isn’t modelled at all; that is why it is opaque.' },
      { t: 'The unmodelled code might do anything with `d`, so the analyses must treat it as escaping', correct: true, why: 'Listing every mentioned variable is what keeps opaque sound.' },
    ],
  },
  {
    q: 'What does `ps[0].x++` lower to after the `index.get`?',
    options: [
      { t: 'field.get .x, unop +, const 1, binop +, field.set .x on the same element', correct: true, why: 'readTarget lowers the element once; unop + is ToNumber for the old value.' },
      { t: 'Two index.get instructions, one for the read and one for the write', why: 'The target is lowered once and shared.' },
      { t: 'An opaque update', why: 'Updates of identifiers and member expressions are modelled; only other targets are opaque.' },
      { t: 'A single `field.inc` instruction', why: 'VIR has no such instruction.' },
    ],
  },
  {
    q: 'When is `Math.max(a, b)` NOT lowered to an intrinsic?',
    options: [
      { t: 'When a and b are numbers', why: 'Argument types don’t matter to this choice.' },
      { t: 'When it is inside a loop', why: 'Position doesn’t matter.' },
      { t: 'When `Math` is a local variable, not the global', correct: true, why: 'A local Math could have any max method, so it lowers to a field.get and a call.' },
      { t: 'Never: max is always an intrinsic', why: 'Only for the global Math, and only for the listed pure functions.' },
    ],
  },
];
