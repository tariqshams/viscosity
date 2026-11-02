// Cards for the second half of chapter 73 (staged split): NFAs.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'nfa-what': {
    q: 'Name the two things an NFA may have that a DFA may not.',
    a: 'Several transitions for the same character out of one state, and ε-moves (transitions that read nothing).',
  },
  'nfa-accepts': {
    q: 'When does an NFA accept a string?',
    a: 'When at least one way of following its arrows, reading the whole string, ends in an accepting state.',
  },
  'eps-move': {
    q: 'What does an ε-move read?',
    a: 'Nothing: the machine may follow it without using up any input.',
  },
  'set-of-states': {
    q: 'How do you run an NFA without guessing or trying paths one by one?',
    a: 'Keep the set of all states it could be in, and update the whole set at each character.',
  },
  'closure-what': {
    q: 'What is the ε-closure of a set of states?',
    a: 'The set itself, plus every state reachable from it by following ε-moves only.',
  },
  'closure-start': {
    q: 'Why must an NFA simulation start from the ε-closure of the start state, not just the start state?',
    a: 'The machine can follow ε-moves before reading anything, so those states are already possible; leaving them out can reject good strings.',
  },
  'dropped-pin': {
    q: 'During an NFA simulation, what happens to a state in the set that has no arrow for the character just read?',
    a: 'It is dropped from the set: that path has died.',
  },
  'nfa-vs-dfa-power': {
    q: 'Can an NFA recognise a language that no DFA can?',
    a: 'No. Rabin and Scott showed every NFA has a DFA accepting the same language (one DFA state per set of NFA states).',
  },
  'why-nfa': {
    q: 'If NFAs are no more powerful and slower to simulate, why do scanner builders use them?',
    a: 'They are much easier to build and combine: joining machines takes a new state and a few ε-moves.',
  },
};

export const examples = {
  'nfa-sim': {
    title: 'Simulating the if-or-name NFA',
    code: `const L = 'abcdefghijklmnopqrstuvwxyz';
const NFA = {
  start: 0,
  accept: [3, 5],
  edges: [
    [0, null, 1], [0, null, 4],
    [1, 'i', 2], [2, 'f', 3],
    ...[...L].map((c) => [4, c, 5]),
    ...[...L].map((c) => [5, c, 5]),
  ],
};

function closure(nfa, set) {
  const out = new Set(set);
  const todo = [...set];
  while (todo.length > 0) {
    const q = todo.pop();
    for (const [p, c, r] of nfa.edges) {
      const eps = p === q && c === null;
      if (!eps || out.has(r)) continue;
      out.add(r);
      todo.push(r);
    }
  }
  return out;
}

function step(nfa, set, ch) {
  const moved = new Set();
  for (const [p, c, r] of nfa.edges) {
    if (set.has(p) && c === ch) {
      moved.add(r);
    }
  }
  return closure(nfa, moved);
}

for (const w of ['if', 'ifs', 'i']) {
  let set = closure(NFA, [NFA.start]);
  for (const ch of w) {
    set = step(NFA, set, ch);
  }
  console.log(w, [...set]);
}`,
  },
};

