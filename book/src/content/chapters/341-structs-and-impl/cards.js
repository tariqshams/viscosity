// Chapter 341 cards. Keys are stable ids: never rename them.

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
};

const SPAN = `struct Span {
    start: usize,
    end: usize,
}`;

const SOL = `${SPAN}

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
}`;

export const exercises = {
  span: {
    lang: 'rust',
    title: 'Source spans',
    prompt:
      'A `Span` marks a range of bytes in a program’s source code, such as where a token is: `start` is the index of its first byte and `end` is one past its last byte (the same convention as `start..end` slices). Write three functions: `make(start, len)` builds a span `len` bytes long; `width(&s)` says how many bytes it covers; and `join(&a, &b)` returns the smallest span covering both, which is what a parser does to get the span of `1 + 2` from the spans of `1` and `2`. On `usize`, `x.min(y)` is the smaller of two numbers and `x.max(y)` the larger. Each `todo!()` stops the program if reached; replace them.',
    starter: `${SPAN}

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
    solution: SOL,
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
- \`Span { start, end: start + len }\` is a struct expression giving both fields. \`start\` alone is field init shorthand for \`start: start\`; \`end\` is worked out. There is no semicolon, so this expression is the function's return value (the chapter *Functions and expressions* showed why the last expression of a block is its value).
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
        code: `${SPAN}

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
        code: `${SPAN}

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
};

export const quiz = [
  {
    q: `Does this compile?
\`\`\`
let p = Point { x: 1.0 };
\`\`\`
(\`Point\` has fields \`x\` and \`y\`.)`,
    options: [
      { t: 'Yes: `y` is set to 0.0', why: 'Rust never fills in a field for you; there is no default.' },
      { t: 'Yes: `y` is left undefined until it is first written', why: 'Rust has no `undefined`, and a struct value always has every field.' },
      { t: 'No: E0063, missing field `y`', correct: true, why: 'A struct expression must give every field (or take the rest from another value with `..other`).' },
    ],
  },
  {
    q: `\`a\` is \`Point { x: 5.0, y: 6.0 }\`. What is \`b\`?
\`\`\`
let b = Point { y: 0.0, ..a };
\`\`\``,
    options: [
      { t: '`Point { x: 5.0, y: 0.0 }`', correct: true, why: 'Struct update syntax: `y` is given, and every other field (`x`) is taken from `a`.' },
      { t: '`Point { x: 0.0, y: 0.0 }`', why: '`..a` fills the fields you did not write from `a`, so `x` comes from `a`.' },
      { t: '`Point { x: 5.0, y: 6.0 }`', why: 'The written field, `y: 0.0`, wins over `a`’s `y`.' },
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
      { t: 'A: you cannot read two fields in one expression', why: 'Reading fields needs nothing special.' },
      { t: 'C: a struct cannot be assigned to a new name', why: 'It can; the struct simply moves to `q`.' },
      { t: 'B: writing a field needs `let mut p` (E0594)', correct: true, why: 'Mutability belongs to the binding, and `p` was declared without `mut`.' },
    ],
  },
  {
    q: 'How does a Rust struct differ from a TypeScript interface describing the same fields?',
    options: [
      { t: 'It does not: both are erased before the program runs', why: 'Only the interface is erased. The struct decides the size and layout of real values.' },
      { t: 'The struct is the real type: values are built from it by name, with every field, and their shape can never change', correct: true, why: 'A TypeScript object only has to look right to the checker, and could gain fields later.' },
      { t: 'A struct can hold only numbers', why: 'A field can be of any type: strings, other structs, collections.' },
    ],
  },
  {
    q: 'What does the default Rust layout promise about an array `[Particle; 1000]`?',
    options: [
      { t: 'It holds 1000 pointers to particles stored elsewhere', why: 'That is a JavaScript array of objects. Rust stores the structs themselves.' },
      { t: 'The fields are stored in the order they were declared', why: 'Only `#[repr(C)]` promises that; the default lets the compiler reorder fields inside a struct.' },
      { t: 'Element n starts exactly n × size_of::<Particle>() bytes from the start', correct: true, why: 'The structs sit inline, back to back; on this machine that is 32 bytes each, 32,000 in all.' },
    ],
  },
];
