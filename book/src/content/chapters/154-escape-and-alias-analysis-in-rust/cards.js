// Chapter 154 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'esr-operand': {
    q: 'Why does `describe_use` take the value `v` as well as the use?',
    a: 'One instruction kind means different things for different operands: `e.k = 1` modifies `e`, while `box.k = e` stores `e` somewhere else.',
  },
  'esr-index-set': {
    q: 'Name the three messages an `index.set` can give for an element `e`, by operand.',
    a: '`e[0] = 5`: “written with an index store”. `t[e] = 1`: “used as an index”. `t[0] = e`: “stored into an array”.',
  },
  'esr-allowed': {
    q: 'Which uses of an element are allowed?',
    a: 'Reading or writing one of the collection’s fields, as the object of the `field.get` or `field.set`. Everything else is an escape.',
  },
  'esr-strip': {
    q: 'Why does `element_uses` strip “ at line N” from the reason?',
    a: 'The message already starts “line N: an element is ...”, so the same line would be said twice.',
  },
  'esr-follow': {
    q: 'What happens when the whole array is passed to a known function?',
    a: 'It is followed: the parameter joins the collection’s references, and the uses inside the function are checked like any others.',
  },
  'esr-element-call': {
    q: 'Is an *element* followed into a known function, like the array is?',
    a: 'No. `f(ps[0])` is an escape: “an element is passed to a function call”.',
  },
  'esr-phi': {
    q: 'Why is an element flowing into a phi an escape?',
    a: 'A phi merges it with other values, so later code may see either. The analysis doesn’t track where a merged value came from, so it refuses.',
  },
};

export const examples = {};

