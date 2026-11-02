// Chapter 118 cards. Keys are stable ids: never rename them.

export const prompts = {
  'bytecode-what': {
    q: 'What is **bytecode**?',
    a: 'A program written as a flat array of small numbered instructions, produced once by a compiler and then run.',
  },
  'children-first-order': {
    q: 'Flattening `1 + 2 * 3`, why must `MULTIPLY` come before `ADD` in the list?',
    a: 'The addition needs the product as its right operand, so the product must be computed first. Children are written before their parent.',
  },
  'why-flat': {
    q: 'Why is following a flat instruction list cheaper than walking a tree?',
    a: 'The next instruction is at the next index of one array, so there is no pointer to chase, no recursion and no node-kind switch per node.',
  },
  'opcode-what': {
    q: 'What is an **opcode**?',
    a: 'The number that identifies which instruction this is, such as 18 for ADD in Drip’s VM.',
  },
  'operand-what': {
    q: 'In Drip’s bytecode, what do the two bytes `0, 2` mean?',
    a: 'OP_CONSTANT (opcode 0) with operand 2: push constant number 2.',
  },
  'one-byte-enough': {
    q: 'Why can a Drip opcode fit in a single byte?',
    a: 'The VM has 37 instructions, and a byte holds 256 different values.',
  },
  'vm-what': {
    q: 'What does a **virtual machine** do, in one sentence?',
    a: 'It runs bytecode: a loop that fetches the next instruction, decodes its opcode, and performs it.',
  },
  'why-virtual': {
    q: 'Why is a bytecode interpreter called a *virtual* machine?',
    a: 'It works like a CPU running machine code, but the processor and its instruction set are made of software.',
  },
  'string-eq-limit': {
    q: 'Why did the VM refuse to compile `string_equality`?',
    a: 'Its chunk would need more than 256 constants (each mention of a variable name adds one), and a constant’s number must fit in a one-byte operand.',
  },
  'slower-lesson': {
    q: 'The VM was slower than the tree-walker on `instantiation`. What can one benchmark run on a shared machine tell you about why?',
    a: 'Nothing certain. It points at suspects to investigate, not at a cause.',
  },
};

export const examples = {
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
  'fib-vm': {
    title: 'Drip on the bytecode VM',
    lang: 'drip-vm',
    code: `fn fib(n) {
  if (n < 2) return n;
  return fib(n - 1) + fib(n - 2);
}

print fib(20);
print "same Drip, new engine";`,
  },
};

