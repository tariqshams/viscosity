// Cards for Reference counting: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'rc-what': {
    q: 'What is reference counting?',
    a: 'Each heap object keeps a count of the references to it; the object is freed as soon as the count reaches zero.',
  },
  'rc-up': {
    q: 'In plain reference counting (with no updates optimised away), name three things that increment an object’s count.',
    a: 'Storing a reference to it in a variable, in another object’s field, or passing it as an argument (any new copy of the reference).',
  },
  'rc-down': {
    q: 'What decrements an object’s reference count?',
    a: 'Losing a reference: overwriting a variable or field that held it, or a variable that held it going out of scope.',
  },
  'rc-zero': {
    q: 'When is an object freed under reference counting, compared with a tracing collector?',
    a: 'At once, when its count reaches zero; a tracing collector frees it only at its next collection.',
  },
  'rc-cascade': {
    q: 'Freeing an object whose count reached zero can free other objects. Why?',
    a: 'Freeing it drops the references it held, so each object it pointed to is decremented, and may reach zero too.',
  },
  'rc-getrefcount': {
    q: 'In CPython, why does `sys.getrefcount(x)` print 2 for an object only `x` refers to?',
    a: 'Passing `x` as the argument makes one more, temporary reference.',
  },
  'rc-atomic': {
    q: 'On x86-64, why does copying a C++ `std::shared_ptr` compile to a `lock`-prefixed instruction, and what does Rust offer instead?',
    a: 'Its count may be shared by threads, so updates must be atomic. Rust has `Arc` (atomic) for threads and `Rc` (plain, cheaper) for one thread.',
  },
  'rc-order': {
    q: 'When a reference is overwritten, why increment the new value before decrementing the old one?',
    a: 'If they are the same object (`x = x`), decrementing first could reach zero and free it before the increment.',
  },
  'rc-vs-trace': {
    q: 'Name one cost of reference counting that a tracing collector does not have.',
    a: 'A memory write on every copy of a pointer (atomic if threads share it); also, cycles are never freed by counting alone.',
  },
};

export const examples = {
  assign: {
    title: 'Increment first, then decrement',
    code: `const rc = new Map();
const vars = {};
function inc(o) {
  if (!o) return;
  rc.set(o, (rc.get(o) ?? 0) + 1);
}
function dec(o) {
  if (!o) return;
  rc.set(o, rc.get(o) - 1);
  if (rc.get(o) === 0) {
    console.log('free', o);
  }
}
function set(name, obj) {
  inc(obj);        // new value first
  dec(vars[name]); // then the old
  vars[name] = obj;
}
set('a', 'A');
set('b', 'A');
set('a', null);
console.log('A count:', rc.get('A'));
set('b', null);
set('c', 'C');
set('c', vars.c);
console.log('C count:', rc.get('C'));`,
  },
};

