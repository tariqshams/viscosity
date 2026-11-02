// Chapter 97 cards (parser generators and PEG). Keys are stable ids.

export const prompts = {
  'generator-what': {
    q: 'What does a parser generator take in, and what does it give out?',
    a: 'It takes a grammar (usually with an action attached to each rule) and gives out the source code of a parser for it.',
  },
  'action-what': {
    q: 'In `exp: exp \'+\' exp { $$ = $1 + $3; }`, what does the part in braces do?',
    a: 'It is the rule’s action: when the parser reduces by this rule, the value of the whole ($$) becomes the first part’s value plus the third’s.',
  },
  'antlr-topdown': {
    q: 'Does ANTLR build LR tables?',
    a: 'No. ANTLR 4 builds top-down parsers; its ALL(*) method chooses between alternatives by looking ahead as far as it needs, while parsing.',
  },
  'ordered-choice': {
    q: 'What does the PEG choice `x / y` do?',
    a: 'It tries x; only if x fails does it try y, at the same position. If x succeeds, y is never tried.',
  },
  'peg-unambiguous': {
    q: 'Why can a PEG never be ambiguous?',
    a: 'Every choice is ordered and every repetition is greedy, so a rule at a position either fails or succeeds in exactly one way.',
  },
  'a-ab-trap': {
    q: 'With `A ← "a" / "ab"`, what does `A` match on the input `ab`, and how do you fix it?',
    a: 'Only `a`; the first alternative succeeds, so "ab" is never tried. Put the longer alternative first: `A ← "ab" / "a"`.',
  },
  'packrat-what': {
    q: 'What does a packrat parser remember?',
    a: 'For each rule and each position, the result of parsing that rule there (where it ended, or that it failed), so the work is never repeated.',
  },
  'packrat-cost': {
    q: 'What does packrat parsing gain, and what does it cost?',
    a: 'It gains linear time (each rule runs at most once per position); it costs memory for the table.',
  },
};

export const examples = {
  'peg-keyword': {
    title: 'PEG pieces as functions, and a keyword',
    code: `// a parser: (src, i) => end, or -1
const lit = (s) => (src, i) =>
  src.startsWith(s, i)
    ? i + s.length
    : -1;
const seq = (...ps) => (src, i) => {
  for (const p of ps) {
    if (i < 0) return -1;
    i = p(src, i);
  }
  return i;
};
// !p: succeeds, using up nothing,
// when p fails
const not = (p) => (src, i) =>
  p(src, i) < 0 ? i : -1;
// p*: as many as possible
const many = (p) => (src, i) => {
  for (;;) {
    const j = p(src, i);
    if (j < 0) return i;
    i = j;
  }
};
const letter = (src, i) =>
  /[a-z]/.test(src[i] ?? '')
    ? i + 1
    : -1;

const IF = seq(lit('if'), not(letter));
const NAME = seq(letter, many(letter));
console.log(IF('if x', 0));
console.log(IF('iffy', 0));
console.log(NAME('iffy', 0));`,
  },
};

const GIVEN = `// a parser: (src, i) => end position,
// or -1 if it does not match at i
const lit = (s) => (src, i) =>
  src.startsWith(s, i)
    ? i + s.length
    : -1;
const seq = (...ps) => (src, i) => {
  for (const p of ps) {
    if (i < 0) return -1;
    i = p(src, i);
  }
  return i;
};`;

