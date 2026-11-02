// Chapter 372b cards. Keys are stable ids: never rename them.

const HEAD = `const MAX: u64 = 65536;

// text: what was written between the
// brackets (None: no brackets).
// size: that text, if it is a whole
// number. Ok(block size), or Err(why).
fn check(
    text: Option<&str>,
    size: Option<u64>,
) -> Result<u64, String> {`;

const SOL = `${HEAD}
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
}`;

export const prompts = {
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

export const exercises = {
  blockCheck: {
    lang: 'rust',
    title: 'Checking a block size',
    prompt:
      'Write `check(text, size)`, the planner’s two block-size rungs. First work out `b`: `None` when text was written but `size` is `None` (not a whole number), otherwise `size`, or 8 when nothing was written. Let `w` be the text as written, or `"8"` when there was none. If `b` is above `MAX`, return `Err("aosoa({w}): at most 65536")`. Otherwise, if `b` is a power of two of at least 2, return `Ok(b)`; in every other case (including `None`), `Err("aosoa({w}): power of two")`. The size limit is checked first.',
    starter: `${HEAD}
    todo!()
}`,
    solution: SOL,
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
        code: SOL.replace(`        b >= 2 && b.is_power_of_two()`, `        b.is_power_of_two()`),
        why: '`1.is_power_of_two()` is true (1 is 2⁰), so `aosoa(1)` would be accepted; the planner also requires `b >= 2`.',
      },
      {
        code: `${HEAD}
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
        code: SOL.replace(`        (Some(_), None) => None,
        (_, b) => Some(b.unwrap_or(8)),`, `        (_, b) => Some(b.unwrap_or(8)),`),
        why: 'Text that isn’t a number, like `aosoa(x)`, quietly becomes blocks of 8. Both engines once did this; now it is refused, quoting what was written.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Which annotation does the planner accept?',
    options: [
      { t: '`// @viscosity aosoa(6)`', why: '6 is `0b110`: two bits set, so not a power of two.' },
      { t: '`// @viscosity aosoa()`', why: 'Brackets with nothing in them are text that isn’t a number, so it is refused.' },
      { t: '`// @viscosity aosoa`', correct: true, why: 'No brackets means the default, blocks of 8.' },
      { t: '`// @viscosity aosoa(1)`', why: '1 is 2⁰, but the planner also requires at least 2.' },
    ],
  },
  {
    q: 'What happens with `// @viscosity aosoa(1073741824)` on a small numeric collection today?',
    options: [
      { t: 'It works, with one huge block', why: 'Before the limit, the constructor’s allocation failed first.' },
      { t: 'The planner refuses it: the block size must be at most 65536', correct: true, why: 'Both engines check the 2¹⁶ limit before the power-of-two rule, and keep the array of objects.' },
      { t: 'Both engines accept it, and the compiled program throws a RangeError', why: 'That is what happened before the limit: a miscompile, since the original runs fine.' },
    ],
  },
  {
    q: 'Why would block sizes of 2³² and up compute wrong slots, even with enough memory?',
    options: [
      { t: 'JavaScript takes a shift count modulo 32, so `i >> 32` is `i`', correct: true, why: 'The emitted `i >> sh` would stop dividing at all.' },
      { t: 'Float64Array can’t hold that many numbers', why: 'That is the allocation problem; the arithmetic problem is separate.' },
      { t: '`trailing_zeros` overflows', why: 'It returns at most 64 for a `u64`; the trouble is on the JavaScript side.' },
    ],
  },
  {
    q: 'Which statement about Viscosity’s hot/cold splitting is accurate?',
    options: [
      { t: 'It groups fields that loops use together into hot columns', why: 'The access tables could support that, but nothing in the planner uses them for grouping.' },
      { t: 'Cold fields are left in the original objects', why: 'Every field gets a column; there are no objects left.' },
      { t: 'Fields are split by type: proven numbers get Float64Array columns, everything else plain arrays', correct: true, why: 'A field read in the hottest loop can still get a plain column, as `tag` does in mixed_columns.js.' },
    ],
  },
  {
    q: '`// @viscosity aosoa(4)` above records `{ x, name }`, where `name` is a string. What happens?',
    options: [
      { t: 'AoSoA for `x`, a plain array for `name`', why: 'AoSoA has no plain part: everything is in one Float64Array.' },
      { t: 'Kept: “annotated aosoa, but fields name may hold non-numbers”', correct: true, why: 'The planner refuses rather than lose the strings.' },
      { t: 'A compile error from `container_class`', why: 'The planner refuses first, so the emitter’s own check never fires.' },
    ],
  },
];
