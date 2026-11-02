// Chapter 281 cards. Keys are stable ids: never rename them.

export const prompts = {
  'struct-what': {
    q: 'What is a Rust `struct`, compared with a TypeScript interface?',
    a: 'A named record type with typed fields. Unlike an interface, it is the real type: values are built from it.',
  },
  'struct-all-fields': {
    q: 'When you write `Particle { ... }`, which fields must you give?',
    a: 'Every one of them. A struct value can’t have missing fields.',
  },
  'struct-mut': {
    q: 'Can you make just one field of a struct mutable?',
    a: 'No. Mutability belongs to the binding, so `let mut p` makes all of `p` changeable.',
  },
  'field-shorthand': {
    q: 'What does `Particle { x, y, vx: 0.0, vy: 0.0 }` mean when `x` and `y` are variables?',
    a: 'Field init shorthand: `x` means `x: x`.',
  },
  'impl-what': {
    q: 'What does an `impl Particle` block do?',
    a: 'It attaches functions (methods and associated functions) to the type `Particle`.',
  },
  'assoc-fn': {
    q: 'How is `fn new(vx: f64, vy: f64) -> Self` called, and why not with a dot?',
    a: '`Particle::new(3.0, 4.0)`. It has no `self` parameter, so there is no value to call it on.',
  },
  'self-alias': {
    q: 'Inside `impl Particle`, what does `Self` mean?',
    a: 'The type the `impl` is for: `Particle`.',
  },
  'recv-ref': {
    q: 'Which receiver does a method that only reads fields take?',
    a: '`&self`, a shared borrow.',
  },
  'recv-mut': {
    q: 'Which receiver lets a method change fields, and what must the caller have?',
    a: '`&mut self`. The caller’s variable must be declared `let mut`.',
  },
  'recv-own': {
    q: 'What happens to `p` after calling a method that takes `self` by value?',
    a: '`p` is moved into the method and can’t be used again.',
  },
  'auto-ref': {
    q: 'What does `p.step(1.0)` really mean, if `step` takes `&mut self`?',
    a: '`Particle::step(&mut p, 1.0)`. Rust adds the borrow for you.',
  },
  'array-inline': {
    q: 'In an array of `Particle` structs, where are the fields stored?',
    a: 'Inline, one struct after another. Element n starts n × the struct’s size into the array.',
  },
};

export const examples = {
  particle: {
    lang: 'rust',
    title: 'A particle with methods',
    code: `struct Particle {
    x: f64,
    y: f64,
    vx: f64,
    vy: f64,
}

impl Particle {
    fn new(vx: f64, vy: f64) -> Self {
        Particle {
            x: 0.0,
            y: 0.0,
            vx,
            vy,
        }
    }

    fn speed(&self) -> f64 {
        let v2 = self.vx * self.vx
            + self.vy * self.vy;
        v2.sqrt()
    }

    fn step(&mut self, dt: f64) {
        self.x += self.vx * dt;
        self.y += self.vy * dt;
    }

    fn stopped(mut self) -> Self {
        self.vx = 0.0;
        self.vy = 0.0;
        self
    }
}

fn main() {
    let mut p = Particle::new(3.0, 4.0);
    println!("speed {}", p.speed());
    p.step(1.0);
    p.step(1.0);
    println!("at {} {}", p.x, p.y);
    let q = p.stopped();
    println!("speed {}", q.speed());
}`,
  },
};

