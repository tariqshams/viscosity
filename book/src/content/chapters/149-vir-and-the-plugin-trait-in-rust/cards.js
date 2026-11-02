// Chapter 149 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'ira-what': {
    q: 'In engine/rust’s VIR, which value owns the instructions?',
    a: 'The `Module`, in its `values: Vec<Inst>` arena. An instruction’s id is its index there.',
  },
  'ira-dead': {
    q: 'What happens to a trivial phi’s slot in `values` when the SSA builder removes it?',
    a: 'It stays (as `opaque` with the note `removed-trivial-phi`), so no id moves. It is only taken out of its block, and walks go through blocks.',
  },
  'ira-alias': {
    q: 'TypeScript has `type ValueId = number` and `type BlockId = number`. Can a `BlockId` be passed where a `ValueId` is expected?',
    a: 'Yes, silently: both are just `number`. In Rust they are different newtypes, and it is error E0308.',
  },
  'pt-extra': {
    q: 'What is `type Extra;` in the `LanguagePlugin` trait?',
    a: 'An associated type: each plugin chooses it, for the data its `lower` passes to its `emit`.',
  },
  'pt-mixup': {
    q: 'You pass the Python plugin’s lowered module to `JsPlugin.emit`. What happens in TypeScript, and in Rust?',
    a: 'TypeScript accepts it (the cast `as JsLowered` isn’t checked) and it returned `undefined`. Rust rejects it: E0308, expected `LoweredModule<JsExtra>`, found `LoweredModule<PyExtra>`.',
  },
  'pt-e0191': {
    q: 'What does E0191 say about `Vec<&dyn LanguagePlugin>`?',
    a: 'The value of the associated type `Extra` must be specified: a trait object has to name every associated type.',
  },
  'pt-branch': {
    q: 'How do the CLI and the wasm crate choose a plugin at run time without trait objects?',
    a: 'They branch first (on the extension or the language name) and call `compile` with a different plugin in each arm. Both arms return `Result<CompileResult, CompileError>`.',
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
  'mono-pick': {
    lang: 'rust',
    title: 'Branch first, then call the generic',
    code: `trait Plugin {
    type Extra;
    fn lower(&self, s: &str)
        -> Self::Extra;
    fn emit(&self, s: &str,
        x: &Self::Extra) -> String;
}

struct Js;
struct Py;

impl Plugin for Js {
    // the number of lines
    type Extra = usize;
    fn lower(&self, s: &str) -> usize {
        s.lines().count()
    }
    fn emit(&self, s: &str, n: &usize)
        -> String {
        format!("// {n} lines\\n{s}")
    }
}

impl Plugin for Py {
    // the first line
    type Extra = String;
    fn lower(&self, s: &str) -> String {
        let f = s.lines().next();
        f.unwrap_or("").to_string()
    }
    fn emit(&self, s: &str, f: &String)
        -> String {
        format!("# starts {f:?}\\n{s}")
    }
}

// one copy per P: compile::<Js>,
// compile::<Py>
fn compile<P: Plugin>(s: &str, p: &P)
    -> String {
    let x = p.lower(s);
    p.emit(s, &x)
}

fn main() {
    let src = "xs = []\\nys = []";
    for f in ["a.js", "b.py"] {
        let py = f.ends_with(".py");
        // both arms return a String
        let out = if py {
            compile(src, &Py)
        } else {
            compile(src, &Js)
        };
        println!("{f}:\\n{out}\\n");
    }
}`,
  },
};

