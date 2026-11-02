// Chapter 281 cards. Keys are stable ids: never rename them.

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
    a: 'A profile that says where the work is, and a timing method to check the change afterwards.',
  },
  'uc-what': {
    q: 'What does `xs.get_unchecked(i)` do, and what does it require?',
    a: 'Reads `xs[i]` with no bounds check. It is an `unsafe fn`: an out-of-bounds `i` is undefined behaviour, even if the result is never used.',
  },
  'uc-forbid': {
    q: 'What happens if you put `get_unchecked` into drip-rs?',
    a: 'It doesn’t compile: `#![forbid(unsafe_code)]` makes any `unsafe` block an error.',
  },
  'uc-promise': {
    q: 'In drip-rs’s `read_byte`, an unchecked read would be safe only if what is true?',
    a: 'That the compiler never emits a jump or a fall-through past the end of the chunk. A promise about the compiler, checked by nobody.',
  },
  'uc-worth': {
    q: 'On fib, how much did four unchecked reads save, in instructions and in wall time?',
    a: 'About 8% of instructions (18.59 vs 20.19 billion). The wall times overlapped the checked build’s, so no clear gain on this VM.',
  },
  'reg-win': {
    q: 'Which change to drip-rs’s byte reads was worth far more than removing bounds checks?',
    a: 'The registers: caching `ip` and an `Rc<Chunk>` in the `Vm`. Without them fib ran 39.27 billion instructions instead of 20.19.',
  },
  'hoisted': {
    q: 'What is a **hoisted** bounds check?',
    a: 'One check before a loop that proves every index inside it is in bounds, so the per-iteration checks can go.',
  },
  'llvm-did': {
    q: 'In drip-rs’s hash-table probe, `keys[index & mask]` has no bounds check inside the loop. Why?',
    a: 'The optimizer checked once that the length isn’t zero; `index & (len - 1)` is then always below `len`. It hoisted the check itself.',
  },
  'u8-array': {
    q: 'Why does `k[b as usize]` need no bounds check when `k: &[f64; 256]` and `b: u8`?',
    a: 'A `u8` is at most 255, and the array’s length 256 is part of its type, so the index is always in range.',
  },
  'fewer-not-faster': {
    q: 'The `[f64; 256]` loop ran 2.9× fewer instructions than the slice loop. How much faster was it?',
    a: 'Not at all: both took 53–57 ms. The loop was waiting on a chain of dependent additions, not on instructions.',
  },
  'iter-free': {
    q: 'Why do iterators such as `zip` usually carry no bounds checks?',
    a: 'They hand out each element in turn and stop at the end, so there is no index for anyone to check.',
  },
};

