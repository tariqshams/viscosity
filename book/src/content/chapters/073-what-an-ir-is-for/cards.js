// Chapter 73 cards. Keys are stable ids: never rename them.

export const prompts = {
  'ir-what': {
    q: 'What is an intermediate representation (IR)?',
    a: 'The form a compiler keeps a program in while it analyses and transforms it, between the source and the target.',
  },
  'why-not-source': {
    q: 'Why don’t optimizers analyse JavaScript source text directly?',
    a: 'There are too many ways to write the same thing. Every analysis would need a case for every spelling.',
  },
  'tree-hides': {
    q: 'In a syntax tree, where is the fact “this return only runs when the test is false” written?',
    a: 'Nowhere: it is implied by what an If node means. An IR spells it out as jumps between blocks.',
  },
  'lowering-what': {
    q: 'What is lowering?',
    a: 'Translating a program into a lower-level form, with fewer kinds of construct and more explicit steps.',
  },
  'same-vir': {
    q: 'What does `p.x += p.vx` lower to in VIR?',
    a: 'Three steps: `field.get` x and vx, a `binop +`, and a `field.set` of x. The same as `p.x = p.x + p.vx`.',
  },
  'plus-plus-why': {
    q: 'Why does `x++` lower to one more instruction (`unop +`) than `x += 1`?',
    a: '`x++` converts x to a number first, `x += 1` doesn’t: with x = "5" they give 6 and "51". Lowering makes that visible.',
  },
  'opaque-what': {
    q: 'What does an `opaque` instruction in VIR mean to the analyses?',
    a: '“Might do anything with these arguments.” Its arguments are treated as lost to unknown code, so Viscosity stays safe.',
  },
  'why-not-bytecode': {
    q: 'What does stack bytecode hide that an analysis needs?',
    a: 'Which instruction produced each value: the inputs are just “whatever is on top of the stack”.',
  },
  neutral: {
    q: 'Why does nothing in VIR’s list of ops mention JavaScript?',
    a: 'Each language’s front end does the lowering, so the analyses only ever see VIR and can be shared between languages.',
  },
  'sparkplug-no-ir': {
    q: 'Sparkplug compiles bytecode to machine code with no IR of its own. What does it gain, and what does it give up?',
    a: 'It compiles very fast, but without an IR it can’t do the analyses an optimizing compiler does.',
  },
};

export const examples = {
  'plus-plus': {
    title: '+= 1 and ++ are not the same',
    code: `let a = "5";
a += 1;
let b = "5";
b++;
console.log(a, b);`,
  },
};

const tests = `const V = (name) => ({ type: 'var', name });
test('x += e becomes x = x + e', () => {
  const e = { type: 'lit', value: 2 };
  expect(lower({ type: 'compound',
    name: 'x', op: '+=', value: e }))
    .toEqual({ type: 'assign', name: 'x',
      value: { type: 'bin', op: '+',
        left: V('x'), right: e } });
});
test('works for *= too', () => {
  const e = V('k');
  expect(lower({ type: 'compound',
    name: 'y', op: '*=', value: e }).value.op)
    .toBe('*');
});
test('x++ converts to a number first', () => {
  expect(lower({ type: 'update',
    name: 'i', op: '++' }))
    .toEqual({ type: 'assign', name: 'i',
      value: { type: 'bin', op: '+',
        left: { type: 'tonum', arg: V('i') },
        right: { type: 'lit', value: 1 } } });
});
test('x-- subtracts', () => {
  expect(lower({ type: 'update',
    name: 'i', op: '--' }).value.op)
    .toBe('-');
});
test('other nodes are unchanged', () => {
  const n = { type: 'assign', name: 'z',
    value: { type: 'lit', value: 0 } };
  expect(lower(n)).toBe(n);
});`;

const forTests = `const n = (value) => ({ type: 'lit', value });
const ini = { type: 'let', name: 'i' };
const tst = { type: 'lt' };
const upd = { type: 'update', name: 'i' };
const b1 = { type: 'print' };
test('init, then a while', () => {
  const out = lowerFor({ type: 'for',
    init: ini, test: tst, update: upd,
    body: [b1] });
  expect(out).toEqual([ini, { type: 'while',
    test: tst, body: [b1, upd] }]);
});
test('the update goes last', () => {
  const b2 = { type: 'call' };
  const out = lowerFor({ type: 'for',
    init: ini, test: tst, update: upd,
    body: [b1, b2] });
  expect(out[1].body).toEqual([b1, b2, upd]);
});
test('a missing test means true', () => {
  const out = lowerFor({ type: 'for',
    init: ini, test: null, update: upd,
    body: [] });
  expect(out[1].test).toEqual(n(true));
});`;

