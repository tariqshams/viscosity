// Chapter 285 cards. Keys are stable ids: never rename them.

// The design traits, shared by the exercises. (engine/rust has no such
// traits: this is the chapter's design, not the port's code.)
const TRAITS = `// Facts, ordered. top() is the
// optimistic start, bottom() claims
// nothing, and meet() is the highest
// fact below both.
pub trait Lattice: Clone + PartialEq {
    fn top() -> Self;
    fn bottom() -> Self;
    fn meet(&self, o: &Self) -> Self;
}

// A sparse problem: one fact per node.
pub trait Problem {
    type Fact: Lattice;
    fn len(&self) -> usize;
    // The nodes whose facts n reads.
    fn deps(&self, n: usize)
        -> Vec<usize>;
    // n's fact, from the facts so far.
    fn transfer(
        &self,
        n: usize,
        f: &[Self::Fact],
    ) -> Self::Fact;
}
`;

const SOLVE_HEAD = `
// The users of each node: who reads it.
fn users<P: Problem>(
    p: &P,
) -> Vec<Vec<usize>> {
    let mut us = vec![vec![]; p.len()];
    for v in 0..p.len() {
        for d in p.deps(v) {
            us[d].push(v);
        }
    }
    us
}

pub fn solve<P: Problem>(
    p: &P,
) -> Vec<P::Fact> {
    let us = users(p);
    let n = p.len();
    let mut f = vec![P::Fact::top(); n];
    // A stack: pop takes node 0 first.
    let mut work: Vec<usize> =
        (0..n).rev().collect();
    let mut queued = vec![true; n];
`;

const solveWith = (body) => `${TRAITS}${SOLVE_HEAD}${body}`;

const SOLUTION_BODY = `    while let Some(v) = work.pop() {
        queued[v] = false;
        let t = p.transfer(v, &f);
        // Clamp: facts only go down.
        let new = t.meet(&f[v]);
        if new == f[v] {
            continue;
        }
        f[v] = new;
        for &u in &us[v] {
            if !queued[u] {
                queued[u] = true;
                work.push(u);
            }
        }
    }
    f
}`;

const TESTS = `impl Lattice for bool {
    fn top() -> Self {
        true
    }
    fn bottom() -> Self {
        false
    }
    fn meet(&self, o: &Self) -> Self {
        *self && *o
    }
}

// A tiny SSA graph.
enum N {
    Num(i64),
    Str,
    Add(usize, usize),
    Phi(Vec<usize>),
}

fn deps_of(n: &N) -> Vec<usize> {
    match n {
        N::Add(a, b) => vec![*a, *b],
        N::Phi(xs) => xs.clone(),
        _ => vec![],
    }
}

// "Is it a number?"
struct G(Vec<N>);

impl Problem for G {
    type Fact = bool;
    fn len(&self) -> usize {
        self.0.len()
    }
    fn deps(&self, n: usize)
        -> Vec<usize>
    {
        deps_of(&self.0[n])
    }
    fn transfer(
        &self,
        n: usize,
        f: &[bool],
    ) -> bool {
        match &self.0[n] {
            N::Num(_) => true,
            N::Str => false,
            N::Add(a, b) => {
                f[*a] && f[*b]
            }
            N::Phi(xs) => {
                xs.iter().all(|&x| f[x])
            }
        }
    }
}

#[test]
fn a_counting_loop_stays_numeric() {
    // %0 = 0; %1 = phi %0, %3
    // %2 = 1; %3 = %1 + %2
    let g = G(vec![
        N::Num(0),
        N::Phi(vec![0, 3]),
        N::Num(1),
        N::Add(1, 2),
    ]);
    let all = vec![true; 4];
    assert_eq!(solve(&g), all);
}

#[test]
fn doubt_travels_round_the_loop() {
    // %3 = %1 + "!": the phi %1 is
    // done first, so it must be redone.
    let g = G(vec![
        N::Num(0),
        N::Phi(vec![0, 3]),
        N::Str,
        N::Add(1, 2),
    ]);
    assert_eq!(
        solve(&g),
        vec![true, false, false, false]
    );
}

// "Which constant is it?"
#[derive(Clone, PartialEq, Debug)]
enum C {
    Top,
    K(i64),
    Varies,
}

impl Lattice for C {
    fn top() -> Self {
        C::Top
    }
    fn bottom() -> Self {
        C::Varies
    }
    fn meet(&self, o: &Self) -> Self {
        match (self, o) {
            (C::Top, x)
            | (x, C::Top) => x.clone(),
            (C::K(a), C::K(b))
                if a == b =>
            {
                C::K(*a)
            }
            _ => C::Varies,
        }
    }
}

fn add(a: &C, b: &C) -> C {
    match (a, b) {
        (C::K(x), C::K(y)) => {
            C::K(x + y)
        }
        (C::Top, _) | (_, C::Top) => {
            C::Top
        }
        _ => C::Varies,
    }
}

struct K(Vec<N>);

impl Problem for K {
    type Fact = C;
    fn len(&self) -> usize {
        self.0.len()
    }
    fn deps(&self, n: usize)
        -> Vec<usize>
    {
        deps_of(&self.0[n])
    }
    fn transfer(
        &self,
        n: usize,
        f: &[C],
    ) -> C {
        match &self.0[n] {
            N::Num(k) => C::K(*k),
            N::Str => C::Varies,
            N::Add(a, b) => {
                add(&f[*a], &f[*b])
            }
            N::Phi(xs) => xs
                .iter()
                .fold(C::Top, |m, &x| {
                    m.meet(&f[x])
                }),
        }
    }
}

#[test]
fn the_same_solver_folds_constants() {
    // %2 = %0 + %1 = 1 + 1
    let k = K(vec![
        N::Num(1),
        N::Num(1),
        N::Add(0, 1),
        N::Phi(vec![2, 2]),
    ]);
    assert_eq!(solve(&k)[3], C::K(2));
}

#[test]
fn a_loop_counter_varies() {
    let k = K(vec![
        N::Num(0),
        N::Phi(vec![0, 3]),
        N::Num(1),
        N::Add(1, 2),
    ]);
    assert_eq!(solve(&k)[1], C::Varies);
}`;

