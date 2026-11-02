// Chapter 236 cards (the second half of chapter 235): recall prompts,
// examples, exercises and quiz. Keys are stable ids.
// Listings are clang 18.1.3 -O2 --target=riscv64 -march=rv64im.

export const prompts = {
  'jt-what': {
    q: 'What is a **jump table**?',
    a: 'An array of code addresses, one per case value in a range, used to compile a switch into a bounds check, a load and an indirect jump.',
  },
  'jt-bounds': {
    q: 'Why must a jump table dispatch check `k` before loading `table[k]`?',
    a: 'A k outside the table would load whatever is in memory there and jump to it; out-of-range values must go to the default.',
  },
  'jt-unsigned': {
    q: 'How does one `bltu` check both `k < 0` and `k > 4`?',
    a: 'Read as unsigned, a negative k is a huge number, so "4 < k, unsigned" is true for both.',
  },
  'jt-cost': {
    q: 'How does the cost of a jump-table switch grow with the number of cases?',
    a: 'It does not: one check, one load and one jump, whatever the number of cases.',
  },
  'jt-vm': {
    q: 'Why is a VM’s dispatch switch a good fit for a jump table?',
    a: 'Its case values, the opcodes, are small numbers packed densely from 0, and it runs once per instruction.',
  },
  'jt-dense': {
    q: 'When does a jump table pay, and when not?',
    a: 'When the case values are dense (close together); for scattered values the table would be mostly default entries.',
  },
  'jt-sparse': {
    q: 'What does clang do for a switch on 1, 100, 1000 and 10000?',
    a: 'A small binary search: it tests k > 999 first, then compares within each half.',
  },
  'jt-values': {
    q: 'A switch whose cases only return constants: what can it become?',
    a: 'A table of the values themselves, so the switch is a bounds check and an array load, with no jump.',
  },
};

export const examples = {
  dispatch: {
    title: 'A jump table by hand',
    code: `const table = [
  () => 'case 0',
  () => 'case 1',
  () => 'case 2',
];
function sw(k) {
  // bltu: unsigned, so -1 fails too
  if ((k >>> 0) >= table.length) {
    return 'default';
  }
  return table[k]();   // jr table[k]
}
console.log(sw(1), sw(5), sw(-1));
console.log(-1 >>> 0);`,
  },
};

