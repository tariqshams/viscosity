// Chapter 275 cards. Keys are stable ids: never rename them.

export const prompts = {
  'dict-what': {
    q: 'In dictionary passing, what is the dictionary?',
    a: 'A record of the operations (such as `lt` or `show`) for one type, passed as a hidden extra argument.',
  },
  'dict-who': {
    q: 'In Haskell or Rust, who chooses which dictionary a call gets?',
    a: 'The type checker, from the types it works out for that call.',
  },
  'dict-build': {
    q: 'How does a compiler get a dictionary for “lists of numbers” when nobody wrote one?',
    a: 'A rule like “lists of `a` have `<` if `a` does” is a function from dictionaries to dictionaries; it is called with the number dictionary.',
  },
  'fat-what': {
    q: 'What two words make up a fat pointer?',
    a: 'The address of the data and the address of the table of operations (vtable) for its type.',
  },
  'fat-why': {
    q: 'What does putting the table in the pointer, not the object, make possible?',
    a: 'The object needs no vptr, so any value can be viewed through any interface or trait it implements.',
  },
  'go-24': {
    q: 'In Go’s itab, what comes before `Fun[0]`, putting it 24 bytes in?',
    a: 'The interface type, the concrete type and a hash.',
  },
  'itable-what': {
    q: 'What is an itable?',
    a: 'A per-class table that maps each interface the class implements to that interface’s methods for the class.',
  },
  invokeinterface: {
    q: 'Which JVM instruction calls a method through an interface type, and which through a class type?',
    a: '`invokeinterface` for an interface; `invokevirtual` for a class.',
  },
};

export const examples = {
  'fat-pointers': {
    title: 'Fat pointers in JavaScript',
    code: `// one table per (interface, type)
const sqT = { area: (s) => s.w ** 2 };
const ciT = {
  area: (c) => 3 * c.r ** 2,
};
// fat pointers: [data, table]
const xs = [
  [{ w: 2 }, sqT],
  [{ r: 1 }, ciT],
];
let total = 0;
for (const [data, vt] of xs) {
  total += vt.area(data);
}
console.log(total);`,
  },
};