export const exercises = {
  useLists: {
    optional: true,
    lang: 'rust',
    title: 'Use lists over an arena',
    prompt: 'Write `uses`, a small `build_uses`. The result has one list per value in `m.values` (dead ones included), and `uses(m)[v]` lists every instruction that has `v` among its `args`, in program order: block by block, instruction by instruction. An instruction that uses `v` twice appears twice, as in the real VIR. Instructions that are in no block are dead and use nothing.',
    starter: `#[derive(Copy, Clone, PartialEq, Debug)]
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
// value v, in program order

fn uses(m: &Module) -> Vec<Vec<V>> {
    todo!()
}`,
    solution: `#[derive(Copy, Clone, PartialEq, Debug)]
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
// value v, in program order

fn uses(m: &Module) -> Vec<Vec<V>> {
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
    walkthrough: `**How to think about it.** The answer is indexed by value id, so it must have one slot for *every* id, dead ones included, or \`u[a.ix()]\` would run off the end. Then ask which instructions count: only those listed in a block are live, and the block order is the program order the tests ask for. So walk the blocks, not \`m.values\`. Finally, the rule "a double use appears twice" means you push once per operand and never check for repeats.

**The solution, line by line.**

- \`let n = m.values.len();\` is the number of ids, live or dead.
- \`let mut u = vec![Vec::new(); n];\` makes \`n\` empty lists, one per id. (\`vec![x; n]\` clones \`x\` \`n\` times; the element type, \`Vec<V>\`, is worked out from the return type.)
- \`for b in &m.blocks {\` visits the blocks in order, borrowing each.
- \`for &i in &b.insts {\` visits the ids in the block; the \`&i\` pattern copies the \`V\` out, which is fine because \`V\` is \`Copy\`.
- \`let x = &m.values[i.ix()];\` follows the id into the arena: this is \`m.inst(i)\`.
- \`for &a in &x.args {\` visits each operand of that instruction, repeats included.
- \`u[a.ix()].push(i);\` records "instruction \`i\` uses value \`a\`" in \`a\`'s list.
- \`u\` returns the lists.

For the sample, \`%2 = %0 + %1\` pushes \`%2\` onto the lists of \`%0\` and \`%1\`; \`%3 = %2 * %2\` pushes \`%3\` twice onto the list of \`%2\`; and the dead \`%4\` is in no block, so it is never visited and \`%0\`'s list stays \`[%2]\`.

**Common wrong attempts.**

- Walking \`m.values\` with \`enumerate\` visits dead instructions (the removed \`%4\` shows up as a use of \`%0\`) and uses creation order rather than block order.
- Skipping an id that is already in the list looks tidy, but the reference keeps one entry per operand, and the analyses count them.

The real \`build_uses\` in \`crates/vir/src/lib.rs\` has these same three loops, plus one more step per block for its terminator. Notice that \`uses\` returns ids, not references into \`m\`: the result does not borrow the module, so you could change the module later and keep the lists.`,
    wrong: [
      {
        code: `#[derive(Copy, Clone, PartialEq, Debug)]
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
// value v, in program order

fn uses(m: &Module) -> Vec<Vec<V>> {
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
        code: `#[derive(Copy, Clone, PartialEq, Debug)]
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
// value v, in program order

fn uses(m: &Module) -> Vec<Vec<V>> {
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
  anyPlugin: {
    lang: 'rust',
    title: 'Erase Extra behind a second trait',
    prompt: '`Plugin` has an associated type, so `&dyn Plugin` is E0191. Hide it: implement `AnyPlugin` for **every** `P: Plugin` at once. `handles` is true when the file name ends with one of the plugin’s extensions; `compile` runs `lower`, then `emit` with what `lower` returned. Then write `pick`, which returns the plugin that handles the file, or `None` if no plugin does.',
    starter: `trait Plugin {
    type Extra;
    fn exts(&self)
        -> &'static [&'static str];
    fn lower(&self, s: &str)
        -> Self::Extra;
    fn emit(&self, s: &str,
        x: &Self::Extra) -> String;
}

struct Js;
struct Py;

impl Plugin for Js {
    type Extra = usize;
    fn exts(&self)
        -> &'static [&'static str] {
        &[".js", ".mjs"]
    }
    fn lower(&self, s: &str) -> usize {
        s.lines().count()
    }
    fn emit(&self, _: &str, n: &usize)
        -> String {
        format!("js {n}")
    }
}

impl Plugin for Py {
    type Extra = String;
    fn exts(&self)
        -> &'static [&'static str] {
        &[".py"]
    }
    fn lower(&self, s: &str) -> String {
        s.to_uppercase()
    }
    fn emit(&self, _: &str, u: &String)
        -> String {
        format!("py {u}")
    }
}

// Plugin with Extra hidden. No
// associated type, so &dyn works.
trait AnyPlugin {
    fn handles(&self, file: &str)
        -> bool;
    fn compile(&self, src: &str)
        -> String;
}

impl<P: Plugin> AnyPlugin for P {
    fn handles(&self, file: &str)
        -> bool {
        todo!()
    }
    fn compile(&self, src: &str)
        -> String {
        todo!()
    }
}

fn pick(file: &str)
    -> Option<&'static dyn AnyPlugin> {
    todo!()
}`,
    solution: `trait Plugin {
    type Extra;
    fn exts(&self)
        -> &'static [&'static str];
    fn lower(&self, s: &str)
        -> Self::Extra;
    fn emit(&self, s: &str,
        x: &Self::Extra) -> String;
}

struct Js;
struct Py;

impl Plugin for Js {
    type Extra = usize;
    fn exts(&self)
        -> &'static [&'static str] {
        &[".js", ".mjs"]
    }
    fn lower(&self, s: &str) -> usize {
        s.lines().count()
    }
    fn emit(&self, _: &str, n: &usize)
        -> String {
        format!("js {n}")
    }
}

impl Plugin for Py {
    type Extra = String;
    fn exts(&self)
        -> &'static [&'static str] {
        &[".py"]
    }
    fn lower(&self, s: &str) -> String {
        s.to_uppercase()
    }
    fn emit(&self, _: &str, u: &String)
        -> String {
        format!("py {u}")
    }
}

// Plugin with Extra hidden. No
// associated type, so &dyn works.
trait AnyPlugin {
    fn handles(&self, file: &str)
        -> bool;
    fn compile(&self, src: &str)
        -> String;
}

impl<P: Plugin> AnyPlugin for P {
    fn handles(&self, file: &str)
        -> bool {
        self.exts()
            .iter()
            .any(|e| file.ends_with(e))
    }
    fn compile(&self, src: &str)
        -> String {
        let x = self.lower(src);
        self.emit(src, &x)
    }
}

fn pick(file: &str)
    -> Option<&'static dyn AnyPlugin> {
    let all: [&dyn AnyPlugin; 2] =
        [&Js, &Py];
    all.into_iter()
        .find(|p| p.handles(file))
}`,
    tests: `#[test]
fn compile_runs_lower_then_emit() {
    assert_eq!(Js.compile("x\\ny"), "js 2");
    assert_eq!(Py.compile("xs = []"), "py XS = []");
}

#[test]
fn one_vec_holds_both() {
    let ps: Vec<&dyn AnyPlugin> = vec![&Js, &Py];
    let n = ps.iter().filter(|p| p.handles("x.js")).count();
    assert_eq!(n, 1);
}

#[test]
fn picks_by_extension() {
    let js = pick("a.mjs").unwrap();
    assert_eq!(js.compile(""), "js 0");
    let py = pick("b.py").unwrap();
    assert_eq!(py.compile("p"), "py P");
}

#[test]
fn unknown_files_get_none() {
    assert!(pick("c.rb").is_none());
    assert!(pick("notes.json").is_none());
}`,
    hints: [
      'A blanket impl, `impl<P: Plugin> AnyPlugin for P`, gives every plugin an `AnyPlugin` impl. Inside it you may call `Plugin` methods on `self`.',
      'In `compile`, keep the `Extra` in a local: `let x = self.lower(src);`, then `self.emit(src, &x)`. Its type is `P::Extra`, known inside each copy, and it never escapes.',
      'For `pick`, put `&Js` and `&Py` in an array of `&dyn AnyPlugin` and use `.into_iter().find(...)`. Use `ends_with`, not `contains`.',
    ],
    walkthrough: `**How to think about it.** \`&dyn Plugin\` fails because callers through a trait object would have to know \`Extra\`. So design a trait whose methods never mention \`Extra\`: \`compile\` takes text and returns text, the same types for every plugin. Then connect the two traits once, for every plugin, with a *blanket impl* (an \`impl\` that is generic over the type it implements for). Inside it, \`Extra\` is known again, because each copy is made for one concrete plugin.

**The solution, line by line.**

- \`impl<P: Plugin> AnyPlugin for P {\` says: for any type \`P\` that implements \`Plugin\`, here is its \`AnyPlugin\` impl. The compiler makes one copy for \`Js\` and one for \`Py\`, as it does for \`compile<P: LanguagePlugin>\`.
- \`fn handles(&self, file: &str) -> bool {\` asks whether this plugin takes the file.
- \`self.exts().iter().any(|e| file.ends_with(e))\` calls the \`Plugin\` method \`exts\` on \`self\` (allowed, because \`P: Plugin\`), walks the extensions, and is true as soon as one is at the end of the file name.
- \`fn compile(&self, src: &str) -> String {\` is the dyn-friendly entry point.
- \`let x = self.lower(src);\` keeps the plugin's private data in a local. Its type is \`P::Extra\`: \`usize\` in the copy for \`Js\`, \`String\` in the copy for \`Py\`.
- \`self.emit(src, &x)\` hands it straight to the same plugin's \`emit\` and returns the \`String\`. \`x\` is dropped at the closing brace, so \`Extra\` never escapes.
- In \`pick\`, \`let all: [&dyn AnyPlugin; 2] = [&Js, &Py];\` builds a fixed-size array of trait objects; this type compiles because \`AnyPlugin\` has no associated type.
- \`all.into_iter().find(|p| p.handles(file))\` returns the first plugin that handles the file, or \`None\`. \`&Js\` and \`&Py\` borrow constants that live for the whole program, which is what \`&'static dyn AnyPlugin\` asks for.

**Common wrong attempts.**

- Using \`contains\` instead of \`ends_with\` matches an extension anywhere in the name, so \`notes.json\` (which contains \`.js\`) goes to the JavaScript plugin.
- Falling back to JavaScript for every other file is what the TypeScript CLI does, but this \`pick\` must return \`None\` for \`c.rb\`.

The cost of the erased version is one indirect call per method, through the trait object's table of functions (*Traits, trait objects and derive*); for a compiler that makes one such call per file, that is nothing.`,
    wrong: [
      {
        code: `trait Plugin {
    type Extra;
    fn exts(&self)
        -> &'static [&'static str];
    fn lower(&self, s: &str)
        -> Self::Extra;
    fn emit(&self, s: &str,
        x: &Self::Extra) -> String;
}

struct Js;
struct Py;

impl Plugin for Js {
    type Extra = usize;
    fn exts(&self)
        -> &'static [&'static str] {
        &[".js", ".mjs"]
    }
    fn lower(&self, s: &str) -> usize {
        s.lines().count()
    }
    fn emit(&self, _: &str, n: &usize)
        -> String {
        format!("js {n}")
    }
}

impl Plugin for Py {
    type Extra = String;
    fn exts(&self)
        -> &'static [&'static str] {
        &[".py"]
    }
    fn lower(&self, s: &str) -> String {
        s.to_uppercase()
    }
    fn emit(&self, _: &str, u: &String)
        -> String {
        format!("py {u}")
    }
}

// Plugin with Extra hidden. No
// associated type, so &dyn works.
trait AnyPlugin {
    fn handles(&self, file: &str)
        -> bool;
    fn compile(&self, src: &str)
        -> String;
}

impl<P: Plugin> AnyPlugin for P {
    fn handles(&self, file: &str)
        -> bool {
        self.exts()
            .iter()
            .any(|e| file.contains(e))
    }
    fn compile(&self, src: &str)
        -> String {
        let x = self.lower(src);
        self.emit(src, &x)
    }
}

fn pick(file: &str)
    -> Option<&'static dyn AnyPlugin> {
    let all: [&dyn AnyPlugin; 2] =
        [&Js, &Py];
    all.into_iter()
        .find(|p| p.handles(file))
}`,
        why: '`contains` matches an extension anywhere in the name, so `notes.json` (which contains `.js`) is handed to the JavaScript plugin. Extensions belong at the end: `ends_with`.',
      },
      {
        code: `trait Plugin {
    type Extra;
    fn exts(&self)
        -> &'static [&'static str];
    fn lower(&self, s: &str)
        -> Self::Extra;
    fn emit(&self, s: &str,
        x: &Self::Extra) -> String;
}

struct Js;
struct Py;

impl Plugin for Js {
    type Extra = usize;
    fn exts(&self)
        -> &'static [&'static str] {
        &[".js", ".mjs"]
    }
    fn lower(&self, s: &str) -> usize {
        s.lines().count()
    }
    fn emit(&self, _: &str, n: &usize)
        -> String {
        format!("js {n}")
    }
}

impl Plugin for Py {
    type Extra = String;
    fn exts(&self)
        -> &'static [&'static str] {
        &[".py"]
    }
    fn lower(&self, s: &str) -> String {
        s.to_uppercase()
    }
    fn emit(&self, _: &str, u: &String)
        -> String {
        format!("py {u}")
    }
}

// Plugin with Extra hidden. No
// associated type, so &dyn works.
trait AnyPlugin {
    fn handles(&self, file: &str)
        -> bool;
    fn compile(&self, src: &str)
        -> String;
}

impl<P: Plugin> AnyPlugin for P {
    fn handles(&self, file: &str)
        -> bool {
        self.exts()
            .iter()
            .any(|e| file.ends_with(e))
    }
    fn compile(&self, src: &str)
        -> String {
        let x = self.lower(src);
        self.emit(src, &x)
    }
}

fn pick(file: &str)
    -> Option<&'static dyn AnyPlugin> {
    if Py.handles(file) {
        Some(&Py)
    } else {
        Some(&Js)
    }
}`,
        why: 'Falling back to JavaScript for every other file is what the TypeScript CLI does, but this `pick` must return `None` when no plugin handles the file, as for `c.rb`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'In the TypeScript VIR, `block.insts` and `module.values` both hold instruction objects. Why can’t the Rust port copy that design directly?',
    options: [
      {
        t: 'Rust has no way to put structs in a `Vec`',
        why: '`Vec<Inst>` is exactly what `values` is.',
      },
      {
        t: 'It would be too slow',
        why: 'The reason is ownership, not speed.',
      },
      {
        t: 'An `Inst` can have only one owner; two `Vec<Inst>` would hold two separate copies',
        correct: true,
        why: 'So the module owns the instructions, and blocks list their ids.',
      },
      {
        t: 'Blocks are not allowed to contain lists',
        why: 'A Rust block does contain a list, of `ValueId`s.',
      },
    ],
  },
  {
    q: 'The SSA builder removes a trivial phi `%4`. What happens to `values[4]`?',
    options: [
      {
        t: 'It is removed from the `Vec`, and later ids shift down by one',
        why: 'Then every stored id after 4 would point at the wrong instruction.',
      },
      {
        t: 'It stays, marked opaque, and is taken out of its block only',
        correct: true,
        why: 'Ids never move. Walks go through blocks, so the dead slot is skipped.',
      },
      {
        t: 'It is replaced by the next instruction created',
        why: 'The arena only grows; slots are not reused.',
      },
    ],
  },
  {
    q: 'What does the associated type `Extra` replace in the TypeScript plugin design?',
    options: [
      {
        t: 'The `id` string',
        why: '`id` is still there, as `fn id(&self) -> &\'static str`.',
      },
      {
        t: 'The bigger lowered object that `emit` casts back with `as JsLowered`',
        correct: true,
        why: 'The plugin’s private data now has a type of its own, and `emit` takes exactly that type.',
      },
      {
        t: 'The `Plan`',
        why: 'The plan comes from the core and is the same type for every plugin.',
      },
      {
        t: 'The VIR module',
        why: 'Every plugin produces the same `Module` type; that is what the core reads.',
      },
    ],
  },
  {
    q: 'What does rustc say about `let ps: Vec<&dyn LanguagePlugin> = vec![&JsPlugin, &PyPlugin];`?',
    options: [
      {
        t: 'E0191: the value of the associated type `Extra` must be specified',
        correct: true,
        why: 'A trait object type has to name every associated type.',
      },
      {
        t: 'E0038: the trait is not dyn compatible',
        why: 'It is dyn compatible; `&dyn LanguagePlugin<Extra = JsExtra>` compiles.',
      },
      {
        t: 'It compiles',
        why: 'Not without naming `Extra`, and then only one of the two plugins fits.',
      },
      {
        t: 'E0277: `JsPlugin` doesn’t implement `LanguagePlugin`',
        why: 'It does; the problem is the trait-object type.',
      },
    ],
  },
];
