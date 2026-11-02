// Chapter 227 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'isel-what': {
    q: 'What does **instruction selection** decide?',
    a: 'Which machine instructions compute each operation of the IR; its output still uses virtual registers.',
  },
  'why-not-one-to-one': {
    q: 'Why does `%9 = const 1; %10 = binop + %3, %9` become a single RISC-V instruction?',
    a: '`addi` carries a 12-bit constant inside the instruction, so one `addi` does both the constant and the add.',
  },
  'why-trees': {
    q: 'How do we turn three-address code back into expression trees?',
    a: 'Replace each temporary that is used exactly once by the expression that computes it, repeatedly.',
  },
  'tile-what': {
    q: 'What is a **tile**?',
    a: 'A small tree pattern with one instruction attached; where the pattern matches, that instruction computes the value at its root.',
  },
  'tile-condition': {
    q: 'When does the tile `ADD(x, CONST c) ⇒ addi d, x, c` match?',
    a: 'When an ADD has a constant right operand c with −2048 ≤ c ≤ 2047, the range of a sign-extended 12-bit immediate.',
  },
  'cover-rule': {
    q: 'What makes a set of tiles a **tiling** of a tree?',
    a: 'Every node is in exactly one tile, and every leaf x of a tile is the root of another tile or a value already in a register.',
  },
  'munch-rule': {
    q: 'What does **maximal munch** do at each node?',
    a: 'It picks the biggest tile that matches there (covering the most nodes), then munches the subtrees left at that tile’s leaves.',
  },
  'munch-order': {
    q: 'Maximal munch chooses tiles top-down. In what order does it write the instructions, and why?',
    a: 'Bottom-up: children before parents, because an instruction can only run once its operands are in registers.',
  },
  'li-pseudo': {
    q: 'Why does `x + 5000` need more than one instruction on RISC-V?',
    a: '5000 does not fit in 12 bits, so `addi` cannot match; the constant goes into a register first (`li`, here `lui` + `addiw`), then `add`.',
  },
};

export const examples = {
  naive: {
    title: 'A selector that knows only small tiles',
    code: `const R = (s) => ({ op: 'reg', s });
const K = (v) => ({ op: 'k', v });
const N = (op, l, r) => ({ op, l, r });

let n = 0;
let out = [];
function emit(op, args) {
  n += 1;
  out.push(\`\${op} v\${n}, \${args}\`);
  return 'v' + n;
}
function small(t) {
  return t.op === 'k' &&
    t.v >= -2048 && t.v <= 2047;
}

function munch(t) {
  if (t.op === 'reg') return t.s;
  if (t.op === 'k') {
    return emit('li', t.v);
  }
  if (t.op === 'load') {
    const b = munch(t.l);
    return emit('ld', \`0(\${b})\`);
  }
  if (t.op === 'shl') {
    const x = munch(t.l);
    const k = t.r.v;
    return emit('slli', \`\${x}, \${k}\`);
  }
  const x = munch(t.l);
  const y = munch(t.r);
  return emit(t.op, \`\${x}, \${y}\`);
}

function select(t) {
  n = 0;
  out = [];
  munch(t);
  return out;
}

const tree = N('load',
  N('add',
    N('add', R('a0'),
      N('shl', R('a1'), K(3))),
    K(8)));
const code = select(tree);
console.log(code.join('\\n'));
console.log('count:', code.length);`,
  },
};

