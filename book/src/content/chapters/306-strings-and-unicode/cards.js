// Chapter 306 cards. Keys are stable ids: never rename them.

export const prompts = {
  'uni-what': {
    q: 'What is a Unicode **code point**?',
    a: 'The number Unicode gives a character, written U+ and hexadecimal, such as U+0041 for A.',
  },
  'uni-range': {
    q: 'What is the largest Unicode code point?',
    a: 'U+10FFFF (1,114,111), which needs 21 bits.',
  },
  'enc-ascii': {
    q: 'Why is a plain ASCII file already valid UTF-8?',
    a: 'UTF-8 stores every code point below 128 as that single byte, unchanged.',
  },
  'enc-pair': {
    q: 'Why is `\'👍\'.length` 2 in JavaScript?',
    a: 'Strings are UTF-16 code units, and U+1F44D is above U+FFFF, so it takes a surrogate pair of two units.',
  },
  'enc-rust': {
    q: 'What does Rust\'s `s.len()` count, and how do you count characters instead?',
    a: 'Bytes of UTF-8; `s.chars().count()` counts code points.',
  },
  'gr-what': {
    q: 'What is a **grapheme cluster**? Give an example made of several code points.',
    a: 'What a reader sees as one character, such as a flag (two regional indicators) or e followed by a combining accent.',
  },
  'rope-what': {
    q: 'What does joining two ropes cost?',
    a: 'One new node pointing at both, with their total length: no characters are copied.',
  },
  'rope-v8': {
    q: 'What does V8 call the rope node it makes for `a + b`?',
    a: 'A ConsString: a pair of pointers to two other strings.',
  },
};

export const examples = {
  rope: {
    title: 'A tiny rope',
    code: `const leaf = (s) =>
  ({ s, n: s.length });
const cat = (l, r) =>
  ({ l, r, n: l.n + r.n });
function at(t, i) {
  while (t.l) {
    if (i < t.l.n) t = t.l;
    else { i -= t.l.n; t = t.r; }
  }
  return t.s[i];
}
const t = cat(cat(leaf('hello, '),
  leaf('world')), leaf('!'));
console.log(t.n, at(t, 7), at(t, 12));`,
  },
};

