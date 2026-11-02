// Chapter 168 cards. Keys are stable ids: never rename them.

export const prompts = {
  'jsc-tiers': {
    q: 'Name JavaScriptCore’s four execution tiers, from coldest to hottest.',
    a: 'LLInt, Baseline JIT, DFG JIT, FTL JIT.',
  },
  'llint-lang': {
    q: 'What language is JavaScriptCore’s LLInt written in?',
    a: 'An assembly-like language of JavaScriptCore’s own (offlineasm), translated for each processor; not C++.',
  },
  'ftl-b3': {
    q: 'What does JavaScriptCore’s FTL tier start from, and what does it lower it into?',
    a: 'It starts from the DFG’s view of the function and lowers it into a second intermediate representation, B3.',
  },
  'sm-thresholds': {
    q: 'By default, after how many calls or loop iterations does SpiderMonkey move a function into the Baseline Interpreter, the Baseline JIT and Ion?',
    a: '10, 100 and 1500.',
  },
  'warp-input': {
    q: 'What does SpiderMonkey’s Warp read, besides the bytecode, when it builds optimized code?',
    a: 'A snapshot of what the Baseline inline caches saw (their CacheIR stubs).',
  },
  'sm-bailout': {
    q: 'When a guard fails in SpiderMonkey’s Ion code, where does execution resume?',
    a: 'In the Baseline Interpreter, with its frame rebuilt from a snapshot.',
  },
  'jsc-double': {
    q: 'In JavaScriptCore’s encoding, why add 2^49 to every double?',
    a: 'It moves every real double out of the ranges reserved for pointers (top bits 0x0000) and int32s (0xFFFE), so the top bits alone give the type.',
  },
  'diversity-what': {
    q: 'You measured a 4× speed-up in Node. What can you say about Safari?',
    a: 'Nothing certain: it is a hypothesis until measured there, because engines differ in tiers, thresholds, speculation and value representation.',
  },
};

export const examples = {
  'jsc-encode': {
    title: 'JavaScriptCore’s value encoding',
    code: `const f64 = new Float64Array(1);
const u32 = new Uint32Array(f64.buffer);
const hex = (n) =>
  n.toString(16).padStart(8, '0');

// int32: tag 0xFFFE on top
function jscInt(i) {
  return 'fffe0000:' + hex(i >>> 0);
}
// double: its bits plus 2^49, which is
// 0x20000 in the high 32-bit word
function jscDouble(d) {
  f64[0] = d;
  const raw = u32[1];
  const hi = (raw + 0x20000) >>> 0;
  return hex(raw) + ' -> ' +
    hex(hi) + ':' + hex(u32[0]);
}

console.log('5   ', jscInt(5));
console.log('-1  ', jscInt(-1));
console.log('1.5 ', jscDouble(1.5));
console.log('-2.5', jscDouble(-2.5));
console.log('NaN ', jscDouble(NaN));`,
  },
};

const SETUP = `const f64 = new Float64Array(1);
const u32 = new Uint32Array(f64.buffer);
const INT_TAG = 0xfffe0000;
// 2^49, as seen in the high word:
const OFFSET = 0x20000;
`;

