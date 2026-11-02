// Chapter 45 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'alias-only': {
    q: 'With `type ValueId = number` and `type BlockId = number`, does the checker stop you passing a `ValueId` where a `BlockId` is wanted?',
    a: 'No. Aliases are only other names: both are exactly `number`.',
  },
  structural: {
    q: 'What is structural typing?',
    a: 'Comparing types by their structure (shape and members), not by their names; same structure means same type.',
  },
  'intersection-what': {
    q: 'What does the intersection type `A & B` mean?',
    a: 'A value that is an `A` and a `B` at the same time, with everything both require.',
  },
  'as-what': {
    q: 'What does `x as BlockId` check while the program runs?',
    a: 'Nothing. A type assertion only tells the checker to trust you, and it is erased with the types.',
  },
  'brand-arith': {
    q: 'If `b` is a `BlockId`, what is the type of `b + 1`?',
    a: 'Plain `number`: arithmetic drops the brand, so you re-stamp through the checking function if you need one.',
  },
  receipt: {
    q: 'Why can a function that takes a `Port` skip checking the range?',
    a: 'The only way to make a `Port` is the checking function, so holding one is a receipt that the check happened.',
  },
  'as-one-place': {
    q: 'Where should `as Port` appear in a program, and why?',
    a: 'Only inside the one checking function: anywhere else it would forge a receipt without doing the check.',
  },
  'brand-erased-q': {
    q: 'What does a `BlockId` cost while the program runs?',
    a: 'Nothing: after erasure it is the plain number, so `typeof` says `\'number\'` and it still works as an array index.',
  },
  'outside-data': {
    q: 'A `Port` is saved to a JSON file and read back with `JSON.parse`. Is it still a `Port`?',
    a: 'Not as far as anything knows: it arrives as a plain number, so it must go through the checking function again.',
  },
};

export const examples = {
  'brand-erased': {
    lang: 'ts',
    title: 'A brand leaves no trace',
    code: `type BlockId = number &
  { readonly __brand: 'BlockId' };

function blockId(n: number): BlockId {
  return n as BlockId;
}

const names = ['entry', 'loop', 'exit'];
const b = blockId(1);
console.log(typeof b);
console.log(b === 1);
console.log(names[b]);
console.log(b + 1);`,
  },
};

