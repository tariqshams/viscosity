// Chapter 293 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'nb-47': {
    q: 'Why can a 64-bit NaN-boxing engine such as SpiderMonkey keep an object pointer in only 47 bits on x86-64?',
    a: 'With 4-level paging, user-space virtual addresses fit in 47 bits (the top bits are zero), and the engine allocates its memory there, so the bits above are free for a tag.',
  },
  'nb-57': {
    q: 'What would 5-level paging (56-bit user addresses) break in a NaN-boxing scheme with a 47-bit payload, and how does Linux avoid it?',
    a: 'A pointer above 2⁴⁷ would overlap the tag bits. Linux only hands out addresses above 47 bits when a program asks with a high hint to mmap, so large addresses are opt-in.',
  },
  'nb-isdouble': {
    q: 'In SpiderMonkey\'s 64-bit Value layout, how is "is this Value a double?" tested?',
    a: 'With one unsigned compare: the bits are at most `0xfff80000ffffffff`, because every non-double tag sits above every double pattern, NaNs included.',
  },
  'nb-trace': {
    q: 'How do self-describing values such as NaN-boxed ones help a tracing garbage collector?',
    a: 'Each slot\'s tag says whether it holds a pointer, so the marker can scan any stack slot or field and know whether to follow it, without a separate map of pointer locations.',
  },
  'gb-roots': {
    q: 'In a VM whose locals live on its own stack and whose globals are in a table the VM owns, why do stores to locals and globals need no generational write barrier?',
    a: 'The stack and the globals table are roots, which every minor collection scans anyway, so a young object they point at is found without any record.',
  },
  'gb-close': {
    q: 'Why does closing an upvalue (copying a captured variable from the stack into its heap upvalue object) need a generational write barrier?',
    a: 'The upvalue object may have been allocated long before and promoted, while the value copied in may be young: an old-to-young pointer created with no assignment in the source program.',
  },
  'gb-bit': {
    q: 'What is a **remembered bit** in a generational write barrier for?',
    a: 'It marks an object already in the remembered set, so later old-to-young stores into the same object stop at the bit instead of adding a duplicate entry.',
  },
  'gb-cost': {
    q: 'Where does a generational write barrier usually spend its time: checking stores, or recording entries?',
    a: 'Checking: it runs on every reference store, while only a small fraction of stores are old-to-young, and a remembered bit makes most of those a no-op too.',
  },
  'gb-clear': {
    q: 'In a collector that promotes every survivor of a minor collection, why may the remembered set be emptied after each one?',
    a: 'After it, no young objects remain, so no old object can point at a young one until a new store makes such a pointer, which the barrier will record again.',
  },
  'gb-young': {
    q: 'Why may a compiler skip the generational barrier on a store into an object it has just allocated?',
    a: 'A fresh object is young, so a minor collection traces it anyway; it is only safe while nothing can allocate (and so trigger a collection that promotes it) between the allocation and the store.',
  },
};

export const examples = {
  remembered: {
    title: 'A barrier with a remembered bit',
    code: `// Survive one minor collection: old.
let young = [];
const rem = [];
let checks = 0, o2y = 0;

function alloc(o) {
  o.old = false;
  o.bit = false;
  young.push(o);
  return o;
}
// The write barrier.
function store(owner, i, v) {
  owner.items[i] = v;
  checks++;
  if (typeof v !== 'object' || !v)
    return;            // not a pointer
  if (!owner.old || v.old) return;
  o2y++;
  if (owner.bit) return; // remembered
  owner.bit = true;
  rem.push(owner);
}
// Everything young survives here.
function minor() {
  for (const o of young) o.old = true;
  young = [];
  for (const o of rem) o.bit = false;
  rem.length = 0;
}

const list = alloc({ items: [] });
minor();               // list is old
let entries = 0;
for (let i = 0; i < 5000; i++) {
  store(list, i, alloc({ items: [i] }));
  if (i % 1000 === 999) {
    entries += rem.length;
    minor();
  }
}
for (let i = 0; i < 5000; i++)
  store(list, i, i * 2); // numbers
console.log('checks', checks);
console.log('old-to-young', o2y);
console.log('entries', entries);`,
  },
};

