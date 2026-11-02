// Cards for the second half of chapter 75 (staged split): minimal DFAs
// and scanner generators.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'equiv-what': {
    q: 'When are two states of a DFA equivalent?',
    a: 'When every possible rest of the input gives the same verdict (accept or reject) from both of them.',
  },
  'first-split': {
    q: 'In minimisation by splitting, what are the first groups, and why?',
    a: 'Accepting states and non-accepting states: the empty rest of the input already tells them apart.',
  },
  'when-split': {
    q: 'When must a group of states be split?',
    a: 'When, on some character, two of its members go to states in different groups.',
  },
  'token-groups': {
    q: 'Why does a scanner start minimisation with one group per token type, not just "accepting"?',
    a: 'Otherwise a keyword state could merge with a name state, and the scanner could no longer say which token it found.',
  },
  'generator-what': {
    q: 'What does a scanner generator such as lex or flex take in, and what does it produce?',
    a: 'It takes token rules (a regular expression and an action each) and produces the source code of a scanner.',
  },
  'longest-rule': {
    q: 'Under flex’s rules, is `letter` the keyword `let` followed by `ter`, or one name? Why?',
    a: 'One name: flex takes the rule that matches the most text, and the name rule matches six characters.',
  },
  'tie-rule': {
    q: 'Two flex rules match the same, longest text. Which one wins?',
    a: 'The one listed first in the rules file.',
  },
  'table-vs-direct': {
    q: 'What is the difference between a table-driven and a direct-coded scanner?',
    a: 'A table-driven scanner stores the DFA as data and runs one loop; a direct-coded one turns each state into code with comparisons and jumps.',
  },
  'js-alternation': {
    q: 'What does `/^(if|iffy)/.exec(\'iffy\')[0]` give, and why?',
    a: '`\'if\'`: a JavaScript alternation takes the first alternative that works, not the longest.',
  },
};

export const examples = {
  'mini-lex': {
    title: 'Choosing a token: longest match, then first rule',
    code: `const RULES = [
  ['LET', /let/y],
  ['IDENT', /[A-Za-z_]\\w*/y],
  ['NUMBER', /\\d+(\\.\\d+)?/y],
  ['EQ_EQ', /==/y],
  ['EQ', /=/y],
];

function pick(src, i) {
  let best = null;
  let len = 0;
  for (const [type, re] of RULES) {
    re.lastIndex = i;
    const m = re.exec(src);
    const n = m ? m[0].length : 0;
    if (n > len) {
      best = type;
      len = n;
    }
  }
  return [best, src.slice(i, i + len)];
}

console.log(pick('letter', 0));
console.log(pick('let x', 0));
console.log(pick('a==3', 1));
console.log(pick('4.25;', 0));`,
  },
};

