// Chapter 248 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'codegen-stages': {
    q: 'Name the main stages of LLVM’s code generator, in order.',
    a: 'Instruction selection, scheduling, SSA machine-code optimisations, register allocation, prologue/epilogue insertion, late optimisations, code emission.',
  },
  'mir-what': {
    q: 'What is LLVM’s Machine IR (MIR) right after instruction selection?',
    a: 'The target’s own instructions over virtual registers, still in SSA form with PHIs; physical registers only where the ABI demands.',
  },
  'dag-vs-gisel': {
    q: 'What is the main difference between SelectionDAG and GlobalISel?',
    a: 'SelectionDAG builds a separate DAG for one basic block at a time; GlobalISel works on the whole function, directly in (generic) MIR.',
  },
  'greedy-default': {
    q: 'Which register allocator does LLVM use by default, and which in debug builds?',
    a: 'Greedy (with live-range splitting) by default; fast in debug builds.',
  },
  'fast-spills': {
    q: 'Why is the loop full of loads and stores under `-regalloc=fast`?',
    a: 'The fast allocator works one block at a time, so values that live across blocks are spilled at block ends and reloaded.',
  },
  'clang-sema': {
    q: 'In clang, what does Sema do?',
    a: 'Semantic analysis: the parser hands it each construct, and for valid programs it checks it and builds the AST.',
  },
  'rustc-irs': {
    q: 'Through which representations does rustc lower a program before LLVM IR?',
    a: 'AST, then HIR (desugared), then THIR (fully typed), then MIR (a CFG, used for borrow checking).',
  },
  'mir-overflow': {
    q: 'Why does the debug MIR for `s += i * i` contain `MulWithOverflow` and `assert`?',
    a: 'Rust’s integer operators panic on overflow in debug builds, so every * and + is checked.',
  },
  'cranelift-why': {
    q: 'Why does rustc have a Cranelift back end?',
    a: 'To compile faster in debug mode than LLVM does.',
  },
};

export const examples = {};

