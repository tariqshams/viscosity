// Chapter 183 cards. Keys are stable ids: never rename them.

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
  'osr': {
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
};

export const examples = {};

export const exercises = {
  parseDeopt: {
    title: 'Parse a --trace-deopt line',
    prompt:
      'Write `parseDeopt(line)`. If `line` is a V8 bailout line (it contains `(kind: ` and `reason: `), return `{ kind, reason, fn, tier, offset }`: the kind (e.g. `\'deopt-eager\'`), the reason text up to its closing `)`, the function name after `<JSFunction ` (`\'\'` for the nameless top-level script), the tier in `<Code …>` (e.g. `\'TURBOFAN\'`), and the bytecode offset as a **number**. For any other line return `null`. Regular expressions with `line.match(/…(…)…/)` are the easiest tool: the part in brackets is captured as `m[1]`.',
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
    prompt:
      'Write `parseGc(line)` for one line of V8 12.4’s `--trace-gc` output. Return `{ ms, type, before, after, pause }`: the time since start (the number before ` ms: `), the collector (`\'Scavenge\'` or `\'Mark-Compact\'`), the object size before and after in MB (the numbers outside the brackets, around `->`), and the pause in ms (the first number after `MB, pooled: … MB, `). All numbers must be numbers. Return `null` for any other line.',
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
};

export const quiz = [
  {
    q: 'Which flag shows a function’s Ignition bytecode?',
    options: [
      { t: '`--trace-opt`', why: 'That traces optimised compilation: marking and compiling.' },
      { t: '`--print-bytecode`, ideally with `--print-bytecode-filter`', correct: true, why: 'Without the filter, you also get the bytecode of every function Node itself runs.' },
      { t: '`--trace-deopt`', why: 'That traces deoptimisations, though it does give a bytecode offset.' },
      { t: '`%DebugPrint(fn)` without any flag', why: 'Natives need `--allow-natives-syntax`, and DebugPrint shows objects, not a bytecode listing.' },
    ],
  },
  {
    q: '`add` was optimised for integers and then called with `0.5`. Which reason does `--trace-deopt` give?',
    options: [
      { t: '`hot and stable`', why: 'That is the reason `--trace-opt` gives for *marking* it for optimisation.' },
      { t: '`Insufficient type feedback for call`', why: 'That one was the top-level script reaching a call that had never run.' },
      { t: '`not a Smi`', correct: true, why: 'The optimised code checked that the argument was a small integer, and `0.5` isn’t one.' },
      { t: '`overflow`', why: 'That appears when an integer result outgrows the Smi range, not for a double argument.' },
    ],
  },
  {
    q: 'What does `kind: deopt-eager` mean?',
    options: [
      { t: 'A check failed in the optimised code itself, and it deoptimised immediately', correct: true, why: 'That is V8’s own definition of an eager deopt.' },
      { t: 'V8 deoptimised before the function was ever optimised', why: 'Only optimised code can be deoptimised.' },
      { t: 'The function will be re-optimised eagerly', why: 'The kind says how the deopt happened, not what comes next.' },
      { t: 'An assumption broke elsewhere and the code will deopt next time it runs', why: 'That describes a lazy deopt.' },
    ],
  },
  {
    q: 'In a `--trace-gc` line, what is the difference between Scavenge and Mark-Compact?',
    options: [
      { t: 'Scavenge collects the young generation; Mark-Compact the whole heap, old generation included', correct: true, why: 'As V8’s garbage collector explained: a cheap, frequent young collection and a rarer full one.' },
      { t: 'Scavenge frees memory; Mark-Compact only measures it', why: 'Both collect garbage.' },
      { t: 'They are two names for the same collector', why: 'They are different collectors, with different costs.' },
      { t: 'Mark-Compact runs only when the program ends', why: 'In the trace, one ran at 214 ms, while the program was still building its array.' },
    ],
  },
  {
    q: 'Why should a tool not depend on parsing V8’s trace output?',
    options: [
      { t: 'Because the output is encrypted', why: 'It is plain text.' },
      { t: 'Because it is only printed in debug builds', why: 'Everything in this chapter came from a normal Node release.' },
      { t: 'Because the flags are V8-internal, and their output can change in any version', correct: true, why: 'They are defined for V8’s developers, version by version. Good for diagnosis; fragile as an interface.' },
      { t: 'Because Node strips it out', why: 'Node passes the flags straight through to V8.' },
    ],
  },
];
