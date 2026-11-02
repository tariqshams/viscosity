// Chapter 140 cards. Keys are stable ids: never rename them.

export const prompts = {
  'why-tags': {
    q: 'Why does every value in a dynamically typed VM need a type tag?',
    a: 'The compiler does not know the kinds ahead of time, so each instruction must check at run time, for example that `neg` really has a number.',
  },
  'none-payload': {
    q: 'What payload does Drip’s `none` need?',
    a: 'None at all: the tag alone says everything.',
  },
  'obj-payload': {
    q: 'What is the payload of an object value, such as a string or a list?',
    a: 'A reference: the address of the object on the heap.',
  },
  'equal-mixed': {
    q: 'What does `print none == false;` print in Drip, and why?',
    a: '`false`: the tags differ (none and bool), so the values are unequal. It is not an error.',
  },
  'negate-check': {
    q: 'What exactly does the VM report for `print -"a";`?',
    a: '`runtime error: cannot negate a string`, because `neg` checks the tag before touching the payload.',
  },
  'ts-value': {
    q: 'The companion VM’s `Value` is `null | boolean | number | Obj`. Where is the tag?',
    a: 'In JavaScript itself: every JS value already knows its type, and the VM asks with `typeof` (and `=== null` for none).',
  },
  'boxing-cost': {
    q: 'Why not represent every value as a `{ tag, as }` object in a VM written in JavaScript?',
    a: 'Every result, even `1 + 2`, would allocate a new object, and every read would follow a reference to reach the payload.',
  },
  'minus-zero': {
    q: 'Why does `formatNumber` check for `-0` before calling `String`?',
    a: '`String(-0)` is `"0"`, but Drip prints negative zero as `-0`.',
  },
};

export const examples = {
  'drip-values': {
    title: 'Drip on the VM: tags in action',
    lang: 'drip-vm',
    expectError: true,
    code: `print none;
print true;
print 3 + 0.5;
print -0;
print 0 / 0;
print 1 == "1";
print none == false;
print !none;
print !0;
print -"tea";`,
  },
};

const helpers = `const none = { tag: 'none' };
const bool = (as) =>
  ({ tag: 'bool', as });
const num = as => ({ tag: 'num', as });`;

