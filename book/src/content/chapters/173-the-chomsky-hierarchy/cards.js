// Chapter 173 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'chomsky-four': {
    q: 'Name the four levels of the Chomsky hierarchy, from smallest to largest, with the machine that recognises each.',
    a: 'Regular (type 3, finite automata), context-free (type 2, pushdown automata), context-sensitive (type 1, linear-bounded automata), unrestricted (type 0, Turing machines).',
  },
  'cf-machine': {
    q: 'What does recognising a context-free language need that a finite automaton lacks?',
    a: 'Unbounded memory in the form of a stack (a pushdown automaton), for example to remember how many brackets are still open.',
  },
  'declare-before-use': {
    q: 'Why do compilers check that every name was declared in a pass after parsing, rather than in the grammar?',
    a: 'The rule is not context-free: matching a use to an earlier declaration of the same name has the shape of a word written twice, which no context-free grammar can describe.',
  },
  'pump-lemma': {
    q: 'State the pumping lemma for regular languages.',
    a: 'For a regular L there is a p such that every w in L with |w| ≥ p splits as x y z with y ≠ ε and |xy| ≤ p, and x yᵏ z is in L for every k ≥ 0.',
  },
  'pump-anbn': {
    q: 'With the pumping lemma and w = aᵖbᵖ, why is `aⁿbⁿ` not regular?',
    a: 'Since |xy| ≤ p, y lies among the a’s and is all a’s; pumping it (x yy z) adds a’s but no b’s, giving a string outside the language.',
  },
  'pump-one-way': {
    q: 'Can the pumping lemma prove that a language is regular?',
    a: 'No. Every regular language pumps, but some languages that are not regular pump too; to show a language is regular, give a regular expression or a finite automaton for it.',
  },
  'rd-is-pda': {
    q: 'In what sense is a recursive-descent parser a pushdown automaton?',
    a: 'Its call stack is the automaton’s stack: each call to a rule’s function pushes a frame recording where to resume, and each return pops one.',
  },
  'dpda-weaker': {
    q: 'Do deterministic pushdown automata accept every context-free language?',
    a: 'No. Palindromes are context-free, but a PDA has to guess where the middle is, and no deterministic PDA accepts them.',
  },
  'lr-dcfl': {
    q: 'Which languages have LR(k) grammars, according to Knuth (1965)?',
    a: 'Exactly the deterministic context-free languages, those a deterministic pushdown automaton accepts; and every one of them also has an LR(1) grammar.',
  },
  anbncn: {
    q: 'Why can no pushdown automaton accept aⁿbⁿcⁿ?',
    a: 'Checking the b’s against the a’s pops the a’s count off the stack, so nothing is left to check the c’s against (the context-free pumping lemma makes this a proof).',
  },
  'typedef-names': {
    q: 'Why can a C parser not decide, from the grammar alone, whether `T * x;` is a declaration or a multiplication?',
    a: 'It depends on whether T was declared earlier as a type name (with typedef), which a context-free grammar cannot remember; GNU C’s scanner looks names up and returns a separate TYPENAME token.',
  },
  'js-slash': {
    q: 'How does the ECMAScript specification decide whether a `/` starts a division or a regular expression literal?',
    a: 'Its lexical grammar has several goal symbols (InputElementDiv, InputElementRegExp and others), and the syntactic context says which one the scanner uses for the next token.',
  },
  'python-indent': {
    q: 'How does Python’s tokenizer turn indentation into tokens?',
    a: 'It keeps a stack of indentation levels: a deeper line pushes a level and gives one INDENT; a shallower line pops levels, giving one DEDENT for each level popped.',
  },
};

export const examples = {
  pump: {
    title: 'Finding the loop, and pumping it',
    code: `// A DFA for a+b+: it accepts every
// aⁿbⁿ, and more besides.
const D = {
  start: 'A', accept: ['B'],
  next: {
    A: { a: 'X' },
    X: { a: 'X', b: 'B' },
    B: { b: 'B' },
  },
};

function trail(dfa, s) {
  const qs = [dfa.start];
  for (const c of s) {
    qs.push(dfa.next[qs.at(-1)]?.[c]);
  }
  return qs;
}
const accepts = (dfa, s) =>
  dfa.accept.includes(
    trail(dfa, s).at(-1));

// The first state that comes back.
function loop(dfa, s) {
  const qs = trail(dfa, s);
  for (let j = 1; j < qs.length; j++) {
    const i = qs.indexOf(qs[j]);
    if (i < j) return [i, j];
  }
}

const p = 3; // number of states
const w = 'aaabbb';
console.log(trail(D, w).join(' '));
const [i, j] = loop(D, w);
const x = w.slice(0, i);
const y = w.slice(i, j);
const z = w.slice(j);
console.log({ x, y, z });
for (const k of [0, 2, 3]) {
  const v = x + y.repeat(k) + z;
  console.log(v, accepts(D, v));
}`,
  },
};

