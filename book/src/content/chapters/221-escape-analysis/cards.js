// Chapter 221 cards. Keys are stable ids: never rename them.

export const prompts = {
  'ea-what': {
    q: 'What question does escape analysis answer?',
    a: 'Can a reference to an object made here be used outside this region of code (after it ends, or by code outside it)?',
  },
  'ea-region': {
    q: '“Escapes” is always relative to what?',
    a: 'A region of code: a function, a loop, or a thread. Leaving that region is escaping.',
  },
  'ea-conservative': {
    q: 'When escape analysis cannot tell whether an object escapes, what must it assume, and why?',
    a: 'That it escapes. Wrongly saying “stays inside” could free or take apart an object someone still uses; wrongly saying “escapes” only costs speed.',
  },
  'cg-nodes': {
    q: 'What are the three kinds of node in a connection graph?',
    a: 'Objects (one per allocation site), local variables, and fields of objects.',
  },
  'deferred-edge': {
    q: 'What does a deferred edge x ⇢ y mean, and what happens to it after the graph is built?',
    a: '“x holds whatever y holds”; it is bypassed, so x points directly at y’s objects.',
  },
  'three-states': {
    q: 'Name the three escape states, from most local to least.',
    a: 'NoEscape, ArgEscape, GlobalEscape.',
  },
  'reach-escape': {
    q: '`p.next = q`, and q’s object escapes. Does p’s object escape?',
    a: 'No. Pointing at an escaping object is harmless; an object escapes only if something escaping can reach it.',
  },
  'ea-uses': {
    q: 'What can a compiler do with a NoEscape object, and with one that does not escape its thread?',
    a: 'NoEscape: allocate it on the stack or replace it with its fields (scalars). Thread-local: remove its locks.',
  },
};

export const examples = {
  outlives: {
    title: 'An object that outlives its call',
    code: `let saved = null;
function make(x) {
  const p = { x };
  saved = p;      // escapes: a global
  return p.x * 2; // make's frame ends
}
make(1);
make(2);
console.log(saved.x); // 2: still alive
saved.x = 5;
console.log(saved.x);`,
  },
};

