// Chapter 301 cards. Keys are stable ids: never rename them.

export const prompts = {
  'tu-what': {
    q: 'What two parts does a **tagged union** have?',
    a: 'A tag (discriminant) saying which variant it is, and a payload big enough for the largest variant, in which all the variants’ fields overlap.',
  },
  'tu-size': {
    q: 'Why is every value of a sum type the same size, even a variant with no fields?',
    a: 'So that values can sit side by side in an array, with element `i` at `i × size`, and be copied without knowing the variant.',
  },
  'tu-tag-first': {
    q: 'Why must code read the tag before the payload?',
    a: 'The payload’s bytes mean different things in different variants (and may hold leftovers), so only the tag says how to read them.',
  },
  'align-why': {
    q: 'What does it mean that a `u32` has alignment 4?',
    a: 'It must start at an address that is a multiple of 4, which is how processors load it fastest (or at all).',
  },
  'pad-where': {
    q: 'In `uint8_t tag; union { uint32_t side; ... }`, which bytes are padding, and why?',
    a: 'Bytes 1 to 3: the payload needs alignment 4, so it starts at byte 4, leaving a gap after the 1-byte tag.',
  },
  'rust-free': {
    q: 'What does Rust’s default enum layout promise, and when do you get the C-style rules?',
    a: 'Almost nothing beyond aligned fields, so rustc may reorder fields and choose the tag; `#[repr(C, u8)]` asks for a C-style tag-plus-union layout.',
  },
  'niche-what': {
    q: 'What is a **niche**?',
    a: 'A bit pattern that a type’s values never use, such as the null address for a reference or the byte 2 for a bool.',
  },
  'option-ref': {
    q: 'Why is `Option<&u8>` the same size as `&u8`?',
    a: 'A reference is never null, so `None` is stored as the all-zero address and no tag byte is needed.',
  },
  'no-niche': {
    q: 'Why is `Option<u32>` 8 bytes rather than 4?',
    a: 'Every one of a `u32`’s bit patterns is a valid number, so there is no niche; the tag needs its own space, padded to 4.',
  },
};

export const examples = {
  'shapes-in-bytes': {
    title: 'Three shapes in 36 bytes',
    code: `// Sh: tag in byte 0, payload at byte 4
const SIZE = 12;
const TAGS = ['Dot', 'Sq', 'Re'];
const buf = new ArrayBuffer(3 * SIZE);
const mem = new DataView(buf);

// write a little-endian u32
function u32(at, v) {
  mem.setUint32(at, v, true);
}

function put(i, s) {
  const at = i * SIZE;
  mem.setUint8(at, TAGS.indexOf(s.k));
  if (s.k === 'Sq') u32(at + 4, s.side);
  if (s.k === 'Re') {
    u32(at + 4, s.w);
    u32(at + 8, s.h);
  }
}

function area(i) {
  const at = i * SIZE;
  // read the tag first
  const tag = mem.getUint8(at);
  if (tag === 0) return 0;
  const a = mem.getUint32(at + 4, true);
  if (tag === 1) return a * a;
  const b = mem.getUint32(at + 8, true);
  return a * b;
}

put(0, { k: 'Sq', side: 5 });
put(1, { k: 'Re', w: 2, h: 3 });
put(2, { k: 'Dot' });
const bytes = new Uint8Array(buf);
for (let i = 0; i < 3; i++) {
  const s = i * SIZE;
  const b = bytes.slice(s, s + SIZE);
  console.log(b.join(' '), area(i));
}`,
  },
};

