// Chapter 335 cards. Keys are stable ids: never rename them.

export const prompts = {
  'ira-what': {
    q: 'In engine/rust’s VIR, which value owns the instructions?',
    a: 'The `Module`, in its `values: Vec<Inst>` arena. An instruction’s id is its index there.',
  },
  'ira-block': {
    q: 'A TypeScript block’s `insts` is an `Inst[]`. What is a Rust block’s `insts`, and why?',
    a: 'A `Vec<ValueId>`. An `Inst` can have only one owner, and the module already owns it in `values`.',
  },
  'ira-dead': {
    q: 'What happens to a trivial phi’s slot in `values` when the SSA builder removes it?',
    a: 'It stays (as `opaque` with the note `removed-trivial-phi`), so no id moves. It is only taken out of its block, and walks go through blocks.',
  },
  'ira-alias': {
    q: 'TypeScript has `type ValueId = number` and `type BlockId = number`. Can a `BlockId` be passed where a `ValueId` is expected?',
    a: 'Yes, silently: both are just `number`. In Rust they are different newtypes, and it is error E0308.',
  },
  'ira-copy': {
    q: 'How big is a `ValueId`, and why can you pass it around freely?',
    a: '4 bytes, a `u32` in a newtype. It derives `Copy`, so passing it copies the number and borrows nothing.',
  },
  'ira-op': {
    q: 'What replaces the TypeScript `Inst`’s optional fields like `field?` and `binding?`?',
    a: 'The `Op` enum: each variant carries its own data, such as `Op::FieldGet { field }`, so a `match` gets it without a `!` assertion.',
  },
  'ira-use': {
    q: 'What is a `Use` in the Rust VIR?',
    a: '`Use::Inst(ValueId)` for an instruction, or `Use::Term { func, block }` for a terminator: ids, where TypeScript stored object references.',
  },
  'ira-number': {
    q: 'Why does the port format numbers with `js_number` instead of `{}`?',
    a: 'The output must match JavaScript’s `String(x)` byte for byte, and `{}` differs for large and tiny numbers (`1e+21` vs `1000000000000000000000`).',
  },
  'ira-borrow': {
    q: 'Why does the SSA builder take `&mut Module` in each method instead of owning the module?',
    a: 'So a front-end can keep one module and switch between several function builders, one per nested function.',
  },
};

export const examples = {
  'typed-vir': {
    lang: 'rust',
    title: 'Blocks of typed ids',
    code: `use std::fmt;
use std::mem::size_of;

#[derive(Copy, Clone, PartialEq)]
struct ValueId(u32);
#[derive(Copy, Clone, PartialEq)]
struct BlockId(u32);

impl fmt::Debug for ValueId {
    fn fmt(&self,
        f: &mut fmt::Formatter)
        -> fmt::Result {
        write!(f, "%{}", self.0)
    }
}

struct Inst {
    op: &'static str,
    args: Vec<ValueId>,
}

fn mk(op: &'static str, a: &[u32])
    -> Inst {
    let args =
        a.iter().map(|&n| ValueId(n));
    Inst { op, args: args.collect() }
}

struct Module {
    values: Vec<Inst>,
}

impl Module {
    fn inst(&self, v: ValueId)
        -> &Inst {
        &self.values[v.0 as usize]
    }
}

fn main() {
    let m = Module {
        values: vec![
            mk("param", &[]),
            mk("const 1", &[]),
            mk("binop +", &[0, 1]),
        ],
    };
    // block b1 lists ids, not Insts
    let b1 =
        vec![ValueId(1), ValueId(2)];
    for &v in &b1 {
        let i = m.inst(v);
        println!("{:?} = {} {:?}",
            v, i.op, i.args);
    }
    let b = BlockId(1);
    println!("block b{}", b.0);
    // m.inst(b); // try it: E0308
    let n = size_of::<ValueId>();
    println!("a ValueId is {n} bytes");
}`,
  },
};

const TYPES = `#[derive(Copy, Clone, PartialEq, Debug)]
struct V(u32);

impl V {
    fn ix(self) -> usize {
        self.0 as usize
    }
}

struct Inst {
    args: Vec<V>,
}

struct Block {
    insts: Vec<V>,
}

struct Module {
    values: Vec<Inst>,
    blocks: Vec<Block>,
}

// uses(m)[v] = the instructions using
// value v, in program order`;

