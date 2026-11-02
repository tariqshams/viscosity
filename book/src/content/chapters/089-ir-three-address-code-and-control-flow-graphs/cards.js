// Chapter 89 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'ir-what': {
    q: 'What is an intermediate representation (IR)?',
    a: 'The form a compiler keeps a program in while it analyses and transforms it, between the source and the target.',
  },
  'lowering-what': {
    q: 'What is lowering?',
    a: 'Translating a program into a lower-level form, with fewer kinds of construct and more explicit steps.',
  },
  'tac-what': {
    q: 'What does one three-address instruction do?',
    a: 'One operation on at most two named inputs, with one named result: `x = y op z`.',
  },
  'bb-what': {
    q: 'What is a basic block?',
    a: 'A maximal run of instructions with one entry (the first) and one exit (the last).',
  },
  'cfg-what': {
    q: 'What are the nodes and edges of a control-flow graph?',
    a: 'Nodes are basic blocks; an edge A → B means B can run immediately after A.',
  },
  'one-terminator': {
    q: 'In VIR, which part of a block can jump?',
    a: 'Only its terminator (`br`, `condbr`, `return`, `throw` or `unreachable`), and each block has exactly one, at the end.',
  },
  'header-two-preds': {
    q: 'In a CFG, why does the test block of a `while` loop have at least two predecessors?',
    a: 'Control reaches it once from before the loop, and again from the end of every pass, along the back edge.',
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
  'block-counts': {
    title: 'Every line of a block runs equally often',
    code: `// The Collatz list, run for n = 6.
// count[i] = how often line i ran.
const count = new Array(10).fill(0);
let n = 6, pc = 0, t;
while (pc !== 10) {
  count[pc]++;
  switch (pc) {
    case 0: t = n > 1; pc = 1; break;
    case 1: pc = t ? 2 : 9; break;
    case 2: t = n % 2; pc = 3; break;
    case 3: pc = t ? 4 : 7; break;
    case 4: t = 3 * n; pc = 5; break;
    case 5: n = t + 1; pc = 6; break;
    case 6: pc = 0; break;
    case 7: n = n / 2; pc = 8; break;
    case 8: pc = 0; break;
    case 9: pc = 10; break;
  }
}
console.log(count.join(' '));
console.log('n is', n);`,
  },
  'succ-preds': {
    title: 'The Collatz CFG, both directions',
    code: `// successors of b0..b7, from VIR
const succ = [[1], [2, 4], [5, 6],
  [1], [], [7], [7], [3]];
const preds = succ.map(() => []);
succ.forEach((ss, b) => {
  for (const s of ss) preds[s].push(b);
});
preds.forEach((ps, b) => {
  console.log('b' + b, 'preds', ps);
});`,
  },
};