export const exercises = {
  reasons: {
    lang: 'rust',
    title: 'Operand-aware reasons',
    prompt: 'Write `describe` and `element_msg`, small versions of `describe_use` and of the message step in `element_uses`. `describe` must look at *which operand* `v` is before it looks at the kind of instruction: as the object of a `FieldSet` it is “modified directly (its .k is assigned)”; as the array of an `IndexSet` it is “written with an index store”; as the index of an `IndexSet` or `IndexGet` it is “used as an index”. Only then come the general cases: see the tests for the exact texts. `element_msg(get, why)` removes a trailing `" at line {get}"` or `" near line {get}"` from `why` (that line only) and returns `"line {get}: an element is {why}"`.',
    starter: `// A few VIR instructions.
pub enum Op {
    // args: [object, value]
    FieldSet(&'static str),
    // args: [array, index, value]
    IndexSet,
    // args: [array, index]
    IndexGet,
    // args: [callee, arguments...]
    Call,
    // stores args[0] in a variable
    Store(&'static str),
    // args: the merged values
    Phi,
}

pub struct Inst {
    pub op: Op,
    pub args: Vec<u32>,
    // 0 when unknown
    pub line: u32,
}

pub fn describe(i: &Inst, v: u32)
    -> String
{
    todo!()
}

pub fn element_msg(
    get: u32,
    why: &str,
) -> String {
    todo!()
}`,
    solution: `// A few VIR instructions.
pub enum Op {
    // args: [object, value]
    FieldSet(&'static str),
    // args: [array, index, value]
    IndexSet,
    // args: [array, index]
    IndexGet,
    // args: [callee, arguments...]
    Call,
    // stores args[0] in a variable
    Store(&'static str),
    // args: the merged values
    Phi,
}

pub struct Inst {
    pub op: Op,
    pub args: Vec<u32>,
    // 0 when unknown
    pub line: u32,
}

// Why use i of value v is an escape.
pub fn describe(i: &Inst, v: u32)
    -> String
{
    // Which operand is v? That first.
    let k = i.args.iter()
        .position(|&x| x == v);
    let w: String = match (&i.op, k) {
        (Op::FieldSet(f), Some(0)) => {
            format!("modified directly \\
                (its .{f} is assigned)")
        }
        (Op::IndexSet, Some(0)) => {
            "written with an index \\
             store".into()
        }
        (Op::IndexSet, Some(1))
        | (Op::IndexGet, Some(1)) => {
            "used as an index".into()
        }
        (Op::Call, _) => "passed to a \\
            function call".into(),
        (Op::Store(n), _) => format!(
            "stored in another \\
             variable ({n})"),
        (Op::FieldSet(_), _) => {
            "stored into an object \\
             property".into()
        }
        (Op::IndexSet, _) => "stored \\
            into an array".into(),
        (Op::IndexGet, _) => {
            "used by index.get".into()
        }
        (Op::Phi, _) => {
            return phi(i.line);
        }
    };
    format!("{w} at line {}", i.line)
}

// A phi has no line of its own: 0, or
// the latest line of what it merges.
fn phi(line: u32) -> String {
    let m = "merged with other values \\
        (a variable reassigned along \\
        different paths)";
    if line == 0 {
        m.to_string()
    } else {
        format!("{m} near line {line}")
    }
}

// The bailout for an element read at
// line get: don't repeat that line.
pub fn element_msg(
    get: u32,
    why: &str,
) -> String {
    let ps =
        [" at line ", " near line "];
    let mut w = why;
    for p in ps {
        let s = format!("{p}{get}");
        if let Some(x) =
            w.strip_suffix(&s)
        {
            w = x;
            break;
        }
    }
    let a = "an element is";
    format!("line {get}: {a} {w}")
}`,
    tests: `fn at(op: Op, args: &[u32]) -> Inst {
    let args = args.to_vec();
    Inst { op, args, line: 5 }
}

// Describe use i of value 1.
fn d(op: Op, args: &[u32]) -> String {
    describe(&at(op, args), 1)
}

#[test]
fn which_operand_of_a_field_set() {
    let k = || Op::FieldSet("k");
    assert_eq!(d(k(), &[1, 2]),
        "modified directly (its .k \\
         is assigned) at line 5");
    assert_eq!(d(k(), &[2, 1]),
        "stored into an object \\
         property at line 5");
}

#[test]
fn which_operand_of_an_index_set() {
    let s = |a: &[u32]| {
        d(Op::IndexSet, a)
    };
    assert_eq!(s(&[1, 2, 3]),
        "written with an index store \\
         at line 5");
    assert_eq!(s(&[2, 1, 3]),
        "used as an index at line 5");
    assert_eq!(s(&[2, 3, 1]),
        "stored into an array at \\
         line 5");
}

#[test]
fn stores_and_calls() {
    assert_eq!(d(Op::Store("e"), &[1]),
        "stored in another variable \\
         (e) at line 5");
    assert_eq!(d(Op::Call, &[7, 1]),
        "passed to a function call at \\
         line 5");
}

#[test]
fn phis_say_near() {
    let mut p = at(Op::Phi, &[1, 2]);
    let m = "merged with other values \\
        (a variable reassigned along \\
        different paths)";
    assert_eq!(describe(&p, 1),
        format!("{m} near line 5"));
    p.line = 0;
    assert_eq!(describe(&p, 1), m);
}

#[test]
fn the_same_line_is_said_once() {
    let w = "used as an index at \\
        line 8";
    assert_eq!(element_msg(8, w),
        "line 8: an element is used \\
         as an index");
    let n = "merged near line 8";
    assert_eq!(element_msg(8, n),
        "line 8: an element is merged");
}

#[test]
fn another_line_is_kept() {
    let w = "merged near line 5";
    assert_eq!(element_msg(4, w),
        "line 4: an element is merged \\
         near line 5");
    let x = "used as an index at \\
        line 9";
    let want = format!(
        "line 8: an element is {x}");
    assert_eq!(element_msg(8, x), want);
}`,
    hints: [
      'Find the operand first: `let k = i.args.iter().position(|&x| x == v);`. Then `match (&i.op, k)`, with the specific arms such as `(Op::FieldSet(f), Some(0))` first. A `match` tries arms in order, so a general `(Op::FieldSet(_), _)` below only sees the other operands.',
      'A string literal can continue on the next line with a backslash at the end: `"stored into an object \\` then `property {at}"` on the next line. Leading spaces on the next line are skipped.',
      'For `element_msg`, try both suffixes, `" at line {get}"` and `" near line {get}"`, with `strip_suffix`, stopping at the first that matches, and keep `why` unchanged if neither does. A phi’s reason has no `at line` part: build it in its own function and `return` it early from the `match`.',
    ],
    walkthrough: `**How to think about it.** Two questions, in a fixed order. First: is \`v\` in a position that changes the meaning? (The object of a \`FieldSet\`, the array of an \`IndexSet\`, or the index of either kind of index instruction.) If so, answer with the operand-specific sentence. Only if not, describe the instruction in general. Doing the general description first is the classic mistake, because \`box.k = e\` and \`e.k = 1\` are both \`FieldSet\`, yet the first gives the element a second home (an alias) while the second changes the element itself. Then \`element_msg\` is plain string work: remove the element's own line from the end of the reason, if it is there, and put it at the front. This is \`describe_use\` and the bailout step of \`element_uses\`, from \`engine/rust/crates/core/src/analysis.rs\`, cut down to six instruction kinds.

**The solution, line by line (describe).**

- \`let k = i.args.iter().position(|&x| x == v);\` finds which operand \`v\` is: \`Some(0)\` for the first, \`Some(1)\` for the second, \`None\` if it is not there at all.
- \`let w: String = match (&i.op, k) {\` matches the kind and the position together, as a pair, so one \`match\` can do what the real code does with two. Arms are tried in order, which is what makes the next three lines "first".
- \`(Op::FieldSet(f), Some(0)) => format!("modified directly (its .{f} is assigned)")\`: \`v\` is the object whose field is set.
- \`(Op::IndexSet, Some(0)) => "written with an index store".into()\`: \`v\` is the array being stored into.
- \`(Op::IndexSet, Some(1)) | (Op::IndexGet, Some(1)) => "used as an index".into()\`: \`v\` is the index, in either kind; \`|\` joins two patterns in one arm.
- \`(Op::Call, _)\`, \`(Op::Store(n), _)\`, \`(Op::FieldSet(_), _)\`, \`(Op::IndexSet, _)\` and \`(Op::IndexGet, _)\` are the general sentences. Because the specific arms came first, \`(Op::FieldSet(_), _)\` here only ever sees \`v\` as the *value* being stored: "stored into an object property".
- \`(Op::Phi, _) => { return phi(i.line); }\` leaves early, because a phi's sentence has its own ending ("near line N", or nothing when the line is 0).
- \`format!("{w} at line {}", i.line)\` adds the line to every other sentence.

**The solution, line by line (element_msg).**

- \`let ps = [" at line ", " near line "];\` lists the two endings a reason can have.
- \`let mut w = why;\` starts from the whole reason; \`w\` is a \`&str\`, so shortening it copies nothing.
- \`for p in ps { let s = format!("{p}{get}"); if let Some(x) = w.strip_suffix(&s) { w = x; break; } }\` builds each ending with *this element's* line and, if the reason ends with it, keeps the text before it and stops. \`strip_suffix\` returns \`None\` when the text does not end that way, so a different line number is left alone.
- \`format!("line {get}: {a} {w}")\` (given) puts the element's line at the front: "line 8: an element is used as an index".

**Common wrong attempts.**

- Matching the kind before the operand. Then \`box.k = e\` and \`e.k = 1\` get the same reason, which is wrong for one of them.
- Stripping any trailing "at line N", whatever N is. An element read on line 4 that flows into a phi made on line 5 gives "line 4: an element is merged ... near line 5"; that second line carries information and must stay. Only an exact repeat of the element's own line goes. (The reference does this with a regular expression, \`/ (?:at|near) line N$/\`; the port with two \`strip_suffix\` calls, which match the same strings.)
- Always writing "near line {n}" for a phi. A phi with no operand lines has line 0, and then the message must simply end.`,
    wrong: [
      {
        code: `// A few VIR instructions.
pub enum Op {
    // args: [object, value]
    FieldSet(&'static str),
    // args: [array, index, value]
    IndexSet,
    // args: [array, index]
    IndexGet,
    // args: [callee, arguments...]
    Call,
    // stores args[0] in a variable
    Store(&'static str),
    // args: the merged values
    Phi,
}

pub struct Inst {
    pub op: Op,
    pub args: Vec<u32>,
    // 0 when unknown
    pub line: u32,
}

// Why use i of value v is an escape.
pub fn describe(i: &Inst, v: u32)
    -> String
{
    // Which operand is v? That first.
    let k = i.args.iter()
        .position(|&x| x == v);
    let w: String = match (&i.op, k) {
        (Op::IndexSet, Some(0)) => {
            "written with an index \\
             store".into()
        }
        (Op::IndexSet, Some(1))
        | (Op::IndexGet, Some(1)) => {
            "used as an index".into()
        }
        (Op::Call, _) => "passed to a \\
            function call".into(),
        (Op::Store(n), _) => format!(
            "stored in another \\
             variable ({n})"),
        (Op::FieldSet(_), _) => {
            "stored into an object \\
             property".into()
        }
        (Op::IndexSet, _) => "stored \\
            into an array".into(),
        (Op::IndexGet, _) => {
            "used by index.get".into()
        }
        (Op::Phi, _) => {
            return phi(i.line);
        }
    };
    format!("{w} at line {}", i.line)
}

// A phi has no line of its own: 0, or
// the latest line of what it merges.
fn phi(line: u32) -> String {
    let m = "merged with other values \\
        (a variable reassigned along \\
        different paths)";
    if line == 0 {
        m.to_string()
    } else {
        format!("{m} near line {line}")
    }
}

// The bailout for an element read at
// line get: don't repeat that line.
pub fn element_msg(
    get: u32,
    why: &str,
) -> String {
    let ps =
        [" at line ", " near line "];
    let mut w = why;
    for p in ps {
        let s = format!("{p}{get}");
        if let Some(x) =
            w.strip_suffix(&s)
        {
            w = x;
            break;
        }
    }
    let a = "an element is";
    format!("line {get}: {a} {w}")
}`,
        why: 'Without the operand check for `FieldSet`, `e.k = 1` falls to the general arm and is reported as “stored into an object property”, as if `e` had been stored somewhere. It was the object being modified.',
      },
      {
        code: `// A few VIR instructions.
pub enum Op {
    // args: [object, value]
    FieldSet(&'static str),
    // args: [array, index, value]
    IndexSet,
    // args: [array, index]
    IndexGet,
    // args: [callee, arguments...]
    Call,
    // stores args[0] in a variable
    Store(&'static str),
    // args: the merged values
    Phi,
}

pub struct Inst {
    pub op: Op,
    pub args: Vec<u32>,
    // 0 when unknown
    pub line: u32,
}

// Why use i of value v is an escape.
pub fn describe(i: &Inst, v: u32)
    -> String
{
    // Which operand is v? That first.
    let k = i.args.iter()
        .position(|&x| x == v);
    let w: String = match (&i.op, k) {
        (Op::FieldSet(f), Some(0)) => {
            format!("modified directly \\
                (its .{f} is assigned)")
        }
        (Op::IndexSet, Some(0)) => {
            "written with an index \\
             store".into()
        }
        (Op::IndexSet, Some(1))
        | (Op::IndexGet, Some(1)) => {
            "used as an index".into()
        }
        (Op::Call, _) => "passed to a \\
            function call".into(),
        (Op::Store(n), _) => format!(
            "stored in another \\
             variable ({n})"),
        (Op::FieldSet(_), _) => {
            "stored into an object \\
             property".into()
        }
        (Op::IndexSet, _) => "stored \\
            into an array".into(),
        (Op::IndexGet, _) => {
            "used by index.get".into()
        }
        (Op::Phi, _) => {
            return phi(i.line);
        }
    };
    format!("{w} at line {}", i.line)
}

// A phi has no line of its own: 0, or
// the latest line of what it merges.
fn phi(line: u32) -> String {
    let m = "merged with other values \\
        (a variable reassigned along \\
        different paths)";
    if line == 0 {
        m.to_string()
    } else {
        format!("{m} near line {line}")
    }
}

// The bailout for an element read at
// line get: don't repeat that line.
pub fn element_msg(
    get: u32,
    why: &str,
) -> String {
    let w = match why.rfind(" at ") {
        Some(k) => &why[..k],
        None => why,
    };
    let a = "an element is";
    format!("line {get}: {a} {w}")
}`,
        why: 'It strips any “ at line N”, whatever N is, and never a “ near line N”. A reason that names another line loses it, and a phi on the element’s own line keeps the repeat.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'In VIR, `box.k = e` is `field.set %box, %e .k`. What does `describe_use` say for the element `e`?',
    options: [
      {
        t: '“modified directly (its .k is assigned)”',
        why: 'That is for `e.k = ...`, where `e` is the object (operand 0).',
      },
      {
        t: '“stored into an object property”',
        correct: true,
        why: '`e` is the value (operand 1): it now has a second home, in `box`.',
      },
      {
        t: 'Nothing: field writes are allowed',
        why: 'Only writes *to* the element’s own fields are allowed.',
      },
    ],
  },
  {
    q: '`step(ps)` where `step` is a known function, and inside it `return qs[0];`. What happens?',
    options: [
      {
        t: 'The array is followed into `qs`, and the element returned there is an escape: “an element is returned or branched on in step()”',
        correct: true,
        why: 'Real output, with a frame pointing at `qs[0]` on line 5.',
      },
      {
        t: '“passed to a function call”',
        why: 'Known functions are followed, not refused, when every call site passes this collection.',
      },
      {
        t: 'Struct of arrays',
        why: 'The caller gets an element object back, which would no longer exist.',
      },
    ],
  },
  {
    q: '`let p = ps[0]; if (ps.length > 9) p = ps[9]; console.log(p.x);` Why is `ps` kept as objects?',
    options: [
      {
        t: 'Reading `p.x` is not allowed',
        why: 'Field reads of an element are allowed; `p` is the problem.',
      },
      {
        t: '`ps.length` is not supported',
        why: '`.length` is one of the two supported uses.',
      },
      {
        t: 'Both elements flow into a phi for `p`, and merged values are refused',
        correct: true,
        why: 'Two messages: “line 5: an element is merged ...” and “line 4: ... near line 5”.',
      },
    ],
  },
  {
    q: 'Viscosity refuses `p` after `let p = ps[0];` (line 4) and `if (ps.length > 9) p = ps[9];` (line 5), giving one message per element. Why does the line-4 message end in “near line 5”, while the line-5 message names no second line?',
    options: [
      {
        t: 'The phi’s line is the latest of its operands’ lines, 5, and a repeat of the element’s own line is stripped',
        correct: true,
        why: '`line_of` for phis, and the `strip_suffix` step in `element_uses`.',
      },
      {
        t: 'The second phi has no operands',
        why: 'There is one phi, with two operands.',
      },
      {
        t: 'Messages are truncated to fit the terminal',
        why: 'Nothing is truncated; the text is exactly the reference’s.',
      },
    ],
  },
  {
    q: '`const e = ps[0]; const f = () => e;` Which message?',
    options: [
      {
        t: '“an element is put inside another object”',
        why: 'There is no object literal.',
      },
      {
        t: '“an element is stored in another variable (e)”',
        correct: true,
        why: 'A captured variable is a binding with a `store`, so the element goes into it.',
      },
      {
        t: 'None: `e` is a constant',
        why: 'Captured or not, `e` is a second name for the element.',
      },
    ],
  },
];
