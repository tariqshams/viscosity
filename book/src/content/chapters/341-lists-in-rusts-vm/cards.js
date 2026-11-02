// Chapter 341 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'rvl-objlist': {
    q: 'What is a Drip list in drip-rs, in Rust types?',
    a: 'An `ObjList { items: Vec<Value> }` in the heap’s `lists` arena; a list value is `Value::List(Gc<ObjList>)`.',
  },
  'rvl-same-list': {
    q: 'After `let ys = xs; push(ys, 1);`, why is `xs` longer too?',
    a: 'The assignment copies the `Gc<ObjList>` handle, not the list: both names hold the same slot number, so they share one `Vec`.',
  },
  'rvl-build-order': {
    q: 'In `OpCode::List`, in what order do `to_vec`, `alloc` and `truncate` happen?',
    a: '`to_vec` copies the top `n` values, `alloc` stores the new list, and only then does `truncate` drop the elements from the stack.',
  },
  'rvl-on-stack': {
    q: 'Why must the elements still be on the stack while `alloc` runs?',
    a: '`alloc` may collect first, and the new `Vec` is only a local the collector cannot see; the stack is a root, so the elements’ objects survive.',
  },
  'rvl-check-order': {
    q: 'In what order does `check_index` check, and what does `"abc"[1.5]` report?',
    a: 'A list, then a number, then a whole number, then in range. `"abc"[1.5]` fails the first: `cannot index a string`.',
  },
  'rvl-cast': {
    q: 'Why must `check_index` reject `-1` and `1.5` before it writes `i as usize`?',
    a: 'A float-to-integer `as` never fails: it rounds towards zero and saturates, so `-1.0 as usize` is 0 and `1.5 as usize` is 1, silently.',
  },
  'rvl-trace': {
    q: 'How does the collector keep a list’s elements alive?',
    a: '`Gray::List(l) => self.lists[l].items.trace(marks)`: tracing the `Vec` marks the object each element’s handle names.',
  },
  'rvl-size': {
    q: 'How many bytes does drip-rs’s heap count for a list of a million elements?',
    a: '24, `size_of::<ObjList>()`: the `Vec`’s header only. The elements’ block is not counted when pacing collections.',
  },
};

export const examples = {
  'lists-rs': {
    lang: 'drip-vm',
    title: 'One list, two names',
    code: `let xs = [10, 20];
push(xs, 30);
xs[0] = 7;
let ys = xs;
push(ys, 40);
print len(xs);
print pop(xs);
print xs;`,
  },
};

