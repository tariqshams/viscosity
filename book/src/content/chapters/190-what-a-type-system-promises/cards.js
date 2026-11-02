// Chapter 190 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'type-what': {
    q: 'What is a type?',
    a: 'A name for a set of values together with the operations allowed on them (for example, numbers, which you may add and compare).',
  },
  'type-system-what': {
    q: 'What does a type system do?',
    a: 'It gives every piece of a program a type by reading the text, and rejects programs whose pieces do not fit together.',
  },
  'static-when': {
    q: 'A function has a type error on a line that runs only for very large inputs. When does a static type checker report it?',
    a: 'Before the program runs at all, because it reads every path, taken or not.',
  },
  conservative: {
    q: 'Why must a static checker reject some programs that would never actually go wrong?',
    a: 'It cannot know in general which branches will run without running the program, so it judges every branch as if it might.',
  },
  'strong-weak': {
    q: 'Which two separate questions does “strongly typed” muddle together?',
    a: 'When types are checked (before or while running), and whether a mistake can slip through unnoticed (safe or unsafe).',
  },
  'safe-meaning': {
    q: 'What makes a language **safe**, in Cardelli’s sense?',
    a: 'No untrapped errors: every mistake it does not prevent is stopped with an error, never left to corrupt something silently.',
  },
  'sound-promise': {
    q: 'What does a **sound** type system promise about the programs it accepts?',
    a: 'They never get stuck on a type error when run, and every value has the type the checker gave it.',
  },
  'ts-unsound': {
    q: 'Is TypeScript’s type system sound?',
    a: 'No, on purpose: its design goals list a sound type system as a non-goal, trading some safety for convenience.',
  },
};

export const examples = {
  'ts-hole': {
    title: 'A TypeScript program that type-checks and crashes',
    lang: 'ts',
    expectError: true,
    code: `const ns: number[] = [1];
const all: (number | string)[] = ns;
all.push("two");
console.log(ns);
console.log(ns[1].toFixed(2));`,
  },
};

