// Chapter 189 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.
// Merged from old chapters 121, 121.

export const prompts = {
  'struct-what': {
    q: 'What is a Rust `struct`, compared with a TypeScript interface?',
    a: 'A named record type with typed fields. Unlike an interface, it is the real type: every value is built from it, and its shape never changes.',
  },
  'struct-all-fields': {
    q: 'When you write `Particle { ... }`, which fields must you give?',
    a: 'Every one of them; leaving one out is error E0063, missing field.',
  },
  'struct-mut': {
    q: 'Can you make just one field of a struct mutable?',
    a: 'No. Mutability belongs to the binding, so `let mut p` makes all of `p` changeable.',
  },
  'field-shorthand': {
    q: 'What does `Point { x, y }` mean when `x` and `y` are variables?',
    a: 'Field init shorthand: `x` means `x: x`, and `y` means `y: y`.',
  },
  'struct-move': {
    q: 'After `let q = p;` where `p` is a struct (with no `derive`), can you still use `p`?',
    a: 'No. The struct moved to `q`, like a `String` does; using `p` is error E0382.',
  },
  'tuple-struct': {
    q: 'What is `struct Meters(f64);`, and how do you read its number?',
    a: 'A tuple struct: fields with positions but no names. Read it with `m.0`.',
  },
  'struct-pass': {
    q: 'A function only needs to read a struct. How should it take it, and why?',
    a: 'By shared borrow, `p: &Particle`, so the caller keeps the struct and can use it afterwards.',
  },
  'struct-vs-interface': {
    q: 'What happens to a TypeScript interface when the program runs, and to a Rust struct?',
    a: 'The interface is erased; values are ordinary objects. The struct is the real type, with a fixed size and field places.',
  },
  'array-inline': {
    q: 'In an array of `Particle` structs, where are the fields stored?',
    a: 'Inline, one struct after another: element n starts n × the struct’s size into the array, with no pointers.',
  },
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
    title: 'A particle struct',
    code: `#[derive(Debug)]
struct Particle {
    x: f64,
    y: f64,
    vx: f64,
    vy: f64,
}

fn speed(p: &Particle) -> f64 {
    let v2 = p.vx * p.vx + p.vy * p.vy;
    v2.sqrt()
}

fn main() {
    let mut p = Particle {
        x: 0.0,
        y: 0.0,
        vx: 3.0,
        vy: 4.0,
    };
    println!("{:?}", p);
    println!("speed {}", speed(&p));
    p.x += p.vx;
    p.y += p.vy;
    println!("at {} {}", p.x, p.y);
    let q = Particle { x: 10.0, ..p };
    println!("{:?}", q);
}`,
  },
  'particle-o342': {
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

export const exercises = {
  span: {
    lang: 'rust',
    title: 'Source spans',
    prompt: 'A `Span` marks a range of bytes in a program’s source code, such as where a token is: `start` is the index of its first byte and `end` is one past its last byte (the same convention as `start..end` slices). Write three functions: `make(start, len)` builds a span `len` bytes long; `width(&s)` says how many bytes it covers; and `join(&a, &b)` returns the smallest span covering both, which is what a parser does to get the span of `1 + 2` from the spans of `1` and `2`. On `usize`, `x.min(y)` is the smaller of two numbers and `x.max(y)` the larger. Each `todo!()` stops the program if reached; replace them.',
    starter: `struct Span {
    start: usize,
    end: usize,
}

fn make(start: usize, len: usize)
    -> Span {
    todo!()
}

fn width(s: &Span) -> usize {
    todo!()
}

fn join(a: &Span, b: &Span) -> Span {
    todo!()
}`,
    solution: `struct Span {
    start: usize,
    end: usize,
}

fn make(start: usize, len: usize)
    -> Span {
    Span { start, end: start + len }
}

fn width(s: &Span) -> usize {
    s.end - s.start
}

fn join(a: &Span, b: &Span) -> Span {
    Span {
        start: a.start.min(b.start),
        end: a.end.max(b.end),
    }
}`,
    tests: `#[test]
fn make_sets_start_and_end() {
    let s = make(4, 3);
    assert_eq!(s.start, 4);
    assert_eq!(s.end, 7);
}
#[test]
fn width_is_end_minus_start() {
    assert_eq!(width(&make(4, 3)), 3);
    assert_eq!(width(&make(9, 0)), 0);
}
#[test]
fn join_covers_both() {
    let j = join(&make(4, 2), &make(8, 2));
    assert_eq!(j.start, 4);
    assert_eq!(j.end, 10);
}
#[test]
fn join_works_in_either_order() {
    let j = join(&make(8, 2), &make(0, 3));
    assert_eq!(j.start, 0);
    assert_eq!(j.end, 10);
}
#[test]
fn join_keeps_its_arguments() {
    let a = make(1, 1);
    let b = make(5, 1);
    let j = join(&a, &b);
    assert_eq!(width(&a) + width(&j), 6);
}`,
    hints: [
      'Work one out by hand: a span that starts at byte 4 and is 3 bytes long covers bytes 4, 5 and 6. What are `start` and `end`?',
      '`make` builds a `Span` with both fields: `start` comes straight from the parameter (field init shorthand lets you write `start` alone), and `end` is `start + len`. `width` is the difference of the two fields.',
      'For `join`, the result starts at the smaller of the two starts and ends at the larger of the two ends: `Span { start: a.start.min(b.start), end: a.end.max(b.end) }`. Each body is one expression with no semicolon, so it is the value returned.',
    ],
    walkthrough: `**How to think about it.** Draw the bytes of a short source line, numbered from 0, and shade a span that starts at 4 and is 3 bytes long: bytes 4, 5 and 6 are shaded, and byte 7 is the first one after it. With the convention that \`end\` is one past the last byte, that span is \`Span { start: 4, end: 7 }\`. Every function falls out of drawings like that one: the width is how far apart the two fields are, and joining two shaded stretches means shading from the leftmost start to the rightmost end. None of the functions needs to own a span it is given, so they take \`&Span\`, and the caller keeps its spans (the last test checks exactly that).

**The solution, line by line.**

- \`fn make(start: usize, len: usize) -> Span {\` takes two whole numbers and returns a brand-new \`Span\`, which the caller will own.
- \`Span { start, end: start + len }\` is a struct expression giving both fields. \`start\` alone is field init shorthand for \`start: start\`; \`end\` is worked out. There is no semicolon, so this expression is the function's return value (the chapter *Blocks, if and the tail expression* showed why the last expression of a block is its value).
- \`fn width(s: &Span) -> usize {\` borrows the span: it only reads two fields.
- \`s.end - s.start\` is the number of bytes covered. The dot reads a field through the borrow without any extra symbol. For \`4..7\` that is \`3\`; for the empty span \`9..9\` it is \`0\`.
- \`fn join(a: &Span, b: &Span) -> Span {\` borrows both inputs and builds a new span.
- \`start: a.start.min(b.start),\` picks whichever start is smaller, so the order of the arguments does not matter.
- \`end: a.end.max(b.end),\` picks whichever end is larger.
- The closing \`}\` of the struct expression ends the value, which is returned.

**Common wrong attempts.**

- \`Span { start, end: len }\` stores a length where a position belongs: \`make(4, 3)\` would end at 3, before it starts, and \`width\` would then try \`3 - 4\` on a \`usize\`, which stops the program with "attempt to subtract with overflow" (unsigned numbers cannot go below zero).
- \`Span { start: a.start, end: b.end }\` assumes \`a\` comes first in the source; when \`b\` is earlier, the result starts too late and may even end before it starts.
- \`fn join(a: Span, b: Span)\` (without the \`&\`) compiles on its own, but then calling it moves both spans into the function, and the caller can no longer use them: the last test fails to compile with E0382.`,
    wrong: [
      {
        code: `struct Span {
    start: usize,
    end: usize,
}

fn make(start: usize, len: usize)
    -> Span {
    Span { start, end: start + len }
}

fn width(s: &Span) -> usize {
    s.end - s.start
}

fn join(a: &Span, b: &Span) -> Span {
    Span {
        start: a.start,
        end: b.end,
    }
}`,
        why: 'This assumes `a` comes first in the source. When `b` is earlier, the joined span starts too late.',
      },
      {
        code: `struct Span {
    start: usize,
    end: usize,
}

fn make(start: usize, len: usize)
    -> Span {
    Span { start, end: len }
}

fn width(s: &Span) -> usize {
    s.end - s.start
}

fn join(a: &Span, b: &Span) -> Span {
    Span {
        start: a.start.min(b.start),
        end: a.end.max(b.end),
    }
}`,
        why: '`end: len` stores the length where a position belongs: `make(4, 3)` ends at 3, and `width` underflows.',
      },
    ],
  },
  stack: {
    lang: 'rust',
    title: 'The VM’s stack as a struct',
    prompt: 'Finish this fixed-size value stack, adapted from `push`, `pop` and `peek` in the Drip VMs (the TypeScript one keeps exactly this: an array and a count). `top` is the number of values on the stack, so the top value is at `slots[top - 1]`. `peek(0)` is the top value, `peek(1)` the one under it (`d` is the distance down from the top), and peeking removes nothing. The receivers are already written: notice which methods need `&mut self`. Replace each `todo!()`, which stops the program if it is ever reached.',
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
      'Draw the stack after two pushes: slots 0 and 1 are full and `top` is 2. Where does the third value go, and where is the top value now?',
      '`push` writes into the first free slot, `self.slots[self.top]`, then adds one to `top`. `pop` does the reverse in the opposite order: take one off `top` first, then read `self.slots[self.top]`.',
      '`peek(0)` is `self.slots[self.top - 1]`, and each step of `d` goes one slot further down: `self.slots[self.top - 1 - d]`. In `pop`, the read is the last line, with no semicolon, so it is the value returned.',
    ],
    walkthrough: `**How to think about it.** Picture eight boxes in a row and a counter, \`top\`, that says how many are in use. With \`top\` at 2, boxes 0 and 1 hold values and box 2 is the first free one. So \`top\` is *both* "how many values" and "the index of the next free box"; the top value is one below it, at \`top - 1\`. Everything follows from keeping that picture true after each method. The receivers come from what each method does: \`push\` and \`pop\` change the stack, so they take \`&mut self\`; \`peek\` and \`len\` only look, so \`&self\` is enough (and a caller holding only a shared borrow of the stack can still use them).

**The solution, line by line.**

- \`self.slots[self.top] = v;\` writes the new value into the first free box. Writing to a field through \`self\` is allowed because the method took \`&mut self\`.
- \`self.top += 1;\` records that one more box is in use, which also moves "the first free box" along.
- \`self.top -= 1;\` (in \`pop\`) moves \`top\` down first, so it now points at the last value pushed.
- \`self.slots[self.top]\` reads that value. It is the last expression of the method, with no semicolon, so it is what \`pop\` returns (the chapter *Blocks, if and the tail expression*). The old value stays in the array, but it is at or above \`top\`, so it no longer counts, and the next \`push\` overwrites it.
- \`self.slots[self.top - 1 - d]\` (in \`peek\`) starts at the top value, \`top - 1\`, and steps \`d\` boxes further down. It writes nothing, which is why \`&self\` suffices.

**How the real VMs do it.** The TypeScript VM's \`push\`, \`pop\` and \`peek\` are these three lines with \`this.sp\` in place of \`self.top\`. The Rust VM's versions keep the same receivers, \`fn push(&mut self, value: Value)\`, \`fn pop(&mut self) -> Value\` and \`fn peek(&self, distance: usize) -> Value\`, but store the values in a growable \`Vec\` (a later chapter), so they have no fixed limit of eight.

**Common wrong attempts.**

- \`self.slots[self.top - d]\` in \`peek\` forgets that \`top\` counts values: \`slots[top]\` is the first *free* box, so \`peek(0)\` reads an empty slot.
- Reading before decrementing in \`pop\` (\`let v = self.slots[self.top]; self.top -= 1; v\`) returns the free box above the top value. Order matters.
- Declaring \`fn push(&self, v: f64)\` does not compile: writing \`self.slots[...]\` behind a \`&\` reference is E0594, and rustc suggests \`&mut self\`.

What if you push a ninth value? \`self.slots[8]\` is out of bounds, and Rust's bounds check stops the program with a panic instead of writing past the end of the array, which is where C would quietly corrupt memory.`,
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
        why: '`top` counts values, so `slots[top]` is the first free slot and `peek(0)` reads an empty one. The top value is at `top - 1`.',
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
        why: 'This reads before it moves `top` down, so it returns the free slot above the top value. Move `top` down first, then read.',
      },
    ],
  },
  spanMethods: {
    lang: 'rust',
    optional: true,
    title: 'Spans as methods',
    prompt: 'Last chapter’s span functions, now as methods. Write `width(&self)`, the number of bytes the span covers, and `join(self, b: Span)`, which consumes both spans and returns the smallest span covering both. Consuming is a deliberate choice here: after joining, the caller has the combined span and no use for the pieces.',
    starter: `struct Span {
    start: usize,
    end: usize,
}

impl Span {
    fn width(&self) -> usize {
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
        code: `struct Span {
    start: usize,
    end: usize,
}

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
let p = Point { x: 1.0 };
\`\`\`
(\`Point\` has fields \`x\` and \`y\`.)`,
    options: [
      {
        t: 'Yes: `y` is set to 0.0',
        why: 'Rust never fills in a field for you; there is no default.',
      },
      {
        t: 'Yes: `y` is left undefined until it is first written',
        why: 'Rust has no `undefined`, and a struct value always has every field.',
      },
      {
        t: 'No: E0063, missing field `y`',
        correct: true,
        why: 'A struct expression must give every field (or take the rest from another value with `..other`).',
      },
    ],
  },
  {
    q: `\`a\` is \`Point { x: 5.0, y: 6.0 }\`. What is \`b\`?
\`\`\`
let b = Point { y: 0.0, ..a };
\`\`\``,
    options: [
      {
        t: '`Point { x: 5.0, y: 0.0 }`',
        correct: true,
        why: 'Struct update syntax: `y` is given, and every other field (`x`) is taken from `a`.',
      },
      {
        t: '`Point { x: 0.0, y: 0.0 }`',
        why: '`..a` fills the fields you did not write from `a`, so `x` comes from `a`.',
      },
      {
        t: '`Point { x: 5.0, y: 6.0 }`',
        why: 'The written field, `y: 0.0`, wins over `a`’s `y`.',
      },
    ],
  },
  {
    q: `Which line is rejected?
\`\`\`
let p = Point { x: 1.0, y: 2.0 };
let n = p.x + p.y;   // A
p.x = 5.0;           // B
let q = p;           // C
\`\`\``,
    options: [
      {
        t: 'A: you cannot read two fields in one expression',
        why: 'Reading fields needs nothing special.',
      },
      {
        t: 'C: a struct cannot be assigned to a new name',
        why: 'It can; the struct simply moves to `q`.',
      },
      {
        t: 'B: writing a field needs `let mut p` (E0594)',
        correct: true,
        why: 'Mutability belongs to the binding, and `p` was declared without `mut`.',
      },
    ],
  },
  {
    q: 'How does a Rust struct differ from a TypeScript interface describing the same fields?',
    options: [
      {
        t: 'It does not: both are erased before the program runs',
        why: 'Only the interface is erased. The struct decides the size and layout of real values.',
      },
      {
        t: 'The struct is the real type: values are built from it by name, with every field, and their shape can never change',
        correct: true,
        why: 'A TypeScript object only has to look right to the checker, and could gain fields later.',
      },
      {
        t: 'A struct can hold only numbers',
        why: 'A field can be of any type: strings, other structs, collections.',
      },
    ],
  },
  {
    q: 'What does the default Rust layout promise about an array `[Particle; 1000]`?',
    options: [
      {
        t: 'It holds 1000 pointers to particles stored elsewhere',
        why: 'That is a JavaScript array of objects. Rust stores the structs themselves.',
      },
      {
        t: 'The fields are stored in the order they were declared',
        why: 'Only `#[repr(C)]` promises that; the default lets the compiler reorder fields inside a struct.',
      },
      {
        t: 'Element n starts exactly n × size_of::<Particle>() bytes from the start',
        correct: true,
        why: 'The structs sit inline, back to back; on this machine that is 32 bytes each, 32,000 in all.',
      },
    ],
  },
  {
    q: `Does this compile?
\`\`\`
let p = Particle::new(3.0, 4.0);
p.step(1.0); // step(&mut self, ..)
\`\`\``,
    options: [
      {
        t: 'Yes: `step` borrows `p` and gives it back',
        why: 'It borrows mutably, and you can only borrow mutably from a `let mut` binding.',
      },
      {
        t: 'No: `p` must be declared `let mut` (E0596)',
        correct: true,
        why: 'A `&mut self` method needs a mutable borrow of `p`.',
      },
      {
        t: 'No: you must write `Particle::step(p, 1.0)`',
        why: 'Method syntax is fine; the problem is the missing `mut`. (And the full form would be `Particle::step(&mut p, 1.0)`.)',
      },
    ],
  },
  {
    q: 'A method only reads two fields and returns a number. Which receiver should it take?',
    options: [
      {
        t: '`self`',
        why: 'That would move the struct in, so the caller would lose it just to read a number.',
      },
      {
        t: '`&mut self`',
        why: 'It doesn’t need to write, and asking for `&mut` forces every caller to have a mutable binding.',
      },
      {
        t: '`&self`',
        correct: true,
        why: 'A shared borrow is all a reader needs.',
      },
    ],
  },
  {
    q: '`let q = p.stopped();` where `stopped` takes `self`. Which is true afterwards?',
    options: [
      {
        t: '`p` and `q` are two separate particles',
        why: 'Nothing was copied: the one particle moved into `stopped` and came back out as `q`.',
      },
      {
        t: '`q` is a reference to `p`',
        why: '`stopped` returns `Self`, an owned `Particle`, not a reference.',
      },
      {
        t: '`p` is still usable, but stopped',
        why: '`p` was moved into the method, so it can’t be used at all.',
      },
      {
        t: '`q` owns the particle and `p` can’t be used again',
        correct: true,
        why: 'A `self` method takes ownership. Using `p` afterwards is E0382, with a note naming the method.',
      },
    ],
  },
  {
    q: 'How do you call `fn origin() -> Self` from `impl Point`?',
    options: [
      {
        t: '`Point::origin()`',
        correct: true,
        why: 'An associated function without `self` is called on the type with `::`.',
      },
      {
        t: '`p.origin()`',
        why: 'There is no `self` parameter, so there is no value to call it on: rustc says it is an associated function, not a method (E0599).',
      },
      {
        t: '`new Point()`',
        why: 'That is TypeScript. Rust has no `new` keyword and no constructors.',
      },
    ],
  },
  {
    q: 'Which is the same call as `v.push(7)`, where `push` takes `&mut self` and `v` is a `Stack`?',
    options: [
      {
        t: '`Stack::push(v, 7)`',
        why: 'That would move `v` into the call, which is what a `self` method does.',
      },
      {
        t: '`Stack::push(&v, 7)`',
        why: 'A shared borrow cannot be used to change the stack.',
      },
      {
        t: '`Stack::push(&mut v, 7)`',
        correct: true,
        why: 'Rust adds `&mut` to match the receiver, so `v` must be declared `let mut`.',
      },
    ],
  },
];
