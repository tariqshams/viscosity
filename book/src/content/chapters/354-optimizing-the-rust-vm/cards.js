// Chapter 354 cards. Keys are stable ids: never rename them.

const VERDICT = `#[derive(Debug, PartialEq)]
enum Verdict {
    Faster,
    Slower,
    Noise,
}
`;

const MINMAX = `fn min(xs: &[f64]) -> f64 {
    let mut m = f64::MAX;
    for &x in xs {
        m = m.min(x);
    }
    m
}

fn max(xs: &[f64]) -> f64 {
    let mut m = f64::MIN;
    for &x in xs {
        m = m.max(x);
    }
    m
}
`;

const SOLUTION = `${VERDICT}
fn min(xs: &[f64]) -> f64 {
    let mut m = f64::MAX;
    for &x in xs {
        m = m.min(x);
    }
    m
}

fn max(xs: &[f64]) -> f64 {
    let mut m = f64::MIN;
    for &x in xs {
        m = m.max(x);
    }
    m
}

// Best before ÷ best after.
fn speedup(
    before: &[f64],
    after: &[f64],
) -> f64 {
    min(before) / min(after)
}

// A verdict only if the ranges
// don't touch.
fn verdict(
    before: &[f64],
    after: &[f64],
) -> Verdict {
    if max(after) < min(before) {
        Verdict::Faster
    } else if min(after) > max(before) {
        Verdict::Slower
    } else {
        Verdict::Noise
    }
}
`;

export const prompts = {
  'opt-measure-first': {
    q: 'What should you have in hand before changing code to make it faster?',
    a: 'A profile that says where the work is, the corpus to prove the change is still correct, and a timing method to check the change afterwards.',
  },
  'uc-what': {
    q: 'What does a bounds check do on `code[ip]`?',
    a: 'Compares `ip` with `code.len()` before reading, and panics if `ip` is too big.',
  },
  'uc-forbid': {
    q: 'What happens if you put `get_unchecked` into drip-rs as it is?',
    a: 'It does not compile: `#![forbid(unsafe_code)]` in `lib.rs` makes any `unsafe` block an error.',
  },
  'uc-promise': {
    q: 'An unchecked `read_byte` in drip-rs is safe only if what is true?',
    a: 'That the compiler never lets `ip` run past the end of a chunk: every function ends with `return` and every jump lands inside it. A promise about the compiler, which a compiler bug would break.',
  },
  'uc-worth': {
    q: 'On fib, what did an unchecked `read_byte` save, in instructions and in time?',
    a: 'About 8% of instructions (5.11 vs 5.55 billion), but no measurable time: best 406 ms against the committed 398 ms, medians 439 and 427.',
  },
  'reg-win': {
    q: 'What happened to fib when a copy of drip-rs reached the chunk through the heap on every read, instead of using the chunk register?',
    a: 'Almost twice the instructions (11.01 billion) and about 2.1 times the time (best 842 ms against 398).',
  },
  'fewer-not-faster': {
    q: 'Why can removing 8% of instructions save no time?',
    a: 'The removed instructions were a comparison and a branch that the CPU predicted correctly every time and ran alongside other work, so they were not what each byte was waiting on.',
  },
  'fast-int': {
    q: 'Why is `(n as i64).to_string()` a correct way to print a whole number below 2^53?',
    a: 'Every whole number below 2^53 is exact in an `f64` and converts exactly to `i64`, and JavaScript prints such numbers as plain digits, so the text is the same.',
  },
};

export const examples = {
  unchecked: {
    lang: 'rust',
    title: 'Three ways to read a byte',
    code: `fn main() {
    let code = vec![7u8, 1, 2];
    // get: an Option, never a panic.
    println!("{:?}", code.get(1));
    println!("{:?}", code.get(5));
    // index: checked, panics if out
    // of range (it is in range here).
    let ip = 2;
    println!("{}", code[ip]);
    // unchecked: no test at all.
    // SAFETY: ip < code.len()
    let b = unsafe {
        *code.get_unchecked(ip)
    };
    println!("{b}");
}`,
  },
};

