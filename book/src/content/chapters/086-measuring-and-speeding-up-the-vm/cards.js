// Chapter 64 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.
// Merged from old chapters 86, 86.

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
  rebuilt: {
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
  'nan-room': {
    q: 'Why is there room inside the NaNs of a double to store other values?',
    a: 'Any double with an all-ones exponent and a non-zero fraction is a NaN, which is a vast number of bit patterns, and arithmetic only produces one or two of them.',
  },
  'nan-canonical': {
    q: 'Why must a NaN-boxing VM store every real NaN in one canonical form?',
    a: 'A NaN that happened to carry the “boxed” bits would be misread as none, a boolean or an object.',
  },
  'nan-js-payload': {
    q: 'A NaN-boxing VM written in JavaScript cannot put a pointer in a double. What would its object payload be instead?',
    a: 'An index into an array that holds the objects.',
  },
  'nan-test': {
    q: 'In this chapter’s scheme, how do you tell whether a slot holds a number?',
    a: 'Mask the high word with `BOX`: if the result is not `BOX`, it is a number.',
  },
  'gen-hypothesis': {
    q: 'What is the generational hypothesis?',
    a: 'Most objects die young: they become unreachable soon after they are allocated.',
  },
  'write-barrier': {
    q: 'Why does a generational collector need a write barrier?',
    a: 'A minor collection does not trace old objects, so it must be told which old objects point at young ones; the barrier records them, as extra roots.',
  },
  'trees-exception': {
    q: 'In the companion’s `trees` benchmark, about half the objects survive each collection. What does that mean for a generational collector?',
    a: 'Less benefit: many objects live long, get promoted, and the young generation is not mostly garbage. The hypothesis is about most programs, not all.',
  },
  'number-store': {
    q: 'Why does a write barrier ignore a store like `o.f = 3`?',
    a: 'A number is not a reference to an object, so it cannot create an old-to-young pointer.',
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
  'nan-box': {
    title: 'NaN-boxing with two views',
    code: `const f64 = new Float64Array(4);
const u32 = new Uint32Array(f64.buffer);
// quiet NaN + the "box" bit
const BOX = 0x7ffc0000;
const NONE = 1, TRUE = 3, OBJ = 4;

function box(i, tag, payload) {
  u32[2 * i] = payload; // low word
  u32[2 * i + 1] = BOX | tag; // high
}
function isNum(i) {
  return (u32[2 * i + 1] & BOX) !== BOX;
}
function show(i) {
  if (isNum(i)) return f64[i];
  const tag = u32[2 * i + 1] & 0xffff;
  const p = u32[2 * i];
  if (tag === NONE) return 'none';
  if (tag === TRUE) return 'true';
  return 'object #' + p;
}

f64[0] = 1.5;
box(1, NONE, 0);
box(2, OBJ, 7);
f64[3] = NaN;
for (let i = 0; i < 4; i++) {
  const hi = u32[2 * i + 1];
  console.log(hi.toString(16), show(i));
}
// a boxed value *is* a NaN:
console.log(Number.isNaN(f64[2]));`,
  },
};

export const exercises = {
  fusePairs: {
    title: 'Fuse inc.local',
    prompt: 'Instructions are objects like `{ op: \'load.local\', a: 1 }`, `{ op: \'const\', v: 1 }`, `{ op: \'add\' }`, `{ op: \'store.local\', a: 1 }` and `{ op: \'pop\' }`. Write `fuse(code, targets)`: return a **new** array in which every run of `load.local s`, `const 1`, `add`, `store.local s`, `pop` (the same slot `s` both times, and the constant exactly 1) becomes `{ op: \'inc.local\', a: s }` followed by four `{ op: \'nop\' }`, so positions do not move. Do not fuse a run if a jump lands on any of its last four positions (`targets` is a `Set` of indexes). Do not change `code`.',
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
    prompt: 'To find superinstruction candidates, count which instructions run next to each other. `trace` is an array of opcode names in the order they ran. Write `topPair(trace)`: return the most common adjacent pair as the string `"first second"`, or `null` if there are fewer than two instructions. On a tie, return the pair that reached the top count first.',
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
  nanBox: {
    title: 'Box and unbox',
    prompt: 'Slot `i` of `f64` is one value; its high 32-bit word is `u32[2 * i + 1]` and its low word `u32[2 * i]`. Write `setValue(i, v)` for a number, `null`, `true` or `false`: store numbers as doubles, but store **every** NaN as the canonical bits (high `0x7ff80000`, low 0); store the others with low word 0 and high word `BOX | tag`. Write `getValue(i)` to turn the bits back into the same JavaScript value.',
    starter: `const f64 = new Float64Array(8);
const u32 = new Uint32Array(f64.buffer);
const BOX = 0x7ffc0000;
const NONE = 1, FALSE = 2, TRUE = 3;

function setValue(i, v) {
  f64[i] = v;
}

function getValue(i) {
  return f64[i];
}`,
    solution: `const f64 = new Float64Array(8);
const u32 = new Uint32Array(f64.buffer);
const BOX = 0x7ffc0000;
const NONE = 1, FALSE = 2, TRUE = 3;

function setValue(i, v) {
  if (typeof v === 'number') {
    if (v !== v) { // NaN
      u32[2 * i] = 0;
      u32[2 * i + 1] = 0x7ff80000;
    } else {
      f64[i] = v;
    }
    return;
  }
  const tag = v === null ? NONE
    : v ? TRUE : FALSE;
  u32[2 * i] = 0;
  u32[2 * i + 1] = BOX | tag;
}

function getValue(i) {
  const hi = u32[2 * i + 1];
  if ((hi & BOX) !== BOX) return f64[i];
  const tag = hi & 0xffff;
  if (tag === NONE) return null;
  return tag === TRUE;
}`,
    tests: `test('numbers round-trip', () => {
  for (const x of [1.5, -2, 0, 1e300]) {
    setValue(0, x);
    expect(getValue(0)).toBe(x);
  }
  setValue(1, -0);
  expect(Object.is(getValue(1), -0))
    .toBe(true);
  setValue(1, -Infinity);
  expect(getValue(1)).toBe(-Infinity);
});
test('none and booleans round-trip', () => {
  setValue(2, null);
  setValue(3, true);
  setValue(4, false);
  expect(getValue(2)).toBe(null);
  expect(getValue(3)).toBe(true);
  expect(getValue(4)).toBe(false);
});
test('boxed bits are as specified', () => {
  setValue(5, true);
  expect(u32[11]).toBe(BOX | TRUE);
  expect(u32[10]).toBe(0);
});
test('every NaN stays a number', () => {
  // a NaN whose bits look like none
  const t = new Float64Array(1);
  new Uint32Array(t.buffer)[1] = BOX | NONE;
  setValue(6, t[0]);
  expect(Number.isNaN(getValue(6)))
    .toBe(true);
  expect(u32[13]).toBe(0x7ff80000);
});`,
    hints: [
      'In `getValue`, a slot is a number unless all the `BOX` bits are set in its high word: `(hi & BOX) !== BOX`.',
      'In `setValue`, handle numbers first. `v !== v` is true only for NaN: write the canonical bits through `u32` instead of `f64[i] = v`.',
      'For the rest, pick the tag (`null` → `NONE`, `true` → `TRUE`, `false` → `FALSE`), write 0 to the low word and `BOX | tag` to the high word.',
    ],
    walkthrough: `**How to think about it.** Do \`getValue\` first, because it fixes the encoding: a slot is a number unless all the \`BOX\` bits are set in its high word, and if they are, the low 16 bits of the high word are the tag. \`setValue\` then has to produce exactly what \`getValue\` expects. Numbers can go straight in through \`f64\`, with one exception: a NaN, which might arrive with bits that look boxed (the last test builds one on purpose). So NaN gets the canonical bits written by hand, and everything else gets a tag.

**The solution, line by line.**

- \`if (typeof v === 'number') {\` handles every number, NaN included.
- \`if (v !== v) {\` is true only for NaN, the one value not equal to itself.
- \`u32[2 * i] = 0; u32[2 * i + 1] = 0x7ff80000;\` writes the canonical NaN through the integer view, so the engine cannot choose the bits: exponent all ones and the quiet bit, but not the box bit.
- \`f64[i] = v;\` stores any other number as itself; \`-0\` and the infinities survive unchanged (the first test).
- \`const tag = v === null ? NONE : v ? TRUE : FALSE;\` picks the tag for \`none\` and the booleans.
- \`u32[2 * i] = 0; u32[2 * i + 1] = BOX | tag;\` writes the boxed value: no payload, and the box pattern plus the tag on top (the third test checks the exact bits).
- In \`getValue\`, \`const hi = u32[2 * i + 1];\` reads the high word, and \`if ((hi & BOX) !== BOX) return f64[i];\` returns numbers: every finite double, both infinities and the canonical NaN lack at least one \`BOX\` bit.
- \`const tag = hi & 0xffff;\` reads the tag; \`if (tag === NONE) return null;\` and \`return tag === TRUE;\` turn it back into a value.

**Common wrong attempts.**

- Storing NaN with \`f64[i] = v\` like any other number usually works, which is what makes it dangerous: a NaN whose bits happen to look boxed is read back as \`none\`.
- Testing \`Number.isNaN(f64[i])\` to tell boxed values from numbers fails because every boxed value *is* a NaN, and so is the number NaN: a stored NaN comes back as \`false\`.
- On a big-endian machine the two words are the other way round; a careful VM checks the byte order once at start-up.`,
    wrong: [
      {
        code: `const f64 = new Float64Array(8);
const u32 = new Uint32Array(f64.buffer);
const BOX = 0x7ffc0000;
const NONE = 1, FALSE = 2, TRUE = 3;

function setValue(i, v) {
  if (typeof v === 'number') {
    f64[i] = v;
    return;
  }
  const tag = v === null ? NONE
    : v ? TRUE : FALSE;
  u32[2 * i] = 0;
  u32[2 * i + 1] = BOX | tag;
}

function getValue(i) {
  const hi = u32[2 * i + 1];
  if ((hi & BOX) !== BOX) return f64[i];
  const tag = hi & 0xffff;
  if (tag === NONE) return null;
  return tag === TRUE;
}`,
        why: 'NaNs are not made canonical. A NaN whose bits happen to look boxed is stored as it is and read back as `none`. Write the canonical NaN bits yourself.',
      },
      {
        code: `const f64 = new Float64Array(8);
const u32 = new Uint32Array(f64.buffer);
const BOX = 0x7ffc0000;
const NONE = 1, FALSE = 2, TRUE = 3;

function setValue(i, v) {
  if (typeof v === 'number') {
    if (v !== v) {
      u32[2 * i] = 0;
      u32[2 * i + 1] = 0x7ff80000;
    } else {
      f64[i] = v;
    }
    return;
  }
  const tag = v === null ? NONE
    : v ? TRUE : FALSE;
  u32[2 * i] = 0;
  u32[2 * i + 1] = BOX | tag;
}

function getValue(i) {
  if (!Number.isNaN(f64[i])) {
    return f64[i];
  }
  const tag = u32[2 * i + 1] & 0xffff;
  if (tag === NONE) return null;
  return tag === TRUE;
}`,
        why: 'Every boxed value is a NaN, but so is the number NaN. Testing `Number.isNaN` turns a stored NaN into `false` (tag 0). Test the `BOX` bits instead.',
      },
    ],
  },
  barrier: {
    optional: true,
    title: 'A write barrier',
    prompt: 'Objects are `{ old, refs }`, where `old` says which generation the object is in and `refs` is an array of references. Write `store(owner, i, v, rem)`, where `rem` is the remembered set: set `owner.refs[i] = v`, and if `owner` is old and `v` is a young object (an object with `old` false; numbers and `null` are not objects), add `owner` to `rem`.',
    starter: `function store(owner, i, v, rem) {
  owner.refs[i] = v;
}`,
    solution: `function store(owner, i, v, rem) {
  owner.refs[i] = v;
  const young = typeof v === 'object' &&
    v !== null && !v.old;
  if (owner.old && young) {
    rem.add(owner);
  }
}`,
    tests: `const obj = (old) => ({ old, refs: [] });
test('old to young is remembered', () => {
  const r = new Set();
  const o = obj(true);
  store(o, 0, obj(false), r);
  expect(r.has(o)).toBe(true);
  expect(o.refs.length).toBe(1);
});
test('young to young is not', () => {
  const r = new Set();
  store(obj(false), 0, obj(false), r);
  expect(r.size).toBe(0);
});
test('old to old is not', () => {
  const r = new Set();
  store(obj(true), 0, obj(true), r);
  expect(r.size).toBe(0);
});
test('numbers and null are not', () => {
  const r = new Set();
  const o = obj(true);
  store(o, 0, 3, r);
  store(o, 1, null, r);
  expect(r.size).toBe(0);
  expect(o.refs).toEqual([3, null]);
});`,
    hints: [
      'The store itself always happens. The barrier only decides whether to *also* remember the owner.',
      'Remember the owner only when it is old and the value is a young object. Check “is an object” first: `typeof v === \'object\' && v !== null`.',
      'Then `!v.old` makes it young, and `rem.add(owner)` records it (a `Set` ignores duplicates).',
    ],
    walkthrough: `**How to think about it.** A minor collection traces only the young generation, starting from the roots. A young object reachable only through an old one would be missed, so every store that could create such a reference must leave a note. Of the four combinations of old and young, only one creates the problem: an old owner gaining a reference to a young value. Everything else (and every store of a non-object) needs nothing.

**The solution, line by line.**

- \`owner.refs[i] = v;\` is the store the program asked for; the barrier never changes it.
- \`const young = typeof v === 'object' && v !== null && !v.old;\` decides whether the value is a young object. Numbers and \`null\` are not references at all (the last test); \`typeof null\` is \`'object'\` in JavaScript, hence the second check.
- \`if (owner.old && young) { rem.add(owner); }\` records the old owner. At the next minor collection, every object in \`rem\` is treated as a root, so whatever young objects it points at are kept.

**Common wrong attempts.**

- Remembering on every store makes the remembered set as big as the heap, and the minor collection is no longer cheap.
- Checking \`!v.old\` without first checking that \`v\` is an object treats the number 3 as a young object (since \`(3).old\` is \`undefined\`), and remembers the owner for nothing.
- Remembering the *value* instead of the owner keeps the young object alive once, but misses later changes: it is the old object's references that the minor collection must read.`,
    wrong: [
      {
        code: `function store(owner, i, v, rem) {
  owner.refs[i] = v;
  if (owner.old && !v?.old) {
    rem.add(owner);
  }
}`,
        why: 'Without the object check, storing the number 3 or `null` into an old object counts as old-to-young, and the owner is remembered for nothing.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'What did the companion’s 2026-11-02 benchmark run show?',
    options: [
      {
        t: 'The VM was several times faster on every program',
        why: 'Its best was 1.3 times faster, on `method_calls`.',
      },
      {
        t: 'The VM was slower on every program',
        why: 'It was faster on six of the ten programs.',
      },
      {
        t: 'The VM was at most about 1.3 times faster, and slower on four programs',
        correct: true,
        why: 'Faster on calls and loops, slower on `fields`, `instantiation`, `strings` and `trees`.',
      },
      {
        t: 'The two engines took exactly the same time',
        why: 'The times differ from program to program, in both directions.',
      },
    ],
  },
  {
    q: 'Why are `fields` and `instantiation` slower on the VM than on the tree-walker?',
    options: [
      {
        t: 'The VM keeps fields in its own hash table written in JavaScript, and runs its own collector on top of V8’s',
        correct: true,
        why: 'The tree-walker uses V8’s built-in `Map` and only V8’s collector; a copy of the VM with fields in a `Map` was measurably faster on both.',
      },
      {
        t: 'The VM checks types and the tree-walker does not',
        why: 'Both check types: Drip’s runtime errors are the same in both engines.',
      },
      {
        t: 'The tree-walker caches every field read',
        why: 'It does no caching of its own; it borrows V8’s fast `Map`.',
      },
      {
        t: 'Bytecode is always slower for objects',
        why: 'Not in general; it depends on what the instructions do and on the host.',
      },
    ],
  },
  {
    q: 'Removing the instruction counter (`instructionsExecuted++`) from `run` gave 1.03 times on `fib`. What should you conclude?',
    options: [
      {
        t: 'The counter costs 3 per cent, so remove it',
        why: 'On a shared machine, 3 per cent is within run-to-run noise; the measurement cannot tell.',
      },
      {
        t: 'Nothing measurable: the difference is within the noise',
        correct: true,
        why: 'Differences under about 10 per cent did not repeat reliably across these runs.',
      },
      {
        t: 'The counter makes the VM faster',
        why: 'The version without it was, if anything, slightly faster; but too slightly to trust.',
      },
      {
        t: 'The benchmark is broken',
        why: 'It is fine; small effects are just hard to see on a noisy machine.',
      },
    ],
  },
  {
    q: 'A loop runs three million passes. Without `inc.local` each pass is 17 instructions; with it, 13. How many dispatches does `inc.local` save in all?',
    options: [
      {
        t: '3 million',
        why: 'Each use saves k − 1 = 4 dispatches, not 1.',
      },
      {
        t: '4',
        why: 'That is per pass; the loop runs three million times.',
      },
      {
        t: '15 million',
        why: 'That would be five per pass, but `inc.local` itself is still one dispatch.',
      },
      {
        t: '12 million',
        correct: true,
        why: '(5 − 1) × 3,000,000: exactly 51,000,015 − 39,000,015.',
      },
    ],
  },
  {
    q: 'Why must a superinstruction pass check that no jump lands inside the sequence it fuses?',
    options: [
      {
        t: 'Jumps are slower to superinstructions',
        why: 'Speed is not the issue; correctness is.',
      },
      {
        t: 'A jump into the middle would land on what used to be the second instruction, which no longer exists',
        correct: true,
        why: 'The fused opcode does the whole sequence; there is no way to start halfway through it.',
      },
      {
        t: 'Superinstructions cannot be jumped to at all',
        why: 'A jump to the *start* is fine: it runs the whole fused sequence.',
      },
      {
        t: 'The disassembler could not print it',
        why: 'The disassembler is not affected; the code’s meaning is.',
      },
    ],
  },
  {
    q: 'In this chapter’s scheme, how do you tell whether a 64-bit slot holds a number?',
    options: [
      {
        t: 'Call `Number.isNaN` on it',
        why: 'Every boxed value is a NaN, but so is the number NaN, so that test cannot tell them apart.',
      },
      {
        t: 'Check whether all the `BOX` bits are set in the high word; if not, it is a number',
        correct: true,
        why: 'Only boxed values have the all-ones exponent, the quiet bit and the box bit together.',
      },
      {
        t: 'Check whether the low word is zero',
        why: 'Plenty of numbers have a zero low word, 1.5 for one.',
      },
      {
        t: 'Look up its type in a side table',
        why: 'The point of NaN-boxing is that the value carries its own type.',
      },
    ],
  },
  {
    q: 'Why does NaN-boxing require canonical NaNs?',
    options: [
      {
        t: 'Because NaN is not equal to NaN',
        why: 'That is true of every NaN, canonical or not; the issue is bit patterns.',
      },
      {
        t: 'To save memory',
        why: 'Every value is 8 bytes either way.',
      },
      {
        t: 'A real NaN with the “boxed” bits set would be read as a value that is not a number',
        correct: true,
        why: 'Storing every NaN as one known pattern means numbers never collide with boxed values.',
      },
      {
        t: 'Because the CPU rejects other NaNs',
        why: 'CPUs handle many NaN patterns; it is the VM that gives some of them meaning.',
      },
    ],
  },
  {
    q: 'In counts made for this chapter, `instantiation` kept 0.1% of the objects at each collection and `trees` kept 54%. What does that say?',
    options: [
      {
        t: 'The collector is broken on `trees`',
        why: '`trees` really does keep its trees alive; the collector is right to keep them.',
      },
      {
        t: 'Generational collection would help `trees` most',
        why: 'It helps most where objects die young; `trees` keeps half of them.',
      },
      {
        t: 'All programs keep about the same share',
        why: 'The two differ by a factor of hundreds.',
      },
      {
        t: 'Most objects die young in `instantiation`, as the generational hypothesis says, while `trees` is an exception',
        correct: true,
        why: 'The hypothesis describes most programs, not every one.',
      },
    ],
  },
  {
    q: 'Which store needs a write barrier to record something?',
    options: [
      {
        t: 'Storing a young list into a field of an old instance',
        correct: true,
        why: 'That creates an old-to-young reference, which a minor collection would otherwise miss.',
      },
      {
        t: 'Storing a number into a field of an old instance',
        why: 'A number is not a reference, so there is nothing to miss.',
      },
      {
        t: 'Storing a young list into a field of a young instance',
        why: 'A minor collection traces the young instance, so it finds the list anyway.',
      },
      {
        t: 'Storing an old object into a global',
        why: 'Globals are roots, and an old object is not collected by a minor collection anyway.',
      },
    ],
  },
  {
    q: 'What does a minor collection treat as its roots?',
    options: [
      {
        t: 'Only the stack',
        why: 'It also needs the other roots, and the remembered old objects.',
      },
      {
        t: 'Every old object',
        why: 'That would make it as costly as a full collection.',
      },
      {
        t: 'The usual roots, plus the old objects in the remembered set',
        correct: true,
        why: 'Those are exactly the old objects that might keep a young one alive.',
      },
      {
        t: 'Nothing: it frees every young object',
        why: 'Young objects that are still reachable must survive, and be promoted later.',
      },
    ],
  },
];
