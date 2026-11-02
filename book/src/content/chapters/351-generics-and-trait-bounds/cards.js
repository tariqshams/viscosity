// Chapter 351 cards. Keys are stable ids: never rename them.

const ARGMAX_HEAD = `fn argmax<T: PartialOrd>(xs: &[T])
    -> Option<usize> {`;

export const prompts = {
  'gen-what': {
    q: 'What does the `<T>` in `fn first<T>(xs: &[T]) -> Option<&T>` declare?',
    a: 'A type parameter: `first` works for slices of any element type `T`, filled in at each call.',
  },
  'gen-infer': {
    q: 'In `first(&[1, 2])`, who decides that `T` is `i32`?',
    a: 'The compiler, from the argument’s type; you rarely write the type at the call.',
  },
  'gen-impl': {
    q: 'How do you read `impl<T> Pair<T> { ... }`?',
    a: '“For every type `T`, these are methods of `Pair<T>`.”',
  },
  'gen-gc': {
    q: 'drip-rs’s `Gc<T>` is only a `u32` at run time. What does the `T` buy?',
    a: 'Type safety: a `Gc<ObjClosure>` can’t be mixed up with a handle to another kind of object.',
  },
  'bound-what': {
    q: 'What does the bound in `fn top<T: PartialOrd>` allow, and what does it demand?',
    a: 'The body may compare `T`s with `<` and `>`; every caller must pass a type that implements `PartialOrd`.',
  },
  'bound-why': {
    q: 'Why does `x > best` fail to compile in `fn top<T>` with no bound?',
    a: 'The body must work for every `T`, and not every type can be compared (E0369).',
  },
  'bound-where': {
    q: 'How do you ask for two traits, and where do long bounds go?',
    a: 'Join them with `+` (`T: PartialOrd + Copy`), and move long ones into a `where` clause after the signature.',
  },
  'bound-impl': {
    q: 'What does `fn show(p: &impl Plugin)` mean?',
    a: 'The same as `fn show<P: Plugin>(p: &P)`: any type that implements `Plugin`.',
  },
};

export const examples = {
  'bound-play': {
    lang: 'rust',
    title: 'One generic, three element types',
    code: `fn top<T: PartialOrd>(xs: &[T])
    -> Option<&T> {
    let mut best = xs.get(0)?;
    for x in xs {
        if x > best {
            best = x;
        }
    }
    Some(best)
}

fn swap<A, B>(p: (A, B)) -> (B, A) {
    (p.1, p.0)
}

fn main() {
    println!("{:?}", top(&[3, 9, 4]));
    println!("{:?}", top(&["b", "a"]));
    println!("{:?}", top(&[0.5, 2.0]));
    let e: [i32; 0] = [];
    println!("{:?}", top(&e));
    println!("{:?}", swap((1, "one")));
}`,
  },
};

