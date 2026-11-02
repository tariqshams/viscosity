// Chapter 63 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.
// Merged from old chapters 84, 84.

export const prompts = {
  'why-own-gc': {
    q: 'The VM runs inside JavaScript, which has a garbage collector. Why does the VM need one of its own?',
    a: 'The VM’s object list refers to every object it ever allocated, so V8 sees them all as reachable. Only the VM knows which ones Drip code can still use.',
  },
  'gc-def': {
    q: 'When is an object garbage, for a tracing collector?',
    a: 'When no chain of references leads to it from any root.',
  },
  cycle: {
    q: 'Two objects refer only to each other, and nothing else refers to either. Are they live?',
    a: 'No. Neither is reachable from a root, so both are garbage; pointing at each other does not count.',
  },
  'roots-list': {
    q: 'Name four of the companion VM’s roots.',
    a: 'Any four of: the value stack up to `sp`, each frame’s closure, the open upvalues, the globals, the `"init"` string, the compiler’s unfinished functions, `extraRoots`.',
  },
  'sp-only': {
    q: 'Why does `markRoots` mark the stack only up to `sp`, not the whole array?',
    a: 'Slots above `sp` hold left-overs from calls that have returned; no code will read them again, so keeping their objects alive would keep garbage.',
  },
  'extra-roots': {
    q: 'What is `heap.push(v)` for?',
    a: 'It puts `v` on `extraRoots`, so a value that is reachable from nowhere else for a moment survives a collection until it is stored somewhere reachable.',
  },
  'stress-mode': {
    q: 'What does stress mode do, and why does it help?',
    a: 'It collects on every allocation (and poisons freed objects), so a missing root fails at once instead of only when a collection happens to fall at the wrong moment.',
  },
  'define-native': {
    q: 'Why does `defineNative` push the name and the native onto the value stack before storing them in the globals?',
    a: 'Allocating the native can trigger a collection; until both are in the globals table, the stack is the only root that keeps them alive.',
  },
  'grey-meaning': {
    q: 'In tri-colour marking, what does it mean for an object to be grey?',
    a: 'It has been reached (marked), but the objects it refers to have not been traced yet. In the companion, it is on the `gray` stack.',
  },
  'why-gray-stack': {
    q: 'Why does the collector keep an explicit grey stack instead of marking recursively?',
    a: 'A long chain of references would need one host call per link and could overflow JavaScript’s call stack; an array can grow as far as it needs.',
  },
  'blacken-list': {
    q: 'What does blackening a Drip list mark?',
    a: 'Every item in it (`markValue` on each of `o.items`); numbers and booleans are skipped, objects are greyed.',
  },
  invariant: {
    q: 'State the tri-colour invariant, and what it gives you when marking ends.',
    a: 'No black object refers to a white one; so when nothing is grey, every white object is unreachable.',
  },
  'weak-strings': {
    q: 'Why is the string table weak rather than a root?',
    a: 'It refers to every string, so as a root it would keep them all alive; and it must not keep entries for strings that sweep frees.',
  },
  'reset-white': {
    q: 'Why does sweep set `isMarked = false` on every object it keeps?',
    a: 'So the next collection starts with everything white; a stale mark would stop `markObject` tracing through that object.',
  },
  'grow-factor': {
    q: 'After a collection, when does the next one start?',
    a: 'When `bytesAllocated` passes `nextGC`, which is twice what survived, but never less than 1 MiB.',
  },
  'sweep-all': {
    q: 'How does sweep find the objects to free, given that nothing refers to them?',
    a: 'It walks the object list, which links every allocated object, and unlinks each one that is not marked.',
  },
};

export const examples = {
  garbage: {
    title: 'A loop that makes garbage',
    lang: 'drip-vm',
    code: `let total = 0;
for i in 0..100000 {
  let p = [i, i + 1];
  total += p[1] - p[0];
}
print total;`,
  },
  chain: {
    title: 'A chain the collector must walk',
    lang: 'drip-vm',
    code: `let head = none;
for i in 0..200000 {
  head = [i, head];
}
let n = 0;
while head != none {
  n += 1;
  head = head[1];
}
print n;`,
  },
};

