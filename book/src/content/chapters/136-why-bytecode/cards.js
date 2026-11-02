// Chapter 136 cards. Keys are stable ids: never rename them.

export const prompts = {
  'bytecode-what': {
    q: 'What is **bytecode**?',
    a: 'A program written as a flat array of small numbered instructions, produced once by a compiler and then run.',
  },
  'children-first-order': {
    q: 'Flattening `1 + 2 * 3`, why must `mul` come before `add` in the list?',
    a: 'The addition needs the product as its right operand, so the product must be worked out first. Children are written before their parent.',
  },
  'why-flat': {
    q: 'Why is following a flat instruction list cheaper than walking a tree?',
    a: 'The next instruction is at the next index of one array, so there is no pointer to chase, no recursion and no node-kind switch to find out what to do.',
  },
  'opcode-what': {
    q: 'What is an **opcode**?',
    a: 'The number that says which instruction this is, such as 20 for `add` in Drip’s VM.',
  },
  'operand-what': {
    q: 'In Drip’s bytecode, what do the three bytes `0, 0, 2` mean?',
    a: '`const` (opcode 0) with the two-byte operand 2: push constant number 2.',
  },
  'one-byte-enough': {
    q: 'Why does a Drip opcode fit in a single byte?',
    a: 'The VM has 53 kinds of instruction, and a byte can hold 256 different values.',
  },
  'const-300': {
    q: 'Constant number 300 is written as two operand bytes. Which two, and why?',
    a: '`1, 44`: the high byte first, and 1 × 256 + 44 = 300.',
  },
  'k-s-j': {
    q: 'In the comments of `chunk.ts`, what do the operand letters `k`, `s` and `j` stand for?',
    a: '`k`: a two-byte constant number; `s`: a one-byte slot, index or count; `j`: a two-byte jump distance.',
  },
};

export const examples = {
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
};

const OPS = `const OP = { CONST: 0, ADD: 1, MUL: 2 };`;
const OPS4 = `const OP = {
  CONST: 0, ADD: 1, MUL: 2, NEG: 3,
};`;

const tests = `const num = (value) => ({ kind: 'num', value });
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
});`;

export const exercises = {
  flatten: {
    title: 'Flatten a tree into bytes',
    prompt:
      'Nodes are `{ kind: "num", value }`, `{ kind: "add", left, right }` and `{ kind: "mul", left, right }`. Write `flatten(node)`, which returns an array of numbers: a number becomes `OP.CONST, value`; an `add` or `mul` becomes its left operand’s bytes, then its right operand’s, then `OP.ADD` or `OP.MUL`. The number case is done for you. (This toy bytecode stores each value straight after `CONST`, as the tiny VM in the chapter does.)',
    starter: `${OPS}

function flatten(node, out = []) {
  if (node.kind === 'num') {
    out.push(OP.CONST, node.value);
    return out;
  }
  // children first, then the operator
  return out;
}`,
    solution: `${OPS}

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
    tests,
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
        code: `${OPS}

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
        code: `${OPS}

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
    prompt:
      'Add a fourth kind of node, `{ kind: "neg", operand }`, for a unary minus like `-x`, with a new opcode `OP.NEG` (3) that pops one value and pushes its negation. Extend `flatten` so that a `neg` node becomes its operand’s bytes, then `OP.NEG`. The other cases are done.',
    starter: `${OPS4}

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
    solution: `${OPS4}

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
        code: `${OPS4}

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
        code: `${OPS4}

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
};

export const quiz = [
  {
    q: 'Flattening `(1 + 2) * 3` children first gives which instruction order?',
    options: [
      { t: '`mul`, `add`, `const 1`, `const 2`, `const 3`', why: 'That puts operators before their operands. The VM would have nothing to multiply.' },
      { t: '`const 1`, `const 2`, `add`, `const 3`, `mul`', correct: true, why: 'The sum is computed first because it is the left operand of the product, and each operator follows its operands.' },
      { t: '`const 1`, `const 2`, `const 3`, `add`, `mul`', why: 'That adds 2 and 3 first, which is `1 * (2 + 3)`, a different expression.' },
      { t: '`const 3`, `const 1`, `const 2`, `add`, `mul`', why: 'The same value here by luck, but the left operand should come first. For `-` or `/` this order would be wrong.' },
    ],
  },
  {
    q: 'What is an opcode?',
    options: [
      { t: 'A value the program uses, like `1.5`', why: 'That is a constant. It is named by an operand, not stored as an opcode.' },
      { t: 'The line number an instruction came from', why: 'Line numbers are kept separately, for error messages.' },
      { t: 'The number saying which instruction to perform', correct: true, why: 'For example 20 means `add` and 0 means `const` in Drip’s VM.' },
      { t: 'A machine-code instruction of the real CPU', why: 'Bytecode opcodes are for the virtual machine. The real CPU never runs them directly.' },
    ],
  },
  {
    q: 'In Drip’s bytecode, how many bytes long is `const 2`, and why?',
    options: [
      { t: 'One: the opcode alone', why: 'That is true of `add`, which needs nothing more. `const` must also say which constant.' },
      { t: 'Two: the opcode and a one-byte index', why: 'A one-byte index could only name 256 constants. Drip’s VM uses two bytes, so a function can hold up to 65,536.' },
      { t: 'Nine: the opcode and the eight bytes of the number', why: 'The value itself is not in the code; only its number in the constant table is.' },
      { t: 'Three: the opcode and a two-byte constant number', correct: true, why: 'The bytes are `0, 0, 2`: opcode 0, then the high and low bytes of 2.' },
    ],
  },
  {
    q: 'Which work does a tree-walker repeat on every run of a node, which a bytecode compiler does only once?',
    options: [
      { t: 'Finding out what each node is and in what order to visit its children', correct: true, why: 'The compiler records that once, as a flat list in the right order. The VM only follows it.' },
      { t: 'The arithmetic itself', why: 'Both engines must still add the numbers every time the program asks.' },
      { t: 'Printing output', why: 'Printing happens when the program says so, in both designs.' },
      { t: 'Scanning the source text', why: 'Both scan the source once, before running.' },
    ],
  },
  {
    q: 'Inside a function, the compiler prints `0002    | load.local          2`. How long is this instruction, and what comes next?',
    options: [
      { t: 'Two bytes, the opcode and the slot number, so the next instruction starts at 0004', correct: true, why: '`load.local` has a one-byte operand (`s` in chunk.ts), so it covers offsets 2 and 3.' },
      { t: 'One byte; the 2 is part of the next instruction', why: 'The 2 is this instruction’s own operand, the slot to load.' },
      { t: 'Three bytes, like `const`', why: 'Only constant numbers and jumps take two operand bytes; a slot number fits in one.' },
      { t: 'It depends on the value stored in slot 2', why: 'Instruction lengths are fixed by the opcode, never by the values the program is using.' },
    ],
  },
];
