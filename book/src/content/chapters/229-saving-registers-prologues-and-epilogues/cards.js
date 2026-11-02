// Chapter 97 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'caller-saved': {
    q: 'Which RISC-V integer registers are **caller-saved**?',
    a: 'ra, t0 to t6 and a0 to a7: any call may change them, so a caller that needs one afterwards must save it.',
  },
  'callee-saved': {
    q: 'Which RISC-V integer registers are **callee-saved**?',
    a: 'sp and s0 to s11: a function must restore them before it returns.',
  },
  'why-both': {
    q: 'Why does a calling convention have both caller-saved and callee-saved registers?',
    a: 'Short-lived values are free in caller-saved registers; values that cross many calls are cheap in callee-saved ones. One kind alone would make one of these cases pay.',
  },
  'leaf-what': {
    q: 'What is a **leaf** function, and why does it often need no frame?',
    a: 'One that calls nobody: ra survives, and it can work in t and a registers, so there is nothing to save.',
  },
  'why-save-ra': {
    q: 'Why must a function that makes a call save `ra` in its prologue?',
    a: 'The call overwrites ra with its own return address, destroying the address this function needs to return to.',
  },
  'prologue-what': {
    q: 'What does a RISC-V prologue do, in order?',
    a: 'Moves sp down to claim the frame, then stores ra (if needed) and the callee-saved registers the body uses.',
  },
  'frame-size': {
    q: 'A function must save ra and s0 (16 bytes). And if it must save ra, s0 and s1?',
    a: '16 bytes for two; 32 for three, since 24 rounds up to the next multiple of 16.',
  },
  'fp-optional': {
    q: 'Must a RISC-V function have a frame pointer? If it has one, where is it?',
    a: 'No, it is optional; if present it lives in s0 (x8), which stays callee-saved.',
  },
};

export const examples = {
  clobber: {
    title: 'What goes wrong without the rule',
    code: `// t0 is caller-saved: sq may use it
const r = { a0: 0, t0: 0 };
function sq() {
  r.t0 = 99;       // scratch, allowed
  r.a0 = r.a0 * r.a0;
}
let i = 0;
r.t0 = 0;          // s kept in t0: bad
for (i = 0; i < 4; i++) {
  r.a0 = i;
  sq();
  r.t0 += r.a0;
}
console.log('s in t0:', r.t0);`,
  },
};

