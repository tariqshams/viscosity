// Chapter 208 cards. Keys are stable ids: never rename them.

export const prompts = {
  'vec-three': {
    q: 'What three things does a `Vec<T>` value itself hold?',
    a: 'A pointer to its heap buffer, its length and its capacity.',
  },
  'vec-cap': {
    q: 'What is the difference between a `Vec`’s length and its capacity?',
    a: 'Length is how many elements are in use; capacity is how many fit in the buffer before it must reallocate.',
  },
  'vec-same-type': {
    q: 'Why can a `Vec<f64>` store its numbers side by side with no boxes, unlike a JavaScript array?',
    a: 'Every element has the same type, `f64`, so each takes the same 8 bytes and the buffer is just those values in a row.',
  },
  'vec-get': {
    q: 'What is the difference between `v[9]` and `v.get(9)` on a short `Vec`?',
    a: '`v[9]` panics (index out of bounds); `v.get(9)` returns `None`.',
  },
  'vec-push-borrow': {
    q: 'Why won’t Rust let you `push` while holding `let first = &v[0];`?',
    a: 'The push might reallocate and move the elements, leaving `first` pointing at freed memory. It’s the shared-or-mutable rule.',
  },
  'vec-loops': {
    q: 'What do `for x in &v`, `for x in &mut v` and `for x in v` each give you?',
    a: 'Shared references, mutable references, or the elements themselves (moving them out and using up `v`).',
  },
  'map-get': {
    q: 'Why does `HashMap::get` return an `Option`?',
    a: 'The key might not be in the map: `None` says so, `Some(&v)` lends the value.',
  },
  'map-entry': {
    q: 'What does `*m.entry(k).or_insert(0) += 1` do?',
    a: 'Finds the value for `k`, inserting `0` first if it is missing, and adds one to it through the mutable reference.',
  },
  'map-order': {
    q: 'Why does the Rust port of Viscosity use `IndexMap` in places instead of `HashMap`?',
    a: '`HashMap` iterates in an arbitrary order; `IndexMap` keeps insertion order, like a JavaScript `Map`, so decisions and output match the TypeScript engine.',
  },
  'drip-table': {
    q: 'Why does drip-rs’s table never call a hash function?',
    a: 'Its keys are interned strings whose handles carry their hash, computed once when the string was interned.',
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
    n.insert("mass", 0);
    println!("{}", n.len());
    // Run it twice: the order changes.
    println!("{:?}", n);
}`,
  },
};

export const exercises = {
  countFields: {
    lang: 'rust',
    title: 'Count field accesses',
    prompt:
      'Viscosity’s analysis records which fields a loop reads. Write `count_fields(used)`, which takes the field names in the order they were read and returns a `HashMap<String, usize>` from each name to how many times it was read.',
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
      'Start with `let mut n = HashMap::new();` and return `n` at the end.',
      'The map owns `String` keys, but you have `&str`s: make one with `f.to_string()`.',
      'For each name, `*n.entry(k).or_insert(0) += 1;` inserts 0 the first time and then counts.',
    ],
    walkthrough: `Three ideas from this chapter meet here.

- **The map owns its keys.** The return type says \`String\`, not \`&str\`, so the map doesn’t borrow from the caller’s slice. \`f.to_string()\` makes an owned copy, and \`entry(k)\` moves it into the map.
- **\`entry\` does the “is it there yet?” check for you.** \`or_insert(0)\` puts in a zero only if the key is new, and either way returns \`&mut usize\`. The \`*\` in front lets \`+= 1\` change the number the reference points at.
- **Lookups give \`Option\`.** The tests compare \`m.get("x")\` with \`Some(&2)\`: a borrowed count, because the map still owns it. \`get\` accepts a \`&str\` even though the keys are \`String\`s.

In TypeScript this would be \`m.set(f, (m.get(f) ?? 0) + 1)\`, which looks the key up twice. The entry API looks it up once.`,
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
        why: '`or_insert(1)` only sets the first count. Later reads find the entry already there and change nothing, so repeats are never counted.',
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
    walkthrough: `Iterating a borrowed map lends you each key and value, so \`k\` is a \`&String\`. The \`Vec\` must own its strings, because the result outlives the loop, so you push \`k.clone()\`, a copy.

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
      { t: 'It panics: the Vec is full', why: 'A `Vec` grows; only fixed-size arrays are full.' },
      { t: 'It allocates a bigger buffer, moves the four elements there, frees the old one, then appends', correct: true, why: 'That reallocation is why references into a `Vec` can’t live across a `push`.' },
      { t: 'It writes past the end of the buffer', why: 'Safe Rust never does that.' },
      { t: 'It links a second buffer onto the first', why: 'A `Vec`’s buffer is always one contiguous block.' },
    ],
  },
  {
    q: 'What does the standard library promise about how much a `Vec` grows?',
    options: [
      { t: 'It always doubles', why: 'Doubling is what this machine showed, but the docs explicitly guarantee no particular strategy.' },
      { t: 'It grows by one element each time', why: 'That would make `push` O(n), and the docs promise amortized O(1).' },
      { t: 'No particular strategy, but `push` is amortized O(1)', correct: true, why: 'Also guaranteed: `with_capacity(n)` allocates exactly enough for n, and a Vec never shrinks by itself.' },
    ],
  },
  {
    q: 'Which code does the borrow checker reject?',
    options: [
      { t: '`let a = v[0]; v.push(1.0); println!("{}", a);` for a `Vec<f64>`', why: '`v[0]` copies the `f64` out, so nothing borrows `v` during the push.' },
      { t: '`let a = &v[0]; println!("{}", a); v.push(1.0);`', why: 'The borrow ends after its last use, before the push.' },
      { t: '`let a = &v[0]; v.push(1.0); println!("{}", a);`', correct: true, why: 'The shared borrow `a` is still used after the mutable borrow for `push`: E0502.' },
      { t: '`v.push(1.0); let a = &v[0]; println!("{}", a);`', why: 'The push is finished before the borrow starts.' },
    ],
  },
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
    q: 'You print a `HashMap` in two runs of the same program and get different orders. Why?',
    options: [
      { t: 'A bug in your program', why: 'It is documented behaviour: iteration order is arbitrary.' },
      { t: 'The default hasher is randomly seeded, so keys land in different slots each run', correct: true, why: 'The random seed is part of resisting HashDoS attacks. Sort, or use an insertion-ordered map, when order matters.' },
      { t: 'HashMap sorts by the time each key was last read', why: 'It keeps no such information.' },
    ],
  },
  {
    q: 'How does drip-rs’s `Table` differ from std’s `HashMap`?',
    options: [
      { t: 'It is a struct of arrays with linear probing and tombstones, and its interned keys carry their hash', correct: true, why: 'It is chapter 80’s table, ported. std’s map is a SwissTable port with quadratic probing and SipHash 1-3.' },
      { t: 'It is a wrapper around `HashMap`', why: 'It is its own open-addressing table over two `Vec`s.' },
      { t: 'It uses SipHash to resist attacks', why: 'It never hashes during lookups; the hash was computed when the string was interned.' },
      { t: 'It keeps keys in sorted order', why: 'It keeps them in hash order, by slot.' },
    ],
  },
];
