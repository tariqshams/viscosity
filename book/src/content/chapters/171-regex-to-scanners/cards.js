// Chapter 87 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'thompson-one-end': {
    q: 'In Thompson’s construction, what do all the small machines have in common that lets them snap together?',
    a: 'Each has exactly one start state and one accepting state.',
  },
  'thompson-alt': {
    q: 'How does Thompson’s construction build the machine for `r|s`?',
    a: 'A new start state with ε-moves into N(r) and N(s), and ε-moves from both their accepting states to a new accepting state.',
  },
  'thompson-star': {
    q: 'Which two ε-moves make `r*` different from plain `r`?',
    a: 'One from the new start straight to the new end (skip r: zero times), and one from the end of N(r) back to its start (go round again).',
  },
  'thompson-size': {
    q: 'At most how many states does Thompson’s construction make for a pattern?',
    a: 'Twice the number of characters and operators in it, since each step adds at most two states.',
  },
  'subset-state': {
    q: 'In the subset construction, what does one DFA state stand for?',
    a: 'A set of NFA states: the set of pins that the NFA simulation would have at that point.',
  },
  'subset-accepting': {
    q: 'When is a DFA state made by the subset construction accepting?',
    a: 'When its set contains at least one accepting state of the NFA.',
  },
  'subset-blowup': {
    q: 'What is the worst case for the number of states the subset construction can produce from an n-state NFA?',
    a: '2ⁿ, one for every possible set of NFA states (though real scanner rules stay far below that).',
  },
  'subset-why-fast': {
    q: 'Why does a scanner bother turning its NFA into a DFA?',
    a: 'All the set-moving is done once, ahead of time; the DFA then reads each character with a single table lookup.',
  },
};

export const examples = {
  'subset-steps': {
    title: 'The first rows of the subset construction',
    code: `const L = 'ifx';
const N = {
  start: 0, accept: [3, 5],
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

function move(nfa, set, ch) {
  const out = new Set();
  for (const [p, c, r] of nfa.edges) {
    if (set.has(p) && c === ch) {
      out.add(r);
    }
  }
  return out;
}

const show = (s) =>
  '{' + [...s].sort().join(',') + '}';
const next = (T, ch) =>
  closure(N, move(N, T, ch));

const A = closure(N, [N.start]);
console.log('A =', show(A));
for (const ch of L) {
  const T = next(A, ch);
  console.log('A', ch, show(T));
}
const B = next(A, 'i');
for (const ch of L) {
  const T = next(B, ch);
  console.log('B', ch, show(T));
}`,
  },
};

