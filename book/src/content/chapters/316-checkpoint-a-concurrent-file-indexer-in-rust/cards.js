// Chapter 286 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  inverted: {
    q: 'What is an **inverted index**?',
    a: 'A map from each word to the set of documents (here, files) that contain it.',
  },
  'btree-why': {
    q: 'Why does the indexer use `BTreeMap` and `BTreeSet` rather than `HashMap` and `HashSet`?',
    a: 'They keep keys sorted, so every run gives the same order, and whole indexes can be compared in tests.',
  },
  'shared-rx': {
    q: 'Several worker threads must take jobs from one channel. How is its receiver shared?',
    a: 'Wrapped as `Arc<Mutex<Receiver<_>>>`: `Arc` for shared ownership across threads, `Mutex` so only one worker calls `recv` at a time.',
  },
  'drop-tx': {
    q: 'Why does `index_parallel` call `drop(tx)` after sending every path?',
    a: 'So the channel closes once it is empty: `recv` then returns `Err`, and each worker’s loop ends instead of waiting forever.',
  },
  'while-let-lock': {
    q: 'Why is `while let Ok(p) = rx.lock().unwrap().recv() { ... }` a bad worker loop?',
    a: '`while let` keeps the lock guard alive for the whole loop body, so only one worker can work at a time.',
  },
  closed: {
    q: 'The main thread loops `for part in parts`. When does that loop end?',
    a: 'When every sender is gone: each worker’s clone is dropped when it finishes, and `main` dropped its own with `drop(out)`.',
  },
  bottleneck: {
    q: 'Four workers made the indexer only 2.4 times faster than one. What was the slow stage?',
    a: 'The single main thread merging every per-file index into the result; it was busy for nearly the whole run.',
  },
  'local-merge': {
    q: 'What change took the 4-worker run from about 251 ms to 152 ms?',
    a: 'Each worker merged into its own index and sent one result at the end, so far less merging happened on the main thread.',
  },
};

export const examples = {
  pool: {
    lang: 'rust',
    title: 'A worker pool, on its own',
    code: `use std::sync::mpsc;
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    // A queue of jobs, then no more.
    let (tx, rx) = mpsc::channel();
    for n in 1..=8u64 {
        tx.send(n).unwrap();
    }
    drop(tx);

    // Three workers share the queue.
    let rx = Arc::new(Mutex::new(rx));
    let (out, done) = mpsc::channel();
    for id in 0..3 {
        let rx = Arc::clone(&rx);
        let out = out.clone();
        thread::spawn(move || loop {
            let job = rx
                .lock()
                .unwrap()
                .recv();
            let Ok(n) = job else {
                break;
            };
            out.send((id, n, n * n))
                .unwrap();
        });
    }
    drop(out);

    // Results arrive in any order.
    let mut total = 0;
    for (id, n, sq) in done {
        println!("w{id}: {n}^2 = {sq}");
        total += sq;
    }
    println!("total {total}");
}`,
  },
};

