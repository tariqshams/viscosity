// Chapter 95b cards (GLR, Earley and incremental parsing). Keys are stable ids.

export const prompts = {
  'glr-what': {
    q: 'What does a GLR parser do when an ACTION cell holds two actions?',
    a: 'It copies its stack and follows both; copies that hit an error disappear, and copies that reach the same state at the same point merge.',
  },
  'glr-lockstep': {
    q: 'Why do GLR copies read each token together, in lockstep?',
    a: 'So that copies that have reached the same state at the same position can be noticed and merged, instead of repeating each other’s work.',
  },
  'glr-ambiguous': {
    q: 'In a GLR parse, what does it mean if two copies both reach the end successfully?',
    a: 'The input has two parse trees: the grammar is ambiguous there, and something (in Bison, %dprec or %merge) must choose or combine them.',
  },
  'earley-sets': {
    q: 'What does an Earley parser keep for each position in the input?',
    a: 'A set of dotted rules in progress, each remembering the position where its rule began.',
  },
  'incr-what': {
    q: 'What does an incremental parser reuse after an edit?',
    a: 'Every subtree of the old tree that the edit cannot have changed, moving the positions of those after the edit by the change in length.',
  },
  'incr-edge': {
    q: 'A node ends exactly where an edit begins. Why parse it again?',
    a: 'The new characters may join its last token: typing 2 right after `x = 1` makes `x = 12`.',
  },
  'incr-shift': {
    q: 'An edit at position 20 removes 3 characters and adds 5. A reused node after it was at 30–40. Where is it now?',
    a: 'At 32–42: everything after the edit moves by 5 − 3 = 2.',
  },
  'why-hand': {
    q: 'Give two reasons Clang’s developers give for a hand-written recursive descent parser.',
    a: 'It easily supports the ad-hoc rules C and C++ need, and it makes excellent error messages and error recovery straightforward (it is also plain code that is easy to read).',
  },
};

export const examples = {
  earley: {
    title: 'An Earley recogniser',
    code: `// rules: [head, body]; rule 0 starts
const G = [
  ['S', ['E']],
  ['E', ['E', '+', 'E']],
  ['E', ['n']],
];
const isNT = (x) =>
  G.some(([h]) => h === x);
// item: [rule, dot, origin]
function earley(toks) {
  const sets = toks.map(() => []);
  sets.push([]);
  const add = (k, it) => {
    const has = sets[k].some((o) =>
      o.join() === it.join());
    if (!has) sets[k].push(it);
  };
  add(0, [0, 0, 0]);
  sets.forEach((set, k) => {
    for (const [r, d, o] of set) {
      const x = G[r][1][d];
      if (x === undefined) {
        // complete: move dots on
        const done = G[r][0];
        for (const w of sets[o]) {
          const [r2, d2, o2] = w;
          if (G[r2][1][d2] === done) {
            add(k, [r2, d2 + 1, o2]);
          }
        }
      } else if (isNT(x)) {
        // predict: x's rules start here
        G.forEach(([h], i) => {
          if (h !== x) return;
          add(k, [i, 0, k]);
        });
      } else if (toks[k] === x) {
        // scan: step over the token
        add(k + 1, [r, d + 1, o]);
      }
    }
  });
  const last = sets[toks.length];
  return last.some(([r, d, o]) =>
    r === 0 && d === 1 && o === 0);
}
const run = (s) => earley(s.split(' '));
console.log(run('n + n + n'));
console.log(run('n +'));
console.log(run('n'));`,
  },
};

const STARTER = `// nodes: [{ start, end }], in order;
// end is one past the last character
// e: { at, removed, added }
// return, per node, its new
// { start, end } if it can be reused,
// or null if it must be parsed again
function reuse(nodes, e) {
  return nodes;
}`;