export const exercises = {
  argmax: {
    lang: 'rust',
    title: 'Where is the biggest?',
    prompt:
      'Write `argmax(xs)`: the **index** of the largest element, or `None` for an empty slice. If several elements tie for largest, return the first. It must work for any `T: PartialOrd`: whole numbers, floats and strings. (A profiler does exactly this to find the hottest loop.)',
    starter: `${ARGMAX_HEAD}
    todo!()
}`,
    solution: `${ARGMAX_HEAD}
    let mut best = 0;
    xs.get(0)?;
    for i in 1..xs.len() {
        if xs[i] > xs[best] {
            best = i;
        }
    }
    Some(best)
}`,
    tests: `#[test]
fn integers() {
    assert_eq!(argmax(&[3, 9, 4]), Some(1));
}
#[test]
fn floats_and_strings() {
    assert_eq!(argmax(&[0.5, -1.0]), Some(0));
    let fs = ["vx", "x", "mass"];
    assert_eq!(argmax(&fs), Some(1));
}
#[test]
fn empty_is_none() {
    let e: [i32; 0] = [];
    assert_eq!(argmax(&e), None);
}
#[test]
fn ties_give_the_first() {
    assert_eq!(argmax(&[2, 7, 7, 1]), Some(1));
}`,
    hints: [
      'Keep the *index* of the best element so far, starting at 0, and compare each later element with `xs[best]`.',
      'An empty slice has no index to return. `xs.get(0)?;` returns `None` early in one line (its value is thrown away).',
      'Loop `for i in 1..xs.len()` and use `>`, not `>=`, so that a later equal element does not replace the first.',
    ],
    walkthrough: `**How to think about it.** Do it by hand for \`[2, 7, 7, 1]\`: remember "the best so far is at index 0 (a 2)"; at index 1 a 7 beats it, so remember 1; at index 2 another 7 does not *beat* it, so keep 1; at index 3 a 1 does not either. The answer is 1. You compare elements but return a position, and the only thing the function needs to know about \`T\` is that two of them can be compared, which is exactly what the bound \`T: PartialOrd\` promises.

**The solution, line by line.**

- \`fn argmax<T: PartialOrd>(xs: &[T]) -> Option<usize> {\` takes a borrowed slice of any comparable type, and returns maybe an index.
- \`let mut best = 0;\` assumes, for now, that the first element is the largest.
- \`xs.get(0)?;\` is there only for its early return: on an empty slice \`get(0)\` is \`None\`, and \`?\` returns \`None\` from \`argmax\` (the chapter *Result and the ? operator*). On a non-empty slice the value is thrown away.
- \`for i in 1..xs.len() {\` visits every other index; \`1..n\` counts from 1 up to \`n - 1\`.
- \`if xs[i] > xs[best] { best = i; }\` uses \`>\`, which the bound allows, and moves \`best\` only for a strictly larger element, so ties keep the first.
- \`Some(best)\` wraps the answer.

The compiler checks this body once, against the bound, and then accepts \`argmax\` on \`i32\`, \`f64\` and \`&str\` slices. (How it then compiles those three uses is the next chapter.)

**Common wrong attempts.**

- \`>=\` instead of \`>\`: each later tie replaces the earlier one, so \`[2, 7, 7, 1]\` gives 2.
- Leaving out the bound (\`fn argmax<T>\`) is E0369: \`>\` cannot be applied to \`T\`.
- \`let mut best = xs[0];\` stores the *value*, which moves or copies an element and loses the index you were asked for; and on an empty slice it panics.`,
    wrong: [
      {
        code: `${ARGMAX_HEAD}
    let mut best = 0;
    xs.get(0)?;
    for i in 1..xs.len() {
        if xs[i] >= xs[best] {
            best = i;
        }
    }
    Some(best)
}`,
        why: 'With `>=`, each later tie replaces the earlier one, so `[2, 7, 7, 1]` gives 2 instead of 1.',
      },
      {
        code: `${ARGMAX_HEAD}
    let mut best = 0;
    for i in 1..xs.len() {
        if xs[i] > xs[best] {
            best = i;
        }
    }
    Some(best)
}`,
        why: 'For an empty slice this returns `Some(0)`, an index that does not exist, instead of `None`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: '`fn top<T>(xs: &[T]) -> Option<&T>` compares with `x > best`. What does rustc say?',
    options: [
      { t: 'Nothing: it compiles for any `T`', why: 'That is TypeScript’s behaviour. Rust only lets the body use what every possible `T` can do.' },
      { t: 'E0369: `>` cannot be applied to `&T`, with help suggesting a `PartialOrd` bound', correct: true, why: 'Add `T: PartialOrd` and the body may compare.' },
      { t: 'It compiles, but panics for types that can’t be compared', why: 'Rust checks this before the program runs.' },
    ],
  },
  {
    q: 'With `fn top<T: PartialOrd>`, which call is rejected?',
    options: [
      { t: '`top(&[3, 9, 4])`', why: '`i32` implements `PartialOrd`.' },
      { t: '`top(&["b", "a"])`', why: '`&str` implements `PartialOrd`: strings compare like dictionary words.' },
      { t: '`top(&ps)` where `ps` is an array of a struct with no derives', correct: true, why: 'E0277: can’t compare `P` with `P`; `#[derive(PartialOrd)]` would fix it.' },
    ],
  },
  {
    q: 'Which signature means the same as `fn show(p: &impl Plugin)`?',
    options: [
      { t: '`fn show<P: Plugin>(p: &P)`', correct: true, why: '`impl Trait` in a parameter is short for an anonymous type parameter with that bound.' },
      { t: '`fn show(p: &dyn Plugin)`', why: 'That takes a trait object, a fat pointer with a vtable, which the last chapter described.' },
      { t: '`fn show(p: &Plugin)`', why: 'A trait is not a type on its own (E0782).' },
    ],
  },
  {
    q: 'What does `impl<T> Pair<T> { fn first(&self) -> &T { &self.a } }` give you?',
    options: [
      { t: 'A `first` method only for `Pair<i32>`', why: '`impl<T>` makes it for every `T`.' },
      { t: 'A `first` method on `Pair<T>` for every type `T`', correct: true, why: '“For every `T`, here are methods of `Pair<T>`.”' },
      { t: 'A trait called `Pair`', why: 'It is an ordinary impl block with a type parameter.' },
    ],
  },
  {
    q: 'How do Rust trait bounds differ from TypeScript’s `T extends ...` constraints?',
    options: [
      { t: 'They are the same thing with a different keyword', why: 'TypeScript constraints describe a shape; Rust bounds name traits a type has implemented.' },
      { t: 'TypeScript has no way to constrain a type parameter', why: 'It does, with `extends`.' },
      { t: 'A Rust bound names traits, and the body may use nothing else; TypeScript constrains a shape, and even lets `>` through on a bare `T`', correct: true, why: 'Which is why the TypeScript `top` type-checks without any constraint.' },
    ],
  },
];