export const exercises = {
  'run-pda': {
    title: 'Run a pushdown automaton',
    prompt: `A deterministic pushdown automaton is given as data:

- \`start\`: the start state; \`accept\`: the accepting states; \`bottom\`: the one-character bottom marker the stack starts with.
- \`moves\`: an object whose keys are \`'state char top'\` (three parts separated by single spaces) and whose values are \`[next, push]\`: go to state \`next\`, pop the top symbol, and push the characters of the string \`push\` (so the **last** character of \`push\` becomes the new top; \`''\` only pops).

The stack is a string whose last character is the top. Write \`runPda(pda, s)\`: read \`s\` one character at a time; if no move fits, return \`false\` at once. At the end, accept (return \`true\`) only if the state is accepting **and** the stack is back to the bottom marker alone.`,
    starter: `function runPda(pda, s) {
  // your code here
}

const BRACKETS = {
  start: 'q', accept: ['q'],
  bottom: 'Z',
  moves: {
    'q ( Z': ['q', 'Z('],
    'q ( (': ['q', '(('],
    'q ) (': ['q', ''],
  },
};
console.log(runPda(BRACKETS, '(())'));`,
    solution: `function runPda(pda, s) {
  let q = pda.start;
  let stack = pda.bottom;
  for (const c of s) {
    const top = stack.at(-1);
    const key = q + ' ' + c + ' ' + top;
    const m = pda.moves[key];
    if (!m) return false;
    q = m[0];
    stack = stack.slice(0, -1) + m[1];
  }
  return pda.accept.includes(q) &&
    stack === pda.bottom;
}`,
    tests: `const BRACKETS = {
  start: 'q', accept: ['q'], bottom: 'Z',
  moves: {
    'q ( Z': ['q', 'Z('],
    'q ( (': ['q', '(('],
    'q ) (': ['q', ''],
  },
};
const AB = {
  start: 'p', accept: ['p', 'q'], bottom: 'Z',
  moves: {
    'p a Z': ['p', 'ZA'],
    'p a A': ['p', 'AA'],
    'p b A': ['q', ''],
    'q b A': ['q', ''],
  },
};
test('balanced brackets are accepted', () => {
  for (const s of ['', '()', '(())', '(()())']) {
    expect(runPda(BRACKETS, s)).toBe(true);
  }
});
test('an unclosed bracket is rejected', () => {
  expect(runPda(BRACKETS, '((')).toBe(false);
  expect(runPda(BRACKETS, '(()')).toBe(false);
});
test('a close with nothing open is rejected', () => {
  expect(runPda(BRACKETS, ')(')).toBe(false);
  expect(runPda(BRACKETS, '())')).toBe(false);
});
test('a^n b^n', () => {
  for (const s of ['', 'ab', 'aabb', 'aaabbb']) {
    expect(runPda(AB, s)).toBe(true);
  }
  for (const s of ['a', 'aab', 'abb', 'abab', 'ba']) {
    expect(runPda(AB, s)).toBe(false);
  }
});`,
    hints: [
      'Keep two variables, the current state and the stack (a string that starts as the bottom marker), and update both once per character.',
      'The top of the stack is `stack.at(-1)`. Build the key with single spaces, look up the move, and return `false` straight away if there is none.',
      'A move replaces the top: `stack.slice(0, -1) + push`. After the loop, check both conditions: the state is in `accept`, and `stack === pda.bottom`.',
    ],
    walkthrough: `**How to think about it.** A pushdown automaton is a DFA run (one state, one loop over the characters) with one more piece of memory beside the state. So the code is the DFA runner of *Finite automata* with a second variable for the stack, and the move table is looked up with the top of the stack as part of the key.

**The solution, line by line.**

- \`let q = pda.start;\` and \`let stack = pda.bottom;\` set up the two pieces of memory: the state, and a stack holding only the bottom marker.
- \`for (const c of s) {\` reads the input once, left to right.
- \`const top = stack.at(-1);\` is the symbol on top (the last character of the string).
- \`const key = q + ' ' + c + ' ' + top;\` builds the same \`'state char top'\` key the table uses, and \`const m = pda.moves[key];\` looks the move up.
- \`if (!m) return false;\` rejects at once when no move fits, such as a \`)\` with only \`Z\` on top.
- \`q = m[0];\` changes state, and \`stack = stack.slice(0, -1) + m[1];\` pops the top and pushes the move's string; for \`'Z('\` that puts the \`Z\` back and a \`(\` above it, and for \`''\` it is a plain pop.
- \`return pda.accept.includes(q) && stack === pda.bottom;\` accepts only in an accepting state with every pushed symbol popped again.

On \`(()\` the loop finishes happily in state \`q\`, but the stack is \`Z(\`: one bracket is still open, and the last line rejects it. On \`())\` the third character finds \`Z\` on top, there is no move \`'q ) Z'\`, and the loop rejects on the spot.

**Common wrong attempts.**

- Checking only the state at the end accepts \`((\`, because \`q\` is accepting; the stack is what remembers the open brackets, so it must be checked too.
- Pushing \`m[1]\` without popping the top first (\`stack + m[1]\`) never removes anything, so no bracket is ever closed.
- Reading the top as \`stack[0]\` uses the bottom of the stack, which is always the marker, so every \`)\` is rejected.`,
    wrong: [
      {
        code: `function runPda(pda, s) {
  let q = pda.start;
  let stack = pda.bottom;
  for (const c of s) {
    const top = stack.at(-1);
    const key = q + ' ' + c + ' ' + top;
    const m = pda.moves[key];
    if (!m) return false;
    q = m[0];
    stack = stack.slice(0, -1) + m[1];
  }
  return pda.accept.includes(q);
}`,
        why: 'It never checks the stack at the end, so `((` is accepted: the state is accepting, but two brackets are still open.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Which language does the pumping lemma for regular languages show is **not** regular?',
    options: [
      { t: 'Strings of a’s and b’s with an even number of a’s', why: 'A two-state DFA accepts it, so it is regular, and every long string pumps.' },
      { t: '`(ab)*`', why: 'It is regular: take y = ab, and every pumped string still repeats ab.' },
      { t: 'Strings of `(` and `)` in which the brackets balance', correct: true, why: 'Take w = (ᵖ)ᵖ: y lies among the (’s, and pumping it leaves too many or too few of them.' },
      { t: 'Every infinite language', why: 'Many infinite languages, such as a*, are regular; being infinite is not the problem.' },
    ],
  },
  {
    q: 'A pushdown automaton recognises balanced brackets. What does its stack hold after reading `(()(`?',
    options: [
      { t: 'The bottom marker and two `(`', correct: true, why: 'Three ( are pushed and one is popped by the ), so two are still open.' },
      { t: 'The bottom marker and three `(`', why: 'The `)` popped one of them.' },
      { t: 'Only the bottom marker', why: 'That would mean every bracket so far was closed, but two are still open.' },
    ],
  },
  {
    q: 'Which statement about deterministic and nondeterministic pushdown automata is true?',
    options: [
      { t: 'They accept the same languages, as DFAs and NFAs do', why: 'That holds for finite automata, not for pushdown automata: palindromes need the guessing kind.' },
      { t: 'Deterministic ones accept more languages', why: 'Every deterministic PDA is also a (trivially) nondeterministic one, so they cannot accept more.' },
      { t: 'Deterministic ones accept fewer languages, and those are exactly the languages with LR(1) grammars', correct: true, why: 'Knuth (1965) showed that LR(k) languages are the deterministic context-free languages, and that LR(1) is always enough for them.' },
    ],
  },
  {
    q: 'Which machine recognises exactly the context-free languages?',
    options: [
      { t: 'A finite automaton', why: 'That recognises the regular languages, the level below; it cannot count brackets without limit.' },
      { t: 'A pushdown automaton: a finite automaton with a stack', correct: true, why: 'The stack is the unbounded memory that matching brackets needs; nondeterministic PDAs accept exactly the context-free languages.' },
      { t: 'A linear-bounded automaton', why: 'That recognises the context-sensitive languages, type 1, which include some that are not context-free.' },
      { t: 'A Turing machine', why: 'That reaches the top level, type 0.' },
    ],
  },
  {
    q: 'In JavaScript, how does the scanner know whether the `/` in `a = b / c` starts a regular expression literal?',
    options: [
      { t: 'It tries both and keeps the one that parses', why: 'The specification does not backtrack here; it chooses before scanning the token.' },
      { t: 'It looks for a closing `/` on the same line', why: 'Two divisions on one line would fool that, as in `a / b / c`.' },
      { t: 'The syntactic context picks the scanner’s goal symbol: after an operand, `/` can only be division', correct: true, why: 'The specification gives the lexical grammar several goal symbols, such as InputElementDiv and InputElementRegExp, and the parser says which applies.' },
    ],
  },
];
