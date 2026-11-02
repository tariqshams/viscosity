// Chapter 72 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'three-ops': {
    q: 'What are the three operators every regular expression is built with?',
    a: 'Concatenation (`ab`, one after the other), alternation (`a|b`, either one) and Kleene star (`a*`, zero or more times).',
  },
  'precedence': {
    q: 'Without brackets, how is `ab|c*` grouped?',
    a: 'As `(ab)|(c*)`: star binds tightest, then concatenation, then alternation.',
  },
  'epsilon': {
    q: 'What does the pattern ε (epsilon) match?',
    a: 'Only the empty string `""`, the string with no characters at all.',
  },
  'language-what': {
    q: 'What is the regular language `L(r)` of a regular expression `r`?',
    a: 'The set of all strings that `r` matches.',
  },
  'match-means': {
    q: 'In terms of languages, what does "the string w matches r" mean?',
    a: 'That w is a member of the set `L(r)`.',
  },
  'star-empty': {
    q: 'Is the empty string `""` in `L(a*)`? Why?',
    a: 'Yes: star means zero or more repetitions, and zero repetitions spells the empty string.',
  },
  'plus-means': {
    q: 'Write the JavaScript shorthands `r+` and `r?` using only the three basic operators (and ε).',
    a: '`r+` is `rr*` (one, then any more); `r?` is `r|ε` (it or nothing).',
  },
  'anchors': {
    q: 'Why does `/\\d+/.test(\'x42y\')` give `true`, and how do you make it `false`?',
    a: 'Without anchors the pattern only has to match somewhere inside the string. `/^\\d+$/` makes it match the whole string.',
  },
  'backref': {
    q: 'Why can a JavaScript backreference like `\\1` describe languages no regular expression can?',
    a: 'It requires "the same text again", which can count (for example the same number of a\'s on both sides); the three operators cannot count without limit.',
  },
};

export const examples = {
  'drip-regexes': {
    title: 'Drip’s token rules as JavaScript regexes',
    code: `const NUM = /^\\d+(\\.\\d+)?$/;
const NAME = /^[A-Za-z_][A-Za-z_0-9]*$/;

for (const s of ['7', '4.25', '4.']) {
  console.log(s, NUM.test(s));
}
for (const s of ['x1', '_n', '2x']) {
  console.log(s, NAME.test(s));
}
// Try: remove ^ and $, then test 'x42y'`,
  },
};

