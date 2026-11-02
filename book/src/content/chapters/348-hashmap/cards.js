// Chapter 347-b cards. Keys are stable ids: never rename them.

export const prompts = {
  'map-import': {
    q: 'What must a Rust file write before it can use `HashMap`?',
    a: '`use std::collections::HashMap;` (unlike `Vec`, it is not imported automatically).',
  },
  'map-get': {
    q: 'What does `m.get(k)` return, and why not just the value?',
    a: '`Option<&V>`: `None` if the key is missing, otherwise a borrowed look at the value, which the map keeps owning.',
  },
  'map-entry': {
    q: 'What does `m.entry(k).or_insert(0)` return?',
    a: 'A mutable reference to the value for `k`, after inserting `0` if `k` was not there yet.',
  },
  'map-insert': {
    q: 'What does `insert` do when the key is already in the map?',
    a: 'It replaces the value and returns the old one, `Some(old)`; the key still appears once.',
  },
  'map-own': {
    q: 'After `m.insert(k, 1)` with `k: String`, can you still use `k`?',
    a: 'No: the key moved into the map (E0382). Insert `k.clone()` if you need to keep it.',
  },
  'map-index': {
    q: 'What does `m["mass"]` do when `"mass"` is not a key?',
    a: 'It panics with “no entry found for key”; `get` returns `None` instead.',
  },
  'map-order': {
    q: 'Can you rely on the order in which a `HashMap` gives back its entries?',
    a: 'No. It is arbitrary, and with the randomly seeded default hasher it changes from run to run.',
  },
  'map-indexmap': {
    q: 'Why does the Rust port of Viscosity use `IndexMap` in places?',
    a: 'It keeps insertion order, so its decisions and output match the TypeScript reference exactly.',
  },
};

export const examples = {
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

const HEAD = `use std::collections::HashMap;

fn count_fields(used: &[&str])
    -> HashMap<String, usize> {`;

export const exercises = {
  countFields: {
    lang: 'rust',
    title: 'Count field accesses',
    prompt:
      'Viscosity’s analysis records which fields a loop reads. Write `count_fields(used)`, which takes the field names in the order they were read and returns a `HashMap<String, usize>` from each name to how many times it was read. The map must own its keys, so make a `String` from each `&str` with `f.to_string()`.',
    starter: `${HEAD}
    todo!()
}`,
    solution: `${HEAD}
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
        code: `${HEAD}
    let mut n = HashMap::new();
    for f in used {
        n.insert(f.to_string(), 1);
    }
    n
}`,
        why: '`insert` overwrites, so every field ends up with a count of 1, however often it was read.',
      },
      {
        code: `${HEAD}
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
    prompt:
      'Write `hot_fields(n, min)`, which returns the names whose count is at least `min`, **sorted alphabetically** so the answer doesn’t depend on the map’s order. Loop with `for (k, c) in n`, push into a `Vec<String>`, then call `sort()` on it.',
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
    q: 'What is `m.get("x")` for a `HashMap<String, usize>` that holds `"x"` with count 2?',
    options: [
      { t: '`2`', why: '`get` can fail, so it doesn’t return a bare value.' },
      { t: '`Some(&2)`', correct: true, why: 'An `Option` holding a reference: the map keeps owning the value.' },
      { t: '`Some(2)`', why: 'It lends the value instead of copying or moving it out.' },
      { t: '`Ok(2)`', why: 'A missing key isn’t an error with a reason; it’s an absence, so `Option`.' },
    ],
  },
  {
    q: 'Which line counts one more read of `f` in `n: HashMap<String, usize>`?',
    options: [
      { t: '`n.insert(f.to_string(), 1);`', why: 'That overwrites the count with 1 every time.' },
      { t: '`*n.entry(f.to_string()).or_insert(0) += 1;`', correct: true, why: 'It inserts 0 for a new key, then adds one through the mutable reference.' },
      { t: '`n.get(f) += 1;`', why: '`get` returns an `Option` of a shared reference; you can neither add to an `Option` nor change through `&`.' },
    ],
  },
  {
    q: 'You print a `HashMap` in two runs of the same program and get different orders. Why?',
    options: [
      { t: 'A bug in your program', why: 'It is documented behaviour: iteration order is arbitrary.' },
      { t: 'HashMap sorts by the time each key was last read', why: 'It keeps no such information.' },
      { t: 'The default hasher is randomly seeded, so keys land in different slots each run', correct: true, why: 'The random seed resists attacks that choose colliding keys. Sort, or use an insertion-ordered map, when order matters.' },
    ],
  },
  {
    q: '`let k = String::from("x"); m.insert(k, 1); println!("{}", k);` What happens?',
    options: [
      { t: 'E0382: `k` moved into the map', correct: true, why: 'The map owns its keys. Insert `k.clone()` to keep a copy.' },
      { t: 'It prints `x`', why: 'Inserting moves the `String`; nothing is copied for you.' },
      { t: 'The map stores a reference to `k`', why: 'The key type is `String`, so the map stores the `String` itself.' },
    ],
  },
  {
    q: 'How does drip-rs’s `Table` differ from std’s `HashMap`?',
    options: [
      { t: 'It is a wrapper around `HashMap`', why: 'It is its own open-addressing table over two `Vec`s.' },
      { t: 'It uses SipHash to resist attacks', why: 'It never hashes during lookups; the hash was computed when the string was interned.' },
      { t: 'It is a struct of arrays with linear probing and tombstones, and its interned keys carry their hash', correct: true, why: 'It is the hash table of Part IV, ported. std’s map is a SwissTable port with quadratic probing and SipHash 1-3.' },
    ],
  },
];
