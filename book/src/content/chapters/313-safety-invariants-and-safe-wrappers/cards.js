// Chapter 283 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'contract-vs-inv': {
    q: 'What is the difference between a **safety contract** and a **safety invariant**?',
    a: 'A contract belongs to an `unsafe fn`: what its caller must make true. An invariant belongs to a type: what every value of it must satisfy.',
  },
  validity: {
    q: 'A `&str` holds bytes that are not UTF-8. Is that a broken validity invariant or a broken safety invariant?',
    a: 'Safety: the compiler does not rely on UTF-8, but `str` methods may, so handing it to safe code allows undefined behaviour.',
  },
  'sound-def': {
    q: 'When is a type with unsafe code inside it **sound**?',
    a: 'When no safe code, whatever it does with the type’s public API, can break its invariant or cause undefined behaviour.',
  },
  'privacy-fence': {
    q: 'Why does an invariant that unsafe code relies on need a private field?',
    a: 'Otherwise any safe code anywhere could set the field and break it. Privacy limits the code you must check to one module.',
  },
  'derive-clone': {
    q: 'Why did `#[derive(Clone)]` on `CText` (which owns a C pointer) crash the program?',
    a: 'The derived clone copied the pointer, so two values owned one string and both freed it: “double free detected”.',
  },
  'drop-once': {
    q: 'What invariant lets `CText`’s `Drop` call C’s `free` safely?',
    a: 'The pointer is non-null, came from `strdup`, and nothing else frees it, so it is freed exactly once.',
  },
  'trust-generic': {
    q: 'Why must `BTreeMap`’s unsafe code stay safe even with a nonsense `Ord` implementation?',
    a: 'Writing a wrong `Ord` takes no `unsafe`, so unsafe code must not rely on safe code its callers supply.',
  },
  'unsafe-trait': {
    q: 'When is a trait declared `unsafe`, as `Send` and `Sync` are?',
    a: 'When unsafe code must rely on implementations being correct; implementing it (`unsafe impl`) is then a promise.',
  },
};

export const examples = {
  'c-text': {
    lang: 'rust',
    title: 'A safe owner for a C string',
    code: `use std::ffi::{c_char, c_void};
use std::ffi::{CStr, CString};

unsafe extern "C" {
    fn strdup(s: *const c_char)
        -> *mut c_char;
    fn free(p: *mut c_void);
}

/// A copy of a string, made and owned
/// by the C library.
/// Invariant: ptr is non-null, points
/// to a NUL-terminated string from
/// strdup, and nothing else frees it.
struct CText {
    ptr: *mut c_char,
}

impl CText {
    fn new(s: &str) -> Option<CText> {
        let c = CString::new(s).ok()?;
        let p = c.as_ptr();
        // SAFETY: p ends in a NUL byte.
        let ptr = unsafe { strdup(p) };
        if ptr.is_null() {
            // null: out of memory
            return None;
        }
        Some(CText { ptr })
    }

    fn as_c_str(&self) -> &CStr {
        // SAFETY: by the invariant, ptr
        // is a live NUL-terminated
        // string, freed only in drop.
        unsafe {
            CStr::from_ptr(self.ptr)
        }
    }
}

impl Drop for CText {
    fn drop(&mut self) {
        println!("free({:?})",
            self.as_c_str());
        // SAFETY: ptr came from strdup
        // and is freed exactly once.
        unsafe { free(self.ptr.cast()) }
    }
}

fn main() {
    let t = CText::new("hi from C")
        .unwrap();
    println!("{:?}", t.as_c_str());
    println!("{} bytes",
        t.as_c_str().count_bytes());
}`,
  },
};