const SIG = `fn uses(m: &Module) -> Vec<Vec<V>> {`;

export const exercises = {
  useLists: {
    lang: 'rust',
    title: 'Use lists over an arena',
    prompt:
      'Write `uses`, a small `build_uses`. The result has one list per value in `m.values` (dead ones included), and `uses(m)[v]` lists every instruction that has `v` among its `args`, in program order: block by block, instruction by instruction. An instruction that uses `v` twice appears twice, as in the real VIR. Instructions that are in no block are dead and use nothing.',
    starter: `${TYPES}

${SIG}
    todo!()
}`,
    solution: `${TYPES}

${SIG}
    let n = m.values.len();
    let mut u = vec![Vec::new(); n];
    for b in &m.blocks {
        for &i in &b.insts {
            let x = &m.values[i.ix()];
            for &a in &x.args {
                u[a.ix()].push(i);
            }
        }
    }
    u
}`,
    tests: `fn inst(args: &[u32]) -> Inst {
    Inst {
        args: args.iter().map(|&a| V(a)).collect(),
    }
}

// %0 = 1; %1 = 2; %2 = %0 + %1  (b0)
// %3 = %2 * %2                  (b1)
// %4 = %0 + 0: removed, in no block
fn sample() -> Module {
    Module {
        values: vec![
            inst(&[]), inst(&[]), inst(&[0, 1]),
            inst(&[2, 2]), inst(&[0]),
        ],
        blocks: vec![
            Block { insts: vec![V(0), V(1), V(2)] },
            Block { insts: vec![V(3)] },
        ],
    }
}

#[test]
fn one_list_per_value() {
    assert_eq!(uses(&sample()).len(), 5);
}

#[test]
fn records_who_uses_a_value() {
    let u = uses(&sample());
    assert_eq!(u[1], vec![V(2)]);
    assert_eq!(u[3], vec![]);
}

#[test]
fn dead_instructions_use_nothing() {
    assert_eq!(uses(&sample())[0], vec![V(2)]);
}

#[test]
fn a_double_use_appears_twice() {
    assert_eq!(uses(&sample())[2], vec![V(3), V(3)]);
}

#[test]
fn program_order_across_blocks() {
    let mut m = sample();
    // %5 = %0 in b1, after %3
    m.values.push(inst(&[0]));
    m.blocks[1].insts.push(V(5));
    m.blocks.swap(0, 1);
    let u = uses(&m);
    assert_eq!(u[0], vec![V(5), V(2)]);
}`,
    hints: [
      'Start with one empty list per value: `vec![Vec::new(); m.values.len()]` (split it over two lines to fit).',
      'Walk `m.blocks`, not `m.values`: only instructions listed in a block are live, and blocks give the program order.',
      'For each id `i` in a block, look up `m.values[i.ix()]` and push `i` onto the list of each of its `args`. Don’t skip repeats.',
    ],
    walkthrough: `The real \`build_uses\` in \`crates/vir/src/lib.rs\` has the same three loops (plus terminators, which this exercise leaves out).

- **One list per value.** Indexing the result by \`a.ix()\` only works if the outer \`Vec\` has a slot for every id, dead or alive. That is the arena idea again: the use lists are a second arena with the same ids.
- **Walk the blocks.** \`m.values\` also holds instructions that were removed, like the trivial phi in the diagram. They are in no block, so walking blocks skips them for free, and the block order is the program order the analyses rely on.
- **Keep duplicates.** \`%2 * %2\` uses \`%2\` twice, and the TypeScript reference pushes it twice. Parity with \`explain\` depends on details like that, so the port does the same.

Notice what \`uses\` returns: ids, not references into \`m\`. The result doesn't borrow the module, so you could change the module later while keeping the lists.`,
    wrong: [
      {
        code: `${TYPES}

${SIG}
    let n = m.values.len();
    let mut u = vec![Vec::new(); n];
    for (k, x) in
        m.values.iter().enumerate()
    {
        for &a in &x.args {
            u[a.ix()].push(V(k as u32));
        }
    }
    u
}`,
        why: 'Walking `m.values` visits dead instructions too (the removed `%4` shows up as a use of `%0`), and it uses arena order instead of block order.',
      },
      {
        code: `${TYPES}

${SIG}
    let n = m.values.len();
    let mut u = vec![Vec::new(); n];
    for b in &m.blocks {
        for &i in &b.insts {
            let x = &m.values[i.ix()];
            for &a in &x.args {
                let l = &mut u[a.ix()];
                if !l.contains(&i) {
                    l.push(i);
                }
            }
        }
    }
    u
}`,
        why: 'Removing duplicates looks tidy, but `%2 * %2` must list `%3` twice: the reference keeps one entry per operand, and the analyses count them.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'In the TypeScript VIR, `block.insts` and `module.values` both hold instruction objects. Why can’t the Rust port copy that design directly?',
    options: [
      { t: 'Rust has no way to put structs in a `Vec`', why: '`Vec<Inst>` is exactly what `values` is.' },
      { t: 'It would be too slow', why: 'The reason is ownership, not speed.' },
      { t: 'An `Inst` can have only one owner; two `Vec<Inst>` would hold two separate copies', correct: true, why: 'So the module owns the instructions, and blocks list their ids.' },
      { t: 'Blocks are not allowed to contain lists', why: 'A Rust block does contain a list, of `ValueId`s.' },
    ],
  },
  {
    q: 'The SSA builder removes a trivial phi `%4`. What happens to `values[4]`?',
    options: [
      { t: 'It is removed from the `Vec`, and later ids shift down by one', why: 'Then every stored id after 4 would point at the wrong instruction.' },
      { t: 'It stays, marked opaque, and is taken out of its block only', correct: true, why: 'Ids never move. Walks go through blocks, so the dead slot is skipped.' },
      { t: 'It is replaced by the next instruction created', why: 'The arena only grows; slots are not reused.' },
    ],
  },
  {
    q: 'What does `m.inst(BlockId(1))` do in engine/rust?',
    options: [
      { t: 'Returns the instruction at index 1', why: 'That would need a `ValueId`. The types differ, so it doesn’t compile.' },
      { t: 'Panics at run time', why: 'It never runs: it is a type error.' },
      { t: 'Fails to compile with E0308, mismatched types', correct: true, why: '`BlockId` and `ValueId` are different newtypes around `u32`.' },
      { t: 'Converts the block id to a value id automatically', why: 'Rust doesn’t convert between newtypes on its own.' },
    ],
  },
  {
    q: 'A TypeScript `Inst` for `loadBinding` keeps its binding in the optional field `binding?`. Where is it in Rust?',
    options: [
      { t: 'In `Op::LoadBinding { binding }`, the variant itself', correct: true, why: 'Each `Op` variant carries the data that op needs, so a `match` hands it to you.' },
      { t: 'In an `Option<BindingId>` field on every `Inst`', why: 'That would copy the TypeScript design. The port puts it in the variant instead.' },
      { t: 'In a separate `HashMap` from instruction to binding', why: 'No such map exists; the data lives in the `Op`.' },
    ],
  },
  {
    q: 'Why is `js_number(-0.0)` `"0"` while drip-rs’s `format_number(-0.0)` is `"-0"`?',
    options: [
      { t: 'Viscosity has no negative numbers', why: 'It does; `-1.5` prints as `-1.5`.' },
      { t: 'One of them has a bug', why: 'Both match what their own reference prints.' },
      { t: 'Rust can’t represent negative zero', why: '`-0.0` is a real `f64`; both functions test for it.' },
      { t: 'Each matches its own TypeScript reference: Viscosity uses JavaScript’s `String(x)`, which prints `0`, and Drip’s VM prints `-0`', correct: true, why: 'Parity means matching the reference, quirks included.' },
    ],
  },
  {
    q: 'What does a `Use` hold in the Rust VIR?',
    options: [
      { t: 'A reference `&Inst` to the using instruction', why: 'That would borrow the module for as long as the use list lives.' },
      { t: 'Ids: `Use::Inst(ValueId)` or `Use::Term { func, block }`', correct: true, why: 'Ids keep the use lists independent of the module’s borrows.' },
      { t: 'A copy of the using instruction', why: 'Copies would go stale as soon as the module changed.' },
    ],
  },
];