export const exercises = {
  punbox: {
    title: 'SpiderMonkey’s 64-bit Values',
    prompt: 'Values are 64-bit BigInts laid out as in SpiderMonkey\'s PUNBOX64: any pattern up to `MAX_DOUBLE` is a double; above it, bits 63 to 47 hold a tag (`TAG_INT32` or `TAG_OBJECT`; anything else is `\'other\'`) and the 47 bits below hold the payload. Write `boxInt32(i)` (the tag shifted by `SHIFT`, OR the 32 bits of `i` read as unsigned), `boxObject(addr)` (throw a `RangeError` if the BigInt `addr` does not fit in 47 bits, or is negative), `kindOf(bits)` (`\'double\'`, `\'int32\'`, `\'object\'` or `\'other\'`), `unboxInt32(bits)` (a Number, sign included) and `unboxObject(bits)`, which XORs with the shifted object tag, as SpiderMonkey does. `doubleBits(d)` is given.',
    starter: `const SHIFT = 47n;
const TAG_INT32 = 0x1fff2n;
const TAG_OBJECT = 0x1fffcn;
const MAX_DOUBLE = 0xfff80000ffffffffn;
function doubleBits(d) {
  const v = new DataView(
    new ArrayBuffer(8));
  v.setFloat64(0, d);
  return v.getBigUint64(0);
}
function boxInt32(i) { return 0n; }
function boxObject(addr) { return 0n; }
function kindOf(bits) {
  return 'other';
}
function unboxInt32(bits) { return 0; }
function unboxObject(bits) {
  return 0n;
}`,
    solution: `const SHIFT = 47n;
const TAG_INT32 = 0x1fff2n;
const TAG_OBJECT = 0x1fffcn;
const MAX_DOUBLE = 0xfff80000ffffffffn;
function doubleBits(d) {
  const v = new DataView(
    new ArrayBuffer(8));
  v.setFloat64(0, d);
  return v.getBigUint64(0);
}
function boxInt32(i) {
  return (TAG_INT32 << SHIFT) |
    BigInt(i >>> 0);
}
function boxObject(addr) {
  if (addr < 0n || addr >> SHIFT)
    throw new RangeError('too wide');
  return (TAG_OBJECT << SHIFT) | addr;
}
function kindOf(bits) {
  if (bits <= MAX_DOUBLE)
    return 'double';
  const tag = bits >> SHIFT;
  if (tag === TAG_INT32) return 'int32';
  if (tag === TAG_OBJECT)
    return 'object';
  return 'other';
}
function unboxInt32(bits) {
  return Number(
    BigInt.asIntN(32, bits));
}
function unboxObject(bits) {
  return bits ^ (TAG_OBJECT << SHIFT);
}`,
    tests: `const A = 0x7f1234567890n;
test('int32s get the tag fff9', () => {
  expect(boxInt32(5))
    .toBe(0xfff9000000000005n);
  expect(boxInt32(-1))
    .toBe(0xfff90000ffffffffn);
});
test('objects get the tag fffe', () => {
  expect(boxObject(A))
    .toBe(0xfffe7f1234567890n);
});
test('a 48-bit address does not fit', () => {
  expect(() => boxObject(1n << 47n))
    .toThrow();
  expect(() => boxObject(-1n)).toThrow();
});
test('doubles, NaNs included', () => {
  expect(kindOf(doubleBits(1.5)))
    .toBe('double');
  expect(kindOf(doubleBits(-Infinity)))
    .toBe('double');
  expect(kindOf(doubleBits(NaN)))
    .toBe('double');
  expect(kindOf(0xfff8000000000000n))
    .toBe('double');
});
test('tags are told apart', () => {
  expect(kindOf(boxInt32(7))).toBe('int32');
  expect(kindOf(boxObject(A))).toBe('object');
  expect(kindOf(0xfffa000000000000n))
    .toBe('other');
});
test('round trips', () => {
  expect(unboxInt32(boxInt32(-7))).toBe(-7);
  expect(unboxInt32(boxInt32(42))).toBe(42);
  expect(unboxObject(boxObject(A))).toBe(A);
});`,
    hints: [
      'A tag goes on top with `tag << SHIFT`, and the payload is ORed in below it. For an int32, `i >>> 0` gives its 32 bits as an unsigned Number, and `BigInt(...)` turns that into a BigInt you can OR in.',
      'An address fits in 47 bits exactly when shifting it right by 47 leaves zero: `addr >> SHIFT` is `0n`, which is falsy. Test that, and that it is not negative, before boxing.',
      '`kindOf` asks the double question first (`bits <= MAX_DOUBLE`), and only then looks at the tag, `bits >> SHIFT`. To unbox an int32, `BigInt.asIntN(32, bits)` keeps the low 32 bits as a signed number; `Number(...)` turns it back into an ordinary number.',
    ],
    walkthrough: `**How to think about it.** A boxed Value is two fields packed into one 64-bit integer: a tag on top, a payload below, with the boundary at bit 47. Packing is a shift and an OR; unpacking is a shift (for the tag) and either a mask, a sign-extension or an XOR (for the payload). The one twist is that doubles are not tagged at all: they are stored as their own bits, and the tags were chosen so that every boxed pattern is numerically larger than every double, NaNs included. So the first question about any Value is a single comparison.

**The solution, line by line.**

- The four constants are SpiderMonkey's: \`SHIFT\` is \`JSVAL_TAG_SHIFT\`, the two tags are \`JSVAL_TAG_INT32\` and \`JSVAL_TAG_OBJECT\`, and \`MAX_DOUBLE\` is the largest pattern still read as a double.
- \`return (TAG_INT32 << SHIFT) | BigInt(i >>> 0);\` puts \`0x1fff2\` in bits 63 to 47 (which reads as \`fff9\` at the top) and the integer's 32 bits at the bottom. \`>>> 0\` matters for negative numbers: \`-1 >>> 0\` is \`4294967295\`, so \`-1\` becomes \`ffffffff\` in the low word rather than a negative BigInt, which would set every bit.
- \`if (addr < 0n || addr >> SHIFT) throw new RangeError('too wide');\` refuses any address that needs bit 47 or above, the 5-level-paging case; \`addr >> SHIFT\` is \`0n\` (falsy) exactly when the address fits.
- \`return (TAG_OBJECT << SHIFT) | addr;\` puts \`fffe\` on top and the pointer below.
- \`if (bits <= MAX_DOUBLE) return 'double';\` is the one-compare test: \`1.5\`, \`-Infinity\` and both kinds of NaN are all at or below the line.
- \`const tag = bits >> SHIFT;\` shifts the payload away, leaving the 17-bit tag, which the two \`if\`s compare.
- \`return Number(BigInt.asIntN(32, bits));\` keeps the low 32 bits and reads them as signed, so \`ffffffff\` comes back as \`-1\`.
- \`return bits ^ (TAG_OBJECT << SHIFT);\` cancels the tag bits, since \`x ^ x\` is 0, leaving the address. On a Value with a different tag the XOR would leave some high bits set, which is why SpiderMonkey prefers it to a mask.

**Common wrong attempts.**

- Leaving out the double check and testing only the tags: a double such as \`-Infinity\` (\`fff0...\`) shifted right by 47 gives \`0x1ffe0\`, which is not a tag, so it comes back as \`'other'\`.
- Writing \`BigInt(i)\` instead of \`BigInt(i >>> 0)\`: a negative \`i\` becomes a negative BigInt, and ORing it in sets all 64 bits.
- Checking \`addr > 1n << SHIFT\` instead of \`>=\`: the address \`2⁴⁷\` itself needs 48 bits and slips through.`,
    wrong: [
      {
        code: `const SHIFT = 47n;
const TAG_INT32 = 0x1fff2n;
const TAG_OBJECT = 0x1fffcn;
const MAX_DOUBLE = 0xfff80000ffffffffn;
function doubleBits(d) {
  const v = new DataView(
    new ArrayBuffer(8));
  v.setFloat64(0, d);
  return v.getBigUint64(0);
}
function boxInt32(i) {
  return (TAG_INT32 << SHIFT) |
    BigInt(i);
}
function boxObject(addr) {
  if (addr < 0n || addr >> SHIFT)
    throw new RangeError('too wide');
  return (TAG_OBJECT << SHIFT) | addr;
}
function kindOf(bits) {
  if (bits <= MAX_DOUBLE)
    return 'double';
  const tag = bits >> SHIFT;
  if (tag === TAG_INT32) return 'int32';
  if (tag === TAG_OBJECT)
    return 'object';
  return 'other';
}
function unboxInt32(bits) {
  return Number(
    BigInt.asIntN(32, bits));
}
function unboxObject(bits) {
  return bits ^ (TAG_OBJECT << SHIFT);
}`,
        why: '`BigInt(-1)` is negative, and ORing a negative BigInt sets every bit, so `boxInt32(-1)` is `-1n` rather than `0xfff90000ffffffff`.',
      },
      {
        code: `const SHIFT = 47n;
const TAG_INT32 = 0x1fff2n;
const TAG_OBJECT = 0x1fffcn;
const MAX_DOUBLE = 0xfff80000ffffffffn;
function doubleBits(d) {
  const v = new DataView(
    new ArrayBuffer(8));
  v.setFloat64(0, d);
  return v.getBigUint64(0);
}
function boxInt32(i) {
  return (TAG_INT32 << SHIFT) |
    BigInt(i >>> 0);
}
function boxObject(addr) {
  if (addr < 0n || addr >> SHIFT)
    throw new RangeError('too wide');
  return (TAG_OBJECT << SHIFT) | addr;
}
function kindOf(bits) {
  const tag = bits >> SHIFT;
  if (tag === TAG_INT32) return 'int32';
  if (tag === TAG_OBJECT)
    return 'object';
  if (bits <= MAX_DOUBLE)
    return 'double';
  return 'other';
}
function unboxInt32(bits) {
  return Number(bits & 0xffffffffn);
}
function unboxObject(bits) {
  return bits ^ (TAG_OBJECT << SHIFT);
}`,
        why: 'Testing the tags before the double check is harmless here, but masking the low 32 bits reads them as unsigned, so `-7` comes back as `4294967289`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'How many bits of SpiderMonkey\'s 64-bit Value (PUNBOX64) hold an object pointer?',
    options: [
      {
        t: '32, the low word',
        why: 'That is the 32-bit layout (NUNBOX32); on 64-bit machines a pointer needs more.',
      },
      {
        t: '47, with a 17-bit tag above them',
        correct: true,
        why: '`JSVAL_TAG_SHIFT` is 47: user-space addresses under 4-level paging fit below it.',
      },
      {
        t: 'All 64; the tag is kept in a separate byte',
        why: 'The whole point is one 8-byte word with no separate tag.',
      },
    ],
  },
  {
    q: 'On x86-64 Linux with 5-level paging, why do engines that keep tags in high pointer bits keep working?',
    options: [
      {
        t: 'The kernel only allocates above 47 bits when a program asks with a high mmap hint',
        correct: true,
        why: 'The kernel documentation names JIT compilers that use high pointer bits as the reason; large addresses are opt-in.',
      },
      {
        t: 'The processor ignores the top 16 bits of every address',
        why: 'Under 5-level paging bits up to 56 are significant; that is the problem.',
      },
      {
        t: 'They do not: 5-level paging requires NaN-boxing engines to be rebuilt',
        why: 'No rebuild is needed while the default keeps addresses below 47 bits.',
      },
    ],
  },
  {
    q: 'In a generational VM, which of these stores needs a write barrier?',
    options: [
      {
        t: 'Storing an object into a local variable\'s stack slot',
        why: 'The stack is a root, scanned at every minor collection.',
      },
      {
        t: 'Closing an upvalue: copying a stack value into an existing heap upvalue object',
        correct: true,
        why: 'The upvalue object may be old and the value young, so this can create an old-to-young pointer.',
      },
      {
        t: 'Storing the number 3 into an old object\'s field',
        why: 'A number is not a pointer, so it cannot create an old-to-young reference.',
      },
    ],
  },
  {
    q: 'Between two minor collections, an old list receives 180,000 stores of young objects. With a remembered bit, how many remembered-set entries does it get?',
    options: [
      {
        t: '180,000',
        why: 'That would be a barrier with no bit (or a set that keeps duplicates).',
      },
      {
        t: 'None: lists are scanned anyway',
        why: 'An old list is not scanned by a minor collection unless it is remembered.',
      },
      {
        t: 'One',
        correct: true,
        why: 'The first store sets the bit and adds the list; the rest stop at the bit.',
      },
    ],
  },
  {
    q: 'A program stores a young object into another young object. What does a generational write barrier record?',
    options: [
      {
        t: 'The owner, in the remembered set',
        why: 'Only old owners are remembered.',
      },
      {
        t: 'Nothing: a minor collection traces every live young object anyway',
        correct: true,
        why: 'Young-to-young and young-to-old pointers are found by tracing the young generation itself.',
      },
      {
        t: 'The value, so that it is promoted early',
        why: 'The barrier does not decide promotion.',
      },
    ],
  },
];