export const exercises = {
  ascii: {
    lang: 'rust',
    title: 'Keep the invariant that makes as_str safe',
    prompt: 'Inside the module `ascii`, finish the type `Ascii`, whose invariant is “every byte is below 128”. `new(bytes)` returns `Some` only if every byte is ASCII; `push(x)` appends `x` and returns `true` if it is ASCII, and otherwise leaves the text unchanged and returns `false`; `as_str()` returns the text as a `&str` **without** checking, using the unsafe `from_utf8_unchecked`, with a `// SAFETY:` comment that names the invariant. The field stays private, so these three functions are the only ones that must keep the promise.',
    starter: `mod ascii {
    use std::str::from_utf8_unchecked;

    /// Text whose bytes are all ASCII.
    /// Invariant: every byte in .0 is
    /// below 128, so .0 is valid UTF-8.
    pub struct Ascii(Vec<u8>);

    impl Ascii {
        pub fn new(b: Vec<u8>)
            -> Option<Ascii> {
            todo!()
        }

        pub fn push(&mut self, x: u8)
            -> bool {
            todo!()
        }

        pub fn as_str(&self) -> &str {
            todo!()
        }
    }
}

use ascii::Ascii;`,
    solution: `mod ascii {
    use std::str::from_utf8_unchecked;

    /// Text whose bytes are all ASCII.
    /// Invariant: every byte in .0 is
    /// below 128, so .0 is valid UTF-8.
    pub struct Ascii(Vec<u8>);

    impl Ascii {
        pub fn new(b: Vec<u8>)
            -> Option<Ascii> {
            if b.is_ascii() {
                Some(Ascii(b))
            } else {
                None
            }
        }

        pub fn push(&mut self, x: u8)
            -> bool {
            if !x.is_ascii() {
                return false;
            }
            self.0.push(x);
            true
        }

        pub fn as_str(&self) -> &str {
            // SAFETY: by the invariant,
            // every byte is ASCII, and
            // ASCII is valid UTF-8.
            unsafe {
                from_utf8_unchecked(
                    &self.0)
            }
        }
    }
}

use ascii::Ascii;`,
    tests: `#[test]
fn ascii_text_is_accepted() {
    let a = Ascii::new(b"hello".to_vec()).unwrap();
    assert_eq!(a.as_str(), "hello");
}

#[test]
fn empty_is_ascii() {
    assert_eq!(Ascii::new(vec![]).unwrap().as_str(), "");
}

#[test]
fn bytes_from_128_up_are_refused() {
    assert!(Ascii::new(vec![b'a', 128]).is_none());
    assert!(Ascii::new(vec![0xFF]).is_none());
    assert!(Ascii::new("é".as_bytes().to_vec()).is_none());
}

#[test]
fn byte_127_is_still_ascii() {
    assert_eq!(Ascii::new(vec![127]).unwrap().as_str(), "\\u{7f}");
}

#[test]
fn push_keeps_the_invariant() {
    let mut a = Ascii::new(b"ok".to_vec()).unwrap();
    assert!(a.push(b'!'));
    assert!(!a.push(200));
    assert!(!a.push(128));
    assert_eq!(a.as_str(), "ok!");
}`,
    hints: [
      'Every function that can create or change an `Ascii` must keep the invariant. Which two are those, and what must each check?',
      '`[u8]` has an `is_ascii()` method (true when every byte is below 128), and so does `u8`. `new` checks the whole vector; `push` checks one byte before pushing.',
      '`as_str` is `unsafe { from_utf8_unchecked(&self.0) }`, with a SAFETY comment such as “by the invariant every byte is ASCII, and ASCII is valid UTF-8”.',
    ],
    walkthrough: `**How to think about it.** Start from the one line that needs a promise: \`from_utf8_unchecked(&self.0)\`, whose contract is “these bytes are valid UTF-8”. Ask what must be true of *every* \`Ascii\` for that to hold, and the answer is the invariant: all bytes below 128 (every ASCII byte is a whole UTF-8 character). Then list every way an \`Ascii\` can come into being or change. Because the field is private, there are exactly two: \`new\` and \`push\`. Make each keep the invariant, and \`as_str\` is safe for every caller, which is what “sound” means.

**The solution, line by line.**

- \`mod ascii {\` is the fence: privacy works per module, so code outside it cannot touch the field.
- \`use std::str::from_utf8_unchecked;\` brings in the unsafe function.
- \`pub struct Ascii(Vec<u8>);\` makes the type public but its field private (no \`pub\` inside the brackets). Outside the module, \`Ascii(vec![0xFF])\` is error E0603, “tuple struct constructor \`Ascii\` is private”.
- \`pub fn new(b: Vec<u8>) -> Option<Ascii> { if b.is_ascii() { Some(Ascii(b)) } else { None } }\` establishes the invariant: an \`Ascii\` is only built after the check passes. \`is_ascii\` is true exactly when every byte is at most 127.
- \`pub fn push(&mut self, x: u8) -> bool { if !x.is_ascii() { return false; } self.0.push(x); true }\` keeps it: a non-ASCII byte is refused before anything changes, so the value is never, even briefly, outside the invariant where safe code could see it.
- \`pub fn as_str(&self) -> &str {\` is the method that *relies* on it.
- \`// SAFETY: by the invariant, every byte is ASCII, and ASCII is valid UTF-8.\` names the reason, so a reviewer knows to check \`new\` and \`push\`, not the call site.
- \`unsafe { from_utf8_unchecked(&self.0) }\` skips the UTF-8 scan that \`std::str::from_utf8\` would do; that scan is what the invariant saves.
- \`use ascii::Ascii;\` outside the module brings the type into scope for the tests.

**Common wrong attempts.**

- Checking \`x <= 128\` instead of \`x < 128\`. Byte 128 is not ASCII, and on its own it is not valid UTF-8 either, so \`as_str\` would then hand safe code an invalid \`&str\`. The test \`bytes_from_128_up_are_refused\` catches it before that can happen.
- A \`push\` that does not check. Everything works for ASCII input, but \`a.push(200)\` puts the type outside its invariant, and the next \`as_str\` produces an invalid \`&str\`, all from safe code: the type is unsound. The test checks that \`push(200)\` returns \`false\`.
- Making the field \`pub\` “for convenience”. Every test still passes, because tests cannot see soundness, but any code anywhere could then write \`Ascii(vec![0xFF])\` and break \`as_str\`. Nothing inside an \`unsafe\` block changed; that is why soundness has to be argued about the whole module.
- Using \`std::str::from_utf8(&self.0).unwrap()\`. It is correct and safe, just slower; if you are happy to pay for the scan, you do not need the invariant at all, and that is often the right choice.`,
    wrong: [
      {
        code: `mod ascii {
    use std::str::from_utf8_unchecked;

    /// Text whose bytes are all ASCII.
    /// Invariant: every byte in .0 is
    /// below 128, so .0 is valid UTF-8.
    pub struct Ascii(Vec<u8>);

    impl Ascii {
        pub fn new(b: Vec<u8>)
            -> Option<Ascii> {
            if b.iter()
                .all(|&x| x <= 128)
            {
                Some(Ascii(b))
            } else {
                None
            }
        }

        pub fn push(&mut self, x: u8)
            -> bool {
            if !x.is_ascii() {
                return false;
            }
            self.0.push(x);
            true
        }

        pub fn as_str(&self) -> &str {
            // SAFETY: by the invariant,
            // every byte is ASCII, and
            // ASCII is valid UTF-8.
            unsafe {
                from_utf8_unchecked(
                    &self.0)
            }
        }
    }
}

use ascii::Ascii;`,
        why: 'Accepts byte 128, which is not ASCII (and not valid UTF-8 on its own), so the invariant is broken from the start.',
      },
      {
        code: `mod ascii {
    use std::str::from_utf8_unchecked;

    /// Text whose bytes are all ASCII.
    /// Invariant: every byte in .0 is
    /// below 128, so .0 is valid UTF-8.
    pub struct Ascii(Vec<u8>);

    impl Ascii {
        pub fn new(b: Vec<u8>)
            -> Option<Ascii> {
            if b.is_ascii() {
                Some(Ascii(b))
            } else {
                None
            }
        }

        pub fn push(&mut self, x: u8)
            -> bool {
            self.0.push(x);
            true
        }

        pub fn as_str(&self) -> &str {
            // SAFETY: by the invariant,
            // every byte is ASCII, and
            // ASCII is valid UTF-8.
            unsafe {
                from_utf8_unchecked(
                    &self.0)
            }
        }
    }
}

use ascii::Ascii;`,
        why: '`push` does not check, so `push(200)` returns `true` and puts a non-ASCII byte inside: safe code can now break `as_str`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Which of these is a *safety invariant* rather than a contract?',
    options: [
      {
        t: '“The index passed to `get_unchecked` is in bounds”',
        why: 'That is a contract: the caller of one unsafe fn must make it true.',
      },
      {
        t: '“Every `str` holds valid UTF-8”',
        correct: true,
        why: 'It is a property of every value of the type, which `str`’s own methods may rely on.',
      },
      {
        t: '“A `bool` is 0 or 1”',
        why: 'That is a validity invariant: the compiler itself relies on it.',
      },
    ],
  },
  {
    q: '`Ascii`’s field is made `pub`. Its `new`, `push` and `as_str` are unchanged and all tests pass. Is it still sound?',
    options: [
      {
        t: 'Yes: the unsafe block did not change',
        why: 'Soundness depends on all the code that can touch the field, and now that is all code.',
      },
      {
        t: 'Yes, as long as callers use `new`',
        why: 'Soundness means no safe caller can cause undefined behaviour, whatever they do.',
      },
      {
        t: 'No: safe code can now write `Ascii(vec![0xFF])` and make `as_str` return an invalid `&str`',
        correct: true,
        why: 'Privacy was the fence that kept the invariant; without it the type is unsound.',
      },
    ],
  },
  {
    q: 'A type owns a pointer from C’s `strdup` and frees it in `Drop`. Which addition breaks it?',
    options: [
      {
        t: '`#[derive(Debug)]`',
        why: 'A derived Debug only reads the fields (here it would print the pointer’s address).',
      },
      {
        t: '`#[derive(Clone)]`',
        correct: true,
        why: 'It copies the pointer, so two values free the same memory: here, “free(): double free detected”.',
      },
      {
        t: 'A method that returns `&CStr` borrowed from `&self`',
        why: 'The borrow cannot outlive the value, so the pointer stays valid while it is used.',
      },
    ],
  },
  {
    q: 'Unsafe code inside a generic function relies on the caller’s `T: Ord` being a true total order. What does the Rustonomicon say?',
    options: [
      {
        t: 'That is fine: `Ord` promises a total order',
        why: 'Implementing `Ord` is safe, so a wrong one is easy to write; unsafe code must stay memory-safe anyway.',
      },
      {
        t: 'Unsafe code must not trust safe code supplied by its callers; it may misbehave, but must not cause undefined behaviour',
        correct: true,
        why: 'That is the `BTreeMap` example: erratic results are allowed, undefined behaviour is not.',
      },
      {
        t: 'The function must be marked `unsafe fn`',
        why: 'That shifts the burden to callers, but the usual answer is to write the unsafe code defensively.',
      },
    ],
  },
  {
    q: 'Why are `Send` and `Sync` *unsafe* traits?',
    options: [
      {
        t: 'Because their methods use raw pointers',
        why: 'They have no methods at all; they are markers.',
      },
      {
        t: 'Because only the standard library may implement them',
        why: 'Anyone may, with `unsafe impl`.',
      },
      {
        t: 'Because unsafe code (threads, `Arc`, `Mutex`) relies on them being true, so implementing one is a promise the compiler cannot check',
        correct: true,
        why: 'Marking a trait unsafe moves the responsibility to whoever implements it.',
      },
    ],
  },
];
