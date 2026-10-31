// Chapter 87 cards. Keys are stable ids: never rename them.

export const prompts = {
  'pass-what': {
    q: 'What is a compiler pass?',
    a: 'One analysis or one transformation over the IR.',
  },
  'pass-kinds': {
    q: 'What is the difference between an analysis pass and a transformation pass?',
    a: 'An analysis reads the IR and produces facts (like a dominator tree). A transformation changes the IR (like dead code elimination).',
  },
  'visc-fixed': {
    q: 'Does Viscosity have a pass manager today? What does it run instead?',
    a: 'No. It runs one fixed pipeline: lower → analyze → plan → emit.',
  },
  'memo-safe': {
    q: 'Viscosity’s `info(f)` caches dominators and loops and never clears the cache. Why is that safe?',
    a: 'Nothing changes the IR while `analyze` runs, so a result computed once stays correct.',
  },
  'stale-danger': {
    q: 'A pass changes the CFG but the cached dominator tree is kept. What can go wrong?',
    a: 'Later passes read a stale tree and make decisions on facts that are no longer true, which can miscompile the program.',
  },
  'pm-what': {
    q: 'What is a pass manager?',
    a: 'The scheduler that runs passes in order and gives them analyses, computing each at most once while it stays valid.',
  },
  'inval-what': {
    q: 'What is analysis invalidation?',
    a: 'Throwing away cached analysis results after a transformation that may have made them wrong.',
  },
  'preserved-cfg': {
    q: 'Constant propagation rewrites instructions but no blocks or edges. Which analyses can it report as preserved?',
    a: 'The CFG analyses, such as dominators and loops, which depend only on blocks and edges.',
  },
  'deps-order': {
    q: 'How does asking for analyses through the manager fix their order?',
    a: 'An analysis that needs another asks for it, so the needed one is computed first, automatically.',
  },
};

