// Chapter 72 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'vm-slower': {
    q: 'In one benchmark run of a TypeScript tree-walker against a TypeScript bytecode VM for the same small language, on which kind of program was the VM slower?',
    a: 'Object-heavy ones: making many instances or reading many fields (and string-heavy work), where the tree-walker leans on V8’s own objects and `Map`s.',
  },
  'same-engine': {
    q: 'Why might a bytecode VM written in TypeScript not beat a tree-walker written in TypeScript by much?',
    a: 'Both run on V8: the tree-walker uses V8’s own tuned `Map`s and objects, and its hot code is compiled to machine code, while the VM rebuilds its stack, tables and objects in TypeScript.',
  },
  'overhead-what': {
    q: 'What is *interpreter overhead*?',
    a: 'Work the interpreter does that the program did not ask for: dispatch, pointer chasing, name lookups, allocation and checks.',
  },
  'bytecode-what': {
    q: 'What is **bytecode**?',
    a: 'A program written as a flat array of small numbered instructions, produced once by a compiler and then run.',
  },
  'children-first-order': {
    q: 'Flattening `1 + 2 * 3` into stack-machine instructions, why must the multiply come before the add?',
    a: 'The addition needs the product as its right operand, so the product must be worked out first: children are written before their parent.',
  },
  'opcode-what': {
    q: 'What is an **opcode**?',
    a: 'The number that says which instruction this is; any operand bytes that the instruction needs follow it.',
  },
  'const-300': {
    q: 'A constant’s number, 300, is written as two operand bytes, high byte first. Which two bytes, and why?',
    a: '`1, 44`: 1 × 256 + 44 = 300.',
  },
  'vm-what': {
    q: 'What does a bytecode **virtual machine** do, in one sentence?',
    a: 'It runs bytecode: a loop that fetches the next instruction, decodes its opcode (and so its operands), and executes it.',
  },
};

export const examples = {
  timing: {
    title: 'Timing the tree-walker',
    lang: 'drip',
    code: `fn fib(n) {
  if n < 2 {
    return n;
  }
  return fib(n - 1) + fib(n - 2);
}

let t0 = clock();
print fib(20);
let t1 = clock();
let sum = 0;
for i in 0..100000 {
  sum += i;
}
print sum;
let t2 = clock();
print "fib(20): " + str(t1 - t0);
print "loop: " + str(t2 - t1);`,
  },
  'two-bytes': {
    title: 'A constant number in two bytes',
    code: `function encode(k) {
  // opcode 0 (const), high, low
  return [0, k >> 8, k & 255];
}
function decode(bytes) {
  return bytes[1] * 256 + bytes[2];
}

console.log(encode(2));   // [0, 0, 2]
console.log(encode(300)); // [0, 1, 44]
console.log(decode([0, 1, 44])); // 300
console.log(encode(65535));
// the largest: [0, 255, 255]`,
  },
  'tiny-vm': {
    title: 'A whole VM, three opcodes',
    code: `const PUSH = 0, ADD = 1, MUL = 2;
// 1 + 2 * 3, flattened:
const code = [
  PUSH, 1, PUSH, 2, PUSH, 3, MUL, ADD,
];

const st = [];
let ip = 0;
while (ip < code.length) {
  const op = code[ip++];
  if (op === PUSH) {
    st.push(code[ip++]);
  } else {
    const b = st.pop();
    const a = st.pop();
    st.push(op === ADD ? a + b : a * b);
  }
}
console.log(st.pop()); // 7`,
  },
  'tiny-vm-sub': {
    title: 'Adding SUB: the order of the pops',
    code: `const PUSH = 0, ADD = 1, SUB = 2;
// 10 - 4, flattened:
const code = [PUSH, 10, PUSH, 4, SUB];

const st = [];
let ip = 0;
while (ip < code.length) {
  const op = code[ip++];
  if (op === PUSH) {
    st.push(code[ip++]);
  } else {
    const b = st.pop(); // 4: the top
    const a = st.pop(); // 10
    st.push(op === ADD ? a + b : a - b);
  }
}
console.log(st.pop()); // 6`,
  },
  'fib-vm': {
    title: 'Drip on the bytecode VM',
    lang: 'drip-vm',
    code: `fn fib(n) {
  if n < 2 { return n; }
  return fib(n - 1) + fib(n - 2);
}

print fib(20);
print "same Drip, new engine";`,
  },
};