export const exercises = {
  jscBox: {
    title: 'Encode like JavaScriptCore',
    prompt:
      'Write `encode(v)` for a number `v`, returning `[hi, lo]`, the two 32-bit halves of its JavaScriptCore encoding. If `v` is a 32-bit integer (and not `-0`), `hi` is `INT_TAG` and `lo` is `v >>> 0`. Otherwise it is a double: take its bits through `f64`/`u32` (`u32[1]` is the high word) and add `OFFSET` to the high word (wrapping with `>>> 0`). Write `decode(hi, lo)` to get the number back.',
    starter: `${SETUP}
function encode(v) {
  return [0, 0];
}

function decode(hi, lo) {
  return 0;
}`,
    solution: `${SETUP}
function isInt32(v) {
  return (v | 0) === v &&
    !Object.is(v, -0);
}

function encode(v) {
  if (isInt32(v)) {
    return [INT_TAG, v >>> 0];
  }
  f64[0] = v;
  const hi = (u32[1] + OFFSET) >>> 0;
  return [hi, u32[0]];
}

function decode(hi, lo) {
  if (hi >>> 16 === 0xfffe) {
    return lo | 0;
  }
  u32[1] = (hi - OFFSET) >>> 0;
  u32[0] = lo;
  return f64[0];
}`,
    tests: `test('int32s get the 0xFFFE tag', () => {
  expect(encode(5)).toEqual([0xfffe0000, 5]);
  expect(encode(-1))
    .toEqual([0xfffe0000, 0xffffffff]);
});
test('doubles are offset by 2^49', () => {
  expect(encode(1.5)).toEqual([0x3ffa0000, 0]);
  expect(encode(-2.5))
    .toEqual([0xc0060000, 0]);
});
test('2^31 and -0 are doubles', () => {
  expect(encode(2 ** 31)[0])
    .toBe(0x41e20000);
  expect(encode(-0)).toEqual([0x80020000, 0]);
});
test('everything round-trips', () => {
  for (const v of [0, 7, -5, 1.5, -0, 1e300,
    -Infinity, 2 ** 31, -(2 ** 31)]) {
    const [hi, lo] = encode(v);
    expect(Object.is(decode(hi, lo), v))
      .toBe(true);
  }
});`,
    hints: [
      'A number is an int32 when `(v | 0) === v`. That is also true for `-0`, which must stay a double: check `Object.is(v, -0)`.',
      'For a double, write `f64[0] = v`, then read `u32[1]` (high) and `u32[0]` (low). Add `OFFSET` to the high word and wrap with `>>> 0`.',
      'To decode, look at the top 16 bits: `hi >>> 16 === 0xfffe` means an int (`lo | 0` restores the sign). Otherwise subtract `OFFSET`, write both words back and read `f64[0]`.',
    ],
    walkthrough: `**How to think about it.** Split the problem in two, exactly as JavaScriptCore does: decide whether \`v\` is a 32-bit integer, and handle the two cases separately. Do one of each by hand first. For 5: it is an int32, so the high half is the tag \`0xfffe0000\` and the low half is 5. For 1.5: its IEEE bits are \`0x3ff80000\` (high) and \`0\` (low); adding 2^49 to a 64-bit number adds \`0x20000\` to the high 32-bit half, so the answer is \`[0x3ffa0000, 0]\`. Decoding runs the same steps backwards, and the top 16 bits tell you which case you are in.

**The solution, line by line.**

- \`function isInt32(v) {\` is a helper for the first decision.
- \`return (v | 0) === v && !Object.is(v, -0);\` \`v | 0\` converts \`v\` to a 32-bit integer (cutting off any fraction and wrapping large values), so it equals \`v\` only when \`v\` already was one. However, \`-0 | 0\` is \`0\`, and \`0 === -0\` is \`true\`, so \`-0\` would slip through; \`Object.is\` tells the two zeros apart, and \`-0\` has to be stored as a double or its sign would be lost.
- \`if (isInt32(v)) { return [INT_TAG, v >>> 0]; }\` An int gets the tag on top. \`v >>> 0\` reads its 32 bits as an unsigned number, so \`-1\` becomes \`0xffffffff\`, which is how those bits look in memory.
- \`f64[0] = v;\` writes the double into the \`Float64Array\`; \`u32\` views the same 8 bytes as two 32-bit numbers, low half in \`u32[0]\` and high half in \`u32[1]\` (on the little-endian machines this runs on).
- \`const hi = (u32[1] + OFFSET) >>> 0;\` adds 2^49, which lives entirely in the high half as \`0x20000\`. Adding to the high half cannot change the low half, so the low half stays as it is. \`>>> 0\` keeps the result an unsigned 32-bit number (wrapping it if it goes past \`0xffffffff\`).
- \`return [hi, u32[0]];\` returns the encoded double.
- \`if (hi >>> 16 === 0xfffe) { return lo | 0; }\` In \`decode\`, \`hi >>> 16\` is the top 16 bits; \`0xfffe\` means an int, and \`lo | 0\` reads the low half as a *signed* 32-bit number again, so \`0xffffffff\` comes back as \`-1\`.
- \`u32[1] = (hi - OFFSET) >>> 0;\` Otherwise it is a double: subtract the offset from the high half and write both halves back into the shared buffer.
- \`return f64[0];\` reads those 8 bytes as a double again.

**Common wrong attempts.**

- Testing only \`(v | 0) === v\`: \`-0\` passes, is stored as the integer 0, and comes back as \`0\`, so the round-trip test fails.
- Leaving out the offset: the bits are then stored as they are, which is SpiderMonkey's choice, not JavaScriptCore's, and a tiny double such as \`1e-310\` would have top bits \`0x0000\`, the range JSC keeps for pointers. The tests check the exact bits.
- Forgetting \`>>> 0\`: JavaScript's \`+\` on large numbers gives values above \`0xffffffff\` or negative results from \`|\`, so the high half no longer matches the expected 32-bit number.`,
    wrong: [
      {
        code: `${SETUP}
function encode(v) {
  if ((v | 0) === v) {
    return [INT_TAG, v >>> 0];
  }
  f64[0] = v;
  const hi = (u32[1] + OFFSET) >>> 0;
  return [hi, u32[0]];
}

function decode(hi, lo) {
  if (hi >>> 16 === 0xfffe) {
    return lo | 0;
  }
  u32[1] = (hi - OFFSET) >>> 0;
  u32[0] = lo;
  return f64[0];
}`,
        why: '`-0` passes `(v | 0) === v`, so it is stored as the integer 0 and comes back as `0`. Check `Object.is(v, -0)` too.',
      },
      {
        code: `${SETUP}
function encode(v) {
  if ((v | 0) === v &&
    !Object.is(v, -0)) {
    return [INT_TAG, v >>> 0];
  }
  f64[0] = v;
  return [u32[1], u32[0]];
}

function decode(hi, lo) {
  if (hi >>> 16 === 0xfffe) {
    return lo | 0;
  }
  u32[1] = hi;
  u32[0] = lo;
  return f64[0];
}`,
        why: 'Without the 2^49 offset, a tiny double such as `1e-310` has top bits `0x0000` and would look like a pointer. The tests check the exact bits.',
      },
    ],
  },
  tierAt: {
    optional: true,
    title: 'Which tier now?',
    prompt:
      'A ladder is a list of `[name, count]` pairs sorted by count, such as SpiderMonkey’s defaults below. Write `tierAt(n, ladder)`: the name of the highest tier whose count is at most `n`, the number of calls or loop iterations so far.',
    starter: `const SM = [
  ['interpreter', 0],
  ['baseline interpreter', 10],
  ['baseline jit', 100],
  ['ion', 1500],
];

function tierAt(n, ladder) {
  return ladder[0][0];
}`,
    solution: `const SM = [
  ['interpreter', 0],
  ['baseline interpreter', 10],
  ['baseline jit', 100],
  ['ion', 1500],
];

function tierAt(n, ladder) {
  let best = ladder[0][0];
  for (const [name, at] of ladder) {
    if (at <= n) best = name;
  }
  return best;
}`,
    tests: `test('cold code is interpreted', () => {
  expect(tierAt(0, SM)).toBe('interpreter');
  expect(tierAt(9, SM)).toBe('interpreter');
});
test('the thresholds are inclusive', () => {
  expect(tierAt(10, SM))
    .toBe('baseline interpreter');
  expect(tierAt(100, SM)).toBe('baseline jit');
  expect(tierAt(1499, SM)).toBe('baseline jit');
  expect(tierAt(1500, SM)).toBe('ion');
});
test('works for any ladder', () => {
  const L = [['slow', 0], ['fast', 3]];
  expect(tierAt(2, L)).toBe('slow');
  expect(tierAt(1e9, L)).toBe('fast');
});`,
    hints: [
      'Walk the ladder in order and remember the last name whose count is `<= n`.',
      'Start from the first tier, so cold code (`n = 0`) gets the interpreter.',
      '`let best = ladder[0][0];` then `for (const [name, at] of ladder) { if (at <= n) best = name; }` and return `best`.',
    ],
    walkthrough: `**How to think about it.** A ladder is sorted by count, from the coldest tier to the hottest. Walking down it, every tier whose count has been reached is one the function has climbed past or onto; the *last* such tier is where it is now. So the function is "remember the last name whose count is at most \`n\`". Check the edges by hand: with SpiderMonkey's counts, \`n = 9\` is still the interpreter, and \`n = 10\` has just reached the Baseline Interpreter, because the options file gives the number of invocations or iterations *needed*.

**The solution, line by line.**

- \`let best = ladder[0][0];\` starts with the first tier's name, so cold code (\`n = 0\`) gets the interpreter even before the loop runs.
- \`for (const [name, at] of ladder) {\` visits each \`[name, count]\` pair in order, unpacking it into two variables.
- \`if (at <= n) best = name;\` If this tier's count has been reached, it becomes the best answer so far; because the counts only grow, a later tier that is reached always beats an earlier one.
- \`return best;\` returns the highest tier reached.

This is a model, not the engine: real engines may compile in the background, so code keeps running in the lower tier until the new code is ready. The point is the shape, the same idea in every engine with different rungs and numbers.

**Common wrong attempts.**

- Using \`<\` instead of \`<=\`: a function that has reached exactly 1500 is then reported as still in the Baseline JIT, and the "thresholds are inclusive" test fails.
- Returning as soon as a count is reached (\`if (at <= n) return name;\`): the first tier, with count 0, is always reached, so every function would be reported as interpreted.`,
    wrong: [
      {
        code: `const SM = [
  ['interpreter', 0],
  ['baseline interpreter', 10],
  ['baseline jit', 100],
  ['ion', 1500],
];

function tierAt(n, ladder) {
  let best = ladder[0][0];
  for (const [name, at] of ladder) {
    if (at < n) best = name;
  }
  return best;
}`,
        why: 'With `<`, a function that has reached exactly 1500 is still in the Baseline JIT. Reaching the threshold is enough: use `<=`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Which list gives JavaScriptCore’s tiers, as its own options name them?',
    options: [
      { t: 'Ignition, Sparkplug, Maglev, TurboFan', why: 'Those are V8’s tiers.' },
      { t: 'LLInt, Baseline JIT, DFG JIT, FTL JIT', correct: true, why: 'Its option list has `useLLInt`, `useBaselineJIT`, `useDFGJIT` and `useFTLJIT`.' },
      { t: 'Baseline Interpreter, Baseline JIT, Ion', why: 'Those are SpiderMonkey’s tiers (plus its C++ interpreter).' },
      { t: 'Truffle, Graal', why: 'Truffle and the Graal compiler are behind GraalJS, the next chapter.' },
    ],
  },
  {
    q: 'A shape guard fails in SpiderMonkey’s Ion code. What happens?',
    options: [
      { t: 'The program throws a TypeError', why: 'A failed guess is never visible to the program: it only changes where the code runs.' },
      { t: 'Ion patches the guard and carries on', why: 'The assumption is baked into the code; it can’t continue there.' },
      { t: 'It bails out: a Baseline Interpreter frame is rebuilt from a snapshot and execution resumes there', correct: true, why: 'That is how SpiderMonkey’s Bailouts.h describes it.' },
      { t: 'It restarts the function from the beginning in the C++ interpreter', why: 'It resumes at the same point, not at the start, and in the Baseline Interpreter.' },
    ],
  },
  {
    q: 'In JavaScriptCore’s value encoding, what are the top 16 bits of the integer 5?',
    options: [
      { t: '`0x0000`, like a pointer', why: 'The `0x0000` range is for pointers and a few special values such as `true` and `null`.' },
      { t: '`0xFFFE`', correct: true, why: '32-bit integers carry the tag `0xFFFE` in the top 16 bits, with the integer in the low 32.' },
      { t: '`0x4014`, the bits of the double 5.0', why: 'That would be a double. JSC stores 32-bit integers as integers.' },
      { t: '`0x7FF8`, a quiet NaN', why: 'That is the start of the canonical NaN. In JSC’s scheme doubles are shifted by 2^49 anyway.' },
    ],
  },
  {
    q: 'Why might the same loop be faster in one engine than another?',
    options: [
      { t: 'Only because of differences in the computer’s hardware', why: 'On the same machine engines still differ: different tiers, thresholds, speculation and value representations.' },
      { t: 'Because the engines implement different versions of JavaScript', why: 'They implement the same specification, so the results are the same. The speed is what differs.' },
      { t: 'It can’t: all engines compile to the same machine code', why: 'Each engine has its own compilers, with their own IRs and heuristics.' },
      { t: 'Because each engine makes its own implementation choices, so the same program has a different performance profile', correct: true, why: 'That is engine diversity.' },
    ],
  },
  {
    q: 'Viscosity measured its speed-ups on Node. What is the honest claim for Firefox?',
    options: [
      { t: 'The same speed-ups, because the layout is the same', why: 'The layout is the same, but the compiler that runs it isn’t.' },
      { t: 'A hypothesis to measure: typed-array storage is the same everywhere, but each engine compiles the loops differently', correct: true, why: 'Float64Array elements are raw doubles in every engine, but how fast each optimizing tier uses them is an engine-specific question.' },
      { t: 'No speed-up, because Firefox NaN-boxes values', why: 'NaN-boxing is about how single values are stored; it says nothing on its own about this loop’s speed.' },
      { t: 'A slowdown, because SpiderMonkey has fewer tiers', why: 'Fewer tiers doesn’t mean slower peak code. You can only find out by measuring.' },
    ],
  },
];
