// Chapter 372 cards. Keys are stable ids: never rename them.

const SOL = `// Where field k of element i lives in
// AoSoA data with f fields, blocks of
// b. None if the planner refuses b.
fn slot(
    i: usize,
    k: usize,
    f: usize,
    b: usize,
) -> Option<usize> {
    if b < 2 || !b.is_power_of_two() {
        return None;
    }
    let sh = b.trailing_zeros();
    let block = i >> sh;
    let lane = i & (b - 1);
    Some(block * f * b + k * b + lane)
}`;

export const prompts = {
  'ao-slot': {
    q: 'With `F` fields and blocks of `B = 2^sh`, where is field `k` of element `i`?',
    a: 'At `(i >> sh) * F*B + k*B + (i & (B - 1))`: the block’s start, the field’s run inside it, then the lane.',
  },
  'ao-stride': {
    q: 'For records `{x, y, vx}` in blocks of 4, what are the block stride and the offset of `vx`?',
    a: 'Stride 3 × 4 = 12 slots per block; `vx` is field 2, so its run starts at 2 × 4 = 8.',
  },
  'ao-grow': {
    q: 'Why doesn’t `grow()` have to move any element of an AoSoA container?',
    a: 'A slot depends only on `i` and `k`, never on the capacity. Copying the old array to the front of the new one keeps every slot.',
  },
  'ao-cap': {
    q: 'Why does the AoSoA constructor compute `Math.ceil(cap / B) * B`?',
    a: 'So the capacity is a whole number of blocks: the last block’s field runs must all fit in `data`.',
  },
  'ao-simple': {
    q: 'When does an AoSoA access go through `__vsc_aosoa(...)` instead of inline arithmetic?',
    a: 'When the index isn’t simple, such as a `__vsc_bc` call: the inline form repeats the index twice, so it must be an identifier or a literal.',
  },
  'ao-log2': {
    q: 'What does `log2_exact` in `emit.rs` return for 8, and for 6?',
    a: '`Some(3)` (`8.trailing_zeros()`), and `None`: 6 isn’t a power of two.',
  },
  'ao-js-number': {
    q: 'Why are the stride, offset and mask computed as `f64` and printed with `js_number`?',
    a: 'So the text is exactly what the TypeScript reference prints from its doubles, `12` and not `12.0`, byte for byte.',
  },
  'ao-shift-why': {
    q: 'For `B = 2^sh`, why is `i >> sh` the same as `i / B` rounded down?',
    a: 'Shifting right by `sh` bits drops the low `sh` binary digits, which is dividing by 2^sh and throwing the remainder away.',
  },
};

export const examples = {
  'layout-play': {
    lang: 'rust',
    title: 'Ten elements in blocks of 4',
    code: `fn main() {
    // fields x, y, vx; blocks of 4
    let names = ["x", "y", "vx"];
    let (f, b, sh) = (3, 4, 2);
    let n = 10; // elements pushed
    let cap = 12; // whole blocks
    let dash = String::from("-");
    let mut data = vec![dash; cap * f];
    for i in 0..n {
        for k in 0..f {
            let blk = (i >> sh) * f * b;
            let lane = i & (b - 1);
            let s = blk + k * b + lane;
            let nm = names[k];
            let v = format!("{nm}{i}");
            data[s] = v;
        }
    }
    for row in data.chunks(f * b) {
        println!("{}", row.join(" "));
    }
}
`,
  },
};

