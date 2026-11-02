// Chapter 343 cards. Keys are stable ids: never rename them.

const SCAF = `use std::collections::HashSet;

// One use of a value that refers to
// the collection.
pub enum Use {
    // .length
    Len,
    // .push(r): the record r
    Push(usize),
    // [i]: the element value
    Index(usize),
    // passed to known function f as
    // argument k (every call site of f
    // passes this collection there)
    Call(usize, usize),
    // anything else, and why
    Other(&'static str),
}

pub struct Prog {
    // uses[v]: the uses of value v
    pub uses: Vec<Vec<Use>>,
    // params[f][k]: the value of f's
    // k-th parameter
    pub params: Vec<Vec<usize>>,
}

#[derive(Debug, Default, PartialEq)]
pub struct Found {
    pub pushes: Vec<usize>,
    pub elements: Vec<usize>,
    pub bails: Vec<String>,
}
`;

const ONE = `
// One use. Returns a value to visit
// next, as use_of_collection does.
fn one(
    u: &Use,
    p: &Prog,
    out: &mut Found,
) -> Option<usize> {
    match u {
        Use::Len => None,
        Use::Push(r) => {
            out.pushes.push(*r);
            None
        }
        Use::Index(e) => {
            out.elements.push(*e);
            None
        }
        Use::Call(f, k) => {
            Some(p.params[*f][*k])
        }
        Use::Other(w) => {
            let a = "the array is";
            let m = format!("{a} {w}");
            out.bails.push(m);
            None
        }
    }
}
`;

const withOne = (body) => `${SCAF}${ONE}
pub fn discover(
    p: &Prog,
    loads: &[usize],
) -> Found {
${body}
}`;

const SOLUTION = withOne(`    let mut out = Found::default();
    let mut work = loads.to_vec();
    let mut seen = HashSet::new();
    while let Some(l) = work.pop() {
        for u in &p.uses[l] {
            let o = &mut out;
            let next = one(u, p, o);
            let Some(v) = next else {
                continue;
            };
            if seen.insert(v) {
                work.push(v);
            }
        }
    }
    out`);

export const prompts = {
  'cdr-what': {
    q: 'What is **the collection pass in Rust**?',
    a: 'Steps 1 and 2 of `analysis.rs`: find candidate bindings, then follow every reference to each one through its uses, recording pushes, elements and bailouts.',
  },
  'cdr-struct': {
    q: 'The TS `analyze` keeps its state in local variables and closures. Where does the Rust port keep it?',
    a: 'In a struct, `Analyzer<\'m>`, whose methods are the TS closures.',
  },
  'cdr-lifetime': {
    q: 'Why does `Analyzer::inst` return `&\'m Inst` rather than a reference tied to `&self`?',
    a: 'The instruction lives in the module, not in the analyzer. With `\'m`, holding it doesn’t borrow the analyzer, so its fields can still be changed.',
  },
  'cdr-index': {
    q: 'TS maps loads to `Collection` objects. What does `collection_of_load` map them to in Rust?',
    a: 'A `usize`: the collection’s index in `self.collections`.',
  },
  'cdr-why-index': {
    q: 'Why an index rather than a `&mut Collection` in the map?',
    a: 'A reference into the `Vec` would borrow it for as long as the map lives, so nothing else could push to or change the collections.',
  },
  'cdr-letelse': {
    q: 'How does `find_collections` skip a binding that is never given an array?',
    a: 'With `let Some(&first) = st.iter().find(...) else { continue; };`, where TS filters every store and tests the length.',
  },
  'cdr-clone': {
    q: 'Why does `uses_of` return a cloned `Vec<Use>`?',
    a: 'The loop body calls `&mut self` methods. Iterating `self.uses.of(l)` directly would keep `self` borrowed, which is error E0502.',
  },
  'cdr-follow': {
    q: 'How does a value get added to the worklist besides the binding’s loads?',
    a: '`use_of_collection` returns `Some(param)` when the collection is passed to a known function, and the caller pushes it.',
  },
  'cdr-seen': {
    q: 'What does `seen_param` prevent?',
    a: 'Following the same parameter twice, when a known function is called with the collection from two call sites.',
  },
  'cdr-lifo': {
    q: 'The worklist is a `Vec` used as a stack. Why not a queue?',
    a: 'The reference pops from the end of its array, and the visit order decides the order of the explain messages. Parity needs the same order.',
  },
  'cdr-first-site': {
    q: 'A bailout message is found twice. Which source position does `--frames` show?',
    a: 'The first: `bail` records the site with `entry(msg).or_insert(at)`.',
  },
};