export const exercises = {
  stack: {
    lang: 'rust',
    title: 'The VM’s stack as a struct',
    prompt:
      'Finish this fixed-size value stack, adapted from `push`, `pop` and `peek` in the Rust Drip VM. `top` is the number of values on the stack, so the top value is at `slots[top - 1]`. `peek(0)` is the top value, `peek(1)` the one under it (`d` is the distance down from the top), and peeking removes nothing. The receivers are already written: notice which methods need `&mut self`. Replace each `todo!()`, which stops the program if it is ever reached.',
    starter: `struct Stack {
    slots: [f64; 8],
    top: usize,
}

impl Stack {
    fn new() -> Self {
        Stack {
            slots: [0.0; 8],
            top: 0,
        }
    }

    fn push(&mut self, v: f64) {
        todo!()
    }

    fn pop(&mut self) -> f64 {
        todo!()
    }

    fn peek(&self, d: usize) -> f64 {
        todo!()
    }

    fn len(&self) -> usize {
        self.top
    }
}`,
    solution: `struct Stack {
    slots: [f64; 8],
    top: usize,
}

impl Stack {
    fn new() -> Self {
        Stack {
            slots: [0.0; 8],
            top: 0,
        }
    }

    fn push(&mut self, v: f64) {
        self.slots[self.top] = v;
        self.top += 1;
    }

    fn pop(&mut self) -> f64 {
        self.top -= 1;
        self.slots[self.top]
    }

    fn peek(&self, d: usize) -> f64 {
        self.slots[self.top - 1 - d]
    }

    fn len(&self) -> usize {
        self.top
    }
}`,
    tests: `#[test]
fn last_in_first_out() {
    let mut s = Stack::new();
    s.push(1.0);
    s.push(2.0);
    assert_eq!(s.pop(), 2.0);
    assert_eq!(s.pop(), 1.0);
    assert_eq!(s.len(), 0);
}
#[test]
fn peek_counts_down_from_the_top() {
    let mut s = Stack::new();
    s.push(1.0);
    s.push(2.0);
    s.push(3.0);
    assert_eq!(s.peek(0), 3.0);
    assert_eq!(s.peek(2), 1.0);
}
#[test]
fn peek_removes_nothing() {
    let mut s = Stack::new();
    s.push(7.0);
    s.peek(0);
    assert_eq!(s.len(), 1);
    assert_eq!(s.pop(), 7.0);
}
#[test]
fn pop_then_push_reuses_the_slot() {
    let mut s = Stack::new();
    s.push(1.0);
    s.pop();
    s.push(5.0);
    assert_eq!(s.peek(0), 5.0);
    assert_eq!(s.len(), 1);
}`,
    hints: [
      '`push` writes into the first free slot, which is `self.slots[self.top]`, then adds one to `top`.',
      '`pop` does the reverse in the opposite order: subtract one from `top` first, then read `self.slots[self.top]`. The last expression is the return value.',
      '`peek(0)` is `self.slots[self.top - 1]`. Each step of `d` goes one slot further down: `self.slots[self.top - 1 - d]`.',
    ],
    walkthrough: `The receivers come from what each method does to the stack:

- **\`push(&mut self, v)\`** changes the stack: \`self.slots[self.top] = v;\` then \`self.top += 1;\`.
- **\`pop(&mut self)\`** changes it too. Decrement first, so \`top\` points at the last value, then return \`self.slots[self.top]\` as the block's final expression (chapter 277). The old value stays in the array, but it is above \`top\`, so it doesn't count, and the next \`push\` overwrites it.
- **\`peek(&self, d)\`** only reads, so \`&self\` is enough: \`self.slots[self.top - 1 - d]\`.

The companion VM's versions have the same receivers. \`fn push(&mut self, value: Value)\` and \`fn pop(&mut self) -> Value\` change the stack, and \`fn peek(&self, distance: usize) -> Value\` reads \`self.stack[self.stack.len() - 1 - distance]\`. Its stack grows instead of having eight fixed slots, using \`Vec\` from chapter 284.

What if you push a ninth value? \`self.slots[8]\` is out of bounds, and Rust's bounds check stops the program instead of writing past the end of the array.`,
    wrong: [
      {
        code: `struct Stack {
    slots: [f64; 8],
    top: usize,
}

impl Stack {
    fn new() -> Self {
        Stack {
            slots: [0.0; 8],
            top: 0,
        }
    }

    fn push(&mut self, v: f64) {
        self.slots[self.top] = v;
        self.top += 1;
    }

    fn pop(&mut self) -> f64 {
        self.top -= 1;
        self.slots[self.top]
    }

    fn peek(&self, d: usize) -> f64 {
        self.slots[self.top - d]
    }

    fn len(&self) -> usize {
        self.top
    }
}`,
        why: '`top` counts values, so `slots[top]` is the first *free* slot. `peek(0)` reads an empty slot. The top value is at `top - 1`.',
      },
      {
        code: `struct Stack {
    slots: [f64; 8],
    top: usize,
}

impl Stack {
    fn new() -> Self {
        Stack {
            slots: [0.0; 8],
            top: 0,
        }
    }

    fn push(&mut self, v: f64) {
        self.slots[self.top] = v;
        self.top += 1;
    }

    fn pop(&mut self) -> f64 {
        let v = self.slots[self.top];
        self.top -= 1;
        v
    }

    fn peek(&self, d: usize) -> f64 {
        self.slots[self.top - 1 - d]
    }

    fn len(&self) -> usize {
        self.top
    }
}`,
        why: 'This reads before it decrements, so it returns the free slot above the top value. Order matters: move `top` down first, then read.',
      },
    ],
  },
  span: {
    lang: 'rust',
    optional: true,
    title: 'Source spans',
    prompt:
      'A `Span` marks a byte range of source code, like a token’s position. Write `len(&self)`, the number of bytes it covers, and `join(self, b)`, which consumes both spans and returns the smallest span covering both. `a.min(b)` and `a.max(b)` work on `usize`.',
    starter: `struct Span {
    start: usize,
    end: usize,
}

impl Span {
    fn len(&self) -> usize {
        0
    }

    fn join(self, b: Span) -> Span {
        self
    }
}`,
    solution: `struct Span {
    start: usize,
    end: usize,
}

impl Span {
    fn len(&self) -> usize {
        self.end - self.start
    }

    fn join(self, b: Span) -> Span {
        let a = self;
        Span {
            start: a.start.min(b.start),
            end: a.end.max(b.end),
        }
    }
}`,
    tests: `#[test]
fn len_is_end_minus_start() {
    let s = Span { start: 4, end: 9 };
    assert_eq!(s.len(), 5);
}
#[test]
fn join_covers_both() {
    let a = Span { start: 4, end: 6 };
    let b = Span { start: 8, end: 10 };
    let j = a.join(b);
    assert_eq!(j.start, 4);
    assert_eq!(j.end, 10);
}
#[test]
fn join_works_in_either_order() {
    let a = Span { start: 8, end: 10 };
    let b = Span { start: 0, end: 3 };
    let j = a.join(b);
    assert_eq!(j.start, 0);
    assert_eq!(j.end, 10);
}`,
    hints: [
      '`len` only reads, so `&self` is right: `self.end - self.start`.',
      'For `join`, build a new `Span` whose `start` is the smaller start and whose `end` is the larger end.',
    ],
    walkthrough: `\`len\` reads two fields, so it borrows: \`&self\`.

\`join\` takes \`self\` by value, and \`b\` by value too. That's a design choice: after joining, the caller has the combined span and no use for the pieces, so the method consumes them. A parser joins the span of \`1\` and the span of \`2\` into the span of \`1 + 2\` exactly like this.

The struct literal must give every field, and \`a.start.min(b.start)\` (with \`let a = self;\` just to keep the names short) picks the smaller start whichever span comes first.`,
    wrong: [
      {
        code: `struct Span {
    start: usize,
    end: usize,
}

impl Span {
    fn len(&self) -> usize {
        self.end - self.start
    }

    fn join(self, b: Span) -> Span {
        Span {
            start: self.start,
            end: b.end,
        }
    }
}`,
        why: 'This assumes `self` comes first in the source. When the other span is earlier, the result starts too late.',
      },
    ],
  },
};

