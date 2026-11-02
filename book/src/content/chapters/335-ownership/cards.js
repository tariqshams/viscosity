// Chapter 335 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'own-rules': {
    q: 'State Rust’s three ownership rules.',
    a: 'Each value has an owner. There is only one owner at a time. When the owner goes out of scope, the value is dropped.',
  },
  'own-string-parts': {
    q: 'A `String` has a stack part and a heap part. What is in each?',
    a: 'Stack: a pointer, a length and a capacity (24 bytes on a 64-bit machine). Heap: the text itself.',
  },
  'own-tree': {
    q: 'Why do the arrows of ownership always form a tree?',
    a: 'Every value has exactly one owner, so each value has exactly one arrow pointing at it, from its owner.',
  },
  'own-drop-when': {
    q: 'When is a value dropped, in the ordinary case?',
    a: 'At the closing brace of the block that declared its owner.',
  },
  'own-drop-order': {
    q: 'Three variables are declared in one scope: `x`, then `y`, then `z`. In what order are they dropped?',
    a: 'Reverse order of declaration: `z`, then `y`, then `x`.',
  },
  'own-drop-reassign': {
    q: '`let mut d = String::from("d1"); d = String::from("d2");` When is "d1" freed?',
    a: 'At the assignment: giving `d` a new value drops its old one first.',
  },
  'own-drop-early': {
    q: 'How do you drop a value before the end of its scope, and why does that work?',
    a: 'Call `drop(x)`. It is an ordinary function that takes ownership of `x` and does nothing, so `x` is dropped when `drop` returns.',
  },
  'own-gc-diff': {
    q: 'A mark-and-sweep collector finds garbage at run time; reference counting tracks counts at run time. When does Rust decide where a value is freed?',
    a: 'At compile time: the drop point follows from the code’s shape (the owner’s scope), so nothing is traced or counted while the program runs.',
  },
};

export const examples = {
  drops: {
    title: 'Watching values drop',
    lang: 'rust',
    code: `struct Noisy(&'static str);

// Print a line when a Noisy is dropped.
// (impl and Drop: later chapters.)
impl Drop for Noisy {
    fn drop(&mut self) {
        println!("drop {}", self.0);
    }
}

fn main() {
    let _a = Noisy("a");
    let _b = Noisy("b");
    {
        let _c = Noisy("c");
        println!("inner block ends");
    }
    let mut d = Noisy("d1");
    d = Noisy("d2");
    drop(_b);
    println!("main ends");
}`,
  },
};

