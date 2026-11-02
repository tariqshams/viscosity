// Chapter 73 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'state-what': {
    q: 'In a finite automaton, what does a state stand for?',
    a: 'Everything the machine remembers about the input so far, squeezed into one of a fixed, finite set of situations.',
  },
  'dfa-one-arrow': {
    q: 'What makes a finite automaton *deterministic* (a DFA)?',
    a: 'Each state has at most one transition for each character, so the next state is never in doubt.',
  },
  'missing-arrow': {
    q: 'A DFA is in state D and reads a character that has no arrow out of D. What happens?',
    a: 'The string is rejected (strictly, the machine moves to a dead state it can never leave).',
  },
  'why-finite': {
    q: 'Why can no DFA accept "some a\'s, b, then the same number of a\'s"?',
    a: 'It would have to remember an unlimited count, but a DFA only has a fixed, finite number of states to remember with.',
  },
  'accept-what': {
    q: 'When does a finite automaton accept a string?',
    a: 'When, after reading the whole string, it is in an accepting state.',
  },
  'empty-accepted': {
    q: 'When does a DFA accept the empty string?',
    a: 'Exactly when its start state is an accepting state, since reading nothing leaves it there.',
  },
  'last-accept': {
    q: 'How does a scanner use a DFA to take the longest token (maximal munch)?',
    a: 'It keeps reading and remembers the last position where the machine was in an accepting state; when it gets stuck, the token ends there.',
  },
  'dead-state': {
    q: 'What is a dead state?',
    a: 'A non-accepting state whose transitions all lead back to itself: once in it, the machine can never accept.',
  },
};

export const examples = {
  'number-dfa': {
    title: 'Running the number DFA',
    code: `const NUM = {
  start: 'S',
  accept: ['I', 'F'],
  next: {
    S: { d: 'I' },
    I: { d: 'I', '.': 'D' },
    D: { d: 'F' },
    F: { d: 'F' },
  },
};
const cls = (c) =>
  c >= '0' && c <= '9' ? 'd' : c;

function run(dfa, s) {
  let q = dfa.start;
  for (const c of s) {
    q = dfa.next[q][cls(c)];
    if (q === undefined) return false;
  }
  return dfa.accept.includes(q);
}

for (const s of ['12.5', '4.', '7']) {
  console.log(s, run(NUM, s));
}`,
  },
};

