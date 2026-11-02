// Chapter 84 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.
// Merged from old chapters 158, 158.

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
  'ao-refuse-1': {
    q: 'Why is `aosoa(1)` refused even though 1 is a power of two?',
    a: 'A block of one element isn’t AoSoA. The planner requires `b >= 2` as well as `b.is_power_of_two()`.',
  },
  'ao-text-none': {
    q: 'What does `// @viscosity aosoa(x)` do, and how does the Rust planner tell it apart from a bare `aosoa`?',
    a: 'It is refused, quoting `aosoa(x)`. Text was written but isn’t a number, so `b` is `None`; a bare `aosoa` has no text at all, and `unwrap_or(8)` gives blocks of 8.',
  },
  'ao-three-places': {
    q: 'The power-of-two rule is checked by the planner, by `container_class` and by `slot`. Why three times?',
    a: 'The planner refuses first, so the others never fire for a real program; they turn a slip upstream into an error instead of wrong arithmetic.',
  },
  'ao-huge': {
    q: 'What went wrong with `// @viscosity aosoa(1073741824)` before the size limit?',
    a: 'Both engines accepted it, and the compiled program failed with “RangeError: Array buffer allocation failed”. Now both refuse it: the block size must be at most 65536.',
  },
  'ao-numeric-only': {
    q: 'Why must every field of an AoSoA collection be numeric?',
    a: 'All fields share one `Float64Array`, `data`, so there is nowhere to put a string or an object.',
  },
  'ao-type-not-heat': {
    q: 'In Viscosity, what decides whether a field gets a `Float64Array` column or a plain array?',
    a: 'Only its type: proven always a number gives a typed column. How often loops touch it plays no part.',
  },
  'ao-partition': {
    q: 'What does `Iterator::partition` do in `describe`?',
    a: 'It walks the fields once and splits them into two vectors: those the closure accepts (numeric, typed) and the rest (plain).',
  },
  'ao-affinity': {
    q: 'What would a real split by heat need that the port doesn’t do today?',
    a: 'A planner that reads the per-loop access tables (which fields are touched together) and groups fields by them; it would only matter where fields share storage, as in AoSoA blocks.',
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
    q: 'Why must an AoSoA block size be a power of two?',
    options: [
      {
        t: 'Because Float64Array lengths must be powers of two',
        why: 'Typed arrays can have any length.',
      },
      {
        t: 'Because SIMD registers hold a power of two of lanes',
        why: 'JavaScript has no SIMD here; that isn’t the reason.',
      },
      {
        t: 'The emitted code finds the block and lane with `>>` and `&`, which equal `/` and `%` only for powers of two',
        correct: true,
        why: 'The planner refuses other sizes rather than emit wrong arithmetic.',
      },
    ],
  },
  {
    q: 'In Rust, how does `log2_exact(b)` compute the shift?',
    options: [
      {
        t: '`(b as f64).log2() as u32`',
        why: 'The TS reference uses `Math.log2`; the port uses integer methods.',
      },
      {
        t: '`b.is_power_of_two().then(|| b.trailing_zeros())`',
        correct: true,
        why: 'One bit set; the number of zeros below it is the exponent.',
      },
      {
        t: 'A loop that divides by 2',
        why: 'Not needed: `trailing_zeros` does it.',
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
    q: 'Which annotation does the planner accept?',
    options: [
      {
        t: '`// @viscosity aosoa(6)`',
        why: '6 is `0b110`: two bits set, so not a power of two.',
      },
      {
        t: '`// @viscosity aosoa()`',
        why: 'Brackets with nothing in them are text that isn’t a number, so it is refused.',
      },
      {
        t: '`// @viscosity aosoa`',
        correct: true,
        why: 'No brackets means the default, blocks of 8.',
      },
      {
        t: '`// @viscosity aosoa(1)`',
        why: '1 is 2⁰, but the planner also requires at least 2.',
      },
    ],
  },
  {
    q: 'What happens with `// @viscosity aosoa(1073741824)` on a small numeric collection today?',
    options: [
      {
        t: 'It works, with one huge block',
        why: 'Before the limit, the constructor’s allocation failed first.',
      },
      {
        t: 'The planner refuses it: the block size must be at most 65536',
        correct: true,
        why: 'Both engines check the 2¹⁶ limit before the power-of-two rule, and keep the array of objects.',
      },
      {
        t: 'Both engines accept it, and the compiled program throws a RangeError',
        why: 'That is what happened before the limit: a miscompile, since the original runs fine.',
      },
    ],
  },
  {
    q: 'Why would block sizes of 2³² and up compute wrong slots, even with enough memory?',
    options: [
      {
        t: 'JavaScript takes a shift count modulo 32, so `i >> 32` is `i`',
        correct: true,
        why: 'The emitted `i >> sh` would stop dividing at all.',
      },
      {
        t: 'Float64Array can’t hold that many numbers',
        why: 'That is the allocation problem; the arithmetic problem is separate.',
      },
      {
        t: '`trailing_zeros` overflows',
        why: 'It returns at most 64 for a `u64`; the trouble is on the JavaScript side.',
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
    q: '`// @viscosity aosoa(4)` above records `{ x, name }`, where `name` is a string. What happens?',
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