export const exercises = {
  'union-layout': {
    title: 'Compute a tagged union’s layout',
    prompt:
      'A sum type is given as a list of variants, each a list of its fields’ sizes in bytes (1, 2, 4 or 8; each field’s alignment equals its size). For example `Sh` is `[[], [4], [4, 4]]`. Using the C-style rules from the chapter, with a **1-byte tag**, write `layout(variants)`, returning `{ size, align, offset }`: the whole value’s size and alignment, and the payload’s offset. Each variant is laid out as a struct (each field at a multiple of its own size). `up(n, a)` is given.',
    starter: `function up(n, a) {
  return Math.ceil(n / a) * a;
}

function layout(variants) {
  // a 1-byte tag, then the union
  return { size: 0 };
}`,
    solution: `function up(n, a) {
  return Math.ceil(n / a) * a;
}

function layout(variants) {
  let align = 1;
  let big = 0;
  for (const fields of variants) {
    let size = 0;
    for (const f of fields) {
      size = up(size, f) + f;
      align = Math.max(align, f);
    }
    big = Math.max(big, size);
  }
  const offset = up(1, align);
  const size = up(offset + big, align);
  return { size, align, offset };
}`,
    tests: `test('Sh = Dot | Sq(u32) | Re(u32, u32)', () => {
  expect(layout([[], [4], [4, 4]])).toEqual({ size: 12, align: 4, offset: 4 });
});
test('a double moves the payload to 8', () => {
  expect(layout([[1], [8]])).toEqual({ size: 16, align: 8, offset: 8 });
});
test('only field-less variants: just the tag', () => {
  expect(layout([[], [], []])).toEqual({ size: 1, align: 1, offset: 1 });
});
test('X(u8) | Y(u16)', () => {
  expect(layout([[1], [2]])).toEqual({ size: 4, align: 2, offset: 2 });
});
test('X(u8, u8, u8) | Y(u16) rounds the size up', () => {
  expect(layout([[1, 1, 1], [2]])).toEqual({ size: 6, align: 2, offset: 2 });
});
test('X(f64, u8) | Y(u8)', () => {
  expect(layout([[8, 1], [1]])).toEqual({ size: 24, align: 8, offset: 8 });
});
test('padding inside a variant: X(u8, u32)', () => {
  expect(layout([[1, 4]])).toEqual({ size: 12, align: 4, offset: 4 });
});`,
    hints: [
      'Work out `Sh` by hand first: the tag is byte 0; where must a 4-byte field start? How big is the biggest variant? Then compare with the answer 12, 4, 4.',
      'You need two numbers from the variants: the largest field size anywhere (the alignment) and the largest variant size (the payload). A variant’s size comes from placing its fields one after another, each at `up(size, f)`.',
      'After the loop: `offset = up(1, align)`, because the payload must start at the first aligned position after the 1-byte tag; and `size = up(offset + big, align)`, so that the next value in an array is aligned too.',
    ],
    walkthrough: `**How to think about it.** Do one by hand before coding. For \`[[], [4], [4, 4]]\`: the tag takes byte 0; the most demanding field is 4 bytes, so the payload must start at a multiple of 4, which is byte 4; the biggest variant is \`Re\` with 8 bytes; so the payload runs from 4 to 12, and 12 is already a multiple of 4. The answer is size 12, alignment 4, offset 4, which is what clang and rustc reported. Writing the steps down in that order gives the program: find the alignment and the biggest variant, then place the payload, then round up.

**The solution, line by line.**

- \`function up(n, a) { return Math.ceil(n / a) * a; }\` is given: it rounds \`n\` up to the next multiple of \`a\` (\`up(5, 4)\` is 8, \`up(8, 4)\` stays 8).
- \`let align = 1;\` starts at 1, because the tag itself is one byte and needs no alignment; a type with no fields at all stays at 1.
- \`let big = 0;\` will hold the size of the biggest variant, which is the size of the union.
- \`for (const fields of variants) {\` looks at each variant in turn.
- \`let size = 0;\` lays out this variant as its own struct, starting at 0.
- \`for (const f of fields) { size = up(size, f) + f; ... }\` places each field: first move \`size\` up to a multiple of the field’s alignment (that gap is padding inside the variant), then add the field. For \`[1, 4]\` that is 0 + 1 = 1, then \`up(1, 4)\` = 4, plus 4 = 8.
- \`align = Math.max(align, f);\` remembers the most demanding field in the whole type.
- \`big = Math.max(big, size);\` keeps the largest variant. (Rounding each variant up to its own alignment is not needed here, because the final size is rounded up to an alignment at least as large.)
- \`const offset = up(1, align);\` puts the payload at the first aligned position after the 1-byte tag: 1 when everything is bytes, 2, 4 or 8 otherwise.
- \`const size = up(offset + big, align);\` ends the value after the payload and rounds up, so that in an array the next tag and payload are aligned too. For \`[[1, 1, 1], [2]]\` the payload ends at 2 + 3 = 5, which rounds up to 6.
- \`return { size, align, offset };\` returns the three numbers.

**Common wrong attempts.**

- Adding up the field sizes and putting the payload at byte 1 ignores alignment completely: \`Sh\` comes out as 9 bytes, and its fields would start at odd addresses.
- Forgetting the final round-up gives \`X(u8, u8, u8) | Y(u16)\` a size of 5; in an array of them the second element’s \`u16\` would start at an odd address.`,
    wrong: [
      {
        code: `function up(n, a) {
  return Math.ceil(n / a) * a;
}

function layout(variants) {
  let big = 0;
  for (const fields of variants) {
    let size = 0;
    for (const f of fields) size += f;
    big = Math.max(big, size);
  }
  const size = 1 + big;
  return { size, align: 1, offset: 1 };
}`,
        why: 'It ignores alignment: no padding after the tag and none between fields, so `Sh` is reported as 9 bytes instead of 12.',
      },
      {
        code: `function up(n, a) {
  return Math.ceil(n / a) * a;
}

function layout(variants) {
  let align = 1;
  let big = 0;
  for (const fields of variants) {
    let size = 0;
    for (const f of fields) {
      size = up(size, f) + f;
      align = Math.max(align, f);
    }
    big = Math.max(big, size);
  }
  const offset = up(1, align);
  const size = offset + big;
  return { size, align, offset };
}`,
        why: 'The last step does not round the size up to the alignment, so `X(u8, u8, u8) | Y(u16)` is 5 bytes instead of 6, and `X(f64, u8) | Y(u8)` is 17 instead of 24.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'A C-style tagged union has a 1-byte tag and variants `A(u8)` and `B(f64)`. Where does the payload start?',
    options: [
      { t: 'At byte 1, straight after the tag', why: 'A `f64` must start at a multiple of 8, so byte 1 is not allowed.' },
      { t: 'At byte 8', correct: true, why: 'The payload is aligned like its most demanding field, 8, so bytes 1 to 7 are padding (clang reported 16 bytes in all).' },
      { t: 'At byte 9, after the biggest variant', why: 'All variants share the same payload bytes; they are not placed one after another.' },
    ],
  },
  {
    q: 'What is in bytes 8 to 11 of the 12-byte `Sh` when it holds `Sq(5)`?',
    options: [
      { t: 'Zeros, always', why: 'Nothing writes them for `Sq`; they keep whatever was there before.' },
      { t: 'A copy of the side', why: 'The side is stored once, in bytes 4 to 7.' },
      { t: 'Whatever was there before: they belong to no field of `Sq`', correct: true, why: 'Only the tag says which bytes are meaningful, which is why it is read first.' },
    ],
  },
  {
    q: 'Which of these Rust types is bigger than the type inside it?',
    options: [
      { t: '`Option<u32>`', correct: true, why: 'Every bit pattern of a `u32` is valid, so there is no niche; it is 8 bytes against 4.' },
      { t: '`Option<&u8>`', why: 'The null address is a niche, so it is 8 bytes, like `&u8`.' },
      { t: '`Option<bool>`', why: 'A bool uses only 0 and 1, so None fits in the same byte.' },
    ],
  },
  {
    q: 'How does OCaml represent a variant that has no fields, such as `A` in `type t = A | B of string`?',
    options: [
      { t: 'As a heap block with tag 0 and no fields', why: 'Only variants with fields become blocks; field-less ones are not allocated at all.' },
      { t: 'As an immediate (unboxed) integer, its number among the field-less variants', correct: true, why: 'The manual: “A constant constructor is represented by the unboxed integer equal to its constructor number.”' },
      { t: 'As a null pointer', why: 'OCaml numbers its constant constructors 0, 1, 2 …, so several of them can exist; one null would not be enough.' },
    ],
  },
  {
    q: 'Why does `size` get rounded up to the alignment at the end of the layout?',
    options: [
      { t: 'To leave room for a second tag', why: 'There is only one tag per value.' },
      { t: 'Because processors can only copy whole words', why: 'Copying is not the reason; the next element’s alignment is.' },
      { t: 'So that in an array, the next element starts at a correctly aligned address', correct: true, why: 'Element `i` sits at `i × size`, so `size` must be a multiple of the alignment.' },
    ],
  },
];
