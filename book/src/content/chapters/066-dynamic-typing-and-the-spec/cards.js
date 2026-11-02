// Dynamic typing and the language spec (split from chapter 65).
// Keys are stable ids. Every Drip snippet here was run on the companion.

export const prompts = {
  'dyn-when': {
    q: 'In a dynamically typed language like Drip, when is a type error found?',
    a: 'While the program runs, at the moment the operation with the wrong types runs.',
  },
  'types-on-values': {
    q: 'In Drip, does the type belong to the variable or to the value?',
    a: 'To the value: each value carries a tag (number, string, …); a variable is only a name for whichever value it holds.',
  },
  'var-change-type': {
    q: 'Is `let x = 1; x = "one";` allowed in Drip?',
    a: 'Yes. A variable can hold any kind of value, and the kind can change.',
  },
  'dyn-vs-js': {
    q: 'What does `"a" + 1` do in Drip, and in JavaScript?',
    a: 'Drip stops with a runtime error. JavaScript converts the 1 and gives `"a1"`.',
  },
  'spec-what': {
    q: 'What is a language specification for?',
    a: 'To say precisely what every program means, so that every implementation behaves the same way.',
  },
  'corpus-role': {
    q: 'How is Drip’s meaning pinned down in this book?',
    a: 'By hundreds of test programs (the corpus) whose comments give the exact expected output or error; both implementations must pass them.',
  },
  'expect-comment': {
    q: 'How does a Drip test program say that a line should fail?',
    a: 'With a comment `# expect runtime error:` followed by the exact error message.',
  },
  'not-proof': {
    q: 'An implementation passes every test in the corpus. Is it certainly correct?',
    a: 'No: the tests only cover the programs written down. Passing them is strong evidence, not proof.',
  },
};

export const examples = {
  'type-error': {
    title: 'A label glued to a number',
    lang: 'drip',
    expectError: true,
    code: `print "start";
print "Total: " + 3;
print "never printed";`,
  },
};

const ADD_SOL = `function add(a, b) {
  const ta = typeof a;
  const tb = typeof b;
  if (ta === 'number' &&
      tb === 'number') {
    return a + b;
  }
  if (ta === 'string' &&
      tb === 'string') {
    return a + b;
  }
  throw new Error('cannot add a ' +
    ta + ' and a ' + tb);
}`;