export const exercises = {
  'drip-patterns': {
    title: 'Drip’s tokens as patterns',
    prompt:
      'Write three anchored JavaScript regular expressions that match **exactly** these Drip token rules:\n\n- `NUMBER`: one or more digits, optionally followed by a dot and one or more digits (`7`, `12`, `3.5`, but not `4.`, `.5` or `1.2.3`).\n- `NAME`: a letter or `_`, then any letters, digits or `_` (`x`, `_count2`, but not `2x` or `a-b`).\n- `STRING`: a `"`, then any number of pieces, each either one character that is not `"` or `\\`, or an escape (a backslash followed by one of `n`, `t`, `"` or `\\`), then a closing `"`. So `"hi"`, `""` and `"say \\"hi\\""` match, but `"hi`, `"a"b"` and `"bad \\q"` do not.',
    starter: `const NUMBER = /^$/;
const NAME = /^$/;
const STRING = /^$/;

console.log(NUMBER.test('3.5'));`,
    solution: `const NUMBER = /^[0-9]+(\\.[0-9]+)?$/;
const NAME = /^[A-Za-z_][A-Za-z_0-9]*$/;
const STRING =
  /^"([^"\\\\]|\\\\[nt"\\\\])*"$/;`,
    tests: `test('numbers', () => {
  for (const s of ['7', '12', '3.5']) {
    expect(NUMBER.test(s)).toBe(true);
  }
});
test('not numbers', () => {
  for (const s of ['', '4.', '.5', '1.2.3', 'x']) {
    expect(NUMBER.test(s)).toBe(false);
  }
});
test('names', () => {
  for (const s of ['x', '_count2', 'Total', 'a_b']) {
    expect(NAME.test(s)).toBe(true);
  }
});
test('not names', () => {
  for (const s of ['', '2x', 'a-b', 'a b']) {
    expect(NAME.test(s)).toBe(false);
  }
});
test('strings', () => {
  const ok = ['"hi"', '""', '"say \\\\"hi\\\\""',
    '"a\\\\\\\\b"', '"tab\\\\there"'];
  for (const s of ok) {
    expect(STRING.test(s)).toBe(true);
  }
});
test('not strings', () => {
  const bad = ['"hi', 'hi"', '"a"b"', 'hi',
    '"bad \\\\q"', '"ends \\\\"'];
  for (const s of bad) {
    expect(STRING.test(s)).toBe(false);
  }
});`,
    hints: [
      'Say each rule out loud with "then", "or" and "any number of", and turn each phrase into an operator. Keep `^` at the start and `$` at the end of all three.',
      'NUMBER: "one or more digits" is `[0-9]+`; "optionally (a dot, then one or more digits)" is a group followed by `?`. A dot must be written `\\.` to mean a real dot. NAME: one character from `[A-Za-z_]`, then `*` of a slightly bigger class. STRING: a quote, then `( ... | ... )*`, then a quote.',
      'Inside a regex a backslash is written `\\\\`. The ordinary character is `[^"\\\\]` ("not a quote, not a backslash"), and an escape is `\\\\[nt"\\\\]`. Full answers: `/^[0-9]+(\\.[0-9]+)?$/`, `/^[A-Za-z_][A-Za-z_0-9]*$/` and `/^"([^"\\\\]|\\\\[nt"\\\\])*"$/`.',
    ],
    walkthrough: `**How to think about it.** Each rule is already a sentence made of "then", "or" and "any number of", so the work is a translation, one phrase at a time. Write the sentence first, then replace each phrase with its operator: "then" is putting two pieces side by side, "or" is \`|\` (or a character class, when the choice is between single characters), "any number of" is \`*\`, "one or more" is \`+\` and "optionally" is \`?\`. Finally, because \`test\` looks for a match *anywhere*, wrap each pattern in \`^...$\` so it has to cover the whole string.

**The solution, line by line.**

- \`const NUMBER = /^[0-9]+(\\.[0-9]+)?$/;\` reads as: start of string; \`[0-9]+\`, one or more digits (the class \`[0-9]\` is the alternation \`0|1|...|9\`, and \`+\` is "it, then any more of it"); then the group \`(\\.[0-9]+)\`, a real dot (the backslash stops \`.\` from meaning "any character") followed by one or more digits; the \`?\` after the group makes the whole fraction optional; then end of string. As such, \`3.5\` matches, \`7\` matches (the fraction is skipped), and \`4.\` fails, because once the dot is taken the group demands at least one digit after it.
- \`const NAME = /^[A-Za-z_][A-Za-z_0-9]*$/;\` is: exactly one character that is a letter (either case) or an underscore, then \`*\` of the same class with digits added, then the end. \`2x\` fails at its very first character, and \`a-b\` fails at the \`-\`, which is in neither class.
- \`const STRING =\` and, on the next line, \`/^"([^"\\\\]|\\\\[nt"\\\\])*"$/;\` is: a quote; then a group repeated any number of times, where each round is *either* \`[^"\\\\]\`, one character that is neither a quote nor a backslash (the \`^\` *inside* square brackets means "not one of these", a different job from the \`^\` outside), *or* \`\\\\[nt"\\\\]\`, a backslash (written \`\\\\\` because a lone backslash starts an escape in the regex itself) followed by one of the four allowed letters; then a closing quote and the end. In \`"say \\"hi\\""\` the inner quotes each come after a backslash, so they are taken by the escape branch and never end the string early. \`"ends \\"\` fails, because the backslash takes the last quote as an escape, leaving no closing quote; \`"bad \\q"\` fails because \`q\` is not one of the allowed escapes, and a bare backslash is not an ordinary character.

**Common wrong attempts.**

- \`/^[0-9]*\\.?[0-9]*$/\` looks like "digits, maybe a dot, digits", but every part is optional, so it also matches the empty string, \`4.\` and \`.5\`. Each "one or more" must be \`+\`, and the dot and its digits must be optional *together*, as one group.
- Forgetting the backslash, \`/^[0-9]+(.[0-9]+)?$/\`, lets \`4x5\` through, since an unescaped dot is any character.
- \`/^"[^"]*"$/\` (no escapes) rejects \`"say \\"hi\\""\`, because the first inner quote ends the string; and \`/^".*"$/\` accepts \`"a"b"\`.`,
    wrong: [
      {
        code: `const NUMBER = /^[0-9]*\\.?[0-9]*$/;
const NAME = /^[A-Za-z_][A-Za-z_0-9]*$/;
const STRING =
  /^"([^"\\\\]|\\\\[nt"\\\\])*"$/;`,
        why: 'Every part of NUMBER is optional, so `""`, `4.` and `.5` all match.',
      },
      {
        code: `const NUMBER = /^[0-9]+(\\.[0-9]+)?$/;
const NAME = /^[a-z]+$/;
const STRING = /^"[^"]*"$/;`,
        why: 'NAME rejects `_count2` and `Total`; STRING has no escapes, so `"say \\"hi\\""` is rejected.',
      },
    ],
  },
  words: {
    optional: true,
    title: 'Listing a language',
    prompt:
      'A pattern can be stored as a tree of objects: `{ t: \'chr\', c: \'a\' }`, `{ t: \'eps\' }`, `{ t: \'cat\', a, b }`, `{ t: \'alt\', a, b }` and `{ t: \'star\', a }`. Write `words(r, n)`, which returns an array of every string in `L(r)` whose length is at most `n`, each exactly once (in any order). For example `(a|b)c` with `n = 2` gives `["ac", "bc"]`.',
    starter: `function words(r, n) {
  // one case for each kind of node
  return [];
}`,
    solution: `function words(r, n) {
  if (r.t === 'eps') return [''];
  if (r.t === 'chr') {
    return n >= 1 ? [r.c] : [];
  }
  const out = new Set();
  if (r.t === 'alt') {
    for (const w of words(r.a, n)) {
      out.add(w);
    }
    for (const w of words(r.b, n)) {
      out.add(w);
    }
  }
  if (r.t === 'cat') {
    for (const x of words(r.a, n)) {
      const m = n - x.length;
      for (const y of words(r.b, m)) {
        out.add(x + y);
      }
    }
  }
  if (r.t === 'star') {
    out.add('');
    const parts = words(r.a, n);
    let grew = true;
    while (grew) {
      grew = false;
      for (const x of [...out]) {
        for (const p of parts) {
          const w = x + p;
          if (w.length > n) continue;
          if (out.has(w)) continue;
          out.add(w);
          grew = true;
        }
      }
    }
  }
  return [...out];
}`,
    tests: `const C = (c) => ({ t: 'chr', c });
const Cat = (a, b) => ({ t: 'cat', a, b });
const Alt = (a, b) => ({ t: 'alt', a, b });
const Star = (a) => ({ t: 'star', a });
const E = { t: 'eps' };
const ab = Alt(C('a'), C('b'));
const got = (r, n) => words(r, n).sort();
test('one character', () => {
  expect(got(C('a'), 3)).toEqual(['a']);
  expect(got(C('a'), 0)).toEqual([]);
});
test('alternation and epsilon', () => {
  expect(got(Alt(C('x'), E), 1))
    .toEqual(['', 'x']);
});
test('concatenation', () => {
  expect(got(Cat(ab, C('c')), 2))
    .toEqual(['ac', 'bc']);
});
test('star', () => {
  expect(got(Star(C('a')), 3))
    .toEqual(['', 'a', 'aa', 'aaa']);
});
test('(a|b)*c up to length 3', () => {
  expect(got(Cat(Star(ab), C('c')), 3))
    .toEqual(['aac', 'abc', 'ac', 'bac',
      'bbc', 'bc', 'c']);
});
test('no duplicates', () => {
  const r = Star(Alt(C('a'), Cat(C('a'), C('a'))));
  expect(got(r, 2)).toEqual(['', 'a', 'aa']);
});`,
    hints: [
      'Follow the Formal block: one `if` for each kind of node, and let the `cat`, `alt` and `star` cases call `words` on their children (recursion, with the leaves as base cases).',
      'Keep the answers in a `Set`, so duplicates vanish. For `cat`, glue every left word `x` to every right word `y`, but ask the right child only for words of length at most `n - x.length`.',
      'For `star`, start from `{""}` and keep extending: for every word you already have and every word of the child, add the joined word if it is short enough and new; stop when a whole pass adds nothing.',
    ],
    walkthrough: `**How to think about it.** The Formal block in the chapter already says what each node's language is, in terms of its children's languages; the function is that block, turned into code, with one extra rule: never build a word longer than \`n\`. That rule is what makes the infinite languages (anything with a star) finite enough to list. The leaves are the base cases of the recursion, and every other node calls \`words\` on its children.

**The solution, line by line.**

- \`if (r.t === 'eps') return [''];\` ε matches only the empty string, whose length 0 is always allowed.
- \`if (r.t === 'chr') { return n >= 1 ? [r.c] : []; }\` A character matches the one-letter string, unless the length limit is 0.
- \`const out = new Set();\` collects answers for the three operator cases; a set ignores a second copy of the same word, which is how "each exactly once" is kept.
- The \`alt\` case adds every word of the left child and every word of the right child: the union.
- The \`cat\` case takes each left word \`x\`, works out how much length is left, \`m = n - x.length\`, and asks the right child for words up to \`m\`, so every glued word \`x + y\` fits.
- The \`star\` case begins with \`out.add('')\` (zero repetitions), and \`parts\` holds the child's words. The \`while (grew)\` loop repeats passes: in each, every word already found is extended by every part; a word that is too long, or already known, is skipped with \`continue\`; anything new is added and sets \`grew\`. Copying \`[...out]\` before the inner loops means we do not change the set while walking it. When a pass adds nothing, every reachable word of length up to \`n\` is in the set.
- \`return [...out];\` turns the set back into an array.

**Common wrong attempts.**

- Returning an array with repeats: \`a|aa\` starred spells \`aa\` two ways (\`a\` then \`a\`, or \`aa\`), so without a set the last test sees \`aa\` twice.
- For \`star\`, adding only \`parts\` once gives zero or one repetition, not "any number".
- For \`cat\`, passing \`n\` (not \`n - x.length\`) to the right child, then forgetting to filter, returns words longer than \`n\`.`,
    wrong: [
      {
        code: `function words(r, n) {
  if (r.t === 'eps') return [''];
  if (r.t === 'chr') {
    return n >= 1 ? [r.c] : [];
  }
  if (r.t === 'star') {
    return ['', ...words(r.a, n)];
  }
  const out = [];
  if (r.t === 'alt') {
    out.push(...words(r.a, n));
    out.push(...words(r.b, n));
  }
  if (r.t === 'cat') {
    for (const x of words(r.a, n)) {
      const m = n - x.length;
      for (const y of words(r.b, m)) {
        out.push(x + y);
      }
    }
  }
  return out;
}`,
        why: 'Star here allows at most one repetition, so `aa` and `aaa` are missing from `a*`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Which strings are in `L(ab*)`?',
    options: [
      { t: '`""`, `ab`, `abab`, …', why: 'That is `(ab)*`. Without brackets the star applies only to `b`.' },
      { t: '`a`, `ab`, `abb`, …', correct: true, why: 'One `a`, then zero or more `b`s: star binds tighter than concatenation.' },
      { t: 'only `ab`', why: 'The star allows any number of `b`s, including zero and more than one.' },
    ],
  },
  {
    q: 'How many strings are in `L((a|b)(a|b)(a|b))`?',
    options: [
      { t: '3', why: 'Each of the three positions has its own choice, and the choices multiply.' },
      { t: '6', why: 'That adds the choices; concatenation multiplies them.' },
      { t: '8', correct: true, why: 'Two choices, three times over: 2 × 2 × 2 = 8 strings, from `aaa` to `bbb`.' },
      { t: 'infinitely many', why: 'There is no star, so the length is always exactly 3.' },
    ],
  },
  {
    q: 'Which basic regular expression means the same as the JavaScript `/^x+y?$/`?',
    options: [
      { t: '`xx*(y|ε)`', correct: true, why: '`x+` is `xx*` (at least one x) and `y?` is `y|ε` (a y or nothing).' },
      { t: '`x*y*`', why: 'That allows no x at all, and many y\'s.' },
      { t: '`x*(y|ε)`', why: '`+` means one or more, so the x cannot be left out.' },
    ],
  },
  {
    q: 'What does `/^\\d+(\\.\\d+)?$/.test(\'4.\')` return, and why?',
    options: [
      { t: '`true`, because `4` matches `\\d+`', why: 'The `$` demands the whole string be matched, and the dot is left over.' },
      { t: '`true`, because `.` matches anything', why: 'The dot is escaped as `\\.`, so it means a real dot, and the group then needs a digit after it.' },
      { t: '`false`', correct: true, why: 'After `4`, the optional group needs a dot *and* at least one digit; with neither the rest of the pattern nor `$` able to account for the lone dot, there is no match.' },
    ],
  },
  {
    q: 'Which of these is **not** in the language of Drip names, `[A-Za-z_][A-Za-z_0-9]*`?',
    options: [
      { t: '`_`', why: 'One underscore is a valid first character, and the star allows nothing after it.' },
      { t: '`x2y`', why: 'A letter, then letters and digits: fine.' },
      { t: '`9lives`', correct: true, why: 'The first character must come from `[A-Za-z_]`, and `9` does not.' },
    ],
  },
  {
    q: 'Why is "some a\'s, then b, then the same number of a\'s" not a regular language?',
    options: [
      { t: 'Because it contains infinitely many strings', why: '`a*` is infinite too, and regular. Size is not the problem.' },
      { t: 'Because it needs to count without a limit, which the three operators cannot do', correct: true, why: 'Star repeats freely but cannot remember how many times; JavaScript needs a backreference, `/^(a+)b\\1$/`, which goes beyond regular expressions.' },
      { t: 'Because it uses the letter b in the middle', why: 'Plenty of regular languages have a fixed letter in the middle, like `a*ba*`. The trouble is matching the two counts.' },
    ],
  },
];
