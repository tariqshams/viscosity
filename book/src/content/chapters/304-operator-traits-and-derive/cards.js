// Operator traits, Drop and derive cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'op-rhs': {
    q: 'In `impl Mul<f64> for V2`, what does the `f64` choose?',
    a: 'The type on the right of `*` (the `Rhs` parameter), so `v * 2.0` is allowed. The left type, `V2`, picks the impl, and the result type is the associated `Output`.',
  },
  'op-assign': {
    q: 'Why does `AddAssign` have no `Output` type?',
    a: '`a += b` calls `add_assign(&mut a, b)`, which changes the left side in place and returns `()`; there is no new value to give a type to.',
  },
  'op-index': {
    q: 'What does rustc compile `heap[h]` into, when it is only read?',
    a: '`*Index::index(&heap, h)`: `index` returns a reference and rustc dereferences it, so the expression names the element in place. When the place is assigned to or mutably borrowed, it calls `IndexMut::index_mut` instead.',
  },
  'op-cmp': {
    q: 'Why can you still use `a` and `b` after `a == b`, even when their type is not `Copy`?',
    a: '`a == b` is `PartialEq::eq(&a, &b)`: comparison borrows both sides and never moves them.',
  },
  'derive-bound': {
    q: 'What does `#[derive(Clone)]` write for `struct Gc<T> { index: u32, marker: PhantomData<T> }`, and why can that be unwanted?',
    a: '`impl<T: Clone> Clone for Gc<T>`: derive bounds every type parameter. No field holds a `T`, so the handle could always be cloned, but with the bound a `Gc<X>` has no `clone` unless `X: Clone`. The fix is to write the impl by hand, with no bound.',
  },
  'drop-fields': {
    q: 'A struct with a `Drop` impl has two fields that also implement `Drop`. In what order do the three `drop`s run?',
    a: 'The struct’s own `drop` first, while its fields are still whole; then the fields, in the order they are declared.',
  },
  'drop-underscore': {
    q: 'When is the value made by `let _ = Noisy("n");` dropped, compared with `let _n = Noisy("n");`?',
    a: 'At the end of that statement: `_` binds nothing, so the new value has no owner. `_n` is a real name, so its value lives to the end of the block.',
  },
  'drop-explicit': {
    q: 'Why does `x.drop()` not compile (E0040), and what do you write instead?',
    a: 'If you could call it, `x` would still be owned and would be dropped again at the end of its scope. Write `drop(x)` (`std::mem::drop`), which takes ownership, so `x` is dropped once, as the call returns, and cannot be used afterwards.',
  },
  'drop-copy': {
    q: 'Why can a type that implements `Drop` not be `Copy` (E0184)?',
    a: 'A copy duplicates the bits, so each copy would run the same `drop`, releasing one resource twice.',
  },
};

export const examples = {
  'drop-order': {
    lang: 'rust',
    title: 'When Drop runs, and in what order',
    code: `struct Noisy(&'static str);

impl Drop for Noisy {
    fn drop(&mut self) {
        println!("drop {}", self.0);
    }
}

struct Pair {
    left: Noisy,
    right: Noisy,
}

impl Drop for Pair {
    fn drop(&mut self) {
        // fields still whole here
        println!(
            "drop pair ({}, {} alive)",
            self.left.0, self.right.0
        );
    }
}

fn main() {
    let _a = Noisy("a");
    let _p = Pair {
        left: Noisy("left"),
        right: Noisy("right"),
    };
    let _ = Noisy("underscore");
    let b = Noisy("b");
    drop(b);
    println!("main ends");
}`,
  },
};