export const exercises = {
  'lower-assign': {
    title: 'Lower compound assignment',
    prompt:
      'A tiny tree has assignment in three spellings. Write `lower(node)` so only one is left.\n\n- `{ type: "compound", name, op, value }`, where `op` is `"+="`, `"-="` or `"*="`, becomes `{ type: "assign", name, value: { type: "bin", op: "+", left: { type: "var", name }, right: value } }` (with the matching operator).\n- `{ type: "update", name, op }`, where `op` is `"++"` or `"--"`, becomes an `assign` whose value is `{ type: "bin", op: "+", left: { type: "tonum", arg: { type: "var", name } }, right: { type: "lit", value: 1 } }`. The `tonum` is the number conversion `++` does.\n- Any other node is returned unchanged (the same object).\n\nTreat these as statements: ignore what the expression itself would return.',
    starter: `function lower(node) {
  return node;
}`,
    solution: `const v = (name) =>
  ({ type: 'var', name });
const lit1 = { type: 'lit', value: 1 };
const assign = (name, value) =>
  ({ type: 'assign', name, value });

function lower(n) {
  const x = v(n.name);
  if (n.type === 'compound') {
    const op = n.op.slice(0, -1);
    return assign(n.name, {
      type: 'bin', op,
      left: x, right: n.value,
    });
  }
  if (n.type === 'update') {
    const t = { type: 'tonum', arg: x };
    return assign(n.name, {
      type: 'bin', op: n.op[0],
      left: t, right: lit1,
    });
  }
  return n;
}`,
    tests,
    hints: [
      'Handle the two kinds separately with `if (n.type === ...)`, and `return n` at the end for everything else.',
      'For `compound`, the operator is the op without its `=`: `n.op.slice(0, -1)` turns `"+="` into `"+"`. For `update`, `n.op[0]` turns `"++"` into `"+"`.',
      'Build the result with object literals. A helper `v = (name) => ({ type: "var", name })` keeps lines short.',
    ],
    walkthrough: `Lowering is a function from one tree to a simpler tree:

\`\`\`js
if (n.type === 'compound') {
  const op = n.op.slice(0, -1);
  return assign(n.name, {
    type: 'bin', op,
    left: x, right: n.value,
  });
}
\`\`\`

- **Compound assignment** \`x op= e\` means \`x = x op e\`, so the new node reads the variable (the \`var\` node \`x\`), combines it with the old right-hand side, and assigns. \`slice(0, -1)\` drops the \`=\`.
- **Update** \`x++\` is *not* quite \`x += 1\`. It converts \`x\` to a number first, which is why VIR has the extra \`unop +\`. The \`tonum\` node is that conversion, made explicit. Leave it out and a later pass might fold \`"5" + 1\` into \`"51"\`, which is wrong.
- **Everything else** comes back as the same object, so the tests can check it with \`toBe\`.

After this pass, an analysis that wants to know “which variables are written?” needs one case, \`assign\`, instead of three. That is the whole point of lowering.`,
    wrong: [
      {
        code: `const v = (name) =>
  ({ type: 'var', name });
const assign = (name, value) =>
  ({ type: 'assign', name, value });

function lower(n) {
  if (n.type === 'compound') {
    const op = n.op.slice(0, -1);
    return assign(n.name, {
      type: 'bin', op,
      left: v(n.name), right: n.value,
    });
  }
  if (n.type === 'update') {
    const one = { type: 'lit',
      value: 1 };
    return lower({ type: 'compound',
      name: n.name, op: n.op[0] + '=',
      value: one });
  }
  return n;
}`,
        why: 'Turning `x++` into `x += 1` loses the number conversion: for `x = "5"` it would give `"51"` instead of `6`. The update needs a `tonum` around the read.',
      },
      {
        code: `const v = (name) =>
  ({ type: 'var', name });

function lower(n) {
  if (n.type === 'compound') {
    const value = { type: 'bin',
      op: n.op, left: v(n.name),
      right: n.value };
    return { type: 'assign',
      name: n.name, value };
  }
  return n;
}`,
        why: 'The operator keeps its `=` (`"+="` instead of `"+"`), and updates aren’t lowered at all.',
      },
    ],
  },
  'lower-for': {
    optional: true,
    title: 'Lower for into while',
    prompt:
      'Write `lowerFor(node)` for `{ type: "for", init, test, update, body }`, where `body` is an array of statements. Return an array of two statements: `init`, then `{ type: "while", test, body: [...body, update] }`. If `test` is `null` (as in `for (;;)`), use `{ type: "lit", value: true }`. Don’t worry about `continue` here.',
    starter: `function lowerFor(node) {
  return [node];
}`,
    solution: `function lowerFor(f) {
  const test = f.test ??
    { type: 'lit', value: true };
  return [f.init, {
    type: 'while', test,
    body: [...f.body, f.update],
  }];
}`,
    tests: forTests,
    hints: [
      'The result is an array: `[f.init, { type: "while", ... }]`.',
      'The loop body runs the old body, then the update: `[...f.body, f.update]`.',
      '`f.test ?? { type: "lit", value: true }` handles a missing test.',
    ],
    walkthrough: `\`\`\`js
function lowerFor(f) {
  const test = f.test ??
    { type: 'lit', value: true };
  return [f.init, {
    type: 'while', test,
    body: [...f.body, f.update],
  }];
}
\`\`\`

The init runs once, before the loop. The update runs at the end of every pass through the body, so it is appended. An empty test means “loop forever”, so it becomes a literal \`true\`.

This is the lowering Drip did in chapter 38, and it has a famous catch: a \`continue\` inside the body would now skip the update. Real lowerings, Viscosity’s included, avoid it by going one level lower, to blocks and jumps: \`continue\` jumps to a block that holds the update. That is where chapter 75 is heading.`,
    wrong: [
      {
        code: `function lowerFor(f) {
  return [f.init, {
    type: 'while', test: f.test,
    body: [f.update, ...f.body],
  }];
}`,
        why: 'The update runs before the body, so the first pass sees `i` already stepped. And a missing test stays `null`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Why does an optimizing compiler translate the program into an IR before analysing it?',
    options: [
      { t: 'Because the IR runs faster than the source', why: 'An IR is for analysis; it may never be run at all. Viscosity turns VIR back into JavaScript.' },
      { t: 'So that each analysis handles a few explicit instruction kinds instead of every way of writing the code', correct: true, why: 'Lowering collapses spellings and spells out control flow once, and every analysis benefits.' },
      { t: 'Because syntax trees can’t represent loops', why: 'Trees represent loops fine; Drip’s tree-walker runs them. They just hide the control flow inside node meanings.' },
      { t: 'To remove the need for a parser', why: 'The IR is built from the parser’s tree. The parser is still needed.' },
    ],
  },
  {
    q: 'In VIR, how do `x += 1` and `x = x + 1` compare?',
    options: [
      { t: 'They lower to identical instructions', correct: true, why: 'Both become a constant 1 and `binop +`. The spelling difference is gone.' },
      { t: '`x += 1` has an extra `unop +`', why: 'That is `x++`, which converts x to a number first.' },
      { t: '`x += 1` becomes an `opaque` instruction', why: 'Compound assignment is modelled; opaque is for things the lowering doesn’t understand.' },
      { t: 'They can’t be compared: one is a statement, one an expression', why: 'Both are assignment expressions, and both lower to the same VIR.' },
    ],
  },
  {
    q: '`let s = "5"; s++;` What is `s` now, and why does it matter to lowering?',
    options: [
      { t: '`"51"`; lowering can treat ++ as += 1', why: 'That is what `s += 1` gives. `++` converts to a number first.' },
      { t: '`"6"`; ++ works on strings', why: 'The result is the number 6, not a string.' },
      { t: 'It throws a TypeError', why: 'JavaScript converts the string to a number; nothing is thrown.' },
      { t: '`6`; so the lowering must make the number conversion explicit', correct: true, why: 'VIR emits `unop +` before adding 1. A lowering that skipped it would change what the program does.' },
    ],
  },
  {
    q: 'What does Viscosity’s front end do with `delete o.x`, which VIR has no instruction for?',
    options: [
      { t: 'Reports a compile error', why: 'The program is valid JavaScript; Viscosity must accept it.' },
      { t: 'Drops it, since the analyses don’t care about it', why: 'Dropping code would change the program’s behaviour.' },
      { t: 'Emits `opaque(delete)` with `o` as an argument, so the analyses assume anything may happen to `o`', correct: true, why: 'Opaque keeps the analyses sound: anything they can’t see into is treated as the worst case.' },
      { t: 'Lowers it to `field.set o, undefined .x`', why: 'Deleting a property is not the same as setting it to undefined: `"x" in o` would differ.' },
    ],
  },
  {
    q: 'Why is a stack-machine bytecode, like Drip’s, a poor IR for analysis?',
    options: [
      { t: 'It is too high-level', why: 'It is lower-level than VIR, if anything.' },
      { t: 'Its instructions don’t name their inputs, so you can’t easily see which instruction produced a value', correct: true, why: 'Inputs are “the top of the stack”. An analysis would have to simulate the stack to connect uses to definitions.' },
      { t: 'It has no jumps', why: 'Drip’s bytecode has jumps (chapter 55).' },
      { t: 'It can only represent numbers', why: 'It handles strings, objects and closures too.' },
    ],
  },
  {
    q: 'Which statement about lowering is true?',
    options: [
      { t: 'A compiler lowers exactly once', why: 'Many compilers lower in several stages, each to a lower IR.' },
      { t: 'Lowering always makes the program shorter', why: '`+=` becomes three instructions. Lowering usually makes it longer but simpler.' },
      { t: 'Lowering must keep every syntax detail so the source can be rebuilt', why: 'It deliberately drops spelling details. Viscosity keeps a pointer back to the source node instead.' },
      { t: 'It erases differences that don’t matter and makes ones that do matter explicit', correct: true, why: 'Like `+=` vs `= x +` (erased) and `++`’s number conversion (made an instruction).' },
    ],
  },
];
