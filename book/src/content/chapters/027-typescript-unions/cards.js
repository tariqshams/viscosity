// Chapter 27 cards. Keys are stable ids: never rename them.
//
// As in chapter 25: the runner erases types without checking them, and
// scripts/check_chapters.mjs strips the types and runs the rest as plain
// JavaScript. Exercises set lang: 'ts' so readers can write the types.

export const prompts = {
  'union-what': {
    q: 'What does the type `number | string` mean?',
    a: 'The value may be a number or a string.',
  },
  'union-before-check': {
    q: '`id` is labelled `number | string`. Why does `id.toUpperCase()` fail to type-check?',
    a: 'If `id` is a number there is no `toUpperCase`. Before a check, only operations safe for every member are allowed.',
  },
  'union-both-ok': {
    q: 'Does `v.length` type-check when `v` is labelled `string | string[]`, with no check first?',
    a: 'Yes. Strings and arrays both have `length`, so it is safe for every member.',
  },
  'narrowing-what': {
    q: 'What is narrowing?',
    a: 'The checker working out a more exact type for a value from a check in your code, such as `typeof id === \'string\'`.',
  },
  'narrow-after-return': {
    q: '`id` is `number | string`, and the code reads `if (typeof id === \'string\') { return ...; }`. What is `id`’s type on the line after the `if`?',
    a: '`number`. Every string returned inside the `if`, so only numbers can reach the next line.',
  },
  'narrow-runtime': {
    q: 'Which part of `if (typeof id === \'string\')` runs when the program runs: the check, the narrowing, or both?',
    a: 'Only the check. The narrowing is the checker’s reasoning, and it is erased with the other types.',
  },
  'truthy-zero': {
    q: '`v` is `number | undefined`. Why is `if (v)` a risky way to rule out `undefined`?',
    a: 'Because `0` is falsy too, so a real zero is treated as if it were missing. Use `v !== undefined`.',
  },
  'isarray': {
    q: 'Which check narrows `v: string | string[]` to `string[]`?',
    a: '`Array.isArray(v)`: inside the `if`, `v` is the array; after an `if` that returned, it is the string.',
  },
};

export const examples = {
  narrow: {
    title: 'One check, two kinds',
    lang: 'ts',
    code: `function show(id: number | string) {
  if (typeof id === 'string') {
    return id.toUpperCase();
  }
  return id.toFixed(2);
}

console.log(show('ada'));
console.log(show(42));
console.log(show(3.14159));

// The runner erases types without
// checking them. Try show(true):
// tsc would reject it; here it
// crashes, because true has no
// toFixed.`,
  },
};

