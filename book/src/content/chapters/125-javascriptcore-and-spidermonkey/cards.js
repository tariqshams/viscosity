// Chapter 125 cards. Keys are stable ids: never rename them.

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
  'cacheir': {
    q: 'What is CacheIR in SpiderMonkey?',
    a: 'A tiny linear IR describing inline cache cases, from which both Baseline and Ion generate machine code.',
  },
  'sm-bailout': {
    q: 'When a guard fails in SpiderMonkey’s Ion code, where does execution resume?',
    a: 'In the Baseline Interpreter, with its frame rebuilt from a snapshot.',
  },
  'jsc-exit': {
    q: 'Why does a bailout need *snapshots* to rebuild the slower frame?',
    a: 'In optimized code, values may be unboxed, in registers or optimized away, and inlined calls have no frames; the snapshot says how to recover each one.',
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
    walkthrough: `\`\`\`js
function encode(v) {
  if (isInt32(v)) {
    return [INT_TAG, v >>> 0];
  }
  f64[0] = v;
  const hi = (u32[1] + OFFSET) >>> 0;
  return [hi, u32[0]];
}
\`\`\`

- **Ints first.** JavaScriptCore keeps 32-bit integers as integers, with \`0xFFFE\` in the top 16 bits. \`v >>> 0\` stores the 32 bits unsigned, so \`-1\` becomes \`0xffffffff\`, and \`lo | 0\` turns it back into \`-1\`.
- **\`-0\` is not an int.** \`(-0 | 0) === -0\` is \`true\`, because \`===\` treats the zeros as equal. But an integer can't carry a sign on zero, so \`-0\` must be stored as a double or it would come back as \`0\`.
- **Adding 2^49.** A double's high word is bits 63 to 32, so 2^49 is bit 17 of the high word: \`0x20000\`. Adding it is a 64-bit integer addition on the bit pattern. Any carry goes upwards, so the low word never changes and only the high word moves.
- **Why it works.** JavaScriptCore's own comment says that after this shift no encoded double begins with \`0x0000\` (pointers) or \`0xFFFE\` (ints). So the engine can tell the types apart with one look at the top bits.`,
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
    ],
    walkthrough: `\`\`\`js
function tierAt(n, ladder) {
  let best = ladder[0][0];
  for (const [name, at] of ladder) {
    if (at <= n) best = name;
  }
  return best;
}
\`\`\`

- **Sorted ladder.** Because the counts increase, the last tier whose count has been reached is the highest one.
- **Inclusive.** SpiderMonkey's comment says how many invocations or loop iterations are *needed*, so reaching the count is enough: \`<=\`, not \`<\`.
- **A model, not the engine.** Real engines may compile in the background, so code keeps running in the lower tier until the new code is ready. The point is the shape: the same idea in every engine, with different rungs and numbers.`,
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
    q: 'What does SpiderMonkey’s Warp use, besides the bytecode, to build optimized code?',
    options: [
      { t: 'Type annotations from TypeScript', why: 'Engines never see TypeScript types; they are erased before the code runs.' },
      { t: 'Nothing: it compiles bytecode alone', why: 'It reads a snapshot of runtime information, which is the point of speculation.' },
      { t: 'A profile file saved from an earlier run', why: 'The information is collected in the same run, by the baseline tiers.' },
      { t: 'A snapshot of what the Baseline inline caches saw', correct: true, why: 'WarpOracle builds a WarpSnapshot, including information from Baseline IC stubs, for WarpBuilder.' },
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
