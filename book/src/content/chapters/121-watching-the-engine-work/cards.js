// Chapter 121 cards. Keys are stable ids: never rename them.

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
    a: 'A feedback slot: where this `+` records the types it has seen, for the optimizing tiers.',
  },
  'osr': {
    q: 'Why is the top-level script optimized with “OSR”?',
    a: 'Its loop never returns, so V8 uses on-stack replacement to switch the running loop to optimized code.',
  },
  'eager-lazy': {
    q: 'What is the difference between an eager and a lazy deopt in V8?',
    a: 'Eager: a check failed inside the optimized code, which deoptimizes at once. Lazy: an assumption broke elsewhere, and the code deoptimizes next time it runs.',
  },
  'deopt-offset': {
    q: 'A deopt line says `bytecode offset 2`. How do you find out which operation failed?',
    a: 'Print the function’s bytecode with `--print-bytecode` and look at the instruction at `@ 2`.',
  },
  'natives-flag': {
    q: 'What does `%DebugPrint(o)` do without `--allow-natives-syntax`?',
    a: 'Nothing: the `%` is a SyntaxError, because natives syntax isn’t JavaScript.',
  },
  'fast-props': {
    q: '`%HasFastProperties(p)` turns from `true` to `false` after `delete p.x`. What happened?',
    a: '`p` fell back to dictionary mode: its properties are now kept in a hash table.',
  },
  'generalization': {
    q: 'What does `--trace-generalization` show for a class field declared as `x;` and then given doubles?',
    a: 'The field generalizing from a heap-object field (it held `undefined`) to a generic tagged one, which boxes every double.',
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
    walkthrough: `\`\`\`js
const KIND = /\\(kind: ([^,]+),/;
const REASON = /reason: ([^)]*)\\)/;
const FN = /<JSFunction ?([^ (]*)/;
const CODE = /<Code (\\w+)>/;
const OFF = /bytecode offset (\\d+)/;
\`\`\`

- **One pattern per field.** Each regular expression finds one landmark in the line and captures what follows. Matching fields separately is sturdier than one giant pattern: if V8 adds a field in the middle, the others still parse.
- **Stop at the right bracket.** \`reason: (.*)\\)\` would be *greedy* and run to the last \`)\` on the line, swallowing \`begin. deoptimizing …\`. \`[^)]*\` can't cross a \`)\`.
- **Missing names.** The top-level script prints \`<JSFunction (sfi = …)>\`. \`[^ (]*\` matches nothing there, giving \`''\`.
- **Numbers are numbers.** \`Number(o[1])\` turns \`'2'\` into \`2\`, so you can look the offset up in a \`--print-bytecode\` listing or sort by it.
- **Fragile by nature.** This parser fits V8 12.4's format. Nothing promises that format will last, which is why the chapter labels every trace with its version.`,
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
    walkthrough: `\`\`\`js
const m = line.match(
  /(\\d+) ms: ([\\w-]+) ([\\d.]+) /);
const a = line.match(/-> ([\\d.]+) /);
const p = line.match(/MB, ([\\d.]+) \\//);
\`\`\`

- **The format comes from one \`printf\`** in V8's \`gc-tracer.cc\`: time, collector, object size (memory size) \`->\` object size (memory size), then the pause. Reading the source told you what each number is; the regexes just follow it.
- **\`MB, ([\\d.]+) \\/\`** first tries at \`MB, pooled\` and fails (a letter isn't a digit), then matches at \`0 MB, 1.03 /\`, which is the pause.
- **\`before - after\`** is what the collection freed. For the scavenge at 577 ms in the chapter it is zero: everything survived.`,
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
      { t: '`--trace-opt`', why: 'That traces optimized compilation: marking and compiling.' },
      { t: '`--print-bytecode`, ideally with `--print-bytecode-filter`', correct: true, why: 'Without the filter, you also get the bytecode of every function Node itself runs.' },
      { t: '`--trace-deopt`', why: 'That traces deoptimizations, though it does give a bytecode offset.' },
      { t: '`%DebugPrint(fn)` without any flag', why: 'Natives need `--allow-natives-syntax`, and DebugPrint shows objects, not a bytecode listing.' },
    ],
  },
  {
    q: '`add` was optimized for integers and then called with `0.5`. Which reason does `--trace-deopt` give?',
    options: [
      { t: '`hot and stable`', why: 'That is the reason `--trace-opt` gives for *marking* it for optimization.' },
      { t: '`Insufficient type feedback for call`', why: 'That one was the top-level script reaching a call that had never run.' },
      { t: '`not a Smi`', correct: true, why: 'The optimized code checked that the argument was a small integer, and `0.5` isn’t one.' },
      { t: '`overflow`', why: 'That appears when an integer result outgrows the Smi range, not for a double argument.' },
    ],
  },
  {
    q: 'What does `kind: deopt-eager` mean?',
    options: [
      { t: 'A check failed in the optimized code itself, and it deoptimized immediately', correct: true, why: 'That is V8’s own definition of an eager deopt.' },
      { t: 'V8 deoptimized before the function was ever optimized', why: 'Only optimized code can be deoptimized.' },
      { t: 'The function will be re-optimized eagerly', why: 'The kind says how the deopt happened, not what comes next.' },
      { t: 'An assumption broke elsewhere and the code will deopt next time it runs', why: 'That describes a lazy deopt.' },
    ],
  },
  {
    q: 'You call `%HasFastProperties(o)` in a normal `node file.js` run. What happens?',
    options: [
      { t: 'It returns `true` or `false`', why: 'Only with `--allow-natives-syntax`.' },
      { t: 'It returns `undefined`', why: 'It doesn’t get as far as running.' },
      { t: 'A warning is printed and the call is skipped', why: 'There is no such fallback.' },
      { t: 'A SyntaxError: `%` calls are not JavaScript', correct: true, why: 'Natives syntax is a V8 extension, enabled only by the flag.' },
    ],
  },
  {
    q: 'In a `--trace-gc` line, what is the difference between Scavenge and Mark-Compact?',
    options: [
      { t: 'Scavenge collects the young generation; Mark-Compact the old generation', correct: true, why: 'As chapter 117 explained: a cheap, frequent young collection and a rarer full one.' },
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