export const exercises = {
  label: {
    lang: 'ts',
    title: 'Label a value of three kinds',
    prompt:
      'Write `label(v)`, where `v` is labelled `number | string | undefined`. Return `\'(none)\'` for `undefined`, the number written with two decimal places (`v.toFixed(2)`) for a number, and the string in capitals (`v.toUpperCase()`) for a string. Be careful with `0` and the empty string `\'\'`: they are real values, not missing ones. (The runner erases types, so the tests check behaviour.)',
    starter: `function label(
  v: number | string | undefined,
): string {
  // your code here
}

console.log(label(3));
console.log(label('ok'));
console.log(label(undefined));`,
    solution: `function label(
  v: number | string | undefined,
): string {
  if (v === undefined) {
    return '(none)';
  }
  if (typeof v === 'number') {
    return v.toFixed(2);
  }
  return v.toUpperCase();
}`,
    tests: `test('undefined is (none)', () => {
  expect(label(undefined)).toBe('(none)');
});
test('a number gets two decimals', () => {
  expect(label(3)).toBe('3.00');
  expect(label(2.5)).toBe('2.50');
});
test('a string is shouted', () => {
  expect(label('ok')).toBe('OK');
});
test('zero is a real number', () => {
  expect(label(0)).toBe('0.00');
});
test('the empty string is a real string', () => {
  expect(label('')).toBe('');
});`,
    hints: [
      'There are three kinds of value, so there are three cases. Which one is easiest to rule out first?',
      'Rule out `undefined` with `v === undefined` and return early. After that, `v` is `number | string`, and `typeof v === \'number\'` splits the last two.',
      'Avoid `if (!v)`: it is also true for `0` and `\'\'`. Write `if (v === undefined) { return \'(none)\'; }`, then `if (typeof v === \'number\') { return v.toFixed(2); }`, then `return v.toUpperCase();`.',
    ],
    walkthrough: `**How to think about it.** The label \`number | string | undefined\` says three kinds of value can arrive, so the function is three cases, and the job is to peel them off one at a time, each with a check the checker understands. After each check that returns, the union gets one member smaller, until only one kind is left and no check is needed at all. The easiest member to rule out is \`undefined\`, because it is a single value that \`===\` can test exactly.

**The solution, line by line.**

- \`function label(\` starts the definition; the parameter list is split over lines only to fit the screen.
- \`  v: number | string | undefined,\` labels the one parameter with a three-member union. (The comma after the last parameter is allowed and changes nothing.)
- \`): string {\` closes the parameters and says the function always returns a string.
- \`  if (v === undefined) {\` asks, at run time, whether \`v\` is the value \`undefined\`. The checker reads the same test, so inside the braces it knows \`v\` is \`undefined\`.
- \`    return '(none)';\` answers for the missing case and leaves. Because this returned, the checker knows that on every line below, \`v\` is \`number | string\`.
- \`  }\` ends that case.
- \`  if (typeof v === 'number') {\` splits the two remaining kinds. Inside, \`v\` is narrowed to \`number\`.
- \`    return v.toFixed(2);\` is allowed because \`v\` is a number here; \`(3).toFixed(2)\` is \`'3.00'\` and \`(0).toFixed(2)\` is \`'0.00'\`.
- \`  }\` ends that case. Below it, numbers have returned too, so \`v\` is narrowed to \`string\`.
- \`  return v.toUpperCase();\` needs no check: only strings can reach it. \`'ok'\` becomes \`'OK'\`, and \`''\` stays \`''\`.
- \`}\` closes the body.

Try deleting the first \`if\` in a real TypeScript editor: on the last line \`tsc\` then reports \`'v' is possibly 'undefined'\`, which is exactly the case you forgot.

**Common wrong attempts.**

- \`if (!v) return '(none)';\` looks shorter, and passes the obvious tests, but \`!v\` is true for every *falsy* value (the values an \`if\` treats as false), and \`0\` and \`''\` are falsy. So \`label(0)\` gives \`'(none)'\` instead of \`'0.00'\`. TypeScript does narrow on it, which is why it type-checks; the bug is in the meaning, not the types.
- Leaving out the \`undefined\` case: \`label(undefined)\` reaches \`v.toUpperCase()\`, and JavaScript stops with \`TypeError: Cannot read properties of undefined\`. The checker would have caught this; the runner here does not check types, so the test catches it instead.`,
    wrong: [
      {
        code: `function label(v) {
  if (!v) {
    return '(none)';
  }
  if (typeof v === 'number') {
    return v.toFixed(2);
  }
  return v.toUpperCase();
}`,
        why: '`!v` is also true for `0` and `\'\'`, so `label(0)` gives `\'(none)\'` instead of `\'0.00\'`. Test for the one value you mean: `v === undefined`.',
      },
      {
        code: `function label(v) {
  if (typeof v === 'number') {
    return v.toFixed(2);
  }
  return v.toUpperCase();
}`,
        why: 'This forgets `undefined`, so `label(undefined)` crashes with a `TypeError` at `v.toUpperCase()`. `tsc` would have reported it; the runner only finds it when the test runs.',
      },
    ],
  },
  total: {
    optional: true,
    lang: 'ts',
    title: 'Prices that arrive as text',
    prompt:
      'A web form hands you prices, some already numbers and some still text, like `[2, \'3.5\', 1]`. Write `total(ps)`, where `ps` is labelled `(number | string)[]`, returning the sum as a number. Turn a string into a number with `Number(s)` (so `Number(\'3.5\')` is `3.5`).',
    starter: `function total(
  ps: (number | string)[],
): number {
  // your code here
}

console.log(total([2, '3.5', 1]));`,
    solution: `function total(
  ps: (number | string)[],
): number {
  let sum = 0;
  for (const p of ps) {
    if (typeof p === 'string') {
      sum = sum + Number(p);
    } else {
      sum = sum + p;
    }
  }
  return sum;
}`,
    tests: `test('numbers and text together', () => {
  expect(total([2, '3.5', 1])).toBe(6.5);
});
test('only text', () => {
  expect(total(['10', '5'])).toBe(15);
});
test('only numbers', () => {
  expect(total([1, 2, 3])).toBe(6);
});
test('an empty list costs nothing', () => {
  expect(total([])).toBe(0);
});
test('the answer is a number', () => {
  expect(typeof total(['1'])).toBe('number');
});`,
    hints: [
      'Keep a running sum that starts at `0`, and visit each price with `for (const p of ps)`.',
      'Each `p` is `number | string`. Narrow it with `typeof p === \'string\'` before adding it.',
      'In the string case add `Number(p)`; in the `else` case, where `p` is narrowed to `number`, add `p` itself. Return `sum` after the loop.',
    ],
    walkthrough: `**How to think about it.** Adding up a list is a loop with a running sum, which you have written many times; the only new part is that each item has two possible kinds, and the two kinds must be added differently. That is a job for narrowing: check the kind, and in each branch the checker knows exactly what you have.

**The solution, line by line.**

- \`function total(\` and \`  ps: (number | string)[],\` take one parameter, a list whose items are each a number or a string. The brackets matter: \`(number | string)[]\` is “a list of number-or-string”, while \`number | string[]\` would mean “a number, or a list of strings”.
- \`): number {\` promises a number back.
- \`  let sum = 0;\` starts the running total at zero, which is also the right answer for an empty list.
- \`  for (const p of ps) {\` visits each price in turn.
- \`    if (typeof p === 'string') {\` narrows \`p\` to \`string\` inside the braces.
- \`      sum = sum + Number(p);\` converts the text to a number first, then adds it. \`Number('3.5')\` is \`3.5\`.
- \`    } else {\` is the other branch, where the checker has narrowed \`p\` to \`number\`.
- \`      sum = sum + p;\` adds the number as it is.
- \`    }\` and \`  }\` close the \`if\` and the loop.
- \`  return sum;\` hands back the total. For \`[2, '3.5', 1]\` that is \`0 + 2 + 3.5 + 1\`, which is \`6.5\`.
- \`}\` closes the body.

**Common wrong attempts.**

- Adding every item with \`sum = sum + p\` and no check. In JavaScript, \`+\` with a string on either side *joins text* instead of adding, so \`0 + 2\` is \`2\`, but \`2 + '3.5'\` is the string \`'23.5'\`, and the final answer is \`'23.51'\`. TypeScript refuses this line when \`p\` is \`number | string\` and \`sum\` is a number; the runner here erases the types, so the tests catch it instead.
- Converting with \`parseInt(p)\` instead of \`Number(p)\`: \`parseInt\` keeps only the whole-number part, so \`'3.5'\` becomes \`3\`.`,
    wrong: [
      {
        code: `function total(ps) {
  let sum = 0;
  for (const p of ps) {
    sum = sum + p;
  }
  return sum;
}`,
        why: 'With a string on either side, `+` joins text, so `total([2, \'3.5\', 1])` is the string `\'23.51\'`. Narrow first, and convert strings with `Number`.',
      },
      {
        code: `function total(ps) {
  let sum = 0;
  for (const p of ps) {
    if (typeof p === 'string') {
      sum = sum + parseInt(p);
    } else {
      sum = sum + p;
    }
  }
  return sum;
}`,
        why: '`parseInt(\'3.5\')` is `3`: it stops at the decimal point. `Number(\'3.5\')` keeps the fraction.',
      },
    ],
  },
};

