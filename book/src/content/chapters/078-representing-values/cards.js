// Chapter 78 cards. Keys are stable ids: never rename them.

export const prompts = {
  'why-tags': {
    q: 'Why does every value in a dynamically typed VM need a type tag?',
    a: 'The compiler doesn’t know the types, so each instruction must check at runtime, for example that `OP_NEGATE` really has a number.',
  },
  'tag-payload': {
    q: 'What are the two parts of a tagged value?',
    a: 'A tag saying its type, and a payload holding the data.',
  },
  'nil-payload': {
    q: 'What payload does `nil` need?',
    a: 'None. The tag alone says everything.',
  },
  'obj-payload': {
    q: 'What is the payload of an object value, such as a string?',
    a: 'A reference: the address of the object on the heap.',
  },
  'equal-tags': {
    q: 'When comparing two tagged values for equality, what is checked first?',
    a: 'Their tags. Different tags means unequal, without looking at the payloads.',
  },
  'equal-mixed': {
    q: 'What does `print nil == false;` print in Drip, and why?',
    a: '`false`: the tags differ (nil and bool), so the values are unequal. It is not an error.',
  },
  'negate-check': {
    q: 'What happens when the VM runs `-"a"`?',
    a: 'A runtime error, `Operand must be a number.`: `OP_NEGATE` checks the tag first.',
  },
  'ts-value': {
    q: 'The companion VM’s `Value` is `null | boolean | number | Obj`. Where is the tag?',
    a: 'In JavaScript itself: every JS value already knows its type, and the VM asks with `typeof` and `=== null`.',
  },
  'boxing-cost': {
    q: 'Why not represent every value as a `{ tag, as }` object in a JS-hosted VM?',
    a: 'Every result, even `1 + 2`, would allocate a new object, and every read would follow a reference.',
  },
  'minus-zero': {
    q: 'Why does `formatNumber` special-case `-0`?',
    a: '`String(-0)` is `"0"`, but Drip prints negative zero as `-0`.',
  },
};

export const examples = {
  tagged: {
    title: 'Tags you can see',
    code: `const nil = { tag: 'nil' };
const num = as => ({ tag: 'num', as });
const str = as => ({ tag: 'obj', as });

function negate(v) {
  if (v.tag !== 'num') {
    return 'Operand must be a number.';
  }
  return num(-v.as);
}

console.log(negate(num(3)));
console.log(negate(str('a')));
console.log(negate(nil));`,
  },
  'drip-values': {
    title: 'Drip on the VM: tags in action',
    lang: 'drip-vm',
    expectError: true,
    code: `print nil;
print true;
print 3 + 0.5;
print -0;
print 1 == "1";
print nil == false;
print !nil;
print !0;
print -"a";`,
  },
};

const helpers = `const nil = { tag: 'nil' };
const bool = (as) =>
  ({ tag: 'bool', as });
const num = as => ({ tag: 'num', as });`;