export const exercises = {
  aosoaSlot: {
    lang: 'rust',
    title: 'The AoSoA slot',
    prompt:
      'Write `slot(i, k, f, b)`: the index in `data` of field `k` of element `i`, for `f` fields in blocks of `b`. Return `None` for a block size the planner refuses (anything but a power of two of at least 2). Use a shift and a mask, as the emitted code does.',
    starter: `// Where field k of element i lives in
// AoSoA data with f fields, blocks of
// b. None if the planner refuses b.
fn slot(
    i: usize,
    k: usize,
    f: usize,
    b: usize,
) -> Option<usize> {
    todo!()
}`,
    solution: SOL,
    tests: `use std::collections::HashSet;

#[test]
fn matches_the_generated_push() {
    // push: b = (n >> 2) * 12 + (n & 3);
    // this.data[b + 4] = v1;
    let n = 10;
    let b = (n >> 2) * 12 + (n & 3);
    assert_eq!(slot(n, 1, 3, 4), Some(b + 4));
}

#[test]
fn matches_the_rewritten_read() {
    for i in 0..100 {
        let want = (i >> 2) * 12 + 8 + (i & 3);
        assert_eq!(slot(i, 2, 3, 4), Some(want));
    }
}

#[test]
fn refuses_what_the_planner_refuses() {
    for b in [0, 1, 3, 6, 12] {
        assert_eq!(slot(5, 0, 2, b), None, "{b}");
    }
}

#[test]
fn whole_blocks_are_filled_exactly() {
    let (f, b, n) = (3, 8, 64);
    let mut seen = HashSet::new();
    for i in 0..n {
        for k in 0..f {
            let s = slot(i, k, f, b).unwrap();
            assert!(s < n * f, "{i} {k}");
            assert!(seen.insert(s), "{i} {k}");
        }
    }
}

#[test]
fn one_field_is_the_identity() {
    for i in 0..50 {
        assert_eq!(slot(i, 0, 1, 16), Some(i));
    }
}
`,
    hints: [
      'Refuse first, as the planner does: `if b < 2 || !b.is_power_of_two() { return None; }`.',
      'The shift is `b.trailing_zeros()`. Then the block is `i >> sh` and the lane is `i & (b - 1)`.',
      'A whole block holds `f * b` slots, and field `k`’s run starts `k * b` into it: `Some(block * f * b + k * b + lane)`.',
    ],
    walkthrough: `**How to think about it.** This is the arithmetic of the \`slot\` closure in \`engine/rust/crates/frontend-js/src/emit.rs\`, computed as a number instead of printed as text, together with the planner's test on the block size from \`plan.rs\`. Work one case by hand before writing code: \`{x, y, vx}\` (\`f = 3\`) in blocks of 4, element 10, field \`y\` (\`k = 1\`). Element 10 is in block 2 (elements 8 to 11) at lane 2. Each block holds 3 × 4 = 12 slots, so block 2 starts at 24; \`y\`'s run starts 4 slots into it, at 28; lane 2 is slot 30. The test \`matches_the_generated_push\` checks exactly that against the push the emitter writes.

**The solution, line by line.**

- \`if b < 2 || !b.is_power_of_two() { return None; }\` refuses what the planner refuses: 0, 1 (a power of two, 2⁰, but not a block), and anything that isn't a power of two.
- \`let sh = b.trailing_zeros();\` is the shift: for 4 (\`0b100\`) there are two zero bits below the one bit, so 2. It returns a \`u32\`, which is what \`>>\` on a \`usize\` accepts.
- \`let block = i >> sh;\` divides by \`b\`, rounding down.
- \`let lane = i & (b - 1);\` keeps the low \`sh\` bits, the remainder: for \`b = 4\`, \`b - 1\` is \`0b11\`.
- \`Some(block * f * b + k * b + lane)\` adds the block's start (\`f * b\` slots per block), the start of field \`k\`'s run in it, and the lane.

**Common wrong attempts.**

- \`block * b + ...\` as the block's start: each block holds \`b\` elements of **every** field, so the stride is \`f * b\`. With \`b\` alone, element 4's \`x\` lands on element 0's \`y\`, and \`whole_blocks_are_filled_exactly\` sees the collision.
- Testing only \`is_power_of_two()\`: it accepts 1, which the planner refuses, so \`refuses_what_the_planner_refuses\` fails.
- \`i & b\` for the lane: that keeps a single bit of \`i\`, not its remainder. The mask is \`b - 1\`, all ones below \`b\`'s bit.
- \`i / b\` and \`i % b\`: the numbers are right for any size, but then 3, 6 and 12 are accepted, and the emitted code, which only ever uses a shift and a mask, would be wrong for them.`,
    wrong: [
      {
        code: SOL.replace('Some(block * f * b + k * b + lane)', 'Some(block * b + k * b + lane)'),
        why: 'The stride must be `f * b`, a whole block. With `b` alone, element 4’s `x` lands on element 0’s `y`.',
      },
      {
        code: SOL.replace('if b < 2 || !b.is_power_of_two() {', 'if !b.is_power_of_two() {'),
        why: 'It accepts a block size of 1, which the planner refuses: `1.is_power_of_two()` is true.',
      },
      {
        code: SOL.replace('let lane = i & (b - 1);', 'let lane = i & b;'),
        why: '`i & b` keeps one bit of `i`, not its remainder. The mask is `b - 1`.',
      },
      {
        code: `// Where field k of element i lives in
// AoSoA data with f fields, blocks of
// b. None if the planner refuses b.
fn slot(
    i: usize,
    k: usize,
    f: usize,
    b: usize,
) -> Option<usize> {
    if b < 2 {
        return None;
    }
    let block = i / b;
    let lane = i % b;
    Some(block * f * b + k * b + lane)
}`,
        why: 'The arithmetic is right for any size, but it accepts 3, 6 and 12, which the planner refuses because the emitted code only ever uses a shift and a mask.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Records `{x, y, vx}` in blocks of 4. Which slot holds `y` of element 5?',
    options: [
      { t: '16', why: 'That is the start of block 1’s `y` run (12 + 4); element 5 is lane 1 of it.' },
      { t: '17', correct: true, why: '`(5 >> 2) * 12 + 1 * 4 + (5 & 3) = 12 + 4 + 1`.' },
      { t: '13', why: 'That is `x` of element 5.' },
      { t: '6', why: 'That would be element 5’s `y` in a layout with no blocks.' },
    ],
  },
  {
    q: 'Why must an AoSoA block size be a power of two?',
    options: [
      { t: 'Because Float64Array lengths must be powers of two', why: 'Typed arrays can have any length.' },
      { t: 'Because SIMD registers hold a power of two of lanes', why: 'JavaScript has no SIMD here; that isn’t the reason.' },
      { t: 'The emitted code finds the block and lane with `>>` and `&`, which equal `/` and `%` only for powers of two', correct: true, why: 'The planner refuses other sizes rather than emit wrong arithmetic.' },
    ],
  },
  {
    q: 'In Rust, how does `log2_exact(b)` compute the shift?',
    options: [
      { t: '`(b as f64).log2() as u32`', why: 'The TS reference uses `Math.log2`; the port uses integer methods.' },
      { t: '`b.is_power_of_two().then(|| b.trailing_zeros())`', correct: true, why: 'One bit set; the number of zeros below it is the exponent.' },
      { t: 'A loop that divides by 2', why: 'Not needed: `trailing_zeros` does it.' },
    ],
  },
  {
    q: 'Why does an access like `ps[10].y` with an unproven index compile to `__vsc_aosoa(__vsc_bc(ps, 10, …), 2, 12, 4, 3)` rather than inline arithmetic?',
    options: [
      { t: 'The inline form repeats the index twice, and a check must run once', correct: true, why: 'Only simple indexes (identifiers, literals, proven or assumed in bounds) are inlined.' },
      { t: 'The helper is faster', why: 'It is a call; the inline arithmetic is cheaper. It is used for correctness.' },
      { t: 'Constants can’t be shifted in JavaScript', why: '`10 >> 2` is fine.' },
    ],
  },
  {
    q: 'Records `{x, y, vx}` in blocks of 4: `x` of element 5 is at slot 13. The container grows from capacity 8 to 16. Where is it now?',
    options: [
      { t: 'It moves to the new second half of the array', why: 'Copying with `d.set(this.data)` puts the old array at the front of the new one.' },
      { t: 'Still at 13: the slot depends only on the element and the field', correct: true, why: '`(5 >> 2) * 12 + 0 + (5 & 3)` has no capacity in it, so growing moves nothing.' },
      { t: 'Every element is reshuffled into the new block size', why: 'The block size never changes; only the number of blocks does.' },
    ],
  },
];
