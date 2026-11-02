// New references for chapter 314 (Box and Rc) and its staged second half
// (314-b, "RefCell and reference cycles"). Checked 2026-11-02 by reading
// the raw sources from github.com/rust-lang/book (main). Every rustc
// message, size and output in the chapters is real output of rustc 1.97.0
// on this machine (64-bit Linux).
export default [
  {
    id: 'rust-book-smart-pointers',
    authors: ['Steve Klabnik', 'Carol Nichols', 'Chris Krycho', 'and contributors'],
    title: 'The Rust Programming Language, chapter 15: Smart Pointers',
    venue: 'doc.rust-lang.org',
    year: null,
    doi: null,
    url: 'https://doc.rust-lang.org/book/ch15-00-smart-pointers.html',
    accessed: '2026-11-02',
    checkedAgainst: 'Read raw from raw.githubusercontent.com/rust-lang/book/main/src/ch15-01-box.md, ch15-04-rc.md, ch15-05-interior-mutability.md and ch15-06-reference-cycles.md on 2026-11-02: boxes store data on the heap, leave a pointer on the stack, and “don’t have performance overhead, other than storing their data on the heap”; because boxes have a known size, they enable recursive types such as a cons list; Rc::clone “doesn’t make a deep copy”, it only increments the reference count; Rc<T> is only for use in single-threaded scenarios and “allows you to share data between multiple parts of your program for reading only”; RefCell<T> enforces the borrowing rules at run time instead of compile time, and breaking them makes the program panic; borrow returns Ref<T> and borrow_mut returns RefMut<T>, and RefCell keeps track of how many are active; combining Rc<T> and RefCell<T> gives multiple owners of mutable data; reference cycles made with Rc<T> and RefCell<T> leak memory because each item’s count never reaches 0, and memory leaks are memory safe in Rust; Weak<T> (from Rc::downgrade) does not express an ownership relationship and its weak_count does not need to be 0 for the value to be cleaned up; upgrade returns Option<Rc<T>>.',
    shaped: 'Chapters 314 and 314-b: Box, Rc, RefCell, reference cycles and Weak.',
  },
];