export const exercises = {
  countVisits: {
    optional: true,
    title: 'Counting the overhead',
    prompt: `A tiny tree-walker in plain JavaScript. Nodes are \`{ kind: 'num', value }\`, \`{ kind: 'var', name }\` (read from the \`Map\` \`env\`), \`{ kind: 'add', left, right }\` or \`{ kind: 'mul', left, right }\`. The starter evaluates them. Change it so that, as well as returning the value, it counts into the object \`st\`:

- \`st.visits\`: one for every node evaluated,
- \`st.lookups\`: one for every \`Map\` lookup of a variable,
- \`st.ops\`: one for every addition or multiplication actually done (the real work).

Then \`(x + 2) * 3\` reports 5 visits, 1 lookup and 2 operations.`,
    starter: `function evaluate(node, env, st) {
  if (node.kind === 'num') {
    return node.value;
  }
  if (node.kind === 'var') {
    return env.get(node.name);
  }
  const { left, right } = node;
  const l = evaluate(left, env, st);
  const r = evaluate(right, env, st);
  if (node.kind === 'add') return l + r;
  return l * r;
}`,
    solution: `function evaluate(node, env, st) {
  st.visits++;
  if (node.kind === 'num') {
    return node.value;
  }
  if (node.kind === 'var') {
    st.lookups++;
    return env.get(node.name);
  }
  const { left, right } = node;
  const l = evaluate(left, env, st);
  const r = evaluate(right, env, st);
  st.ops++;
  if (node.kind === 'add') return l + r;
  return l * r;
}`,
    tests: `const num = (value) => ({ kind: 'num', value });
const v = (name) => ({ kind: 'var', name });
const add = (left, right) => ({ kind: 'add', left, right });
const mul = (left, right) => ({ kind: 'mul', left, right });
const fresh = () => ({ visits: 0, lookups: 0, ops: 0 });
const env = new Map([['x', 4], ['y', 5]]);
test('a single number: one visit, no work', () => {
  const s = fresh();
  expect(evaluate(num(7), env, s)).toBe(7);
  expect(s).toEqual({ visits: 1, lookups: 0, ops: 0 });
});
test('(x + 2) * 3', () => {
  const s = fresh();
  expect(evaluate(mul(add(v('x'), num(2)), num(3)), env, s)).toBe(18);
  expect(s).toEqual({ visits: 5, lookups: 1, ops: 2 });
});
test('x * y + x', () => {
  const s = fresh();
  expect(evaluate(add(mul(v('x'), v('y')), v('x')), env, s)).toBe(24);
  expect(s).toEqual({ visits: 5, lookups: 3, ops: 2 });
});
test('counts add up across calls', () => {
  const s = fresh();
  evaluate(add(num(1), num(1)), env, s);
  evaluate(add(num(1), num(1)), env, s);
  expect(s).toEqual({ visits: 6, lookups: 0, ops: 2 });
});`,
    hints: [
      'Each counter belongs at exactly one place in the function. Where does every call pass, whatever the node is?',
      'Count a visit at the very top, before any `if`. Count a lookup inside the `var` case, just before `env.get`.',
      'Count an operation after both operands have been evaluated, just before the addition or multiplication: `st.ops++;`.',
    ],
    walkthrough: `**How to think about it.** The three counters measure three different things, so each goes where that thing happens. A *visit* is a call of \`evaluate\`, whatever the node; so it is counted at the very top, before the function decides anything. A *lookup* happens only for a variable node, at the \`env.get\`. An *operation* is the real work, the \`+\` or \`*\` itself, which happens once per add or mul node, after both sides are known. Comparing the counts is the point: \`(x + 2) * 3\` visits five nodes and does a lookup, to do two operations.

**The solution, line by line.**

- \`function evaluate(node, env, st) {\` now also receives the counters, \`st\`.
- \`  st.visits++;\` counts this call, first, so number nodes are counted too.
- \`  if (node.kind === 'num') {\` and \`    return node.value;\` are unchanged: a number is a visit and nothing else.
- \`  if (node.kind === 'var') {\` handles a variable; \`    st.lookups++;\` counts the \`Map\` lookup, and \`    return env.get(node.name);\` does it.
- \`  const { left, right } = node;\` takes the two children out of the node, and \`  const l = ...\` and \`  const r = ...\` evaluate both sides (each counts its own visits and lookups as it goes).
- \`  st.ops++;\` counts the one real operation of this node.
- The last two lines do the addition or multiplication, unchanged.

**Common wrong attempts.**

- Counting a visit only in the \`add\` and \`mul\` cases: number and variable nodes are visits too (every one cost a call and a check of its kind), so \`(x + 2) * 3\` would report 2 visits instead of 5.
- Putting \`st.ops++\` at the top with the visit: every number and variable would then count as real work, hiding the overhead the exercise is meant to show.`,
    wrong: [
      {
        code: `function evaluate(node, env, st) {
  if (node.kind === 'num') {
    return node.value;
  }
  if (node.kind === 'var') {
    st.lookups++;
    return env.get(node.name);
  }
  st.visits++;
  const { left, right } = node;
  const l = evaluate(left, env, st);
  const r = evaluate(right, env, st);
  st.ops++;
  if (node.kind === 'add') return l + r;
  return l * r;
}`,
        why: 'Numbers and variables are never counted as visits, so `(x + 2) * 3` reports 2 visits instead of 5.',
      },
      {
        code: `function evaluate(node, env, st) {
  st.visits++;
  st.ops++;
  if (node.kind === 'num') {
    return node.value;
  }
  if (node.kind === 'var') {
    st.lookups++;
    return env.get(node.name);
  }
  const { left, right } = node;
  const l = evaluate(left, env, st);
  const r = evaluate(right, env, st);
  if (node.kind === 'add') return l + r;
  return l * r;
}`,
        why: 'Every node is counted as an operation, so the counts can no longer tell real work from overhead: 5 ops instead of 2.',
      },
    ],
  },
  flatten: {
    title: 'Flatten a tree into bytes',
    prompt: 'Nodes are `{ kind: "num", value }`, `{ kind: "add", left, right }` and `{ kind: "mul", left, right }`. Write `flatten(node)`, which returns an array of numbers: a number becomes `OP.CONST, value`; an `add` or `mul` becomes its left operand’s bytes, then its right operand’s, then `OP.ADD` or `OP.MUL`. The number case is done for you. (This toy bytecode stores each value straight after `CONST`, as the tiny VM in the chapter does.)',
    starter: `const OP = { CONST: 0, ADD: 1, MUL: 2 };

function flatten(node, out = []) {
  if (node.kind === 'num') {
    out.push(OP.CONST, node.value);
    return out;
  }
  // children first, then the operator
  return out;
}`,
    solution: `const OP = { CONST: 0, ADD: 1, MUL: 2 };

function flatten(node, out = []) {
  if (node.kind === 'num') {
    out.push(OP.CONST, node.value);
    return out;
  }
  flatten(node.left, out);
  flatten(node.right, out);
  out.push(node.kind === 'add'
    ? OP.ADD : OP.MUL);
  return out;
}`,
    tests: `const num = (value) => ({ kind: 'num', value });
const add = (left, right) =>
  ({ kind: 'add', left, right });
const mul = (left, right) =>
  ({ kind: 'mul', left, right });
function run(code) {
  const st = [];
  let ip = 0;
  while (ip < code.length) {
    const op = code[ip++];
    if (op === 0) { st.push(code[ip++]); continue; }
    const b = st.pop(), a = st.pop();
    st.push(op === 1 ? a + b : a * b);
  }
  return st.pop();
}
test('a lone number', () => {
  expect(flatten(num(7))).toEqual([0, 7]);
});
test('1 + 2', () => {
  expect(flatten(add(num(1), num(2))))
    .toEqual([0, 1, 0, 2, 1]);
});
test('(1 + 2) * 3: children first', () => {
  const t = mul(add(num(1), num(2)), num(3));
  expect(flatten(t))
    .toEqual([0, 1, 0, 2, 1, 0, 3, 2]);
});
test('the bytes compute the right answer', () => {
  const t = add(num(1), mul(num(2), num(3)));
  expect(run(flatten(t))).toBe(7);
  const u = mul(add(num(4), num(1)),
    add(num(2), num(2)));
  expect(run(flatten(u))).toBe(20);
});`,
    hints: [
      'Think about what the machine needs when it reaches an `ADD`: two values already waiting. So where in the list must an operator’s own byte go?',
      'An operator’s byte goes after the bytes of both its operands. Each operand is itself a tree, so flatten it with a recursive call, passing the same `out` array so everything lands in one list.',
      'Call `flatten(node.left, out)`, then `flatten(node.right, out)`, then push `OP.ADD` if `node.kind === "add"`, otherwise `OP.MUL`, and return `out`.',
    ],
    walkthrough: `**How to think about it.** Start from the machine that will run these bytes: when it meets \`ADD\` it pops two values, so both values must already have been pushed. That means an operator’s byte has to come *after* everything that computes its operands. Each operand is a whole tree of its own (\`2 * 3\` inside \`1 + 2 * 3\`), so the natural tool is recursion: flatten the left child, flatten the right child, then write the operator. This order, a node after its children, is called a **post-order** walk.

The other decision is where the bytes go. If every call built its own little array, you would have to glue them together; it is simpler to pass one array, \`out\`, all the way down, so that every call appends to the same list.

**The solution, line by line.**

- \`if (node.kind === 'num') { ... }\` is the given case: a number has no children, so it writes \`OP.CONST\` and its value and returns. Every recursion needs a case that stops, and this is it.
- \`flatten(node.left, out);\` writes all the bytes for the left operand into \`out\`. We ignore the return value, because the bytes are already in \`out\`.
- \`flatten(node.right, out);\` does the same for the right operand, after the left one, so the left value is pushed first and ends up underneath.
- \`out.push(node.kind === 'add' ? OP.ADD : OP.MUL);\` writes the operator’s own byte, now that both operands come earlier in the list. The \`? :\` picks \`OP.ADD\` for an \`add\` node and \`OP.MUL\` otherwise.
- \`return out;\` hands back the finished list, which matters for the outermost call: \`flatten(tree)\` is what the tests look at.

For \`(1 + 2) * 3\`: the \`mul\` node first flattens its left child, the \`add\`, which writes \`0, 1, 0, 2, 1\`; then its right child writes \`0, 3\`; then the \`mul\` writes \`2\`. The list is \`[0, 1, 0, 2, 1, 0, 3, 2]\`, and running it adds first, then multiplies, giving 9.

**Why left before right matters.** For \`+\` and \`*\` you would get the same answer either way round, but the machine pops the right operand first and the left second. With \`-\` or \`/\`, flattening the right child first would compute the operands backwards.

**Common wrong attempts.**

- Writing the operator first (\`out.push(...)\` before the two calls) is a pre-order walk: the machine would reach \`ADD\` with nothing on its stack.
- Calling \`flatten(node.left)\` without passing \`out\` starts a fresh array each time; the children’s bytes go into arrays that are thrown away, and only the operator lands in \`out\`.

The recursion here runs once, when the program is compiled. The bytes it produces can then be run as often as you like by a loop with no recursion at all, which is the whole point of bytecode.`,
    wrong: [
      {
        code: `const OP = { CONST: 0, ADD: 1, MUL: 2 };

function flatten(node, out = []) {
  if (node.kind === 'num') {
    out.push(OP.CONST, node.value);
    return out;
  }
  out.push(node.kind === 'add'
    ? OP.ADD : OP.MUL);
  flatten(node.left, out);
  flatten(node.right, out);
  return out;
}`,
        why: 'This writes the operator first (pre-order). The VM would reach `ADD` with nothing on the stack. Operands must come before the operator that uses them.',
      },
      {
        code: `const OP = { CONST: 0, ADD: 1, MUL: 2 };

function flatten(node, out = []) {
  if (node.kind === 'num') {
    out.push(OP.CONST, node.value);
    return out;
  }
  const l = flatten(node.left);
  const r = flatten(node.right);
  out.push(node.kind === 'add'
    ? OP.ADD : OP.MUL);
  return out;
}`,
        why: 'The children are flattened into fresh arrays that are then thrown away, so only the operator ends up in `out`. Pass `out` down, or copy `l` and `r` into it first.',
      },
    ],
  },
  flattenNeg: {
    optional: true,
    title: 'Flattening a minus sign',
    prompt: 'Add a fourth kind of node, `{ kind: "neg", operand }`, for a unary minus like `-x`, with a new opcode `OP.NEG` (3) that pops one value and pushes its negation. Extend `flatten` so that a `neg` node becomes its operand’s bytes, then `OP.NEG`. The other cases are done.',
    starter: `const OP = {
  CONST: 0, ADD: 1, MUL: 2, NEG: 3,
};

function flatten(node, out = []) {
  if (node.kind === 'num') {
    out.push(OP.CONST, node.value);
  } else if (node.kind === 'neg') {
    // your code here
  } else {
    flatten(node.left, out);
    flatten(node.right, out);
    out.push(node.kind === 'add'
      ? OP.ADD : OP.MUL);
  }
  return out;
}`,
    solution: `const OP = {
  CONST: 0, ADD: 1, MUL: 2, NEG: 3,
};

function flatten(node, out = []) {
  if (node.kind === 'num') {
    out.push(OP.CONST, node.value);
  } else if (node.kind === 'neg') {
    flatten(node.operand, out);
    out.push(OP.NEG);
  } else {
    flatten(node.left, out);
    flatten(node.right, out);
    out.push(node.kind === 'add'
      ? OP.ADD : OP.MUL);
  }
  return out;
}`,
    tests: `const num = (value) => ({ kind: 'num', value });
const neg = (operand) => ({ kind: 'neg', operand });
const add = (left, right) =>
  ({ kind: 'add', left, right });
const mul = (left, right) =>
  ({ kind: 'mul', left, right });
test('-5', () => {
  expect(flatten(neg(num(5)))).toEqual([0, 5, 3]);
});
test('-(1 + 2)', () => {
  expect(flatten(neg(add(num(1), num(2)))))
    .toEqual([0, 1, 0, 2, 1, 3]);
});
test('-2 * 3', () => {
  expect(flatten(mul(neg(num(2)), num(3))))
    .toEqual([0, 2, 3, 0, 3, 2]);
});
test('--4', () => {
  expect(flatten(neg(neg(num(4)))))
    .toEqual([0, 4, 3, 3]);
});`,
    hints: [
      'A minus sign is an operator with one child instead of two. What did the binary case do with its children before writing its own byte?',
      'Flatten the one child first, into the same `out`, then write the operator.',
      'Two lines: `flatten(node.operand, out);` then `out.push(OP.NEG);`.',
    ],
    walkthrough: `**How to think about it.** The rule from the chapter does not care how many children a node has: every child first, then the node itself. A unary minus has one child, so its bytes are "the child’s bytes, then NEG". When the machine reaches NEG, the child’s value is the newest one waiting, which is exactly the value NEG needs.

**The solution, line by line.**

- \`} else if (node.kind === 'neg') {\` picks out the new kind of node.
- \`flatten(node.operand, out);\` writes all the bytes that compute the operand, which may itself be a whole tree, such as \`1 + 2\` in \`-(1 + 2)\`. As in the binary case, we pass \`out\` so the bytes land in the same list.
- \`out.push(OP.NEG);\` writes the minus after its operand.

For \`-2 * 3\` the tree is a \`mul\` whose left child is \`neg(2)\` (a minus binds tighter than \`*\`), so the bytes are \`0, 2, 3\` for \`-2\`, then \`0, 3\` for the 3, then \`2\` for MUL: the machine negates 2, pushes 3 and multiplies, giving -6. For \`--4\`, the inner minus writes \`0, 4, 3\` and the outer one adds another \`3\`.

**Common wrong attempts.**

- Writing \`OP.NEG\` before the operand puts the minus where nothing has been pushed yet.
- Writing \`out.push(OP.CONST, -node.operand.value)\` works for \`-5\` but not for \`-(1 + 2)\`, whose operand is not a number node: the minus has to happen when the program runs, on whatever value the operand produces. (A compiler *may* do the sum early when every part is a constant; that is called constant folding, and Drip’s compiler does not do it.)`,
    wrong: [
      {
        code: `const OP = {
  CONST: 0, ADD: 1, MUL: 2, NEG: 3,
};

function flatten(node, out = []) {
  if (node.kind === 'num') {
    out.push(OP.CONST, node.value);
  } else if (node.kind === 'neg') {
    out.push(OP.NEG);
    flatten(node.operand, out);
  } else {
    flatten(node.left, out);
    flatten(node.right, out);
    out.push(node.kind === 'add'
      ? OP.ADD : OP.MUL);
  }
  return out;
}`,
        why: 'NEG is written before its operand, so the machine would try to negate a value that has not been pushed yet. Child first, then the operator.',
      },
      {
        code: `const OP = {
  CONST: 0, ADD: 1, MUL: 2, NEG: 3,
};

function flatten(node, out = []) {
  if (node.kind === 'num') {
    out.push(OP.CONST, node.value);
  } else if (node.kind === 'neg') {
    out.push(OP.CONST,
      -node.operand.value);
  } else {
    flatten(node.left, out);
    flatten(node.right, out);
    out.push(node.kind === 'add'
      ? OP.ADD : OP.MUL);
  }
  return out;
}`,
        why: 'This only works when the operand is a plain number: for `-(1 + 2)` the operand has no `value`, and the result is `NaN`. Flatten the operand, whatever it is, then emit NEG.',
      },
    ],
  },
  countInstrs: {
    optional: true,
    title: 'Counting instructions, not bytes',
    prompt: 'In this bytecode, as in Drip’s real VM, opcode `0` (CONST) is followed by **two** operand bytes, and every other opcode (`20` = ADD, `22` = MUL, `33` = PRINT) has none. Write `countInstrs(code)`, which returns how many *instructions* the array holds. `[0, 0, 1, 0, 0, 2, 20]` is three instructions in seven bytes.',
    starter: `function countInstrs(code) {
  return code.length;
}`,
    solution: `function countInstrs(code) {
  let n = 0;
  let ip = 0;
  while (ip < code.length) {
    const op = code[ip];
    ip += op === 0 ? 3 : 1;
    n++;
  }
  return n;
}`,
    tests: `test('no code', () => {
  expect(countInstrs([])).toBe(0);
});
test('1 + 2', () => {
  expect(countInstrs([0, 0, 1, 0, 0, 2, 20]))
    .toBe(3);
});
test('operands that look like opcodes', () => {
  // const 20, const 22, mul: the operand
  // bytes 0, 20 and 22 are not opcodes
  expect(countInstrs([0, 0, 20, 0, 0, 22, 22]))
    .toBe(3);
});
test('print 7', () => {
  expect(countInstrs([0, 0, 0, 33])).toBe(2);
});`,
    hints: [
      'You cannot count bytes, or count the zeros: an operand byte can hold any number, including 0 or 20.',
      'Walk the array with an index, the way the VM does. At each instruction, the opcode tells you how far it is to the next one.',
      'Use `ip += op === 0 ? 3 : 1;` and count one instruction per step of the loop.',
    ],
    walkthrough: `**How to think about it.** Instructions have different lengths, so the only safe way through the array is the way the machine itself goes: start at the first byte, which is certainly an opcode, decide from it how long this instruction is, and jump to the next one. Nothing in a byte says whether it is an opcode or an operand; only its position in that walk does.

**The solution, line by line.**

- \`let n = 0;\` counts instructions; \`let ip = 0;\` is our position, starting at the first opcode.
- \`while (ip < code.length) {\` keeps going until we step off the end.
- \`const op = code[ip];\` reads the byte at our position, which the walk guarantees is an opcode.
- \`ip += op === 0 ? 3 : 1;\` moves past the whole instruction: three bytes for a CONST (the opcode and its two operand bytes), one for anything else.
- \`n++;\` counts the instruction we just stepped over, and \`return n;\` gives the total.

For \`[0, 0, 20, 0, 0, 22, 22]\`: at 0 we find CONST and jump to 3; at 3, CONST again, jump to 6; at 6, MUL, jump to 7, the end. Three instructions, and the bytes 20 and 22 inside the operands were never mistaken for ADD or MUL.

**Common wrong attempts.**

- Counting the non-zero bytes, or the zeros, fails at once, because an operand can be any value.
- Jumping by 2 after a CONST is the old one-byte layout: it lands on the second operand byte and reads it as an opcode.

Drip’s real VM never needs to count like this, because it decodes as it runs; however, a disassembler (*Bytecode as data, and a disassembler*) has exactly this problem, and solves it the same way.`,
    wrong: [
      {
        code: `function countInstrs(code) {
  return code.filter((b) => b !== 0)
    .length;
}`,
        why: 'This decides by value what each byte is. Operands can be any value, so bytes must be decoded from the start, instruction by instruction.',
      },
      {
        code: `function countInstrs(code) {
  let n = 0;
  let ip = 0;
  while (ip < code.length) {
    ip += code[ip] === 0 ? 2 : 1;
    n++;
  }
  return n;
}`,
        why: 'A CONST here is three bytes, not two: stepping by 2 lands on the second operand byte and counts it as an instruction.',
      },
    ],
  },
  tinyNeg: {
    optional: true,
    title: 'A one-value instruction',
    prompt: 'Extend the tiny VM’s `run(code)` with a fourth opcode, `NEG` (3), which takes the newest value off the stack and pushes its negation. `PUSH`, `ADD` and `MUL` work already; at the moment `NEG` falls into the `else` branch and is treated as a multiplication.',
    starter: `const PUSH = 0, ADD = 1, MUL = 2;
const NEG = 3;

function run(code) {
  const st = [];
  let ip = 0;
  while (ip < code.length) {
    const op = code[ip++];
    if (op === PUSH) {
      st.push(code[ip++]);
    } else {
      const b = st.pop();
      const a = st.pop();
      st.push(op === ADD
        ? a + b : a * b);
    }
  }
  return st.pop();
}`,
    solution: `const PUSH = 0, ADD = 1, MUL = 2;
const NEG = 3;

function run(code) {
  const st = [];
  let ip = 0;
  while (ip < code.length) {
    const op = code[ip++];
    if (op === PUSH) {
      st.push(code[ip++]);
    } else if (op === NEG) {
      st.push(-st.pop());
    } else {
      const b = st.pop();
      const a = st.pop();
      st.push(op === ADD
        ? a + b : a * b);
    }
  }
  return st.pop();
}`,
    tests: `test('-5', () => {
  expect(run([0, 5, 3])).toBe(-5);
});
test('-(1 + 2)', () => {
  expect(run([0, 1, 0, 2, 1, 3])).toBe(-3);
});
test('-2 * 3', () => {
  expect(run([0, 2, 3, 0, 3, 2])).toBe(-6);
});
test('an operand of 3 is not a NEG', () => {
  expect(run([0, 3, 3])).toBe(-3);
});`,
    hints: [
      'NEG needs one value, not two. Which value is it, and where is it?',
      'Add a branch before the `else`: `else if (op === NEG) { ... }`. Inside it, pop one value and push its negation.',
      'The whole branch is `st.push(-st.pop());`.',
    ],
    walkthrough: `**How to think about it.** Every instruction in a stack machine has a fixed effect on the stack: \`PUSH\` adds one value; \`ADD\` and \`MUL\` take two and give back one; a negation takes one and gives back one. So \`NEG\` must pop exactly one value (the newest, which is the operand that was just computed) and push one result. It must also be checked *before* the \`else\`, because the \`else\` catches every opcode it does not recognise and treats it as two-value arithmetic.

**The solution, line by line.**

- \`} else if (op === NEG) {\` adds a branch for opcode 3, placed after the \`PUSH\` case and before the catch-all \`else\`.
- \`st.push(-st.pop());\` pops the top value, negates it with unary minus, and pushes the result. The stack ends up the same height as before, which is the right effect for a one-value instruction.

For \`[0, 2, 3, 0, 3, 2]\` (that is \`-2 * 3\`): \`PUSH 2\`, then \`NEG\` turns it into -2, \`PUSH 3\`, \`MUL\` gives -6. In the last test, \`[0, 3, 3]\`, the first 3 is \`PUSH\`'s operand and is read by \`code[ip++]\` inside the \`PUSH\` branch, so only the second 3 is run as \`NEG\`.

**Common wrong attempts.**

- Popping two values for \`NEG\` takes away a value that belongs to an outer expression (or, here, pops \`undefined\` from an empty stack).
- Adding the branch after the \`else\` is impossible, and adding the check inside the \`else\` after the two pops is too late: by then two values are gone.`,
    wrong: [
      {
        code: `const PUSH = 0, ADD = 1, MUL = 2;
const NEG = 3;

function run(code) {
  const st = [];
  let ip = 0;
  while (ip < code.length) {
    const op = code[ip++];
    if (op === PUSH) {
      st.push(code[ip++]);
    } else if (op === NEG) {
      st.pop();
      st.push(-st.pop());
    } else {
      const b = st.pop();
      const a = st.pop();
      st.push(op === ADD
        ? a + b : a * b);
    }
  }
  return st.pop();
}`,
        why: 'This pops two values for a one-value instruction, so the operand is thrown away and the value under it (or `undefined`) is negated.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'In a tree-walking interpreter, evaluating `n - 2` involves how many operations the program actually asked for?',
    options: [
      {
        t: 'One: the subtraction',
        correct: true,
        why: 'Everything else (seven calls, four switches, two Map lookups, five checks) is overhead.',
      },
      {
        t: 'Seven, one per method call',
        why: 'The method calls are bookkeeping; only the subtraction was asked for.',
      },
      {
        t: 'Two: one per operand',
        why: 'Reading the operands is overhead: a Map lookup for `n`, a constant for 2.',
      },
    ],
  },
  {
    q: 'Flattening `(1 + 2) * 3` into stack-machine instructions, children first, gives which order?',
    options: [
      {
        t: '`mul`, `add`, `const 1`, `const 2`, `const 3`',
        why: 'That puts operators before their operands. The VM would have nothing to multiply.',
      },
      {
        t: '`const 1`, `const 2`, `add`, `const 3`, `mul`',
        correct: true,
        why: 'The sum is computed first because it is the left operand of the product, and each operator follows its operands.',
      },
      {
        t: '`const 1`, `const 2`, `const 3`, `add`, `mul`',
        why: 'That adds 2 and 3 first, which is `1 * (2 + 3)`, a different expression.',
      },
      {
        t: '`const 3`, `const 1`, `const 2`, `add`, `mul`',
        why: 'The same value here by luck, but the left operand should come first. For `-` or `/` this order would be wrong.',
      },
    ],
  },
  {
    q: 'In Drip’s bytecode, how many bytes long is `const 2`, and why?',
    options: [
      {
        t: 'One: the opcode alone',
        why: 'That is true of `add`, which needs nothing more. `const` must also say which constant.',
      },
      {
        t: 'Two: the opcode and a one-byte index',
        why: 'A one-byte index could only name 256 constants. Drip’s VM uses two bytes, so a function can hold up to 65,536.',
      },
      {
        t: 'Nine: the opcode and the eight bytes of the number',
        why: 'The value itself is not in the code; only its number in the constant table is.',
      },
      {
        t: 'Three: the opcode and a two-byte constant number',
        correct: true,
        why: 'The bytes are `0, 0, 2`: opcode 0, then the high and low bytes of 2.',
      },
    ],
  },
  {
    q: 'With `PUSH = 0, ADD = 1, SUB = 2`, what does a tiny stack VM (each `PUSH` followed by its value, and `SUB` popping the right operand first) leave on its stack for the code `[0, 9, 0, 2, 2]`?',
    options: [
      {
        t: '`7`',
        correct: true,
        why: 'Push 9, push 2, then SUB pops b = 2 and a = 9 and pushes 9 - 2.',
      },
      {
        t: '`-7`',
        why: 'That would be `2 - 9`: popping the top value into `a` instead of `b`.',
      },
      {
        t: '`11`',
        why: 'Opcode 2 is SUB here, not ADD.',
      },
      {
        t: '`2`',
        why: 'The last byte is the opcode SUB, not a value: it is never pushed.',
      },
    ],
  },
];
