// Chapter 163 cards. Keys are stable ids: never rename them.

export const prompts = {
  'pgo-why-here': {
    q: 'Why can’t Viscosity estimate the size of `ps` when the push is inside a function `spawn` called from a loop?',
    a: 'The estimate counts pushes in top-level loops with constant trip counts. A push inside a function depends on how often it is called, so the size is unknown.',
  },
  'pgo-what': {
    q: 'What is profile-guided optimization (PGO)?',
    a: 'Compiling with measurements from real runs of the program (a profile), not only with what the source reveals.',
  },
  'measured-wins': {
    q: 'In the planner, a collection has both a static size estimate and a measured size. Which is used?',
    a: 'The measured one: `size = measured ?? estimate`.',
  },
  'inst-what': {
    q: 'What is instrumentation?',
    a: 'Code added to a program to record what it does while it runs, without changing what it does.',
  },
  'track-return': {
    q: 'Why must `__vsc_track(name, arr)` return `arr` itself, not a copy?',
    a: 'So the instrumented program behaves exactly like the original. With a copy, pushes and `===` would change, and the profile would describe a different program.',
  },
  'exit-hook': {
    q: 'When does the instrumented program read the lengths of the tracked arrays?',
    a: 'Once, in a `process.on(\'exit\')` hook, which writes them to the profile file.',
  },
  'profile-safety': {
    q: 'Can a profile make Viscosity transform a collection that failed a safety check?',
    a: 'No. The profile is read only at the size threshold, after every safety check has passed.',
  },
  'profile-input': {
    q: 'You profile with a 20-element test input, but production uses a million elements. What happens?',
    a: 'Viscosity keeps the collection as objects (measured 20 < 64), so production loses the speed-up. It is still correct.',
  },
  'profile-correct': {
    q: 'Why can a wrong profile cost Viscosity speed but never correctness?',
    a: 'It only chooses between two layouts that are already proven to behave identically.',
  },
  'jit-pgo': {
    q: 'How does V8’s use of profiles differ from Viscosity’s?',
    a: 'V8 profiles during the same run and speculates on the feedback, so it needs guards and deoptimization. Viscosity profiles ahead of time and only picks a size threshold.',
  },
};

export const examples = {
  track: {
    title: 'Instrumentation by hand',
    code: `// The tracker from the prelude.
const seen = [];
function track(name, arr) {
  seen.push([name, arr]);
  return arr; // the same array
}
function report() {
  const p = {};
  for (const [n, a] of seen) {
    const old = p[n]
      ? p[n].maxLength : 0;
    const len = a.length;
    p[n] = {
      maxLength: Math.max(old, len),
    };
  }
  return p;
}

// The program, instrumented:
const ps = track('ps', []);
function spawn(x) {
  ps.push({ x, vx: 1 });
}
const waves = 20; // try 5000
for (let i = 0; i < waves; i++) {
  spawn(i);
}
for (let i = 0; i < ps.length; i++) {
  ps[i].x += ps[i].vx;
}
console.log(ps[0].x);

// What the exit hook would write:
const prof = report();
console.log(JSON.stringify(prof));
const n = prof.ps.maxLength;
console.log(n < 64
  ? 'kept as objects (measured)'
  : 'struct of arrays (measured)');`,
  },
};