export const exercises = {
  reuse: {
    title: 'What survives an edit',
    prompt:
      'Each node of an old syntax tree covers the characters from `start` up to (not including) `end`. An edit `e` removes `e.removed` characters at position `e.at` and puts `e.added` new ones there. Write `reuse(nodes, e)`, which returns an array with one entry per node: the node\'s new `{ start, end }` if it can be reused, or `null` if it must be parsed again. A node that ends before `e.at` is kept as it is; a node that starts after the end of the removed text (`e.at + e.removed`) is kept with both positions moved by `e.added - e.removed`; every other node, including one that only touches the edit at its edge, is parsed again.',
    starter: STARTER,
    solution: `function reuse(nodes, e) {
  const delta = e.added - e.removed;
  const editEnd = e.at + e.removed;
  return nodes.map((n) => {
    if (n.end < e.at) {
      return { ...n };
    }
    if (n.start > editEnd) {
      return {
        start: n.start + delta,
        end: n.end + delta,
      };
    }
    return null;
  });
}`,
    tests: `const three = [
  { start: 0, end: 10 },
  { start: 11, end: 21 },
  { start: 22, end: 32 },
];
test('an insert inside the second statement', () => {
  expect(reuse(three, { at: 20, removed: 0, added: 2 })).toEqual([
    { start: 0, end: 10 }, null, { start: 24, end: 34 },
  ]);
});
test('an insert inside the first moves the rest', () => {
  expect(reuse(three, { at: 4, removed: 0, added: 1 })).toEqual([
    null, { start: 12, end: 22 }, { start: 23, end: 33 },
  ]);
});
test('a deletion across two statements', () => {
  expect(reuse(three, { at: 8, removed: 6, added: 0 })).toEqual([
    null, null, { start: 16, end: 26 },
  ]);
});
test('touching the end of a node counts', () => {
  expect(reuse(three, { at: 10, removed: 0, added: 1 })).toEqual([
    null, { start: 12, end: 22 }, { start: 23, end: 33 },
  ]);
});
test('touching the start of a node counts', () => {
  expect(reuse(three, { at: 20, removed: 2, added: 0 })).toEqual([
    { start: 0, end: 10 }, null, null,
  ]);
});
test('same-length replacement: later nodes stay put', () => {
  expect(reuse(three, { at: 15, removed: 1, added: 1 })).toEqual([
    { start: 0, end: 10 }, null, { start: 22, end: 32 },
  ]);
});`,
    hints: [
      'Work out two numbers first: how far everything after the edit moves (`e.added - e.removed`), and where the removed text ended in the old file (`e.at + e.removed`).',
      'Then each node falls in one of three cases: wholly before the edit (`n.end < e.at`), wholly after it (`n.start > editEnd`), or touching it. `map` over the nodes and return the right thing for each case.',
      'Before: return a copy, `{ ...n }`. After: return both positions plus the shift. Touching: return `null`. Use strict `<` and `>`, so that a node meeting the edit at its edge is parsed again.',
    ],
    walkthrough: `**How to think about it.** Draw the old text as a line with the edit as a window in it, from \`e.at\` to \`e.at + e.removed\`. Nodes entirely to the left of the window are untouched, and the text before an edit never moves. Nodes entirely to the right are untouched too, but every character after the edit slides by the difference between what was added and what was removed. Anything overlapping the window, or meeting it at an edge, may have changed, so it is parsed again. The only subtle part is the edges, and the chapter's second example (typing \`2\` after \`x = 1\`) is why they count as touching.

**The solution, line by line.**

- \`function reuse(nodes, e) {\` takes the old nodes and the edit.
- \`  const delta = e.added - e.removed;\` is how far everything after the edit moves: positive if the text grew, negative if it shrank, zero for a same-length replacement.
- \`  const editEnd = e.at + e.removed;\` is where the removed text ended in the *old* file, which is the right place to compare old node positions with.
- \`  return nodes.map((n) => {\` gives one answer per node, in the same order.
- \`    if (n.end < e.at) {\` / \`return { ...n };\` keeps a node that ends strictly before the edit, unchanged. (Returning a copy, \`{ ...n }\`, rather than \`n\` itself keeps the old tree untouched, which an editor may still be showing.) Because \`end\` is one past the last character, \`n.end === e.at\` means the edit starts right after the node's last character, and that case falls through to "parse again".
- \`    if (n.start > editEnd) {\` is a node that starts strictly after the removed text.
- \`      return {\` / \`start: n.start + delta,\` / \`end: n.end + delta,\` / \`};\` keeps it, moved.
- \`    return null;\` is everything else: the node overlaps or touches the edit.
- \`  });\` closes the \`map\`.

For the figure's edit (\`at: 20, removed: 0, added: 2\`), \`delta\` is 2 and \`editEnd\` is 20: the first node ends at 10 (kept), the second covers 11 to 21 (touching, so \`null\`), and the third starts at 22, after 20, so it moves to 24–34.

**Common wrong attempts.**

- Comparing with \`e.at\` on both sides, forgetting \`e.removed\`, keeps nodes that start inside the deleted text, as if they still existed.
- Forgetting to move the nodes after the edit returns stale positions, so every later error message and highlight points at the wrong characters.
- Using \`<=\` and \`>=\` reuses a node that only touches the edit, which is wrong when the new text joins its first or last token.`,
    wrong: [
      {
        code: `function reuse(nodes, e) {
  const delta = e.added - e.removed;
  return nodes.map((n) => {
    if (n.end < e.at) {
      return { ...n };
    }
    if (n.start > e.at) {
      return {
        start: n.start + delta,
        end: n.end + delta,
      };
    }
    return null;
  });
}`,
        why: 'It compares with `e.at` instead of the end of the removed text, so a node that starts inside a deletion is kept as if it still existed.',
      },
      {
        code: `function reuse(nodes, e) {
  const editEnd = e.at + e.removed;
  return nodes.map((n) => {
    const after = n.start > editEnd;
    if (n.end < e.at || after) {
      return { ...n };
    }
    return null;
  });
}`,
        why: 'Nodes after the edit are reused at their old positions, so after an insert of 2 characters the third statement claims 22–32 instead of 24–34.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'A GLR parser meets a cell with a shift and a reduce. What happens?',
    options: [
      { t: 'It shifts, as Bison does by default', why: 'That is a deterministic LR parser settling the conflict; GLR does not settle it.' },
      { t: 'It copies the stack and does both, reading the next tokens with both copies', correct: true, why: 'Copies that fail vanish and copies that meet merge.' },
      { t: 'It reports a syntax error', why: 'A conflict is not an error in the input; GLR follows both actions.' },
    ],
  },
  {
    q: 'In Pascal, `type t = (a) .. b;` and `type t = (a);` look alike until `..`. What does a GLR parser do?',
    options: [
      { t: 'Splits when it must decide, and the wrong copy fails once the `..` (or its absence) shows up', correct: true, why: 'The grammar is not ambiguous; it only needs more lookahead than LR(1) gives, and GLR provides it by trying both.' },
      { t: 'Keeps both trees, since the grammar is ambiguous', why: 'Only one copy survives, so there is only one tree.' },
      { t: 'Gives up, since one token of lookahead is not enough', why: 'That is what an LALR or LR(1) parser would have to do.' },
    ],
  },
  {
    q: 'Which grammars can an Earley parser handle?',
    options: [
      { t: 'Only LR(1) grammars', why: 'Earley needs no table and has no conflicts; it is not limited to LR(1).' },
      { t: 'Only grammars without left recursion', why: 'That is a limit of recursive descent and PEGs, not of Earley.' },
      { t: 'Any context-free grammar, including ambiguous and left-recursive ones', correct: true, why: 'At worst it takes time growing with the cube of the input length; for unambiguous grammars, the square.' },
    ],
  },
  {
    q: 'An edit at position 15 removes 4 characters and adds 1. A node covers 30–38. What happens to it?',
    options: [
      { t: 'It is parsed again', why: 'It starts after the removed text, which ended at 19, so it is untouched.' },
      { t: 'It is reused at 27–35', correct: true, why: 'It is after the edit, so it moves by 1 − 4 = −3.' },
      { t: 'It is reused at 30–38', why: 'The text before it shrank by 3, so its positions move too.' },
    ],
  },
  {
    q: 'Which statement about real compilers is true?',
    options: [
      { t: 'V8, Clang, rustc, TypeScript and oxc use parsers generated by Bison', why: 'All of them use hand-written recursive descent.' },
      { t: 'Hand-written parsers cannot handle operator precedence', why: 'They do it with precedence climbing: V8’s ParseBinaryExpression takes a precedence, for example.' },
      { t: 'They use hand-written recursive descent, partly because it makes good error messages and recovery easier', correct: true, why: 'Clang’s developers say so explicitly; the others’ source code shows the same design.' },
    ],
  },
];
