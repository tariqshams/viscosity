// Chapter 315 cards. Keys are stable ids: never rename them.

export const prompts = {
  'bc-why': {
    q: 'Why can the C++ program that keeps `int& first = v[0]` across `v.push_back(3)` read freed memory?',
    a: 'Growing the vector can move its elements to a bigger block and free the old one, so `first` still points into the freed block.',
  },
  'bc-move': {
    q: 'After `let t = s` (where `s` owns a value), what may you still do with `s`?',
    a: 'Only give it a new value (`s = new`). Any read, borrow or move of `s` is error E0382, because its value now belongs to `t`.',
  },
  'bc-rule': {
    q: 'State the rule of references in one sentence.',
    a: 'At any moment a value may have either any number of shared (`&`) borrows or exactly one mutable (`&mut`) borrow, never both.',
  },
  'bc-ledger': {
    q: 'What two things does the miniature checker remember as it walks the program?',
    a: 'The set of names that have been moved away, and the list of loans that are out (who is borrowed, and whether shared or mutable).',
  },
  'bc-only-ok': {
    q: 'Which single combination of an action and an existing loan of the same name is allowed?',
    a: 'A read (a use, or another `&`) while only shared loans are out.',
  },
  'bc-codes': {
    q: 'Match the codes: a second `&mut`; a `&mut` beside a `&`; moving while borrowed; assigning while borrowed.',
    a: 'E0499; E0502; E0505; E0506.',
  },
  'bc-static': {
    q: 'Does the borrow checker run the program to find these errors?',
    a: 'No. It reads the program once, before it runs, and reasons about every line, so the errors are found at compile time and cost nothing at run time.',
  },
  'bc-mir': {
    q: 'On which of rustc’s representations does the borrow checker run, and why that one?',
    a: 'On MIR, the control-flow graph of simple statements: it is far smaller than the syntax tree, and its graph is what non-lexical lifetimes are built on.',
  },
  'bc-deep': {
    q: 'In the NLL RFC’s terms, what kind of access is `&mut x`, and what kind is `&x`?',
    a: '`&mut x` is a deep write of `x`; `&x` is a deep read. An access is an error unless both it and the loan it meets are reads.',
  },
  'bc-catch': {
    q: 'Why does our first checker reject `let r = &v; use r; let m = &mut v`, which rustc accepts?',
    a: 'Its loans never end, so the shared loan from line 1 is still out at line 3; rustc ends a loan once its reference is never used again.',
  },
};

export const examples = {
  'lend-checker': {
    title: 'The Lend borrow checker',
    code: `// The Lend borrow checker (lexical:
// a loan lasts to the end).
function check(src) {
  const kind = {};     // own|shr|mut
  const moved = new Set();
  const loans = [];    // { k, of }
  const errs = [];
  function conflict(p, acc) {
    for (const l of loans) {
      if (l.of !== p) continue;
      if (acc === 'read') {
        if (l.k === 'mut')
          return 'E0502';
      } else if (acc === 'mut') {
        return l.k === 'mut'
          ? 'E0499' : 'E0502';
      } else if (acc === 'move') {
        return 'E0505';
      } else return 'E0506';
    }
    return null;
  }
  const lines = src.trim().split('\\n');
  lines.forEach((line, i) => {
    const err = (c) =>
      errs.push(\`line \${i + 1}: \${c}\`);
    const touch = (p, acc) => {
      if (moved.has(p))
        return err('E0382');
      const c = conflict(p, acc);
      if (c) err(c);
    };
    const w = line.trim().split(/\\s+/);
    if (w[0] === 'use') {
      const x = w[1];
      if (moved.has(x)) err('E0382');
      else if (kind[x] === 'own')
        touch(x, 'read');
    } else if (w[0] === 'let') {
      const x = w[1], e = w[3];
      if (e === 'new') {
        kind[x] = 'own';
      } else if (e === '&mut') {
        touch(w[4], 'mut');
        kind[x] = 'mut';
        loans.push({ k: 'mut',
          of: w[4] });
      } else if (e[0] === '&') {
        touch(e.slice(1), 'read');
        kind[x] = 'shr';
        loans.push({ k: 'shr',
          of: e.slice(1) });
      } else {
        if (kind[e] === 'own')
          touch(e, 'move');
        else if (moved.has(e))
          err('E0382');
        if (kind[e] !== 'shr')
          moved.add(e);
        kind[x] = kind[e];
      }
    } else {
      const c =
        conflict(w[0], 'assign');
      if (c) err(c);
      moved.delete(w[0]);
    }
  });
  return errs.length ? errs : ['ok'];
}

console.log(check(\`
let v = new
let a = &v
let b = &v
use a\`));
console.log(check(\`
let v = new
let r = &v
let m = &mut v\`));
console.log(check(\`
let s = new
let t = s
use s\`));`,
  },
};

