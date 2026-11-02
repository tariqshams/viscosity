// Chapter 162 cards. Keys are stable ids: never rename them.

export const prompts = {
  'vm-result': {
    q: 'In the companion’s 2026-11-02 benchmark run, how did the bytecode VM compare with the tree-walker?',
    a: 'At best 1.3 times faster (`method_calls`), and slower on four programs: `fields`, `instantiation`, `strings` and `trees`.',
  },
  'why-jit': {
    q: 'Why doesn’t the usual argument for bytecode (no pointer chasing, cheap dispatch) give a big win here?',
    a: 'Both engines are JavaScript run by V8, which compiles the tree-walker’s hot code to machine code just as it does the VM’s loop.',
  },
  'per-instruction': {
    q: 'Roughly how long does one VM instruction take in the companion, and where does most of that time go?',
    a: 'About 20 nanoseconds; most of it is the loop around the work (counting, reading the opcode, choosing the case, reaching the stack through the VM object).',
  },
  'rebuilt': {
    q: 'Which two things does the VM build for itself in JavaScript that the tree-walker gets from V8?',
    a: 'Hash tables (its own `Table` instead of V8’s built-in `Map`) and garbage collection (its own collector, on top of V8’s).',
  },
  'poison-cost': {
    q: 'Why was poisoning freed objects so expensive?',
    a: 'Deleting every property of a dead object pushes it into V8’s slow dictionary properties, and allocation-heavy programs free hundreds of thousands of objects.',
  },
  'measure-first': {
    q: 'What found the VM’s biggest slowdown: a guess or a measurement?',
    a: 'A profile. Nobody would have guessed that a debugging safety net was the bottleneck.',
  },
  'dispatch-cost': {
    q: 'What does a superinstruction save each time it runs?',
    a: 'The extra trips round the dispatch loop of the instructions it replaces (k − 1 of them for a sequence of k), and the pushes and pops between them.',
  },
  'super-jump': {
    q: 'Why must no jump land inside a fused superinstruction?',
    a: 'The middle instructions no longer exist as separate opcodes, so there is nothing valid to land on.',
  },
  'inc-local': {
    q: 'Which five instructions does `inc.local s` replace?',
    a: '`load.local s`, `const 1`, `add`, `store.local s`, `pop`.',
  },
  'invoke-fused': {
    q: 'In what sense is `invoke` a superinstruction?',
    a: 'It does the work of `get.prop` followed by `call` in one instruction, and skips the bound method as well.',
  },
};

export const examples = {
  'time-loop': {
    title: 'Time a loop on your own device',
    lang: 'drip-vm',
    code: `let t = clock();
let s = 0;
for i in 0..300000 {
  s += i;
}
print s;
print clock() - t;`,
  },
};