export const exercises = {
  verdict: {
    lang: 'rust',
    title: 'A speed-up calculator that respects noise',
    prompt:
      'You have wall times from fresh runs, before and after a change. Write `min` and `max` of a slice, then `speedup(before, after)`: best before divided by best after. Then write `verdict(before, after)`, which only claims a result when the samples don’t overlap: `Faster` if every `after` time is below every `before` time, `Slower` if every `after` time is above every `before` time, and `Noise` otherwise. The tests use this chapter’s real fib timings.',
    starter: `${VERDICT}
fn min(xs: &[f64]) -> f64 {
    todo!()
}

fn max(xs: &[f64]) -> f64 {
    todo!()
}

fn speedup(
    before: &[f64],
    after: &[f64],
) -> f64 {
    todo!()
}

fn verdict(
    before: &[f64],
    after: &[f64],
) -> Verdict {
    todo!()
}`,
    solution: SOLUTION,
    tests: `// ms, 15 fresh runs each, variants alternating.
const BASE: [f64; 15] = [402.0, 439.0, 398.0, 423.0, 423.0, 481.0, 428.0, 409.0, 414.0, 439.0, 499.0, 443.0, 427.0, 403.0, 572.0];
const WALK: [f64; 15] = [860.0, 871.0, 892.0, 870.0, 1034.0, 850.0, 881.0, 854.0, 842.0, 931.0, 995.0, 893.0, 889.0, 1006.0, 896.0];
const UNCHK: [f64; 15] = [409.0, 476.0, 434.0, 451.0, 463.0, 491.0, 410.0, 463.0, 406.0, 432.0, 492.0, 436.0, 415.0, 493.0, 439.0];
// strings.drip
const S_BASE: [f64; 15] = [402.0, 308.0, 403.0, 372.0, 437.0, 376.0, 423.0, 398.0, 338.0, 363.0, 326.0, 332.0, 335.0, 345.0, 313.0];
const S_FAST: [f64; 15] = [182.0, 202.0, 221.0, 184.0, 183.0, 180.0, 178.0, 180.0, 187.0, 178.0, 182.0, 188.0, 188.0, 176.0, 179.0];

#[test]
fn min_and_max() {
    assert_eq!(min(&BASE), 398.0);
    assert_eq!(max(&BASE), 572.0);
    assert_eq!(min(&[3.0]), 3.0);
}

#[test]
fn speedup_of_the_chunk_register() {
    let s = speedup(&WALK, &BASE);
    assert!((s - 2.1156).abs() < 0.001, "{s}");
}

#[test]
fn the_register_is_a_real_win() {
    assert_eq!(verdict(&WALK, &BASE), Verdict::Faster);
    assert_eq!(verdict(&BASE, &WALK), Verdict::Slower);
}

#[test]
fn unchecked_reads_are_noise_here() {
    assert_eq!(verdict(&BASE, &UNCHK), Verdict::Noise);
}

#[test]
fn the_fast_path_is_a_real_win() {
    let s = speedup(&S_BASE, &S_FAST);
    assert!((s - 1.75).abs() < 0.001, "{s}");
    assert_eq!(verdict(&S_BASE, &S_FAST), Verdict::Faster);
}

#[test]
fn touching_ranges_are_noise() {
    assert_eq!(verdict(&[10.0, 11.0], &[9.0, 10.0]), Verdict::Noise);
    assert_eq!(verdict(&[10.0, 11.0], &[8.0, 9.5]), Verdict::Faster);
}`,
    hints: [
      'Start `min` at `f64::MAX` and fold in each value with `m.min(x)`; `max` is the mirror image from `f64::MIN`.',
      '`speedup` is one line: `min(before) / min(after)`. Bigger than 1 means the change helped.',
      'For `Faster`, the *slowest* after must beat the *fastest* before: `max(after) < min(before)`. Equal values touch, so they are `Noise`.',
    ],
    walkthrough: `**How to think about it.** On a shared machine one run of a program can take 400 ms and the next 570 ms, with nothing changed. So a single "before" and "after" number proves nothing; the honest question is whether the two *sets* of runs overlap. If the slowest run after the change still beats the fastest run before it, no amount of noise explains the difference away. If the ranges overlap, you cannot tell, and the right answer is "noise". The speed-up itself is reported from the best runs, because the best run is the one least disturbed by other work on the machine.

**The solution, line by line.**

- \`fn min(xs: &[f64]) -> f64\` starts with \`let mut m = f64::MAX;\`, the largest \`f64\`, so the first value replaces it; \`for &x in xs { m = m.min(x); }\` keeps the smaller each time (\`&x\` copies each \`f64\` out of the slice), and \`m\` is returned. \`max\` is the mirror image, starting from \`f64::MIN\` and using \`m.max(x)\`.
- \`min(before) / min(after)\` is the speed-up: old best time divided by new best time, so 2.0 means twice as fast. For the chunk register, the copy without it is "before" (842 ms best) and the committed build "after" (398 ms): 2.1156.
- \`if max(after) < min(before)\` is the strict test for \`Faster\`: the *slowest* new run beats the *fastest* old one. For strings.drip the fast path's slowest run is 221 ms and the committed build's fastest 308 ms, so it is \`Faster\`.
- \`else if min(after) > max(before)\` is the mirror test for \`Slower\`.
- \`else\` covers every overlap, including ranges that only touch: \`Verdict::Noise\`. The unchecked build's runs (406 to 493 ms) sit inside the committed build's (398 to 572 ms), so it is noise, which matches what the chapter concluded.

**Common wrong attempts.**

- Comparing only the best runs (\`min(after) < min(before)\`) turns every lucky run into a verdict. Here it calls the unchecked build \`Slower\` (406 against 398), when the honest reading is that the two cannot be told apart.
- Dividing the wrong way round (\`min(after) / min(before)\`) reports 0.47 for a change that made fib 2.1 times faster.

The rule is blunt on purpose: a real 3% gain on this machine will usually come out as \`Noise\`. To see small effects, count instructions with callgrind, which the neighbours cannot disturb, and then time on a quiet machine.`,
    wrong: [
      {
        code: `${VERDICT}
${MINMAX}
fn speedup(
    before: &[f64],
    after: &[f64],
) -> f64 {
    min(before) / min(after)
}

fn verdict(
    before: &[f64],
    after: &[f64],
) -> Verdict {
    if min(after) < min(before) {
        Verdict::Faster
    } else if min(after) > min(before) {
        Verdict::Slower
    } else {
        Verdict::Noise
    }
}`,
        why: 'Comparing best runs only calls the unchecked build “Slower” (406 against 398 ms) although its runs overlap the committed build’s. Compare the whole ranges.',
      },
      {
        code: `${VERDICT}
${MINMAX}
fn speedup(
    before: &[f64],
    after: &[f64],
) -> f64 {
    min(after) / min(before)
}

fn verdict(
    before: &[f64],
    after: &[f64],
) -> Verdict {
    if max(after) < min(before) {
        Verdict::Faster
    } else if min(after) > max(before) {
        Verdict::Slower
    } else {
        Verdict::Noise
    }
}`,
        why: 'The ratio is upside down: the chunk register’s 2.1× would come out as 0.47. A speed-up is old time divided by new time.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'An unchecked `read_byte` removed 8% of fib’s instructions. What happened to its time?',
    options: [
      { t: 'It fell by 8%', why: 'Instructions are not time: the best run was 406 ms against the committed 398 ms.' },
      { t: 'No measurable change: the runs overlapped the committed build’s', correct: true, why: 'The removed compare and branch were predicted perfectly and ran alongside other work.' },
      { t: 'It doubled', why: 'That was the copy without the chunk register, a different experiment.' },
    ],
  },
  {
    q: 'What does `#![forbid(unsafe_code)]` in drip-rs’s `lib.rs` do?',
    options: [
      { t: 'Makes every `unsafe` block in the crate a compile error, which no inner attribute can switch back on', correct: true, why: '`forbid` is stronger than `deny`: it cannot be overridden lower down.' },
      { t: 'Makes `unsafe` blocks panic at run time', why: 'It is a compile-time lint; the code never builds.' },
      { t: 'Turns off bounds checks', why: 'It does the opposite: it keeps you from turning them off.' },
    ],
  },
  {
    q: 'What does `unsafe { *v.get_unchecked(9) }` do when `v` has three elements?',
    options: [
      { t: 'Panics with “index out of bounds”', why: 'That is `v[9]`, the checked form.' },
      { t: 'Returns `None`', why: 'That is `v.get(9)`.' },
      { t: 'Undefined behaviour: the language promises nothing about what happens', correct: true, why: 'The caller broke the promise `i < len`; the program may crash, read garbage or appear to work.' },
    ],
  },
  {
    q: 'Which change made strings.drip about 1.75 times faster in this chapter’s measurements?',
    options: [
      { t: 'Reading bytes with `get_unchecked`', why: 'That was tried on fib and saved no time.' },
      { t: 'A fast path in `format_number` that prints whole numbers below 2^53 with `(n as i64).to_string()`', correct: true, why: 'The profile put 48.2% of strings.drip in `format_number`; the fast path cut its instructions by 44%.' },
      { t: 'Removing the garbage collector', why: 'Nobody removed it, and the corpus would fail without it.' },
    ],
  },
  {
    q: 'Why is the whole-number fast path in this chapter not in the benchmark tables of the next chapter?',
    options: [
      { t: 'It made the output different', why: 'It passed the corpus and every benchmark’s output byte for byte.' },
      { t: 'It was measured in a scratch copy; the committed drip-rs, which the tables measure, does not have it yet', correct: true, why: 'The chapter says what it measured and changes no companion code.' },
      { t: 'It only helps the TypeScript VM', why: 'It is a change to drip-rs’s `format_number`.' },
    ],
  },
];