export const exercises = {
  conflict: {
    title: 'The conflict rule',
    prompt:
      'Write `conflict(loans, p, acc)`, the heart of the checker. `loans` is a list of loans that are out, each `{ k, of }` where `k` is `\'shr\'` or `\'mut\'` and `of` is the borrowed name. `p` is the name the current line touches, and `acc` is what it does: `\'read\'` (a use, or a new `&`), `\'mut\'` (a new `&mut`), `\'move\'` or `\'assign\'`. Return the rustc error code for the first loan of `p` that conflicts (`\'E0499\'`, `\'E0502\'`, `\'E0505\'` or `\'E0506\'`), or `null` if the action is legal. Loans of other names never conflict.',
    starter: `function conflict(loans, p, acc) {
  // look at each loan of p
  return null;
}`,
    solution: `function conflict(loans, p, acc) {
  for (const l of loans) {
    if (l.of !== p) continue;
    if (acc === 'read') {
      if (l.k === 'mut') return 'E0502';
    } else if (acc === 'mut') {
      return l.k === 'mut'
        ? 'E0499' : 'E0502';
    } else if (acc === 'move') {
      return 'E0505';
    } else {
      return 'E0506';
    }
  }
  return null;
}`,
    tests: `const S = (of) => ({ k: 'shr', of });
const M = (of) => ({ k: 'mut', of });
test('no loans: everything is legal', () => {
  for (const a of ['read', 'mut', 'move', 'assign'])
    expect(conflict([], 'v', a)).toBe(null);
});
test('readers share', () => {
  expect(conflict([S('v'), S('v')], 'v', 'read')).toBe(null);
});
test('a writer beside a reader is E0502', () => {
  expect(conflict([S('v')], 'v', 'mut')).toBe('E0502');
  expect(conflict([M('v')], 'v', 'read')).toBe('E0502');
});
test('two writers is E0499', () => {
  expect(conflict([M('v')], 'v', 'mut')).toBe('E0499');
});
test('moving or assigning while borrowed', () => {
  expect(conflict([S('v')], 'v', 'move')).toBe('E0505');
  expect(conflict([M('v')], 'v', 'move')).toBe('E0505');
  expect(conflict([S('v')], 'v', 'assign')).toBe('E0506');
});
test('loans of other names do not count', () => {
  expect(conflict([M('w'), S('w')], 'v', 'mut')).toBe(null);
  expect(conflict([S('w'), M('v')], 'v', 'read')).toBe('E0502');
});`,
    hints: [
      'Loop over the loans, and skip every loan whose `of` is not `p`; only loans of the same name can conflict.',
      'For a loan of `p`, there is only one safe pair: `acc` is `\'read\'` and the loan is shared. Every other pair is an error, and the code depends on `acc` (and, for `\'mut\'`, on the loan).',
      'Read: return `\'E0502\'` only if the loan is `\'mut\'`, otherwise keep looking. Mut: `\'E0499\'` if the loan is `\'mut\'`, else `\'E0502\'`. Move: `\'E0505\'`. Assign: `\'E0506\'`. After the loop, `return null`.',
    ],
    walkthrough: `**How to think about it.** Picture the conflict table from the chapter: rows are the kind of loan already out, columns are what the line wants to do. Of the eight cells with a loan in them, exactly one is safe (a read beside a shared loan); the other seven are errors, and each has its own code. So the function is a loop over the loans of \`p\`, with one cell that says "keep going" and seven that say "stop, here is the code". A loan of a different name is like a book on another shelf: it has nothing to do with this line.

**The solution, line by line.**

- \`function conflict(loans, p, acc) {\` takes the ledger's loans, the name being touched and the kind of access.
- \`  for (const l of loans) {\` visits every loan that is out.
- \`    if (l.of !== p) continue;\` skips loans of other names: borrowing \`w\` never stops you writing \`v\`.
- \`    if (acc === 'read') {\` handles a use or a new \`&\`.
- \`      if (l.k === 'mut') return 'E0502';\` a read beside a mutable loan is "cannot borrow as immutable because it is also borrowed as mutable". Beside a shared loan nothing is returned, so the loop goes on to the next loan (another loan of \`v\` might be mutable).
- \`    } else if (acc === 'mut') {\` handles a new \`&mut\`.
- \`      return l.k === 'mut' ? 'E0499' : 'E0502';\` (split over two lines) gives "borrowed as mutable more than once" if the existing loan is mutable, and the mixed-mutability error otherwise.
- \`    } else if (acc === 'move') {\` and \`return 'E0505';\`: moving the value away while any loan of it is out would leave the borrower holding nothing.
- \`    } else { return 'E0506'; }\`: the only access left is an assignment, which would change the value under the borrower's feet.
- \`  return null;\` after the loop means no loan of \`p\` objected, so the line is legal.

**Common wrong attempts.**

- Returning \`'E0502'\` for a read beside *any* loan: then two readers can never share, and \`let a = &v; let b = &v\` is wrongly rejected.
- Forgetting \`if (l.of !== p) continue;\`: a mutable loan of \`w\` then blocks every access to \`v\`.
- Returning \`null\` as soon as the first loan of \`p\` is shared, during a read: a later mutable loan of the same name would be missed (the tests put a shared loan of \`w\` before a mutable loan of \`v\` to catch the related slip).`,
    wrong: [
      {
        code: `function conflict(loans, p, acc) {
  for (const l of loans) {
    if (l.of !== p) continue;
    if (acc === 'read') return 'E0502';
    if (acc === 'mut') return 'E0499';
    if (acc === 'move') return 'E0505';
    return 'E0506';
  }
  return null;
}`,
        why: 'Readers can no longer share (`&v` beside `&v` is wrongly E0502), and a `&mut` beside a shared loan reports E0499 instead of E0502.',
      },
      {
        code: `function conflict(loans, p, acc) {
  for (const l of loans) {
    if (acc === 'read') {
      if (l.k === 'mut') return 'E0502';
    } else if (acc === 'mut') {
      return l.k === 'mut'
        ? 'E0499' : 'E0502';
    } else if (acc === 'move') {
      return 'E0505';
    } else return 'E0506';
  }
  return null;
}`,
        why: 'It never checks `l.of`, so a loan of `w` blocks an access to `v`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'In Lend, which program has **no** borrow error under the chapter\'s first checker?\n```\nA: let v = new / let a = &v / let b = &v\nB: let v = new / let a = &v / v = new\nC: let v = new / let m = &mut v / use v\n```',
    options: [
      { t: 'A', correct: true, why: 'Two shared loans of `v`: readers may share.' },
      { t: 'B', why: 'Assigning to `v` while `a` borrows it is E0506.' },
      { t: 'C', why: 'Reading `v` while `m` holds a mutable loan is E0502.' },
    ],
  },
  {
    q: 'What does rustc report for `let t = s;` followed by a use of `s` (where `s` is a `String`)?',
    options: [
      { t: 'E0505, cannot move out of `s` because it is borrowed', why: 'Nothing borrows `s` here; the problem is the use after the move.' },
      { t: 'Nothing; `s` is copied', why: '`String` does not implement `Copy`, so `let t = s` moves it.' },
      { t: 'E0382, borrow of moved value: `s`', correct: true, why: 'The value moved to `t`, so using `s` afterwards is E0382 (and rustc suggests `.clone()`).' },
    ],
  },
  {
    q: 'Why does `let n = m;` move `m` when `m` is a `&mut` reference, but copy it when `m` is a `&` reference?',
    options: [
      { t: 'Because two copies of a `&mut` would be two mutable loans of the same value at once', correct: true, why: 'Shared references may be copied freely (any number of readers); a mutable one must stay unique, so assigning it hands it over.' },
      { t: 'Because `&mut` references are bigger', why: 'Both are one pointer; the difference is the uniqueness rule, not the size.' },
      { t: 'It copies both', why: 'rustc reports E0382 if you use `m` after `let n = m;` with a `&mut`, which shows it moved.' },
    ],
  },
  {
    q: 'In the NLL RFC\'s model, an access meets a loan of the same place. When is that **not** an error?',
    options: [
      { t: 'When the access is a write and the loan is shared', why: 'Writing under a reader is exactly what must be stopped.' },
      { t: 'When the access is shallow', why: 'Shallowness changes which loans are relevant, not whether a write may overlap a loan.' },
      { t: 'Only when both the access and the loan are reads', correct: true, why: 'The RFC\'s `access_legal` skips a borrow only if `is_read && borrow.is_read`; every other pair reports an error.' },
    ],
  },
  {
    q: 'Our first checker rejects `let r = &v / use r / let m = &mut v`, but rustc accepts the Rust version. Why?',
    options: [
      { t: 'rustc ignores shared loans', why: 'It does not: add a use of `r` after the `&mut` and rustc reports E0502.' },
      { t: 'Our loans never end; rustc ends a loan after the last use of its reference', correct: true, why: 'That is non-lexical lifetimes, the subject of the next chapter.' },
      { t: 'rustc runs the program and sees no harm', why: 'The borrow checker never runs the program.' },
    ],
  },
];
