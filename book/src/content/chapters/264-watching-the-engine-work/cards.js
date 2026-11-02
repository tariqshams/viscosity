// Chapter 100 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.
// Merged from old chapters 88, 264.

export const prompts = {
  'flags-internal': {
    q: 'Why should you label any V8 trace you save with the Node and V8 version?',
    a: 'The flags are V8-internal: their names, output and defaults can change in any release.',
  },
  'bc-filter': {
    q: 'What does `--print-bytecode-filter=add` do?',
    a: 'Prints bytecode only for functions named `add`, instead of for every function, Node’s own included.',
  },
  'feedback-slot': {
    q: 'In `Add a0, [0]`, what is `[0]`?',
    a: 'A feedback slot: where this `+` records the types it has seen, for the optimising tiers.',
  },
  osr: {
    q: 'Why is the top-level script optimised with “OSR”?',
    a: 'Its loop never returns, so V8 uses on-stack replacement to switch the running loop to optimised code.',
  },
  'eager-lazy': {
    q: 'What is the difference between an eager and a lazy deopt in V8?',
    a: 'Eager: a check failed inside the optimised code, which deoptimises at once. Lazy: an assumption broke elsewhere, and the code deoptimises next time it runs.',
  },
  'deopt-offset': {
    q: 'A deopt line says `bytecode offset 2`. How do you find out which operation failed?',
    a: 'Print the function’s bytecode with `--print-bytecode` and look at the instruction at `@ 2`.',
  },
  'overflow-deopt': {
    q: 'Why did `function sq(x) { return x * x; }` deoptimise with reason `overflow` when it was only ever given integers?',
    a: 'Its optimised code guessed the result would stay a small integer; once the squares grew past what a Smi holds (from 46341 on, on this build), the guess failed.',
  },
  'gc-line': {
    q: 'A scavenge line reads `166.9 (185.5) -> 166.9 (201.5) MB`. What does it tell you?',
    a: 'The young-generation collection freed nothing: every object it looked at was still reachable.',
  },
  'natives-flag': {
    q: 'What does `%DebugPrint(o)` do without `--allow-natives-syntax`?',
    a: 'Nothing: the `%` is a SyntaxError, because natives syntax isn’t JavaScript.',
  },
  'natives-not-js': {
    q: 'Why is `%DebugPrint(o)` not JavaScript?',
    a: 'It is V8’s private syntax for calling its own runtime functions; no other engine understands it, and V8 only accepts it with `--allow-natives-syntax`.',
  },
  'elements-debugprint': {
    q: '`%DebugPrint([1, 2, 3])` shows `PACKED_SMI_ELEMENTS`. What does it show after `push(1.5)`?',
    a: '`PACKED_DOUBLE_ELEMENTS`: the whole array moved to doubles, still with no holes.',
  },
  'fast-props': {
    q: '`%HasFastProperties(p)` turns from `true` to `false` after `delete p.x`. What happened?',
    a: '`p` fell back to dictionary mode: its properties are now kept in a hash table.',
  },
  'same-map': {
    q: 'Why is `%HaveSameMap({ x: 1, y: 2 }, { y: 1, x: 2 })` false?',
    a: 'A map records the order in which properties were added, so the same fields in a different order give a different map.',
  },
  'prepare-opt': {
    q: 'What does `%OptimizeFunctionOnNextCall(f)` let a test do?',
    a: 'Make V8 optimise `f` on its next call, rather than waiting for it to become hot, so the test can check the optimised code’s behaviour.',
  },
  'opt-status-bits': {
    q: 'In `%GetOptimizationStatus`, bit 6 is set and bit 7 is clear. What does that say about the function?',
    a: 'It is running TurboFan code (bit 6, TurboFanned) and is not interpreted (bit 7).',
  },
  generalization: {
    q: 'What does `--trace-generalization` show for a class field declared as `x;` and then given doubles?',
    a: 'The field generalising from a heap-object field (it held `undefined`) to a generic tagged one, which boxes every double.',
  },
};