export const exercises = {
  'make-frame': {
    title: 'Write the prologue and epilogue',
    prompt: `Write \`makeFrame(saved, calls)\`. \`saved\` lists the callee-saved registers a function's body uses (for example \`['s0', 's1', 's2']\`), and \`calls\` is \`true\` if the function makes any call. Return \`{ prologue, epilogue }\`, two arrays of assembly lines, laid out the way clang lays them out:

- the registers to save are \`ra\` first (only if \`calls\`), then \`saved\` in order;
- the frame is 8 bytes per register, rounded up to a multiple of 16;
- the prologue is \`addi sp, sp, -SIZE\`, then one \`sd\` per register, the first at \`SIZE - 8\`, the next 8 bytes lower, and so on;
- the epilogue is one \`ld\` per register at the same offsets, in the same order, then \`addi sp, sp, SIZE\` and \`ret\`;
- if there is nothing to save, the prologue is empty and the epilogue is just \`ret\`.

Write lines exactly like \`sd ra, 24(sp)\`, with single spaces.`,
    starter: `function makeFrame(saved, calls) {
  return {
    prologue: [], epilogue: ['ret'] };
}`,
    solution: `function makeFrame(saved, calls) {
  const regs = calls
    ? ['ra', ...saved] : [...saved];
  if (regs.length === 0) {
    return {
      prologue: [], epilogue: ['ret'] };
  }
  const n = regs.length * 8;
  const size = Math.ceil(n / 16) * 16;
  const pro = ['addi sp, sp, -' + size];
  const epi = [];
  regs.forEach((r, k) => {
    const off = size - 8 * (k + 1);
    const at = off + '(sp)';
    pro.push('sd ' + r + ', ' + at);
    epi.push('ld ' + r + ', ' + at);
  });
  epi.push('addi sp, sp, ' + size);
  epi.push('ret');
  return { prologue: pro,
    epilogue: epi };
}`,
    tests: `test('sumsq, exactly as clang wrote it', () => {
  const f = makeFrame(['s0', 's1', 's2'], true);
  expect(f.prologue).toEqual([
    'addi sp, sp, -32', 'sd ra, 24(sp)',
    'sd s0, 16(sp)', 'sd s1, 8(sp)',
    'sd s2, 0(sp)']);
  expect(f.epilogue).toEqual([
    'ld ra, 24(sp)', 'ld s0, 16(sp)',
    'ld s1, 8(sp)', 'ld s2, 0(sp)',
    'addi sp, sp, 32', 'ret']);
});
test('use9: only ra, padded to 16', () => {
  const f = makeFrame([], true);
  expect(f.prologue).toEqual(
    ['addi sp, sp, -16', 'sd ra, 8(sp)']);
});
test('a leaf with no s registers', () => {
  expect(makeFrame([], false)).toEqual(
    { prologue: [], epilogue: ['ret'] });
});
test('a leaf that borrows s0', () => {
  const f = makeFrame(['s0'], false);
  expect(f.prologue).toEqual(
    ['addi sp, sp, -16', 'sd s0, 8(sp)']);
  expect(f.epilogue[2]).toBe('ret');
});`,
    hints: [
      'First make the list of registers to save: `ra` (if the function calls anything) followed by `saved`.',
      'The size is `8 * count` rounded up to a multiple of 16: `Math.ceil(8 * count / 16) * 16`. Register number k (from 0) goes at offset `size - 8 * (k + 1)`.',
      'Build both arrays in one loop over the registers: push an `sd` line onto the prologue and an `ld` line with the same offset onto the epilogue; finish the epilogue with the `addi` and `ret`.',
    ],
    walkthrough: `**How to think about it.** A prologue and its epilogue are mirror images over one shared table: which register lives at which offset in the frame. So compute that table once (the list of registers and the frame size) and print it twice, once as stores and once as loads.

**The solution, line by line.**

- \`const regs = calls ? ['ra', ...saved] : [...saved];\`: \`ra\` only needs saving if a call will overwrite it; it goes first, which puts it at the top of the frame, as clang does.
- \`if (regs.length === 0) { return { prologue: [], epilogue: ['ret'] }; }\`: a leaf that borrows no \`s\` register needs no frame at all, like \`sq\`.
- \`const n = regs.length * 8;\` and \`const size = Math.ceil(n / 16) * 16;\`: 8 bytes per register, rounded up so \`sp\` stays a multiple of 16; one register gives 16, three give 32 (24 rounded up), four give 32.
- \`const pro = ['addi sp, sp, -' + size];\`: claim the frame first; the stores are addressed from the new \`sp\`.
- \`regs.forEach((r, k) => { const off = size - 8 * (k + 1); ... })\`: the first register goes in the highest slot, \`size - 8\`, and each later one 8 bytes lower. The same \`at\` is used for the \`sd\` and the \`ld\`, so each register comes back from exactly where it went.
- \`epi.push('addi sp, sp, ' + size);\` and \`epi.push('ret');\`: release the frame, putting \`sp\` back to its value on entry, and return.

For \`sumsq\`, \`regs\` is \`ra, s0, s1, s2\`, \`size\` is 32 and the offsets are 24, 16, 8 and 0: the listing clang produced.

**Common wrong attempts.**

- Using \`n\` itself as the size, without rounding: three registers would give a 24-byte frame, which assembles but breaks the 16-byte alignment every other function relies on.
- Restoring in a different place from where you saved (for example counting offsets upwards from 0 in the epilogue but downwards in the prologue): the registers come back swapped.
- Always saving \`ra\`: harmless, but wasteful, and it gives a leaf a frame it does not need.`,
    wrong: [
      {
        code: `function makeFrame(saved, calls) {
  const regs = calls
    ? ['ra', ...saved] : [...saved];
  if (regs.length === 0) {
    return {
      prologue: [], epilogue: ['ret'] };
  }
  const n = regs.length * 8;
  const size = n;
  const pro = ['addi sp, sp, -' + size];
  const epi = [];
  regs.forEach((r, k) => {
    const off = size - 8 * (k + 1);
    const at = off + '(sp)';
    pro.push('sd ' + r + ', ' + at);
    epi.push('ld ' + r + ', ' + at);
  });
  epi.push('addi sp, sp, ' + size);
  epi.push('ret');
  return { prologue: pro,
    epilogue: epi };
}`,
        why: 'The frame is not rounded up to 16, so sp loses its alignment (32 is right for sumsq only by luck; use9 gets 8).',
      },
    ],
  },
  'check-preserved': {
    optional: true,
    title: 'Did the callee keep its promise?',
    prompt: 'Write `broken(before, after)`. Both are objects mapping register names to values: the registers just before a call and just after it returns (a test harness for a code generator would capture these). Return the names of the registers the callee was **not** allowed to change but did: `sp` and `s0` to `s11`, in that order. Changes to any other register are allowed.',
    starter: `function broken(before, after) {
  return [];
}`,
    solution: `function broken(before, after) {
  const kept = ['sp'];
  for (let k = 0; k <= 11; k++) {
    kept.push('s' + k);
  }
  return kept.filter(
    (r) => before[r] !== after[r]);
}`,
    tests: `const regs = (o) => {
  const r = { sp: 64, ra: 1, a0: 3, t0: 0 };
  for (let k = 0; k <= 11; k++) r['s' + k] = k;
  return { ...r, ...o };
};
test('changing a0, t0 and ra is allowed', () => {
  expect(broken(regs({}),
    regs({ a0: 9, t0: 5, ra: 7 }))).toEqual([]);
});
test('s1 changed', () => {
  expect(broken(regs({}), regs({ s1: 42 })))
    .toEqual(['s1']);
});
test('sp and s11 changed', () => {
  expect(broken(regs({}),
    regs({ sp: 48, s11: 0 })))
    .toEqual(['sp', 's11']);
});`,
    hints: [
      'Make the list of protected names first: sp, then s0 to s11.',
      'A loop from 0 to 11 can push `"s" + k`.',
      'Keep the names whose value differs: `kept.filter((r) => before[r] !== after[r])`.',
    ],
    walkthrough: `**How to think about it.** The convention's promise is a list of registers whose values must be equal before and after the call (the Formal box). Checking it is "for each protected register, compare".

**The solution, line by line.** \`const kept = ['sp'];\` then the loop pushes \`s0\` up to \`s11\`: the callee-saved set, in order. \`kept.filter((r) => before[r] !== after[r])\` keeps exactly the protected registers that changed. Caller-saved registers such as \`a0\`, \`t0\` and \`ra\` are never looked at, because the callee may do anything to them.

**Common wrong attempts.** Comparing every register would report \`a0\`, which *must* change when there is a result. Forgetting \`sp\` misses one of the most damaging bugs, a callee that does not release its frame.`,
    wrong: [
      {
        code: `function broken(before, after) {
  return Object.keys(before).filter(
    (r) => before[r] !== after[r]);
}`,
        why: 'It also reports a0, t0 and ra, which a callee is allowed to change.',
      },
    ],
  },
};