export const exercises = {
  fusePairs: {
    title: 'Fuse inc.local',
    prompt:
      'Instructions are objects like `{ op: \'load.local\', a: 1 }`, `{ op: \'const\', v: 1 }`, `{ op: \'add\' }`, `{ op: \'store.local\', a: 1 }` and `{ op: \'pop\' }`. Write `fuse(code, targets)`: return a **new** array in which every run of `load.local s`, `const 1`, `add`, `store.local s`, `pop` (the same slot `s` both times, and the constant exactly 1) becomes `{ op: \'inc.local\', a: s }` followed by four `{ op: \'nop\' }`, so positions do not move. Do not fuse a run if a jump lands on any of its last four positions (`targets` is a `Set` of indexes). Do not change `code`.',
    starter: `function fuse(code, targets) {
  const out = code.slice();
  // find and fuse the five-step runs
  return out;
}`,
    solution: `function fuse(code, targets) {
  const out = code.slice();
  const n = out.length;
  for (let i = 0; i + 4 < n; i++) {
    const [a, b, c, d, e] =
      out.slice(i, i + 5);
    const hit =
      a.op === 'load.local' &&
      b.op === 'const' && b.v === 1 &&
      c.op === 'add' &&
      d.op === 'store.local' &&
      d.a === a.a && e.op === 'pop';
    let inside = false;
    for (let j = 1; j <= 4; j++) {
      if (targets.has(i + j)) {
        inside = true;
      }
    }
    if (hit && !inside) {
      out[i] = {
        op: 'inc.local', a: a.a,
      };
      for (let j = 1; j <= 4; j++) {
        out[i + j] = { op: 'nop' };
      }
      i += 4;
    }
  }
  return out;
}`,
    tests: `const L = (a) => ({ op: 'load.local', a });
const S = (a) => ({ op: 'store.local', a });
const K = (v) => ({ op: 'const', v });
const ADD = { op: 'add' };
const POP = { op: 'pop' };
const NOP = { op: 'nop' };
const run = (s) => [L(s), K(1), ADD, S(s), POP];
test('the run is fused', () => {
  expect(fuse(run(3), new Set())).toEqual([
    { op: 'inc.local', a: 3 },
    NOP, NOP, NOP, NOP,
  ]);
});
test('other code is kept', () => {
  const code = [L(1), ...run(2), POP];
  const out = fuse(code, new Set());
  expect(out[0]).toEqual(L(1));
  expect(out[1]).toEqual({ op: 'inc.local', a: 2 });
  expect(out[6]).toEqual(POP);
});
test('different slots: no fusing', () => {
  const code = [L(1), K(1), ADD, S(2), POP];
  expect(fuse(code, new Set())).toEqual(code);
});
test('adding 2: no fusing', () => {
  const code = [L(1), K(2), ADD, S(1), POP];
  expect(fuse(code, new Set())).toEqual(code);
});
test('a jump into the run: no fusing', () => {
  const code = run(1);
  expect(fuse(code, new Set([2])))
    .toEqual(code);
});
test('a jump to its start is fine', () => {
  const out = fuse(run(1), new Set([0]));
  expect(out[0].op).toBe('inc.local');
});
test('the input is not changed', () => {
  const code = run(1);
  fuse(code, new Set());
  expect(code[0]).toEqual(L(1));
});`,
    hints: [
      'Look at five instructions at a time, starting at each index `i` where five still fit. What must be true of all five for this to be the counter step?',
      'The test is: `load.local`, then `const` with `v === 1`, then `add`, then `store.local` with the same slot `a` as the load, then `pop`. Separately, check that none of `i + 1` to `i + 4` is in `targets`.',
      'When both hold, write `{ op: \'inc.local\', a: a.a }` at `i` and `{ op: \'nop\' }` at `i + 1` to `i + 4`, then `i += 4` to skip what you just wrote. Work on `out = code.slice()`.',
    ],
    walkthrough: `**How to think about it.** A peephole pass looks at the code through a small window and rewrites any window that matches a pattern. Here the window is five instructions wide, and the pattern is the counter step the companion's compiler would otherwise emit for every \`for\` loop. Two rules keep it safe: the five must really mean "add one to slot s" (same slot, constant exactly 1), and no jump may land in the middle, because after fusing there is no middle. Replacing the four tail instructions with \`nop\` keeps every index where it was, so no jump offset has to change.

**The solution, line by line.**

- \`const out = code.slice();\` copies the array, so the caller's code is untouched (the last test). The new instruction objects we write are new too.
- \`for (let i = 0; i + 4 < n; i++) {\` visits every start position where a whole window fits.
- \`const [a, b, c, d, e] = out.slice(i, i + 5);\` names the five instructions in the window.
- \`const hit = ...\` is the pattern: \`a\` loads a slot, \`b\` is the constant 1, \`c\` adds, \`d\` stores to *the same* slot (\`d.a === a.a\`), and \`e\` pops the leftover value. The third and fourth tests check the slot and the constant.
- The \`inside\` loop checks positions \`i + 1\` to \`i + 4\`. A jump to \`i\` itself is fine: it will land on \`inc.local\`, which does the whole step (the sixth test). A jump to \`i + 2\`, say, expected to find \`add\` with two values on the stack; after fusing it would find a \`nop\`, so that window is left alone (the fifth test).
- \`out[i] = { op: 'inc.local', a: a.a };\` writes the superinstruction, with the slot as its operand.
- The second loop writes four \`nop\`s, keeping the positions.
- \`i += 4;\` skips the \`nop\`s (the loop's own \`i++\` then moves past the last one), so a fused run is never looked at again.

**Common wrong attempts.**

- Forgetting \`d.a === a.a\` fuses \`load.local 1 ... store.local 2\`, which copies slot 1 plus one into slot 2; \`inc.local 1\` would change slot 1 instead.
- Ignoring \`targets\` is right on straight-line code and wrong the moment a loop or an \`if\` jumps into the run.
- Writing into \`code\` instead of a copy passes the first tests but changes the caller's array.`,
    wrong: [
      {
        code: `function fuse(code, targets) {
  const out = code.slice();
  const n = out.length;
  for (let i = 0; i + 4 < n; i++) {
    const [a, b, c, d, e] =
      out.slice(i, i + 5);
    const hit =
      a.op === 'load.local' &&
      b.op === 'const' && b.v === 1 &&
      c.op === 'add' &&
      d.op === 'store.local' &&
      e.op === 'pop';
    if (hit) {
      out[i] = {
        op: 'inc.local', a: a.a,
      };
      for (let j = 1; j <= 4; j++) {
        out[i + j] = { op: 'nop' };
      }
      i += 4;
    }
  }
  return out;
}`,
        why: 'It neither checks that the load and the store use the same slot nor looks at `targets`, so it fuses code that means something else, and code a jump lands inside.',
      },
    ],
  },
  countPairs: {
    optional: true,
    title: 'The most common pair',
    prompt:
      'To find superinstruction candidates, count which instructions run next to each other. `trace` is an array of opcode names in the order they ran. Write `topPair(trace)`: return the most common adjacent pair as the string `"first second"`, or `null` if there are fewer than two instructions. On a tie, return the pair that reached the top count first.',
    starter: `function topPair(trace) {
  // count adjacent pairs
  return null;
}`,
    solution: `function topPair(trace) {
  const counts = new Map();
  let best = null;
  let most = 0;
  const t = trace;
  for (let i = 1; i < t.length; i++) {
    const k = t[i - 1] + ' ' + t[i];
    const n = (counts.get(k) ?? 0) + 1;
    counts.set(k, n);
    if (n > most) {
      most = n;
      best = k;
    }
  }
  return best;
}`,
    tests: `test('a simple trace', () => {
  const t = ['load.local', 'const', 'add',
    'load.local', 'const', 'sub'];
  expect(topPair(t)).toBe('load.local const');
});
test('too short', () => {
  expect(topPair(['add'])).toBe(null);
  expect(topPair([])).toBe(null);
});
test('a tie goes to the first to lead', () => {
  const t = ['a', 'b', 'c', 'a', 'b', 'c'];
  expect(topPair(t)).toBe('a b');
});
test('a loop', () => {
  const pass = ['lt', 'jump.unless', 'inc.local',
    'loop'];
  const t = [...pass, ...pass, ...pass];
  expect(topPair(t)).toBe('lt jump.unless');
});`,
    hints: [
      'Every instruction after the first forms a pair with the one before it. Loop from index 1.',
      'Keep a `Map` from the pair string to its count, and update it as you go.',
      'Track the best so far: only replace it when a count goes *above* the current best (`>`), which is what makes ties go to the first.',
    ],
    walkthrough: `**How to think about it.** This is how the candidates for a superinstruction are found in practice: add a counter to a copy of the dispatch loop, run real programs, and see which pairs come up most. Each position after the first makes one pair with its predecessor, so one pass with a \`Map\` of counts is enough; and if we keep the leader as we go, we never need a second pass to find it.

**The solution, line by line.**

- \`const counts = new Map();\` maps \`"first second"\` to how many times that pair ran.
- \`let best = null; let most = 0;\` is the leader so far; \`null\` is the answer when no pair exists.
- \`const t = trace;\` is only a shorter name.
- \`for (let i = 1; i < t.length; i++) {\` visits every pair once.
- \`const k = t[i - 1] + ' ' + t[i];\` is the pair as a string key.
- \`const n = (counts.get(k) ?? 0) + 1; counts.set(k, n);\` adds one to its count (\`?? 0\` starts a new pair at zero).
- \`if (n > most) { most = n; best = k; }\` takes the lead only by going strictly above it, so in the tie test \`a b\` reaches 2 first and \`b c\` reaching 2 later does not replace it.
- \`return best;\`

**Common wrong attempts.**

- Using \`>=\` hands ties to the *last* pair to reach the top count, which fails the tie test.
- Starting the loop at 0 builds a first "pair" from \`undefined\` and the first instruction.`,
    wrong: [
      {
        code: `function topPair(trace) {
  const counts = new Map();
  let best = null;
  let most = 0;
  const t = trace;
  for (let i = 1; i < t.length; i++) {
    const k = t[i - 1] + ' ' + t[i];
    const n = (counts.get(k) ?? 0) + 1;
    counts.set(k, n);
    if (n >= most) {
      most = n;
      best = k;
    }
  }
  return best;
}`,
        why: 'With `>=`, a later pair that ties takes the lead, so `a b c a b c` gives `b c` instead of `a b`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'What did the companion’s 2026-11-02 benchmark run show?',
    options: [
      { t: 'The VM was several times faster on every program', why: 'Its best was 1.3 times faster, on `method_calls`.' },
      { t: 'The VM was slower on every program', why: 'It was faster on six of the ten programs.' },
      { t: 'The VM was at most about 1.3 times faster, and slower on four programs', correct: true, why: 'Faster on calls and loops, slower on `fields`, `instantiation`, `strings` and `trees`.' },
      { t: 'The two engines took exactly the same time', why: 'The times differ from program to program, in both directions.' },
    ],
  },
  {
    q: 'Why are `fields` and `instantiation` slower on the VM than on the tree-walker?',
    options: [
      { t: 'The VM keeps fields in its own hash table written in JavaScript, and runs its own collector on top of V8’s', correct: true, why: 'The tree-walker uses V8’s built-in `Map` and only V8’s collector; a copy of the VM with fields in a `Map` was measurably faster on both.' },
      { t: 'The VM checks types and the tree-walker does not', why: 'Both check types: Drip’s runtime errors are the same in both engines.' },
      { t: 'The tree-walker caches every field read', why: 'It does no caching of its own; it borrows V8’s fast `Map`.' },
      { t: 'Bytecode is always slower for objects', why: 'Not in general; it depends on what the instructions do and on the host.' },
    ],
  },
  {
    q: 'Removing the instruction counter (`instructionsExecuted++`) from `run` gave 1.03 times on `fib`. What should you conclude?',
    options: [
      { t: 'The counter costs 3 per cent, so remove it', why: 'On a shared machine, 3 per cent is within run-to-run noise; the measurement cannot tell.' },
      { t: 'Nothing measurable: the difference is within the noise', correct: true, why: 'Differences under about 10 per cent did not repeat reliably across these runs.' },
      { t: 'The counter makes the VM faster', why: 'The version without it was, if anything, slightly faster; but too slightly to trust.' },
      { t: 'The benchmark is broken', why: 'It is fine; small effects are just hard to see on a noisy machine.' },
    ],
  },
  {
    q: 'A loop runs three million passes. Without `inc.local` each pass is 17 instructions; with it, 13. How many dispatches does `inc.local` save in all?',
    options: [
      { t: '3 million', why: 'Each use saves k − 1 = 4 dispatches, not 1.' },
      { t: '4', why: 'That is per pass; the loop runs three million times.' },
      { t: '15 million', why: 'That would be five per pass, but `inc.local` itself is still one dispatch.' },
      { t: '12 million', correct: true, why: '(5 − 1) × 3,000,000: exactly 51,000,015 − 39,000,015.' },
    ],
  },
  {
    q: 'Why must a superinstruction pass check that no jump lands inside the sequence it fuses?',
    options: [
      { t: 'Jumps are slower to superinstructions', why: 'Speed is not the issue; correctness is.' },
      { t: 'A jump into the middle would land on what used to be the second instruction, which no longer exists', correct: true, why: 'The fused opcode does the whole sequence; there is no way to start halfway through it.' },
      { t: 'Superinstructions cannot be jumped to at all', why: 'A jump to the *start* is fine: it runs the whole fused sequence.' },
      { t: 'The disassembler could not print it', why: 'The disassembler is not affected; the code’s meaning is.' },
    ],
  },
];
