// Chapter 304-b cards. Keys are stable ids: never rename them.

export const prompts = {
  'impl-what': {
    q: 'What does an `impl Particle` block do?',
    a: 'It attaches functions (associated functions, some of them methods) to the type `Particle`.',
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
    a: '`&mut self`. The caller’s variable must be declared `let mut`, or the call is E0596.',
  },
  'recv-own': {
    q: 'What happens to `p` after calling a method that takes `self` by value?',
    a: '`p` is moved into the method and can’t be used again (E0382 if you try).',
  },
  'auto-ref': {
    q: 'What does `p.step(1.0)` really mean, if `step` takes `&mut self`?',
    a: '`Particle::step(&mut p, 1.0)`. Rust adds the borrow for you.',
  },
  'method-sugar': {
    q: 'Why do the borrowing rules apply to method calls, although you never write `&` at the call?',
    a: 'Because a method call is an ordinary call with the borrow added to match the receiver.',
  },
};

export const examples = {
  particle: {
    lang: 'rust',
    title: 'The three receivers',
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
    Particle::step(&mut p, 1.0);
    println!("at {} {}", p.x, p.y);
    let q = p.stopped();
    println!("speed {}", q.speed());
}`,
  },
};

const STACK = `struct Stack {
    slots: [f64; 8],
    top: usize,
}`;

const NEW = `    fn new() -> Self {
        Stack {
            slots: [0.0; 8],
            top: 0,
        }
    }`;

const LEN = `    fn len(&self) -> usize {
        self.top
    }`;

const stackWith = (push, pop, peek) => `${STACK}

impl Stack {
${NEW}

    fn push(&mut self, v: f64) {
${push}
    }

    fn pop(&mut self) -> f64 {
${pop}
    }

    fn peek(&self, d: usize) -> f64 {
${peek}
    }

${LEN}
}`;

const PUSH = `        self.slots[self.top] = v;
        self.top += 1;`;
const POP = `        self.top -= 1;
        self.slots[self.top]`;
const PEEK = `        self.slots[self.top - 1 - d]`;

const SPAN = `struct Span {
    start: usize,
    end: usize,
}`;

export const exercises = {
  stack: {
    lang: 'rust',
    title: 'The VM’s stack as a struct',
    prompt:
      'Finish this fixed-size value stack, adapted from `push`, `pop` and `peek` in the Drip VMs (the TypeScript one keeps exactly this: an array and a count). `top` is the number of values on the stack, so the top value is at `slots[top - 1]`. `peek(0)` is the top value, `peek(1)` the one under it (`d` is the distance down from the top), and peeking removes nothing. The receivers are already written: notice which methods need `&mut self`. Replace each `todo!()`, which stops the program if it is ever reached.',
    starter: stackWith('        todo!()', '        todo!()', '        todo!()'),
    solution: stackWith(PUSH, POP, PEEK),
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
      'Draw the stack after two pushes: slots 0 and 1 are full and `top` is 2. Where does the third value go, and where is the top value now?',
      '`push` writes into the first free slot, `self.slots[self.top]`, then adds one to `top`. `pop` does the reverse in the opposite order: take one off `top` first, then read `self.slots[self.top]`.',
      '`peek(0)` is `self.slots[self.top - 1]`, and each step of `d` goes one slot further down: `self.slots[self.top - 1 - d]`. In `pop`, the read is the last line, with no semicolon, so it is the value returned.',
    ],
    walkthrough: `**How to think about it.** Picture eight boxes in a row and a counter, \`top\`, that says how many are in use. With \`top\` at 2, boxes 0 and 1 hold values and box 2 is the first free one. So \`top\` is *both* "how many values" and "the index of the next free box"; the top value is one below it, at \`top - 1\`. Everything follows from keeping that picture true after each method. The receivers come from what each method does: \`push\` and \`pop\` change the stack, so they take \`&mut self\`; \`peek\` and \`len\` only look, so \`&self\` is enough (and a caller holding only a shared borrow of the stack can still use them).

**The solution, line by line.**

- \`self.slots[self.top] = v;\` writes the new value into the first free box. Writing to a field through \`self\` is allowed because the method took \`&mut self\`.
- \`self.top += 1;\` records that one more box is in use, which also moves "the first free box" along.
- \`self.top -= 1;\` (in \`pop\`) moves \`top\` down first, so it now points at the last value pushed.
- \`self.slots[self.top]\` reads that value. It is the last expression of the method, with no semicolon, so it is what \`pop\` returns (the chapter *Functions and expressions*). The old value stays in the array, but it is at or above \`top\`, so it no longer counts, and the next \`push\` overwrites it.
- \`self.slots[self.top - 1 - d]\` (in \`peek\`) starts at the top value, \`top - 1\`, and steps \`d\` boxes further down. It writes nothing, which is why \`&self\` suffices.

**How the real VMs do it.** The TypeScript VM's \`push\`, \`pop\` and \`peek\` are these three lines with \`this.sp\` in place of \`self.top\`. The Rust VM's versions keep the same receivers, \`fn push(&mut self, value: Value)\`, \`fn pop(&mut self) -> Value\` and \`fn peek(&self, distance: usize) -> Value\`, but store the values in a growable \`Vec\` (a later chapter), so they have no fixed limit of eight.

**Common wrong attempts.**

- \`self.slots[self.top - d]\` in \`peek\` forgets that \`top\` counts values: \`slots[top]\` is the first *free* box, so \`peek(0)\` reads an empty slot.
- Reading before decrementing in \`pop\` (\`let v = self.slots[self.top]; self.top -= 1; v\`) returns the free box above the top value. Order matters.
- Declaring \`fn push(&self, v: f64)\` does not compile: writing \`self.slots[...]\` behind a \`&\` reference is E0594, and rustc suggests \`&mut self\`.

What if you push a ninth value? \`self.slots[8]\` is out of bounds, and Rust's bounds check stops the program with a panic instead of writing past the end of the array, which is where C would quietly corrupt memory.`,
    wrong: [
      {
        code: stackWith(PUSH, POP, '        self.slots[self.top - d]'),
        why: '`top` counts values, so `slots[top]` is the first free slot and `peek(0)` reads an empty one. The top value is at `top - 1`.',
      },
      {
        code: stackWith(PUSH, `        let v = self.slots[self.top];
        self.top -= 1;
        v`, PEEK),
        why: 'This reads before it moves `top` down, so it returns the free slot above the top value. Move `top` down first, then read.',
      },
    ],
  },
  spanMethods: {
    lang: 'rust',
    optional: true,
    title: 'Spans as methods',
    prompt:
      'Last chapter’s span functions, now as methods. Write `width(&self)`, the number of bytes the span covers, and `join(self, b: Span)`, which consumes both spans and returns the smallest span covering both. Consuming is a deliberate choice here: after joining, the caller has the combined span and no use for the pieces.',
    starter: `${SPAN}

impl Span {
    fn width(&self) -> usize {
        0
    }

    fn join(self, b: Span) -> Span {
        self
    }
}`,
    solution: `${SPAN}

impl Span {
    fn width(&self) -> usize {
        self.end - self.start
    }

    fn join(self, b: Span) -> Span {
        let s = self.start.min(b.start);
        let e = self.end.max(b.end);
        Span { start: s, end: e }
    }
}`,
    tests: `#[test]
fn width_is_end_minus_start() {
    let s = Span { start: 4, end: 9 };
    assert_eq!(s.width(), 5);
}
#[test]
fn join_covers_both() {
    let a = Span { start: 4, end: 6 };
    let b = Span { start: 8, end: 10 };
    let j = a.join(b);
    assert_eq!((j.start, j.end), (4, 10));
}
#[test]
fn join_works_in_either_order() {
    let a = Span { start: 8, end: 10 };
    let b = Span { start: 0, end: 3 };
    let j = a.join(b);
    assert_eq!((j.start, j.end), (0, 10));
}`,
    hints: [
      '`width` only reads, so `&self` is right: `self.end - self.start`.',
      'For `join`, build a new `Span` whose `start` is the smaller of the two starts and whose `end` is the larger of the two ends, with `min` and `max`.',
    ],
    walkthrough: `**How to think about it.** These are last chapter's \`width(&s)\` and \`join(&a, &b)\`, moved into an \`impl\` block, so the work is the same and only the receivers change.

**The solution, line by line.**

- \`fn width(&self) -> usize {\` borrows the span to read it; \`s.width()\` means \`Span::width(&s)\`.
- \`self.end - self.start\` is the number of bytes covered.
- \`fn join(self, b: Span) -> Span {\` takes \`self\` by value, and \`b\` too: after \`let j = a.join(b);\` neither \`a\` nor \`b\` can be used, which is fine, since the caller wanted the whole.
- \`start: self.start.min(b.start),\` and \`end: self.end.max(b.end),\` cover both spans, whichever comes first in the source.

**Common wrong attempt.** \`Span { start: self.start, end: b.end }\` assumes \`self\` is the earlier span; the third test, where it is the later one, fails.`,
    wrong: [
      {
        code: `${SPAN}

impl Span {
    fn width(&self) -> usize {
        self.end - self.start
    }

    fn join(self, b: Span) -> Span {
        Span {
            start: self.start,
            end: b.end,
        }
    }
}`,
        why: 'This assumes `self` comes first in the source. When `b` is earlier, the result starts too late.',
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
      { t: 'No: you must write `Particle::step(p, 1.0)`', why: 'Method syntax is fine; the problem is the missing `mut`. (And the full form would be `Particle::step(&mut p, 1.0)`.)' },
    ],
  },
  {
    q: 'A method only reads two fields and returns a number. Which receiver should it take?',
    options: [
      { t: '`self`', why: 'That would move the struct in, so the caller would lose it just to read a number.' },
      { t: '`&mut self`', why: 'It doesn’t need to write, and asking for `&mut` forces every caller to have a mutable binding.' },
      { t: '`&self`', correct: true, why: 'A shared borrow is all a reader needs.' },
    ],
  },
  {
    q: '`let q = p.stopped();` where `stopped` takes `self`. Which is true afterwards?',
    options: [
      { t: '`p` and `q` are two separate particles', why: 'Nothing was copied: the one particle moved into `stopped` and came back out as `q`.' },
      { t: '`q` is a reference to `p`', why: '`stopped` returns `Self`, an owned `Particle`, not a reference.' },
      { t: '`p` is still usable, but stopped', why: '`p` was moved into the method, so it can’t be used at all.' },
      { t: '`q` owns the particle and `p` can’t be used again', correct: true, why: 'A `self` method takes ownership. Using `p` afterwards is E0382, with a note naming the method.' },
    ],
  },
  {
    q: 'How do you call `fn origin() -> Self` from `impl Point`?',
    options: [
      { t: '`Point::origin()`', correct: true, why: 'An associated function without `self` is called on the type with `::`.' },
      { t: '`p.origin()`', why: 'There is no `self` parameter, so there is no value to call it on: rustc says it is an associated function, not a method (E0599).' },
      { t: '`new Point()`', why: 'That is TypeScript. Rust has no `new` keyword and no constructors.' },
    ],
  },
  {
    q: 'Which is the same call as `v.push(7)`, where `push` takes `&mut self` and `v` is a `Stack`?',
    options: [
      { t: '`Stack::push(v, 7)`', why: 'That would move `v` into the call, which is what a `self` method does.' },
      { t: '`Stack::push(&v, 7)`', why: 'A shared borrow cannot be used to change the stack.' },
      { t: '`Stack::push(&mut v, 7)`', correct: true, why: 'Rust adds `&mut` to match the receiver, so `v` must be declared `let mut`.' },
    ],
  },
];