export const prompts = {
  'gd-what': {
    q: 'What is a **generic dataflow framework**?',
    a: 'One solver, written once, that works for any analysis supplying a lattice of facts and a transfer function per node.',
  },
  'gd-no-framework': {
    q: 'Does engine/rust have a generic dataflow framework?',
    a: 'No. It has one fixpoint, the numeric-kind analysis in `analysis.rs`, written directly over its own state.',
  },
  'gd-assoc': {
    q: 'Why is the fact type an associated type (`type Fact`) of `Problem` rather than a type parameter?',
    a: 'Each problem has exactly one fact type, so the solver can name it as `P::Fact` without a second parameter.',
  },
  'gd-mono': {
    q: 'What does `solve::<G>` cost compared with a hand-written solver for `G`?',
    a: 'Nothing extra at run time: it is monomorphized, so `transfer` and `meet` are direct calls rustc can inline.',
  },
  'gd-clamp': {
    q: 'Why does the design solver store `transfer(..).meet(&old)` instead of the transfer’s result?',
    a: 'So each fact can only move down. With a lattice of finite height, the worklist must then empty, whatever the transfer does.',
  },
  'gd-queued': {
    q: 'What is `queued` for in the worklist solver?',
    a: 'It keeps a node on the stack at most once. Without resetting it on pop, a node could never be queued again.',
  },
  'gd-rounds': {
    q: 'How does Viscosity’s real fixpoint visit values?',
    a: 'In whole rounds, every value in id order, updating facts in place (Gauss–Seidel), then bindings, then collection fields.',
  },
  'gd-converged': {
    q: 'When does the real fixpoint count as converged?',
    a: 'When a whole round changes no fact. A round that merely reaches the right answer is not enough: one more must confirm it.',
  },
  'gd-fail-closed': {
    q: 'What happens if the numeric fixpoint has not converged after `MAX_ROUNDS` (1000) rounds?',
    a: 'It fails closed: every value, int and field fact is reset to false, so nothing is proven numeric.',
  },
  'gd-rise': {
    q: 'Why can a fact in the real fixpoint go *up* in round one?',
    a: 'Non-cyclic values start from their rule, reading values not yet computed as `false`. When those are computed, the first value is recomputed and can rise.',
  },
  'gd-python': {
    q: 'For Python, what lattice does the real fixpoint use per value?',
    a: 'A pair of booleans, “is a float” and “is an int”: two two-point lattices side by side (a product).',
  },
  'gd-nodes': {
    q: 'Besides SSA values, which nodes does the real fixpoint have facts for?',
    a: 'Bindings (all stores numeric?) and each field of each collection (every record and field write numeric?).',
  },
};