export const exercises = {
  bar: {
    lang: 'rust',
    title: 'A bar for a bar chart',
    prompt: `Benchmark charts like the one in *Why Rust? Hello, cargo* can be drawn in a terminal with rows of \`#\`. Write \`bar(n)\`, which **builds and returns** a new \`String\` holding \`n\` hash signs: \`bar(3)\` is \`"###"\`, and \`bar(0)\` is \`""\`.

\`String::new()\` makes an empty \`String\`, \`s.push(c)\` adds the \`char\` \`c\` to the end of \`s\` (which must be \`mut\`), and \`s.len()\` is its length in bytes.`,
    starter: `fn bar(n: usize) -> String {
    todo!()
}`,
    solution: `fn bar(n: usize) -> String {
    let mut s = String::new();
    while s.len() < n {
        s.push('#');
    }
    return s;
}`,
    tests: `#[test]
fn three_hashes() {
    assert_eq!(bar(3), "###");
}

#[test]
fn zero_is_empty() {
    assert_eq!(bar(0), "");
}

#[test]
fn a_long_bar() {
    assert_eq!(bar(40).len(), 40);
}`,
    hints: [
      'Start with an empty `String` that your function owns, and add one `#` at a time until it is long enough.',
      '`let mut s = String::new();` then `while s.len() < n { ... }`. The string must be `mut`, because `push` changes it.',
      'Inside the loop, `s.push(\'#\');` (single quotes: a `char`). After the loop, `return s;` hands the string to the caller.',
    ],
    walkthrough: `**How to think about it.** The function must *make* something on the heap and give it to whoever called. Ask the ownership questions as you go: who owns the new text while it is being built (a local variable, \`s\`), and who owns it afterwards (the caller, because the function hands it over). The length is the stopping rule: keep adding a \`#\` while the text is shorter than \`n\`. Each \`#\` is one byte, so \`s.len()\` counts them exactly.

**The solution, line by line.**

- \`fn bar(n: usize) -> String {\` takes a count (\`usize\`, the type for lengths) and promises to give back an owned \`String\`.
- \`let mut s = String::new();\` makes an empty \`String\`; \`s\` is its owner. It is \`mut\` because we are about to change it.
- \`while s.len() < n {\` repeats while there are fewer than \`n\` signs. For \`n = 0\` the loop never runs.
- \`s.push('#');\` adds one \`char\` to the end, growing the heap text (the \`String\` asks the heap for more room when it needs it).
- \`}\` closes the loop.
- \`return s;\` hands \`s\`, and with it ownership of the heap text, to the caller. That is why the text is *not* freed at the closing brace below: \`s\` no longer owns anything when the function ends. (The next chapter calls this a **move**; and, as *Blocks, if and the tail expression* showed, the last line could just as well be the tail expression \`s\`, without \`return\`.)
- \`}\` closes the function.

**Common wrong attempts.**

- \`let s = String::new();\` without \`mut\`: \`s.push('#')\` changes \`s\`, so rustc reports E0596, “cannot borrow \`s\` as mutable, as it is not declared as mutable”.
- \`s.push("#")\` with double quotes: \`"#"\` is a piece of text (\`&str\`), not a \`char\`, so rustc says “expected \`char\`, found \`&str\`”. (\`s.push_str("#")\` would work, as *Slices and strings* explains.)
- \`while s.len() <= n\` adds one sign too many: \`bar(3)\` would be \`"####"\`.`,
    wrong: [
      {
        code: `fn bar(n: usize) -> String {
    let s = String::new();
    while s.len() < n {
        s.push('#');
    }
    return s;
}`,
        why: '`push` changes `s`, so `s` must be `mut`: rustc reports E0596, “cannot borrow `s` as mutable”.',
      },
      {
        code: `fn bar(n: usize) -> String {
    let mut s = String::new();
    while s.len() <= n {
        s.push('#');
    }
    return s;
}`,
        why: 'With `<=` the loop runs once more, so `bar(3)` is `"####"` and `bar(0)` is `"#"`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'At the end of a scope holding `let p = ...; let q = ...;` (both `String`s), what happens?',
    options: [
      { t: '`q` is dropped, then `p`', correct: true, why: 'Variables drop in reverse order of declaration, and each frees its heap text.' },
      { t: '`p` is dropped, then `q`', why: 'It is the reverse: the last declared is dropped first.' },
      { t: 'Nothing, until the garbage collector runs', why: 'Rust has no garbage collector. Dropping happens right there, at the `}`.' },
      { t: 'They are kept until the program exits', why: 'They are freed as soon as their owners go out of scope.' },
    ],
  },
  {
    q: `Does this compile?
\`\`\`rust
{
    let s = String::from("vm");
}
println!("{s}");
\`\`\``,
    options: [
      { t: 'Yes, and it prints `vm`', why: '`s` belongs to the inner block, and both it and its text are gone after the `}`.' },
      { t: 'Yes, but it prints garbage', why: 'Rust never lets you read freed memory in safe code; the program does not compile.' },
      { t: 'No: E0425, cannot find value `s` in this scope', correct: true, why: 'The name ended with its block, and so did the value it owned.' },
      { t: 'No: `s` must be declared `mut`', why: 'Nothing changes `s`. The problem is the scope.' },
    ],
  },
  {
    q: '`let mut d = String::from("old"); d = String::from("new");` When is the text "old" freed?',
    options: [
      { t: 'At the end of the scope, together with "new"', why: 'Nothing owns "old" after the assignment, so it cannot wait that long.' },
      { t: 'Never: it leaks', why: 'Safe Rust frees it; nothing is forgotten.' },
      { t: 'When the garbage collector next runs', why: 'There is no garbage collector.' },
      { t: 'At the assignment, before `d` takes the new value', correct: true, why: 'Assignment drops the variable’s old value first (the Rust Reference, “Destructors”).' },
    ],
  },
  {
    q: 'How is Rust’s ownership related to reference counting?',
    options: [
      { t: 'It is reference counting done at compile time, where the count is always exactly one', correct: true, why: 'With one owner, the owner’s closing brace is where the count would reach zero, and the compiler knows where it is.' },
      { t: 'Rust counts references at run time, like CPython', why: 'Nothing is counted at run time for an owned value. (`Rc`, in a later chapter, does count, by choice.)' },
      { t: 'They are unrelated', why: 'They answer the same question, when to free, in two different ways.' },
      { t: 'Ownership is a tracing collector', why: 'Nothing is traced: the drop points are known before the program runs.' },
    ],
  },
  {
    q: 'Why does the Rust Drip VM still need a garbage collector, when Rust has ownership?',
    options: [
      { t: 'Rust’s ownership is too slow for a VM', why: 'Speed is not the reason. Ownership costs nothing at run time.' },
      { t: 'Drip programs share objects freely, so the Drip heap cannot be one owner per object', correct: true, why: 'Many Drip values can point at one object, so reachability has to be traced, exactly as in your TypeScript VM.' },
      { t: 'It does not; drip-rs has no collector', why: 'It has one: `gc.rs`, a mark-and-sweep collector.' },
      { t: 'Because the TypeScript version had one', why: 'It is needed for Drip’s own sharing, not for symmetry.' },
    ],
  },
];