export const quiz = [
  {
    q: '`sumsq` keeps `i` in `s2` across `call sq`. Who makes sure `s2` survives?',
    options: [
      {
        t: 'sumsq, by saving s2 before every call',
        why: 'That is how a caller-saved register is handled; s2 is callee-saved.',
      },
      {
        t: 'sq, if it uses s2: it must save and restore it',
        correct: true,
        why: 's2 is callee-saved, so the callee guarantees it; sq is a leaf that never touches it.',
      },
      {
        t: 'The processor, automatically',
        why: 'The hardware saves nothing; it is all a software agreement.',
      },
    ],
  },
  {
    q: 'Why does `sq` (`mul a0, a0, a0; ret`) have no prologue?',
    options: [
      {
        t: 'It calls nothing and uses no callee-saved register',
        correct: true,
        why: 'ra survives because nothing overwrites it, and a0 is caller-saved, so there is nothing to save.',
      },
      {
        t: 'Functions with one argument never need a frame',
        why: 'The number of arguments does not matter; what matters is calls and s registers.',
      },
      {
        t: 'Its caller saves everything for it',
        why: 'The caller saves only caller-saved registers it needs; callee-saved ones are the callee’s job.',
      },
    ],
  },
  {
    q: 'A function calls another and uses `s0` and `s1`. How big is its frame, at least?',
    options: [
      {
        t: '16 bytes',
        why: 'It must save three registers (ra, s0, s1), 24 bytes.',
      },
      {
        t: '24 bytes',
        why: 'Right count, but sp must stay a multiple of 16.',
      },
      {
        t: '32 bytes',
        correct: true,
        why: 'Three 8-byte saves, 24 bytes, rounded up to 32.',
      },
    ],
  },
  {
    q: 'Which register could a compiler use for `i * i` in a loop that calls no function, without saving anything?',
    options: [
      {
        t: 's3',
        why: 'Callee-saved: using it would mean saving and restoring the caller’s value.',
      },
      {
        t: 't2',
        correct: true,
        why: 'A caller-saved temporary is free to use, and no call can disturb it here.',
      },
      {
        t: 'sp',
        why: 'sp is the stack pointer; using it for data would wreck the stack.',
      },
    ],
  },
  {
    q: 'In the epilogue, why is `ra` reloaded before `ret`?',
    options: [
      {
        t: 'ret needs ra to be zero',
        why: 'ret jumps to the address in ra; it must be the caller’s return address, not zero.',
      },
      {
        t: 'To undo the call’s change: the calls in the body overwrote ra',
        correct: true,
        why: 'Each call put its own return address in ra; the saved copy is the one leading back to our caller.',
      },
      {
        t: 'Because ra is callee-saved',
        why: 'ra is caller-saved; it is reloaded because this function itself needs it to return.',
      },
    ],
  },
];