export const quiz = [
  {
    q: `Does this compile?
\`\`\`
let p = Particle::new(3.0, 4.0);
p.step(1.0); // step(&mut self, ..)
\`\`\``,
    options: [
      { t: 'Yes: `step` borrows `p` and gives it back', why: 'It borrows mutably, and you can only borrow mutably from a `let mut` binding.' },
      { t: 'No: `p` must be declared `let mut` (E0596)', correct: true, why: 'A `&mut self` method needs a mutable borrow of `p`.' },
      { t: 'No: you must write `Particle::step(p, 1.0)`', why: 'Method syntax is fine. The problem is the missing `mut`.' },
    ],
  },
  {
    q: 'A method only reads two fields and returns a number. Which receiver should it take?',
    options: [
      { t: '`self`', why: 'That would move the struct in, so the caller would lose it just to read a number.' },
      { t: '`&mut self`', why: 'It doesn’t need to write, and asking for `&mut` forces callers to have a mutable binding.' },
      { t: '`&self`', correct: true, why: 'A shared borrow is all a reader needs.' },
    ],
  },
  {
    q: '`let q = p.stopped();` where `stopped` takes `self`. Which is true afterwards?',
    options: [
      { t: '`p` and `q` are two separate particles', why: 'Nothing was copied: the one particle moved into `stopped` and came back out as `q`.' },
      { t: '`q` is a reference to `p`', why: '`stopped` returns `Self`, an owned `Particle`, not a reference.' },
      { t: '`p` is still usable, but stopped', why: '`p` was moved into the method, so it can’t be used at all.' },
      { t: '`q` owns the particle and `p` can’t be used again', correct: true, why: 'A `self` method takes ownership. Using `p` afterwards is E0382.' },
    ],
  },
  {
    q: 'How do you call `fn new(vx: f64, vy: f64) -> Self` from `impl Particle`?',
    options: [
      { t: '`Particle::new(3.0, 4.0)`', correct: true, why: 'An associated function without `self` is called on the type with `::`.' },
      { t: '`new Particle(3.0, 4.0)`', why: 'That is JavaScript. Rust has no `new` keyword; `new` is just a conventional name.' },
      { t: '`p.new(3.0, 4.0)`', why: 'There is no `self` parameter, so there is no value to call it on.' },
      { t: '`Self.new(3.0, 4.0)`', why: '`Self` names the type inside the `impl`, and type functions use `::`, not `.`.' },
    ],
  },
  {
    q: 'What does the default Rust layout promise about a struct’s fields?',
    options: [
      { t: 'They are stored in the order you declared them', why: 'Only `#[repr(C)]` promises that. The default lets the compiler reorder fields.' },
      { t: 'They don’t overlap and each is suitably aligned, but the order is up to the compiler', correct: true, why: 'That is about all the default representation guarantees.' },
      { t: 'Each field is stored behind its own pointer', why: 'Fields are stored inline in the struct.' },
    ],
  },
  {
    q: 'In TypeScript, a class bundles fields and methods together. How does Rust split them?',
    options: [
      { t: 'It doesn’t: a struct holds fields and methods together', why: 'Methods go in a separate `impl` block.' },
      { t: 'Fields in the `struct`, methods in an `impl` block, and `self` is an explicit first parameter', correct: true, why: 'And the type of `self` (`&self`, `&mut self`, `self`) says how each method uses the value.' },
      { t: 'Methods are free functions; Rust has no method syntax', why: 'Rust has method syntax: `p.step(1.0)`.' },
    ],
  },
];
