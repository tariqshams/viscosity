// Chapter 271 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'wr-what': {
    q: 'What is a **weak reference**?',
    a: 'A reference that does not keep its target alive: the collector does not trace through it.',
  },
  'wr-clear': {
    q: 'When does a collector clear a weak reference?',
    a: 'After marking, before the memory is reused, if its target was not marked.',
  },
  'wr-job': {
    q: 'You create a `WeakRef`, drop the only strong reference, and call `deref()` in the same job. What do you get?',
    a: 'The target: it is kept alive until the current job (and its promise reactions) ends.',
  },
  'fin-what': {
    q: 'What is **finalisation**?',
    a: 'Running code after the collector finds an object dead, usually to release something the collector does not manage.',
  },
  'fin-never': {
    q: 'Name three things a `FinalizationRegistry` callback does not promise.',
    a: 'To run soon after collection, to run in the order objects died, and to run at all.',
  },
  'fin-registry': {
    q: 'Why might a `FinalizationRegistry` callback never run, even after its target is collected?',
    a: 'The registry itself may have been garbage-collected; a registry is not kept alive by the objects registered with it.',
  },
  'fin-resurrect': {
    q: 'What is **resurrection**, and why does Go\'s `AddCleanup` avoid it?',
    a: 'A finaliser storing the dying object somewhere, making it reachable again; `AddCleanup` passes a separate value, not the object.',
  },
  'ds-what': {
    q: 'Name the main choices in the **collector design space**.',
    a: 'Generational or not; moving (copying or sliding) or not; stopped, incremental or concurrent; and which barriers on stores and loads.',
  },
  'ds-go': {
    q: 'Which of these does Go\'s collector do: generations, moving objects, concurrent marking?',
    a: 'Only concurrent marking: it is non-generational and non-compacting, with a hybrid write barrier.',
  },
};

export const examples = {
  sameJob: {
    title: 'A WeakRef in the same job',
    code: `let big = { name: 'big' };
const ref = new WeakRef(big);
big = null; // no strong reference left
// same job: the target is kept for now
console.log(ref.deref()?.name);`,
  },
};