export const exercises = {
  munch: {
    title: 'Teach maximal munch two bigger tiles',
    prompt: 'The selector below tiles a tree with small tiles only, so `a[i + 1]` takes five instructions. Add two tiles to `munch`, each in the place marked: **`ld c(x)`** for `LOAD(ADD(x, CONST c))`, and **`addi`** for `ADD(x, CONST c)`, both only when `small(...)` says the constant fits in 12 bits. Trees are built with `R(\'a0\')` (a value already in a register), `K(8)` (a constant) and `N(op, left, right)`; a load\'s address is its `l`. `select(tree)` returns the instructions as strings, numbering virtual registers `v1`, `v2`, ... in the order the instructions are written.',
    starter: `const R = (s) => ({ op: 'reg', s });
const K = (v) => ({ op: 'k', v });
const N = (op, l, r) => ({ op, l, r });

let n = 0;
let out = [];
function emit(op, args) {
  n += 1;
  out.push(\`\${op} v\${n}, \${args}\`);
  return 'v' + n;
}
function small(t) {
  return t.op === 'k' &&
    t.v >= -2048 && t.v <= 2047;
}

function munch(t) {
  if (t.op === 'reg') return t.s;
  if (t.op === 'k') {
    return emit('li', t.v);
  }
  if (t.op === 'load') {
    // add the ld c(x) tile here
    const b = munch(t.l);
    return emit('ld', \`0(\${b})\`);
  }
  if (t.op === 'shl') {
    const x = munch(t.l);
    const k = t.r.v;
    return emit('slli', \`\${x}, \${k}\`);
  }
  // add the addi tile here
  const x = munch(t.l);
  const y = munch(t.r);
  return emit(t.op, \`\${x}, \${y}\`);
}

function select(t) {
  n = 0;
  out = [];
  munch(t);
  return out;
}

console.log(select(
  N('add', R('a0'), K(5))));`,
    solution: `const R = (s) => ({ op: 'reg', s });
const K = (v) => ({ op: 'k', v });
const N = (op, l, r) => ({ op, l, r });

let n = 0;
let out = [];
function emit(op, args) {
  n += 1;
  out.push(\`\${op} v\${n}, \${args}\`);
  return 'v' + n;
}
function small(t) {
  return t.op === 'k' &&
    t.v >= -2048 && t.v <= 2047;
}

function munch(t) {
  if (t.op === 'reg') return t.s;
  if (t.op === 'k') {
    return emit('li', t.v);
  }
  if (t.op === 'load') {
    const a = t.l;
    if (a.op === 'add' && small(a.r)) {
      const b = munch(a.l);
      const c = a.r.v;
      return emit('ld', \`\${c}(\${b})\`);
    }
    const b = munch(a);
    return emit('ld', \`0(\${b})\`);
  }
  if (t.op === 'shl') {
    const x = munch(t.l);
    const k = t.r.v;
    return emit('slli', \`\${x}, \${k}\`);
  }
  if (t.op === 'add' && small(t.r)) {
    const x = munch(t.l);
    const c = t.r.v;
    return emit('addi', \`\${x}, \${c}\`);
  }
  const x = munch(t.l);
  const y = munch(t.r);
  return emit(t.op, \`\${x}, \${y}\`);
}

function select(t) {
  n = 0;
  out = [];
  munch(t);
  return out;
}`,
    tests: `const A = N('load',
  N('add',
    N('add', R('a0'),
      N('shl', R('a1'), K(3))),
    K(8)));
test('a[i + 1] takes three instructions', () => {
  expect(select(A)).toEqual([
    'slli v1, a1, 3',
    'add v2, a0, v1',
    'ld v3, 8(v2)']);
});
test('x + 5 is one addi', () => {
  expect(select(N('add', R('a0'), K(5))))
    .toEqual(['addi v1, a0, 5']);
});
test('-2048 still fits in addi', () => {
  expect(select(N('add', R('a0'), K(-2048))))
    .toEqual(['addi v1, a0, -2048']);
});
test('2048 does not fit: li, then add', () => {
  expect(select(N('add', R('a0'), K(2048))))
    .toEqual(['li v1, 2048', 'add v2, a0, v1']);
});
test('a plain load uses offset 0', () => {
  expect(select(N('load', R('a0'))))
    .toEqual(['ld v1, 0(a0)']);
});
test('a big offset is not folded', () => {
  const t = N('load',
    N('add', R('a0'), K(4096)));
  expect(select(t)).toEqual([
    'li v1, 4096',
    'add v2, a0, v1',
    'ld v3, 0(v2)']);
});
test('mul is still one tile', () => {
  expect(select(N('mul', R('a0'), R('a1'))))
    .toEqual(['mul v1, a0, a1']);
});`,
    hints: [
      'Each new tile is an extra `if` that checks the shape *before* the general case runs. Maximal munch means the bigger pattern must be tried first.',
      'For the load: look at its address `a = t.l`. If `a.op === \'add\'` and `small(a.r)`, the constant becomes the offset and only `a.l` needs munching. For the add: if `t.op === \'add\'` and `small(t.r)`, munch only `t.l` and emit `addi`.',
      'Inside the load case: `const b = munch(a.l); return emit(\'ld\', `${a.r.v}(${b})`);` (store `a.r.v` in a short variable first to keep the line short). Before the general case: `const x = munch(t.l); return emit(\'addi\', `${x}, ${t.r.v}`);`.',
    ],
    walkthrough: `**How to think about it.** Maximal munch is a recursive function with one rule: at this node, try the biggest pattern first. The starter already handles the one-node tiles (\`li\`, \`ld 0(x)\`, \`slli\` with its constant, and the general \`add\`/\`mul\`), and it works, but it never notices that a constant could ride inside an instruction. So for each new tile, ask two questions: *what shape must the tree have here?* and *which parts are left over for munching?* For \`ld c(x)\` the shape is LOAD over ADD over (anything, small constant), and only the "anything" is left over. For \`addi\` the shape is ADD over (anything, small constant), and again only the left child is left over. Each check must come *before* the general case, or the general case will grab the node first.

**The solution, line by line** (only the changed parts of \`munch\`).

- \`const a = t.l;\` names the load's address subtree, so the checks read clearly.
- \`if (a.op === 'add' && small(a.r)) {\` asks whether the address is "something plus a small constant". \`small\` checks both that it is a constant node and that it fits in 12 signed bits, −2048 to 2047.
- \`const b = munch(a.l);\` munches the "something": this writes its instructions first (children before parents) and returns the register holding it, for \`a[i + 1]\` the \`v2\` produced by \`slli\` and \`add\`.
- \`const c = a.r.v;\` takes the constant, 8.
- \`return emit('ld', \`\${c}(\${b})\`);\` writes \`ld v3, 8(v2)\`: one instruction for the LOAD, the ADD and the CONST.
- \`const b = munch(a); return emit('ld', \`0(\${b})\`);\` is the old one-node tile, now only reached when the bigger one did not match.
- \`if (t.op === 'add' && small(t.r)) {\` is the \`addi\` tile: an ADD whose right child is a small constant.
- \`const x = munch(t.l); const c = t.r.v; return emit('addi', \`\${x}, \${c}\`);\` munches only the left child and folds the constant into the instruction.

Why the tests come out as they do: for \`a[i + 1]\`, the root LOAD now matches \`ld c(x)\`, the inner ADD has a SHL (not a constant) on its right, so it falls to the general \`add\`, and the SHL is \`slli\`: three instructions, \`v1\` to \`v3\`, in exactly clang's order. \`K(-2048)\` is the most negative 12-bit value and still fits; \`K(2048)\` is one too many, so it goes through \`li\` and \`add\`; and \`K(4096)\` as an offset is too big for the load, so the address is built in full and loaded with offset 0.

**Common wrong attempts.**

- Folding *any* constant into the load (\`if (a.op === 'add')\` without \`small\`, or checking \`a.r.op === 'k'\` alone): 4096 or 5000 would be written as an offset that the instruction cannot hold, and the assembler would reject it.
- Putting the new checks after the general case: the general \`add\` matches every ADD, so the bigger tiles would never be reached.
- Emitting the parent before munching the children: the instruction would name a register that has not been computed yet.`,
    wrong: [
      {
        code: `const R = (s) => ({ op: 'reg', s });
const K = (v) => ({ op: 'k', v });
const N = (op, l, r) => ({ op, l, r });

let n = 0;
let out = [];
function emit(op, args) {
  n += 1;
  out.push(\`\${op} v\${n}, \${args}\`);
  return 'v' + n;
}
function small(t) {
  return t.op === 'k' &&
    t.v >= -2048 && t.v <= 2047;
}

function munch(t) {
  if (t.op === 'reg') return t.s;
  if (t.op === 'k') {
    return emit('li', t.v);
  }
  if (t.op === 'load') {
    const a = t.l;
    if (a.op === 'add') {
      const b = munch(a.l);
      const c = a.r.v;
      return emit('ld', \`\${c}(\${b})\`);
    }
    const b = munch(a);
    return emit('ld', \`0(\${b})\`);
  }
  if (t.op === 'shl') {
    const x = munch(t.l);
    const k = t.r.v;
    return emit('slli', \`\${x}, \${k}\`);
  }
  if (t.op === 'add' && small(t.r)) {
    const x = munch(t.l);
    const c = t.r.v;
    return emit('addi', \`\${x}, \${c}\`);
  }
  const x = munch(t.l);
  const y = munch(t.r);
  return emit(t.op, \`\${x}, \${y}\`);
}

function select(t) {
  n = 0;
  out = [];
  munch(t);
  return out;
}`,
        why: 'This folds every constant into the load, even 4096, which does not fit in a 12-bit offset; the "big offset" test fails.',
      },
      {
        code: `const R = (s) => ({ op: 'reg', s });
const K = (v) => ({ op: 'k', v });
const N = (op, l, r) => ({ op, l, r });

let n = 0;
let out = [];
function emit(op, args) {
  n += 1;
  out.push(\`\${op} v\${n}, \${args}\`);
  return 'v' + n;
}
function small(t) {
  return t.op === 'k' &&
    t.v >= -2048 && t.v <= 2047;
}

function munch(t) {
  if (t.op === 'reg') return t.s;
  if (t.op === 'k') {
    return emit('li', t.v);
  }
  if (t.op === 'load') {
    const a = t.l;
    if (a.op === 'add' && small(a.r)) {
      const b = munch(a.l);
      const c = a.r.v;
      return emit('ld', \`\${c}(\${b})\`);
    }
    const b = munch(a);
    return emit('ld', \`0(\${b})\`);
  }
  if (t.op === 'shl') {
    const x = munch(t.l);
    const k = t.r.v;
    return emit('slli', \`\${x}, \${k}\`);
  }
  if (t.r && t.r.op === 'k') {
    const x = munch(t.l);
    const c = t.r.v;
    return emit('addi', \`\${x}, \${c}\`);
  }
  const x = munch(t.l);
  const y = munch(t.r);
  return emit(t.op, \`\${x}, \${y}\`);
}

function select(t) {
  n = 0;
  out = [];
  munch(t);
  return out;
}`,
        why: 'This checks only that the right child is a constant, not that it fits: `x + 2048` becomes `addi v1, a0, 2048`, which RISC-V cannot encode.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Which instruction does maximal munch choose for the tree `ADD(a0, CONST 7)` with this chapter’s tiles?',
    options: [
      {
        t: '`li v1, 7` then `add v2, a0, v1`',
        why: 'That uses two small tiles; munch takes the biggest tile that matches at the root, which covers both nodes.',
      },
      {
        t: '`addi v1, a0, 7`',
        correct: true,
        why: 'The addi tile matches the ADD and its small constant together: one instruction.',
      },
      {
        t: '`ld v1, 7(a0)`',
        why: 'A load tile needs a LOAD at the root; this tree only adds.',
      },
    ],
  },
  {
    q: 'Why does maximal munch write the instruction for a tile *after* the instructions for the subtrees at its leaves?',
    options: [
      {
        t: 'Because the root of the tree must be the last instruction in the function',
        why: 'Other trees follow; the reason is about operands, not the function.',
      },
      {
        t: 'Because smaller tiles are cheaper',
        why: 'Cost does not decide the order; correctness does.',
      },
      {
        t: 'Because an instruction can only run once its operands have been computed into registers',
        correct: true,
        why: 'The leaves of a tile are its operands, so their code must come first.',
      },
    ],
  },
  {
    q: 'With the Zba extension, clang compiles `a[i + 1]` (8-byte elements) to `sh3add a0, a1, a0; ld a0, 8(a0)`. What did sh3add cover?',
    options: [
      {
        t: 'The SHL by 3, its constant, and the ADD of the base address',
        correct: true,
        why: 'sh3add computes rs2 + (rs1 << 3): three nodes of the tree in one tile.',
      },
      {
        t: 'The LOAD and the ADD of 8',
        why: 'That part is still covered by ld 8(x).',
      },
      {
        t: 'Only the SHL',
        why: 'A shift alone is slli; sh3add also does the add.',
      },
    ],
  },
  {
    q: 'A selector meets `LOAD(ADD(a0, CONST 3000))`. Which tiling is correct?',
    options: [
      {
        t: '`ld v1, 3000(a0)`',
        why: '3000 does not fit in a 12-bit signed offset (at most 2047), so the load-offset tile does not match.',
      },
      {
        t: '`li v1, 3000; add v2, a0, v1; ld v3, 0(v2)`',
        correct: true,
        why: 'The constant goes into a register, the address is added in full, and the load uses offset 0.',
      },
      {
        t: '`addi v1, a0, 3000; ld v2, 0(v1)`',
        why: 'addi has the same 12-bit limit, so it cannot carry 3000 either.',
      },
    ],
  },
  {
    q: 'What is true of every **tiling** of an expression tree?',
    options: [
      {
        t: 'It uses the biggest tile at every node',
        why: 'That is how maximal munch builds one tiling, not a property of all of them.',
      },
      {
        t: 'Every node belongs to exactly one tile',
        correct: true,
        why: 'No node is left out and none is covered twice; each tile becomes one instruction.',
      },
      {
        t: 'It has one tile per node',
        why: 'A tile can cover several nodes, which is the whole point of big tiles.',
      },
    ],
  },
  {
    q: 'Does Viscosity have an instruction selector?',
    options: [
      {
        t: 'Yes, it tiles VIR into RISC-V',
        why: 'Viscosity never emits machine code.',
      },
      {
        t: 'Yes, it uses LLVM’s',
        why: 'Viscosity does not use LLVM; its output is JavaScript.',
      },
      {
        t: 'No: it emits JavaScript, and V8 chooses the machine instructions',
        correct: true,
        why: 'Viscosity is a source-to-source compiler, so instruction selection happens inside the engine that runs its output.',
      },
    ],
  },
];