export const exercises = {
  'checked-add': {
    title: 'Drip’s + operator',
    prompt:
      'Write `add(a, b)`, the check that Drip’s interpreter runs for `+`. If both values are numbers, return their sum; if both are strings, return them joined; otherwise **throw** an `Error` whose message names both types, in Drip’s words: `cannot add a string and a number` for `add(\'a\', 1)`, `cannot add a boolean and a number` for `add(true, 1)`. `typeof` tells you a value’s type: `typeof 1` is `\'number\'`, `typeof \'a\'` is `\'string\'` and `typeof true` is `\'boolean\'`.',
    starter: `function add(a, b) {
  // your code here
}

console.log(add(1, 2));
console.log(add('drip', 'drop'));`,
    solution: ADD_SOL,
    tests: `test('two numbers add', () => {
  expect(add(1, 2)).toBe(3);
});
test('two strings join', () => {
  expect(add('drip', 'drop')).toBe('dripdrop');
});
test('a string and a number throw', () => {
  expect(() => add('a', 1)).toThrow();
  expect(() => add(1, 'a')).toThrow();
});
test('booleans and null throw', () => {
  expect(() => add(true, 1)).toThrow();
  expect(() => add(null, null)).toThrow();
});
test('the exact messages', () => {
  let msg = '';
  try { add('a', 1); } catch (e) { msg = e.message; }
  expect(msg).toBe(
    'cannot add a string and a number');
  try { add(true, 1); } catch (e) { msg = e.message; }
  expect(msg).toBe(
    'cannot add a boolean and a number');
});`,
    hints: [
      'There are exactly two allowed cases. Check for each one, and treat everything else as an error.',
      'Ask `typeof a === \'number\' && typeof b === \'number\'` for the first case, and the same with `\'string\'` for the second. In both, JavaScript’s own `+` does the right thing.',
      'After the two `if`s, nothing allowed is left, so the last line can be `throw new Error(\'cannot add a \' + ta + \' and a \' + tb);`, where `ta` and `tb` are the two `typeof` results.',
    ],
    walkthrough: `**How to think about it.** Write the rule from the formal box as cases: number and number, string and string, and everything else. The first two have an answer; the third is an error. Since the interpreter is written in JavaScript, and Drip's numbers and strings *are* JavaScript numbers and strings, JavaScript's own \`+\` gives the right answer in both allowed cases. The whole job of \`add\` is to refuse the cases where JavaScript would quietly convert instead (\`'a' + 1\` is \`'a1'\`, and \`true + 1\` is \`2\`). That is dynamic typing in one function: the check happens on the actual values, when \`+\` runs.

**The solution, line by line.**

- \`function add(a, b) {\` takes the two values that \`+\` was given.
- \`const ta = typeof a;\` and \`const tb = typeof b;\` read each value's type tag, as a string such as \`'number'\`.
- \`if (ta === 'number' && tb === 'number') {\` is the first allowed case (split over two lines to fit)...
- \`return a + b;\` ...where JavaScript's \`+\` adds.
- \`if (ta === 'string' && tb === 'string') {\` is the second allowed case...
- \`return a + b;\` ...where the same \`+\` joins.
- \`throw new Error('cannot add a ' + ta + ' and a ' + tb);\` is reached only when neither case matched, so every other pair stops, with a message built from the two tags: for \`add('a', 1)\` it is \`cannot add a string and a number\`, exactly Drip's wording (the line is split in two only to keep it short).

The real interpreter does the same thing in its \`'+'\` case, with two differences: it describes each value with a small helper, \`describe\`, which also knows the words \`none\`, \`a list\` and \`a Point instance\` (so \`none + none\` says \`cannot add none and none\`, where \`typeof null\` would have said \`object\`), and it throws a \`RuntimeError\` that carries the token, so the report can name the line.

**Common wrong attempts.**

- \`if (typeof a === 'string' || typeof b === 'string') return a + b;\` followed by a plain \`return a + b;\`: this copies JavaScript's rule, so \`add('a', 1)\` gives \`'a1'\` and \`add(true, 1)\` gives \`2\` instead of throwing.
- Checking only the first value (\`if (typeof a === 'number') return a + b;\`): \`add(1, 'a')\` then returns \`'1a'\`.
- Returning a string like \`'error'\` instead of throwing: the caller cannot tell an error from a real value, and the program carries on.`,
    wrong: [
      {
        code: `function add(a, b) {
  return a + b;
}`,
        why: 'This is JavaScript’s `+`, which converts: `add(\'a\', 1)` gives `\'a1\'` and `add(true, 1)` gives `2`. Drip must throw.',
      },
      {
        code: `function add(a, b) {
  if (typeof a === 'number') {
    return a + b;
  }
  if (typeof a === 'string') {
    return a + b;
  }
  throw new Error('cannot add a ' +
    typeof a + ' and a ' + typeof b);
}`,
        why: 'Only `a` is checked, so `add(1, \'a\')` returns `\'1a\'` and `add(\'a\', 1)` returns `\'a1\'`. Both values need the same tag.',
      },
    ],
  },
  expects: {
    optional: true,
    title: 'Read a test’s expectations',
    prompt:
      'Write `expects(src)`. `src` is the text of a Drip test program. Return an array of the expected outputs: for every line containing `# expect: `, the text after it, in order. Lines with `# expect runtime error:` are not outputs, so they are not included.',
    starter: `function expects(src) {
  // your code here
}

const t = 'print 1; # expect: 1';
console.log(expects(t));`,
    solution: `function expects(src) {
  const out = [];
  const tag = '# expect: ';
  const n = tag.length;
  for (const line of src.split('\\n')) {
    const i = line.indexOf(tag);
    if (i !== -1) {
      out.push(line.slice(i + n));
    }
  }
  return out;
}`,
    tests: `const truth = [
  '# Everything else is true.',
  'print truth(0); # expect: true',
  'print len(""); # expect: 0',
].join('\\n');
test('two expectations, in order', () => {
  expect(expects(truth)).toEqual(['true', '0']);
});
test('no expectations', () => {
  expect(expects('print 1;')).toEqual([]);
});
test('spaces inside are kept', () => {
  expect(expects('print "a b"; # expect: a b'))
    .toEqual(['a b']);
});
test('runtime errors are not outputs', () => {
  const src = 'none.x; # expect runtime error: No.';
  expect(expects(src)).toEqual([]);
});`,
    hints: [
      'Work one line at a time: `src.split(\'\\n\')` gives the lines.',
      'The comment is usually at the *end* of a line, after the code, so search for it with `indexOf` rather than checking the start.',
      'When `indexOf` finds the tag at index `i`, the expected text starts at `i + tag.length` (10 characters on); `slice` from there to the end.',
    ],
    walkthrough: `**How to think about it.** A test runner needs two lists to compare: what the program printed, and what its comments say it should print. This function makes the second list. Look at a real test line, \`print truth(0); # expect: true\`: the comment comes *after* the code on the same line, so you have to search inside each line, not just look at its start. And the tag must include the colon and space, \`# expect: \`, so that \`# expect runtime error:\` lines (which do not have a colon straight after \`expect\`) are left out.

**The solution, line by line.**

- \`const out = [];\` collects the expected outputs.
- \`const tag = '# expect: ';\` is the exact text to look for, colon and space included, and \`const n = tag.length;\` remembers its length, 10.
- \`for (const line of src.split('\\n')) {\` visits the program one line at a time.
- \`const i = line.indexOf(tag);\` finds where the tag starts in this line, or gives \`-1\` if it is not there.
- \`if (i !== -1) {\` only lines that contain the tag count...
- \`out.push(line.slice(i + n));\` ...and the expected output is everything after the tag, to the end of the line. For \`print "a b"; # expect: a b\` that is \`a b\`, with its inner space kept.
- \`return out;\` hands back the list, in the order the lines appeared.

Compare \`out\` with the program's printed lines, element by element, and you have the core of the corpus runner in \`companion/ts/test/corpus.ts\`.

**Common wrong attempts.**

- \`if (line.startsWith(tag))\`: real tests put the comment after the code, so this finds nothing in \`what_is_true.drip\`.
- Searching for \`'# expect'\` without the colon: \`# expect runtime error:\` lines then count as outputs.
- Slicing at a fixed position such as \`i + 9\`: the tag is 10 characters long, so every expectation keeps a leading space.`,
    wrong: [
      {
        code: `function expects(src) {
  const out = [];
  const tag = '# expect: ';
  for (const line of src.split('\\n')) {
    if (line.startsWith(tag)) {
      out.push(line.slice(tag.length));
    }
  }
  return out;
}`,
        why: 'The comment comes after the code on its line, so `startsWith` never matches a real test line.',
      },
      {
        code: `function expects(src) {
  const out = [];
  const tag = '# expect';
  for (const line of src.split('\\n')) {
    const i = line.indexOf(tag);
    if (i !== -1) {
      out.push(line.slice(i + 10));
    }
  }
  return out;
}`,
        why: 'Without the colon in the tag, `# expect runtime error:` lines are counted as outputs too.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'What happens when this Drip program runs?\n```\nprint "start";\nprint "a" * 2;\n```',
    options: [
      { t: 'It prints `start`, then stops with a runtime error on line 2', correct: true, why: 'Drip checks types as each line runs. Line 1 is fine, and the error only appears when `*` meets a string.' },
      { t: 'It refuses to run at all, before printing anything', why: 'That is what a static type checker would do. Drip is dynamically typed, so line 1 runs first.' },
      { t: 'It prints `start` and then `aa`', why: 'Drip has no string repetition. `*` needs two numbers.' },
      { t: 'It prints `start` and then `NaN`', why: 'Drip doesn’t convert the string as JavaScript would. It reports an error instead.' },
    ],
  },
  {
    q: 'Which of these Drip lines runs without an error?',
    options: [
      { t: '`print "3" + 4;`', why: 'A string and a number: no rule for `+` fits, so it is a runtime error.' },
      { t: '`print 3 + "4";`', why: 'The same pair the other way round; still a runtime error.' },
      { t: '`print none + none;`', why: '`none` is neither a number nor a string.' },
      { t: '`print "3" + "4";`', correct: true, why: 'Two strings join, so it prints `34`.' },
    ],
  },
  {
    q: 'What does `"a" + 1` give in JavaScript, and why is that not what Drip does?',
    options: [
      { t: '`"a1"`: JavaScript’s `+` converts the number to a string; Drip refuses and stops with a runtime error', correct: true, why: 'Both are dynamically typed; they differ in whether `+` converts.' },
      { t: 'A runtime error, exactly as in Drip', why: 'That is Python’s behaviour. JavaScript converts.' },
      { t: '`NaN`, because a string is not a number', why: 'With a string on either side, JavaScript’s `+` joins rather than adds.' },
      { t: 'A compile error, because JavaScript checks types first', why: 'Plain JavaScript checks no types before running; TypeScript would.' },
    ],
  },
  {
    q: 'Drip’s tree-walker and its VM print different things for the same program. How do you decide which one is wrong?',
    options: [
      { t: 'The faster one is right', why: 'Speed says nothing about meaning.' },
      { t: 'Check the program against the spec: what the language says it must do', correct: true, why: 'The spec, here made concrete by the test programs, defines the right answer. Whichever disagrees with it has the bug.' },
      { t: 'The tree-walker is always right, because it came first', why: 'An implementation can have bugs no matter when it was written.' },
      { t: 'Neither: both answers are fine', why: 'If the outputs differ, at least one of them breaks the language’s rules.' },
    ],
  },
  {
    q: 'A new Drip implementation passes every test program in the corpus. What can you say?',
    options: [
      { t: 'It is certainly correct', why: 'Tests only cover the programs someone wrote down; a program none of them tries could still go wrong.' },
      { t: 'Nothing: tests say nothing about correctness', why: 'They say a lot. Every passed test is one program it handles exactly as the spec says.' },
      { t: 'It agrees with the spec on those programs, which is strong evidence, not proof', correct: true, why: 'That is exactly what a test suite gives you.' },
      { t: 'It must be faster than the tree-walker', why: 'The tests check output, not speed.' },
    ],
  },
];