export const exercises = {
  'make-scanner': {
    title: 'A tiny scanner generator',
    prompt:
      'Write `makeScanner(rules)`. Each rule is `[type, regex]` (the regexes have no flags). It returns a function `scan(src)` that cuts `src` into tokens, returned as an array of `[type, lexeme]` pairs, using flex’s two rules: at each position take the rule with the **longest** match, and on a tie the rule **listed first**. A rule whose type is `null` matches text to skip (such as spaces): consume it but make no token. If no rule matches at some position, throw an `Error`.',
    starter: `function makeScanner(rules) {
  return (src) => {
    return [];
  };
}`,
    solution: `function makeScanner(rules) {
  const res = rules.map(([t, re]) =>
    [t, new RegExp(re.source, 'y')]);
  return (src) => {
    const out = [];
    let i = 0;
    while (i < src.length) {
      let best = null;
      let len = 0;
      for (const [t, re] of res) {
        re.lastIndex = i;
        const m = re.exec(src);
        if (m && m[0].length > len) {
          best = t;
          len = m[0].length;
        }
      }
      if (len === 0) {
        throw new Error('stuck');
      }
      const lex = src.slice(i, i + len);
      if (best !== null) {
        out.push([best, lex]);
      }
      i += len;
    }
    return out;
  };
}`,
    tests: `const scan = makeScanner([
  [null, /[ \\t\\n]+/],
  [null, /#[^\\n]*/],
  ['let', /let/],
  ['if', /if/],
  ['number', /[0-9]+(\\.[0-9]+)?/],
  ['identifier', /[A-Za-z_][A-Za-z_0-9]*/],
  ['==', /==/],
  ['=', /=/],
  ['..', /\\.\\./],
  ['.', /\\./],
  [';', /;/],
]);
const types = (s) => scan(s).map((t) => t[0]);
test('a Drip statement', () => {
  expect(scan('let x = 4.25;')).toEqual([
    ['let', 'let'], ['identifier', 'x'],
    ['=', '='], ['number', '4.25'],
    [';', ';'],
  ]);
});
test('longest match beats rule order', () => {
  expect(scan('letter')).toEqual(
    [['identifier', 'letter']]);
  expect(types('iffy')).toEqual(
    ['identifier']);
  expect(types('a==b')).toEqual(
    ['identifier', '==', 'identifier']);
});
test('a tie goes to the earlier rule', () => {
  expect(types('if let')).toEqual(
    ['if', 'let']);
});
test('skipped text makes no token', () => {
  expect(scan('  ')).toEqual([]);
  expect(types('x\\n\\ty')).toEqual(
    ['identifier', 'identifier']);
});
test('ranges and comments', () => {
  expect(types('1..5 # to five')).toEqual(
    ['number', '..', 'number']);
});
test('no rule matches: throw', () => {
  expect(() => scan('x @ y')).toThrow();
});`,
    hints: [
      'Build the scanner as a loop over positions `i`: at each one, try every rule there and keep the longest match. Make each regex sticky (`new RegExp(re.source, \'y\')`) so that, after setting `lastIndex = i`, it can only match starting at `i`.',
      'Keep `best` (the winning type) and `len` (its length). Replace them only when a match is *strictly* longer (`>`, not `>=`): that is what makes the earlier rule win a tie.',
      'After trying all rules: if `len` is 0, throw; if `best` is not `null`, push `[best, src.slice(i, i + len)]`; either way, move on with `i += len`.',
    ],
    walkthrough: `**How to think about it.** A generated scanner does two jobs: at one position, decide which rule wins, and then repeat that from the end of each token until the input is used up. The first job is the runnable \`pick\` from the chapter; the second is the familiar scanner loop of chapter 68, with \`i\` playing the part of \`start\`. Two details carry the whole meaning of flex's rules: comparing lengths with a strict \`>\` (so a later rule must be *longer* to win, and ties stay with the earlier rule), and making each regex *sticky*, because a normal regex would happily match further along the string and report a token that does not start at \`i\`.

**The solution, line by line.**

- \`const res = rules.map(([t, re]) => [t, new RegExp(re.source, 'y')]);\` makes a sticky copy of each rule's regex once, up front. \`re.source\` is the pattern's text, and \`'y'\` adds the sticky flag.
- \`return (src) => {\` the scanner itself, a closure (chapter 12) that can see \`res\`.
- \`const out = []; let i = 0;\` the tokens so far and the current position.
- \`while (i < src.length) {\` one round per token (or per piece of skipped text).
- \`let best = null; let len = 0;\` no winner yet.
- \`for (const [t, re] of res) {\` tries every rule, in order.
- \`re.lastIndex = i;\` and \`const m = re.exec(src);\` because the regex is sticky, \`m\` is a match starting exactly at \`i\`, or \`null\`.
- \`if (m && m[0].length > len) { best = t; len = m[0].length; }\` keeps the strictly longest match; \`m[0]\` is the matched text.
- \`if (len === 0) { throw new Error(...); }\` no rule matched a single character here (a rule that matches the empty string does not count, since it would never move \`i\` on).
- \`const lex = src.slice(i, i + len);\` cuts out the winning match, and \`if (best !== null) { out.push([best, lex]); }\` makes a token from it, unless the winning rule is a skip rule.
- \`i += len;\` moves past the token, so the next round starts where this one ended.
- \`return out;\` all the tokens.

For \`letter\`, the \`let\` rule matches 3 characters and \`identifier\` matches 6, so \`identifier\` wins. For \`if\` in \`if let\`, both \`if\` and \`identifier\` match 2 characters; \`if\` was tried first and \`identifier\` is not strictly longer, so \`if\` stays.

**Common wrong attempts.**

- Using \`>=\` lets a later rule win a tie, so \`if\` and \`let\` come out as identifiers.
- Stopping at the first rule that matches (no longest match) turns \`letter\` into \`let\` and then \`ter\`, and \`==\` into two \`=\` tokens if \`=\` is listed first.
- Forgetting the sticky flag: \`/let/.exec('x let')\` finds the \`let\` at index 2 even when \`i\` is 0, so tokens are cut from the wrong place.`,
    wrong: [
      {
        code: `function makeScanner(rules) {
  const res = rules.map(([t, re]) =>
    [t, new RegExp(re.source, 'y')]);
  return (src) => {
    const out = [];
    let i = 0;
    while (i < src.length) {
      let best = null;
      let len = 0;
      for (const [t, re] of res) {
        re.lastIndex = i;
        const m = re.exec(src);
        if (m && m[0].length >= len) {
          best = t;
          len = m[0].length;
        }
      }
      if (len === 0) {
        throw new Error('stuck');
      }
      const lex = src.slice(i, i + len);
      if (best !== null) {
        out.push([best, lex]);
      }
      i += len;
    }
    return out;
  };
}`,
        why: 'With `>=`, a later rule of the same length wins the tie, so `if` and `let` become identifiers.',
      },
      {
        code: `function makeScanner(rules) {
  const res = rules.map(([t, re]) =>
    [t, new RegExp(re.source, 'y')]);
  return (src) => {
    const out = [];
    let i = 0;
    while (i < src.length) {
      let hit = null;
      for (const [t, re] of res) {
        re.lastIndex = i;
        const m = re.exec(src);
        if (m && m[0].length > 0) {
          hit = [t, m[0]];
          break;
        }
      }
      if (hit === null) {
        throw new Error('stuck');
      }
      if (hit[0] !== null) {
        out.push(hit);
      }
      i += hit[1].length;
    }
    return out;
  };
}`,
        why: 'Takes the first rule that matches instead of the longest, so `letter` becomes `let` then `ter`.',
      },
    ],
  },
  minimise: {
    optional: true,
    title: 'How small can a DFA be?',
    prompt:
      'Write `minimise(dfa, alphabet)`, which returns the **number of states** in the minimal DFA for the same language. The DFA has the usual shape `{ start, accept, next }`; its states are strings, every state has a row in `next` (possibly `{}`), and a missing entry means "no arrow". Use the splitting method: start with two groups (accepting, not accepting), and keep splitting until a round splits nothing. Treat "no arrow" as going to a group of its own.',
    starter: `function minimise(dfa, alphabet) {
  return Object.keys(dfa.next).length;
}`,
    solution: `function minimise(dfa, alphabet) {
  const qs = Object.keys(dfa.next);
  let group = {};
  for (const q of qs) {
    const a = dfa.accept.includes(q);
    group[q] = a ? 'A' : 'N';
  }
  let count = new Set(
    Object.values(group)).size;
  while (true) {
    const sig = {};
    for (const q of qs) {
      let s = group[q];
      for (const c of alphabet) {
        const t = dfa.next[q][c];
        const g = t === undefined
          ? '-' : group[t];
        s += '|' + g;
      }
      sig[q] = s;
    }
    const n = new Set(
      Object.values(sig)).size;
    group = sig;
    if (n === count) return n;
    count = n;
  }
}`,
    tests: `test('if-or-name, as a language', () => {
  const d = { start: 'A',
    accept: ['B', 'C', 'D'],
    next: {
      A: { i: 'B', f: 'C', x: 'C' },
      B: { i: 'C', f: 'D', x: 'C' },
      C: { i: 'C', f: 'C', x: 'C' },
      D: { i: 'C', f: 'C', x: 'C' },
    } };
  expect(minimise(d, 'ifx')).toBe(2);
});
test('the a|b DFA', () => {
  const d = { start: 'S', accept: ['P', 'Q'],
    next: { S: { a: 'P', b: 'Q' },
      P: {}, Q: {} } };
  expect(minimise(d, 'ab')).toBe(2);
});
test('already minimal: ends in ab', () => {
  const d = { start: 'A', accept: ['C'],
    next: {
      A: { a: 'B', b: 'A' },
      B: { a: 'B', b: 'C' },
      C: { a: 'B', b: 'A' },
    } };
  expect(minimise(d, 'ab')).toBe(3);
});
test('needs two rounds of splitting', () => {
  const d = { start: '0', accept: ['3'],
    next: {
      0: { a: '1' }, 1: { a: '2' },
      2: { a: '3' }, 3: {},
      4: { a: '3' },
    } };
  expect(minimise(d, 'a')).toBe(4);
});`,
    hints: [
      'Give each state a group name in an object, `group[q]`, starting with `\'A\'` for accepting and `\'N\'` for the rest.',
      'One round: for each state, build a text *signature*: its current group, then the group of where each character leads (`\'-\'` for no arrow). States with the same signature stay together; different signatures mean a split. The signatures themselves can be the new group names.',
      'Count the different groups after each round (`new Set(Object.values(...)).size`). Splitting only ever makes more groups, so when a round leaves the count unchanged, nothing split: return the count.',
    ],
    walkthrough: `**How to think about it.** The stepper split groups by asking, for each member, "where do you go on each character, and which group is that in?". Two members that answer the same way to every character stay together; any difference splits them. A neat way to code that question is a *signature*: a string made of the state's current group and, for each character, the group it moves to. Equal signatures mean "still indistinguishable"; and because the signature starts with the current group, states from different groups can never end up merged.

**The solution, line by line.**

- \`const qs = Object.keys(dfa.next);\` every state (each has a row).
- The first loop sets \`group[q]\` to \`'A'\` or \`'N'\`: the first split, accepting or not.
- \`let count = new Set(Object.values(group)).size;\` how many groups there are now (one or two).
- \`while (true) {\` rounds of splitting, until we return.
- \`let s = group[q];\` the signature starts with the state's own group.
- For each character, \`const t = dfa.next[q][c];\` is where it leads, and \`g\` is that state's group, or \`'-'\` if there is no arrow; \`s += '|' + g;\` adds it to the signature.
- \`sig[q] = s;\` the state's new group name.
- \`const n = new Set(Object.values(sig)).size;\` the number of groups after this round.
- \`group = sig;\` the signatures become the groups for the next round.
- \`if (n === count) return n;\` no group split this round, so none ever will: \`n\` is the size of the minimal DFA.
- \`count = n;\` otherwise remember the new count and go round again.

In the last test, the first round splits \`{0, 1, 2, 4}\` into "goes to the accepting group on a" (\`2\` and \`4\`) and "does not" (\`0\` and \`1\`); the second round splits \`0\` from \`1\`, because \`1\` now leads into \`{2, 4}\` and \`0\` does not; the third round splits nothing, leaving \`{0}\`, \`{1}\`, \`{2, 4}\` and \`{3}\`: 4 states.

(To minimise a *scanner*, start each accepting state's group name with its token type instead of \`'A'\`, so the keyword and the name are never merged.)

**Common wrong attempts.**

- Doing a single round of splitting misses splits that only show up after others, as in the last test.
- Leaving the state's own group out of its signature can merge an accepting state with a non-accepting one whose arrows look the same.`,
    wrong: [
      {
        code: `function minimise(dfa, alphabet) {
  const qs = Object.keys(dfa.next);
  const group = {};
  for (const q of qs) {
    const a = dfa.accept.includes(q);
    group[q] = a ? 'A' : 'N';
  }
  const sig = {};
  for (const q of qs) {
    let s = group[q];
    for (const c of alphabet) {
      const t = dfa.next[q][c];
      const g = t === undefined
        ? '-' : group[t];
      s += '|' + g;
    }
    sig[q] = s;
  }
  return new Set(
    Object.values(sig)).size;
}`,
        why: 'Only one round of splitting: in the last test, 0 and 1 look alike after one round, so it answers 3 instead of 4.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Which pair of states can never be equivalent?',
    options: [
      { t: 'Two accepting states with no arrows at all', why: 'Those are equivalent: from both, only the empty rest of input is accepted.' },
      { t: 'An accepting state and a non-accepting state', correct: true, why: 'The empty rest of the input already tells them apart: one accepts it, the other does not.' },
      { t: 'Two non-accepting states that both lead to the same state on every character', why: 'Those are equivalent: every rest of the input goes the same way from both.' },
    ],
  },
  {
    q: 'Minimising the "if or a name" DFA as a plain language gives 2 states. Why is that wrong for a scanner?',
    options: [
      { t: 'It accepts different strings from the original', why: 'Minimisation never changes the language; the two-state DFA accepts exactly the same strings.' },
      { t: 'Two states are too few for any DFA', why: 'Two states can be perfectly correct for a language.' },
      { t: 'It merges the keyword state with the name state, so the scanner cannot say which token it found', correct: true, why: 'A scanner must report a token type, so it starts with one group per type and never merges them.' },
    ],
  },
  {
    q: 'A flex file lists `"if"` before `[a-z]+`. What does the input `iffy` become?',
    options: [
      { t: 'IF, then the name `fy`', why: 'flex prefers the rule matching the most text, and `[a-z]+` matches all four letters.' },
      { t: 'One name, `iffy`', correct: true, why: 'Longest match comes first: `[a-z]+` matches 4 characters, `"if"` only 2.' },
      { t: 'An error, because two rules match', why: 'Overlapping rules are normal; flex resolves them by length, then by order.' },
    ],
  },
  {
    q: 'In the same file, what does the input `if` become?',
    options: [
      { t: 'IF', correct: true, why: 'Both rules match 2 characters; on a tie the rule listed first wins.' },
      { t: 'A name', why: 'The name rule ties for length but comes later in the file.' },
      { t: 'It depends on what comes after it', why: 'After `if` the input ends; both rules match exactly two characters.' },
    ],
  },
  {
    q: 'What does `/^(=|==)/.exec(\'==\')[0]` give in JavaScript?',
    options: [
      { t: '`==`, because regexes take the longest match', why: 'That is how lex and flex choose between rules, but a JavaScript alternation takes the first alternative that works.' },
      { t: '`=`', correct: true, why: 'The first alternative, `=`, matches, so `==` is never tried.' },
      { t: '`null`', why: 'The first alternative matches, so there is a match.' },
    ],
  },
];