export const exercises = {
  'lower-assign': {
    optional: true,
    title: 'Lower compound assignment',
    prompt: `A tiny tree has assignment in three spellings. Write \`lower(node)\` so only one is left.

- \`{ type: "compound", name, op, value }\`, where \`op\` is \`"+="\`, \`"-="\` or \`"*="\`, becomes \`{ type: "assign", name, value: { type: "bin", op: "+", left: { type: "var", name }, right: value } }\` (with the matching operator).
- \`{ type: "update", name, op }\`, where \`op\` is \`"++"\` or \`"--"\`, becomes an \`assign\` whose value is \`{ type: "bin", op: "+", left: { type: "tonum", arg: { type: "var", name } }, right: { type: "lit", value: 1 } }\`. The \`tonum\` is the number conversion \`++\` does.
- Any other node is returned unchanged (the same object).

Treat these as statements: ignore what the expression itself would return.`,
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
    tests: `const V = (name) => ({ type: 'var', name });
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
});`,
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
    prompt: 'Write `lowerFor(node)` for `{ type: "for", init, test, update, body }`, where `body` is an array of statements. Return an array of two statements: `init`, then `{ type: "while", test, body: [...body, update] }`. If `test` is `null` (as in `for (;;)`), use `{ type: "lit", value: true }`. Don’t worry about `continue` here.',
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
    tests: `const n = (value) => ({ type: 'lit', value });
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
});`,
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
  'to-tac': {
    optional: true,
    title: 'An expression tree to three-address code',
    prompt: `Expression trees have three kinds of node: a variable \`{ v: "a" }\`, a number \`{ n: 2 }\`, and an operator \`{ op: "+", l, r }\`. Write \`toTac(e)\` that returns the three-address code as an array of strings like \`"t1 = b * c"\`.

- Variables and numbers need no instruction: use the name or the number directly.
- Lower the left operand, then the right, then emit the operator’s line with a fresh temporary: \`t1\`, \`t2\`, ... in order.
- Each call of \`toTac\` starts again at \`t1\`.`,
    starter: `function toTac(e) {
  const out = [];
  return out;
}`,
    solution: `function toTac(e) {
  const out = [];
  let n = 0;
  const go = (e) => {
    if ('v' in e) return e.v;
    if ('n' in e) return String(e.n);
    const a = go(e.l);
    const b = go(e.r);
    const t = 't' + ++n;
    const line = [t, '=', a, e.op, b];
    out.push(line.join(' '));
    return t;
  };
  go(e);
  return out;
}`,
    tests: `const v = (v) => ({ v });
const num = (n) => ({ n });
const bin = (op, l, r) => ({ op, l, r });
test('a + b * c', () => {
  const e = bin('+', v('a'),
    bin('*', v('b'), v('c')));
  expect(toTac(e))
    .toEqual(['t1 = b * c', 't2 = a + t1']);
});
test('(a + b) * (a - c)', () => {
  const e = bin('*',
    bin('+', v('a'), v('b')),
    bin('-', v('a'), v('c')));
  expect(toTac(e)).toEqual([
    't1 = a + b', 't2 = a - c',
    't3 = t1 * t2']);
});
test('numbers are used directly', () => {
  const e = bin('+', num(1),
    bin('*', num(2), num(3)));
  expect(toTac(e))
    .toEqual(['t1 = 2 * 3', 't2 = 1 + t1']);
});
test('a lone variable needs nothing', () => {
  expect(toTac(v('x'))).toEqual([]);
});
test('each call starts again at t1', () => {
  const e = bin('-', v('x'), num(1));
  toTac(e);
  expect(toTac(e)).toEqual(['t1 = x - 1']);
});`,
    hints: [
      'Write an inner recursive function `go(e)` that returns the *name* of `e`’s value, and pushes any instructions it needs onto `out`.',
      'For a variable return `e.v`; for a number `String(e.n)`. For an operator, call `go` on both sides first.',
      'Then make a fresh name with a counter that lives inside `toTac` (`let n = 0`, then `"t" + ++n`), push the line, and return the new name.',
    ],
    walkthrough: `**How to think about it.** Do one by hand first. For \`a + b * c\`, you cannot write the \`+\` line yet, because its right input (\`b * c\`) has no name; so you write \`t1 = b * c\` first, and then \`t2 = a + t1\`. That is the whole algorithm: before writing a line for a node, get names for its two children, and the easiest way to "get a name" for any subtree is to ask the same function recursively. So the helper should return a **name**, not a value, and push lines as a side effect.

**The solution, line by line.**

- \`function toTac(e) {\` is the function the tests call.
- \`const out = [];\` collects the lines, in the order they are emitted.
- \`let n = 0;\` is the temporary counter. It lives *inside* \`toTac\`, so every call starts again at \`t1\`.
- \`const go = (e) => {\` is the recursive helper; it returns the name of \`e\`'s value.
- \`if ('v' in e) return e.v;\` handles a variable: it already has a name, so nothing is emitted. (\`'v' in e\` asks "does this object have a key called v?")
- \`if ('n' in e) return String(e.n);\` handles a number: three-address code may use constants directly as operands, so its "name" is the number written as text.
- \`const a = go(e.l);\` lowers the left child first and keeps its name.
- \`const b = go(e.r);\` then the right child.
- \`const t = 't' + ++n;\` makes a fresh name *after* both children are done; \`++n\` adds one to \`n\` and gives the new value, so the first temporary is \`t1\`.
- \`const line = [t, '=', a, e.op, b];\` and \`out.push(line.join(' '));\` build a string like \`"t1 = b * c"\` and append it.
- \`return t;\` gives the parent the name of this node's value.
- \`go(e); return out;\` runs the helper on the whole tree and returns the lines. (A lone variable emits nothing, so its result is an empty array, as one test expects.)

Compare the tree-walker from Part III: the same shape of recursion, but \`evaluate\` returned a number and this returns a name. That one change turns an interpreter into a compiler, and Viscosity's \`expr\` does exactly this, with \`fb.emit\` in place of \`out.push\`.

**Common wrong attempts.**

- Putting \`let n = 0\` outside \`toTac\`: the first call works, but the second continues at \`t3\`, \`t4\`, and so on.
- Taking the fresh name *before* lowering the children: then \`a + b * c\` numbers the \`+\` as \`t1\` and emits \`t2 = b * c\` and \`t1 = a + t2\`, which is correct maths but numbered backwards, so the order of names no longer matches the order of lines.
- Emitting a line for variables (\`t1 = a\`): it is not wrong to run, but it wastes a temporary on a value that already had a name.`,
    wrong: [
      {
        code: `let n = 0;
function toTac(e) {
  const out = [];
  const go = (e) => {
    if ('v' in e) return e.v;
    if ('n' in e) return String(e.n);
    const a = go(e.l);
    const b = go(e.r);
    const t = 't' + ++n;
    const line = [t, '=', a, e.op, b];
    out.push(line.join(' '));
    return t;
  };
  go(e);
  return out;
}`,
        why: 'The counter is outside `toTac`, so the second call continues at `t3`, `t4`... Keep it inside, so each lowering starts fresh.',
      },
      {
        code: `function toTac(e) {
  const out = [];
  let n = 0;
  const go = (e) => {
    if ('v' in e) return e.v;
    if ('n' in e) return String(e.n);
    const t = 't' + ++n;
    const a = go(e.l);
    const b = go(e.r);
    const line = [t, '=', a, e.op, b];
    out.push(line.join(' '));
    return t;
  };
  go(e);
  return out;
}`,
        why: 'The parent takes its name before its children, so `a + b * c` numbers the `+` as `t1` and emits `t2 = b * c; t1 = a + t2`. Name the parent after its children.',
      },
    ],
  },
  'find-uses': {
    optional: true,
    title: 'Who uses this value?',
    prompt: 'A tiny `buildUses`. Each instruction is `{ dst, args }`, for example `{ dst: "t2", args: ["a", "t1"] }`. Write `uses(code)` that returns an object mapping each name to the list of `dst`s of the instructions that use it, in program order. A name used twice by one instruction appears twice. Names nobody uses have no entry.',
    starter: `function uses(code) {
  return {};
}`,
    solution: `function uses(code) {
  const out = {};
  for (const i of code) {
    for (const a of i.args) {
      (out[a] ??= []).push(i.dst);
    }
  }
  return out;
}`,
    tests: `const I = (dst, ...args) => ({ dst, args });
test('a + b * c', () => {
  const code = [I('t1', 'b', 'c'),
    I('t2', 'a', 't1')];
  expect(uses(code)).toEqual({
    b: ['t1'], c: ['t1'],
    a: ['t2'], t1: ['t2'] });
});
test('a value used twice', () => {
  const code = [I('t1', 'a', 'b'),
    I('t2', 'a', 't1'), I('t3', 't1', 't1')];
  expect(uses(code).t1)
    .toEqual(['t2', 't3', 't3']);
  expect(uses(code).a).toEqual(['t1', 't2']);
});
test('an unused value has no entry', () => {
  const code = [I('t1', 'a', 'b')];
  expect(uses(code).t1).toBe(undefined);
});`,
    hints: [
      'Two nested loops: every instruction, then every argument of it.',
      '`(out[a] ??= []).push(i.dst)` creates the list the first time a name is seen.',
    ],
    walkthrough: `**How to think about it.** The question is "for each name, which instructions read it?", which is the reverse of what each instruction tells you ("I read these names"). Reversing a relation is a filing job: go through every instruction once, and for each name it reads, put the instruction's \`dst\` in that name's folder.

**The solution, line by line.**

- \`const out = {};\` is the filing cabinet: one key per name that is used.
- \`for (const i of code) {\` visits the instructions in program order, so each folder comes out in program order too.
- \`for (const a of i.args) {\` visits each input of this instruction; if an instruction reads \`t1\` twice, this loop sees it twice, which is why \`t1\` can appear twice in a folder.
- \`(out[a] ??= []).push(i.dst);\` gets the folder for \`a\`, creating an empty one the first time (\`??=\` assigns only when the left side is \`null\` or \`undefined\`), and files this instruction's destination in it.
- \`return out;\` hands back the map. A name nobody reads never got a folder, so it has no entry at all.

This is VIR's \`buildUses\` in miniature. It only works because every input is a **name**: with stack code there is nothing to file under, since an instruction's inputs are "whatever is on top". And a name with no entry is a value nobody reads, the first thing dead code elimination looks for.

**Common wrong attempts.**

- \`out[i.dst] = i.args\`: that maps each instruction to its *inputs*, which you already had; the question is the other direction.
- Using a \`Set\` per name: it would drop the second use when one instruction reads a value twice, and the tests count both.`,
    wrong: [
      {
        code: `function uses(code) {
  const out = {};
  for (const i of code) {
    out[i.dst] = i.args;
  }
  return out;
}`,
        why: 'That maps each instruction to its *inputs* (what it uses), not each value to its *users*. The question is the other direction.',
      },
    ],
  },
  leaders: {
    optional: true,
    title: 'Find the leaders',
    prompt: 'Each instruction is an object with an `op`. `{ op: "goto", to }` always jumps to index `to`; `{ op: "ifnot", to }` may jump there; `{ op: "return" }` leaves the function; anything else (like `{ op: "calc" }`) falls through to the next line. Write `leaders(code)` that returns the indices of the leaders, sorted in increasing order, without repeats. Treat `return` like a jump: whatever follows it starts a new block.',
    starter: `function leaders(code) {
  const ls = new Set([0]);
  for (const ins of code) {
    if (ins.op === 'goto') {
      ls.add(ins.to);
    }
  }
  return [...ls];
}`,
    solution: `const ENDS = ['goto', 'ifnot',
  'return'];

function leaders(code) {
  const ls = new Set([0]);
  code.forEach((ins, i) => {
    const t = ins.to;
    if (t !== undefined) ls.add(t);
    const next = i + 1;
    if (ENDS.includes(ins.op) &&
        next < code.length) {
      ls.add(next);
    }
  });
  return [...ls].sort((a, b) => a - b);
}`,
    tests: `const I = (op, to) => ({ op, to });
test('the Collatz loop', () => {
  const code = [I('calc'), I('ifnot', 9),
    I('calc'), I('ifnot', 7), I('calc'),
    I('calc'), I('goto', 0), I('calc'),
    I('goto', 0), I('return')];
  expect(leaders(code))
    .toEqual([0, 2, 4, 7, 9]);
});
test('straight-line code is one block', () => {
  const code = [I('calc'), I('calc'),
    I('return')];
  expect(leaders(code)).toEqual([0]);
});
test('code after a return starts a block', () => {
  const code = [I('calc'), I('return'),
    I('calc'), I('return')];
  expect(leaders(code)).toEqual([0, 2]);
});
test('sorted as numbers, no repeats', () => {
  const code = [I('calc'), I('ifnot', 10),
    I('goto', 2), I('calc'), I('calc'),
    I('calc'), I('calc'), I('calc'),
    I('calc'), I('calc'), I('calc'),
    I('goto', 10)];
  expect(leaders(code))
    .toEqual([0, 2, 3, 10]);
});`,
    hints: [
      'There are three rules, so you need three kinds of `add`. Which data structure removes repeats for you?',
      'Start with a `Set` holding `0`. For each instruction at index `i`: if it has a target (`ins.to`), add the target; if it is a `goto`, `ifnot` or `return`, add `i + 1`.',
      'Only add `i + 1` while it is still inside the code (`i + 1 < code.length`), and finish with `[...ls].sort((a, b) => a - b)`: a plain `.sort()` compares as strings and puts 10 before 2.',
    ],
    walkthrough: `**How to think about it.** Each of the three leader rules says "this index starts a block", and an index may be named by more than one rule, so collect them in a \`Set\` (which keeps one copy of each) and sort at the end. Rule 1 is the starting value of the set. Rules 2 and 3 both come from looking at one instruction at a time, so one pass over the code is enough: when you see a jump, its target is a leader (control can arrive there from somewhere other than the line above), and the line after it is a leader too (control can only reach that line from elsewhere, or not at all).

**The solution, line by line.**

- \`const ENDS = ['goto', 'ifnot', 'return'];\` lists the instructions that end a block, so the line after any of them is a leader.
- \`function leaders(code) {\` takes the list of instructions.
- \`const ls = new Set([0]);\` is rule 1: the first instruction is always a leader.
- \`code.forEach((ins, i) => {\` visits each instruction with its index \`i\`.
- \`const t = ins.to;\` reads the target; only \`goto\` and \`ifnot\` have one, so for everything else it is \`undefined\`.
- \`if (t !== undefined) ls.add(t);\` is rule 2: every jump target is a leader. (Test \`!== undefined\` rather than \`if (t)\`, because a jump to line 0 has the target \`0\`, which counts as false.)
- \`const next = i + 1;\` is the line straight after this one.
- \`if (ENDS.includes(ins.op) && next < code.length) { ls.add(next); }\` is rule 3, with a bounds check so that a final \`return\` does not add an index past the end.
- \`return [...ls].sort((a, b) => a - b);\` turns the set into an array and sorts it as numbers: the comparison function returns a negative number when \`a\` should come first.

For the Collatz list: the set starts with 0; line 1 adds 9 and 2; line 3 adds 7 and 4; line 6 adds 0 (already there) and 7 (already there); line 8 adds 0 and 9; line 9 is a \`return\` at the very end, so nothing is added. Sorted, that is 0, 2, 4, 7, 9.

**Common wrong attempts.**

- Adding only the targets: you get 0, 7 and 9, and miss 2 and 4, the lines after the two \`ifnot\`s.
- Sorting with plain \`.sort()\`: JavaScript turns the numbers into strings first, so \`[0, 10, 2, 3]\` stays in that order, because "10" comes before "2" in dictionary order.
- Forgetting the bounds check: a \`return\` on the last line adds an index that is not an instruction.`,
    wrong: [
      {
        code: `function leaders(code) {
  const ls = new Set([0]);
  for (const ins of code) {
    const t = ins.to;
    if (t !== undefined) ls.add(t);
  }
  return [...ls].sort((a, b) => a - b);
}`,
        why: 'This finds the first instruction and the targets, but not the instructions after a jump. In the Collatz loop, 2 and 4 are missing.',
      },
      {
        code: `const ENDS = ['goto', 'ifnot',
  'return'];

function leaders(code) {
  const ls = new Set([0]);
  code.forEach((ins, i) => {
    const t = ins.to;
    if (t !== undefined) ls.add(t);
    if (ENDS.includes(ins.op) &&
        i + 1 < code.length) {
      ls.add(i + 1);
    }
  });
  return [...ls].sort();
}`,
        why: 'The default `sort()` compares as strings, so 10 comes before 2. Pass `(a, b) => a - b`.',
      },
    ],
  },
  blocks: {
    optional: true,
    title: 'Cut the list into blocks',
    prompt: 'Using the same instructions as the last exercise, write `blocks(code)` that returns every basic block as a pair `[first, last]` of instruction indices (both included), in order. Find the leaders first (you may copy your `leaders` function in), then cut: each block runs from one leader to just before the next, and the last block runs to the end of the code.',
    starter: `function blocks(code) {
  return [[0, code.length - 1]];
}`,
    solution: `const ENDS = ['goto', 'ifnot',
  'return'];

function leaders(code) {
  const ls = new Set([0]);
  code.forEach((ins, i) => {
    if (ins.to !== undefined) {
      ls.add(ins.to);
    }
    if (ENDS.includes(ins.op) &&
        i + 1 < code.length) {
      ls.add(i + 1);
    }
  });
  return [...ls].sort((a, b) => a - b);
}

function blocks(code) {
  const ls = leaders(code);
  return ls.map((l, k) => {
    const end = k + 1 < ls.length
      ? ls[k + 1] : code.length;
    return [l, end - 1];
  });
}`,
    tests: `const I = (op, to) => ({ op, to });
test('the Collatz loop', () => {
  const code = [I('calc'), I('ifnot', 9),
    I('calc'), I('ifnot', 7), I('calc'),
    I('calc'), I('goto', 0), I('calc'),
    I('goto', 0), I('return')];
  expect(blocks(code)).toEqual([[0, 1],
    [2, 3], [4, 6], [7, 8], [9, 9]]);
});
test('one block', () => {
  const code = [I('calc'), I('return')];
  expect(blocks(code)).toEqual([[0, 1]]);
});
test('absolute value', () => {
  const code = [I('calc'), I('ifnot', 4),
    I('calc'), I('goto', 4), I('return')];
  expect(blocks(code))
    .toEqual([[0, 1], [2, 3], [4, 4]]);
});
test('a jump to line 1', () => {
  const code = [I('calc'), I('calc'),
    I('ifnot', 1), I('return')];
  expect(blocks(code))
    .toEqual([[0, 0], [1, 2], [3, 3]]);
});`,
    hints: [
      'Once you have the sorted leaders, each block is fully decided by its own leader and the next one.',
      'Use `ls.map((l, k) => ...)`: block `k` starts at `l`. Where does it end?',
      'It ends one before `ls[k + 1]`, or at `code.length - 1` for the last leader.',
    ],
    walkthrough: `**How to think about it.** Finding the leaders was the hard part; cutting is bookkeeping. Picture the sorted leaders as fence posts along the list: each block is the stretch between one post and the next, and the last block runs from the last post to the end. So you need, for each leader, the index of the next leader (or the end of the list).

**The solution, line by line.**

- \`ENDS\` and \`leaders(code)\` are the previous exercise's solution, written slightly more compactly.
- \`function blocks(code) {\` takes the list.
- \`const ls = leaders(code);\` gets the sorted leaders, for example \`[0, 2, 4, 7, 9]\`.
- \`return ls.map((l, k) => {\` makes one pair per leader; \`k\` is its position in \`ls\`.
- \`const end = k + 1 < ls.length ? ls[k + 1] : code.length;\` is the index just past the block: the next leader, or the length of the code for the last block.
- \`return [l, end - 1];\` gives the first and last index of the block, both included.

For the Collatz list that is \`[0, 1]\`, \`[2, 3]\`, \`[4, 6]\`, \`[7, 8]\` and \`[9, 9]\`: five blocks, the last holding only the \`return\`.

**Common wrong attempts.**

- Ending each block *at* the next leader (\`[l, ls[k + 1]]\`): then neighbouring blocks share a line, and every instruction would belong to two blocks.
- Forgetting the last block: looping only while \`k + 1 < ls.length\` drops the block that holds the \`return\`.
- Ending the last block at \`code.length\`: that index is one past the last instruction.`,
    wrong: [
      {
        code: `const ENDS = ['goto', 'ifnot',
  'return'];

function leaders(code) {
  const ls = new Set([0]);
  code.forEach((ins, i) => {
    if (ins.to !== undefined) {
      ls.add(ins.to);
    }
    if (ENDS.includes(ins.op) &&
        i + 1 < code.length) {
      ls.add(i + 1);
    }
  });
  return [...ls].sort((a, b) => a - b);
}

function blocks(code) {
  const ls = leaders(code);
  return ls.map((l, k) =>
    [l, ls[k + 1] ?? code.length]);
}`,
        why: 'Each block ends *at* the next leader instead of one before it, so neighbouring blocks overlap, and the last ends one past the code.',
      },
    ],
  },
  preds: {
    title: 'Predecessors from successors',
    prompt: 'A CFG is given as `succ`, an array where `succ[b]` lists block `b`’s successors. Write `preds(succ)` that returns the reverse: an array where entry `b` lists the predecessors of `b`, in increasing block order. Every block gets an entry, even if it is empty.',
    starter: `function preds(succ) {
  return succ;
}`,
    solution: `function preds(succ) {
  const ps = succ.map(() => []);
  succ.forEach((ss, b) => {
    for (const s of ss) ps[s].push(b);
  });
  return ps;
}`,
    tests: `test('the Collatz CFG', () => {
  const succ = [[1], [2, 4], [5, 6],
    [1], [], [7], [7], [3]];
  expect(preds(succ)).toEqual([[], [0, 3],
    [1], [7], [1], [2], [2], [5, 6]]);
});
test('an unreachable block', () => {
  expect(preds([[], []]))
    .toEqual([[], []]);
});
test('a self-loop', () => {
  expect(preds([[1], [1, 2], []]))
    .toEqual([[], [0, 1], [1]]);
});`,
    hints: [
      'Every edge `b → s` appears once in `succ`, under `b`. Where should it appear in the answer?',
      'Under `s`: so visit every block `b`, and for each successor `s`, push `b` onto the list for `s`.',
      'Start with an empty list for every block: `succ.map(() => [])`. Visiting blocks in increasing order keeps each list sorted for free.',
    ],
    walkthrough: `**How to think about it.** Successors and predecessors are the same edges, read from opposite ends; an edge \`b → s\` says "s is a successor of b" and, at the same time, "b is a predecessor of s". So the job is to visit every edge once and file it under its other end, which is the same filing trick as \`buildUses\` in Three-address code.

**The solution, line by line.**

- \`function preds(succ) {\` takes the successor lists.
- \`const ps = succ.map(() => []);\` makes one new, empty list per block. \`map\` calls the arrow function once per block, so each block gets its *own* array.
- \`succ.forEach((ss, b) => {\` visits block \`b\` and its successor list \`ss\`, in increasing order of \`b\`.
- \`for (const s of ss) ps[s].push(b);\` files the edge \`b → s\` under \`s\`. Because \`b\` only grows, each list comes out sorted without a sort.
- \`});\` and \`return ps;\` finish the pass and hand back the lists.

For the Collatz CFG the result is \`[[], [0, 3], [1], [7], [1], [2], [2], [5, 6]]\`, which matches the \`; preds\` comments in the VIR listing exactly. Viscosity does the same filing, but at the moment each edge is created: \`terminate\` pushes the current block onto each successor's \`preds\`.

**Common wrong attempts.**

- \`new Array(n).fill([])\` puts the *same* array in every slot (the aliasing from References: two names, one object), so every push lands in all of them and every block appears to have every predecessor.
- Returning \`succ\` itself, or pushing \`s\` instead of \`b\`: that files the edge under the wrong end.`,
    wrong: [
      {
        code: `function preds(succ) {
  const ps = new Array(succ.length)
    .fill([]);
  succ.forEach((ss, b) => {
    for (const s of ss) ps[s].push(b);
  });
  return ps;
}`,
        why: '`fill([])` puts the same array in every slot, so every block ends up with every predecessor. Make a new array per block with `map`.',
      },
      {
        code: `function preds(succ) {
  const ps = succ.map(() => []);
  succ.forEach((ss, b) => {
    for (const s of ss) ps[b].push(s);
  });
  return ps;
}`,
        why: 'This files each edge under its own start, which rebuilds the successors. Push `b` onto `ps[s]`.',
      },
    ],
  },
  reachable: {
    optional: true,
    title: 'Find the unreachable blocks',
    prompt: 'Block 0 is the entry. Write `unreachable(succ)` that returns, in increasing order, every block that no path from block 0 reaches. Search from the entry: keep a list of blocks still to visit, and a `Set` of blocks already seen.',
    starter: `function unreachable(succ) {
  const out = [];
  succ.forEach((ss, b) => {
    if (b !== 0 && ss.length === 0) {
      out.push(b);
    }
  });
  return out;
}`,
    solution: `function unreachable(succ) {
  const seen = new Set([0]);
  const todo = [0];
  while (todo.length) {
    const b = todo.pop();
    for (const s of succ[b]) {
      if (!seen.has(s)) {
        seen.add(s);
        todo.push(s);
      }
    }
  }
  return succ.map((_, b) => b)
    .filter((b) => !seen.has(b));
}`,
    tests: `test('everything reachable', () => {
  const succ = [[1], [2, 4], [5, 6],
    [1], [], [7], [7], [3]];
  expect(unreachable(succ)).toEqual([]);
});
test('code after a return', () => {
  expect(unreachable([[], []]))
    .toEqual([1]);
});
test('a dead chain', () => {
  const succ = [[3], [2], [3], []];
  expect(unreachable(succ))
    .toEqual([1, 2]);
});
test('a dead loop', () => {
  const succ = [[], [2], [1]];
  expect(unreachable(succ))
    .toEqual([1, 2]);
});`,
    hints: [
      'Turn it round: find every block that *is* reachable, and the answer is all the others.',
      'Start with `seen = new Set([0])` and `todo = [0]`. While `todo` is not empty, take a block out and look at its successors.',
      'Each successor not yet in `seen` goes into `seen` and onto `todo`. At the end, keep the block numbers not in `seen`.',
    ],
    walkthrough: `**How to think about it.** "No path from the entry reaches it" is hard to check directly, because there are many possible paths; the other side of the question is easy, though. Start at the entry and spread outwards along the edges, marking every block you touch; anything never marked is unreachable. This is a graph search, and the order you explore in does not matter for the answer.

**The solution, line by line.**

- \`const seen = new Set([0]);\` marks the entry as reached.
- \`const todo = [0];\` holds blocks whose successors we have not looked at yet.
- \`while (todo.length) {\` keeps going until there is nothing left to explore (an empty array has length 0, which counts as false).
- \`const b = todo.pop();\` takes a block out.
- \`for (const s of succ[b]) {\` looks at each of its successors.
- \`if (!seen.has(s)) { seen.add(s); todo.push(s); }\` marks a newly found block and queues it. Marking *before* exploring is what stops a loop from being explored forever.
- \`return succ.map((_, b) => b).filter((b) => !seen.has(b));\` lists every block number (\`map\` with the index) and keeps the unmarked ones, already in increasing order.

**Common wrong attempts.**

- "A non-entry block with no predecessors is unreachable" is true, but not the whole story: in the test \`[[3], [2], [3], []]\`, block 2 has a predecessor (block 1), yet neither is reachable, and in the dead loop 1 and 2 are each other's predecessors.
- Looking at *successors* to decide (as the starter does) answers a different question: a block with no successors is one that returns, not one that never runs.
- Forgetting the \`seen\` check: a loop in the graph would then be pushed onto \`todo\` forever.`,
    wrong: [
      {
        code: `function unreachable(succ) {
  const has = succ.map(() => false);
  succ.forEach((ss) => {
    for (const s of ss) has[s] = true;
  });
  return succ.map((_, b) => b)
    .filter((b) => b !== 0 && !has[b]);
}`,
        why: 'This finds blocks with no predecessors, but misses dead chains and dead loops, whose blocks have predecessors that are unreachable themselves.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Why does an optimising compiler translate the program into an IR before analysing it?',
    options: [
      {
        t: 'Because the IR runs faster than the source',
        why: 'An IR is for analysis; it may never be run at all. Viscosity turns VIR back into JavaScript.',
      },
      {
        t: 'So that each analysis handles a few explicit instruction kinds instead of every way of writing the code',
        correct: true,
        why: 'Lowering collapses spellings and spells out control flow once, and every analysis benefits.',
      },
      {
        t: 'Because syntax trees can’t represent loops',
        why: 'Trees represent loops fine; Drip’s tree-walker runs them. They hide the control flow inside node meanings.',
      },
      {
        t: 'To remove the need for a parser',
        why: 'The IR is built from the parser’s tree. The parser is still needed.',
      },
    ],
  },
  {
    q: 'In JavaScript, `let s = "5"; s++;` What is `s` now, and why does it matter to a compiler lowering `++`?',
    options: [
      {
        t: '`"51"`; lowering can treat ++ as += 1',
        why: 'That is what `s += 1` gives. `++` converts to a number first.',
      },
      {
        t: '`"6"`; ++ works on strings',
        why: 'The result is the number 6, not a string.',
      },
      {
        t: 'It throws a TypeError',
        why: 'JavaScript converts the string to a number; nothing is thrown.',
      },
      {
        t: '`6`; so the lowering must make the number conversion explicit',
        correct: true,
        why: 'VIR emits `unop +` before adding 1. A lowering that skipped it would change what the program does.',
      },
    ],
  },
  {
    q: 'In VIR, `function f(a) { let t = a; return t + 1; }` lowers to what, besides the param and the return?',
    options: [
      {
        t: '`%1 = copy %0`, `%2 = const 1`, `%3 = binop + %1, %2`',
        why: 'There is no copy: `let t = a` emits nothing, and `t` means `%0`.',
      },
      {
        t: '`%1 = const 1`, `%2 = binop + %0, %1`',
        correct: true,
        why: 'The read of `t` uses `%0` directly, and the literal 1 is its own `const` instruction.',
      },
      {
        t: '`%1 = binop + %0, 1`',
        why: 'VIR’s arguments are always value ids; the literal needs its own `const` instruction.',
      },
      {
        t: '`store t, %0`, then `%1 = load t`',
        why: 'Only captured or module-level variables become bindings. A plain local is only a name for a value.',
      },
    ],
  },
  {
    q: 'In VIR, a block ends with `condbr %5, b5, b6`. What are its successors, in the order VIR lists them?',
    options: [
      {
        t: '`[5]`',
        why: 'Either branch can be taken, so both are successors.',
      },
      {
        t: '`[5, 6]`',
        correct: true,
        why: 'The then target first, then the else target.',
      },
      {
        t: '`[%5]`',
        why: '%5 is the condition value, not a block.',
      },
      {
        t: '`[]`',
        why: 'An empty list is for `return`, `throw` and `unreachable`.',
      },
    ],
  },
];