export const exercises = {
  'peg-memo': {
    title: 'Ordered choice and a memo table',
    prompt:
      'A parser here is a function `(src, i)` that returns the position where its match ends, or `-1` if it does not match at `i`; `lit` and `seq` are given. Write `choice(...ps)`, which returns a parser that tries each of `ps` at `i`, in order, and returns the result of the first that succeeds (or `-1` if none does). Then write `memo(p)`, which returns a parser that gives the same answers as `p`, but calls `p` at most once for each input string and position, remembering the results.',
    starter: `${GIVEN}

function choice(...ps) {
  return (src, i) => -1;
}

function memo(p) {
  return p;
}`,
    solution: `${GIVEN}

function choice(...ps) {
  return (src, i) => {
    for (const p of ps) {
      const j = p(src, i);
      if (j >= 0) return j;
    }
    return -1;
  };
}

function memo(p) {
  const table = new Map();
  return (src, i) => {
    const key = src + '@' + i;
    if (!table.has(key)) {
      table.set(key, p(src, i));
    }
    return table.get(key);
  };
}`,
    tests: `test('the first success wins', () => {
  expect(choice(lit('a'), lit('ab'))('ab', 0)).toBe(1);
  expect(choice(lit('ab'), lit('a'))('ab', 0)).toBe(2);
});
test('later alternatives are tried after a failure', () => {
  expect(choice(lit('b'), lit('a'))('ab', 0)).toBe(1);
});
test('no alternative matches: -1', () => {
  expect(choice(lit('x'), lit('y'))('ab', 0)).toBe(-1);
});
test('a successful choice is never revisited', () => {
  const p = seq(choice(lit('a'), lit('ab')), lit('c'));
  expect(p('abc', 0)).toBe(-1);
  expect(p('ac', 0)).toBe(2);
});
test('a memoised rule runs once per position', () => {
  let calls = 0;
  const A = memo((s, i) => { calls++; return lit('aa')(s, i); });
  const S = choice(seq(A, lit('x')), seq(A, lit('y')));
  expect(S('aay', 0)).toBe(3);
  expect(calls).toBe(1);
});
test('memo keeps positions apart', () => {
  const B = memo(lit('a'));
  expect(B('ba', 0)).toBe(-1);
  expect(B('ba', 1)).toBe(2);
});
test('memo keeps different inputs apart', () => {
  const B = memo(lit('a'));
  expect(B('a', 0)).toBe(1);
  expect(B('b', 0)).toBe(-1);
});`,
    hints: [
      '`choice` returns a new function `(src, i) => ...`. Inside it, loop over `ps`, call each at the same `i`, and stop at the first result that is not `-1`.',
      'Every alternative must start at the same `i`: do not change `i` inside the loop. If the loop finishes without a success, return `-1`.',
      'For `memo`, make one `Map` outside the returned function, so it survives between calls. Build a key from both the input and the position, such as `src + "@" + i`; if the map does not have the key, call `p` and store the result; then return what is stored.',
    ],
    walkthrough: `**How to think about it.** Both functions are *higher-order*: they take parsers and return a new parser, a function with the same \`(src, i)\` shape. For \`choice\`, the chapter's Formal box is the whole specification: try the alternatives at the same position, in order, and the first success is the answer. For \`memo\`, the question is what the answer depends on: a parser's result depends only on the input and the position, so those two together are the key of the table, and the table must outlive each single call, which is what a closure gives us.

**The solution, line by line.**

- \`function choice(...ps) {\` collects any number of parsers into the array \`ps\`.
- \`  return (src, i) => {\` returns the new parser.
- \`    for (const p of ps) {\` tries the alternatives in the order they were given: this order is what makes the choice *ordered*.
- \`      const j = p(src, i);\` runs one alternative at the same position \`i\` every time (this is the backtracking: a failed alternative leaves no trace).
- \`      if (j >= 0) return j;\` takes the first success and stops, so later alternatives are never tried.
- \`    return -1;\` is reached only if every alternative failed.
- \`function memo(p) {\` takes one parser.
- \`  const table = new Map();\` is created once per memoised parser, outside the function it returns, so every call shares it.
- \`  return (src, i) => {\` is the memoised parser.
- \`    const key = src + '@' + i;\` makes a key from the input and the position. Using only \`i\` would be wrong: the same parser used on two inputs would return the first input's answer for the second.
- \`    if (!table.has(key)) {\` / \`table.set(key, p(src, i));\` runs \`p\` the first time only and stores its answer, which may be \`-1\` (a failure is worth remembering too, which is why the check uses \`has\` and not the stored value).
- \`    return table.get(key);\` returns the remembered answer.

In the test \`S('aay', 0)\`, the first alternative calls \`A\` at 0, which runs and stores 2; \`lit('x')\` fails at 2, so \`choice\` tries the second alternative, which calls \`A\` at 0 again and gets 2 from the table without running it: one call in all.

**Common wrong attempts.**

- Returning the *longest* match instead of the first is what a regular expression engine or a scanner might do, but it is not ordered choice: \`choice(lit('a'), lit('ab'))\` must return 1 on \`ab\`.
- Keying the table by the position alone gives stale answers as soon as the parser sees a second input.
- Checking \`if (table.get(key))\` instead of \`has\` forgets cached failures (\`-1\` is truthy, but a cached \`0\`, a match ending at position 0, is not), so some results are recomputed or, worse, misread.`,
    wrong: [
      {
        code: `${GIVEN}

function choice(...ps) {
  return (src, i) => {
    let best = -1;
    for (const p of ps) {
      best = Math.max(best, p(src, i));
    }
    return best;
  };
}

function memo(p) {
  const table = new Map();
  return (src, i) => {
    const key = src + '@' + i;
    if (!table.has(key)) {
      table.set(key, p(src, i));
    }
    return table.get(key);
  };
}`,
        why: 'This takes the longest match, not the first success, so `choice(lit("a"), lit("ab"))` returns 2 on `ab`: that is not ordered choice.',
      },
      {
        code: `${GIVEN}

function choice(...ps) {
  return (src, i) => {
    for (const p of ps) {
      const j = p(src, i);
      if (j >= 0) return j;
    }
    return -1;
  };
}

function memo(p) {
  const table = new Map();
  return (src, i) => {
    if (!table.has(i)) {
      table.set(i, p(src, i));
    }
    return table.get(i);
  };
}`,
        why: 'The table is keyed by position only, so after `B("a", 0)` the call `B("b", 0)` wrongly returns 1.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'When does a parser generator do its work?',
    options: [
      { t: 'Every time a program is compiled', why: 'That is when the *generated* parser runs; the generator ran earlier.' },
      { t: 'Once, when the compiler is built, writing the parser’s code from the grammar', correct: true, why: 'The generator turns the grammar into parser code; that code then runs on every program.' },
      { t: 'Only when the program has a syntax error', why: 'The generator is not involved in parsing programs at all.' },
    ],
  },
  {
    q: 'In the PEG `A ← "ab" / "a"`, what does `A` match on the input `ac`?',
    options: [
      { t: 'Nothing: the first alternative fails, so A fails', why: 'A failed alternative only means the next one is tried.' },
      { t: '`a`', correct: true, why: '"ab" fails at position 0, so "a" is tried at the same position and succeeds.' },
      { t: '`ac`', why: 'Neither alternative matches a c.' },
    ],
  },
  {
    q: 'What does `"if" ![a-z]` match?',
    options: [
      { t: '`if` followed by a non-letter, consuming that character too', why: '`!` never consumes anything; it only checks.' },
      { t: 'Any word starting with `if`', why: 'The predicate fails when a letter follows, so `iffy` does not match.' },
      { t: 'The two letters `if`, but only when no letter comes right after them', correct: true, why: 'The `!` predicate checks the next character without using it up.' },
    ],
  },
  {
    q: 'Why does the PEG rule `E ← E "+" T / T` never finish?',
    options: [
      { t: 'It is left recursive: parsing E starts by parsing E at the same position', correct: true, why: 'Nothing is consumed before the recursive call, so it recurses until the stack overflows.' },
      { t: 'Ordered choice tries T first', why: 'It tries the first alternative first, which is the left-recursive one.' },
      { t: 'PEGs cannot express addition', why: '`E ← T ("+" T)*` expresses it with repetition.' },
    ],
  },
  {
    q: 'What makes packrat parsing run in linear time?',
    options: [
      { t: 'It never backtracks', why: 'It backtracks as much as any PEG parser; it just never redoes work.' },
      { t: 'It uses an LR table', why: 'Packrat parsers are recursive, top-down parsers with a memo table.' },
      { t: 'It remembers each rule’s result at each position, so each runs at most once there', correct: true, why: 'With a fixed number of rules, that bounds the work by a constant times the input length.' },
    ],
  },
];