export const examples = {
  'rounds-play': {
    lang: 'rust',
    title: 'Rounds, a budget, and failing closed',
    code: `trait Lattice: Clone + PartialEq {
    fn top() -> Self;
    fn bottom() -> Self;
    fn meet(&self, o: &Self) -> Self;
}

trait Problem {
    type Fact: Lattice;
    fn len(&self) -> usize;
    fn transfer(
        &self,
        n: usize,
        f: &[Self::Fact],
    ) -> Self::Fact;
}

impl Lattice for bool {
    fn top() -> Self {
        true
    }
    fn bottom() -> Self {
        false
    }
    fn meet(&self, o: &Self) -> Self {
        *self && *o
    }
}

// Viscosity's strategy: whole rounds
// in id order, updating in place.
// Returns the facts and the number of
// the first round that changed nothing.
fn rounds<P: Problem>(
    p: &P,
    max_rounds: usize,
) -> Option<(Vec<P::Fact>, usize)> {
    let n = p.len();
    let mut f = vec![P::Fact::top(); n];
    for r in 1..=max_rounds {
        let mut changed = false;
        for v in 0..n {
            let new = p.transfer(v, &f);
            if new != f[v] {
                f[v] = new;
                changed = true;
            }
        }
        if !changed {
            return Some((f, r));
        }
    }
    None
}

// Fail closed: no fixpoint, no facts.
fn facts<P: Problem>(
    p: &P,
    max_rounds: usize,
) -> Vec<P::Fact> {
    match rounds(p, max_rounds) {
        Some((f, r)) => {
            println!("  quiet: {r}");
            f
        }
        None => {
            println!("  out of rounds");
            let b = P::Fact::bottom();
            vec![b; p.len()]
        }
    }
}

enum N {
    Num,
    Str,
    Add(usize, usize),
    Phi(usize, usize),
}

struct G(Vec<N>);

impl Problem for G {
    type Fact = bool;
    fn len(&self) -> usize {
        self.0.len()
    }
    fn transfer(
        &self,
        n: usize,
        f: &[bool],
    ) -> bool {
        match self.0[n] {
            N::Num => true,
            N::Str => false,
            N::Add(a, b) => {
                f[a] && f[b]
            }
            N::Phi(a, b) => {
                f[a].meet(&f[b])
            }
        }
    }
}

fn main() {
    // %0 = 0    %1 = phi %0, %3
    // %2 = "!"  %3 = %1 + %2
    let g = G(vec![
        N::Num,
        N::Phi(0, 3),
        N::Str,
        N::Add(1, 2),
    ]);
    for budget in [1000, 2, 0] {
        println!("budget {budget}:");
        let f = facts(&g, budget);
        println!("  {f:?}");
    }
}
`,
  },
};