export const examples = {
  'uses-play': {
    lang: 'rust',
    title: 'Clone the uses, then call &mut self',
    code: `struct Uses(Vec<Vec<usize>>);

impl Uses {
    fn of(&self, v: usize) -> &[usize] {
        &self.0[v]
    }
}

struct A {
    uses: Uses,
    bails: Vec<String>,
}

impl A {
    // Like Analyzer::uses_of: a copy,
    // so self isn't borrowed after.
    fn uses_of(
        &self,
        v: usize,
    ) -> Vec<usize> {
        self.uses.of(v).to_vec()
    }
    fn check(&mut self, u: usize) {
        let m = format!("use {u}");
        self.bails.push(m);
    }
    fn walk(&mut self, l: usize) {
        // Try self.uses.of(l) here.
        for u in self.uses_of(l) {
            self.check(u);
        }
    }
}

fn main() {
    let mut a = A {
        uses: Uses(vec![vec![1, 2]]),
        bails: vec![],
    };
    a.walk(0);
    println!("{:?}", a.bails);
}
`,
  },
};

export const exercises = {
  discover: {
    lang: 'rust',
    title: 'Follow a collection',
    prompt:
      'Write `one` and `discover`, a small model of the worklist in `shapes_and_uses`. Start with the collection’s `loads` on a stack and pop from the end. For each use of each popped value, `one` handles it: `Len` is fine; `Push(r)` records `r` in `pushes`; `Index(e)` records `e` in `elements`; `Call(f, k)` returns parameter `p.params[f][k]`, which `discover` pushes on the stack the first time only; `Other(why)` adds the bailout `"the array is {why}"`. Order matters: it is the order of the explain messages.',
    starter: `${SCAF}
fn one(
    u: &Use,
    p: &Prog,
    out: &mut Found,
) -> Option<usize> {
    todo!()
}

pub fn discover(
    p: &Prog,
    loads: &[usize],
) -> Found {
    todo!()
}`,
    solution: SOLUTION,
    tests: `fn prog(
    uses: Vec<Vec<Use>>,
) -> Prog {
    Prog { uses, params: vec![vec![9]] }
}

#[test]
fn the_last_load_is_seen_first() {
    let p = prog(vec![
        vec![Use::Push(10)],
        vec![Use::Push(11)],
        vec![Use::Len, Use::Index(12)],
    ]);
    let f = discover(&p, &[0, 1, 2]);
    assert_eq!(f.elements, vec![12]);
    assert_eq!(f.pushes, vec![11, 10]);
}

#[test]
fn into_a_known_function() {
    // ps passed to f; f's param is
    // value 9, which is indexed.
    let mut u: Vec<Vec<Use>> = vec![];
    u.resize_with(10, Vec::new);
    u[0] = vec![Use::Call(0, 0)];
    u[9] = vec![Use::Index(7)];
    let f = discover(&prog(u), &[0]);
    assert_eq!(f.elements, vec![7]);
    assert!(f.bails.is_empty());
}

#[test]
fn two_call_sites_one_parameter() {
    let mut u: Vec<Vec<Use>> = vec![];
    u.resize_with(10, Vec::new);
    u[0] = vec![Use::Call(0, 0)];
    u[1] = vec![Use::Call(0, 0)];
    u[9] = vec![Use::Other("returned")];
    let f = discover(&prog(u), &[0, 1]);
    let want = "the array is returned";
    assert_eq!(f.bails, vec![want]);
}

#[test]
fn bailouts_keep_stack_order() {
    let p = prog(vec![
        vec![Use::Other("a")],
        vec![Use::Other("b")],
    ]);
    let f = discover(&p, &[0, 1]);
    assert_eq!(f.bails, vec![
        "the array is b",
        "the array is a",
    ]);
}`,
    hints: [
      '`one` is a `match u` with one arm per variant; only `Call` returns `Some`. In `discover`, copy the loads into a `Vec` and loop with `while let Some(l) = work.pop()`, then `for u in &p.uses[l]`.',
      'For `Use::Call(f, k)`, return `Some(p.params[*f][*k])`. In `discover`, `HashSet::insert` returns `true` only the first time, so `if seen.insert(v) { work.push(v); }`.',
      '`Use::Other(why)` becomes `format!("the array is {why}")`.',
    ],
    walkthrough: `This is \`shapes_and_uses\` and \`use_of_collection\` from \`analysis.rs\` with the checks taken out. The real code also checks that \`push\` has one argument, that the record is fresh, and that every call site of the function passes this same collection; the model folds that last check into \`Use::Call\`.

- **Why a stack.** \`work.pop()\` takes the last load first, exactly as \`work.pop()\` does in \`analysis.ts\`. In the first test, load 2 is visited first, then 1, then 0, so the pushes come out as \`[11, 10]\`. The reference does the same, which is why parity holds and why chapter 226 saw the *last* push set the shape.
- **Why \`seen\`.** Two call sites mean two \`Call\` uses of the same parameter. Without the set, value 9 is pushed twice, its uses are checked twice, and the bailout appears twice. (The real analyzer also removes duplicate messages at the end, but its \`length_reads\` and \`index_gets\` would still be doubled.)
- **Why return values, in the real code.** \`use_of_collection\` takes \`&mut self\`, and the stack is a local of \`shapes_and_uses\`. Returning \`Option<ValueId>\` lets the caller push, and keeps the method from needing the stack at all.`,
    wrong: [
      {
        code: withOne(`    let mut out = Found::default();
    let mut work = loads.to_vec();
    while !work.is_empty() {
        let l = work.remove(0);
        for u in &p.uses[l] {
            let o = &mut out;
            let next = one(u, p, o);
            let Some(v) = next else {
                continue;
            };
            if !work.contains(&v) {
                work.push(v);
            }
        }
    }
    out`),
        why: 'A queue visits the first load first, so pushes and bailouts come out in the opposite order to the reference’s. And `contains` only looks at what is still waiting, so a parameter already visited is visited again.',
      },
      {
        code: withOne(`    let mut out = Found::default();
    let mut work = loads.to_vec();
    while let Some(l) = work.pop() {
        for u in &p.uses[l] {
            let o = &mut out;
            let next = one(u, p, o);
            if let Some(v) = next {
                work.push(v);
            }
        }
    }
    out`),
        why: 'Without a seen set, a function called with the collection from two places has its parameter checked twice, and every finding inside it is recorded twice.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'In the TS reference, `collectionOfLoad` maps a value to a `Collection` object. What does the Rust port store instead?',
    options: [
      { t: '`Rc<RefCell<Collection>>`', why: 'Nothing in the analyzer is reference-counted.' },
      { t: 'The collection’s index in `self.collections` (a `usize`)', correct: true, why: '`collection_of_load: HashMap<ValueId, usize>`. An index borrows nothing.' },
      { t: 'A `&mut Collection`', why: 'That would keep the `Vec` of collections mutably borrowed for as long as the map exists.' },
    ],
  },
  {
    q: 'Iterating `for u in self.uses.of(l)` and calling `self.bail_somewhere()` (a `&mut self` method) in the body gives which rustc 1.97 error?',
    options: [
      { t: 'E0499: two mutable borrows', why: 'The loop’s borrow is shared, not mutable.' },
      { t: 'E0382: use of moved value', why: 'Nothing is moved.' },
      { t: 'None: rustc sees that `uses` and the method touch different fields', why: 'It can split borrows of fields, but a `&mut self` method call borrows all of `self`.' },
      { t: 'E0502: cannot borrow `*self` as mutable because it is also borrowed as immutable', correct: true, why: 'The port avoids it with `uses_of`, which returns a copy.' },
    ],
  },
  {
    q: 'In `explain` for a program with two pushes of different shapes, the message reads `({x, y} vs {y, x})`, the later push’s shape second. Why?',
    options: [
      { t: 'The worklist pops the last load first, so the later push sets the shape', correct: true, why: 'Both engines pop from the end, and chapter 226 traced the same order in TypeScript.' },
      { t: 'Shapes are sorted alphabetically', why: 'Field order is part of the shape and is never sorted.' },
      { t: 'The pushes are visited in source order', why: 'Then the earlier push would set the shape.' },
    ],
  },
  {
    q: 'When does `use_of_collection` follow a collection into a function’s parameter?',
    options: [
      { t: 'Whenever the collection is an argument of any call', why: 'Only known functions, whose call sites are all visible.' },
      { t: 'For a direct call of a known function, when every call site passes this collection at that position, and the parameter is an SSA value (not captured)', correct: true, why: 'Then it records the parameter in `collection_of_load` and returns it to be pushed.' },
      { t: 'Only for method calls', why: 'Method calls (`note == "method"`) are never followed.' },
    ],
  },
  {
    q: 'What is `seen_param` for?',
    options: [
      { t: 'It detects recursion and bails out', why: 'It doesn’t bail: it just doesn’t follow a parameter a second time.' },
      { t: 'It stops the same parameter being followed twice when the collection reaches it from two call sites', correct: true, why: '`if !seen_param.insert(value) { return None; }`.' },
      { t: 'It records which parameters are numeric', why: 'That is the numeric fixpoint’s job.' },
    ],
  },
  {
    q: 'A binding is stored twice: first `[]`, later another value. What does the collection pass do?',
    options: [
      { t: 'It skips the binding', why: 'It is still a candidate, because one store is an array.' },
      { t: 'It makes it a candidate and bails: “is reassigned (line N), so it may not always hold this array”', correct: true, why: 'With the site of the last store, for `--frames`.' },
      { t: 'It makes two collections', why: 'There is one collection per binding.' },
    ],
  },
];
