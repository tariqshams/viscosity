// Chapter 270 cards. Keys are stable ids: never rename them.

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
  'ao-refuse-1': {
    q: 'Why is `aosoa(1)` refused even though 1 is a power of two?',
    a: 'A block of one element isn’t AoSoA. The planner requires `b >= 2` as well as `b.is_power_of_two()`.',
  },
  'ao-huge': {
    q: 'What went wrong with `// @viscosity aosoa(1073741824)` before the size limit?',
    a: 'Both engines accepted it, and the compiled program failed with “RangeError: Array buffer allocation failed”. Now both refuse it: the block size must be at most 65536.',
  },
  'ao-type-not-heat': {
    q: 'In Viscosity, what decides whether a field gets a `Float64Array` column or a plain array?',
    a: 'Only its type: proven always a number gives a typed column. How often loops touch it plays no part.',
  },
  'ao-numeric-only': {
    q: 'Why must every field of an AoSoA collection be numeric?',
    a: 'All fields share one `Float64Array`, `data`, so there is nowhere to put a string or an object.',
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
      'Refuse first: `if b < 2 || !b.is_power_of_two() { return None; }`.',
      'The shift is `b.trailing_zeros()`. The block is `i >> sh` and the lane is `i & (b - 1)`.',
      'A block holds `f * b` slots, and field `k`’s run starts `k * b` into it.',
    ],
    walkthrough: `This is the arithmetic of the \`slot\` closure in \`engine/rust/crates/frontend-js/src/emit.rs\`, computed instead of printed, together with the planner’s test from \`plan.rs\`.

- **Why the stride is \`f * b\`.** Each block holds \`b\` elements of every field. Forgetting the \`f\` makes block 1 start inside block 0’s second field, and \`whole_blocks_are_filled_exactly\` sees the collisions.
- **Why \`b - 1\`.** For a power of two, \`b - 1\` is all ones below \`b\`’s bit, so \`i & (b - 1)\` is \`i % b\`. \`i & b\` tests a single bit.
- **Why refuse 6.** \`6.trailing_zeros()\` is 1 and \`i & 5\` is not \`i % 6\`, so the emitted shift-and-mask arithmetic would be wrong. Division would work, but the emitter never writes division, so the planner refuses.
- **Why refuse 1.** \`1.is_power_of_two()\` is true (it is 2⁰), but a block of one element is just an array of structs with extra arithmetic.`,
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
    q: 'What happens with `// @viscosity aosoa(1073741824)` on a small numeric collection?',
    options: [
      { t: 'The planner refuses it: the block size must be at most 65536', correct: true, why: 'Both engines check the 2¹⁶ limit before the power-of-two rule, and keep the array of objects.' },
      { t: 'It works, just with one huge block', why: 'Before the limit, the constructor’s allocation failed first.' },
      { t: 'Both engines accept it, and the compiled program throws a RangeError allocating the data array', why: 'That is what happened before the limit was added: a miscompile, since the original runs fine.' },
    ],
  },
  {
    q: 'Which statement about Viscosity’s hot/cold splitting is accurate?',
    options: [
      { t: 'It groups fields that loops use together into hot columns', why: 'The access tables could support that, but nothing in the planner uses them for grouping.' },
      { t: 'Fields are split by type: proven numbers get Float64Array columns, everything else plain arrays', correct: true, why: 'A field read in the hottest loop can still get a plain column, as `tag` does in mixed_columns.js.' },
      { t: 'Cold fields are left in the original objects', why: 'Every field gets a column; there are no objects left.' },
    ],
  },
];