export const exercises = {
  'run-dfa': {
    title: 'Run any DFA from its table',
    prompt:
      'Write `runDFA(dfa, s)`, which returns `true` if the DFA accepts the string `s` and `false` otherwise. A DFA is an object `{ start, accept, next }`: `start` is the start state, `accept` an array of accepting states, and `next[q][c]` the state reached from `q` on the character `c`. A missing entry means "no arrow", and a state with no arrows at all may have no row in `next`.',
    starter: `function runDFA(dfa, s) {
  // start at dfa.start, follow dfa.next
  return false;
}`,
    solution: `function runDFA(dfa, s) {
  let q = dfa.start;
  for (const c of s) {
    const row = dfa.next[q];
    if (row === undefined) return false;
    q = row[c];
    if (q === undefined) return false;
  }
  return dfa.accept.includes(q);
}`,
    tests: `const AB = {
  start: 'A', accept: ['C'],
  next: { A: { a: 'B' }, B: { b: 'C' } },
};
const EVEN = {
  start: 'E', accept: ['E'],
  next: { E: { a: 'O' }, O: { a: 'E' } },
};
const EQ = {
  start: 0, accept: [1, 2],
  next: { 0: { '=': 1 }, 1: { '=': 2 } },
};
test('accepts exactly "ab"', () => {
  expect(runDFA(AB, 'ab')).toBe(true);
  expect(runDFA(AB, 'a')).toBe(false);
  expect(runDFA(AB, 'abb')).toBe(false);
  expect(runDFA(AB, 'ba')).toBe(false);
});
test('even number of a', () => {
  expect(runDFA(EVEN, '')).toBe(true);
  expect(runDFA(EVEN, 'aa')).toBe(true);
  expect(runDFA(EVEN, 'aaa')).toBe(false);
});
test('= and ==', () => {
  expect(runDFA(EQ, '=')).toBe(true);
  expect(runDFA(EQ, '==')).toBe(true);
  expect(runDFA(EQ, '===')).toBe(false);
  expect(runDFA(EQ, '')).toBe(false);
});`,
    hints: [
      'Copy what the stepper does by hand: one variable for the current state, starting at `dfa.start`, and a loop over the characters of `s`.',
      'Each step is two lookups, `dfa.next[q]` (the row) and then `[c]` (the column). Either can be `undefined`, and either one means "reject now".',
      'After the loop the answer is not simply `true`: return `dfa.accept.includes(q)`.',
    ],
    walkthrough: `**How to think about it.** Running a DFA by hand, as in the stepper, needs exactly one thing written down: the state you are in. So the function needs one variable for it, a loop over the characters, and a table lookup per character. The two things to get right are the two ways it can say no: there is no arrow for this character (reject immediately, there is nothing to follow), and the input ends in a state without a double ring.

**The solution, line by line.**

- \`let q = dfa.start;\` the machine starts in the start state, before reading anything. \`let\`, because \`q\` changes on every step.
- \`for (const c of s) {\` visits each character once, left to right; a DFA never goes back.
- \`const row = dfa.next[q];\` finds the row for the current state. In the \`AB\` machine, state \`C\` has no arrows and so no row; reading \`abb\` reaches \`C\` and then asks for a row that is not there.
- \`if (row === undefined) return false;\` no row means no arrows, so this character cannot be read: reject.
- \`q = row[c];\` follows the arrow labelled \`c\`.
- \`if (q === undefined) return false;\` there was a row, but no arrow for this character: reject. (Checking here also stops the next round from looking up \`dfa.next[undefined]\`.)
- \`}\` ends the loop: every character was read, and we are in some state \`q\`.
- \`return dfa.accept.includes(q);\` accept exactly when that last state is accepting. For \`EVEN\` and the empty string the loop never runs, \`q\` is still \`'E'\`, and \`'E'\` is in \`accept\`, so the answer is \`true\`.

**Common wrong attempts.**

- Ending with \`return true;\` accepts everything that never gets stuck, including \`a\` for the \`AB\` machine, which stops in \`B\`.
- Writing \`q = dfa.next[q][c];\` with no checks crashes with a \`TypeError\` (reading a property of \`undefined\`) on \`abb\`, because \`C\` has no row; a check after the lookup is not enough when the *row* is missing.
- Returning \`true\` the moment \`q\` is accepting, inside the loop, accepts \`abb\` (it was accepting after \`ab\`) and \`===\`.`,
    wrong: [
      {
        code: `function runDFA(dfa, s) {
  let q = dfa.start;
  for (const c of s) {
    q = dfa.next[q][c];
    if (q === undefined) return false;
  }
  return true;
}`,
        why: 'Never checks the accepting states, so `a` is accepted by the "ab" machine, and it crashes on `abb` when the state `C` has no row.',
      },
      {
        code: `function runDFA(dfa, s) {
  let q = dfa.start;
  for (const c of s) {
    const row = dfa.next[q];
    if (row === undefined) return false;
    q = row[c];
    if (dfa.accept.includes(q)) {
      return true;
    }
  }
  return dfa.accept.includes(q);
}`,
        why: 'Stops at the first accepting state, so `abb` and `===` are wrongly accepted.',
      },
    ],
  },
  longest: {
    optional: true,
    title: 'The longest token, with a DFA',
    prompt:
      'Write `longest(dfa, s, i)`: run the DFA on `s` starting at index `i`, and return the index just after the **longest** accepted piece that starts at `i` (so the token is `s.slice(i, end)`), or `-1` if no piece starting at `i` is accepted. Stop reading as soon as there is no arrow. The DFA has the same shape as in the core exercise.',
    starter: `function longest(dfa, s, i) {
  return -1;
}`,
    solution: `function longest(dfa, s, i) {
  let q = dfa.start;
  let last = -1;
  if (dfa.accept.includes(q)) last = i;
  for (let j = i; j < s.length; j++) {
    const row = dfa.next[q];
    q = row ? row[s[j]] : undefined;
    if (q === undefined) break;
    if (dfa.accept.includes(q)) {
      last = j + 1;
    }
  }
  return last;
}`,
    tests: `const D = '0123456789';
const row = (to) => Object.fromEntries(
  [...D].map((d) => [d, to]));
const NUM = {
  start: 'S', accept: ['I', 'F'],
  next: {
    S: row('I'),
    I: { ...row('I'), '.': 'D' },
    D: row('F'),
    F: row('F'),
  },
};
test('a whole number', () => {
  expect(longest(NUM, '42;', 0)).toBe(2);
});
test('a fraction', () => {
  expect(longest(NUM, 'x=4.25;', 2)).toBe(6);
});
test('a dot with no digit after it', () => {
  expect(longest(NUM, '1..5', 0)).toBe(1);
});
test('no number at all', () => {
  expect(longest(NUM, 'abc', 0)).toBe(-1);
});
test('starts at i, not at 0', () => {
  expect(longest(NUM, '1+23', 2)).toBe(4);
});`,
    hints: [
      'You need two variables besides the state: where you are reading (`j`, starting at `i`) and the best end found so far (`last`, starting at `-1`).',
      'After every successful step, if the new state is accepting, set `last = j + 1` (the index just after the character you read). Do not return there: keep reading.',
      'Break out of the loop when there is no row or no arrow. Then return `last`. (If the start state were accepting, the empty piece would count, so `last` would start at `i`.)',
    ],
    walkthrough: `**How to think about it.** This is maximal munch from chapter 68, done with a machine. A scanner cannot stop at the first accepting state (that would cut \`4.25\` to \`4\`), and it cannot insist on ending in an accepting state either (in \`1..5\` it gets stuck in \`D\`, yet \`1\` is a perfectly good token). The answer is to keep reading for as long as there are arrows, and to *remember* the last place where the machine was accepting.

**The solution, line by line.**

- \`let q = dfa.start;\` the current state.
- \`let last = -1;\` the best end found so far; \`-1\` means "nothing accepted yet".
- \`if (dfa.accept.includes(q)) last = i;\` if the start state accepts, the empty piece counts. (For numbers it does not, but a general function should handle it.)
- \`for (let j = i; j < s.length; j++) {\` reads from \`i\` onwards, one character at a time.
- \`const row = dfa.next[q];\` and \`q = row ? row[s[j]] : undefined;\` follow the arrow for \`s[j]\`, or get \`undefined\` if there is no row or no arrow.
- \`if (q === undefined) break;\` stuck: stop reading, but do not throw away what we found.
- \`if (dfa.accept.includes(q)) { last = j + 1; }\` the piece from \`i\` up to and including \`s[j]\` is accepted, so its end index is \`j + 1\`.
- \`return last;\` the longest accepted end, or \`-1\`.

On \`1..5\`: after \`1\` the state is \`I\`, accepting, so \`last = 1\`; after \`.\` it is \`D\`, not accepting; the second \`.\` has no arrow, so the loop breaks and the answer is \`1\`, the token \`1\`.

**Common wrong attempts.**

- Returning \`j + 1\` the first time the state is accepting gives \`1\` for \`4.25\` instead of \`4\`.
- Returning \`-1\` whenever the machine gets stuck loses \`1\` in \`1..5\`.
- Starting \`j\` at \`0\` instead of \`i\` scans the wrong part of the string.`,
    wrong: [
      {
        code: `function longest(dfa, s, i) {
  let q = dfa.start;
  for (let j = i; j < s.length; j++) {
    const row = dfa.next[q];
    q = row ? row[s[j]] : undefined;
    if (q === undefined) return -1;
    if (dfa.accept.includes(q)) {
      return j + 1;
    }
  }
  return -1;
}`,
        why: 'Stops at the first accepting state, so `4.25` gives the token `4`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'The number DFA (S, I, D, F; I and F accepting) reads `3.`. Which state is it in at the end, and does it accept?',
    options: [
      { t: 'D, and it rejects', correct: true, why: '`3` takes S to I, `.` takes I to D, and D has a single ring.' },
      { t: 'I, and it accepts', why: 'The dot has an arrow out of I, to D, so the machine does move on.' },
      { t: 'F, and it accepts', why: 'F is only reached by a digit after the dot.' },
    ],
  },
  {
    q: 'Which of these is true of every DFA?',
    options: [
      { t: 'It has exactly one accepting state', why: 'The number DFA has two (I and F); a DFA may have any number, even none.' },
      { t: 'It can read the input backwards when it gets stuck', why: 'A DFA reads each character once, left to right, and never goes back.' },
      { t: 'From any state, each character leads to at most one next state', correct: true, why: 'That is what *deterministic* means: the next state is never a choice.' },
    ],
  },
  {
    q: 'A DFA\'s start state is also an accepting state. What does that tell you?',
    options: [
      { t: 'It accepts every string', why: 'Other strings can still lead to states that are not accepting.' },
      { t: 'It accepts the empty string', correct: true, why: 'Reading nothing leaves the machine in the start state, which accepts.' },
      { t: 'Nothing; the start state is never checked', why: 'The final state is checked, and for the empty string the final state is the start state.' },
    ],
  },
  {
    q: 'With the number DFA, a scanner reads `12.x`. What token does maximal munch give?',
    options: [
      { t: '`12.`', why: '`12.` ends in D, which is not accepting, so it is not a number.' },
      { t: 'none: the machine got stuck', why: 'Getting stuck ends the token; it does not throw away the accepted part.' },
      { t: '`1`', why: 'That is where the machine first accepted, but maximal munch keeps reading.' },
      { t: '`12`', correct: true, why: 'The last position where the machine was accepting is after `12`; it then gets stuck at `x`.' },
    ],
  },
  {
    q: 'In the two-state "even number of a" machine, what does each state remember?',
    options: [
      { t: 'The exact number of a\'s read', why: 'Two states cannot hold an unlimited number; they hold only whether it is even or odd.' },
      { t: 'Whether the count of a\'s so far is even or odd', correct: true, why: 'E means even, O means odd; each a swaps them, and that is all the machine needs.' },
      { t: 'The last character read', why: 'Every character is an a here, so that would tell it nothing.' },
    ],
  },
];