export const exercises = {
  'show-dicts': {
    title: 'Dictionaries from dictionaries',
    prompt:
      'A `Show` dictionary is an object `{ show }`, where `show(x)` turns a value of one type into a string; for example `{ show: (n) => String(n) }` for numbers. Write two functions that **build** dictionaries from dictionaries, as a type checker would for compound types:\n\n- `showList(d)` returns a dictionary for lists whose elements `d` can show: `[1, 2]` becomes `\'[1, 2]\'` (elements joined with a comma and a space, inside square brackets; `[]` for an empty list).\n- `showPair(da, db)` returns a dictionary for two-element arrays `[a, b]`, shown as `\'(a, b)\'`, using `da` for the first and `db` for the second.\n\nAlways use the dictionaries you are given to show the parts.',
    starter: `function showList(d) {
  return { show: (xs) => '' };
}
function showPair(da, db) {
  return { show: (p) => '' };
}`,
    solution: `function showList(d) {
  return {
    show: (xs) =>
      '[' + xs.map(d.show).join(', ') +
      ']',
  };
}
function showPair(da, db) {
  return {
    show: ([a, b]) =>
      \`(\${da.show(a)}, \${db.show(b)})\`,
  };
}`,
    tests: `const num = { show: (n) => String(n) };
const quote = { show: (s) => '"' + s + '"' };
test('a list of numbers', () => {
  expect(showList(num).show([1, 2]))
    .toBe('[1, 2]');
});
test('an empty list', () => {
  expect(showList(num).show([])).toBe('[]');
});
test('it uses the element dictionary', () => {
  expect(showList(quote).show(['a', 'b']))
    .toBe('["a", "b"]');
});
test('a list of lists', () => {
  const d = showList(showList(num));
  expect(d.show([[1], [2, 3]]))
    .toBe('[[1], [2, 3]]');
});
test('a pair of a number and a list', () => {
  const d = showPair(num, showList(num));
  expect(d.show([1, [2]])).toBe('(1, [2])');
});`,
    hints: [
      'Each function returns an object with one property, `show`, which is a function. Inside it, you may only show the parts by calling the dictionaries you were given.',
      'For a list: show every element with `d.show`, join the results with `\', \'`, and put square brackets round them.',
      '`show: (xs) => \'[\' + xs.map(d.show).join(\', \') + \']\'`; for a pair, `show: ([a, b]) =>` a template literal holding `(`, then `da.show(a)`, a comma and space, `db.show(b)` and `)`.',
    ],
    walkthrough: `**How to think about it.** This is the step the type checker takes in the chapter's diagram, where \`ordList(ordNum)\` was built rather than written. A dictionary for a compound type (a list of something, a pair of two things) is assembled from the dictionaries of its parts, so each function takes dictionaries in and hands one dictionary out. Inside, it must not assume what the parts are: \`showList\` cannot call \`String\` on the elements, because the elements might be strings that need quotes, or lists that need their own brackets. The only correct way to show a part is to ask the dictionary for that part.

**The solution, line by line.**

- \`function showList(d) {\` takes the dictionary for the element type.
- \`return {\` builds and returns a new dictionary: an object with a single operation.
- \`show: (xs) =>\` is that operation; it receives a whole list.
- \`'[' + xs.map(d.show).join(', ') + ']',\` shows every element with the element dictionary (\`xs.map(d.show)\` gives an array of strings), joins them with a comma and a space, and wraps the result in brackets. An empty list maps to an empty array, which joins to the empty string, giving \`[]\` with no special case.
- \`function showPair(da, db) {\` takes two dictionaries, one per position, because a pair's two halves can be of different types.
- \`show: ([a, b]) =>\` takes the pair apart into its two elements with array destructuring.
- The template literal that follows shows the first half with \`da.show(a)\` and the second with \`db.show(b)\`, and puts them between \`(\`, a comma and a space, and \`)\`.

Now follow \`showList(showList(num))\` on \`[[1], [2, 3]]\`: the outer dictionary maps the inner list dictionary's \`show\` over two lists, each of which maps \`num.show\` over its numbers, giving \`[1]\` and \`[2, 3]\`, which the outer one joins and brackets. The nesting of dictionaries mirrors the nesting of the type, exactly as \`Ord (list a)\` did in the chapter.

**Common wrong attempts.**

- Showing elements with \`String(x)\` or \`xs.join(', ')\` ignores \`d\`. It happens to work for a flat list of numbers, but a list of lists prints \`[1, 2,3]\` and strings lose their quotes.
- Swapping the dictionaries in \`showPair\` (\`db.show(a)\`) uses the list dictionary on a number, which fails, because each dictionary only knows its own type.`,
    wrong: [
      {
        code: `function showList(d) {
  return {
    show: (xs) =>
      '[' + xs.join(', ') + ']',
  };
}
function showPair(da, db) {
  return {
    show: ([a, b]) =>
      \`(\${da.show(a)}, \${db.show(b)})\`,
  };
}`,
        why: 'It never uses `d`, so strings lose their quotes and nested lists lose their brackets.',
      },
      {
        code: `function showList(d) {
  return {
    show: (xs) =>
      '[' + xs.map(d.show).join(', ') +
      ']',
  };
}
function showPair(da, db) {
  return {
    show: ([a, b]) =>
      \`(\${db.show(a)}, \${da.show(b)})\`,
  };
}`,
        why: 'The pair’s dictionaries are swapped, so the list dictionary is asked to show a number.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Why can a single-inheritance vtable not serve a class that implements two unrelated interfaces?',
    options: [
      { t: 'Interfaces have no methods to put in slots', why: 'They declare methods; the problem is where to number them.' },
      { t: 'Each interface numbers its methods from slot 0, so the two interfaces’ methods would need the same slot', correct: true, why: 'With no single parent to extend, the prefix trick fails; slots would clash or tables would be mostly empty.' },
      { t: 'Vtables can only hold methods of the class itself', why: 'They hold inherited methods too; the clash is between two separate numberings.' },
    ],
  },
  {
    q: 'With dictionary passing, what does a compiler pass to `max` for a call on two lists of strings?',
    options: [
      { t: 'Nothing: lists already know how to compare themselves', why: 'Values carry no operations in this scheme; the operations come in the dictionary.' },
      { t: 'The string dictionary, `ordStr`', why: 'That compares strings; the arguments are lists, so a list dictionary is needed.' },
      { t: 'A list dictionary built from the string one: `ordList(ordStr)`', correct: true, why: 'The rule for lists is a function from the element dictionary to a list dictionary.' },
      { t: 'A copy of `max` written for lists', why: 'That is specialisation, the other strategy (chapter 276); dictionary passing keeps one `max`.' },
    ],
  },
  {
    q: 'How big is a Rust `&dyn Area` on a 64-bit machine?',
    options: [
      { t: 'One word: a pointer to the value', why: 'That is a plain `&Sq`; a `&dyn` also needs the vtable.' },
      { t: 'Two words: the data pointer and the vtable pointer', correct: true, why: 'It is a fat pointer; `mk` returned it in two registers, `rax` and `rdx`.' },
      { t: 'The size of the value plus one word', why: 'The value stays where it is; only pointers are copied.' },
      { t: 'It depends on how many methods the trait has', why: 'The table grows with the trait, but the pointer to it is always one word.' },
    ],
  },
  {
    q: '`javap -c` shows `invokeinterface` for a call through an `Area`. What must HotSpot find at run time that `invokevirtual` does not need?',
    options: [
      { t: 'Where the `Area` methods are in this object’s class, via its itable', correct: true, why: 'A class can implement many interfaces in any order, so the interface’s methods are looked up per class.' },
      { t: 'The object’s field offsets', why: 'Both calls only need the method; fields are not involved.' },
      { t: 'Whether the class is final', why: 'That can help optimisers, but it is not what an interface call must find.' },
    ],
  },
  {
    q: 'C++ keeps the vptr inside the object; Rust and Go keep the table beside the pointer. What does the Rust and Go choice allow?',
    options: [
      { t: 'Faster calls, because there is one fewer load', why: 'Both do a load of the table entry; the difference is where the table address comes from.' },
      { t: 'Objects that change class at run time', why: 'Neither language allows that; the gain is about interfaces.' },
      { t: 'Interfaces with no methods', why: 'Those exist in all three languages.' },
      { t: 'Any value, even a plain number or struct, can be used through an interface without a vptr in its layout', correct: true, why: 'The table is only attached when a pointer to the value is turned into a `&dyn` or an interface value.' },
    ],
  },
];