export const examples = {};

export const exercises = {
  parseDeopt: {
    title: 'Parse a --trace-deopt line',
    prompt: 'Write `parseDeopt(line)`. If `line` is a V8 bailout line (it contains `(kind: ` and `reason: `), return `{ kind, reason, fn, tier, offset }`: the kind (e.g. `\'deopt-eager\'`), the reason text up to its closing `)`, the function name after `<JSFunction ` (`\'\'` for the nameless top-level script), the tier in `<Code …>` (e.g. `\'TURBOFAN\'`), and the bytecode offset as a **number**. For any other line return `null`. Regular expressions with `line.match(/…(…)…/)` are the easiest tool: the part in brackets is captured as `m[1]`.',
    starter: `function parseDeopt(line) {
  return null;
}`,
    solution: `const KIND = /\\(kind: ([^,]+),/;
const REASON = /reason: ([^)]*)\\)/;
const FN = /<JSFunction ?([^ (]*)/;
const CODE = /<Code (\\w+)>/;
const OFF = /bytecode offset (\\d+)/;

function parseDeopt(line) {
  const k = line.match(KIND);
  const r = line.match(REASON);
  if (!k || !r) return null;
  const f = line.match(FN);
  const c = line.match(CODE);
  const o = line.match(OFF);
  return {
    kind: k[1],
    reason: r[1],
    fn: f ? f[1] : '',
    tier: c ? c[1] : '',
    offset: o ? Number(o[1]) : -1,
  };
}`,
    tests: `// real lines from Node v22.23.4,
// V8 12.4.254.21 (split for width)
const SMI = [
  '[bailout (kind: deopt-eager, ',
  'reason: not a Smi): begin. ',
  'deoptimizing 0x207bb9a23eb1 ',
  '<JSFunction add (sfi = ',
  '0x1a9fac5db7e1)>, 0x083907e81fa9 ',
  '<Code TURBOFAN>, opt id 0, ',
  'bytecode offset 2, deopt exit 0, ',
  'FP to SP delta 32, caller SP ',
  '0x7ffffc8cc8d0, pc 0x7f12c0005d75]',
].join('');
const CALL = [
  '[bailout (kind: deopt-eager, ',
  'reason: Insufficient type feedback ',
  'for call): begin. deoptimizing ',
  '0x207bb9a23629 <JSFunction ',
  '(sfi = 0x1a9fac5db779)>, ',
  '0x083907e82251 <Code TURBOFAN>, ',
  'opt id 1, bytecode offset 41, ',
  'deopt exit 4, FP to SP delta 104]',
].join('');
const MARK = [
  '[marking 0x207bb9a23eb1 <JSFunction ',
  'add (sfi = 0x1a9fac5db7e1)> for ',
  'optimization to TURBOFAN, ',
  'ConcurrencyMode::kConcurrent, ',
  'reason: hot and stable]',
].join('');
test('a named function', () => {
  expect(parseDeopt(SMI)).toEqual({
    kind: 'deopt-eager',
    reason: 'not a Smi',
    fn: 'add',
    tier: 'TURBOFAN',
    offset: 2,
  });
});
test('the nameless top-level script', () => {
  const d = parseDeopt(CALL);
  expect(d.fn).toBe('');
  expect(d.reason).toBe(
    'Insufficient type feedback for call');
  expect(d.offset).toBe(41);
});
test('other lines are not deopts', () => {
  expect(parseDeopt(MARK)).toBe(null);
  expect(parseDeopt('ab')).toBe(null);
});`,
    hints: [
      'Test for the bailout first: if `line.match(/\\(kind: ([^,]+),/)` is `null`, return `null`. A `--trace-opt` line has `reason:` but no `(kind:`.',
      'For the reason, `[^)]*` means “any characters except `)`”, so the match stops at the reason’s own closing bracket instead of running to the last `)` on the line.',
      'The name after `<JSFunction ` may be missing, so allow an optional space and an empty name: `/<JSFunction ?([^ (]*)/`. Convert the offset with `Number(...)`.',
    ],
    walkthrough: `**How to think about it.** A trace line is text with landmarks: \`(kind: \`, \`reason: \`, \`<JSFunction \`, \`<Code \`, \`bytecode offset \`. Rather than one giant pattern for the whole line, find each landmark separately and capture what follows it; if V8 adds a field in the middle one day, the others still parse. Decide first whether the line is a bailout at all: a \`--trace-opt\` line also contains \`reason:\`, but never \`(kind:\`, so both landmarks must be present. Then look at the awkward cases in the tests: the top-level script has no name after \`<JSFunction\`, and the reason contains spaces and stops at a \`)\`.

**The solution, line by line.**

- \`const KIND = /\\(kind: ([^,]+),/;\` finds \`(kind: \` and captures everything up to the next comma: \`deopt-eager\`. (\`[^,]\` means "any character except a comma"; the \`\\(\` is a literal bracket.)
- \`const REASON = /reason: ([^)]*)\\)/;\` captures the reason up to its own closing bracket. \`[^)]*\` cannot cross a \`)\`, so the match stops at the right place instead of running to the last \`)\` on the line.
- \`const FN = /<JSFunction ?([^ (]*)/;\` allows an optional space after \`<JSFunction\`, then captures characters that are neither a space nor \`(\`. For \`<JSFunction add (sfi\` that is \`add\`; for the nameless \`<JSFunction (sfi\` it is the empty string.
- \`const CODE = /<Code (\\w+)>/;\` captures the tier inside \`<Code …>\`: \`TURBOFAN\`.
- \`const OFF = /bytecode offset (\\d+)/;\` captures the offset's digits.
- \`const k = line.match(KIND); const r = line.match(REASON);\` and \`if (!k || !r) return null;\` A line without both landmarks is not a bailout.
- The next three \`match\` calls find the optional fields.
- \`kind: k[1], reason: r[1],\` take the captured text (\`m[1]\` is the part in the first brackets).
- \`fn: f ? f[1] : '', tier: c ? c[1] : '',\` fall back to empty strings if a landmark is missing.
- \`offset: o ? Number(o[1]) : -1,\` turns the digits \`'2'\` into the number \`2\`, so you can look it up in a \`--print-bytecode\` listing or sort by it.

This parser fits V8 12.4's format. Nothing promises that format will last, which is why the chapter labels every trace with its version.

**Common wrong attempts.**

- Leaving the offset as a string: \`'2'\` is not \`2\`, so the first test fails. Convert with \`Number(...)\`.
- A greedy reason pattern, \`reason: (.*)\\)\`: \`.*\` runs to the *last* \`)\` on the line and swallows \`begin. deoptimizing …\` into the reason.
- \`/<JSFunction (\\w+)/\` for the name: it needs a word after the space, so on the nameless script line it finds nothing, or (worse, with other patterns) captures \`(sfi\`.
- Checking only for \`reason: \`: the \`--trace-opt\` "marking" line also has one, so it would wrongly be parsed as a deopt.`,
    wrong: [
      {
        code: `const KIND = /\\(kind: ([^,]+),/;
const REASON = /reason: ([^)]*)\\)/;
const FN = /<JSFunction ?([^ (]*)/;
const CODE = /<Code (\\w+)>/;
const OFF = /bytecode offset (\\d+)/;

function parseDeopt(line) {
  const k = line.match(KIND);
  const r = line.match(REASON);
  if (!k || !r) return null;
  const f = line.match(FN);
  const c = line.match(CODE);
  const o = line.match(OFF);
  return {
    kind: k[1],
    reason: r[1],
    fn: f ? f[1] : '',
    tier: c ? c[1] : '',
    offset: o ? o[1] : -1,
  };
}`,
        why: 'The offset stays a string, `\'2\'`, which isn’t `2`. Convert it with `Number(...)`.',
      },
      {
        code: `const KIND = /\\(kind: ([^,]+),/;
const REASON = /reason: (.*)\\)/;
const FN = /<JSFunction ?([^ (]*)/;
const CODE = /<Code (\\w+)>/;
const OFF = /bytecode offset (\\d+)/;

function parseDeopt(line) {
  const k = line.match(KIND);
  const r = line.match(REASON);
  if (!k || !r) return null;
  const f = line.match(FN);
  const c = line.match(CODE);
  const o = line.match(OFF);
  return {
    kind: k[1],
    reason: r[1],
    fn: f ? f[1] : '',
    tier: c ? c[1] : '',
    offset: o ? Number(o[1]) : -1,
  };
}`,
        why: '`(.*)` is greedy: it runs to the last `)` on the line, so the reason swallows `begin. deoptimizing …`. Use `[^)]*`.',
      },
      {
        code: `const KIND = /\\(kind: ([^,]+),/;
const REASON = /reason: ([^)]*)\\)/;
const FN = /<JSFunction ([^ ]*)/;
const CODE = /<Code (\\w+)>/;
const OFF = /bytecode offset (\\d+)/;

function parseDeopt(line) {
  const k = line.match(KIND);
  const r = line.match(REASON);
  if (!k || !r) return null;
  const f = line.match(FN);
  const c = line.match(CODE);
  const o = line.match(OFF);
  return {
    kind: k[1],
    reason: r[1],
    fn: f ? f[1] : '',
    tier: c ? c[1] : '',
    offset: o ? Number(o[1]) : -1,
  };
}`,
        why: 'For the nameless top-level script, `<JSFunction (sfi = …)>` has no name, so `([^ ]*)` captures `(sfi`. Allow the space to be missing and stop at `(`: `/<JSFunction ?([^ (]*)/`.',
      },
    ],
  },
  parseGc: {
    optional: true,
    title: 'Parse a --trace-gc line',
    prompt: 'Write `parseGc(line)` for one line of V8 12.4’s `--trace-gc` output. Return `{ ms, type, before, after, pause }`: the time since start (the number before ` ms: `), the collector (`\'Scavenge\'` or `\'Mark-Compact\'`), the object size before and after in MB (the numbers outside the brackets, around `->`), and the pause in ms (the first number after `MB, pooled: … MB, `). All numbers must be numbers. Return `null` for any other line.',
    starter: `function parseGc(line) {
  return null;
}`,
    solution: `function parseGc(line) {
  const m = line.match(
    /(\\d+) ms: ([\\w-]+) ([\\d.]+) /);
  const a = line.match(/-> ([\\d.]+) /);
  const p = line.match(
    /MB, ([\\d.]+) \\//);
  if (!m || !a || !p) return null;
  return {
    ms: Number(m[1]),
    type: m[2],
    before: Number(m[3]),
    after: Number(a[1]),
    pause: Number(p[1]),
  };
}`,
    tests: `// real lines: Node v22.23.4, V8 12.4
const SC = '[27248:0x31074000]       ' +
  '24 ms: Scavenge 4.4 (5.1) -> 3.9 ' +
  '(6.1) MB, pooled: 0 MB, 1.03 / ' +
  '0.00 ms  (average mu = 1.000, ' +
  'current mu = 1.000) allocation ' +
  'failure; ';
const MC = '[27248:0x31074000]      ' +
  '214 ms: Mark-Compact 53.7 (86.2) ' +
  '-> 41.0 (74.2) MB, pooled: 0 MB, ' +
  '44.16 / 0.00 ms  (+ 0.2 ms in 0 ' +
  'steps since start of marking) ' +
  'GC in old space requested';
test('a scavenge', () => {
  expect(parseGc(SC)).toEqual({ ms: 24,
    type: 'Scavenge', before: 4.4,
    after: 3.9, pause: 1.03 });
});
test('a mark-compact', () => {
  const g = parseGc(MC);
  expect(g.type).toBe('Mark-Compact');
  expect(g.before - g.after)
    .toBeCloseTo(12.7);
  expect(g.pause).toBe(44.16);
});
test('other lines', () => {
  expect(parseGc('3000000')).toBe(null);
});`,
    hints: [
      'Use one regular expression per landmark: `ms: ` then the collector and the first size; `-> ` then the size after; `MB, ` then a number then ` /` for the pause.',
      'The collector name contains a hyphen, so use `[\\w-]+`, not `\\w+`.',
      'Convert every captured number with `Number(...)`.',
    ],
    walkthrough: `**How to think about it.** The format of a \`--trace-gc\` line comes from one \`printf\` in V8's \`gc-tracer.cc\`: the time, the collector, the object size (memory size) \`->\` object size (memory size), then the pause. Reading the source tells you what each number is; the regular expressions only have to follow it. Pick one landmark per number: \` ms: \` comes right before the collector and the first size; \`-> \` comes right before the size after; and the pause is the first number after \`MB, \` that is followed by \` /\`.

**The solution, line by line.**

- \`const m = line.match(/(\\d+) ms: ([\\w-]+) ([\\d.]+) /);\` captures three things at once: the digits before \` ms: \` (the time), the collector's name (letters and hyphens, because \`Mark-Compact\` has one), and the first size, digits and dots.
- \`const a = line.match(/-> ([\\d.]+) /);\` captures the size after the arrow.
- \`const p = line.match(/MB, ([\\d.]+) \\//);\` looks for \`MB, \`, a number and \` /\`. It first tries at \`MB, pooled\` and fails (a letter is not a digit), then matches at \`0 MB, 1.03 /\`, which is the pause.
- \`if (!m || !a || !p) return null;\` Any other line is not a GC line.
- The returned object converts every capture with \`Number(...)\`, because the tests compare numbers, not strings.

\`before - after\` is what the collection freed; for the scavenge at 577 ms in the chapter it is zero, because everything survived.

**Common wrong attempts.**

- \`(\\w+)\` for the collector: \`\\w\` does not include \`-\`, so \`Mark-Compact\` is captured as \`Mark\` and the rest of the pattern no longer lines up.
- Forgetting \`Number(...)\`: \`'4.4'\` is not \`4.4\`, and the tests fail even though the text is right.
- Taking the first number after \`MB, \` without the \` /\` after it: on these lines that finds the \`0\` of \`pooled: 0 MB\`, not the pause.`,
    wrong: [
      {
        code: `function parseGc(line) {
  const m = line.match(
    /(\\d+) ms: (\\w+) ([\\d.]+) /);
  const a = line.match(/-> ([\\d.]+) /);
  const p = line.match(
    /MB, ([\\d.]+) \\//);
  if (!m || !a || !p) return null;
  return {
    ms: Number(m[1]),
    type: m[2],
    before: Number(m[3]),
    after: Number(a[1]),
    pause: Number(p[1]),
  };
}`,
        why: 'With `\\w+` the collector of a mark-compact is read as `Mark`, and the rest of the pattern no longer matches. Allow hyphens: `[\\w-]+`.',
      },
    ],
  },
  decodeStatus: {
    title: 'Decode an optimisation status',
    prompt: 'V8 12.4’s `%GetOptimizationStatus(f)` returns a number whose bits each mean one fact; `BITS` lists six of them as `[bit, name]` pairs, in increasing bit order. Write `decodeStatus(s)`, which returns the names of the bits that are set in `s`, in the same order as `BITS`. Bits not in the table are ignored. For example, `decodeStatus(0b10000001)` is `[\'function\', \'interpreted\']`.',
    starter: `const BITS = [
  [0, 'function'],
  [3, 'maybe deopted'],
  [4, 'optimized'],
  [5, 'maglevved'],
  [6, 'turbofanned'],
  [7, 'interpreted'],
];

function decodeStatus(s) {
  return [];
}`,
    solution: `const BITS = [
  [0, 'function'],
  [3, 'maybe deopted'],
  [4, 'optimized'],
  [5, 'maglevved'],
  [6, 'turbofanned'],
  [7, 'interpreted'],
];

function decodeStatus(s) {
  const out = [];
  for (const [bit, name] of BITS) {
    if ((s >> bit) & 1) out.push(name);
  }
  return out;
}`,
    tests: `test('before optimizing', () => {
  expect(decodeStatus(0b10000001))
    .toEqual(['function', 'interpreted']);
});
test('after TurboFan', () => {
  expect(decodeStatus(0b1010001))
    .toEqual(['function', 'optimized',
      'turbofanned']);
});
test('nothing set', () => {
  expect(decodeStatus(0)).toEqual([]);
});
test('unknown bits are ignored', () => {
  expect(decodeStatus((1 << 11) | 1))
    .toEqual(['function']);
});`,
    hints: [
      'Go through `BITS` in order; for each `[bit, name]` pair, ask whether that bit of `s` is 1.',
      'To get bit `k` of `s` on its own, shift it down to the bottom and keep only the last bit: `(s >> k) & 1`.',
      'Start with `const out = [];`, loop `for (const [bit, name] of BITS)`, push `name` when `(s >> bit) & 1` is 1, and return `out`.',
    ],
    walkthrough: `**How to think about it.** A status is a *bit set*: one number in which each binary digit answers one yes-or-no question. Write the first example out: \`0b10000001\` has a 1 in position 0 (counting from the right, starting at 0) and a 1 in position 7, and the table says bit 0 is "function" and bit 7 is "interpreted". So the job is: for each row of the table, test one bit, and collect the names whose bit is 1. Going through \`BITS\` (rather than through the bits of \`s\`) gives the right order and ignores unknown bits for free.

**The solution, line by line.**

- \`const out = [];\` collects the names of the set bits.
- \`for (const [bit, name] of BITS) {\` visits each row of the table in order, unpacking it into the bit number and its name.
- \`if ((s >> bit) & 1) out.push(name);\` \`s >> bit\` shifts the number right by \`bit\` places, so the bit we care about lands in position 0; \`& 1\` keeps only that last bit, giving 1 or 0. If it is 1, the fact is true, so its name goes into the list. For \`0b1010001\` and bit 6: shifting right by 6 gives \`0b1\`, and \`1 & 1\` is 1, so "turbofanned" is added.
- \`return out;\` returns the names in table order.

Bit 11 in the last test is not in the table, so nothing ever looks at it, and only "function" comes out. This is the same arithmetic as the chapter's formula, \`bit(s, k) = (s >> k) & 1\`.

**Common wrong attempts.**

- \`if (s & bit)\`: this ands \`s\` with the bit's *number* rather than its mask. \`s & 0\` is always 0, so "function" is never found, and \`s & 3\` tests bits 0 and 1 together. The mask for bit \`k\` is \`1 << k\`, so \`s & (1 << bit)\` would also work.
- Reading \`s.toString(2)[bit]\`: the string is written with the *highest* bit first, so index 0 is the leftmost digit, not bit 0. It happens to work for \`10000001\`, which reads the same both ways, and fails for \`1010001\`.`,
    wrong: [
      {
        code: `const BITS = [
  [0, 'function'],
  [3, 'maybe deopted'],
  [4, 'optimized'],
  [5, 'maglevved'],
  [6, 'turbofanned'],
  [7, 'interpreted'],
];

function decodeStatus(s) {
  const out = [];
  for (const [bit, name] of BITS) {
    if (s & bit) out.push(name);
  }
  return out;
}`,
        why: '`s & bit` uses the bit number as a mask: `s & 0` is always 0, so `function` is never found. Use `(s >> bit) & 1`, or the mask `1 << bit`.',
      },
      {
        code: `const BITS = [
  [0, 'function'],
  [3, 'maybe deopted'],
  [4, 'optimized'],
  [5, 'maglevved'],
  [6, 'turbofanned'],
  [7, 'interpreted'],
];

function decodeStatus(s) {
  const b = s.toString(2);
  const out = [];
  for (const [bit, name] of BITS) {
    if (b[bit] === '1') out.push(name);
  }
  return out;
}`,
        why: 'The binary string starts with the highest bit, so `b[0]` is the leftmost digit, not bit 0. `1010001` decodes wrongly.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Which flag shows a function’s Ignition bytecode?',
    options: [
      {
        t: '`--trace-opt`',
        why: 'That traces optimised compilation: marking and compiling.',
      },
      {
        t: '`--print-bytecode`, ideally with `--print-bytecode-filter`',
        correct: true,
        why: 'Without the filter, you also get the bytecode of every function Node itself runs.',
      },
      {
        t: '`--trace-deopt`',
        why: 'That traces deoptimisations, though it does give a bytecode offset.',
      },
      {
        t: '`%DebugPrint(fn)` without any flag',
        why: 'Natives need `--allow-natives-syntax`, and DebugPrint shows objects, not a bytecode listing.',
      },
    ],
  },
  {
    q: '`add` was optimised for integers and then called with `0.5`. Which reason does `--trace-deopt` give?',
    options: [
      {
        t: '`hot and stable`',
        why: 'That is the reason `--trace-opt` gives for *marking* it for optimisation.',
      },
      {
        t: '`Insufficient type feedback for call`',
        why: 'That one was the top-level script reaching a call that had never run.',
      },
      {
        t: '`not a Smi`',
        correct: true,
        why: 'The optimised code checked that the argument was a small integer, and `0.5` isn’t one.',
      },
      {
        t: '`overflow`',
        why: 'That appears when an integer result outgrows the Smi range, not for a double argument.',
      },
    ],
  },
  {
    q: 'What does `kind: deopt-eager` mean?',
    options: [
      {
        t: 'A check failed in the optimised code itself, and it deoptimised immediately',
        correct: true,
        why: 'That is V8’s own definition of an eager deopt.',
      },
      {
        t: 'V8 deoptimised before the function was ever optimised',
        why: 'Only optimised code can be deoptimised.',
      },
      {
        t: 'The function will be re-optimised eagerly',
        why: 'The kind says how the deopt happened, not what comes next.',
      },
      {
        t: 'An assumption broke elsewhere and the code will deopt next time it runs',
        why: 'That describes a lazy deopt.',
      },
    ],
  },
  {
    q: 'In a `--trace-gc` line, what is the difference between Scavenge and Mark-Compact?',
    options: [
      {
        t: 'Scavenge collects the young generation; Mark-Compact the whole heap, old generation included',
        correct: true,
        why: 'As V8’s garbage collector explained: a cheap, frequent young collection and a rarer full one.',
      },
      {
        t: 'Scavenge frees memory; Mark-Compact only measures it',
        why: 'Both collect garbage.',
      },
      {
        t: 'They are two names for the same collector',
        why: 'They are different collectors, with different costs.',
      },
      {
        t: 'Mark-Compact runs only when the program ends',
        why: 'In the trace, one ran at 214 ms, while the program was still building its array.',
      },
    ],
  },
  {
    q: 'Why should a tool not depend on parsing V8’s trace output?',
    options: [
      {
        t: 'Because the output is encrypted',
        why: 'It is plain text.',
      },
      {
        t: 'Because it is only printed in debug builds',
        why: 'Everything in this chapter came from a normal Node release.',
      },
      {
        t: 'Because the flags are V8-internal, and their output can change in any version',
        correct: true,
        why: 'They are defined for V8’s developers, version by version. Good for diagnosis; fragile as an interface.',
      },
      {
        t: 'Because Node strips it out',
        why: 'Node passes the flags straight through to V8.',
      },
    ],
  },
  {
    q: 'You call `%HasFastProperties(o)` in a normal `node file.js` run. What happens?',
    options: [
      {
        t: 'It returns `true` or `false`',
        why: 'Only with `--allow-natives-syntax`.',
      },
      {
        t: 'It returns `undefined`',
        why: 'It doesn’t get as far as running.',
      },
      {
        t: 'A warning is printed and the call is skipped',
        why: 'There is no such fallback.',
      },
      {
        t: 'A SyntaxError: `%` calls are not JavaScript',
        correct: true,
        why: 'Natives syntax is a V8 extension, enabled only by the flag.',
      },
    ],
  },
  {
    q: 'An array’s `%DebugPrint` changes from `PACKED_SMI_ELEMENTS` to `PACKED_DOUBLE_ELEMENTS`. What happened?',
    options: [
      {
        t: 'The array became a dictionary',
        why: 'Dictionary mode would show up differently; the elements kind only changed from small integers to doubles.',
      },
      {
        t: 'A double, such as 1.5, was stored in it, so all its elements are now kept as doubles',
        correct: true,
        why: 'Elements kinds only move towards more general kinds; it stays packed because there are still no holes.',
      },
      {
        t: 'An element was deleted',
        why: 'Deleting would leave a hole, making it HOLEY, not DOUBLE.',
      },
      {
        t: 'The garbage collector moved the array',
        why: 'Moving an array does not change its elements kind.',
      },
    ],
  },
  {
    q: 'Why does `%HaveSameMap({ x: 1, y: 2 }, { y: 1, x: 2 })` print `false`?',
    options: [
      {
        t: 'Because the values are different',
        why: 'Maps describe the layout, not the values; `{ x: 1, y: 2 }` and `{ x: 3, y: 4 }` share a map.',
      },
      {
        t: 'Because natives syntax always compares by identity',
        why: '`%HaveSameMap` compares the two objects’ maps, which can be shared.',
      },
      {
        t: 'Because the properties were added in a different order, and a map records that order',
        correct: true,
        why: 'Each order of adding properties is a different path through the transition tree.',
      },
      {
        t: 'Because one of the objects is in dictionary mode',
        why: 'Both are fresh object literals with fast properties.',
      },
    ],
  },
  {
    q: '`%GetOptimizationStatus(add).toString(2)` prints `1010001`. Which facts does it report, by V8 12.4’s bit names?',
    options: [
      {
        t: 'A function, optimised, by TurboFan',
        correct: true,
        why: 'Bits 0, 4 and 6 are set: is a function, optimised, TurboFanned.',
      },
      {
        t: 'A function, interpreted',
        why: 'That is `10000001`: bits 0 and 7.',
      },
      {
        t: 'Optimised by Maglev',
        why: 'Maglev is bit 5, which is clear here (and Maglev is off by default in Node 22).',
      },
      {
        t: 'Marked for deoptimisation',
        why: 'That is bit 14, far to the left of these digits.',
      },
    ],
  },
  {
    q: 'Why should natives syntax stay out of code you ship?',
    options: [
      {
        t: 'It makes every function slower',
        why: 'The cost is not the point; the point is that the code depends on one engine’s private interface.',
      },
      {
        t: 'It only works in browsers',
        why: 'It works in Node with the flag, and not in browsers at all.',
      },
      {
        t: 'It is deprecated JavaScript',
        why: 'It was never JavaScript: it is V8’s own syntax.',
      },
      {
        t: 'It is not JavaScript, needs a V8 flag, and its functions can change or vanish in any V8 version',
        correct: true,
        why: 'Other engines reject it outright, and V8 lists these functions for its own testing.',
      },
    ],
  },
];