export const exercises = {
  'build-table': {
    title: 'Build a jump table',
    prompt: `Write \`buildTable(cases, dflt)\`. \`cases\` is an array of \`[value, label]\` pairs (whole-number values, all different), and \`dflt\` is the default's label. Return \`{ lo, table }\`: \`lo\` is the smallest case value, and \`table\` has one entry for every value from \`lo\` to the largest, holding that case's label, or \`dflt\` where there is no case.

Tables only pay when the values are dense, so use this rule: if fewer than half of the table's entries would be real cases (that is, \`cases.length * 2 < table length\`), return \`null\` instead, meaning "use compares". Return \`null\` for no cases at all.`,
    starter: `function buildTable(cases, dflt) {
  const table = cases.map(
    ([v, label]) => label);
  return { lo: 0, table };
}`,
    solution: `function buildTable(cases, dflt) {
  if (cases.length === 0) return null;
  const vals = cases.map(([v]) => v);
  const lo = Math.min(...vals);
  const hi = Math.max(...vals);
  const size = hi - lo + 1;
  if (cases.length * 2 < size) {
    return null;
  }
  const table = Array(size).fill(dflt);
  for (const [v, label] of cases) {
    table[v - lo] = label;
  }
  return { lo, table };
}`,
    tests: `test('cases 0 to 4', () => {
  const c = [[0, 'a'], [1, 'b'], [2, 'c'],
    [3, 'd'], [4, 'e']];
  expect(buildTable(c, 'def')).toEqual({
    lo: 0, table: ['a', 'b', 'c', 'd', 'e'] });
});
test('a hole gets the default', () => {
  const c = [[10, 'a'], [11, 'b'], [13, 'c']];
  expect(buildTable(c, 'def')).toEqual({
    lo: 10, table: ['a', 'b', 'def', 'c'] });
});
test('order of cases does not matter', () => {
  const c = [[2, 'c'], [0, 'a'], [1, 'b']];
  expect(buildTable(c, 'd').table)
    .toEqual(['a', 'b', 'c']);
});
test('negative values', () => {
  const c = [[-1, 'm'], [0, 'z'], [1, 'p']];
  expect(buildTable(c, 'd')).toEqual({
    lo: -1, table: ['m', 'z', 'p'] });
});
test('sparse: use compares', () => {
  const c = [[1, 'a'], [100, 'b'],
    [1000, 'c'], [10000, 'd']];
  expect(buildTable(c, 'd')).toBe(null);
});
test('exactly half full is still a table', () => {
  expect(buildTable([[0, 'a'], [3, 'b']],
    'd').table).toEqual(['a', 'd', 'd', 'b']);
});
test('two cases in five slots: too sparse', () => {
  expect(buildTable([[0, 'a'], [4, 'b']],
    'd')).toBe(null);
});
test('no cases', () => {
  expect(buildTable([], 'd')).toBe(null);
});`,
    hints: [
      'Find the smallest and largest case values first; the table needs one entry for every value between them.',
      'Compare the number of cases with the table length (`hi - lo + 1`) to decide whether to give up and return null.',
      'Start with `Array(size).fill(dflt)` and then write each case’s label at index `value - lo`.',
    ],
    walkthrough: `**How to think about it.** The table is an array indexed by \`k - lo\`, so before building it you need \`lo\` and \`hi\`. Once you know the size you also know whether the table is worth it: a table with more defaults than cases is mostly wasted memory, and a few compares (or a binary search) would do.

**The solution, line by line.**

- \`if (cases.length === 0) return null;\`: with no cases there is no range at all (and \`Math.min()\` of nothing is \`Infinity\`).
- \`const vals = cases.map(([v]) => v);\` takes just the values, and \`Math.min(...vals)\` and \`Math.max(...vals)\` give \`lo\` and \`hi\`. The cases may come in any order.
- \`const size = hi - lo + 1;\`: one entry per value from \`lo\` to \`hi\`, both included (the "+ 1" is the classic off-by-one to get right).
- \`if (cases.length * 2 < size) return null;\`: our density rule, fewer than half the entries used means compares instead. (Real compilers use a rule of the same kind, with their own threshold and costs.)
- \`const table = Array(size).fill(dflt);\`: start with every entry pointing at the default, so the holes are covered.
- \`for (const [v, label] of cases) table[v - lo] = label;\`: subtracting \`lo\` turns case values into indexes, which is the \`k − lo\` of the chapter's Formal box; for \`lo = -1\`, value -1 goes to index 0.

**Common wrong attempts.**

- The starter puts the labels in the order given, with no holes and \`lo\` always 0: right only for cases 0, 1, 2, ... given in order.
- Forgetting to subtract \`lo\`: writing \`table[v]\` makes a table that starts at 0 and, for negative values, writes to properties like \`table[-1]\` that are not part of the array.
- Using \`hi - lo\` as the size: the table is one entry short, so the density rule is applied to the wrong number (and the largest case lands one past the filled part, which JavaScript quietly allows and a real table would not).`,
    wrong: [
      {
        code: `function buildTable(cases, dflt) {
  if (cases.length === 0) return null;
  const vals = cases.map(([v]) => v);
  const lo = Math.min(...vals);
  const hi = Math.max(...vals);
  const size = hi - lo;
  if (cases.length * 2 < size) {
    return null;
  }
  const table = Array(size).fill(dflt);
  for (const [v, label] of cases) {
    table[v - lo] = label;
  }
  return { lo, table };
}`,
        why: 'The size is one short (hi - lo, not hi - lo + 1), so the density test is wrong: cases 0 and 4 need five entries, not four.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'A switch has cases 0 to 49. With a jump table, how many comparisons run to reach case 49?',
    options: [
      { t: '50', why: 'That is a chain of compares; the table needs no per-case tests.' },
      { t: 'One: the bounds check', correct: true, why: 'Then a load of table[49] and a jr, whatever the case.' },
      { t: 'About 6, as in a binary search', why: 'Binary search is the fallback for sparse values; dense ones get a table.' },
    ],
  },
  {
    q: 'In clang’s table code, why is `k` shifted left by 2 before the load?',
    options: [
      { t: 'Each table entry is a 4-byte address', correct: true, why: 'Base plus index times size, with size 4 (.word), so k × 4 = k << 2.' },
      { t: 'To check that k is even', why: 'The shift scales the index; it tests nothing.' },
      { t: 'Because instructions are 4 bytes long', why: 'The table holds addresses, and it is their size that matters here.' },
    ],
  },
  {
    q: 'Which switch is the worst fit for a jump table?',
    options: [
      { t: 'Cases 0, 1, 2, 3 and 4', why: 'Perfectly dense: five entries, five cases.' },
      { t: 'Cases 10 to 20 with 12 missing', why: 'Ten cases in eleven entries: dense enough.' },
      { t: 'Cases 1, 100, 1000 and 10000', correct: true, why: 'Four cases would need 10000 entries; clang uses a binary search instead.' },
    ],
  },
  {
    q: 'A value in the table’s range has no case. What does its entry hold?',
    options: [
      { t: 'Zero, which makes the program stop', why: 'Jumping to address zero would crash; the entry must lead somewhere valid.' },
      { t: 'The address of the default code', correct: true, why: 'Holes are filled with the default, so the dispatch needs no extra test.' },
      { t: 'Nothing: the table skips missing values', why: 'Then table[k − lo] would no longer be the entry for k.' },
    ],
  },
  {
    q: 'Every case of a switch returns a constant. What can the compiler build instead of a jump table?',
    options: [
      { t: 'A table of the constants, read with one load', correct: true, why: 'There is no code to jump to; the switch becomes base + k × size and a load.' },
      { t: 'Nothing better than a chain of compares', why: 'LLVM builds exactly such a value table for the consts example.' },
      { t: 'A jump table whose entries all point at ret', why: 'The return values differ, so the entries must hold the values themselves.' },
    ],
  },
];