export const exercises = {
  findRoots: {
    title: 'List the roots',
    prompt: 'A small model of the VM. `vm.stack` is an array and `vm.sp` the number of slots in use; `vm.frames` is an array of `{ closure }`; `vm.open` is an array of open upvalues; `vm.globals` is a `Map` from name objects to values. Objects are plain objects; numbers, booleans and `null` are not objects. Write `roots(vm)`: return an array of every **object** the VM holds directly, in this order: stack slots `0` to `sp - 1`, then each frame’s closure, then each open upvalue, then each global’s name followed by its value.',
    starter: `function roots(vm) {
  const out = [];
  // add the objects the VM holds
  return out;
}`,
    solution: `function roots(vm) {
  const out = [];
  const add = (v) => {
    if (typeof v === 'object' &&
        v !== null) out.push(v);
  };
  for (let i = 0; i < vm.sp; i++) {
    add(vm.stack[i]);
  }
  for (const f of vm.frames) {
    add(f.closure);
  }
  for (const u of vm.open) add(u);
  for (const [k, v] of vm.globals) {
    add(k);
    add(v);
  }
  return out;
}`,
    tests: `const o = (name) => ({ name });
const names = (xs) => xs.map((x) => x.name);
const vmOf = () => {
  const g = new Map();
  g.set(o('x'), o('list'));
  g.set(o('n'), 3);
  return {
    stack: [o('s0'), 7, o('s2'), o('old')],
    sp: 3,
    frames: [{ closure: o('main') }],
    open: [o('up')],
    globals: g,
  };
};
test('stack up to sp, objects only', () => {
  const r = names(roots(vmOf()));
  expect(r.slice(0, 2)).toEqual(['s0', 's2']);
});
test('slots above sp are not roots', () => {
  const r = names(roots(vmOf()));
  expect(r.includes('old')).toBe(false);
});
test('frames, upvalues, globals', () => {
  const r = names(roots(vmOf()));
  expect(r).toEqual(['s0', 's2', 'main', 'up',
    'x', 'list', 'n']);
});
test('an empty VM has no roots', () => {
  const vm = { stack: [], sp: 0, frames: [],
    open: [], globals: new Map() };
  expect(roots(vm)).toEqual([]);
});`,
    hints: [
      'There are four places to look, in the order the prompt gives. Write one loop for each.',
      'Only objects count, so filter with `typeof v === \'object\' && v !== null` (in JavaScript `typeof null` is also `\'object\'`). A small helper `add(v)` keeps that check in one place.',
      'The stack loop runs `for (let i = 0; i < vm.sp; i++)`, not over the whole array. For the globals, `for (const [k, v] of vm.globals)` gives each name and value; add both.',
    ],
    walkthrough: `**How to think about it.** This is the companion's \`markRoots\`, except that instead of calling \`mark\` on each root we collect them in an array. The question for every place is the one the chapter asked: could Drip code reach this object directly, without following any reference? The stack's live part, the running closures, the open upvalues and the globals all qualify; a stack slot above \`sp\` does not.

**The solution, line by line.**

- \`const out = [];\` will hold the roots, in order.
- \`const add = (v) => { if (typeof v === 'object' && v !== null) out.push(v); };\` is the one place that decides what counts. Numbers and booleans live in their slots and are never freed, so they are not interesting to a collector; \`null\` needs its own check because \`typeof null\` is \`'object'\` in JavaScript.
- \`for (let i = 0; i < vm.sp; i++) { add(vm.stack[i]); }\` visits only the slots in use. In the test, slot 3 holds \`old\`, left over from a call that has returned; marking it would keep garbage alive.
- \`for (const f of vm.frames) { add(f.closure); }\` adds every running function's closure: its bytecode, constants and upvalues are in use.
- \`for (const u of vm.open) add(u);\` adds the open upvalues, which the VM itself will search on the next capture.
- \`for (const [k, v] of vm.globals) { add(k); add(v); }\` adds each global's name (a string object in the real VM) and its value. The number 3 stored under \`n\` is skipped by \`add\`.
- \`return out;\`

**Common wrong attempts.**

- Looping over \`vm.stack.length\` instead of \`vm.sp\` includes \`old\`, a left-over above the top of the stack: the collector would keep an object no code can reach.
- Adding only global *values* forgets the names. In the real VM they are string objects too, and freeing one would leave the globals table holding a dead key.
- Testing \`if (v)\` instead of the object check lets the number 7 through (and would drop a value like \`0\`), because truthiness is not the same question as "is this an object?".`,
    wrong: [
      {
        code: `function roots(vm) {
  const out = [];
  const add = (v) => {
    if (typeof v === 'object' &&
        v !== null) out.push(v);
  };
  for (const v of vm.stack) add(v);
  for (const f of vm.frames) {
    add(f.closure);
  }
  for (const u of vm.open) add(u);
  for (const [k, v] of vm.globals) {
    add(k);
    add(v);
  }
  return out;
}`,
        why: 'It walks the whole stack array, so the left-over object above `sp` is treated as a root and would never be freed.',
      },
      {
        code: `function roots(vm) {
  const out = [];
  const add = (v) => {
    if (typeof v === 'object' &&
        v !== null) out.push(v);
  };
  for (let i = 0; i < vm.sp; i++) {
    add(vm.stack[i]);
  }
  for (const f of vm.frames) {
    add(f.closure);
  }
  for (const u of vm.open) add(u);
  for (const v of vm.globals.values()) {
    add(v);
  }
  return out;
}`,
        why: 'It forgets the global names. In the VM they are string objects, and freeing one leaves a dead key in the globals table.',
      },
    ],
  },
  toyGc: {
    title: 'A toy mark-sweep collector',
    prompt: 'Objects are `{ name, refs, marked }`, where `refs` is an array of other objects. Write `collect(heap, roots)`: mark every object reachable from `roots` using an explicit grey stack (no recursion), then return a new array of the marked objects, in heap order, with their `marked` flags reset to `false`.',
    starter: `function collect(heap, roots) {
  const gray = [];
  // 1. mark the roots (grey)
  // 2. trace until gray is empty
  // 3. sweep: keep marked, reset
  return heap;
}`,
    solution: `function collect(heap, roots) {
  const gray = [];
  const mark = (o) => {
    if (o.marked) return;
    o.marked = true;
    gray.push(o);
  };
  roots.forEach(mark);
  while (gray.length > 0) {
    gray.pop().refs.forEach(mark);
  }
  const live = heap.filter(
    (o) => o.marked,
  );
  for (const o of live) {
    o.marked = false;
  }
  return live;
}`,
    tests: `const obj = (name) =>
  ({ name, refs: [], marked: false });
const names = (h) => h.map((o) => o.name);
test('unreachable objects are freed', () => {
  const [a, b, c] = ['a', 'b', 'c'].map(obj);
  a.refs.push(b);
  const live = collect([a, b, c], [a]);
  expect(names(live)).toEqual(['a', 'b']);
});
test('a cycle with no root is freed', () => {
  const [a, d, e] = ['a', 'd', 'e'].map(obj);
  d.refs.push(e);
  e.refs.push(d);
  const live = collect([a, d, e], [a]);
  expect(names(live)).toEqual(['a']);
});
test('shared and cyclic refs survive once', () => {
  const [a, b, c] = ['a', 'b', 'c'].map(obj);
  a.refs.push(b, c);
  b.refs.push(a);
  c.refs.push(b);
  const live = collect([c, b, a], [a]);
  expect(names(live)).toEqual(['c', 'b', 'a']);
});
test('survivors are white again', () => {
  const [a, b] = ['a', 'b'].map(obj);
  a.refs.push(b);
  const live = collect([a, b], [a]);
  expect(live.every((o) => !o.marked))
    .toBe(true);
  const again = collect(live, [a]);
  expect(names(again)).toEqual(['a', 'b']);
});
test('a long chain does not overflow', () => {
  const heap = [];
  for (let i = 0; i < 200000; i++) {
    const o = obj(i);
    if (i > 0) heap[i - 1].refs.push(o);
    heap.push(o);
  }
  const live = collect(heap, [heap[0]]);
  expect(live.length).toBe(200000);
});`,
    hints: [
      'Write a small `mark(o)`: if `o.marked` is already true, return; otherwise set it and push `o` onto `gray`. Call it on every root.',
      'Trace with `while (gray.length > 0)`: pop an object and call `mark` on each of its `refs`. The early return in `mark` handles cycles.',
      'Sweep with `heap.filter((o) => o.marked)`, then set `marked = false` on each survivor before returning them.',
    ],
    walkthrough: `**How to think about it.** Split the job into the chapter's two phases. Marking answers "which objects can the program reach?", starting from the roots and following \`refs\`; sweeping answers "what do we keep?", by going through the whole heap once. The one trap is the long chain in the last test: a \`mark\` that calls itself for every reference would need 200,000 nested calls, and JavaScript's call stack is far smaller than that. So marking keeps its own pile of grey objects in an ordinary array, which can grow as large as it needs.

**The solution, line by line.**

- \`const gray = [];\` is the grey stack: objects reached but not yet traced.
- \`const mark = (o) => { if (o.marked) return; o.marked = true; gray.push(o); };\` is \`markObject\`. Setting \`marked\` records "reached", pushing records "still to trace". The early return makes cycles safe: in the third test \`a\` refers to \`b\` and \`b\` back to \`a\`, and the second visit to \`a\` stops at once.
- \`roots.forEach(mark);\` makes every root grey.
- \`while (gray.length > 0) { gray.pop().refs.forEach(mark); }\` is the blacken loop: take any grey object, grey everything it refers to, and it is now black. The loop ends when nothing is grey, and by the tri-colour invariant every reachable object is then marked.
- \`const live = heap.filter((o) => o.marked);\` is the sweep: keep the marked objects, in heap order, and drop the rest. (The companion unlinks them from its object list instead of building a new array.)
- \`for (const o of live) { o.marked = false; }\` resets the survivors to white, ready for the next collection.
- \`return live;\`

**Common wrong attempts.**

- A recursive \`mark\` that calls \`o.refs.forEach(mark)\` directly passes the small tests but throws a \`RangeError\` on the 200,000-object chain: the host stack overflows.
- Forgetting to reset the marks works once; but at the next collection every survivor already looks marked, \`mark\` returns at once for it, its references are never traced, and objects reachable only through it are freed (the fourth test collects twice to catch this).
- Sweeping before marking has finished (for example, filtering inside the loop) frees objects that are still grey or white but reachable.`,
    wrong: [
      {
        code: `function collect(heap, roots) {
  const mark = (o) => {
    if (o.marked) return;
    o.marked = true;
    o.refs.forEach(mark);
  };
  roots.forEach(mark);
  const live = heap.filter(
    (o) => o.marked,
  );
  for (const o of live) {
    o.marked = false;
  }
  return live;
}`,
        why: 'Correct on small graphs, but it recurses once per link. On the 200 000-object chain the host stack overflows (`RangeError`). Use a grey stack.',
      },
      {
        code: `function collect(heap, roots) {
  const gray = [];
  const mark = (o) => {
    if (o.marked) return;
    o.marked = true;
    gray.push(o);
  };
  roots.forEach(mark);
  while (gray.length > 0) {
    gray.pop().refs.forEach(mark);
  }
  return heap.filter((o) => o.marked);
}`,
        why: 'Survivors keep `marked = true`. The next collection then skips them in `mark`, never traces their references, and frees objects that are still reachable.',
      },
    ],
  },
  weakTable: {
    optional: true,
    title: 'A weak string table',
    prompt: 'The interning table is a `Map` from characters to string objects `{ chars, marked }`. Write `removeWhite(table)`: after marking, delete every entry whose string is not marked, and leave the marked ones (and their flags) alone.',
    starter: `function removeWhite(table) {
  // delete entries whose string
  // was not marked
}`,
    solution: `function removeWhite(table) {
  for (const [k, s] of table) {
    if (!s.marked) table.delete(k);
  }
}`,
    tests: `const str = (chars, marked) =>
  ({ chars, marked });
test('white strings are dropped', () => {
  const t = new Map();
  t.set('a', str('a', true));
  t.set('b', str('b', false));
  t.set('c', str('c', false));
  removeWhite(t);
  expect([...t.keys()]).toEqual(['a']);
});
test('marks are left alone', () => {
  const t = new Map();
  const a = str('a', true);
  t.set('a', a);
  removeWhite(t);
  expect(a.marked).toBe(true);
  expect(t.get('a') === a).toBe(true);
});`,
    hints: [
      'Loop over the entries with `for (const [k, s] of table)`.',
      'Deleting the current entry while iterating a `Map` is allowed in JavaScript.',
      '`if (!s.marked) table.delete(k);`',
    ],
    walkthrough: `**How to think about it.** After marking, a string is marked exactly when something other than the table can reach it, because the table is not a root. So the job is: forget every unmarked string, and touch nothing else. It must happen before sweep, because sweep is about to free exactly those strings, and the table must not be left pointing at any of them.

**The solution, line by line.**

- \`for (const [k, s] of table) {\` visits every entry: \`k\` is the characters, \`s\` the string object.
- \`if (!s.marked) table.delete(k);\` drops an entry whose string nothing else reaches. Deleting the current entry while looping over a \`Map\` is allowed in JavaScript.
- Nothing else: the marks are left alone, because sweep still needs them to know what to keep.

**Common wrong attempts.**

- Resetting \`s.marked = false\` here, to be tidy, makes sweep think every string is white, so it frees live strings too.
- Deleting marked strings instead of unmarked ones (a flipped condition) keeps garbage and forgets live strings, so the next \`copyString\` of a live string's characters makes a duplicate, and \`==\` by identity breaks.

The companion's \`Table.removeWhite\` does the same over its key array, writing a tombstone into each emptied slot so later probes still work (the chapter "Finding things fast: hash tables").`,
    wrong: [
      {
        code: `function removeWhite(table) {
  for (const [k, s] of table) {
    if (!s.marked) table.delete(k);
    s.marked = false;
  }
}`,
        why: 'It removes the right entries but also clears the marks. Sweep runs next and would then free every string, including the live ones.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Why doesn’t V8’s own collector free a Drip list that the program can no longer reach?',
    options: [
      {
        t: 'V8 never frees arrays',
        why: 'V8 frees unreachable arrays all the time; the issue is that this one is still reachable as far as V8 can see.',
      },
      {
        t: 'The VM’s object list still refers to it, so V8 sees it as reachable',
        correct: true,
        why: 'Every allocated object is linked on the object list, so only the VM can tell which ones Drip code can still use.',
      },
      {
        t: 'Drip lists are stored outside the JavaScript heap',
        why: 'They are ordinary JavaScript objects; the object list is what keeps them alive.',
      },
      {
        t: 'V8 only collects when the program ends',
        why: 'V8 collects while programs run; it just has no reason to free this list.',
      },
    ],
  },
  {
    q: 'Which of these is NOT one of the companion VM’s roots?',
    options: [
      {
        t: 'The value stack, up to `sp`',
        why: 'It is a root: it holds every local and temporary in use.',
      },
      {
        t: 'The open upvalues',
        why: 'They are roots: the VM searches them on every capture.',
      },
      {
        t: 'The interned-string table',
        correct: true,
        why: 'The string table is deliberately not a root (it refers to every string); the next chapter shows how it is handled.',
      },
      {
        t: 'The globals, names and values',
        why: 'They are roots: any global can be read by name at any time.',
      },
    ],
  },
  {
    q: 'An instance A has a field holding instance B, and B has a field holding A. Nothing else refers to either. After a collection?',
    options: [
      {
        t: 'Both survive, because each is referred to',
        why: 'Being referred to only matters if a chain from a root leads there.',
      },
      {
        t: 'Only the older one survives',
        why: 'Age plays no part in reachability.',
      },
      {
        t: 'The collector loops forever',
        why: 'Reachability is defined from the roots; a cycle that no root reaches is simply never visited.',
      },
      {
        t: 'Both are freed',
        correct: true,
        why: 'No chain of references leads to them from a root, so they are garbage.',
      },
    ],
  },
  {
    q: 'A version of `defineNative` keeps the new name string only in a TypeScript variable while it allocates the native. What happens in stress mode?',
    options: [
      {
        t: 'The string is freed by the collection that the native’s allocation runs, and a later collection throws “use after free”',
        correct: true,
        why: 'Nothing the collector can see refers to the string, so it is swept and poisoned; the next time marking reaches it through the globals, reading it throws.',
      },
      {
        t: 'Nothing: TypeScript variables are roots',
        why: 'The collector only sees what `markRoots` and the heap’s own lists show it; a local variable in VM code is invisible.',
      },
      {
        t: 'The program prints the wrong answer silently',
        why: 'Without stress mode it might; poisoning is what turns it into a loud error.',
      },
      {
        t: 'A compile error',
        why: 'This is a bug in the VM, found at run time.',
      },
    ],
  },
  {
    q: 'Why does `markRoots` mark the global names as well as the values?',
    options: [
      {
        t: 'To print them in error messages',
        why: 'Marking is about keeping objects alive, not about messages.',
      },
      {
        t: 'Names are string objects on the heap; if one were freed, the globals table would hold a dead key',
        correct: true,
        why: 'Every heap object the VM still uses must be reachable, keys included.',
      },
      {
        t: 'Because names are numbers',
        why: 'Names are interned string objects.',
      },
      {
        t: 'It does not need to; it is a precaution',
        why: 'Once no running function’s constants mention a name, the globals table is the only thing referring to it, so it must be marked.',
      },
    ],
  },
  {
    q: 'During marking, `blacken` takes an object off the grey stack. What does it do?',
    options: [
      {
        t: 'Frees it',
        why: 'Nothing is freed during marking; freeing is the sweep’s job.',
      },
      {
        t: 'Marks every object it refers to, turning white ones grey',
        correct: true,
        why: 'That is tracing. Afterwards the popped object is black: reached and fully traced.',
      },
      {
        t: 'Resets its mark to white',
        why: 'Sweep resets survivors, after marking is finished.',
      },
      {
        t: 'Pushes it back if it has fields',
        why: 'Each object is traced once; the objects its fields hold are pushed instead.',
      },
    ],
  },
  {
    q: 'A Drip list holds itself: `let a = []; push(a, a);`. What happens when the collector blackens it?',
    options: [
      {
        t: 'Marking loops for ever',
        why: '`markObject` returns at once for an object already marked, so the self-reference stops there.',
      },
      {
        t: 'The list is freed, because a cycle is garbage',
        why: 'It is reachable from the global `a`, so it is live; cycles are only garbage when no root reaches them.',
      },
      {
        t: '`markValue(a)` sees `isMarked` already set and does nothing more',
        correct: true,
        why: 'The early return is what makes cycles, including a list inside itself, safe.',
      },
      {
        t: 'A stack overflow',
        why: 'The grey stack is an array, and the self-reference is never pushed twice.',
      },
    ],
  },
  {
    q: 'Why does the collector call `strings.removeWhite()` between marking and sweeping?',
    options: [
      {
        t: 'To free strings faster than sweep would',
        why: 'Sweep frees them either way; the point is the table’s references.',
      },
      {
        t: 'To mark every interned string as a root',
        why: 'That is exactly what a weak table avoids; otherwise no string would ever die.',
      },
      {
        t: 'Because sweep cannot see strings',
        why: 'Strings are on the object list like every other object.',
      },
      {
        t: 'So the string table never points at a string that sweep frees',
        correct: true,
        why: 'After marking it knows which strings are live; before sweeping it can still drop the rest.',
      },
    ],
  },
  {
    q: 'A collection has just finished with 3 MiB of objects still live. When will the next one start?',
    options: [
      {
        t: 'When `bytesAllocated` passes 6 MiB',
        correct: true,
        why: '`nextGC` is set to twice what survived (at least 1 MiB), so it waits until the heap doubles.',
      },
      {
        t: 'On the next allocation',
        why: 'Only in stress mode. Normally the VM waits for `nextGC`.',
      },
      {
        t: 'After another 1 MiB is allocated',
        why: '1 MiB is only the floor. Here twice the live size is larger.',
      },
      {
        t: 'Never, until the program ends',
        why: 'Collections continue whenever allocation passes the threshold.',
      },
    ],
  },
  {
    q: 'Sweep is walking the object list. `prev` is a kept object and `o` is unmarked. What happens?',
    options: [
      {
        t: '`o` is reset to white and kept',
        why: 'Only marked objects are kept; an unmarked one is garbage.',
      },
      {
        t: '`o` is pushed on the grey stack',
        why: 'Marking is over; sweep never greys anything.',
      },
      {
        t: '`o` steps on to the next object, and `prev.next` is set to it, unlinking the dead one',
        correct: true,
        why: 'With nothing in the VM referring to it any more, V8 can reclaim it.',
      },
      {
        t: 'The whole list is rebuilt',
        why: 'Sweep changes one link per dead object, in a single walk.',
      },
    ],
  },
];