export const exercises = {
  maxTracker: {
    title: 'Instrument an array factory',
    prompt:
      'Write `makeTracker()`. It returns an object with two methods. `track(name, arr)` remembers `arr` under `name` and returns **the same array**. `profile()` returns an object mapping each name to `{ maxLength }`: the largest `.length`, **read when `profile()` is called**, among all arrays tracked under that name.',
    starter: `function makeTracker() {
  const seen = [];
  return {
    track(name, arr) {
      // your code here
      return arr;
    },
    profile() {
      return {};
    },
  };
}`,
    solution: `function makeTracker() {
  const seen = [];
  return {
    track(name, arr) {
      seen.push([name, arr]);
      return arr;
    },
    profile() {
      const p = {};
      for (const [n, a] of seen) {
        const old = p[n]
          ? p[n].maxLength : 0;
        const len = a.length;
        p[n] = {
          maxLength: Math.max(old, len),
        };
      }
      return p;
    },
  };
}`,
    tests: `test('returns the very same array', () => {
  const t = makeTracker();
  const a = [];
  expect(t.track('a', a) === a).toBe(true);
});
test('reads lengths when profile() is called', () => {
  const t = makeTracker();
  const a = t.track('a', []);
  a.push(1, 2, 3);
  expect(t.profile()).toEqual({ a: { maxLength: 3 } });
});
test('max over arrays with one name, any order', () => {
  const t = makeTracker();
  t.track('ps', [1, 2, 3, 4, 5]);
  t.track('ps', [1, 2]);
  const u = makeTracker();
  u.track('ps', [1, 2]);
  u.track('ps', [1, 2, 3, 4, 5]);
  expect(t.profile().ps.maxLength).toBe(5);
  expect(u.profile().ps.maxLength).toBe(5);
});
test('separate names', () => {
  const t = makeTracker();
  t.track('a', [1]);
  t.track('b', []);
  expect(t.profile()).toEqual({ a: { maxLength: 1 }, b: { maxLength: 0 } });
});
test('trackers are independent', () => {
  const t = makeTracker();
  const u = makeTracker();
  t.track('a', [1, 2]);
  expect(u.profile()).toEqual({});
});`,
    hints: [
      'In `track`, push the pair `[name, arr]` onto `seen` and return `arr` unchanged.',
      'In `profile`, loop over `seen` and read `a.length` now, not when the array was tracked.',
      'Keep the maximum per name: start from 0 when a name is new, then `Math.max(old, a.length)`.',
    ],
    walkthrough: `This is the prelude that \`viscosity profile\` puts in front of your program, as a reusable object.

- **Return the same array.** Instrumentation must not change behaviour. If \`track\` returned a copy, the program would push into the copy, \`===\` comparisons would change, and you would be measuring a different program.
- **Remember the array, not its length.** At \`track\` time the array is usually empty: \`const ps = __vsc_track("ps", [])\`. Its interesting length exists only later, so you keep a reference and read \`.length\` in \`profile()\`, just as the real exit hook does.
- **Max per name.** Code that runs \`const ps = []\` several times (a function called twice, say) tracks several arrays under one name. The profile is keyed by name, so it keeps the largest.
- **The closure** holds \`seen\`, so two trackers don’t share state.

The real hook then writes the result with \`JSON.stringify\` to the file named by \`VSC_PROFILE_OUT\`.`,
    wrong: [
      {
        code: `function makeTracker() {
  const seen = [];
  return {
    track(name, arr) {
      seen.push([name, arr.length]);
      return arr;
    },
    profile() {
      const p = {};
      for (const [n, len] of seen) {
        const old = p[n]
          ? p[n].maxLength : 0;
        p[n] = {
          maxLength: Math.max(old, len),
        };
      }
      return p;
    },
  };
}`,
        why: 'It records the length at the moment the array is tracked, which is usually 0 because the array was just created. The real hook reads lengths at exit.',
      },
      {
        code: `function makeTracker() {
  const seen = [];
  return {
    track(name, arr) {
      seen.push([name, arr]);
      return arr;
    },
    profile() {
      const p = {};
      for (const [n, a] of seen) {
        p[n] = { maxLength: a.length };
      }
      return p;
    },
  };
}`,
        why: 'The last array tracked under a name wins, even if an earlier one was longer. Keep the maximum.',
      },
      {
        code: `function makeTracker() {
  const seen = [];
  return {
    track(name, arr) {
      const copy = [...arr];
      seen.push([name, copy]);
      return copy;
    },
    profile() {
      const p = {};
      for (const [n, a] of seen) {
        const old = p[n]
          ? p[n].maxLength : 0;
        const len = a.length;
        p[n] = {
          maxLength: Math.max(old, len),
        };
      }
      return p;
    },
  };
}`,
        why: 'Returning a copy changes the program: `track(\'a\', a) === a` is false. Instrumentation must hand back the very same array.',
      },
    ],
  },
  sizeLine: {
    optional: true,
    title: 'The size decision',
    prompt:
      'Write `sizeLine(est, measured, min)`, the size step of the planner. `est` is the static estimate (a number, or `null` if unknown); `measured` is the profiled length, or `undefined` if there is no profile. Use the measurement if there is one. If the size is known and below `min`, return `{ keep: true, text }` with text `about N elements (measured): below the MIN-element threshold` (drop ` (measured)` if the size was estimated). Otherwise return `{ keep: false, text }` where text is `size unknown statically`, or `about N elements`, with ` (measured by profiling)` added if measured.',
    starter: `function sizeLine(est, measured, min) {
  return { keep: false, text: '' };
}`,
    solution: `function sizeLine(est, measured, min) {
  const m = measured !== undefined;
  const n = m ? measured : est;
  if (n !== null && n < min) {
    const tag = m ? ' (measured)' : '';
    return {
      keep: true,
      text: 'about ' + n + ' elements' +
        tag + ': below the ' + min +
        '-element threshold',
    };
  }
  if (n === null) {
    return {
      keep: false,
      text: 'size unknown statically',
    };
  }
  const tag = m
    ? ' (measured by profiling)' : '';
  return {
    keep: false,
    text: 'about ' + n +
      ' elements' + tag,
  };
}`,
    tests: `test('unknown, no profile: transform', () => {
  expect(sizeLine(null, undefined, 64)).toEqual({ keep: false, text: 'size unknown statically' });
});
test('measured small: keep', () => {
  expect(sizeLine(null, 20, 64)).toEqual({ keep: true, text: 'about 20 elements (measured): below the 64-element threshold' });
});
test('measured beats the estimate', () => {
  expect(sizeLine(1000, 20, 64).keep).toBe(true);
  expect(sizeLine(10, 5000, 64)).toEqual({ keep: false, text: 'about 5000 elements (measured by profiling)' });
});
test('estimated small: keep, no tag', () => {
  expect(sizeLine(2, undefined, 64)).toEqual({ keep: true, text: 'about 2 elements: below the 64-element threshold' });
});
test('a measured 0 is still a measurement', () => {
  expect(sizeLine(1000, 0, 64)).toEqual({ keep: true, text: 'about 0 elements (measured): below the 64-element threshold' });
});`,
    hints: [
      'Decide first whether there is a measurement: `measured !== undefined`.',
      'Pick the size: the measurement if there is one, else the estimate. `??` does exactly this; `||` does not, because 0 is falsy.',
      'Then three cases: known and small (keep), unknown, known and large.',
    ],
    walkthrough: `This mirrors the size step in \`core/src/plan.ts\`, \`measured ?? c.sizeEstimate\`, and the text \`describe()\` writes.

- **The measurement wins.** An estimate is a guess from the source; a measurement is what actually happened. The estimate is only a fallback.
- **\`??\`, not \`||\`.** A measured length of 0 is real information: the array stayed empty in the profiling run. \`measured || est\` would throw it away and use the estimate instead.
- **Unknown means go ahead.** With no number at all, the threshold can’t apply, and the planner lets the other evidence (a hot loop over numeric fields) decide.
- **Say where the number came from.** “(measured)” tells the reader of the report that this decision depends on a profiling run, so a different input could change it.`,
    wrong: [
      {
        code: `function sizeLine(est, measured, min) {
  const m = measured !== undefined;
  const n = measured || est;
  if (n !== null && n < min) {
    const tag = m ? ' (measured)' : '';
    return {
      keep: true,
      text: 'about ' + n + ' elements' +
        tag + ': below the ' + min +
        '-element threshold',
    };
  }
  if (n === null) {
    return {
      keep: false,
      text: 'size unknown statically',
    };
  }
  const tag = m
    ? ' (measured by profiling)' : '';
  return {
    keep: false,
    text: 'about ' + n +
      ' elements' + tag,
  };
}`,
        why: '`measured || est` treats a measured 0 as missing and falls back to the estimate of 1000. Use `??` or an explicit `undefined` check.',
      },
      {
        code: `function sizeLine(est, measured, min) {
  const m = measured !== undefined;
  const n = est ?? measured;
  if (n !== null && n < min) {
    const tag = m ? ' (measured)' : '';
    return {
      keep: true,
      text: 'about ' + n + ' elements' +
        tag + ': below the ' + min +
        '-element threshold',
    };
  }
  if (n === null) {
    return {
      keep: false,
      text: 'size unknown statically',
    };
  }
  const tag = m
    ? ' (measured by profiling)' : '';
  return {
    keep: false,
    text: 'about ' + n +
      ' elements' + tag,
  };
}`,
        why: 'The estimate wins whenever there is one, so a profile only matters when the size is unknown. A measurement should override a guess.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'What does `viscosity profile` measure?',
    options: [
      { t: 'How long each loop takes', why: 'Nothing is timed. The profiling run only counts.' },
      { t: 'The length of each candidate collection, read when the program exits', correct: true, why: 'The exit hook writes `{ name: { maxLength } }` for every tracked array.' },
      { t: 'Which fields each loop reads', why: 'The profile type has room for field read counts, but nothing records them yet.' },
      { t: 'Which collections are safe to transform', why: 'Safety is proved by analysis, never measured.' },
    ],
  },
  {
    q: 'Which program does the profiling run execute?',
    options: [
      { t: 'The compiled, struct-of-arrays version', why: 'It runs the original, so the measurement doesn’t depend on a layout choice that hasn’t been made yet.' },
      { t: 'A version with every collection copied into a tracker', why: 'Nothing is copied: `__vsc_track` returns the same array.' },
      { t: 'The original program in the browser', why: 'It runs in a fresh Node process.' },
      { t: 'The original program, with each collection’s creation wrapped in `__vsc_track`', correct: true, why: 'Plus a prelude that defines the tracker and the exit hook.' },
    ],
  },
  {
    q: 'In spawn.js, `spawn` is called 20 times. What changes when you compile with the profile?',
    options: [
      { t: 'Nothing: `ps` is still a struct of arrays', why: 'The measured 20 is below the 64-element threshold.' },
      { t: '`ps` becomes AoSoA', why: 'AoSoA needs an annotation; the profile only changes the size.' },
      { t: '`ps` is kept as an array of objects, “about 20 elements (measured)”', correct: true, why: 'Without the profile the size was unknown and Viscosity transformed it.' },
      { t: 'Viscosity reports a bailout', why: 'Being small isn’t unsafe; it just isn’t worth it.' },
    ],
  },
  {
    q: 'A collection is passed to `console.log` (an escape). Its profile says it holds a million elements. What does Viscosity do?',
    options: [
      { t: 'Keeps it as objects: safety checks come before the profile is read', correct: true, why: 'Unsafe collections never reach the size step.' },
      { t: 'Transforms it, because a million elements is a big win', why: 'Speed never overrides safety.' },
      { t: 'Transforms it and inserts a guard', why: 'Viscosity doesn’t speculate; it either proves or leaves alone.' },
      { t: 'Asks for an annotation', why: 'Annotations can’t override a safety failure either.' },
    ],
  },
  {
    q: 'Why does V8 need deoptimization while Viscosity’s PGO needs no guard?',
    options: [
      { t: 'V8’s profiles are less accurate', why: 'Accuracy isn’t the point: any profile can be wrong about the future.' },
      { t: 'Viscosity runs the program many times', why: 'It runs it once.' },
      { t: 'V8 doesn’t use profiles', why: 'It does: shape and type feedback drives its optimizing compilers.' },
      { t: 'V8 specializes code on feedback that affects correctness; Viscosity’s profile only picks between two proven-equivalent layouts', correct: true, why: 'A wrong guess in V8 would compute wrong results unless guarded. A wrong guess in Viscosity is just slower.' },
    ],
  },
  {
    q: 'Which is the best input to profile with?',
    options: [
      { t: 'The smallest input that runs, so profiling is quick', why: 'Small inputs give small sizes, and Viscosity would keep collections it should transform.' },
      { t: 'A typical production workload, produced by the program without arguments', correct: true, why: '`viscosity profile` passes no arguments, and the decisions will fit whatever run it measured.' },
      { t: 'It doesn’t matter: the profile only affects safety', why: 'It affects only the size decision, which depends entirely on the input.' },
      { t: 'Random input, to cover all cases', why: 'A profile isn’t a test. It should look like the runs you want to be fast.' },
    ],
  },
];
