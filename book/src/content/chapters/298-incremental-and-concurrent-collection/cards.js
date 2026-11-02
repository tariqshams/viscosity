// Chapter 268 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'ic-what': {
    q: 'What makes a collector **incremental**?',
    a: 'It does collection work in small slices on the program\'s own thread, letting the program run in between.',
  },
  'cc-what': {
    q: 'What makes a collector **concurrent**?',
    a: 'Collection work runs on other threads at the same time as the program runs.',
  },
  'par-what': {
    q: 'Does a **parallel** collector let the program run during collection?',
    a: 'No: several threads share the work while the program is stopped; it shortens the pause but keeps it.',
  },
  'go-phases': {
    q: 'In a Go `gctrace` line, `0.021+6.7+0.065 ms clock`, which part ran while the program kept running?',
    a: 'The middle one, 6.7 ms of concurrent marking; the other two are short stop-the-world phases.',
  },
  'lost-two': {
    q: 'What two things must the program do, during marking, to hide a live object from the marker?',
    a: 'Store a pointer to the white object into a black object, and destroy every path to it from a grey object.',
  },
  'dij-what': {
    q: 'What does a Dijkstra (insertion) barrier shade, and which invariant does it keep?',
    a: 'The value being stored; it keeps the strong invariant (no black object points at a white one).',
  },
  'yuasa-what': {
    q: 'What does a Yuasa (deletion) barrier shade?',
    a: 'The old value in the field, just before it is overwritten.',
  },
  'satb-float': {
    q: 'What is **floating garbage** in a snapshot-at-the-beginning collector?',
    a: 'Objects that die during marking but are marked anyway, because they were reachable at the start; they are freed next cycle.',
  },
  'satb-alloc': {
    q: 'What colour are objects allocated during SATB marking, and why?',
    a: 'Black: they were not in the snapshot, and they cannot be garbage yet, so the marker need not scan them.',
  },
};

export const examples = {
  hide: {
    title: 'Hiding an object from the marker',
    code: `// w = white, g = grey, b = black
const refs = {
  A: ['B'], B: ['C'], C: [] };
const col = { A: 'b', B: 'g', C: 'w' };
const grey = ['B'];
// one slice is done; the program runs:
refs.A.push('C'); // black A -> white C
refs.B = []; // no grey path to C
// the marker finishes its work
while (grey.length > 0) {
  const o = grey.pop();
  for (const r of refs[o]) {
    if (col[r] === 'w') {
      col[r] = 'g';
      grey.push(r);
    }
  }
  col[o] = 'b';
}
console.log(col);
console.log('A -> C?',
  refs.A.includes('C'));`,
  },
};