export const exercises = {
  'rc-dec': {
    title: 'Decrement, and free what dies',
    prompt: 'Objects are `{ name, rc, refs }`, where `refs` is the array of objects this one points to (each of those references is counted in that object’s `rc`). `inc` is given. Write `dec(o)`: if `o.rc` is already 0, throw an `Error` with the message `double free: ` and the name; otherwise decrement it, and if it reaches 0, free `o`: push `o.name` onto `freed`, then `dec` every object in `o.refs`, in order, and empty `o.refs`.',
    starter: `const freed = [];
function inc(o) {
  o.rc++;
}
function dec(o) {
  o.rc--;
}`,
    solution: `const freed = [];
function inc(o) {
  o.rc++;
}
function dec(o) {
  if (o.rc === 0) {
    throw new Error('double free: '
      + o.name);
  }
  o.rc--;
  if (o.rc > 0) return;
  freed.push(o.name);
  for (const r of o.refs) dec(r);
  o.refs = [];
}`,
    tests: `const mk = (name, refs = []) => {
  refs.forEach(inc);
  return { name, rc: 0, refs };
};
const fresh = () => { freed.length = 0; };
test('the last reference frees it', () => {
  fresh();
  const a = mk('a');
  inc(a);
  dec(a);
  expect(freed).toEqual(['a']);
});
test('still referenced: not freed', () => {
  fresh();
  const a = mk('a');
  inc(a); inc(a);
  dec(a);
  expect(freed).toEqual([]);
  expect(a.rc).toBe(1);
});
test('a live object keeps its children', () => {
  fresh();
  const c = mk('c');
  const a = mk('a', [c]);
  inc(a); inc(a);
  dec(a);
  expect(freed).toEqual([]);
  expect(c.rc).toBe(1);
});
test('freeing cascades down a chain', () => {
  fresh();
  const c = mk('c');
  const b = mk('b', [c]);
  const a = mk('a', [b]);
  inc(a);
  dec(a);
  expect(freed).toEqual(['a', 'b', 'c']);
});
test('a shared object waits for both', () => {
  fresh();
  const c = mk('c');
  const a = mk('a', [c]);
  const b = mk('b', [c]);
  inc(a); inc(b);
  dec(a);
  expect(freed).toEqual(['a']);
  expect(c.rc).toBe(1);
  dec(b);
  expect(freed).toEqual(['a', 'b', 'c']);
});
test('children in order, depth first', () => {
  fresh();
  const z = mk('z');
  const x = mk('x', [z]);
  const y = mk('y');
  const root = mk('root', [x, y]);
  inc(root);
  dec(root);
  expect(freed).toEqual(['root', 'x', 'z', 'y']);
});
test('a double free is caught', () => {
  fresh();
  const a = mk('a');
  inc(a);
  dec(a);
  let msg = 'no error';
  try { dec(a); } catch (e) { msg = e.message; }
  expect(msg).toBe('double free: a');
});`,
    hints: [
      'There are three cases: the count is already 0 (an error), the count stays above 0 after decrementing (nothing else to do), or it reaches 0 (free the object).',
      'Check for 0 *before* decrementing, and return early when the count is still positive afterwards.',
      'To free: `freed.push(o.name)`, then `for (const r of o.refs) dec(r);` (the recursion is the cascade), then `o.refs = [];`.',
    ],
    walkthrough: `**How to think about it.** \`dec\` is the half of reference counting that does the interesting work. Most of the time it only subtracts one. When it brings a count to zero, the object is garbage, and so is its *ownership* of the objects it points to: every reference it holds disappears with it, and each of those is just another decrement, which is a recursive call to \`dec\`. That recursion is the cascade you stepped through, where freeing A freed B. The double-free check is the guard every real implementation has in some form (often only in debug builds): a count going below zero means some reference was released twice, which is a bug somewhere else.

**The solution, line by line.**

- \`if (o.rc === 0) { throw new Error('double free: ' + o.name); }\` (four lines): an object with no references cannot lose another; report it with the name, as the test expects.
- \`o.rc--;\` one reference fewer.
- \`if (o.rc > 0) return;\` someone else still points at it, as with the shared \`c\` after \`dec(a)\`, so nothing more happens.
- \`freed.push(o.name);\` the count reached zero: record the free (a real runtime would hand the memory back to the allocator here).
- \`for (const r of o.refs) dec(r);\` every reference the dead object held is released, in order, and each \`dec\` may free its target and continue the cascade. That is why the tree test gives \`root, x, z, y\`: freeing \`x\` frees \`z\` before the loop moves on to \`y\`, a depth-first order.
- \`o.refs = [];\` the dead object holds nothing any more, so nothing can release those references a second time.

**Common wrong attempts.**

- Decrementing without freeing the children: \`a\` is freed but \`b\` and \`c\` keep a count of 1 forever, a leak.
- Decrementing the children every time \`dec\` is called, not only when the count reaches zero: then the shared \`c\` loses a reference that \`a\` still holds, and is freed too early.
- No check for zero: a second \`dec\` drives the count to \`-1\` silently.`,
    wrong: [
      {
        code: `const freed = [];
function inc(o) {
  o.rc++;
}
function dec(o) {
  if (o.rc === 0) {
    throw new Error('double free: '
      + o.name);
  }
  o.rc--;
  if (o.rc === 0) freed.push(o.name);
}`,
        why: 'There is no cascade: the objects the freed one pointed to keep their counts and are never freed.',
      },
      {
        code: `const freed = [];
function inc(o) {
  o.rc++;
}
function dec(o) {
  if (o.rc === 0) {
    throw new Error('double free: '
      + o.name);
  }
  o.rc--;
  if (o.rc === 0) freed.push(o.name);
  for (const r of o.refs) dec(r);
}`,
        why: 'It releases the children on every decrement, even while the object is still alive, so shared objects are freed too early.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Under reference counting, after `let a = obj; let b = a; a = null;`, what is `obj`’s count (counting only these variables)?',
    options: [
      {
        t: '0, so it is freed',
        why: '`b` still refers to it.',
      },
      {
        t: '1',
        correct: true,
        why: 'Two references were made (a, b) and one was lost (a = null).',
      },
      {
        t: '2',
        why: '`a = null` dropped one of the two.',
      },
    ],
  },
  {
    q: 'Under reference counting, an object holding the only references to a 1000-node tree has its count reach zero. What happens?',
    options: [
      {
        t: 'Only that object is freed; the tree waits for the next collection',
        why: 'Freeing it decrements what it points to, and so on down the tree.',
      },
      {
        t: 'Nothing, until the program ends',
        why: 'Reference counting frees at once.',
      },
      {
        t: 'The tree is copied elsewhere',
        why: 'Nothing is copied; things are freed.',
      },
      {
        t: 'It is freed, and the decrements cascade, freeing all 1000 nodes then and there',
        correct: true,
        why: 'That is reference counting’s promptness, and also why a single assignment can take a while.',
      },
    ],
  },
  {
    q: 'Why does CPython’s `sys.getrefcount(x)` report one more than the references you can see?',
    options: [
      {
        t: 'CPython counts every object twice',
        why: 'It does not; the extra one is temporary.',
      },
      {
        t: 'The argument passed to `getrefcount` is itself a reference',
        correct: true,
        why: 'The Python documentation says the count includes that temporary reference.',
      },
      {
        t: 'The garbage collector holds one',
        why: 'The extra reference is the call’s own argument.',
      },
    ],
  },
  {
    q: 'On x86-64, why does copying a C++ `std::shared_ptr` compile to `lock incl`?',
    options: [
      {
        t: 'The count may be updated by several threads, so the increment must be atomic',
        correct: true,
        why: 'Atomic updates cost more than plain ones; Rust’s `Rc` avoids them by staying on one thread.',
      },
      {
        t: '`lock` makes the increment faster',
        why: 'It makes it safe across threads, at a cost.',
      },
      {
        t: 'To stop the object being freed while it is copied',
        why: 'The increment itself does that; `lock` is about other threads seeing a correct count.',
      },
    ],
  },
  {
    q: 'Under reference counting, a compiler stores a new value in a variable. In which order should it update the counts, and why?',
    options: [
      {
        t: 'Decrement the old value first, to free memory as early as possible',
        why: 'For `x = x`, that could free the object before the increment saves it.',
      },
      {
        t: 'The order does not matter',
        why: 'It matters when the old and new values are the same object.',
      },
      {
        t: 'Neither: assignments never change counts',
        why: 'Overwriting a reference loses one and gains one.',
      },
      {
        t: 'Increment the new value first, then decrement the old one',
        correct: true,
        why: 'Then `x = x` goes 1 → 2 → 1 and the object survives.',
      },
    ],
  },
];