export const exercises = {
  tally: {
    lang: 'rust',
    title: 'A token that counts itself',
    prompt: 'A `Token` keeps a shared counter, `live`, equal to the number of tokens that exist. Write `Token::new(&live)`, which adds one to the counter and keeps its own handle to it, and implement `Drop` so that dropping a token takes one away. The tests check the count when a block ends, after `drop`, after a reassignment, after `let _ =`, and after a `Vec` of tokens is dropped. (`Cell<u32>` is a number you can change through a shared reference with `get` and `set`; the `Rc` lets every token hold the same one.)',
    starter: `use std::cell::Cell;
use std::rc::Rc;

/// Counted in \`live\` while it exists.
type Count = Rc<Cell<u32>>;

struct Token {
    live: Count,
}

impl Token {
    fn new(live: &Count) -> Token {
        todo!()
    }
}`,
    solution: `use std::cell::Cell;
use std::rc::Rc;

/// Counted in \`live\` while it exists.
type Count = Rc<Cell<u32>>;

struct Token {
    live: Count,
}

impl Token {
    fn new(live: &Count) -> Token {
        live.set(live.get() + 1);
        Token { live: Rc::clone(live) }
    }
}

impl Drop for Token {
    fn drop(&mut self) {
        let n = self.live.get();
        self.live.set(n - 1);
    }
}`,
    tests: `#[test]
fn a_block_and_drop() {
    let live = Rc::new(Cell::new(0));
    let a = Token::new(&live);
    {
        let _b = Token::new(&live);
        assert_eq!(live.get(), 2);
    }
    assert_eq!(live.get(), 1);
    drop(a);
    assert_eq!(live.get(), 0);
}
#[test]
fn reassigning_and_underscore() {
    let live = Rc::new(Cell::new(0));
    let mut t = Token::new(&live);
    t = Token::new(&live);
    assert_eq!(live.get(), 1);
    let _ = Token::new(&live);
    assert_eq!(live.get(), 1);
    drop(t);
    assert_eq!(live.get(), 0);
}
#[test]
fn a_vec_drops_what_it_owns() {
    let live = Rc::new(Cell::new(0));
    let v: Vec<Token> =
        (0..3).map(|_| Token::new(&live)).collect();
    assert_eq!(live.get(), 3);
    drop(v);
    assert_eq!(live.get(), 0);
}`,
    hints: [
      'Two places change the count: making a token adds one, and dropping it takes one away. The first belongs in `new`; the second can only go in an `impl Drop for Token`, because that is the code rustc calls when a token goes.',
      'In `new`, `live.set(live.get() + 1)` counts the token, and `Rc::clone(live)` gives it its own handle to the same counter (not a new counter). Store that handle in the struct.',
      '`impl Drop for Token`, whose `drop(&mut self)` reads `self.live.get()` and sets it one lower. You never call it yourself: the end of a block, `drop(t)`, the assignment `t = ...`, `let _ =` and dropping the `Vec` all call it for you.',
    ],
    walkthrough: `**How to think about it.** The counter must always equal the number of tokens alive, so every way a token can come into being has to add one and every way it can stop existing has to take one away. There is only one way in, \`new\`, but there are many ways out (a block ending, \`drop\`, an assignment, \`let _ =\`, a \`Vec\` going away), and the point of \`Drop\` is that they all end in the same call. Write the decrement once, in \`drop\`, and every exit is covered.

**The solution, line by line.**

- \`live.set(live.get() + 1);\` reads the shared count and writes it back one higher. (\`Count\` is only a short name for \`Rc<Cell<u32>>\`.) A \`Cell\` allows this through the shared reference \`&Count\`, because it only ever copies the number in and out.
- \`Token { live: Rc::clone(live) }\` makes the token, holding its own \`Rc\` to the *same* \`Cell\`: \`Rc::clone\` copies the pointer and bumps the reference count; the counter itself is not copied.
- \`impl Drop for Token { fn drop(&mut self) { ... } }\` is the other half: it reads the count and sets it one lower. rustc calls it exactly once per token, just before the token's memory (and its \`Rc\` field) is released.

Now follow the tests. In the first, \`_b\` is dropped at the inner closing brace (count 1) and \`drop(a)\` moves \`a\` into \`std::mem::drop\`, which drops it as it returns (count 0). In the second, \`t = Token::new(&live)\` first makes the new token (count 2) and then drops the old value of \`t\` as part of the assignment (count 1); \`let _ = Token::new(&live)\` binds nothing, so that token is dropped at the end of its statement and the count is back to 1 at once. In the third, dropping the \`Vec\` drops each token it owns.

**Common wrong attempts.**

- Leaving out the \`Drop\` impl. Everything compiles, because a \`Token\` is still dropped, but dropping it no longer touches the counter, so the count only ever goes up and the first test sees 2 where it expects 1.
- Making a new counter in \`new\`, such as \`Rc::new(Cell::new(live.get() + 1))\`. Each token then counts itself in a private \`Cell\` nobody else reads, and the caller's \`live\` never changes from 0.
- Calling \`self.drop()\` or \`t.drop()\` somewhere to "release" a token. rustc refuses with E0040, "explicit use of destructor method"; use \`drop(t)\`.`,
    wrong: [
      {
        code: `use std::cell::Cell;
use std::rc::Rc;

type Count = Rc<Cell<u32>>;

struct Token {
    live: Count,
}

impl Token {
    fn new(live: &Count) -> Token {
        live.set(live.get() + 1);
        Token { live: Rc::clone(live) }
    }
}`,
        why: 'There is no `Drop` impl, so dropping a token never takes one away: after the inner block the count is still 2.',
      },
      {
        code: `use std::cell::Cell;
use std::rc::Rc;

type Count = Rc<Cell<u32>>;

struct Token {
    live: Count,
}

impl Token {
    fn new(live: &Count) -> Token {
        let n = live.get() + 1;
        let c = Rc::new(Cell::new(n));
        Token { live: c }
    }
}

impl Drop for Token {
    fn drop(&mut self) {
        let n = self.live.get();
        self.live.set(n - 1);
    }
}`,
        why: 'Each token counts itself in a new `Cell` of its own, so the shared counter the tests read stays at 0.',
      },
    ],
  },
  grid: {
    optional: true,
    lang: 'rust',
    title: 'A grid you index with (row, col)',
    prompt: 'A `Grid` stores `w` columns of `f64`s row by row in one `Vec`, so cell `(r, c)` is `cells[r * w + c]`. Implement `Index<(usize, usize)>` and `IndexMut<(usize, usize)>`, so that `g[(r, c)]` reads and writes that cell and panics when `c` is not below `w` (a column past the edge must not quietly reach into the next row), and `AddAssign<f64>`, so that `g += k` adds `k` to every cell.',
    starter: `use std::ops::{AddAssign, Index};
use std::ops::IndexMut;

struct Grid {
    w: usize,
    cells: Vec<f64>,
}

impl Grid {
    fn new(w: usize, h: usize) -> Grid {
        let cells = vec![0.0; w * h];
        Grid { w, cells }
    }
}`,
    solution: `use std::ops::{AddAssign, Index};
use std::ops::IndexMut;

struct Grid {
    w: usize,
    cells: Vec<f64>,
}

impl Grid {
    fn new(w: usize, h: usize) -> Grid {
        let cells = vec![0.0; w * h];
        Grid { w, cells }
    }

    fn at(&self, r: usize, c: usize)
        -> usize {
        assert!(c < self.w);
        r * self.w + c
    }
}

impl Index<(usize, usize)> for Grid {
    type Output = f64;
    fn index(
        &self,
        (r, c): (usize, usize),
    ) -> &f64 {
        &self.cells[self.at(r, c)]
    }
}

impl IndexMut<(usize, usize)> for Grid {
    fn index_mut(
        &mut self,
        (r, c): (usize, usize),
    ) -> &mut f64 {
        let i = self.at(r, c);
        &mut self.cells[i]
    }
}

impl AddAssign<f64> for Grid {
    fn add_assign(&mut self, k: f64) {
        for x in &mut self.cells {
            *x += k;
        }
    }
}`,
    tests: `#[test]
fn read_and_write_cells() {
    let mut g = Grid::new(3, 2);
    g[(1, 2)] = 5.0;
    assert_eq!(g[(1, 2)], 5.0);
    assert_eq!(g.cells[5], 5.0);
    assert_eq!(g[(0, 0)], 0.0);
}
#[test]
fn plus_equals_adds_everywhere() {
    let mut g = Grid::new(2, 2);
    g[(0, 1)] = 1.5;
    g += 1.0;
    assert_eq!(g.cells, vec![1.0, 2.5, 1.0, 1.0]);
}
#[test]
#[should_panic]
fn a_column_past_the_edge_panics() {
    let g = Grid::new(3, 2);
    let x = g[(0, 3)];
    println!("{x}");
}`,
    hints: [
      'Three impls, one per operator: reading `g[(r, c)]` is `Index`, writing it is `IndexMut`, and `g += k` is `AddAssign<f64>`. The index type is the tuple `(usize, usize)`, so that is the trait’s parameter.',
      '`Index` needs `type Output = f64;` and `fn index(&self, (r, c): (usize, usize)) -> &f64`, returning a reference into `cells`. `IndexMut` has no `Output` of its own (it reuses `Index`’s) and returns `&mut f64`. A small helper that checks `c < self.w` and returns `r * self.w + c` keeps the two the same.',
      '`AddAssign<f64>` is `fn add_assign(&mut self, k: f64)`, looping `for x in &mut self.cells { *x += k; }`. In `index_mut`, work out the position into a local first, then borrow `self.cells` mutably.',
    ],
    walkthrough: `**How to think about it.** Each operator the tests use is a trait call: \`g[(1, 2)] = 5.0\` is a write through \`IndexMut::index_mut(&mut g, (1, 2))\`, \`g[(1, 2)]\` on its own is \`*Index::index(&g, (1, 2))\`, and \`g += 1.0\` is \`AddAssign::add_assign(&mut g, 1.0)\`. The index can be any type, so a tuple of row and column is fine. The one real decision is the column check: without it, \`(0, 3)\` on a grid 3 wide is position 3, the first cell of the next row, a wrong answer with no error.

**The solution, line by line.**

- \`fn at(&self, r: usize, c: usize) -> usize\` turns a row and a column into a position, after \`assert!(c < self.w)\` panics on a column past the edge. A row past the bottom needs no check of ours: the position is then past the end of \`cells\`, and the \`Vec\`'s own indexing panics.
- \`impl Index<(usize, usize)> for Grid { type Output = f64; ... }\` says that indexing with a pair gives an \`f64\`. The parameter is written as the pattern \`(r, c)\`, which takes the tuple apart; the body returns \`&self.cells[self.at(r, c)]\`, a reference, and rustc adds the \`*\` at the call site.
- \`impl IndexMut<(usize, usize)> for Grid\` returns \`&mut f64\`. It works out \`let i = self.at(r, c);\` first, which borrows \`self\` only for that call, and then borrows \`self.cells\` mutably to return \`&mut self.cells[i]\`. \`IndexMut\` requires \`Index\` and shares its \`Output\`, so it does not declare one.
- \`impl AddAssign<f64> for Grid\` takes \`&mut self\` and an \`f64\` and returns nothing; \`for x in &mut self.cells { *x += k; }\` visits every cell mutably.

**Common wrong attempts.**

- Swapping the formula to \`c * self.w + r\` (column by column). The grid still reads back what it wrote, but \`g[(1, 2)]\` lands at position 7, past the end of a 3 by 2 grid's six cells, and the first test panics.
- Leaving out the column check. Everything else passes, but \`g[(0, 3)]\` quietly reads \`cells[3]\`, row 1's first cell, so the \`should_panic\` test fails.
- Writing \`&mut self.cells[self.at(r, c)]\` in one expression. Here it compiles (rustc's two-phase borrows allow it), but in more complicated code it is the classic "cannot borrow as immutable because it is also borrowed as mutable"; working out \`i\` first never has that problem.`,
    wrong: [
      {
        code: `use std::ops::{AddAssign, Index};
use std::ops::IndexMut;

struct Grid {
    w: usize,
    cells: Vec<f64>,
}

impl Grid {
    fn new(w: usize, h: usize) -> Grid {
        let cells = vec![0.0; w * h];
        Grid { w, cells }
    }
}

impl Index<(usize, usize)> for Grid {
    type Output = f64;
    fn index(
        &self,
        (r, c): (usize, usize),
    ) -> &f64 {
        &self.cells[r * self.w + c]
    }
}

impl IndexMut<(usize, usize)> for Grid {
    fn index_mut(
        &mut self,
        (r, c): (usize, usize),
    ) -> &mut f64 {
        let i = r * self.w + c;
        &mut self.cells[i]
    }
}

impl AddAssign<f64> for Grid {
    fn add_assign(&mut self, k: f64) {
        for x in &mut self.cells {
            *x += k;
        }
    }
}`,
        why: 'No column check: `g[(0, 3)]` on a grid 3 wide reads `cells[3]`, the first cell of the next row, instead of panicking.',
      },
      {
        code: `use std::ops::{AddAssign, Index};
use std::ops::IndexMut;

struct Grid {
    w: usize,
    cells: Vec<f64>,
}

impl Grid {
    fn new(w: usize, h: usize) -> Grid {
        let cells = vec![0.0; w * h];
        Grid { w, cells }
    }
}

impl Index<(usize, usize)> for Grid {
    type Output = f64;
    fn index(
        &self,
        (r, c): (usize, usize),
    ) -> &f64 {
        assert!(c < self.w);
        &self.cells[c * self.w + r]
    }
}

impl IndexMut<(usize, usize)> for Grid {
    fn index_mut(
        &mut self,
        (r, c): (usize, usize),
    ) -> &mut f64 {
        assert!(c < self.w);
        let i = c * self.w + r;
        &mut self.cells[i]
    }
}

impl AddAssign<f64> for Grid {
    fn add_assign(&mut self, k: f64) {
        for x in &mut self.cells {
            *x += k;
        }
    }
}`,
        why: 'The position is worked out column by column (`c * w + r`), so `(1, 2)` on a 3 by 2 grid is position 7, past the end of its six cells, and the first test panics.',
      },
    ],
  },
};

