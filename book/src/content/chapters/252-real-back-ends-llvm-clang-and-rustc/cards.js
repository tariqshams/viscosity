// Chapter 247 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'ir-forms': {
    q: 'In what three equivalent forms does LLVM IR exist?',
    a: 'An in-memory data structure, on-disk bitcode, and human-readable text.',
  },
  'percent-at': {
    q: 'In LLVM IR, what is the difference between `%add` and `@sumsq`?',
    a: '`%` names a local value (or type); `@` names a global, such as a function or global variable.',
  },
  'nsw-what': {
    q: 'What does the `nsw` in `add nsw i64 %a, %b` promise?',
    a: '“No signed wrap”: the signed addition does not overflow, which later passes may rely on.',
  },
  'alloca-why': {
    q: 'Why is clang’s -O0 IR full of `alloca`, `load` and `store`?',
    a: 'The front end gives every variable a stack slot because it is simple and correct; building SSA is left to the optimiser (SROA, mem2reg).',
  },
  'pass-what': {
    q: 'What does an LLVM function pass’s `run` method return?',
    a: 'A PreservedAnalyses: which cached analyses are still valid after the pass, so the pass manager knows what to recompute.',
  },
  preserved: {
    q: 'Why must a pass report which analyses it preserved?',
    a: 'Analyses such as the dominator tree are cached; if the pass changed what they describe, they must be recomputed before anyone uses them again.',
  },
  'o2-list': {
    q: 'What is `-O2`, in terms of passes?',
    a: 'A fixed, ordered pipeline of passes (built by PassBuilder::buildPerModuleDefaultPipeline).',
  },
  'indvars-did': {
    q: 'What did `indvars` and `loop-deletion` do to sumsq at -O2?',
    a: 'indvars computed the loop’s final value of s as a formula before the loop, leaving the loop unused; loop-deletion removed it.',
  },
  'magic-constant': {
    q: 'Why can LLVM multiply by 6148914691236517206 instead of dividing by 3?',
    a: '3 × 6148914691236517206 = 2⁶⁴ + 2, so in wrapping 64-bit arithmetic it multiplies a multiple of 3 by exactly two-thirds.',
  },
};

export const examples = {};