export const exercises = {
  'tour-pipeline': {
    title: 'Plan a compile, the way clang’s driver does',
    prompt: 'clang’s driver turns a command line into a list of numbered actions, which `-ccc-print-phases` prints. Write `phases(files, flag)` that returns the same lines. A `.c` file goes through `input`, `preprocessor` (output `cpp-output`), `compiler` (`ir`), `backend` (`assembler`) and `assembler` (`object`); a `.s` file goes through `input` and `assembler`. Each action names the number of the action it reads, as `{3}`. With no flag, one `linker` action reads every object, as `{4, 6}`, and makes an `image`; `-c` stops at objects, and `-S` (for `.c` files) stops after `backend`. The tests are clang 18’s real output for `--target=riscv64`.',
    starter: `function phases(files, flag = '') {
  const out = [];
  for (const f of files) {
    out.push(\`\${out.length}: input, \` +
      \`"\${f}", c\`);
  }
  return out;
}

console.log(phases(['t.c', 't.s']));`,
    solution: `function phases(files, flag = '') {
  const out = [], objs = [];
  const add = (s) =>
    out.push(\`\${out.length}: \${s}\`) - 1;
  for (const f of files) {
    const c = f.endsWith('.c');
    let k = add(\`input, "\${f}", \` +
      (c ? 'c' : 'assembler'));
    if (c) {
      k = add(\`preprocessor, {\${k}}, \` +
        'cpp-output');
      k = add(\`compiler, {\${k}}, ir\`);
      k = add(\`backend, {\${k}}, \` +
        'assembler');
      if (flag === '-S') continue;
    }
    objs.push(add(
      \`assembler, {\${k}}, object\`));
  }
  if (flag === '')
    add(\`linker, {\${objs.join(', ')}}\` +
      ', image');
  return out;
}`,
    tests: `test('one C file, linked', () => {
  expect(phases(['t.c'])).toEqual([
    '0: input, "t.c", c',
    '1: preprocessor, {0}, cpp-output',
    '2: compiler, {1}, ir',
    '3: backend, {2}, assembler',
    '4: assembler, {3}, object',
    '5: linker, {4}, image',
  ]);
});
test('C and assembly together', () => {
  expect(phases(['t.c', 't.s'])).toEqual([
    '0: input, "t.c", c',
    '1: preprocessor, {0}, cpp-output',
    '2: compiler, {1}, ir',
    '3: backend, {2}, assembler',
    '4: assembler, {3}, object',
    '5: input, "t.s", assembler',
    '6: assembler, {5}, object',
    '7: linker, {4, 6}, image',
  ]);
});
test('-c stops before linking', () => {
  const p = phases(['t.c', 't.s'], '-c');
  expect(p.length).toBe(7);
  expect(p[6])
    .toBe('6: assembler, {5}, object');
});
test('-S stops at assembly', () => {
  expect(phases(['t.c'], '-S')).toEqual([
    '0: input, "t.c", c',
    '1: preprocessor, {0}, cpp-output',
    '2: compiler, {1}, ir',
    '3: backend, {2}, assembler',
  ]);
});`,
    hints: [
      'Think of it as building a list where each new action remembers the number of the one before it. What is the number of the action you just added?',
      'A helper `add(text)` that pushes `"<n>: <text>"` and returns n keeps it tidy: `out.push(...)` returns the new length, so the index is one less. Keep the numbers of the object actions in a second list for the linker.',
      'For each file: `let k = add(input ...)`; if it is C, `k = add(preprocessor {k})`, then compiler, then backend, and `continue` if the flag is `-S`; then `objs.push(add(assembler {k}))`. After the loop, if there is no flag, add the linker with `objs.join(\', \')`.',
    ],
    walkthrough: `**How to think about it.** A driver is the part of a compiler that knows the whole pipeline but does none of the work: it plans which tools run on which inputs, in which order, and then runs them. The plan is a graph of actions, each reading the output of an earlier one, and clang prints it numbered in the order the actions were created. So the program is: for each input file, create its chain of actions, each one pointing at the previous; remember where each chain ends in an object; and, if we are linking, finish with one action that reads all of those.

**The solution, line by line.**

- \`const out = [], objs = [];\` holds the printed lines, and the numbers of the actions that produce object files.
- \`const add = (s) => ...\` pushes a line that starts with its own position, \`out.length\`, and returns that number; \`push\` returns the new length, which is one more than the index, hence the \`- 1\`.
- \`const c = f.endsWith('.c');\` tells C sources from assembly files.
- \`let k = add(...)\` adds the \`input\` action, whose type is \`c\` or \`assembler\`, and keeps its number in \`k\`.
- For C, three more actions follow, each reading the one before: \`preprocessor\` (producing \`cpp-output\`), \`compiler\` (\`ir\`, the LLVM IR of the last chapter) and \`backend\` (\`assembler\`, the work of LLVM's code generator); \`k\` moves along the chain each time.
- \`if (flag === '-S') continue;\` stops this file's chain at assembly text, which is what \`-S\` asks for.
- \`objs.push(add(...))\` adds the \`assembler\` action, reading whatever the chain ended with (the backend's output, or the \`.s\` input itself), and records the object's number.
- \`if (flag === '') add(...)\` adds the single \`linker\` action reading every object, joined as \`{4, 6}\`, producing an \`image\`, the executable.

**Common wrong attempts.**

- Numbering each file's actions from 0 again: clang numbers them across the whole command line, so the second file's input is 5, not 0.
- Giving the linker only the last object: it must read every object, in order, or the program would be missing the other files' code.
- Sending \`.s\` files through the preprocessor and compiler: assembly needs only the assembler, so its chain is two actions long.`,
    wrong: [
      {
        code: `function phases(files, flag = '') {
  const out = [], objs = [];
  const add = (s) =>
    out.push(\`\${out.length}: \${s}\`) - 1;
  for (const f of files) {
    let k = add(\`input, "\${f}", c\`);
    k = add(\`preprocessor, {\${k}}, \` +
      'cpp-output');
    k = add(\`compiler, {\${k}}, ir\`);
    k = add(\`backend, {\${k}}, \` +
      'assembler');
    if (flag === '-S') continue;
    objs.push(add(
      \`assembler, {\${k}}, object\`));
  }
  if (flag === '')
    add(\`linker, {\${objs.join(', ')}}\` +
      ', image');
  return out;
}`,
        why: 'It treats the `.s` file as C, sending assembly through the preprocessor and compiler; clang only assembles it.',
      },
      {
        code: `function phases(files, flag = '') {
  const out = [];
  let last = 0;
  const add = (s) =>
    out.push(\`\${out.length}: \${s}\`) - 1;
  for (const f of files) {
    const c = f.endsWith('.c');
    let k = add(\`input, "\${f}", \` +
      (c ? 'c' : 'assembler'));
    if (c) {
      k = add(\`preprocessor, {\${k}}, \` +
        'cpp-output');
      k = add(\`compiler, {\${k}}, ir\`);
      k = add(\`backend, {\${k}}, \` +
        'assembler');
      if (flag === '-S') continue;
    }
    last = add(
      \`assembler, {\${k}}, object\`);
  }
  if (flag === '')
    add(\`linker, {\${last}}, image\`);
  return out;
}`,
        why: 'The linker reads only the last object (`{6}`), so the C file’s code would be left out of the program.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'At what point in LLVM’s code generator do virtual registers disappear?',
    options: [
      {
        t: 'During instruction selection.',
        why: 'Selection produces MIR over virtual registers; it does not choose real ones.',
      },
      {
        t: 'During register allocation (and the rewriter that follows it).',
        correct: true,
        why: 'Right: until then the code uses virtual registers, in SSA form at first.',
      },
      {
        t: 'During code emission.',
        why: 'By then every register is physical; emission only prints or encodes the instructions.',
      },
    ],
  },
  {
    q: 'Which statement about GlobalISel is true?',
    options: [
      {
        t: 'It works on the whole function, directly in MIR, through IRTranslator, Legalizer, RegBankSelect and InstructionSelect.',
        correct: true,
        why: 'Right: that is its documented design, meant to replace SelectionDAG and FastISel.',
      },
      {
        t: 'It produces worse code than SelectionDAG for every loop.',
        why: 'For sumsq on RISC-V in LLVM 18 it produced exactly the same assembly.',
      },
      {
        t: 'It builds a DAG for each basic block.',
        why: 'That is SelectionDAG; GlobalISel avoids the separate DAG representation.',
      },
    ],
  },
  {
    q: 'Why is the `-regalloc=fast` loop full of `ld` and `sd`?',
    options: [
      {
        t: 'RISC-V has too few registers for this loop.',
        why: 'Greedy fits the same loop into four registers with no memory traffic.',
      },
      {
        t: 'The fast allocator works block by block, so values that cross blocks are kept in stack slots between them.',
        correct: true,
        why: 'Right: fast compiles quickly, for debug builds, at the cost of spill code.',
      },
      {
        t: 'Loads and stores are faster than register moves.',
        why: 'They are slower; that is why greedy avoids them.',
      },
    ],
  },
  {
    q: 'In clang, which library turns the checked AST into LLVM IR?',
    options: [
      {
        t: 'Sema',
        why: 'Sema checks constructs and builds the AST; it does not produce IR.',
      },
      {
        t: 'The driver',
        why: 'The driver plans which tools to run; it does not compile.',
      },
      {
        t: 'CodeGen',
        correct: true,
        why: 'Right: “CodeGen takes an AST as input and produces LLVM IR code from it.”',
      },
    ],
  },
  {
    q: 'Where does rustc do borrow checking?',
    options: [
      {
        t: 'On MIR, its control-flow-graph IR.',
        correct: true,
        why: 'Right: MIR is a CFG of basic blocks, used for borrow checking and other dataflow checks.',
      },
      {
        t: 'On LLVM IR.',
        why: 'LLVM knows nothing of Rust’s borrowing rules.',
      },
      {
        t: 'On the tokens, before parsing.',
        why: 'Borrow checking needs types and control flow, which tokens do not have.',
      },
    ],
  },
  {
    q: 'What is rustc’s Cranelift back end for?',
    options: [
      {
        t: 'Producing faster programs than LLVM does.',
        why: 'Its stated aim is faster compiling, not faster code.',
      },
      {
        t: 'Compiling Rust to JavaScript.',
        why: 'Cranelift generates machine code.',
      },
      {
        t: 'Making debug builds compile faster, as an alternative to LLVM.',
        correct: true,
        why: 'Right: “This has the potential to improve compilation times in debug mode.”',
      },
    ],
  },
];