export const exercises = {
  tagEquality: {
    title: 'Equality and truthiness, tags first',
    prompt:
      'Values are tagged objects: `{ tag: \'nil\' }`, `{ tag: \'bool\', as }` or `{ tag: \'num\', as }`. Write `isFalsey(v)`, true only for nil and for the boolean false, and `valuesEqual(a, b)`, true when the tags match and the payloads are `===`. Two nils are always equal.',
    starter: `${helpers}

function isFalsey(v) {
  return false;
}

function valuesEqual(a, b) {
  return a === b;
}`,
    solution: `${helpers}

function isFalsey(v) {
  if (v.tag === 'nil') return true;
  return v.tag === 'bool' && !v.as;
}

function valuesEqual(a, b) {
  if (a.tag !== b.tag) return false;
  if (a.tag === 'nil') return true;
  return a.as === b.as;
}`,
    tests: `test('nil and false are falsey', () => {
  expect(isFalsey(nil)).toBe(true);
  expect(isFalsey(bool(false))).toBe(true);
});
test('everything else is truthy', () => {
  expect(isFalsey(bool(true))).toBe(false);
  expect(isFalsey(num(0))).toBe(false);
});
test('same tag, same payload', () => {
  expect(valuesEqual(num(1), num(1))).toBe(true);
  expect(valuesEqual(bool(true), bool(true))).toBe(true);
  expect(valuesEqual(nil, { tag: 'nil' })).toBe(true);
});
test('same tag, different payload', () => {
  expect(valuesEqual(num(1), num(2))).toBe(false);
});
test('different tags are never equal', () => {
  expect(valuesEqual(num(0), bool(false))).toBe(false);
  expect(valuesEqual(nil, bool(false))).toBe(false);
});`,
    hints: [
      '`a === b` compares the two wrapper objects, and `num(1)` makes a new object every time. You need to look inside.',
      'For `valuesEqual`, compare `a.tag` and `b.tag` first. Only when they match do the payloads matter.',
      'nil has no `as`, so handle it by tag. For truthiness, a value is falsey if its tag is nil, or its tag is bool and its payload is false.',
    ],
    walkthrough: `\`\`\`js
function isFalsey(v) {
  if (v.tag === 'nil') return true;
  return v.tag === 'bool' && !v.as;
}

function valuesEqual(a, b) {
  if (a.tag !== b.tag) return false;
  if (a.tag === 'nil') return true;
  return a.as === b.as;
}
\`\`\`

- **Tags first.** \`num(0)\` and \`bool(false)\` have payloads that JavaScript’s loose \`==\` would call equal. Checking the tag first states Drip’s rule directly: different types are never equal, whatever the payloads look like. (With strict \`===\` on these payloads you’d get away without it, but only because JavaScript is checking types for you.)
- **nil by tag.** nil has no payload, so two nils are equal because of their tag alone.
- **Truthiness by tag.** \`!v.as\` on its own would make \`num(0)\` falsey, the JavaScript rule. Drip’s rule is narrower: only nil and false.
- **\`===\` on payloads**, never on wrappers: each \`num(1)\` is a new object, so \`a === b\` is false even for equal numbers.

This is the logic the companion VM gets for free from JavaScript: its values are primitives, so plain \`===\` does all three steps at once.`,
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
  if (a.tag === 'nil') return true;
  return a.as === b.as;
}`,
        why: 'Equality is right, but `isFalsey` forgets nil, so `isFalsey(nil)` is false. Both nil and false are falsey in Drip.',
      },
    ],
  },
  tagFormat: {
    optional: true,
    title: 'Printing a tagged value',
    prompt:
      'Write `format(v)` for the same tagged values. nil prints as `nil`, booleans as `true` or `false`, and numbers as JavaScript would, except that negative zero prints as `-0`.',
    starter: `${helpers}

function format(v) {
  return String(v.as);
}`,
    solution: `${helpers}

function format(v) {
  if (v.tag === 'nil') return 'nil';
  if (Object.is(v.as, -0)) return '-0';
  return String(v.as);
}`,
    tests: `test('nil', () => {
  expect(format(nil)).toBe('nil');
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
});`,
    hints: [
      'nil has no payload, so `String(v.as)` gives `"undefined"`. Check the tag.',
      '`-0 === 0` is true, so `===` can’t spot negative zero. `Object.is` can.',
    ],
    walkthrough: `\`\`\`js
function format(v) {
  if (v.tag === 'nil') return 'nil';
  if (Object.is(v.as, -0)) return '-0';
  return String(v.as);
}
\`\`\`

The tag decides the nil case. For numbers, \`String\` is right except for \`-0\`: \`String(-0)\` is \`"0"\`, and \`-0 === 0\` is true, so only \`Object.is\` tells them apart. Booleans need nothing special: \`String(true)\` is \`"true"\`. The companion VM’s \`formatValue\` follows the same plan, with a \`switch\` on the object type for heap objects.`,
    wrong: [
      {
        code: `${helpers}

function format(v) {
  if (v.tag === 'nil') return 'nil';
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
    q: 'Why must a Drip VM keep a type tag with each value at runtime?',
    options: [
      { t: 'Because Drip is dynamically typed: the compiler doesn’t know types, so instructions check them as they run', correct: true, why: 'Only the value itself can say what it is, at the moment an instruction needs to know.' },
      { t: 'To make the bytecode shorter', why: 'Tags live in values on the stack, not in the instructions.' },
      { t: 'Because the garbage collector needs it to find numbers', why: 'Numbers aren’t heap objects, so the collector never looks for them.' },
      { t: 'It doesn’t: every Drip value is a number underneath', why: 'nil, booleans and strings are distinct kinds of value, and instructions treat them differently.' },
    ],
  },
  {
    q: 'What does `print 1 == "1";` print on the Drip VM?',
    options: [
      { t: '`true`', why: 'That would be JavaScript’s loose `==`. Drip compares types first.' },
      { t: 'A runtime error', why: 'Equality never fails. Only arithmetic and comparison operators check for numbers.' },
      { t: '`false`', correct: true, why: 'The tags differ (number and string), so the values are unequal.' },
      { t: '`nil`', why: '`==` always produces a boolean.' },
    ],
  },
  {
    q: 'In a tagged value for `nil`, what is the payload?',
    options: [
      { t: 'The number 0', why: 'That would make nil look like a number. nil carries no data.' },
      { t: 'A reference to a shared nil object on the heap', why: 'nil needs no heap object. The tag is enough.' },
      { t: 'The string "nil"', why: 'That is how it prints, not how it is stored.' },
      { t: 'Nothing: the tag alone says it is nil', correct: true, why: 'There is only one nil, so the tag carries all the information.' },
    ],
  },
  {
    q: 'The companion VM’s value type is `null | boolean | number | Obj`. How does `OP_NEGATE` check for a number?',
    options: [
      { t: '`typeof v !== \'number\'`', correct: true, why: 'JavaScript values carry their own type, so the VM reads that tag directly.' },
      { t: 'By reading a `tag` field on the value', why: 'Primitive values have no `tag` field. Only heap objects have a `type` field.' },
      { t: 'By looking the value up in the constant pool', why: 'The constant pool holds literals, and has nothing to say about types at runtime.' },
      { t: 'It doesn’t check: it negates whatever is there', why: 'It checks, and reports `Operand must be a number.`' },
    ],
  },
  {
    q: 'Which values are falsey in Drip?',
    options: [
      { t: '`nil`, `false`, `0` and `""`', why: 'That is closer to JavaScript. In Drip, `0` and `""` are truthy.' },
      { t: 'Only `nil` and `false`', correct: true, why: 'The rule is about tags: nil, or a bool whose payload is false.' },
      { t: 'Only `false`', why: 'nil is falsey too.' },
      { t: 'Anything whose payload is zero bits', why: 'Truthiness is defined by tag, not by the bits of the payload.' },
    ],
  },
  {
    q: 'Why would wrapping every value in a `{ tag, as }` object be slow in a VM written in JavaScript?',
    options: [
      { t: 'Because objects can’t hold numbers', why: 'They can. The problem is how many of them you’d make.' },
      { t: 'Because TypeScript can’t narrow on a `tag` field', why: 'It can: that is a discriminated union.' },
      { t: 'Every arithmetic result would be a new object to allocate, and every read would follow a reference', correct: true, why: 'Like chapter 31’s HeapNumbers, but for every value. Plain primitives avoid both costs.' },
      { t: 'Because the stack can only hold primitives', why: 'A JavaScript array can hold any value, objects included.' },
    ],
  },
];
