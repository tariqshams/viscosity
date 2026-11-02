// Chapter 329 cards. Keys are stable ids: never rename them.
// Every rustc, cargo, nm and linker message quoted here was produced
// with rustc 1.97.0 and gcc 13.3 on x86-64 Linux, in scratch projects
// built for the chapter.

const L = (...xs) => xs.join('\n');

export const prompts = {
  'ffi-what': {
    q: 'What is **FFI**?',
    a: 'The foreign function interface: the way code in one language calls code in another, here Rust calling C and C calling Rust.',
  },
  'extern-block': {
    q: 'Why is every call to a function declared in an `unsafe extern "C"` block itself `unsafe`?',
    a: 'Rust cannot see or check the foreign body, nor that your declaration matches it; the caller vouches for both.',
  },
  cstring: {
    q: 'Why can’t you pass a `&str`’s pointer straight to C’s `strlen`?',
    a: 'A C string must end in a NUL byte and a Rust `&str` has none (it stores a length instead). `CString::new` copies the text and adds the NUL.',
  },
  'ffi-safe': {
    q: 'Which types may cross an FFI boundary?',
    a: 'Types with a C-compatible layout: integers, floats, raw pointers, `extern "C" fn` pointers and `#[repr(C)]` structs. Not `String`, `Vec` or `&str`.',
  },
  'abi-why': {
    q: 'Why must a Rust function called from C be `extern "C"`?',
    a: 'A plain Rust `fn` uses Rust’s own ABI, which has no stability guarantees; `extern "C"` uses the platform C compiler’s calling convention.',
  },
  'no-mangle': {
    q: 'What does `#[no_mangle]` do, and why is it needed?',
    a: 'It keeps the function’s symbol name as written. Otherwise rustc mangles it (here into `_RNv…6hidden`), and C’s linker cannot find it by name.',
  },
  callback: {
    q: 'How does C’s `qsort` call back into Rust?',
    a: 'You pass it a pointer to an `extern "C" fn` comparison function; `qsort` calls it for each pair it compares.',
  },
  'panic-cross': {
    q: 'What happens if a Rust panic reaches the end of an `extern "C"` function?',
    a: 'The process aborts (“panic in a function that cannot unwind”), because C cannot unwind a Rust panic.',
  },
};

export const examples = {
  'libc-calls': {
    lang: 'rust',
    title: 'Calling abs and strlen from the C library',
    code: String.raw`use std::ffi::{c_char, c_int, CString};

// Functions from the C library, which
// Rust links by default.
unsafe extern "C" {
    fn abs(x: c_int) -> c_int;
    fn strlen(s: *const c_char)
        -> usize;
}

fn main() {
    // SAFETY: abs is defined for every
    // int except INT_MIN.
    let a = unsafe { abs(-42) };
    println!("abs(-42) = {a}");

    let s = CString::new("héllo")
        .unwrap();
    // SAFETY: s ends in a NUL byte.
    let n =
        unsafe { strlen(s.as_ptr()) };
    println!("strlen = {n} bytes");

    let bad = CString::new("a\0b");
    println!("{bad:?}");
}`,
  },
};

