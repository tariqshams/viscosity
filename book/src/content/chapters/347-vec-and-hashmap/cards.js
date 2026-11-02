// Chapter 347 cards. Keys are stable ids: never rename them.

export const prompts = {
  'vec-three': {
    q: 'What three things does a `Vec` value itself (on the stack) hold?',
    a: 'A pointer to its heap buffer, its length and its capacity.',
  },
  'vec-cap': {
    q: 'What is the difference between a `Vec`’s length and its capacity?',
    a: 'Length is how many elements are in use; capacity is how many fit in the buffer before it must grow.',
  },
  'vec-same-type': {
    q: 'Why can a `Vec<f64>` store its numbers side by side with no boxes?',
    a: 'Every element has the same type and size, so element i sits at a fixed offset, i × 8 bytes.',
  },
  'vec-get': {
    q: 'What is the difference between `v[5]` and `v.get(5)` on a two-element `Vec`?',
    a: '`v[5]` panics (index out of bounds); `v.get(5)` returns `None`.',
  },
  'vec-push-borrow': {
    q: 'Why does Rust reject a `push` while a reference into the `Vec` is still in use?',
    a: 'The push may move the elements to a new buffer, leaving the reference pointing at freed memory (E0502).',
  },
  'vec-oob': {
    q: 'What happens when a Rust program reads `v[i]` with `i` past the end?',
    a: 'It panics with “index out of bounds”, instead of reading whatever memory is there.',
  },
  'vec-loops': {
    q: 'What do `for x in &v`, `for x in &mut v` and `for x in v` each give you?',
    a: 'A shared reference to each element; a mutable reference to each; the elements themselves, using `v` up.',
  },
  'vec-slice-param': {
    q: 'Why should a function that only reads numbers take `&[f64]` rather than `&Vec<f64>`?',
    a: 'A `&Vec<f64>` turns into a slice automatically, and the function then also works on arrays and parts of a `Vec`.',
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
};

const SIG = `fn add_constant(cs: &mut Vec<f64>,
    v: f64) -> usize {`;

export const exercises = {
  constants: {
    lang: 'rust',
    title: 'A constant pool without repeats',
    prompt:
      'Drip’s compiler keeps each function’s constants in a `Vec`, and the bytecode names a constant by its index. Write `add_constant(cs, v)`: if a constant equal to `v` is already in `cs`, return its index and add nothing; otherwise push `v` and return the index it now has. (The companion’s `Chunk::add_constant` always pushes; reusing equal constants keeps the pool small, which matters because an instruction can only name 65,536 of them.)',
    starter: `${SIG}
    0
}`,
    solution: `${SIG}
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
        code: `${SIG}
    cs.push(v);
    cs.len() - 1
}`,
        why: 'It never looks for an equal constant, so `1.5` added twice is stored twice.',
      },
      {
        code: `${SIG}
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
      { t: 'It always doubles', why: 'Doubling is what this machine showed, but the docs guarantee no particular strategy.' },
      { t: 'No particular strategy, but `push` is amortised constant time', correct: true, why: 'Also promised: `with_capacity(n)` has room for at least n, and a Vec never shrinks by itself.' },
      { t: 'It grows by one element each time', why: 'That would make n pushes cost n² work; the docs promise amortised constant time.' },
    ],
  },
  {
    q: 'Which code does the borrow checker reject?',
    options: [
      { t: '`let a = v[0]; v.push(1.0); println!("{}", a);` for a `Vec<f64>`', why: '`v[0]` copies the `f64` out, so nothing borrows `v` during the push.' },
      { t: '`let a = &v[0]; println!("{}", a); v.push(1.0);`', why: 'The borrow ends after its last use, before the push.' },
      { t: '`v.push(1.0); let a = &v[0]; println!("{}", a);`', why: 'The push is finished before the borrow starts.' },
      { t: '`let a = &v[0]; v.push(1.0); println!("{}", a);`', correct: true, why: 'The shared borrow `a` is still used after the mutable borrow for `push`: E0502.' },
    ],
  },
  {
    q: 'What does `xs.pop()` return when `xs` is `vec![1.5, 2.5]`, and when it is empty?',
    options: [
      { t: '`2.5`, and `0.0` when empty', why: 'There is no sensible default, so `pop` returns an `Option`.' },
      { t: '`Some(2.5)`, and `None` when empty', correct: true, why: 'It removes the last element and wraps it; an empty `Vec` has nothing to give.' },
      { t: '`Some(1.5)`, and `None` when empty', why: '`pop` takes from the end, like a stack.' },
    ],
  },
  {
    q: 'After `for x in v { ... }`, can you call `v.len()`?',
    options: [
      { t: 'No: the loop moved the elements out and used `v` up (E0382)', correct: true, why: 'rustc’s help suggests `for x in &v` to borrow instead.' },
      { t: 'Yes: loops always borrow', why: 'Only `&v` and `&mut v` borrow; plain `v` is moved into the loop.' },
      { t: 'Yes, and it returns 0', why: 'It doesn’t compile at all.' },
    ],
  },
];