export const exercises = {
  'fold-pass': {
    title: 'A constant-folding pass',
    prompt: 'Write `fold(insts)`, a function pass over straight-line code in a tiny LLVM-like IR. Each instruction is `[name, op, type, ...operands]`, where an operand is a number (a constant) or a string such as `\'%x\'` (a value). For `add`, `sub` and `mul` on `i32` whose operands are all constants (after earlier folding), compute the result **as a 32-bit integer that wraps**, drop the instruction, and use the number wherever its name appears later. Keep every other instruction, with any known constants put in. Return `{ insts, changed }`, where `changed` says whether anything was folded.',
    starter: `const OPS = {
  add: (a, b) => a + b,
  sub: (a, b) => a - b,
  mul: (a, b) => a * b,
};

function fold(insts) {
  // your pass here
  return { insts, changed: false };
}

console.log(fold([
  ['%a', 'add', 'i32', 2, 3],
  [null, 'ret', 'i32', '%a'],
]).insts);`,
    solution: `const OPS = {
  add: (a, b) => (a + b) | 0,
  sub: (a, b) => (a - b) | 0,
  mul: (a, b) => Math.imul(a, b),
};

function fold(insts) {
  const known = new Map();
  const val = (x) =>
    known.has(x) ? known.get(x) : x;
  const out = [];
  for (const [name, op, ty, ...args]
       of insts) {
    const as = args.map(val);
    const allNum = as.every(
      (a) => typeof a === 'number');
    if (op in OPS && allNum) {
      known.set(name,
        OPS[op](as[0], as[1]));
      continue;
    }
    out.push([name, op, ty, ...as]);
  }
  const changed =
    out.length < insts.length;
  return { insts: out, changed };
}`,
    tests: `const ret = (x) => [null, 'ret', 'i32', x];
test('add 2, 3 folds to 5', () => {
  const r = fold([
    ['%a', 'add', 'i32', 2, 3],
    ret('%a')]);
  expect(r.insts).toEqual([ret(5)]);
  expect(r.changed).toBe(true);
});
test('a chain folds all the way', () => {
  const r = fold([
    ['%a', 'mul', 'i32', 2, 3],
    ['%b', 'add', 'i32', '%a', 1],
    ['%c', 'sub', 'i32', '%b', 10],
    ret('%c')]);
  expect(r.insts).toEqual([ret(-3)]);
});
test('a parameter stops folding', () => {
  const code = [
    ['%b', 'add', 'i32', '%x', 1],
    ret('%b')];
  const r = fold(code);
  expect(r.insts).toEqual(code);
  expect(r.changed).toBe(false);
});
test('constants flow into a use', () => {
  const r = fold([
    ['%a', 'add', 'i32', 2, 3],
    ['%b', 'mul', 'i32', '%x', '%a'],
    ret('%b')]);
  expect(r.insts).toEqual([
    ['%b', 'mul', 'i32', '%x', 5],
    ret('%b')]);
});
test('i32 add wraps', () => {
  const r = fold([
    ['%a', 'add', 'i32', 2147483647, 1],
    ret('%a')]);
  expect(r.insts)
    .toEqual([ret(-2147483648)]);
});
test('i32 mul wraps too', () => {
  const r = fold([
    ['%a', 'mul', 'i32', 65536, 65536],
    ret('%a')]);
  expect(r.insts).toEqual([ret(0)]);
});`,
    hints: [
      'Walk the instructions in order (in SSA every value is defined before it is used, and this code has no branches). Keep a Map from names you have folded to their numbers.',
      'For each instruction, first replace any operand you already know with its number. Then, if the operation is add, sub or mul and every operand is now a number, record the result under the instruction\'s name and leave the instruction out; otherwise keep it, with the replaced operands.',
      'The type is i32, so results must wrap: `(a + b) | 0` and `(a - b) | 0` keep 32 bits, and `Math.imul(a, b)` multiplies as 32-bit integers (a plain `*` loses the low bits once the product passes 2⁵³).',
    ],
    walkthrough: `**How to think about it.** A pass is a function from IR to IR that also reports what it did. This one is constant folding (chapter 92), done the way an LLVM pass would on straight-line SSA code: because every value is defined exactly once and before its uses, a single walk from top to bottom is enough. For each instruction, put in any constants already discovered; if all of its operands are now constants, the instruction can be computed now, at compile time, and removed. The one trap is the type. The IR says \`i32\`, so the answer must be what a 32-bit machine would compute, wrapping on overflow, not what JavaScript's 64-bit floats compute; this is exactly why LLVM IR carries a type on every instruction.

**The solution, line by line.**

- \`add: (a, b) => (a + b) | 0\` adds and then \`| 0\` keeps the low 32 bits as a signed number, so 2147483647 + 1 becomes -2147483648. \`sub\` is the same.
- \`mul: (a, b) => Math.imul(a, b)\` multiplies as 32-bit integers; 65536 × 65536 is 2³², whose low 32 bits are 0.
- \`const known = new Map();\` remembers the value of every instruction folded so far.
- \`const val = (x) => known.has(x) ? known.get(x) : x;\` turns an operand into its constant if we know one, and leaves it alone otherwise (a parameter such as \`%x\`, or a number already).
- \`for (const [name, op, ty, ...args] of insts) {\` takes each instruction apart.
- \`const as = args.map(val);\` substitutes known constants into the operands.
- \`const allNum = as.every((a) => typeof a === 'number');\` checks whether everything is now known.
- \`if (op in OPS && allNum) { known.set(name, OPS[op](as[0], as[1])); continue; }\` folds: compute, remember, and do not copy the instruction to the output. \`ret\` is not in \`OPS\`, so it is never folded, only rewritten.
- \`out.push([name, op, ty, ...as]);\` keeps any other instruction, with its operands rewritten.
- \`return { insts: out, changed: out.length < insts.length };\` reports the new code and whether anything was removed, the small cousin of LLVM's PreservedAnalyses.

**Common wrong attempts.**

- Plain \`a + b\` and \`a * b\` give 2147483648 and 4294967296 for the overflow tests: correct mathematics, wrong \`i32\`.
- Folding an instruction but forgetting to substitute its value later leaves a use of \`%a\` whose definition has been deleted, which LLVM's verifier would reject as IR that is not well formed.
- Substituting constants but returning the original \`insts\` loses the work; a pass must return the IR it built.`,
    wrong: [
      {
        code: `const OPS = {
  add: (a, b) => a + b,
  sub: (a, b) => a - b,
  mul: (a, b) => a * b,
};

function fold(insts) {
  const known = new Map();
  const val = (x) =>
    known.has(x) ? known.get(x) : x;
  const out = [];
  for (const [name, op, ty, ...args]
       of insts) {
    const as = args.map(val);
    const allNum = as.every(
      (a) => typeof a === 'number');
    if (op in OPS && allNum) {
      known.set(name,
        OPS[op](as[0], as[1]));
      continue;
    }
    out.push([name, op, ty, ...as]);
  }
  const changed =
    out.length < insts.length;
  return { insts: out, changed };
}`,
        why: 'The arithmetic ignores the i32 type, so 2147483647 + 1 folds to 2147483648 instead of wrapping to -2147483648.',
      },
      {
        code: `const OPS = {
  add: (a, b) => (a + b) | 0,
  sub: (a, b) => (a - b) | 0,
  mul: (a, b) => Math.imul(a, b),
};

function fold(insts) {
  const out = [];
  let changed = false;
  for (const [name, op, ty, ...args]
       of insts) {
    const allNum = args.every(
      (a) => typeof a === 'number');
    if (op in OPS && allNum) {
      changed = true;
      continue;
    }
    out.push([name, op, ty, ...args]);
  }
  return { insts: out, changed };
}`,
        why: 'It deletes foldable instructions but never puts their values into later uses, so `ret %a` refers to a value that no longer exists.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Which line is LLVM IR for "s plus the square", as clang writes it?',
    options: [
      {
        t: '`add t0, t0, t2`',
        why: 'That is RISC-V assembly: registers, no types.',
      },
      {
        t: '`%add = add nsw i64 %s.0, %mul`',
        correct: true,
        why: 'Right: a named SSA result, the opcode, a flag, the type and two typed operands.',
      },
      {
        t: '`_10 = AddWithOverflow(copy _2, copy _6)`',
        why: 'That is Rust’s MIR, one level above LLVM IR (the next chapter).',
      },
    ],
  },
  {
    q: 'Why does clang’s -O0 IR load `%i` from memory every time it is used?',
    options: [
      {
        t: 'Because i might be changed by another thread.',
        why: 'Nothing here is shared; it is how the front end lowers variables.',
      },
      {
        t: 'Because LLVM IR cannot hold values in SSA form.',
        why: 'It can and does; SSA is its native form.',
      },
      {
        t: 'Because the front end gives each variable a stack slot and leaves building SSA to the optimiser.',
        correct: true,
        why: 'Right: SROA or mem2reg later turns the slots into SSA values with phis.',
      },
    ],
  },
  {
    q: '`%x = add i32 1, %x` parses. Why is it not well-formed LLVM IR?',
    options: [
      {
        t: 'Its definition does not dominate its use: %x is used by the very instruction that defines it.',
        correct: true,
        why: 'Right: in SSA every use must be dominated by the definition; the verifier rejects this.',
      },
      {
        t: 'add needs nsw.',
        why: 'Flags are optional.',
      },
      {
        t: 'Constants must come second.',
        why: 'Operand order is free in the syntax (instcombine likes constants on the right, but that is a canonical form, not a rule).',
      },
    ],
  },
  {
    q: 'What is `-O2` in LLVM?',
    options: [
      {
        t: 'A single pass that does all optimisation.',
        why: 'There is no such pass; -O2 is made of many.',
      },
      {
        t: 'A flag that makes every pass work twice as hard.',
        why: 'It selects a pipeline; it does not change how passes work.',
      },
      {
        t: 'A fixed, ordered pipeline of passes.',
        correct: true,
        why: 'Right: built by PassBuilder; opt -print-pipeline-passes prints it.',
      },
    ],
  },
  {
    q: 'After -O2, sumsq has no loop. Which passes did that?',
    options: [
      {
        t: 'sroa and mem2reg.',
        why: 'They built SSA from the stack slots; the loop was still there afterwards.',
      },
      {
        t: 'indvars, which computed the final value of s before the loop, and loop-deletion, which removed the unused loop.',
        correct: true,
        why: 'Right: the -print-changed output shows both.',
      },
      {
        t: 'The register allocator.',
        why: 'That runs much later, in the code generator, on machine instructions.',
      },
    ],
  },
  {
    q: 'A pass returns PreservedAnalyses saying it preserved nothing. What follows?',
    options: [
      {
        t: 'The pass manager throws away its cached analyses for that IR and recomputes them when they are next asked for.',
        correct: true,
        why: 'Right: this is chapter 224’s invalidation, in LLVM’s pass manager.',
      },
      {
        t: 'The pass’s changes are undone.',
        why: 'Preserved analyses say nothing about undoing; the changes stay.',
      },
      {
        t: 'No later pass may run.',
        why: 'Later passes run as usual, with fresh analyses.',
      },
    ],
  },
];