const OPS = `const OP = { CONST: 0, ADD: 1, MUL: 2 };`;

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
      'Nodes are `{ kind: "num", value }`, `{ kind: "add", left, right }` and `{ kind: "mul", left, right }`. Write `flatten(node)`, which returns an array of numbers: a number becomes `OP.CONST, value`; an `add` or `mul` becomes its left operand’s bytes, then its right operand’s, then `OP.ADD` or `OP.MUL`. The number case is done for you.',
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
      'An operator node can only be run once both its operands are on the stack, so its bytes go last.',
      'Call `flatten(node.left, out)` and `flatten(node.right, out)`, passing the same `out` array so everything lands in one list.',
      'After both calls, push `OP.ADD` if `node.kind === "add"`, otherwise `OP.MUL`.',
    ],
    walkthrough: `The whole trick is the order:

\`\`\`js
flatten(node.left, out);
flatten(node.right, out);
out.push(node.kind === 'add'
  ? OP.ADD : OP.MUL);
\`\`\`

- **Left, right, then operator.** When the VM reaches \`ADD\`, it pops two values. They must already be there, so both operands’ instructions have to come first. This is a *post-order* walk: a node after its children.
- **One shared array.** Passing \`out\` down means each recursive call appends to the same list, rather than building little arrays and gluing them together.
- **Left before right matters too.** For \`+\` and \`*\` you’d get the same answer either way, but the VM pops the right operand first and the left second. With \`-\` or \`/\`, swapping them would give the wrong result.

The recursion here runs once, at compile time. The bytes it produces can then be run as many times as you like by a loop with no recursion at all.`,
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
        why: 'The children are flattened into fresh arrays that are then thrown away, so only the operator ends up in `out`. Pass `out` down, or concatenate `l` and `r` into it.',
      },
    ],
  },
  countInstrs: {
    optional: true,
    title: 'Counting instructions, not bytes',
    prompt:
      'In this bytecode, opcode `0` (CONST) is followed by one operand byte, and every other opcode (1 = ADD, 2 = MUL) has none. Write `countInstrs(code)`, which returns how many *instructions* the array holds. `[0, 1, 0, 2, 1]` is three instructions in five bytes.',
    starter: `function countInstrs(code) {
  return code.length;
}`,
    solution: `function countInstrs(code) {
  let n = 0;
  let ip = 0;
  while (ip < code.length) {
    const op = code[ip];
    ip += op === 0 ? 2 : 1;
    n++;
  }
  return n;
}`,
    tests: `test('no code', () => {
  expect(countInstrs([])).toBe(0);
});
test('1 + 2', () => {
  expect(countInstrs([0, 1, 0, 2, 1])).toBe(3);
});
test('an operand that looks like an opcode', () => {
  // CONST 0, CONST 2, MUL: the operands
  // 0 and 2 are values, not opcodes
  expect(countInstrs([0, 0, 0, 2, 2])).toBe(3);
});`,
    hints: [
      'You can’t just count bytes or count the zeros: an operand byte can hold any number, including 0.',
      'Walk the array with an index, like the VM does. At each instruction, look at the opcode to decide how far to jump.',
      'Use `ip += op === 0 ? 2 : 1;` and count one instruction per step.',
    ],
    walkthrough: `Instructions have different lengths, so the only safe way through is to decode them in order, like the VM itself:

\`\`\`js
while (ip < code.length) {
  const op = code[ip];
  ip += op === 0 ? 2 : 1;
  n++;
}
\`\`\`

Counting the zeros fails on \`[0, 0, 0, 2, 2]\`: the second byte is a zero, but it’s the *value* 0 being pushed, not an opcode. You can only tell an opcode from an operand by starting at the beginning and stepping over each instruction’s operands. A disassembler (next chapter) has exactly this problem, and solves it the same way.`,
    wrong: [
      {
        code: `function countInstrs(code) {
  return code.filter((b) => b !== 0)
    .length;
}`,
        why: 'This treats every 0 as an opcode and everything else as one too. Operands can be any value, so bytes must be decoded from the start, instruction by instruction.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Flattening `(1 + 2) * 3` children first gives which instruction order?',
    options: [
      { t: 'MULTIPLY, ADD, CONST 1, CONST 2, CONST 3', why: 'That puts operators before their operands. The VM would have nothing to multiply.' },
      { t: 'CONST 1, CONST 2, ADD, CONST 3, MULTIPLY', correct: true, why: 'The sum is computed first because it is the left operand of the product, and each operator follows its operands.' },
      { t: 'CONST 1, CONST 2, CONST 3, ADD, MULTIPLY', why: 'That works out 2 + 3 first, which is `1 * (2 + 3)`, a different expression.' },
      { t: 'CONST 3, CONST 1, CONST 2, ADD, MULTIPLY', why: 'Same value here by luck, but the left operand should come first. For `-` or `/` this order would be wrong.' },
    ],
  },
  {
    q: 'What is an opcode?',
    options: [
      { t: 'A value the program uses, like `1.5`', why: 'That’s a constant. It is referred to by an operand, not stored as an opcode.' },
      { t: 'The line number an instruction came from', why: 'Line numbers are kept separately, for error messages.' },
      { t: 'A machine-code instruction of the real CPU', why: 'Bytecode opcodes are for the virtual machine. The real CPU never sees them directly.' },
      { t: 'The number identifying which instruction to perform', correct: true, why: 'For example 18 means ADD in Drip’s VM.' },
    ],
  },
  {
    q: 'Which work does a tree-walker repeat on every run of a node that a bytecode compiler does only once?',
    options: [
      { t: 'Working out the order of operations by recursing through the node’s children', correct: true, why: 'The compiler records that order once, as a flat list. The VM just follows it.' },
      { t: 'The arithmetic itself', why: 'Both engines must still add numbers every time the program asks.' },
      { t: 'Printing output', why: 'Printing happens when the program says so, in both designs.' },
      { t: 'Scanning the source text', why: 'Both scan the source once, before running.' },
    ],
  },
  {
    q: 'Why is the bytecode interpreter called a *virtual* machine?',
    options: [
      { t: 'It only runs inside a browser', why: 'Drip’s VM runs in Node too. The name isn’t about where it runs.' },
      { t: 'It fetches, decodes and runs instructions like a CPU, but it is a program', correct: true, why: 'A pretend processor with an instruction set designed for the language.' },
      { t: 'It runs on a cloud virtual machine', why: 'A different meaning of the word. The benchmarks happened to run on one, but that isn’t the reason for the name.' },
      { t: 'It compiles to machine code first', why: 'That would be a compiler to machine code, like V8’s Sparkplug. A VM interprets bytecode.' },
    ],
  },
  {
    q: 'Why was there no VM time for `string_equality`?',
    options: [
      { t: 'It ran too long and was stopped', why: 'The harness recorded a compile error, not a timeout.' },
      { t: 'The VM doesn’t support strings yet', why: 'It does: other benchmarks use strings.' },
      { t: 'It ran for a fixed 10 seconds', why: 'That’s `zoo_batch`.' },
      { t: 'Its script needs more than 256 constants, and a constant’s number is a one-byte operand', correct: true, why: 'The compiler stops with `Too many constants in one chunk.` A design limit, not slowness.' },
    ],
  },
  {
    q: 'What is the fair conclusion from the VM losing on `instantiation` and `equality`?',
    options: [
      { t: 'Bytecode is slower than tree-walking', why: 'The same VM was faster on most other programs.' },
      { t: 'The measurement is broken', why: 'Nothing suggests that. It’s a real result that needs explaining.' },
      { t: 'A faster design isn’t faster at everything, and one run can only point at suspects', correct: true, why: 'Possible causes, like the VM’s own heap tracking or its hand-written hash tables, are things to test, not conclusions.' },
      { t: 'The tree-walker cheats by caching results', why: 'It does no such thing: it walks the tree every time.' },
    ],
  },
];