export const examples = {
  'forbid-unchecked': {
    lang: 'rust',
    expectError: true,
    title: 'get_unchecked under #![forbid(unsafe_code)]',
    code: `#![forbid(unsafe_code)]

fn main() {
    let code = vec![1u8, 2, 3];
    let ip = 1;
    // SAFETY: ip < code.len()
    let b = unsafe {
        *code.get_unchecked(ip)
    };
    println!("{b}");
}`,
  },
  'u8-table': {
    lang: 'rust',
    title: 'One check up front, none in the loop',
    code: `// A u8 index into a [T; 256] array can
// never be out of bounds.
fn sum(code: &[u8], k: &[f64; 256])
    -> f64 {
    let mut s = 0.0;
    for &b in code {
        s += k[b as usize];
    }
    s
}

fn main() {
    let consts = vec![0.5; 256];
    // The one check: is the length 256?
    let k: &[f64; 256] = consts
        .as_slice()
        .try_into()
        .expect("256 constants");
    let code: Vec<u8> =
        (0..=255).collect();
    println!("{}", sum(&code, k));

    let short = vec![0.5; 10];
    let r: Result<&[f64; 256], _> =
        short.as_slice().try_into();
    println!("len 10: {}", r.is_ok());
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
    tests: `// fib.drip, ms, 14 fresh runs each, the variants alternating.
const BASE: [f64; 14] = [1341.0, 1428.0, 1331.0, 1677.0, 1593.0, 1440.0, 1468.0, 1389.0, 1359.0, 1376.0, 1385.0, 1379.0, 1567.0, 1399.0];
const WALK: [f64; 14] = [2911.0, 3015.0, 3101.0, 3277.0, 2926.0, 3026.0, 2977.0, 3008.0, 3067.0, 3049.0, 3057.0, 3389.0, 3000.0, 3363.0];
const UNSAFE1: [f64; 14] = [1401.0, 1266.0, 1423.0, 1424.0, 1278.0, 1551.0, 1411.0, 1388.0, 1268.0, 1448.0, 1460.0, 1531.0, 1342.0, 1571.0];

#[test]
fn min_and_max() {
    assert_eq!(min(&BASE), 1331.0);
    assert_eq!(max(&BASE), 1677.0);
    assert_eq!(min(&[3.0]), 3.0);
}

#[test]
fn speedup_of_the_registers() {
    let s = speedup(&WALK, &BASE);
    assert!((s - 2.187).abs() < 0.001, "{s}");
}

#[test]
fn registers_are_a_real_win() {
    assert_eq!(verdict(&WALK, &BASE), Verdict::Faster);
    assert_eq!(verdict(&BASE, &WALK), Verdict::Slower);
}

#[test]
fn unchecked_reads_are_noise_here() {
    // Its best run is 5% faster, but the ranges overlap.
    assert!(speedup(&BASE, &UNSAFE1) > 1.05);
    assert_eq!(verdict(&BASE, &UNSAFE1), Verdict::Noise);
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
    walkthrough: `The heart of it is comparing ranges, not single numbers:

\`\`\`rust
if max(after) < min(before) {
    Verdict::Faster
} else if min(after) > max(before) {
    Verdict::Slower
} else {
    Verdict::Noise
}
\`\`\`

On a quiet machine you would use more statistics than this, like criterion’s confidence intervals (chapter 247). On a shared VM the blunt rule is useful because it is hard to fool. The best run of the unchecked build was 1266 ms against 1331 ms, a 5% “speed-up”, and a speed-up computed from minimums alone would report it. But the committed build’s runs went up to 1677 ms and the unchecked build’s down to 1266, so the two sets of runs interleave. The rule says “Noise”, which is the honest reading. The registers pass easily: the slowest committed run, 1677 ms, is far below the fastest heap-walk run, 2911 ms.

The rule is conservative. A real 3% gain on this VM will almost always come out as Noise. That is a fair price for never announcing an improvement that isn’t there. To see small effects, count instructions with callgrind, which doesn’t care about the neighbours, and then check the time on a quiet machine.`,
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
        why: 'Comparing best runs only calls the unchecked build “Faster” although its runs overlap the committed build’s. Compare the whole ranges.',
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
        why: 'The ratio is upside down: a change that halves the time would report 0.5. A speed-up is old time divided by new time.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'The profile shows 12.5% of fib’s instructions in `slice/index.rs`. What does that tell you about bounds checks?',
    options: [
      { t: 'Removing every check would save 12.5%', why: 'That file holds the indexing itself, the load included, not just the comparison. Four unchecked reads saved 7.9%.' },
      { t: 'They cost at most that much, and a measurement has to say how much less', correct: true, why: 'A profile bounds the prize. The unsafe experiment measured it: about 6–8% of instructions, no clear change in time.' },
      { t: 'Nothing: indexing is free in release builds', why: 'Each check is a compare and a branch. Cheap, predictable, but not free.' },
    ],
  },
  {
    q: 'Why is `get_unchecked` in `read_byte` a riskier change than it looks?',
    options: [
      { t: 'It makes the VM slower', why: 'It made it slightly faster in instruction counts.' },
      { t: 'It needs nightly Rust', why: '`get_unchecked` is stable; it just needs `unsafe`.' },
      { t: 'Its safety depends on the compiler never emitting a jump past the chunk; a compiler bug would become undefined behaviour instead of a panic', correct: true, why: 'The SAFETY argument is about code far away from the read, which no check would enforce any more.' },
    ],
  },
  {
    q: 'You add `let values = &values[..keys.len()];` before the hash-table probe loop, to hoist a check. zoo.drip then runs 0.15% *more* instructions. Why?',
    options: [
      { t: 'Reslicing copies the slice', why: 'A subslice is a pointer and a length; nothing is copied.' },
      { t: 'The optimizer had already hoisted the check, so the new line only added one', correct: true, why: 'The machine code showed a single length test before the loop and no check on `keys` inside it.' },
      { t: 'Callgrind counts are random', why: 'Two runs of zoo differed by 89 instructions in 7.5 billion; 11.7 million is a real difference.' },
    ],
  },
  {
    q: 'Which index needs no bounds check at all?',
    options: [
      { t: '`xs[i]` with `xs: &[f64]` and `i: usize`', why: 'The slice’s length is only known at run time, so the check stays unless the optimizer can prove `i < len`.' },
      { t: '`xs[i % 300]` with `xs: &[f64; 256]`', why: '`i % 300` can be up to 299, past the end.' },
      { t: '`xs[b as usize]` with `xs: &[f64; 256]` and `b: u8`', correct: true, why: 'Every `u8` is below 256, the array’s length, and both are known to the compiler.' },
    ],
  },
  {
    q: 'A change cuts a loop’s instructions by a factor of 2.9 and its time not at all. What is the most likely reason?',
    options: [
      { t: 'The timer is broken', why: 'Both loops timed consistently at 53–57 ms.' },
      { t: 'Callgrind miscounted', why: 'The machine code agrees: the slice loop has a compare and a branch per element that the array loop lacks, and it is unrolled.' },
      { t: 'The loop is limited by something other than the number of instructions, such as a chain of dependent additions', correct: true, why: 'Each `s +=` must wait for the previous one. The CPU had spare room for the extra compares.' },
      { t: 'Arrays are slower than slices', why: 'They are the same memory; the array’s length is just known at compile time.' },
    ],
  },
  {
    q: 'The fastest unchecked run of fib took 1266 ms, the fastest checked run 1331 ms. What may you claim?',
    options: [
      { t: 'Unchecked reads make fib 5% faster', why: 'The two builds’ 14 runs each overlapped (1266–1571 and 1331–1677), so this VM can’t tell them apart.' },
      { t: 'On this shared VM, the difference was within the noise; callgrind counted 6% fewer instructions', correct: true, why: 'Report both, with how they were measured. A quiet machine might show a small real gain.' },
      { t: 'Unchecked reads make fib slower', why: 'Nothing here points that way either.' },
    ],
  },
];
