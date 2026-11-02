// Chapter 158 cards. Keys are stable ids: never rename them.

export const prompts = {
  'why-own-gc': {
    q: 'The VM runs inside JavaScript, which has a garbage collector. Why does the VM need one of its own?',
    a: 'The VM’s object list refers to every object it ever allocated, so V8 sees them all as reachable. Only the VM knows which ones Drip code can still use.',
  },
  'gc-def': {
    q: 'When is an object garbage, for a tracing collector?',
    a: 'When no chain of references leads to it from any root.',
  },
  'cycle': {
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
};

export const exercises = {
  findRoots: {
    title: 'List the roots',
    prompt:
      'A small model of the VM. `vm.stack` is an array and `vm.sp` the number of slots in use; `vm.frames` is an array of `{ closure }`; `vm.open` is an array of open upvalues; `vm.globals` is a `Map` from name objects to values. Objects are plain objects; numbers, booleans and `null` are not objects. Write `roots(vm)`: return an array of every **object** the VM holds directly, in this order: stack slots `0` to `sp - 1`, then each frame’s closure, then each open upvalue, then each global’s name followed by its value.',
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
};

export const quiz = [
  {
    q: 'Why doesn’t V8’s own collector free a Drip list that the program can no longer reach?',
    options: [
      { t: 'V8 never frees arrays', why: 'V8 frees unreachable arrays all the time; the issue is that this one is still reachable as far as V8 can see.' },
      { t: 'The VM’s object list still refers to it, so V8 sees it as reachable', correct: true, why: 'Every allocated object is linked on the object list, so only the VM can tell which ones Drip code can still use.' },
      { t: 'Drip lists are stored outside the JavaScript heap', why: 'They are ordinary JavaScript objects; the object list is what keeps them alive.' },
      { t: 'V8 only collects when the program ends', why: 'V8 collects while programs run; it just has no reason to free this list.' },
    ],
  },
  {
    q: 'Which of these is NOT one of the companion VM’s roots?',
    options: [
      { t: 'The value stack, up to `sp`', why: 'It is a root: it holds every local and temporary in use.' },
      { t: 'The open upvalues', why: 'They are roots: the VM searches them on every capture.' },
      { t: 'The interned-string table', correct: true, why: 'The string table is deliberately not a root (it refers to every string); the next chapter shows how it is handled.' },
      { t: 'The globals, names and values', why: 'They are roots: any global can be read by name at any time.' },
    ],
  },
  {
    q: 'An instance A has a field holding instance B, and B has a field holding A. Nothing else refers to either. After a collection?',
    options: [
      { t: 'Both survive, because each is referred to', why: 'Being referred to only matters if a chain from a root leads there.' },
      { t: 'Only the older one survives', why: 'Age plays no part in reachability.' },
      { t: 'The collector loops forever', why: 'Reachability is defined from the roots; a cycle that no root reaches is simply never visited.' },
      { t: 'Both are freed', correct: true, why: 'No chain of references leads to them from a root, so they are garbage.' },
    ],
  },
  {
    q: 'A version of `defineNative` keeps the new name string only in a TypeScript variable while it allocates the native. What happens in stress mode?',
    options: [
      { t: 'The string is freed by the collection that the native’s allocation runs, and a later collection throws “use after free”', correct: true, why: 'Nothing the collector can see refers to the string, so it is swept and poisoned; the next time marking reaches it through the globals, reading it throws.' },
      { t: 'Nothing: TypeScript variables are roots', why: 'The collector only sees what `markRoots` and the heap’s own lists show it; a local variable in VM code is invisible.' },
      { t: 'The program prints the wrong answer silently', why: 'Without stress mode it might; poisoning is what turns it into a loud error.' },
      { t: 'A compile error', why: 'This is a bug in the VM, found at run time.' },
    ],
  },
  {
    q: 'Why does `markRoots` mark the global names as well as the values?',
    options: [
      { t: 'To print them in error messages', why: 'Marking is about keeping objects alive, not about messages.' },
      { t: 'Names are string objects on the heap; if one were freed, the globals table would hold a dead key', correct: true, why: 'Every heap object the VM still uses must be reachable, keys included.' },
      { t: 'Because names are numbers', why: 'Names are interned string objects.' },
      { t: 'It does not need to; it is a precaution', why: 'Once no running function’s constants mention a name, the globals table is the only thing referring to it, so it must be marked.' },
    ],
  },
];
