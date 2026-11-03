// Chapter 158 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.
// Merged from the old chapters AoSoA in Rust, and Block sizes and typed columns in Rust.

export const prompts = {
  'ao-slot': {
    q: 'With `F` fields and blocks of `B = 2^sh`, where is field `k` of element `i`?',
    a: 'At `(i >> sh) * F*B + k*B + (i & (B - 1))`: the block’s start, the field’s run inside it, then the lane.',
  },
  'ao-grow': {
    q: 'Why does growing a Viscosity AoSoA container (copying `data` into a `Float64Array` twice as long) move no element?',
    a: 'A slot depends only on `i` and `k`, never on the capacity. Copying the old array to the front of the new one keeps every slot.',
  },
  'ao-simple': {
    q: 'In Viscosity’s emitted AoSoA code, when does a field access call `__vsc_aosoa(...)` instead of writing the arithmetic inline?',
    a: 'When the index isn’t simple, such as a `__vsc_bc` call: the inline form repeats the index twice, so it must be an identifier or a literal.',
  },
  'ao-log2': {
    q: 'What does `log2_exact` in `emit.rs` return for 8, and for 6?',
    a: '`Some(3)` (`8.trailing_zeros()`), and `None`: 6 isn’t a power of two.',
  },
  'ao-refuse-1': {
    q: 'Why does Viscosity refuse `// @viscosity aosoa(1)`, although 1 is a power of two?',
    a: 'A block of one element isn’t AoSoA. The planner requires `b >= 2` as well as `b.is_power_of_two()`.',
  },
  'ao-text-none': {
    q: 'Viscosity accepts a bare `// @viscosity aosoa` as blocks of 8. What does it do with `// @viscosity aosoa(x)`?',
    a: 'It refuses it, quoting what was written (“annotated aosoa(x), but the block size must be a power of two”): text that is not a whole number never falls back to 8.',
  },
  'ao-huge': {
    q: 'Before Viscosity capped AoSoA block sizes at 65536, what happened to a program annotated `// @viscosity aosoa(1073741824)`?',
    a: 'Both engines accepted it, and the compiled program failed with “RangeError: Array buffer allocation failed”. Now both refuse it: the block size must be at most 65536.',
  },
  'ao-type-not-heat': {
    q: 'In Viscosity, what decides whether a field gets a `Float64Array` column or a plain array?',
    a: 'Only its type: proven always a number gives a typed column. How often loops touch it plays no part.',
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
    prompt: 'Write `slot(i, k, f, b)`: the index in `data` of field `k` of element `i`, for `f` fields in blocks of `b`. Return `None` for a block size the planner refuses (anything but a power of two of at least 2). Use a shift and a mask, as the emitted code does.',
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
    solution: `// Where field k of element i lives in
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
}`,
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
        code: `// Where field k of element i lives in
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
    Some(block * b + k * b + lane)
}`,
        why: 'The stride must be `f * b`, a whole block. With `b` alone, element 4’s `x` lands on element 0’s `y`.',
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
    if !b.is_power_of_two() {
        return None;
    }
    let sh = b.trailing_zeros();
    let block = i >> sh;
    let lane = i & (b - 1);
    Some(block * f * b + k * b + lane)
}`,
        why: 'It accepts a block size of 1, which the planner refuses: `1.is_power_of_two()` is true.',
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
    if b < 2 || !b.is_power_of_two() {
        return None;
    }
    let sh = b.trailing_zeros();
    let block = i >> sh;
    let lane = i & b;
    Some(block * f * b + k * b + lane)
}`,
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
  blockCheck: {
    optional: true,
    lang: 'rust',
    title: 'Checking a block size',
    prompt: 'Write `check(text, size)`, the planner’s two block-size rungs. First work out `b`: `None` when text was written but `size` is `None` (not a whole number), otherwise `size`, or 8 when nothing was written. Let `w` be the text as written, or `"8"` when there was none. If `b` is above `MAX`, return `Err("aosoa({w}): at most 65536")`. Otherwise, if `b` is a power of two of at least 2, return `Ok(b)`; in every other case (including `None`), `Err("aosoa({w}): power of two")`. The size limit is checked first.',
    starter: `const MAX: u64 = 65536;

// text: what was written between the
// brackets (None: no brackets).
// size: that text, if it is a whole
// number. Ok(block size), or Err(why).
fn check(
    text: Option<&str>,
    size: Option<u64>,
) -> Result<u64, String> {
    todo!()
}`,
    solution: `const MAX: u64 = 65536;

// text: what was written between the
// brackets (None: no brackets).
// size: that text, if it is a whole
// number. Ok(block size), or Err(why).
fn check(
    text: Option<&str>,
    size: Option<u64>,
) -> Result<u64, String> {
    let b = match (text, size) {
        (Some(_), None) => None,
        (_, b) => Some(b.unwrap_or(8)),
    };
    let w = match text {
        Some(t) => t.to_string(),
        None => "8".to_string(),
    };
    if b.is_some_and(|b| b > MAX) {
        return Err(format!(
            "aosoa({w}): at most {MAX}"
        ));
    }
    let pow = b.is_some_and(|b| {
        b >= 2 && b.is_power_of_two()
    });
    match b {
        Some(b) if pow => Ok(b),
        _ => Err(format!(
            "aosoa({w}): power of two"
        )),
    }
}`,
    tests: `fn ok(
    t: &str,
    n: u64,
) -> Result<u64, String> {
    check(Some(t), Some(n))
}

fn pow2(
    w: &str,
) -> Result<u64, String> {
    Err(format!("aosoa({w}): power of two"))
}

#[test]
fn powers_of_two_are_accepted() {
    assert_eq!(ok("4", 4), Ok(4));
    assert_eq!(ok("65536", 65536), Ok(65536));
}

#[test]
fn a_bare_aosoa_means_eight() {
    assert_eq!(check(None, None), Ok(8));
}

#[test]
fn other_numbers_are_refused() {
    for n in [0u64, 1, 3, 6, 12] {
        let t = n.to_string();
        assert_eq!(ok(&t, n), pow2(&t));
    }
}

#[test]
fn text_that_is_not_a_number() {
    assert_eq!(check(Some("x"), None),
        pow2("x"));
    assert_eq!(check(Some(""), None),
        pow2(""));
}

#[test]
fn too_big() {
    assert_eq!(ok("131072", 131072),
        Err("aosoa(131072): at most 65536"
            .to_string()));
}

#[test]
fn the_limit_is_checked_first() {
    // 3 * 65536: too big, and not a
    // power of two either
    let r = ok("196608", 196608);
    assert_eq!(r,
        Err("aosoa(196608): at most 65536"
            .to_string()));
}
`,
    hints: [
      'Start with the `match` from `plan.rs`: `let b = match (text, size) { (Some(_), None) => None, (_, b) => Some(b.unwrap_or(8)) };`. The first arm catches “something was written, but it isn’t a number”.',
      'For the message, `w` is `text` turned into a `String` when there is one, and `"8"` otherwise. Check the limit with `b.is_some_and(|b| b > MAX)` and return early.',
      'Compute `let pow = b.is_some_and(|b| b >= 2 && b.is_power_of_two());`, then finish with `match b { Some(b) if pow => Ok(b), _ => Err(...) }`; the `_` arm covers `None` too.',
    ],
    walkthrough: `**How to think about it.** This is the pair of block-size rungs in \`plan_one\` (\`engine/rust/crates/core/src/plan.rs\`), with the messages shortened. List the cases first, because the tests check each one: a power of two in range (accept), no brackets at all (accept, as 8), a number that isn't a power of two of at least 2 (refuse), text that isn't a number, even empty text (refuse, never quietly 8), and a number above the limit (refuse with the limit message, even when it isn't a power of two either). The interesting design choice is that "nothing written" and "something unreadable written" must be told apart, which is why the parser passes both the text and the number.

**The solution, line by line.**

- \`let b = match (text, size) {\` matches on a tuple of both inputs at once. \`(Some(_), None) => None,\`: text was written but isn't a number, so there is no block size. \`(_, b) => Some(b.unwrap_or(8)),\`: any other case, the number if there is one, else the default 8.
- \`let w = match text { Some(t) => t.to_string(), None => "8".to_string() };\` is the text to quote in a refusal: exactly what was written, or "8" when nothing was. (The real code writes \`js_number(...)\` of the default here.)
- \`if b.is_some_and(|b| b > MAX) { return Err(format!("aosoa({w}): at most {MAX}")); }\`: \`is_some_and\` is \`false\` for \`None\`, so only a real number above 65536 gets this message, and it comes first.
- \`let pow = b.is_some_and(|b| b >= 2 && b.is_power_of_two());\` asks the planner's question: is there a block size, and is it a power of two from 2 up?
- \`match b { Some(b) if pow => Ok(b),\`: a **match guard** (\`if ...\` after the pattern) accepts the size only when \`pow\` holds.
- \`_ => Err(format!("aosoa({w}): power of two")),\` refuses everything else: \`None\`, 0, 1, 3, 6, 12, and so on.

**Common wrong attempts.**

- Dropping \`b >= 2\`: \`1.is_power_of_two()\` is true, so \`aosoa(1)\` is accepted, and \`other_numbers_are_refused\` fails.
- Checking the power of two before the limit: 196608 is not a power of two, so it gets the wrong message, and \`the_limit_is_checked_first\` fails. (The real planner checks the limit first so that a huge power of two is told about the limit.)
- \`let b = Some(size.unwrap_or(8));\`: text that isn't a number then quietly becomes 8, which is the old behaviour both engines fixed (README item 18); \`text_that_is_not_a_number\` fails.`,
    wrong: [
      {
        code: `const MAX: u64 = 65536;

// text: what was written between the
// brackets (None: no brackets).
// size: that text, if it is a whole
// number. Ok(block size), or Err(why).
fn check(
    text: Option<&str>,
    size: Option<u64>,
) -> Result<u64, String> {
    let b = match (text, size) {
        (Some(_), None) => None,
        (_, b) => Some(b.unwrap_or(8)),
    };
    let w = match text {
        Some(t) => t.to_string(),
        None => "8".to_string(),
    };
    if b.is_some_and(|b| b > MAX) {
        return Err(format!(
            "aosoa({w}): at most {MAX}"
        ));
    }
    let pow = b.is_some_and(|b| {
        b.is_power_of_two()
    });
    match b {
        Some(b) if pow => Ok(b),
        _ => Err(format!(
            "aosoa({w}): power of two"
        )),
    }
}`,
        why: '`1.is_power_of_two()` is true (1 is 2⁰), so `aosoa(1)` would be accepted; the planner also requires `b >= 2`.',
      },
      {
        code: `const MAX: u64 = 65536;

// text: what was written between the
// brackets (None: no brackets).
// size: that text, if it is a whole
// number. Ok(block size), or Err(why).
fn check(
    text: Option<&str>,
    size: Option<u64>,
) -> Result<u64, String> {
    let b = match (text, size) {
        (Some(_), None) => None,
        (_, b) => Some(b.unwrap_or(8)),
    };
    let w = match text {
        Some(t) => t.to_string(),
        None => "8".to_string(),
    };
    let p = b.is_some_and(|b| {
        b >= 2 && b.is_power_of_two()
    });
    if !p {
        return Err(format!(
            "aosoa({w}): power of two"
        ));
    }
    if b.is_some_and(|b| b > MAX) {
        return Err(format!(
            "aosoa({w}): at most {MAX}"
        ));
    }
    Ok(b.unwrap())
}`,
        why: 'The power-of-two rung runs first, so a huge size that is not a power of two gets the wrong message; the limit must be checked first.',
      },
      {
        code: `const MAX: u64 = 65536;

// text: what was written between the
// brackets (None: no brackets).
// size: that text, if it is a whole
// number. Ok(block size), or Err(why).
fn check(
    text: Option<&str>,
    size: Option<u64>,
) -> Result<u64, String> {
    let b = match (text, size) {
        (_, b) => Some(b.unwrap_or(8)),
    };
    let w = match text {
        Some(t) => t.to_string(),
        None => "8".to_string(),
    };
    if b.is_some_and(|b| b > MAX) {
        return Err(format!(
            "aosoa({w}): at most {MAX}"
        ));
    }
    let pow = b.is_some_and(|b| {
        b >= 2 && b.is_power_of_two()
    });
    match b {
        Some(b) if pow => Ok(b),
        _ => Err(format!(
            "aosoa({w}): power of two"
        )),
    }
}`,
        why: 'Text that isn’t a number, like `aosoa(x)`, quietly becomes blocks of 8. Both engines once did this; now it is refused, quoting what was written.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Records `{x, y, vx}` in blocks of 4. Which slot holds `y` of element 5?',
    options: [
      {
        t: '16',
        why: 'That is the start of block 1’s `y` run (12 + 4); element 5 is lane 1 of it.',
      },
      {
        t: '17',
        correct: true,
        why: '`(5 >> 2) * 12 + 1 * 4 + (5 & 3) = 12 + 4 + 1`.',
      },
      {
        t: '13',
        why: 'That is `x` of element 5.',
      },
      {
        t: '6',
        why: 'That would be element 5’s `y` in a layout with no blocks.',
      },
    ],
  },
  {
    q: 'Why does an access like `ps[10].y` with an unproven index compile to `__vsc_aosoa(__vsc_bc(ps, 10, …), 2, 12, 4, 3)` rather than inline arithmetic?',
    options: [
      {
        t: 'The inline form repeats the index twice, and a check must run once',
        correct: true,
        why: 'Only simple indexes (identifiers, literals, proven or assumed in bounds) are inlined.',
      },
      {
        t: 'The helper is faster',
        why: 'It is a call; the inline arithmetic is cheaper. It is used for correctness.',
      },
      {
        t: 'Constants can’t be shifted in JavaScript',
        why: '`10 >> 2` is fine.',
      },
    ],
  },
  {
    q: 'Records `{x, y, vx}` in blocks of 4: `x` of element 5 is at slot 13. The container grows from capacity 8 to 16. Where is it now?',
    options: [
      {
        t: 'It moves to the new second half of the array',
        why: 'Copying with `d.set(this.data)` puts the old array at the front of the new one.',
      },
      {
        t: 'Still at 13: the slot depends only on the element and the field',
        correct: true,
        why: '`(5 >> 2) * 12 + 0 + (5 & 3)` has no capacity in it, so growing moves nothing.',
      },
      {
        t: 'Every element is reshuffled into the new block size',
        why: 'The block size never changes; only the number of blocks does.',
      },
    ],
  },
  {
    q: 'Which statement about Viscosity’s hot/cold splitting is accurate?',
    options: [
      {
        t: 'It groups fields that loops use together into hot columns',
        why: 'The access tables could support that, but nothing in the planner uses them for grouping.',
      },
      {
        t: 'Cold fields are left in the original objects',
        why: 'Every field gets a column; there are no objects left.',
      },
      {
        t: 'Fields are split by type: proven numbers get Float64Array columns, everything else plain arrays',
        correct: true,
        why: 'A field read in the hottest loop can still get a plain column, as `tag` does in mixed_columns.js.',
      },
    ],
  },
  {
    q: 'Viscosity is given `// @viscosity aosoa(4)` for a collection of records `{ x, name }`, where `name` is a string. What happens?',
    options: [
      {
        t: 'AoSoA for `x`, a plain array for `name`',
        why: 'AoSoA has no plain part: everything is in one Float64Array.',
      },
      {
        t: 'Kept: “annotated aosoa, but fields name may hold non-numbers”',
        correct: true,
        why: 'The planner refuses rather than lose the strings.',
      },
      {
        t: 'A compile error from `container_class`',
        why: 'The planner refuses first, so the emitter’s own check never fires.',
      },
    ],
  },
];