export const exercises = {
  utf8: {
    title: 'A UTF-8 encoder',
    prompt:
      'Write `utf8(cp)`, which takes a code point (a number from 0 to 0x10FFFF) and returns its UTF-8 encoding as an array of byte values (numbers from 0 to 255). Use the table from the chapter: below 0x80 one byte; below 0x800 two; below 0x10000 three; otherwise four. For example `utf8(0xE9)` is `[0xC3, 0xA9]`.',
    starter: `function utf8(cp) {
  return [cp & 0xff];
}`,
    solution: `function utf8(cp) {
  const tail = (k) =>
    0x80 | ((cp >> (6 * k)) & 0x3f);
  if (cp < 0x80) return [cp];
  if (cp < 0x800) {
    return [0xc0 | (cp >> 6), tail(0)];
  }
  if (cp < 0x10000) {
    return [0xe0 | (cp >> 12),
      tail(1), tail(0)];
  }
  return [0xf0 | (cp >> 18),
    tail(2), tail(1), tail(0)];
}`,
    tests: `test('ASCII is one byte', () => {
  expect(utf8(0x41)).toEqual([0x41]);
  expect(utf8(0x7f)).toEqual([0x7f]);
});
test('é is two bytes', () => {
  expect(utf8(0xe9)).toEqual([0xc3, 0xa9]);
  expect(utf8(0x80)).toEqual([0xc2, 0x80]);
});
test('€ is three bytes', () => {
  expect(utf8(0x20ac))
    .toEqual([0xe2, 0x82, 0xac]);
  expect(utf8(0xffff))
    .toEqual([0xef, 0xbf, 0xbf]);
});
test('👍 is four bytes', () => {
  expect(utf8(0x1f44d))
    .toEqual([0xf0, 0x9f, 0x91, 0x8d]);
  expect(utf8(0x10000))
    .toEqual([0xf0, 0x90, 0x80, 0x80]);
});
test('the largest code point', () => {
  expect(utf8(0x10ffff))
    .toEqual([0xf4, 0x8f, 0xbf, 0xbf]);
});`,
    hints: [
      'First decide how many bytes you need by comparing `cp` with 0x80, 0x800 and 0x10000. Then fill in the bits.',
      'Every byte after the first is `0x80 | six bits`. The six bits are `(cp >> 6 * k) & 0x3f` for k = 0 (the lowest six), 1, 2. The first byte is a marker (`0xc0`, `0xe0` or `0xf0`) ORed with whatever bits are left at the top.',
      'For three bytes: `[0xe0 | (cp >> 12), 0x80 | ((cp >> 6) & 0x3f), 0x80 | (cp & 0x3f)]`. The two- and four-byte cases follow the same pattern with shifts of 6 and 18.',
    ],
    walkthrough: `**How to think about it.** Look at the table as a set of boxes to fill. Each row says how many bytes a range of code points gets, and which bits in each byte are fixed markers (the leading 1s and the 0 after them) and which are free (the x's). The free bits, read left to right across the bytes, are the code point's own bits. So the job is: pick the row, then cut the code point into a top piece and six-bit pieces, and glue markers on. Cutting uses the bit operators from chapter 34: \`cp >> 6\` drops the lowest six bits, and \`& 0x3f\` (binary 111111) keeps only the lowest six.

**The solution, line by line.**

- \`const tail = (k) => 0x80 | ((cp >> (6 * k)) & 0x3f);\` builds one continuation byte: shift the code point right by 6k bits so the wanted group is at the bottom, keep six bits, and OR in \`0x80\` (binary 10000000), the "10" marker. \`tail(0)\` is the lowest group, \`tail(1)\` the next, \`tail(2)\` the one above.
- \`if (cp < 0x80) return [cp];\` the one-byte row: the code point itself, so ASCII is unchanged.
- \`if (cp < 0x800) { return [0xc0 | (cp >> 6), tail(0)]; }\` two bytes: the first carries the bits above the lowest six, behind the marker 110 (\`0xc0\` is 11000000). For \`0xE9\`: \`0xE9 >> 6\` is 3, so the first byte is \`0xC3\`; the low six bits are \`0x29\`, so the second is \`0xA9\`.
- \`if (cp < 0x10000) { return [0xe0 | (cp >> 12), tail(1), tail(0)]; }\` three bytes, marker 1110 (\`0xe0\`), with the top four bits in the first byte.
- \`return [0xf0 | (cp >> 18), tail(2), tail(1), tail(0)];\` four bytes, marker 11110 (\`0xf0\`), with the top three bits first. For \`0x1F44D\` that gives F0 9F 91 8D, the bytes Node printed.

**Common wrong attempts.**

- Forgetting \`& 0x3f\` in the middle bytes leaves the higher bits in place, so a "byte" can come out bigger than 255.
- Using \`<=\` at the boundaries (\`cp <= 0x80\`) puts 0x80 in one byte, but 0x80 already needs two: one byte only holds seven bits of code point.
- Putting the low bits first (\`[tail(0), ...]\`) reverses the order; UTF-8 always starts with the highest bits, so the first byte can say how long the sequence is.`,
    wrong: [
      {
        code: `function utf8(cp) {
  if (cp < 0x80) return [cp];
  if (cp < 0x800) {
    return [0xc0 | (cp >> 6),
      0x80 | cp];
  }
  if (cp < 0x10000) {
    return [0xe0 | (cp >> 12),
      0x80 | (cp >> 6), 0x80 | cp];
  }
  return [0xf0 | (cp >> 18),
    0x80 | (cp >> 12),
    0x80 | (cp >> 6), 0x80 | cp];
}`,
        why: 'Without `& 0x3f` the continuation bytes keep the higher bits, so they are wrong (often bigger than 255).',
      },
      {
        code: `function utf8(cp) {
  const tail = (k) =>
    0x80 | ((cp >> (6 * k)) & 0x3f);
  if (cp <= 0x80) return [cp];
  if (cp <= 0x800) {
    return [0xc0 | (cp >> 6), tail(0)];
  }
  if (cp < 0x10000) {
    return [0xe0 | (cp >> 12),
      tail(1), tail(0)];
  }
  return [0xf0 | (cp >> 18),
    tail(2), tail(1), tail(0)];
}`,
        why: '0x80 is encoded as one byte, but one byte holds only seven bits of code point; it needs C2 80.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Which of these counts UTF-16 code units?',
    options: [
      { t: 'Python\'s `len(s)`', why: 'Python counts code points (PEP 393 stores 1, 2 or 4 bytes per character to keep that fast).' },
      { t: 'JavaScript\'s `s.length`', correct: true, why: 'A JavaScript string is a sequence of UTF-16 code units.' },
      { t: 'Rust\'s `s.len()`', why: 'That counts UTF-8 bytes.' },
      { t: '`[...new Intl.Segmenter().segment(s)].length`', why: 'That counts grapheme clusters.' },
    ],
  },
  {
    q: 'How many bytes does UTF-8 use for `€` (U+20AC)?',
    options: [
      { t: '1', why: 'Only code points below 0x80 fit in one byte.' },
      { t: '2', why: 'Two bytes cover up to 0x7FF; 0x20AC is bigger.' },
      { t: '3', correct: true, why: 'It is in 0800–FFFF: E2 82 AC.' },
      { t: '4', why: 'Four bytes are for code points from 0x10000 up.' },
    ],
  },
  {
    q: 'Why are `\'e\\u0301\'` and `\'\\u00e9\'` not `===` in JavaScript, though both show é?',
    options: [
      { t: 'They are different sequences of code points; normalize() makes them equal', correct: true, why: 'One is e plus a combining accent, the other a single code point.' },
      { t: 'One of them is UTF-8 and the other UTF-16', why: 'Both are JavaScript strings, so both are UTF-16.' },
      { t: '=== compares strings by identity', why: 'It compares strings by contents.' },
      { t: 'JavaScript cannot store accents', why: 'It stores every Unicode code point.' },
    ],
  },
  {
    q: 'In a rope, how is character `i` found?',
    options: [
      { t: 'By flattening the whole rope first, every time', why: 'That would throw away the point of a rope; flattening is an occasional choice.' },
      { t: 'By searching every leaf from the left until the character appears', why: 'The lengths in the nodes let you skip whole subtrees.' },
      { t: 'It cannot be: ropes only support joining', why: 'Lookup by walking down is the other basic operation.' },
      { t: 'By walking down: left if i is less than the left length, otherwise right with that length subtracted', correct: true, why: 'Each node records its length for exactly this.' },
    ],
  },
  {
    q: 'A flag emoji such as 🇬🇧 is how many grapheme clusters, code points and UTF-16 units?',
    options: [
      { t: '1, 1, 2', why: 'A flag is two regional indicator code points.' },
      { t: '1, 2, 4', correct: true, why: 'One visible flag, two code points, each needing a surrogate pair.' },
      { t: '2, 2, 2', why: 'Intl.Segmenter counts the flag as one grapheme.' },
      { t: '2, 4, 8', why: 'Eight is its UTF-8 byte count, not its UTF-16 units.' },
    ],
  },
];
