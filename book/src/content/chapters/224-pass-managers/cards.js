// Chapter 224 cards. Keys are stable ids: never rename them.

export const prompts = {
  'pass-what': {
    q: 'What is a compiler pass?',
    a: 'One analysis or one transformation over the IR.',
  },
  'pass-kinds': {
    q: 'What is the difference between an analysis pass and a transformation pass?',
    a: 'An analysis reads the IR and produces facts (like a dominator tree). A transformation changes the IR (like dead code elimination).',
  },
  'order-matters': {
    q: 'Why can running constant propagation before dead code elimination give a better result than the other way round?',
    a: 'Constant propagation can make a branch condition constant, which makes an arm dead; dead code elimination can only delete it if it runs afterwards.',
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
  'visc-fixed': {
    q: 'Does Viscosity have a pass manager today? What does it run instead?',
    a: 'No. It runs one fixed pipeline: lower → analyze → plan → emit.',
  },
  'memo-safe': {
    q: 'Viscosity’s `info(f)` caches dominators and loops and never clears the cache. Why is that safe today, and when would it stop being safe?',
    a: 'Nothing changes the IR while `analyze` runs; a transformation between two stages would make the cached results stale.',
  },
};

export const examples = {
  cache: {
    title: 'A cache, then an invalidation',
    code: `let computed = 0;
const cache = new Map();
function get(name) {
  if (!cache.has(name)) {
    computed++;
    cache.set(name, name + ' result');
  }
  return cache.get(name);
}

get('dom'); get('dom'); get('loops');
console.log('computed', computed);

// A pass deleted a block: the CFG
// changed, so both are dropped.
cache.delete('dom');
cache.delete('loops');
get('dom');
console.log('computed', computed);`,
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
      'Start with `get` alone: how can it avoid computing the same analysis twice?',
      'Keep a `Map` from analysis name to result; in `get`, compute and store only when the name is missing, and pass `get` itself to each analysis and each pass so they can ask for others.',
      'In `run`, if the pass returned `\'all\'`, stop. Otherwise delete every cached key that is not in the returned array. (Copy the keys first, then delete.)',
    ],
    walkthrough: `**How to think about it.** Two jobs, two functions. \`get\` is a memo: the first time a name is asked for, compute it and remember it; after that, hand back what you remembered. \`run\` is where the memory is corrected: only the pass knows what it changed, so it returns what it preserved, and the manager forgets everything else. Passing \`get\` itself to every analysis and pass is what lets them ask for other analyses, and that is what makes the order of analyses automatic.

**The solution, line by line.**

- \`const cache = new Map();\` maps an analysis name to its result. A \`Map\` keeps any key and has \`has\`, \`get\`, \`set\` and \`delete\`.
- \`const get = (name, ir) => {\` is the only way anyone obtains an analysis.
- \`if (!cache.has(name)) {\` computes only on a miss.
- \`const r = analyses[name](ir, get);\` runs the analysis, handing it \`get\` so it can ask for the analyses it needs (\`loops\` asks for \`dom\`); those are computed first, through the same cache.
- \`cache.set(name, r);\` remembers the result.
- \`return cache.get(name);\` returns the stored result on a hit or a miss alike.
- \`const run = (pass, ir) => {\` runs one pass.
- \`const keep = pass(ir, get);\` runs it, with access to the analyses, and receives its report: \`'all'\` or a list of names.
- \`if (keep === 'all') return;\` is the cheap common case: an analysis-only pass, or one that changed nothing.
- \`for (const k of [...cache.keys()]) {\` loops over a *copy* of the keys (\`[...]\` makes an array), so deleting entries cannot disturb the loop.
- \`if (!keep.includes(k)) { cache.delete(k); }\` forgets every result the pass did not vouch for.

**Common wrong attempts.**

- Caching without ever invalidating: after a pass changes the IR, \`get\` keeps handing out stale results, which is a miscompile waiting to happen.
- Clearing the whole cache after every pass is always correct, but it throws away exactly what passes preserved, so nothing is reused across passes and the cache only helps within one pass.

What this version does not do: keep one cache per function, or notice that \`loops\` was built from a \`dom\` that has just been dropped. The extra exercise adds the second.`,
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
    walkthrough: `**How to think about it.** A result is only as good as what it was built from: \`loops\` was computed by reading \`dom\`, so if \`dom\` is thrown away, \`loops\` must go too, whatever the pass said. To know that, the manager has to record, while each analysis is being computed, which analyses it asked for. The asking happens through \`get\`, so \`get\` must know *who* is asking; a stack of "analyses currently being computed" answers that, because analyses can call \`get\` from inside other analyses.

**The solution, line by line.**

- \`const deps = new Map();\` maps each analysis name to the set of names it asked for.
- \`const stack = [];\` holds the analyses being computed right now, innermost last.
- \`const top = stack[stack.length - 1];\` is the analysis doing the asking, if any (\`undefined\` when a pass asks).
- \`if (top) deps.get(top).add(name);\` records the dependency, on a hit as well as a miss: \`loops\` still used \`dom\` even if \`dom\` was already cached.
- \`deps.set(name, new Set());\` starts a fresh record each time an analysis is computed.
- \`stack.push(name);\` and \`stack.pop();\` around the call mark \`name\` as the asker while it runs.
- \`const ok = (k, keep) => keep.includes(k) && [...deps.get(k)].every((d) => ok(d, keep));\` is the survival rule: preserved, and everything it was built from survives too. Analyses cannot depend on themselves, so the recursion ends.
- In \`run\`, \`if (!ok(k, keep)) cache.delete(k);\` applies the rule to every cached result.

**Common wrong attempts.**

- Recording a dependency only on a cache miss: if \`dom\` was cached before \`loops\` was computed, the edge is never recorded, and \`loops\` survives a dropped \`dom\`.
- Checking only direct dependencies: with \`a\` built from \`b\` built from \`c\`, dropping \`c\` must drop \`a\` too, which the recursion handles.

In LLVM, an analysis result can implement its own \`invalidate()\` method, and its documentation shows one checking its dependencies exactly like this, with \`Inv.invalidate<BarAnalysis>(F, PA)\`.`,
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
    q: 'Inlining a call exposes `if (DEBUG)` with `DEBUG` a known `false`. In which order should these passes run to delete the debug code?',
    options: [
      { t: 'Dead code elimination, then constant propagation, then inlining', why: 'When DCE runs, the condition is not yet known, so nothing is dead.' },
      { t: 'Inlining, then constant propagation, then dead code elimination', correct: true, why: 'Each pass creates the opportunity the next one needs: the call’s body appears, the condition becomes `false`, and the arm becomes dead.' },
      { t: 'The order never matters', why: 'It does: that is the phase-ordering problem.' },
      { t: 'Constant propagation, then dead code elimination, then inlining', why: 'The `if` only appears after inlining, so the first two passes see nothing to do.' },
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