export const exercises = {
  solver: {
    lang: 'rust',
    title: 'A worklist solver, generic over the lattice',
    prompt:
      'Finish `solve`, the design’s generic worklist solver. Every fact starts at `top()` and every node starts on the stack `work` (so `pop` takes node 0 first). Pop a node, mark it not queued, and compute `transfer(v, &f).meet(&f[v])`, so a fact can only go down. If that differs from `f[v]`, store it and push each user of `v` that isn’t already queued. Return the facts when the stack is empty. The tests run the same solver on two lattices: “is it a number?” and “which constant is it?”.',
    starter: solveWith(`    todo!()
}`),
    solution: solveWith(SOLUTION_BODY),
    tests: TESTS,
    hints: [
      'The loop is `while let Some(v) = work.pop() { ... }`, and the first line inside it is `queued[v] = false;`.',
      'Compute `let new = p.transfer(v, &f).meet(&f[v]);`. If `new == f[v]` nothing changed: `continue`.',
      'Otherwise store `f[v] = new` and, for each `u` in `us[v]` with `!queued[u]`, set `queued[u] = true` and `work.push(u)`.',
    ],
    walkthrough: `The solver never looks inside a fact. It only calls \`top\`, \`meet\`, \`==\` and \`transfer\`, which is why one copy works for \`bool\` and for the constant lattice \`C\`. rustc makes a copy of \`solve\` for each problem type (monomorphization), so the generic version costs nothing at run time.

- **Why requeue the users.** In \`doubt_travels_round_the_loop\`, the phi \`%1\` is popped before \`%3\` becomes maybe-not. When \`%3\` changes, \`%1\` is one of its users, so it goes back on the stack and is redone with the new fact.
- **Why reset \`queued\` on pop.** \`queued\` means “on the stack now”. If you never clear it, a node popped once can never come back, and the loop phi keeps its stale fact.
- **Why \`meet(&f[v])\`.** It clamps: the stored fact is never above the old one. Each change moves a fact down the lattice, and \`C\` has height 3, so each node changes at most twice. That bounds the work no matter what order things happen in.

On \`a_loop_counter_varies\` the phi first meets \`K(0)\` with \`Top\` and becomes \`K(0)\`. Then \`%3\` is \`K(1)\`, so the phi becomes \`K(0) ⊓ K(1)\`, which is \`Varies\`, and so does \`%3\`.`,
    wrong: [
      {
        code: solveWith(`    while let Some(v) = work.pop() {
        let t = p.transfer(v, &f);
        let new = t.meet(&f[v]);
        if new == f[v] {
            continue;
        }
        f[v] = new;
        for &u in &us[v] {
            if !queued[u] {
                queued[u] = true;
                work.push(u);
            }
        }
    }
    f
}`),
        why: '`queued[v]` is never cleared, so once a node has been popped it counts as queued forever. When `%3` changes, the phi `%1` is not pushed again and keeps “number”.',
      },
      {
        code: solveWith(`    while let Some(v) = work.pop() {
        queued[v] = false;
        let t = p.transfer(v, &f);
        f[v] = t.meet(&f[v]);
    }
    f
}`),
        why: 'One visit per node, in order, never revisits a node whose input changed later. That is one round, not a fixpoint: the loop phi is computed before the doubt reaches it.',
      },
    ],
  },
  product: {
    lang: 'rust',
    optional: true,
    title: 'A product lattice for Python',
    prompt:
      'Python’s numeric fixpoint keeps two facts per value: “is a float” and “is an int”. Implement `Lattice` for any pair `(A, B)` of lattices, component by component: `top` is both tops, `bottom` both bottoms, and `meet` meets each side.',
    starter: `${TRAITS}
impl<A: Lattice, B: Lattice> Lattice
    for (A, B)
{
    fn top() -> Self {
        todo!()
    }
    fn bottom() -> Self {
        todo!()
    }
    fn meet(&self, o: &Self) -> Self {
        todo!()
    }
}`,
    solution: `${TRAITS}
impl<A: Lattice, B: Lattice> Lattice
    for (A, B)
{
    fn top() -> Self {
        (A::top(), B::top())
    }
    fn bottom() -> Self {
        (A::bottom(), B::bottom())
    }
    fn meet(&self, o: &Self) -> Self {
        (
            self.0.meet(&o.0),
            self.1.meet(&o.1),
        )
    }
}`,
    tests: `impl Lattice for bool {
    fn top() -> Self {
        true
    }
    fn bottom() -> Self {
        false
    }
    fn meet(&self, o: &Self) -> Self {
        *self && *o
    }
}

// (is a float, is an int)
type Py = (bool, bool);

#[test]
fn top_is_both_tops() {
    assert_eq!(Py::top(), (true, true));
}

#[test]
fn bottom_is_both_bottoms() {
    let b = Py::bottom();
    assert_eq!(b, (false, false));
}

#[test]
fn meet_is_per_side() {
    let float = (true, false);
    let int = (false, true);
    let m = float.meet(&int);
    assert_eq!(m, (false, false));
    let t = Py::top();
    assert_eq!(t.meet(&int), int);
}

#[test]
fn pairs_nest() {
    let a = ((true, true), false);
    let b = ((true, false), false);
    let m = a.meet(&b);
    let want = ((true, false), false);
    assert_eq!(m, want);
}`,
    hints: [
      'Inside the impl, `A::top()` and `B::top()` are the two tops.',
      '`self.0` and `self.1` are the two sides; meet each with the matching side of `o`.',
    ],
    walkthrough: `A product lattice orders pairs side by side: one pair is below another when each side is. So the top is both tops, and \`meet\` works on each side on its own. Because the impl is generic over \`A\` and \`B\`, pairs nest for free: \`((bool, bool), bool)\` is a lattice too, as the last test checks.

That is the shape of Python’s fixpoint in \`analysis.rs\`: \`num\` and \`int\` are two \`Vec<bool>\`s, one per side of the pair, and every round updates both. A value can be neither (a string), one or the other, but not both, though the lattice itself doesn’t know that.`,
    wrong: [
      {
        code: `${TRAITS}
impl<A: Lattice, B: Lattice> Lattice
    for (A, B)
{
    fn top() -> Self {
        (A::top(), B::top())
    }
    fn bottom() -> Self {
        (A::bottom(), B::bottom())
    }
    fn meet(&self, o: &Self) -> Self {
        if self == o {
            self.clone()
        } else {
            Self::bottom()
        }
    }
}`,
        why: 'Pairs that differ are not always unrelated: `top` met with `(false, true)` is `(false, true)`, not bottom. Meet each side separately.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'What does engine/rust’s `analysis.rs` use to compute numeric kinds?',
    options: [
      { t: 'A generic `Problem` trait and a shared worklist solver', why: 'That is this chapter’s design. The port has no such trait.' },
      { t: 'An optimistic fixpoint, run in rounds over values, bindings and fields, capped at `MAX_ROUNDS` = 1000', correct: true, why: '`numeric_inference` in `analysis.rs`, a port of the same loop in `analysis.ts`.' },
      { t: 'A single pass in reverse postorder', why: 'One pass can’t settle facts that depend on themselves round a loop.' },
    ],
  },
  {
    q: 'The fixpoint runs out of rounds without a quiet round. What does it report?',
    options: [
      { t: 'Whatever facts it had after the last round', why: 'Those may still be wrong: a fact might have been about to drop.' },
      { t: 'A compile error', why: 'It does not fail the compile. It just proves nothing.' },
      { t: 'Nothing is numeric: all value, int and field facts are reset to false', correct: true, why: 'Failing closed. A unit test runs it with a budget of 0 rounds and checks that no value is a number.' },
    ],
  },
  {
    q: 'In the design, why is `solve` generic (`solve<P: Problem>`) rather than taking `&dyn Problem`?',
    options: [
      { t: '`Problem` has an associated type, and the solver needs to make a `Vec<P::Fact>`', correct: true, why: 'With a generic the fact type is known statically, and monomorphization makes calls to `transfer` and `meet` direct.' },
      { t: 'Trait objects can’t have methods', why: 'They can; they are called through a vtable.' },
      { t: 'Generics are checked at run time', why: 'They are compiled away: one copy per concrete type.' },
    ],
  },
  {
    q: 'Your design solver clamps: it stores `transfer(..).meet(&old)`. What does that guarantee?',
    options: [
      { t: 'The most precise answer for any transfer function', why: 'Clamping guarantees an end, not precision.' },
      { t: 'Each fact only moves down, so with a lattice of finite height the worklist empties', correct: true, why: 'Each node can change at most height − 1 times, and each change adds a bounded number of users.' },
      { t: 'Nodes are visited in id order', why: 'Order is decided by the worklist, not by the clamp.' },
    ],
  },
  {
    q: 'Which part of the real fixpoint already behaves like the clamp?',
    options: [
      { t: 'The value facts `num` and `int`', why: 'Those are recomputed from scratch each round and may rise in round one.' },
      { t: 'The `MAX_ROUNDS` check', why: 'That bounds the rounds; it doesn’t clamp facts.' },
      { t: 'The binding and field facts, which are `old && all stores numeric`', correct: true, why: 'Once false, `binding_numeric` and `col_numeric` can never become true again.' },
    ],
  },
  {
    q: 'With a budget of 2 rounds, the example’s rounds solver has the right facts after round 2, yet fails closed. Why?',
    options: [
      { t: 'Round 2 still changed a fact, so convergence was never confirmed', correct: true, why: 'Only a round with no change proves a fixpoint. The real loop works the same way.' },
      { t: 'Two rounds are below some minimum', why: 'There is no minimum; a problem with no cycles is stable in round 1.' },
      { t: 'The phi needs three operands', why: 'It has two.' },
      { t: 'Rounds solvers can’t handle loops', why: 'They can. With a budget of 1000 the same problem is stable in round 3.' },
    ],
  },
];