export const exercises = {
  words: {
    optional: true,
    lang: 'rust',
    title: 'Warm-up: split text into words',
    prompt: 'Write `words(text)`: split the text wherever there is a character that is not alphanumeric (so punctuation, spaces, tabs and newlines all separate words), drop empty pieces, and lowercase each word. Letters with accents and digits count as part of words.',
    starter: `use std::collections::BTreeMap;
use std::collections::BTreeSet;

type Files = BTreeSet<String>;
/// word -> the files it appears in
type Index = BTreeMap<String, Files>;

fn words(text: &str) -> Vec<String> {
    todo!()
}`,
    solution: `use std::collections::BTreeMap;
use std::collections::BTreeSet;

type Files = BTreeSet<String>;
/// word -> the files it appears in
type Index = BTreeMap<String, Files>;

fn words(text: &str) -> Vec<String> {
    text.split(|c: char| {
        !c.is_alphanumeric()
    })
    .filter(|w| !w.is_empty())
    .map(|w| w.to_lowercase())
    .collect()
}`,
    tests: `#[test]
fn splits_on_spaces() {
    assert_eq!(words("a cat sat"),
        vec!["a", "cat", "sat"]);
}

#[test]
fn drops_punctuation_and_lowercases() {
    assert_eq!(words("Hello, World! Hello."),
        vec!["hello", "world", "hello"]);
}

#[test]
fn keeps_digits_and_accents() {
    assert_eq!(words("café no.2\\tlast-line"),
        vec!["café", "no", "2", "last", "line"]);
}

#[test]
fn empty_and_blank_give_nothing() {
    assert!(words("").is_empty());
    assert!(words("  ,.;  \\n").is_empty());
}`,
    hints: [
      '`str::split` accepts a closure that decides which characters are separators.',
      'Splitting `"a, b"` on non-alphanumeric characters gives `"a"`, `""` and `"b"`: the comma and the space each make a cut. Throw the empty pieces away with `filter`.',
      '`text.split(|c: char| !c.is_alphanumeric()).filter(|w| !w.is_empty()).map(|w| w.to_lowercase()).collect()`.',
    ],
    walkthrough: `**How to think about it.** Decide what a word is before writing code: a run of letters or digits. Everything else is a separator. Rust’s \`split\` can cut a string wherever a closure says “yes, this character separates”, which is the whole definition in one line; the rest is tidying up what \`split\` returns.

**The solution, line by line.**

- \`text.split(|c: char| { !c.is_alphanumeric() })\` cuts at every character that is not a letter or digit. \`is_alphanumeric\` follows Unicode, so \`é\` is a letter and \`café\` stays whole. The \`: char\` annotation tells the compiler which kind of pattern this closure is.
- \`.filter(|w| !w.is_empty())\` removes the empty strings that appear between two separators in a row (\`", "\`) and at the ends.
- \`.map(|w| w.to_lowercase())\` makes \`Hello\` and \`hello\` the same word. \`to_lowercase\` returns a new \`String\`, which is what we want to keep.
- \`.collect()\` gathers the strings into the \`Vec<String>\` the signature promises.

**Common wrong attempts.**

- \`split_whitespace()\` keeps punctuation attached: \`"Hello,"\` and \`"World!"\` are not the words \`hello\` and \`world\`.
- Forgetting \`to_lowercase\`: the index would then hold \`Hello\` and \`hello\` as two different words.`,
    wrong: [
      {
        code: `use std::collections::BTreeMap;
use std::collections::BTreeSet;

type Files = BTreeSet<String>;
/// word -> the files it appears in
type Index = BTreeMap<String, Files>;

fn words(text: &str) -> Vec<String> {
    text.split_whitespace()
        .map(|w| w.to_lowercase())
        .collect()
}`,
        why: 'Splits only at whitespace, so punctuation stays stuck to the words.',
      },
      {
        code: `use std::collections::BTreeMap;
use std::collections::BTreeSet;

type Files = BTreeSet<String>;
/// word -> the files it appears in
type Index = BTreeMap<String, Files>;

fn words(text: &str) -> Vec<String> {
    text.split(|c: char| {
        !c.is_alphanumeric()
    })
    .filter(|w| !w.is_empty())
    .map(|w| w.to_string())
    .collect()
}`,
        why: 'Never lowercases, so `Hello` and `hello` are different words.',
      },
    ],
  },
  'index-text': {
    lang: 'rust',
    title: '1. Index one file, and merge two indexes',
    prompt: 'Using `words` (given), write `index_text(name, text)`, which returns an `Index` mapping every word of `text` to the set `{name}`, and `merge(to, from)`, which adds every word and file of `from` into `to`, so that a word in both ends up with the union of their file sets.',
    starter: `use std::collections::BTreeMap;
use std::collections::BTreeSet;

type Files = BTreeSet<String>;
/// word -> the files it appears in
type Index = BTreeMap<String, Files>;

fn words(text: &str) -> Vec<String> {
    text.split(|c: char| {
        !c.is_alphanumeric()
    })
    .filter(|w| !w.is_empty())
    .map(|w| w.to_lowercase())
    .collect()
}

fn index_text(name: &str, text: &str)
    -> Index {
    todo!()
}

fn merge(to: &mut Index, from: Index) {
    todo!()
}`,
    solution: `use std::collections::BTreeMap;
use std::collections::BTreeSet;

type Files = BTreeSet<String>;
/// word -> the files it appears in
type Index = BTreeMap<String, Files>;

fn words(text: &str) -> Vec<String> {
    text.split(|c: char| {
        !c.is_alphanumeric()
    })
    .filter(|w| !w.is_empty())
    .map(|w| w.to_lowercase())
    .collect()
}

fn index_text(name: &str, text: &str)
    -> Index {
    let mut idx = Index::new();
    for w in words(text) {
        idx.entry(w)
            .or_default()
            .insert(name.to_string());
    }
    idx
}

fn merge(to: &mut Index, from: Index) {
    for (w, names) in from {
        to.entry(w)
            .or_default()
            .extend(names);
    }
}`,
    tests: `fn set(xs: &[&str]) -> BTreeSet<String> {
    xs.iter().map(|s| s.to_string()).collect()
}

#[test]
fn one_file_one_entry_per_word() {
    let idx = index_text("a.txt", "the cat, the hat");
    assert_eq!(idx.len(), 3);
    assert_eq!(idx["the"], set(&["a.txt"]));
    assert_eq!(idx["hat"], set(&["a.txt"]));
}

#[test]
fn words_are_lowercased_in_the_index() {
    let idx = index_text("a.txt", "Cat CAT cat");
    assert_eq!(idx.len(), 1);
    assert!(idx.contains_key("cat"));
}

#[test]
fn empty_text_gives_an_empty_index() {
    assert!(index_text("a.txt", " ... ").is_empty());
}

#[test]
fn merge_unions_the_file_sets() {
    let mut idx = index_text("a.txt", "red fox");
    merge(&mut idx, index_text("b.txt", "red hen"));
    assert_eq!(idx["red"], set(&["a.txt", "b.txt"]));
    assert_eq!(idx["fox"], set(&["a.txt"]));
    assert_eq!(idx["hen"], set(&["b.txt"]));
}

#[test]
fn merge_into_empty_copies() {
    let mut idx = Index::new();
    let b = index_text("b.txt", "one two");
    merge(&mut idx, b.clone());
    assert_eq!(idx, b);
}`,
    hints: [
      'Both functions do the same thing for each word: find its set (making an empty one if it is new) and add to it.',
      'The `entry` API does “find or make”: `idx.entry(w).or_default()` gives a `&mut Files`, creating an empty set the first time.',
      'In `index_text`, `.insert(name.to_string())` adds one name; in `merge`, `.extend(names)` adds a whole set. A set ignores duplicates for you.',
    ],
    walkthrough: `**How to think about it.** Picture the card catalogue: indexing a file means, for each word in it, finding that word’s card (or starting a new one) and writing the file’s name on it. Merging two catalogues means the same for every card of the second: find or start the matching card in the first and copy the names across. Both are “find or make, then add”, which \`BTreeMap::entry\` does in one step. Sets make repeats harmless: \`the\` appearing twice in a file writes the name once.

**The solution, line by line.**

- \`fn index_text(name: &str, text: &str) -> Index {\` borrows both strings; the index it returns owns its own copies.
- \`let mut idx = Index::new();\` starts empty.
- \`for w in words(text) {\` visits every word, in order, with repeats. Each \`w\` is an owned \`String\`, so it can become a key without copying.
- \`idx.entry(w).or_default().insert(name.to_string());\` looks up \`w\`, inserting an empty \`Files\` set if it is new (\`or_default\` uses \`Default\`, and an empty set is the default), and adds the file name. If the name is already there, \`insert\` does nothing.
- \`idx\` is returned.
- \`fn merge(to: &mut Index, from: Index) {\` borrows the target mutably and takes \`from\` by value, because we are allowed to move its strings instead of copying them.
- \`for (w, names) in from {\` consumes \`from\`, handing out owned keys and sets.
- \`to.entry(w).or_default().extend(names);\` finds or makes the word’s set in \`to\` and adds every name: the union.

**Common wrong attempts.**

- \`to.insert(w, names)\` in \`merge\`. For a word already in \`to\`, \`insert\` *replaces* the set, so \`red\` from \`a.txt\` disappears when \`b.txt\` also has it. The test \`merge_unions_the_file_sets\` catches this.
- Keeping a \`Vec<String>\` of names instead of a set. Repeated words then add the same name many times, and the order depends on input; that is why the type is \`BTreeSet\`.
- Writing \`idx.get_mut(&w)\` and then \`insert\` in two steps: it works, but needs a second lookup and an \`if let\`, which \`entry\` exists to avoid.`,
    wrong: [
      {
        code: `use std::collections::BTreeMap;
use std::collections::BTreeSet;

type Files = BTreeSet<String>;
/// word -> the files it appears in
type Index = BTreeMap<String, Files>;

fn words(text: &str) -> Vec<String> {
    text.split(|c: char| {
        !c.is_alphanumeric()
    })
    .filter(|w| !w.is_empty())
    .map(|w| w.to_lowercase())
    .collect()
}

fn index_text(name: &str, text: &str)
    -> Index {
    let mut idx = Index::new();
    for w in words(text) {
        idx.entry(w)
            .or_default()
            .insert(name.to_string());
    }
    idx
}

fn merge(to: &mut Index, from: Index) {
    for (w, names) in from {
        to.insert(w, names);
    }
}`,
        why: '`insert` replaces the set for a word already present, instead of adding to it.',
      },
    ],
  },
  'find-files': {
    optional: true,
    lang: 'rust',
    title: '2. Find every .txt file under a folder',
    prompt: 'Write `find_files(dir)`: return the paths of every file whose extension is `txt`, in `dir` and in all folders below it, sorted. If `dir` cannot be read (it does not exist, for example), return the error. A helper that walks one folder and calls itself for subfolders is a good shape.',
    starter: `use std::fs;
use std::io;
use std::path::{Path, PathBuf};

fn find_files(dir: &Path)
    -> io::Result<Vec<PathBuf>> {
    todo!()
}`,
    solution: `use std::fs;
use std::io;
use std::path::{Path, PathBuf};

fn find_files(dir: &Path)
    -> io::Result<Vec<PathBuf>> {
    let mut out = Vec::new();
    walk(dir, &mut out)?;
    out.sort();
    Ok(out)
}

fn walk(
    dir: &Path,
    out: &mut Vec<PathBuf>,
) -> io::Result<()> {
    for entry in fs::read_dir(dir)? {
        let path = entry?.path();
        if path.is_dir() {
            walk(&path, out)?;
        } else if path.extension()
            == Some("txt".as_ref())
        {
            out.push(path);
        }
    }
    Ok(())
}`,
    tests: `use std::fs;
use std::path::PathBuf;

// A fresh, empty folder for one test.
fn scratch(name: &str) -> PathBuf {
    let d = std::env::temp_dir().join(format!(
        "ix-{}-{name}", std::process::id()));
    let _ = fs::remove_dir_all(&d);
    fs::create_dir_all(&d).unwrap();
    d
}

fn put(d: &PathBuf, rel: &str, text: &str) {
    let p = d.join(rel);
    fs::create_dir_all(p.parent().unwrap()).unwrap();
    fs::write(p, text).unwrap();
}

#[test]
fn finds_txt_files_at_the_top() {
    let d = scratch("top");
    put(&d, "a.txt", "x");
    put(&d, "b.txt", "y");
    let got = find_files(&d).unwrap();
    assert_eq!(got, vec![d.join("a.txt"), d.join("b.txt")]);
}

#[test]
fn skips_other_extensions() {
    let d = scratch("ext");
    put(&d, "a.txt", "x");
    put(&d, "b.md", "y");
    put(&d, "txt", "z");
    assert_eq!(find_files(&d).unwrap(), vec![d.join("a.txt")]);
}

#[test]
fn goes_into_subfolders_and_sorts() {
    let d = scratch("deep");
    put(&d, "z.txt", "1");
    put(&d, "sub/inner/c.txt", "2");
    put(&d, "sub/b.txt", "3");
    let got = find_files(&d).unwrap();
    assert_eq!(got, vec![
        d.join("sub/b.txt"),
        d.join("sub/inner/c.txt"),
        d.join("z.txt"),
    ]);
}

#[test]
fn a_missing_folder_is_an_error() {
    let d = scratch("gone").join("nope");
    assert!(find_files(&d).is_err());
}`,
    hints: [
      '`fs::read_dir(dir)?` gives an iterator over the entries of one folder; each entry is itself a `Result`, so it needs a `?` too. `entry?.path()` is its full path.',
      'For each path: if `path.is_dir()`, walk into it (recursion); otherwise keep it if `path.extension() == Some("txt".as_ref())`.',
      'Write `fn walk(dir: &Path, out: &mut Vec<PathBuf>) -> io::Result<()>` and call it from `find_files` with an empty vector, then `out.sort()` and `Ok(out)`.',
    ],
    walkthrough: `**How to think about it.** A folder tree is a tree, so walking it is recursion (as in *Recursion and the call stack* in Part I): handle the files in this folder, and for each subfolder do the same thing again. Errors are the other half: reading a folder can fail, and so can reading each entry, so the functions return \`io::Result\` and pass failures up with \`?\`. Sorting at the end makes the answer independent of the order the operating system lists files in, which differs between systems.

**The solution, line by line.**

- \`fn find_files(dir: &Path) -> io::Result<Vec<PathBuf>> {\` takes a borrowed path (a \`&Path\` is to \`PathBuf\` what \`&str\` is to \`String\`) and returns owned paths, or an I/O error.
- \`let mut out = Vec::new(); walk(dir, &mut out)?;\` collects into one vector, passed down by mutable reference so every level of the recursion adds to the same list. \`?\` returns early if any folder could not be read.
- \`out.sort(); Ok(out)\` sorts the paths (lexicographically, so \`sub/b.txt\` comes before \`z.txt\`) and returns them.
- \`fn walk(dir: &Path, out: &mut Vec<PathBuf>) -> io::Result<()> {\` does one folder.
- \`for entry in fs::read_dir(dir)? {\` opens the folder; a missing folder fails here, which is the last test.
- \`let path = entry?.path();\` unwraps one entry (which can also fail) and gets its full path, the folder joined with the entry’s name.
- \`if path.is_dir() { walk(&path, out)?; }\` recurses into subfolders.
- \`else if path.extension() == Some("txt".as_ref()) { out.push(path); }\` keeps \`.txt\` files. \`extension\` returns an \`Option<&OsStr>\` (file names are not always valid UTF-8), and \`"txt".as_ref()\` turns the literal into an \`&OsStr\` to compare with. A file named \`txt\` with no dot has no extension, so it is not kept.
- \`Ok(())\` reports success for this folder.

**Common wrong attempts.**

- Not recursing: only the top folder’s files are found, and \`goes_into_subfolders_and_sorts\` fails.
- Testing the name with \`ends_with("txt")\`. A file called \`txt\`, or \`notes.newtxt\`, would be kept; \`extension\` looks only at what follows the last dot.
- \`unwrap()\` instead of \`?\`: a missing folder then panics instead of returning an error the caller can handle.
- Forgetting to sort: the tests may pass on one machine and fail on another, because \`read_dir\` promises no order.`,
    wrong: [
      {
        code: `use std::fs;
use std::io;
use std::path::{Path, PathBuf};

fn find_files(dir: &Path)
    -> io::Result<Vec<PathBuf>> {
    let mut out = Vec::new();
    walk(dir, &mut out)?;
    out.sort();
    Ok(out)
}

fn walk(
    dir: &Path,
    out: &mut Vec<PathBuf>,
) -> io::Result<()> {
    for entry in fs::read_dir(dir)? {
        let path = entry?.path();
        if path.extension()
            == Some("txt".as_ref())
        {
            out.push(path);
        }
    }
    Ok(())
}`,
        why: 'Never goes into subfolders, so `sub/b.txt` and `sub/inner/c.txt` are missing.',
      },
      {
        code: `use std::fs;
use std::io;
use std::path::{Path, PathBuf};

fn find_files(dir: &Path)
    -> io::Result<Vec<PathBuf>> {
    let mut out = Vec::new();
    walk(dir, &mut out)?;
    out.sort();
    Ok(out)
}

fn walk(
    dir: &Path,
    out: &mut Vec<PathBuf>,
) -> io::Result<()> {
    for entry in fs::read_dir(dir)? {
        let path = entry?.path();
        if path.is_dir() {
            walk(&path, out)?;
        } else if path
            .to_string_lossy()
            .ends_with("txt")
        {
            out.push(path);
        }
    }
    Ok(())
}`,
        why: '`ends_with("txt")` also accepts a file named just `txt`, which has no extension.',
      },
    ],
  },
  'index-parallel': {
    lang: 'rust',
    title: '3. Index many files on several threads',
    prompt: 'Write `index_parallel(paths, workers)`: start `workers` threads (at least one, even if `workers` is 0) that take paths from a shared job channel, read each file with `fs::read_to_string` (skip files that cannot be read), index it with `index_text` using the path’s `display()` text as the name, and send the partial index back on a results channel. The calling thread merges the parts as they arrive and returns the whole index, which must equal the one a simple loop would build.',
    starter: `use std::fs;
use std::path::PathBuf;
use std::sync::mpsc;
use std::sync::{Arc, Mutex};
use std::thread;
use std::collections::BTreeMap;
use std::collections::BTreeSet;

type Files = BTreeSet<String>;
/// word -> the files it appears in
type Index = BTreeMap<String, Files>;

fn words(text: &str) -> Vec<String> {
    text.split(|c: char| {
        !c.is_alphanumeric()
    })
    .filter(|w| !w.is_empty())
    .map(|w| w.to_lowercase())
    .collect()
}

fn index_text(name: &str, text: &str)
    -> Index {
    let mut idx = Index::new();
    for w in words(text) {
        idx.entry(w)
            .or_default()
            .insert(name.to_string());
    }
    idx
}

fn merge(to: &mut Index, from: Index) {
    for (w, names) in from {
        to.entry(w)
            .or_default()
            .extend(names);
    }
}

fn index_parallel(
    paths: Vec<PathBuf>,
    workers: usize,
) -> Index {
    todo!()
}`,
    solution: `use std::fs;
use std::path::PathBuf;
use std::sync::mpsc;
use std::sync::{Arc, Mutex};
use std::thread;
use std::collections::BTreeMap;
use std::collections::BTreeSet;

type Files = BTreeSet<String>;
/// word -> the files it appears in
type Index = BTreeMap<String, Files>;

fn words(text: &str) -> Vec<String> {
    text.split(|c: char| {
        !c.is_alphanumeric()
    })
    .filter(|w| !w.is_empty())
    .map(|w| w.to_lowercase())
    .collect()
}

fn index_text(name: &str, text: &str)
    -> Index {
    let mut idx = Index::new();
    for w in words(text) {
        idx.entry(w)
            .or_default()
            .insert(name.to_string());
    }
    idx
}

fn merge(to: &mut Index, from: Index) {
    for (w, names) in from {
        to.entry(w)
            .or_default()
            .extend(names);
    }
}

fn index_parallel(
    paths: Vec<PathBuf>,
    workers: usize,
) -> Index {
    // 1. Every path goes into a queue.
    let (tx, rx) = mpsc::channel();
    for p in paths {
        tx.send(p).unwrap();
    }
    drop(tx);
    // 2. Workers share the receiver.
    let rx = Arc::new(Mutex::new(rx));
    let (out, parts) = mpsc::channel();
    for _ in 0..workers.max(1) {
        let rx = Arc::clone(&rx);
        let out = out.clone();
        thread::spawn(move || loop {
            let next = rx
                .lock()
                .unwrap()
                .recv();
            let Ok(p) = next else {
                break;
            };
            let Ok(text) =
                fs::read_to_string(&p)
            else {
                continue;
            };
            let n =
                p.display().to_string();
            let part =
                index_text(&n, &text);
            out.send(part).unwrap();
        });
    }
    drop(out);
    // 3. Merge parts as they arrive.
    let mut idx = Index::new();
    for part in parts {
        merge(&mut idx, part);
    }
    idx
}`,
    tests: `use std::fs;

fn scratch(name: &str) -> PathBuf {
    let d = std::env::temp_dir().join(format!(
        "ixp-{}-{name}", std::process::id()));
    let _ = fs::remove_dir_all(&d);
    fs::create_dir_all(&d).unwrap();
    d
}

fn files(d: &PathBuf, n: usize) -> Vec<PathBuf> {
    (0..n).map(|i| {
        let p = d.join(format!("f{i}.txt"));
        let text = format!("common word{i} Shared\\nline{}", i % 3);
        fs::write(&p, text).unwrap();
        p
    }).collect()
}

fn sequential(ps: &[PathBuf]) -> Index {
    let mut idx = Index::new();
    for p in ps {
        let t = fs::read_to_string(p).unwrap();
        merge(&mut idx, index_text(&p.display().to_string(), &t));
    }
    idx
}

#[test]
fn one_worker_matches_the_sequential_index() {
    let d = scratch("one");
    let ps = files(&d, 5);
    assert_eq!(index_parallel(ps.clone(), 1), sequential(&ps));
}

#[test]
fn four_workers_match_the_sequential_index() {
    let d = scratch("four");
    let ps = files(&d, 40);
    let idx = index_parallel(ps.clone(), 4);
    assert_eq!(idx["common"].len(), 40);
    assert_eq!(idx["line0"].len(), 14);
    assert_eq!(idx, sequential(&ps));
}

#[test]
fn more_workers_than_files_is_fine() {
    let d = scratch("many");
    let ps = files(&d, 2);
    assert_eq!(index_parallel(ps.clone(), 16), sequential(&ps));
}

#[test]
fn no_files_gives_an_empty_index() {
    assert!(index_parallel(vec![], 3).is_empty());
}

#[test]
fn unreadable_paths_are_skipped() {
    let d = scratch("skip");
    let mut ps = files(&d, 3);
    ps.push(d.join("missing.txt"));
    let idx = index_parallel(ps, 2);
    assert_eq!(idx["shared"].len(), 3);
}

#[test]
fn zero_workers_still_works() {
    let d = scratch("zero");
    let ps = files(&d, 3);
    assert_eq!(index_parallel(ps.clone(), 0), sequential(&ps));
}`,
    hints: [
      'Three stages: fill a job channel with every path and close it; start the workers; merge whatever comes back. Two channels: jobs going out, parts coming back.',
      'Workers share the job receiver as `Arc::new(Mutex::new(rx))`; each gets an `Arc::clone` and its own clone of the results sender. Take a job with `let next = rx.lock().unwrap().recv();` (a plain `let`, so the lock is released at once), and stop when it is `Err`.',
      'After starting the workers, `drop` the main thread’s results sender, then `for part in parts { merge(&mut idx, part); }`: that loop ends when the last worker finishes and drops its sender. Use `workers.max(1)` for the count.',
    ],
    walkthrough: `**How to think about it.** Draw the sorting office. A tray of jobs (a channel holding every path), several sorters (threads), a conveyor back (a second channel), one clerk (the calling thread) merging. Then ask the two questions every concurrent program must answer. Who shares what? The job receiver is shared by every worker, so it needs \`Arc\` (several owners) and \`Mutex\` (one \`recv\` at a time); the results sender is cloned, one per worker, because channels allow many senders. How does everyone know it is over? By dropping senders. When the job channel’s only sender is dropped and the queue is empty, \`recv\` returns \`Err\`, so workers stop; when every results sender is dropped, the clerk’s \`for\` loop ends.

**The solution, line by line.**

- \`let (tx, rx) = mpsc::channel();\` makes the job channel. \`for p in paths { tx.send(p).unwrap(); }\` fills it before any worker starts (an unbounded channel never blocks a sender), and \`drop(tx);\` closes it, so it will report “empty and closed” once drained.
- \`let rx = Arc::new(Mutex::new(rx));\` makes the receiver shareable: a \`Receiver\` may be moved to another thread (it is \`Send\`) but not shared by several (it is not \`Sync\`), and a \`Mutex\` around it is.
- \`let (out, parts) = mpsc::channel();\` makes the results channel; \`parts\` stays with the calling thread.
- \`for _ in 0..workers.max(1) {\` starts at least one worker, so \`workers = 0\` still finishes.
- \`let rx = Arc::clone(&rx); let out = out.clone();\` gives this worker its own handle to the shared receiver and its own sender. They are moved into the thread by \`move\`.
- \`thread::spawn(move || loop { ... });\` runs the worker. The handle it returns is not needed: the results channel tells us when workers finish.
- \`let next = rx.lock().unwrap().recv();\` locks, takes one job and, because this is a plain \`let\`, drops the lock guard at the end of the statement. Every other worker can take a job while this one reads its file.
- \`let Ok(p) = next else { break; };\` ends the loop when the channel is closed and empty.
- \`let Ok(text) = fs::read_to_string(&p) else { continue; };\` skips unreadable files (the test with \`missing.txt\`).
- \`let n = p.display().to_string(); let part = index_text(&n, &text); out.send(part).unwrap();\` names the file by its path and sends its little index home. When the loop ends, the closure returns and \`out\` and \`rx\` are dropped.
- \`drop(out);\` drops the calling thread’s own sender. Without this line, \`parts\` would never close, because this thread would still hold a sender, and the next loop would wait forever.
- \`let mut idx = Index::new(); for part in parts { merge(&mut idx, part); } idx\` merges in whatever order parts arrive. Because sets ignore order and duplicates, the result equals the sequential index, which is what the tests compare against.

**Common wrong attempts.**

- \`for _ in 0..workers\` without \`.max(1)\`: with 0 workers nobody reads the jobs, the results channel closes at once, and the index is empty.
- Receiving one result with \`parts.recv()\` instead of looping: only one file is indexed.
- Forgetting \`drop(out)\`, or \`drop(tx)\`: the program never finishes, because a channel only closes when every sender is gone. (This is the most common bug in channel code; when a program hangs at the end, look for a sender still alive.)
- \`while let Ok(p) = rx.lock().unwrap().recv() { ... }\`: correct answers, but the lock is held for the whole body, so the workers take turns, as the chapter explains.
- Joining each thread right after spawning it: the work then runs one file-set at a time, again correct but not parallel.`,
    wrong: [
      {
        code: `use std::fs;
use std::path::PathBuf;
use std::sync::mpsc;
use std::sync::{Arc, Mutex};
use std::thread;
use std::collections::BTreeMap;
use std::collections::BTreeSet;

type Files = BTreeSet<String>;
/// word -> the files it appears in
type Index = BTreeMap<String, Files>;

fn words(text: &str) -> Vec<String> {
    text.split(|c: char| {
        !c.is_alphanumeric()
    })
    .filter(|w| !w.is_empty())
    .map(|w| w.to_lowercase())
    .collect()
}

fn index_text(name: &str, text: &str)
    -> Index {
    let mut idx = Index::new();
    for w in words(text) {
        idx.entry(w)
            .or_default()
            .insert(name.to_string());
    }
    idx
}

fn merge(to: &mut Index, from: Index) {
    for (w, names) in from {
        to.entry(w)
            .or_default()
            .extend(names);
    }
}

fn index_parallel(
    paths: Vec<PathBuf>,
    workers: usize,
) -> Index {
    // 1. Every path goes into a queue.
    let (tx, rx) = mpsc::channel();
    for p in paths {
        tx.send(p).unwrap();
    }
    drop(tx);
    // 2. Workers share the receiver.
    let rx = Arc::new(Mutex::new(rx));
    let (out, parts) = mpsc::channel();
    for _ in 0..workers {
        let rx = Arc::clone(&rx);
        let out = out.clone();
        thread::spawn(move || loop {
            let next = rx
                .lock()
                .unwrap()
                .recv();
            let Ok(p) = next else {
                break;
            };
            let Ok(text) =
                fs::read_to_string(&p)
            else {
                continue;
            };
            let n =
                p.display().to_string();
            let part =
                index_text(&n, &text);
            out.send(part).unwrap();
        });
    }
    drop(out);
    // 3. Merge parts as they arrive.
    let mut idx = Index::new();
    for part in parts {
        merge(&mut idx, part);
    }
    idx
}`,
        why: 'With `workers = 0` no thread is started, so nothing is indexed.',
      },
      {
        code: `use std::fs;
use std::path::PathBuf;
use std::sync::mpsc;
use std::sync::{Arc, Mutex};
use std::thread;
use std::collections::BTreeMap;
use std::collections::BTreeSet;

type Files = BTreeSet<String>;
/// word -> the files it appears in
type Index = BTreeMap<String, Files>;

fn words(text: &str) -> Vec<String> {
    text.split(|c: char| {
        !c.is_alphanumeric()
    })
    .filter(|w| !w.is_empty())
    .map(|w| w.to_lowercase())
    .collect()
}

fn index_text(name: &str, text: &str)
    -> Index {
    let mut idx = Index::new();
    for w in words(text) {
        idx.entry(w)
            .or_default()
            .insert(name.to_string());
    }
    idx
}

fn merge(to: &mut Index, from: Index) {
    for (w, names) in from {
        to.entry(w)
            .or_default()
            .extend(names);
    }
}

fn index_parallel(
    paths: Vec<PathBuf>,
    workers: usize,
) -> Index {
    // 1. Every path goes into a queue.
    let (tx, rx) = mpsc::channel();
    for p in paths {
        tx.send(p).unwrap();
    }
    drop(tx);
    // 2. Workers share the receiver.
    let rx = Arc::new(Mutex::new(rx));
    let (out, parts) = mpsc::channel();
    for _ in 0..workers.max(1) {
        let rx = Arc::clone(&rx);
        let out = out.clone();
        thread::spawn(move || loop {
            let next = rx
                .lock()
                .unwrap()
                .recv();
            let Ok(p) = next else {
                break;
            };
            let Ok(text) =
                fs::read_to_string(&p)
            else {
                continue;
            };
            let n =
                p.display().to_string();
            let part =
                index_text(&n, &text);
            out.send(part).unwrap();
        });
    }
    drop(out);
    // 3. Merge parts as they arrive.
    let mut idx = Index::new();
    if let Ok(part) = parts.recv() {
        merge(&mut idx, part);
    }
    idx
}`,
        why: 'Receives a single part instead of looping until the channel closes, so most files are missing.',
      },
    ],
  },
  search: {
    optional: true,
    lang: 'rust',
    title: 'Stretch: answer a query',
    prompt: 'Write `search(idx, query)`: split the query with `words` (so it is lowercased like the text), and return, sorted, the files that contain *every* word of the query. A query with no words, or with a word the index has never seen, finds nothing.',
    starter: `use std::collections::BTreeMap;
use std::collections::BTreeSet;

type Files = BTreeSet<String>;
/// word -> the files it appears in
type Index = BTreeMap<String, Files>;

fn words(text: &str) -> Vec<String> {
    text.split(|c: char| {
        !c.is_alphanumeric()
    })
    .filter(|w| !w.is_empty())
    .map(|w| w.to_lowercase())
    .collect()
}

fn index_text(name: &str, text: &str)
    -> Index {
    let mut idx = Index::new();
    for w in words(text) {
        idx.entry(w)
            .or_default()
            .insert(name.to_string());
    }
    idx
}

fn merge(to: &mut Index, from: Index) {
    for (w, names) in from {
        to.entry(w)
            .or_default()
            .extend(names);
    }
}

fn search(idx: &Index, query: &str)
    -> Vec<String> {
    todo!()
}`,
    solution: `use std::collections::BTreeMap;
use std::collections::BTreeSet;

type Files = BTreeSet<String>;
/// word -> the files it appears in
type Index = BTreeMap<String, Files>;

fn words(text: &str) -> Vec<String> {
    text.split(|c: char| {
        !c.is_alphanumeric()
    })
    .filter(|w| !w.is_empty())
    .map(|w| w.to_lowercase())
    .collect()
}

fn index_text(name: &str, text: &str)
    -> Index {
    let mut idx = Index::new();
    for w in words(text) {
        idx.entry(w)
            .or_default()
            .insert(name.to_string());
    }
    idx
}

fn merge(to: &mut Index, from: Index) {
    for (w, names) in from {
        to.entry(w)
            .or_default()
            .extend(names);
    }
}

fn search(idx: &Index, query: &str)
    -> Vec<String> {
    let mut hits: Option<Files> = None;
    for w in words(query) {
        let files = idx.get(&w)
            .cloned()
            .unwrap_or_default();
        hits = Some(match hits {
            None => files,
            Some(h) => h
                .intersection(&files)
                .cloned()
                .collect(),
        });
    }
    hits.unwrap_or_default()
        .into_iter()
        .collect()
}`,
    tests: `fn sample() -> Index {
    let mut idx = index_text("a.txt", "the red fox");
    merge(&mut idx, index_text("b.txt", "the red hen"));
    merge(&mut idx, index_text("c.txt", "a blue fox"));
    idx
}

#[test]
fn one_word() {
    assert_eq!(search(&sample(), "fox"), ["a.txt", "c.txt"]);
}

#[test]
fn every_word_must_appear() {
    assert_eq!(search(&sample(), "red fox"), ["a.txt"]);
    assert_eq!(search(&sample(), "the red"), ["a.txt", "b.txt"]);
}

#[test]
fn queries_are_split_and_lowercased_like_text() {
    assert_eq!(search(&sample(), "  RED, Hen! "), ["b.txt"]);
}

#[test]
fn unknown_words_find_nothing() {
    assert!(search(&sample(), "fox cat").is_empty());
    assert!(search(&sample(), "zebra").is_empty());
}

#[test]
fn an_empty_query_finds_nothing() {
    assert!(search(&sample(), "").is_empty());
    assert!(search(&sample(), " ,. ").is_empty());
}`,
    hints: [
      'This is the card-catalogue trick: pull each word’s set, and keep only the files in all of them, the intersection.',
      'Start with “no set yet” (`Option<Files>` set to `None`). For the first word, take its set; for each later word, intersect with what you have. A missing word’s set is the empty set.',
      '`h.intersection(&files).cloned().collect()` makes the new set. At the end, `hits.unwrap_or_default().into_iter().collect()` turns it into a sorted `Vec`.',
    ],
    walkthrough: `**How to think about it.** Each word of the query has a set of files; the answer is the files in *all* of the sets. Intersections need a starting point, and the natural one, “all files”, is not something the index stores; so start with “nothing chosen yet” and let the first word’s set be the starting point. That is what \`Option\` is for. An empty query never gets a starting point, so it finds nothing, which is the friendly answer.

**The solution, line by line.**

- \`let mut hits: Option<Files> = None;\` means “no word seen yet”.
- \`for w in words(query) {\` splits and lowercases the query exactly as the text was, so \`RED, Hen!\` looks up \`red\` and \`hen\`.
- \`let files = idx.get(&w).cloned().unwrap_or_default();\` takes a copy of the word’s set, or an empty set if the word is unknown. (\`cloned\` turns \`Option<&Files>\` into \`Option<Files>\`.)
- \`hits = Some(match hits { None => files, Some(h) => h.intersection(&files).cloned().collect() });\` uses the first set as it is, and intersects every later one with the running answer. Once an unknown word makes it empty, it stays empty.
- \`hits.unwrap_or_default().into_iter().collect()\` turns the final set (or the empty set, for an empty query) into a sorted vector; a \`BTreeSet\` iterates in order.

**Common wrong attempts.**

- Collecting the union instead (adding every word’s files): that answers “files with *any* of the words”, so \`red fox\` would also return \`b.txt\` and \`c.txt\`.
- Starting with an empty set and intersecting: the empty set intersected with anything stays empty, so every query finds nothing.
- Looking up the raw query words without \`words\`: \`RED,\` is not a key in the index.`,
    wrong: [
      {
        code: `use std::collections::BTreeMap;
use std::collections::BTreeSet;

type Files = BTreeSet<String>;
/// word -> the files it appears in
type Index = BTreeMap<String, Files>;

fn words(text: &str) -> Vec<String> {
    text.split(|c: char| {
        !c.is_alphanumeric()
    })
    .filter(|w| !w.is_empty())
    .map(|w| w.to_lowercase())
    .collect()
}

fn index_text(name: &str, text: &str)
    -> Index {
    let mut idx = Index::new();
    for w in words(text) {
        idx.entry(w)
            .or_default()
            .insert(name.to_string());
    }
    idx
}

fn merge(to: &mut Index, from: Index) {
    for (w, names) in from {
        to.entry(w)
            .or_default()
            .extend(names);
    }
}

fn search(idx: &Index, query: &str)
    -> Vec<String> {
    let mut hits = Files::new();
    for w in words(query) {
        if let Some(f) = idx.get(&w) {
            hits.extend(f.clone());
        }
    }
    hits.into_iter().collect()
}`,
        why: 'Takes the union, so it returns files with any of the words, not all of them.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'In the indexer, why is the job receiver wrapped in `Arc<Mutex<...>>` while the results sender is cloned?',
    options: [
      {
        t: 'A channel allows many senders but only one receiver, so the receiver must be shared under a lock',
        correct: true,
        why: '`mpsc` means multiple producer, single consumer; the Mutex lets workers take turns being that consumer.',
      },
      {
        t: 'Senders are cheaper to lock than receivers',
        why: 'Senders are not locked at all; each worker has its own clone.',
      },
      {
        t: 'Because `PathBuf` is not `Send`',
        why: 'It is `Send`; the paths move between threads without trouble.',
      },
    ],
  },
  {
    q: 'The program indexes every file but never returns. Which line is most likely missing?',
    options: [
      {
        t: '`out.sort()`',
        why: 'Sorting has nothing to do with finishing.',
      },
      {
        t: '`Arc::clone(&rx)`',
        why: 'Without it the code would not compile, rather than hang.',
      },
      {
        t: '`drop(out)` in the calling thread, so its own sender keeps the results channel open',
        correct: true,
        why: 'The merge loop ends only when every sender is gone, including the one `main` still holds.',
      },
    ],
  },
  {
    q: 'Why does `let next = rx.lock().unwrap().recv();` let workers run in parallel, when `while let Ok(p) = rx.lock().unwrap().recv() { ... }` does not?',
    options: [
      {
        t: '`let` drops the lock guard at the end of the statement; `while let` keeps it until the end of the loop body',
        correct: true,
        why: 'So the second version holds the lock while it reads and indexes the file.',
      },
      {
        t: '`while let` locks twice',
        why: 'It locks once per loop, but holds the lock too long.',
      },
      {
        t: 'There is no difference; both release the lock immediately',
        why: 'The Rust book’s web server chapter shows exactly this difference.',
      },
    ],
  },
  {
    q: 'With four workers, the main thread spent about 250 ms of a 251 ms run merging. What does that tell you?',
    options: [
      {
        t: 'The workers are too slow and more threads would help',
        why: 'Eight workers were no faster than four: the workers were waiting on the merger.',
      },
      {
        t: 'The single merging thread is the bottleneck, so the next improvement should reduce its work',
        correct: true,
        why: 'Merging per worker first cut the run to 152 ms.',
      },
      {
        t: 'Reading files from disk is the slow part',
        why: 'Then merging would not take nearly the whole run.',
      },
    ],
  },
  {
    q: 'Why compare `index_parallel`’s result with a simple sequential loop in the tests, rather than with a hand-written expected index?',
    options: [
      {
        t: 'Because threads make the result random',
        why: 'The *order* of work is random, but the final index must not be; that is what the test checks.',
      },
      {
        t: 'Because the sequential version is easy to trust, and the parallel one must give exactly the same answer for any input',
        correct: true,
        why: 'A differential test: the simple implementation is the specification for the fast one.',
      },
      {
        t: 'Because `assert_eq!` cannot compare BTreeMaps',
        why: 'It can, which is one reason the index uses BTree collections.',
      },
    ],
  },
];