export const exercises = {
  thompson: {
    title: 'Thompson’s construction',
    prompt: 'Finish `build(r)`, which turns a pattern tree (the shapes from *Regular expressions as a language*: `chr`, `eps`, `cat`, `alt`, `star`) into an NFA `{ start, accept: [f], edges }`, with `null` as the ε label. The character, ε and alternation rules are done; add **concatenation** (`r.t === \'cat\'`, children `r.a` and `r.b`) and **star** (`r.t === \'star\'`, child `r.a`) following the figure. Every machine must keep exactly one accepting state.',
    starter: `let n = 0;
const fresh = () => n++;

function build(r) {
  if (r.t === 'chr' || r.t === 'eps') {
    const s = fresh();
    const f = fresh();
    const c = r.c ?? null; // ε: null
    return { start: s, accept: [f],
      edges: [[s, c, f]] };
  }
  if (r.t === 'alt') {
    const a = build(r.a);
    const b = build(r.b);
    const s = fresh();
    const f = fresh();
    return { start: s, accept: [f],
      edges: [...a.edges, ...b.edges,
        [s, null, a.start],
        [s, null, b.start],
        [a.accept[0], null, f],
        [b.accept[0], null, f]] };
  }
  // 'cat' and 'star' go here
  return null;
}`,
    solution: `let n = 0;
const fresh = () => n++;

function build(r) {
  if (r.t === 'chr' || r.t === 'eps') {
    const s = fresh();
    const f = fresh();
    const c = r.c ?? null; // ε: null
    return { start: s, accept: [f],
      edges: [[s, c, f]] };
  }
  if (r.t === 'alt') {
    const a = build(r.a);
    const b = build(r.b);
    const s = fresh();
    const f = fresh();
    return { start: s, accept: [f],
      edges: [...a.edges, ...b.edges,
        [s, null, a.start],
        [s, null, b.start],
        [a.accept[0], null, f],
        [b.accept[0], null, f]] };
  }
  if (r.t === 'cat') {
    const a = build(r.a);
    const b = build(r.b);
    return { start: a.start,
      accept: b.accept,
      edges: [...a.edges, ...b.edges,
        [a.accept[0], null, b.start]] };
  }
  // star
  const a = build(r.a);
  const s = fresh();
  const f = fresh();
  const x = a.accept[0];
  return { start: s, accept: [f],
    edges: [...a.edges,
      [s, null, a.start],
      [s, null, f],
      [x, null, a.start],
      [x, null, f]] };
}`,
    tests: `const C = (c) => ({ t: 'chr', c });
const E = { t: 'eps' };
const Cat = (a, b) => ({ t: 'cat', a, b });
const Alt = (a, b) => ({ t: 'alt', a, b });
const Star = (a) => ({ t: 'star', a });
function acc(nfa, s) {
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

const ab = Alt(C('a'), C('b'));
test('concatenation: ab', () => {
  const m = build(Cat(C('a'), C('b')));
  expect(acc(m, 'ab')).toBe(true);
  expect(acc(m, 'a')).toBe(false);
  expect(acc(m, 'ba')).toBe(false);
});
test('star: a*', () => {
  const m = build(Star(C('a')));
  expect(acc(m, '')).toBe(true);
  expect(acc(m, 'a')).toBe(true);
  expect(acc(m, 'aaaa')).toBe(true);
  expect(acc(m, 'ab')).toBe(false);
});
test('(a|b)*c', () => {
  const m = build(Cat(Star(ab), C('c')));
  for (const w of ['c', 'abc', 'bbac']) {
    expect(acc(m, w)).toBe(true);
  }
  for (const w of ['', 'ab', 'cc', 'ca']) {
    expect(acc(m, w)).toBe(false);
  }
});
test('Drip numbers: d d* (. d d* | ε)', () => {
  const D = C('1');
  const num = Cat(Cat(D, Star(D)),
    Alt(Cat(C('.'), Cat(D, Star(D))), E));
  const m = build(num);
  expect(acc(m, '11.1')).toBe(true);
  expect(acc(m, '1')).toBe(true);
  expect(acc(m, '1.')).toBe(false);
});
test('one accepting state, few states', () => {
  const m = build(Cat(Star(ab), C('c')));
  expect(m.accept.length).toBe(1);
  const qs = new Set(m.edges.flatMap(
    (e) => [e[0], e[2]]));
  expect(qs.size <= 12).toBe(true);
});`,
    hints: [
      'Look at the figure. Concatenation needs no new states at all: build both children, then join them with one ε-arrow. Star needs two new states and four ε-arrows.',
      'For `cat`: the machine starts where `N(r.a)` starts and accepts where `N(r.b)` accepts, and the one new edge is `[a.accept[0], null, b.start]`. Remember to include all the children\'s edges.',
      'For `star`: build the child `a`, make `s` and `f` with `fresh()`, and add ε-edges `s → a.start` (enter), `s → f` (skip), `a.accept[0] → a.start` (again) and `a.accept[0] → f` (leave).',
    ],
    walkthrough: `**How to think about it.** Every case returns a machine with one way in and one way out, built from the children's machines, which are already correct by recursion; so each new rule only has to say how to *wire* the children, never what is inside them. Draw the rule first (the figure has all five), then write one edge per arrow in the drawing. The alternation case in the starter is the pattern to copy: build children, make new states if the drawing has them, return all old edges plus the new arrows.

**The solution, line by line.**

- \`if (r.t === 'cat') {\` handles \`rs\`.
- \`const a = build(r.a); const b = build(r.b);\` builds the two parts first; each is a complete machine with one start and one accepting state.
- \`return { start: a.start, accept: b.accept, ...\` the combined machine is entered through the first part and left through the second, so no new states are needed.
- \`edges: [...a.edges, ...b.edges, [a.accept[0], null, b.start]]\` keeps every edge of both parts and adds one ε-arrow from the end of \`r\` to the start of \`s\`: having matched \`r\`, you may go straight on to match \`s\`.
- \`// star\` the only case left is \`star\`, so no \`if\` is needed.
- \`const a = build(r.a);\` the machine for the repeated part.
- \`const s = fresh(); const f = fresh();\` the new start and accepting states.
- \`const x = a.accept[0];\` a short name for the end of the inner machine, to keep the lines short.
- \`[s, null, a.start]\` enter the inner machine: at least one round.
- \`[s, null, f]\` skip it entirely: zero rounds, which is why \`a*\` accepts the empty string.
- \`[x, null, a.start]\` after a round, go back for another.
- \`[x, null, f]\` after a round, leave.

On \`(a|b)*c\` this makes 6 states for \`a|b\`, 2 for the star and 2 for \`c\`: 10 in all, which the last test checks is within the limit.

**Common wrong attempts.**

- Leaving out the skip edge \`[s, null, f]\` gives "one or more" (\`r+\`), so \`a*\` rejects the empty string and \`(a|b)*c\` rejects \`c\`.
- Leaving out the again edge \`[x, null, a.start]\` gives "zero or one" (\`r?\`), so \`aaaa\` is rejected.
- In \`cat\`, forgetting \`...a.edges\` or \`...b.edges\` throws away the inside of a part, and nothing longer than one step can match.`,
    wrong: [
      {
        code: `let n = 0;
const fresh = () => n++;

function build(r) {
  if (r.t === 'chr' || r.t === 'eps') {
    const s = fresh();
    const f = fresh();
    const c = r.c ?? null; // ε: null
    return { start: s, accept: [f],
      edges: [[s, c, f]] };
  }
  if (r.t === 'alt') {
    const a = build(r.a);
    const b = build(r.b);
    const s = fresh();
    const f = fresh();
    return { start: s, accept: [f],
      edges: [...a.edges, ...b.edges,
        [s, null, a.start],
        [s, null, b.start],
        [a.accept[0], null, f],
        [b.accept[0], null, f]] };
  }
  if (r.t === 'cat') {
    const a = build(r.a);
    const b = build(r.b);
    return { start: a.start,
      accept: b.accept,
      edges: [...a.edges, ...b.edges,
        [a.accept[0], null, b.start]] };
  }
  const a = build(r.a);
  const s = fresh();
  const f = fresh();
  const x = a.accept[0];
  return { start: s, accept: [f],
    edges: [...a.edges,
      [s, null, a.start],
      [x, null, a.start],
      [x, null, f]] };
}`,
        why: 'The star has no skip edge, so it means "one or more": `a*` rejects the empty string, and `(a|b)*c` rejects `c`.',
      },
      {
        code: `let n = 0;
const fresh = () => n++;

function build(r) {
  if (r.t === 'chr' || r.t === 'eps') {
    const s = fresh();
    const f = fresh();
    const c = r.c ?? null; // ε: null
    return { start: s, accept: [f],
      edges: [[s, c, f]] };
  }
  if (r.t === 'alt') {
    const a = build(r.a);
    const b = build(r.b);
    const s = fresh();
    const f = fresh();
    return { start: s, accept: [f],
      edges: [...a.edges, ...b.edges,
        [s, null, a.start],
        [s, null, b.start],
        [a.accept[0], null, f],
        [b.accept[0], null, f]] };
  }
  if (r.t === 'cat') {
    const a = build(r.a);
    const b = build(r.b);
    return { start: a.start,
      accept: b.accept,
      edges: [...a.edges, ...b.edges,
        [a.accept[0], null, b.start]] };
  }
  const a = build(r.a);
  const s = fresh();
  const f = fresh();
  const x = a.accept[0];
  return { start: s, accept: [f],
    edges: [...a.edges,
      [s, null, a.start],
      [s, null, f],
      [x, null, f]] };
}`,
        why: 'No edge goes back to the start of the inner machine, so the star means "zero or one": `aaaa` is rejected.',
      },
    ],
  },
  subset: {
    optional: true,
    title: 'The subset construction',
    prompt: 'Write `toDFA(nfa, alphabet)`. It returns a DFA in the format of *Finite automata*, `{ start: 0, accept, next }`, where DFA states are the numbers 0, 1, 2… in the order their sets are discovered, `next[i][c]` is the next state (leave the entry out when the move is empty), and `accept` lists the accepting DFA states. `closure(nfa, states)` and `move(nfa, states, ch)` are given; `alphabet` is a string of the characters to try, such as `\'ifx\'`.',
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

function move(nfa, set, ch) {
  const out = new Set();
  for (const [p, c, r] of nfa.edges) {
    if (set.has(p) && c === ch) {
      out.add(r);
    }
  }
  return out;
}

function toDFA(nfa, alphabet) {
  // your code here
  return { start: 0, accept: [],
    next: {} };
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

function move(nfa, set, ch) {
  const out = new Set();
  for (const [p, c, r] of nfa.edges) {
    if (set.has(p) && c === ch) {
      out.add(r);
    }
  }
  return out;
}

function toDFA(nfa, alphabet) {
  const key = (set) =>
    [...set].sort().join(',');
  const d0 = closure(nfa, [nfa.start]);
  const ds = [d0];
  const ids = new Map([[key(d0), 0]]);
  const next = {};
  const accept = [];
  for (let i = 0; i < ds.length; i++) {
    const T = ds[i];
    next[i] = {};
    for (const q of T) {
      if (nfa.accept.includes(q)) {
        accept.push(i);
        break;
      }
    }
    for (const ch of alphabet) {
      const m = move(nfa, T, ch);
      if (m.size === 0) continue;
      const u = closure(nfa, m);
      const k = key(u);
      if (!ids.has(k)) {
        ids.set(k, ds.length);
        ds.push(u);
      }
      next[i][ch] = ids.get(k);
    }
  }
  return { start: 0, accept, next };
}`,
    tests: `const C = (c) => ({ t: 'chr', c });
const E = { t: 'eps' };
const Cat = (a, b) => ({ t: 'cat', a, b });
const Alt = (a, b) => ({ t: 'alt', a, b });
const Star = (a) => ({ t: 'star', a });
function acc(nfa, s) {
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

function runDFA(dfa, s) {
  let q = dfa.start;
  for (const c of s) {
    const row = dfa.next[q];
    q = row ? row[c] : undefined;
    if (q === undefined) return false;
  }
  return dfa.accept.includes(q);
}
function all(alpha, n) {
  let out = [''];
  let level = [''];
  for (let k = 0; k < n; k++) {
    level = level.flatMap(
      (w) => [...alpha].map((c) => w + c));
    out = out.concat(level);
  }
  return out;
}
const IFX = {
  start: 0, accept: [3, 5],
  edges: [[0, null, 1], [0, null, 4],
    [1, 'i', 2], [2, 'f', 3],
    [4, 'i', 5], [4, 'f', 5], [4, 'x', 5],
    [5, 'i', 5], [5, 'f', 5], [5, 'x', 5]],
};
const ENDS_AB = {
  start: 0, accept: [2],
  edges: [[0, 'a', 0], [0, 'b', 0],
    [0, 'a', 1], [1, 'b', 2]],
};
test('if-or-name gives 4 states', () => {
  const d = toDFA(IFX, 'ifx');
  expect(Object.keys(d.next).length).toBe(4);
  expect(d.start).toBe(0);
});
test('same language as the NFA (if)', () => {
  const d = toDFA(IFX, 'ifx');
  for (const w of all('ifx', 4)) {
    expect(runDFA(d, w)).toBe(acc(IFX, w));
  }
});
test('same language (ends in ab)', () => {
  const d = toDFA(ENDS_AB, 'ab');
  for (const w of all('ab', 6)) {
    expect(runDFA(d, w)).toBe(acc(ENDS_AB, w));
  }
});`,
    hints: [
      'Keep a list `ds` of the DFA states found so far (each a Set of NFA states), and walk it with an index `i`; new sets are pushed onto the end, so the loop naturally keeps going until no new set appears.',
      'Two Sets with the same members are different objects, so give each set a text key, such as its members sorted and joined with commas, and keep a `Map` from key to DFA number.',
      'For each set and each character: call `move`; skip if the result is empty; take the closure; look up its key, adding a new DFA state if it is new; then set `next[i][ch]`. Mark `i` accepting if any of its NFA states is accepting.',
    ],
    walkthrough: `**How to think about it.** The stepper did this by hand with a table: one row per set of NFA states, filled in column by column, with a new row whenever a cell produced a set never seen before, and stopping when every row was complete. The code is that table. The one programming trap is equality: two JavaScript Sets holding the same states are still two different objects, so we cannot ask "have I seen this set?" with \`===\`; instead each set gets a text key, the sorted members joined by commas, and a Map remembers which DFA number each key has.

**The solution, line by line.**

- \`const key = (set) => [...set].sort().join(',');\` turns a set like \`{5, 3}\` into \`'3,5'\`; sorting makes the key the same however the set was built.
- \`const d0 = closure(nfa, [nfa.start]);\` the DFA's start state is the ε-closure of the NFA's start.
- \`const ds = [d0];\` holds the DFA states' sets: DFA state \`i\` is \`ds[i]\`; \`const ids = new Map([[key(d0), 0]]);\` maps each key to its number.
- \`const next = {}; const accept = [];\` the table and the accepting list we are building.
- \`for (let i = 0; i < ds.length; i++) {\` visits each DFA state once, calling its set \`T\`; because new sets are pushed onto \`ds\` inside the loop, \`ds.length\` grows and the loop carries on until no new set turns up.
- \`next[i] = {};\` starts this row.
- The \`for (const q of T)\` loop marks \`i\` accepting if any NFA state in the set is accepting, then \`break\`s so it is added only once.
- \`for (const ch of alphabet) {\` one column per character.
- \`const m = move(nfa, T, ch);\` is the given helper: every state one \`ch\`-arrow away from the set.
- \`if (m.size === 0) continue;\` no arrow: leave the cell empty (the dead state, unwritten).
- \`const u = closure(nfa, m);\` and \`const k = key(u);\` the next set and its key.
- \`if (!ids.has(k)) { ids.set(k, ds.length); ds.push(u); }\` a new set gets the next number and joins the list, to be visited later.
- \`next[i][ch] = ids.get(k);\` fills the cell.
- \`return { start: 0, accept, next };\` the DFA, start state 0.

**Common wrong attempts.**

- Checking \`ds.includes(u)\` to find repeats never finds one (different objects), so the loop adds the same set forever, or until memory runs out.
- Forgetting the closure on the first set makes the start state \`{0}\` for \`IFX\`, which has no moves, so the DFA rejects everything.
- Making a state accepting only when *all* its NFA states accept rejects \`aab\` for \`ENDS_AB\`: after reading it the set is \`{0, 2}\`, and 0 is not accepting, although 2 is.`,
    wrong: [
      {
        code: `function closure(nfa, set) {
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

function move(nfa, set, ch) {
  const out = new Set();
  for (const [p, c, r] of nfa.edges) {
    if (set.has(p) && c === ch) {
      out.add(r);
    }
  }
  return out;
}

function toDFA(nfa, alphabet) {
  const key = (set) =>
    [...set].sort().join(',');
  const d0 = new Set([nfa.start]);
  const ds = [d0];
  const ids = new Map([[key(d0), 0]]);
  const next = {};
  const accept = [];
  for (let i = 0; i < ds.length; i++) {
    const T = ds[i];
    next[i] = {};
    for (const q of T) {
      if (nfa.accept.includes(q)) {
        accept.push(i);
        break;
      }
    }
    for (const ch of alphabet) {
      const m = move(nfa, T, ch);
      if (m.size === 0) continue;
      const u = closure(nfa, m);
      const k = key(u);
      if (!ids.has(k)) {
        ids.set(k, ds.length);
        ds.push(u);
      }
      next[i][ch] = ids.get(k);
    }
  }
  return { start: 0, accept, next };
}`,
        why: 'The start set is `{0}` without its ε-closure, so for the if-or-name NFA the DFA cannot move at all and rejects every word.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'In Thompson’s construction, how many new states does concatenation `rs` add?',
    options: [
      {
        t: 'None: it links the accepting state of N(r) to the start of N(s), by an ε-move (or, in some versions, by merging the two states)',
        correct: true,
        why: 'The combined machine starts at N(r)’s start and accepts at N(s)’s accepting state.',
      },
      {
        t: 'Two, like alternation',
        why: 'Alternation needs a new fan-out start and join end; concatenation reuses the parts’ own ends.',
      },
      {
        t: 'One, to sit between the two parts',
        why: 'An ε-arrow (or a merge) joins the two parts directly; no state is needed in between.',
      },
    ],
  },
  {
    q: 'A Thompson NFA for `r*` is missing the ε-move from the new start to the new end. Which language does it accept?',
    options: [
      {
        t: 'The same as `r*`',
        why: 'That arrow is the only way to match zero copies, so something is lost.',
      },
      {
        t: 'The same as `r`',
        why: 'The "again" arrow is still there, so it can repeat.',
      },
      {
        t: 'One or more copies of `r` (`r+`)',
        correct: true,
        why: 'Without the skip arrow every path goes through N(r) at least once, but the loop back still allows more.',
      },
    ],
  },
  {
    q: 'During the subset construction, the move from a DFA state on `c` gives a set that is already in the table. What do you do?',
    options: [
      {
        t: 'Add it again as a new DFA state',
        why: 'Each different set becomes one DFA state; a repeat would make the loop run forever.',
      },
      {
        t: 'Point the arrow at the existing DFA state for that set',
        correct: true,
        why: 'A DFA state is named by its set, so the same set must be the same state: the arrow goes to the state already made for it.',
      },
      {
        t: 'Stop the construction',
        why: 'Only when every row is complete does the construction stop.',
      },
    ],
  },
  {
    q: 'The subset construction makes a DFA state for the set of NFA states {2, 6}. In the NFA, 6 is accepting and 2 is not. Is the DFA state accepting?',
    options: [
      {
        t: 'No, because 2 is not accepting',
        why: 'The set stands for every path the NFA could be on, and one accepting path is enough.',
      },
      {
        t: 'Yes, because the set contains an accepting NFA state',
        correct: true,
        why: 'A DFA state accepts exactly when its set shares at least one state with the NFA’s accepting states.',
      },
      {
        t: 'Only if it is the last DFA state discovered',
        why: 'The order of discovery has nothing to do with accepting.',
      },
    ],
  },
  {
    q: 'Why can a DFA from the subset construction run faster than simulating the NFA it came from?',
    options: [
      {
        t: 'It has fewer states',
        why: 'It can have more states, not fewer; the speed comes from elsewhere.',
      },
      {
        t: 'It skips characters that cannot matter',
        why: 'It still reads every character once.',
      },
      {
        t: 'The work of moving sets of states was done once in advance, so each character is one table lookup',
        correct: true,
        why: 'Each DFA state is a whole pre-computed set, and its row already says where every character leads.',
      },
    ],
  },
];
