// Chapter 361-b cards. Keys are stable ids: never rename them.

const UP = `use std::cell::RefCell;
use std::rc::Rc;

// One captured variable, shared.
type Up = Rc<RefCell<f64>>;

struct Closure {
    up: Up,
}
`;

export const prompts = {
  'refcell-what': {
    q: 'What does `RefCell<T>` check, and when?',
    a: 'The borrowing rules (many readers or one writer), at run time, each time you call `borrow` or `borrow_mut`.',
  },
  'refcell-guard': {
    q: 'What do `borrow()` and `borrow_mut()` return, and when is the borrow given back?',
    a: 'A guard (`Ref` or `RefMut`) that acts like a reference; the borrow ends when the guard is dropped.',
  },
  'refcell-interior': {
    q: 'What is **interior mutability**?',
    a: 'Changing a value through a shared `&` reference, because a type like `RefCell` checks the rules itself at run time.',
  },
  'refcell-panic': {
    q: 'What happens if you call `borrow()` on a `RefCell` while a `borrow_mut()` of it is still alive?',
    a: 'The program panics: “RefCell already mutably borrowed”.',
  },
  'refcell-vm': {
    q: 'Why is a `RefCell` double borrow a real risk in a VM built from `Rc<RefCell<..>>`?',
    a: 'The program decides which objects alias. Drip code like `a.heal(a)` makes one object both sides of an operation, so a held borrow meets another at run time.',
  },
  'cycle-leak': {
    q: 'Two objects behind `Rc` point at each other, and nothing else points at them. What happens?',
    a: 'Each strong count stays at 1, so neither is ever dropped: the memory leaks (safely: nothing dangles).',
  },
  'weak-what': {
    q: 'What is `Weak<T>`, and how do you use the value behind it?',
    a: 'A pointer that does not own, made with `Rc::downgrade`; `upgrade()` gives `Some(Rc)` while the value exists and `None` after.',
  },
  'cycle-vm': {
    q: 'Why can’t a VM fix `Rc` cycles with `Weak`?',
    a: 'The Drip program, not the VM’s author, decides which references form cycles, so the VM can’t know which edges to make weak.',
  },
};

export const examples = {
  'rc-share': {
    lang: 'rust',
    title: 'Two closures, one upvalue',
    code: `use std::cell::RefCell;
use std::rc::Rc;

// A captured variable, shared by
// two closures.
struct Upvalue {
    value: f64,
}

struct Closure {
    name: &'static str,
    up: Rc<RefCell<Upvalue>>,
}

fn main() {
    let up = Rc::new(RefCell::new(
        Upvalue { value: 0.0 },
    ));
    let inc = Closure {
        name: "inc",
        up: Rc::clone(&up),
    };
    let get = Closure {
        name: "get",
        up: Rc::clone(&up),
    };
    println!("owners: {}",
        Rc::strong_count(&up));
    inc.up.borrow_mut().value += 1.0;
    inc.up.borrow_mut().value += 1.0;
    let v = get.up.borrow().value;
    println!("{} sees {}", get.name, v);
    drop(inc);
    drop(get);
    println!("owners: {}",
        Rc::strong_count(&up));
}`,
  },
};