export const quiz = [
  {
    q: '`function len(v: string | string[]) { return v.length; }` Does this type-check?',
    options: [
      { t: 'No: you must narrow `v` before using it', why: 'You only need to narrow before doing something that is *not* safe for every member.' },
      { t: 'Yes: both strings and arrays have `length`, so it is safe for every member', correct: true, why: 'Operations allowed on every member of a union are allowed without narrowing.' },
      { t: 'No: unions cannot contain array types', why: 'Any types can be combined in a union.' },
    ],
  },
  {
    q: `\`x\` is \`number | string\`. What is \`x\`’s type at the marked line?
\`\`\`
if (typeof x === 'number') {
  return x * 2;
}
// here
\`\`\``,
    options: [
      { t: '`number`', why: 'Numbers went into the `if` and returned, so they cannot reach this line.' },
      { t: '`number | string`', why: 'The checker follows the `return`: one member has been ruled out.' },
      { t: '`string`', correct: true, why: 'Every number returned inside the `if`, so only strings remain.' },
    ],
  },
  {
    q: 'The same code, but the `if` body is `console.log(x * 2);` with no `return`. What is `x`’s type at the marked line now?',
    options: [
      { t: '`number | string`', correct: true, why: 'Numbers went into the `if` and came out again, so both kinds can reach the line after it.' },
      { t: '`string`', why: 'That would need the numbers to leave, with a `return` or an `else`.' },
      { t: '`number`', why: 'Strings skip the `if` entirely and certainly reach the next line.' },
    ],
  },
  {
    q: '`v` is `number | undefined` and holds `0`. Which branch runs: `if (v) { A } else { B }`?',
    options: [
      { t: '`A`, because `0` is a real number', why: 'It is a real number, but `if` treats `0` as false (it is falsy).' },
      { t: 'Neither: the checker rejects the code', why: 'TypeScript accepts truthiness checks and narrows on them.' },
      { t: '`B`, the same branch `undefined` would take', correct: true, why: '`0` is falsy, so the zero is treated like a missing value. `v !== undefined` tells them apart.' },
    ],
  },
  {
    q: 'What does C’s `union` keyword lack, compared with a TypeScript union checked with `typeof`?',
    options: [
      { t: 'It cannot hold numbers', why: 'A C union can hold numbers, pointers, anything.' },
      { t: 'It does not record which kind was stored, so you keep your own tag beside it', correct: true, why: 'A C union is the same bytes read either way; nothing remembers which kind went in. The next chapter makes that tag official.' },
      { t: 'It only exists at run time', why: 'C’s types are checked by the compiler, before the program runs.' },
    ],
  },
];