export const exercises = {
  checkIndex: {
    lang: 'rust',
    title: 'check_index',
    prompt: `Write drip-rs’s \`check_index\` for this small VM, as a free function. A list value is \`Value::List(h)\`, where \`h\` is the list’s slot in \`lists\`. Return \`Ok((h, i))\` with the element index as a \`usize\`, or \`Err\` with Drip’s exact message, checking in this order:

1. not a list: \`cannot index a string\` (use \`describe\`);
2. not a number: \`a list index must be a number, not a string\`;
3. not a whole number: \`index 1.5 is not a whole number\`;
4. out of range: \`index 3 is out of range for a list of length 3\`.

Format numbers with \`{i}\`: Rust prints \`3.0\` as \`3\` and \`-1.0\` as \`-1\`, as Drip does.`,
    starter: `#[derive(Clone, Copy, Debug, PartialEq)]
enum Value {
    None,
    Number(f64),
    Str,
    // A handle: the list's slot number.
    List(usize),
}

fn describe(v: Value) -> &'static str {
    match v {
        Value::None => "none",
        Value::Number(_) => "a number",
        Value::Str => "a string",
        Value::List(_) => "a list",
    }
}

// The list's slot and the element's
// index, or Drip's error message.
type R = Result<(usize, usize), String>;

fn check_index(
    lists: &[Vec<Value>],
    list: Value,
    index: Value,
) -> R {
    todo!()
}`,
    solution: `#[derive(Clone, Copy, Debug, PartialEq)]
enum Value {
    None,
    Number(f64),
    Str,
    // A handle: the list's slot number.
    List(usize),
}

fn describe(v: Value) -> &'static str {
    match v {
        Value::None => "none",
        Value::Number(_) => "a number",
        Value::Str => "a string",
        Value::List(_) => "a list",
    }
}

// The list's slot and the element's
// index, or Drip's error message.
type R = Result<(usize, usize), String>;

fn check_index(
    lists: &[Vec<Value>],
    list: Value,
    index: Value,
) -> R {
    let Value::List(h) = list else {
        let d = describe(list);
        return Err(format!(
            "cannot index {d}"));
    };
    let Value::Number(i) = index else {
        let d = describe(index);
        return Err(format!(
            "a list index must be a \\
             number, not {d}"));
    };
    if i.fract() != 0.0
        || !i.is_finite()
    {
        return Err(format!(
            "index {i} is not a \\
             whole number"));
    }
    let len = lists[h].len();
    if i < 0.0 || i >= len as f64 {
        return Err(format!(
            "index {i} is out of \\
             range for a list of \\
             length {len}"));
    }
    Ok((h, i as usize))
}`,
    tests: `fn lists() -> Vec<Vec<Value>> {
    let xs = vec![
        Value::Number(10.0),
        Value::Number(20.0),
        Value::Number(30.0),
    ];
    vec![xs]
}

fn check(list: Value, index: Value) -> R {
    check_index(&lists(), list, index)
}

fn num(n: f64) -> Value {
    Value::Number(n)
}

#[test]
fn a_good_index() {
    let r = check(Value::List(0), num(2.0));
    assert_eq!(r, Ok((0, 2)));
}

#[test]
fn only_lists_can_be_indexed() {
    let r = check(Value::Str, num(0.0));
    assert_eq!(r.unwrap_err(),
        "cannot index a string");
}

#[test]
fn the_index_must_be_a_number() {
    let r = check(Value::List(0), Value::Str);
    assert_eq!(r.unwrap_err(),
        "a list index must be a number, \\
         not a string");
    let r = check(Value::List(0), Value::None);
    assert_eq!(r.unwrap_err(),
        "a list index must be a number, \\
         not none");
}

#[test]
fn the_index_must_be_whole() {
    let r = check(Value::List(0), num(1.5));
    assert_eq!(r.unwrap_err(),
        "index 1.5 is not a whole number");
}

#[test]
fn past_the_end() {
    let r = check(Value::List(0), num(3.0));
    assert_eq!(r.unwrap_err(),
        "index 3 is out of range for a \\
         list of length 3");
}

#[test]
fn below_zero() {
    let r = check(Value::List(0), num(-1.0));
    assert_eq!(r.unwrap_err(),
        "index -1 is out of range for a \\
         list of length 3");
}

#[test]
fn checks_run_in_order() {
    let r = check(Value::Str, num(1.5));
    assert_eq!(r.unwrap_err(),
        "cannot index a string");
    let r = check(Value::List(0), num(7.5));
    assert_eq!(r.unwrap_err(),
        "index 7.5 is not a whole number");
}`,
    hints: [
      'Use `let ... else` twice to pull the slot out of `Value::List(h)` and the number out of `Value::Number(i)`, returning an `Err` from each `else`.',
      'A whole number has no fractional part: `i.fract() != 0.0` catches 1.5, and `!i.is_finite()` catches the infinities. Do this before the range check, or 7.5 on a list of 3 reports the wrong error.',
      'Compare as floats, `i < 0.0 || i >= len as f64`, and only after that convert with `i as usize`.',
    ],
    walkthrough: `**How to think about it.** Four checks, each turning a "maybe" into a "definitely", and each one relying on the ones before: you can only ask whether something is whole once you know it is a number, and only ask a list's length once you know you have a list. So the order is forced by the types as much as by the messages, and the last line can convert with \`as\` because by then nothing can go wrong. Write it as a straight line of early returns.

**The solution, line by line.**

- \`let Value::List(h) = list else {\` keeps going only if \`list\` is a list, binding its slot to \`h\`.
- \`let d = describe(list); return Err(format!("cannot index {d}"));\` otherwise reports what it got, with its article: "a string".
- \`let Value::Number(i) = index else {\` does the same for the index, binding the float to \`i\`.
- \`return Err(format!("a list index must be a number, not {d}"));\` (the \`\\\\\` at the end of a line inside a string continues it on the next line, skipping the leading spaces).
- \`if i.fract() != 0.0 || !i.is_finite() {\`: \`fract\` is the part after the point, so 1.5 gives 0.5; an infinity is not whole either.
- \`return Err(format!("index {i} is not a whole number"));\` and Rust's \`{i}\` prints 1.5 as \`1.5\`.
- \`let len = lists[h].len();\` reads the length, a \`usize\`.
- \`if i < 0.0 || i >= len as f64 {\` compares as floats, so \`-1\` is caught here rather than turned into 0.
- \`return Err(format!("index {i} is out of range for a list of length {len}"));\`
- \`Ok((h, i as usize))\`: \`i\` is now a whole number from 0 to \`len - 1\`, so the cast is exact.

**Common wrong attempts.**

- Checking the range before wholeness: \`[10, 20, 30][7.5]\` then says "out of range" when Drip says "index 7.5 is not a whole number".
- Converting first, \`if i as usize >= len\`: \`-1.0 as usize\` is 0, because a float-to-integer \`as\` saturates, so \`xs[-1]\` silently reads the first element.
- Writing \`{:?}\` instead of \`{}\`: Debug prints \`3.0\`, not \`3\`.`,
    wrong: [
      {
        code: `#[derive(Clone, Copy, Debug, PartialEq)]
enum Value {
    None,
    Number(f64),
    Str,
    // A handle: the list's slot number.
    List(usize),
}

fn describe(v: Value) -> &'static str {
    match v {
        Value::None => "none",
        Value::Number(_) => "a number",
        Value::Str => "a string",
        Value::List(_) => "a list",
    }
}

// The list's slot and the element's
// index, or Drip's error message.
type R = Result<(usize, usize), String>;

fn check_index(
    lists: &[Vec<Value>],
    list: Value,
    index: Value,
) -> R {
    let Value::List(h) = list else {
        let d = describe(list);
        return Err(format!(
            "cannot index {d}"));
    };
    let Value::Number(i) = index else {
        let d = describe(index);
        return Err(format!(
            "a list index must be a \\
             number, not {d}"));
    };
    let len = lists[h].len();
    if i < 0.0 || i >= len as f64 {
        return Err(format!(
            "index {i} is out of \\
             range for a list of \\
             length {len}"));
    }
    if i.fract() != 0.0
        || !i.is_finite()
    {
        return Err(format!(
            "index {i} is not a \\
             whole number"));
    }
    Ok((h, i as usize))
}`,
        why: 'The range check runs first, so `xs[7.5]` on a list of 3 reports “out of range” rather than “not a whole number”.',
      },
      {
        code: `#[derive(Clone, Copy, Debug, PartialEq)]
enum Value {
    None,
    Number(f64),
    Str,
    // A handle: the list's slot number.
    List(usize),
}

fn describe(v: Value) -> &'static str {
    match v {
        Value::None => "none",
        Value::Number(_) => "a number",
        Value::Str => "a string",
        Value::List(_) => "a list",
    }
}

// The list's slot and the element's
// index, or Drip's error message.
type R = Result<(usize, usize), String>;

fn check_index(
    lists: &[Vec<Value>],
    list: Value,
    index: Value,
) -> R {
    let Value::List(h) = list else {
        let d = describe(list);
        return Err(format!(
            "cannot index {d}"));
    };
    let Value::Number(i) = index else {
        let d = describe(index);
        return Err(format!(
            "a list index must be a \\
             number, not {d}"));
    };
    if i.fract() != 0.0
        || !i.is_finite()
    {
        return Err(format!(
            "index {i} is not a \\
             whole number"));
    }
    let len = lists[h].len();
    if i as usize >= len {
        return Err(format!(
            "index {i} is out of \\
             range for a list of \\
             length {len}"));
    }
    Ok((h, i as usize))
}`,
        why: '`-1.0 as usize` saturates to 0, so `xs[-1]` returns `Ok((0, 0))` instead of an error.',
      },
    ],
  },
  makeList: {
    optional: true,
    lang: 'rust',
    title: 'Take the top n values',
    prompt: 'The `list n` instruction takes the top `n` values off the stack, in the order they were pushed. Write `take_top(stack, n)`, which returns them as a new `Vec` (bottom one first) and removes them from the stack. With `n = 0` it returns an empty `Vec` and leaves the stack alone.',
    starter: `fn take_top(
    stack: &mut Vec<f64>,
    n: usize,
) -> Vec<f64> {
    todo!()
}`,
    solution: `fn take_top(
    stack: &mut Vec<f64>,
    n: usize,
) -> Vec<f64> {
    let start = stack.len() - n;
    let items = stack[start..].to_vec();
    stack.truncate(start);
    items
}`,
    tests: `#[test]
fn keeps_the_order() {
    let mut s = vec![1.0, 2.0, 3.0];
    assert_eq!(take_top(&mut s, 2),
        vec![2.0, 3.0]);
}

#[test]
fn shortens_the_stack() {
    let mut s = vec![1.0, 2.0, 3.0];
    take_top(&mut s, 2);
    assert_eq!(s, vec![1.0]);
}

#[test]
fn zero_takes_nothing() {
    let mut s = vec![1.0];
    assert!(take_top(&mut s, 0).is_empty());
    assert_eq!(s, vec![1.0]);
}

#[test]
fn can_take_everything() {
    let mut s = vec![4.0, 5.0];
    assert_eq!(take_top(&mut s, 2),
        vec![4.0, 5.0]);
    assert!(s.is_empty());
}`,
    hints: [
      'Work out where the top `n` values start: `stack.len() - n`.',
      '`stack[start..]` is a slice of exactly those values, in order, and `.to_vec()` copies it into a new `Vec`.',
      'Then `stack.truncate(start)` drops them from the stack. (`stack.split_off(start)` does both steps at once.)',
    ],
    walkthrough: `**How to think about it.** The values you want are already in the right order, at the end of the stack, so there is nothing to reverse: find where they start, copy that slice, then cut the stack back. drip-rs splits it in two steps because, between the copy and the cut, it allocates the list, and the values must still be on the stack then.

**The solution, line by line.**

- \`let start = stack.len() - n;\` is the index of the lowest value to take; for a stack of 3 and \`n = 2\`, that is 1.
- \`let items = stack[start..].to_vec();\` slices from \`start\` to the end and copies it into a new \`Vec\`, bottom value first.
- \`stack.truncate(start);\` shortens the stack to \`start\` values, dropping the ones just copied.
- \`items\` is returned.

With \`n = 0\`, \`start\` is the length, the slice is empty, and \`truncate\` changes nothing.

**Common wrong attempts.**

- Popping \`n\` times into a new \`Vec\`: \`pop\` takes the *top* value first, so the list comes out reversed, \`[3, 2]\` instead of \`[2, 3]\`.
- Forgetting \`truncate\`: the list is right, but the stack still holds the values, so every later instruction sees two extra values.`,
    wrong: [
      {
        code: `fn take_top(
    stack: &mut Vec<f64>,
    n: usize,
) -> Vec<f64> {
    let mut items = Vec::new();
    for _ in 0..n {
        let v = stack.pop().unwrap();
        items.push(v);
    }
    items
}`,
        why: '`pop` takes the top value first, so the elements come out reversed.',
      },
      {
        code: `fn take_top(
    stack: &mut Vec<f64>,
    n: usize,
) -> Vec<f64> {
    let start = stack.len() - n;
    stack[start..].to_vec()
}`,
        why: 'The values are copied but never removed from the stack.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'After `let ys = xs;`, what do `xs` and `ys` hold in drip-rs?',
    options: [
      { t: 'Two copies of the list’s elements', why: 'Assignment copies a 16-byte `Value`, and for a list that is only a handle.' },
      { t: 'The same `Gc<ObjList>` handle, naming one slot of the lists arena', correct: true, why: 'So a `push` through either name changes the one list.' },
      { t: 'An `Rc<Vec<Value>>` each', why: 'drip-rs has no `Rc` for objects; the heap owns the list.' },
    ],
  },
  {
    q: 'In `OpCode::List`, what could go wrong if `truncate` ran before `alloc`?',
    options: [
      { t: 'Nothing: the values were already copied by `to_vec`', why: 'The copy is a local `Vec` the collector cannot see, so a string in it could be freed.' },
      { t: 'The list would come out reversed', why: 'Order comes from the slice, not from when the stack is cut.' },
      { t: 'A collection inside `alloc` could free an element’s object, because nothing it can see still refers to it', correct: true, why: 'The stack is a root; the local `items` is not. That is why the elements stay on the stack until the list exists.' },
      { t: 'A compile error from the borrow checker', why: 'It would compile; the bug would show at run time, under the stress collector.' },
    ],
  },
  {
    q: 'What does drip-rs print for `print [1, 2, 3][3.5];`?',
    options: [
      { t: '`runtime error: index 3.5 is out of range for a list of length 3`', why: 'Wholeness is checked before range.' },
      { t: '`runtime error: index 3.5 is not a whole number`', correct: true, why: 'The third check fails first, followed by the trace line `at line 1 in script`.' },
      { t: '`3`', why: 'drip-rs never rounds an index.' },
      { t: '`none`', why: 'Reading out of range is an error in Drip, not `none`.' },
    ],
  },
  {
    q: 'Why can `check_index` end with `i as usize` without any further check?',
    options: [
      { t: 'Because `as` panics on a bad value', why: 'A float-to-integer `as` never panics; it saturates and rounds towards zero.' },
      { t: 'Because Drip numbers are integers', why: 'Drip numbers are 64-bit floats.' },
      { t: 'Because the earlier checks proved `i` is a whole number from 0 to `len - 1`', correct: true, why: 'For such a number the cast is exact.' },
    ],
  },
  {
    q: 'What does the collector do when it reaches a list?',
    options: [
      { t: 'Marks the list only; its elements are roots already', why: 'Elements are only reachable through the list.' },
      { t: 'Copies the list to a new arena slot', why: 'drip-rs’s collector never moves objects.' },
      { t: 'Frees any element that is a number', why: 'Numbers live inside the `Value`; there is nothing to free.' },
      { t: 'Traces `items`, marking the object each element’s handle names', correct: true, why: '`Gray::List(l) => self.lists[l].items.trace(marks)`.' },
    ],
  },
];