export const exercises = {
  escapeStates: {
    title: 'Colour a connection graph',
    prompt:
      'A connection graph with its deferred edges already bypassed is a list of `edges`, each `[from, to]`. `start` gives the starting state of some nodes: `\'global\'` or `\'arg\'`. Every other node starts as `\'no\'` (NoEscape). States are ordered `no < arg < global`, and each node’s state spreads along edges to everything it can reach. Write `escapeStates(edges, start)` returning an object with the final state of every node that appears.',
    starter: `function escapeStates(edges, start) {
  // your code here
  return {};
}

console.log(escapeStates(
  [['G', 'o2'], ['p', 'o1']],
  { G: 'global' })); // o2: global`,
    solution: `function escapeStates(edges, start) {
  const rank = { no: 0, arg: 1,
    global: 2 };
  const st = {};
  for (const [a, b] of edges) {
    st[a] = 'no';
    st[b] = 'no';
  }
  Object.assign(st, start);
  const work = Object.keys(start);
  while (work.length) {
    const n = work.pop();
    for (const [a, b] of edges) {
      if (a !== n) continue;
      if (rank[st[n]] > rank[st[b]]) {
        st[b] = st[n];
        work.push(b);
      }
    }
  }
  return st;
}`,
    tests: `const graph = [['p', 'o1'], ['q', 'o2'], ['r', 'o3'], ['o1', 'next'], ['next', 'o2'], ['arg', 'o3'], ['G', 'o2']];
test('the graph from the stepper', () => {
  const s = escapeStates(graph, { G: 'global', arg: 'arg' });
  expect([s.o1, s.o2, s.o3]).toEqual(['no', 'global', 'arg']);
});
test('pointing out does not escape', () => {
  const s = escapeStates([['o1', 'f'], ['f', 'o2'], ['G', 'o2']], { G: 'global' });
  expect(s.o1).toBe('no');
  expect(s.o2).toBe('global');
});
test('states spread along chains', () => {
  const s = escapeStates([['G', 'a'], ['a', 'b'], ['b', 'c']], { G: 'global' });
  expect(s.c).toBe('global');
});
test('the larger state wins', () => {
  const s = escapeStates([['arg', 'o'], ['G', 'o']], { arg: 'arg', G: 'global' });
  expect(s.o).toBe('global');
});
test('cycles stop, and unreached nodes stay no', () => {
  const s = escapeStates([['arg', 'a'], ['a', 'b'], ['b', 'a'], ['x', 'y']], { arg: 'arg' });
  expect([s.a, s.b, s.y]).toEqual(['arg', 'arg', 'no']);
});`,
    hints: [
      'Give every node that appears in `edges` the state `\'no\'`, then overwrite the ones in `start`.',
      'Use a worklist, starting with the nodes in `start`. Taking a node off the list, look at every edge leaving it.',
      'Give the edge’s target this node’s state if that is larger (rank `no` 0, `arg` 1, `global` 2), and put the target on the worklist, since its own successors may now need raising.',
    ],
    walkthrough: `**How to think about it.** The rule is "an object's state is the largest starting state of anything that can reach it". "Can reach" means following edges any number of steps, so this is a reachability problem, and the tool is the worklist from the dataflow chapters: when a node's state goes up, the nodes it points at may need to go up too, so they go on the list. Each node can only rise twice (no to arg, arg to global), so the loop must end, even with cycles. The direction matters: states flow *along* edges, from whoever holds a reference to what is referenced, never backwards.

**The solution, line by line.**

- \`const rank = { no: 0, arg: 1, global: 2 };\` turns the order of the states into numbers we can compare.
- The loop over \`edges\` gives every node that appears the state \`'no'\`.
- \`Object.assign(st, start);\` then overwrites the starting states, such as \`G: 'global'\`.
- \`const work = Object.keys(start);\` : only these nodes have anything to spread at first.
- \`const n = work.pop();\` takes a node to spread from.
- \`for (const [a, b] of edges) { if (a !== n) continue;\` visits each edge leaving \`n\`.
- \`if (rank[st[n]] > rank[st[b]]) { st[b] = st[n]; work.push(b); }\` raises the target when \`n\`'s state is larger, and schedules the target so its own successors are visited. If the target is already as large, nothing changes, which is exactly what stops cycles.
- \`return st;\`

**Common wrong attempts.**

- Spreading one step only (no worklist): \`G → a → b → c\` would leave \`c\` at \`'no'\`, a wrong "does not escape", the dangerous kind.
- Spreading backwards (from \`b\` to \`a\`): then \`o1\`, which merely *points at* an escaping object, would be marked as escaping. That is safe but needlessly pessimistic: nothing outside can follow \`o1.next\` back to \`o1\`.
- Setting \`st[b] = st[n]\` without comparing would let an \`'arg'\` overwrite a \`'global'\`, depending on the order of the worklist.`,
    wrong: [
      {
        code: `function escapeStates(edges, start) {
  const st = {};
  for (const [a, b] of edges) {
    st[a] = 'no';
    st[b] = 'no';
  }
  Object.assign(st, start);
  for (const [a, b] of edges) {
    if (a in start) st[b] = start[a];
  }
  return st;
}`,
        why: 'One step only: an object reached through a chain (G → a → b → c) keeps `\'no\'`, a wrong “does not escape”.',
      },
      {
        code: `function escapeStates(edges, start) {
  const rank = { no: 0, arg: 1,
    global: 2 };
  const st = {};
  for (const [a, b] of edges) {
    st[a] = 'no';
    st[b] = 'no';
  }
  Object.assign(st, start);
  let changed = true;
  while (changed) {
    changed = false;
    for (const [a, b] of edges) {
      for (const [x, y] of [[a, b],
          [b, a]]) {
        if (rank[st[x]] > rank[st[y]]) {
          st[y] = st[x];
          changed = true;
        }
      }
    }
  }
  return st;
}`,
        why: 'This spreads states both ways along each edge, so an object that only points at an escaping one is marked as escaping too.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'In `function dist(x, y) { const p = { x, y }; return Math.sqrt(p.x * p.x + p.y * p.y); }`, does `p` escape?',
    options: [
      { t: 'Yes: every object is on the heap', why: 'That is where the language says it lives; escape analysis asks whether it has to.' },
      { t: 'Yes: it is used in a call to Math.sqrt', why: 'Only numbers read from it are passed, not the object.' },
      { t: 'No: only its fields are read, and no reference to it leaves `dist`', correct: true, why: 'So it could live on the stack, or be replaced by two numbers.' },
    ],
  },
  {
    q: '`p.next = q`, where `q`’s object is stored in a global. What is the state of `p`’s object, if nothing else touches it?',
    options: [
      { t: 'NoEscape', correct: true, why: 'States spread along edges to what is pointed at; p’s object points at q’s, not the other way round.' },
      { t: 'GlobalEscape, because it is connected to a global object', why: 'Connected in the wrong direction: nobody outside can follow `next` backwards.' },
      { t: 'ArgEscape', why: 'No argument reaches p’s object.' },
    ],
  },
  {
    q: 'What does a deferred edge in a connection graph stand for?',
    options: [
      { t: 'A call that has not been analysed yet', why: 'Calls are handled separately; a deferred edge comes from an assignment.' },
      { t: 'An object that will be allocated later', why: 'Objects are nodes; edges connect them.' },
      { t: '“Holds whatever that holds”, from a copy like `p = q` or a field store; it is bypassed after the graph is built', correct: true, why: 'Bypassing gives p direct points-to edges to q’s objects.' },
      { t: 'An edge that may be ignored', why: 'Ignoring it would lose the flow of references, and with it, escapes.' },
    ],
  },
  {
    q: 'Go reports `moved to heap: p` for `func make1() *P { p := P{3, 4}; return &p }`. Why?',
    options: [
      { t: 'Because P has two fields', why: 'Size is not the reason; a P that is only read can stay on the stack.' },
      { t: 'Because inlining was turned off', why: 'Even without inlining, a value that is only read stays on the stack.' },
      { t: 'Because Go puts every struct on the heap', why: 'It puts values on the stack whenever escape analysis allows.' },
      { t: 'A pointer to p is returned, so p must outlive the frame of make1', correct: true, why: 'Go’s rule: pointers to a stack object cannot outlive that object.' },
    ],
  },
  {
    q: 'Which optimization needs only that an object does not escape its thread, rather than its method?',
    options: [
      { t: 'Stack allocation', why: 'The stack frame dies when the method returns, so the object must not outlive the method.' },
      { t: 'Removing the locks taken on it', correct: true, why: 'No other thread can ever see it, so locking it protects nothing.' },
      { t: 'Scalar replacement', why: 'Taking the object apart needs every use in view, inside the method.' },
    ],
  },
];