export const exercises = {
  incremental: {
    title: 'An incremental marker with a Dijkstra barrier',
    prompt: `The heap \`h\` is an array of objects \`{ refs }\` (addresses or \`null\`). \`startMark\` and \`shade\` are given: marking state is \`{ color, grey, marking }\`, with colours \`'w'\`, \`'g'\` and \`'b'\`.

1. Write \`slice(st, h, k)\`: do up to \`k\` units of work, where one unit is popping a grey object, shading everything it refers to, and making it black. When no grey objects are left, set \`st.marking\` to \`false\`. Return \`true\` if marking is finished, \`false\` otherwise.
2. Write \`write(st, h, o, f, v)\`, the program's pointer store with a **Dijkstra** barrier: while marking, shade the value being stored; then store it.`,
    starter: `function startMark(h, roots) {
  const st = { color: h.map(() => 'w'),
    grey: [], marking: true };
  for (const r of roots) shade(st, r);
  return st;
}
function shade(st, p) {
  if (p === null) return;
  if (st.color[p] !== 'w') return;
  st.color[p] = 'g';
  st.grey.push(p);
}
// up to k units of work;
// true when marking is done
function slice(st, h, k) {
  return true;
}
// the program's pointer store
function write(st, h, o, f, v) {
  h[o].refs[f] = v;
}`,
    solution: `function startMark(h, roots) {
  const st = { color: h.map(() => 'w'),
    grey: [], marking: true };
  for (const r of roots) shade(st, r);
  return st;
}
function shade(st, p) {
  if (p === null) return;
  if (st.color[p] !== 'w') return;
  st.color[p] = 'g';
  st.grey.push(p);
}
function slice(st, h, k) {
  for (let i = 0; i < k; i++) {
    if (st.grey.length === 0) break;
    const o = st.grey.pop();
    for (const r of h[o].refs) {
      shade(st, r);
    }
    st.color[o] = 'b';
  }
  if (st.grey.length === 0) {
    st.marking = false;
  }
  return !st.marking;
}
function write(st, h, o, f, v) {
  if (st.marking) shade(st, v);
  h[o].refs[f] = v;
}`,
    tests: `// 0 -> 1 -> 2; 3 is garbage
const mk = () => [
  { refs: [1, null] },
  { refs: [2] },
  { refs: [null] },
  { refs: [0] },
];
test('one slice blackens one object', () => {
  const h = mk();
  const st = startMark(h, [0]);
  expect(slice(st, h, 1)).toBe(false);
  expect(st.color)
    .toEqual(['b', 'g', 'w', 'w']);
});
test('slices finish the marking', () => {
  const h = mk();
  const st = startMark(h, [0]);
  let n = 0;
  while (!slice(st, h, 1) && n < 99) n++;
  expect(st.color)
    .toEqual(['b', 'b', 'b', 'w']);
  expect(st.marking).toBe(false);
});
test('the program cannot hide 2', () => {
  const h = mk();
  const st = startMark(h, [0]);
  slice(st, h, 1); // 0 black, 1 grey
  write(st, h, 0, 1, 2); // black -> 2
  write(st, h, 1, 0, null); // cut 1 -> 2
  let n = 0;
  while (!slice(st, h, 2) && n < 99) n++;
  expect(st.color[2]).toBe('b');
  expect(h[0].refs).toEqual([1, 2]);
});
test('no shading once marking is over', () => {
  const h = mk();
  const st = startMark(h, [0]);
  let n = 0;
  while (!slice(st, h, 5) && n < 99) n++;
  write(st, h, 0, 1, 3);
  expect(st.color[3]).toBe('w');
  expect(h[0].refs[1]).toBe(3);
});`,
    hints: [
      '`slice` is the marking loop you know from the Drip collector, but it may stop early: run it at most `k` times, and stop sooner if the grey list is empty.',
      'One unit: `const o = st.grey.pop();`, then `shade(st, r)` for every `r` in `h[o].refs`, then `st.color[o] = \'b\'`. After the loop, if `st.grey` is empty, set `st.marking = false`; return `!st.marking`.',
      'The barrier is one line before the store: `if (st.marking) shade(st, v);`. `shade` already ignores `null` and anything that is not white.',
    ],
    walkthrough: `**How to think about it.** An incremental marker is the ordinary grey-list marker with a budget: instead of running until the grey list is empty, each call does at most \`k\` objects and returns, so the program can run between calls. Everything else follows from that. Between slices the program changes pointers, so the store must report to the marker; with a Dijkstra barrier, the report is "shade whatever I am storing", which means a black object can never end up pointing at a white one.

**The solution, line by line.**

- \`function slice(st, h, k) {\` takes the marking state, the heap and the budget.
- \`for (let i = 0; i < k; i++) {\` allows at most \`k\` units of work.
- \`if (st.grey.length === 0) break;\` stops early when there is nothing grey left.
- \`const o = st.grey.pop();\` takes a grey object.
- \`for (const r of h[o].refs) { shade(st, r); }\` greys every white object it refers to. \`shade\` ignores \`null\` and objects that are already grey or black, so nothing is queued twice and cycles end.
- \`st.color[o] = 'b';\` makes it black: found, and every field scanned.
- After the loop, \`if (st.grey.length === 0) { st.marking = false; }\` records that marking is over, which also switches the barrier off.
- \`return !st.marking;\` tells the caller whether to keep slicing.
- \`function write(st, h, o, f, v) {\` is the program's store \`h[o].refs[f] = v\`, with the barrier in front.
- \`if (st.marking) shade(st, v);\` is the whole Dijkstra barrier: if a collection is in progress, the value being stored is shaded, so if it was white it becomes grey and goes on the list.
- \`h[o].refs[f] = v;\` then does the store.

Trace the third test. After one slice, 0 is black and 1 is grey. The program stores 2 into black 0: the barrier shades 2, so the grey list is now 1 and 2. Then it cuts 1's pointer to 2: that store writes \`null\`, so nothing is shaded, and nothing needs to be, because 2 is already grey. The remaining slices blacken 2 and 1. Without the barrier, the grey list would hold only 1, whose field is now \`null\`, and 2 would stay white while 0 points at it.

**Common wrong attempts.**

- Ignoring \`k\` and marking everything in one call: the answers come out right, but the program never gets to run between slices, which is the point of being incremental; the first test catches it.
- Shading even when marking is over: \`write\` then turns objects grey between cycles, and they stay on the grey list into the next collection with the wrong colours. The last test catches it.
- Storing first and shading after: here, with one thread, that is fine. With a concurrent marker on another thread, the order and the memory model matter, which is why real barriers are written with great care.`,
    wrong: [
      {
        code: `function startMark(h, roots) {
  const st = { color: h.map(() => 'w'),
    grey: [], marking: true };
  for (const r of roots) shade(st, r);
  return st;
}
function shade(st, p) {
  if (p === null) return;
  if (st.color[p] !== 'w') return;
  st.color[p] = 'g';
  st.grey.push(p);
}
function slice(st, h, k) {
  while (st.grey.length > 0) {
    const o = st.grey.pop();
    for (const r of h[o].refs) {
      shade(st, r);
    }
    st.color[o] = 'b';
  }
  st.marking = false;
  return true;
}
function write(st, h, o, f, v) {
  if (st.marking) shade(st, v);
  h[o].refs[f] = v;
}`,
        why: 'This ignores the budget `k` and marks everything in one go: a stop-the-world marker, not an incremental one.',
      },
      {
        code: `function startMark(h, roots) {
  const st = { color: h.map(() => 'w'),
    grey: [], marking: true };
  for (const r of roots) shade(st, r);
  return st;
}
function shade(st, p) {
  if (p === null) return;
  if (st.color[p] !== 'w') return;
  st.color[p] = 'g';
  st.grey.push(p);
}
function slice(st, h, k) {
  for (let i = 0; i < k; i++) {
    if (st.grey.length === 0) break;
    const o = st.grey.pop();
    for (const r of h[o].refs) {
      shade(st, r);
    }
    st.color[o] = 'b';
  }
  if (st.grey.length === 0) {
    st.marking = false;
  }
  return !st.marking;
}
function write(st, h, o, f, v) {
  shade(st, v);
  h[o].refs[f] = v;
}`,
        why: 'The barrier shades even when no collection is running, so objects are greyed between cycles.',
      },
    ],
  },
  satb: {
    optional: true,
    title: 'A snapshot barrier and black allocation',
    prompt: `\`startMark\`, \`shade\` and \`slice\` are given, as in the previous exercise. Write the snapshot-at-the-beginning half:

1. \`satbWrite(st, h, o, f, v)\`: a **Yuasa** barrier. While marking, shade the value currently in \`h[o].refs[f]\` (the one about to be overwritten); then store \`v\`.
2. \`alloc(st, h)\`: add a new object \`{ refs: [null] }\` to the end of the heap, give it a colour (black while marking, white otherwise) and return its address.`,
    starter: `function startMark(h, roots) {
  const st = { color: h.map(() => 'w'),
    grey: [], marking: true };
  for (const r of roots) shade(st, r);
  return st;
}
function shade(st, p) {
  if (p === null) return;
  if (st.color[p] !== 'w') return;
  st.color[p] = 'g';
  st.grey.push(p);
}
function slice(st, h, k) {
  for (let i = 0; i < k; i++) {
    if (st.grey.length === 0) break;
    const o = st.grey.pop();
    for (const r of h[o].refs) {
      shade(st, r);
    }
    st.color[o] = 'b';
  }
  if (st.grey.length === 0) {
    st.marking = false;
  }
  return !st.marking;
}
function satbWrite(st, h, o, f, v) {
  h[o].refs[f] = v;
}
function alloc(st, h) {
  h.push({ refs: [null] });
  st.color.push('w');
  return h.length - 1;
}`,
    solution: `function startMark(h, roots) {
  const st = { color: h.map(() => 'w'),
    grey: [], marking: true };
  for (const r of roots) shade(st, r);
  return st;
}
function shade(st, p) {
  if (p === null) return;
  if (st.color[p] !== 'w') return;
  st.color[p] = 'g';
  st.grey.push(p);
}
function slice(st, h, k) {
  for (let i = 0; i < k; i++) {
    if (st.grey.length === 0) break;
    const o = st.grey.pop();
    for (const r of h[o].refs) {
      shade(st, r);
    }
    st.color[o] = 'b';
  }
  if (st.grey.length === 0) {
    st.marking = false;
  }
  return !st.marking;
}
function satbWrite(st, h, o, f, v) {
  if (st.marking) {
    shade(st, h[o].refs[f]);
  }
  h[o].refs[f] = v;
}
function alloc(st, h) {
  h.push({ refs: [null] });
  st.color.push(st.marking ? 'b' : 'w');
  return h.length - 1;
}`,
    tests: `const mk = () => [
  { refs: [1, null] },
  { refs: [2] },
  { refs: [null] },
  { refs: [0] },
];
const finish = (st, h) => {
  let n = 0;
  while (!slice(st, h, 1) && n < 99) n++;
};
test('the hiding program fails again', () => {
  const h = mk();
  const st = startMark(h, [0]);
  slice(st, h, 1);
  satbWrite(st, h, 0, 1, 2);
  satbWrite(st, h, 1, 0, null);
  finish(st, h);
  expect(st.color[2]).toBe('b');
});
test('the snapshot is kept: floating garbage',
  () => {
    const h = mk();
    const st = startMark(h, [0]);
    satbWrite(st, h, 0, 0, null); // drop 1
    finish(st, h);
    expect(st.color)
      .toEqual(['b', 'b', 'b', 'w']);
  });
test('new objects are born black', () => {
  const h = mk();
  const st = startMark(h, [0]);
  const a = alloc(st, h);
  expect(st.color[a]).toBe('b');
  finish(st, h);
  expect(st.color[alloc(st, h)]).toBe('w');
});`,
    hints: [
      'The only difference from the Dijkstra barrier is *which* value is shaded: the old one, read from the field before the store.',
      '`if (st.marking) { shade(st, h[o].refs[f]); }` then `h[o].refs[f] = v;`. The order matters: read the old value before overwriting it.',
      'For `alloc`, push the colour `st.marking ? \'b\' : \'w\'`: a new object was not in the snapshot, and nothing could have made it garbage yet.',
    ],
    walkthrough: `**How to think about it.** A snapshot barrier promises: every object reachable when marking began will be marked. A pointer can only disappear from the graph by being overwritten, so the barrier saves (shades) every pointer at the moment it is overwritten. New objects were not in the snapshot; making them black means the marker never has to look at them, and they cannot be freed by mistake in this cycle.

**The solution, line by line.**

- \`if (st.marking) { shade(st, h[o].refs[f]); }\` reads the field's current value, the one about to be lost, and shades it. \`shade\` ignores \`null\`.
- \`h[o].refs[f] = v;\` then stores the new value. Note that \`v\` is not shaded: in a pure SATB collector, the stored value was either in the snapshot already (and will be found) or allocated during marking (and is black).
- \`h.push({ refs: [null] });\` makes the new object at the end of the heap.
- \`st.color.push(st.marking ? 'b' : 'w');\` gives it its colour: black during marking, white otherwise (it will be found from the roots next time, or freed).
- \`return h.length - 1;\` is its address.

In the "floating garbage" test, the program drops 0's pointer to 1 before the marker has scanned 0. The barrier shades 1 as the pointer disappears, so 1 and then 2 are marked, though nothing reaches them at the end. That is the price of the snapshot: they are freed by the next cycle.

**Common wrong attempts.**

- Shading \`v\` instead of the old value: that is the Dijkstra barrier, which also saves the hidden object, but does not keep the snapshot: the floating-garbage test expects 1 to be marked.
- Storing first and then shading \`h[o].refs[f]\`: by then the field holds \`v\`, and the old value is gone.
- Allocating white during marking: the new object might be stored only into a black object, and then nothing would ever find it in this cycle.`,
    wrong: [
      {
        code: `function startMark(h, roots) {
  const st = { color: h.map(() => 'w'),
    grey: [], marking: true };
  for (const r of roots) shade(st, r);
  return st;
}
function shade(st, p) {
  if (p === null) return;
  if (st.color[p] !== 'w') return;
  st.color[p] = 'g';
  st.grey.push(p);
}
function slice(st, h, k) {
  for (let i = 0; i < k; i++) {
    if (st.grey.length === 0) break;
    const o = st.grey.pop();
    for (const r of h[o].refs) {
      shade(st, r);
    }
    st.color[o] = 'b';
  }
  if (st.grey.length === 0) {
    st.marking = false;
  }
  return !st.marking;
}
function satbWrite(st, h, o, f, v) {
  h[o].refs[f] = v;
  if (st.marking) {
    shade(st, h[o].refs[f]);
  }
}
function alloc(st, h) {
  h.push({ refs: [null] });
  st.color.push(st.marking ? 'b' : 'w');
  return h.length - 1;
}`,
        why: 'The store happens before the old value is read, so the barrier shades the new value: the snapshot is lost.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Which collector shortens a pause but does not let the program run during collection?',
    options: [
      {
        t: 'An incremental one',
        why: 'Incremental collection does let the program run, between slices.',
      },
      {
        t: 'A parallel one',
        correct: true,
        why: 'Several threads share the work, but the program is stopped while they do it.',
      },
      {
        t: 'A concurrent one',
        why: 'Concurrent collection runs beside the program.',
      },
    ],
  },
  {
    q: 'During marking, the program runs `A.f = C` (A black, C white) and then `B.g = null` (B grey, and its pointer was the only grey path to C). With no barrier, what happens?',
    options: [
      {
        t: 'C is marked when the marker scans B',
        why: 'B no longer points at C by then.',
      },
      {
        t: 'C stays white and is freed, though A points at it',
        correct: true,
        why: 'Both conditions for losing an object were met.',
      },
      {
        t: 'A is turned grey again automatically',
        why: 'Nothing re-greys A without a barrier.',
      },
    ],
  },
  {
    q: 'What does Yuasa\'s deletion barrier shade on `o.f = v`?',
    options: [
      {
        t: '`v`, the value being stored',
        why: 'That is Dijkstra\'s insertion barrier.',
      },
      {
        t: '`o`, the object being written',
        why: 'Re-greying the owner is yet another design; Yuasa\'s shades the old value.',
      },
      {
        t: 'The old value of `o.f`, before it is overwritten',
        correct: true,
        why: 'So no pointer can disappear without its target being found: the snapshot.',
      },
    ],
  },
  {
    q: 'Why does a snapshot-at-the-beginning collector produce floating garbage?',
    options: [
      {
        t: 'Because it marks everything reachable at the start, including objects that die during marking',
        correct: true,
        why: 'Those survive this cycle and are freed by the next.',
      },
      {
        t: 'Because it never frees cycles',
        why: 'Tracing collectors free unreachable cycles.',
      },
      {
        t: 'Because its barrier is buggy',
        why: 'It is a deliberate trade, not a bug.',
      },
    ],
  },
  {
    q: 'Go\'s hybrid barrier shades both the old value and the new one. When is the new-value half needed?',
    options: [
      {
        t: 'Always',
        why: 'The comment in mbarrier.go makes it conditional.',
      },
      {
        t: 'Only for stores into globals',
        why: 'Globals get barriers in Go, but that is not the condition.',
      },
      {
        t: 'Only while the current goroutine\'s stack is still grey',
        correct: true,
        why: 'Once the stack is scanned (black), it hides nothing, so the deletion half is enough.',
      },
    ],
  },
];