export const exercises = {
  sharedUpvalue: {
    lang: 'rust',
    title: 'Capture, don’t copy',
    prompt:
      'A closure captures a variable by sharing it (*Capturing variables: upvalues*): two closures that capture the same variable see each other’s changes. Write `capture`, which makes a `Closure` that shares `up`, and the methods `bump` (add 1 to the variable) and `read`.',
    starter: `${UP}
// Share \`up\`; don't copy it.
fn capture(up: &Up) -> Closure {
    todo!()
}

impl Closure {
    // Add 1 to the captured variable.
    fn bump(&self) {
        todo!()
    }

    fn read(&self) -> f64 {
        todo!()
    }
}`,
    solution: `${UP}
// Share \`up\`; don't copy it.
fn capture(up: &Up) -> Closure {
    Closure { up: Rc::clone(up) }
}

impl Closure {
    // Add 1 to the captured variable.
    fn bump(&self) {
        *self.up.borrow_mut() += 1.0;
    }

    fn read(&self) -> f64 {
        *self.up.borrow()
    }
}`,
    tests: `#[test]
fn one_closure_counts() {
    let up = Rc::new(RefCell::new(0.0));
    let c = capture(&up);
    c.bump();
    c.bump();
    assert_eq!(c.read(), 2.0);
}

#[test]
fn two_closures_share_one_variable() {
    let up = Rc::new(RefCell::new(10.0));
    let inc = capture(&up);
    let get = capture(&up);
    inc.bump();
    assert_eq!(get.read(), 11.0);
    assert_eq!(*up.borrow(), 11.0);
}

#[test]
fn each_capture_is_an_owner() {
    let up = Rc::new(RefCell::new(0.0));
    let a = capture(&up);
    let b = capture(&up);
    assert_eq!(Rc::strong_count(&up), 3);
    drop(a);
    drop(b);
    assert_eq!(Rc::strong_count(&up), 1);
}`,
    hints: [
      'Sharing an `Rc` means making another pointer to the same allocation: `Rc::clone(up)`.',
      '`self.up.borrow_mut()` gives a guard you can write through with `*`: `*guard += 1.0`.',
      '`read` borrows for reading and copies the `f64` out: `*self.up.borrow()`.',
    ],
    walkthrough: `**How to think about it.** A captured variable that two closures share must be *one* variable: when one closure changes it, the other must see the change. So \`capture\` must not copy the value; it must hand out another owner of the same cell. That cell is an \`Rc\` (several owners) around a \`RefCell\` (changeable through a shared pointer), the \`Up\` type the starter defines.

**The solution, line by line.**

- \`fn capture(up: &Up) -> Closure { Closure { up: Rc::clone(up) } }\`: \`Rc::clone\` makes a second pointer to the *same* \`RefCell<f64>\` and adds 1 to its strong count. The third test checks exactly that: the original plus two closures make 3 owners, and dropping the closures brings the count back to 1.
- \`fn bump(&self) {\` takes \`&self\`, not \`&mut self\`: other closures share the variable, so nobody has unique access, and the \`RefCell\` is what makes changing it possible anyway.
- \`*self.up.borrow_mut() += 1.0;\`: \`self.up\` is the \`Rc\`, and calling \`borrow_mut()\` on it reaches the \`RefCell\` inside (an \`Rc\` lets you call its value's methods directly). It checks that nobody else is borrowing and returns a writer guard; \`*\` writes through the guard. The guard is a temporary, so it is dropped, and the borrow given back, at the semicolon.
- \`fn read(&self) -> f64 { *self.up.borrow() }\`: a reader guard, and \`*\` copies the \`f64\` out. Returning the number, not a reference, means no borrow outlives the call.

This is what a TypeScript closure does for free. In Rust you say "shared" (\`Rc\`) and "mutable through sharing" (\`RefCell\`) out loud, and the count and the borrow checks happen while the program runs.

**Common wrong attempts.**

- Copying the value into a new cell in \`capture\` (\`Rc::new(RefCell::new(*up.borrow()))\`): every closure gets its own variable, so \`inc.bump()\` changes only \`inc\`'s copy and \`get\` still sees 10.
- In \`bump\`, writing \`let mut v = *self.up.borrow(); v += 1.0;\`: this copies the number into a local \`v\` and changes only that local.
- Holding a guard across a call, such as \`let g = self.up.borrow_mut(); self.read()\`: \`read\` asks for a reader while the writer is alive, and the program panics with "RefCell already mutably borrowed".`,
    wrong: [
      {
        code: `${UP}
fn capture(up: &Up) -> Closure {
    let v = *up.borrow();
    Closure {
        up: Rc::new(RefCell::new(v)),
    }
}

impl Closure {
    fn bump(&self) {
        *self.up.borrow_mut() += 1.0;
    }

    fn read(&self) -> f64 {
        *self.up.borrow()
    }
}`,
        why: 'This captures by copying: each closure gets its own new `RefCell` holding the current value. `inc.bump()` then changes only `inc`’s copy, and `get` still sees 10.',
      },
      {
        code: `${UP}
fn capture(up: &Up) -> Closure {
    Closure { up: Rc::clone(up) }
}

impl Closure {
    fn bump(&self) {
        let mut v = *self.up.borrow();
        v += 1.0;
    }

    fn read(&self) -> f64 {
        *self.up.borrow()
    }
}`,
        why: '`*self.up.borrow()` copies the `f64` into a local `v`, and the addition changes only that local. Write through a `borrow_mut()` guard instead.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'You write `a.borrow_mut()` and, while that guard is alive, call `a.borrow()`. When do you find out?',
    options: [
      { t: 'At compile time, with E0502', why: 'That is what plain references give you. A `RefCell` moves the check to run time.' },
      { t: 'When that line runs: the program panics with “RefCell already mutably borrowed”', correct: true, why: 'The real panic from rustc 1.97.' },
      { t: 'Never: `RefCell` allows it', why: 'It enforces the same rules as `&` and `&mut`, just later.' },
      { t: 'Only in release builds', why: 'The check runs in every build.' },
    ],
  },
  {
    q: 'Why does `*c.borrow_mut() += 1; println!("{}", c.borrow());` not panic?',
    options: [
      { t: 'The writer guard is a temporary, dropped at the end of its statement', correct: true, why: 'By the time `borrow()` runs, no writer is alive.' },
      { t: '`borrow` and `borrow_mut` never conflict', why: 'They do, while both guards are alive.' },
      { t: 'The compiler removes the check', why: 'The check always runs.' },
    ],
  },
  {
    q: 'Which type lets two closures share one variable and both change it?',
    options: [
      { t: '`Box<f64>`', why: 'A box has exactly one owner.' },
      { t: '`Rc<f64>`', why: 'Two owners, but an `Rc` gives only shared, read-only access.' },
      { t: '`RefCell<f64>` on its own', why: 'Changeable, but it still has only one owner.' },
      { t: '`Rc<RefCell<f64>>`', correct: true, why: '`Rc` gives several owners; `RefCell` lets them change the value through shared access.' },
    ],
  },
  {
    q: 'Objects `c` and `d` hold `Rc`s to each other, and the variables `c` and `d` go out of scope. What happens?',
    options: [
      { t: 'Both are freed, since no variable reaches them', why: 'Reference counting does not ask about reachability.' },
      { t: 'Each count falls to 1 and stays there, so neither is freed: a leak', correct: true, why: 'The program printed no `free c` or `free d`.' },
      { t: 'The program panics', why: 'A leak is memory safe; nothing panics.' },
    ],
  },
  {
    q: 'What does `back.upgrade()` return after the last `Rc` to the value is dropped?',
    options: [
      { t: 'The value, kept alive by the `Weak`', why: 'A `Weak` does not own, so it cannot keep the value alive.' },
      { t: 'A dangling pointer', why: 'Rust never hands out a dangling pointer here.' },
      { t: '`None`', correct: true, why: '`upgrade` returns `Some(Rc)` only while the value still exists.' },
    ],
  },
];