export const exercises = {
  weakGc: {
    title: 'Weak references and finalisers in a toy collector',
    prompt: `The heap \`h\` is an array of objects \`{ refs, weak, fin }\`: \`refs\` and \`weak\` hold addresses or \`null\`, and \`fin\` is a finaliser name (a string) or \`null\`. \`roots\` is an array of addresses.

Write \`collect(h, roots)\`: mark from the roots through \`refs\` only (never through \`weak\`); then, in every **marked** object, set each \`weak\` slot whose target is unmarked to \`null\`; then list the \`fin\` names of the **unmarked** objects that have one, in address order. Return \`{ live, run }\`, where \`live\` is the sorted marked addresses and \`run\` the finaliser names.`,
    starter: `function collect(h, roots) {
  const marked = new Set(roots);
  return { live: [...marked], run: [] };
}`,
    solution: `function collect(h, roots) {
  const marked = new Set();
  const work = [...roots];
  while (work.length > 0) {
    const p = work.pop();
    if (p === null || marked.has(p)) {
      continue;
    }
    marked.add(p);
    work.push(...h[p].refs);
  }
  for (const p of marked) {
    const w = h[p].weak;
    for (let i = 0; i < w.length; i++) {
      if (w[i] === null) continue;
      if (marked.has(w[i])) continue;
      w[i] = null;
    }
  }
  const run = [];
  h.forEach((o, i) => {
    if (marked.has(i) || !o.fin) return;
    run.push(o.fin);
  });
  const live = [...marked]
    .sort((a, b) => a - b);
  return { live, run };
}`,
    tests: `const mk = () => [
  { refs: [1], weak: [2], fin: null },
  { refs: [], weak: [], fin: 'one' },
  { refs: [], weak: [0], fin: 'two' },
  { refs: [2], weak: [], fin: 'three' },
];
test('weak refs keep nothing alive', () => {
  expect(collect(mk(), [0]).live)
    .toEqual([0, 1]);
});
test('a dead target is cleared', () => {
  const h = mk();
  collect(h, [0]);
  expect(h[0].weak).toEqual([null]);
});
test('a live target is kept', () => {
  const h = mk();
  const r = collect(h, [0, 2]);
  expect(r.live).toEqual([0, 1, 2]);
  expect(h[0].weak).toEqual([2]);
});
test('dead objects are finalised', () => {
  expect(collect(mk(), [0]).run)
    .toEqual(['two', 'three']);
});
test('live objects are not', () => {
  expect(collect(mk(), [0, 2]).run)
    .toEqual(['three']);
});`,
    hints: [
      'Do it in three steps, in this order: mark, clear, collect finalisers. The marking is the grey-list loop you know; just never look at `weak` while marking.',
      'Clearing: for each marked address `p`, walk `h[p].weak` and set a slot to `null` if it holds an address that is not in `marked`.',
      'Finalisers: walk the whole heap with its index (`h.forEach((o, i) => ...)`) and collect `o.fin` for every index not in `marked` whose `fin` is not `null`. Sort `live` with `(a, b) => a - b`.',
    ],
    walkthrough: `**How to think about it.** Weak references and finalisers both hang off the same moment: the end of marking, when the collector knows exactly which objects are live. Before that moment nothing can be decided, so the marking must ignore weak slots completely (otherwise they would keep their targets alive, which is the opposite of weak). After it, two jobs: clear every weak slot that points at the dead, so the program can never read a freed object through one; and collect the finalisers of the dead, to be run later.

**The solution, line by line.**

- \`const marked = new Set(); const work = [...roots];\` start an ordinary mark with a work list.
- \`while (work.length > 0) { const p = work.pop(); ...\` takes the next address.
- \`if (p === null || marked.has(p)) { continue; }\` skips empty fields and anything already marked, which also ends cycles.
- \`marked.add(p); work.push(...h[p].refs);\` marks it and queues its **strong** refs only. Not touching \`h[p].weak\` here is the whole meaning of "weak".
- \`for (const p of marked) { const w = h[p].weak; ... }\` visits the weak slots of live objects. (Dead objects' weak slots do not matter: nobody can read them.)
- \`if (w[i] === null) continue;\`, \`if (marked.has(w[i])) continue;\` and \`w[i] = null;\` clear a slot whose target died, and leave a live target alone.
- \`h.forEach((o, i) => { if (marked.has(i) || !o.fin) return; run.push(o.fin); });\` lists the finalisers of dead objects in address order. A real runtime would queue these and run them later, outside the collector, which is where all the "later, in any order, maybe never" behaviour comes from.
- \`const live = [...marked].sort((a, b) => a - b); return { live, run };\` returns the result.

In the test heap, object 2 is held strongly only by object 3, which is garbage, and weakly by the root 0. So 2 dies, the root's weak slot is cleared, and both 2's and 3's finalisers are listed. Make 2 a root and it lives: the weak slot keeps its value and only 3 is finalised.

**Common wrong attempts.**

- Following \`weak\` while marking: then weak references are strong, and nothing they point at can ever die.
- Clearing every weak slot: live targets lose their references for no reason.
- Running finalisers for live objects, or before marking has finished: a finaliser must only ever see an object that is truly unreachable.`,
    wrong: [
      {
        code: `function collect(h, roots) {
  const marked = new Set();
  const work = [...roots];
  while (work.length > 0) {
    const p = work.pop();
    if (p === null || marked.has(p)) {
      continue;
    }
    marked.add(p);
    work.push(...h[p].refs);
    work.push(...h[p].weak);
  }
  const run = [];
  h.forEach((o, i) => {
    if (marked.has(i) || !o.fin) return;
    run.push(o.fin);
  });
  const live = [...marked]
    .sort((a, b) => a - b);
  return { live, run };
}`,
        why: 'It follows the weak slots while marking, so weakly held objects are kept alive: they are strong references in all but name.',
      },
      {
        code: `function collect(h, roots) {
  const marked = new Set();
  const work = [...roots];
  while (work.length > 0) {
    const p = work.pop();
    if (p === null || marked.has(p)) {
      continue;
    }
    marked.add(p);
    work.push(...h[p].refs);
  }
  for (const p of marked) {
    h[p].weak.fill(null);
  }
  const run = [];
  h.forEach((o, i) => {
    if (marked.has(i) || !o.fin) return;
    run.push(o.fin);
  });
  const live = [...marked]
    .sort((a, b) => a - b);
  return { live, run };
}`,
        why: 'It clears every weak slot, including those whose targets are still alive.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'During marking, how does the collector treat a weak reference?',
    options: [
      {
        t: 'It does not follow it',
        correct: true,
        why: 'Weak references keep nothing alive; they are only cleared or kept afterwards.',
      },
      {
        t: 'It follows it, like any other reference',
        why: 'Then it would be strong.',
      },
      {
        t: 'It clears it at once',
        why: 'Clearing happens after marking, and only if the target was not marked.',
      },
    ],
  },
  {
    q: 'In this chapter\'s Node run, the `FinalizationRegistry` callback never printed, although the target was collected. What fixed it?',
    options: [
      {
        t: 'Calling `gc()` twice',
        why: 'The fix was about the registry, not the number of collections.',
      },
      {
        t: 'Registering the object twice',
        why: 'That changes nothing if the registry itself dies.',
      },
      {
        t: 'Keeping the registry reachable (`globalThis.keepReg = reg`)',
        correct: true,
        why: 'A registry that is itself garbage may never run its callbacks.',
      },
    ],
  },
  {
    q: 'Why does Java\'s `Object.finalize` now carry `@Deprecated(since="9", forRemoval=true)`?',
    options: [
      {
        t: 'Finalisers run too quickly',
        why: 'Timing is one problem, but not in that direction.',
      },
      {
        t: 'Finalisation causes problems with security, performance and reliability; Cleaner and try-with-resources are safer',
        correct: true,
        why: 'That is the reason the Javadoc gives.',
      },
      {
        t: 'Java no longer has a garbage collector',
        why: 'It has several.',
      },
    ],
  },
  {
    q: 'Which collector in this chapter is non-generational and never moves heap objects?',
    options: [
      {
        t: 'Go\'s',
        correct: true,
        why: 'mgc.go: "non-generational and non-compacting", a concurrent mark-sweep.',
      },
      {
        t: 'V8\'s',
        why: 'V8 is generational and copies its young generation.',
      },
      {
        t: 'ZGC',
        why: 'ZGC relocates objects concurrently, and is generational in Java 21 with a flag.',
      },
    ],
  },
  {
    q: 'ZGC\'s pauses were well under a millisecond and G1\'s young pauses several milliseconds on the same program. What does ZGC pay instead?',
    options: [
      {
        t: 'It never frees memory',
        why: 'It frees memory concurrently.',
      },
      {
        t: 'It needs twice as many collections',
        why: 'That is not the trade the chapter describes.',
      },
      {
        t: 'A load barrier on every pointer read from the heap',
        correct: true,
        why: 'Concurrent relocation needs the read barrier of the previous chapter.',
      },
    ],
  },
];