export const exercises = {
  'result-type': {
    title: 'Evaluate an operator on types',
    prompt: `Write \`resultType(op, l, r)\`. \`l\` and \`r\` are the **types** of the two operands, each \`'number'\`, \`'string'\` or \`'bool'\`; \`op\` is one of \`+ - * / < ==\`. Return the type of the result, or throw an \`Error\` with exactly the message shown:

- \`+\` on two numbers is \`'number'\`, on two strings \`'string'\`; otherwise \`cannot add a bool and a number\` (with the two types in order).
- \`- * /\` need two numbers and give \`'number'\`; otherwise \`cannot use '-' on a string and a number\`.
- \`<\` needs two numbers and gives \`'bool'\`; otherwise \`cannot compare a string and a number with '<'\`.
- \`==\` needs two operands of the same type and gives \`'bool'\`; otherwise \`cannot compare a number and a string with '=='\`.`,
    starter: `function resultType(op, l, r) {
  // l and r are 'number', 'string'
  // or 'bool'
  return 'number';
}

console.log(resultType('<', 'number',
  'number'));`,
    solution: `function resultType(op, l, r) {
  const d = 'a ' + l + ' and a ' + r;
  if (op === '+') {
    if (l === r && l !== 'bool') {
      return l;
    }
    throw new Error('cannot add ' + d);
  }
  if (op === '==') {
    if (l === r) return 'bool';
    throw new Error('cannot compare ' +
      d + " with '=='");
  }
  const nums = l === 'number' &&
    r === 'number';
  if (!nums && op === '<') {
    throw new Error('cannot compare ' +
      d + " with '<'");
  }
  if (!nums) {
    throw new Error("cannot use '" +
      op + "' on " + d);
  }
  return op === '<' ? 'bool' : 'number';
}`,
    tests: `const msg = (f) => {
  try { f(); } catch (e) { return e.message; }
  return 'no error';
};
test('+ on numbers and on strings', () => {
  expect(resultType('+', 'number', 'number')).toBe('number');
  expect(resultType('+', 'string', 'string')).toBe('string');
});
test('+ on a string and a number', () => {
  expect(msg(() => resultType('+', 'string', 'number')))
    .toBe('cannot add a string and a number');
});
test('+ on two bools is an error', () => {
  expect(msg(() => resultType('+', 'bool', 'bool')))
    .toBe('cannot add a bool and a bool');
});
test('- * / need numbers', () => {
  expect(resultType('*', 'number', 'number')).toBe('number');
  expect(msg(() => resultType('-', 'string', 'number')))
    .toBe("cannot use '-' on a string and a number");
  expect(msg(() => resultType('/', 'number', 'bool')))
    .toBe("cannot use '/' on a number and a bool");
});
test('< gives a bool', () => {
  expect(resultType('<', 'number', 'number')).toBe('bool');
  expect(msg(() => resultType('<', 'string', 'number')))
    .toBe("cannot compare a string and a number with '<'");
});
test('== needs one type on both sides', () => {
  expect(resultType('==', 'string', 'string')).toBe('bool');
  expect(msg(() => resultType('==', 'number', 'string')))
    .toBe("cannot compare a number and a string with '=='");
});`,
    hints: [
      'Handle one operator at a time, starting with `+`. What pairs of types does it accept, and what does it give back for each?',
      'For `+`, the two types must be equal and must not be `\'bool\'`; the result is that same type. For `==`, the two types only need to be equal, and the result is always `\'bool\'`. Build the shared part of the messages once: `\'a \' + l + \' and a \' + r`.',
      'After `+` and `==`, every remaining operator needs two numbers. If either type is not `\'number\'`, throw the comparison message for `<` and the `cannot use` message for the rest; otherwise return `\'bool\'` for `<` and `\'number\'` for the others.',
    ],
    walkthrough: `**How to think about it.** Put chapter 66's evaluator next to this function. There, \`binary(op, l, r)\` received two *values*, checked their kinds, and either computed an answer or threw Drip's message. Here we receive only the *kinds* (the types), so we cannot compute \`3 + 4\`; however, we can still say what kind of answer it would be, and we can still throw the same message. That is the whole idea of a static checker in miniature: run the program's operators on types instead of values. Do two by hand before writing code: \`('+', 'string', 'string')\` joins two strings, so the answer is \`'string'\`; \`('<', 'string', 'number')\` has no rule, so it is an error.

Then sort the operators by what they need. \`+\` accepts two numbers or two strings and gives back that same type. \`==\` accepts any two operands of the *same* type (typed Drip's choice: comparing a number with a string is almost certainly a mistake) and always gives a bool. Everything else (\`- * / <\`) needs two numbers; \`<\` gives a bool and the arithmetic ones give a number.

**The solution, line by line.**

- \`function resultType(op, l, r) {\` takes the operator and the two operand types.
- \`const d = 'a ' + l + ' and a ' + r;\` builds the part every message shares, such as \`a string and a number\`, once, in the order the operands appear.
- \`if (op === '+') {\` handles addition first, because it is the one operator with two different successful answers.
- \`if (l === r && l !== 'bool') { return l; }\` accepts a pair only if both types are equal and are number or string (the only three types here are number, string and bool, so "not bool" means one of the other two); the result has the same type as the operands, so we return \`l\`.
- \`throw new Error('cannot add ' + d);\` covers every other pair, such as a string and a number, or two bools.
- \`if (op === '==') { if (l === r) return 'bool'; throw ... }\` lets equal types through with a bool result, and otherwise throws \`cannot compare a number and a string with '=='\`.
- \`const nums = l === 'number' && r === 'number';\` asks the one question the four remaining operators share: are both sides numbers? If not, none of them has a rule.
- \`if (!nums && op === '<') { throw ... }\` gives \`<\` its own message, \`cannot compare a string and a number with '<'\`.
- \`if (!nums) { throw new Error("cannot use '" + op + "' on " + d); }\` covers \`- * /\`, putting the operator in quotes: \`cannot use '-' on a string and a number\`.
- \`return op === '<' ? 'bool' : 'number';\` runs only when both types are numbers: a comparison produces a bool, and \`- * /\` produce a number.

**Common wrong attempts.**

- Returning \`'number'\` for every successful \`+\`: \`'a' + 'b'\` is a string, so \`resultType('+', 'string', 'string')\` must be \`'string'\`.
- Checking only \`l === r\` for \`+\`: two bools pass, but Drip has no rule for \`true + false\`.
- Returning \`'number'\` for \`<\`: a comparison's answer is true or false, a bool, which is exactly what an \`if\` will need in chapter 192.
- Writing the message as \`'cannot use ' + op\` without the quotes: \`cannot use - on ...\` is not Drip's wording, and the tests compare messages exactly.`,
    wrong: [
      {
        code: `function resultType(op, l, r) {
  const d = 'a ' + l + ' and a ' + r;
  if (op === '+') {
    if (l === r) return l;
    throw new Error('cannot add ' + d);
  }
  if (op === '==') {
    if (l === r) return 'bool';
    throw new Error('cannot compare ' +
      d + " with '=='");
  }
  const nums = l === 'number' &&
    r === 'number';
  if (!nums && op === '<') {
    throw new Error('cannot compare ' +
      d + " with '<'");
  }
  if (!nums) {
    throw new Error("cannot use '" +
      op + "' on " + d);
  }
  return op === '<' ? 'bool' : 'number';
}`,
        why: 'It lets two bools through `+` (returning `\'bool\'`), but Drip has no rule for adding booleans.',
      },
      {
        code: `function resultType(op, l, r) {
  const d = 'a ' + l + ' and a ' + r;
  if (op === '+') {
    if (l === r && l !== 'bool') {
      return 'number';
    }
    throw new Error('cannot add ' + d);
  }
  if (op === '==') return 'bool';
  if (l !== 'number' ||
    r !== 'number') {
    throw new Error("cannot use '" +
      op + "' on " + d);
  }
  return 'number';
}`,
        why: 'Joining two strings gives a string, not a number; `==` never complains about mixed types; and `<` gives a number rather than a bool, with the wrong message on failure.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'In Drip (dynamically typed: `/` on numbers gives `inf` for division by zero, `+` adds numbers or joins strings, unary `-` needs a number, and list indexes are checked at run time), which of these is a type error?',
    options: [
      {
        t: '`print 10 / 0;`',
        why: 'Both operands are numbers, so `/` has a rule; the answer is `inf`.',
      },
      {
        t: '`print [1, 2][5];`',
        why: 'Indexing a list with a number is allowed by the types; the index being out of range is a separate, deliberate check.',
      },
      {
        t: '`print -"hi";`',
        correct: true,
        why: '`-` is only defined on numbers, so applying it to a string is an operation on the wrong kind of value.',
      },
      {
        t: '`print "a" + "b";`',
        why: '`+` on two strings joins them: this prints `ab`.',
      },
    ],
  },
  {
    q: 'TypeScript rejects `let n: number = 1; if (false) { n = "one"; }` although the assignment can never run. Why?',
    options: [
      {
        t: 'It is a bug in TypeScript',
        why: 'Every static checker behaves this way by design.',
      },
      {
        t: '`false` is not allowed as a condition',
        why: 'It is allowed; the complaint is about the assignment.',
      },
      {
        t: 'A static checker judges every branch as if it might run, so it must be conservative',
        correct: true,
        why: 'It cannot know in general which branches run without running the program, so it checks them all.',
      },
    ],
  },
  {
    q: 'Which description of C is the most precise?',
    options: [
      {
        t: 'Weakly typed',
        why: 'That word mixes up two questions, and different people mean different things by it.',
      },
      {
        t: 'Statically typed, but unsafe: some mistakes, like reading past the end of an array, are not caught at all',
        correct: true,
        why: 'This answers both questions separately: when types are checked, and whether errors can slip through untrapped.',
      },
      {
        t: 'Dynamically typed and safe',
        why: 'C checks types before running, and some of its errors go unnoticed.',
      },
      {
        t: 'Untyped',
        why: 'C does have a static type system; it is the safety that is missing.',
      },
    ],
  },
  {
    q: 'A type system is sound. Which of these can still happen when a program it accepts runs?',
    options: [
      {
        t: '`+` receives a string and a number',
        why: 'That is exactly the kind of stuck state soundness rules out.',
      },
      {
        t: 'An expression the checker typed as a number produces a string',
        why: 'Soundness promises that values have the types the checker gave them.',
      },
      {
        t: 'A loop that never ends',
        correct: true,
        why: 'Soundness is about type errors only; it says nothing about whether a program finishes.',
      },
    ],
  },
  {
    q: '`const xs: number[] = []; const n: number = xs[0];` passes `tsc --strict`. What does this show?',
    options: [
      {
        t: 'TypeScript is not sound: `n` is typed `number` but holds `undefined`',
        correct: true,
        why: 'TypeScript types `xs[0]` as a number although the array may be empty; this is one of its deliberate holes (closed by `noUncheckedIndexedAccess`).',
      },
      {
        t: 'Nothing: `xs[0]` really is a number',
        why: 'The array is empty, so `xs[0]` is `undefined`.',
      },
      {
        t: 'TypeScript checks types dynamically',
        why: 'TypeScript checks before running, and then erases the types.',
      },
    ],
  },
];
