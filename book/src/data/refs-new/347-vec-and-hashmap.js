// New references for chapter 347 (Vec and HashMap) and its staged second
// half (307-b, "HashMap"). Checked 2026-11-02 by reading the raw sources
// from github.com/rust-lang/book (main). Every rustc message, panic message
// and printed value in the chapters is real output of rustc 1.97.0.
export default [
  {
    id: 'rust-book-vectors',
    authors: ['Steve Klabnik', 'Carol Nichols', 'Chris Krycho', 'and contributors'],
    title: 'The Rust Programming Language, chapter 8.1: Storing Lists of Values with Vectors',
    venue: 'doc.rust-lang.org',
    year: null,
    doi: null,
    url: 'https://doc.rust-lang.org/book/ch08-01-vectors.html',
    accessed: '2026-11-02',
    checkedAgainst: 'Read raw from raw.githubusercontent.com/rust-lang/book/main/src/ch08-01-vectors.md on 2026-11-02: Vec<T> stores more than one value of the same type next to each other in memory; Vec::new, the vec! macro and push (which needs the vector to be mutable); reading with indexing, which panics when the index is past the end, or with get, which returns Option<&T> and gives None without panicking; holding a reference to the first element and then pushing is rejected, because “adding a new element onto the end of the vector might require allocating new memory and copying the old elements to the new space”, leaving the reference “pointing to deallocated memory”; iterating with for over &v and over &mut v, changing elements with *; dropping a vector drops its elements. E0502, E0382 (for x in v, then v.len()) and the panic “index out of bounds: the len is 1 but the index is 5” were reproduced with rustc 1.97.0.',
    shaped: 'Chapter 347: creating, growing, indexing and looping over a Vec, and the push-while-borrowed rule.',
  },
  {
    id: 'rust-book-hashmaps',
    authors: ['Steve Klabnik', 'Carol Nichols', 'Chris Krycho', 'and contributors'],
    title: 'The Rust Programming Language, chapter 8.3: Storing Keys with Associated Values in Hash Maps',
    venue: 'doc.rust-lang.org',
    year: null,
    doi: null,
    url: 'https://doc.rust-lang.org/book/ch08-03-hash-maps.html',
    accessed: '2026-11-02',
    checkedAgainst: 'Read raw from raw.githubusercontent.com/rust-lang/book/main/src/ch08-03-hash-maps.md on 2026-11-02: HashMap<K, V> must be brought into scope with use, as it is not in the prelude; keys all have one type and values all have one type; get returns an Option<&V>; iterating over a map visits each pair “in an arbitrary order”; for owned values such as String, the values are moved and “the hash map will be the owner of those values”; insert with an existing key replaces the value; entry returns an Entry, and “The or_insert method on Entry is defined to return a mutable reference to the value for the corresponding Entry key if that key exists, and if not, it inserts the parameter as the new value”; the word-counting example with *count += 1; by default HashMap uses SipHash, chosen to resist denial-of-service attacks. E0382 after inserting a String key was reproduced with rustc 1.97.0.',
    shaped: 'Chapter 347-b: HashMap, get, insert, the entry API, ownership of keys and arbitrary order.',
  },
];
