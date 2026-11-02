// Chapter 124 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'vec-three': {
    q: 'What three things does a `Vec` value itself (on the stack) hold?',
    a: 'A pointer to its heap buffer, its length and its capacity.',
  },
  'vec-get': {
    q: 'What is the difference between `v[5]` and `v.get(5)` on a two-element `Vec`?',
    a: '`v[5]` panics (index out of bounds); `v.get(5)` returns `None`.',
  },
  'vec-push-borrow': {
    q: 'Why does Rust reject a `push` while a reference into the `Vec` is still in use?',
    a: 'The push may move the elements to a new buffer, leaving the reference pointing at freed memory (E0502).',
  },
  'vec-loops': {
    q: 'What do `for x in &v`, `for x in &mut v` and `for x in v` each give you?',
    a: 'A shared reference to each element; a mutable reference to each; the elements themselves, using `v` up.',
  },
  'map-get': {
    q: 'What does `m.get(k)` return, and why not just the value?',
    a: '`Option<&V>`: `None` if the key is missing, otherwise a borrowed look at the value, which the map keeps owning.',
  },
  'map-entry': {
    q: 'What does `m.entry(k).or_insert(0)` return?',
    a: 'A mutable reference to the value for `k`, after inserting `0` if `k` was not there yet.',
  },
  'map-own': {
    q: 'After `m.insert(k, 1)` with `k: String`, can you still use `k`?',
    a: 'No: the key moved into the map (E0382). Insert `k.clone()` if you need to keep it.',
  },
  'map-order': {
    q: 'Can you rely on the order in which a `HashMap` gives back its entries?',
    a: 'No. It is arbitrary, and with the randomly seeded default hasher it changes from run to run.',
  },
};

export const examples = {
  'vec-play': {
    lang: 'rust',
    title: 'A Vec grows, and lends its elements',
    code: `fn sum(xs: &[f64]) -> f64 {
    let mut s = 0.0;
    for x in xs {
        s += x;
    }
    s
}

fn main() {
    let mut v: Vec<f64> = Vec::new();
    for i in 0..6 {
        v.push(i as f64);
        println!("len {} cap {}",
            v.len(), v.capacity());
    }
    for x in &mut v {
        *x *= 10.0;
    }
    println!("{:?}", v);
    println!("{:?}", v.get(9));
    println!("{:?}", v.pop());
    println!("{}", sum(&v));
}`,
  },
  'map-play': {
    lang: 'rust',
    title: 'Counting field uses',
    code: `use std::collections::HashMap;

fn main() {
    let fs = ["x", "vx", "x", "y", "x"];
    let mut n: HashMap<&str, i32> =
        HashMap::new();
    for f in fs {
        *n.entry(f).or_insert(0) += 1;
    }
    println!("{:?}", n.get("x"));
    println!("{:?}", n.get("mass"));
    let old = n.insert("y", 10);
    println!("{:?} {}", old, n.len());
    // Run it again: the order changes.
    println!("{:?}", n);
}`,
  },
};

