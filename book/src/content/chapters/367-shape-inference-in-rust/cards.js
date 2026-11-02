// Chapter 367 cards. Keys are stable ids: never rename them.

const KIND = `// What the fixpoint knows about a
// Python value: provably a float,
// provably an int, or neither.
#[derive(Clone, Copy, PartialEq, Debug)]
pub struct K {
    pub float: bool,
    pub int: bool,
}

// Is it a number of either kind?
fn num(k: K) -> bool {
    k.float || k.int
}
`;

const SOLUTION = `${KIND}
pub fn py_binop(
    op: &str,
    a: K,
    b: K,
) -> K {
    let arith =
        ["+", "-", "*", "%", "//"];
    let ar = arith.contains(&op);
    let int = ar && a.int && b.int;
    let float = match op {
        "/" => num(a) && num(b),
        "**" => a.float && b.int,
        _ if ar => {
            (a.float && num(b))
                || (a.int && b.float)
        }
        _ => false,
    };
    K { float, int }
}`;

const SHAPE = `pub struct Col {
    pub fields: Vec<String>,
    pub bails: Vec<String>,
}

fn list(fs: &[String]) -> String {
    format!("{{{}}}", fs.join(", "))
}
`;

const shapeWith = (cond) => `${SHAPE}
// A record with fields fs and n uses
// joins collection c.
pub fn set_shape(
    c: &mut Col,
    fs: &[String],
    n: usize,
) {
    let differs =
        ${cond};
    if c.fields.is_empty() {
        c.fields = fs.to_vec();
    } else if differs {
        let m = format!(
            "different: {} vs {}",
            list(fs),
            list(&c.fields)
        );
        c.bails.push(m);
    }
    if n != 1 {
        c.bails.push("aliased".into());
    }
}`;

export const prompts = {

  'shr-exact': {
    q: 'How does `set_shape` in `analysis.rs` compare two field lists?',
    a: 'With `!=` on `Vec<String>`: element by element, names and order.',
  },
  'shr-comma': {
    q: 'What did comparing joined names get wrong in the reference?',
    a: 'A record with one field named `a,b` matched a record with fields `a` and `b`, since both join to `"a,b"`.',
  },
  'shr-alias': {
    q: 'Why does `set_shape` bail out when the new record has more than one use?',
    a: 'Another use (say `r.x = 500`) would still expect an object `r`, and after the rewrite there is only a slot in a column.',
  },
  'shr-tick-m': {
    q: 'Why can `set_shape` read the record’s fields and then take `&mut self.collections[ci]`?',
    a: 'The fields come from `inst`, which returns `&\'m Inst`, borrowed from the module, not from `self`.',
  },
  'shr-numeric-fields': {
    q: 'What decides whether a field gets a typed column?',
    a: 'Its fixpoint fact: every record added and every write to the field must put a provable number (in Python, a float) there.',
  },


  'shr-py-float': {
    q: 'In Python, why must a typed column’s field be provably a **float**, not just a number?',
    a: 'An `array(\'d\')` column stores doubles: an int goes in and a float comes out, so a program that printed `1` would print `1.0`.',
  },
  'shr-div': {
    q: 'In Python, when is `a / b` provably a float?',
    a: 'Whenever both operands are numbers of either kind: `/` always gives a float (`6 / 2` is `3.0`).',
  },
  'shr-pow': {
    q: 'When is `a ** b` provably a float in Python?',
    a: 'Only when `a` is a float and `b` an int. A float exponent can give a complex number, and an int base with a negative int exponent gives a float, so int `**` int is neither.',
  },


};

export const examples = {
  'shape-play': {
    lang: 'rust',
    title: 'Exact field lists, and a borrow tied to the module',
    code: `struct Module {
    records: Vec<Vec<String>>,
}

struct Col {
    fields: Vec<String>,
    bails: Vec<String>,
}

struct An<'m> {
    m: &'m Module,
    cols: Vec<Col>,
}

impl<'m> An<'m> {
    // Try: -> &Vec<String> (no 'm).
    fn rec(
        &self,
        r: usize,
    ) -> &'m Vec<String> {
        &self.m.records[r]
    }
    fn set_shape(
        &mut self,
        ci: usize,
        r: usize,
    ) {
        let fields = self.rec(r);
        let c = &mut self.cols[ci];
        if c.fields.is_empty() {
            c.fields = fields.clone();
        } else if c.fields != *fields {
            let m = "different fields";
            c.bails.push(m.into());
        }
    }
}

fn main() {
    let s = |x: &str| x.to_string();
    let one = vec![s("a,b")];
    let two = vec![s("a"), s("b")];
    println!(
        "joined equal: {}",
        one.join(",") == two.join(",")
    );
    let m = Module {
        records: vec![two, one],
    };
    let col = Col {
        fields: vec![],
        bails: vec![],
    };
    let mut an = An {
        m: &m,
        cols: vec![col],
    };
    an.set_shape(0, 0);
    an.set_shape(0, 1);
    println!("{:?}", an.cols[0].bails);
}
`,
  },
};