export const exercises = {
  tagEquality: {
    title: 'Equality and truthiness, tags first',
    prompt:
      'Values are tagged objects: `{ tag: \'none\' }`, `{ tag: \'bool\', as }` or `{ tag: \'num\', as }`. Write `isFalsey(v)`, true only for none and for the boolean false, and `valuesEqual(a, b)`, true when the tags match and the payloads are `===`. Two nones are always equal.',
    starter: `${helpers}

function isFalsey(v) {
  return false;
}

function valuesEqual(a, b) {
  return a === b;
}`,
    solution: `${helpers}

function isFalsey(v) {
  if (v.tag === 'none') return true;
  return v.tag === 'bool' && !v.as;
}

function valuesEqual(a, b) {
  if (a.tag !== b.tag) return false;
  if (a.tag === 'none') return true;
  return a.as === b.as;
}`,
    tests: `test('none and false are falsey', () => {
  expect(isFalsey(none)).toBe(true);
  expect(isFalsey(bool(false))).toBe(true);
});
test('everything else is truthy', () => {
  expect(isFalsey(bool(true))).toBe(false);
  expect(isFalsey(num(0))).toBe(false);
});
test('same tag, same payload', () => {
  expect(valuesEqual(num(1), num(1))).toBe(true);
  expect(valuesEqual(bool(true), bool(true))).toBe(true);
  expect(valuesEqual(none, { tag: 'none' })).toBe(true);
});
test('same tag, different payload', () => {
  expect(valuesEqual(num(1), num(2))).toBe(false);
});
test('different tags are never equal', () => {
  expect(valuesEqual(num(0), bool(false))).toBe(false);
  expect(valuesEqual(none, bool(false))).toBe(false);
});`,
    hints: [
      'Try `valuesEqual(num(1), num(1))` with the starter: it says false. Why? What does `===` compare when both sides are objects?',
      'Compare `a.tag` and `b.tag` first; only when they match do the payloads matter. none has no `as`, so handle it by its tag alone.',
      'For `isFalsey`, a value is falsey when its tag is `none`, or when its tag is `bool` and its payload is `false`; every number, even `num(0)`, is truthy.',
    ],
    walkthrough: `**How to think about it.** Each value here is a little object, and the starter’s \`a === b\` compares the *objects*, not what they stand for: \`num(1)\` makes a new object every time it is called, so two of them are never the same object, and the starter says \`1\` is not equal to \`1\`. The fix is to do what a VM instruction does: read the tags first, and only look inside when the tags agree. Truthiness is the same idea in one value: the tag decides, and the payload matters only for a boolean.

**The solution, line by line.**

- \`function isFalsey(v) {\` takes one tagged value.
- \`  if (v.tag === 'none') return true;\` handles none by its tag alone, because none has no payload to look at.
- \`  return v.tag === 'bool' && !v.as;\` is true only for a boolean whose payload is \`false\`. For a number the first half is already false, so \`num(0)\` is truthy, which is Drip’s rule (and not JavaScript’s, where \`0\` is falsey).
- \`function valuesEqual(a, b) {\` takes two tagged values.
- \`  if (a.tag !== b.tag) return false;\` is Drip’s rule that values of different kinds are never equal, whatever their payloads look like.
- \`  if (a.tag === 'none') return true;\` covers two nones: same tag, nothing more to compare.
- \`  return a.as === b.as;\` compares the payloads, now that we know they are the same kind, so \`===\` on two numbers or two booleans is exactly right.

**Common wrong attempts.**

- \`return !v.as;\` for truthiness makes \`num(0)\` falsey, the JavaScript rule rather than Drip’s, and it says \`none\` is falsey only by accident (its \`as\` is \`undefined\`).
- \`return a.as == b.as;\` with loose \`==\` says \`0 == false\`, so a number equals a boolean; checking the tag first rules that out.
- Forgetting none in \`isFalsey\`: \`none\` has tag \`'none'\`, not \`'bool'\`, so \`v.tag === 'bool' && !v.as\` alone says none is truthy.

This is the logic the companion VM gets for free from JavaScript: its values are primitives, so its \`valuesEqual\` is the single expression \`a === b\`, and its \`isFalsey\` is \`v === null || v === false\`.`,
    wrong: [
      {
        code: `${helpers}

function isFalsey(v) {
  return !v.as;
}

function valuesEqual(a, b) {
  return a.as == b.as;
}`,
        why: '`!v.as` makes `num(0)` falsey (JavaScript’s rule, not Drip’s), and loose `==` says `0 == false`, so a number equals a boolean. Check the tag first.',
      },
      {
        code: `${helpers}

function isFalsey(v) {
  return v.tag === 'bool' && !v.as;
}

function valuesEqual(a, b) {
  if (a.tag !== b.tag) return false;
  if (a.tag === 'none') return true;
  return a.as === b.as;
}`,
        why: 'Equality is right, but `isFalsey` forgets none, so `isFalsey(none)` is false. Both none and false are falsey in Drip.',
      },
    ],
  },
  tagFormat: {
    optional: true,
    title: 'Printing a tagged value',
    prompt:
      'Write `format(v)` for the same tagged values, the way Drip prints them: none prints as `none`, booleans as `true` or `false`, and numbers as JavaScript would, except that negative zero prints as `-0` and NaN prints as `nan`.',
    starter: `${helpers}

function format(v) {
  return String(v.as);
}`,
    solution: `${helpers}

function format(v) {
  if (v.tag === 'none') return 'none';
  const x = v.as;
  if (Number.isNaN(x)) return 'nan';
  if (Object.is(x, -0)) return '-0';
  return String(x);
}`,
    tests: `test('none', () => {
  expect(format(none)).toBe('none');
});
test('booleans', () => {
  expect(format(bool(true))).toBe('true');
  expect(format(bool(false))).toBe('false');
});
test('numbers', () => {
  expect(format(num(3.5))).toBe('3.5');
  expect(format(num(0))).toBe('0');
});
test('negative zero', () => {
  expect(format(num(-0))).toBe('-0');
});
test('nan', () => {
  expect(format(num(0 / 0))).toBe('nan');
});`,
    hints: [
      'With the starter, `format(none)` gives `"undefined"`. Which part of the value tells you it is none?',
      '`-0 === 0` is true, so `===` cannot spot negative zero, but `Object.is(x, -0)` can. For NaN, use `Number.isNaN`.',
      'Order: check the none tag first, then NaN, then `-0`, and hand everything else to `String`.',
    ],
    walkthrough: `**How to think about it.** Printing is one more instruction that reads the tag first. none has no payload, so it must be handled by its tag before anything touches \`v.as\`; after that, \`String\` gets nearly every number and both booleans right, and only two numbers need Drip’s own spelling: NaN (JavaScript says \`"NaN"\`) and negative zero (JavaScript says \`"0"\`).

**The solution, line by line.**

- \`if (v.tag === 'none') return 'none';\` decides the none case by its tag.
- \`const x = v.as;\` names the payload, a boolean or a number from here on.
- \`if (Number.isNaN(x)) return 'nan';\` catches NaN; \`x === NaN\` would never be true, because NaN is not equal to anything, itself included.
- \`if (Object.is(x, -0)) return '-0';\` catches negative zero; \`x === -0\` would also be true for ordinary \`0\`, and print every zero as \`-0\`.
- \`return String(x);\` handles the rest: \`String(true)\` is \`"true"\` and \`String(3.5)\` is \`"3.5"\`.

**Common wrong attempts.**

- \`if (v.as === -0)\` prints \`0\` as \`-0\`, because \`0 === -0\` is true.
- Leaving out the none check prints \`undefined\`, since none has no \`as\`.

The companion’s own \`formatNumber\` in \`runtime.ts\` follows the same plan, and also spells the infinities \`inf\` and \`-inf\`.`,
    wrong: [
      {
        code: `${helpers}

function format(v) {
  if (v.tag === 'none') return 'none';
  if (Number.isNaN(v.as)) return 'nan';
  if (v.as === -0) return '-0';
  return String(v.as);
}`,
        why: '`0 === -0` is true, so this prints `0` as `-0`. Use `Object.is(v.as, -0)`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Why must a Drip VM keep a type tag with each value at run time?',
    options: [
      { t: 'Because Drip is dynamically typed: the compiler does not know the kinds, so instructions check them as they run', correct: true, why: 'Only the value itself can say what it is, at the moment an instruction needs to know.' },
      { t: 'To make the bytecode shorter', why: 'Tags live in values on the stack, not in the instructions.' },
      { t: 'Because the heap needs it to find numbers', why: 'Numbers are not heap objects in the companion VM, so nothing on the heap looks for them.' },
      { t: 'It does not: every Drip value is a number underneath', why: 'none, booleans, strings and lists are distinct kinds of value, and instructions treat them differently.' },
    ],
  },
  {
    q: 'What does `print 1 == "1";` print on the Drip VM?',
    options: [
      { t: '`true`', why: 'That would be JavaScript’s loose `==`. Drip compares tags first.' },
      { t: 'A runtime error', why: 'Equality never fails. Only arithmetic and comparison operators insist on particular kinds.' },
      { t: '`false`', correct: true, why: 'The tags differ (number and string), so the values are unequal.' },
      { t: '`none`', why: '`==` always produces a boolean.' },
    ],
  },
  {
    q: 'The companion VM’s value type is `null | boolean | number | Obj`. How does its `neg` instruction check for a number?',
    options: [
      { t: 'By reading a `tag` field on the value', why: 'Primitive values have no `tag` field; only heap objects have a `type` field.' },
      { t: 'By looking the value up in the constant pool', why: 'The constant pool holds literals, and has nothing to say about kinds at run time.' },
      { t: 'It does not check: it negates whatever is there', why: 'It checks, and reports `cannot negate a string` (or whatever kind it found).' },
      { t: '`typeof v !== \'number\'`', correct: true, why: 'JavaScript values carry their own type, so the VM reads that tag directly.' },
    ],
  },
  {
    q: 'Which values are falsey in Drip?',
    options: [
      { t: '`none`, `false`, `0` and `""`', why: 'That is closer to JavaScript. In Drip, `0` and `""` are truthy.' },
      { t: 'Only `none` and `false`', correct: true, why: 'The rule is about tags: none, or a bool whose payload is false.' },
      { t: 'Only `false`', why: 'none is falsey too.' },
      { t: 'Anything whose payload is all zero bits', why: 'Truthiness is defined by tag, not by the bits of the payload.' },
    ],
  },
  {
    q: 'Why would wrapping every value in a `{ tag, as }` object be slow in a VM written in JavaScript?',
    options: [
      { t: 'Because objects cannot hold numbers', why: 'They can. The problem is how many of them you would make.' },
      { t: 'Every arithmetic result would be a new object to allocate, and every read would follow a reference', correct: true, why: 'Like HeapNumbers, but for every value. Plain primitives avoid both costs.' },
      { t: 'Because TypeScript cannot narrow on a `tag` field', why: 'It can: that is a tagged union.' },
      { t: 'Because the stack can only hold primitives', why: 'A JavaScript array can hold any value, objects included.' },
    ],
  },
];