export const quiz = [
  {
    q: '`#[derive(Clone)] struct Gc<T> { index: u32, marker: PhantomData<T> }`. What does derive write?',
    options: [
      {
        t: '`impl<T> Clone for Gc<T>`, for every `T`',
        why: 'Derive adds a bound on each type parameter, whether or not a field holds one.',
      },
      {
        t: '`impl<T: Clone> Clone for Gc<T>`, so a `Gc<X>` has no `clone` unless `X: Clone`',
        correct: true,
        why: 'rustc even suggests “manually implementing the trait to avoid undesired bounds”.',
      },
      {
        t: 'Nothing: derive does not work on generic types.',
        why: 'It does, with the extra bounds.',
      },
    ],
  },
  {
    q: '`struct Pair { left: Noisy, right: Noisy }` and `Pair` and `Noisy` both implement `Drop` (each prints its name). A `Pair` goes out of scope. What is printed?',
    options: [
      {
        t: '`left`, `right`, then `pair`',
        why: 'The fields cannot go first: the outer `drop` runs while its fields are still whole, so it may use them.',
      },
      {
        t: '`pair`, `right`, then `left`',
        why: 'Reverse order is the rule for local variables. Fields are dropped in declaration order.',
      },
      {
        t: '`pair`, `left`, then `right`',
        correct: true,
        why: 'The value’s own `drop` first, then its fields in the order they are declared.',
      },
    ],
  },
  {
    q: 'You want a value `x` (whose type implements `Drop`) to be dropped now, in the middle of a function. What do you write?',
    options: [
      {
        t: '`x.drop();`',
        why: 'Error E0040, “explicit use of destructor method”: `x` would still be owned and dropped again later.',
      },
      {
        t: '`drop(x);`',
        correct: true,
        why: '`std::mem::drop` takes ownership, so `x` is dropped once, as the call returns, and is moved away.',
      },
      {
        t: '`let _ = x;`',
        why: '`_` binds nothing, so this does not move `x` at all; it is still dropped at the end of its scope.',
      },
    ],
  },
  {
    q: 'Why does rustc refuse `#[derive(Clone, Copy)]` on a type that also has `impl Drop`?',
    options: [
      {
        t: 'Because `Drop` types must be generic',
        why: 'Any type may implement `Drop`; the conflict is with `Copy`.',
      },
      {
        t: 'Because a bitwise copy would make two values that both run `drop` for one resource',
        correct: true,
        why: 'Error E0184: “the type has a destructor”.',
      },
      {
        t: 'Because `Clone` cannot be derived for a `Drop` type',
        why: '`Clone` alone is fine; it is `Copy` that is refused.',
      },
    ],
  },
  {
    q: 'In `let n = Noisy("t").0.len();`, where `Noisy` prints in its `drop`, when is the `Noisy` dropped?',
    options: [
      {
        t: 'At the end of the enclosing block, like a variable',
        why: 'It is never bound to a name; it is a temporary.',
      },
      {
        t: 'At the end of this `let` statement, after `len()` has run',
        correct: true,
        why: 'Temporaries are dropped at the end of the statement that made them.',
      },
      {
        t: 'Never: values without a name are leaked',
        why: 'Rust drops temporaries; only `std::mem::forget` (or a cycle of `Rc`s) leaks.',
      },
    ],
  },
];