export const exercises = {
  toPort: {
    lang: 'ts',
    title: 'From text to a checked port',
    prompt: 'Write `toPort(s)` that turns text from a settings file into a branded `Port`. The text must be one or more digits `0` to `9` and nothing else (no spaces, signs or decimal points; leading zeros are allowed, so `\'0080\'` is 80), and its value must be from 1 to 65535. Otherwise **throw** an `Error`. Work the value out digit by digit with `charCodeAt`, as in the strings chapters, and stamp it with `as Port` only at the end.',
    starter: `type Port = number &
  { readonly __brand: 'Port' };

function toPort(s: string): Port {
  // your code here
  return 0 as Port;
}

console.log(toPort('8080'));`,
    solution: `type Port = number &
  { readonly __brand: 'Port' };

function toPort(s: string): Port {
  if (s.length === 0) {
    throw new Error('empty port');
  }
  let n = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c < 48 || c > 57) {
      throw new Error('not a digit');
    }
    n = n * 10 + (c - 48);
  }
  if (n < 1 || n > 65535) {
    throw new Error('out of range');
  }
  return n as Port;
}`,
    tests: `test('8080', () => {
  expect(toPort('8080')).toBe(8080);
});
test('the smallest and largest ports', () => {
  expect(toPort('1')).toBe(1);
  expect(toPort('65535')).toBe(65535);
});
test('leading zeros are allowed', () => {
  expect(toPort('0080')).toBe(80);
});
test('0 and 65536 are out of range', () => {
  expect(() => toPort('0')).toThrow();
  expect(() => toPort('65536')).toThrow();
});
test('empty text is refused', () => {
  expect(() => toPort('')).toThrow();
});
test('letters, signs and points are refused', () => {
  expect(() => toPort('80a')).toThrow();
  expect(() => toPort('-1')).toThrow();
  expect(() => toPort('8.5')).toThrow();
});
test('spaces are refused', () => {
  expect(() => toPort(' 80')).toThrow();
});
test('a huge number is refused', () => {
  expect(() => toPort('99999999999')).toThrow();
});`,
    hints: [
      'Three things can be wrong: the text is empty, a character is not a digit, or the value is out of range. Check each, and `throw` for it.',
      'Loop over the characters. A digit has a char code from 48 to 57, and its value is the code minus 48. Build the number with `n = n * 10 + digit`.',
      'After the loop, check `n < 1 || n > 65535`. Only then `return n as Port;`.',
    ],
    walkthrough: `**How to think about it.** This is a border function: loose input (any string at all) on one side, a precise type (\`Port\`) on the other. Everything that is not a port must be refused here, because the rest of the program will trust any \`Port\` it is handed without checking. So start by listing what can be wrong: no characters at all; a character that is not a digit (a letter, a space, a minus sign, a decimal point); or a value outside 1 to 65535. Then check them in that order, and only when all have passed, stamp the brand.

It is tempting to use \`Number(s)\`, however \`Number\` is far too forgiving for a border: \`Number(' 80')\` is 80 (it ignores spaces), \`Number('8.5')\` is 8.5, and \`Number('')\` is 0. Working the value out digit by digit, as in the strings chapters, means you decide exactly what is allowed.

**The solution, line by line.**

- \`type Port = number &\` and \`  { readonly __brand: 'Port' };\` declare the brand: a number intersected with a property no real number has.
- \`function toPort(s: string): Port {\` is the signature: string in, \`Port\` out. Because \`Port\` cannot be made any other way, this function is the only door.
- \`  if (s.length === 0) {\` and \`    throw new Error('empty port');\` refuse the empty string. Without this, the loop below would not run, \`n\` would stay 0, and the range check would refuse it anyway; checking first gives a clearer message.
- \`  let n = 0;\` starts the value at zero.
- \`  for (let i = 0; i < s.length; i++) {\` visits each character by index.
- \`    const c = s.charCodeAt(i);\` reads the character's code: \`'0'\` is 48 and \`'9'\` is 57.
- \`    if (c < 48 || c > 57) {\` is true for anything that is not a digit, and \`      throw new Error('not a digit');\` refuses it. That one test covers letters, spaces, \`-\` and \`.\`.
- \`    n = n * 10 + (c - 48);\` shifts the value so far one decimal place left and adds this digit: for \`'8080'\` the value goes 8, 80, 808, 8080. Leading zeros cost nothing: \`'0080'\` goes 0, 0, 8, 80.
- \`  if (n < 1 || n > 65535) {\` and \`    throw new Error('out of range');\` refuse 0 and anything too big, including \`'99999999999'\` (whose value is large but still exact enough to compare).
- \`  return n as Port;\` stamps the brand, and this is the only \`as Port\` in the program. It is safe here because every line above has already done the checking that \`as\` itself never does.

After erasure the function is an ordinary checking loop that returns a number; the brand cost nothing at run time, and it makes the checker refuse \`listen(8080)\` with a plain number anywhere else in the program.

**Common wrong attempts.**

- \`const n = Number(s);\` followed by a range check accepts \`' 80'\` and \`'8.5'\`, and for \`'80a'\` gives \`NaN\`, which fails *both* comparisons (\`NaN < 1\` and \`NaN > 65535\` are false), so \`NaN\` is returned as a "port".
- \`parseInt(s)\` stops quietly at the first non-digit, so \`'80a'\` becomes 80.
- Putting \`as Port\` first and checking afterwards (or not at all) gives the same type with no receipt behind it.`,
    wrong: [
      {
        code: `function toPort(s) {
  const n = Number(s);
  if (n < 1 || n > 65535) {
    throw new Error('out of range');
  }
  return n;
}`,
        why: '`Number` accepts `\' 80\'` and `\'8.5\'`, and turns `\'80a\'` into `NaN`, which passes the range check because every comparison with `NaN` is false.',
      },
      {
        code: `function toPort(s) {
  const n = parseInt(s);
  if (!(n >= 1 && n <= 65535)) {
    throw new Error('bad port');
  }
  return n;
}`,
        why: '`parseInt` reads digits until it meets something else and ignores the rest, so `\'80a\'` and `\'8.5\'` both quietly become ports.',
      },
    ],
  },
  meters: {
    optional: true,
    lang: 'ts',
    title: 'Feet in, metres out',
    prompt: 'Two brands that must not mix: `Feet` and `Meters`. Write `feet(n)`, the checking function, which throws for `NaN` or a negative length and otherwise stamps `n` as `Feet`; `toMeters(f)`, which converts (one foot is exactly 0.3048 metres); and `addMeters(a, b)`, which adds two lengths in metres. Arithmetic drops brands, so re-stamp the results with `as`.',
    starter: `type Feet = number &
  { readonly __brand: 'Feet' };
type Meters = number &
  { readonly __brand: 'Meters' };

function feet(n: number): Feet {
  return n as Feet;
}
function toMeters(f: Feet): Meters {
  return 0 as Meters;
}
function addMeters(
  a: Meters, b: Meters,
): Meters {
  return 0 as Meters;
}`,
    solution: `type Feet = number &
  { readonly __brand: 'Feet' };
type Meters = number &
  { readonly __brand: 'Meters' };

function feet(n: number): Feet {
  if (Number.isNaN(n) || n < 0) {
    throw new Error('bad length');
  }
  return n as Feet;
}
function toMeters(f: Feet): Meters {
  return (f * 0.3048) as Meters;
}
function addMeters(
  a: Meters, b: Meters,
): Meters {
  return (a + b) as Meters;
}`,
    tests: `test('10 feet in metres', () => {
  expect(toMeters(feet(10))).toBeCloseTo(3.048);
});
test('adding metres', () => {
  const m = toMeters(feet(10));
  expect(addMeters(m, m)).toBeCloseTo(6.096);
});
test('zero feet is allowed', () => {
  expect(toMeters(feet(0))).toBe(0);
});
test('negative and NaN lengths are refused', () => {
  expect(() => feet(-1)).toThrow();
  expect(() => feet(NaN)).toThrow();
});`,
    hints: [
      '`feet` is the only door for `Feet`, so the checks go there. The other two only convert and add.',
      '`Number.isNaN(n)` is true only for `NaN`. Note that `NaN < 0` is false, so the `NaN` check is needed separately.',
      '`return (f * 0.3048) as Meters;` and `return (a + b) as Meters;`: the brackets make `as` apply to the whole result.',
    ],
    walkthrough: `**How to think about it.** There are two brands and three functions, and only one of them guards a border: \`feet\` turns a plain number into \`Feet\`, so it must refuse lengths that make no sense. \`toMeters\` and \`addMeters\` take values that are already branded (and so already checked), do arithmetic, and have to re-stamp the result, because the checker drops a brand from the result of any arithmetic.

**The solution, line by line.**

- The two \`type\` declarations make \`Feet\` and \`Meters\` different structures, so the checker will refuse \`addMeters(someFeet, someMeters)\`.
- \`function feet(n: number): Feet {\` is the checking function.
- \`  if (Number.isNaN(n) || n < 0) {\` refuses \`NaN\` and negative numbers. Both tests are needed: every comparison with \`NaN\` is false, so \`n < 0\` alone would let \`NaN\` through.
- \`    throw new Error('bad length');\` says no, and \`  return n as Feet;\` stamps the brand once the checks have passed.
- \`function toMeters(f: Feet): Meters {\`: the parameter type means only checked feet get in.
- \`  return (f * 0.3048) as Meters;\`: \`f * 0.3048\` is a plain number (the brand is dropped), and the assertion stamps it as metres. The brackets matter: without them, \`as\` would apply to \`0.3048\` alone.
- \`function addMeters(\`, \`  a: Meters, b: Meters,\`, \`): Meters {\` is one signature spread over three lines: two lengths in metres in, one out.
- \`  return (a + b) as Meters;\` adds and re-stamps.

These \`as\` lines are fine because each one follows from values that were already checked, which is a different situation from stamping raw input.

**Common wrong attempts.**

- Checking only \`n < 0\` lets \`NaN\` through as a length.
- Converting the wrong way, \`f / 0.3048\`, gives about 32.8 for 10 feet.`,
    wrong: [
      {
        code: `function feet(n) {
  if (n < 0) throw new Error('bad');
  return n;
}
function toMeters(f) {
  return f * 0.3048;
}
function addMeters(a, b) {
  return a + b;
}`,
        why: '`NaN < 0` is false, so `feet(NaN)` is accepted as a length.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Why does TypeScript accept a `ValueId` where a `BlockId` is wanted, when both are declared as `type ... = number`?',
    options: [
      {
        t: 'Because aliases are only other names, and types are compared by structure: both are exactly `number`',
        correct: true,
        why: 'Structural typing sees two identical structures, so they are one type.',
      },
      {
        t: 'Because TypeScript does not check numbers',
        why: 'It checks them: a string would be refused. Two `number` aliases are simply the same type.',
      },
      {
        t: 'Because the values happen to be equal',
        why: 'The checker never looks at values; it would accept any `ValueId` there.',
      },
    ],
  },
  {
    q: 'With `type BlockId = number & { readonly __brand: \'BlockId\' }`, which line does the checker accept?',
    options: [
      {
        t: '`const b: BlockId = 3;`',
        why: 'A plain number has no `__brand`, so it is refused.',
      },
      {
        t: '`const n: number = blockId(3);`',
        correct: true,
        why: 'A BlockId is a number with something extra, so it can be used wherever a number is wanted.',
      },
      {
        t: '`const b: BlockId = blockId(3) + 1;`',
        why: 'Arithmetic drops the brand, so `+ 1` gives a plain number, which is refused.',
      },
      {
        t: '`const b: BlockId = (3 as ValueId);`',
        why: 'A ValueId’s brand holds a different literal, so it is not a BlockId.',
      },
    ],
  },
  {
    q: 'What happens at run time when `toPort` returns `n as Port`?',
    options: [
      {
        t: 'The number is checked against the Port type',
        why: 'Nothing is checked: the assertion is erased.',
      },
      {
        t: 'A `__brand` property is added to the number',
        why: 'The property never exists; it is only in the checker’s picture of the type.',
      },
      {
        t: 'The number is copied into a new Port object',
        why: 'There is no object: a Port is the plain number.',
      },
      {
        t: 'Nothing: after erasure the line is `return n;`',
        correct: true,
        why: 'Brands and assertions are types, and types are erased before the program runs.',
      },
    ],
  },
  {
    q: 'Why should `as Port` appear only inside the one checking function?',
    options: [
      {
        t: 'Because `as` is slow',
        why: '`as` costs nothing: it is erased.',
      },
      {
        t: 'Because TypeScript allows only one `as` per type',
        why: 'There is no such rule; you can write as many as you like, which is the danger.',
      },
      {
        t: 'Because anywhere else it would make a Port without doing the check, so a Port would no longer prove anything',
        correct: true,
        why: 'A brand is a receipt only while the checking function is the only way to get one.',
      },
    ],
  },
  {
    q: 'Which language compares types by their names (nominally), so that two wrapper types with the same fields are always different?',
    options: [
      {
        t: 'TypeScript',
        why: 'TypeScript is structural; that is why it needs brands.',
      },
      {
        t: 'Python with `NewType`',
        why: '`NewType` is checked by a separate tool and the value is a plain `int`, much like a TypeScript brand.',
      },
      {
        t: 'Java, with two `record` classes',
        correct: true,
        why: 'Java’s types are nominal: `BlockId` and `ValueId` are different classes, even with identical fields.',
      },
      {
        t: 'C with `typedef`',
        why: '`typedef` only adds a name, exactly like a TypeScript alias.',
      },
    ],
  },
];