export const exercises = {
  makePM: {
    title: 'A mini pass manager',
    prompt:
      'Write `makePM(analyses)`. `analyses` maps names to functions `(ir, get) => result`. Return `{ get, run }`. `get(name, ir)` returns the cached result for `name`, computing it with `analyses[name](ir, get)` only if it isn’t cached. `run(pass, ir)` calls `pass(ir, get)`, which returns either `\'all\'` or an array of preserved names; then drop every cached result that wasn’t preserved.',
    starter: `function makePM(analyses) {
  const get = (name, ir) =>
    analyses[name](ir, get);
  const run = (pass, ir) => {
    pass(ir, get);
  };
  return { get, run };
}`,
    solution: `function makePM(analyses) {
  const cache = new Map();
  const get = (name, ir) => {
    if (!cache.has(name)) {
      const r = analyses[name](ir, get);
      cache.set(name, r);
    }
    return cache.get(name);
  };
  const run = (pass, ir) => {
    const keep = pass(ir, get);
    if (keep === 'all') return;
    for (const k of [...cache.keys()]) {
      if (!keep.includes(k)) {
        cache.delete(k);
      }
    }
  };
  return { get, run };
}`,
    tests: `function setup() {
  const n = { uses: 0, dom: 0 };
  const pm = makePM({
    uses: () => { n.uses++; return 'U'; },
    dom: () => { n.dom++; return 'D'; },
  });
  return { n, pm };
}
test('computes once, then hits', () => {
  const { n, pm } = setup();
  expect(pm.get('uses', 'ir')).toBe('U');
  expect(pm.get('uses', 'ir')).toBe('U');
  expect(n.uses).toBe(1);
});
test('preserving nothing drops all', () => {
  const { n, pm } = setup();
  pm.get('uses', 'ir'); pm.get('dom', 'ir');
  pm.run(() => [], 'ir');
  pm.get('uses', 'ir'); pm.get('dom', 'ir');
  expect([n.uses, n.dom]).toEqual([2, 2]);
});
test('a preserved analysis stays', () => {
  const { n, pm } = setup();
  pm.get('uses', 'ir'); pm.get('dom', 'ir');
  pm.run(() => ['dom'], 'ir');
  pm.get('uses', 'ir'); pm.get('dom', 'ir');
  expect([n.uses, n.dom]).toEqual([2, 1]);
});
test("'all' keeps everything", () => {
  const { n, pm } = setup();
  pm.get('uses', 'ir');
  pm.run(() => 'all', 'ir');
  pm.get('uses', 'ir');
  expect(n.uses).toBe(1);
});
test('passes and analyses can ask', () => {
  let loops = 0;
  const pm = makePM({
    dom: () => 'D',
    loops: (ir, get) => { loops++; return get('dom', ir) + 'L'; },
  });
  let seen = null;
  pm.run((ir, get) => { seen = get('loops', ir); return 'all'; }, 'ir');
  expect(seen).toBe('DL');
  pm.get('loops', 'ir');
  expect(loops).toBe(1);
});`,
    hints: [
      'Keep a `Map` from analysis name to result. In `get`, compute and store only when the name is missing.',
      'Pass `get` itself to each analysis and each pass, so they can ask for other analyses.',
      'In `run`, if the pass returned `\'all\'`, stop. Otherwise delete every cached key that is not in the returned array. (Copy the keys first, then delete.)',
    ],
    walkthrough: `This is the core of LLVM’s analysis manager in twenty lines.

- **The cache.** \`get\` is a memo: the first call for a name computes it, later calls return the stored result. That turns “every pass computes its own dominator tree” into “the tree is computed once”.
- **\`get\` is passed along.** Analyses and passes receive \`get\`, so an analysis that needs another (loops need dominators) just asks for it. That is what makes the order automatic: whatever is needed is computed first.
- **Passes report, the manager forgets.** Only the pass knows what it changed, so it returns what it preserved. The manager deletes everything else. \`'all'\` is the common, cheap case: an analysis pass, or a transformation that changed nothing.
- **Copy before deleting.** \`[...cache.keys()]\` takes a snapshot, so deleting entries doesn’t disturb the loop.

What it doesn’t do: keep one cache per function, or notice that \`loops\` was built from a \`dom\` that has just been dropped. The extra exercise adds the second.`,
    wrong: [
      {
        code: `function makePM(analyses) {
  const cache = new Map();
  const get = (name, ir) => {
    if (!cache.has(name)) {
      const r = analyses[name](ir, get);
      cache.set(name, r);
    }
    return cache.get(name);
  };
  const run = (pass, ir) => {
    pass(ir, get);
  };
  return { get, run };
}`,
        why: 'It caches but never invalidates. After a pass that changed the IR, `get` keeps returning stale results.',
      },
      {
        code: `function makePM(analyses) {
  const cache = new Map();
  const get = (name, ir) => {
    if (!cache.has(name)) {
      const r = analyses[name](ir, get);
      cache.set(name, r);
    }
    return cache.get(name);
  };
  const run = (pass, ir) => {
    pass(ir, get);
    cache.clear();
  };
  return { get, run };
}`,
        why: 'Clearing everything after every pass is always correct but throws away what passes preserved, so nothing is reused across passes. Use the returned list.',
      },
    ],
  },
  makePMDeps: {
    optional: true,
    title: 'Invalidate what depends on it',
    prompt:
      'Extend the pass manager: while an analysis is being computed, record which analyses it asked for. After a pass, a cached result survives only if it was preserved **and** everything it asked for survived too. (Preserving `loops` but not `dom` must drop `loops`, since it was built from `dom`.) `\'all\'` still keeps everything.',
    starter: `function makePM(analyses) {
  const cache = new Map();
  const get = (name, ir) => {
    if (!cache.has(name)) {
      const r = analyses[name](ir, get);
      cache.set(name, r);
    }
    return cache.get(name);
  };
  const run = (pass, ir) => {
    const keep = pass(ir, get);
    if (keep === 'all') return;
    for (const k of [...cache.keys()]) {
      if (!keep.includes(k)) {
        cache.delete(k);
      }
    }
  };
  return { get, run };
}`,
    solution: `function makePM(analyses) {
  const cache = new Map();
  const deps = new Map();
  const stack = [];
  const get = (name, ir) => {
    const top = stack[stack.length - 1];
    if (top) deps.get(top).add(name);
    if (!cache.has(name)) {
      deps.set(name, new Set());
      stack.push(name);
      const r = analyses[name](ir, get);
      stack.pop();
      cache.set(name, r);
    }
    return cache.get(name);
  };
  const ok = (k, keep) =>
    keep.includes(k) &&
    [...deps.get(k)].every((d) =>
      ok(d, keep));
  const run = (pass, ir) => {
    const keep = pass(ir, get);
    if (keep === 'all') return;
    for (const k of [...cache.keys()]) {
      if (!ok(k, keep)) cache.delete(k);
    }
  };
  return { get, run };
}`,
    tests: `function setup() {
  const n = { dom: 0, loops: 0, uses: 0 };
  const pm = makePM({
    dom: () => { n.dom++; return 'D'; },
    loops: (ir, get) => { n.loops++; return get('dom', ir) + 'L'; },
    uses: () => { n.uses++; return 'U'; },
  });
  return { n, pm };
}
test('loops falls when dom falls', () => {
  const { n, pm } = setup();
  pm.get('loops', 'ir');
  pm.run(() => ['loops'], 'ir');
  pm.get('loops', 'ir');
  expect([n.dom, n.loops]).toEqual([2, 2]);
});
test('both preserved: both stay', () => {
  const { n, pm } = setup();
  pm.get('loops', 'ir');
  pm.run(() => ['loops', 'dom'], 'ir');
  pm.get('loops', 'ir');
  expect([n.dom, n.loops]).toEqual([1, 1]);
});
test('unrelated analyses are unaffected', () => {
  const { n, pm } = setup();
  pm.get('uses', 'ir'); pm.get('loops', 'ir');
  pm.run(() => ['uses'], 'ir');
  pm.get('uses', 'ir');
  expect(n.uses).toBe(1);
});
test('a cached hit still records the dependency', () => {
  const { n, pm } = setup();
  pm.get('dom', 'ir');
  pm.get('loops', 'ir');
  pm.run(() => ['loops'], 'ir');
  pm.get('loops', 'ir');
  expect(n.loops).toBe(2);
});`,
    hints: [
      'Keep a stack of the analyses currently being computed. When `get` is called while the stack is non-empty, the top of the stack depends on the requested name.',
      'Record the dependency even when the requested name is already cached: `loops` still used `dom`.',
      'An entry survives if it is in `keep` and all its dependencies survive. That check is naturally recursive.',
    ],
    walkthrough: `Analyses are built from other analyses, so invalidation has to follow those edges.

- **Who is asking?** Analyses call \`get\` while they are being computed. A stack of “currently computing” names tells you, at any \`get\`, which analysis is doing the asking. Push before computing, pop after.
- **Record hits too.** If \`dom\` was cached before \`loops\` was computed, \`loops\` still read it. The dependency is about what a result was built from, not about who computed what.
- **Survival is recursive.** \`loops\` is valid only if it was preserved and \`dom\` is valid. Dependencies form a DAG (an analysis can’t depend on itself), so the recursion ends.

In LLVM, an analysis result can implement its own \`invalidate()\` method. That is where it checks its dependencies, as you just did, and where it can also declare that it survives changes it doesn’t care about.`,
    wrong: [
      {
        code: `function makePM(analyses) {
  const cache = new Map();
  const deps = new Map();
  let cur = null;
  const get = (name, ir) => {
    if (!cache.has(name)) {
      if (cur) deps.get(cur).add(name);
      deps.set(name, new Set());
      const prev = cur;
      cur = name;
      cache.set(name,
        analyses[name](ir, get));
      cur = prev;
    }
    return cache.get(name);
  };
  const ok = (k, keep) =>
    keep.includes(k) &&
    [...deps.get(k)].every((d) =>
      ok(d, keep));
  const run = (pass, ir) => {
    const keep = pass(ir, get);
    if (keep === 'all') return;
    for (const k of [...cache.keys()]) {
      if (!ok(k, keep)) cache.delete(k);
    }
  };
  return { get, run };
}`,
        why: 'It only records a dependency on a cache miss. If `dom` was already cached when `loops` was computed, the edge is never recorded, and `loops` survives a dropped `dom`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Which of these is an analysis pass rather than a transformation pass?',
    options: [
      { t: 'Dead code elimination', why: 'It deletes instructions, so it changes the IR.' },
      { t: 'Inlining', why: 'It replaces calls with bodies: a transformation.' },
      { t: 'Computing the dominator tree', correct: true, why: 'It only reads the CFG and produces facts for other passes.' },
      { t: 'Constant propagation', why: 'It rewrites uses of variables into constants: a transformation.' },
    ],
  },
  {
    q: 'A pass deletes an unreachable block. What should it report to the pass manager?',
    options: [
      { t: '`all()`: deleting dead code changes nothing important', why: 'The CFG changed, so dominators and loops computed before may now be wrong.' },
      { t: 'Nothing preserved (or only what it updated itself), so the CFG analyses are invalidated', correct: true, why: 'The CFG changed. Unless the pass kept an analysis up to date itself, the safe answer is that it is no longer valid.' },
      { t: 'Only the CFG analyses preserved', why: 'Those are exactly the ones a block deletion can break.' },
      { t: 'It doesn’t need to report anything', why: 'Only the pass knows what it changed; the manager relies on its report.' },
    ],
  },
  {
    q: 'Why is Viscosity’s never-cleared `info(f)` cache correct today?',
    options: [
      { t: 'Dominators never change', why: 'They change whenever the CFG changes. It is just that nothing changes the CFG here.' },
      { t: 'It recomputes on every call anyway', why: 'It doesn’t: it stores the first result in a Map.' },
      { t: 'JavaScript Maps clear themselves', why: 'They don’t.' },
      { t: 'Nothing changes the IR while `analyze` runs, so every cached result stays valid', correct: true, why: 'Add a transformation in the middle and the same cache would hand out stale facts.' },
    ],
  },
  {
    q: 'What is the honest description of Viscosity’s pipeline?',
    options: [
      { t: 'A fixed sequence, lower → analyze → plan → emit, with no general pass manager', correct: true, why: 'That is `compile` in `packages/core/src/index.ts`: four calls in a row.' },
      { t: 'An LLVM-style pass manager with cached analyses', why: 'That is the design sketched in this chapter, not the code that exists.' },
      { t: 'It reruns every analysis until a fixpoint', why: 'Numeric inference iterates internally, but the pipeline itself runs once.' },
      { t: 'It has no analyses, only a parser', why: '`analyze` runs numeric inference, escape checks, bounds and more.' },
    ],
  },
  {
    q: 'In a pass manager, why do analyses request other analyses through `get` instead of calling them directly?',
    options: [
      { t: 'It is faster to type', why: 'The benefit is caching and ordering, not brevity.' },
      { t: 'Direct calls aren’t allowed in JavaScript', why: 'They are; they just bypass the cache.' },
      { t: 'So results are shared through the cache, and whatever is needed is computed first, automatically', correct: true, why: 'Order falls out of the dependencies, and nothing is computed twice while valid.' },
      { t: 'So that analyses can change the IR', why: 'Analyses must not change the IR; that is what transformation passes are for.' },
    ],
  },
  {
    q: 'In the diagram, four passes asked for analyses eight times in total, yet only six were computed. Why not fewer?',
    options: [
      { t: 'The cache was too small', why: 'Size wasn’t the issue; validity was.' },
      { t: 'Transformations invalidated some results, so they had to be recomputed for the new IR', correct: true, why: 'Caching saves work only while results stay valid. After a change, correctness wins.' },
      { t: 'The manager recomputes every analysis twice to be safe', why: 'It recomputes only on a miss.' },
      { t: 'layout ran first', why: 'layout ran last, and got two hits.' },
    ],
  },
];