export const exercises = {
  'c-len': {
    lang: 'rust',
    title: 'Ask C for a string’s length',
    prompt:
      'Write `c_len(s)`, which returns the length of `s` in bytes as computed by the C library’s `strlen` (declared for you), or `None` if `s` contains a NUL byte, which C would treat as the end of the string. Make a `CString`, call `strlen` on its pointer inside an `unsafe` block, and write a `// SAFETY:` comment.',
    starter: String.raw`use std::ffi::{c_char, CString};

unsafe extern "C" {
    fn strlen(s: *const c_char)
        -> usize;
}

fn c_len(s: &str) -> Option<usize> {
    todo!()
}`,
    solution: String.raw`use std::ffi::{c_char, CString};

unsafe extern "C" {
    fn strlen(s: *const c_char)
        -> usize;
}

fn c_len(s: &str) -> Option<usize> {
    let c = CString::new(s).ok()?;
    // SAFETY: c is a live CString, so
    // its pointer ends in a NUL byte.
    Some(unsafe { strlen(c.as_ptr()) })
}`,
    tests: String.raw`#[test]
fn ascii_words() {
    assert_eq!(c_len("hello"), Some(5));
    assert_eq!(c_len("a"), Some(1));
}

#[test]
fn the_empty_string() {
    assert_eq!(c_len(""), Some(0));
}

#[test]
fn counts_bytes_not_characters() {
    // é is two bytes in UTF-8
    assert_eq!(c_len("héllo"), Some(6));
}

#[test]
fn an_inner_nul_is_refused() {
    assert_eq!(c_len("a\0b"), None);
}

#[test]
fn agrees_with_len_for_many_strings() {
    for n in 0..50 {
        let s = "xy".repeat(n);
        assert_eq!(c_len(&s), Some(s.len()));
    }
}`,
    hints: [
      'C wants a pointer to bytes that end with a zero byte. Which `std::ffi` type builds exactly that from a `&str`?',
      '`CString::new(s)` returns a `Result`: `Err` when `s` contains a NUL. `.ok()?` turns that into an early `None`.',
      'The call is `unsafe { strlen(c.as_ptr()) }`, wrapped in `Some(...)`. Keep the `CString` in a variable: its pointer is only valid while it lives.',
    ],
    walkthrough: L(
      '**How to think about it.** The C side has one rule: `strlen` walks memory from the pointer until it finds a zero byte, and counts the bytes before it. So our job is to hand it a pointer to a copy of the text with exactly one zero byte, at the end. If the text already has a zero byte in the middle, C would stop there and give the wrong answer, so the honest answer is `None`. `CString` does both the check and the copying; what is left is the `unsafe` call and the comment that says why it is fine.',
      '',
      '**The solution, line by line.**',
      '',
      '- `use std::ffi::{c_char, CString};` brings in C’s `char` type and the owned C string.',
      '- `unsafe extern "C" { fn strlen(s: *const c_char) -> usize; }` (given) declares the C library function. `usize` matches C’s `size_t` on the platforms Rust supports.',
      '- `fn c_len(s: &str) -> Option<usize> {` is a safe function: callers pass any `&str`.',
      '- `let c = CString::new(s).ok()?;` copies the bytes of `s` and appends a NUL. If `s` contains a NUL, `new` returns `Err(NulError(...))`; `.ok()` turns the `Result` into an `Option`, and `?` returns `None` from `c_len` at once.',
      '- `// SAFETY: c is a live CString, so its pointer ends in a NUL byte.` states the one promise `strlen` needs.',
      '- `Some(unsafe { strlen(c.as_ptr()) })` calls C. `as_ptr()` lends a `*const c_char` to the CString’s bytes; `c` stays alive until the end of the function, so the pointer is valid for the whole call. `héllo` gives 6, because `é` is two bytes in UTF-8 and `strlen` counts bytes.',
      '',
      '**Common wrong attempts.**',
      '',
      '- `Some(s.len())`, skipping C altogether. It agrees with `strlen` for every string without a NUL, but says `Some(3)` for `"a\\0b"`, where C would see one character.',
      '- `CString::new(s).unwrap()`. Fine until a string contains a NUL; then the program panics instead of answering `None`.',
      '- `strlen(s.as_ptr() as *const c_char)` on the `&str` itself. It compiles, but there is no NUL after the text, so `strlen` keeps reading past the end of the string: undefined behaviour, which might even pass the tests by luck.',
      '- Keeping only the pointer, as in `let p = CString::new(s).unwrap().as_ptr();`: the temporary `CString` is dropped at the end of that statement, so `p` dangles. Keep the `CString` itself in a named variable.',
    ),
    wrong: [
      {
        code: String.raw`fn c_len(s: &str) -> Option<usize> {
    Some(s.len())
}`,
        why: 'Never calls C: correct for ordinary text, but `"a\\0b"` gives `Some(3)` instead of `None`.',
      },
      {
        code: String.raw`use std::ffi::{c_char, CString};

unsafe extern "C" {
    fn strlen(s: *const c_char)
        -> usize;
}

fn c_len(s: &str) -> Option<usize> {
    let c = CString::new(s).unwrap();
    Some(unsafe { strlen(c.as_ptr()) })
}`,
        why: '`unwrap()` panics on text with a NUL byte, instead of returning `None`.',
      },
    ],
  },
  'sort-down': {
    optional: true,
    lang: 'rust',
    title: 'Sort with C’s qsort and a Rust callback',
    prompt:
      'Write `sort_down(xs)`, which sorts a slice of `i32` from largest to smallest using the C library’s `qsort` (declared for you), and the comparison callback `down` it calls. `qsort` hands `down` two pointers to elements; `down` must return a negative number if the first should come first, zero if they are equal, and a positive number otherwise. Avoid `b - a`: it overflows for large numbers.',
    starter: String.raw`use std::ffi::{c_int, c_void};

type Cmp = extern "C" fn(
    *const c_void,
    *const c_void,
) -> c_int;

unsafe extern "C" {
    fn qsort(
        base: *mut c_void,
        n: usize,
        size: usize,
        cmp: Cmp,
    );
}

extern "C" fn down(
    a: *const c_void,
    b: *const c_void,
) -> c_int {
    todo!()
}

fn sort_down(xs: &mut [i32]) {
    todo!()
}`,
    solution: String.raw`use std::ffi::{c_int, c_void};

type Cmp = extern "C" fn(
    *const c_void,
    *const c_void,
) -> c_int;

unsafe extern "C" {
    fn qsort(
        base: *mut c_void,
        n: usize,
        size: usize,
        cmp: Cmp,
    );
}

extern "C" fn down(
    a: *const c_void,
    b: *const c_void,
) -> c_int {
    // SAFETY: qsort passes pointers to
    // two i32s inside the slice.
    let (a, b) = unsafe {
        (*a.cast::<i32>(),
         *b.cast::<i32>())
    };
    b.cmp(&a) as c_int
}

fn sort_down(xs: &mut [i32]) {
    let size = size_of::<i32>();
    // SAFETY: pointer, length and size
    // describe one live slice of i32,
    // and down reads i32s.
    unsafe {
        qsort(xs.as_mut_ptr().cast(),
              xs.len(), size, down);
    }
}`,
    tests: String.raw`#[test]
fn sorts_largest_first() {
    let mut xs = [5, -2, 9, 0, 3];
    sort_down(&mut xs);
    assert_eq!(xs, [9, 5, 3, 0, -2]);
}

#[test]
fn handles_extremes_without_overflow() {
    let mut xs = [i32::MIN, 0, i32::MAX, -1];
    sort_down(&mut xs);
    assert_eq!(xs, [i32::MAX, 0, -1, i32::MIN]);
}

#[test]
fn empty_and_single() {
    let mut e: [i32; 0] = [];
    sort_down(&mut e);
    let mut one = [7];
    sort_down(&mut one);
    assert_eq!(one, [7]);
}

#[test]
fn matches_the_std_sort() {
    let mut xs: Vec<i32> = (0..200).map(|i| (i * 7919) % 211 - 100).collect();
    let mut want = xs.clone();
    want.sort_by(|a, b| b.cmp(a));
    sort_down(&mut xs);
    assert_eq!(xs, want);
}`,
    hints: [
      'Inside `down`, turn each `*const c_void` into an `i32` with `.cast::<i32>()` and `*`, inside `unsafe`. Then decide the order.',
      'For largest first, compare the *second* with the first: `b.cmp(&a)`. An `Ordering` is `-1`, `0` or `1` as a number, so `as c_int` turns it into what qsort wants.',
      'In `sort_down`: `unsafe { qsort(xs.as_mut_ptr().cast(), xs.len(), size_of::<i32>(), down) }`, with a SAFETY comment saying the pointer, length and size describe the slice.',
    ],
    walkthrough: L(
      '**How to think about it.** `qsort` is generic in the C way: it knows nothing about `i32`, only that there are `n` elements of `size` bytes each starting at `base`, and that `down` can compare two of them. So Rust has to describe the slice in those terms, and write a comparison that turns raw pointers back into `i32`s. Largest first means “the bigger one comes first”, which is the usual comparison with its arguments swapped.',
      '',
      '**The solution, line by line.**',
      '',
      '- `extern "C" fn down(a: *const c_void, b: *const c_void) -> c_int {` is a Rust function with C’s calling convention, so `qsort` can call it. Its type matches `Cmp`.',
      '- `let (a, b) = unsafe { (*a.cast::<i32>(), *b.cast::<i32>()) };` changes each untyped pointer to `*const i32` and reads through it. This is `unsafe` because Rust cannot know the pointers are valid; the SAFETY comment says why they are: qsort only passes pointers into our slice.',
      '- `b.cmp(&a) as c_int` compares the second with the first, so a larger `a` gives `Less`, which is `-1`, and `qsort` puts `a` first. `Ordering` is defined as `-1`, `0` and `1`, so the cast is exact and never overflows.',
      '- `fn sort_down(xs: &mut [i32]) {` is the safe wrapper.',
      '- `let size = size_of::<i32>();` is 4, the size of one element.',
      '- `qsort(xs.as_mut_ptr().cast(), xs.len(), size, down);` passes a `*mut c_void` to the first element, the count, the element size and the callback. The slice is borrowed mutably for the whole call, so nothing else can touch it while C sorts it in place.',
      '',
      '**Common wrong attempts.**',
      '',
      '- `a.cmp(&b) as c_int` sorts smallest first: the right machinery, the wrong order.',
      '- `b - a`. It looks like the classic C idiom, and works for small numbers; but `i32::MAX - i32::MIN` overflows, a debug build panics, and since the panic is inside an `extern "C"` function, the whole test program aborts with “panic in a function that cannot unwind”.',
      '- Passing `xs.len() * 4` as the count or `1` as the size: `qsort` then sorts bytes, not numbers.',
    ),
    wrong: [
      {
        code: String.raw`use std::ffi::{c_int, c_void};

type Cmp = extern "C" fn(
    *const c_void,
    *const c_void,
) -> c_int;

unsafe extern "C" {
    fn qsort(
        base: *mut c_void,
        n: usize,
        size: usize,
        cmp: Cmp,
    );
}

extern "C" fn down(
    a: *const c_void,
    b: *const c_void,
) -> c_int {
    // SAFETY: qsort passes pointers to
    // two i32s inside the slice.
    let (a, b) = unsafe {
        (*a.cast::<i32>(),
         *b.cast::<i32>())
    };
    a.cmp(&b) as c_int
}

fn sort_down(xs: &mut [i32]) {
    let size = size_of::<i32>();
    // SAFETY: pointer, length and size
    // describe one live slice of i32,
    // and down reads i32s.
    unsafe {
        qsort(xs.as_mut_ptr().cast(),
              xs.len(), size, down);
    }
}`,
        why: 'Compares in the usual order, so the slice ends up smallest first.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'You declare `fn mean(xs: *const c_double, n: usize) -> c_double;` in an `unsafe extern "C"` block. What does Rust check?',
    options: [
      { t: 'That it matches the C definition in stats.c', why: 'Rust never sees the C code; a wrong declaration compiles and misbehaves.' },
      { t: 'Only that your calls match the declaration you wrote', correct: true, why: 'The declaration itself is taken on trust, which is why each call is unsafe.' },
      { t: 'Nothing, not even the argument types', why: 'Calls are type-checked against your declaration like any other function.' },
    ],
  },
  {
    q: 'Why is `fn puts(s: String) -> i32;` in an extern block flagged by rustc?',
    options: [
      { t: '`puts` does not exist in C', why: 'It does; the problem is the argument type.' },
      { t: '`String` has no fixed, C-compatible layout, so it is “not FFI-safe”', correct: true, why: 'C expects a `char *` ending in NUL; pass a `CString`’s pointer instead.' },
      { t: 'Extern functions may not take arguments', why: 'They may, as long as the types are C-compatible.' },
    ],
  },
  {
    q: 'A C program cannot link against `pub extern "C" fn hidden` in your Rust static library. Why?',
    options: [
      { t: 'It needs `#[no_mangle]`: without it, the symbol is a mangled name like `_RNv…6hidden`', correct: true, why: 'The linker matches names exactly, and C asks for plain `hidden`.' },
      { t: 'It needs to be `unsafe`', why: 'Being unsafe changes who may call it, not what it is called.' },
      { t: '`extern "C"` functions cannot be `pub`', why: 'They can, and must be, to be exported.' },
    ],
  },
  {
    q: 'Which statement about Rust’s own (non-`extern`) calling convention is true?',
    options: [
      { t: 'It is the same as C’s on every platform', why: 'The Reference says the Rust ABI offers no stability guarantees.' },
      { t: 'It is unspecified and may change between compiler versions', correct: true, why: 'Which is why anything crossing a language boundary uses `extern "C"`.' },
      { t: 'It is stable, but only on x86-64', why: 'It is not promised on any platform.' },
    ],
  },
  {
    q: 'A Rust `extern "C"` callback panics while C’s `qsort` is calling it. What happens?',
    options: [
      { t: 'The panic unwinds through qsort back to Rust, as usual', why: 'A non-unwinding ABI boundary stops it: C cannot unwind a Rust panic.' },
      { t: 'qsort catches it and returns an error', why: 'C has no idea what a Rust panic is.' },
      { t: 'The process aborts, reporting a panic in a function that cannot unwind', correct: true, why: 'That is what the program did under rustc 1.97; `extern "C-unwind"` exists for the rare case where unwinding is expected.' },
    ],
  },
];