export const exercises = {
  constants: {
    lang: 'rust',
    optional: true,
    title: 'A constant pool without repeats',
    prompt: 'Drip’s compiler keeps each function’s constants in a `Vec`, and the bytecode names a constant by its index. Write `add_constant(cs, v)`: if a constant equal to `v` is already in `cs`, return its index and add nothing; otherwise push `v` and return the index it now has. (The companion’s `Chunk::add_constant` always pushes; reusing equal constants keeps the pool small, which matters because an instruction can only name 65,536 of them.)',
    starter: `fn add_constant(cs: &mut Vec<f64>,
    v: f64) -> usize {
    0
}`,
    solution: `fn add_constant(cs: &mut Vec<f64>,
    v: f64) -> usize {
    let mut i = 0;
    while i < cs.len() {
        if cs[i] == v {
            return i;
        }
        i += 1;
    }
    cs.push(v);
    cs.len() - 1
}`,
    tests: `#[test]
fn first_constant_is_index_zero() {
    let mut cs = Vec::new();
    assert_eq!(add_constant(&mut cs, 1.5), 0);
    assert_eq!(cs, vec![1.5]);
}
#[test]
fn new_constants_go_at_the_end() {
    let mut cs = vec![1.5];
    assert_eq!(add_constant(&mut cs, 2.5), 1);
    assert_eq!(add_constant(&mut cs, 7.0), 2);
}
#[test]
fn equal_constants_are_reused() {
    let mut cs = vec![1.5, 2.5];
    assert_eq!(add_constant(&mut cs, 1.5), 0);
    assert_eq!(add_constant(&mut cs, 2.5), 1);
    assert_eq!(cs.len(), 2);
}`,
    hints: [
      'Two cases: the value is already there (answer: where it is), or it is not (answer: where you put it). Look first, then add.',
      'Loop over the indexes with `while i < cs.len()`, and `return i;` as soon as `cs[i] == v`. If the loop finishes, the value is new.',
      'After the loop, `cs.push(v);`, and the new element’s index is one less than the new length: `cs.len() - 1`, as the last expression.',
    ],
    walkthrough: `**How to think about it.** Picture the pool \`[1.5, 2.5]\`. Asking for \`2.5\` should give back \`1\` and leave the pool alone; asking for \`7.0\` should give \`[1.5, 2.5, 7.0]\` and return \`2\`. So the function has two jobs, in order: search, and only if the search fails, append. The parameter is \`&mut Vec<f64>\`, a mutable borrow, because the function may grow the caller's \`Vec\`; a plain slice \`&[f64]\` could not, since a slice cannot change length.

**The solution, line by line.**

- \`let mut i = 0;\` starts the search at the first constant.
- \`while i < cs.len() {\` visits every index that holds an element (from 0 up to, but not including, the length).
- \`if cs[i] == v { return i; }\` stops at the first equal constant and hands back its index; nothing is added.
- \`i += 1;\` moves on.
- \`cs.push(v);\` runs only when no constant matched. It may reallocate the buffer, which is fine: we hold no references into \`cs\`, only the index \`i\`, a plain number.
- \`cs.len() - 1\` is the index of the element just pushed (with three elements, the last is at index 2). As the last expression it is the return value.

**A note on equality.** \`==\` on \`f64\` is IEEE equality: \`0.0 == -0.0\` is true and \`NaN == NaN\` is false, so a real compiler that deduplicates constants compares their bits instead, to keep \`-0.0\` and every \`NaN\` distinct. The tests here avoid those corners.

**Common wrong attempts.**

- Always pushing (\`cs.push(v); cs.len() - 1\`) passes the first two tests but fills the pool with repeats.
- Returning \`cs.len()\` after the push is one too many: the last index is the length minus one.
- Pushing *before* searching finds the value you just pushed every time, so nothing is ever reused correctly and the pool still grows.`,
    wrong: [
      {
        code: `fn add_constant(cs: &mut Vec<f64>,
    v: f64) -> usize {
    cs.push(v);
    cs.len() - 1
}`,
        why: 'It never looks for an equal constant, so `1.5` added twice is stored twice.',
      },
      {
        code: `fn add_constant(cs: &mut Vec<f64>,
    v: f64) -> usize {
    let mut i = 0;
    while i < cs.len() {
        if cs[i] == v {
            return i;
        }
        i += 1;
    }
    cs.push(v);
    cs.len()
}`,
        why: 'After the push the new element is at `len - 1`, not `len`: the first constant gets index 1.',
      },
    ],
  },
  countFields: {
    lang: 'rust',
    title: 'Count field accesses',
    prompt: 'Viscosity’s analysis records which fields a loop reads. Write `count_fields(used)`, which takes the field names in the order they were read and returns a `HashMap<String, usize>` from each name to how many times it was read. The map must own its keys, so make a `String` from each `&str` with `f.to_string()`.',
    starter: `use std::collections::HashMap;

fn count_fields(used: &[&str])
    -> HashMap<String, usize> {
    todo!()
}`,
    solution: `use std::collections::HashMap;

fn count_fields(used: &[&str])
    -> HashMap<String, usize> {
    let mut n = HashMap::new();
    for f in used {
        let k = f.to_string();
        *n.entry(k).or_insert(0) += 1;
    }
    n
}`,
    tests: `#[test]
fn counts_repeats() {
    let m = count_fields(&["x", "vx", "x"]);
    assert_eq!(m.get("x"), Some(&2));
    assert_eq!(m.get("vx"), Some(&1));
}
#[test]
fn one_entry_per_field() {
    let m = count_fields(&["x", "y", "x", "x"]);
    assert_eq!(m.len(), 2);
    assert_eq!(m.get("x"), Some(&3));
}
#[test]
fn unread_fields_are_absent() {
    let m = count_fields(&["x"]);
    assert_eq!(m.get("mass"), None);
}
#[test]
fn empty_loop() {
    assert!(count_fields(&[]).is_empty());
}`,
    hints: [
      'You need a map to fill and return: `let mut n = HashMap::new();` at the start and `n` as the last line. Rust works out its types from the return type.',
      'For each name, make an owned key with `f.to_string()`: the map’s keys are `String`s, not borrowed `&str`s.',
      'The counting line is `*n.entry(k).or_insert(0) += 1;`: it inserts 0 the first time a name appears, then adds one every time.',
    ],
    walkthrough: `**How to think about it.** Do it by hand first: for \`["x", "vx", "x"]\`, keep a tally sheet; on "x" there is no line for x yet, so start one at 0 and add 1; on "vx", the same; on "x" again, the line exists, so just add 1. "Start at 0 if new, then add 1" is exactly the entry API. Two Rust details matter: the return type says the map owns \`String\` keys, so each borrowed \`&str\` has to be turned into an owned \`String\`; and \`get\` on the finished map returns an \`Option\` of a borrowed count, which is why the tests compare with \`Some(&2)\`.

**The solution, line by line.**

- \`let mut n = HashMap::new();\` makes an empty map. Its type, \`HashMap<String, usize>\`, is worked out from the function's return type.
- \`for f in used {\` borrows each name in turn; \`f\` is a \`&&str\` here, which \`to_string\` handles.
- \`let k = f.to_string();\` makes an owned copy of the name for the map to keep.
- \`*n.entry(k).or_insert(0) += 1;\`: \`entry(k)\` moves the key in and finds its slot; \`or_insert(0)\` fills an empty slot with 0; either way it returns \`&mut usize\`, and \`*\` follows that reference so that \`+= 1\` changes the count inside the map.
- \`n\` (the last line) hands the map, and ownership of everything in it, back to the caller.

**Common wrong attempts.**

- \`n.insert(f.to_string(), 1);\` overwrites the count every time, so every field ends up at 1 however often it was read.
- \`n.entry(k).or_insert(1);\` with no \`+= 1\` sets the first count and never changes it again.
- In TypeScript you would write \`m.set(f, (m.get(f) ?? 0) + 1)\`, which looks the key up twice; the entry API looks it up once.`,
    wrong: [
      {
        code: `use std::collections::HashMap;

fn count_fields(used: &[&str])
    -> HashMap<String, usize> {
    let mut n = HashMap::new();
    for f in used {
        n.insert(f.to_string(), 1);
    }
    n
}`,
        why: '`insert` overwrites, so every field ends up with a count of 1, however often it was read.',
      },
      {
        code: `use std::collections::HashMap;

fn count_fields(used: &[&str])
    -> HashMap<String, usize> {
    let mut n = HashMap::new();
    for f in used {
        let k = f.to_string();
        n.entry(k).or_insert(1);
    }
    n
}`,
        why: '`or_insert(1)` only sets the first count. Later reads find the entry already there and change nothing.',
      },
    ],
  },
  hotFields: {
    lang: 'rust',
    optional: true,
    title: 'The hot fields, in a fixed order',
    prompt: 'Write `hot_fields(n, min)`, which returns the names whose count is at least `min`, **sorted alphabetically** so the answer doesn’t depend on the map’s order. Loop with `for (k, c) in n`, push into a `Vec<String>`, then call `sort()` on it.',
    starter: `use std::collections::HashMap;

fn hot_fields(
    n: &HashMap<String, usize>,
    min: usize,
) -> Vec<String> {
    todo!()
}`,
    solution: `use std::collections::HashMap;

fn hot_fields(
    n: &HashMap<String, usize>,
    min: usize,
) -> Vec<String> {
    let mut out = Vec::new();
    for (k, c) in n {
        if *c >= min {
            out.push(k.clone());
        }
    }
    out.sort();
    out
}`,
    tests: `fn m(xs: &[(&str, usize)]) -> HashMap<String, usize> {
    let mut n = HashMap::new();
    for (k, c) in xs {
        n.insert(k.to_string(), *c);
    }
    n
}

#[test]
fn keeps_counts_at_or_above_min() {
    let n = m(&[("x", 3), ("vx", 1), ("y", 2)]);
    assert_eq!(hot_fields(&n, 2), vec!["x", "y"]);
}

#[test]
fn sorted_whatever_the_map_order() {
    let n = m(&[("z", 5), ("b", 5), ("m", 5), ("a", 5)]);
    assert_eq!(hot_fields(&n, 1),
        vec!["a", "b", "m", "z"]);
}

#[test]
fn none_hot() {
    let n = m(&[("x", 1)]);
    assert!(hot_fields(&n, 2).is_empty());
}`,
    hints: [
      'Looping over `n` (a `&HashMap`) gives pairs of references: `k: &String`, `c: &usize`.',
      'Compare with `*c >= min`, and push an owned copy of the name: `k.clone()`.',
      'Call `out.sort();` before returning, so the order is alphabetical.',
    ],
    walkthrough: `**How to think about it.** The answer must not depend on the map's order, which changes from run to run, so collect first and sort at the end.

**The solution, line by line.** \`let mut out = Vec::new();\` collects the names. \`for (k, c) in n\` borrows each entry, so \`k\` is a \`&String\` and \`c\` a \`&usize\`. \`if *c >= min\` keeps counts of at least \`min\`. \`out.push(k.clone())\` stores an owned copy, because the result outlives the loop. \`out.sort();\` puts the names in alphabetical order, and \`out\` returns them.

**Why it works.** Iterating a borrowed map lends you each key and value, so \`k\` is a \`&String\`. The \`Vec\` must own its strings, because the result outlives the loop, so you push \`k.clone()\`, a copy.

The sort is the important part. Without it the test “sorted whatever the map order” passes on some runs and fails on others, because \`HashMap\` iteration order is arbitrary. When output must be stable, either sort it, as here, or use an insertion-ordered map such as \`IndexMap\`, as the Rust Viscosity does.`,
    wrong: [
      {
        code: `use std::collections::HashMap;

fn hot_fields(
    n: &HashMap<String, usize>,
    min: usize,
) -> Vec<String> {
    let mut out = Vec::new();
    for (k, c) in n {
        if *c > min {
            out.push(k.clone());
        }
    }
    out.sort();
    out
}`,
        why: '“At least `min`” includes `min` itself. With `>` a field read exactly `min` times is dropped.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'You push a fifth `f64` into a `Vec` whose length and capacity are both 4. What happens?',
    options: [
      {
        t: 'It panics: the Vec is full',
        why: 'A `Vec` grows; only fixed-size arrays are full.',
      },
      {
        t: 'It allocates a bigger buffer, moves the four elements there, frees the old one, then appends',
        correct: true,
        why: 'That reallocation is why references into a `Vec` can’t live across a `push`.',
      },
      {
        t: 'It writes past the end of the buffer',
        why: 'Safe Rust never does that.',
      },
      {
        t: 'It links a second buffer onto the first',
        why: 'A `Vec`’s buffer is always one contiguous block.',
      },
    ],
  },
  {
    q: 'Which code does the borrow checker reject?',
    options: [
      {
        t: '`let a = v[0]; v.push(1.0); println!("{}", a);` for a `Vec<f64>`',
        why: '`v[0]` copies the `f64` out, so nothing borrows `v` during the push.',
      },
      {
        t: '`let a = &v[0]; println!("{}", a); v.push(1.0);`',
        why: 'The borrow ends after its last use, before the push.',
      },
      {
        t: '`v.push(1.0); let a = &v[0]; println!("{}", a);`',
        why: 'The push is finished before the borrow starts.',
      },
      {
        t: '`let a = &v[0]; v.push(1.0); println!("{}", a);`',
        correct: true,
        why: 'The shared borrow `a` is still used after the mutable borrow for `push`: E0502.',
      },
    ],
  },
  {
    q: 'Which line counts one more read of `f` in `n: HashMap<String, usize>`?',
    options: [
      {
        t: '`n.insert(f.to_string(), 1);`',
        why: 'That overwrites the count with 1 every time.',
      },
      {
        t: '`*n.entry(f.to_string()).or_insert(0) += 1;`',
        correct: true,
        why: 'It inserts 0 for a new key, then adds one through the mutable reference.',
      },
      {
        t: '`n.get(f) += 1;`',
        why: '`get` returns an `Option` of a shared reference; you can neither add to an `Option` nor change through `&`.',
      },
    ],
  },
  {
    q: 'You print a `HashMap` in two runs of the same program and get different orders. Why?',
    options: [
      {
        t: 'A bug in your program',
        why: 'It is documented behaviour: iteration order is arbitrary.',
      },
      {
        t: 'HashMap sorts by the time each key was last read',
        why: 'It keeps no such information.',
      },
      {
        t: 'The default hasher is randomly seeded, so keys land in different slots each run',
        correct: true,
        why: 'The random seed resists attacks that choose colliding keys. Sort, or use an insertion-ordered map, when order matters.',
      },
    ],
  },
];