export const exercises = {
  kinds: {
    lang: 'rust',
    title: 'Python’s int and float rules',
    prompt:
      'Write `py_binop`, the Python half of `compute` and `compute_int` in `analysis.rs` for a binary operator. The result is an **int** when the operator is `+ - * % //` and both sides are ints. It is a **float** when: the operator is `/` and both sides are numbers of either kind; or it is `**`, the base is a float and the exponent an int; or it is one of `+ - * % //` and one side is a float while the other is a number. Anything else (comparisons, say) is neither.',
    starter: `${KIND}
pub fn py_binop(
    op: &str,
    a: K,
    b: K,
) -> K {
    todo!()
}`,
    solution: SOLUTION,
    tests: `const I: K =
    K { float: false, int: true };
const F: K =
    K { float: true, int: false };
const N: K =
    K { float: false, int: false };

#[test]
fn ints_stay_ints() {
    assert_eq!(py_binop("+", I, I), I);
    assert_eq!(py_binop("//", I, I), I);
}

#[test]
fn true_division_is_a_float() {
    // 6 / 2 is 3.0
    assert_eq!(py_binop("/", I, I), F);
    assert_eq!(py_binop("/", F, I), F);
}

#[test]
fn a_float_spreads() {
    assert_eq!(py_binop("*", I, F), F);
    assert_eq!(py_binop("-", F, F), F);
    assert_eq!(py_binop("+", F, N), N);
}

#[test]
fn powers_are_careful() {
    // 2.0 ** 3 is 8.0
    assert_eq!(py_binop("**", F, I), F);
    // (-1.0) ** 0.5 is complex
    assert_eq!(py_binop("**", F, F), N);
    // 2 ** -1 is 0.5
    assert_eq!(py_binop("**", I, I), N);
}

#[test]
fn comparisons_are_neither() {
    assert_eq!(py_binop("<", F, F), N);
}`,
    hints: [
      'Compute the two halves separately and build `K { float, int }` at the end. The int half is one line: the operator is in the list and `a.int && b.int`.',
      'For the float half, `match op` with arms for `"/"` and `"**"`, then a guarded arm `_ if arith.contains(&op) => ...`, then `_ => false`.',
      'For `+ - * % //`: `(a.float && num(b)) || (a.int && b.float)`. For `**`: `a.float && b.int`.',
    ],
    walkthrough: `**How to think about it.** Work out the two facts separately, because they answer different questions: "is the result provably an int?" and "is the result provably a float?". The int question is easy, since only \`+ - * % //\` of two ints give an int. The float question has three cases, one for \`/\`, one for \`**\`, and one for the other arithmetic operators, and everything else (comparisons, say) is neither. Before writing, check each rule against Python itself: \`6 / 2\` is \`3.0\`, \`2 * 1.5\` is \`3.0\`, \`2.0 ** 3\` is \`8.0\`, \`2 ** -1\` is \`0.5\`, and \`(-1.0) ** 0.5\` is a complex number. This is the \`Op::Binop\` arm of \`compute\` and of \`compute_int\` in \`analysis.rs\`, merged into one function; in the real code, \`self.n(v)\` is \`k.float\` and \`self.i(v)\` is \`k.int\`.

**The solution, line by line.**

- \`let arith = ["+", "-", "*", "%", "//"];\` lists the operators that keep an int an int. \`/\` and \`**\` are deliberately not in it.
- \`let ar = arith.contains(&op);\` asks once whether \`op\` is one of them; \`contains\` takes a reference to the item, hence \`&op\`.
- \`let int = ar && a.int && b.int;\` is the whole int rule: one of those operators, and both sides provably ints.
- \`let float = match op {\` starts the float rule, one arm per case.
- \`"/" => num(a) && num(b),\` says true division gives a float whenever both sides are numbers of either kind (\`num\` is "float or int").
- \`"**" => a.float && b.int,\` is the careful one: a float base with an int exponent is a float; an int base can give an int or a float, and a float exponent can give a complex number, so nothing else is proven.
- \`_ if ar => (a.float && num(b)) || (a.int && b.float),\` covers \`+ - * % //\`: the result is a float if one side is a float and the other a number. The two halves of the \`||\` are the two ways round (float first, or int first and float second).
- \`_ => false,\` makes everything else neither.
- \`K { float, int }\` builds the answer with field shorthand (\`float: float\`).

Check it on \`ints_stay_ints.py\`: \`i / 2\` is int / int, so float; \`count + 1\`, once \`count\` is no longer provably a float, is neither; \`weight * 2\` is float * int, so float.

**Common wrong attempts.**

- Putting \`/\` in the int list. Then \`6 / 2\` comes out an int, but in Python it is \`3.0\`, and a column built on that fact would print the wrong thing.
- Treating \`**\` like \`*\`. Then a float to a float power counts as a float, though \`(-1.0) ** 0.5\` is complex, and \`2 ** -1\` counts as an int, though it is \`0.5\`.
- Writing the float rule for \`+\` as \`num(a) && num(b)\`. That makes int + int a float, so \`count\` would get an \`array('d')\` column and \`print\` would show \`2.0\` where the original showed \`2\`.

None of this exists for JavaScript, where every number is a double: there, \`compute\` only asks that both sides of an arithmetic operator be numbers.`,
    wrong: [
      {
        code: `${KIND}
pub fn py_binop(
    op: &str,
    a: K,
    b: K,
) -> K {
    let arith =
        ["+", "-", "*", "%", "//", "/"];
    let ar = arith.contains(&op);
    let int = ar && a.int && b.int;
    let float = match op {
        "**" => a.float && b.int,
        _ if ar => {
            (a.float && num(b))
                || (a.int && b.float)
        }
        _ => false,
    };
    K { float, int }
}`,
        why: 'It treats `/` like the other operators, so `6 / 2` comes out an int. In Python it is `3.0`.',
      },
      {
        code: `${KIND}
pub fn py_binop(
    op: &str,
    a: K,
    b: K,
) -> K {
    let arith = ["+", "-", "*", "%"];
    let ar = arith.contains(&op)
        || op == "//"
        || op == "**";
    let int = ar && a.int && b.int;
    let float = match op {
        "/" => num(a) && num(b),
        _ if ar => {
            (a.float && num(b))
                || (a.int && b.float)
        }
        _ => false,
    };
    K { float, int }
}`,
        why: 'It treats `**` like `*`. Then a float to a float power counts as a float, though `(-1.0) ** 0.5` is complex, and `2 ** -1` counts as an int, though it is `0.5`.',
      },
    ],
  },
  shape: {
    lang: 'rust',
    optional: true,
    title: 'set_shape, exactly',
    prompt:
      'Finish the comparison in `set_shape`: a collection takes the fields of its first record; a later record whose field list differs, in names or order, is a bailout. (The test names show the case that fooled the reference.)',
    starter: shapeWith('todo!()'),
    solution: shapeWith('c.fields != fs'),
    tests: `fn v(xs: &[&str]) -> Vec<String> {
    xs.iter().map(|x| x.to_string())
        .collect()
}

fn new() -> Col {
    let e = || vec![];
    Col { fields: e(), bails: e() }
}

fn add(c: &mut Col, xs: &[&str]) {
    set_shape(c, &v(xs), 1);
}

#[test]
fn same_fields_are_fine() {
    let mut c = new();
    add(&mut c, &["x", "y"]);
    add(&mut c, &["x", "y"]);
    assert!(c.bails.is_empty());
}

#[test]
fn order_is_part_of_the_shape() {
    let mut c = new();
    add(&mut c, &["x", "y"]);
    add(&mut c, &["y", "x"]);
    assert_eq!(c.bails.len(), 1);
}

#[test]
fn a_comma_is_not_two_fields() {
    let mut c = new();
    add(&mut c, &["a", "b"]);
    add(&mut c, &["a,b"]);
    assert_eq!(c.bails, vec![
        "different: {a,b} vs {a, b}",
    ]);
}

#[test]
fn a_shared_record_is_aliased() {
    let mut c = new();
    set_shape(&mut c, &v(&["x"]), 2);
    let want = vec!["aliased"];
    assert_eq!(c.bails, want);
}`,
    hints: [
      'What does “the same shape” mean? The same names, in the same order, and no more or fewer of them.',
      'Rust can already compare two lists that way, length first and then element by element. Do not build a string from either list.',
      '`Vec<String>` and `&[String]` can be compared with `!=` directly: `c.fields != fs`.',
    ],
    walkthrough: `**How to think about it.** A shape is a list of names in order, so "same shape" should mean "same list": the same length, and the same name at each position. Rust already compares a \`Vec<String>\` with a \`&[String]\` exactly that way, so the whole condition is one comparison; the work is in resisting anything cleverer.

**The solution, line by line.**

- \`let differs = c.fields != fs;\` compares the collection's list with the record's: first the lengths, then each pair of names, stopping at the first difference. Comparing a \`Vec<String>\` with a slice \`&[String]\` works because the standard library implements \`PartialEq\` between them.
- The rest of \`set_shape\` was given: the first record (\`c.fields.is_empty()\`) sets the fields; a later one that \`differs\` adds a bailout naming both lists; and a record with more than one use is reported as aliased.

On \`a_comma_is_not_two_fields\`, the collection holds \`["a", "b"]\` and the new record \`["a,b"]\`: lengths 2 and 1, so they differ at once, and the message prints \`{a,b} vs {a, b}\` (the record's list first, as the real message does).

**Common wrong attempts.**

- Comparing \`c.fields.join(",") != fs.join(",")\`, the reference's old idea. \`["a", "b"]\` and \`["a,b"]\` both become \`"a,b"\`, and a field named \`a,b\` is legal in JavaScript (\`{ 'a,b': i }\`). The fixed TypeScript compares \`JSON.stringify\` of the two arrays, which quotes each name, so the comma can no longer hide.
- Comparing sorted copies of the lists. Then \`{x, y}\` and \`{y, x}\` count as one shape, but the order of fields is part of an object's shape in JavaScript engines, and the reference refuses it, so parity would fail.`,
    wrong: [
      {
        code: shapeWith(`c.fields.join(",")
            != fs.join(",")`),
        why: 'Joining loses the boundaries between names: `{a, b}` and `{\'a,b\'}` both join to `"a,b"`, so the mismatch goes unnoticed. That was bug 3 in engine/rust’s README.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Two pushes into `ps`: `{ \'a,b\': i }` and `{ a: i, b: 2 }`. What does the fixed engine decide?',
    options: [
      { t: 'Struct of arrays with fields `{a, b}`', why: 'That was the old, wrong behaviour: the joined names matched.' },
      { t: 'Kept as an array of objects: “records with different fields or field order”', correct: true, why: 'One field `a,b` is not two fields `a` and `b`. This is the corpus program `comma_field_name.js`.' },
      { t: 'A syntax error', why: '`\'a,b\'` is a legal property name in an object literal.' },
    ],
  },
  {
    q: 'In `set_shape`, the record’s field list is borrowed while `&mut self.collections[ci]` is taken. Why does that compile?',
    options: [
      { t: 'The field list is cloned first', why: 'It is only cloned when it becomes the collection’s shape; the comparison borrows it.' },
      { t: '`inst` returns `&\'m Inst`, a borrow of the module, which `self` only points to', correct: true, why: 'With a return type tied to `&self` instead, rustc 1.97 rejects it with E0502.' },
      { t: 'rustc allows two mutable borrows inside one method', why: 'It never does.' },
    ],
  },
  {
    q: 'In Python, `cs.append(Cell(i, i / 2))` with `i` from `range(300)`, and later `cs[i].count += 1`. Which columns does Viscosity choose?',
    options: [
      { t: 'Both `array(\'d\')`, since both fields hold numbers', why: 'An int stored in an `array(\'d\')` comes back as a float.' },
      { t: 'Both plain lists', why: '`i / 2` is provably a float, so `weight` can be typed.' },
      { t: '`array(\'d\')` for `weight`, a list for `count`', correct: true, why: 'Real output: “typed array(\'d\') columns for weight; list columns for count (may hold non-floats)”.' },
    ],
  },
  {
    q: 'Why is `x ** 0.5` (with `x` a float) not provably a float in Python?',
    options: [
      { t: 'A negative base with a fractional exponent gives a complex number', correct: true, why: '`(-1.0) ** 0.5` is about `6e-17+1j`. The corpus program `power_complex.py` keeps such a field out of a typed column.' },
      { t: '`**` always gives an int', why: '`2.0 ** 3` is `8.0`.' },
      { t: 'Python has no `**` operator', why: 'It does; JavaScript has one too.' },
    ],
  },
  {
    q: 'A record is pushed and then also changed through its variable: `const r = { x: i }; ps.push(r); r.x = 5;`. What does the shape pass report?',
    options: [
      { t: 'Nothing: the shape matches', why: 'The shape is fine, but the record has two uses.' },
      { t: 'A different shape', why: 'The fields are the same.' },
      { t: 'That the array is used by an unknown function', why: 'The array itself is only pushed to.' },
      { t: 'That the new record is also referenced elsewhere, so it could be aliased', correct: true, why: '`self.uses.of(r).len() != 1`.' },
    ],
  },

];
