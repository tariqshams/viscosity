// Chapter 185 cards. Keys are stable ids: never rename them.

export const prompts = {
  'ir-what': {
    q: 'What is an intermediate representation (IR)?',
    a: 'The form a compiler keeps a program in while it analyses and transforms it, between the source and the target.',
  },
  'why-not-source': {
    q: 'Why don’t optimisers analyse JavaScript source text directly?',
    a: 'There are too many ways to write the same thing. Every analysis would need a case for every spelling.',
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
    a: 'Which instruction produced each value: the inputs are only “whatever is on top of the stack”.',
  },
  'sparkplug-no-ir': {
    q: 'Sparkplug compiles bytecode to machine code with no IR of its own. What does it gain, and what does it give up?',
    a: 'It compiles very fast, but without an IR it can’t do the analyses an optimising compiler does.',
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
    walkthrough: `**How to think about it.** Lowering is a function from one tree to a simpler tree, so start by writing down, for each kind of input node, what it *means* in the simpler language. \`x += e\` means "read x, combine it with e, write the answer back to x", which is exactly \`x = x + e\`. \`x++\` means nearly the same with \`e\` being 1, except for one detail you saw in the chapter: it converts \`x\` to a number first. Everything else is already in the simple language, so it passes through untouched. Three cases, three branches.

**The solution, line by line.**

- \`const v = (name) => ({ type: 'var', name });\` is a tiny helper that builds a "read this variable" node. The brackets round the object are needed: without them JavaScript would read the braces as a function body.
- \`const lit1 = { type: 'lit', value: 1 };\` is the literal 1 that \`++\` and \`--\` add or subtract.
- \`const assign = (name, value) => ({ type: 'assign', name, value });\` builds the one kind of assignment that will be left after lowering. (\`{ name, value }\` is shorthand for \`{ name: name, value: value }\`.)
- \`function lower(n) {\` takes one node.
- \`const x = v(n.name);\` makes the "read x" node once, since both cases need it.
- \`if (n.type === 'compound') {\` handles \`+=\`, \`-=\` and \`*=\`.
- \`const op = n.op.slice(0, -1);\` drops the last character, so \`"+="\` becomes \`"+"\` (\`slice(0, -1)\` means "from the start up to, but not including, the last character").
- \`return assign(n.name, { type: 'bin', op, left: x, right: n.value });\` builds \`x = x op value\`: the left operand reads the variable and the right is the old right-hand side, unchanged.
- \`if (n.type === 'update') {\` handles \`++\` and \`--\`.
- \`const t = { type: 'tonum', arg: x };\` wraps the read in a number conversion; this is VIR's \`unop +\`, made explicit.
- \`return assign(n.name, { type: 'bin', op: n.op[0], left: t, right: lit1 });\` uses the first character of the operator (\`"++"[0]\` is \`"+"\`) and adds or subtracts 1.
- \`return n;\` hands back every other node as the same object, which is why the tests can check it with \`toBe\` (same object) rather than \`toEqual\` (same contents).

After this pass, an analysis that wants to know "which variables are written?" needs one case, \`assign\`, instead of three; that is the whole point of lowering.

**Common wrong attempts.**

- Lowering \`x++\` by turning it into \`x += 1\` and calling \`lower\` again. It is shorter, but it loses the number conversion: for \`x = "5"\` the program would compute \`"51"\` instead of \`6\`.
- Copying \`n.op\` straight into the \`bin\` node. Then the operator is \`"+="\`, which is not an arithmetic operator at all.
- Building a fresh copy of nodes you were meant to leave alone: the result looks equal, but it is a different object, and the last test checks identity.`,
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
    walkthrough: `**How to think about it.** A \`for\` loop is four pieces in one line: something to do once before the loop, a test, something to do after every pass, and a body. A \`while\` loop has only a test and a body, so the job is to put the other two pieces where they would have run: the init before the loop, and the update at the end of the body.

**The solution, line by line.**

- \`function lowerFor(f) {\` takes the \`for\` node.
- \`const test = f.test ?? { type: 'lit', value: true };\` uses the test if there is one; \`??\` (the "nullish" operator) picks the right-hand side only when the left is \`null\` or \`undefined\`, so \`for (;;)\` gets a test that is always true, which loops forever, as it should.
- \`return [f.init, {\` returns two statements: the init, which runs once, then the loop.
- \`type: 'while', test,\` makes the \`while\` node with the chosen test.
- \`body: [...f.body, f.update],\` copies the old body's statements (\`...\` spreads an array into a new one) and adds the update last, because it runs after each pass.
- \`}];\` and \`}\` close the object, the array and the function.

**Common wrong attempts.**

- Putting the update *first* in the body: the first pass would then see \`i\` already stepped.
- Passing \`f.test\` through unchanged: \`for (;;)\` would give a \`while\` whose test is \`null\`.

This lowering has a famous catch, which the tests leave out on purpose: a \`continue\` inside the body would now skip the update. Real lowerings, Viscosity's included, avoid it by going one level lower, to blocks and jumps, where \`continue\` jumps to a block that holds the update, so the update still runs; Backpatching: if, for, break and continue did the same with bytecode jumps.`,
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
    q: 'Why does an optimising compiler translate the program into an IR before analysing it?',
    options: [
      { t: 'Because the IR runs faster than the source', why: 'An IR is for analysis; it may never be run at all. Viscosity turns VIR back into JavaScript.' },
      { t: 'So that each analysis handles a few explicit instruction kinds instead of every way of writing the code', correct: true, why: 'Lowering collapses spellings and spells out control flow once, and every analysis benefits.' },
      { t: 'Because syntax trees can’t represent loops', why: 'Trees represent loops fine; Drip’s tree-walker runs them. They hide the control flow inside node meanings.' },
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
    q: 'Which statement about lowering is true?',
    options: [
      { t: 'A compiler lowers exactly once', why: 'Many compilers lower in several stages, each to a lower IR.' },
      { t: 'Lowering always makes the program shorter', why: '`+=` becomes three instructions. Lowering usually makes it longer but simpler.' },
      { t: 'Lowering must keep every syntax detail so the source can be rebuilt', why: 'It deliberately drops spelling details. Viscosity keeps a pointer back to the source node instead.' },
      { t: 'It erases differences that don’t matter and makes ones that do matter explicit', correct: true, why: 'Like `+=` vs `= x +` (erased) and `++`’s number conversion (made an instruction).' },
    ],
  },
];