export const exercises = {
  'run-nfa': {
    title: 'Run an NFA with a set of states',
    prompt:
      'An NFA is `{ start, accept, edges }`, where each edge is `[from, label, to]` and a label of `null` means ε. The function `closure(nfa, states)` from the chapter is given. Write `accepts(nfa, s)`: it returns `true` if the NFA accepts `s`, by tracking the set of possible states (move on each character, then take the closure).',
    starter: `function closure(nfa, set) {
  const out = new Set(set);
  const todo = [...set];
  while (todo.length > 0) {
    const q = todo.pop();
    for (const [p, c, r] of nfa.edges) {
      const eps = p === q && c === null;
      if (!eps || out.has(r)) continue;
      out.add(r);
      todo.push(r);
    }
  }
  return out;
}

function accepts(nfa, s) {
  // your code here
  return false;
}`,
    solution: `function closure(nfa, set) {
  const out = new Set(set);
  const todo = [...set];
  while (todo.length > 0) {
    const q = todo.pop();
    for (const [p, c, r] of nfa.edges) {
      const eps = p === q && c === null;
      if (!eps || out.has(r)) continue;
      out.add(r);
      todo.push(r);
    }
  }
  return out;
}

function accepts(nfa, s) {
  let set = closure(nfa, [nfa.start]);
  for (const ch of s) {
    const moved = new Set();
    for (const [p, c, r] of nfa.edges) {
      if (set.has(p) && c === ch) {
        moved.add(r);
      }
    }
    set = closure(nfa, moved);
  }
  for (const q of set) {
    if (nfa.accept.includes(q)) {
      return true;
    }
  }
  return false;
}`,
    tests: `const ENDS_AB = {
  start: 0, accept: [2],
  edges: [[0, 'a', 0], [0, 'b', 0],
    [0, 'a', 1], [1, 'b', 2]],
};
const OPT_A_B = {
  start: 0, accept: [2],
  edges: [[0, 'a', 1], [0, null, 1],
    [1, 'b', 2]],
};
const IF_OR_X = {
  start: 0, accept: [3, 5],
  edges: [[0, null, 1], [0, null, 4],
    [1, 'i', 2], [2, 'f', 3],
    [4, 'x', 5], [5, 'x', 5]],
};
const LOOP = {
  start: 0, accept: [0],
  edges: [[0, null, 1], [1, null, 0],
    [1, 'a', 0]],
};
test('several arrows for one character', () => {
  expect(accepts(ENDS_AB, 'aab')).toBe(true);
  expect(accepts(ENDS_AB, 'bab')).toBe(true);
  expect(accepts(ENDS_AB, 'aba')).toBe(false);
  expect(accepts(ENDS_AB, '')).toBe(false);
});
test('an ε-move', () => {
  expect(accepts(OPT_A_B, 'ab')).toBe(true);
  expect(accepts(OPT_A_B, 'b')).toBe(true);
  expect(accepts(OPT_A_B, 'a')).toBe(false);
});
test('ε-moves from the start', () => {
  expect(accepts(IF_OR_X, 'if')).toBe(true);
  expect(accepts(IF_OR_X, 'xxx')).toBe(true);
  expect(accepts(IF_OR_X, 'ix')).toBe(false);
});
test('an ε-cycle does not hang', () => {
  expect(accepts(LOOP, 'aaa')).toBe(true);
  expect(accepts(LOOP, 'b')).toBe(false);
});`,
    hints: [
      'Begin with the set of pins before any character is read. Careful: ε-moves can be followed before reading anything.',
      'For each character: make an empty set `moved`; for every edge `[p, c, r]` whose `p` is in the current set and whose label `c` is this character, add `r`. Then replace the current set with `closure(nfa, moved)`.',
      'Start with `let set = closure(nfa, [nfa.start]);`. After the loop, return `true` if any state in `set` is in `nfa.accept`.',
    ],
    walkthrough: `**How to think about it.** The stepper did three things, and the function does the same three: put pins on the start state and everything ε-reachable from it; for each character, move every pin along the arrows with that label (dropping pins that cannot move) and spread again through ε-arrows; finally, see whether any pin is on an accepting state. The closure is already written, so the work is the "move" step and the two ends.

**The solution, line by line.**

- \`let set = closure(nfa, [nfa.start]);\` the starting pins. In \`IF_OR_X\` this is \`{0, 1, 4}\`; without the closure it would be \`{0}\`, and 0 has no arrows for \`i\` or \`x\`.
- \`for (const ch of s) {\` one round per character, left to right.
- \`const moved = new Set();\` the pins after this character, before spreading through ε.
- \`for (const [p, c, r] of nfa.edges) {\` looks at every edge, taking it apart into its start, label and end.
- \`if (set.has(p) && c === ch) { moved.add(r); }\` an edge counts if it starts at a pinned state and is labelled with this character. An ε-edge has \`c === null\`, which never equals a character, so ε-edges are left for the closure. A pin with no matching edge adds nothing: it is dropped.
- \`set = closure(nfa, moved);\` spreads the new pins through ε-arrows.
- After the loop, \`for (const q of set) { if (nfa.accept.includes(q)) return true; }\` accepts if any pin is on an accepting state, and \`return false;\` otherwise (including when the set became empty because every path died).

**Common wrong attempts.**

- Starting with \`new Set([nfa.start])\` rejects \`if\` and \`b\` in the tests, because the states behind the first ε-moves never get a pin.
- Forgetting the closure after each move rejects strings where an ε-arrow comes after a character.
- Requiring *every* pin to be accepting (an "all" check instead of "any") rejects \`aab\` for \`ENDS_AB\`, where one pin sits on 0 and one on 2.`,
    wrong: [
      {
        code: `function accepts(nfa, s) {
  let set = new Set([nfa.start]);
  for (const ch of s) {
    const moved = new Set();
    for (const [p, c, r] of nfa.edges) {
      if (set.has(p) && c === ch) {
        moved.add(r);
      }
    }
    set = moved;
  }
  for (const q of set) {
    if (nfa.accept.includes(q)) {
      return true;
    }
  }
  return false;
}`,
        why: 'Never follows ε-moves, so `b` (through the ε-arrow) and `if` (behind ε-arrows from the start) are rejected.',
      },
    ],
  },
  either: {
    optional: true,
    title: 'One machine for two rules',
    prompt:
      'Write `either(m, n)`: given two NFAs (same shape as before), return a new NFA that accepts a string if `m` **or** `n` accepts it. The two machines may use the same state names, so rename them: prefix every state of `m` with `\'L\'` and every state of `n` with `\'R\'` (so state `0` of `m` becomes `\'L0\'`), and use `\'S\'` as the new start state.',
    starter: `function either(m, n) {
  return m;
}`,
    solution: `function either(m, n) {
  const L = (q) => 'L' + q;
  const R = (q) => 'R' + q;
  const edges = [
    ['S', null, L(m.start)],
    ['S', null, R(n.start)],
  ];
  for (const [p, c, q] of m.edges) {
    edges.push([L(p), c, L(q)]);
  }
  for (const [p, c, q] of n.edges) {
    edges.push([R(p), c, R(q)]);
  }
  const accept = [
    ...m.accept.map(L),
    ...n.accept.map(R),
  ];
  return { start: 'S', accept, edges };
}`,
    tests: `function acc(nfa, s) {
  const close = (xs) => {
    const out = new Set(xs);
    const todo = [...xs];
    while (todo.length) {
      const q = todo.pop();
      for (const [p, c, r] of nfa.edges) {
        if (p === q && c === null &&
            !out.has(r)) {
          out.add(r);
          todo.push(r);
        }
      }
    }
    return out;
  };
  let set = close([nfa.start]);
  for (const ch of s) {
    const m = [];
    for (const [p, c, r] of nfa.edges) {
      if (set.has(p) && c === ch) m.push(r);
    }
    set = close(m);
  }
  return [...set].some(
    (q) => nfa.accept.includes(q));
}
const IF = { start: 0, accept: [2],
  edges: [[0, 'i', 1], [1, 'f', 2]] };
const XS = { start: 0, accept: [1],
  edges: [[0, 'x', 1], [1, 'x', 1]] };
const U = either(IF, XS);
test('accepts the first language', () => {
  expect(acc(U, 'if')).toBe(true);
});
test('accepts the second language', () => {
  expect(acc(U, 'x')).toBe(true);
  expect(acc(U, 'xxx')).toBe(true);
});
test('accepts nothing else', () => {
  expect(acc(U, 'ix')).toBe(false);
  expect(acc(U, '')).toBe(false);
  expect(acc(U, 'i')).toBe(false);
});
test('renames states and starts at S', () => {
  expect(U.start).toBe('S');
  expect([...U.accept].sort())
    .toEqual(['L2', 'R1']);
});`,
    hints: [
      'Draw it first: a new state S with two ε-arrows, one to each old start state. Nothing else about the old machines changes, except their names.',
      'Make two tiny renaming functions, `L` and `R`, and copy every edge of `m` through `L` and every edge of `n` through `R`.',
      'The accepting states are the renamed accepting states of both machines: `[...m.accept.map(L), ...n.accept.map(R)]`. Return `{ start: \'S\', accept, edges }`.',
    ],
    walkthrough: `**How to think about it.** The union of two languages is "a string either machine accepts", and an NFA can say that with two ε-arrows: from a new start state, jump for free into either machine, and let each run as before. The only danger is a name clash: both machines may have a state called \`0\`, and if we kept the names, edges of one machine would connect to the other. Prefixing every name fixes that.

**The solution, line by line.**

- \`const L = (q) => 'L' + q;\` and \`const R = ...\` rename a state of the left or right machine; \`0\` becomes \`'L0'\` or \`'R0'\`.
- \`const edges = [['S', null, L(m.start)], ['S', null, R(n.start)]];\` the two new ε-arrows out of the new start state \`'S'\`.
- The first \`for\` loop copies each edge \`[p, c, q]\` of \`m\` as \`[L(p), c, L(q)]\`: same label, renamed ends. The second does the same for \`n\` with \`R\`.
- \`const accept = [...m.accept.map(L), ...n.accept.map(R)];\` a string is accepted if it ends on an accepting state of either machine, renamed.
- \`return { start: 'S', accept, edges };\` the new machine.

**Common wrong attempts.**

- Copying the edges without renaming: both machines' state \`0\` become one state, so \`i\` then \`x\` can wander from one machine into the other, and the accepting states get mixed up.
- Making \`S\` accepting, or leaving it out of the edges, changes the language (the first accepts the empty string; the second accepts nothing).`,
    wrong: [
      {
        code: `function either(m, n) {
  return {
    start: 'S',
    accept: [...m.accept, ...n.accept],
    edges: [
      ['S', null, m.start],
      ['S', null, n.start],
      ...m.edges,
      ...n.edges,
    ],
  };
}`,
        why: 'Without renaming, state 0 and state 1 of the two machines are merged, so `ix` and `i` are wrongly accepted and the accepting states are not `L2` and `R1`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'The NFA with edges `0 -a,b-> 0`, `0 -a-> 1`, `1 -b-> 2` (2 accepting) reads `ab`. Which set of states is it in at the end?',
    options: [
      { t: '`{2}`', why: 'The loop on 0 also reads both characters, so a pin stays on 0.' },
      { t: '`{0, 2}`', correct: true, why: 'After `a`: `{0, 1}`. After `b`: 0 loops to 0, and 1 goes to 2.' },
      { t: '`{0, 1, 2}`', why: 'After `b`, state 1 has no arrow back to itself, so its pin moves on to 2.' },
    ],
  },
  {
    q: 'What is the ε-closure of `{0}` if the ε-arrows are `0 → 1`, `1 → 2` and `3 → 0`?',
    options: [
      { t: '`{0, 1}`', why: 'ε-moves chain: from 1 you can take another ε-move to 2.' },
      { t: '`{0, 1, 2, 3}`', why: 'The arrow 3 → 0 points *into* 0; it cannot be followed from 0.' },
      { t: '`{0, 1, 2}`', correct: true, why: 'From 0 follow ε to 1, then from 1 to 2; nothing else is reachable.' },
    ],
  },
  {
    q: 'An NFA simulation ends with the set `{4, 7}`, where 7 is accepting and 4 is not. Is the string accepted?',
    options: [
      { t: 'Yes', correct: true, why: 'An NFA accepts if at least one path ends in an accepting state, and the pin on 7 is such a path.' },
      { t: 'No, because 4 is not accepting', why: 'The other pins do not matter; one accepting pin is enough.' },
      { t: 'It depends on which path the machine chose', why: 'The machine does not choose: the set holds every possible path at once.' },
    ],
  },
  {
    q: 'Why does the `closure` function check `out.has(r)` before adding a state to `todo`?',
    options: [
      { t: 'To keep the set sorted', why: 'Sets in JavaScript are not sorted; the check is about repeats.' },
      { t: 'So that an ε-cycle does not make the loop run forever', correct: true, why: 'Without it, `0 → 1 → 0` by ε-moves would push the same states again and again.' },
      { t: 'Because `Set.add` throws on a repeat', why: '`add` quietly ignores a repeat; the danger is pushing onto `todo` again.' },
    ],
  },
  {
    q: 'Which statement about NFAs and DFAs is true?',
    options: [
      { t: 'NFAs can recognise some languages that DFAs cannot', why: 'Rabin and Scott proved the opposite: every NFA has an equivalent DFA.' },
      { t: 'A DFA is never larger than the NFA it comes from', why: 'It can be much larger: up to 2ⁿ states for an NFA with n states.' },
      { t: 'NFAs need no extra memory to simulate', why: 'Simulation keeps a whole set of states, not a single one.' },
      { t: 'NFAs and DFAs recognise exactly the same languages', correct: true, why: 'The subset construction turns any NFA into a DFA with the same language.' },
    ],
  },
];
