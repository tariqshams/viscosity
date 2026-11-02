// Chapter 175 cards. Keys are stable ids: never rename them.

export const prompts = {
  'tac-what': {
    q: 'What does one three-address instruction do?',
    a: 'One operation on at most two named inputs, with one named result: `x = y op z`.',
  },
  'why-three': {
    q: 'Which three “addresses” give three-address code its name?',
    a: 'Two inputs and one output.',
  },
  'children-first': {
    q: 'Why does lowering an expression emit the children’s instructions before the parent’s?',
    a: 'The parent’s instruction names its inputs, and those names only exist once the children are lowered.',
  },
  'temp-what': {
    q: 'What is a temporary?',
    a: 'A name the compiler invents for an intermediate value, the result of one instruction.',
  },
  'let-vanishes': {
    q: 'Why does `let t = a;` produce no VIR instruction at all?',
    a: 'The front end only records that `t` now means `a`’s value (`%0`). Later reads of `t` use `%0` directly.',
  },
  'const-is-inst': {
    q: 'How does VIR represent the literal `2` in `t * 2`?',
    a: 'As its own instruction, `%1 = const 2`, so it has a name like any other value.',
  },
  'inst-args': {
    q: 'In VIR’s `Inst` record for `%2 = binop * %0, %1`, what is `args`?',
    a: '`[0, 1]`: the ids of the input values.',
  },
  'uses-map': {
    q: 'What does `buildUses` compute, and how?',
    a: 'For every value, the instructions that use it. One pass files each instruction under each of its arguments.',
  },
  'dead-value': {
    q: 'What can usually be done with a value that has no uses?',
    a: 'Delete its instruction: it is dead (if it has no side effects).',
  },
};

export const examples = {
  'no-copies': {
    title: 'Names, not copies',
    code: `// Lower: let t = a; let u = t * 2;
//        return u + t;
const names = new Map();
const code = [];
let n = 0;
const emit = (text) => {
  const t = 't' + ++n;
  code.push(t + ' = ' + text);
  return t;
};
const get = (x) => names.get(x);

names.set('a', 'a');
// let t = a: no instruction
names.set('t', get('a'));
// let u = t * 2
names.set('u', emit(get('t') + ' * 2'));
// return u + t
const r =
  emit(get('u') + ' + ' + get('t'));
code.push('return ' + r);
console.log(code.join('\\n'));`,
  },
};

const tacTests = `const v = (v) => ({ v });
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
});`;

const useTests = `const I = (dst, ...args) => ({ dst, args });
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
});`;

export const exercises = {
  'to-tac': {
    title: 'An expression tree to three-address code',
    prompt:
      'Expression trees have three kinds of node: a variable `{ v: "a" }`, a number `{ n: 2 }`, and an operator `{ op: "+", l, r }`. Write `toTac(e)` that returns the three-address code as an array of strings like `"t1 = b * c"`.\n\n- Variables and numbers need no instruction: use the name or the number directly.\n- Lower the left operand, then the right, then emit the operator’s line with a fresh temporary: `t1`, `t2`, ... in order.\n- Each call of `toTac` starts again at `t1`.',
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
    tests: tacTests,
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
    prompt:
      'A tiny `buildUses`. Each instruction is `{ dst, args }`, for example `{ dst: "t2", args: ["a", "t1"] }`. Write `uses(code)` that returns an object mapping each name to the list of `dst`s of the instructions that use it, in program order. A name used twice by one instruction appears twice. Names nobody uses have no entry.',
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
    tests: useTests,
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
};

export const quiz = [
  {
    q: 'Which of these is a three-address instruction?',
    options: [
      { t: '`MULTIPLY` (pop two, push one)', why: 'A stack instruction: its inputs and output have no names.' },
      { t: '`t3 = t1 * t2`', correct: true, why: 'One operation, two named inputs, one named result.' },
      { t: '`x = (a + b) * c`', why: 'Two operations in one line. Three-address code would split it with a temporary.' },
      { t: '`print a + b`', why: 'An addition and a print together. Lowered, the sum would get its own temporary first.' },
    ],
  },
  {
    q: 'Lowering `(a + b) * c` children first, which instruction comes first?',
    options: [
      { t: '`t1 = t2 * c`', why: 'The product can’t be written until the sum has a name.' },
      { t: '`t1 = b * c`', why: 'The tree multiplies the sum by c; b * c isn’t computed at all.' },
      { t: '`t1 = a + b`', correct: true, why: 'The left child, the sum, is lowered first; then `t2 = t1 * c`.' },
      { t: 'It depends on the values of a, b and c', why: 'Lowering happens before the program runs; values don’t matter.' },
    ],
  },
  {
    q: 'In VIR, `function f(a) { let t = a; return t + 1; }` lowers to what, besides the param and the return?',
    options: [
      { t: '`%1 = copy %0`, `%2 = const 1`, `%3 = binop + %1, %2`', why: 'There is no copy: `let t = a` emits nothing, and `t` means `%0`.' },
      { t: '`%1 = const 1`, `%2 = binop + %0, %1`', correct: true, why: 'The read of `t` uses `%0` directly, and the literal 1 is its own `const` instruction.' },
      { t: '`%1 = binop + %0, 1`', why: 'VIR’s arguments are always value ids; the literal needs its own `const` instruction.' },
      { t: '`store t, %0`, then `%1 = load t`', why: 'Only captured or module-level variables become bindings. A plain local is only a name for a value.' },
    ],
  },
  {
    q: 'What is a temporary?',
    options: [
      { t: 'A variable the programmer declared with `let`', why: 'Those may vanish entirely; temporaries are the names the compiler makes.' },
      { t: 'A value that is deleted after one instruction', why: 'A temporary can be used any number of times, like %0 in a + b and a - c.' },
      { t: 'A machine register', why: 'Mapping temporaries to registers is a much later decision, and there are usually more temporaries than registers.' },
      { t: 'A compiler-made name for the result of one instruction', correct: true, why: 'It exists so every intermediate value can be pointed at.' },
    ],
  },
  {
    q: 'Why is “who uses value %3?” easy to answer in VIR but hard in stack bytecode?',
    options: [
      { t: 'VIR instructions name their inputs, so one pass can index users by name', correct: true, why: 'That is `buildUses`. Stack inputs are “the top of the stack”, which you’d have to simulate.' },
      { t: 'VIR has fewer instructions', why: 'Fewer instructions help a little, but the real difference is that inputs are named.' },
      { t: 'Stack bytecode has no values', why: 'It has plenty; they have no names.' },
      { t: 'VIR runs faster', why: 'Speed of running is unrelated to answering questions about the code.' },
    ],
  },
  {
    q: 'How many instructions does Drip’s stack VM need for `(a + b) * (a - c)` with locals, against VIR’s three?',
    options: [
      { t: 'Three', why: 'The stack VM also needs an instruction to load each operand.' },
      { t: 'Four', why: 'There are four variable reads plus three operators.' },
      { t: 'Seven: four loads and three operators', correct: true, why: 'Every operand must be pushed before an operator can use it. VIR names the operands instead.' },
      { t: 'Ten', why: 'No extra instructions are needed beyond the loads and operators.' },
    ],
  },
];
